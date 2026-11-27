import { http, HttpResponse } from "msw";
import { z } from "zod";

import { realtimeStatus, replayNft, setRealtimeOnline } from "../realtime";
import { transaction } from "../database";
import { body, endpoint, eth, reject, respond } from "./shared";

const editionChange = z
  .object({
    price: eth.optional(),
    available: z.int().min(0).max(1000).optional(),
  })
  .refine(
    (change) => change.price !== undefined || change.available !== undefined,
  );

export const controlHandlers = [
  http.get(endpoint("/__mock/realtime/status"), () =>
    HttpResponse.json(realtimeStatus()),
  ),
  http.post(endpoint("/__mock/realtime/disconnect"), () => {
    setRealtimeOnline(false);
    return HttpResponse.json({ online: false });
  }),
  http.post(endpoint("/__mock/realtime/reconnect"), () => {
    setRealtimeOnline(true);
    return HttpResponse.json({ online: true });
  }),
  http.post(endpoint("/__mock/realtime/replay"), ({ request }) =>
    respond(request, "mock-control", async () => {
      const { nftId, kind } = await body(
        z.object({ nftId: z.string(), kind: z.enum(["duplicate", "older"]) }),
        request,
      );
      if (!replayNft(nftId, kind))
        reject(404, "NOT_FOUND", "Altere este NFT antes de repetir o evento.");
      return new HttpResponse(null, { status: 204 });
    }),
  ),
  http.patch(
    endpoint("/__mock/nfts/:nftId/editions/:editionId"),
    ({ request, params }) =>
      respond(request, "mock-control", async () => {
        const change = await body(editionChange, request);
        return transaction((db) => {
          const nft = db.nfts.find(({ id }) => id === params.nftId);
          const edition = nft?.editions.find(
            ({ id }) => id === params.editionId,
          );
          if (!nft || !edition)
            reject(404, "NOT_FOUND", "NFT ou edição não encontrado.");
          Object.assign(edition, change);
          nft.version += 1;
          return HttpResponse.json(nft);
        });
      }),
  ),
];
