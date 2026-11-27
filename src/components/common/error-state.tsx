import { Button } from "@/components/ui/button";

import { EmptyState } from "./empty-state";

export function ErrorState({
  title = "Não foi possível abrir a página",
  description,
  onRetry,
  heading,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  heading?: "h1" | "h2" | "h3";
}) {
  return (
    <div role="alert">
      <EmptyState title={title} description={description} heading={heading}>
        {onRetry && (
          <Button className="self-start" onClick={onRetry}>
            Tentar novamente
          </Button>
        )}
      </EmptyState>
    </div>
  );
}
