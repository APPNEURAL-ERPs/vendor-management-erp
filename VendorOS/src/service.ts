import { DataStore } from "./core/datastore";
import {
  Vendor,
  VendorCategory,
  VendorContract,
  VendorDocument,
  VendorOnboarding,
  VendorPerformance,
  VendorRisk,
  VendorInvoice,
  VendorPayment,
  VendorIssue,
  VendorSubscription,
  VendorOverview,
  VendorEvent,
  RequestActor,
  OnboardingStep
} from "./core/domain";
import { badRequest, conflict, notFound } from "./core/errors";
import { newId, nowIso, isExpired } from "./core/id";
import { clone, ensureObject, ensureString, ensureNumber, ensureBoolean, ensureArray, optionalObject, pickQuery, includesText, countBy, maskBankAccount } from "./core/utils";

export class VendorService {
  constructor(private readonly store: DataStore) {}

  overview(actor: RequestActor): VendorOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    const vendors = state.vendors.filter(v => v.tenantId === tenant);
    const activeVendors = vendors.filter(v => v.status === "active");
    const contracts = state.contracts.filter(c => c.tenantId === tenant);
    const documents = state.documents.filter(d => d.tenantId === tenant);
    const issues = state.issues.filter(i => i.tenantId === tenant && i.status !== "closed" && i.status !== "resolved");
    const invoices = state.invoices.filter(i => i.tenantId === tenant);

