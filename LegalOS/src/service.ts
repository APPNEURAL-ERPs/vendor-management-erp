import {
  RequestActor,
  LegalCase,
  LegalMatter,
  LegalDocument,
  Contract,
  ContractObligation,
  LegalHold,
  Counsel,
  LegalInvoice,
  NDA,
  LegalTemplate,
  LegalNotice,
  Dispute,
  IPAsset,
  ApprovalRequest,
  LegalEvent,
  LegalOverview,
  ContractClause,
  ContractRisk,
  Signature
} from "./domain";
import { DataStore } from "./core/datastore";
import { newId, nowIso } from "./core/id";
import {
  badRequest,
  notFound,
  requireString,
  optionalString,
  asNumber,
  asBoolean,
  asArray,
  filterByTenant,
  countBy
} from "./core/utils";
import { clone } from "./core/utils";

export class LegalService {
  constructor(private readonly store: DataStore) {}

  overview(actor: RequestActor): LegalOverview {
    const state = this.store.getState();
    const tenantCases = filterByTenant(state.cases, actor.tenantId);
    const tenantContracts = filterByTenant(state.contracts, actor.tenantId);
    const tenantNDAs = filterByTenant(state.ndas, actor.tenantId);
    const tenantInvoices = filterByTenant(state.invoices, actor.tenantId);
    const tenantMatters = filterByTenant(state.matters, actor.tenantId);
    const tenantDocuments = filterByTenant(state.documents, actor.tenantId);
    const tenantDisputes = filterByTenant(state.disputes, actor.tenantId);
    const tenantHolds = filterByTenant(state.holds, actor.tenantId);
    const tenantCounsel = filterByTenant(state.counsel, actor.tenantId);

    return {
      cases: {
        total: tenantCases.length,
        open: tenantCases.filter((c) => c.status === "open" || c.status === "active").length,
        byType: countBy(tenantCases, "caseType")
      },
      matters: {
        total: tenantMatters.length,
        active: tenantMatters.filter((m) => m.status === "active").length
      },
      documents: {
        total: tenantDocuments.length,
        byStatus: countBy(tenantDocuments, "status")
      },
      contracts: {
        total: tenantContracts.length,
        active: tenantContracts.filter((c) => c.status === "active").length,
        expiring: tenantContracts.filter((c) => c.status === "renewal_due").length
      },
      ndas: {
        total: tenantNDAs.length,
        active: tenantNDAs.filter((n) => n.status === "signed").length,
        expiring: tenantNDAs.filter((n) => n.expirationDate && new Date(n.expirationDate).getTime() - Date.now() < 90 * 24 * 60 * 60 * 1000).length
      },
      invoices: {
        pending: tenantInvoices.filter((i) => i.status === "pending").length,
        overdue: tenantInvoices.filter((i) => i.status === "overdue").length,
        totalAmount: tenantInvoices
          .filter((i) => i.status === "pending" || i.status === "overdue")
          .reduce((sum, i) => sum + i.amount, 0)
      },
      disputes: {
        open: tenantDisputes.filter((d) => d.status === "open" || d.status === "negotiating").length,
        bySeverity: countBy(tenantDisputes.filter((d) => d.status !== "closed"), "severity")
      },
      holds: {
        active: tenantHolds.filter((h) => h.status === "active").length
      },
      counsel: {
        total: tenantCounsel.length,
        active: tenantCounsel.filter((c) => c.status === "active").length
      }
    };
  }

  listCases(actor: RequestActor): LegalCase[] {
    return filterByTenant(this.store.getState().cases, actor.tenantId);
  }

  getCase(id: string, actor: RequestActor): LegalCase {
    const found = filterByTenant(this.store.getState().cases, actor.tenantId).find((c) => c.id === id);
    if (!found) notFound(`Case ${id} not found`);
    return found;
  }

