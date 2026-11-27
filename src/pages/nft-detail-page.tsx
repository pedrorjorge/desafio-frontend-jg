import { Link } from "@tanstack/react-router";
import { isAxiosError } from "axios";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import { NFTGrid, NFTGridSkeleton } from "@/components/common/nft-grid";
import { useCatalog } from "@/hooks/use-catalog";
import { useNft } from "@/hooks/use-nft";
import type { NftDetail } from "@/types/api";

import { NFTEditionPanel } from "./nft-detail/nft-editions";
import { NFTGallery } from "./nft-detail/nft-gallery";

const detailColumns = "grid min-w-0 gap-6 md:grid-cols-2 lg:gap-10";

function DetailSkeleton({ paused }: { paused: boolean }) {
  return (
    <div role="status">
      <span className="sr-only">
        {paused ? "Aguardando conexão…" : "Carregando detalhes do NFT…"}
      </span>
      <div aria-hidden="true" className={detailColumns}>
        <div className="grid content-start gap-3 lg:grid-cols-[4.5rem_minmax(0,1fr)]">
          <LoadingSkeleton
            announce={false}
            className="aspect-square h-auto rounded-panel lg:col-start-2 lg:row-start-1"
          />
          <div className="flex gap-2 lg:col-start-1 lg:row-start-1 lg:flex-col">
            <LoadingSkeleton
              announce={false}
              className="size-16 lg:size-[4.5rem]"
            />
            <LoadingSkeleton
              announce={false}
              className="size-16 lg:size-[4.5rem]"
            />
          </div>
        </div>
        <div className="grid min-w-0 content-start gap-5 rounded-panel border border-border bg-card p-5 sm:p-6">
          <LoadingSkeleton announce={false} className="h-5 w-1/3" />
          <LoadingSkeleton announce={false} className="h-11 w-3/4" />
          <LoadingSkeleton announce={false} className="h-12" />
          <LoadingSkeleton announce={false} className="h-32 rounded-panel" />
        </div>
      </div>
    </div>
  );
}

function RelatedNFTs({ nft }: { nft: NftDetail }) {
  const query = useCatalog({ category: [nft.category], pageSize: 5 });
  const items = query.data?.items.filter(({ id }) => id !== nft.id).slice(0, 4);

  return (
    <section aria-labelledby="related-nfts-title" className="mt-section">
      <h2
        id="related-nfts-title"
        className="mb-5 font-display text-2xl font-bold"
      >
        NFTs relacionados
      </h2>
      {query.isPending ? (
        <NFTGridSkeleton count={4} className="lg:grid-cols-4" />
      ) : query.isError && !query.data ? (
        <ErrorState
          heading="h3"
          title="Não foi possível carregar os NFTs relacionados"
          onRetry={() => void query.refetch()}
        />
      ) : items?.length ? (
        <NFTGrid items={items} className="lg:grid-cols-4" />
      ) : (
        <p className="text-muted-foreground">
          Nenhum outro NFT desta categoria no catálogo.
        </p>
      )}
    </section>
  );
}

export function NftDetailPage({ nftId }: { nftId: string }) {
  const query = useNft(nftId);
  const nft = query.data;
  const missing =
    isAxiosError(query.error) && query.error.response?.status === 404;

  return (
    <>
      <Link
        to="/"
        hash="catalogo"
        className="mb-5 inline-block text-sm text-muted-foreground hover:text-primary"
      >
        <span aria-hidden="true">← </span>Voltar ao catálogo
      </Link>
      {query.isPending ? (
        <DetailSkeleton paused={query.isPaused} />
      ) : missing ? (
        <EmptyState
          title="NFT não encontrado"
          description="O NFT solicitado não está no catálogo."
        />
      ) : !nft ? (
        <ErrorState
          title="Não foi possível carregar o NFT"
          description="Tente consultar os detalhes novamente."
          onRetry={() => void query.refetch()}
        />
      ) : (
        <>
          {query.isFetching && (
            <p role="status" className="mb-3 text-sm text-muted-foreground">
              Atualizando detalhes…
            </p>
          )}
          {query.isRefetchError && (
            <div className="mb-5">
              <ErrorState
                heading="h2"
                title="Não foi possível atualizar os detalhes"
                onRetry={() => void query.refetch()}
              />
            </div>
          )}
          <div className={detailColumns}>
            <NFTGallery images={nft.gallery} />
            <section
              aria-labelledby="nft-title"
              className="min-w-0 rounded-panel border border-border bg-card p-5 sm:p-6"
            >
              <Link
                to="/"
                hash="catalogo"
                search={{ category: [nft.category] }}
                className="text-sm font-semibold text-primary hover:underline"
              >
                {nft.collection.name}
              </Link>
              <h1
                id="nft-title"
                className="mt-2 font-display text-3xl font-bold wrap-break-word lg:text-4xl"
              >
                {nft.name}
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {nft.description}
              </p>
              <NFTEditionPanel
                editions={nft.editions}
                nftId={nft.id}
                name={nft.name}
              />
            </section>
          </div>
          <section
            aria-labelledby="collection-title"
            className="mt-section border-t border-border pt-6"
          >
            <h2
              id="collection-title"
              className="font-display text-2xl font-bold"
            >
              Sobre a coleção
            </h2>
            <p className="mt-3 font-semibold">{nft.collection.name}</p>
            <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground">
              {nft.collection.description}
            </p>
          </section>
          <RelatedNFTs nft={nft} />
        </>
      )}
    </>
  );
}
