import { http, HttpResponse } from "msw";
import { z } from "zod";

import {
  passwordSchema,
  profileSchema,
  walletSchema,
} from "@/lib/account-schema";
import type { Profile, Session, Wallet } from "@/types/api";

import { mergeVisitorCart } from "../cart";
import {
  getVisitorId,
  nextId,
  now,
  transaction,
  type Database,
  type MockAccount,
} from "../database";
import {
  account,
  body,
  email,
  empty,
  endpoint,
  name,
  password,
  passwordVerifier,
  publicUser,
  reject,
  respond,
  requireSessionRecord,
} from "./shared";

const credentials = z.object({ email, password });
const registerInput = credentials.extend({ name });
function presentProfile(profile: Profile): Profile {
  return {
    ...profile,
    username: profile.username ?? "",
    ens: profile.ens ?? "",
    walletNickname: profile.walletNickname ?? "",
  };
}

function presentWallet(wallet: Wallet, profile: Profile): Wallet {
  return {
    ...wallet,
    displayName: wallet.displayName ?? profile.name,
    profileName: wallet.profileName ?? profile.name,
    network: wallet.network ?? "ethereum",
    walletType: wallet.walletType ?? "browser",
    referralCode: wallet.referralCode ?? "",
    email: wallet.email ?? profile.email,
    ens: wallet.ens ?? "",
    secondaryReference: wallet.secondaryReference ?? "",
  };
}

function sessionFor(db: Database, user: MockAccount): Session {
  const visitorId = getVisitorId();
  const expiresAt = now(db) + 60 * 60 * 1000;
  const id = crypto.randomUUID();
  db.sessions[visitorId] = { id, userId: user.profile.id, expiresAt };

  mergeVisitorCart(db, visitorId, user.profile.id);

  return {
    id,
    user: publicUser(user.profile),
    expiresAt: new Date(expiresAt).toISOString(),
    expiresInMs: Math.max(0, expiresAt - now(db)),
  };
}

function requireUniqueEmail(db: Database, value: string, exceptId?: string) {
  if (
    db.users.some(
      ({ profile }) => profile.email === value && profile.id !== exceptId,
    )
  ) {
    reject(409, "CONFLICT", "E-mail já cadastrado.", {
      email: "E-mail já cadastrado.",
    });
  }
}

function requireUniqueWallet(
  user: MockAccount,
  input: z.infer<typeof walletSchema>,
  exceptId?: string,
) {
  if (
    user.wallets.some(
      (wallet) => wallet.id !== exceptId && wallet.slot === input.slot,
    )
  ) {
    reject(409, "CONFLICT", "Já existe uma carteira nesse espaço.", {
      slot: "Escolha um espaço livre.",
    });
  }
}

