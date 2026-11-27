import { delay, HttpResponse } from "msw";

import { setRealtimeOnline } from "../realtime";
import { resetDatabase, transaction } from "../database";

export const scenarios = [
  "default",
  "slow",
  "out-of-order",
  "timeout",
  "http-400",
  "http-500",
  "offline",
  "expired-session",
  "conflict",
  "empty",
  "order-timeout",
  "order-declined",
  "wallet-declined",
  "favorite-error",
] as const;

export type Scenario = (typeof scenarios)[number];

const storageKey = "kurio.mocks.scenario.v1";
let scenario: Scenario = "default";
let catalogRequests = 0;
let generation = 0;

export function initializeScenario() {
  try {
    const saved = sessionStorage.getItem(storageKey);
    const match = scenarios.find((value) => value === saved);
    if (match) scenario = match;
  } catch {
    // Retain the default scenario without browser storage.
  }
}

export function currentScenario() {
  return scenario;
}

export function scenarioGeneration() {
  return generation;
}

export async function selectScenario(name: Scenario) {
  if (!scenarios.includes(name))
    throw new Error("Cenário de mock desconhecido.");
  scenario = name;
  catalogRequests = 0;
  generation += 1;

  try {
    sessionStorage.setItem(storageKey, name);
  } catch {
    // The choice remains active for this page.
  }

  setRealtimeOnline(true);
  await resetDatabase();
}

export function advanceClock(ms: number) {
  if (!Number.isSafeInteger(ms) || ms < 0 || ms > 31_536_000_000) {
    throw new Error(
      "Informe um avanço inteiro entre zero e um ano em milissegundos.",
    );
  }
  return transaction((db) => {
    db.offsetMs += ms;
  });
}

export async function networkCondition(resource: string) {
  switch (scenario) {
    case "slow":
      await delay(1500);
      break;
    case "out-of-order":
      if (resource === "catalog") {
        catalogRequests += 1;
        await delay(catalogRequests % 2 === 1 ? 900 : 50);
      }
      break;
    case "timeout":
      await delay(11_000);
      return HttpResponse.error();
    case "offline":
      return HttpResponse.error();
    case "http-400":
      return HttpResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: "Requisição inválida (simulação).",
        },
        { status: 400 },
      );
    case "http-500":
      return HttpResponse.json(
        { code: "UNAVAILABLE", message: "Falha transitória (simulação)." },
        { status: 500 },
      );
    case "favorite-error":
      if (resource === "favorite-write") {
        await delay(600);
        return HttpResponse.json(
          {
            code: "UNAVAILABLE",
            message: "Falha ao atualizar favoritos (simulação).",
          },
          { status: 500 },
        );
      }
      break;
    case "conflict":
      if (resource === "register") {
        return HttpResponse.json(
          {
            code: "CONFLICT",
            message: "E-mail já cadastrado.",
            fields: { email: "E-mail já cadastrado." },
          },
          { status: 409 },
        );
      }
      break;
  }
}
