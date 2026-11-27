import {
  queryOptions,
  useIsMutating,
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { privateQueryKey, privateSessionSignal } from "@/lib/session";
import {
  fetchFavorites,
  writeFavorite,
  type AccountScope,
} from "@/services/account";
import type { Favorites } from "@/types/api";

export const favoritesKey = (userId: string) =>
  privateQueryKey(userId, "favorites");
const favoriteMutationKey = (userId: string) =>
  privateQueryKey(userId, "write-favorite");

export function favoritesOptions(scope: AccountScope) {
  return queryOptions({
    queryKey: favoritesKey(scope.userId),
    queryFn: ({ signal }) => fetchFavorites(scope, signal),
    retry: false,
    staleTime: 30_000,
  });
}

export function useFavorites(userId: string) {
  return useQuery(
    favoritesOptions({ userId, lifetime: privateSessionSignal() }),
  );
}

export function favoriteMutationOptions(scope: AccountScope) {
  const queryKey = favoritesKey(scope.userId);
  return {
    mutationKey: favoriteMutationKey(scope.userId),
    mutationFn: ({ nftId, favorite }: { nftId: string; favorite: boolean }) =>
      writeFavorite(scope, nftId, favorite),
    onMutate: async (
      { nftId, favorite }: { nftId: string; favorite: boolean },
      { client }: { client: ReturnType<typeof useQueryClient> },
    ) => {
      await client.cancelQueries({ queryKey, exact: true });
      scope.lifetime.throwIfAborted();
      const previous = client.getQueryData<Favorites>(queryKey);
      if (previous) {
        const nftIds = previous.nftIds.filter((id) => id !== nftId);
        if (favorite) nftIds.push(nftId);
        client.setQueryData<Favorites>(queryKey, { nftIds });
      }
      return { previous };
    },
    onError: (
      _error: Error,
      _input: unknown,
      snapshot: { previous?: Favorites } | undefined,
      { client }: { client: ReturnType<typeof useQueryClient> },
    ) => {
      if (!scope.lifetime.aborted && snapshot?.previous)
        client.setQueryData(queryKey, snapshot.previous);
    },
    onSettled: (
      _data: Favorites | undefined,
      _error: Error | null,
      _input: unknown,
      _snapshot: unknown,
      { client }: { client: ReturnType<typeof useQueryClient> },
    ) => {
      if (!scope.lifetime.aborted)
        return client.invalidateQueries({ queryKey, exact: true });
    },
  };
}

export function useToggleFavorite(userId: string) {
  const client = useQueryClient();
  const key = favoriteMutationKey(userId);
  const pending = useIsMutating({ mutationKey: key }) > 0;
  const mutation = useMutation(
    favoriteMutationOptions({ userId, lifetime: privateSessionSignal() }),
  );

  function toggle(nftId: string) {
    if (client.isMutating({ mutationKey: key })) return;
    const current = client.getQueryData<Favorites>(favoritesKey(userId));
    if (current)
      mutation.mutate({ nftId, favorite: !current.nftIds.includes(nftId) });
  }

  return { pending, toggle, error: mutation.error, reset: mutation.reset };
}

export function useFavoriteWriteError(userId: string) {
  const states = useMutationState({
    filters: { mutationKey: favoriteMutationKey(userId) },
  });
  return states.at(-1)?.error;
}
