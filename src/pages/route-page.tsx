import { Card } from "@/components/ui/card";

type RoutePageProps = {
  title: string;
  description?: string;
};

export function RoutePage({ title, description }: RoutePageProps) {
  return (
    <Card className="w-full px-6">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      {description && (
        <p className="wrap-break-word text-muted-foreground">{description}</p>
      )}
    </Card>
  );
}
