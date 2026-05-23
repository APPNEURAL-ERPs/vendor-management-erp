import { DataStore } from "./core/datastore";
import {
  Actor,
  AuditEvent,
  AuditInvestigation,
  AuditOverview,
  AuditReport,
  ChangeSet,
  ComplianceAudit,
  EvidenceLink,
  IntegrityHash,
  ReportFilters,
  RequestActor,
  RetentionPolicy,
  Target
} from "./domain";
import { badRequest, conflict, notFound } from "./core/errors";
import { newId, nowIso } from "./core/id";
import { clone, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, optionalObject, pickQuery } from "./core/utils";

export class AuditService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "AuditOS service is ready";
  }

  overview(actor: RequestActor): AuditOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    const events = state.events.filter((item) => item.tenantId === tenant);

    const eventsByType: Record<string, number> = {};
    const eventsByModule: Record<string, number> = {};

    for (const event of events) {
      eventsByType[event.eventType] = (eventsByType[event.eventType] ?? 0) + 1;
      if (event.module) {
        eventsByModule[event.module] = (eventsByModule[event.module] ?? 0) + 1;
      }
    }

    const evidenceLinks = state.evidenceLinks.filter((item) => item.tenantId === tenant);

    return {
      totalEvents: events.length,
      sensitiveEvents: events.filter((item) => item.sensitive).length,
      complianceEvents: events.filter((item) => item.complianceRelevant).length,
      failedEvents: events.filter((item) => item.status === "failure").length,
      eventsByType,
      eventsByModule,
      recentEvents: clone(events.slice(0, 10)),
      evidenceLinks: {
        total: evidenceLinks.length,
        pending: evidenceLinks.filter((item) => item.reviewStatus === "pending").length,
        approved: evidenceLinks.filter((item) => item.reviewStatus === "approved").length
      },
      reports: {
        total: state.reports.filter((item) => item.tenantId === tenant).length,
        completed: state.reports.filter((item) => item.tenantId === tenant && item.status === "completed").length
      },
      investigations: {
        open: state.investigations.filter((item) => item.tenantId === tenant && item.status === "open").length,
        inProgress: state.investigations.filter((item) => item.tenantId === tenant && item.status === "in_progress").length
      }
    };
  }

  listEvents(actor: RequestActor, query?: URLSearchParams): AuditEvent[] {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    const search = pickQuery(query, "search")?.toLowerCase();
    const eventType = pickQuery(query, "eventType");
    const module = pickQuery(query, "module");
    const status = pickQuery(query, "status");
    const sensitive = query?.get("sensitive");
    const startDate = pickQuery(query, "startDate");
    const endDate = pickQuery(query, "endDate");

    return clone(state.events.filter((item) => {
      if (item.tenantId !== tenant) return false;
      if (search && !`${item.eventType} ${item.action} ${item.actorDisplayName ?? ""} ${item.resourceName ?? ""}`.toLowerCase().includes(search)) return false;
      if (eventType && item.eventType !== eventType) return false;
      if (module && item.module !== module) return false;
      if (status && item.status !== status) return false;
      if (sensitive === "true" && !item.sensitive) return false;
      if (sensitive === "false" && item.sensitive) return false;
      if (startDate && item.createdAt < startDate) return false;
      if (endDate && item.createdAt > endDate) return false;
      return true;
    }));
  }

  getEvent(id: string, actor: RequestActor): AuditEvent {
    const event = this.store.getState().events.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!event) notFound("Audit event not found");
    return clone(event);
  }

  createEvent(input: unknown, actor: RequestActor): AuditEvent {
    const body = ensureObject(input, "event");
    const state = this.store.getState();

    const event: AuditEvent = {
      id: newId("evt"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      eventType: ensureString(body.eventType, "event.eventType"),
      module: body.module ? String(body.module) : undefined,
      action: ensureString(body.action, "event.action"),
      status: String(body.status ?? "success") as AuditEvent["status"],
      actorId: ensureString(body.actorId, "event.actorId"),
      actorType: body.actorType ? String(body.actorType) : undefined,
      actorDisplayName: body.actorDisplayName ? String(body.actorDisplayName) : undefined,
      resourceType: body.resourceType ? String(body.resourceType) : undefined,
      resourceId: body.resourceId ? String(body.resourceId) : undefined,
      resourceName: body.resourceName ? String(body.resourceName) : undefined,
      approvalId: body.approvalId ? String(body.approvalId) : undefined,
      ipAddress: body.ipAddress ? String(body.ipAddress) : undefined,
      device: body.device ? String(body.device) : undefined,
      location: body.location ? String(body.location) : undefined,
      reason: body.reason ? String(body.reason) : undefined,
      sensitive: ensureBoolean(body.sensitive, false),
      complianceRelevant: ensureBoolean(body.complianceRelevant, false),
      metadata: optionalObject(body.metadata),
      changeSetIds: [],
      evidenceLinkIds: []
    };

    const latestEvent = state.events[0];
    const previousHash = latestEvent?.currentHash ?? "genesis";
    const hashInput = `${event.id}:${event.eventType}:${event.actorId}:${event.createdAt}:${previousHash}`;
    event.previousHash = previousHash;
    event.currentHash = this.computeHash(hashInput);

    state.events.unshift(event);
    this.store.save();
    this.store.audit(actor, "event.create", "auditEvent", event.id, undefined, event);

    if (body.target) {
      this.createTarget(body.target, event.id, actor);
    }

    return clone(event);
  }

  searchEvents(input: unknown, actor: RequestActor): AuditEvent[] {
    const body = ensureObject(input, "search");
    const state = this.store.getState();
    const tenant = body.tenantId ? String(body.tenantId) : actor.tenantId;

    const startDate = body.startDate ? String(body.startDate) : undefined;
    const endDate = body.endDate ? String(body.endDate) : undefined;
    const eventTypes = ensureArray<string>(body.eventTypes, "search.eventTypes");
    const actorIds = ensureArray<string>(body.actorIds, "search.actorIds");
    const resourceTypes = ensureArray<string>(body.resourceTypes, "search.resourceTypes");
    const sensitive = body.sensitive as boolean | undefined;
    const complianceRelevant = body.complianceRelevant as boolean | undefined;
    const searchText = body.search ? String(body.search).toLowerCase() : undefined;

    return clone(state.events.filter((item) => {
      if (item.tenantId !== tenant) return false;
      if (startDate && item.createdAt < startDate) return false;
      if (endDate && item.createdAt > endDate) return false;
      if (eventTypes.length > 0 && !eventTypes.includes(item.eventType)) return false;
      if (actorIds.length > 0 && !actorIds.includes(item.actorId)) return false;
      if (resourceTypes.length > 0 && item.resourceType && !resourceTypes.includes(item.resourceType)) return false;
      if (sensitive !== undefined && item.sensitive !== sensitive) return false;
      if (complianceRelevant !== undefined && item.complianceRelevant !== complianceRelevant) return false;
      if (searchText && !`${item.eventType} ${item.action} ${item.actorDisplayName ?? ""} ${item.resourceName ?? ""}`.toLowerCase().includes(searchText)) return false;
      return true;
    }));
  }

  createChangeSet(input: unknown, eventId: string, actor: RequestActor): ChangeSet {
    const body = ensureObject(input, "changeSet");
    const state = this.store.getState();
    const event = state.events.find((item) => item.id === eventId && item.tenantId === actor.tenantId);
    if (!event) notFound("Audit event not found");

    const changeSet: ChangeSet = {
      id: newId("changeset"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      eventId,
      field: ensureString(body.field, "changeSet.field"),
      fieldPath: body.fieldPath ? String(body.fieldPath) : undefined,
      oldValue: body.oldValue,
      newValue: body.newValue,
      changeType: String(body.changeType ?? "update") as ChangeSet["changeType"]
    };

    state.changeSets.push(changeSet);
    event.changeSetIds = [...(event.changeSetIds ?? []), changeSet.id];
    this.store.save();
    this.store.audit(actor, "changeset.create", "changeSet", changeSet.id, undefined, changeSet);

    return clone(changeSet);
  }

  listChangeSets(eventId: string, actor: RequestActor): ChangeSet[] {
    return clone(this.store.getState().changeSets.filter((item) => item.eventId === eventId && item.tenantId === actor.tenantId));
  }

  listActors(actor: RequestActor): Actor[] {
    return clone(this.store.getState().actors.filter((item) => item.tenantId === actor.tenantId));
  }

  createActor(input: unknown, actor: RequestActor): Actor {
    const body = ensureObject(input, "actor");
    const state = this.store.getState();

    const newActor: Actor = {
      id: newId("actor"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      actorId: ensureString(body.actorId, "actor.actorId"),
      actorType: String(body.actorType ?? "user") as Actor["actorType"],
      displayName: body.displayName ? String(body.displayName) : undefined,
      email: body.email ? String(body.email) : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.actors.push(newActor);
    this.store.save();
    this.store.audit(actor, "actor.create", "actor", newActor.id, undefined, newActor);

    return clone(newActor);
  }

  listTargets(actor: RequestActor): Target[] {
    return clone(this.store.getState().targets.filter((item) => item.tenantId === actor.tenantId));
  }

  createTarget(input: unknown, eventId?: string, actor?: RequestActor): Target {
    const body = ensureObject(input, "target");
    const tenantId = actor?.tenantId ?? "demo-tenant";

    const target: Target = {
      id: newId("target"),
      tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      resourceType: ensureString(body.resourceType, "target.resourceType"),
      resourceId: ensureString(body.resourceId, "target.resourceId"),
      resourceName: body.resourceName ? String(body.resourceName) : undefined,
      module: body.module ? String(body.module) : undefined,
      metadata: optionalObject(body.metadata)
    };

    this.store.getState().targets.push(target);
    this.store.save();

    if (actor) {
      this.store.audit(actor, "target.create", "target", target.id, undefined, target);
    }

    return clone(target);
  }

  listEvidence(actor: RequestActor, query?: URLSearchParams): EvidenceLink[] {
    const eventId = pickQuery(query, "eventId");
    const reviewStatus = pickQuery(query, "reviewStatus");

    return clone(this.store.getState().evidenceLinks.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (eventId && item.eventId !== eventId) return false;
      if (reviewStatus && item.reviewStatus !== reviewStatus) return false;
      return true;
    }));
  }

  getEvidence(id: string, actor: RequestActor): EvidenceLink {
    const evidence = this.store.getState().evidenceLinks.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!evidence) notFound("Evidence not found");
    return clone(evidence);
  }

  createEvidence(input: unknown, actor: RequestActor): EvidenceLink {
    const body = ensureObject(input, "evidence");
    const state = this.store.getState();

    const evidence: EvidenceLink = {
      id: newId("evidence"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      eventId: ensureString(body.eventId, "evidence.eventId"),
      evidenceType: String(body.evidenceType ?? "other") as EvidenceLink["evidenceType"],
      title: ensureString(body.title, "evidence.title"),
      uri: body.uri ? String(body.uri) : undefined,
      fileHash: body.fileHash ? String(body.fileHash) : undefined,
      uploadedBy: ensureString(body.uploadedBy, "evidence.uploadedBy"),
      validUntil: body.validUntil ? String(body.validUntil) : undefined,
      reviewStatus: "pending",
      metadata: optionalObject(body.metadata)
    };

    state.evidenceLinks.push(evidence);

    const event = state.events.find((item) => item.id === evidence.eventId && item.tenantId === actor.tenantId);
    if (event) {
      event.evidenceLinkIds = [...(event.evidenceLinkIds ?? []), evidence.id];
    }

    this.store.save();
    this.store.audit(actor, "evidence.create", "evidenceLink", evidence.id, undefined, evidence);

    return clone(evidence);
  }

  updateEvidence(id: string, input: unknown, actor: RequestActor): EvidenceLink {
    const body = ensureObject(input, "evidence");
    const state = this.store.getState();
    const evidence = state.evidenceLinks.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!evidence) notFound("Evidence not found");

    const before = clone(evidence);

    if (body.reviewStatus) evidence.reviewStatus = String(body.reviewStatus) as EvidenceLink["reviewStatus"];
    if (body.title) evidence.title = String(body.title);
    if (body.uri) evidence.uri = String(body.uri);
    if (body.validUntil) evidence.validUntil = String(body.validUntil);
    if (body.metadata) evidence.metadata = { ...evidence.metadata, ...optionalObject(body.metadata) };
    evidence.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "evidence.update", "evidenceLink", evidence.id, before, evidence);

    return clone(evidence);
  }

  listRetentionPolicies(actor: RequestActor): RetentionPolicy[] {
    return clone(this.store.getState().retentionPolicies.filter((item) => item.tenantId === actor.tenantId));
  }

  createRetentionPolicy(input: unknown, actor: RequestActor): RetentionPolicy {
    const body = ensureObject(input, "policy");
    const state = this.store.getState();

    const policy: RetentionPolicy = {
      id: newId("policy"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "policy.name"),
      description: body.description ? String(body.description) : undefined,
      retentionDays: ensureNumber(body.retentionDays, "policy.retentionDays"),
      appliesTo: ensureArray<string>(body.appliesTo, "policy.appliesTo"),
      status: String(body.status ?? "active") as RetentionPolicy["status"],
      metadata: optionalObject(body.metadata)
    };

    state.retentionPolicies.push(policy);
    this.store.save();
    this.store.audit(actor, "policy.create", "retentionPolicy", policy.id, undefined, policy);

    return clone(policy);
  }

  listReports(actor: RequestActor): AuditReport[] {
    return clone(this.store.getState().reports.filter((item) => item.tenantId === actor.tenantId));
  }

  createReport(input: unknown, actor: RequestActor): AuditReport {
    const body = ensureObject(input, "report");
    const state = this.store.getState();

    const report: AuditReport = {
      id: newId("report"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "report.name"),
      description: body.description ? String(body.description) : undefined,
      reportType: String(body.reportType ?? "custom") as AuditReport["reportType"],
      format: String(body.format ?? "json") as AuditReport["format"],
      status: "draft",
      filters: optionalObject(body.filters) as ReportFilters,
      generatedBy: actor.userId,
      metadata: optionalObject(body.metadata)
    };

    state.reports.push(report);
    this.store.save();
    this.store.audit(actor, "report.create", "auditReport", report.id, undefined, report);

    return clone(report);
  }

  generateReport(id: string, actor: RequestActor): AuditReport {
    const state = this.store.getState();
    const report = state.reports.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!report) notFound("Report not found");

    const before = clone(report);
    report.status = "generating";
    report.updatedAt = nowIso();
    this.store.save();

    const events = this.searchEvents({ ...report.filters, tenantId: actor.tenantId }, actor);

    setTimeout(() => {
      const currentReport = state.reports.find((item) => item.id === id);
      if (currentReport) {
        currentReport.status = "completed";
        currentReport.completedAt = nowIso();
        currentReport.metadata = { ...currentReport.metadata, eventCount: events.length };
        this.store.save();
      }
    }, 100);

    this.store.audit(actor, "report.generate", "auditReport", report.id, before, report);
    return clone(report);
  }

  listInvestigations(actor: RequestActor): AuditInvestigation[] {
    return clone(this.store.getState().investigations.filter((item) => item.tenantId === actor.tenantId));
  }

  createInvestigation(input: unknown, actor: RequestActor): AuditInvestigation {
    const body = ensureObject(input, "investigation");
    const state = this.store.getState();

    const investigation: AuditInvestigation = {
      id: newId("investigation"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      title: ensureString(body.title, "investigation.title"),
      description: body.description ? String(body.description) : undefined,
      status: "open",
      priority: String(body.priority ?? "medium") as AuditInvestigation["priority"],
      eventIds: ensureArray<string>(body.eventIds, "investigation.eventIds"),
      evidenceIds: ensureArray<string>(body.evidenceIds, "investigation.evidenceIds"),
      assignedTo: body.assignedTo ? String(body.assignedTo) : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.investigations.push(investigation);
    this.store.save();
    this.store.audit(actor, "investigation.create", "auditInvestigation", investigation.id, undefined, investigation);

    return clone(investigation);
  }

  updateInvestigation(id: string, input: unknown, actor: RequestActor): AuditInvestigation {
    const body = ensureObject(input, "investigation");
    const state = this.store.getState();
    const investigation = state.investigations.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!investigation) notFound("Investigation not found");

    const before = clone(investigation);

    if (body.status) investigation.status = String(body.status) as AuditInvestigation["status"];
    if (body.priority) investigation.priority = String(body.priority) as AuditInvestigation["priority"];
    if (body.assignedTo) investigation.assignedTo = String(body.assignedTo);
    if (body.resolution) investigation.resolution = String(body.resolution);
    if (body.eventIds) investigation.eventIds = ensureArray<string>(body.eventIds, "investigation.eventIds");
    if (body.evidenceIds) investigation.evidenceIds = ensureArray<string>(body.evidenceIds, "investigation.evidenceIds");
    if (body.resolvedAt) investigation.resolvedAt = String(body.resolvedAt);
    investigation.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "investigation.update", "auditInvestigation", investigation.id, before, investigation);

    return clone(investigation);
  }

  checkIntegrity(actor: RequestActor): { valid: boolean; brokenAt?: string; details: IntegrityHash[] } {
    const state = this.store.getState();
    const events = state.events.filter((item) => item.tenantId === actor.tenantId);

    let previousHash = "genesis";
    for (const event of events) {
      if (event.previousHash !== previousHash) {
        return { valid: false, brokenAt: event.id, details: [] };
      }
      const hashInput = `${event.id}:${event.eventType}:${event.actorId}:${event.createdAt}:${previousHash}`;
      const computedHash = this.computeHash(hashInput);
      if (computedHash !== event.currentHash) {
        return { valid: false, brokenAt: event.id, details: [] };
      }
      previousHash = event.currentHash ?? "";
    }

    return { valid: true, details: clone(state.integrityHashes.filter((item) => item.tenantId === actor.tenantId)) };
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((item) => item.tenantId === actor.tenantId));
  }

  listComplianceAudits(actor: RequestActor): ComplianceAudit[] {
    return clone(this.store.getState().auditLogs.filter(() => false) as any[]);
  }

  private computeHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, "0");
  }
}
