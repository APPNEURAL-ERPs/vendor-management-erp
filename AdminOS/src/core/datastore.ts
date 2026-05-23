import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { AdminState, AuditLog, RequestActor } from "../domain";
import { newId, nowIso } from "./id";
import { clone } from "./utils";

export function emptyState(): AdminState {
  return {
    settings: [],
    orgUnits: [],
    requests: [],
    resources: [],
    approvals: [],
    events: [],
    auditLogs: []
  };
}

export class DataStore {
  private state: AdminState;
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

  getState(): AdminState {
    return this.state;
  }

  snapshot(): AdminState {
    return clone(this.state);
  }

  replaceState(nextState: AdminState): void {
    this.state = nextState;
    this.save();
  }

  audit(actor: RequestActor, action: string, entityType: string, entityId?: string, before?: unknown, after?: unknown): AuditLog {
    const audit: AuditLog = {
      id: newId("audit"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      actorId: actor.userId,
      role: actor.role,
      action,
      entityType,
      entityId,
      before,
      after,
      metadata: {}
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
