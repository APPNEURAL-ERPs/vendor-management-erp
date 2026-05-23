import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import { createHash, randomBytes } from "crypto";

export type UUID = string;
export type TenantId = string;
export type ISODate = string;
export type ApiRole = "viewer" | "security_analyst" | "iam_admin" | "secret_manager" | "compliance_manager" | "security_admin" | "admin" | "owner" | "auditor";
export interface RequestActor { tenantId: TenantId; userId: UUID; role: ApiRole; }
export interface BaseEntity { id: UUID; tenantId: TenantId; createdAt: ISODate; updatedAt: ISODate; }
export interface Identity extends BaseEntity { email: string; displayName: string; identityType: "user" | "service_account" | "external"; status: "invited" | "active" | "suspended" | "locked" | "disabled"; mfaEnabled: boolean; lastLoginAt?: ISODate; riskScore: number; groups: UUID[]; metadata: Record<string, unknown>; createdBy: UUID; }
export interface SecurityRole extends BaseEntity { name: string; description?: string; permissions: string[]; system: boolean; status: "active" | "inactive" | "archived"; createdBy: UUID; }
export interface SecurityGroup extends BaseEntity { name: string; description?: string; members: UUID[]; roleIds: UUID[]; status: "active" | "inactive" | "archived"; createdBy: UUID; }
export interface RoleAssignment extends BaseEntity { subjectType: "identity" | "group"; subjectId: UUID; roleId: UUID; scope?: string; expiresAt?: ISODate; status: "active" | "expired" | "revoked"; assignedBy: UUID; revokedAt?: ISODate; }
export interface SecurityPolicy extends BaseEntity { name: string; description?: string; effect: "allow" | "deny"; subjectRoles: string[]; actions: string[]; resources: string[]; conditions: Record<string, unknown>; priority: number; status: "active" | "inactive" | "archived"; createdBy: UUID; }
export interface AccessDecision { allowed: boolean; subjectId: UUID; action: string; resource: string; permissions: string[]; roles: string[]; matchedPolicyIds: UUID[]; reasons: string[]; evaluatedAt: ISODate; }
export interface SecuritySession extends BaseEntity { identityId: UUID; status: "active" | "revoked" | "expired"; ipAddress?: string; userAgent?: string; expiresAt: ISODate; revokedAt?: ISODate; }
export interface ApiKey extends BaseEntity { ownerId: UUID; name: string; keyPrefix: string; keyHash: string; scopes: string[]; status: "active" | "revoked" | "expired"; expiresAt?: ISODate; lastUsedAt?: ISODate; createdBy: UUID; revokedAt?: ISODate; }
export interface Secret extends BaseEntity { name: string; description?: string; environment: string; encryptedValue: string; maskedValue: string; version: number; tags: string[]; status: "active" | "rotated" | "disabled" | "deleted"; createdBy: UUID; rotatedAt?: ISODate; }
export interface SecretVersion extends BaseEntity { secretId: UUID; version: number; encryptedValue: string; maskedValue: string; createdBy: UUID; }
export interface ComplianceControl extends BaseEntity { framework: string; code: string; title: string; description?: string; ownerId?: UUID; status: "not_started" | "in_progress" | "compliant" | "non_compliant" | "waived"; severity: "low" | "medium" | "high" | "critical"; dueDate?: string; evidenceIds: UUID[]; createdBy: UUID; }
export interface ComplianceEvidence extends BaseEntity { controlId: UUID; title: string; evidenceType: "document" | "screenshot" | "log" | "policy" | "ticket" | "other"; uri?: string; notes?: string; uploadedBy: UUID; }
export interface AccessReviewItem { identityId: UUID; roleId: UUID; assignmentId?: UUID; status: "pending" | "approved" | "revoked" | "needs_change"; decisionBy?: UUID; decisionAt?: ISODate; notes?: string; }
export interface AccessReview extends BaseEntity { name: string; reviewerId: UUID; status: "draft" | "active" | "completed"; dueAt?: ISODate; completedAt?: ISODate; items: AccessReviewItem[]; createdBy: UUID; }
export interface SecurityFinding extends BaseEntity { title: string; description?: string; category: "iam" | "audit" | "secret" | "compliance" | "session" | "api_key"; severity: "low" | "medium" | "high" | "critical"; status: "open" | "triaged" | "resolved" | "accepted_risk"; ownerId?: UUID; createdBy: UUID; resolvedAt?: ISODate; }
export interface SecurityEvent extends BaseEntity { event: string; source: "SecurityOS" | string; actorId: UUID; data: Record<string, unknown>; }
export interface AuditLog extends BaseEntity { actorId: UUID; role: ApiRole; action: string; entityType: string; entityId?: UUID; before?: unknown; after?: unknown; }
export interface SecurityState { identities: Identity[]; roles: SecurityRole[]; groups: SecurityGroup[]; assignments: RoleAssignment[]; policies: SecurityPolicy[]; sessions: SecuritySession[]; apiKeys: ApiKey[]; secrets: Secret[]; secretVersions: SecretVersion[]; controls: ComplianceControl[]; evidences: ComplianceEvidence[]; accessReviews: AccessReview[]; findings: SecurityFinding[]; events: SecurityEvent[]; auditLogs: AuditLog[]; }

