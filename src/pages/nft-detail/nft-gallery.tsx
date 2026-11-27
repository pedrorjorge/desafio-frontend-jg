import { useState } from "react";

import { cn } from "@/lib/utils";
import type { NftDetail } from "@/types/api";

export function NFTGallery({ images }: { images: NftDetail["gallery"] }) {
  const [imageId, setImageId] = useState(images[0].id);
  const selected = images.find((image) => image.id === imageId) ?? images[0];

  return (
    <div className="grid min-w-0 content-start gap-3 lg:grid-cols-[4.5rem_minmax(0,1fr)]">
      <figure className="aspect-square min-w-0 overflow-hidden rounded-panel border border-border bg-card lg:col-start-2 lg:row-start-1">
        <img
          src={selected.src}
          alt={selected.alt}
          width={1254}
          height={1254}
          fetchPriority="high"
          className={cn(
            "h-full w-full object-cover",
            selected.framing === "detail" && "origin-[50%_38%] scale-150",
          )}
        />
        <figcaption className="sr-only">{selected.label}</figcaption>
      </figure>
      <div
        role="group"
        aria-label="Imagens do NFT"
        className="flex flex-wrap gap-2 lg:col-start-1 lg:row-start-1 lg:flex-col"
      >
        {images.map((image) => (
          <button
            key={image.id}
            type="button"
            aria-label={image.label}
            aria-pressed={selected.id === image.id}
            onClick={() => setImageId(image.id)}
            className="size-16 overflow-hidden rounded-control border-2 border-border bg-card hover:border-input aria-pressed:border-primary lg:size-full lg:h-auto lg:aspect-square"
          >
            <img
              src={image.src}
              alt=""
              loading="lazy"
              decoding="async"
              width={1254}
              height={1254}
              className={cn(
                "h-full w-full object-cover",
                image.framing === "detail" && "origin-[50%_38%] scale-150",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
