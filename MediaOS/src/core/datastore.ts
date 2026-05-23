import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { MediaOSState, MediaAuditLog, RequestActor } from "../types";
import { newId, nowIso } from "./id";
import { clone } from "./utils";

export function emptyState(): MediaOSState {
  return {
    libraries: [],
    assets: [],
    folders: [],
    collections: [],
    versions: [],
    thumbnails: [],
    renditions: [],
    processingJobs: [],
    captions: [],
    transcripts: [],
    publishTargets: [],
    schedules: [],
    licenses: [],
    accessRules: [],
    analyticsEvents: [],
    auditLogs: [],
    events: [],
    cdnRecords: []
  };
}

export class DataStore {
  private state: MediaOSState;
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

  getState(): MediaOSState {
    return this.state;
  }

  snapshot(): MediaOSState {
    return clone(this.state);
  }

  replaceState(nextState: MediaOSState): void {
    this.state = nextState;
    this.save();
  }

  audit(actor: RequestActor, action: string, entityType: string, entityId?: string, before?: unknown, after?: unknown): MediaAuditLog {
    const audit: MediaAuditLog = {
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
