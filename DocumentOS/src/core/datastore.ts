import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { DocumentState, AuditLog, RequestActor } from "../types";
import { newId, nowIso } from "./id";
import { clone } from "./utils";

export function emptyState(): DocumentState {
  return {
    documents: [],
    templates: [],
    versions: [],
    pdfRenders: [],
    docxExports: [],
    htmlExports: [],
    signatureRequests: [],
    approvals: [],
    workflows: [],
    shareLinks: [],
    accessLogs: [],
    validations: [],
    retentionRules: [],
    auditLogs: [],
    storageObjects: [],
    analyticsEvents: [],
    ocrResults: [],
    parserResults: []
  };
}

export class DataStore {
  private state: DocumentState;
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

  getState(): DocumentState {
    return this.state;
  }

  snapshot(): DocumentState {
    return clone(this.state);
  }

  replaceState(nextState: DocumentState): void {
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
  ): AuditLog {
    const audit: AuditLog = {
      id: newId("audit"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      documentId: entityId ?? "",
      actorId: actor.userId,
      action: action as any,
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
