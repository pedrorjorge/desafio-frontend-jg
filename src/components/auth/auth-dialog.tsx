import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { safeReturnTo } from "@/routes/auth-search";

import { AuthForm, type AuthMode } from "./auth-form";

export function AuthDialog({
  initialMode,
  returnTo,
  expired,
  onDismiss,
}: {
  initialMode: AuthMode;
  returnTo?: string;
  expired?: boolean;
  onDismiss: (authenticated?: boolean) => void;
}) {
  const [mode, setMode] = useState(initialMode);
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const navigate = useNavigate();
  const href = useRouterState({ select: (state) => state.location.href });

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  useEffect(() => {
    dialog.current?.querySelector<HTMLInputElement>("input")?.focus();
  }, [mode]);

  function dismiss(authenticated = false) {
    dialog.current?.close();
    onDismiss(authenticated);
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) dismiss();
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto overscroll-contain rounded-panel border border-border border-b-primary bg-card p-6 text-foreground backdrop:bg-black/65 sm:p-8"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 id={titleId} className="font-display text-2xl font-bold">
          {mode === "login" ? "Entrar" : "Criar conta"}
        </h2>
        <Button variant="outline" disabled={busy} onClick={() => dismiss()}>
          Fechar
        </Button>
      </div>
      {expired && (
        <p role="status" className="mb-4 text-sm text-muted-foreground">
          Sua sessão expirou. Entre para retomar o fluxo.
        </p>
      )}
      <AuthForm
        key={mode}
        mode={mode}
        onBusy={setBusy}
        onAuthenticated={async () => {
          const destination = safeReturnTo(returnTo);
          dismiss(true);
          if (destination && destination !== href)
            await navigate({ href: destination, replace: true });
        }}
      />
      <div className="mt-4 text-center text-sm">
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Criar conta" : "Já tenho conta"}
        </Button>
      </div>
    </dialog>
  );
}
