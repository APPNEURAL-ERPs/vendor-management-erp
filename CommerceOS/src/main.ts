import { createServer } from "http";
import { DataStore, Router } from "./core";
import { CommerceService } from "./service";
import { createSeedState } from "./seed-state";
import { docs } from "./docs";

const port = Number(process.env.PORT ?? 8700);
const dbFile = process.env.COMMERCEOS_DB_FILE ?? "data/commerceos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().products.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new CommerceService(store);
const router = new Router();

router.get("/health", (ctx) => {
  return { status: "ok", service: "CommerceOS", version: "1.0.0", timestamp: new Date().toISOString() };
});

router.get("/docs", (ctx) => {
  return docs();
});

router.get("/commerceos", (ctx) => {
  return { message: service.getRoutesSummary(), version: "1.0.0" };
});

router.get("/commerceos/overview", (ctx) => {
  return service.overview(ctx.actor);
});

router.get("/commerceos/products", (ctx) => {
  return service.listProducts(ctx.actor, ctx.query);
});

router.get("/commerceos/products/:id", (ctx) => {
  return service.getProduct(ctx.params.id, ctx.actor);
});

router.post("/commerceos/products", (ctx) => {
  return service.createProduct(ctx.body, ctx.actor);
});

router.patch("/commerceos/products/:id", (ctx) => {
  return service.updateProduct(ctx.params.id, ctx.body, ctx.actor);
});

router.get("/commerceos/categories", (ctx) => {
  return service.listCategories(ctx.actor);
});

router.post("/commerceos/categories", (ctx) => {
  return service.createCategory(ctx.body, ctx.actor);
});

router.get("/commerceos/carts", (ctx) => {
  return service.listCarts(ctx.actor, ctx.query);
});

router.get("/commerceos/carts/:id", (ctx) => {
  return service.getCart(ctx.params.id, ctx.actor);
});

router.post("/commerceos/carts", (ctx) => {
  return service.createCart(ctx.body, ctx.actor);
});

router.post("/commerceos/carts/:id/items", (ctx) => {
  return service.addToCart(ctx.params.id, ctx.body, ctx.actor);
});

router.delete("/commerceos/carts/:id/items/:productId", (ctx) => {
  return service.removeFromCart(ctx.params.id, ctx.params.productId, ctx.actor);
});

router.post("/commerceos/carts/:id/coupon", (ctx) => {
  return service.applyCoupon(ctx.params.id, ctx.body, ctx.actor);
});

router.post("/commerceos/checkout", (ctx) => {
  return service.initiateCheckout(ctx.body.cartId, ctx.body, ctx.actor);
});

router.get("/commerceos/checkout/:id", (ctx) => {
  const state = store.getState();
  const session = state.checkoutSessions.find(
    (s) => s.id === ctx.params.id && s.tenantId === ctx.actor.tenantId
  );
  if (!session) {
    const { notFound } = require("./core");
    notFound("Checkout session not found");
  }
  return session;
});

router.post("/commerceos/checkout/:id/process", (ctx) => {
  return service.processCheckout(ctx.params.id, ctx.body, ctx.actor);
});

router.get("/commerceos/orders", (ctx) => {
  return service.listOrders(ctx.actor, ctx.query);
});

router.get("/commerceos/orders/:id", (ctx) => {
  return service.getOrder(ctx.params.id, ctx.actor);
});

router.patch("/commerceos/orders/:id/status", (ctx) => {
  return service.updateOrderStatus(ctx.params.id, ctx.body, ctx.actor);
});

router.get("/commerceos/payments", (ctx) => {
  return service.listPayments(ctx.actor, ctx.query);
});

router.post("/commerceos/payments/:id/process", (ctx) => {
  return service.processPayment(ctx.params.id, ctx.body, ctx.actor);
});

router.post("/commerceos/refunds", (ctx) => {
  return service.createRefund(ctx.body, ctx.actor);
});

router.post("/commerceos/refunds/:id/process", (ctx) => {
  return service.processRefund(ctx.params.id, ctx.body, ctx.actor);
});

router.get("/commerceos/customers", (ctx) => {
  return service.listCustomers(ctx.actor, ctx.query);
});

router.get("/commerceos/customers/:id", (ctx) => {
  return service.getCustomer(ctx.params.id, ctx.actor);
});

router.post("/commerceos/customers", (ctx) => {
  return service.createCustomer(ctx.body, ctx.actor);
});

router.get("/commerceos/subscriptions", (ctx) => {
  return service.listSubscriptions(ctx.actor, ctx.query);
});

router.post("/commerceos/subscriptions", (ctx) => {
  return service.createSubscription(ctx.body, ctx.actor);
});

router.get("/commerceos/coupons", (ctx) => {
  return service.listCoupons(ctx.actor, ctx.query);
});

router.post("/commerceos/coupons", (ctx) => {
  return service.createCoupon(ctx.body, ctx.actor);
});

router.get("/commerceos/reviews", (ctx) => {
  return service.listReviews(ctx.actor, ctx.query);
});

router.post("/commerceos/reviews", (ctx) => {
  return service.createReview(ctx.body, ctx.actor);
});

router.get("/commerceos/audit-logs", (ctx) => {
  return service.listAuditLogs(ctx.actor);
});

router.get("/commerceos/events", (ctx) => {
  return service.listEvents(ctx.actor);
});

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`CommerceOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
  console.log(`API:    http://localhost:${port}/commerceos`);
});
