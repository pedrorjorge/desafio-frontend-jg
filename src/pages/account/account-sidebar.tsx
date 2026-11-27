import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { SessionAction } from "@/components/auth/session-action";

const items = [
  { to: "/account/profile", label: "Dados do perfil" },
  { to: "/account/wallets", label: "Carteiras" },
  { to: "/favorites", label: "Favoritos" },
] as const;

export function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8">
      <aside className="h-fit rounded-panel border border-border bg-card p-4">
        <p className="mb-2 font-display text-lg font-bold">Meu perfil</p>
        <nav
          aria-label="Conta do colecionador"
          className="flex flex-wrap gap-1 lg:grid"
        >
          {items.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: true }}
              className="rounded-control border-l-2 border-transparent px-2 py-2 text-sm text-muted-foreground hover:text-primary data-[status=active]:border-primary data-[status=active]:bg-surface data-[status=active]:text-primary"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-3">
          <SessionAction className="bg-transparent px-2 text-primary enabled:hover:bg-surface" />
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
