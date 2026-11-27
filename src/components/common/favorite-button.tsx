import { AuthEntry } from "@/components/auth/auth-entry";
import { Button } from "@/components/ui/button";
import { useFavorites, useToggleFavorite } from "@/hooks/use-favorites";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { readApiError } from "@/services/auth";

type FavoriteButtonProps = {
  nftId: string;
  name: string;
  compact?: boolean;
  showError?: boolean;
};
const compactStyle =
  "grid size-control min-h-control place-items-center rounded-panel border border-input bg-card px-0 text-lg text-foreground hover:border-ring";

export function FavoriteButton(props: FavoriteButtonProps) {
  const session = useSession();
  if (session.data)
    return (
      <UserFavoriteButton
        key={session.data.user.id}
        userId={session.data.user.id}
        {...props}
      />
    );
  if (session.isPending) return null;

  const label = `Entre para favoritar ${props.name}`;
  return (
    <AuthEntry
      className={
        props.compact
          ? compactStyle
          : "inline-flex min-h-control items-center justify-center rounded-control border border-input px-4 text-sm font-semibold hover:bg-surface"
      }
    >
      {props.compact ? (
        <>
          <span aria-hidden="true">♡</span>
          <span className="sr-only">{label}</span>
        </>
      ) : (
        "Entrar para favoritar"
      )}
    </AuthEntry>
  );
}

function UserFavoriteButton({
  nftId,
  name,
  compact,
  showError = true,
  userId,
}: FavoriteButtonProps & { userId: string }) {
  const favorites = useFavorites(userId);
  const action = useToggleFavorite(userId);
  const selected = favorites.data?.nftIds.includes(nftId) ?? false;
  const problem =
    readApiError(action.error)?.message ??
    (action.error ? "Não foi possível atualizar favoritos." : undefined);

  if (favorites.isError && !favorites.data) {
    return (
      <Button
        variant="outline"
        className={cn(compact && compactStyle)}
        aria-label="Tentar carregar favoritos novamente"
        onClick={() => void favorites.refetch()}
      >
        {compact ? "↻" : "Tentar carregar favoritos"}
      </Button>
    );
  }

  return (
    <div className="grid gap-1">
      <Button
        variant="outline"
        className={cn(
          compact && compactStyle,
          selected && "border-primary text-primary",
        )}
        aria-label={`Favorito: ${name}`}
        title={selected ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        aria-pressed={selected}
        disabled={!favorites.data || action.pending}
        onClick={() => action.toggle(nftId)}
      >
        {compact
          ? selected
            ? "♥"
            : "♡"
          : selected
            ? "Favoritado"
            : "Favoritar"}
      </Button>
      {showError && problem && (
        <p
          role="alert"
          className={cn(
            "rounded-control border border-border bg-card p-2 text-xs text-destructive",
            compact && "absolute top-full right-0 z-10 mt-1 w-40",
          )}
        >
          {problem}
        </p>
      )}
    </div>
  );
}
