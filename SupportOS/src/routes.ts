import { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import { RequestActor, Role } from "./domain";
import { HttpError } from "./core/utils";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";

export interface HttpContext<TBody = any> {
  req: IncomingMessage;
  res: ServerResponse;
  method: HttpMethod;
  path: string;
  query: URLSearchParams;
  params: Record<string, string>;
  body: TBody;
  actor: RequestActor;
}

export type Handler = (ctx: HttpContext) => Promise<unknown> | unknown;

interface RouteDefinition {
  method: HttpMethod;
  path: string;
  regex: RegExp;
  paramNames: string[];
  params?: Record<string, string>;
  handler: Handler;
}

export class Router {
  private routes: RouteDefinition[] = [];

  add(method: HttpMethod, path: string, handler: Handler): void {
    const { regex, paramNames } = compilePath(path);
    this.routes.push({ method, path, regex, paramNames, handler });
  }

  get(path: string, handler: Handler): void { this.add("GET", path, handler); }
  post(path: string, handler: Handler): void { this.add("POST", path, handler); }
  put(path: string, handler: Handler): void { this.add("PUT", path, handler); }
  patch(path: string, handler: Handler): void { this.add("PATCH", path, handler); }
  delete(path: string, handler: Handler): void { this.add("DELETE", path, handler); }

  listRoutes(): Array<{ method: string; path: string }> {
    return this.routes.map(({ method, path }) => ({ method, path }));
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
      const role: Role = isRole(roleHeader) ? roleHeader : "viewer";

      const actor: RequestActor = {
        tenantId: getHeader(req, "x-tenant-id") ?? process.env.DEFAULT_TENANT_ID ?? "demo-tenant",
        userId: getHeader(req, "x-user-id") ?? `${role}-user`,
        role
      };

      const body = await parseJsonBody(req);
      const result = await route.handler({ req, res, method, path, query: url.searchParams, params: route.params ?? {}, body, actor });

      if (!res.headersSent) {
        sendJson(res, 200, { ok: true, data: result ?? null });
      }
    } catch (error) {
      if (error instanceof HttpError) {
        sendJson(res, error.statusCode, { ok: false, error: error.message, details: error.details });
        return;
      }
      sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : "Internal server error" });
    }
  }

  private match(method: HttpMethod, path: string): RouteDefinition | undefined {
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

function compilePath(path: string): { regex: RegExp; paramNames: string[] } {
  const normalized = normalizePath(path);
  const paramNames: string[] = [];
  const pattern = normalized.split("/").filter(Boolean).map((part) => {
    if (part.startsWith(":")) {
      paramNames.push(part.slice(1));
      return "([^/]+)";
    }
    return escapeRegex(part);
  }).join("/");
  return { regex: new RegExp(`^/${pattern}$`), paramNames };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizePath(path: string): string {
  const value = path.replace(/\/+/g, "/").replace(/\/$/, "");
  return value || "/";
}

async function parseJsonBody(req: IncomingMessage): Promise<unknown> {
  const method = String(req.method ?? "GET").toUpperCase();
  if (["GET", "DELETE"].includes(method)) return undefined;

  const chunks: any[] = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf-8");
  if (!raw.trim()) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}

function getHeader(req: IncomingMessage, name: string): string | undefined {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function isRole(value: string): value is Role {
  return ["owner", "admin", "support_admin", "support_agent", "support_lead", "viewer"].includes(value);
}

export function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-role,x-user-id,x-tenant-id");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.end(JSON.stringify(payload, null, 2));
}

export function registerRoutes(router: Router, service: any): Router {
  router.get("/health", () => ({ status: "ok", service: "SupportOS" }));
  router.get("/docs", () => service.getDocs?.() ?? { message: "Docs not available" });

  router.get("/supportos/overview", (ctx) => service.overview(ctx.actor));

  router.get("/supportos/tickets", (ctx) => service.listTickets(ctx.actor, ctx.query));
  router.get("/supportos/tickets/:id", (ctx) => service.getTicket(ctx.params.id, ctx.actor));
  router.post("/supportos/tickets", (ctx) => service.createTicket(ctx.body, ctx.actor));
  router.patch("/supportos/tickets/:id", (ctx) => service.updateTicket(ctx.params.id, ctx.body, ctx.actor));
  router.get("/supportos/tickets/:id/comments", (ctx) => service.listTicketComments?.(ctx.params.id, ctx.actor) ?? []);
  router.post("/supportos/tickets/:id/comments", (ctx) => service.addTicketComment(ctx.params.id, ctx.body, ctx.actor));
  router.get("/supportos/tickets/:id/sla", (ctx) => service.getSlaStatus(ctx.params.id, ctx.actor));
  router.get("/supportos/tickets/:id/escalations", (ctx) => service.getEscalations?.(ctx.params.id, ctx.actor) ?? []);
  router.post("/supportos/tickets/:id/escalations", (ctx) => service.createEscalation(ctx.params.id, ctx.body, ctx.actor));
  router.post("/supportos/tickets/:id/csat", (ctx) => service.submitCSAT(ctx.params.id, ctx.body, ctx.actor));

  router.get("/supportos/slas", (ctx) => service.listSLAs(ctx.actor));
  router.post("/supportos/slas", (ctx) => service.createSLA(ctx.body, ctx.actor));

  router.get("/supportos/conversations", (ctx) => service.listConversations(ctx.actor));
  router.post("/supportos/conversations", (ctx) => service.createConversation(ctx.body.ticketId ?? ctx.params.ticketId, ctx.body, ctx.actor));
  router.get("/supportos/conversations/:id/messages", (ctx) => service.listConversationMessages?.(ctx.params.id, ctx.actor) ?? []);
  router.post("/supportos/conversations/:id/messages", (ctx) => service.addConversationMessage(ctx.params.id, ctx.body, ctx.actor));

  router.get("/supportos/escalations", (ctx) => service.listEscalations(ctx.actor));
  router.patch("/supportos/escalations/:id", (ctx) => service.updateEscalation(ctx.params.id, ctx.body, ctx.actor));

  router.get("/supportos/resolutions", (ctx) => service.listResolutions(ctx.actor));

  router.get("/supportos/articles", (ctx) => service.listArticles(ctx.actor, ctx.query));
  router.post("/supportos/articles", (ctx) => service.createArticle(ctx.body, ctx.actor));

  router.get("/supportos/macros", (ctx) => service.listMacros(ctx.actor));
  router.post("/supportos/macros", (ctx) => service.createMacro(ctx.body, ctx.actor));

  router.get("/supportos/agents", (ctx) => service.listAgents(ctx.actor));
  router.post("/supportos/agents", (ctx) => service.createAgent(ctx.body, ctx.actor));

  router.get("/supportos/queues", (ctx) => service.listQueues(ctx.actor));
  router.post("/supportos/queues", (ctx) => service.createQueue(ctx.body, ctx.actor));

  router.get("/supportos/audit-logs", (ctx) => service.listAuditLogs(ctx.actor));

  return router;
}
