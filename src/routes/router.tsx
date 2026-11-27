import { useQuery } from "@tanstack/react-query";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Navigate,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";

import { AuthDialog } from "@/components/auth/auth-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import { RealtimeConnection } from "@/components/layout/realtime-connection";
import { AppLayout } from "@/components/layout/app-layout";
import { useSession } from "@/hooks/use-session";
import { queryClient } from "@/lib/query-client";
import { isExpired, sessionKey, sessionQuery } from "@/lib/session";
import { FavoritesPage } from "@/pages/account/favorites-page";
import { ProfilePage } from "@/pages/account/profile-page";
import { WalletsPage } from "@/pages/account/wallets-page";
import { AuthPage } from "@/pages/auth/auth-page";
import { CheckoutPage } from "@/pages/checkout/checkout-page";
import { OrderStatusPage } from "@/pages/checkout/order-page";
import { CartPage } from "@/pages/cart/cart-page";
import { HomePage } from "@/pages/home-page";
import { NftDetailPage } from "@/pages/nft-detail-page";

import type { Session } from "@/types/api";

import { safeReturnTo, validateAuthSearch } from "./auth-search";
import { validateCatalogSearch } from "./catalog-search";

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => (
    <EmptyState title="Página não encontrada">
      <Link to="/" className="w-fit text-primary underline">
        Voltar ao início
      </Link>
    </EmptyState>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: validateCatalogSearch,
  component: HomeRoute,
});

const nftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/nfts/$nftId",
  component: NftPage,
});

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cart",
  component: CartPage,
});

const privateRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_private",
  beforeLoad: async ({ location }) => {
    const previous = queryClient.getQueryData<Session | null>(sessionKey);
    const session = await queryClient.fetchQuery(sessionQuery);
    if (!session) {
      throw redirect({
        to: "/login",
        search: {
          returnTo: safeReturnTo(location.href),
          expired: previous ? true : undefined,
        },
        replace: true,
      });
    }
  },
  component: PrivateLayout,
  errorComponent: PrivateLoadError,
});

const checkoutRoute = createRoute({
  getParentRoute: () => privateRoute,
  path: "/checkout",
  component: CheckoutRoute,
});

const orderRoute = createRoute({
  getParentRoute: () => privateRoute,
  path: "/orders/$orderId",
  component: OrderPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: validateAuthSearch,
  component: LoginRoute,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  validateSearch: validateAuthSearch,
  component: RegisterRoute,
});

const profileRoute = createRoute({
  getParentRoute: () => privateRoute,
  path: "/account/profile",
  component: ProfileRoute,
});

const walletsRoute = createRoute({
  getParentRoute: () => privateRoute,
  path: "/account/wallets",
  component: WalletsRoute,
});

const favoritesRoute = createRoute({
  getParentRoute: () => privateRoute,
  path: "/favorites",
  component: FavoritesRoute,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  nftRoute,
  cartRoute,
  loginRoute,
  registerRoute,
  privateRoute.addChildren([
    checkoutRoute,
    orderRoute,
    profileRoute,
    walletsRoute,
    favoritesRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  notFoundMode: "root",
  defaultPendingComponent: () => (
    <LoadingSkeleton className="h-36 rounded-panel" />
  ),
  defaultErrorComponent: ({ reset }) => <ErrorState onRetry={() => reset()} />,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function RootLayout() {
  return (
    <AppLayout>
      <SessionObserver />
      <RealtimeConnection />
      <Outlet />
    </AppLayout>
  );
}

function SessionObserver() {
  useQuery(sessionQuery);
  return null;
}

function PrivateLoadError() {
  return (
    <ErrorState
      title="Não foi possível verificar a sessão"
      onRetry={() => void router.invalidate()}
    />
  );
}

function PrivateLayout() {
  const session = useSession();
  const href = useRouterState({ select: (state) => state.location.href });
  const navigate = useNavigate();
  const returnTo = safeReturnTo(href);
  if (session.data && !isExpired(session.data, session.dataUpdatedAt))
    return <Outlet />;
  if (session.isError)
    return (
      <ErrorState
        title="Não foi possível verificar a sessão"
        onRetry={() => void session.refetch()}
      />
    );
  if (session.isPending || session.isFetching)
    return <LoadingSkeleton label="Verificando sessão…" className="h-32" />;

  return window.matchMedia("(min-width: 48rem)").matches ? (
    <AuthDialog
      initialMode="login"
      returnTo={returnTo}
      expired
      onDismiss={(authenticated) => {
        if (!authenticated) void navigate({ to: "/", replace: true });
      }}
    />
  ) : (
    <Navigate to="/login" search={{ returnTo, expired: true }} replace />
  );
}

function LoginRoute() {
  const search = loginRoute.useSearch();
  return (
    <AuthPage
      mode="login"
      returnTo={search.returnTo}
      expired={search.expired}
    />
  );
}

function RegisterRoute() {
  const search = registerRoute.useSearch();
  return (
    <AuthPage
      mode="register"
      returnTo={search.returnTo}
      expired={search.expired}
    />
  );
}

function ProfileRoute() {
  const { data } = useSession();
  return data ? <ProfilePage key={data.user.id} userId={data.user.id} /> : null;
}

function WalletsRoute() {
  const { data } = useSession();
  return data ? <WalletsPage key={data.user.id} userId={data.user.id} /> : null;
}

function FavoritesRoute() {
  const { data } = useSession();
  return data ? (
    <FavoritesPage key={data.user.id} userId={data.user.id} />
  ) : null;
}

function HomeRoute() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  return (
    <HomePage
      search={search}
      onSearchChange={(next) => {
        void navigate({ search: next, resetScroll: false });
      }}
    />
  );
}

function NftPage() {
  const { nftId } = nftRoute.useParams();
  return <NftDetailPage key={nftId} nftId={nftId} />;
}

function CheckoutRoute() {
  const { data } = useSession();
  return data ? <CheckoutPage key={data.user.id} session={data} /> : null;
}

function OrderPage() {
  const { orderId } = orderRoute.useParams();
  const { data } = useSession();
  return data ? (
    <OrderStatusPage
      key={`${data.user.id}:${orderId}`}
      userId={data.user.id}
      orderId={orderId}
    />
  ) : null;
}
