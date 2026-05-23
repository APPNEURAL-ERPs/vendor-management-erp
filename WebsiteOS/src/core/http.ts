import { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import { HttpError, badRequest } from "./utils";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";
export type ApiRole = "viewer" | "content_editor" | "website_admin" | "seo_manager" | "form_manager" | "analytics_viewer" | "admin" | "owner" | "publisher";

export interface RequestActor {
  tenantId: string;
  userId: string;
  role: ApiRole;
}

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
  permission?: string;
  handler: Handler;
}

const apiRoles: ApiRole[] = [
  "viewer",
  "content_editor",
  "website_admin",
  "seo_manager",
  "form_manager",
  "analytics_viewer",
  "admin",
  "owner",
  "publisher",
];

const permissionsByApiRole: Record<ApiRole, string[]> = {
  viewer: ["website.read", "page.read", "form.read", "analytics.read"],
  content_editor: ["website.read", "website.write", "page.read", "page.write", "form.read", "cta.read", "cta.write"],
  website_admin: ["*"],
  seo_manager: ["website.read", "website.write", "page.read", "page.write", "seo.manage"],
  form_manager: ["website.read", "form.read", "form.write", "page.read"],
  analytics_viewer: ["website.read", "analytics.read"],
  admin: ["*"],
  owner: ["*"],
  publisher: ["website.read", "website.write", "page.read", "page.write", "publish", "website.publish"],
};

export function isApiRole(value: string): value is ApiRole {
  return apiRoles.includes(value as ApiRole);
}

export function hasPermission(role: ApiRole, permission?: string): boolean {
  if (!permission) return true;
  const granted = permissionsByApiRole[role] ?? [];
  return granted.includes("*") || granted.includes(permission);
}

export function requirePermission(role: ApiRole, permission?: string): void {
  if (!hasPermission(role, permission)) {
    throw new HttpError(403, `Role ${role} does not have permission ${permission}`);
  }
}

export class Router {
  private routes: RouteDefinition[] = [];

  add(method: HttpMethod, path: string, handler: Handler, permission?: string): void {
    const { regex, paramNames } = compilePath(path);
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

      requirePermission(role, route.permission);

      const actor: RequestActor = {
        tenantId: getHeader(req, "x-tenant-id") ?? process.env.DEFAULT_TENANT_ID ?? "demo-tenant",
        userId: getHeader(req, "x-user-id") ?? `${role}-user`,
        role,
      };

      const body = await parseJsonBody(req);
      const result = await route.handler({ req, res, method, path, query: url.searchParams, params: route.params, body, actor });

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
