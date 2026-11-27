import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import { NFTCard } from "@/components/common/nft-card";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CatalogItem } from "@/types/api";

export function NFTGrid({
  items,
  className,
}: {
  items: CatalogItem[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 min-[22rem]:grid-cols-2 sm:gap-4 lg:grid-cols-3",
        className,
      )}
    >
      {items.map((nft) => (
        <NFTCard
          key={nft.id}
          nftId={nft.id}
          name={nft.name}
          image={nft.image}
          price={nft.listingPrice}
          badge={
            nft.editions.every(({ available }) => available === 0)
              ? "Esgotado"
              : undefined
          }
        />
      ))}
    </div>
  );
}

export function NFTGridSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div role="status">
      <span className="sr-only">Carregando NFTs…</span>
      <div
        aria-hidden="true"
        className={cn(
          "grid grid-cols-1 gap-3 min-[22rem]:grid-cols-2 sm:gap-4 lg:grid-cols-3",
          className,
        )}
      >
        {Array.from({ length: count }, (_, index) => (
          <Card key={index} className="gap-0 p-2">
            <LoadingSkeleton
              announce={false}
              className="aspect-square h-auto"
            />
            <div className="grid min-h-20 content-start gap-2 px-1 pt-3 pb-1 sm:px-3">
              <LoadingSkeleton announce={false} className="h-4 w-4/5" />
              <LoadingSkeleton announce={false} className="h-4 w-2/5" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
