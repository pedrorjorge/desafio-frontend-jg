import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState, type ChangeEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { ErrorState } from "@/components/common/error-state";
import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useChangePassword,
  useProfile,
  useUpdateProfile,
} from "@/hooks/use-account";
import { passwordSchema, profileSchema } from "@/lib/account-schema";
import { avatarTypes, readAvatar } from "@/lib/avatar";
import type { Profile } from "@/types/api";

import { AccountField, applyApiFormErrors } from "./account-field";
import { AccountLayout } from "./account-sidebar";

const profileFields = [
  "name",
  "email",
  "username",
  "ens",
  "walletNickname",
  "avatarUrl",
] as const;

function ProfileForm({ profile }: { profile: Profile }) {
  const save = useUpdateProfile(profile.id);
  const [reading, setReading] = useState(false);
  const [saved, setSaved] = useState(false);
  const avatarId = useId();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: profile,
  });
  const avatar = useWatch({ control, name: "avatarUrl" });

  async function chooseAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setReading(true);
    setSaved(false);
    try {
      setValue("avatarUrl", await readAvatar(file), { shouldDirty: true });
      clearErrors("avatarUrl");
    } catch {
      setError("avatarUrl", {
        message:
          "Selecione uma imagem válida PNG, JPEG ou WebP de até 512 KiB.",
      });
    } finally {
      setReading(false);
    }
  }

  const submit = handleSubmit(async (values) => {
    setSaved(false);
    try {
      reset(await save.mutateAsync(values));
      setSaved(true);
    } catch (error) {
      applyApiFormErrors(error, [...profileFields], setError);
    }
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <AccountField
          {...register("name")}
          label="Nome de exibição"
          autoComplete="name"
          error={errors.name?.message}
        />
        <AccountField
          {...register("username")}
          label="Nome de usuário"
          autoComplete="username"
          error={errors.username?.message}
        />
        <AccountField
          {...register("email")}
          label="E-mail"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
        />
        <AccountField
          {...register("ens")}
          label="Nome ENS"
          placeholder="exemplo.eth"
          error={errors.ens?.message}
        />
        <AccountField
          {...register("walletNickname")}
          label="Apelido da carteira"
          error={errors.walletNickname?.message}
        />
        <div className="grid gap-2">
          <label htmlFor={avatarId} className="text-sm font-semibold">
            Avatar
          </label>
          <div className="flex items-center gap-3">
            {avatar ? (
              <img
                src={avatar}
                alt="Prévia do avatar"
                width={48}
                height={48}
                className="size-12 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="grid size-12 shrink-0 place-items-center rounded-full bg-surface text-primary"
              >
                {profile.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <input
              id={avatarId}
              type="file"
              accept={avatarTypes.join(",")}
              onChange={(event) => void chooseAvatar(event)}
              disabled={reading || isSubmitting}
              aria-invalid={!!errors.avatarUrl}
              aria-describedby={
                errors.avatarUrl
                  ? `${avatarId}-hint ${avatarId}-error`
                  : `${avatarId}-hint`
              }
              className="min-w-0 w-full text-xs file:mr-2 file:py-2 file:text-primary"
            />
          </div>
          <p id={`${avatarId}-hint`} className="text-xs text-muted-foreground">
            PNG, JPEG ou WebP de até 512 KiB.
          </p>
          {avatar && (
            <Button
              variant="outline"
              className="w-fit"
              disabled={reading || isSubmitting}
              onClick={() => {
                setValue("avatarUrl", null, { shouldDirty: true });
                clearErrors("avatarUrl");
                setSaved(false);
              }}
            >
              Remover avatar
            </Button>
          )}
          {errors.avatarUrl?.message && (
            <p
              id={`${avatarId}-error`}
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.avatarUrl.message}
            </p>
          )}
        </div>
      </div>
      {errors.root?.server?.message && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.server.message}
        </p>
      )}
      <Button
        type="submit"
        disabled={reading || isSubmitting}
        className="justify-self-start"
      >
        {isSubmitting ? "Salvando…" : "Salvar perfil"}
      </Button>
      {saved && (
        <p role="status" className="text-sm text-muted-foreground">
          Perfil atualizado.
        </p>
      )}
    </form>
  );
}

const changeSchema = passwordSchema
  .safeExtend({ confirmation: z.string() })
  .refine((values) => values.confirmation === values.newPassword, {
    path: ["confirmation"],
    message: "A confirmação precisa ser igual à nova senha.",
  });

function PasswordForm({ userId }: { userId: string }) {
  const save = useChangePassword(userId);
  const [saved, setSaved] = useState(false);
  const {
    register,
    reset,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changeSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmation: "" },
  });

  const submit = handleSubmit(async ({ currentPassword, newPassword }) => {
    setSaved(false);
    try {
      await save.mutateAsync({ currentPassword, newPassword });
      reset();
      setSaved(true);
    } catch (error) {
      applyApiFormErrors(error, ["currentPassword", "newPassword"], setError);
    } finally {
      save.reset();
    }
  });

  return (
    <form onSubmit={submit} noValidate className="grid max-w-md gap-4">
      <AccountField
        {...register("currentPassword")}
        label="Senha atual"
        type="password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
      />
      <AccountField
        {...register("newPassword")}
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        error={errors.newPassword?.message}
      />
      <AccountField
        {...register("confirmation")}
        label="Confirmar nova senha"
        type="password"
        autoComplete="new-password"
        error={errors.confirmation?.message}
      />
      {errors.root?.server?.message && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.server.message}
        </p>
      )}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="justify-self-start"
      >
        {isSubmitting ? "Salvando…" : "Salvar senha"}
      </Button>
      {saved && (
        <p role="status" className="text-sm text-muted-foreground">
          Senha atualizada.
        </p>
      )}
    </form>
  );
}

export function ProfilePage({ userId }: { userId: string }) {
  const profile = useProfile(userId);
  return (
    <AccountLayout>
      <h1 className="mb-5 font-display text-3xl font-bold">
        Perfil do colecionador
      </h1>
      {profile.isPending ? (
        <LoadingSkeleton className="h-64" />
      ) : !profile.data ? (
        <ErrorState
          heading="h2"
          title="Não foi possível consultar o perfil"
          onRetry={() => void profile.refetch()}
        />
      ) : (
        <div className="grid gap-5">
          <Card className="p-5 sm:p-6">
            <ProfileForm key={profile.data.id} profile={profile.data} />
          </Card>
          <Card className="gap-4 p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold">Alterar senha</h2>
            <PasswordForm userId={userId} />
          </Card>
        </div>
      )}
    </AccountLayout>
  );
}
