import { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import { Role } from "../types";

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
  actor: any;
}

export type Handler = (ctx: HttpContext) => Promise<unknown> | unknown;

export class Router {
  private routes: Array<{
    method: HttpMethod;
    path: string;
    regex: RegExp;
    paramNames: string[];
    permission?: string;
    handler: Handler;
  }> = [];

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

      const actor = {
        tenantId: this.getHeader(req, "x-tenant-id") ?? process.env.DEFAULT_TENANT_ID ?? "demo-tenant",
        userId: this.getHeader(req, "x-user-id") ?? "demo-user",
        role: (this.getHeader(req, "x-role") as Role) ?? "viewer"
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

  private match(
    method: HttpMethod,
    path: string
  ): { params: Record<string, string> } | undefined {
    for (const route of this.routes) {
      if (route.method !== method) continue;
      const match = route.regex.exec(path);
      if (!match) continue;
      const params: Record<string, string> = {};
      route.paramNames.forEach((name, index) => {
        params[name] = decodeURIComponent(match[index + 1] ?? "");
      });
      return { params };
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
      this.sendJson(res, error.statusCode, {
        ok: false,
        error: error.message,
        details: error.details
      });
      return;
    }
    this.sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : "Internal server error"
    });
  }
}
