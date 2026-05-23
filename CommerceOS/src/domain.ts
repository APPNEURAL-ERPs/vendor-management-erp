export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "commerce_manager" | "order_processor" | "inventory_manager" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";
export type ProductType = "physical" | "digital" | "service" | "subscription" | "bundle" | "course" | "downloadable" | "marketplace";
export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock" | "reserved" | "damaged" | "returned" | "in_transit" | "discontinued";
export type OrderStatus = "pending" | "confirmed" | "processing" | "packed" | "shipped" | "delivered" | "cancelled" | "returned" | "refunded" | "failed";
export type PaymentStatus = "pending" | "authorized" | "paid" | "failed" | "refunded" | "partially_refunded" | "chargeback" | "cancelled";
export type RefundStatus = "requested" | "approved" | "rejected" | "pickup_scheduled" | "received" | "inspected" | "refunded" | "replaced" | "closed";
export type SubscriptionStatus = "active" | "paused" | "cancelled" | "expired" | "trial";
export type CheckoutStatus = "initiated" | "processing" | "completed" | "failed" | "abandoned";

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

export interface ProductCategory extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  parentId?: UUID;
  status: EntityStatus;
  tags: string[];
}

export interface ProductVariant extends BaseEntity {
  productId: UUID;
  sku: string;
  name: string;
  price: number;
  costPrice?: number;
  compareAtPrice?: number;
  inventory: number;
  inventoryStatus: InventoryStatus;
  attributes: Record<string, string>;
  status: EntityStatus;
}

export interface Product extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  shortDescription?: string;
  type: ProductType;
  status: EntityStatus;
  categoryId?: UUID;
  variants: ProductVariant[];
  basePrice: number;
  costPrice?: number;
  sku?: string;
  barcode?: string;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  images: string[];
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface InventoryItem extends BaseEntity {
  productId: UUID;
  variantId?: UUID;
  warehouseId?: UUID;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  status: InventoryStatus;
  lowStockThreshold: number;
  reorderPoint?: number;
}

export interface Warehouse extends BaseEntity {
  key: string;
  name: string;
  address?: string;
  status: EntityStatus;
}

export interface Supplier extends BaseEntity {
  key: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  productsSupplied: UUID[];
  paymentTerms?: string;
  leadTimeDays?: number;
  qualityScore?: number;
  status: EntityStatus;
}

export interface Coupon extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  type: "percentage" | "fixed_amount" | "free_shipping";
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: ISODate;
  validUntil: ISODate;
  status: EntityStatus;
  applicableProductIds?: UUID[];
  applicableCategoryIds?: UUID[];
}

export interface CartItem {
  productId: UUID;
  variantId?: UUID;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  metadata?: Record<string, unknown>;
}

export interface Cart extends BaseEntity {
  customerId?: UUID;
  sessionId?: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;
  couponId?: UUID;
  status: "active" | "converted" | "abandoned";
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface OrderItem {
  productId: UUID;
  variantId?: UUID;
  productName: string;
  variantName?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  totalPrice: number;
}

export interface Order extends BaseEntity {
  orderNumber: string;
  customerId?: UUID;
  customerEmail?: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;
  status: OrderStatus;
  shippingAddress?: ShippingAddress;
  billingAddress?: ShippingAddress;
  couponId?: UUID;
  paymentId?: UUID;
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface Payment extends BaseEntity {
  orderId: UUID;
  amount: number;
  currency: string;
  method: "card" | "upi" | "netbanking" | "wallet" | "cod" | "bank_transfer";
  status: PaymentStatus;
  gateway?: string;
  gatewayTransactionId?: string;
  paidAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface Refund extends BaseEntity {
  orderId: UUID;
  paymentId: UUID;
  amount: number;
  reason: string;
  status: RefundStatus;
  processedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface CheckoutSession extends BaseEntity {
  cartId: UUID;
  customerId?: UUID;
  customerEmail?: string;
  status: CheckoutStatus;
  shippingAddress?: ShippingAddress;
  billingAddress?: ShippingAddress;
  shippingMethod?: string;
  paymentMethod?: string;
  couponCode?: string;
  orderId?: UUID;
  metadata: Record<string, unknown>;
}

export interface Subscription extends BaseEntity {
  customerId: UUID;
  productId: UUID;
  planId?: string;
  status: SubscriptionStatus;
  billingCycle: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  amount: number;
  startDate: ISODate;
  endDate?: ISODate;
  nextBillingDate?: ISODate;
  trialEndDate?: ISODate;
  cancelledAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface Customer extends BaseEntity {
  email: string;
  displayName: string;
  phone?: string;
  addresses: ShippingAddress[];
  defaultShippingAddressId?: string;
  defaultBillingAddressId?: string;
  status: EntityStatus;
  tags: string[];
  totalOrders: number;
  totalSpent: number;
  metadata: Record<string, unknown>;
}

export interface Invoice extends BaseEntity {
  invoiceNumber: string;
  orderId: UUID;
  customerId?: UUID;
  customerEmail?: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  status: "draft" | "issued" | "paid" | "overdue" | "cancelled";
  issuedAt: ISODate;
  dueDate: ISODate;
  paidAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface Shipment extends BaseEntity {
  orderId: UUID;
  carrier: string;
  trackingNumber?: string;
  status: "pending" | "in_transit" | "delivered" | "returned" | "failed";
  estimatedDelivery?: ISODate;
  deliveredAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface Review extends BaseEntity {
  productId: UUID;
  orderId?: UUID;
  customerId?: UUID;
  rating: number;
  title?: string;
  content?: string;
  status: "pending" | "approved" | "rejected" | "spam";
  verified: boolean;
  helpful: number;
  metadata: Record<string, unknown>;
}

export interface Wishlist extends BaseEntity {
  customerId: UUID;
  productIds: UUID[];
}

export interface LoyaltyPoints extends BaseEntity {
  customerId: UUID;
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

export interface CommerceEvent extends BaseEntity {
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

export interface CommerceOverview {
  products: { total: number; active: number };
  orders: { total: number; pending: number; completed: number; cancelled: number };
  customers: { total: number; active: number };
  revenue: { total: number; thisMonth: number; thisWeek: number };
  payments: { total: number; successful: number; failed: number; pending: number };
  subscriptions: { total: number; active: number; trial: number };
  inventory: { totalItems: number; lowStock: number; outOfStock: number };
}

export interface CommerceState {
  products: Product[];
  categories: ProductCategory[];
  carts: Cart[];
  orders: Order[];
  payments: Payment[];
  refunds: Refund[];
  subscriptions: Subscription[];
  customers: Customer[];
  invoices: Invoice[];
  shipments: Shipment[];
  reviews: Review[];
  wishlists: Wishlist[];
  loyaltyPoints: LoyaltyPoints[];
  coupons: Coupon[];
  warehouses: Warehouse[];
  suppliers: Supplier[];
  inventory: InventoryItem[];
  checkoutSessions: CheckoutSession[];
  events: CommerceEvent[];
  auditLogs: AuditLog[];
}
