import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  privateQueryKey,
  privateSessionSignal,
  sessionKey,
} from "@/lib/session";
import {
  changePassword,
  fetchProfile,
  fetchWallets,
  saveWallet,
  updateProfile,
  type AccountScope,
} from "@/services/account";
import type {
  PasswordInput,
  ProfileInput,
  Session,
  WalletInput,
} from "@/types/api";

const profileKey = (userId: string) => privateQueryKey(userId, "profile");
const walletsKey = (userId: string) => privateQueryKey(userId, "wallets");

export function profileOptions(scope: AccountScope) {
  return queryOptions({
    queryKey: profileKey(scope.userId),
    queryFn: ({ signal }) => fetchProfile(scope, signal),
    retry: false,
  });
}

export function walletsOptions(scope: AccountScope) {
  return queryOptions({
    queryKey: walletsKey(scope.userId),
    queryFn: ({ signal }) => fetchWallets(scope, signal),
    retry: false,
  });
}

export function useProfile(userId: string) {
  return useQuery(profileOptions({ userId, lifetime: privateSessionSignal() }));
}

export function useWallets(userId: string) {
  return useQuery(walletsOptions({ userId, lifetime: privateSessionSignal() }));
}

export function useUpdateProfile(userId: string) {
  const client = useQueryClient();
  const scope = { userId, lifetime: privateSessionSignal() };

  return useMutation({
    mutationKey: privateQueryKey(userId, "update-profile"),
    mutationFn: (input: ProfileInput) => updateProfile(scope, input),
    onSuccess: async (profile) => {
      await client.cancelQueries({ queryKey: profileKey(userId), exact: true });
      if (scope.lifetime.aborted || profile.id !== userId) return;
      client.setQueryData(profileKey(userId), profile);
      const updatedAt = client.getQueryState(sessionKey)?.dataUpdatedAt;
      client.setQueryData<Session | null>(
        sessionKey,
        (session) =>
          session?.user.id === userId
            ? {
                ...session,
                user: {
                  id: profile.id,
                  name: profile.name,
                  email: profile.email,
                },
              }
            : session,
        { updatedAt },
      );
    },
  });
}

export function useChangePassword(userId: string) {
  const scope = { userId, lifetime: privateSessionSignal() };
  return useMutation({
    mutationKey: privateQueryKey(userId, "change-password"),
    gcTime: 0,
    mutationFn: (input: PasswordInput) => changePassword(scope, input),
  });
}

export function useSaveWallet(userId: string, walletId?: string) {
  const client = useQueryClient();
  const scope = { userId, lifetime: privateSessionSignal() };

  return useMutation({
    mutationKey: privateQueryKey(userId, "save-wallet"),
    mutationFn: (input: WalletInput) => saveWallet(scope, input, walletId),
    onSuccess: () => {
      if (!scope.lifetime.aborted)
        return client.invalidateQueries({
          queryKey: walletsKey(userId),
          exact: true,
        });
    },
  });
}
