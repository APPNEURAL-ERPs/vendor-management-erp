export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "finance_manager" | "accountant" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";

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

export type InvoiceStatus = "draft" | "sent" | "viewed" | "partial" | "paid" | "overdue" | "cancelled";
export type InvoiceType = "service" | "product" | "gst" | "recurring" | "subscription" | "milestone" | "advance" | "final" | "proforma";
export type QuotationStatus = "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired" | "converted";

export interface InvoiceItem extends BaseEntity {
  invoiceId: UUID;
  description: string;
  quantity: number;
  rate: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  metadata: Record<string, unknown>;
}

export interface Invoice extends BaseEntity {
  invoiceNumber: string;
  type: InvoiceType;
  status: InvoiceStatus;
  clientId?: UUID;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  clientGstin?: string;
  issueDate: ISODate;
  dueDate: ISODate;
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  currency: string;
  notes?: string;
  terms?: string;
  paidAmount: number;
  paidAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface QuotationItem extends BaseEntity {
  quotationId: UUID;
  description: string;
  quantity: number;
  rate: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  metadata: Record<string, unknown>;
}

export interface Quotation extends BaseEntity {
  quotationNumber: string;
  status: QuotationStatus;
  clientId?: UUID;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  validUntil: ISODate;
  items: QuotationItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  currency: string;
  notes?: string;
  terms?: string;
  convertedToInvoiceId?: UUID;
  metadata: Record<string, unknown>;
}

export type PaymentStatus = "pending" | "partial" | "completed" | "failed" | "refunded" | "cancelled" | "disputed";
export type PaymentMethod = "bank_transfer" | "upi" | "card" | "razorpay" | "stripe" | "paypal" | "cash" | "cheque" | "wallet";

export interface Payment extends BaseEntity {
  paymentNumber: string;
  invoiceId?: UUID;
  quotationId?: UUID;
  clientId?: UUID;
  clientName: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;
  reference?: string;
  paidAt: ISODate;
  metadata: Record<string, unknown>;
}

export interface Receipt extends BaseEntity {
  receiptNumber: string;
  paymentId?: UUID;
  invoiceId?: UUID;
  clientId?: UUID;
  clientName: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  issuedAt: ISODate;
  notes?: string;
  metadata: Record<string, unknown>;
}

export type ExpenseStatus = "draft" | "pending" | "approved" | "rejected" | "reimbursed" | "cancelled";
export type ExpenseCategory = "software" | "cloud" | "salaries" | "marketing" | "travel" | "office" | "freelancer" | "training" | "equipment" | "utilities" | "legal" | "other";

export interface Expense extends BaseEntity {
  expenseNumber: string;
  category: ExpenseCategory;
  status: ExpenseStatus;
  vendorId?: UUID;
  vendorName: string;
  description: string;
  amount: number;
  currency: string;
  expenseDate: ISODate;
  receiptUrl?: string;
  billNumber?: string;
  projectId?: UUID;
  approvedBy?: UUID;
  reimbursedAmount: number;
  reimbursedAt?: ISODate;
  notes?: string;
  metadata: Record<string, unknown>;
}

export type BudgetStatus = "draft" | "active" | "archived";
export type BudgetPeriod = "monthly" | "quarterly" | "yearly";

export interface BudgetCategory extends BaseEntity {
  budgetId: UUID;
  category: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
}

export interface Budget extends BaseEntity {
  budgetNumber: string;
  name: string;
  status: BudgetStatus;
  period: BudgetPeriod;
  startDate: ISODate;
  endDate: ISODate;
  totalAmount: number;
  totalSpent: number;
  totalRemaining: number;
  categories: BudgetCategory[];
  notes?: string;
  metadata: Record<string, unknown>;
}

export type VendorPaymentStatus = "pending" | "approved" | "scheduled" | "paid" | "overdue" | "disputed" | "cancelled";

export interface VendorPayment extends BaseEntity {
  paymentNumber: string;
  vendorId?: UUID;
  vendorName: string;
  description: string;
  amount: number;
  currency: string;
  status: VendorPaymentStatus;
  dueDate: ISODate;
  paidAt?: ISODate;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  approvedBy?: UUID;
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface CashFlowEntry extends BaseEntity {
  type: "inflow" | "outflow";
  category: string;
  description: string;
  amount: number;
  currency: string;
  entryDate: ISODate;
  expectedDate?: ISODate;
  actualDate?: ISODate;
  status: "expected" | "confirmed" | "cancelled";
  referenceType?: string;
  referenceId?: UUID;
  metadata: Record<string, unknown>;
}

export interface RevenueStream extends BaseEntity {
  name: string;
  category: string;
  type: "recurring" | "one_time" | "subscription";
  amount: number;
  currency: string;
  frequency: "monthly" | "quarterly" | "yearly";
  startDate: ISODate;
  endDate?: ISODate;
  status: "active" | "inactive" | "churned";
  clientId?: UUID;
  clientName?: string;
  metadata: Record<string, unknown>;
}

export interface Forecast extends BaseEntity {
  name: string;
  type: "revenue" | "expense" | "cash_flow" | "profit";
  scenario: "base" | "best" | "worst";
  period: "monthly" | "quarterly" | "yearly";
  startDate: ISODate;
  endDate: ISODate;
  entries: Array<{
    month: string;
    amount: number;
    confidence: number;
  }>;
  assumptions: string;
  status: "draft" | "active" | "archived";
  metadata: Record<string, unknown>;
}

export type RefundStatus = "requested" | "under_review" | "approved" | "rejected" | "processed" | "failed" | "cancelled";

export interface Refund extends BaseEntity {
  refundNumber: string;
  invoiceId?: UUID;
  paymentId?: UUID;
  clientId?: UUID;
  clientName: string;
  originalAmount: number;
  refundAmount: number;
  currency: string;
  status: RefundStatus;
  reason: string;
  requestedAt: ISODate;
  processedAt?: ISODate;
  approvedBy?: UUID;
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface FinancialReport extends BaseEntity {
  name: string;
  type: "revenue" | "expense" | "profit_loss" | "cash_flow" | "receivable" | "payable" | "tax_summary";
  period: "monthly" | "quarterly" | "yearly" | "custom";
  startDate: ISODate;
  endDate: ISODate;
  generatedAt: ISODate;
  summary: Record<string, unknown>;
  details: Record<string, unknown>;
  currency: string;
  status: "draft" | "published";
  metadata: Record<string, unknown>;
}

export interface AccountReceivable extends BaseEntity {
  invoiceId: UUID;
  clientId?: UUID;
  clientName: string;
  amount: number;
  paidAmount: number;
  outstandingAmount: number;
  dueDate: ISODate;
  daysOverdue: number;
  status: "pending" | "partial" | "overdue" | "paid";
  agingBucket: "0-7" | "8-15" | "16-30" | "31-60" | "60+";
  lastReminderAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface AccountPayable extends BaseEntity {
  vendorPaymentId: UUID;
  vendorId?: UUID;
  vendorName: string;
  amount: number;
  paidAmount: number;
  outstandingAmount: number;
  dueDate: ISODate;
  daysOverdue: number;
  status: "pending" | "partial" | "overdue" | "paid";
  agingBucket: "0-7" | "8-15" | "16-30" | "31-60" | "60+";
  metadata: Record<string, unknown>;
}

export type TaxType = "gst" | "tds" | "tcs";

export interface TaxRecord extends BaseEntity {
  type: TaxType;
  period: string;
  amount: number;
  rate: number;
  taxableAmount: number;
  inputTaxCredit: number;
  netTax: number;
  status: "pending" | "filed" | "paid" | "overdue";
  dueDate: ISODate;
  filedAt?: ISODate;
  paidAt?: ISODate;
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface PayrollDocument extends BaseEntity {
  documentType: "salary_slip" | "contractor_invoice" | "reimbursement" | "bonus" | "advance";
  employeeId?: UUID;
  employeeName: string;
  amount: number;
  currency: string;
  period: string;
  issuedAt: ISODate;
  status: "draft" | "issued" | "paid" | "cancelled";
  approvedBy?: UUID;
  metadata: Record<string, unknown>;
}

export interface FinancialHealthScore extends BaseEntity {
  score: number;
  revenueStability: number;
  profitability: number;
  cashFlow: number;
  receivableRisk: number;
  expenseControl: number;
  debtRisk: number;
  growth: number;
  factors: Array<{
    name: string;
    value: number;
    weight: number;
    description: string;
  }>;
  recommendations: string[];
  calculatedAt: ISODate;
  metadata: Record<string, unknown>;
}

export interface FinanceAuditLog extends BaseEntity {
  actorId: UUID;
  role: Role;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
}

export interface FinanceState {
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  quotations: Quotation[];
  quotationItems: QuotationItem[];
  payments: Payment[];
  receipts: Receipt[];
  expenses: Expense[];
  budgets: Budget[];
  budgetCategories: BudgetCategory[];
  vendorPayments: VendorPayment[];
  cashFlowEntries: CashFlowEntry[];
  revenueStreams: RevenueStream[];
  forecasts: Forecast[];
  refunds: Refund[];
  financialReports: FinancialReport[];
  accountReceivables: AccountReceivable[];
  accountPayables: AccountPayable[];
  taxRecords: TaxRecord[];
  payrollDocuments: PayrollDocument[];
  financialHealthScores: FinancialHealthScore[];
  auditLogs: FinanceAuditLog[];
}

export interface FinanceOverview {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cashBalance: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalReceivables: number;
  totalPayables: number;
  monthlyRecurringRevenue: number;
  taxLiability: number;
  profitMargin: number;
}
