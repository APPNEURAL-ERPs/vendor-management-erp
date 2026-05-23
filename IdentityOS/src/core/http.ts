import { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import { RequestActor, ApiRole } from "../domain";

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

export const apiRoles: ApiRole[] = ["owner", "admin", "identity_admin", "user_manager", "security_admin", "viewer", "auditor"];

const permissionsByRole: Record<ApiRole, string[]> = {
  viewer: [
    "identity.user.read",
    "identity.role.read",
    "identity.permission.read",
    "identity.session.read",
    "identity.mfa.read",
    "identity.sso.read",
    "identity.audit.read",
    "identity.access.review.read"
  ],
  user_manager: [
    "identity.user.read",
    "identity.user.write",
    "identity.role.read",
    "identity.permission.read",
    "identity.session.read",
    "identity.invitation.read",
    "identity.invitation.write",
    "identity.audit.read",
    "identity.access.review.read"
  ],
  identity_admin: [
    "identity.user.read",
    "identity.user.write",
    "identity.user.delete",
    "identity.role.read",
    "identity.role.write",
    "identity.permission.read",
    "identity.permission.write",
    "identity.session.read",
    "identity.session.write",
    "identity.mfa.read",
    "identity.mfa.write",
    "identity.sso.read",
    "identity.sso.write",
    "identity.audit.read",
    "identity.access.review.read",
    "identity.access.review.write",
    "identity.api_key.read",
    "identity.api_key.write"
  ],
  security_admin: [
    "*"
  ],
  admin: ["*"],
  owner: ["*"],
  auditor: [
    "identity.user.read",
    "identity.role.read",
    "identity.permission.read",
    "identity.session.read",
    "identity.mfa.read",
    "identity.sso.read",
    "identity.audit.read",
    "identity.access.review.read"
  ]
};

export function isRole(value: string): value is ApiRole {
  return apiRoles.includes(value as ApiRole);
}

export function hasPermission(role: ApiRole, permission?: string): boolean {
  if (!permission) return true;
  const granted = permissionsByRole[role] ?? [];
  return granted.includes("*") || granted.includes(permission);
}

export function requirePermission(role: ApiRole, permission?: string): void {
  if (!hasPermission(role, permission)) {
    throw new HttpError(403, `Role ${role} does not have permission ${permission ?? "any"}`);
  }
}

export function listPermissions(role: ApiRole): string[] {
  return permissionsByRole[role] ?? [];
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
      const role: ApiRole = isRole(roleHeader) ? roleHeader : "viewer";
      requirePermission(role, route.permission);

      const actor: RequestActor = {
        tenantId: getHeader(req, "x-tenant-id") ?? process.env.DEFAULT_TENANT_ID ?? "demo-tenant",
        userId: getHeader(req, "x-user-id") ?? `${role}-user`,
        role
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
  const pattern = normalized
    .split("/")
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith(":")) {
        paramNames.push(part.slice(1));
        return "([^/]+)";
      }
      return escapeRegex(part);
    })
    .join("/");
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
