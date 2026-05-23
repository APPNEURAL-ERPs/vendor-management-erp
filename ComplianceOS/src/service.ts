import { DataStore } from "./core/datastore";
import {
  Audit,
  AuditChecklist,
  AuditFinding,
  ComplianceChecklist,
  ComplianceFramework,
  ComplianceOverview,
  ComplianceViolation,
  Control,
  ControlTest,
  Evidence,
  EvidenceRequest,
  Policy,
  RemediationTask,
  RequestActor,
  Risk,
  VendorCompliance
} from "./domain";
import { notFound, conflict } from "./errors";
import { newId, nowIso } from "./core/id";
import { clone, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, optionalObject, pickQuery } from "./core/utils";

export class ComplianceService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "ComplianceOS service is ready";
  }

  overview(actor: RequestActor): ComplianceOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;

    const frameworks = state.frameworks.filter((item) => item.tenantId === tenant);
    const controls = state.controls.filter((item) => item.tenantId === tenant);
    const audits = state.audits.filter((item) => item.tenantId === tenant);
    const findings = state.auditFindings.filter((item) => item.tenantId === tenant);
    const risks = state.risks.filter((item) => item.tenantId === tenant);
    const policies = state.policies.filter((item) => item.tenantId === tenant);
    const evidences = state.evidences.filter((item) => item.tenantId === tenant);

    const compliant = controls.filter((c) => c.status === "compliant").length;
    const nonCompliant = controls.filter((c) => c.status === "non_compliant").length;
    const inProgress = controls.filter((c) => c.status === "in_progress").length;

    const openFindings = findings.filter((f) => f.status !== "resolved").length;
    const criticalFindings = findings.filter((f) => f.severity === "critical" && f.status !== "resolved").length;
    const highFindings = findings.filter((f) => f.severity === "high" && f.status !== "resolved").length;

    const highRisks = risks.filter((r) => r.riskScore >= 6).length;
    const mediumRisks = risks.filter((r) => r.riskScore >= 4 && r.riskScore < 6).length;
    const lowRisks = risks.filter((r) => r.riskScore < 4).length;

    const acknowledged = policies.reduce((sum, p) => sum + p.acknowledgmentCount, 0);
    const totalRequired = policies.reduce((sum, p) => sum + p.totalAcknowledgmentRequired, 0);

    const pendingEvidence = evidences.filter((e) => e.status === "active").length;
    const expiringSoon = evidences.filter((e) => {
      if (!e.expiryDate) return false;
      const daysUntilExpiry = (new Date(e.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    }).length;

    const avgScore = frameworks.length > 0
      ? Math.round(frameworks.reduce((sum, f) => sum + (f.complianceScore ?? 0), 0) / frameworks.length)
      : 0;

    return {
      frameworks: {
        total: frameworks.length,
        active: frameworks.filter((f) => f.status === "active").length
      },
      controls: {
        total: controls.length,
        compliant,
        nonCompliant,
        inProgress
      },
      audits: {
        total: audits.length,
        completed: audits.filter((a) => a.status === "completed").length,
        inProgress: audits.filter((a) => a.status === "in_progress").length,
        planned: audits.filter((a) => a.status === "planned").length
      },
      findings: {
        total: findings.length,
        open: openFindings,
        critical: criticalFindings,
        high: highFindings
      },
      risks: {
        total: risks.length,
        high: highRisks,
        medium: mediumRisks,
        low: lowRisks
      },
      policies: {
        total: policies.length,
        acknowledged,
        pending: totalRequired - acknowledged
      },
      evidence: {
        total: evidences.length,
        pending: pendingEvidence,
        expiringSoon
      },
      complianceScore: avgScore
    };
  }

  listFrameworks(actor: RequestActor): ComplianceFramework[] {
    return clone(this.store.getState().frameworks.filter((item) => item.tenantId === actor.tenantId));
  }

  getFramework(id: string, actor: RequestActor): ComplianceFramework {
    const item = this.store.getState().frameworks.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!item) notFound("Framework not found");
    return clone(item);
  }

  createFramework(input: unknown, actor: RequestActor): ComplianceFramework {
    const body = ensureObject(input, "framework");
    const state = this.store.getState();
    const key = ensureString(body.key, "framework.key");
    if (state.frameworks.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Framework key '${key}' already exists`);
    }
    const framework: ComplianceFramework = {
      id: newId("framework"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "framework.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "custom") as any,
      version: body.version ? String(body.version) : undefined,
      status: String(body.status ?? "active") as any,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      controlCount: 0,
      complianceScore: undefined
    };
    state.frameworks.push(framework);
    this.store.save();
    this.store.audit(actor, "framework.create", "framework", framework.id, undefined, framework);
    return clone(framework);
  }

  listControls(actor: RequestActor, query?: URLSearchParams): Control[] {
    const frameworkId = pickQuery(query, "frameworkId");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().controls.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (frameworkId && item.frameworkId !== frameworkId) return false;
      if (status && item.status !== status) return false;
      return true;
    }));
  }

  getControl(id: string, actor: RequestActor): Control {
    const item = this.store.getState().controls.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!item) notFound("Control not found");
    return clone(item);
  }

  createControl(input: unknown, actor: RequestActor): Control {
    const body = ensureObject(input, "control");
    const state = this.store.getState();
    const key = ensureString(body.key, "control.key");
    if (state.controls.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Control key '${key}' already exists`);
    }
    if (body.frameworkId) {
      const framework = state.frameworks.find((f) => f.id === String(body.frameworkId) && f.tenantId === actor.tenantId);
      if (!framework) notFound("Framework not found");
    }
    const control: Control = {
      id: newId("control"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "control.name"),
      description: body.description ? String(body.description) : undefined,
      frameworkId: body.frameworkId ? String(body.frameworkId) : undefined,
      category: ensureString(body.category, "control.category"),
      controlType: String(body.controlType ?? "preventive") as any,
      status: String(body.status ?? "not_started") as any,
      severity: String(body.severity ?? "medium") as any,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      frequency: body.frequency ? String(body.frequency) : undefined,
      evidenceIds: ensureArray(body.evidenceIds, "control.evidenceIds"),
      riskIds: ensureArray(body.riskIds, "control.riskIds"),
      metadata: optionalObject(body.metadata)
    };
    state.controls.push(control);
    if (control.frameworkId) {
      const framework = state.frameworks.find((f) => f.id === control.frameworkId);
      if (framework) {
        framework.controlCount = state.controls.filter((c) => c.frameworkId === framework.id).length;
      }
    }
    this.store.save();
    this.store.audit(actor, "control.create", "control", control.id, undefined, control);
    return clone(control);
  }

  updateControl(id: string, input: unknown, actor: RequestActor): Control {
    const body = ensureObject(input, "control");
    const state = this.store.getState();
    const control = state.controls.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!control) notFound("Control not found");
    const before = clone(control);
    if (body.name) control.name = String(body.name);
    if (body.description !== undefined) control.description = body.description ? String(body.description) : undefined;
    if (body.status) control.status = String(body.status) as any;
    if (body.severity) control.severity = String(body.severity) as any;
    if (body.ownerId !== undefined) control.ownerId = body.ownerId ? String(body.ownerId) : undefined;
    if (body.frequency !== undefined) control.frequency = body.frequency ? String(body.frequency) : undefined;
    if (body.lastTestedAt !== undefined) control.lastTestedAt = body.lastTestedAt ? String(body.lastTestedAt) : undefined;
    if (body.nextTestAt !== undefined) control.nextTestAt = body.nextTestAt ? String(body.nextTestAt) : undefined;
    if (body.evidenceIds) control.evidenceIds = ensureArray(body.evidenceIds, "control.evidenceIds");
    if (body.metadata) control.metadata = optionalObject(body.metadata);
    control.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "control.update", "control", control.id, before, control);
    return clone(control);
  }

  listAudits(actor: RequestActor, query?: URLSearchParams): Audit[] {
    const frameworkId = pickQuery(query, "frameworkId");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().audits.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (frameworkId && item.frameworkId !== frameworkId) return false;
      if (status && item.status !== status) return false;
      return true;
    }));
  }

  getAudit(id: string, actor: RequestActor): Audit {
    const item = this.store.getState().audits.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!item) notFound("Audit not found");
    return clone(item);
  }

  createAudit(input: unknown, actor: RequestActor): Audit {
    const body = ensureObject(input, "audit");
    const state = this.store.getState();
    const key = ensureString(body.key, "audit.key");
    if (state.audits.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Audit key '${key}' already exists`);
    }
    const audit: Audit = {
      id: newId("audit"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "audit.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "internal") as any,
      status: String(body.status ?? "planned") as any,
      frameworkId: body.frameworkId ? String(body.frameworkId) : undefined,
      auditorName: body.auditorName ? String(body.auditorName) : undefined,
      scope: body.scope ? String(body.scope) : undefined,
      startDate: body.startDate ? String(body.startDate) : undefined,
      endDate: body.endDate ? String(body.endDate) : undefined,
      findings: [],
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      evidenceIds: ensureArray(body.evidenceIds, "audit.evidenceIds"),
      checklistIds: ensureArray(body.checklistIds, "audit.checklistIds")
    };
    state.audits.push(audit);
    this.store.save();
    this.store.audit(actor, "audit.create", "audit", audit.id, undefined, audit);
    return clone(audit);
  }

  listFindings(actor: RequestActor, query?: URLSearchParams): AuditFinding[] {
    const auditId = pickQuery(query, "auditId");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().auditFindings.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (auditId && item.auditId !== auditId) return false;
      if (status && item.status !== status) return false;
      return true;
    }));
  }

  createFinding(input: unknown, actor: RequestActor): AuditFinding {
    const body = ensureObject(input, "finding");
    const state = this.store.getState();
    if (body.auditId) {
      const audit = state.audits.find((a) => a.id === String(body.auditId) && a.tenantId === actor.tenantId);
      if (!audit) notFound("Audit not found");
    }
    const finding: AuditFinding = {
      id: newId("finding"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      auditId: ensureString(body.auditId, "finding.auditId"),
      title: ensureString(body.title, "finding.title"),
      description: body.description ? String(body.description) : undefined,
      severity: String(body.severity ?? "medium") as any,
      status: String(body.status ?? "open") as any,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      dueDate: body.dueDate ? String(body.dueDate) : undefined,
      evidenceIds: ensureArray(body.evidenceIds, "finding.evidenceIds"),
      notes: body.notes ? String(body.notes) : undefined
    };
    state.auditFindings.push(finding);
    const audit = state.audits.find((a) => a.id === finding.auditId);
    if (audit) {
      audit.findings.push(finding.id);
    }
    this.store.save();
    this.store.audit(actor, "finding.create", "auditFinding", finding.id, undefined, finding);
    return clone(finding);
  }

  listRisks(actor: RequestActor, query?: URLSearchParams): Risk[] {
    const category = pickQuery(query, "category");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().risks.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (category && item.category !== category) return false;
      if (status && item.status !== status) return false;
      return true;
    }));
  }

  getRisk(id: string, actor: RequestActor): Risk {
    const item = this.store.getState().risks.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!item) notFound("Risk not found");
    return clone(item);
  }

  createRisk(input: unknown, actor: RequestActor): Risk {
    const body = ensureObject(input, "risk");
    const state = this.store.getState();
    const key = ensureString(body.key, "risk.key");
    if (state.risks.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Risk key '${key}' already exists`);
    }
    const likelihood = String(body.likelihood ?? "medium") as any;
    const impact = String(body.impact ?? "medium") as any;
    const likelihoodScore = { low: 1, medium: 2, high: 3 }[likelihood] ?? 2;
    const impactScore = { low: 1, medium: 2, high: 3 }[impact] ?? 2;
    const riskScore = likelihoodScore * impactScore;
    const risk: Risk = {
      id: newId("risk"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      title: ensureString(body.title, "risk.title"),
      description: body.description ? String(body.description) : undefined,
      category: ensureString(body.category, "risk.category"),
      likelihood,
      impact,
      riskScore,
      status: String(body.status ?? "identified") as any,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      mitigationPlan: body.mitigationPlan ? String(body.mitigationPlan) : undefined,
      mitigationTaskIds: ensureArray(body.mitigationTaskIds, "risk.mitigationTaskIds"),
      controlIds: ensureArray(body.controlIds, "risk.controlIds"),
      residualRisk: body.residualRisk ? Number(body.residualRisk) : undefined,
      reviewedAt: body.reviewedAt ? String(body.reviewedAt) : undefined
    };
    state.risks.push(risk);
    this.store.save();
    this.store.audit(actor, "risk.create", "risk", risk.id, undefined, risk);
    return clone(risk);
  }

  listEvidences(actor: RequestActor, query?: URLSearchParams): Evidence[] {
    const controlId = pickQuery(query, "controlId");
    const type = pickQuery(query, "type");
    return clone(this.store.getState().evidences.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (controlId && !item.controlIds.includes(controlId)) return false;
      if (type && item.type !== type) return false;
      return true;
    }));
  }

  getEvidence(id: string, actor: RequestActor): Evidence {
    const item = this.store.getState().evidences.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!item) notFound("Evidence not found");
    return clone(item);
  }

  createEvidence(input: unknown, actor: RequestActor): Evidence {
    const body = ensureObject(input, "evidence");
    const state = this.store.getState();
    const evidence: Evidence = {
      id: newId("evidence"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: body.key ? String(body.key) : undefined,
      title: ensureString(body.title, "evidence.title"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "document") as any,
      uri: body.uri ? String(body.uri) : undefined,
      uploadedBy: actor.userId,
      status: String(body.status ?? "active") as any,
      expiryDate: body.expiryDate ? String(body.expiryDate) : undefined,
      controlIds: ensureArray(body.controlIds, "evidence.controlIds"),
      requirementIds: ensureArray(body.requirementIds, "evidence.requirementIds"),
      auditIds: ensureArray(body.auditIds, "evidence.auditIds"),
      metadata: optionalObject(body.metadata)
    };
    state.evidences.push(evidence);
    this.store.save();
    this.store.audit(actor, "evidence.create", "evidence", evidence.id, undefined, evidence);
    return clone(evidence);
  }

  listPolicies(actor: RequestActor, query?: URLSearchParams): Policy[] {
    const status = pickQuery(query, "status");
    return clone(this.store.getState().policies.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (status && item.status !== status) return false;
      return true;
    }));
  }

  getPolicy(id: string, actor: RequestActor): Policy {
    const item = this.store.getState().policies.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!item) notFound("Policy not found");
    return clone(item);
  }

  createPolicy(input: unknown, actor: RequestActor): Policy {
    const body = ensureObject(input, "policy");
    const state = this.store.getState();
    const key = ensureString(body.key, "policy.key");
    if (state.policies.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Policy key '${key}' already exists`);
    }
    const policy: Policy = {
      id: newId("policy"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "policy.name"),
      description: body.description ? String(body.description) : undefined,
      version: Number(body.version ?? 1),
      status: String(body.status ?? "active") as any,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      reviewFrequency: body.reviewFrequency ? String(body.reviewFrequency) : undefined,
      lastReviewedAt: body.lastReviewedAt ? String(body.lastReviewedAt) : undefined,
      nextReviewAt: body.nextReviewAt ? String(body.nextReviewAt) : undefined,
      acknowledgmentRequired: ensureBoolean(body.acknowledgmentRequired, false),
      acknowledgmentCount: Number(body.acknowledgmentCount ?? 0),
      totalAcknowledgmentRequired: Number(body.totalAcknowledgmentRequired ?? 0),
      documentUri: body.documentUri ? String(body.documentUri) : undefined,
      tags: ensureArray(body.tags, "policy.tags")
    };
    state.policies.push(policy);
    this.store.save();
    this.store.audit(actor, "policy.create", "policy", policy.id, undefined, policy);
    return clone(policy);
  }

  listChecklists(actor: RequestActor, query?: URLSearchParams): ComplianceChecklist[] {
    const type = pickQuery(query, "type");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().complianceChecklists.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (type && item.type !== type) return false;
      if (status && item.status !== status) return false;
      return true;
    }));
  }

  createChecklist(input: unknown, actor: RequestActor): ComplianceChecklist {
    const body = ensureObject(input, "checklist");
    const state = this.store.getState();
    const key = ensureString(body.key, "checklist.key");
    if (state.complianceChecklists.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Checklist key '${key}' already exists`);
    }
    const items = ensureArray(body.items, "checklist.items").map((item: any) => ({
      id: String(item.id ?? newId("item")),
      title: String(item.title),
      description: item.description ? String(item.description) : undefined,
      category: item.category ? String(item.category) : undefined,
      status: String(item.status ?? "pending") as any,
      evidenceIds: ensureArray(item.evidenceIds, "item.evidenceIds"),
      completedAt: item.completedAt ? String(item.completedAt) : undefined,
      completedBy: item.completedBy ? String(item.completedBy) : undefined,
      notes: item.notes ? String(item.notes) : undefined
    }));
    const completedCount = items.filter((i: any) => i.status === "completed").length;
    const checklist: ComplianceChecklist = {
      id: newId("checklist"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "checklist.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "general") as any,
      status: String(body.status ?? "active") as any,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      department: body.department ? String(body.department) : undefined,
      items,
      assignedTo: ensureArray(body.assignedTo, "checklist.assignedTo"),
      dueDate: body.dueDate ? String(body.dueDate) : undefined,
      completedAt: body.completedAt ? String(body.completedAt) : undefined,
      completionRate: items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0
    };
    state.complianceChecklists.push(checklist);
    this.store.save();
    this.store.audit(actor, "checklist.create", "complianceChecklist", checklist.id, undefined, checklist);
    return clone(checklist);
  }

  listVendorCompliances(actor: RequestActor, query?: URLSearchParams): VendorCompliance[] {
    const status = pickQuery(query, "status");
    const riskLevel = pickQuery(query, "riskLevel");
    return clone(this.store.getState().vendorCompliances.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (status && item.status !== status) return false;
      if (riskLevel && item.riskLevel !== riskLevel) return false;
      return true;
    }));
  }

  createVendorCompliance(input: unknown, actor: RequestActor): VendorCompliance {
    const body = ensureObject(input, "vendor");
    const state = this.store.getState();
    const vendor: VendorCompliance = {
      id: newId("vendor"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "vendor.name"),
      description: body.description ? String(body.description) : undefined,
      vendorType: ensureString(body.vendorType, "vendor.vendorType"),
      riskLevel: String(body.riskLevel ?? "medium") as any,
      status: String(body.status ?? "pending") as any,
      questionnaireIds: ensureArray(body.questionnaireIds, "vendor.questionnaireIds"),
      documentIds: ensureArray(body.documentIds, "vendor.documentIds"),
      securityScore: body.securityScore ? Number(body.securityScore) : undefined,
      complianceScore: body.complianceScore ? Number(body.complianceScore) : undefined,
      lastReviewedAt: body.lastReviewedAt ? String(body.lastReviewedAt) : undefined,
      nextReviewAt: body.nextReviewAt ? String(body.nextReviewAt) : undefined,
      contractExpiry: body.contractExpiry ? String(body.contractExpiry) : undefined,
      evidenceIds: ensureArray(body.evidenceIds, "vendor.evidenceIds"),
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      notes: body.notes ? String(body.notes) : undefined
    };
    state.vendorCompliances.push(vendor);
    this.store.save();
    this.store.audit(actor, "vendor.create", "vendorCompliance", vendor.id, undefined, vendor);
    return clone(vendor);
  }

  listRemediationTasks(actor: RequestActor, query?: URLSearchParams): RemediationTask[] {
    const status = pickQuery(query, "status");
    const findingId = pickQuery(query, "findingId");
    return clone(this.store.getState().remediationTasks.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (status && item.status !== status) return false;
      if (findingId && item.findingId !== findingId) return false;
      return true;
    }));
  }

  createRemediationTask(input: unknown, actor: RequestActor): RemediationTask {
    const body = ensureObject(input, "task");
    const state = this.store.getState();
    const task: RemediationTask = {
      id: newId("remtask"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: body.key ? String(body.key) : undefined,
      title: ensureString(body.title, "task.title"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "open") as any,
      priority: String(body.priority ?? "medium") as any,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      assignedTo: body.assignedTo ? String(body.assignedTo) : undefined,
      findingId: body.findingId ? String(body.findingId) : undefined,
      riskId: body.riskId ? String(body.riskId) : undefined,
      dueDate: body.dueDate ? String(body.dueDate) : undefined,
      completedAt: body.completedAt ? String(body.completedAt) : undefined,
      evidenceIds: ensureArray(body.evidenceIds, "task.evidenceIds"),
      notes: body.notes ? String(body.notes) : undefined
    };
    state.remediationTasks.push(task);
    if (task.findingId) {
      const finding = state.auditFindings.find((f) => f.id === task.findingId);
      if (finding) finding.remediationTaskId = task.id;
    }
    this.store.save();
    this.store.audit(actor, "task.create", "remediationTask", task.id, undefined, task);
    return clone(task);
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((item) => item.tenantId === actor.tenantId));
  }
}
