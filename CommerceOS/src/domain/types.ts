export type ID = string;
export type ISODateString = string;
export type CurrencyCode = "INR" | "USD" | "EUR" | string;

export type ProductStatus = "active" | "inactive" | "archived";
export type CartStatus = "active" | "converted" | "abandoned";
export type DiscountType = "percentage" | "fixed";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partially_refunded";
export type OrderStatus =
  | "confirmed"
  | "preparing"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refund_requested"
  | "refunded";
export type OrderType = "delivery" | "pickup" | "pos" | "digital";
export type PaymentMethod = "upi" | "card" | "cash" | "wallet" | "bank_transfer" | "cash_on_delivery";

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  country?: string;
  pincode?: string;
}

export interface Category {
  id: ID;
  tenantId: ID;
  name: string;
  slug: string;
  parentId?: ID;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Product {
  id: ID;
  tenantId: ID;
  sku: string;
  name: string;
  description?: string;
  categoryId?: ID;
  priceMinor: number;
  currency: CurrencyCode;
  taxRate: number;
  stockTracked: boolean;
  stockQuantity: number;
  status: ProductStatus;
  metadata: Record<string, unknown>;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Discount {
  id: ID;
  tenantId: ID;
  code: string;
  type: DiscountType;
  value: number;
  minSubtotalMinor?: number;
  maxDiscountMinor?: number;
  startsAt?: ISODateString;
  endsAt?: ISODateString;
  usageLimit?: number;
  usedCount: number;
  active: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface TaxRule {
  id: ID;
  tenantId: ID;
  name: string;
  rate: number;
  categoryId?: ID;
  active: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CartItem {
  id: ID;
  productId: ID;
  quantity: number;
  addedAt: ISODateString;
}

export interface Cart {
  id: ID;
  tenantId: ID;
  customerId?: ID;
  status: CartStatus;
  items: CartItem[];
  discountCode?: string;
  deliveryAddress?: Address;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface DiscountCalculation {
  code?: string;
  amountMinor: number;
  reason?: string;
}

export interface PricedLineItem {
  productId: ID;
  name: string;
  sku: string;
  quantity: number;
  unitPriceMinor: number;
  subtotalMinor: number;
  discountMinor: number;
  taxableMinor: number;
  taxRate: number;
  taxMinor: number;
  totalMinor: number;
}

export interface PricedCart {
  tenantId: ID;
  currency: CurrencyCode;
  items: PricedLineItem[];
  subtotalMinor: number;
  discount: DiscountCalculation;
  taxMinor: number;
  totalMinor: number;
}

export interface OrderItem extends PricedLineItem {
  id: ID;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  changedAt: ISODateString;
  note?: string;
}

export interface Order {
  id: ID;
  tenantId: ID;
  customerId?: ID;
  source: "checkout" | "pos" | "admin";
  orderType: OrderType;
  items: OrderItem[];
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  currency: CurrencyCode;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  discountCode?: string;
  deliveryAddress?: Address;
  notes?: string;
  metadata: Record<string, unknown>;
  history: OrderStatusHistory[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface InventoryAdjustment {
  id: ID;
  tenantId: ID;
  productId: ID;
  delta: number;
  reason: string;
  referenceId?: ID;
  createdAt: ISODateString;
}
