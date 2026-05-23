import { DataStore } from "./core/datastore";
import {
  Approval,
  BudgetAllocation,
  ProcurementOverview,
  PurchaseOrder,
  PurchaseRequest,
  Quote,
  Receipt,
  RequestActor,
  RFQ,
  Vendor
} from "./domain";
import { badRequest, conflict, notFound } from "./core/errors";
import { newId, nowIso } from "./core/id";
import {
  clone,
  ensureArray,
  ensureBoolean,
  ensureNumber,
  ensureObject,
  ensureString,
  optionalObject,
  pickQuery
} from "./core/utils";

export class ProcurementService {
  constructor(private readonly store: DataStore) {}

  overview(actor: RequestActor): ProcurementOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    const vendors = state.vendors.filter((v) => v.tenantId === tenant);
    const requests = state.purchaseRequests.filter((r) => r.tenantId === tenant);
    const orders = state.purchaseOrders.filter((o) => o.tenantId === tenant);
    const receipts = state.receipts.filter((r) => r.tenantId === tenant);
    const approvals = state.approvals.filter((a) => a.tenantId === tenant && a.status === "pending");
    const rfqs = state.rfqs.filter((r) => r.tenantId === tenant);
    const quotes = state.quotes.filter((q) => q.tenantId === tenant);

