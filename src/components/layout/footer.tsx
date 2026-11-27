import { Link } from "@tanstack/react-router";

import { AuthEntry } from "@/components/auth/auth-entry";

import { Container } from "./container";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <Container className="grid gap-6 py-6 sm:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Link
            to="/"
            className="inline-block font-display text-lg font-bold tracking-[0.2em] hover:text-primary"
          >
            KURIO
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Marketplace de arte digital
          </p>
        </div>
        <nav
          aria-label="Marketplace"
          className="grid content-start gap-2 text-sm text-muted-foreground"
        >
          <p className="font-semibold text-foreground">Marketplace</p>
          <Link to="/" hash="catalogo" className="w-fit hover:text-primary">
            Catálogo de NFTs
          </Link>
          <Link to="/cart" className="w-fit hover:text-primary">
            Carrinho
          </Link>
        </nav>
        <nav
          aria-label="Conta do colecionador"
          className="grid content-start gap-2 text-sm text-muted-foreground"
        >
          <p className="font-semibold text-foreground">Minha conta</p>
          <AuthEntry mode="register" className="w-fit hover:text-primary">
            Criar conta
          </AuthEntry>
          <AuthEntry
            privateTo="/account/wallets"
            className="w-fit hover:text-primary"
          >
            Carteiras
          </AuthEntry>
          <AuthEntry
            privateTo="/favorites"
            className="w-fit hover:text-primary"
          >
            Favoritos
          </AuthEntry>
        </nav>
      </Container>
    </footer>
  );
}
