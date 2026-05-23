import { DataStore } from "./core/datastore";
import {
  Contract,
  ContractAmendment,
  ContractApproval,
  ContractClause,
  ContractDocument,
  ContractEvent,
  ContractNegotiation,
  ContractObligation,
  ContractOverview,
  ContractParty,
  ContractRedline,
  ContractRenewal,
  ContractReview,
  ContractRisk,
  ContractSignature,
  ContractTemplate,
  ContractVersion,
  ContractStatus,
  PartyRole,
  RequestActor
} from "./core/domain";
import { badRequest, conflict, notFound } from "./core/errors";
import { clone, countBy, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, filterByTenant, optionalObject, pickQuery, sum } from "./core/utils";
import { daysUntil, isExpired, newId, nowIso, plusDays } from "./core/id";

export class ContractService {
  constructor(private readonly store: DataStore) {}

  overview(actor: RequestActor): ContractOverview {
    const state = this.store.getState();
    const contracts = filterByTenant(state.contracts, actor.tenantId);
    const obligations = filterByTenant(state.obligations, actor.tenantId);
    const risks = filterByTenant(state.risks, actor.tenantId);

    const activeStatuses: ContractStatus[] = ["active", "signed"];
    const pendingApprovalStatuses: ContractStatus[] = ["pending_approval"];
    const pendingSignatureStatuses: ContractStatus[] = ["ready_for_signature", "sent_for_signature", "partially_signed"];

    return {
      contracts: {
        total: contracts.length,
        active: contracts.filter(c => activeStatuses.includes(c.status)).length,
        draft: contracts.filter(c => c.status === "draft").length,
        pendingApproval: contracts.filter(c => pendingApprovalStatuses.includes(c.status)).length,
        pendingSignature: contracts.filter(c => pendingSignatureStatuses.includes(c.status)).length,
        expiringSoon: contracts.filter(c => c.expiryDate && daysUntil(c.expiryDate) <= 60 && daysUntil(c.expiryDate) > 0 && activeStatuses.includes(c.status)).length,
        expired: contracts.filter(c => c.expiryDate && isExpired(c.expiryDate) && activeStatuses.includes(c.status)).length
      },
      obligations: {
        total: obligations.length,
        pending: obligations.filter(o => o.status === "pending").length,
        overdue: obligations.filter(o => o.status === "overdue").length,
        completed: obligations.filter(o => o.status === "completed").length
      },
      risks: {
        total: risks.filter(r => r.status !== "resolved").length,
        bySeverity: countBy(risks.filter(r => r.status !== "resolved"), "severity")
      },
      byType: countBy(contracts, "type"),
      totalValue: sum(contracts.filter(c => activeStatuses.includes(c.status) && c.value).map(c => c.value || 0)),
      pendingValue: sum(contracts.filter(c => pendingApprovalStatuses.includes(c.status) && c.value).map(c => c.value || 0))
    };
  }

  listContracts(actor: RequestActor, query?: URLSearchParams): Contract[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");
    const type = pickQuery(query, "type");
    return clone(filterByTenant(this.store.getState().contracts, actor.tenantId).filter(c => {
      if (search && !`${c.title} ${c.description ?? ""}`.toLowerCase().includes(search)) return false;
      if (status && c.status !== status) return false;
      if (type && c.type !== type) return false;
      return true;
    }));
  }

  getContract(id: string, actor: RequestActor): Contract {
    const contract = this.store.getState().contracts.find(c => c.id === id && c.tenantId === actor.tenantId);
    if (!contract) notFound("Contract not found");
    return clone(contract);
  }

