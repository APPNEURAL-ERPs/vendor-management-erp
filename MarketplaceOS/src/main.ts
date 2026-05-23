import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { docs } from "./docs";
import { badRequest } from "./core/errors";
import { MarketplaceService } from "./service";
import { createSeedState } from "./seed-state";
import { RequestActor, Role } from "./domain";

const roles: Role[] = ["owner", "admin", "marketplace_admin", "seller", "buyer", "viewer"];

const permissionsByRole: Record<Role, string[]> = {
  owner: ["*"],
  admin: ["*"],
  marketplace_admin: ["marketplace.*"],
  seller: [
    "marketplace.overview.view",
    "marketplace.listing.*",
    "marketplace.order.view",
    "marketplace.payout.view",
    "marketplace.review.view",
    "marketplace.audit.view"
  ],
  buyer: [
    "marketplace.overview.view",
    "marketplace.listing.view",
    "marketplace.listing.search",
    "marketplace.order.*",
    "marketplace.review.*",
    "marketplace.license.view",
    "marketplace.install.*",
    "marketplace.cart.*"
  ],
  viewer: [
    "marketplace.overview.view",
    "marketplace.listing.view",
    "marketplace.category.view",
    "marketplace.seller.view",
    "marketplace.review.view"
  ]
};

function isRole(value: string): value is Role {
  return roles.includes(value as Role);
}

function hasPermission(role: Role, permission?: string): boolean {
  if (!permission) return true;
  const permissions = permissionsByRole[role] ?? [];
  if (permissions.includes("*")) return true;
  if (permissions.includes(permission)) return true;
  return permissions.some((item) => {
    if (!item.endsWith(".*")) return false;
    return permission.startsWith(item.slice(0, -1));
  });
}

function requirePermission(role: Role, permission?: string): void {
  if (!hasPermission(role, permission)) {
    throw { statusCode: 403, message: `Role '${role}' cannot access permission '${permission}'` };
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";

interface Route {
  method: HttpMethod;
  path: string;
  regex: RegExp;
  paramNames: string[];
  params?: Record<string, string>;
  permission?: string;
  handler: (ctx: { req: any; res: any; method: HttpMethod; path: string; query: URLSearchParams; params: Record<string, string>; body: any; actor: RequestActor }) => any;
}

class Router {
  private routes: Route[] = [];

  add(method: HttpMethod, path: string, handler: any, permission?: string): void {
    const { regex, paramNames } = this.compilePath(path);
    this.routes.push({ method, path, regex, paramNames, permission, handler });
  }

  get(path: string, handler: any, permission?: string): void { this.add("GET", path, handler, permission); }
  post(path: string, handler: any, permission?: string): void { this.add("POST", path, handler, permission); }
  put(path: string, handler: any, permission?: string): void { this.add("PUT", path, handler, permission); }
  patch(path: string, handler: any, permission?: string): void { this.add("PATCH", path, handler, permission); }
  delete(path: string, handler: any, permission?: string): void { this.add("DELETE", path, handler, permission); }

  listRoutes(): Array<{ method: string; path: string; permission?: string }> {
    return this.routes.map(({ method, path, permission }) => ({ method, path, permission }));
  }

  private compilePath(path: string): { regex: RegExp; paramNames: string[] } {
    const normalized = path.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
    const paramNames: string[] = [];
    const pattern = normalized.split("/").filter(Boolean).map((part) => {
      if (part.startsWith(":")) {
        paramNames.push(part.slice(1));
        return "([^/]+)";
      }
      return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }).join("/");
    return { regex: new RegExp(`^/${pattern}$`), paramNames };
  }

  match(method: HttpMethod, path: string): Route | undefined {
    for (const route of this.routes) {
      if (route.method !== method) continue;
      const match = route.regex.exec(path);
      if (!match) continue;
      const params: Record<string, string> = {};
      route.paramNames.forEach((name, index) => {
        params[name] = decodeURIComponent(match[index + 1]);
      });
      return { ...route, params };
    }
    return undefined;
  }
}

const port = Number(process.env.PORT ?? 10600);
const dbFile = process.env.MARKETPLACEOS_DB_FILE ?? "data/marketplaceos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().listings.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new MarketplaceService(store);
const router = new Router();

router.get("/health", () => ({ service: "MarketplaceOS", status: "ok", message: service.getRoutesSummary() }));
router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsByRole[actor.role] ?? [] }));

router.get("/marketplaceos/overview", ({ actor }) => service.overview(actor), "marketplace.overview.view");

router.get("/marketplaceos/categories", ({ actor }) => service.listCategories(actor), "marketplace.category.view");
router.post("/marketplaceos/categories", ({ body, actor }) => service.createCategory(body, actor), "marketplace.category.create");

