import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";

import { api } from "@/services/api";
import { createSocket } from "@/services/socket";
import type { Nft, NftDetail, RealtimeEvents } from "@/types/api";

import { accountHandlers } from "./handlers/account";
import { catalogHandlers } from "./handlers/catalog";
import { commerceHandlers } from "./handlers/commerce";
import { controlHandlers } from "./handlers/controls";
import { endpoint } from "./handlers/shared";
import { socketHandler } from "./handlers/socket";
import { startOrderSettlement } from "./orders";
import { startRealtimePublisher } from "./realtime";
import {
  advanceClock,
  currentScenario,
  initializeScenario,
  scenarios,
  selectScenario,
} from "./scenarios";

async function receiveProbe(nftId: string) {
  const socket = await createSocket();
  return new Promise<RealtimeEvents["mock.probe"]>((resolve, reject) => {
    const timeout = setTimeout(
      () => finish(new Error("O Socket.IO não entregou o evento de teste.")),
      4000,
    );

    function cleanup() {
      clearTimeout(timeout);
      socket.removeAllListeners();
      socket.disconnect();
    }

    function finish(error: Error) {
      cleanup();
      reject(error);
    }

    socket.once("connect_error", finish);
    socket.once("connect", () => socket.emit("mock.probe", nftId));
    socket.once("mock.probe", (event) => {
      cleanup();
      resolve(event);
    });
    socket.connect();
  });
}

async function probe() {
  const { data: before } = await api.get<NftDetail>("/nfts/exemplo");
  const first = await receiveProbe(before.id);
  const { data: after } = await api.patch<Nft>(
    "/__mock/nfts/exemplo/editions/standard",
    {
      price: before.editions[0].price === "0.076" ? "0.075" : "0.076",
    },
  );
  const second = await receiveProbe(after.id);
  const { data: persisted } = await api.get<NftDetail>("/nfts/exemplo");

  if (
    first.resourceId !== before.id ||
    first.version !== before.version ||
    second.resourceId !== after.id ||
    second.version <= first.version ||
    JSON.stringify(second.resource.editions) !==
      JSON.stringify(persisted.editions) ||
    second.version !== persisted.version
  ) {
    throw new Error("REST e Socket.IO retornaram estados diferentes.");
  }
  return { first, second };
}

const controls = {
  scenarios,
  currentScenario,
  select: selectScenario,
  reset: () => selectScenario(currentScenario()),
  advanceClock,
  http: api,
  probe,
};

declare global {
  interface Window {
    kurioMocks?: typeof controls;
  }
}

export async function startMocks() {
  initializeScenario();
  const worker = setupWorker(
    ...catalogHandlers,
    ...accountHandlers,
    ...commerceHandlers,
    ...controlHandlers,
    http.all(endpoint("/*"), () =>
      HttpResponse.json(
        { code: "NOT_FOUND", message: "Endpoint não encontrado." },
        { status: 404 },
      ),
    ),
    socketHandler,
  );
  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  });
  startRealtimePublisher();
  startOrderSettlement();
  window.kurioMocks = controls;
}
