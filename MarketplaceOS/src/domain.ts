export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "marketplace_admin" | "seller" | "buyer" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft" | "deleted";
export type ListingStatus = "draft" | "submitted" | "under_review" | "approved" | "published" | "rejected" | "suspended" | "deprecated" | "archived";
export type OrderStatus = "pending" | "processing" | "completed" | "cancelled" | "refunded" | "failed";
export type PayoutStatus = "pending" | "approved" | "scheduled" | "paid" | "failed" | "on_hold" | "disputed" | "cancelled";
export type SellerStatus = "applied" | "under_review" | "approved" | "active" | "suspended" | "rejected" | "archived";
export type ReviewStatus = "pending" | "approved" | "rejected" | "flagged" | "deleted";

export interface RequestActor {
  tenantId: TenantId;
  userId: UUID;
  role: Role;
}

export interface BaseEntity {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface MarketplaceCategory extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  parentId?: UUID;
  status: EntityStatus;
  sortOrder: number;
  icon?: string;
  metadata: Record<string, unknown>;
}

export interface MarketplaceListing extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  categoryId?: UUID;
  sellerId: UUID;
  status: ListingStatus;
  type: "module" | "tool" | "template" | "workflow" | "agent" | "connector" | "plugin" | "theme" | "api" | "dataset" | "prompt" | "service" | "micro-erp" | "other";
  tags: string[];
  pricing: {
    type: "free" | "one_time" | "subscription" | "credit" | "usage" | "enterprise";
    amount?: number;
    currency?: string;
    interval?: "monthly" | "yearly" | "lifetime";
  };
  compatibility?: {
    minVersion?: string;
    requiredOs?: string[];
    dependencies?: string[];
  };
  media: Array<{ type: "screenshot" | "video" | "demo"; url: string; caption?: string }>;
  version: string;
  license: "free" | "personal" | "team" | "enterprise" | "commercial" | "open_source" | "marketplace_paid";
  supportPolicy?: string;
  refundPolicy?: string;
  installInstructions?: string;
  rating?: number;
  reviewCount?: number;
  installCount: number;
  purchaseCount: number;
  isFeatured: boolean;
  isTrending: boolean;
  metadata: Record<string, unknown>;
}

export interface MarketplaceSeller extends BaseEntity {
  key: string;
  name: string;
  email: string;
  status: SellerStatus;
  type: "internal" | "partner" | "agency" | "developer" | "trainer" | "consultant" | "vendor" | "community";
  website?: string;
  logo?: string;
  bio?: string;
  totalRevenue: number;
  totalPayouts: number;
  pendingPayouts: number;
  rating: number;
  reviewCount: number;
  listingCount: number;
  verified: boolean;
  payoutMethod?: {
    type: "bank" | "paypal" | "stripe";
    last4?: string;
    email?: string;
  };
  commission: {
    rate: number;
    minAmount: number;
  };
  metadata: Record<string, unknown>;
}

export interface MarketplaceBuyer extends BaseEntity {
  userId: UUID;
  email: string;
  name: string;
  organization?: string;
  purchaseCount: number;
  totalSpent: number;
  licenseCount: number;
  wishlist: UUID[];
  metadata: Record<string, unknown>;
}

