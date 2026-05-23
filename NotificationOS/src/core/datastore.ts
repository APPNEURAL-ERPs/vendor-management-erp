import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { NotificationOSState, NotificationAuditLog, RequestActor } from "./domain";
import { newId, nowIso } from "./id";
import { clone } from "./utils";

export function emptyState(): NotificationOSState {
  return {
    channels: [],
    providers: [],
    templates: [],
    notifications: [],
    preferences: [],
    rules: [],
    schedules: [],
    reminders: [],
    alerts: [],
    announcements: [],
    campaigns: [],
    deliveryLogs: [],
    queueItems: [],
    retryPolicies: [],
    costRecords: [],
    events: [],
    auditLogs: []
  };
}

export class DataStore {
  private state: NotificationOSState;
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

  getState(): NotificationOSState {
    return this.state;
  }

  snapshot(): NotificationOSState {
    return clone(this.state);
  }

  replaceState(nextState: NotificationOSState): void {
    this.state = nextState;
    this.save();
  }

  audit(actor: RequestActor, action: string, entityType: string, entityId?: string, before?: unknown, after?: unknown): NotificationAuditLog {
    const audit: NotificationAuditLog = {
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

  emit(type: string, source: string, data: Record<string, unknown>, correlationId?: string): void {
    const event = {
      id: newId("evt"),
      tenantId: "demo-tenant",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type,
      source,
      data,
      correlationId
    };
    this.state.events.unshift(event);
    this.save();
  }

  reset(nextState = emptyState()): void {
    this.state = nextState;
    this.save();
  }
}
