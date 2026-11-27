import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { Container } from "./container";
import { Footer } from "./footer";
import { Header } from "./header";
import { MobileNavigation } from "./mobile-navigation";

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({
    select: (state) => state.resolvedLocation?.pathname,
  });
  const previousPath = useRef(pathname);

  useEffect(() => {
    const previous = previousPath.current;
    previousPath.current = pathname;
    if (previous === undefined || !pathname || previous === pathname) return;
    const hash = window.location.hash.slice(1);
    const target = hash ? document.getElementById(hash) : null;
    (target ?? document.getElementById("main-content"))?.focus({
      preventScroll: true,
    });
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col pb-[var(--navigation-clearance)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:bg-primary focus:p-3 focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      <Header />
      <main
        id="main-content"
        tabIndex={-1}
        className="min-w-0 flex-1 py-[clamp(1.5rem,3vw,2.5rem)]"
      >
        <Container>{children}</Container>
      </main>
      <Footer />
      <MobileNavigation />
    </div>
  );
}
