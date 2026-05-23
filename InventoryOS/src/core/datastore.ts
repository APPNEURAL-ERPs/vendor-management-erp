import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { InventoryAuditLog, InventoryState, RequestActor } from "../types";
import { newId, nowIso } from "./id";
import { clone } from "./utils";

export function emptyState(): InventoryState {
  return {
    items: [],
    warehouses: [],
    zones: [],
    locations: [],
    stockLevels: [],
    inwards: [],
    outwards: [],
    transfers: [],
    transferItems: [],
    adjustments: [],
    reservations: [],
    reorderRules: [],
    stockCounts: [],
    stockCountItems: [],
    batches: [],
    serials: [],
    events: [],
    auditLogs: []
  };
}

export class DataStore {
  private state: InventoryState;
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

  getState(): InventoryState {
    return this.state;
  }

  snapshot(): InventoryState {
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
  ): InventoryAuditLog {
    const audit: InventoryAuditLog = {
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

  emit(type: string, source: string, data: Record<string, unknown>, actor: RequestActor): void {
    const event = {
      id: newId("evt"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type,
      source,
      data,
      correlationId: data.correlationId as string | undefined
    };
    this.state.events.unshift(event);
    this.save();
  }
}
