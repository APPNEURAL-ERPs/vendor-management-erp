import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { ResourceState, RequestActor, ResourceAuditLog } from "../domain";
import { emptyState, clone, nowIso } from "./utils";

export class DataStore {
  private state: ResourceState = emptyState();
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = resolve(filePath);
    this.load();
  }

  load(): void {
    if (!existsSync(this.filePath)) {
      mkdirSync(dirname(this.filePath), { recursive: true });
      this.save();
      return;
    }

    const raw = readFileSync(this.filePath, "utf-8");
    this.state = raw.trim()
      ? { ...emptyState(), ...JSON.parse(raw) }
      : emptyState();
  }

  save(): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(this.state, null, 2));
  }

  getState(): ResourceState {
    return this.state;
  }

  snapshot(): ResourceState {
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
    after?: unknown
  ): ResourceAuditLog {
    const now = nowIso();
    const audit: ResourceAuditLog = {
      id: `audit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      actorId: actor.userId,
      role: actor.role,
      action,
      entityType,
      entityId,
      before: this.redact(before),
      after: this.redact(after),
    };

    this.state.auditLogs.unshift(audit);
    this.save();
    return audit;
  }

  private redact(value: unknown): unknown {
    if (value === undefined || value === null) return value;
    return JSON.parse(
      JSON.stringify(value, (key, val) =>
        /secret|password|token|keyHash|encryptedValue|value/i.test(key)
          ? "***redacted***"
          : val
      )
    );
  }
}
