import { createServer } from "http";
import { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import { DataStore } from "./core/datastore";
import { CommunityService } from "./service";
import { createSeedState } from "./seed-state";
import { HttpError, ensureObject } from "./core/utils";
import { Role } from "./domain";

const PORT = Number(process.env.PORT ?? 10100);
const DB_FILE = process.env.COMMUNITYOS_DB_FILE ?? "data/communityos.db.json";
const TENANT_ID = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(DB_FILE);
if (store.getState().communities.length === 0) {
  store.reset(createSeedState(TENANT_ID));
}

const service = new CommunityService(store);

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";

export interface HttpContext {
  req: IncomingMessage;
  res: ServerResponse;
  method: HttpMethod;
  path: string;
  query: URLSearchParams;
  params: Record<string, string>;
  body: any;
}

type Handler = (ctx: HttpContext) => Promise<unknown> | unknown;

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

  get(path: string, handler: Handler): void {
    this.add("GET", path, handler);
  }

  post(path: string, handler: Handler): void {
    this.add("POST", path, handler);
  }

  put(path: string, handler: Handler): void {
    this.add("PUT", path, handler);
  }

  patch(path: string, handler: Handler): void {
    this.add("PATCH", path, handler);
  }

  delete(path: string, handler: Handler): void {
    this.add("DELETE", path, handler);
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

      const actor = {
        tenantId: getHeader(req, "x-tenant-id") ?? TENANT_ID,
        userId: getHeader(req, "x-user-id") ?? "anonymous",
        role: (getHeader(req, "x-role") as Role) ?? "member"
      };

      const body = await parseJsonBody(req);
      const result = await route.handler({
        req,
        res,
        method,
        path,
        query: url.searchParams,
        params: route.params ?? {},
        body,
        actor
      });

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

export function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-role,x-user-id,x-tenant-id");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.end(JSON.stringify(payload, null, 2));
}

function registerRoutes(router: Router): Router {
  router.get("/health", (ctx) => ({ status: "ok", service: "CommunityOS", timestamp: new Date().toISOString() }));
  router.get("/docs", (ctx) => ({ message: "See /docs endpoint for API documentation" }));

  router.get("/communities", (ctx) => service.listCommunities(ctx.actor, ctx.query));
  router.post("/communities", (ctx) => service.createCommunity(ctx.actor, ensureObject(ctx.body, "body")));
  router.get("/communities/:id", (ctx) => service.getCommunity(ctx.actor, ctx.params.id));

  router.get("/members", (ctx) => service.listMembers(ctx.actor, ctx.query));
  router.post("/members", (ctx) => service.addMember(ctx.actor, ensureObject(ctx.body, "body")));
  router.get("/members/:id", (ctx) => service.getMember(ctx.actor, ctx.params.id));

  router.get("/groups", (ctx) => service.listGroups(ctx.actor, ctx.query));
  router.post("/groups", (ctx) => service.createGroup(ctx.actor, ensureObject(ctx.body, "body")));

  router.get("/posts", (ctx) => service.listPosts(ctx.actor, ctx.query));
  router.post("/posts", (ctx) => service.createPost(ctx.actor, ensureObject(ctx.body, "body")));

  router.get("/discussions", (ctx) => service.listDiscussions(ctx.actor, ctx.query));
  router.post("/discussions", (ctx) => service.createDiscussion(ctx.actor, ensureObject(ctx.body, "body")));

  router.get("/events", (ctx) => service.listEvents(ctx.actor, ctx.query));
  router.post("/events", (ctx) => service.createEvent(ctx.actor, ensureObject(ctx.body, "body")));
  router.post("/events/:id/register", (ctx) => {
    const body = ensureObject(ctx.body, "body");
    const memberId = body.memberId;
    return service.registerForEvent(ctx.actor, ctx.params.id, memberId);
  });

  router.post("/badges", (ctx) => service.createBadge(ctx.actor, ensureObject(ctx.body, "body")));
  router.post("/badges/:id/award", (ctx) => {
    const body = ensureObject(ctx.body, "body");
    const memberId = body.memberId;
    return service.awardBadge(ctx.actor, ctx.params.id, memberId);
  });

  router.get("/resources", (ctx) => service.listResources(ctx.actor, ctx.query));
  router.post("/resources", (ctx) => service.createResource(ctx.actor, ensureObject(ctx.body, "body")));

  router.get("/overview", (ctx) => service.getOverview(ctx.actor));

  return router;
}

const router = registerRoutes(new Router());

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(PORT, () => {
  console.log(`CommunityOS running on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Docs:   http://localhost:${PORT}/docs`);
  console.log(`API:    http://localhost:${PORT}/communities`);
});
