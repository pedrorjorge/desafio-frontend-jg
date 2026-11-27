import { useMutation, useQuery } from "@tanstack/react-query";

import { replaceSession, sessionQuery } from "@/lib/session";
import { login, logout, register } from "@/services/auth";
import type { Credentials, RegisterInput } from "@/types/api";

export function useSession() {
  return useQuery({ ...sessionQuery, refetchInterval: false });
}

export function useAuthenticate() {
  return useMutation({
    scope: { id: "auth" },
    // Avoid retaining submitted credentials in the mutation cache.
    gcTime: 0,
    mutationFn: (input: Credentials | RegisterInput) =>
      "name" in input ? register(input) : login(input),
    onSuccess: replaceSession,
  });
}

export function useLogout() {
  return useMutation({
    scope: { id: "auth" },
    mutationFn: logout,
    onSuccess: () => replaceSession(null),
  });
}
