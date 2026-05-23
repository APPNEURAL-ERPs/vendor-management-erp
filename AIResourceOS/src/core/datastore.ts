import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { AIResourceState, AuditLog, RequestActor } from "../domain";
import { newId, nowIso } from "./id";
import { clone } from "./utils";

export function emptyState(): AIResourceState {
  return {
    models: [],
    budgets: [],
    usage: [],
    configs: [],
    allocations: [],
    quotas: [],
    events: [],
    auditLogs: []
  };
}

export class DataStore {
  private state: AIResourceState;
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

  getState(): AIResourceState {
    return this.state;
  }

  snapshot(): AIResourceState {
    return clone(this.state);
  }

  replaceState(nextState: AIResourceState): void {
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
      after
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

export class EventBus {
  constructor(private readonly store: DataStore) {}

  emit(actor: RequestActor, event: string, data: Record<string, unknown>): AIResourceEvent {
    const now = nowIso();
    const payload: AIResourceEvent = {
      id: newId("evt"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      type: event,
      source: "AIResourceOS",
      data: data as Record<string, unknown>,
      correlationId: data.correlationId as UUID | undefined
    };
    this.store.getState().events.unshift(payload);
    this.store.save();
    return payload;
  }
}

import { AIResourceEvent, UUID } from "../domain";