  createCase(body: any, actor: RequestActor): LegalCase {
    const required = ["caseNumber", "title", "caseType", "status", "priority"];
    required.forEach((field) => requireString(body[field], field));

    const now = nowIso();
    const newCase: LegalCase = {
      id: newId("case"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      caseNumber: body.caseNumber,
      title: body.title,
      description: body.description,
      caseType: body.caseType,
      status: body.status,
      priority: body.priority,
      court: body.court,
      judge: body.judge,
      opposingCounsel: body.opposingCounsel,
      matterId: body.matterId,
      assignedCounselId: body.assignedCounselId,
      budget: body.budget,
      spend: body.spend || 0,
      openedAt: body.openedAt || now,
      closedAt: body.closedAt,
      nextHearing: body.nextHearing,
      tags: asArray(body.tags),
      metadata: body.metadata || {}
    };

    this.store.getState().cases.push(newCase);
    this.store.save();
    this.store.audit(actor, "create", "case", newCase.id, undefined, newCase);
    return newCase;
  }

  updateCase(id: string, body: any, actor: RequestActor): LegalCase {
    const existing = this.getCase(id, actor);
    const updated: LegalCase = {
      ...existing,
      ...body,
      id: existing.id,
      tenantId: existing.tenantId,
      createdAt: existing.createdAt,
      updatedAt: nowIso()
    };

    const state = this.store.getState();
    const index = state.cases.findIndex((c) => c.id === id);
    state.cases[index] = updated;
    this.store.save();
    this.store.audit(actor, "update", "case", id, existing, updated);
    return updated;
  }

  listMatters(actor: RequestActor): LegalMatter[] {
    return filterByTenant(this.store.getState().matters, actor.tenantId);
  }

  getMatter(id: string, actor: RequestActor): LegalMatter {
    const found = filterByTenant(this.store.getState().matters, actor.tenantId).find((m) => m.id === id);
    if (!found) notFound(`Matter ${id} not found`);
    return found;
  }

  createMatter(body: any, actor: RequestActor): LegalMatter {
    const required = ["matterNumber", "title", "matterType", "status", "priority"];
    required.forEach((field) => requireString(body[field], field));

    const now = nowIso();
    const newMatter: LegalMatter = {
      id: newId("matter"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      matterNumber: body.matterNumber,
      title: body.title,
      description: body.description,
      matterType: body.matterType,
      status: body.status,
      priority: body.priority,
      clientName: body.clientName,
      clientContact: body.clientContact,
      assignedCounselId: body.assignedCounselId,
      caseIds: body.caseIds || [],
      budget: body.budget,
      startDate: body.startDate || now,
      endDate: body.endDate,
      tags: asArray(body.tags),
      metadata: body.metadata || {}
    };

    this.store.getState().matters.push(newMatter);
    this.store.save();
    this.store.audit(actor, "create", "matter", newMatter.id, undefined, newMatter);
    return newMatter;
  }

  listContracts(actor: RequestActor): Contract[] {
    return filterByTenant(this.store.getState().contracts, actor.tenantId);
  }

  getContract(id: string, actor: RequestActor): Contract {
    const found = filterByTenant(this.store.getState().contracts, actor.tenantId).find((c) => c.id === id);
    if (!found) notFound(`Contract ${id} not found`);
    return found;
  }

  createContract(body: any, actor: RequestActor): Contract {
    const required = ["contractNumber", "title", "contractType", "status", "partyName"];
    required.forEach((field) => requireString(body[field], field));

    const now = nowIso();
    const newContract: Contract = {
      id: newId("contract"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      contractNumber: body.contractNumber,
      title: body.title,
      contractType: body.contractType,
      status: body.status,
      partyName: body.partyName,
      partyEmail: body.partyEmail,
      value: body.value,
      currency: body.currency || "USD",
      startDate: body.startDate || now,
      endDate: body.endDate,
      renewalDate: body.renewalDate,
      paymentTerms: body.paymentTerms,
      autoRenew: asBoolean(body.autoRenew, false),
      caseId: body.caseId,
      matterId: body.matterId,
      assignedCounselId: body.assignedCounselId,
      clauses: body.clauses || [],
      obligations: body.obligations || [],
      risks: body.risks || [],
      signedAt: body.signedAt,
      signatures: body.signatures || [],
      tags: asArray(body.tags),
      metadata: body.metadata || {}
    };

    this.store.getState().contracts.push(newContract);
    this.store.save();
    this.store.audit(actor, "create", "contract", newContract.id, undefined, newContract);
    return newContract;
  }

  updateContract(id: string, body: any, actor: RequestActor): Contract {
    const existing = this.getContract(id, actor);
    const updated: Contract = {
      ...existing,
      ...body,
      id: existing.id,
      tenantId: existing.tenantId,
      createdAt: existing.createdAt,
      updatedAt: nowIso()
    };

    const state = this.store.getState();
    const index = state.contracts.findIndex((c) => c.id === id);
    state.contracts[index] = updated;
    this.store.save();
    this.store.audit(actor, "update", "contract", id, existing, updated);
    return updated;
  }

  addContractClause(contractId: string, body: any, actor: RequestActor): Contract {
    const contract = this.getContract(contractId, actor);
    const clause: ContractClause = {
      id: newId("clause"),
      title: requireString(body.title, "title"),
      text: requireString(body.text, "text"),
      category: body.category || "other",
      riskLevel: body.riskLevel || "low",
      riskNotes: body.riskNotes,
      isRequired: asBoolean(body.isRequired, false),
      isModified: asBoolean(body.isModified, false),
      originalText: body.originalText
    };

    contract.clauses.push(clause);
    contract.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "add_clause", "contract", contractId, undefined, clause);
    return contract;
  }

  listNDAs(actor: RequestActor): NDA[] {
    return filterByTenant(this.store.getState().ndas, actor.tenantId);
  }

  getNDA(id: string, actor: RequestActor): NDA {
    const found = filterByTenant(this.store.getState().ndas, actor.tenantId).find((n) => n.id === id);
    if (!found) notFound(`NDA ${id} not found`);
    return found;
  }

  createNDA(body: any, actor: RequestActor): NDA {
    const required = ["ndaNumber", "title", "ndaType", "partyName"];
    required.forEach((field) => requireString(body[field], field));

    const now = nowIso();
    const newNDA: NDA = {
      id: newId("nda"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      ndaNumber: body.ndaNumber,
      title: body.title,
      ndaType: body.ndaType,
      status: body.status || "draft",
      partyName: body.partyName,
      partyEmail: body.partyEmail,
      purpose: body.purpose,
      confidentialInfo: body.confidentialInfo,
      effectiveDate: body.effectiveDate || now,
      expirationDate: body.expirationDate,
      autoRenew: asBoolean(body.autoRenew, false),
      renewalTermDays: body.renewalTermDays,
      caseId: body.caseId,
      matterId: body.matterId,
      signatures: body.signatures || [],
      signedAt: body.signedAt,
      scope: body.scope,
      exclusions: body.exclusions,
      tags: asArray(body.tags),
      metadata: body.metadata || {}
    };

    this.store.getState().ndas.push(newNDA);
    this.store.save();
    this.store.audit(actor, "create", "nda", newNDA.id, undefined, newNDA);
    return newNDA;
  }

  listCounsel(actor: RequestActor): Counsel[] {
    return filterByTenant(this.store.getState().counsel, actor.tenantId);
  }

  getCounsel(id: string, actor: RequestActor): Counsel {
    const found = filterByTenant(this.store.getState().counsel, actor.tenantId).find((c) => c.id === id);
    if (!found) notFound(`Counsel ${id} not found`);
    return found;
  }

  createCounsel(body: any, actor: RequestActor): Counsel {
    const required = ["counselNumber", "name", "email", "status"];
    required.forEach((field) => requireString(body[field], field));

    const now = nowIso();
    const newCounsel: Counsel = {
      id: newId("counsel"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      counselNumber: body.counselNumber,
      name: body.name,
      email: body.email,
      phone: body.phone,
      firm: body.firm,
      barNumber: body.barNumber,
      jurisdiction: body.jurisdiction,
      specialties: asArray(body.specialties),
      status: body.status,
      hourlyRate: body.hourlyRate,
      caseIds: body.caseIds || [],
      matterIds: body.matterIds || [],
      notes: body.notes,
      metadata: body.metadata || {}
    };

    this.store.getState().counsel.push(newCounsel);
    this.store.save();
    this.store.audit(actor, "create", "counsel", newCounsel.id, undefined, newCounsel);
    return newCounsel;
  }

  listInvoices(actor: RequestActor): LegalInvoice[] {
    return filterByTenant(this.store.getState().invoices, actor.tenantId);
  }

  getInvoice(id: string, actor: RequestActor): LegalInvoice {
    const found = filterByTenant(this.store.getState().invoices, actor.tenantId).find((i) => i.id === id);
    if (!found) notFound(`Invoice ${id} not found`);
    return found;
  }

  createInvoice(body: any, actor: RequestActor): LegalInvoice {
    const required = ["invoiceNumber", "description", "invoiceDate", "dueDate", "amount", "currency"];
    required.forEach((field) => {
      if (field === "amount") {
        if (!asNumber(body[field], -1) || asNumber(body[field], -1) < 0) {
          badRequest(`${field} is required`);
        }
      } else {
        requireString(body[field], field);
      }
    });

    const now = nowIso();
    const newInvoice: LegalInvoice = {
      id: newId("invoice"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      invoiceNumber: body.invoiceNumber,
      counselId: body.counselId,
      caseId: body.caseId,
      matterId: body.matterId,
      description: body.description,
      invoiceDate: body.invoiceDate,
      dueDate: body.dueDate,
      amount: asNumber(body.amount),
      currency: body.currency,
      status: body.status || "pending",
      lineItems: body.lineItems || [],
      approvedBy: body.approvedBy,
      approvedAt: body.approvedAt,
      paidAt: body.paidAt,
      paymentReference: body.paymentReference,
      notes: body.notes,
      metadata: body.metadata || {}
    };

    this.store.getState().invoices.push(newInvoice);
    this.store.save();
    this.store.audit(actor, "create", "invoice", newInvoice.id, undefined, newInvoice);
    return newInvoice;
  }

  listDocuments(actor: RequestActor): LegalDocument[] {
    return filterByTenant(this.store.getState().documents, actor.tenantId);
  }

  getDocument(id: string, actor: RequestActor): LegalDocument {
    const found = filterByTenant(this.store.getState().documents, actor.tenantId).find((d) => d.id === id);
    if (!found) notFound(`Document ${id} not found`);
    return found;
  }

  createDocument(body: any, actor: RequestActor): LegalDocument {
    const required = ["title", "documentType", "status"];
    required.forEach((field) => requireString(body[field], field));

    const now = nowIso();
    const newDoc: LegalDocument = {
      id: newId("doc"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      title: body.title,
      documentType: body.documentType,
      status: body.status,
      caseId: body.caseId,
      matterId: body.matterId,
      contractId: body.contractId,
      party: body.party,
      content: body.content,
      fileUrl: body.fileUrl,
      fileType: body.fileType,
      fileSize: body.fileSize,
      version: body.version || 1,
      approvedBy: body.approvedBy,
      approvedAt: body.approvedAt,
      signedAt: body.signedAt,
      expiresAt: body.expiresAt,
      tags: asArray(body.tags),
      metadata: body.metadata || {}
    };

    this.store.getState().documents.push(newDoc);
    this.store.save();
    this.store.audit(actor, "create", "document", newDoc.id, undefined, newDoc);
    return newDoc;
  }

  listHolds(actor: RequestActor): LegalHold[] {
    return filterByTenant(this.store.getState().holds, actor.tenantId);
  }

  getHold(id: string, actor: RequestActor): LegalHold {
    const found = filterByTenant(this.store.getState().holds, actor.tenantId).find((h) => h.id === id);
    if (!found) notFound(`Legal Hold ${id} not found`);
    return found;
  }

  createHold(body: any, actor: RequestActor): LegalHold {
    const required = ["holdNumber", "title", "holdType"];
    required.forEach((field) => requireString(body[field], field));

    const now = nowIso();
    const newHold: LegalHold = {
      id: newId("hold"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      holdNumber: body.holdNumber,
      title: body.title,
      description: body.description,
      caseId: body.caseId,
      matterId: body.matterId,
      status: body.status || "active",
      holdType: body.holdType,
      custodianIds: body.custodianIds || [],
      dataSources: body.dataSources || [],
      scope: body.scope,
      startDate: body.startDate || now,
      endDate: body.endDate,
      releasedAt: body.releasedAt,
      notes: body.notes
    };

    this.store.getState().holds.push(newHold);
    this.store.save();
    this.store.audit(actor, "create", "hold", newHold.id, undefined, newHold);
    return newHold;
  }

  listDisputes(actor: RequestActor): Dispute[] {
    return filterByTenant(this.store.getState().disputes, actor.tenantId);
  }

  getDispute(id: string, actor: RequestActor): Dispute {
    const found = filterByTenant(this.store.getState().disputes, actor.tenantId).find((d) => d.id === id);
    if (!found) notFound(`Dispute ${id} not found`);
    return found;
  }

  createDispute(body: any, actor: RequestActor): Dispute {
    const required = ["disputeNumber", "title", "disputeType", "status", "severity", "partyName"];
    required.forEach((field) => requireString(body[field], field));

    const now = nowIso();
    const newDispute: Dispute = {
      id: newId("dispute"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      disputeNumber: body.disputeNumber,
      title: body.title,
      description: body.description,
      disputeType: body.disputeType,
      status: body.status,
      severity: body.severity,
      caseId: body.caseId,
      matterId: body.matterId,
      contractId: body.contractId,
      partyName: body.partyName,
      partyContact: body.partyContact,
      amount: body.amount,
      currency: body.currency,
      openedAt: body.openedAt || now,
      resolvedAt: body.resolvedAt,
      resolution: body.resolution,
      assignedCounselId: body.assignedCounselId,
      timeline: body.timeline || [],
      tags: asArray(body.tags),
      metadata: body.metadata || {}
    };

    this.store.getState().disputes.push(newDispute);
    this.store.save();
    this.store.audit(actor, "create", "dispute", newDispute.id, undefined, newDispute);
    return newDispute;
  }

  listIPAssets(actor: RequestActor): IPAsset[] {
    return filterByTenant(this.store.getState().ipAssets, actor.tenantId);
  }

  getIPAsset(id: string, actor: RequestActor): IPAsset {
    const found = filterByTenant(this.store.getState().ipAssets, actor.tenantId).find((a) => a.id === id);
    if (!found) notFound(`IP Asset ${id} not found`);
    return found;
  }

  createIPAsset(body: any, actor: RequestActor): IPAsset {
    const required = ["assetNumber", "name", "assetType", "status"];
    required.forEach((field) => requireString(body[field], field));

    const now = nowIso();
    const newAsset: IPAsset = {
      id: newId("ipasset"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      assetNumber: body.assetNumber,
      name: body.name,
      assetType: body.assetType,
      status: body.status,
      registrationNumber: body.registrationNumber,
      jurisdiction: body.jurisdiction,
      owner: body.owner,
      description: body.description,
      caseIds: body.caseIds || [],
      renewalDate: body.renewalDate,
      tags: asArray(body.tags),
      metadata: body.metadata || {}
    };

    this.store.getState().ipAssets.push(newAsset);
    this.store.save();
    this.store.audit(actor, "create", "ipasset", newAsset.id, undefined, newAsset);
    return newAsset;
  }

  listApprovals(actor: RequestActor): ApprovalRequest[] {
    return filterByTenant(this.store.getState().approvals, actor.tenantId);
  }

  getApproval(id: string, actor: RequestActor): ApprovalRequest {
    const found = filterByTenant(this.store.getState().approvals, actor.tenantId).find((a) => a.id === id);
    if (!found) notFound(`Approval ${id} not found`);
    return found;
  }

  createApproval(body: any, actor: RequestActor): ApprovalRequest {
    const required = ["requestNumber", "requestType", "title", "status", "priority", "requestorId"];
    required.forEach((field) => requireString(body[field], field));

    const now = nowIso();
    const newApproval: ApprovalRequest = {
      id: newId("approval"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      requestNumber: body.requestNumber,
      requestType: body.requestType,
      title: body.title,
      description: body.description,
      status: body.status,
      requestorId: body.requestorId,
      approverId: body.approverId,
      caseId: body.caseId,
      matterId: body.matterId,
      contractId: body.contractId,
      documentId: body.documentId,
      priority: body.priority,
      dueDate: body.dueDate,
      decidedAt: body.decidedAt,
      decisionNotes: body.decisionNotes,
      comments: body.comments || []
    };

    this.store.getState().approvals.push(newApproval);
    this.store.save();
    this.store.audit(actor, "create", "approval", newApproval.id, undefined, newApproval);
    return newApproval;
  }

  listTemplates(actor: RequestActor): LegalTemplate[] {
    return filterByTenant(this.store.getState().templates, actor.tenantId);
  }

  listNotices(actor: RequestActor): LegalNotice[] {
    return filterByTenant(this.store.getState().notices, actor.tenantId);
  }

  listAuditLogs(actor: RequestActor): any[] {
    return filterByTenant(this.store.getState().auditLogs, actor.tenantId);
  }

  listEvents(actor: RequestActor): LegalEvent[] {
    return filterByTenant(this.store.getState().events, actor.tenantId);
  }
}