export interface MarketplaceOrder extends BaseEntity {
  orderNumber: string;
  buyerId: UUID;
  listingId: UUID;
  sellerId: UUID;
  status: OrderStatus;
  pricing: {
    type: "free" | "one_time" | "subscription" | "credit" | "usage" | "enterprise";
    amount: number;
    currency: string;
    interval?: "monthly" | "yearly" | "lifetime";
  };
  quantity: number;
  subtotal: number;
  platformFee: number;
  sellerPayout: number;
  tax?: number;
  total: number;
  couponId?: UUID;
  discount?: number;
  invoiceId?: UUID;
  paymentId?: UUID;
  completedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface MarketplaceLicense extends BaseEntity {
  licenseKey: string;
  orderId: UUID;
  listingId: UUID;
  buyerId: UUID;
  sellerId: UUID;
  status: EntityStatus;
  type: "free" | "trial" | "personal" | "team" | "tenant_wide" | "enterprise" | "commercial" | "internal" | "open_source" | "marketplace_paid";
  validUntil?: ISODate;
  seats?: number;
  features: string[];
  metadata: Record<string, unknown>;
}

export interface MarketplaceInstall extends BaseEntity {
  licenseId: UUID;
  listingId: UUID;
  buyerId: UUID;
  tenantId: TenantId;
  status: EntityStatus;
  version: string;
  installedAt: ISODate;
  lastUsedAt?: ISODate;
  config: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface MarketplaceReview extends BaseEntity {
  listingId: UUID;
  buyerId: UUID;
  orderId: UUID;
  rating: number;
  title?: string;
  content?: string;
  status: ReviewStatus;
  verified: boolean;
  helpful: number;
  sellerReply?: {
    content: string;
    repliedAt: ISODate;
  };
  pros?: string[];
  cons?: string[];
  version: string;
  metadata: Record<string, unknown>;
}

export interface MarketplacePayout extends BaseEntity {
  payoutNumber: string;
  sellerId: UUID;
  amount: number;
  currency: string;
  status: PayoutStatus;
  method?: "bank_transfer" | "paypal" | "stripe" | "other";
  reference?: string;
  orders: Array<{
    orderId: UUID;
    orderNumber: string;
    amount: number;
    commission: number;
    netAmount: number;
  }>;
  fees: number;
  tax?: number;
  totalAmount: number;
  scheduledAt?: ISODate;
  paidAt?: ISODate;
  failureReason?: string;
  metadata: Record<string, unknown>;
}

export interface MarketplaceCommission extends BaseEntity {
  sellerId: UUID;
  listingId?: UUID;
  rate: number;
  type: "standard" | "tiered" | "category" | "promotional";
  minAmount: number;
  maxAmount?: number;
  validFrom: ISODate;
  validUntil?: ISODate;
  conditions?: {
    minRevenue?: number;
    tier?: number;
    category?: UUID;
  };
  metadata: Record<string, unknown>;
}

export interface MarketplaceBundle extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  sellerId: UUID;
  status: EntityStatus;
  listings: Array<{
    listingId: UUID;
    discount: number;
  }>;
  pricing: {
    type: "one_time" | "subscription";
    amount: number;
    currency: string;
    interval?: "monthly" | "yearly" | "lifetime";
    savings?: number;
  };
  totalValue: number;
  installCount: number;
  purchaseCount: number;
  metadata: Record<string, unknown>;
}

export interface MarketplaceCart extends BaseEntity {
  buyerId: UUID;
  items: Array<{
    listingId: UUID;
    quantity: number;
    addedAt: ISODate;
  }>;
  couponCode?: string;
  discount?: number;
  metadata: Record<string, unknown>;
}

export interface MarketplaceEvent extends BaseEntity {
  type: string;
  source: string;
  data: Record<string, unknown>;
  correlationId?: UUID;
}

export interface AuditLog extends BaseEntity {
  actorId: UUID;
  role: Role;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
}

export interface MarketplaceOverview {
  listings: { total: number; active: number; pending: number };
  sellers: { total: number; active: number };
  buyers: { total: number; purchases: number };
  orders: { total: number; completed: number; pending: number; revenue: number; refunds: number };
  reviews: { total: number; averageRating: number };
  payouts: { total: number; paid: number; pending: number };
  installs: { total: number; active: number };
  revenue: { total: number; platform: number; seller: number };
}

export interface MarketplaceState {
  categories: MarketplaceCategory[];
  listings: MarketplaceListing[];
  sellers: MarketplaceSeller[];
  buyers: MarketplaceBuyer[];
  orders: MarketplaceOrder[];
  licenses: MarketplaceLicense[];
  installs: MarketplaceInstall[];
  reviews: MarketplaceReview[];
  payouts: MarketplacePayout[];
  commissions: MarketplaceCommission[];
  bundles: MarketplaceBundle[];
  carts: MarketplaceCart[];
  events: MarketplaceEvent[];
  auditLogs: AuditLog[];
}