  createContract(input: unknown, actor: RequestActor): Contract {
    const body = ensureObject(input, "contract");
    const state = this.store.getState();
    const contract: Contract = {
      id: newId("contract"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      title: ensureString(body.title, "contract.title"),
      type: ensureString(body.type, "contract.type") as Contract["type"],
      status: "draft",
      description: body.description ? String(body.description) : undefined,
      effectiveDate: body.effectiveDate ? String(body.effectiveDate) : undefined,
      expiryDate: body.expiryDate ? String(body.expiryDate) : undefined,
      value: body.value ? ensureNumber(body.value, "contract.value") : undefined,
      currency: ensureString(body.currency, "contract.currency", "INR"),
      paymentTerms: body.paymentTerms ? String(body.paymentTerms) : undefined,
      renewalTerms: body.renewalTerms ? String(body.renewalTerms) : undefined,
      governingLaw: body.governingLaw ? String(body.governingLaw) : undefined,
      terminationTerms: body.terminationTerms ? String(body.terminationTerms) : undefined,
      partyIds: ensureArray(body.partyIds, "contract.partyIds", []),
      clauseIds: ensureArray(body.clauseIds, "contract.clauseIds", []),
      templateId: body.templateId ? String(body.templateId) : undefined,
      version: 1,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      locked: false,
      tags: ensureArray(body.tags, "contract.tags", []),
      metadata: optionalObject(body.metadata),
      createdBy: actor.userId
    };
    state.contracts.push(contract);
    this.createInitialVersion(contract, actor);
    this.store.save();
    this.store.audit(actor, "contract.create", "contract", contract.id, undefined, contract);
    this.emitEvent("contract.created", { contractId: contract.id, type: contract.type }, actor);
    return clone(contract);
  }

  updateContract(id: string, input: unknown, actor: RequestActor): Contract {
    const body = ensureObject(input, "contract");
    const state = this.store.getState();
    const contract = state.contracts.find(c => c.id === id && c.tenantId === actor.tenantId);
    if (!contract) notFound("Contract not found");
    if (contract.locked) badRequest("Contract is locked and cannot be modified");
    const before = clone(contract);

    if (body.title) contract.title = String(body.title);
    if (body.description !== undefined) contract.description = body.description ? String(body.description) : undefined;
    if (body.effectiveDate !== undefined) contract.effectiveDate = body.effectiveDate ? String(body.effectiveDate) : undefined;
    if (body.expiryDate !== undefined) contract.expiryDate = body.expiryDate ? String(body.expiryDate) : undefined;
    if (body.value !== undefined) contract.value = body.value ? ensureNumber(body.value, "contract.value") : undefined;
    if (body.currency) contract.currency = String(body.currency);
    if (body.paymentTerms !== undefined) contract.paymentTerms = body.paymentTerms ? String(body.paymentTerms) : undefined;
    if (body.renewalTerms !== undefined) contract.renewalTerms = body.renewalTerms ? String(body.renewalTerms) : undefined;
    if (body.partyIds) contract.partyIds = ensureArray(body.partyIds, "contract.partyIds");
    if (body.clauseIds) contract.clauseIds = ensureArray(body.clauseIds, "contract.clauseIds");
    if (body.tags) contract.tags = ensureArray(body.tags, "contract.tags");
    if (body.metadata) contract.metadata = { ...contract.metadata, ...optionalObject(body.metadata) };

    contract.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "contract.update", "contract", contract.id, before, contract);
    return clone(contract);
  }

