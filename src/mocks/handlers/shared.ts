import { HttpResponse } from "msw";
import { z } from "zod";

import { apiBaseUrl } from "@/lib/env";
import type { ApiError, ApiErrorCode, User } from "@/types/api";

import { getVisitorId, now, type Database } from "../database";
import {
  currentScenario,
  networkCondition,
  scenarioGeneration,
} from "../scenarios";

export function endpoint(path: string) {
  return new URL(
    `${apiBaseUrl.replace(/\/+$/, "")}${path}`,
    window.location.origin,
  ).href;
}

export class RequestError extends Error {
  constructor(
    public status: number,
    public body: ApiError,
  ) {
    super(body.message);
  }
}

export function reject(
  status: number,
  code: ApiErrorCode,
  message: string,
  fields?: ApiError["fields"],
): never {
  throw new RequestError(status, { code, message, fields });
}

export async function respond(
  request: Request,
  resource: string,
  action: () => Response | Promise<Response>,
) {
  const generation = scenarioGeneration();
  const failure = await networkCondition(resource);
  if (failure) return failure;
  if (request.signal.aborted || generation !== scenarioGeneration())
    return HttpResponse.error();

  try {
    return await action();
  } catch (error) {
    if (error instanceof RequestError)
      return HttpResponse.json(error.body, { status: error.status });
    throw error;
  }
}

export function parse<T>(schema: z.ZodType<T>, payload: unknown): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const fields = Object.fromEntries(
      result.error.issues.map(({ path, message }) => [
        path.join(".") || "body",
        message,
      ]),
    );
    reject(422, "VALIDATION_ERROR", "Revise os dados enviados.", fields);
  }
  return result.data;
}

export async function body<T>(schema: z.ZodType<T>, request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    reject(400, "VALIDATION_ERROR", "Envie um corpo JSON válido.");
  }
  return parse(schema, payload);
}

export const name = z
  .string()
  .trim()
  .min(2, "Informe ao menos dois caracteres.")
  .max(100);
export const email = z
  .email("Informe um e-mail válido.")
  .max(254)
  .transform((value) => value.toLowerCase());
export const password = z
  .string()
  .min(8, "Informe ao menos oito caracteres.")
  .max(128);
export const id = z.string().min(1).max(120);
export const eth = z
  .string()
  .regex(/^\d{1,18}(\.\d{1,18})?$/, "Informe um valor ETH decimal.");
export const quantity = z.int().positive().max(1000);

export function publicUser({ id, name, email }: User): User {
  return { id, name, email };
}

export function sessionRecord(db: Database) {
  const record = db.sessions[getVisitorId()];
  return record &&
    record.expiresAt > now(db) &&
    currentScenario() !== "expired-session"
    ? record
    : undefined;
}

export function requireSessionRecord(db: Database) {
  const session = sessionRecord(db);
  if (session) return session;

  if (db.sessions[getVisitorId()]) {
    reject(401, "SESSION_EXPIRED", "Sua sessão expirou. Entre novamente.");
  }
  return reject(401, "SESSION_REQUIRED", "Entre para continuar.");
}

export function account(db: Database, request?: Request) {
  const session = requireSessionRecord(db);
  const expectedId = request?.headers.get("X-Kurio-Account");
  if (expectedId && expectedId !== session.userId) {
    reject(403, "FORBIDDEN", "A conta ativa mudou durante a operação.");
  }
  const user = db.users.find(({ profile }) => profile.id === session.userId);
  if (!user) reject(401, "SESSION_REQUIRED", "Entre para continuar.");
  return user;
}

export function empty() {
  return new HttpResponse(null, { status: 204 });
}

export async function passwordVerifier(secret: string, salt: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: encoder.encode(salt),
      iterations: 120_000,
    },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
}
