import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { useAuthenticate } from "@/hooks/use-session";
import { readApiError } from "@/services/auth";

export type AuthMode = "login" | "register";

const name = z.string().trim().max(100);
const credentials = z.object({
  name,
  email: z.string().trim().max(254).pipe(z.email("Informe um e-mail válido.")),
  password: z.string().min(8, "Informe ao menos oito caracteres.").max(128),
});
const registration = credentials.extend({
  name: name.min(2, "Informe ao menos dois caracteres."),
});

export function AuthForm({
  mode,
  onAuthenticated,
  onBusy,
}: {
  mode: AuthMode;
  onAuthenticated: () => void | Promise<void>;
  onBusy?: (busy: boolean) => void;
}) {
  const isRegistration = mode === "register";
  const prefix = useId();
  const authenticate = useAuthenticate();
  const {
    register,
    handleSubmit,
    setError,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(isRegistration ? registration : credentials),
    defaultValues: { name: "", email: "", password: "" },
  });

  const fields = [
    ...(isRegistration
      ? [
          {
            name: "name",
            label: "Nome",
            type: "text",
            autoComplete: "name",
            maxLength: 100,
          } as const,
        ]
      : []),
    {
      name: "email",
      label: "E-mail",
      type: "email",
      autoComplete: "email",
      maxLength: 254,
    },
    {
      name: "password",
      label: "Senha",
      type: "password",
      autoComplete: isRegistration ? "new-password" : "current-password",
      maxLength: 128,
    },
  ] as const;

  const submit = handleSubmit(async ({ name, email, password }) => {
    onBusy?.(true);
    try {
      await authenticate.mutateAsync(
        isRegistration ? { name, email, password } : { email, password },
      );
    } catch (error) {
      const problem = readApiError(error);
      let hasFieldError = false;
      for (const { name } of fields) {
        const message = problem?.fields?.[name];
        if (message) {
          setError(
            name,
            { type: "server", message },
            { shouldFocus: !hasFieldError },
          );
          hasFieldError = true;
        }
      }
      if (!hasFieldError) {
        setError("root.server", {
          message:
            problem?.message || "Não foi possível conectar. Tente novamente.",
        });
      }
      return;
    } finally {
      authenticate.reset();
      onBusy?.(false);
    }
    resetField("password");
    await onAuthenticated();
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      {fields.map(({ name, label, type, autoComplete, maxLength }) => {
        const id = `${prefix}-${name}`;
        const error = errors[name]?.message;
        return (
          <div key={name} className="grid gap-1.5">
            <label htmlFor={id} className="text-sm font-semibold">
              {label}
            </label>
            <input
              {...register(name)}
              id={id}
              type={type}
              autoComplete={autoComplete}
              maxLength={maxLength}
              required
              aria-invalid={!!error}
              aria-describedby={error ? `${id}-error` : undefined}
              className="w-full aria-invalid:border-destructive"
            />
            {error && (
              <p
                id={`${id}-error`}
                role="alert"
                className="text-sm text-destructive"
              >
                {error}
              </p>
            )}
          </div>
        );
      })}
      {errors.root?.server?.message && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.server.message}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
        {isSubmitting ? "Aguarde…" : isRegistration ? "Criar conta" : "Entrar"}
      </Button>
    </form>
  );
}