    const totalSpend = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      vendors: {
        total: vendors.length,
        active: vendors.filter((v) => v.status === "active").length
      },
      purchaseRequests: {
        total: requests.length,
        pending: requests.filter((r) => ["submitted", "under_review"].includes(r.status)).length,
        approved: requests.filter((r) => r.status === "approved").length,
        rejected: requests.filter((r) => r.status === "rejected").length
      },
      purchaseOrders: {
        total: orders.length,
        open: orders.filter((o) => !["closed", "cancelled"].includes(o.status)).length,
        closed: orders.filter((o) => ["closed", "cancelled"].includes(o.status)).length
      },
      receipts: {
        total: receipts.length,
        pending: receipts.filter((r) => ["pending", "partial"].includes(r.status)).length,
        complete: receipts.filter((r) => r.status === "complete").length
      },
      approvals: {
        pending: approvals.length,
        overdue: 0
      },
      spend: {
        total: totalSpend,
        thisMonth: totalSpend,
        thisQuarter: totalSpend
      },
      rfqs: {
        total: rfqs.length,
        active: rfqs.filter((r) => ["sent", "responded"].includes(r.status)).length
      },
      quotes: {
        total: quotes.length
      }
    };
  }

  listVendors(actor: RequestActor, query?: URLSearchParams): Vendor[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const category = pickQuery(query, "category");
    return clone(
      this.store.getState().vendors.filter((v) => {
        if (v.tenantId !== actor.tenantId) return false;
        if (search && !`${v.name} ${v.email} ${v.category}`.toLowerCase().includes(search)) return false;
        if (category && v.category !== category) return false;
        return true;
      })
    );
  }

  createVendor(input: unknown, actor: RequestActor): Vendor {
    const body = ensureObject(input, "vendor");
    const state = this.store.getState();
    const name = ensureString(body.name, "vendor.name");
    const email = ensureString(body.email, "vendor.email");

    if (state.vendors.some((v) => v.tenantId === actor.tenantId && v.email === email)) {
      conflict(`Vendor with email '${email}' already exists`);
    }

    const vendor: Vendor = {
      id: newId("vendor"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name,
      contactPerson: body.contactPerson ? String(body.contactPerson) : undefined,
      email,
      phone: body.phone ? String(body.phone) : undefined,
      address: body.address ? String(body.address) : undefined,
      category: ensureString(body.category, "vendor.category"),
      status: String(body.status ?? "active") as Vendor["status"],
      rating: body.rating ? ensureNumber(body.rating, "vendor.rating") : undefined,
      paymentTerms: body.paymentTerms ? String(body.paymentTerms) : undefined,
      bankDetails: body.bankDetails ? String(body.bankDetails) : undefined,
      taxId: body.taxId ? String(body.taxId) : undefined,
      notes: body.notes ? String(body.notes) : undefined
    };

    state.vendors.push(vendor);
    this.store.save();
    this.store.audit(actor, "vendor.create", "vendor", vendor.id, undefined, vendor);
    return clone(vendor);
  }

  listPurchaseRequests(actor: RequestActor, query?: URLSearchParams): PurchaseRequest[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");
    const department = pickQuery(query, "department");
    return clone(
      this.store.getState().purchaseRequests.filter((r) => {
        if (r.tenantId !== actor.tenantId) return false;
        if (search && !`${r.title} ${r.requestNumber} ${r.description ?? ""}`.toLowerCase().includes(search)) return false;
        if (status && r.status !== status) return false;
        if (department && r.department !== department) return false;
        return true;
      })
    );
  }

  getPurchaseRequest(id: string, actor: RequestActor): PurchaseRequest {
    const request = this.store
      .getState()
      .purchaseRequests.find((r) => r.id === id && r.tenantId === actor.tenantId);
    if (!request) notFound("Purchase request not found");
    return clone(request);
  }

  createPurchaseRequest(input: unknown, actor: RequestActor): PurchaseRequest {
    const body = ensureObject(input, "purchaseRequest");
    const state = this.store.getState();

    const items = ensureArray(body.items, "purchaseRequest.items").map((item: any) => ({
      id: newId("item"),
      description: ensureString(item.description, "item.description"),
      quantity: ensureNumber(item.quantity, "item.quantity"),
      unitPrice: ensureNumber(item.unitPrice, "item.unitPrice"),
      totalPrice: ensureNumber(item.quantity, "item.quantity") * ensureNumber(item.unitPrice, "item.unitPrice"),
      unit: item.unit ? String(item.unit) : undefined,
      specifications: item.specifications ? String(item.specifications) : undefined
    }));

    const totalAmount = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

    const requestNumber = `PR-${Date.now().toString(36).toUpperCase()}`;

    const request: PurchaseRequest = {
      id: newId("pr"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      requestNumber,
      title: ensureString(body.title, "purchaseRequest.title"),
      description: body.description ? String(body.description) : undefined,
      requestedBy: actor.userId,
      department: ensureString(body.department, "purchaseRequest.department"),
      project: body.project ? String(body.project) : undefined,
      category: ensureString(body.category, "purchaseRequest.category"),
      items,
      totalAmount,
      currency: String(body.currency ?? "INR"),
      priority: String(body.priority ?? "medium") as PurchaseRequest["priority"],
      status: "draft",
      requiredDate: body.requiredDate ? String(body.requiredDate) : undefined,
      preferredVendorId: body.preferredVendorId ? String(body.preferredVendorId) : undefined,
      budgetAvailable: ensureBoolean(body.budgetAvailable, true),
      notes: body.notes ? String(body.notes) : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.purchaseRequests.push(request);
    this.store.save();
    this.store.audit(actor, "request.create", "purchaseRequest", request.id, undefined, request);
    return clone(request);
  }

  submitPurchaseRequest(id: string, actor: RequestActor): PurchaseRequest {
    const state = this.store.getState();
    const request = state.purchaseRequests.find((r) => r.id === id && r.tenantId === actor.tenantId);
    if (!request) notFound("Purchase request not found");
    if (request.status !== "draft") badRequest("Only draft requests can be submitted");

    const before = clone(request);
    request.status = "submitted";
    request.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "request.submit", "purchaseRequest", request.id, before, request);
    return clone(request);
  }

  approvePurchaseRequest(id: string, input: unknown, actor: RequestActor): PurchaseRequest {
    const body = ensureObject(input, "approval");
    const state = this.store.getState();
    const request = state.purchaseRequests.find((r) => r.id === id && r.tenantId === actor.tenantId);
    if (!request) notFound("Purchase request not found");
    if (!["submitted", "under_review"].includes(request.status)) {
      badRequest("Only submitted or under review requests can be approved");
    }

    const before = clone(request);
    request.status = "approved";
    request.approvedBy = actor.userId;
    request.approvedAt = nowIso();
    request.updatedAt = nowIso();
    if (body.comments) request.notes = String(body.comments);

    const approval: Approval = {
      id: newId("approval"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      entityType: "purchase_request",
      entityId: request.id,
      approverId: actor.userId,
      approverName: actor.userId,
      level: 1,
      status: "approved",
      decision: "approve",
      comments: body.comments ? String(body.comments) : undefined,
      decidedAt: nowIso(),
      isFinal: true
    };
    state.approvals.push(approval);

    this.store.save();
    this.store.audit(actor, "request.approve", "purchaseRequest", request.id, before, request);
    return clone(request);
  }

  rejectPurchaseRequest(id: string, input: unknown, actor: RequestActor): PurchaseRequest {
    const body = ensureObject(input, "rejection");
    const state = this.store.getState();
    const request = state.purchaseRequests.find((r) => r.id === id && r.tenantId === actor.tenantId);
    if (!request) notFound("Purchase request not found");
    if (!["submitted", "under_review"].includes(request.status)) {
      badRequest("Only submitted or under review requests can be rejected");
    }

    const before = clone(request);
    request.status = "rejected";
    request.rejectionReason = ensureString(body.reason, "rejection.reason");
    request.updatedAt = nowIso();

    const approval: Approval = {
      id: newId("approval"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      entityType: "purchase_request",
      entityId: request.id,
      approverId: actor.userId,
      approverName: actor.userId,
      level: 1,
      status: "rejected",
      decision: "reject",
      comments: body.reason ? String(body.reason) : undefined,
      decidedAt: nowIso(),
      isFinal: true
    };
    state.approvals.push(approval);

    this.store.save();
    this.store.audit(actor, "request.reject", "purchaseRequest", request.id, before, request);
    return clone(request);
  }

  listPurchaseOrders(actor: RequestActor, query?: URLSearchParams): PurchaseOrder[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");
    const vendorId = pickQuery(query, "vendorId");
    return clone(
      this.store.getState().purchaseOrders.filter((o) => {
        if (o.tenantId !== actor.tenantId) return false;
        if (search && !`${o.title} ${o.poNumber}`.toLowerCase().includes(search)) return false;
        if (status && o.status !== status) return false;
        if (vendorId && o.vendorId !== vendorId) return false;
        return true;
      })
    );
  }

  getPurchaseOrder(id: string, actor: RequestActor): PurchaseOrder {
    const order = this.store.getState().purchaseOrders.find((o) => o.id === id && o.tenantId === actor.tenantId);
    if (!order) notFound("Purchase order not found");
    return clone(order);
  }

  createPurchaseOrder(input: unknown, actor: RequestActor): PurchaseOrder {
    const body = ensureObject(input, "purchaseOrder");
    const state = this.store.getState();

    const vendor = state.vendors.find((v) => v.id === body.vendorId && v.tenantId === actor.tenantId);
    if (!vendor) notFound("Vendor not found");

    const items = ensureArray(body.items, "purchaseOrder.items").map((item: any) => ({
      id: newId("item"),
      description: ensureString(item.description, "item.description"),
      quantity: ensureNumber(item.quantity, "item.quantity"),
      unitPrice: ensureNumber(item.unitPrice, "item.unitPrice"),
      totalPrice: ensureNumber(item.quantity, "item.quantity") * ensureNumber(item.unitPrice, "item.unitPrice"),
      tax: item.tax ? ensureNumber(item.tax, "item.tax") : 0,
      deliveredQuantity: 0,
      specifications: item.specifications ? String(item.specifications) : undefined
    }));

    const subtotal = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
    const tax = items.reduce((sum: number, item: any) => sum + (item.tax || 0), 0);
    const totalAmount = subtotal + tax;

    const poNumber = `PO-${Date.now().toString(36).toUpperCase()}`;

    const order: PurchaseOrder = {
      id: newId("po"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      poNumber,
      vendorId: vendor.id,
      vendorName: vendor.name,
      purchaseRequestId: body.purchaseRequestId ? String(body.purchaseRequestId) : undefined,
      rfqId: body.rfqId ? String(body.rfqId) : undefined,
      quoteId: body.quoteId ? String(body.quoteId) : undefined,
      title: ensureString(body.title, "purchaseOrder.title"),
      items,
      subtotal,
      tax,
      totalAmount,
      currency: String(body.currency ?? "INR"),
      status: "draft",
      deliveryDate: body.deliveryDate ? String(body.deliveryDate) : undefined,
      deliveryAddress: body.deliveryAddress ? String(body.deliveryAddress) : undefined,
      billingAddress: body.billingAddress ? String(body.billingAddress) : undefined,
      paymentTerms: body.paymentTerms ? String(body.paymentTerms) : vendor.paymentTerms,
      termsAndConditions: body.termsAndConditions ? String(body.termsAndConditions) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.purchaseOrders.push(order);
    this.store.save();
    this.store.audit(actor, "order.create", "purchaseOrder", order.id, undefined, order);
    return clone(order);
  }

  sendPurchaseOrder(id: string, actor: RequestActor): PurchaseOrder {
    const state = this.store.getState();
    const order = state.purchaseOrders.find((o) => o.id === id && o.tenantId === actor.tenantId);
    if (!order) notFound("Purchase order not found");
    if (order.status !== "draft") badRequest("Only draft orders can be sent");

    const before = clone(order);
    order.status = "sent";
    order.sentAt = nowIso();
    order.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "order.send", "purchaseOrder", order.id, before, order);
    return clone(order);
  }

  acknowledgePurchaseOrder(id: string, actor: RequestActor): PurchaseOrder {
    const state = this.store.getState();
    const order = state.purchaseOrders.find((o) => o.id === id && o.tenantId === actor.tenantId);
    if (!order) notFound("Purchase order not found");
    if (order.status !== "sent") badRequest("Only sent orders can be acknowledged");

    const before = clone(order);
    order.status = "acknowledged";
    order.acknowledgedAt = nowIso();
    order.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "order.acknowledge", "purchaseOrder", order.id, before, order);
    return clone(order);
  }

  listReceipts(actor: RequestActor, query?: URLSearchParams): Receipt[] {
    const status = pickQuery(query, "status");
    const purchaseOrderId = pickQuery(query, "purchaseOrderId");
    return clone(
      this.store.getState().receipts.filter((r) => {
        if (r.tenantId !== actor.tenantId) return false;
        if (status && r.status !== status) return false;
        if (purchaseOrderId && r.purchaseOrderId !== purchaseOrderId) return false;
        return true;
      })
    );
  }

  getReceipt(id: string, actor: RequestActor): Receipt {
    const receipt = this.store.getState().receipts.find((r) => r.id === id && r.tenantId === actor.tenantId);
    if (!receipt) notFound("Receipt not found");
    return clone(receipt);
  }

  createReceipt(input: unknown, actor: RequestActor): Receipt {
    const body = ensureObject(input, "receipt");
    const state = this.store.getState();

    const order = state.purchaseOrders.find((o) => o.id === body.purchaseOrderId && o.tenantId === actor.tenantId);
    if (!order) notFound("Purchase order not found");

    const items = ensureArray(body.items, "receipt.items").map((item: any) => ({
      id: newId("ritem"),
      purchaseOrderItemId: ensureString(item.purchaseOrderItemId, "item.purchaseOrderItemId"),
      description: ensureString(item.description, "item.description"),
      orderedQuantity: ensureNumber(item.orderedQuantity, "item.orderedQuantity"),
      receivedQuantity: ensureNumber(item.receivedQuantity, "item.receivedQuantity"),
      acceptedQuantity: ensureNumber(item.acceptedQuantity, "item.acceptedQuantity"),
      rejectedQuantity: item.rejectedQuantity ? ensureNumber(item.rejectedQuantity, "item.rejectedQuantity") : 0,
      unit: item.unit ? String(item.unit) : undefined,
      condition: item.condition ? String(item.condition) as any : "good",
      notes: item.notes ? String(item.notes) : undefined
    }));

    const totalOrdered = items.reduce((sum: number, item: any) => sum + item.orderedQuantity, 0);
    const totalReceived = items.reduce((sum: number, item: any) => sum + item.receivedQuantity, 0);
    const totalAccepted = items.reduce((sum: number, item: any) => sum + item.acceptedQuantity, 0);
    const totalRejected = items.reduce((sum: number, item: any) => sum + item.rejectedQuantity, 0);

    const receiptNumber = `GR-${Date.now().toString(36).toUpperCase()}`;

    const receipt: Receipt = {
      id: newId("receipt"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      receiptNumber,
      purchaseOrderId: order.id,
      poNumber: order.poNumber,
      vendorId: order.vendorId,
      vendorName: order.vendorName,
      items,
      totalOrdered,
      totalReceived,
      totalAccepted,
      totalRejected,
      status: totalReceived < totalOrdered ? "partial" : "complete",
      receivedDate: ensureString(body.receivedDate, "receipt.receivedDate"),
      receivedBy: actor.userId,
      qualityCheckBy: body.qualityCheckBy ? String(body.qualityCheckBy) : undefined,
      qualityCheckDate: body.qualityCheckDate ? String(body.qualityCheckDate) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      attachments: body.attachments ? ensureArray(body.attachments, "receipt.attachments") : undefined
    };

    state.receipts.push(receipt);

    const before = clone(order);
    if (receipt.status === "complete") {
      order.status = "received";
    } else {
      order.status = "partially_received";
    }
    order.items = order.items.map((orderItem) => {
      const receiptItem = items.find((ri: any) => ri.purchaseOrderItemId === orderItem.id);
      if (receiptItem) {
        return { ...orderItem, deliveredQuantity: (orderItem.deliveredQuantity || 0) + receiptItem.acceptedQuantity };
      }
      return orderItem;
    });
    order.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "receipt.create", "receipt", receipt.id, undefined, receipt);
    this.store.audit(actor, "order.update", "purchaseOrder", order.id, before, order);
    return clone(receipt);
  }

  listRFQs(actor: RequestActor, query?: URLSearchParams): RFQ[] {
    const status = pickQuery(query, "status");
    return clone(
      this.store.getState().rfqs.filter((r) => {
        if (r.tenantId !== actor.tenantId) return false;
        if (status && r.status !== status) return false;
        return true;
      })
    );
  }

  createRFQ(input: unknown, actor: RequestActor): RFQ {
    const body = ensureObject(input, "rfq");
    const state = this.store.getState();

    const items = ensureArray(body.items, "rfq.items").map((item: any) => ({
      id: newId("item"),
      description: ensureString(item.description, "item.description"),
      quantity: ensureNumber(item.quantity, "item.quantity"),
      unitPrice: 0,
      totalPrice: 0,
      specifications: item.specifications ? String(item.specifications) : undefined
    }));

    const rfqNumber = `RFQ-${Date.now().toString(36).toUpperCase()}`;

    const rfq: RFQ = {
      id: newId("rfq"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      rfqNumber,
      title: ensureString(body.title, "rfq.title"),
      description: body.description ? String(body.description) : undefined,
      purchaseRequestId: body.purchaseRequestId ? String(body.purchaseRequestId) : undefined,
      items,
      currency: String(body.currency ?? "INR"),
      status: "draft",
      vendorIds: body.vendorIds ? ensureArray(body.vendorIds, "rfq.vendorIds") : [],
      deadline: ensureString(body.deadline, "rfq.deadline"),
      deliveryDate: body.deliveryDate ? String(body.deliveryDate) : undefined,
      deliveryLocation: body.deliveryLocation ? String(body.deliveryLocation) : undefined,
      terms: body.terms ? String(body.terms) : undefined,
      notes: body.notes ? String(body.notes) : undefined
    };

    state.rfqs.push(rfq);
    this.store.save();
    this.store.audit(actor, "rfq.create", "rfq", rfq.id, undefined, rfq);
    return clone(rfq);
  }

  listQuotes(actor: RequestActor, query?: URLSearchParams): Quote[] {
    const rfqId = pickQuery(query, "rfqId");
    const vendorId = pickQuery(query, "vendorId");
    return clone(
      this.store.getState().quotes.filter((q) => {
        if (q.tenantId !== actor.tenantId) return false;
        if (rfqId && q.rfqId !== rfqId) return false;
        if (vendorId && q.vendorId !== vendorId) return false;
        return true;
      })
    );
  }

  createQuote(input: unknown, actor: RequestActor): Quote {
    const body = ensureObject(input, "quote");
    const state = this.store.getState();

    const rfq = state.rfqs.find((r) => r.id === body.rfqId && r.tenantId === actor.tenantId);
    if (!rfq) notFound("RFQ not found");

    const vendor = state.vendors.find((v) => v.id === body.vendorId && v.tenantId === actor.tenantId);
    if (!vendor) notFound("Vendor not found");

    const items = ensureArray(body.items, "quote.items").map((item: any) => ({
      id: newId("qitem"),
      description: ensureString(item.description, "item.description"),
      quantity: ensureNumber(item.quantity, "item.quantity"),
      unitPrice: ensureNumber(item.unitPrice, "item.unitPrice"),
      totalPrice: ensureNumber(item.quantity, "item.quantity") * ensureNumber(item.unitPrice, "item.unitPrice"),
      tax: item.tax ? ensureNumber(item.tax, "item.tax") : 0,
      specifications: item.specifications ? String(item.specifications) : undefined
    }));

    const subtotal = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
    const tax = items.reduce((sum: number, item: any) => sum + (item.tax || 0), 0);
    const totalAmount = subtotal + tax;

    const quoteNumber = `Q-${Date.now().toString(36).toUpperCase()}`;

    const quote: Quote = {
      id: newId("quote"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      rfqId: rfq.id,
      vendorId: vendor.id,
      vendorName: vendor.name,
      quoteNumber,
      items,
      subtotal,
      tax,
      totalAmount,
      currency: String(body.currency ?? "INR"),
      validUntil: body.validUntil ? String(body.validUntil) : undefined,
      deliveryDate: body.deliveryDate ? String(body.deliveryDate) : undefined,
      paymentTerms: body.paymentTerms ? String(body.paymentTerms) : vendor.paymentTerms,
      warranty: body.warranty ? String(body.warranty) : undefined,
      status: "submitted",
      notes: body.notes ? String(body.notes) : undefined
    };

    state.quotes.push(quote);

    if (rfq.status === "sent") {
      rfq.status = "responded";
      rfq.updatedAt = nowIso();
    }

    this.store.save();
    this.store.audit(actor, "quote.create", "quote", quote.id, undefined, quote);
    return clone(quote);
  }

  listBudgetAllocations(actor: RequestActor, query?: URLSearchParams): BudgetAllocation[] {
    const department = pickQuery(query, "department");
    const fiscalYear = pickQuery(query, "fiscalYear");
    return clone(
      this.store.getState().budgetAllocations.filter((b) => {
        if (b.tenantId !== actor.tenantId) return false;
        if (department && b.department !== department) return false;
        if (fiscalYear && b.fiscalYear !== fiscalYear) return false;
        return true;
      })
    );
  }

  getBudgetAllocation(id: string, actor: RequestActor): BudgetAllocation {
    const budget = this.store
      .getState()
      .budgetAllocations.find((b) => b.id === id && b.tenantId === actor.tenantId);
    if (!budget) notFound("Budget allocation not found");
    return clone(budget);
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((a) => a.tenantId === actor.tenantId));
  }

  listEvents(actor: RequestActor) {
    return clone(this.store.getState().events.filter((e) => e.tenantId === actor.tenantId));
  }
}
