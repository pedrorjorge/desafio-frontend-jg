import type {
  Favorites,
  PasswordInput,
  Profile,
  ProfileInput,
  Wallet,
  WalletInput,
} from "@/types/api";

import { api } from "./api";

export type AccountScope = { userId: string; lifetime: AbortSignal };

export function requestFor(scope: AccountScope, signal?: AbortSignal) {
  scope.lifetime.throwIfAborted();
  return {
    headers: { "X-Kurio-Account": scope.userId },
    signal: signal ? AbortSignal.any([scope.lifetime, signal]) : scope.lifetime,
  };
}

export async function fetchProfile(scope: AccountScope, signal: AbortSignal) {
  return (await api.get<Profile>("/profile", requestFor(scope, signal))).data;
}

export async function updateProfile(scope: AccountScope, input: ProfileInput) {
  return (await api.patch<Profile>("/profile", input, requestFor(scope))).data;
}

export async function changePassword(
  scope: AccountScope,
  input: PasswordInput,
) {
  await api.put("/profile/password", input, requestFor(scope));
}

export async function fetchWallets(scope: AccountScope, signal: AbortSignal) {
  return (await api.get<Wallet[]>("/wallets", requestFor(scope, signal))).data;
}

export async function saveWallet(
  scope: AccountScope,
  input: WalletInput,
  id?: string,
) {
  const config = requestFor(scope);
  const response = id
    ? await api.patch<Wallet>(
        `/wallets/${encodeURIComponent(id)}`,
        input,
        config,
      )
    : await api.post<Wallet>("/wallets", input, config);
  return response.data;
}

export async function fetchFavorites(scope: AccountScope, signal: AbortSignal) {
  return (await api.get<Favorites>("/favorites", requestFor(scope, signal)))
    .data;
}

export async function writeFavorite(
  scope: AccountScope,
  nftId: string,
  favorite: boolean,
) {
  const path = `/favorites/${encodeURIComponent(nftId)}`;
  const config = requestFor(scope);
  const response = favorite
    ? await api.put<Favorites>(path, undefined, config)
    : await api.delete<Favorites>(path, config);
  return response.data;
}
