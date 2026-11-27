import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState, type ComponentProps } from "react";
import { useForm } from "react-hook-form";

import { ErrorState } from "@/components/common/error-state";
import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSaveWallet, useWallets } from "@/hooks/use-account";
import { walletSchema } from "@/lib/account-schema";
import {
  walletNetworks,
  walletTypes,
  type Wallet,
  type WalletSlot,
} from "@/types/api";

import { AccountField, applyApiFormErrors } from "./account-field";
import { AccountLayout } from "./account-sidebar";

const slots = ["primary", "secondary"] as const;
const titles = {
  primary: "Carteira principal",
  secondary: "Carteira secundária",
};
const networkLabels = { ethereum: "Ethereum", polygon: "Polygon" };
const typeLabels = {
  browser: "Navegador",
  mobile: "Mobile",
  hardware: "Hardware",
};
const textFields = [
  { key: "displayName", label: "Nome de exibição" },
  { key: "name", label: "Apelido da carteira" },
  { key: "profileName", label: "Nome do perfil" },
  { key: "address", label: "Endereço fictício da carteira" },
  { key: "secondaryReference", label: "ENS ou endereço secundário (opcional)" },
  { key: "referralCode", label: "Código de indicação fictício" },
  { key: "email", label: "E-mail", type: "email" },
  { key: "ens", label: "Nome ENS" },
] as const;

function WalletSelect({
  title,
  error,
  children,
  ...props
}: ComponentProps<"select"> & { title: string; error?: string }) {
  const id = useId();
  return (
    <div className="grid min-w-0 gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {title}
      </label>
      <select
        {...props}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full min-w-0 aria-invalid:border-destructive"
      >
        {children}
      </select>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function WalletForm({
  userId,
  slot,
  wallet,
}: {
  userId: string;
  slot: WalletSlot;
  wallet?: Wallet;
}) {
  const save = useSaveWallet(userId, wallet?.id);
  const [saved, setSaved] = useState(false);
  const {
    register,
    reset,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(walletSchema),
    defaultValues: wallet ?? {
      slot,
      name: "",
      displayName: "",
      profileName: "",
      address: "",
      secondaryReference: "",
      referralCode: "",
      email: "",
      ens: "",
    },
  });
  const submit = handleSubmit(async (values) => {
    setSaved(false);
    try {
      reset(await save.mutateAsync(values));
      setSaved(true);
    } catch (error) {
      applyApiFormErrors(
        error,
        [...textFields.map(({ key }) => key), "network", "walletType"],
        setError,
      );
    }
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <input type="hidden" {...register("slot")} />
      <div className="grid gap-4 sm:grid-cols-2">
        {textFields.map((field) => (
          <AccountField
            key={field.key}
            {...register(field.key)}
            label={field.label}
            type={"type" in field ? field.type : "text"}
            error={errors[field.key]?.message}
          />
        ))}
        <WalletSelect
          {...register("network")}
          title="Rede"
          error={errors.network?.message}
        >
          <option value="">Selecione uma rede</option>
          {walletNetworks.map((network) => (
            <option key={network} value={network}>
              {networkLabels[network]}
            </option>
          ))}
        </WalletSelect>
        <WalletSelect
          {...register("walletType")}
          title="Tipo de carteira"
          error={errors.walletType?.message}
        >
          <option value="">Selecione um tipo</option>
          {walletTypes.map((type) => (
            <option key={type} value={type}>
              {typeLabels[type]}
            </option>
          ))}
        </WalletSelect>
      </div>
      {errors.root?.server?.message && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.server.message}
        </p>
      )}
      <Button
        type="submit"
        className="justify-self-start"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Salvando…" : "Salvar carteira"}
      </Button>
      {saved && (
        <p role="status" className="text-sm text-muted-foreground">
          Carteira salva.
        </p>
      )}
    </form>
  );
}

function WalletSection({
  userId,
  slot,
  wallet,
}: {
  userId: string;
  slot: WalletSlot;
  wallet?: Wallet;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold">{titles[slot]}</h2>
        {!wallet && !expanded && (
          <Button variant="outline" onClick={() => setExpanded(true)}>
            Adicionar
          </Button>
        )}
      </div>
      {wallet || expanded ? (
        <WalletForm userId={userId} slot={slot} wallet={wallet} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhuma carteira neste espaço.
        </p>
      )}
    </Card>
  );
}

export function WalletsPage({ userId }: { userId: string }) {
  const wallets = useWallets(userId);
  return (
    <AccountLayout>
      <h1 className="font-display text-3xl font-bold">Carteiras</h1>
      <p className="mt-2 mb-5 text-sm text-muted-foreground">
        Use somente endereços e dados fictícios.
      </p>
      {wallets.isPending ? (
        <LoadingSkeleton className="h-64" />
      ) : !wallets.data ? (
        <ErrorState
          heading="h2"
          title="Não foi possível consultar as carteiras"
          onRetry={() => void wallets.refetch()}
        />
      ) : (
        <div className="grid gap-5">
          {slots.map((slot) => (
            <WalletSection
              key={slot}
              userId={userId}
              slot={slot}
              wallet={wallets.data.find((wallet) => wallet.slot === slot)}
            />
          ))}
        </div>
      )}
    </AccountLayout>
  );
}
