import { cn } from "@/lib/utils";

export function LoadingSkeleton({
  label = "Carregando…",
  className,
  announce = true,
}: {
  label?: string;
  className?: string;
  announce?: boolean;
}) {
  const shape = (
    <div
      aria-hidden="true"
      className={cn("skeleton-shimmer h-5 w-full rounded-control", className)}
    />
  );
  if (!announce) return shape;

  return (
    <div role="status">
      <span className="sr-only">{label}</span>
      {shape}
    </div>
  );
}
