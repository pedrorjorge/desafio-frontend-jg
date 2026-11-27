import { Link } from "@tanstack/react-router";

import { AuthEntry } from "@/components/auth/auth-entry";
import { SessionAction } from "@/components/auth/session-action";

const destinations = [
  { to: "/", label: "Início" },
  { to: "/cart", label: "Carrinho" },
] as const;

export function MobileNavigation() {
  return (
    <nav
      aria-label="Navegação principal"
      className="mobile-navigation fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid min-h-mobile-nav grid-cols-[repeat(4,minmax(0,1fr))] px-2">
        {destinations.map(({ to, label }) => (
          <li key={to} className="flex">
            <Link
              to={to}
              activeOptions={{ exact: true }}
              className="grid w-full place-items-center rounded-control border-t-2 border-transparent px-1 text-center text-sm text-muted-foreground outline-offset-[-4px] hover:text-primary data-[status=active]:border-primary data-[status=active]:font-semibold data-[status=active]:text-primary"
            >
              {label}
            </Link>
          </li>
        ))}
        <li className="flex">
          <AuthEntry
            privateTo="/account/profile"
            className="grid w-full place-items-center rounded-control border-t-2 border-transparent px-1 text-center text-sm text-muted-foreground outline-offset-[-4px] data-[status=active]:border-primary data-[status=active]:font-semibold data-[status=active]:text-primary"
          >
            Perfil
          </AuthEntry>
        </li>
        <li className="grid place-items-center">
          <SessionAction className="grid min-h-control max-w-full place-items-center px-1 text-center text-sm" />
        </li>
      </ul>
    </nav>
  );
}
