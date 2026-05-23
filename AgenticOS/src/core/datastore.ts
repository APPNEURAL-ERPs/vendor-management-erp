import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { AgenticState, AgentEvent, AuditLog, RequestActor } from "./domain";
import { newId, nowIso } from "./id";
import { clone } from "./utils";

export function emptyState(): AgenticState {
  return {
    agents: [],
    agentTemplates: [],
    agentRuns: [],
    agentWorkflows: [],
    toolRegistry: [],
    toolRuns: [],
    guardrails: [],
    agentMemories: [],
    approvalRequests: [],
    evaluationSuites: [],
    evaluationRuns: [],
    events: [],
    auditLogs: []
  };
}

export class DataStore {
  private state: AgenticState;
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

  getState(): AgenticState {
    return this.state;
  }

  snapshot(): AgenticState {
    return clone(this.state);
  }

  replaceState(nextState: AgenticState): void {
    this.state = nextState;
    this.save();
  }

  reset(nextState = emptyState()): void {
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

  emit(actor: RequestActor, event: string, data: Record<string, unknown>): void {
    const evt: AgentEvent = {
      id: newId("event"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type: event,
      source: "AgenticOS",
      data
    };
    this.state.events.unshift(evt);
    this.save();
  }
}
