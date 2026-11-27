import { queryOptions } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { api } from "@/services/api";
import { fetchSession, isSessionFailure } from "@/services/auth";
import type { Session } from "@/types/api";

import { queryClient } from "./query-client";

export const sessionKey = ["auth", "session"] as const;
const privateKey = ["private"] as const;
let subscriptions = new AbortController();

export function privateSessionSignal() {
  return subscriptions.signal;
}

export function privateQueryKey(userId: string, ...parts: readonly unknown[]) {
  return [...privateKey, userId, ...parts] as const;
}

function retirePrivateData() {
  subscriptions.abort();
  subscriptions = new AbortController();
  void queryClient.cancelQueries({ queryKey: privateKey });
  queryClient.removeQueries({ queryKey: privateKey });
  const mutations = queryClient.getMutationCache();
  for (const mutation of mutations.findAll({ mutationKey: privateKey }))
    mutations.remove(mutation);
}

function reconcileIdentity(session: Session | null) {
  const previous = queryClient.getQueryData<Session | null>(sessionKey);
  if (previous?.id !== session?.id || previous?.user.id !== session?.user.id)
    retirePrivateData();
}

async function writeSession(
  session: Session | null,
  expectedSignal?: AbortSignal,
) {
  await queryClient.cancelQueries({ queryKey: sessionKey });
  if (expectedSignal && expectedSignal !== privateSessionSignal()) return;

  retirePrivateData();
  queryClient.setQueryData(sessionKey, session);
}

export function replaceSession(session: Session | null) {
  return writeSession(session);
}

export const sessionQuery = queryOptions({
  queryKey: sessionKey,
  queryFn: async ({ signal }) => {
    const session = await fetchSession(signal);
    signal.throwIfAborted();
    reconcileIdentity(session);
    return session;
  },
  retry: false,
  staleTime: 0,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchInterval: (query) => {
    const session = query.state.data;
    if (!session) return false;
    const remaining =
      query.state.dataUpdatedAt + session.expiresInMs - Date.now();
    return Math.max(1000, Math.min(remaining, 30_000));
  },
});

export function isExpired(session: Session, updatedAt: number) {
  return updatedAt + session.expiresInMs <= Date.now();
}

export function observeSessionFailures() {
  const requests = new WeakMap<object, AbortSignal>();
  api.interceptors.request.use(
    (config) => {
      requests.set(config, privateSessionSignal());
      return config;
    },
    undefined,
    { synchronous: true },
  );

  api.interceptors.response.use(undefined, (error: unknown) => {
    if (
      isAxiosError(error) &&
      error.config &&
      error.config.url !== "/auth/session" &&
      requests.get(error.config) === privateSessionSignal() &&
      isSessionFailure(error) &&
      queryClient.getQueryData<Session | null>(sessionKey)
    ) {
      void writeSession(null, requests.get(error.config));
    }
    return Promise.reject(error);
  });
}
