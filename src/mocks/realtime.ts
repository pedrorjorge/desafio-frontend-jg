import type { Nft, RealtimeEvents } from "@/types/api";

import { now, observeDatabase, readDatabase, type Database } from "./database";

export type MockSocket = {
  send: (data: string) => void;
  close: (code: number, reason: string) => void;
};

type PrivateScope = NonNullable<RealtimeEvents["order.updated"]["session"]> & {
  visitorId: string;
};

const connections = new Map<MockSocket, PrivateScope | undefined>();
const history = new Map<
  string,
  {
    current: RealtimeEvents["nft.updated"];
    previous: RealtimeEvents["nft.updated"];
  }
>();
let online = true;

export function realtimeStatus() {
  return { online, connected: connections.size };
}

export function realtimeOnline() {
  return online;
}

export function trackConnection(client: MockSocket, scope?: PrivateScope) {
  connections.set(client, scope);
}

export function removeConnection(client: MockSocket) {
  connections.delete(client);
}

function currentSession(db: Database, scope: PrivateScope) {
  const record = db.sessions[scope.visitorId];
  return (
    record?.id === scope.sessionId &&
    record.userId === scope.userId &&
    record.expiresAt > now(db)
  );
}

function send<Event extends keyof RealtimeEvents>(
  client: MockSocket,
  name: Event,
  payload: RealtimeEvents[Event],
) {
  client.send(`42${JSON.stringify([name, payload])}`);
}

function nftEvent(nft: Nft): RealtimeEvents["nft.updated"] {
  return {
    id: `nft.updated:${nft.id}:${nft.version}`,
    resourceId: nft.id,
    version: nft.version,
    resource: nft,
  };
}

function publishNft(event: RealtimeEvents["nft.updated"]) {
  for (const client of connections.keys()) send(client, "nft.updated", event);
}

export function startRealtimePublisher() {
  observeDatabase((before, after) => {
    if (before.wallStart !== after.wallStart || after.nextId < before.nextId)
      history.clear();
    const previousNfts = new Map(before.nfts.map((nft) => [nft.id, nft]));
    for (const nft of after.nfts) {
      const previous = previousNfts.get(nft.id);
      if (!previous || previous.version >= nft.version) continue;
      const event = nftEvent(nft);
      history.set(nft.id, { current: event, previous: nftEvent(previous) });
      publishNft(event);
    }

    const versions = new Map(
      before.orders.map(({ order }) => [order.id, order.version]),
    );
    for (const { order, userId } of after.orders) {
      if ((versions.get(order.id) ?? 0) >= order.version) continue;
      for (const [client, scope] of connections) {
        if (scope?.userId !== userId || !currentSession(after, scope)) continue;
        send(client, "order.updated", {
          id: `order.updated:${order.id}:${order.version}`,
          resourceId: order.id,
          version: order.version,
          resource: order,
          session: { userId, sessionId: scope.sessionId },
        });
      }
    }
  });
}

export function replayNft(nftId: string, kind: "duplicate" | "older") {
  const events = history.get(nftId);
  if (!events) return false;
  publishNft(kind === "duplicate" ? events.current : events.previous);
  return true;
}

export function setRealtimeOnline(value: boolean) {
  online = value;
  if (value) return;
  for (const client of connections.keys())
    client.close(4001, "Mock transport interrupted");
  connections.clear();
}

export function scopeForConnection(visitorId: string, sessionId: string) {
  const session = readDatabase().sessions[visitorId];
  if (session?.id !== sessionId) return undefined;
  return { visitorId, sessionId, userId: session.userId };
}
