import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { SearchState, SearchAuditLog, RequestActor } from "../domain";
import { newId, nowIso } from "./id";
import { clone } from "./utils";

export function emptyState(): SearchState {
  return {
    indexes: [],
    vectorIndexes: [],
    documents: [],
    queries: [],
    results: [],
    synonyms: [],
    savedSearches: [],
    alerts: [],
    clicks: [],
    embeddings: [],
    analytics: [],
    auditLogs: [],
    events: []
  };
}

export class DataStore {
  private state: SearchState;
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

  getState(): SearchState {
    return this.state;
  }

  snapshot(): SearchState {
    return clone(this.state);
  }

  replaceState(nextState: SearchState): void {
    this.state = nextState;
    this.save();
  }

  audit(
    actor: RequestActor,
    action: string,
    entityType: string,
    entityId?: string,
    queryText?: string,
    filters?: unknown,
    resultCount?: number,
    success = true,
    errorMessage?: string
  ): SearchAuditLog {
    const audit: SearchAuditLog = {
      id: newId("audit"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      actorId: actor.userId,
      role: actor.role,
      action,
      entityType,
      entityId,
      queryText,
      filters: filters as any,
      resultCount,
      success,
      errorMessage
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
