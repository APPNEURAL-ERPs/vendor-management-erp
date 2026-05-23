import { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import { RequestActor, Role } from "../domain";
import { HttpError } from "./utils";

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

      const actor: RequestActor = {
        tenantId: getHeader(req, "x-tenant-id") ?? process.env.DEFAULT_TENANT_ID ?? "demo-tenant",
        userId: getHeader(req, "x-user-id") ?? "demo-user",
        role: getHeader(req, "x-role") as Role ?? "viewer"
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

export function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-role,x-user-id,x-tenant-id");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.end(JSON.stringify(payload, null, 2));
}