export const accountHandlers = [
  http.post(endpoint("/auth/register"), ({ request }) =>
    respond(request, "register", async () => {
      const input = await body(registerInput, request);
      const salt = crypto.randomUUID();
      const verifier = await passwordVerifier(input.password, salt);
      return transaction((db) => {
        requireUniqueEmail(db, input.email);
        const user: MockAccount = {
          profile: {
            id: nextId(db, "user"),
            name: input.name,
            email: input.email,
            avatarUrl: null,
            username: "",
            ens: "",
            walletNickname: "",
          },
          salt,
          verifier,
          favorites: [],
          wallets: [],
        };
        db.users.push(user);
        return HttpResponse.json(sessionFor(db, user), { status: 201 });
      });
    }),
  ),
  http.post(endpoint("/auth/login"), ({ request }) =>
    respond(request, "login", async () => {
      const input = await body(credentials, request);
      return transaction(async (db) => {
        const user = db.users.find(
          ({ profile }) => profile.email === input.email,
        );
        if (
          !user ||
          (await passwordVerifier(input.password, user.salt)) !== user.verifier
        ) {
          reject(401, "INVALID_CREDENTIALS", "E-mail ou senha inválidos.");
        }
        return HttpResponse.json(sessionFor(db, user));
      });
    }),
  ),
  http.get(endpoint("/auth/session"), ({ request }) =>
    respond(request, "session", () =>
      transaction((db) => {
        const session = requireSessionRecord(db);
        const user = account(db, request);
        return HttpResponse.json({
          id: (session.id ??= crypto.randomUUID()),
          user: publicUser(user.profile),
          expiresAt: new Date(session.expiresAt).toISOString(),
          expiresInMs: Math.max(0, session.expiresAt - now(db)),
        } satisfies Session);
      }),
    ),
  ),
  http.post(endpoint("/auth/logout"), ({ request }) =>
    respond(request, "logout", () =>
      transaction((db) => {
        delete db.sessions[getVisitorId()];
        return empty();
      }),
    ),
  ),
  http.get(endpoint("/profile"), ({ request }) =>
    respond(request, "profile", () =>
      transaction((db) =>
        HttpResponse.json(presentProfile(account(db, request).profile)),
      ),
    ),
  ),
  http.patch(endpoint("/profile"), ({ request }) =>
    respond(request, "profile", async () => {
      const input = await body(profileSchema, request);
      return transaction((db) => {
        const user = account(db, request);
        requireUniqueEmail(db, input.email, user.profile.id);
        user.profile = { id: user.profile.id, ...input };
        return HttpResponse.json(user.profile);
      });
    }),
  ),
  http.put(endpoint("/profile/password"), ({ request }) =>
    respond(request, "password", async () => {
      const input = await body(passwordSchema, request);
      return transaction(async (db) => {
        const user = account(db, request);
        if (
          (await passwordVerifier(input.currentPassword, user.salt)) !==
          user.verifier
        ) {
          reject(422, "VALIDATION_ERROR", "Senha atual inválida.", {
            currentPassword: "Senha atual inválida.",
          });
        }
        const salt = crypto.randomUUID();
        user.verifier = await passwordVerifier(input.newPassword, salt);
        user.salt = salt;
        return empty();
      });
    }),
  ),
  http.get(endpoint("/wallets"), ({ request }) =>
    respond(request, "wallets", () =>
      transaction((db) => {
        const { profile, wallets } = account(db, request);
        return HttpResponse.json(
          wallets.map((wallet) => presentWallet(wallet, profile)),
        );
      }),
    ),
  ),
  http.post(endpoint("/wallets"), ({ request }) =>
    respond(request, "wallets", async () => {
      const input = await body(walletSchema, request);
      return transaction((db) => {
        const user = account(db, request);
        requireUniqueWallet(user, input);
        const wallet = { id: nextId(db, "wallet"), ...input };
        user.wallets.push(wallet);
        return HttpResponse.json(wallet, { status: 201 });
      });
    }),
  ),
  http.patch(endpoint("/wallets/:walletId"), ({ request, params }) =>
    respond(request, "wallets", async () => {
      const input = await body(walletSchema, request);
      return transaction((db) => {
        const user = account(db, request);
        const wallet = user.wallets.find(({ id }) => id === params.walletId);
        if (!wallet) reject(404, "NOT_FOUND", "Carteira não encontrada.");
        requireUniqueWallet(user, input, wallet.id);
        Object.assign(wallet, input);
        return HttpResponse.json(wallet);
      });
    }),
  ),
  http.get(endpoint("/favorites"), ({ request }) =>
    respond(request, "favorites", () =>
      transaction((db) =>
        HttpResponse.json({ nftIds: account(db, request).favorites }),
      ),
    ),
  ),
  http.put(endpoint("/favorites/:nftId"), ({ request, params }) =>
    respond(request, "favorite-write", () =>
      transaction((db) => {
        const user = account(db, request);
        const nft = db.nfts.find(({ id }) => id === params.nftId);
        if (!nft) reject(404, "NOT_FOUND", "NFT não encontrado.");
        if (!user.favorites.includes(nft.id)) user.favorites.push(nft.id);
        return HttpResponse.json({ nftIds: user.favorites });
      }),
    ),
  ),
  http.delete(endpoint("/favorites/:nftId"), ({ request, params }) =>
    respond(request, "favorite-write", () =>
      transaction((db) => {
        const user = account(db, request);
        user.favorites = user.favorites.filter((id) => id !== params.nftId);
        return HttpResponse.json({ nftIds: user.favorites });
      }),
    ),
  ),
];
