import type { CatalogSort, NftCategory } from "@/types/api";

export const categoryLabels: Record<NftCategory, string> = {
  retratos: "Retratos",
  abstrato: "Abstrato",
  paisagens: "Paisagens",
};

export const sortLabels: Record<CatalogSort, string> = {
  featured: "Em destaque",
  "price-asc": "Menor preço",
  "price-desc": "Maior preço",
  name: "Nome (A–Z)",
};