  changeContractStatus(id: string, status: ContractStatus, actor: RequestActor): Contract {
    const state = this.store.getState();
    const contract = state.contracts.find(c => c.id === id && c.tenantId === actor.tenantId);
    if (!contract) notFound("Contract not found");
    const before = clone(contract);
    contract.status = status;
    contract.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "contract.status_change", "contract", contract.id, before, { status });
    this.emitEvent(`contract.${status}`, { contractId: contract.id }, actor);
    return clone(contract);
  }

  deleteContract(id: string, actor: RequestActor): void {
    const state = this.store.getState();
    const index = state.contracts.findIndex(c => c.id === id && c.tenantId === actor.tenantId);
    if (index === -1) notFound("Contract not found");
    const contract = state.contracts[index];
    if (contract.status === "active" || contract.status === "signed") {
      badRequest("Cannot delete active or signed contracts");
    }
    state.contracts.splice(index, 1);
    state.versions = state.versions.filter(v => v.contractId !== id);
    state.reviews = state.reviews.filter(r => r.contractId !== id);
    state.approvals = state.approvals.filter(a => a.contractId !== id);
    state.obligations = state.obligations.filter(o => o.contractId !== id);
    state.risks = state.risks.filter(r => r.contractId !== id);
    this.store.save();
    this.store.audit(actor, "contract.delete", "contract", id, contract, undefined);
  }

  submitForReview(id: string, actor: RequestActor): Contract {
    return this.changeContractStatus(id, "internal_review", actor);
  }

  submitForApproval(id: string, actor: RequestActor): Contract {
    const state = this.store.getState();
    const contract = state.contracts.find(c => c.id === id && c.tenantId === actor.tenantId);
    if (!contract) notFound("Contract not found");
    const pendingApprovals = state.approvals.filter(a => a.contractId === id && a.status === "pending");
    if (pendingApprovals.length > 0) badRequest("Contract already has pending approvals");
    state.approvals.push({
      id: newId("approval"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      contractId: id,
      approvalType: "single",
      approverRole: "legal_admin",
      status: "pending",
      sequence: 1,
      createdBy: actor.userId
    });
    return this.changeContractStatus(id, "pending_approval", actor);
  }

  approveContract(id: string, input: unknown, actor: RequestActor): Contract {
    const body = ensureObject(input, "contract");
    const state = this.store.getState();
    const approval = state.approvals.find(a => a.contractId === id && a.tenantId === actor.tenantId && a.status === "pending");
    if (!approval) notFound("No pending approval found for this contract");
    approval.status = "approved";
    approval.approvedBy = actor.userId;
    approval.approvedAt = nowIso();
    approval.comments = body.comments ? String(body.comments) : undefined;
    approval.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "contract.approve", "contract", id, undefined, { approvalId: approval.id });
    this.emitEvent("contract.approved", { contractId: id, approvedBy: actor.userId }, actor);
    const allApproved = state.approvals.filter(a => a.contractId === id).every(a => a.status === "approved");
    if (allApproved) {
      return this.changeContractStatus(id, "approved", actor);
    }
    return this.getContract(id, actor);
  }

  listParties(actor: RequestActor): ContractParty[] {
    return clone(filterByTenant(this.store.getState().parties, actor.tenantId));
  }

  createParty(input: unknown, actor: RequestActor): ContractParty {
    const body = ensureObject(input, "party");
    const state = this.store.getState();
    const party: ContractParty = {
      id: newId("party"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "party.name"),
      legalName: body.legalName ? String(body.legalName) : undefined,
      email: ensureString(body.email, "party.email"),
      phone: body.phone ? String(body.phone) : undefined,
      address: body.address ? String(body.address) : undefined,
      taxId: body.taxId ? String(body.taxId) : undefined,
      role: ensureString(body.role, "party.role") as PartyRole,
      authorizedSignatory: body.authorizedSignatory ? String(body.authorizedSignatory) : undefined,
      status: "pending",
      metadata: optionalObject(body.metadata)
    };
    state.parties.push(party);
    this.store.save();
    this.store.audit(actor, "party.create", "party", party.id, undefined, party);
    return clone(party);
  }

  listClauses(actor: RequestActor, query?: URLSearchParams): ContractClause[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const category = pickQuery(query, "category");
    return clone(filterByTenant(this.store.getState().clauses, actor.tenantId).filter(c => {
      if (search && !`${c.name} ${c.content}`.toLowerCase().includes(search)) return false;
      if (category && c.category !== category) return false;
      return true;
    }));
  }

  createClause(input: unknown, actor: RequestActor): ContractClause {
    const body = ensureObject(input, "clause");
    const state = this.store.getState();
    const clause: ContractClause = {
      id: newId("clause"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: ensureString(body.key, "clause.key"),
      name: ensureString(body.name, "clause.name"),
      category: ensureString(body.category, "clause.category"),
      content: ensureString(body.content, "clause.content"),
      riskLevel: ensureString(body.riskLevel, "clause.riskLevel", "medium") as ContractClause["riskLevel"],
      status: "active",
      tags: ensureArray(body.tags, "clause.tags", []),
      version: 1,
      metadata: optionalObject(body.metadata)
    };
    state.clauses.push(clause);
    this.store.save();
    this.store.audit(actor, "clause.create", "clause", clause.id, undefined, clause);
    return clone(clause);
  }

  listTemplates(actor: RequestActor, query?: URLSearchParams): ContractTemplate[] {
    const type = pickQuery(query, "type");
    return clone(filterByTenant(this.store.getState().templates, actor.tenantId).filter(t => {
      if (type && t.type !== type) return false;
      return true;
    }));
  }

  createTemplate(input: unknown, actor: RequestActor): ContractTemplate {
    const body = ensureObject(input, "template");
    const state = this.store.getState();
    const template: ContractTemplate = {
      id: newId("template"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: ensureString(body.key, "template.key"),
      name: ensureString(body.name, "template.name"),
      description: body.description ? String(body.description) : undefined,
      type: ensureString(body.type, "template.type") as ContractTemplate["type"],
      content: ensureString(body.content, "template.content"),
      clauses: ensureArray(body.clauses, "template.clauses", []),
      status: "active",
      tags: ensureArray(body.tags, "template.tags", []),
      version: 1,
      metadata: optionalObject(body.metadata)
    };
    state.templates.push(template);
    this.store.save();
    this.store.audit(actor, "template.create", "template", template.id, undefined, template);
    return clone(template);
  }

  listObligations(actor: RequestActor, query?: URLSearchParams): ContractObligation[] {
    const contractId = pickQuery(query, "contractId");
    const status = pickQuery(query, "status");
    return clone(filterByTenant(this.store.getState().obligations, actor.tenantId).filter(o => {
      if (contractId && o.contractId !== contractId) return false;
      if (status && o.status !== status) return false;
      return true;
    }));
  }

  createObligation(contractId: string, input: unknown, actor: RequestActor): ContractObligation {
    const body = ensureObject(input, "obligation");
    const state = this.store.getState();
    const contract = state.contracts.find(c => c.id === contractId && c.tenantId === actor.tenantId);
    if (!contract) notFound("Contract not found");
    const obligation: ContractObligation = {
      id: newId("obligation"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      contractId,
      title: ensureString(body.title, "obligation.title"),
      description: body.description ? String(body.description) : undefined,
      responsiblePartyId: body.responsiblePartyId ? String(body.responsiblePartyId) : undefined,
      sourceClause: body.sourceClause ? String(body.sourceClause) : undefined,
      dueDate: ensureString(body.dueDate, "obligation.dueDate"),
      status: "pending",
      riskLevel: ensureString(body.riskLevel, "obligation.riskLevel", "medium") as ContractObligation["riskLevel"],
      metadata: optionalObject(body.metadata),
      createdBy: actor.userId
    };
    state.obligations.push(obligation);
    this.store.save();
    this.store.audit(actor, "obligation.create", "obligation", obligation.id, undefined, obligation);
    this.emitEvent("obligation.created", { obligationId: obligation.id, contractId }, actor);
    return clone(obligation);
  }

  updateObligation(id: string, input: unknown, actor: RequestActor): ContractObligation {
    const body = ensureObject(input, "obligation");
    const state = this.store.getState();
    const obligation = state.obligations.find(o => o.id === id && o.tenantId === actor.tenantId);
    if (!obligation) notFound("Obligation not found");
    const before = clone(obligation);

    if (body.title) obligation.title = String(body.title);
    if (body.description !== undefined) obligation.description = body.description ? String(body.description) : undefined;
    if (body.responsiblePartyId) obligation.responsiblePartyId = String(body.responsiblePartyId);
    if (body.dueDate) obligation.dueDate = String(body.dueDate);
    if (body.status) {
      obligation.status = body.status as ContractObligation["status"];
      if (body.status === "completed") {
        obligation.completedAt = nowIso();
        this.emitEvent("obligation.completed", { obligationId: id, contractId: obligation.contractId }, actor);
      }
    }
    if (body.evidence) obligation.evidence = String(body.evidence);
    if (body.riskLevel) obligation.riskLevel = body.riskLevel as ContractObligation["riskLevel"];
    if (body.metadata) obligation.metadata = { ...obligation.metadata, ...optionalObject(body.metadata) };

    obligation.updatedAt = nowIso();
    if (obligation.dueDate && !isExpired(obligation.dueDate) && obligation.status === "overdue") {
      obligation.status = "pending";
    }
    this.store.save();
    this.store.audit(actor, "obligation.update", "obligation", id, before, obligation);
    return clone(obligation);
  }

  listNegotiations(actor: RequestActor, query?: URLSearchParams): ContractNegotiation[] {
    const contractId = pickQuery(query, "contractId");
    return clone(filterByTenant(this.store.getState().negotiations, actor.tenantId).filter(n => {
      if (contractId && n.contractId !== contractId) return false;
      return true;
    }));
  }

  createNegotiation(contractId: string, actor: RequestActor): ContractNegotiation {
    const state = this.store.getState();
    const contract = state.contracts.find(c => c.id === contractId && c.tenantId === actor.tenantId);
    if (!contract) notFound("Contract not found");
    const negotiation: ContractNegotiation = {
      id: newId("negotiation"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      contractId,
      status: "sent_to_counterparty",
      redlines: [],
      timeline: [{ timestamp: nowIso(), action: "Negotiation initiated", actorId: actor.userId }],
      ownerId: actor.userId,
      createdBy: actor.userId
    };
    state.negotiations.push(negotiation);
    this.changeContractStatus(contractId, "negotiation", actor);
    this.store.save();
    this.store.audit(actor, "negotiation.create", "negotiation", negotiation.id, undefined, negotiation);
    return clone(negotiation);
  }

  listSignatures(actor: RequestActor, query?: URLSearchParams): ContractSignature[] {
    const contractId = pickQuery(query, "contractId");
    return clone(filterByTenant(this.store.getState().signatures, actor.tenantId).filter(s => {
      if (contractId && s.contractId !== contractId) return false;
      return true;
    }));
  }

  createSignature(contractId: string, input: unknown, actor: RequestActor): ContractSignature {
    const body = ensureObject(input, "signature");
    const state = this.store.getState();
    const contract = state.contracts.find(c => c.id === contractId && c.tenantId === actor.tenantId);
    if (!contract) notFound("Contract not found");
    const signature: ContractSignature = {
      id: newId("signature"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      contractId,
      signerPartyId: ensureString(body.signerPartyId, "signature.signerPartyId"),
      signerName: ensureString(body.signerName, "signature.signerName"),
      signerEmail: ensureString(body.signerEmail, "signature.signerEmail"),
      signerRole: ensureString(body.signerRole, "signature.signerRole") as PartyRole,
      status: "pending",
      order: ensureNumber(body.order, "signature.order", 1),
      createdBy: actor.userId
    };
    state.signatures.push(signature);
    this.store.save();
    this.store.audit(actor, "signature.create", "signature", signature.id, undefined, signature);
    return clone(signature);
  }

  signContract(id: string, input: unknown, actor: RequestActor): Contract {
    const body = ensureObject(input, "signature");
    const state = this.store.getState();
    const signature = state.signatures.find(s => s.contractId === id && s.tenantId === actor.tenantId && s.status === "pending");
    if (!signature) notFound("No pending signature found for this contract");
    signature.status = "signed";
    signature.signedAt = nowIso();
    signature.signatureData = body.signatureData ? String(body.signatureData) : undefined;
    signature.ipAddress = body.ipAddress ? String(body.ipAddress) : undefined;
    signature.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "contract.sign", "contract", id, undefined, { signatureId: signature.id });
    const allSigned = state.signatures.filter(s => s.contractId === id).every(s => s.status === "signed");
    if (allSigned) {
      const contract = state.contracts.find(c => c.id === id);
      if (contract) {
        contract.status = "signed";
        contract.locked = true;
        contract.updatedAt = nowIso();
        this.emitEvent("contract.signed", { contractId: id }, actor);
      }
    } else {
      this.changeContractStatus(id, "partially_signed", actor);
    }
    this.store.save();
    return this.getContract(id, actor);
  }

  listAmendments(actor: RequestActor, query?: URLSearchParams): ContractAmendment[] {
    const contractId = pickQuery(query, "contractId");
    return clone(filterByTenant(this.store.getState().amendments, actor.tenantId).filter(a => {
      if (contractId && a.contractId !== contractId) return false;
      return true;
    }));
  }

  createAmendment(contractId: string, input: unknown, actor: RequestActor): ContractAmendment {
    const body = ensureObject(input, "amendment");
    const state = this.store.getState();
    const contract = state.contracts.find(c => c.id === contractId && c.tenantId === actor.tenantId);
    if (!contract) notFound("Contract not found");
    const amendment: ContractAmendment = {
      id: newId("amendment"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      contractId,
      version: ensureString(body.version, "amendment.version"),
      title: ensureString(body.title, "amendment.title"),
      description: ensureString(body.description, "amendment.description"),
      effectiveDate: ensureString(body.effectiveDate, "amendment.effectiveDate"),
      status: "draft",
      changes: ensureArray(body.changes, "amendment.changes", []),
      createdBy: actor.userId
    };
    state.amendments.push(amendment);
    this.store.save();
    this.store.audit(actor, "amendment.create", "amendment", amendment.id, undefined, amendment);
    return clone(amendment);
  }

  listRisks(actor: RequestActor, query?: URLSearchParams): ContractRisk[] {
    const contractId = pickQuery(query, "contractId");
    const severity = pickQuery(query, "severity");
    return clone(filterByTenant(this.store.getState().risks, actor.tenantId).filter(r => {
      if (contractId && r.contractId !== contractId) return false;
      if (severity && r.severity !== severity) return false;
      return true;
    }));
  }

  createRisk(contractId: string, input: unknown, actor: RequestActor): ContractRisk {
    const body = ensureObject(input, "risk");
    const state = this.store.getState();
    const contract = state.contracts.find(c => c.id === contractId && c.tenantId === actor.tenantId);
    if (!contract) notFound("Contract not found");
    const risk: ContractRisk = {
      id: newId("risk"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      contractId,
      title: ensureString(body.title, "risk.title"),
      description: ensureString(body.description, "risk.description"),
      category: ensureString(body.category, "risk.category") as ContractRisk["category"],
      severity: ensureString(body.severity, "risk.severity") as ContractRisk["severity"],
      status: "open",
      mitigation: body.mitigation ? String(body.mitigation) : undefined,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      createdBy: actor.userId
    };
    state.risks.push(risk);
    this.store.save();
    this.store.audit(actor, "risk.create", "risk", risk.id, undefined, risk);
    return clone(risk);
  }

  listRenewals(actor: RequestActor, query?: URLSearchParams): ContractRenewal[] {
    const contractId = pickQuery(query, "contractId");
    const status = pickQuery(query, "status");
    return clone(filterByTenant(this.store.getState().renewals, actor.tenantId).filter(r => {
      if (contractId && r.contractId !== contractId) return false;
      if (status && r.status !== status) return false;
      return true;
    }));
  }

  createRenewal(contractId: string, input: unknown, actor: RequestActor): ContractRenewal {
    const body = ensureObject(input, "renewal");
    const state = this.store.getState();
    const contract = state.contracts.find(c => c.id === contractId && c.tenantId === actor.tenantId);
    if (!contract) notFound("Contract not found");
    const renewal: ContractRenewal = {
      id: newId("renewal"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      contractId,
      renewalDate: ensureString(body.renewalDate, "renewal.renewalDate"),
      newExpiryDate: ensureString(body.newExpiryDate, "renewal.newExpiryDate"),
      newValue: body.newValue ? ensureNumber(body.newValue, "renewal.newValue") : undefined,
      status: "pending",
      autoRenew: ensureBoolean(body.autoRenew, false),
      renewalTerms: body.renewalTerms ? String(body.renewalTerms) : undefined,
      createdBy: actor.userId
    };
    state.renewals.push(renewal);
    this.store.save();
    this.store.audit(actor, "renewal.create", "renewal", renewal.id, undefined, renewal);
    this.emitEvent("contract.renewed.pending", { contractId, renewalId: renewal.id }, actor);
    return clone(renewal);
  }

  listAuditLogs(actor: RequestActor): import("./core/domain").AuditLog[] {
    return clone(filterByTenant(this.store.getState().auditLogs, actor.tenantId));
  }

  private createInitialVersion(contract: Contract, actor: RequestActor): void {
    const state = this.store.getState();
    const version: ContractVersion = {
      id: newId("version"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      contractId: contract.id,
      version: 1,
      content: "",
      changes: "Initial draft",
      createdBy: actor.userId,
      notes: "Contract created",
      status: "draft"
    };
    state.versions.push(version);
    contract.currentVersionId = version.id;
  }

  private emitEvent(type: string, data: Record<string, unknown>, actor: RequestActor): void {
    const state = this.store.getState();
    const event: ContractEvent = {
      id: newId("event"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type,
      source: "ContractOS",
      data
    };
    state.events.unshift(event);
  }
}
