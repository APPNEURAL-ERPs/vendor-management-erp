import { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import { Role, RequestActor } from "../types";
import { HttpError, forbidden } from "./errors";
import { ensureBoolean, ensureNumber, ensureObject, ensureString, optionalObject } from "./utils";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";

export interface HttpContext {
  req: IncomingMessage;
  res: ServerResponse;
  method: HttpMethod;
  path: string;
  query: URLSearchParams;
  params: Record<string, string>;
  body: unknown;
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

export class Router {
  private routes: RouteDefinition[] = [];

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

      if (route.permission && !this.hasPermission(role, route.permission)) {
        forbidden(`Role ${role} does not have permission ${route.permission}`);
      }

      const actor: RequestActor = {
        tenantId: this.getHeader(req, "x-tenant-id") ?? process.env.DEFAULT_TENANT_ID ?? "demo-tenant",
        userId: this.getHeader(req, "x-user-id") ?? `${role}-user`,
        role
      };

      const body = await this.parseJsonBody(req);
      const result = await route.handler({ req, res, method, path, query: url.searchParams, params: route.params, body, actor });

      if (!res.headersSent) {
        this.sendJson(res, 200, { ok: true, data: result ?? null });
      }
    } catch (error) {
      this.handleError(res, error);
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
    const regexSource = this.normalizePath(path)
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
      paramNames
    };
  }

  private normalizePath(path: string): string {
    if (!path.startsWith("/")) return `/${path}`;
    if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
    return path;
  }

  private async parseJsonBody(req: IncomingMessage): Promise<unknown> {
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

  private sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
    res.statusCode = statusCode;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-role,x-tenant-id,x-user-id");
    res.end(JSON.stringify(payload, null, 2));
  }

  private getHeader(req: IncomingMessage, name: string): string | undefined {
    const raw = req.headers[name] ?? req.headers[name.toLowerCase()];
    if (Array.isArray(raw)) return raw[0];
    return typeof raw === "string" ? raw : undefined;
  }

  private handleError(res: ServerResponse, error: unknown): void {
    if (error instanceof HttpError) {
      this.sendJson(res, error.statusCode, { ok: false, error: error.message, details: error.details });
      return;
    }
    this.sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : "Internal server error" });
  }

  private isRole(value: string): value is Role {
    return ["owner", "admin", "inventory_admin", "inventory_manager", "warehouse_manager", "viewer"].includes(value);
  }

  private hasPermission(role: Role, permission?: string): boolean {
    if (!permission) return true;
    const permissions = this.permissionsFor(role);
    return permissions.includes("*") || permissions.includes(permission);
  }

  private permissionsFor(role: Role): string[] {
    const map: Record<Role, string[]> = {
      viewer: ["inventory.item.read", "inventory.stock.read", "inventory.warehouse.read"],
      warehouse_manager: ["inventory.item.read", "inventory.stock.read", "inventory.stock.write", "inventory.warehouse.read", "inventory.warehouse.write", "inventory.transfer.read", "inventory.adjustment.read"],
      inventory_manager: ["inventory.item.read", "inventory.item.write", "inventory.stock.read", "inventory.stock.write", "inventory.warehouse.read", "inventory.warehouse.write", "inventory.transfer.read", "inventory.transfer.write", "inventory.adjustment.read", "inventory.adjustment.write"],
      inventory_admin: ["*"],
      admin: ["*"],
      owner: ["*"]
    };
    return map[role] ?? [];
  }
}

export { ensureBoolean, ensureNumber, ensureObject, ensureString, optionalObject };
