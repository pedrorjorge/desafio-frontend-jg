import { queryOptions, useQuery } from "@tanstack/react-query";
import { nftQueryPolicy } from "@/lib/nft-query-policy";

import { fetchCatalog } from "@/services/catalog";
import type { CatalogParams } from "@/types/api";

export function catalogQueryOptions(params: CatalogParams) {
  const queryParams = {
    ...params,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 6,
    sort: params.sort ?? "featured",
  } satisfies CatalogParams;

  return queryOptions({
    queryKey: ["nfts", "catalog", queryParams],
    queryFn: ({ signal }) => fetchCatalog(queryParams, signal),
    ...nftQueryPolicy,
  });
}

export function useCatalog(params: CatalogParams) {
  return useQuery(catalogQueryOptions(params));
}
