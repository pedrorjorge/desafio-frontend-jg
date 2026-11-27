import type { Socket } from "socket.io-client";

import { socketPath } from "@/lib/env";
import type { RealtimeEvents } from "@/types/api";

type ServerEvents = {
  [Event in keyof RealtimeEvents]: (payload: RealtimeEvents[Event]) => void;
};

interface ClientEvents {
  "mock.probe": (nftId: string) => void;
}

export async function createSocket(
  sessionId?: string,
): Promise<Socket<ServerEvents, ClientEvents>> {
  const { io } = await import("socket.io-client");
  return io(window.location.origin, {
    path: socketPath,
    transports: ["websocket"],
    autoConnect: false,
    auth: sessionId ? { sessionId } : undefined,
    reconnectionDelay: 500,
    reconnectionDelayMax: 2000,
    randomizationFactor: 0,
    forceNew: true,
  });
}
