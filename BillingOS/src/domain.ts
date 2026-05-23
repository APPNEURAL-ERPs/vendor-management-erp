import { UUID, TenantId, ISODate, newId, nowIso } from "./core/id";

export type ApiRole =
  | "viewer"
  | "billing_viewer"
  | "billing_manager"
  | "billing_admin"
  | "admin"
  | "owner";

export interface RequestActor {
  tenantId: TenantId;
  userId: UUID;
  role: ApiRole;
}

export interface BaseEntity {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type BillingAccountStatus = "active" | "suspended" | "closed" | "trial";
export type SubscriptionStatus =
  | "trial"
  | "active"
  | "past_due"
  | "paused"
  | "cancelled"
  | "expired"
  | "pending_payment"
  | "grace_period";
export type SubscriptionType =
  | "monthly"
  | "quarterly"
  | "yearly"
  | "lifetime"
  | "usage_based"
  | "hybrid"
  | "enterprise";
export type BillingCycle = "monthly" | "quarterly" | "half_yearly" | "yearly" | "custom" | "enterprise";
export type InvoiceStatus = "draft" | "pending" | "paid" | "partially_paid" | "overdue" | "cancelled" | "refunded";
export type InvoiceType = "subscription" | "usage" | "one_time" | "service" | "credit_purchase" | "enterprise" | "renewal" | "upgrade";
export type PaymentStatus = "pending" | "processing" | "paid" | "failed" | "partially_paid" | "refunded" | "cancelled" | "disputed";
export type PaymentMethodType = "upi" | "card" | "netbanking" | "bank_transfer" | "razorpay" | "stripe" | "paypal" | "cashfree" | "manual";
export type RefundStatus = "requested" | "under_review" | "approved" | "rejected" | "processing" | "processed" | "failed" | "cancelled" | "closed";
export type RefundReason =
  | "duplicate_payment"
  | "wrong_plan"
  | "customer_cancellation"
  | "service_issue"
  | "billing_error"
  | "fraudulent"
  | "manual_adjustment";
export type UsageUnit = "tokens" | "tool_runs" | "api_calls" | "storage_gb" | "emails" | "sms" | "reports" | "credits" | "custom";
export type CouponType = "percentage" | "fixed" | "trial_extension" | "free_credits";
export type DunningStatus = "pending" | "in_progress" | "recovered" | "failed" | "account_restricted" | "suspended";
export type Currency = "INR" | "USD" | "EUR" | "GBP" | "AED" | "AUD" | "CAD" | "SGD";

export interface BillingAccount extends BaseEntity {
  tenantId: UUID;
  customerId: string;
  customerName: string;
  email: string;
  phone?: string;
  companyName?: string;
  billingAddress?: BillingAddress;
  gstin?: string;
  pan?: string;
  currency: Currency;
  status: BillingAccountStatus;
  defaultPaymentMethodId?: UUID;
  taxExempt: boolean;
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface PricingPlan extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  product: string;
  status: "active" | "inactive" | "archived";
  type: "free" | "starter" | "professional" | "business" | "enterprise" | "custom" | "internal";
  billingCycle: BillingCycle;
  price: number;
  currency: Currency;
  trialDays: number;
  features: PlanFeature[];
  limits: PlanLimit[];
  modules: string[];
  isPublic: boolean;
  metadata: Record<string, unknown>;
}

export interface PlanFeature {
  key: string;
  name: string;
  description?: string;
  included: boolean;
  limit?: number;
  overage?: number;
}

export interface PlanLimit {
  key: string;
  name: string;
  value: number;
  unit: string;
  overageCost?: number;
}

export interface Subscription extends BaseEntity {
  tenantId: UUID;
  billingAccountId: UUID;
  planId: UUID;
  status: SubscriptionStatus;
  type: SubscriptionType;
  billingCycle: BillingCycle;
  currentPeriodStart: ISODate;
  currentPeriodEnd: ISODate;
  trialEnd?: ISODate;
  cancelledAt?: ISODate;
  pausedAt?: ISODate;
  autoRenew: boolean;
  seatCount: number;
  modules: string[];
  addons: SubscriptionAddon[];
  metadata: Record<string, unknown>;
}

export interface SubscriptionAddon {
  addonId: string;
  name: string;
  price: number;
  quantity: number;
  billingCycle: BillingCycle;
}

export interface Trial extends BaseEntity {
  subscriptionId: UUID;
  billingAccountId: UUID;
  planId: UUID;
  status: "active" | "converted" | "expired" | "cancelled";
  startedAt: ISODate;
  endsAt: ISODate;
  extendedCount: number;
  usage: TrialUsage;
  events: TrialEvent[];
}

export interface TrialUsage {
  tokensUsed: number;
  toolRuns: number;
  apiCalls: number;
  storageMb: number;
}

export interface TrialEvent {
  type: string;
  timestamp: ISODate;
  data: Record<string, unknown>;
}

export interface UsageRecord extends BaseEntity {
  tenantId: UUID;
  subscriptionId?: UUID;
  billingAccountId: UUID;
  eventType: string;
  unit: UsageUnit;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  timestamp: ISODate;
  metadata: Record<string, unknown>;
}

export interface CreditWallet extends BaseEntity {
  tenantId: UUID;
  billingAccountId: UUID;
  type: "ai_credits" | "tool_credits" | "api_credits" | "general_credits";
  balance: number;
  totalPurchased: number;
  totalUsed: number;
  expiresAt?: ISODate;
  autoRecharge: boolean;
  autoRechargeAmount?: number;
  lowBalanceThreshold: number;
  metadata: Record<string, unknown>;
}

export interface CreditTransaction extends BaseEntity {
  walletId: UUID;
  billingAccountId: UUID;
  type: "purchase" | "deduction" | "refund" | "adjustment" | "expiry" | "bonus";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId?: string;
  referenceType?: string;
  description: string;
}

export interface Invoice extends BaseEntity {
  billingAccountId: UUID;
  subscriptionId?: UUID;
  invoiceNumber: string;
  status: InvoiceStatus;
  type: InvoiceType;
  currency: Currency;
  issueDate: ISODate;
  dueDate: ISODate;
  periodStart?: ISODate;
  periodEnd?: ISODate;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  items: InvoiceItem[];
  paymentLink?: string;
  paidAt?: ISODate;
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  taxRate?: number;
  taxAmount?: number;
  discountAmount?: number;
  referenceType?: string;
  referenceId?: string;
  metadata: Record<string, unknown>;
}

export interface Payment extends BaseEntity {
  invoiceId?: UUID;
  billingAccountId: UUID;
  paymentMethodId?: UUID;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  gateway: string;
  gatewayTransactionId?: string;
  gatewayResponse?: Record<string, unknown>;
  paymentDate: ISODate;
  failureReason?: string;
  refundId?: UUID;
  metadata: Record<string, unknown>;
}

export interface PaymentMethod extends BaseEntity {
  billingAccountId: UUID;
  type: PaymentMethodType;
  provider: string;
  isDefault: boolean;
  isVerified: boolean;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  maskedValue: string;
  metadata: Record<string, unknown>;
}

export interface Refund extends BaseEntity {
  paymentId: UUID;
  invoiceId?: UUID;
  billingAccountId: UUID;
  amount: number;
  currency: Currency;
  status: RefundStatus;
  reason: RefundReason;
  description?: string;
  approvedBy?: UUID;
  approvedAt?: ISODate;
  processedAt?: ISODate;
  failureReason?: string;
  metadata: Record<string, unknown>;
}

export interface Coupon extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  maxUses?: number;
  usedCount: number;
  maxUsesPerUser?: number;
  validFrom: ISODate;
  validUntil?: ISODate;
  applicablePlans: string[];
  applicableModules: string[];
  minOrderAmount?: number;
  status: "active" | "inactive" | "expired";
  metadata: Record<string, unknown>;
}

