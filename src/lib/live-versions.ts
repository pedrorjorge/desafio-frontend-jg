import type { Nft, Order } from "@/types/api";

const nftVersions = new Map<string, number>();
const orderVersions = new WeakMap<AbortSignal, Map<string, number>>();

export class OlderSnapshot extends Error {
  constructor() {
    super("Chegou uma resposta anterior à versão conhecida.");
  }
}

export function observeNftVersion(id: string, version: number) {
  if (!Number.isSafeInteger(version) || version <= (nftVersions.get(id) ?? 0))
    return false;
  nftVersions.set(id, version);
  return true;
}

export function acceptNftSnapshots(items: Nft[]) {
  if (items.some(({ id, version }) => version < (nftVersions.get(id) ?? 0)))
    throw new OlderSnapshot();
  for (const { id, version } of items) observeNftVersion(id, version);
}

export function observeOrderVersion(
  lifetime: AbortSignal,
  id: string,
  version: number,
) {
  if (lifetime.aborted || !Number.isSafeInteger(version)) return false;
  let versions = orderVersions.get(lifetime);
  if (!versions) {
    versions = new Map();
    orderVersions.set(lifetime, versions);
  }
  if (version <= (versions.get(id) ?? 0)) return false;
  versions.set(id, version);
  return true;
}

export function acceptOrderSnapshot(lifetime: AbortSignal, order: Order) {
  lifetime.throwIfAborted();
  if (order.version < (orderVersions.get(lifetime)?.get(order.id) ?? 0))
    throw new OlderSnapshot();
  observeOrderVersion(lifetime, order.id, order.version);
}

function versionOf(data: unknown) {
  return data &&
    typeof data === "object" &&
    "version" in data &&
    typeof data.version === "number"
    ? data.version
    : 0;
}

export function keepNewestVersion(previous: unknown, incoming: unknown) {
  return versionOf(previous) > versionOf(incoming) ? previous : incoming;
}

export function preserveTerminalOrder(previous: unknown, incoming: unknown) {
  if (
    previous &&
    typeof previous === "object" &&
    "status" in previous &&
    (previous.status === "confirmed" || previous.status === "declined")
  )
    return previous;
  return keepNewestVersion(previous, incoming);
}
