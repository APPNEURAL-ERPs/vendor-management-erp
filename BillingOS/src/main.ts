import { createServer } from "http";
import { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import { DataStore } from "./core/datastore";
import { BillingService } from "./service";
import { createSeedState } from "./seed-state";
import { apiDocs } from "./docs";
import { nowIso, newId } from "./core/id";
import { HttpError, badRequest } from "./core/utils";
import { RequestActor, ApiRole } from "./domain";

const PORT = Number(process.env.PORT ?? 10800);
const DB_FILE = process.env.BILLINGOS_DB_FILE ?? "data/billingos.db.json";
const TENANT_ID = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(DB_FILE);
if (store.getState().billingAccounts.length === 0) {
  store.reset(createSeedState(TENANT_ID));
}

const service = new BillingService(store);

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";
interface HttpContext {
  req: IncomingMessage;
  res: ServerResponse;
  method: HttpMethod;
  path: string;
  query: URLSearchParams;
  params: Record<string, string>;
  body: unknown;
  actor: RequestActor;
}
type Handler = (ctx: HttpContext) => Promise<unknown> | unknown;

interface RouteDefinition {
  method: HttpMethod;
  path: string;
  regex: RegExp;
  paramNames: string[];
  handler: Handler;
}

class Router {
  private routes: RouteDefinition[] = [];

  add(method: HttpMethod, path: string, handler: Handler): void {
    const { regex, paramNames } = this.compilePath(path);
    this.routes.push({ method, path, regex, paramNames, handler });
  }

  get(path: string, handler: Handler): void {
    this.add("GET", path, handler);
  }

  post(path: string, handler: Handler): void {
    this.add("POST", path, handler);
  }

  patch(path: string, handler: Handler): void {
    this.add("PATCH", path, handler);
  }

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const method = String(req.method ?? "GET").toUpperCase() as HttpMethod;
      if (method === "OPTIONS") {
        sendJson(res, 200, { ok: true });
        return;
      }

      const url = new URL(req.url ?? "/", "http://localhost");
      const path = normalizePath(url.pathname);
      const route = this.match(method, path);

      if (!route) {
        sendJson(res, 404, { ok: false, error: "Route not found", method, path });
        return;
      }

      const roleHeader = getHeader(req, "x-role") ?? "viewer";
      const role: ApiRole = isApiRole(roleHeader) ? roleHeader : "viewer";
      const actor: RequestActor = {
        tenantId: getHeader(req, "x-tenant-id") ?? TENANT_ID,
        userId: getHeader(req, "x-user-id") ?? `${role}-user`,
        role,
      };

      const body = await parseJsonBody(req);
      const result = await route.handler({
        req,
        res,
        method,
        path,
        query: url.searchParams,
        params: route.params,
        body,
        actor,
      });

      if (!res.headersSent) {
        sendJson(res, 200, { ok: true, data: result ?? null });
      }
    } catch (error) {
      handleError(res, error);
    }
  }

  private match(method: HttpMethod, path: string): (RouteDefinition & { params: Record<string, string> }) | undefined {
    for (const route of this.routes) {
      if (route.method !== method) continue;
      const match = route.regex.exec(path);
      if (!match) continue;

      const params: Record<string, string> = {};
      route.paramNames.forEach((name, index) => {
        params[name] = decodeURIComponent(match[index + 1] ?? "");
      });

      return { ...route, params };
    }
    return undefined;
  }

  private compilePath(path: string): { regex: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];
    const regexSource = normalizePath(path)
      .split("/")
      .map((part) => {
        if (part.startsWith(":")) {
          paramNames.push(part.slice(1));
          return "([^/]+)";
        }
        return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("/");

    return {
      regex: new RegExp(`^${regexSource}$`),
      paramNames,
    };
  }
}

