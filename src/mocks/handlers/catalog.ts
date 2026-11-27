import Decimal from "decimal.js";
import { http, HttpResponse } from "msw";
import { z } from "zod";

import {
  catalogCategories,
  catalogSorts,
  type CatalogPage,
  type Nft,
} from "@/types/api";

import { readDatabase } from "../database";
import { buildNftDetail } from "../fixtures";
import { currentScenario } from "../scenarios";
import { endpoint, eth, parse, reject, respond } from "./shared";

const catalogParams = z.object({
  q: z.string().trim().max(100).default(""),
  category: z.array(z.enum(catalogCategories)),
  minPrice: eth.optional(),
  maxPrice: eth.optional(),
  available: z.enum(["true", "false"]).optional(),
  featured: z.enum(["true", "false"]).optional(),
  sort: z.enum(catalogSorts).default("featured"),
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(6),
});

function normalized(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function catalogPage(nfts: Nft[], url: URL): CatalogPage {
  const input = parse(catalogParams, {
    ...Object.fromEntries(url.searchParams),
    category: url.searchParams.getAll("category"),
  });
  if (
    input.minPrice &&
    input.maxPrice &&
    new Decimal(input.minPrice).gt(input.maxPrice)
  ) {
    reject(
      422,
      "VALIDATION_ERROR",
      "O preço máximo deve ser maior ou igual ao mínimo.",
      { maxPrice: "Revise a faixa de preço." },
    );
  }

  const matches = nfts.flatMap((nft) => {
    if (input.category.length && !input.category.includes(nft.category))
      return [];
    if (
      input.featured !== undefined &&
      nft.featured !== (input.featured === "true")
    )
      return [];
    if (
      !normalized(`${nft.name} ${nft.description}`).includes(
        normalized(input.q),
      )
    )
      return [];

    const prices = nft.editions
      .filter((edition) => {
        if (
          input.available !== undefined &&
          edition.available > 0 !== (input.available === "true")
        )
          return false;
        const price = new Decimal(edition.price);
        return (
          (!input.minPrice || price.gte(input.minPrice)) &&
          (!input.maxPrice || price.lte(input.maxPrice))
        );
      })
      .map(({ price }) => price);

    return prices.length ? [{ nft, price: Decimal.min(...prices) }] : [];
  });

  matches.sort((a, b) => {
    if (input.sort === "price-asc") return a.price.comparedTo(b.price);
    if (input.sort === "price-desc") return b.price.comparedTo(a.price);
    if (input.sort === "name")
      return a.nft.name.localeCompare(b.nft.name, "pt-BR");
    return Number(b.nft.featured) - Number(a.nft.featured);
  });

  const start = (input.page - 1) * input.pageSize;
  return {
    items: matches
      .slice(start, start + input.pageSize)
      .map(({ nft, price }) => ({ ...nft, listingPrice: price.toFixed() })),
    page: input.page,
    pageSize: input.pageSize,
    total: matches.length,
    totalPages: Math.ceil(matches.length / input.pageSize),
  };
}

export const catalogHandlers = [
  http.get(endpoint("/nfts"), ({ request }) => {
    const snapshot = currentScenario() === "empty" ? [] : readDatabase().nfts;
    return respond(request, "catalog", () =>
      HttpResponse.json(catalogPage(snapshot, new URL(request.url))),
    );
  }),
  http.get(endpoint("/nfts/:nftId"), ({ request, params }) =>
    respond(request, "nft", () => {
      const nft = readDatabase().nfts.find(({ id }) => id === params.nftId);
      if (!nft) reject(404, "NOT_FOUND", "NFT não encontrado.");
      return HttpResponse.json(buildNftDetail(nft));
    }),
  ),
];
