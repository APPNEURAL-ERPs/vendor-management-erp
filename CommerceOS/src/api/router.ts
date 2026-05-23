import { Router } from "express";
import type { CommerceOS } from "../commerceos";
import type { OrderStatus, ProductStatus } from "../domain/types";
import { requirePermission } from "../security/middleware";
import { asyncHandler } from "../shared/errors";
import { getOptionalQueryString, getTenantId } from "./context";
import {
  addCartItemSchema,
  applyDiscountSchema,
  cancelOrderSchema,
  categorySchema,
  checkoutSchema,
  createCartSchema,
  discountSchema,
  inventoryAdjustSchema,
  posSaleSchema,
  productSchema,
  refundOrderSchema,
  statusUpdateSchema,
  taxRuleSchema,
  updateCartItemSchema,
  updateProductSchema
} from "./schemas";

export function commerceRouter(os: CommerceOS): Router {
  const router = Router();

  router.get(
    "/catalog",
    requirePermission(os.permissions, "commerce.product.read"),
    asyncHandler((req, res) => {
      const tenantId = getTenantId(req);
      res.json({
        categories: os.products.listCategories(tenantId),
        products: os.products.listProducts({ tenantId, status: "active" })
      });
    })
  );

  router.post(
    "/categories",
    requirePermission(os.permissions, "commerce.product.create"),
    asyncHandler((req, res) => {
      const body = categorySchema.parse(req.body);
      const tenantId = body.tenantId ?? getTenantId(req);
      res.status(201).json(os.products.createCategory({ ...body, tenantId }));
    })
  );

  router.get(
    "/categories",
    requirePermission(os.permissions, "commerce.product.read"),
    asyncHandler((req, res) => {
      const tenantId = getTenantId(req);
      res.json(os.products.listCategories(tenantId));
    })
  );

  router.post(
    "/products",
    requirePermission(os.permissions, "commerce.product.create"),
    asyncHandler((req, res) => {
      const body = productSchema.parse(req.body);
      const tenantId = body.tenantId ?? getTenantId(req);
      res.status(201).json(os.products.createProduct({ ...body, tenantId }));
    })
  );

  router.get(
    "/products",
    requirePermission(os.permissions, "commerce.product.read"),
    asyncHandler((req, res) => {
      const tenantId = getTenantId(req);
      const status = getOptionalQueryString(req.query.status) as ProductStatus | undefined;
      const categoryId = getOptionalQueryString(req.query.categoryId);
      res.json(os.products.listProducts({ tenantId, status, categoryId }));
    })
  );

  router.get(
    "/products/:productId",
    requirePermission(os.permissions, "commerce.product.read"),
    asyncHandler((req, res) => {
      const tenantId = getTenantId(req);
      res.json(os.products.getProduct(tenantId, req.params.productId));
    })
  );

  router.put(
    "/products/:productId",
    requirePermission(os.permissions, "commerce.product.update"),
    asyncHandler((req, res) => {
      const tenantId = getTenantId(req);
      const body = updateProductSchema.parse(req.body);
      res.json(os.products.updateProduct(tenantId, req.params.productId, body));
    })
  );

  router.delete(
    "/products/:productId",
    requirePermission(os.permissions, "commerce.product.delete"),
    asyncHandler((req, res) => {
      const tenantId = getTenantId(req);
      res.json(os.products.archiveProduct(tenantId, req.params.productId));
    })
  );

  router.post(
    "/discounts",
    requirePermission(os.permissions, "commerce.discount.manage"),
    asyncHandler((req, res) => {
      const body = discountSchema.parse(req.body);
      const tenantId = body.tenantId ?? getTenantId(req);
      res.status(201).json(os.discounts.createDiscount({ ...body, tenantId }));
    })
  );

  router.get(
    "/discounts",
    requirePermission(os.permissions, "commerce.discount.manage"),
    asyncHandler((req, res) => {
      const tenantId = getTenantId(req);
      res.json(os.discounts.listDiscounts(tenantId));
    })
  );

  router.post(
    "/tax-rules",
    requirePermission(os.permissions, "commerce.tax.manage"),
    asyncHandler((req, res) => {
      const body = taxRuleSchema.parse(req.body);
      const tenantId = body.tenantId ?? getTenantId(req);
      res.status(201).json(os.tax.createTaxRule({ ...body, tenantId }));
    })
  );

  router.get(
    "/tax-rules",
    requirePermission(os.permissions, "commerce.tax.manage"),
    asyncHandler((req, res) => {
      const tenantId = getTenantId(req);
      res.json(os.tax.listTaxRules(tenantId));
    })
  );

  router.post(
    "/carts",
    requirePermission(os.permissions, "commerce.cart.manage"),
    asyncHandler((req, res) => {
      const body = createCartSchema.parse(req.body);
      const tenantId = body.tenantId ?? getTenantId(req);
      res.status(201).json(os.carts.createCart({ tenantId, customerId: body.customerId }));
    })
  );

  router.get(
    "/carts/:cartId",
    requirePermission(os.permissions, "commerce.cart.manage"),
    asyncHandler((req, res) => {
      const tenantId = getTenantId(req);
      res.json(os.carts.getCart(tenantId, req.params.cartId));
    })
  );

  router.post(
    "/carts/:cartId/items",
    requirePermission(os.permissions, "commerce.cart.manage"),
    asyncHandler((req, res) => {
      const tenantId = getTenantId(req);
      const body = addCartItemSchema.parse(req.body);
      res.status(201).json(os.carts.addItem({ tenantId, cartId: req.params.cartId, ...body }));
    })
  );

  router.put(
    "/carts/:cartId/items/:itemId",
    requirePermission(os.permissions, "commerce.cart.manage"),
    asyncHandler((req, res) => {
      const tenantId = getTenantId(req);
      const body = updateCartItemSchema.parse(req.body);
      res.json(os.carts.updateItem({ tenantId, cartId: req.params.cartId, itemId: req.params.itemId, ...body }));
    })
  );

  router.delete(
    "/carts/:cartId/items/:itemId",
    requirePermission(os.permissions, "commerce.cart.manage"),
    asyncHandler((req, res) => {
      const tenantId = getTenantId(req);
      res.json(os.carts.removeItem({ tenantId, cartId: req.params.cartId, itemId: req.params.itemId }));
    })
  );

  router.post(
    "/carts/:cartId/discount",
    requirePermission(os.permissions, "commerce.cart.manage"),
    asyncHandler((req, res) => {
      const tenantId = getTenantId(req);
      const body = applyDiscountSchema.parse(req.body);
      res.json(os.carts.applyDiscount({ tenantId, cartId: req.params.cartId, code: body.code }));
    })
  );

  router.post(
    "/checkout",
    requirePermission(os.permissions, "commerce.checkout.use"),
    asyncHandler((req, res) => {
      const body = checkoutSchema.parse(req.body);
      const tenantId = body.tenantId ?? getTenantId(req);
      res.status(201).json(os.checkout.checkout({ ...body, tenantId }));
    })
  );

  router.get(
    "/orders",
    requirePermission(os.permissions, "commerce.order.view"),
    asyncHandler((req, res) => {
      const tenantId = getTenantId(req);
      const customerId = getOptionalQueryString(req.query.customerId);
      const status = getOptionalQueryString(req.query.status) as OrderStatus | undefined;
      res.json(os.orders.listOrders({ tenantId, customerId, status }));
    })
  );

  router.get(
    "/orders/:orderId",
    requirePermission(os.permissions, "commerce.order.view"),
    asyncHandler((req, res) => {
      const tenantId = getTenantId(req);
      res.json(os.orders.getOrder(tenantId, req.params.orderId));
    })
  );

  router.put(
    "/orders/:orderId/status",
    requirePermission(os.permissions, "commerce.order.update"),
    asyncHandler((req, res) => {
      const tenantId = getTenantId(req);
      const body = statusUpdateSchema.parse(req.body);
      res.json(os.orders.updateStatus({ tenantId, orderId: req.params.orderId, status: body.orderStatus, note: body.note }));
    })
  );

  router.post(
    "/orders/:orderId/cancel",
    requirePermission(os.permissions, "commerce.order.cancel"),
    asyncHandler((req, res) => {
      const tenantId = getTenantId(req);
      const body = cancelOrderSchema.parse(req.body);
      res.json(os.orders.cancel({ tenantId, orderId: req.params.orderId, note: body.note }));
    })
  );

  router.post(
    "/orders/:orderId/refund",
    requirePermission(os.permissions, "commerce.order.refund"),
    asyncHandler((req, res) => {
      const tenantId = getTenantId(req);
      const body = refundOrderSchema.parse(req.body);
      res.json(os.orders.refund({ tenantId, orderId: req.params.orderId, note: body.note }));
    })
  );

  router.post(
    "/pos/sale",
    requirePermission(os.permissions, "commerce.pos.access"),
    asyncHandler((req, res) => {
      const body = posSaleSchema.parse(req.body);
      const tenantId = body.tenantId ?? getTenantId(req);
      res.status(201).json(os.pos.sale({ ...body, tenantId }));
    })
  );

  router.post(
    "/inventory/adjust",
    requirePermission(os.permissions, "commerce.inventory.manage"),
    asyncHandler((req, res) => {
      const body = inventoryAdjustSchema.parse(req.body);
      const tenantId = body.tenantId ?? getTenantId(req);
      res.json(os.inventory.adjustInventory({ ...body, tenantId }));
    })
  );

  router.get(
    "/inventory/adjustments",
    requirePermission(os.permissions, "commerce.inventory.manage"),
    asyncHandler((req, res) => {
      const tenantId = getTenantId(req);
      res.json(os.inventory.listAdjustments(tenantId));
    })
  );

  router.get(
    "/analytics/summary",
    requirePermission(os.permissions, "commerce.analytics.view"),
    asyncHandler((req, res) => {
      const tenantId = getTenantId(req);
      res.json(os.analytics.summary(tenantId));
    })
  );

  router.get(
    "/events/recent",
    requirePermission(os.permissions, "commerce.events.view"),
    asyncHandler((req, res) => {
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      res.json(os.eventBus.recentEvents(limit));
    })
  );

  return router;
}