    const now = nowIso();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringContracts = contracts.filter(c => c.status === "active" && c.endDate <= thirtyDaysFromNow.toISOString()).length;
    const expiringDocuments = documents.filter(d => d.status === "verified" && d.expiryDate && d.expiryDate <= thirtyDaysFromNow.toISOString()).length;

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    const monthlyPayments = state.payments.filter(p => p.tenantId === tenant && p.status === "paid" && p.paymentDate && p.paymentDate >= thisMonthStart.toISOString());
    const monthlySpend = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      total: vendors.length,
      active: activeVendors.length,
      pending: vendors.filter(v => v.status === "under_review" || v.status === "submitted").length,
      approved: vendors.filter(v => v.status === "approved" || v.status === "active").length,
      rejected: vendors.filter(v => v.status === "rejected").length,
      suspended: vendors.filter(v => v.status === "suspended").length,
      highRisk: vendors.filter(v => v.riskLevel === "high" || v.riskLevel === "critical").length,
      byCategory: countBy(vendors.filter(v => v.categoryId), "categoryId"),
      byType: countBy(vendors, "type"),
      totalSpend: vendors.reduce((sum, v) => sum + v.totalSpend, 0),
      monthlySpend,
      openIssues: issues.length,
      expiringContracts,
      expiringDocuments
    };
  }

  listVendors(actor: RequestActor, query?: URLSearchParams): Vendor[] {
    const state = this.store.getState();
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");
    const categoryId = pickQuery(query, "categoryId");
    const type = pickQuery(query, "type");
    const riskLevel = pickQuery(query, "riskLevel");

    return clone(state.vendors.filter(v => {
      if (v.tenantId !== actor.tenantId) return false;
      if (search && !`${v.key} ${v.name} ${v.legalName ?? ""} ${v.description ?? ""}`.toLowerCase().includes(search)) return false;
      if (status && v.status !== status) return false;
      if (categoryId && v.categoryId !== categoryId) return false;
      if (type && v.type !== type) return false;
      if (riskLevel && v.riskLevel !== riskLevel) return false;
      return true;
    }));
  }

  getVendor(id: string, actor: RequestActor): Vendor {
    const vendor = this.store.getState().vendors.find(v => v.id === id && v.tenantId === actor.tenantId);
    if (!vendor) notFound("Vendor not found");
    return clone(vendor);
  }

  createVendor(input: unknown, actor: RequestActor): Vendor {
    const body = ensureObject(input, "vendor");
    const state = this.store.getState();
    const key = ensureString(body.key, "vendor.key");
    if (state.vendors.some(v => v.tenantId === actor.tenantId && v.key === key)) conflict(`Vendor key '${key}' already exists`);

    const vendor: Vendor = {
      id: newId("vendor"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "vendor.name"),
      legalName: body.legalName ? String(body.legalName) : undefined,
      type: String(body.type ?? "service_provider") as Vendor["type"],
      categoryId: body.categoryId ? String(body.categoryId) : undefined,
      status: "draft",
      riskLevel: String(body.riskLevel ?? "low") as Vendor["riskLevel"],
      contacts: ensureArray(body.contacts, "vendor.contacts", []),
      addresses: ensureArray(body.addresses, "vendor.addresses", []),
      taxDetail: body.taxDetail ? { taxId: "", taxIdType: "gstin" as const, isVerified: false, ...optionalObject(body.taxDetail) } : undefined,
      bankDetail: body.bankDetail ? { bankName: "", accountNumber: "", accountHolderName: "", isVerified: false, ...optionalObject(body.bankDetail) } : undefined,
      services: ensureArray(body.services, "vendor.services", []),
      description: body.description ? String(body.description) : undefined,
      website: body.website ? String(body.website) : undefined,
      owner: body.owner ? String(body.owner) : undefined,
      tier: body.tier ? String(body.tier) as Vendor["tier"] : undefined,
      tags: ensureArray(body.tags, "vendor.tags", []),
      metadata: optionalObject(body.metadata),
      createdBy: actor.userId,
      totalSpend: 0
    };

    state.vendors.push(vendor);
    this.store.save();
    this.store.audit(actor, "vendor.create", "vendor", vendor.id, undefined, vendor);
    return clone(vendor);
  }

  updateVendor(id: string, input: unknown, actor: RequestActor): Vendor {
    const body = ensureObject(input, "vendor");
    const state = this.store.getState();
    const vendor = state.vendors.find(v => v.id === id && v.tenantId === actor.tenantId);
    if (!vendor) notFound("Vendor not found");

    const before = clone(vendor);

    if (body.name !== undefined) vendor.name = String(body.name);
    if (body.legalName !== undefined) vendor.legalName = String(body.legalName);
    if (body.type !== undefined) vendor.type = String(body.type) as Vendor["type"];
    if (body.categoryId !== undefined) vendor.categoryId = body.categoryId ? String(body.categoryId) : undefined;
    if (body.status !== undefined) vendor.status = String(body.status) as Vendor["status"];
    if (body.riskLevel !== undefined) vendor.riskLevel = String(body.riskLevel) as Vendor["riskLevel"];
    if (body.description !== undefined) vendor.description = String(body.description);
    if (body.website !== undefined) vendor.website = String(body.website);
    if (body.owner !== undefined) vendor.owner = String(body.owner);
    if (body.tier !== undefined) vendor.tier = String(body.tier) as Vendor["tier"];
    if (body.tags !== undefined) vendor.tags = ensureArray(body.tags, "tags");
    if (body.contacts !== undefined) vendor.contacts = ensureArray(body.contacts, "contacts");
    if (body.addresses !== undefined) vendor.addresses = ensureArray(body.addresses, "addresses");
    if (body.services !== undefined) vendor.services = ensureArray(body.services, "services");
    if (body.metadata !== undefined) vendor.metadata = optionalObject(body.metadata);

    vendor.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "vendor.update", "vendor", vendor.id, before, vendor);
    return clone(vendor);
  }

  approveVendor(id: string, input: unknown, actor: RequestActor): Vendor {
    const body = ensureObject(input, "vendorApproval");
    const state = this.store.getState();
    const vendor = state.vendors.find(v => v.id === id && v.tenantId === actor.tenantId);
    if (!vendor) notFound("Vendor not found");

    vendor.status = "approved";
    vendor.approvedBy = actor.userId;
    vendor.approvedAt = nowIso();
    vendor.updatedAt = nowIso();

    this.store.save();
    this.emitEvent(vendor.id, "vendor.approved", { vendorId: vendor.id, vendorKey: vendor.key }, actor);
    this.store.audit(actor, "vendor.approve", "vendor", vendor.id, undefined, { status: vendor.status });
    return clone(vendor);
  }

  rejectVendor(id: string, input: unknown, actor: RequestActor): Vendor {
    const body = ensureObject(input, "vendorRejection");
    const state = this.store.getState();
    const vendor = state.vendors.find(v => v.id === id && v.tenantId === actor.tenantId);
    if (!vendor) notFound("Vendor not found");

    vendor.status = "rejected";
    vendor.rejectedBy = actor.userId;
    vendor.rejectedAt = nowIso();
    vendor.rejectionReason = body.reason ? String(body.reason) : undefined;
    vendor.updatedAt = nowIso();

    this.store.save();
    this.emitEvent(vendor.id, "vendor.rejected", { vendorId: vendor.id, vendorKey: vendor.key }, actor);
    this.store.audit(actor, "vendor.reject", "vendor", vendor.id, undefined, { status: vendor.status });
    return clone(vendor);
  }

  suspendVendor(id: string, input: unknown, actor: RequestActor): Vendor {
    const body = ensureObject(input, "vendorSuspension");
    const state = this.store.getState();
    const vendor = state.vendors.find(v => v.id === id && v.tenantId === actor.tenantId);
    if (!vendor) notFound("Vendor not found");

    vendor.status = "suspended";
    vendor.suspendedBy = actor.userId;
    vendor.suspendedAt = nowIso();
    vendor.suspensionReason = body.reason ? String(body.reason) : undefined;
    vendor.updatedAt = nowIso();

    this.store.save();
    this.emitEvent(vendor.id, "vendor.suspended", { vendorId: vendor.id, vendorKey: vendor.key }, actor);
    this.store.audit(actor, "vendor.suspend", "vendor", vendor.id, undefined, { status: vendor.status });
    return clone(vendor);
  }

  activateVendor(id: string, actor: RequestActor): Vendor {
    const state = this.store.getState();
    const vendor = state.vendors.find(v => v.id === id && v.tenantId === actor.tenantId);
    if (!vendor) notFound("Vendor not found");

    vendor.status = "active";
    vendor.updatedAt = nowIso();

    this.store.save();
    this.emitEvent(vendor.id, "vendor.onboarded", { vendorId: vendor.id, vendorKey: vendor.key }, actor);
    this.store.audit(actor, "vendor.activate", "vendor", vendor.id, undefined, { status: vendor.status });
    return clone(vendor);
  }

  listCategories(actor: RequestActor): VendorCategory[] {
    return clone(this.store.getState().categories.filter(c => c.tenantId === actor.tenantId && c.isActive));
  }

  createCategory(input: unknown, actor: RequestActor): VendorCategory {
    const body = ensureObject(input, "category");
    const state = this.store.getState();
    const key = ensureString(body.key, "category.key");
    if (state.categories.some(c => c.tenantId === actor.tenantId && c.key === key)) conflict(`Category key '${key}' already exists`);

    const category: VendorCategory = {
      id: newId("cat"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "category.name"),
      description: body.description ? String(body.description) : undefined,
      parentId: body.parentId ? String(body.parentId) : undefined,
      vendorCount: 0,
      isActive: true
    };

    state.categories.push(category);
    this.store.save();
    this.store.audit(actor, "category.create", "category", category.id, undefined, category);
    return clone(category);
  }

  listContracts(actor: RequestActor, query?: URLSearchParams): VendorContract[] {
    const vendorId = pickQuery(query, "vendorId");
    return clone(this.store.getState().contracts.filter(c => {
      if (c.tenantId !== actor.tenantId) return false;
      if (vendorId && c.vendorId !== vendorId) return false;
      return true;
    }));
  }

  createContract(input: unknown, actor: RequestActor): VendorContract {
    const body = ensureObject(input, "contract");
    const state = this.store.getState();
    const key = ensureString(body.key, "contract.key");
    if (state.contracts.some(c => c.tenantId === actor.tenantId && c.key === key)) conflict(`Contract key '${key}' already exists`);

    const vendorId = ensureString(body.vendorId, "contract.vendorId");
    const vendor = state.vendors.find(v => v.id === vendorId && v.tenantId === actor.tenantId);
    if (!vendor) notFound("Vendor not found");

    const contract: VendorContract = {
      id: newId("contract"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      vendorId,
      key,
      name: ensureString(body.name, "contract.name"),
      type: String(body.type ?? "vendor_agreement") as VendorContract["type"],
      status: "draft",
      startDate: ensureString(body.startDate, "contract.startDate"),
      endDate: ensureString(body.endDate, "contract.endDate"),
      value: body.value ? Number(body.value) : undefined,
      currency: String(body.currency ?? "INR"),
      paymentTerms: body.paymentTerms ? String(body.paymentTerms) : undefined,
      description: body.description ? String(body.description) : undefined,
      documents: ensureArray(body.documents, "contract.documents", []),
      renewalTerms: body.renewalTerms ? String(body.renewalTerms) : undefined,
      autoRenew: ensureBoolean(body.autoRenew, false),
      noticePeriodDays: body.noticePeriodDays ? Number(body.noticePeriodDays) : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.contracts.push(contract);
    this.store.save();
    this.store.audit(actor, "contract.create", "contract", contract.id, undefined, contract);
    return clone(contract);
  }

  listDocuments(actor: RequestActor, query?: URLSearchParams): VendorDocument[] {
    const vendorId = pickQuery(query, "vendorId");
    return clone(this.store.getState().documents.filter(d => {
      if (d.tenantId !== actor.tenantId) return false;
      if (vendorId && d.vendorId !== vendorId) return false;
      return true;
    }));
  }

  createDocument(input: unknown, actor: RequestActor): VendorDocument {
    const body = ensureObject(input, "document");
    const state = this.store.getState();

    const vendorId = ensureString(body.vendorId, "document.vendorId");
    const vendor = state.vendors.find(v => v.id === vendorId && v.tenantId === actor.tenantId);
    if (!vendor) notFound("Vendor not found");

    const document: VendorDocument = {
      id: newId("doc"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      vendorId,
      key: ensureString(body.key, "document.key"),
      name: ensureString(body.name, "document.name"),
      type: String(body.type ?? "other") as VendorDocument["type"],
      status: "submitted",
      uri: body.uri ? String(body.uri) : undefined,
      expiryDate: body.expiryDate ? String(body.expiryDate) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.documents.push(document);
    this.store.save();
    this.store.audit(actor, "document.create", "document", document.id, undefined, document);
    return clone(document);
  }

  listOnboardingRecords(actor: RequestActor, query?: URLSearchParams): VendorOnboarding[] {
    const vendorId = pickQuery(query, "vendorId");
    return clone(this.store.getState().onboardingRecords.filter(o => {
      if (o.tenantId !== actor.tenantId) return false;
      if (vendorId && o.vendorId !== vendorId) return false;
      return true;
    }));
  }

  createOnboarding(input: unknown, actor: RequestActor): VendorOnboarding {
    const body = ensureObject(input, "onboarding");
    const state = this.store.getState();

    const defaultSteps: OnboardingStep[] = [
      { id: "registration", name: "Vendor Registration", status: "pending" },
      { id: "business_details", name: "Business Details", status: "pending" },
      { id: "tax_details", name: "Tax Details", status: "pending" },
      { id: "bank_details", name: "Bank Details", status: "pending" },
      { id: "documents", name: "Document Upload", status: "pending" },
      { id: "compliance", name: "Compliance Check", status: "pending" },
      { id: "risk_review", name: "Risk Review", status: "pending" },
      { id: "approval", name: "Final Approval", status: "pending" }
    ];

    const onboarding: VendorOnboarding = {
      id: newId("onboard"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      vendorId: body.vendorId ? String(body.vendorId) : undefined,
      key: ensureString(body.key, "onboarding.key"),
      status: "draft",
      steps: body.steps ? ensureArray(body.steps, "onboarding.steps") : defaultSteps,
      currentStep: 0,
      ownerId: actor.userId,
      metadata: optionalObject(body.metadata)
    };

    state.onboardingRecords.push(onboarding);
    this.store.save();
    this.store.audit(actor, "onboarding.create", "onboarding", onboarding.id, undefined, onboarding);
    return clone(onboarding);
  }

  listPerformanceRecords(actor: RequestActor, query?: URLSearchParams): VendorPerformance[] {
    const vendorId = pickQuery(query, "vendorId");
    return clone(this.store.getState().performanceRecords.filter(p => {
      if (p.tenantId !== actor.tenantId) return false;
      if (vendorId && p.vendorId !== vendorId) return false;
      return true;
    }));
  }

  createPerformance(input: unknown, actor: RequestActor): VendorPerformance {
    const body = ensureObject(input, "performance");
    const state = this.store.getState();

    const vendorId = ensureString(body.vendorId, "performance.vendorId");
    const vendor = state.vendors.find(v => v.id === vendorId && v.tenantId === actor.tenantId);
    if (!vendor) notFound("Vendor not found");

    const deliveryScore = ensureNumber(body.deliveryScore, "performance.deliveryScore", 0);
    const qualityScore = ensureNumber(body.qualityScore, "performance.qualityScore", 0);
    const costScore = ensureNumber(body.costScore, "performance.costScore", 0);
    const supportScore = ensureNumber(body.supportScore, "performance.supportScore", 0);
    const overallScore = Math.round((deliveryScore + qualityScore + costScore + supportScore) / 4);

    const performance: VendorPerformance = {
      id: newId("perf"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      vendorId,
      period: ensureString(body.period, "performance.period"),
      deliveryScore,
      qualityScore,
      costScore,
      supportScore,
      overallScore,
      onTimeDeliveryRate: ensureNumber(body.onTimeDeliveryRate, "performance.onTimeDeliveryRate", 100),
      qualityIssueRate: ensureNumber(body.qualityIssueRate, "performance.qualityIssueRate", 0),
      slaComplianceRate: ensureNumber(body.slaComplianceRate, "performance.slaComplianceRate", 100),
      invoiceAccuracyRate: ensureNumber(body.invoiceAccuracyRate, "performance.invoiceAccuracyRate", 100),
      responseTimeHours: body.responseTimeHours ? Number(body.responseTimeHours) : undefined,
      reviewDate: nowIso(),
      reviewedBy: actor.userId,
      notes: body.notes ? String(body.notes) : undefined,
      metadata: optionalObject(body.metadata)
    };

    vendor.performanceScore = overallScore;
    vendor.lastPerformanceReview = nowIso();
    state.performanceRecords.push(performance);
    this.store.save();
    this.store.audit(actor, "performance.create", "performance", performance.id, undefined, performance);
    return clone(performance);
  }

  listRiskRecords(actor: RequestActor, query?: URLSearchParams): VendorRisk[] {
    const vendorId = pickQuery(query, "vendorId");
    const level = pickQuery(query, "level");
    return clone(this.store.getState().riskRecords.filter(r => {
      if (r.tenantId !== actor.tenantId) return false;
      if (vendorId && r.vendorId !== vendorId) return false;
      if (level && r.level !== level) return false;
      return true;
    }));
  }

  createRisk(input: unknown, actor: RequestActor): VendorRisk {
    const body = ensureObject(input, "risk");
    const state = this.store.getState();

    const vendorId = ensureString(body.vendorId, "risk.vendorId");
    const vendor = state.vendors.find(v => v.id === vendorId && v.tenantId === actor.tenantId);
    if (!vendor) notFound("Vendor not found");

    const risk: VendorRisk = {
      id: newId("risk"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      vendorId,
      category: String(body.category ?? "compliance") as VendorRisk["category"],
      level: String(body.level ?? "medium") as VendorRisk["level"],
      title: ensureString(body.title, "risk.title"),
      description: body.description ? String(body.description) : undefined,
      status: "open",
      mitigationPlan: body.mitigationPlan ? String(body.mitigationPlan) : undefined,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      dueDate: body.dueDate ? String(body.dueDate) : undefined,
      metadata: optionalObject(body.metadata)
    };

    if (risk.level === "high" || risk.level === "critical") {
      vendor.riskLevel = risk.level;
    }

    state.riskRecords.push(risk);
    this.store.save();
    this.store.audit(actor, "risk.create", "risk", risk.id, undefined, risk);
    return clone(risk);
  }

  listInvoices(actor: RequestActor, query?: URLSearchParams): VendorInvoice[] {
    const vendorId = pickQuery(query, "vendorId");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().invoices.filter(i => {
      if (i.tenantId !== actor.tenantId) return false;
      if (vendorId && i.vendorId !== vendorId) return false;
      if (status && i.status !== status) return false;
      return true;
    }));
  }

  createInvoice(input: unknown, actor: RequestActor): VendorInvoice {
    const body = ensureObject(input, "invoice");
    const state = this.store.getState();

    const vendorId = ensureString(body.vendorId, "invoice.vendorId");
    const vendor = state.vendors.find(v => v.id === vendorId && v.tenantId === actor.tenantId);
    if (!vendor) notFound("Vendor not found");

    const lineItems = ensureArray(body.lineItems, "invoice.lineItems", []);
    const subtotal = lineItems.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0);
    const taxAmount = body.taxAmount ? Number(body.taxAmount) : 0;

    const invoice: VendorInvoice = {
      id: newId("inv"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      vendorId,
      invoiceNumber: ensureString(body.invoiceNumber, "invoice.invoiceNumber"),
      poNumber: body.poNumber ? String(body.poNumber) : undefined,
      amount: subtotal,
      currency: String(body.currency ?? "INR"),
      taxAmount,
      totalAmount: subtotal + taxAmount,
      status: "received",
      issueDate: ensureString(body.issueDate, "invoice.issueDate"),
      dueDate: ensureString(body.dueDate, "invoice.dueDate"),
      description: body.description ? String(body.description) : undefined,
      lineItems: lineItems as VendorInvoice["lineItems"],
      metadata: optionalObject(body.metadata)
    };

    state.invoices.push(invoice);
    this.store.save();
    this.emitEvent(vendorId, "vendor.invoice.received", { vendorId, invoiceId: invoice.id }, actor);
    this.store.audit(actor, "invoice.create", "invoice", invoice.id, undefined, invoice);
    return clone(invoice);
  }

  listPayments(actor: RequestActor, query?: URLSearchParams): VendorPayment[] {
    const vendorId = pickQuery(query, "vendorId");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().payments.filter(p => {
      if (p.tenantId !== actor.tenantId) return false;
      if (vendorId && p.vendorId !== vendorId) return false;
      if (status && p.status !== status) return false;
      return true;
    }));
  }

  createPayment(input: unknown, actor: RequestActor): VendorPayment {
    const body = ensureObject(input, "payment");
    const state = this.store.getState();

    const vendorId = ensureString(body.vendorId, "payment.vendorId");
    const vendor = state.vendors.find(v => v.id === vendorId && v.tenantId === actor.tenantId);
    if (!vendor) notFound("Vendor not found");

    const payment: VendorPayment = {
      id: newId("pay"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      vendorId,
      invoiceId: body.invoiceId ? String(body.invoiceId) : undefined,
      amount: ensureNumber(body.amount, "payment.amount"),
      currency: String(body.currency ?? "INR"),
      status: "pending",
      paymentMethod: body.paymentMethod ? String(body.paymentMethod) : undefined,
      scheduledDate: body.scheduledDate ? String(body.scheduledDate) : undefined,
      referenceNumber: body.referenceNumber ? String(body.referenceNumber) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.payments.push(payment);
    this.store.save();
    this.store.audit(actor, "payment.create", "payment", payment.id, undefined, payment);
    return clone(payment);
  }

  listIssues(actor: RequestActor, query?: URLSearchParams): VendorIssue[] {
    const vendorId = pickQuery(query, "vendorId");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().issues.filter(i => {
      if (i.tenantId !== actor.tenantId) return false;
      if (vendorId && i.vendorId !== vendorId) return false;
      if (status && i.status !== status) return false;
      return true;
    }));
  }

  createIssue(input: unknown, actor: RequestActor): VendorIssue {
    const body = ensureObject(input, "issue");
    const state = this.store.getState();

    const vendorId = ensureString(body.vendorId, "issue.vendorId");
    const vendor = state.vendors.find(v => v.id === vendorId && v.tenantId === actor.tenantId);
    if (!vendor) notFound("Vendor not found");

    const issue: VendorIssue = {
      id: newId("issue"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      vendorId,
      key: ensureString(body.key, "issue.key"),
      type: String(body.type ?? "other") as VendorIssue["type"],
      status: "open",
      priority: String(body.priority ?? "medium") as VendorIssue["priority"],
      title: ensureString(body.title, "issue.title"),
      description: body.description ? String(body.description) : undefined,
      assignedTo: body.assignedTo ? String(body.assignedTo) : undefined,
      slaDeadline: body.slaDeadline ? String(body.slaDeadline) : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.issues.push(issue);
    this.store.save();
    this.store.audit(actor, "issue.create", "issue", issue.id, undefined, issue);
    return clone(issue);
  }

  listSubscriptions(actor: RequestActor, query?: URLSearchParams): VendorSubscription[] {
    const vendorId = pickQuery(query, "vendorId");
    return clone(this.store.getState().subscriptions.filter(s => {
      if (s.tenantId !== actor.tenantId) return false;
      if (vendorId && s.vendorId !== vendorId) return false;
      return true;
    }));
  }

  createSubscription(input: unknown, actor: RequestActor): VendorSubscription {
    const body = ensureObject(input, "subscription");
    const state = this.store.getState();

    const vendorId = ensureString(body.vendorId, "subscription.vendorId");
    const vendor = state.vendors.find(v => v.id === vendorId && v.tenantId === actor.tenantId);
    if (!vendor) notFound("Vendor not found");

    const subscription: VendorSubscription = {
      id: newId("sub"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      vendorId,
      name: ensureString(body.name, "subscription.name"),
      plan: body.plan ? String(body.plan) : undefined,
      status: "active",
      startDate: ensureString(body.startDate, "subscription.startDate"),
      endDate: body.endDate ? String(body.endDate) : undefined,
      billingCycle: String(body.billingCycle ?? "monthly") as VendorSubscription["billingCycle"],
      amount: ensureNumber(body.amount, "subscription.amount"),
      currency: String(body.currency ?? "INR"),
      autoRenew: ensureBoolean(body.autoRenew, true),
      usageData: optionalObject(body.usageData),
      nextBillingDate: body.nextBillingDate ? String(body.nextBillingDate) : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.subscriptions.push(subscription);
    this.store.save();
    this.store.audit(actor, "subscription.create", "subscription", subscription.id, undefined, subscription);
    return clone(subscription);
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter(l => l.tenantId === actor.tenantId));
  }

  private emitEvent(vendorId: string, type: string, data: Record<string, unknown>, actor: RequestActor): VendorEvent {
    const event: VendorEvent = {
      id: newId("evt"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type,
      source: "VendorOS",
      vendorId,
      data
    };
    this.store.getState().events.unshift(event);
    return event;
  }
}
