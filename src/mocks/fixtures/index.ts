import collectibleImage from "@/assets/amber-fox.webp";
import bronzeValley from "@/assets/bronze-valley.webp";
import copperOwl from "@/assets/copper-owl.webp";
import type { Nft, NftCategory, NftDetail, Wallet } from "@/types/api";

import type { Database } from "../database";

const artwork = [
  {
    src: collectibleImage,
    alt: "Raposa com óculos e jaqueta verde em fundo terracota",
  },
  {
    src: copperOwl,
    alt: "Coruja com moletom roxo e chapéu bege em fundo verde suave",
  },
  {
    src: bronzeValley,
    alt: "Anéis de bronze e rochas escuras em uma paisagem desértica",
  },
];
const categories: NftCategory[] = ["retratos", "abstrato", "paisagens"];
const names = [
  "Raposa Âmbar",
  "Reflexo de Cobre",
  "Vale do Crepúsculo",
  "Guardião do Bosque",
  "Linhas de Ébano",
  "Horizonte Dourado",
  "Viajante Âmbar",
  "Órbita de Terra",
  "Jardim Noturno",
  "Sentinela de Bronze",
  "Eco em Terracota",
  "Serra da Névoa",
];
const prices = [
  "0.075",
  "0.03",
  "0.125",
  "0.009",
  "0.5",
  "0.082",
  "0.11",
  "0.07",
  "0.2",
  "0.004",
  "0.095",
  "0.35",
];

function makeWallets(prefix: string, digit: string, owner: string): Wallet[] {
  const fields = {
    displayName: owner,
    profileName: owner,
    network: "ethereum",
    walletType: "browser",
    referralCode: "DEMO",
    email: `${owner}@example.test`,
    ens: `${owner}.eth`,
    secondaryReference: "",
  } as const;
  return [
    {
      ...fields,
      id: `${prefix}-primary`,
      slot: "primary",
      name: "Principal",
      address: `0x${digit.repeat(40)}`,
    },
    {
      ...fields,
      id: `${prefix}-secondary`,
      slot: "secondary",
      name: "Secundária",
      address: `0x${digit.repeat(39)}0`,
    },
  ];
}

export const mockEpoch = Date.parse("2026-01-01T12:00:00Z");

export function createFixtures(): Database {
  const nfts: Nft[] = names.map((name, index) => ({
    id: index === 0 ? "exemplo" : `nft-${index + 1}`,
    name,
    description: "Colecionável fictício da galeria KURIO.",
    image: artwork[index % artwork.length],
    category: categories[index % categories.length],
    featured: [0, 1, 2, 6].includes(index),
    version: 1,
    editions: [
      {
        id: "standard",
        name: "Padrão",
        price: prices[index],
        available: index % 5 === 4 ? 0 : 6,
      },
      {
        id: "limited",
        name: "Limitada",
        price: "0.24",
        available: index % 4 === 0 ? 0 : 2,
      },
    ],
  }));

  return {
    wallStart: Date.now(),
    offsetMs: 0,
    nextId: 1,
    nfts,
    users: [
      {
        profile: {
          id: "user-ana",
          name: "Ana Demo",
          email: "ana@example.test",
          username: "ana_demo",
          ens: "ana.eth",
          walletNickname: "Principal",
          avatarUrl: null,
        },
        salt: "kurio-ana-v1",
        verifier:
          "88e4c408d8eb6645aa76bb29ace21037eb807cf8071003c22ec5e32c9a522c67",
        favorites: ["exemplo"],
        wallets: makeWallets("wallet-ana", "1", "ana"),
      },
      {
        profile: {
          id: "user-bruno",
          name: "Bruno Demo",
          email: "bruno@example.test",
          username: "bruno_demo",
          ens: "bruno.eth",
          walletNickname: "Principal",
          avatarUrl: null,
        },
        salt: "kurio-bruno-v1",
        verifier:
          "8d8c35011f9c4b2a1cbf611195b2be7c4ba13081e8c59f6afecdfd2b9e905e09",
        favorites: [],
        wallets: makeWallets("wallet-bruno", "2", "bruno"),
      },
    ],
    coupons: [
      {
        code: "INVALIDO",
        active: false,
        discountPercent: 10,
        expiresAt: "2027-01-01T00:00:00.000Z",
      },
      {
        code: "KURIO10",
        active: true,
        discountPercent: 10,
        expiresAt: "2027-01-01T00:00:00.000Z",
      },
      {
        code: "VENCIDO",
        active: true,
        discountPercent: 10,
        expiresAt: "2025-12-31T00:00:00.000Z",
      },
    ],
    sessions: {},
    carts: {},
    quotes: [],
    orders: [],
  };
}

const collections: Record<NftCategory, NftDetail["collection"]> = {
  retratos: {
    id: "collection-retratos",
    name: "Retratos do Bosque",
    description: "Uma série de personagens que une textura, moda e fantasia.",
  },
  abstrato: {
    id: "collection-abstrato",
    name: "Formas em Cobre",
    description:
      "Estudos de volume, luz e cor reunidos em uma coleção digital.",
  },
  paisagens: {
    id: "collection-paisagens",
    name: "Horizontes de Bronze",
    description:
      "Paisagens imaginárias construídas com texturas minerais e luz quente.",
  },
};

export function buildNftDetail(nft: Nft): NftDetail {
  return {
    ...nft,
    collection: collections[nft.category],
    gallery: [
      {
        ...nft.image,
        id: "original",
        label: "Vista completa",
        framing: "full",
      },
      {
        ...nft.image,
        id: "detail",
        label: "Vista de detalhe",
        framing: "detail",
      },
    ],
  };
}
