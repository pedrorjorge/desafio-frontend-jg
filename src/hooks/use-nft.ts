import { queryOptions, useQuery } from "@tanstack/react-query";

import { keepNewestVersion } from "@/lib/live-versions";
import { nftQueryPolicy } from "@/lib/nft-query-policy";
import { fetchNft } from "@/services/nfts";

export function nftQueryOptions(nftId: string) {
  return queryOptions({
    queryKey: ["nfts", "detail", nftId],
    queryFn: ({ signal }) => fetchNft(nftId, signal),
    ...nftQueryPolicy,
    structuralSharing: keepNewestVersion,
  });
}

export function useNft(nftId: string) {
  return useQuery(nftQueryOptions(nftId));
}
