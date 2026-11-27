import { z } from "zod";

import { walletNetworks, walletTypes } from "@/types/api";

import { avatarDataSchema } from "./avatar";

export const accountName = z
  .string()
  .trim()
  .min(2, "Informe ao menos dois caracteres.")
  .max(100);
export const accountEmail = z
  .string()
  .trim()
  .max(254)
  .pipe(z.email("Informe um e-mail válido."))
  .transform((value) => value.toLowerCase());
const password = z
  .string()
  .min(8, "Informe ao menos oito caracteres.")
  .max(128);
const ens = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.eth$/,
    "Informe um nome ENS como exemplo.eth.",
  );

export const profileSchema = z.object({
  name: accountName,
  email: accountEmail,
  avatarUrl: avatarDataSchema,
  username: z
    .string()
    .trim()
    .regex(
      /^[a-z\d_]{3,30}$/i,
      "Use de 3 a 30 letras, números ou sublinhados.",
    ),
  ens,
  walletNickname: accountName,
});

export const passwordSchema = z
  .object({
    currentPassword: password,
    newPassword: password,
  })
  .refine(
    ({ currentPassword, newPassword }) => currentPassword !== newPassword,
    {
      path: ["newPassword"],
      message: "Escolha uma senha diferente da atual.",
    },
  );

const walletAddress = z
  .string()
  .trim()
  .regex(
    /^0x[a-f\d]{40}$/i,
    "Informe um endereço fictício 0x com 40 dígitos hexadecimais.",
  );
export const walletSchema = z.object({
  slot: z.enum(["primary", "secondary"]),
  name: accountName,
  displayName: accountName,
  network: z.enum(walletNetworks, "Selecione uma rede."),
  profileName: accountName,
  address: walletAddress,
  secondaryReference: z
    .string()
    .trim()
    .max(120)
    .refine(
      (value) =>
        !value ||
        ens.safeParse(value).success ||
        walletAddress.safeParse(value).success,
      "Informe um ENS ou endereço fictício válido.",
    ),
  walletType: z.enum(walletTypes, "Selecione um tipo de carteira."),
  referralCode: z
    .string()
    .trim()
    .regex(
      /^[a-z\d-]{2,30}$/i,
      "Informe um código fictício com 2 a 30 letras, números ou hífens.",
    ),
  email: accountEmail,
  ens,
});
