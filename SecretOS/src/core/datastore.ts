import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { SecretOSState, SecretAuditLog, RequestActor } from "../domain";
import { newId, nowIso } from "./id";
import { clone, redact } from "./utils";

export function emptyState(): SecretOSState {
  return {
    secrets: [],
    secretVersions: [],
    dependencies: [],
    rotationPolicies: [],
    rotationRuns: [],
    accessGrants: [],
    accessRequests: [],
    auditLogs: [],
    leakEvents: [],
    secretRisks: [],
    apiKeys: [],
    credentials: [],
    encryptionKeys: [],
    incidents: [],
    policies: [],
    backups: [],
    usage: [],
    namespaces: []
  };
}

export class DataStore {
  private state: SecretOSState;
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

  getState(): SecretOSState {
    return this.state;
  }

  snapshot(): SecretOSState {
    return clone(this.state);
  }

  reset(nextState = emptyState()): void {
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
    extras?: Record<string, unknown>
  ): SecretAuditLog {
    const audit: SecretAuditLog = {
      id: newId("audit"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      secretId: entityType === "secret" ? entityId! : "",
      actorId: actor.userId,
      actorRole: actor.role,
      action: action as any,
      before: redact(before) as Record<string, unknown> | undefined,
      after: redact(after) as Record<string, unknown> | undefined,
      success: true,
      ...extras
    };
    this.state.auditLogs.unshift(audit);
    this.save();
    return audit;
  }

  logUsage(
    tenantId: string,
    secretId: string,
    accessorType: "user" | "service" | "workflow" | "ci_cd" | "tenant" | "integration",
    accessorId: string | undefined,
    accessorName: string | undefined,
    accessType: "read" | "reveal" | "rotate" | "update",
    success: boolean
  ): void {
    this.state.usage.unshift({
      id: newId("usage"),
      tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      secretId,
      accessorType,
      accessorId,
      accessorName,
      accessedAt: nowIso(),
      accessType,
      success
    });
    this.save();
  }
}