export class HttpError extends Error { constructor(public readonly statusCode: number, message: string, public readonly details?: unknown) { super(message); } }
export function nowIso(): string { return new Date().toISOString(); }
export function newId(prefix = "id"): string { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`; }
export function plusDays(days: number): string { const d = new Date(); d.setUTCDate(d.getUTCDate() + days); return d.toISOString(); }
export function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
export function badRequest(message: string, details?: unknown): never { throw new HttpError(400, message, details); }
export function notFound(message: string, details?: unknown): never { throw new HttpError(404, message, details); }
export function forbidden(message: string, details?: unknown): never { throw new HttpError(403, message, details); }
export function conflict(message: string, details?: unknown): never { throw new HttpError(409, message, details); }
export function requireString(value: unknown, field: string): string { if (typeof value !== "string" || value.trim() === "") badRequest(`${field} is required`); return value.trim(); }
export function optionalString(value: unknown): string | undefined { if (value === undefined || value === null || value === "") return undefined; return String(value); }
export function asNumber(value: unknown, fallback = 0): number { if (value === undefined || value === null || value === "") return fallback; const n = Number(value); if (!Number.isFinite(n)) badRequest(`Expected number for ${String(value)}`); return n; }
export function asBoolean(value: unknown, fallback = false): boolean { if (value === undefined || value === null) return fallback; if (typeof value === "boolean") return value; if (typeof value === "string") return ["true","1","yes","y"].includes(value.toLowerCase()); return Boolean(value); }
export function asArray<T = string>(value: unknown): T[] { return Array.isArray(value) ? value as T[] : []; }
export function unique(values: string[]): string[] { return [...new Set(values.map((v) => String(v).trim()).filter(Boolean))]; }
export function includesText(value: unknown, query: string): boolean { return String(value ?? "").toLowerCase().includes(query.toLowerCase()); }
export function normalizeEmail(value: unknown): string { return requireString(value, "email").toLowerCase(); }
export function isExpired(expiresAt?: string): boolean { return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now()); }
export function matchPattern(pattern: string, value: string): boolean { if (pattern === "*") return true; if (pattern.endsWith(".*")) return value.startsWith(pattern.slice(0, -1)); return pattern === value; }
export function redact<T>(value: T): T { if (value === undefined || value === null) return value; return JSON.parse(JSON.stringify(value, (key, val) => /secret|password|token|keyHash|encryptedValue|value/i.test(key) ? "***redacted***" : val)); }
export function emptyState(): SecurityState { return { identities: [], roles: [], groups: [], assignments: [], policies: [], sessions: [], apiKeys: [], secrets: [], secretVersions: [], controls: [], evidences: [], accessReviews: [], findings: [], events: [], auditLogs: [] }; }
export class DataStore {
  private state: SecurityState = emptyState(); private readonly filePath: string;
  constructor(filePath: string) { this.filePath = resolve(filePath); this.load(); }
  load(): void { if (!existsSync(this.filePath)) { mkdirSync(dirname(this.filePath), { recursive: true }); this.save(); return; } const raw = readFileSync(this.filePath, "utf-8"); this.state = raw.trim() ? { ...emptyState(), ...JSON.parse(raw) } : emptyState(); }
  save(): void { mkdirSync(dirname(this.filePath), { recursive: true }); writeFileSync(this.filePath, JSON.stringify(this.state, null, 2)); }
  getState(): SecurityState { return this.state; }
  snapshot(): SecurityState { return clone(this.state); }
  reset(nextState = emptyState()): void { this.state = nextState; this.save(); }
  audit(actor: RequestActor, action: string, entityType: string, entityId?: string, before?: unknown, after?: unknown): AuditLog { const now = nowIso(); const audit: AuditLog = { id: newId("audit"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, actorId: actor.userId, role: actor.role, action, entityType, entityId, before: redact(before), after: redact(after) }; this.state.auditLogs.unshift(audit); this.save(); return audit; }
}
export class EventBus { constructor(private readonly store: DataStore) {} emit(actor: RequestActor, event: string, data: Record<string, unknown>): SecurityEvent { const now = nowIso(); const payload: SecurityEvent = { id: newId("evt"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, event, source: "SecurityOS", actorId: actor.userId, data: redact(data) }; this.store.getState().events.unshift(payload); this.store.save(); return payload; } }
export const apiRoles: ApiRole[] = ["viewer", "security_analyst", "iam_admin", "secret_manager", "compliance_manager", "security_admin", "admin", "owner", "auditor"];
const permissionsByApiRole: Record<ApiRole,string[]> = {
  viewer: ["security.read", "security.identities.read", "security.roles.read", "security.groups.read", "security.policies.read"],
  security_analyst: ["security.read", "security.identities.read", "security.roles.read", "security.groups.read", "security.policies.read", "security.access.check", "security.sessions.read", "security.api_keys.read", "security.findings.read", "security.findings.write", "security.events.read", "security.audit.read", "security.analytics.read"],
  iam_admin: ["security.read", "security.identities.read", "security.identities.write", "security.roles.read", "security.roles.write", "security.groups.read", "security.groups.write", "security.assignments.read", "security.assignments.write", "security.policies.read", "security.policies.write", "security.access.check", "security.sessions.read", "security.sessions.write", "security.api_keys.read", "security.api_keys.write", "security.audit.read", "security.analytics.read"],
  secret_manager: ["security.read", "security.secrets.read", "security.secrets.write", "security.secrets.reveal", "security.audit.read", "security.events.read", "security.analytics.read"],
  compliance_manager: ["security.read", "security.controls.read", "security.controls.write", "security.evidence.read", "security.evidence.write", "security.reviews.read", "security.reviews.write", "security.findings.read", "security.findings.write", "security.audit.read", "security.analytics.read"],
  security_admin: ["*"], admin: ["*"], owner: ["*"],
  auditor: ["security.read", "security.identities.read", "security.roles.read", "security.groups.read", "security.assignments.read", "security.policies.read", "security.sessions.read", "security.api_keys.read", "security.secrets.read", "security.controls.read", "security.evidence.read", "security.reviews.read", "security.findings.read", "security.events.read", "security.audit.read", "security.analytics.read"]
};
export function isApiRole(value: string): value is ApiRole { return apiRoles.includes(value as ApiRole); }
export function hasPermission(role: ApiRole, permission?: string): boolean { if (!permission) return true; const granted = permissionsByApiRole[role] ?? []; return granted.includes("*") || granted.includes(permission); }
export function requirePermission(role: ApiRole, permission?: string): void { if (!hasPermission(role, permission)) forbidden(`Role ${role} does not have permission ${permission}`); }
export function listPermissions(role: ApiRole): string[] { return permissionsByApiRole[role] ?? []; }
export class SecretEngine {
  static seal(value: string): string { return `demo-sealed:${value.split("").reverse().join("")}`; }
  static reveal(encryptedValue: string): string { return encryptedValue.replace(/^demo-sealed:/, "").split("").reverse().join(""); }
  static mask(value: string): string { if (value.length <= 4) return "****"; return `${value.slice(0,2)}${"*".repeat(Math.max(4, value.length - 4))}${value.slice(-2)}`; }
  static randomToken(prefix = "sk"): string { return `${prefix}_${randomBytes(18).toString("hex")}`; }
  static sha256(value: string): string { return createHash("sha256").update(value).digest("hex"); }
}
export class AccessEngine {
  static evaluate(input: { subjectId: string; action: string; resource: string; identities: Identity[]; roles: SecurityRole[]; groups: SecurityGroup[]; assignments: RoleAssignment[]; policies: SecurityPolicy[] }): AccessDecision {
    const identity = input.identities.find((i) => i.id === input.subjectId);
    if (!identity) return this.deny(input, ["identity.not_found"]);
    if (!["active", "invited"].includes(identity.status)) return this.deny(input, [`identity.status.${identity.status}`]);
    const activeAssignments = input.assignments.filter((a) => a.status === "active" && !isExpired(a.expiresAt));
    const groupIds = unique([...identity.groups, ...input.groups.filter((g) => g.members.includes(identity.id)).map((g) => g.id)]);
    const roleIds = unique([...activeAssignments.filter((a) => a.subjectType === "identity" && a.subjectId === identity.id).map((a) => a.roleId), ...activeAssignments.filter((a) => a.subjectType === "group" && groupIds.includes(a.subjectId)).map((a) => a.roleId), ...input.groups.filter((g) => groupIds.includes(g.id) && g.status === "active").flatMap((g) => g.roleIds)]);
    const roles = input.roles.filter((r) => r.status === "active" && roleIds.includes(r.id));
    const permissions = unique(roles.flatMap((r) => r.permissions));
    const roleNames = roles.map((r) => r.name);
    const hasRuntimePermission = permissions.some((p) => matchPattern(p, input.action) || matchPattern(p, `${input.resource}.${input.action}`));
    const matched = input.policies.filter((p) => p.status === "active" && this.matchesPolicy(p, input.action, input.resource, roleNames)).sort((a,b) => b.priority - a.priority);
    const denies = matched.filter((p) => p.effect === "deny");
    if (denies.length) return { allowed: false, subjectId: input.subjectId, action: input.action, resource: input.resource, permissions, roles: roleNames, matchedPolicyIds: matched.map((p) => p.id), reasons: [`policy.deny:${denies.map((p) => p.name).join(",")}`], evaluatedAt: nowIso() };
    const allows = matched.filter((p) => p.effect === "allow");
    const reasons = [...(hasRuntimePermission ? ["permission.match"] : []), ...(allows.length ? [`policy.allow:${allows.map((p) => p.name).join(",")}`] : [])];
    const allowed = hasRuntimePermission || allows.length > 0;
    if (!allowed) reasons.push("no_permission_or_policy_match");
    return { allowed, subjectId: input.subjectId, action: input.action, resource: input.resource, permissions, roles: roleNames, matchedPolicyIds: matched.map((p) => p.id), reasons, evaluatedAt: nowIso() };
  }
  private static matchesPolicy(policy: SecurityPolicy, action: string, resource: string, roleNames: string[]): boolean { return (policy.actions.length === 0 || policy.actions.some((p) => matchPattern(p, action))) && (policy.resources.length === 0 || policy.resources.some((p) => matchPattern(p, resource))) && (policy.subjectRoles.length === 0 || policy.subjectRoles.includes("*") || roleNames.some((r) => policy.subjectRoles.includes(r))); }
  private static deny(input: { subjectId: string; action: string; resource: string }, reasons: string[]): AccessDecision { return { allowed: false, subjectId: input.subjectId, action: input.action, resource: input.resource, permissions: [], roles: [], matchedPolicyIds: [], reasons, evaluatedAt: nowIso() }; }
}
export class AnalyticsEngine {
  static calculate(state: SecurityState, tenantId: string): Record<string, unknown> {
    const identities = state.identities.filter((i) => i.tenantId === tenantId);
    const activeIdentities = identities.filter((i) => i.status === "active");
    const mfaEnabled = activeIdentities.filter((i) => i.mfaEnabled).length;
    const controls = state.controls.filter((c) => c.tenantId === tenantId);
    const findings = state.findings.filter((f) => f.tenantId === tenantId && f.status !== "resolved");
    const activeSecrets = state.secrets.filter((s) => s.tenantId === tenantId && s.status === "active").length;
    const expiredSessions = state.sessions.filter((s) => s.tenantId === tenantId && s.status === "active" && isExpired(s.expiresAt)).length;
    const expiredApiKeys = state.apiKeys.filter((k) => k.tenantId === tenantId && k.status === "active" && isExpired(k.expiresAt)).length;
    const compliant = controls.filter((c) => ["compliant", "waived"].includes(c.status)).length;
    return { activeIdentities: activeIdentities.length, mfaEnabled, mfaCoveragePercent: activeIdentities.length ? Math.round((mfaEnabled / activeIdentities.length) * 100) : 0, activeSecrets, expiredSessions, expiredApiKeys, controls: { total: controls.length, compliant, compliancePercent: controls.length ? Math.round((compliant / controls.length) * 100) : 0, byStatus: countBy(controls, "status") }, findings: { open: findings.length, bySeverity: countBy(findings, "severity") } };
  }
}
function countBy(items: any[], key: string): Record<string, number> { return items.reduce((acc, item) => { const value = String(item[key]); acc[value] = (acc[value] ?? 0) + 1; return acc; }, {} as Record<string, number>); }
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";
export interface HttpContext { req: IncomingMessage; res: ServerResponse; method: HttpMethod; path: string; query: URLSearchParams; params: Record<string,string>; body: any; actor: RequestActor; }
export type Handler = (ctx: HttpContext) => Promise<unknown> | unknown;
interface RouteDefinition { method: HttpMethod; path: string; regex: RegExp; paramNames: string[]; permission?: string; handler: Handler; }
export class Router {
  private routes: RouteDefinition[] = [];
  add(method: HttpMethod, path: string, handler: Handler, permission?: string): void { const { regex, paramNames } = compilePath(path); this.routes.push({ method, path, regex, paramNames, permission, handler }); }
  get(path: string, handler: Handler, permission?: string): void { this.add("GET", path, handler, permission); }
  post(path: string, handler: Handler, permission?: string): void { this.add("POST", path, handler, permission); }
  put(path: string, handler: Handler, permission?: string): void { this.add("PUT", path, handler, permission); }
  listRoutes(): Array<{ method: string; path: string; permission?: string }> { return this.routes.map(({method,path,permission}) => ({ method, path, permission })); }
  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> { try { const method = String(req.method ?? "GET").toUpperCase() as HttpMethod; if (method === "OPTIONS") { sendJson(res, 200, { ok: true }); return; } const url = new URL(req.url ?? "/", "http://localhost"); const path = normalizePath(url.pathname); const route = this.match(method, path); if (!route) { sendJson(res, 404, { ok: false, error: "Route not found", method, path }); return; } const roleHeader = getHeader(req, "x-role") ?? "viewer"; const role: ApiRole = isApiRole(roleHeader) ? roleHeader : "viewer"; requirePermission(role, route.permission); const actor: RequestActor = { tenantId: getHeader(req, "x-tenant-id") ?? process.env.DEFAULT_TENANT_ID ?? "demo-tenant", userId: getHeader(req, "x-user-id") ?? `${role}-user`, role }; const body = await parseJsonBody(req); const result = await route.handler({ req, res, method, path, query: url.searchParams, params: route.params, body, actor }); if (!res.headersSent) sendJson(res, 200, { ok: true, data: result ?? null }); } catch (error) { handleError(res, error); } }
  private match(method: HttpMethod, path: string): (RouteDefinition & { params: Record<string,string> }) | undefined { for (const route of this.routes) { if (route.method !== method) continue; const match = route.regex.exec(path); if (!match) continue; const params: Record<string,string> = {}; route.paramNames.forEach((name, index) => { params[name] = decodeURIComponent(match[index+1] ?? ""); }); return { ...route, params }; } return undefined; }
}
function compilePath(path: string): { regex: RegExp; paramNames: string[] } { const paramNames: string[] = []; const regexSource = normalizePath(path).split("/").map((part) => { if (part.startsWith(":")) { paramNames.push(part.slice(1)); return "([^/]+)"; } return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("/"); return { regex: new RegExp(`^${regexSource}$`), paramNames }; }
function normalizePath(path: string): string { if (!path.startsWith("/")) return `/${path}`; if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1); return path; }
async function parseJsonBody(req: IncomingMessage): Promise<unknown> { const method = String(req.method ?? "GET").toUpperCase(); if (["GET", "DELETE", "OPTIONS"].includes(method)) return undefined; const chunks: string[] = []; for await (const chunk of req) chunks.push(String(chunk)); const raw = chunks.join("").trim(); if (!raw) return {}; try { return JSON.parse(raw); } catch { throw new HttpError(400, "Request body must be valid JSON"); } }
function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void { res.statusCode = statusCode; res.setHeader("Content-Type", "application/json"); res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-role,x-tenant-id,x-user-id"); res.end(JSON.stringify(payload, null, 2)); }
function getHeader(req: IncomingMessage, name: string): string | undefined { const raw = req.headers[name] ?? req.headers[name.toLowerCase()]; if (Array.isArray(raw)) return raw[0]; return typeof raw === "string" ? raw : undefined; }
function handleError(res: ServerResponse, error: unknown): void { if (error instanceof HttpError) { sendJson(res, error.statusCode, { ok: false, error: error.message, details: error.details }); return; } sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : "Internal server error" }); }
