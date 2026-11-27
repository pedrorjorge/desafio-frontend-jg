import { Link, useNavigate } from "@tanstack/react-router";

import { AuthForm, type AuthMode } from "@/components/auth/auth-form";
import { Card } from "@/components/ui/card";
import { safeReturnTo } from "@/routes/auth-search";

export function AuthPage({
  mode,
  returnTo,
  expired,
}: {
  mode: AuthMode;
  returnTo?: string;
  expired?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <Card className="mx-auto w-full max-w-md gap-5 p-6 sm:p-8">
      <h1 className="text-center font-display text-3xl font-bold">
        {mode === "login" ? "Entrar" : "Criar conta"}
      </h1>
      {expired && (
        <p role="status" className="text-sm text-muted-foreground">
          Sua sessão expirou. Entre para retomar o fluxo.
        </p>
      )}
      <AuthForm
        key={mode}
        mode={mode}
        onAuthenticated={() =>
          navigate({ href: safeReturnTo(returnTo) ?? "/", replace: true })
        }
      />
      <Link
        to={mode === "login" ? "/register" : "/login"}
        search={{ returnTo, expired: expired ? true : undefined }}
        className="mx-auto text-sm font-semibold text-primary underline"
      >
        {mode === "login" ? "Criar conta" : "Já tenho conta"}
      </Link>
    </Card>
  );
}
