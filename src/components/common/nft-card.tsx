import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

import { FavoriteButton } from "./favorite-button";
import { PriceDisplay } from "./price-display";

type NFTCardProps = {
  nftId?: string;
  name: string;
  image: { src: string; alt: string };
  price: string;
  badge?: string;
  children?: ReactNode;
  showFavoriteError?: boolean;
};

export function NFTCard({
  nftId,
  name,
  image,
  price,
  badge,
  children,
  showFavoriteError,
}: NFTCardProps) {
  const title = (
    <>
      <div className="relative">
        <img
          src={image.src}
          alt={image.alt}
          width={1254}
          height={1254}
          loading="lazy"
          decoding="async"
          className="aspect-square w-full rounded-control bg-surface object-cover"
        />
        {badge && (
          <span className="absolute top-2 left-2 rounded-control bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
            {badge}
          </span>
        )}
      </div>
      <div className="grid min-h-20 content-start gap-1 px-1 pt-3 pb-1 sm:px-3">
        <h3 className="font-display text-base font-bold wrap-break-word md:text-lg">
          {name}
        </h3>
        <PriceDisplay amount={price} />
      </div>
    </>
  );

  return (
    <article className="min-w-0">
      <Card className="relative h-full gap-0 p-2 shadow-[0_12px_28px_rgba(10,5,3,0.14)] transition-colors focus-within:border-ring hover:border-input">
        {nftId ? (
          <Link
            to="/nfts/$nftId"
            params={{ nftId }}
            className="block rounded-control hover:text-primary"
          >
            {title}
          </Link>
        ) : (
          title
        )}
        {nftId && (
          <div className="absolute top-4 right-4">
            <FavoriteButton
              nftId={nftId}
              name={name}
              compact
              showError={showFavoriteError}
            />
          </div>
        )}
        {children}
      </Card>
    </article>
  );
}
