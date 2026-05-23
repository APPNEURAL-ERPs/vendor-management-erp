import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { AuditLog, PeopleState, RequestActor } from "./domain";
import { newId, nowIso } from "./id";
import { clone } from "./utils";

export function emptyState(): PeopleState {
  return {
    employees: [],
    departments: [],
    teams: [],
    roles: [],
    pipelines: [],
    candidates: [],
    interviews: [],
    offers: [],
    onboardingChecklists: [],
    attendanceRecords: [],
    leaveRequests: [],
    leaveBalances: [],
    performanceReviews: [],
    goals: [],
    engagementRecords: [],
    employeeDocuments: [],
    assets: [],
    events: [],
    auditLogs: []
  };
}

export class DataStore {
  private state: PeopleState;
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

  getState(): PeopleState {
    return this.state;
  }

  snapshot(): PeopleState {
    return clone(this.state);
  }

  replaceState(nextState: PeopleState): void {
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
