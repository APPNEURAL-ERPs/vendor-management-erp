import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { CareerState, AuditLog, CareerEvent } from "./domain";
import { newId, nowIso } from "./id";
import { clone } from "./utils";

export function emptyState(): CareerState {
  return {
    jobs: [],
    candidates: [],
    resumes: [],
    pipelineStages: [],
    applications: [],
    interviews: [],
    scorecards: [],
    offers: [],
    talentPools: [],
    careerPaths: [],
    skillProfiles: [],
    events: [],
    auditLogs: []
  };
}

export class DataStore {
  private state: CareerState;
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

  getState(): CareerState {
    return this.state;
  }

  snapshot(): CareerState {
    return clone(this.state);
  }

  replaceState(nextState: CareerState): void {
    this.state = nextState;
    this.save();
  }

  audit(
    actor: { tenantId: string; userId: string; role: string },
    action: string,
    entityType?: string,
    entityId?: string,
    before?: unknown,
    after?: unknown
  ): AuditLog {
    const audit: AuditLog = {
      id: newId("audit"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      actorId: actor.userId,
      actorName: `${actor.role}-user`,
      role: actor.role as any,
      action,
      entityType: entityType || "unknown",
      entityId,
      before,
      after
    };
    this.state.auditLogs.unshift(audit);
    this.save();
    return audit;
  }

  emit(
    actor: { tenantId: string; userId: string; role: string },
    type: string,
    entityType?: string,
    entityId?: string,
    data?: Record<string, unknown>
  ): CareerEvent {
    const event: CareerEvent = {
      id: newId("evt"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type,
      entityType: entityType || undefined,
      entityId,
      actorId: actor.userId,
      role: actor.role,
      data: data || {}
    };
    this.state.events.unshift(event);
    this.save();
    return event;
  }

  reset(nextState = emptyState()): void {
    this.state = nextState;
    this.save();
  }
}
