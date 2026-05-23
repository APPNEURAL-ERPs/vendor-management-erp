import {
  RequestActor,
  AdminSetting,
  OrgUnit,
  InternalRequest,
  ResourceRecord,
  AdminApproval,
  AdminOverview,
  AdminEvent
} from "./domain";
import { DataStore } from "./core/datastore";
import { newId, nowIso, plusDays } from "./core/id";
import { countBy } from "./core/utils";
import { notFound, badRequest } from "./core/errors";

export class AdminService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "AdminOS: settings, org-units, requests, resources, approvals";
  }

  overview(actor: RequestActor) {
    const state = this.store.getState();
    const settings = state.settings.filter(s => s.tenantId === actor.tenantId);
    const orgUnits = state.orgUnits.filter(o => o.tenantId === actor.tenantId);
    const requests = state.requests.filter(r => r.tenantId === actor.tenantId);
    const resources = state.resources.filter(r => r.tenantId === actor.tenantId);
    const approvals = state.approvals.filter(a => a.tenantId === actor.tenantId);

    const overview: AdminOverview = {
      settings: {
        total: settings.length,
        active: settings.filter(s => s.status === "active").length,
        byCategory: countBy(settings, "category")
      },
      orgUnits: {
        total: orgUnits.length,
        byType: countBy(orgUnits, "type")
      },
      requests: {
        total: requests.length,
        byStatus: countBy(requests, "status"),
        byPriority: countBy(requests, "priority")
      },
      resources: {
        total: resources.length,
        byType: countBy(resources, "type"),
        byStatus: countBy(resources, "status")
      },
      approvals: {
        total: approvals.length,
        pending: approvals.filter(a => a.status === "pending").length,
        byStatus: countBy(approvals, "status")
      }
    };

    return overview;
  }

  listSettings(actor: RequestActor) {
    return this.store.getState().settings.filter(s => s.tenantId === actor.tenantId);
  }

  getSetting(actor: RequestActor, id: string): AdminSetting {
    const setting = this.store.getState().settings.find(s => s.id === id && s.tenantId === actor.tenantId);
    if (!setting) notFound(`Setting ${id} not found`);
    return setting;
  }

  createSetting(actor: RequestActor, body: any): AdminSetting {
    const now = nowIso();
    const setting: AdminSetting = {
      id: newId("setting"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key: body.key,
      name: body.name,
      description: body.description,
      value: body.value,
      valueType: body.valueType || typeof body.value,
      category: body.category || "custom",
      status: body.status || "active",
      editable: body.editable !== undefined ? body.editable : true,
      visible: body.visible !== undefined ? body.visible : true,
      tags: body.tags || [],
      metadata: body.metadata || {}
    };
    this.store.getState().settings.push(setting);
    this.store.save();
    this.store.audit(actor, "create", "AdminSetting", setting.id, undefined, setting);
    return setting;
  }

  updateSetting(actor: RequestActor, id: string, body: any): AdminSetting {
    const setting = this.getSetting(actor, id);
    if (!setting.editable) badRequest("Setting is not editable");
    const before = { ...setting };
    Object.assign(setting, body, { updatedAt: nowIso() });
    this.store.save();
    this.store.audit(actor, "update", "AdminSetting", id, before, setting);
    return setting;
  }

  deleteSetting(actor: RequestActor, id: string): void {
    const setting = this.getSetting(actor, id);
    const state = this.store.getState();
    const index = state.settings.indexOf(setting);
    state.settings.splice(index, 1);
    this.store.save();
    this.store.audit(actor, "delete", "AdminSetting", id, setting, undefined);
  }

  listOrgUnits(actor: RequestActor) {
    return this.store.getState().orgUnits.filter(o => o.tenantId === actor.tenantId);
  }

  getOrgUnit(actor: RequestActor, id: string): OrgUnit {
    const org = this.store.getState().orgUnits.find(o => o.id === id && o.tenantId === actor.tenantId);
    if (!org) notFound(`Organization unit ${id} not found`);
    return org;
  }

  createOrgUnit(actor: RequestActor, body: any): OrgUnit {
    const now = nowIso();
    const org: OrgUnit = {
      id: newId("org"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name: body.name,
      description: body.description,
      type: body.type || "unit",
      parentId: body.parentId,
      status: body.status || "active",
      metadata: body.metadata || {}
    };
    this.store.getState().orgUnits.push(org);
    this.store.save();
    this.store.audit(actor, "create", "OrgUnit", org.id, undefined, org);
    return org;
  }

  updateOrgUnit(actor: RequestActor, id: string, body: any): OrgUnit {
    const org = this.getOrgUnit(actor, id);
    const before = { ...org };
    Object.assign(org, body, { updatedAt: nowIso() });
    this.store.save();
    this.store.audit(actor, "update", "OrgUnit", id, before, org);
    return org;
  }

  deleteOrgUnit(actor: RequestActor, id: string): void {
    const org = this.getOrgUnit(actor, id);
    const state = this.store.getState();
    const index = state.orgUnits.indexOf(org);
    state.orgUnits.splice(index, 1);
    this.store.save();
    this.store.audit(actor, "delete", "OrgUnit", id, org, undefined);
  }

  listRequests(actor: RequestActor) {
    return this.store.getState().requests.filter(r => r.tenantId === actor.tenantId);
  }

  getRequest(actor: RequestActor, id: string): InternalRequest {
    const req = this.store.getState().requests.find(r => r.id === id && r.tenantId === actor.tenantId);
    if (!req) notFound(`Request ${id} not found`);
    return req;
  }

  createRequest(actor: RequestActor, body: any): InternalRequest {
    const now = nowIso();
    const req: InternalRequest = {
      id: newId("req"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      title: body.title,
      description: body.description,
      type: body.type || "support",
      status: body.status || "draft",
      priority: body.priority || "medium",
      requestedBy: body.requestedBy || actor.userId,
      assignedTo: body.assignedTo,
      orgUnitId: body.orgUnitId,
      data: body.data || {},
      attachments: body.attachments || [],
      comments: [],
      slaDeadline: body.slaDeadline || plusDays(7)
    };
    this.store.getState().requests.push(req);
    this.store.save();
    this.store.audit(actor, "create", "InternalRequest", req.id, undefined, req);
    this.emitEvent(actor, "admin.request.created", { requestId: req.id, type: req.type });
    return req;
  }

  updateRequest(actor: RequestActor, id: string, body: any): InternalRequest {
    const req = this.getRequest(actor, id);
    const before = { ...req };
    Object.assign(req, body, { updatedAt: nowIso() });
    if (body.status === "completed") {
      req.completedAt = nowIso();
    }
    this.store.save();
    this.store.audit(actor, "update", "InternalRequest", id, before, req);
    return req;
  }

  addRequestComment(actor: RequestActor, id: string, body: any): InternalRequest {
    const req = this.getRequest(actor, id);
    const now = nowIso();
    const comment = {
      id: newId("comment"),
      userId: actor.userId,
      content: body.content,
      createdAt: now,
      updatedAt: now
    };
    req.comments.push(comment);
    req.updatedAt = now;
    this.store.save();
    this.store.audit(actor, "comment", "InternalRequest", id, undefined, comment);
    return req;
  }

  deleteRequest(actor: RequestActor, id: string): void {
    const req = this.getRequest(actor, id);
    const state = this.store.getState();
    const index = state.requests.indexOf(req);
    state.requests.splice(index, 1);
    this.store.save();
    this.store.audit(actor, "delete", "InternalRequest", id, req, undefined);
  }

  listResources(actor: RequestActor) {
    return this.store.getState().resources.filter(r => r.tenantId === actor.tenantId);
  }

  getResource(actor: RequestActor, id: string): ResourceRecord {
    const resource = this.store.getState().resources.find(r => r.id === id && r.tenantId === actor.tenantId);
    if (!resource) notFound(`Resource ${id} not found`);
    return resource;
  }

  createResource(actor: RequestActor, body: any): ResourceRecord {
    const now = nowIso();
    const resource: ResourceRecord = {
      id: newId("resource"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name: body.name,
      description: body.description,
      type: body.type,
      status: body.status || "available",
      allocatedTo: body.allocatedTo,
      orgUnitId: body.orgUnitId,
      quota: body.quota || 0,
      used: body.used || 0,
      unit: body.unit || "units",
      metadata: body.metadata || {}
    };
    this.store.getState().resources.push(resource);
    this.store.save();
    this.store.audit(actor, "create", "ResourceRecord", resource.id, undefined, resource);
    return resource;
  }

  updateResource(actor: RequestActor, id: string, body: any): ResourceRecord {
    const resource = this.getResource(actor, id);
    const before = { ...resource };
    Object.assign(resource, body, { updatedAt: nowIso() });
    this.store.save();
    this.store.audit(actor, "update", "ResourceRecord", id, before, resource);
    return resource;
  }

  allocateResource(actor: RequestActor, id: string, body: any): ResourceRecord {
    const resource = this.getResource(actor, id);
    resource.allocatedTo = body.userId;
    resource.orgUnitId = body.orgUnitId;
    resource.status = "allocated";
    resource.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "allocate", "ResourceRecord", id, undefined, resource);
    return resource;
  }

  deleteResource(actor: RequestActor, id: string): void {
    const resource = this.getResource(actor, id);
    const state = this.store.getState();
    const index = state.resources.indexOf(resource);
    state.resources.splice(index, 1);
    this.store.save();
    this.store.audit(actor, "delete", "ResourceRecord", id, resource, undefined);
  }

  listApprovals(actor: RequestActor) {
    return this.store.getState().approvals.filter(a => a.tenantId === actor.tenantId);
  }

  getApproval(actor: RequestActor, id: string): AdminApproval {
    const approval = this.store.getState().approvals.find(a => a.id === id && a.tenantId === actor.tenantId);
    if (!approval) notFound(`Approval ${id} not found`);
    return approval;
  }

  createApproval(actor: RequestActor, body: any): AdminApproval {
    const now = nowIso();
    const approval: AdminApproval = {
      id: newId("approval"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name: body.name,
      description: body.description,
      type: body.type || "custom",
      status: "pending",
      requestId: body.requestId,
      requestedBy: body.requestedBy || actor.userId,
      workflow: body.workflow || [{ step: 1, approverRole: "approval_manager", status: "pending" }],
      currentStep: 1,
      metadata: body.metadata || {}
    };
    this.store.getState().approvals.push(approval);
    this.store.save();
    this.store.audit(actor, "create", "AdminApproval", approval.id, undefined, approval);
    return approval;
  }

  processApproval(actor: RequestActor, id: string, body: any): AdminApproval {
    const approval = this.getApproval(actor, id);
    if (approval.status !== "pending") badRequest("Approval is not pending");

    const currentStepWorkflow = approval.workflow.find(w => w.step === approval.currentStep);
    if (!currentStepWorkflow) badRequest("Invalid approval workflow step");

    const now = nowIso();
    currentStepWorkflow.status = body.decision;
    currentStepWorkflow.decisionAt = now;
    currentStepWorkflow.approverId = actor.userId;
    currentStepWorkflow.reason = body.reason;

    if (body.decision === "approved") {
      if (approval.currentStep < approval.workflow.length) {
        approval.currentStep++;
      } else {
        approval.status = "approved";
        approval.approvedBy = actor.userId;
        approval.decisionAt = now;
      }
    } else if (body.decision === "rejected") {
      approval.status = "rejected";
    }

    approval.updatedAt = now;
    this.store.save();
    this.store.audit(actor, body.decision, "AdminApproval", id, undefined, approval);

    if (approval.requestId) {
      const req = this.store.getState().requests.find(r => r.id === approval.requestId);
      if (req) {
        req.status = approval.status === "approved" ? "approved" : "rejected";
        if (approval.status === "approved") req.completedAt = now;
        this.store.save();
        this.emitEvent(actor, `admin.request.${approval.status}`, { requestId: req.id, approvalId: id });
      }
    }

    this.emitEvent(actor, `admin.approval.${body.decision}`, { approvalId: id });
    return approval;
  }

  deleteApproval(actor: RequestActor, id: string): void {
    const approval = this.getApproval(actor, id);
    const state = this.store.getState();
    const index = state.approvals.indexOf(approval);
    state.approvals.splice(index, 1);
    this.store.save();
    this.store.audit(actor, "delete", "AdminApproval", id, approval, undefined);
  }

  listAuditLogs(actor: RequestActor) {
    return this.store.getState().auditLogs.filter(a => a.tenantId === actor.tenantId);
  }

  listEvents(actor: RequestActor) {
    return this.store.getState().events.filter(e => e.tenantId === actor.tenantId);
  }

  private emitEvent(actor: RequestActor, type: string, data: Record<string, unknown>): AdminEvent {
    const now = nowIso();
    const event: AdminEvent = {
      id: newId("evt"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      type,
      source: "AdminOS",
      actorId: actor.userId,
      data
    };
    this.store.getState().events.unshift(event);
    this.store.save();
    return event;
  }
}