function normalizePath(path: string): string {
  if (!path.startsWith("/")) return `/${path}`;
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

async function parseJsonBody(req: IncomingMessage): Promise<unknown> {
  const method = String(req.method ?? "GET").toUpperCase();
  if (["GET", "DELETE", "OPTIONS"].includes(method)) return undefined;

  const chunks: string[] = [];
  for await (const chunk of req) {
    chunks.push(String(chunk));
  }

  const raw = chunks.join("").trim();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Request body must be valid JSON");
  }
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-role,x-tenant-id,x-user-id");
  res.end(JSON.stringify(payload, null, 2));
}

function getHeader(req: IncomingMessage, name: string): string | undefined {
  const raw = req.headers[name] ?? req.headers[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0];
  return typeof raw === "string" ? raw : undefined;
}

function handleError(res: ServerResponse, error: unknown): void {
  if (error instanceof HttpError) {
    sendJson(res, error.statusCode, { ok: false, error: error.message, details: error.details });
    return;
  }
  sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : "Internal server error" });
}

function isApiRole(value: string): value is ApiRole {
  return ["viewer", "billing_viewer", "billing_manager", "billing_admin", "admin", "owner"].includes(value);
}

const router = new Router();

router.get("/health", async (ctx) => ({
  status: "ok",
  service: "BillingOS",
  timestamp: nowIso(),
  version: "1.0.0",
}));

router.get("/docs", async () => apiDocs);

router.get("/overview", async (ctx) => service.getOverview(ctx.actor));

router.post("/accounts", async (ctx) => {
  const data = ctx.body as any;
  return service.createAccount(ctx.actor, {
    customerId: data.customerId,
    customerName: data.customerName,
    email: data.email,
    phone: data.phone,
    companyName: data.companyName,
    billingAddress: data.billingAddress,
    gstin: data.gstin,
    pan: data.pan,
    currency: data.currency,
    taxExempt: data.taxExempt,
    notes: data.notes,
  });
});

router.get("/accounts", async (ctx) => {
  return service.getAccounts(ctx.actor, {
    status: ctx.query.get("status") ?? undefined,
    search: ctx.query.get("search") ?? undefined,
  });
});

router.get("/accounts/:id", async (ctx) => service.getAccount(ctx.actor, ctx.params.id));

router.patch("/accounts/:id", async (ctx) => {
  const data = ctx.body as any;
  return service.updateAccount(ctx.actor, ctx.params.id, data);
});

router.post("/plans", async (ctx) => {
  const data = ctx.body as any;
  return service.createPlan(ctx.actor, {
    key: data.key,
    name: data.name,
    description: data.description,
    product: data.product,
    price: data.price,
    billingCycle: data.billingCycle,
    trialDays: data.trialDays,
    type: data.type,
    features: data.features,
    limits: data.limits,
    modules: data.modules,
    isPublic: data.isPublic,
  });
});

router.get("/plans", async (ctx) => {
  return service.getPlans(ctx.actor, {
    status: ctx.query.get("status") ?? undefined,
    product: ctx.query.get("product") ?? undefined,
  });
});

router.get("/plans/:id", async (ctx) => service.getPlan(ctx.actor, ctx.params.id));

router.post("/subscriptions", async (ctx) => {
  const data = ctx.body as any;
  return service.createSubscription(ctx.actor, {
    billingAccountId: data.billingAccountId,
    planId: data.planId,
    type: data.type,
    billingCycle: data.billingCycle,
    seatCount: data.seatCount,
    autoRenew: data.autoRenew,
    startDate: data.startDate,
  });
});

router.get("/subscriptions", async (ctx) => {
  return service.getSubscriptions(ctx.actor, {
    status: ctx.query.get("status") ?? undefined,
    billingAccountId: ctx.query.get("billingAccountId") ?? undefined,
  });
});

router.get("/subscriptions/:id", async (ctx) => service.getSubscription(ctx.actor, ctx.params.id));

router.patch("/subscriptions/:id", async (ctx) => {
  const data = ctx.body as any;
  return service.updateSubscription(ctx.actor, ctx.params.id, data);
});

router.post("/invoices", async (ctx) => {
  const data = ctx.body as any;
  return service.createInvoice(ctx.actor, {
    billingAccountId: data.billingAccountId,
    subscriptionId: data.subscriptionId,
    type: data.type,
    items: data.items,
    dueDate: data.dueDate,
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
  });
});

