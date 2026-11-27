export type EthAmount = string;
export const catalogCategories = ["retratos", "abstrato", "paisagens"] as const;
export type NftCategory = (typeof catalogCategories)[number];
export const catalogSorts = [
  "featured",
  "price-asc",
  "price-desc",
  "name",
] as const;
export type CatalogSort = (typeof catalogSorts)[number];

export interface NftEdition {
  id: string;
  name: string;
  price: EthAmount;
  available: number;
}

export interface Nft {
  id: string;
  name: string;
  description: string;
  image: { src: string; alt: string };
  category: NftCategory;
  featured: boolean;
  version: number;
  editions: NftEdition[];
}

export type NftGalleryImage = Nft["image"] & {
  id: string;
  label: string;
  framing: "full" | "detail";
};

export interface NftDetail extends Nft {
  collection: { id: string; name: string; description: string };
  gallery: [NftGalleryImage, ...NftGalleryImage[]];
}

export interface CatalogParams {
  q?: string;
  category?: NftCategory[];
  minPrice?: EthAmount;
  maxPrice?: EthAmount;
  available?: boolean;
  featured?: boolean;
  sort?: CatalogSort;
  page?: number;
  pageSize?: number;
}

export interface CatalogItem extends Nft {
  listingPrice: EthAmount;
}

export interface CatalogPage {
  items: CatalogItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Session {
  id: string;
  user: User;
  expiresAt: string;
  expiresInMs: number;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterInput extends Credentials {
  name: string;
}

export interface Profile extends User {
  avatarUrl: string | null;
  username: string;
  ens: string;
  walletNickname: string;
}

export type ProfileInput = Omit<Profile, "id">;

export interface PasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface Favorites {
  nftIds: string[];
}

export interface CartItemInput {
  nftId: string;
  editionId: string;
  quantity: number;
}

export interface CartItem extends CartItemInput {
  id: string;
  name: string;
  editionName: string;
  image: Nft["image"];
  price: EthAmount;
  lineTotal: EthAmount;
  priceChanged: boolean;
  available: number;
}

export interface CartMergeConflict {
  nftId: string;
  nftName: string;
  editionId: string;
  editionName: string;
  requested: number;
  accepted: number;
}

export interface Cart {
  version: number;
  mergeConflicts: CartMergeConflict[];
  items: CartItem[];
  couponCode: string | null;
}

export interface Coupon {
  code: string;
  active: boolean;
  discountPercent: number;
  expiresAt: string;
}

export interface QuoteTotals {
  subtotal: EthAmount;
  discount: EthAmount;
  networkFee: EthAmount;
  total: EthAmount;
}

export interface Quote extends QuoteTotals {
  id: string;
  version: number;
  expiresInMs: number;
  items: CartItem[];
  couponCode: string | null;
  expiresAt: string;
}

export const walletNetworks = ["ethereum", "polygon"] as const;
export type WalletNetwork = (typeof walletNetworks)[number];
export type WalletSlot = "primary" | "secondary";

export const walletTypes = ["browser", "mobile", "hardware"] as const;

export interface WalletInput {
  slot: WalletSlot;
  name: string;
  displayName: string;
  network: WalletNetwork;
  profileName: string;
  address: string;
  secondaryReference: string;
  walletType: (typeof walletTypes)[number];
  referralCode: string;
  email: string;
  ens: string;
}

export interface Wallet extends WalletInput {
  id: string;
}

export interface OrderInput {
  quoteId: string;
  walletId: string;
  network: WalletNetwork;
  collector: { name: string; email: string };
}

export type OrderStatus = "pending" | "confirmed" | "declined";

export interface Receipt extends QuoteTotals {
  orderId: string;
  items: CartItem[];
  couponCode: string | null;
  collector: OrderInput["collector"];
  wallet: Wallet;
  network: WalletNetwork;
  transactionId: string;
  explorerUrl: string;
  confirmedAt: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  version: number;
  createdAt: string;
  receipt: Receipt | null;
}

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_CREDENTIALS"
  | "SESSION_REQUIRED"
  | "SESSION_EXPIRED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "STOCK_CONFLICT"
  | "INVALID_COUPON"
  | "EXPIRED_COUPON"
  | "STALE_QUOTE"
  | "IDEMPOTENCY_CONFLICT"
  | "UNAVAILABLE";

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  fields?: Record<string, string>;
}

interface VersionedEvent<Resource> {
  id: string;
  resourceId: string;
  version: number;
  resource: Resource;
}

export interface RealtimeEvents {
  "nft.updated": VersionedEvent<Nft>;
  "order.updated": VersionedEvent<Order> & {
    session: { userId: string; sessionId: string };
  };
  "mock.probe": VersionedEvent<Nft>;
}
