import { Link, useRouterState } from "@tanstack/react-router";
import { useRef, useState, type MouseEvent, type ReactNode } from "react";

import { useSession } from "@/hooks/use-session";
import { safeReturnTo } from "@/routes/auth-search";

import { AuthDialog } from "./auth-dialog";
import type { AuthMode } from "./auth-form";

function opensDialog(event: MouseEvent<HTMLAnchorElement>) {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.shiftKey &&
    window.matchMedia("(min-width: 48rem)").matches
  );
}

export function AuthEntry({
  mode = "login",
  privateTo,
  className,
  children,
}: {
  mode?: AuthMode;
  privateTo?:
    | "/account/profile"
    | "/account/wallets"
    | "/favorites"
    | "/checkout";
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLAnchorElement>(null);
  const session = useSession();
  const href = useRouterState({ select: (state) => state.location.href });
  const returnTo = privateTo ?? safeReturnTo(href);

  function closeDialog() {
    setOpen(false);
    requestAnimationFrame(() => {
      const target = trigger.current?.isConnected
        ? trigger.current
        : document.getElementById("main-content");
      target?.focus();
    });
  }

  return (
    <>
      {privateTo ? (
        <Link
          ref={trigger}
          to={privateTo}
          className={className}
          onClick={(event) => {
            if (session.data === null && opensDialog(event)) {
              event.preventDefault();
              setOpen(true);
            }
          }}
        >
          {children}
        </Link>
      ) : (
        <Link
          ref={trigger}
          to={mode === "login" ? "/login" : "/register"}
          search={{ returnTo }}
          className={className}
          onClick={(event) => {
            if (opensDialog(event)) {
              event.preventDefault();
              setOpen(true);
            }
          }}
        >
          {children}
        </Link>
      )}
      {open && (
        <AuthDialog
          initialMode={mode}
          returnTo={returnTo}
          onDismiss={closeDialog}
        />
      )}
    </>
  );
}
