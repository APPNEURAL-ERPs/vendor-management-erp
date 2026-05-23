import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";

export type UUID = string;
export type TenantId = string;
export type ISODate = string;
export type EntityStatus = "draft" | "review" | "published" | "archived";
export type ApiRole = "viewer" | "content_editor" | "seo_manager" | "designer" | "publisher" | "forms_manager" | "admin" | "owner";

export interface RequestActor {
  tenantId: TenantId;
  userId: UUID;
  role: ApiRole;
}

export interface BaseEntity {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface SeoMeta {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  keywords?: string[];
}

export interface WebsiteSite extends BaseEntity {
  name: string;
  slug: string;
  status: "active" | "draft" | "paused" | "archived";
  primaryDomain?: string;
  locale: string;
  timezone: string;
  settings: Record<string, unknown>;
  createdBy: UUID;
}

export interface WebsiteDomain extends BaseEntity {
  siteId: UUID;
  hostname: string;
  status: "pending" | "verified" | "active" | "disabled";
  isPrimary: boolean;
  sslStatus: "not_requested" | "pending" | "issued" | "failed";
  verificationToken: string;
  createdBy: UUID;
}

export interface WebsiteTheme extends BaseEntity {
  siteId: UUID;
  name: string;
  status: "draft" | "active" | "archived";
  tokens: {
    colors: Record<string, string>;
    fonts: Record<string, string>;
    spacing: Record<string, string>;
    radii?: Record<string, string>;
  };
  components: Record<string, unknown>;
  createdBy: UUID;
}

export interface WebsitePage extends BaseEntity {
  siteId: UUID;
  title: string;
  slug: string;
  path: string;
  pageType: "landing" | "cms" | "blog_index" | "legal" | "custom";
  status: EntityStatus;
  seo: SeoMeta;
  publishedAt?: ISODate;
  createdBy: UUID;
}

export interface WebsitePageBlock extends BaseEntity {
  siteId: UUID;
  pageId: UUID;
  type: "hero" | "text" | "image" | "cta" | "features" | "pricing" | "faq" | "form" | "custom";
  order: number;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  status: "active" | "hidden" | "archived";
  createdBy: UUID;
}

export interface WebsiteMenuItem {
  id: UUID;
  label: string;
  url: string;
  target?: "self" | "blank";
  children?: WebsiteMenuItem[];
}

export interface WebsiteMenu extends BaseEntity {
  siteId: UUID;
  name: string;
  location: "header" | "footer" | "sidebar" | "mobile" | "custom";
  items: WebsiteMenuItem[];
  status: "active" | "inactive" | "archived";
  createdBy: UUID;
}

export interface WebsiteMediaAsset extends BaseEntity {
  siteId: UUID;
  fileName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  altText?: string;
  folder?: string;
  tags: string[];
  status: "active" | "archived" | "deleted";
  createdBy: UUID;
}

export interface WebsitePost extends BaseEntity {
  siteId: UUID;
  title: string;
  slug: string;
  excerpt?: string;
  body: string;
  category?: string;
  tags: string[];
  status: EntityStatus;
  authorId: UUID;
  seo: SeoMeta;
  publishedAt?: ISODate;
}

export interface WebsiteFormField {
  id: UUID;
  name: string;
  label: string;
  type: "text" | "email" | "phone" | "number" | "textarea" | "select" | "checkbox" | "date";
  required: boolean;
  options?: string[];
}

export interface WebsiteFormAction {
  type: "email" | "webhook" | "crm" | "automation";
  config: Record<string, unknown>;
}

export interface WebsiteForm extends BaseEntity {
  siteId: UUID;
  name: string;
  slug: string;
  fields: WebsiteFormField[];
  actions: WebsiteFormAction[];
  status: "draft" | "active" | "paused" | "archived";
  createdBy: UUID;
}

export interface WebsiteFormSubmission extends BaseEntity {
  siteId: UUID;
  formId: UUID;
  sourceUrl?: string;
  data: Record<string, unknown>;
  status: "new" | "reviewed" | "spam" | "converted" | "archived";
  assignedTo?: UUID;
  submittedAt: ISODate;
}

export interface WebsiteRedirect extends BaseEntity {
  siteId: UUID;
  fromPath: string;
  toUrl: string;
  code: 301 | 302 | 307 | 308;
  status: "active" | "inactive" | "archived";
  createdBy: UUID;
}

export interface WebsitePublishSnapshot extends BaseEntity {
  siteId: UUID;
  title: string;
  status: "created" | "deploying" | "deployed" | "failed";
  entityCounts: Record<string, number>;
  artifactUrl?: string;
  deployedAt?: ISODate;
  createdBy: UUID;
}

export interface WebsiteSeoAudit extends BaseEntity {
  siteId: UUID;
  pageId: UUID;
  score: number;
  issues: string[];
  recommendations: string[];
  auditedAt: ISODate;
  createdBy: UUID;
}

export interface WebsiteAnalyticsEvent extends BaseEntity {
  siteId: UUID;
  event: "page.view" | "form.submit" | "link.click" | "publish.deploy" | "seo.audit" | string;
  path?: string;
  visitorId?: string;
  sessionId?: string;
  data: Record<string, unknown>;
}

export interface WebsiteEvent extends BaseEntity {
  event: string;
  source: "WebsiteOS" | string;
  actorId: UUID;
  data: Record<string, unknown>;
}

export interface AuditLog extends BaseEntity {
  actorId: UUID;
  role: ApiRole;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
}

export interface WebsiteState {
  sites: WebsiteSite[];
  domains: WebsiteDomain[];
  themes: WebsiteTheme[];
  pages: WebsitePage[];
  blocks: WebsitePageBlock[];
  menus: WebsiteMenu[];
  media: WebsiteMediaAsset[];
  posts: WebsitePost[];
  forms: WebsiteForm[];
  submissions: WebsiteFormSubmission[];
  redirects: WebsiteRedirect[];
  snapshots: WebsitePublishSnapshot[];
  seoAudits: WebsiteSeoAudit[];
  analyticsEvents: WebsiteAnalyticsEvent[];
  events: WebsiteEvent[];
  auditLogs: AuditLog[];
}

export const ROLE_PERMISSIONS: Record<ApiRole, string[]> = {
  viewer: ["website.read", "website.analytics.read"],
  content_editor: ["website.read", "website.pages.write", "website.posts.write", "website.media.write", "website.forms.read"],
  seo_manager: ["website.read", "website.seo.write", "website.redirects.write", "website.analytics.read"],
  designer: ["website.read", "website.themes.write", "website.pages.write", "website.media.write", "website.menus.write"],
  publisher: ["website.read", "website.pages.write", "website.posts.write", "website.publish.write", "website.analytics.read"],
  forms_manager: ["website.read", "website.forms.write", "website.submissions.read", "website.analytics.read"],
  admin: ["*"],
  owner: ["*"]
};

export class HttpError extends Error {
  constructor(public readonly statusCode: number, message: string, public readonly details?: unknown) {
    super(message);
  }
}

export function nowIso(): ISODate { return new Date().toISOString(); }
export function plusDays(days: number): ISODate { const d = new Date(); d.setUTCDate(d.getUTCDate() + days); return d.toISOString(); }
export function newId(prefix = "id"): UUID { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }
export function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
export function slugify(value: string): string { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "item"; }
export function normalizePathValue(value: string): string { const trimmed = value.trim(); const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`; return withSlash.length > 1 && withSlash.endsWith("/") ? withSlash.slice(0, -1) : withSlash; }
export function badRequest(message: string, details?: unknown): never { throw new HttpError(400, message, details); }
export function notFound(message: string, details?: unknown): never { throw new HttpError(404, message, details); }
export function forbidden(message: string, details?: unknown): never { throw new HttpError(403, message, details); }
export function conflict(message: string, details?: unknown): never { throw new HttpError(409, message, details); }
export function requireString(value: unknown, field: string): string { if (typeof value !== "string" || value.trim() === "") badRequest(`${field} is required`); return value.trim(); }
export function optionalString(value: unknown): string | undefined { if (value === undefined || value === null || value === "") return undefined; return String(value); }
export function asNumber(value: unknown, fallback = 0): number { if (value === undefined || value === null || value === "") return fallback; const n = Number(value); if (!Number.isFinite(n)) badRequest(`Expected numeric value`); return n; }
export function asArray<T = string>(value: unknown): T[] { return Array.isArray(value) ? value as T[] : []; }
export function unique(values: string[]): string[] { return [...new Set(values.map((v) => String(v).trim()).filter(Boolean))]; }
export function includesText(value: unknown, query: string): boolean { return String(value ?? "").toLowerCase().includes(query.toLowerCase()); }
export function ensureHostname(value: string): string { return value.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0] || badRequest("hostname is required"); }
export function hasPermission(role: ApiRole, permission: string): boolean { const perms = ROLE_PERMISSIONS[role] ?? []; return perms.includes("*") || perms.includes(permission) || perms.some((p) => p.endsWith(".*") && permission.startsWith(p.slice(0, -1))); }

export function emptyState(): WebsiteState {
  return {
    sites: [], domains: [], themes: [], pages: [], blocks: [], menus: [], media: [], posts: [], forms: [], submissions: [], redirects: [], snapshots: [], seoAudits: [], analyticsEvents: [], events: [], auditLogs: []
  };
}

export class DataStore {
  private state: WebsiteState = emptyState();
  private readonly filePath: string;
  constructor(filePath: string) { this.filePath = resolve(filePath); this.load(); }
  load(): void {
    if (!existsSync(this.filePath)) { mkdirSync(dirname(this.filePath), { recursive: true }); this.save(); return; }
    const raw = readFileSync(this.filePath, "utf-8");
    this.state = raw.trim() ? { ...emptyState(), ...JSON.parse(raw) } : emptyState();
  }
  save(): void { mkdirSync(dirname(this.filePath), { recursive: true }); writeFileSync(this.filePath, JSON.stringify(this.state, null, 2)); }
  getState(): WebsiteState { return this.state; }
  snapshot(): WebsiteState { return clone(this.state); }
  reset(nextState: WebsiteState): void { this.state = clone(nextState); this.save(); }
}

export class EventBus {
  constructor(private readonly store: DataStore) {}
  emit(actor: RequestActor, event: string, data: Record<string, unknown>, source = "WebsiteOS"): WebsiteEvent {
    const item: WebsiteEvent = { id: newId("evt"), tenantId: actor.tenantId, event, source, actorId: actor.userId, data, createdAt: nowIso(), updatedAt: nowIso() };
    this.store.getState().events.unshift(item);
    this.store.save();
    return item;
  }
}

export type RouteHandler = (ctx: { actor: RequestActor; params: Record<string, string>; query: URLSearchParams; body: unknown; headers: IncomingMessage["headers"] }) => unknown | Promise<unknown>;
interface CompiledRoute { method: string; path: string; regex: RegExp; paramNames: string[]; handler: RouteHandler; permission?: string; }

export class Router {
  private routes: CompiledRoute[] = [];
  get(path: string, handler: RouteHandler, permission?: string): void { this.add("GET", path, handler, permission); }
  post(path: string, handler: RouteHandler, permission?: string): void { this.add("POST", path, handler, permission); }
  put(path: string, handler: RouteHandler, permission?: string): void { this.add("PUT", path, handler, permission); }
  delete(path: string, handler: RouteHandler, permission?: string): void { this.add("DELETE", path, handler, permission); }
  listRoutes(): Array<{ method: string; path: string; permission?: string }> { return this.routes.map(({ method, path, permission }) => ({ method, path, permission })); }
  private add(method: string, path: string, handler: RouteHandler, permission?: string): void { const { regex, paramNames } = compilePath(path); this.routes.push({ method, path: normalizeRoutePath(path), regex, paramNames, handler, permission }); }
  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      if (String(req.method ?? "GET").toUpperCase() === "OPTIONS") { sendJson(res, 200, { ok: true }); return; }
      const parsed = new URL(req.url ?? "/", "http://localhost");
      const method = String(req.method ?? "GET").toUpperCase();
      const route = this.match(method, parsed.pathname);
      if (!route) { sendJson(res, 404, { ok: false, error: "Route not found" }); return; }
      const actor = actorFromHeaders(req);
      if (route.permission && !hasPermission(actor.role, route.permission)) forbidden(`Missing permission: ${route.permission}`);
      const body = await parseJsonBody(req);
      const result = await route.handler({ actor, params: route.params, query: parsed.searchParams, body, headers: req.headers });
      sendJson(res, 200, { ok: true, data: result });
    } catch (error) { handleError(res, error); }
  }
  private match(method: string, path: string): (CompiledRoute & { params: Record<string, string> }) | undefined {
    const normalized = normalizeRoutePath(path);
    for (const route of this.routes) {
      if (route.method !== method) continue;
      const match = route.regex.exec(normalized);
      if (!match) continue;
      const params: Record<string, string> = {};
      route.paramNames.forEach((name, index) => { params[name] = decodeURIComponent(match[index + 1] ?? ""); });
      return { ...route, params };
    }
    return undefined;
  }
}

function actorFromHeaders(req: IncomingMessage): RequestActor {
  const role = (getHeader(req, "x-role") ?? "admin") as ApiRole;
  const safeRole = ROLE_PERMISSIONS[role] ? role : "viewer";
  return { tenantId: getHeader(req, "x-tenant-id") ?? "demo-tenant", userId: getHeader(req, "x-user-id") ?? "system", role: safeRole };
}
function compilePath(path: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const regexSource = normalizeRoutePath(path).split("/").map((part) => {
    if (part.startsWith(":")) { paramNames.push(part.slice(1)); return "([^/]+)"; }
    return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("/");
  return { regex: new RegExp(`^${regexSource}$`), paramNames };
}
function normalizeRoutePath(path: string): string { if (!path.startsWith("/")) return `/${path}`; if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1); return path; }
async function parseJsonBody(req: IncomingMessage): Promise<unknown> {
  const method = String(req.method ?? "GET").toUpperCase();
  if (["GET", "DELETE", "OPTIONS"].includes(method)) return undefined;
  const chunks: string[] = [];
  for await (const chunk of req) chunks.push(String(chunk));
  const raw = chunks.join("").trim();
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { throw new HttpError(400, "Request body must be valid JSON"); }
}
function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-role,x-tenant-id,x-user-id");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.end(JSON.stringify(payload, null, 2));
}
function getHeader(req: IncomingMessage, name: string): string | undefined { const raw = req.headers[name] ?? req.headers[name.toLowerCase()]; if (Array.isArray(raw)) return raw[0]; return typeof raw === "string" ? raw : undefined; }
function handleError(res: ServerResponse, error: unknown): void { if (error instanceof HttpError) { sendJson(res, error.statusCode, { ok: false, error: error.message, details: error.details }); return; } sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : "Internal server error" }); }
