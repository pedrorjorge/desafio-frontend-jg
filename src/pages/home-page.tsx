import { useCatalog } from "@/hooks/use-catalog";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import type { CatalogSearch } from "@/routes/catalog-search";
import { catalogSorts } from "@/types/api";

import { CatalogFilters } from "./home/catalog-filters";
import { sortLabels } from "./home/catalog-labels";
import { HeroBanner } from "./home/hero-banner";
import { NFTGrid, NFTGridSkeleton } from "@/components/common/nft-grid";
import { Pagination } from "./home/pagination";
import { SearchInput } from "./home/search-input";

const featuredParams = { featured: true, page: 1, pageSize: 4 };

type HomePageProps = {
  search: CatalogSearch;
  onSearchChange: (search: CatalogSearch) => void;
};

export function HomePage({ search, onSearchChange }: HomePageProps) {
  const catalog = useCatalog(search);
  const featured = useCatalog(featuredParams);
  const {
    q,
    category,
    minPrice,
    maxPrice,
    available,
    featured: featuredOnly,
    sort,
    page = 1,
  } = search;
  const filters = {
    category,
    minPrice,
    maxPrice,
    available,
    featured: featuredOnly,
  };
  const result = catalog.data;
  const resultLabel = result
    ? `${result.total} ${result.total === 1 ? "NFT encontrado" : "NFTs encontrados"}`
    : "";

  function browse(next: CatalogSearch) {
    onSearchChange(next);
    document.getElementById("catalogo")?.scrollIntoView({ block: "start" });
  }

  return (
    <>
      <HeroBanner
        spotlight={featured.data?.items[0]}
        loading={featured.isPending}
      />

      <section
        id="catalogo"
        tabIndex={-1}
        aria-labelledby="catalog-title"
        className="mt-section scroll-mt-4"
      >
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <h2
            id="catalog-title"
            tabIndex={-1}
            className="font-display text-3xl font-bold"
          >
            Catálogo de NFTs
          </h2>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Ordenar por
            <select
              value={sort ?? "featured"}
              onChange={(event) => {
                const value = catalogSorts.find(
                  (item) => item === event.currentTarget.value,
                );
                if (value)
                  onSearchChange({
                    ...search,
                    sort: value === "featured" ? undefined : value,
                    page: undefined,
                  });
              }}
            >
              {catalogSorts.map((value) => (
                <option key={value} value={value}>
                  {sortLabels[value]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-6">
          <CatalogFilters
            value={filters}
            onApply={(next) => onSearchChange({ q, sort, ...next })}
          />
          <div className="min-w-0">
            <SearchInput
              value={q ?? ""}
              onSearch={(value) =>
                onSearchChange({
                  ...search,
                  q: value || undefined,
                  page: undefined,
                })
              }
            />
            <p
              role="status"
              className="mt-3 mb-4 min-h-5 text-sm text-muted-foreground"
            >
              {catalog.isPaused
                ? "Aguardando conexão…"
                : catalog.isFetching && result
                  ? "Atualizando catálogo…"
                  : resultLabel}
            </p>
            {catalog.isPending ? (
              <NFTGridSkeleton />
            ) : catalog.isError && !result ? (
              <ErrorState
                heading="h3"
                title="Não foi possível carregar o catálogo"
                description="Tente carregar os NFTs novamente."
                onRetry={() => void catalog.refetch()}
              />
            ) : (
              result && (
                <>
                  {catalog.isRefetchError && (
                    <div className="mb-4">
                      <ErrorState
                        heading="h3"
                        title="Não foi possível atualizar o catálogo"
                        onRetry={() => void catalog.refetch()}
                      />
                    </div>
                  )}
                  {result.items.length ? (
                    <NFTGrid items={result.items} />
                  ) : (
                    <EmptyState
                      heading="h3"
                      title={
                        result.total
                          ? "Esta página está vazia"
                          : "Nenhum NFT encontrado"
                      }
                      description={
                        result.total
                          ? "Volte à primeira página para ver os resultados."
                          : "Altere a busca ou ajuste os filtros."
                      }
                    >
                      <Button
                        className="self-start"
                        variant="outline"
                        onClick={() =>
                          onSearchChange(
                            result.total
                              ? { ...search, page: undefined }
                              : { sort },
                          )
                        }
                      >
                        {result.total
                          ? "Ir para a primeira página"
                          : "Limpar busca e filtros"}
                      </Button>
                    </EmptyState>
                  )}
                  <Pagination
                    page={page}
                    totalPages={result.totalPages}
                    onPageChange={(next) =>
                      browse({ ...search, page: next === 1 ? undefined : next })
                    }
                  />
                </>
              )
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="promo-title" className="mt-section">
        <h2 id="promo-title" className="sr-only">
          Explore a coleção
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="relative isolate overflow-hidden rounded-panel border border-border bg-surface p-6 sm:p-8">
            {featured.data?.items[1] && (
              <img
                src={featured.data.items[1].image.src}
                alt=""
                width={1254}
                height={1254}
                loading="lazy"
                decoding="async"
                className="absolute inset-y-0 right-0 -z-20 h-full w-1/2 object-cover"
              />
            )}
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-linear-to-r from-surface from-50% to-surface/75"
            />
            <div className="max-w-[16rem]">
              <h3 className="font-display text-xl font-bold">
                Coleção em destaque
              </h3>
              <p className="mt-2 text-sm text-foreground">
                Veja a seleção de colecionáveis em destaque no KURIO.
              </p>
              <Button
                className="mt-4"
                onClick={() => browse({ featured: true })}
              >
                Ver destaques
              </Button>
            </div>
          </article>
          <article className="relative isolate overflow-hidden rounded-panel border border-border bg-card p-6 sm:p-8">
            {featured.data?.items[2] && (
              <img
                src={featured.data.items[2].image.src}
                alt=""
                width={1254}
                height={1254}
                loading="lazy"
                decoding="async"
                className="absolute inset-y-0 right-0 -z-20 h-full w-1/2 object-cover"
              />
            )}
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-linear-to-r from-card from-50% to-card/75"
            />
            <div className="max-w-[16rem]">
              <h3 className="font-display text-xl font-bold">
                Edições disponíveis
              </h3>
              <p className="mt-2 text-sm text-foreground">
                Explore as obras que ainda têm edições no catálogo.
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => browse({ available: true })}
              >
                Ver disponíveis
              </Button>
            </div>
          </article>
        </div>
      </section>

      {featured.isPending || !!featured.data?.items.length ? (
        <section aria-labelledby="featured-title" className="mt-section">
          <h2
            id="featured-title"
            className="mb-5 font-display text-3xl font-bold"
          >
            NFTs em destaque
          </h2>
          {featured.data ? (
            <NFTGrid items={featured.data.items} className="lg:grid-cols-4" />
          ) : (
            <NFTGridSkeleton count={4} className="lg:grid-cols-4" />
          )}
        </section>
      ) : null}
    </>
  );
}