export interface TaxRule extends BaseEntity {
  name: string;
  rate: number;
  type: "percentage" | "fixed";
  country: string;
  state?: string;
  hsnCode?: string;
  sacCode?: string;
  applicableTo: string[];
  isActive: boolean;
  priority: number;
}

export interface DunningAttempt extends BaseEntity {
  subscriptionId: UUID;
  billingAccountId: UUID;
  attemptNumber: number;
  status: DunningStatus;
  paymentFailedAt: ISODate;
  nextRetryAt: ISODate;
  attempts: DunningAttemptRecord[];
  restrictedAt?: ISODate;
  suspendedAt?: ISODate;
  recoveredAt?: ISODate;
}

export interface DunningAttemptRecord {
  attemptNumber: number;
  attemptedAt: ISODate;
  action: string;
  success: boolean;
  response?: string;
}

export interface RevenueRecord extends BaseEntity {
  billingAccountId: UUID;
  subscriptionId?: UUID;
  invoiceId?: UUID;
  type: "subscription" | "usage" | "one_time" | "refund" | "adjustment";
  amount: number;
  currency: Currency;
  recognizedAmount: number;
  deferredAmount: number;
  periodStart?: ISODate;
  periodEnd?: ISODate;
  isRecognized: boolean;
  recognizedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface ReconciliationRecord extends BaseEntity {
  invoiceId: UUID;
  paymentId?: UUID;
  status: "matched" | "unmatched" | "disputed";
  amount: number;
  currency: Currency;
  paymentDate?: ISODate;
  invoiceDate: ISODate;
  notes?: string;
  resolvedAt?: ISODate;
  resolvedBy?: UUID;
}

export interface BillingEvent extends BaseEntity {
  type: string;
  source: string;
  data: Record<string, unknown>;
  correlationId?: UUID;
}

export interface AuditLog extends BaseEntity {
  actorId: UUID;
  role: ApiRole;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
}

export interface BillingOverview {
  accounts: { total: number; active: number; trial: number; suspended: number };
  subscriptions: { total: number; active: number; trial: number; pastDue: number; cancelled: number };
  invoices: { total: number; pending: number; paid: number; overdue: number };
  payments: { total: number; successful: number; failed: number; pending: number };
  revenue: { mrr: number; arr: number; mtd: number; ytd: number };
  usage: { total: number; billable: number };
  credits: { total: number; issued: number; used: number };
  refunds: { total: number; requested: number; processed: number };
}

export interface BillingState {
  billingAccounts: BillingAccount[];
  pricingPlans: PricingPlan[];
  subscriptions: Subscription[];
  trials: Trial[];
  usageRecords: UsageRecord[];
  creditWallets: CreditWallet[];
  creditTransactions: CreditTransaction[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  payments: Payment[];
  paymentMethods: PaymentMethod[];
  refunds: Refund[];
  coupons: Coupon[];
  taxRules: TaxRule[];
  dunningAttempts: DunningAttempt[];
  revenueRecords: RevenueRecord[];
  reconciliationRecords: ReconciliationRecord[];
  auditLogs: AuditLog[];
  events: BillingEvent[];
}
