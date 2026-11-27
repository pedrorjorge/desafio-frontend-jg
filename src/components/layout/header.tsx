import { Link } from "@tanstack/react-router";

import { AuthEntry } from "@/components/auth/auth-entry";
import { SessionAction } from "@/components/auth/session-action";

import { Container } from "./container";

export function Header() {
  return (
    <header className="border-b border-border pt-[env(safe-area-inset-top)]">
      <Container className="flex min-h-16 items-center justify-between gap-3 md:min-h-18">
        <Link
          to="/"
          className="font-display text-2xl font-bold tracking-[0.2em]"
        >
          KURIO
        </Link>
        <nav
          aria-label="Navegação principal"
          className="hidden flex-wrap items-center justify-end gap-x-5 gap-y-2 py-2 text-sm md:flex"
        >
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="border-b-2 border-transparent py-3 hover:text-primary data-[status=active]:border-primary data-[status=active]:text-primary"
          >
            Início
          </Link>
          <Link
            to="/cart"
            className="border-b-2 border-transparent py-3 hover:text-primary data-[status=active]:border-primary data-[status=active]:text-primary"
          >
            Carrinho
          </Link>
          <AuthEntry
            privateTo="/account/profile"
            className="border-b-2 border-transparent py-3 hover:text-primary data-[status=active]:border-primary data-[status=active]:text-primary"
          >
            Perfil
          </AuthEntry>
          <SessionAction className="inline-flex min-h-control items-center rounded-control bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary-hover" />
        </nav>
      </Container>
    </header>
  );
}
