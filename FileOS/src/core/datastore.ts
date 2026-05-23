import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { FileOSState, FileAuditLog, RequestActor, Role } from "../domain";
import { newId, nowIso } from "./id";
import { clone, redact } from "./utils";

export function emptyState(): FileOSState {
  return {
    files: [],
    folders: [],
    versions: [],
    metadata: [],
    uploads: [],
    downloads: [],
    permissions: [],
    shareLinks: [],
    previews: [],
    buckets: [],
    scanResults: [],
    processingJobs: [],
    retentionRules: [],
    auditLogs: [],
    events: [],
    analytics: []
  };
}

export class DataStore {
  private state: FileOSState;
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = resolve(filePath);
    this.state = emptyState();
    this.load();
  }

  load(): void {
    if (!existsSync(this.filePath)) {
      mkdirSync(dirname(this.filePath), { recursive: true });
      this.state = emptyState();
      this.save();
      return;
    }
    const raw = readFileSync(this.filePath, "utf-8");
    this.state = raw.trim() ? { ...emptyState(), ...JSON.parse(raw) } : emptyState();
  }

  save(): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(this.state, null, 2));
  }

  getState(): FileOSState {
    return this.state;
  }

  snapshot(): FileOSState {
    return clone(this.state);
  }

  replaceState(nextState: FileOSState): void {
    this.state = nextState;
    this.save();
  }

  audit(
    actor: RequestActor,
    action: string,
    entityType: string,
    entityId?: string,
    before?: unknown,
    after?: unknown,
    metadata?: Record<string, unknown>
  ): FileAuditLog {
    const audit: FileAuditLog = {
      id: newId("audit"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      actorId: actor.userId,
      role: actor.role,
      action: action as FileAuditLog["action"],
      entityType,
      entityId,
      before: redact(before),
      after: redact(after),
      metadata
    };
    this.state.auditLogs.unshift(audit);
    this.save();
    return audit;
  }

  reset(nextState = emptyState()): void {
    this.state = nextState;
    this.save();
  }
}

export const apiRoles: Role[] = ["viewer", "file_user", "file_admin", "admin", "owner"];

const permissionsByApiRole: Record<Role, string[]> = {
  viewer: ["file.read", "file.preview"],
  file_user: [
    "file.read", "file.preview", "file.upload", "file.download",
    "file.share", "file.update", "file.scan"
  ],
  file_admin: [
    "file.read", "file.preview", "file.upload", "file.download",
    "file.share", "file.update", "file.delete", "file.archive",
    "file.restore", "file.scan", "file.manage_permissions",
    "file.audit.read"
  ],
  admin: ["*"],
  owner: ["*"]
};

export function isRole(value: string): value is Role {
  return apiRoles.includes(value as Role);
}

export function hasPermission(role: Role, permission?: string): boolean {
  if (!permission) return true;
  const granted = permissionsByApiRole[role] ?? [];
  return granted.includes("*") || granted.includes(permission);
}

export function requirePermission(role: Role, permission?: string): void {
  if (!hasPermission(role, permission)) {
    throw new (require("./utils").HttpError)(403, `Role ${role} does not have permission ${permission}`);
  }
}

export function listPermissions(role: Role): string[] {
  return permissionsByApiRole[role] ?? [];
}
