import { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import { HttpError } from "./utils";
import { RequestActor, Role } from "../domain";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";
export interface HttpContext {
  req: IncomingMessage;
  res: ServerResponse;
  method: HttpMethod;
  path: string;
  query: URLSearchParams;
  params: Record<string, string>;
  body: any;
  actor: RequestActor;
}
export type Handler = (ctx: HttpContext) => Promise<unknown> | unknown;

interface RouteDefinition {
  method: HttpMethod;
  path: string;
  regex: RegExp;
  paramNames: string[];
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

      const actor = getActor(req);
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

  private match(
    method: HttpMethod,
    path: string
  ): (RouteDefinition & { params: Record<string, string> }) | undefined {
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
}

function compilePath(path: string): { regex: RegExp; paramNames: string[] } {
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

  return { regex: new RegExp(`^${regexSource}$`), paramNames };
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

function getActor(req: IncomingMessage): RequestActor {
  const roleHeader = getHeader(req, "x-role") ?? "viewer";
  const role: Role = isRole(roleHeader) ? roleHeader : "viewer";

  return {
    tenantId: getHeader(req, "x-tenant-id") ?? process.env.DEFAULT_TENANT_ID ?? "demo-tenant",
    userId: getHeader(req, "x-user-id") ?? `${role}-user`,
    role,
  };
}

function isRole(value: string): value is Role {
  return ["owner", "admin", "analytics_admin", "analyst", "viewer"].includes(value);
}

function getHeader(req: IncomingMessage, name: string): string | undefined {
  const raw = req.headers[name] ?? req.headers[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0];
  return typeof raw === "string" ? raw : undefined;
}

function handleError(res: ServerResponse, error: unknown): void {
  if (error instanceof HttpError) {
    sendJson(res, error.statusCode, {
      ok: false,
      error: error.message,
      details: error.details,
    });
    return;
  }
  sendJson(res, 500, {
    ok: false,
    error: error instanceof Error ? error.message : "Internal server error",
  });
}
