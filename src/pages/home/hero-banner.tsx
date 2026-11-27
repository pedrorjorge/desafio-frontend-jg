import { Link } from "@tanstack/react-router";

import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import type { CatalogItem } from "@/types/api";

export function HeroBanner({
  spotlight,
  loading,
}: {
  spotlight?: CatalogItem;
  loading: boolean;
}) {
  return (
    <section
      aria-labelledby="home-title"
      className="grid grid-cols-1 items-center min-[22rem]:grid-cols-[1.35fr_minmax(0,0.65fr)] gap-4 rounded-panel border border-border bg-card p-5 sm:p-7 md:grid-cols-[1.2fr_minmax(0,0.8fr)] md:gap-8 lg:min-h-[22rem] lg:p-8"
    >
      <div className={spotlight || loading ? undefined : "col-span-full"}>
        <h1
          id="home-title"
          className="font-display text-xl leading-tight font-bold uppercase sm:text-4xl lg:max-w-2xl lg:text-5xl"
        >
          Seja dono do futuro da arte digital
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          Descubra colecionáveis digitais e encontre a próxima obra da sua
          coleção.
        </p>
        <a
          href="#catalogo"
          className="mt-5 inline-flex min-h-control items-center rounded-control bg-primary px-3 text-xs sm:px-5 sm:text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          Explorar catálogo
        </a>
      </div>
      {spotlight ? (
        <Link
          to="/nfts/$nftId"
          params={{ nftId: spotlight.id }}
          aria-label={`Ver ${spotlight.name}`}
          className="block overflow-hidden rounded-panel focus-visible:outline-ring"
        >
          <img
            src={spotlight.image.src}
            alt={spotlight.image.alt}
            width={1254}
            height={1254}
            fetchPriority="high"
            className="aspect-[5/4] w-full object-cover md:aspect-square"
          />
        </Link>
      ) : loading ? (
        <LoadingSkeleton
          label="Carregando destaque…"
          className="aspect-[5/4] h-auto rounded-panel md:aspect-square"
        />
      ) : null}
    </section>
  );
}
