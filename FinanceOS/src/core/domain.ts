export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role =
  | "viewer"
  | "finance_clerk"
  | "billing_agent"
  | "accountant"
  | "finance_manager"
  | "tax_manager"
  | "finance_admin"
  | "admin"
  | "owner"
  | "auditor";

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

export type EntityStatus = "active" | "inactive" | "archived";
export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "AED" | string;

export type CounterpartyType = "customer" | "vendor" | "both";
export interface Counterparty extends BaseEntity {
  type: CounterpartyType;
  displayName: string;
  legalName?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  billingAddress?: Address;
  paymentTermsDays: number;
  status: EntityStatus;
  tags: string[];
  metadata: Record<string, unknown>;
  createdBy: UUID;
}

export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";
export interface FinanceAccount extends BaseEntity {
  code: string;
  name: string;
  type: AccountType;
  currency: CurrencyCode;
  parentAccountId?: UUID;
  status: EntityStatus;
  createdBy: UUID;
}

export type TaxType = "gst" | "vat" | "sales_tax" | "service_tax" | "withholding" | "none";
export interface TaxRule extends BaseEntity {
  name: string;
  type: TaxType;
  jurisdiction: string;
  rate: number;
  inclusive: boolean;
  recoverable: boolean;
  status: EntityStatus;
  createdBy: UUID;
}

export type InvoiceStatus = "draft" | "sent" | "partially_paid" | "paid" | "overdue" | "void";
export interface InvoiceLineItem {
  id: UUID;
  description: string;
  quantity: number;
  unitPrice: number;
  accountId?: UUID;
  taxRuleId?: UUID;
  taxRate: number;
  lineSubtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export interface Invoice extends BaseEntity {
  invoiceNumber: string;
  customerId: UUID;
  issueDate: ISODate;
  dueDate: ISODate;
  currency: CurrencyCode;
  status: InvoiceStatus;
  paymentTermsDays: number;
  lineItems: InvoiceLineItem[];
  subtotalAmount: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  refundedAmount: number;
  balanceDue: number;
  notes?: string;
  createdBy: UUID;
  sentAt?: ISODate;
  voidedAt?: ISODate;
}

export type PaymentMethod = "cash" | "card" | "upi" | "bank_transfer" | "wallet" | "cheque" | "gateway" | "other";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "partially_refunded" | "refunded" | "cancelled";
export interface Payment extends BaseEntity {
  paymentNumber: string;
  customerId?: UUID;
  vendorId?: UUID;
  invoiceId?: UUID;
  expenseId?: UUID;
  amount: number;
  refundedAmount: number;
  currency: CurrencyCode;
  method: PaymentMethod;
  status: PaymentStatus;
  processorRef?: string;
  receivedAt: ISODate;
  memo?: string;
  createdBy: UUID;
}

export type RefundStatus = "requested" | "approved" | "processed" | "rejected" | "cancelled";
export interface Refund extends BaseEntity {
  refundNumber: string;
  paymentId: UUID;
  invoiceId?: UUID;
  customerId?: UUID;
  amount: number;
  currency: CurrencyCode;
  reason: string;
  status: RefundStatus;
  processedAt?: ISODate;
  createdBy: UUID;
}

export type ExpenseStatus = "draft" | "submitted" | "approved" | "rejected" | "paid" | "reimbursed" | "void";
export interface Expense extends BaseEntity {
  expenseNumber: string;
  vendorId?: UUID;
  employeeId?: UUID;
  category: string;
  description: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: CurrencyCode;
  status: ExpenseStatus;
  receiptUrl?: string;
  dueDate?: ISODate;
  submittedAt?: ISODate;
  approvedAt?: ISODate;
  approvedBy?: UUID;
  paidAt?: ISODate;
  paymentId?: UUID;
  createdBy: UUID;
}

export type SubscriptionInterval = "monthly" | "quarterly" | "yearly";
export interface SubscriptionPlan extends BaseEntity {
  name: string;
  code: string;
  amount: number;
  currency: CurrencyCode;
  interval: SubscriptionInterval;
  taxRuleId?: UUID;
  status: EntityStatus;
  createdBy: UUID;
}

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "paused" | "cancelled";
export interface Subscription extends BaseEntity {
  customerId: UUID;
  planId: UUID;
  status: SubscriptionStatus;
  startDate: ISODate;
  currentPeriodStart: ISODate;
  currentPeriodEnd: ISODate;
  nextBillingAt: ISODate;
  latestInvoiceId?: UUID;
  cancelledAt?: ISODate;
  createdBy: UUID;
}

export interface Budget extends BaseEntity {
  name: string;
  category: string;
  amount: number;
  currency: CurrencyCode;
  periodStart: ISODate;
  periodEnd: ISODate;
  ownerTeam?: string;
  status: EntityStatus;
  createdBy: UUID;
}

export type LedgerSide = "debit" | "credit";
export interface LedgerEntry extends BaseEntity {
  journalId: UUID;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  side: LedgerSide;
  amount: number;
  currency: CurrencyCode;
  sourceType: "invoice" | "payment" | "refund" | "expense" | "manual";
  sourceId: UUID;
  description: string;
  postedAt: ISODate;
}

export interface FinanceEvent extends BaseEntity {
  type: string;
  source: "FinanceOS";
  actorId: UUID;
  data: Record<string, unknown>;
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

export interface FinanceState {
  counterparties: Counterparty[];
  accounts: FinanceAccount[];
  taxRules: TaxRule[];
  invoices: Invoice[];
  payments: Payment[];
  refunds: Refund[];
  expenses: Expense[];
  subscriptionPlans: SubscriptionPlan[];
  subscriptions: Subscription[];
  budgets: Budget[];
  ledgerEntries: LedgerEntry[];
  events: FinanceEvent[];
  auditLogs: AuditLog[];
}
