const privatePaths = new Set([
  "/checkout",
  "/account/profile",
  "/account/wallets",
  "/favorites",
]);
const orderPath = /^\/orders\/[a-z\d_~-][a-z\d._~-]{0,119}\/?$/i;
const nftPath = /^\/nfts\/[a-z\d_~-][a-z\d._~-]{0,119}\/?$/i;

export function isPrivatePath(pathname: string) {
  return (
    privatePaths.has(pathname.replace(/\/$/, "")) || orderPath.test(pathname)
  );
}

export function safeReturnTo(value: unknown) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    Array.from(value).some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    })
  )
    return undefined;
  const base = new URL("https://kurio.example");
  const target = new URL(value, base);
  const path = value.split(/[?#]/, 1)[0];

  if (target.origin !== base.origin || target.pathname !== path)
    return undefined;
  if (
    isPrivatePath(path) ||
    nftPath.test(path) ||
    path === "/" ||
    path === "/cart" ||
    path === "/cart/"
  ) {
    return target.pathname + target.search + target.hash;
  }

  return undefined;
}

export function validateAuthSearch(raw: Record<string, unknown>): {
  returnTo?: string;
  expired?: true;
} {
  return {
    returnTo: safeReturnTo(raw.returnTo),
    expired: raw.expired === true ? true : undefined,
  };
}
