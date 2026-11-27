import { isAxiosError } from "axios";

import type {
  ApiError,
  Credentials,
  RegisterInput,
  Session,
} from "@/types/api";

import { api } from "./api";

export function readApiError(error: unknown) {
  return isAxiosError<ApiError>(error) ? error.response?.data : undefined;
}

export function isSessionFailure(error: unknown) {
  if (!isAxiosError<ApiError>(error) || error.response?.status !== 401)
    return false;
  const code = error.response.data?.code;
  return code === "SESSION_REQUIRED" || code === "SESSION_EXPIRED";
}

export async function fetchSession(signal: AbortSignal) {
  try {
    const { data } = await api.get<Session>("/auth/session", { signal });
    return data;
  } catch (error) {
    if (isSessionFailure(error)) return null;
    throw error;
  }
}

export async function login(input: Credentials) {
  const { data } = await api.post<Session>("/auth/login", input);
  return data;
}

export async function register(input: RegisterInput) {
  const { data } = await api.post<Session>("/auth/register", input);
  return data;
}

export async function logout() {
  await api.post("/auth/logout");
}
