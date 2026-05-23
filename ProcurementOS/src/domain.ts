export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "procurement_manager" | "procurement_analyst" | "approver" | "requester" | "viewer";

export interface RequestActor {
  tenantId: TenantId;
  userId: UUID;
  role: Role;
}

export interface BaseEntity {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Vendor extends BaseEntity {
  name: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  address?: string;
  category: string;
  status: "active" | "inactive" | "blocked";
  rating?: number;
  paymentTerms?: string;
  bankDetails?: string;
  taxId?: string;
  notes?: string;
}

export interface PurchaseRequestItem {
  id: UUID;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit?: string;
  specifications?: string;
}

export interface PurchaseRequest extends BaseEntity {
  requestNumber: string;
  title: string;
  description?: string;
  requestedBy: string;
  department: string;
  project?: string;
  category: string;
  items: PurchaseRequestItem[];
  totalAmount: number;
  currency: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "cancelled" | "need_more_info";
  requiredDate?: ISODate;
  preferredVendorId?: UUID;
  budgetAvailable: boolean;
  approvedBy?: UUID;
  approvedAt?: ISODate;
  rejectionReason?: string;
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface Approval extends BaseEntity {
  entityType: "purchase_request" | "purchase_order" | "rfq" | "exception";
  entityId: UUID;
  approverId: UUID;
  approverName: string;
  level: number;
  status: "pending" | "approved" | "rejected" | "skipped";
  decision?: "approve" | "reject" | "need_more_info";
  comments?: string;
  decidedAt?: ISODate;
  dueDate?: ISODate;
  isFinal: boolean;
}

export interface RFQ extends BaseEntity {
  rfqNumber: string;
  title: string;
  description?: string;
  purchaseRequestId?: UUID;
  items: PurchaseRequestItem[];
  totalAmount?: number;
  currency: string;
  status: "draft" | "sent" | "responded" | "partially_responded" | "closed" | "cancelled" | "awarded";
  vendorIds: UUID[];
  deadline: ISODate;
  deliveryDate?: ISODate;
  deliveryLocation?: string;
  terms?: string;
  awardedVendorId?: UUID;
  awardedAt?: ISODate;
  notes?: string;
}

export interface QuoteItem {
  id: UUID;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  tax?: number;
  specifications?: string;
}

export interface Quote extends BaseEntity {
  rfqId: UUID;
  vendorId: UUID;
  vendorName: string;
  quoteNumber: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  currency: string;
  validUntil?: ISODate;
  deliveryDate?: ISODate;
  paymentTerms?: string;
  warranty?: string;
  status: "draft" | "submitted" | "accepted" | "rejected" | "superseded";
  notes?: string;
}

export interface PurchaseOrderItem {
  id: UUID;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  tax?: number;
  deliveredQuantity?: number;
  specifications?: string;
}

export interface PurchaseOrder extends BaseEntity {
  poNumber: string;
  vendorId: UUID;
  vendorName: string;
  purchaseRequestId?: UUID;
  rfqId?: UUID;
  quoteId?: UUID;
  title: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  currency: string;
  status: "draft" | "pending_approval" | "approved" | "sent" | "acknowledged" | "partially_received" | "received" | "closed" | "cancelled";
  deliveryDate?: ISODate;
  deliveryAddress?: string;
  billingAddress?: string;
  paymentTerms?: string;
  termsAndConditions?: string;
  approvedBy?: UUID;
  approvedAt?: ISODate;
  sentAt?: ISODate;
  acknowledgedAt?: ISODate;
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface ReceiptItem {
  id: UUID;
  purchaseOrderItemId: UUID;
  description: string;
  orderedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  unit?: string;
  condition?: "good" | "damaged" | "defective";
  notes?: string;
}

export interface Receipt extends BaseEntity {
  receiptNumber: string;
  purchaseOrderId: UUID;
  poNumber: string;
  vendorId: UUID;
  vendorName: string;
  items: ReceiptItem[];
  totalOrdered: number;
  totalReceived: number;
  totalAccepted: number;
  totalRejected: number;
  status: "pending" | "partial" | "complete" | "rejected" | "quality_failed" | "closed";
  receivedDate: ISODate;
  receivedBy: string;
  qualityCheckBy?: string;
  qualityCheckDate?: ISODate;
  notes?: string;
  attachments?: string[];
}

export interface InvoiceMatch extends BaseEntity {
  purchaseOrderId: UUID;
  receiptId?: UUID;
  vendorInvoiceNumber: string;
  invoiceAmount: number;
  poAmount: number;
  receiptAmount?: number;
  variance: number;
  status: "pending" | "matched" | "mismatch" | "approved" | "rejected";
  matchType?: "three_way" | "two_way";
  notes?: string;
  approvedBy?: UUID;
  approvedAt?: ISODate;
}

export interface BudgetAllocation extends BaseEntity {
  name: string;
  department: string;
  project?: string;
  category: string;
  allocatedAmount: number;
  spentAmount: number;
  availableAmount: number;
  currency: string;
  fiscalYear: string;
  period: "monthly" | "quarterly" | "yearly";
  status: "active" | "depleted" | "closed";
}

export interface ProcurementEvent extends BaseEntity {
  type: string;
  source: string;
  entityType?: string;
  entityId?: UUID;
  data: Record<string, unknown>;
  correlationId?: UUID;
}

export interface AuditLog extends BaseEntity {
  actorId: UUID;
  role: Role;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
}

export interface ProcurementState {
  vendors: Vendor[];
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
  receipts: Receipt[];
  approvals: Approval[];
  rfqs: RFQ[];
  quotes: Quote[];
  budgetAllocations: BudgetAllocation[];
  auditLogs: AuditLog[];
  events: ProcurementEvent[];
}

export interface ProcurementOverview {
  vendors: { total: number; active: number };
  purchaseRequests: { total: number; pending: number; approved: number; rejected: number };
  purchaseOrders: { total: number; open: number; closed: number };
  receipts: { total: number; pending: number; complete: number };
  approvals: { pending: number; overdue: number };
  spend: { total: number; thisMonth: number; thisQuarter: number };
  rfqs: { total: number; active: number };
  quotes: { total: number };
}
