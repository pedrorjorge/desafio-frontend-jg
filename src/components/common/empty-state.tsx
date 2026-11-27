import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  children,
  heading: Heading = "h1",
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  heading?: "h1" | "h2" | "h3";
}) {
  return (
    <Card className="gap-3 p-6">
      <Heading className="font-display text-2xl font-bold">{title}</Heading>
      {description && <p className="text-muted-foreground">{description}</p>}
      {children}
    </Card>
  );
}
