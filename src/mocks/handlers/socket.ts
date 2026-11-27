import { ws } from "msw";

import { socketPath } from "@/lib/env";
import type { RealtimeEvents } from "@/types/api";

import { getVisitorId, readDatabase } from "../database";
import {
  realtimeOnline,
  removeConnection,
  scopeForConnection,
  trackConnection,
} from "../realtime";
import { sessionRecord } from "./shared";

const url = new URL(`${socketPath}/`, window.location.origin);
url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
const realtime = ws.link(url.href);
const pingInterval = 25_000;
const pingTimeout = 20_000;

// Engine.IO v4 contains Socket.IO v5 frames in its message packets (prefix 4).
export const socketHandler = realtime.addEventListener(
  "connection",
  ({ client }) => {
    if (
      client.url.searchParams.get("EIO") !== "4" ||
      client.url.searchParams.get("transport") !== "websocket"
    ) {
      client.close(4000, "Unsupported Engine.IO transport");
      return;
    }
    if (!realtimeOnline()) {
      client.close(4001, "Mock transport interrupted");
      return;
    }
    const sid = crypto.randomUUID();
    let connected = false;
    let heartbeatTimeout: ReturnType<typeof setTimeout> | undefined;

    const heartbeat = setInterval(() => {
      client.send("2");
      heartbeatTimeout = setTimeout(
        () => client.close(4000, "Heartbeat timeout"),
        pingTimeout,
      );
    }, pingInterval);

    client.addEventListener("close", () => {
      removeConnection(client);
      clearInterval(heartbeat);
      clearTimeout(heartbeatTimeout);
    });
    client.addEventListener("message", ({ data }) => {
      if (data === "3") {
        clearTimeout(heartbeatTimeout);
        return;
      }
      if (!connected && typeof data === "string" && data.startsWith("40")) {
        try {
          const auth = data.length > 2 ? JSON.parse(data.slice(2)) : {};
          const sessionId: unknown = auth?.sessionId;
          const scope =
            typeof sessionId === "string"
              ? scopeForConnection(getVisitorId(), sessionId)
              : undefined;
          if (
            sessionId !== undefined &&
            (!scope || !sessionRecord(readDatabase()))
          ) {
            client.send('44{"message":"Sessão inválida"}');
            client.close(4003, "Invalid session");
            return;
          }
          connected = true;
          trackConnection(client, scope);
          client.send(`40${JSON.stringify({ sid })}`);
        } catch {
          client.close(4000, "Invalid namespace authentication");
        }
        return;
      }
      if (data === "41" || data === "1") {
        client.close(1000);
        return;
      }
      if (!connected || typeof data !== "string" || !data.startsWith("42["))
        return;

      let payload: unknown;
      try {
        payload = JSON.parse(data.slice(2));
      } catch {
        client.close(4000, "Invalid event payload");
        return;
      }

      if (
        !Array.isArray(payload) ||
        payload[0] !== "mock.probe" ||
        typeof payload[1] !== "string"
      )
        return;
      const nft = readDatabase().nfts.find(({ id }) => id === payload[1]);
      if (nft) {
        const event: RealtimeEvents["mock.probe"] = {
          id: `mock.probe:${nft.id}:${nft.version}`,
          resourceId: nft.id,
          version: nft.version,
          resource: nft,
        };
        client.send(`42${JSON.stringify(["mock.probe", event])}`);
      }
    });

    client.send(
      `0${JSON.stringify({ sid, upgrades: [], pingInterval, pingTimeout, maxPayload: 1_000_000 })}`,
    );
  },
);
