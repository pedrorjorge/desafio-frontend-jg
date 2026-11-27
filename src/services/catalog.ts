import { acceptNftSnapshots } from "@/lib/live-versions";
import type { CatalogPage, CatalogParams } from "@/types/api";

import { api } from "./api";

export async function fetchCatalog(params: CatalogParams, signal: AbortSignal) {
  const { data } = await api.get<CatalogPage>("/nfts", { params, signal });
  signal.throwIfAborted();
  acceptNftSnapshots(data.items);
  return data;
}
