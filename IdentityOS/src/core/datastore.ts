import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { IdentityState, IdentityAuditLog, RequestActor } from "../domain";
import { nowIso, newId } from "./id";
import { clone, redact } from "./utils";

export function emptyState(): IdentityState {
  return {
    users: [],
    accounts: [],
    tenantIdentities: [],
    organizationIdentities: [],
    organizations: [],
    sessions: [],
    trustedDevices: [],
    mfaFactors: [],
    roles: [],
    permissions: [],
    roleAssignments: [],
    groups: [],
    invitations: [],
    ssoProviders: [],
    apiKeys: [],
    serviceAccounts: [],
    auditLogs: [],
    accessReviews: [],
    riskEvents: [],
    events: [],
    policies: []
  };
}

export class DataStore {
  private state: IdentityState;
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

  getState(): IdentityState {
    return this.state;
  }

  snapshot(): IdentityState {
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
    after?: unknown,
    metadata: Record<string, unknown> = {}
  ): IdentityAuditLog {
    const audit: IdentityAuditLog = {
      id: newId("audit"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      actorId: actor.userId,
      role: actor.role,
      action,
      entityType,
      entityId,
      before: redact(before),
      after: redact(after),
      metadata
    };

    this.state.auditLogs.unshift(audit);
    this.save();
    return audit;
  }

  emit(
    actor: RequestActor,
    eventType: string,
    data: Record<string, unknown>,
    correlationId?: string
  ) {
    const event = {
      id: newId("evt"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type: eventType as any,
      source: "IdentityOS",
      actorId: actor.userId,
      data: redact(data),
      correlationId
    };

    this.state.events.unshift(event as any);
    this.save();
    return event;
  }
}
