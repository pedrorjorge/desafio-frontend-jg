import Decimal from "decimal.js";
import { z } from "zod";

import {
  catalogCategories,
  catalogSorts,
  type CatalogParams,
} from "@/types/api";

export type CatalogSearch = Omit<CatalogParams, "pageSize">;
export type CatalogFiltersValue = Pick<
  CatalogSearch,
  "category" | "minPrice" | "maxPrice" | "available" | "featured"
>;

const sortSchema = z.enum(catalogSorts);
const pageSchema = z.number().int().min(1).max(1_000_000);

function readEth(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const decimal =
    typeof value === "number" && Number.isFinite(value)
      ? new Decimal(value).toFixed()
      : String(value).trim().replace(",", ".");
  if (!/^\d{1,18}(\.\d{1,18})?$/.test(decimal)) return undefined;
  return new Decimal(decimal).toFixed();
}

export function validateCatalogSearch(
  raw: Record<string, unknown>,
): CatalogSearch {
  const candidates = Array.isArray(raw.category)
    ? raw.category
    : [raw.category];
  const category = catalogCategories.filter((item) =>
    candidates.includes(item),
  );
  const minPrice = readEth(raw.minPrice);
  const maxPrice = readEth(raw.maxPrice);
  const validRange =
    !minPrice || !maxPrice || new Decimal(minPrice).lte(maxPrice);
  const q = typeof raw.q === "string" ? raw.q.trim().slice(0, 100) : "";
  const bool = (value: unknown) =>
    typeof value === "boolean" ? value : undefined;

  return {
    q: q || undefined,
    category: category.length ? category : undefined,
    minPrice,
    maxPrice: validRange ? maxPrice : undefined,
    available: bool(raw.available),
    featured: bool(raw.featured),
    sort: sortSchema.safeParse(raw.sort).data,
    page: pageSchema.safeParse(raw.page).data,
  };
}
