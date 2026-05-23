import { z } from "zod";

export const addressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional()
});

export const categorySchema = z.object({
  tenantId: z.string().optional(),
  name: z.string().min(1),
  slug: z.string().optional(),
  parentId: z.string().optional()
});

export const productSchema = z.object({
  tenantId: z.string().optional(),
  sku: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  priceMinor: z.number().int().nonnegative(),
  currency: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  stockTracked: z.boolean().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  status: z.enum(["active", "inactive", "archived"]).optional(),
  metadata: z.record(z.unknown()).optional()
});

export const updateProductSchema = productSchema.partial().omit({ tenantId: true });

export const discountSchema = z.object({
  tenantId: z.string().optional(),
  code: z.string().min(1),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().positive(),
  minSubtotalMinor: z.number().int().nonnegative().optional(),
  maxDiscountMinor: z.number().int().nonnegative().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  usageLimit: z.number().int().positive().optional(),
  active: z.boolean().optional()
});

export const taxRuleSchema = z.object({
  tenantId: z.string().optional(),
  name: z.string().min(1),
  rate: z.number().min(0).max(100),
  categoryId: z.string().optional(),
  active: z.boolean().optional()
});

export const createCartSchema = z.object({
  tenantId: z.string().optional(),
  customerId: z.string().optional()
});

export const addCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive()
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive()
});

export const applyDiscountSchema = z.object({
  code: z.string().min(1)
});

export const checkoutSchema = z.object({
  tenantId: z.string().optional(),
  cartId: z.string().min(1),
  customerId: z.string().optional(),
  orderType: z.enum(["delivery", "pickup", "pos", "digital"]),
  paymentMethod: z.enum(["upi", "card", "cash", "wallet", "bank_transfer", "cash_on_delivery"]),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded", "partially_refunded"]).optional(),
  deliveryAddress: addressSchema.optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export const statusUpdateSchema = z.object({
  orderStatus: z.enum([
    "confirmed",
    "preparing",
    "ready_for_pickup",
    "out_for_delivery",
    "delivered",
    "completed",
    "cancelled",
    "refund_requested",
    "refunded"
  ]),
  note: z.string().optional()
});

export const cancelOrderSchema = z.object({
  note: z.string().optional()
});

export const refundOrderSchema = z.object({
  note: z.string().optional()
});

export const posSaleSchema = z.object({
  tenantId: z.string().optional(),
  cashierId: z.string().min(1),
  customerId: z.string().optional(),
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().positive() })).min(1),
  paymentMethod: z.enum(["upi", "card", "cash", "wallet", "bank_transfer", "cash_on_delivery"]),
  discountCode: z.string().optional(),
  notes: z.string().optional()
});

export const inventoryAdjustSchema = z.object({
  tenantId: z.string().optional(),
  productId: z.string().min(1),
  delta: z.number().int(),
  reason: z.string().min(1),
  referenceId: z.string().optional()
});
