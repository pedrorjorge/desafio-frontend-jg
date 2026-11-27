import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
  availableParallelism,
  cpus,
  platform,
  release,
  totalmem,
} from "node:os";
import { join } from "node:path";
import process from "node:process";

const targets = {
  performance: 90,
  accessibility: 95,
  "best-practices": 95,
  seo: 90,
};
const metricIds = {
  lcpMs: "largest-contentful-paint",
  cls: "cumulative-layout-shift",
  tbtMs: "total-blocking-time",
};
const pages = [
  { name: "home", path: "/", apiPath: "/api/nfts" },
  { name: "nft-detail", path: "/nfts/exemplo", apiPath: "/api/nfts/exemplo" },
];
const profiles = ["mobile", "desktop"];
const runs = 3;
const origin = "http://127.0.0.1:4175";
const env = {
  ...process.env,
  VITE_ENABLE_MOCKS: "true",
  VITE_API_BASE_URL: "/api",
};

function npm(args, options = {}) {
  return execFileSync(process.execPath, [process.env.npm_execpath, ...args], {
    env,
    encoding: "utf8",
    ...options,
  });
}

function runLighthouse(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        process.env.npm_execpath,
        "exec",
        "--offline",
        "--",
        "lighthouse",
        ...args,
      ],
      { env, stdio: "inherit" },
    );
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`Lighthouse encerrou com ${signal ?? code}.`));
    });
  });
}

function summarize(reports, readValues) {
  const values = reports.map(readValues);
  return Object.fromEntries(
    Object.keys(values[0]).map((key) => {
      const sorted = values.map((entry) => entry[key]).sort((a, b) => a - b);
      return [key, sorted[Math.floor(sorted.length / 2)]];
    }),
  );
}

function verifyReport(report, page, url) {
  const requests = report.audits?.["network-requests"]?.details?.items ?? [];
  const hasApiResponse = requests.some(
    (request) =>
      request.statusCode === 200 &&
      request.url?.split("?")[0] === origin + page.apiPath,
  );
  const hasArtwork = requests.some(
    (request) =>
      request.statusCode === 200 &&
      /\/assets\/amber-fox-[^/]+\.webp$/.test(request.url),
  );
  const scores = Object.keys(targets).map(
    (id) => report.categories?.[id]?.score,
  );
  const metrics = Object.values(metricIds).map(
    (id) => report.audits?.[id]?.numericValue,
  );
  if (
    report.runtimeError ||
    report.finalDisplayedUrl !== url ||
    !hasApiResponse ||
    !hasArtwork ||
    ![...scores, ...metrics].every(Number.isFinite)
  ) {
    throw new Error(
      `Auditoria inválida para ${url}. Confira o relatório bruto e o carregamento dos mocks e da obra.`,
    );
  }
}

async function main() {
  npm(["run", "build:demo"], { stdio: "inherit" });

  const { preview, version: viteVersion } = await import("vite");
  const server = await preview({
    mode: "demo",
    preview: { host: "127.0.0.1", port: 4175, strictPort: true },
  });
  try {
    const startedAt = new Date().toISOString();
    const directory = join(
      "lighthouse-reports",
      startedAt.replaceAll(":", "-"),
    );
    mkdirSync(directory, { recursive: true });
    const summary = {
      startedAt,
      environment: {
        node: process.version,
        npm: npm(["--version"]).trim(),
        vite: viteVersion,
        platform: platform(),
        osRelease: release(),
        architecture: process.arch,
        cpu: cpus()[0]?.model,
        availableCpus: availableParallelism(),
        totalMemoryBytes: totalmem(),
        chromePathOverride: env.CHROME_PATH ?? null,
      },
      conditions: {
        origin,
        build: "demo",
        mocks: "default",
        browser: "headless",
        storage: "fresh Chrome profile per run",
        throttling: "Lighthouse built-in simulated profiles",
        execution: "serial",
        runsPerCombination: runs,
      },
      targets,
      combinations: [],
    };
    for (const page of pages) {
      for (const profile of profiles) {
        const reports = [];
        const reportFiles = [];
        const url = origin + page.path;
        for (let run = 1; run <= runs; run++) {
          const name = `${page.name}-${profile}-${run}`;
          const output = join(directory, name);
          console.log(`Lighthouse: ${name}`);
          await runLighthouse([
            url,
            "--chrome-flags=--headless",
            "--throttling-method=simulate",
            "--output=html",
            "--output=json",
            `--output-path=${output}`,
            `--only-categories=${Object.keys(targets).join(",")}`,
            ...(profile === "desktop" ? ["--preset=desktop"] : []),
          ]);
          const report = JSON.parse(
            readFileSync(`${output}.report.json`, "utf8"),
          );
          verifyReport(report, page, url);
          reports.push(report);
          reportFiles.push({
            html: `${name}.report.html`,
            json: `${name}.report.json`,
          });
        }
        const medians = summarize(reports, (report) =>
          Object.fromEntries(
            Object.keys(targets).map((id) => [
              id,
              report.categories[id].score * 100,
            ]),
          ),
        );
        const { lighthouseVersion, userAgent, environment, configSettings } =
          reports[0];
        summary.combinations.push({
          page: page.name,
          profile,
          lighthouseVersion,
          userAgent,
          browserEnvironment: environment,
          settings: configSettings,
          reports: reportFiles,
          medians,
          medianMetrics: summarize(reports, (report) =>
            Object.fromEntries(
              Object.entries(metricIds).map(([key, id]) => [
                key,
                report.audits[id].numericValue,
              ]),
            ),
          ),
          belowTarget: Object.keys(targets).filter(
            (id) => medians[id] < targets[id],
          ),
        });
      }
    }
    const summaryPath = join(directory, "summary.json");
    writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + "\n");
    console.table(
      summary.combinations.map(({ page, profile, medians, medianMetrics }) => ({
        page,
        profile,
        ...medians,
        ...medianMetrics,
      })),
    );
    console.log(summaryPath);
  } finally {
    await server.close();
  }
}

await main();