router.get("/marketplaceos/listings", ({ actor, query }) => service.listListings(actor, query), "marketplace.listing.view");
router.post("/marketplaceos/listings", ({ body, actor }) => service.createListing(body, actor), "marketplace.listing.create");
router.get("/marketplaceos/listings/:id", ({ params, actor }) => service.getListing(params.id, actor), "marketplace.listing.view");
router.patch("/marketplaceos/listings/:id", ({ params, body, actor }) => service.updateListing(params.id, body, actor), "marketplace.listing.update");
router.post("/marketplaceos/listings/:id/publish", ({ params, body, actor }) => service.updateListing(params.id, { ...body, status: "published" }, actor), "marketplace.listing.publish");

router.get("/marketplaceos/sellers", ({ actor, query }) => service.listSellers(actor, query), "marketplace.seller.view");
router.post("/marketplaceos/sellers", ({ body, actor }) => service.createSeller(body, actor), "marketplace.seller.create");
router.get("/marketplaceos/sellers/:id", ({ params, actor }) => service.getSeller(params.id, actor), "marketplace.seller.view");

router.get("/marketplaceos/buyers", ({ actor }) => service.listBuyers(actor), "marketplace.buyer.view");
router.post("/marketplaceos/buyers", ({ body, actor }) => service.createBuyer(body, actor), "marketplace.buyer.create");

router.get("/marketplaceos/orders", ({ actor, query }) => service.listOrders(actor, query), "marketplace.order.view");
router.post("/marketplaceos/orders", ({ body, actor }) => service.createOrder(body, actor), "marketplace.order.create");
router.get("/marketplaceos/orders/:id", ({ params, actor }) => service.getOrder(params.id, actor), "marketplace.order.view");
router.patch("/marketplaceos/orders/:id", ({ params, body, actor }) => service.updateOrderStatus(params.id, body, actor), "marketplace.order.update");

router.get("/marketplaceos/reviews", ({ actor, query }) => service.listReviews(actor, query), "marketplace.review.view");
router.post("/marketplaceos/reviews", ({ body, actor }) => service.createReview(body, actor), "marketplace.review.create");

router.get("/marketplaceos/payouts", ({ actor, query }) => service.listPayouts(actor, query), "marketplace.payout.view");
router.post("/marketplaceos/payouts", ({ body, actor }) => service.createPayout(body, actor), "marketplace.payout.create");

router.get("/marketplaceos/licenses", ({ actor, query }) => service.listLicenses(actor, query), "marketplace.license.view");
router.post("/marketplaceos/licenses", ({ body, actor }) => service.createLicense(body, actor), "marketplace.license.create");

router.get("/marketplaceos/installs", ({ actor, query }) => service.listInstalls(actor, query), "marketplace.install.view");
router.post("/marketplaceos/installs", ({ body, actor }) => service.createInstall(body, actor), "marketplace.install.create");

router.get("/marketplaceos/cart", ({ actor }) => service.listCart(actor), "marketplace.cart.view");
router.post("/marketplaceos/cart", ({ body, actor }) => service.addToCart(body, actor), "marketplace.cart.create");
router.delete("/marketplaceos/cart", ({ actor }) => service.clearCart(actor), "marketplace.cart.delete");

router.get("/marketplaceos/search", ({ actor, query }) => service.search(actor, query), "marketplace.listing.search");

router.get("/marketplaceos/audit", ({ actor }) => service.listAuditLogs(actor), "marketplace.audit.view");

const server = createServer((req, res) => {
  try {
    const method = String(req.method ?? "GET").toUpperCase() as HttpMethod;
    if (method === "OPTIONS") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-role,x-user-id,x-tenant-id");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    const url = new URL(req.url ?? "/", "http://localhost");
    const path = (url.pathname.replace(/\/+/g, "/").replace(/\/$/, "") || "/");
    const route = router.match(method, path);

    if (!route) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false, error: "Route not found", method, path }, null, 2));
      return;
    }

    const roleHeader = req.headers["x-role"] as string ?? "viewer";
    const role: Role = isRole(roleHeader) ? roleHeader : "viewer";
    requirePermission(role, route.permission);

    const actor: RequestActor = {
      tenantId: (req.headers["x-tenant-id"] as string) ?? process.env.DEFAULT_TENANT_ID ?? "demo-tenant",
      userId: (req.headers["x-user-id"] as string) ?? `${role}-user`,
      role
    };

    const body = parseJsonBody(req);
    const result = route.handler({ req, res, method, path, query: url.searchParams, params: route.params ?? {}, body, actor });

    if (!res.headersSent) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-role,x-user-id,x-tenant-id");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      res.end(JSON.stringify({ ok: true, data: result ?? null }, null, 2));
    }
  } catch (error: any) {
    if (error.statusCode) {
      res.statusCode = error.statusCode;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false, error: error.message, details: error.details }, null, 2));
      return;
    }
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Internal server error" }, null, 2));
  }
});

async function parseJsonBody(req: any): Promise<any> {
  const method = String(req.method ?? "GET").toUpperCase();
  if (["GET", "DELETE"].includes(method)) return undefined;

  const chunks: any[] = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf-8");
  if (!raw.trim()) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    badRequest("Invalid JSON body");
  }
}

server.listen(port, () => {
  console.log(`MarketplaceOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
});
