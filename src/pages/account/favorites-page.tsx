import { useQueries } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import Decimal from "decimal.js";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { NFTCard } from "@/components/common/nft-card";
import { NFTGridSkeleton } from "@/components/common/nft-grid";
import { useFavorites, useFavoriteWriteError } from "@/hooks/use-favorites";
import { nftQueryOptions } from "@/hooks/use-nft";
import { readApiError } from "@/services/auth";

import { AccountLayout } from "./account-sidebar";

export function FavoritesPage({ userId }: { userId: string }) {
  const favorites = useFavorites(userId);
  const mutationError = useFavoriteWriteError(userId);
  const details = useQueries({
    queries: (favorites.data?.nftIds ?? []).map(nftQueryOptions),
  });
  const failed = details.filter((detail) => detail.isError && !detail.data);

  return (
    <AccountLayout>
      <h1 className="mb-5 font-display text-3xl font-bold">Favoritos</h1>
      {mutationError && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {readApiError(mutationError)?.message ??
            "Não foi possível atualizar favoritos."}
        </p>
      )}
      {favorites.isPending ? (
        <NFTGridSkeleton count={4} />
      ) : !favorites.data ? (
        <ErrorState
          heading="h2"
          title="Não foi possível consultar os favoritos"
          onRetry={() => void favorites.refetch()}
        />
      ) : !favorites.data.nftIds.length ? (
        <EmptyState heading="h2" title="Você ainda não tem favoritos">
          <Link to="/" hash="catalogo" className="w-fit text-primary underline">
            Explorar o catálogo
          </Link>
        </EmptyState>
      ) : (
        <>
          {failed.length > 0 && (
            <ErrorState
              heading="h2"
              title="Não foi possível consultar alguns NFTs"
              onRetry={() =>
                void Promise.all(failed.map((detail) => detail.refetch()))
              }
            />
          )}
          {details.some((detail) => detail.isPending) && (
            <NFTGridSkeleton count={Math.min(4, details.length)} />
          )}
          <div className="grid grid-cols-1 gap-3 min-[22rem]:grid-cols-2 md:grid-cols-3">
            {details.map(({ data }) =>
              data?.editions.length ? (
                <NFTCard
                  key={data.id}
                  nftId={data.id}
                  name={data.name}
                  image={data.image}
                  price={Decimal.min(
                    ...data.editions.map(({ price }) => price),
                  ).toFixed()}
                  showFavoriteError={false}
                />
              ) : null,
            )}
          </div>
        </>
      )}
    </AccountLayout>
  );
}
