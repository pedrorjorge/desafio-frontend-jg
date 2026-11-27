import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:4174";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 45_000,
  reporter: [["list"], ["html", { open: "never" }]],
  updateSnapshots: "none",
  snapshotPathTemplate: "{testDir}/visual/baselines/{projectName}/{arg}{ext}",
  use: {
    baseURL,
    locale: "pt-BR",
    timezoneId: "UTC",
    contextOptions: { reducedMotion: "reduce" },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command:
      "npm run build:demo && npm run preview -- --host 127.0.0.1 --port 4174 --strictPort",
    url: baseURL,
    env: { VITE_ENABLE_MOCKS: "true", VITE_API_BASE_URL: "/api" },
    timeout: 120_000,
    stdout: "pipe",
    reuseExistingServer: false,
  },
});
