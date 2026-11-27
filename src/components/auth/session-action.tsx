import { useNavigate, useRouterState } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { useLogout, useSession } from "@/hooks/use-session";
import { isPrivatePath } from "@/routes/auth-search";
import { readApiError } from "@/services/auth";

import { AuthEntry } from "./auth-entry";

export function SessionAction({ className }: { className?: string }) {
  const session = useSession();
  const leave = useLogout();
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  if (session.isPending) return null;
  if (!session.data) return <AuthEntry className={className}>Entrar</AuthEntry>;

  return (
    <div className="relative">
      <Button
        className={className}
        disabled={leave.isPending}
        onClick={() => {
          leave.mutate(undefined, {
            onSuccess: () => {
              if (isPrivatePath(pathname))
                void navigate({ to: "/", replace: true });
            },
          });
        }}
      >
        {leave.isPending ? "Saindo…" : "Sair"}
      </Button>
      {leave.isError && (
        <p
          role="alert"
          className="absolute right-0 bottom-full z-10 mb-1 w-48 rounded-control border border-border bg-card p-2 text-sm text-destructive md:top-full md:bottom-auto md:mt-1"
        >
          {readApiError(leave.error)?.message ??
            "Não foi possível sair. Tente novamente."}
        </p>
      )}
    </div>
  );
}