router.get("/invoices", async (ctx) => {
  return service.getInvoices(ctx.actor, {
    status: ctx.query.get("status") ?? undefined,
    billingAccountId: ctx.query.get("billingAccountId") ?? undefined,
  });
});

router.get("/invoices/:id", async (ctx) => service.getInvoice(ctx.actor, ctx.params.id));

router.post("/payments", async (ctx) => {
  const data = ctx.body as any;
  return service.createPayment(ctx.actor, {
    invoiceId: data.invoiceId,
    billingAccountId: data.billingAccountId,
    amount: data.amount,
    currency: data.currency,
    gateway: data.gateway,
    paymentMethodId: data.paymentMethodId,
    gatewayTransactionId: data.gatewayTransactionId,
    status: data.status,
  });
});

router.get("/payments", async (ctx) => {
  return service.getPayments(ctx.actor, {
    status: ctx.query.get("status") ?? undefined,
    billingAccountId: ctx.query.get("billingAccountId") ?? undefined,
  });
});

router.post("/usage", async (ctx) => {
  const data = ctx.body as any;
  return service.recordUsage(ctx.actor, {
    tenantId: data.tenantId,
    subscriptionId: data.subscriptionId,
    billingAccountId: data.billingAccountId,
    eventType: data.eventType,
    unit: data.unit,
    quantity: data.quantity,
    unitPrice: data.unitPrice,
    metadata: data.metadata,
  });
});

router.get("/usage/:billingAccountId", async (ctx) => {
  return service.getUsageRecords(ctx.actor, ctx.params.billingAccountId, {
    startDate: ctx.query.get("startDate") ?? undefined,
    endDate: ctx.query.get("endDate") ?? undefined,
  });
});

router.post("/credits/add", async (ctx) => {
  const data = ctx.body as any;
  return service.addCredits(ctx.actor, {
    billingAccountId: data.billingAccountId,
    type: data.type,
    amount: data.amount,
    description: data.description,
    expiresAt: data.expiresAt,
  });
});

router.get("/credits/:billingAccountId", async (ctx) => {
  return service.getCreditBalance(ctx.actor, ctx.params.billingAccountId, ctx.query.get("type") ?? undefined);
});

router.post("/refunds", async (ctx) => {
  const data = ctx.body as any;
  return service.createRefund(ctx.actor, {
    paymentId: data.paymentId,
    amount: data.amount,
    reason: data.reason,
    description: data.description,
  });
});

router.get("/refunds", async (ctx) => {
  return service.getRefunds(ctx.actor, {
    status: ctx.query.get("status") ?? undefined,
  });
});

router.post("/coupons", async (ctx) => {
  const data = ctx.body as any;
  return service.createCoupon(ctx.actor, {
    code: data.code,
    name: data.name,
    description: data.description,
    type: data.type,
    value: data.value,
    maxUses: data.maxUses,
    maxUsesPerUser: data.maxUsesPerUser,
    validFrom: data.validFrom,
    validUntil: data.validUntil,
    applicablePlans: data.applicablePlans,
    applicableModules: data.applicableModules,
    minOrderAmount: data.minOrderAmount,
  });
});

router.get("/coupons/:code", async (ctx) => {
  return service.validateCoupon(ctx.actor, ctx.params.code, ctx.query.get("billingAccountId") ?? undefined);
});

router.post("/dunning", async (ctx) => {
  const data = ctx.body as any;
  return service.startDunning(ctx.actor, {
    subscriptionId: data.subscriptionId,
    billingAccountId: data.billingAccountId,
  });
});

router.get("/analytics", async (ctx) => {
  return service.getAnalytics(
    ctx.actor,
    ctx.query.get("startDate") ?? undefined,
    ctx.query.get("endDate") ?? undefined
  );
});

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(PORT, () => {
  console.log(`BillingOS running on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Docs:   http://localhost:${PORT}/docs`);
  console.log(`Overview: http://localhost:${PORT}/overview`);
});
