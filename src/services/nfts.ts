import { acceptNftSnapshots } from "@/lib/live-versions";
import type { NftDetail } from "@/types/api";

import { api } from "./api";

export async function fetchNft(nftId: string, signal: AbortSignal) {
  const { data } = await api.get<NftDetail>(
    `/nfts/${encodeURIComponent(nftId)}`,
    { signal },
  );
  signal.throwIfAborted();
  acceptNftSnapshots([data]);
  return data;
}
