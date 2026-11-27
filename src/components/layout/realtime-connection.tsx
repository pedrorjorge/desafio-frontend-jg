import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useSession } from "@/hooks/use-session";
import { mocksEnabled } from "@/lib/env";
import { connectReconciliation } from "@/lib/reconcile-realtime";
import { privateSessionSignal, sessionKey } from "@/lib/session";
import { createSocket } from "@/services/socket";
import type { Session } from "@/types/api";

export function RealtimeConnection() {
  const client = useQueryClient();
  const session = useSession();
  const ready = session.data !== undefined;
  const sessionId = session.data?.id;

  useEffect(() => {
    if (!mocksEnabled || !ready) return;
    const lifetime = privateSessionSignal();
    const connection = new AbortController();
    const signal = AbortSignal.any([lifetime, connection.signal]);
    const current = client.getQueryData<Session | null>(sessionKey) ?? null;
    const actions = connectReconciliation(client, signal, current, lifetime);
    let socket: Awaited<ReturnType<typeof createSocket>> | undefined;

    function close() {
      connection.abort();
      lifetime.removeEventListener("abort", close);
      socket?.off("connect", actions.reconcile);
      socket?.off("nft.updated", actions.onNft);
      socket?.off("order.updated", actions.onOrder);
      socket?.disconnect();
    }

    lifetime.addEventListener("abort", close, { once: true });
    void createSocket(sessionId)
      .then((connectedSocket) => {
        if (signal.aborted) return;
        socket = connectedSocket;
        socket.on("connect", actions.reconcile);
        socket.on("nft.updated", actions.onNft);
        socket.on("order.updated", actions.onOrder);
        socket.connect();
      })
      .catch((error: unknown) => {
        if (!signal.aborted)
          console.error("Não foi possível iniciar o Socket.IO.", error);
      });
    return close;
  }, [client, ready, sessionId]);

  return null;
}
