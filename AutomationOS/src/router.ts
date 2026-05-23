import { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import { RequestActor, Role } from "./types";
import { docs } from "./docs";

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

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
  permission?: string;
  handler: Handler;
}

export class AutomationRouter {
  private routes: RouteDefinition[] = [];

  constructor(private service: any) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.routes = [];

    this.get("/health", ({ actor }) => ({ service: "AutomationOS", status: "ok", message: this.service.getRoutesSummary() }));
    this.get("/docs", () => ({ ...docs(), routes: this.listRoutes() }));

    this.get("/automation/overview", ({ actor }) => this.service.overview(actor));

    this.get("/automation/workflows", ({ actor, query }) => this.service.listWorkflows(actor, query));
    this.post("/automation/workflows", ({ body, actor }) => this.service.createWorkflow(body, actor));
    this.get("/automation/workflows/:id", ({ params, actor }) => this.service.getWorkflow(params.id, actor));
    this.patch("/automation/workflows/:id", ({ params, body, actor }) => this.service.updateWorkflow(params.id, body, actor));
    this.delete("/automation/workflows/:id", ({ params, actor }) => this.service.deleteWorkflow(params.id, actor));
    this.post("/automation/workflows/:id/publish", ({ params, actor }) => this.service.publishWorkflow(params.id, actor));
    this.post("/automation/workflows/:id/run", ({ params, body, actor }) => this.service.runWorkflow(params.id, body, actor));

    this.get("/automation/triggers", ({ actor, query }) => this.service.listTriggers(actor, query));
    this.post("/automation/triggers", ({ body, actor }) => this.service.createTrigger(body, actor));
    this.get("/automation/triggers/:id", ({ params, actor }) => this.service.getTrigger(params.id, actor));
    this.post("/automation/triggers/:id/fire", ({ params, body, actor }) => this.service.fireTrigger(params.id, body, actor));

    this.get("/automation/actions", ({ actor, query }) => this.service.listActions(actor, query));
    this.post("/automation/actions", ({ body, actor }) => this.service.createAction(body, actor));

    this.get("/automation/schedules", ({ actor, query }) => this.service.listSchedules(actor, query));
    this.post("/automation/schedules", ({ body, actor }) => this.service.createSchedule(body, actor));

    this.get("/automation/approvals", ({ actor, query }) => this.service.listApprovals(actor, query));
    this.post("/automation/approvals", ({ body, actor }) => this.service.createApproval(body, actor));
    this.get("/automation/approvals/:id", ({ params, actor }) => this.service.getApproval(params.id, actor));
    this.post("/automation/approvals/:id/decide", ({ params, body, actor }) => this.service.decideApproval(params.id, body, actor));

    this.get("/automation/runs", ({ actor, query }) => this.service.listRuns(actor, query));
    this.get("/automation/runs/:id", ({ params, actor }) => this.service.getRun(params.id, actor));

    this.get("/automation/webhooks", ({ actor }) => this.service.listWebhookEndpoints(actor));
    this.post("/automation/webhooks", ({ body, actor }) => this.service.createWebhookEndpoint(body, actor));
    this.post("/automation/webhooks/:id/receive", ({ params, body, actor }) => this.service.receiveWebhook(params.id, body, actor));

    this.get("/automation/events", ({ actor }) => this.service.listEvents(actor));
    this.get("/automation/audit", ({ actor }) => this.service.listAuditLogs(actor));
  }

  add(method: HttpMethod, path: string, handler: Handler, permission?: string): void {
    const { regex, paramNames } = this.compilePath(path);
    this.routes.push({ method, path, regex, paramNames, permission, handler });
  }

  get(path: string, handler: Handler, permission?: string): void {
    this.add("GET", path, handler, permission);
  }

  post(path: string, handler: Handler, permission?: string): void {
    this.add("POST", path, handler, permission);
  }

  put(path: string, handler: Handler, permission?: string): void {
    this.add("PUT", path, handler, permission);
  }

  patch(path: string, handler: Handler, permission?: string): void {
    this.add("PATCH", path, handler, permission);
  }

  delete(path: string, handler: Handler, permission?: string): void {
    this.add("DELETE", path, handler, permission);
  }

  listRoutes(): Array<{ method: string; path: string; permission?: string }> {
    return this.routes.map(({ method, path, permission }) => ({ method, path, permission }));
  }

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const method = String(req.method ?? "GET").toUpperCase() as HttpMethod;
      if (method === "OPTIONS") {
        this.sendJson(res, 200, { ok: true });
        return;
      }

      const url = new URL(req.url ?? "/", "http://localhost");
      const path = this.normalizePath(url.pathname);
      const route = this.match(method, path);

      if (!route) {
        this.sendJson(res, 404, { ok: false, error: "Route not found", method, path });
        return;
      }

      const roleHeader = this.getHeader(req, "x-role") ?? "viewer";
      const role: Role = this.isRole(roleHeader) ? roleHeader : "viewer";

      const actor: RequestActor = {
        tenantId: this.getHeader(req, "x-tenant-id") ?? process.env.DEFAULT_TENANT_ID ?? "demo-tenant",
        userId: this.getHeader(req, "x-user-id") ?? `${role}-user`,
        role
      };

      const body = await this.parseJsonBody(req);
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
        this.sendJson(res, 200, { ok: true, data: result ?? null });
      }
    } catch (error) {
      this.handleError(res, error);
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

  private compilePath(path: string): { regex: RegExp; paramNames: string[] } {
    const normalized = this.normalizePath(path);
    const paramNames: string[] = [];
    const pattern = normalized
      .split("/")
      .filter(Boolean)
      .map((part) => {
        if (part.startsWith(":")) {
          paramNames.push(part.slice(1));
          return "([^/]+)";
        }
        return this.escapeRegex(part);
      })
      .join("/");
    return { regex: new RegExp(`^/${pattern}$`), paramNames };
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private normalizePath(path: string): string {
    const value = path.replace(/\/+/g, "/").replace(/\/$/, "");
    return value || "/";
  }

  private async parseJsonBody(req: IncomingMessage): Promise<unknown> {
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

  private getHeader(req: IncomingMessage, name: string): string | undefined {
    const value = req.headers[name];
    return Array.isArray(value) ? value[0] : value;
  }

  private sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
    res.statusCode = statusCode;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-role,x-user-id,x-tenant-id");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.end(JSON.stringify(payload, null, 2));
  }

  private handleError(res: ServerResponse, error: unknown): void {
    if (error instanceof HttpError) {
      this.sendJson(res, error.statusCode, { ok: false, error: error.message, details: error.details });
      return;
    }
    this.sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : "Internal server error" });
  }

  private isRole(value: string): value is Role {
    return ["owner", "admin", "automation_admin", "automation_operator", "workflow_builder", "viewer"].includes(value);
  }
}
