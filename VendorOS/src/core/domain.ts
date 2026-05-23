export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type VendorStatus = "draft" | "submitted" | "under_review" | "approved" | "rejected" | "active" | "suspended" | "archived";
export type VendorType = "supplier" | "service_provider" | "contractor" | "consultant" | "agency" | "saas_provider" | "cloud_provider" | "payment_provider" | "training_partner" | "recruitment_partner" | "hardware_supplier";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type OnboardingStatus = "draft" | "submitted" | "under_review" | "documents_pending" | "risk_review" | "approved" | "rejected" | "active" | "suspended" | "archived";
export type ContractStatus = "draft" | "pending_signature" | "active" | "expired" | "terminated" | "renewed";
export type InvoiceStatus = "received" | "under_review" | "approved" | "rejected" | "disputed" | "scheduled" | "paid" | "cancelled";
export type PaymentStatus = "pending" | "approved" | "scheduled" | "processing" | "paid" | "failed" | "on_hold" | "disputed" | "cancelled";
export type IssueStatus = "open" | "assigned" | "in_progress" | "waiting_vendor" | "escalated" | "resolved" | "closed" | "reopened";
export type DocumentStatus = "required" | "submitted" | "verified" | "rejected" | "expired" | "expiring_soon" | "not_required";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "trial" | "pending_renewal";

export interface RequestActor {
  tenantId: TenantId;
  userId: UUID;
  role: string;
}

export interface BaseEntity {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface VendorContact {
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  isPrimary: boolean;
}

export interface VendorAddress {
  type: "billing" | "shipping" | "registered";
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface VendorBankDetail {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  ifscCode?: string;
  swiftCode?: string;
  isVerified: boolean;
  verifiedAt?: ISODate;
  verifiedBy?: UUID;
}

export interface VendorTaxDetail {
  taxId: string;
  taxIdType: "gstin" | "pan" | "tin" | "vat" | "ein";
  isVerified: boolean;
  verifiedAt?: ISODate;
}

export interface Vendor extends BaseEntity {
  key: string;
  name: string;
  legalName?: string;
  type: VendorType;
  categoryId?: UUID;
  status: VendorStatus;
  riskLevel: RiskLevel;
  contacts: VendorContact[];
  addresses: VendorAddress[];
  taxDetail?: VendorTaxDetail;
  bankDetail?: VendorBankDetail;
  services: string[];
  description?: string;
  website?: string;
  owner?: string;
  tier?: "tier1_strategic" | "tier2_preferred" | "tier3_approved" | "tier4_trial" | "blocked";
  tags: string[];
  metadata: Record<string, unknown>;
  createdBy: UUID;
  approvedBy?: UUID;
  approvedAt?: ISODate;
  rejectedBy?: UUID;
  rejectedAt?: ISODate;
  rejectionReason?: string;
  suspendedBy?: UUID;
  suspendedAt?: ISODate;
  suspensionReason?: string;
  totalSpend: number;
  performanceScore?: number;
  lastPerformanceReview?: ISODate;
  nextReviewDate?: ISODate;
}

export interface VendorCategory extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  parentId?: UUID;
  vendorCount: number;
  isActive: boolean;
}

export interface VendorContract extends BaseEntity {
  vendorId: UUID;
  key: string;
  name: string;
  type: "vendor_agreement" | "supplier_agreement" | "service_agreement" | "nda" | "retainer" | "sow" | "consulting" | "license" | "maintenance";
  status: ContractStatus;
  startDate: ISODate;
  endDate: ISODate;
  value?: number;
  currency?: string;
  paymentTerms?: string;
  description?: string;
  documents: string[];
  renewalTerms?: string;
  autoRenew: boolean;
  noticePeriodDays?: number;
  signedBy?: UUID;
  signedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface VendorDocument extends BaseEntity {
  vendorId: UUID;
  key: string;
  name: string;
  type: "gst_certificate" | "pan_card" | "business_registration" | "bank_cancelled_cheque" | "msme_certificate" | "insurance_certificate" | "nda" | "vendor_agreement" | "security_questionnaire" | "compliance_certificate" | "address_proof" | "other";
  status: DocumentStatus;
  uri?: string;
  expiryDate?: ISODate;
  verifiedAt?: ISODate;
  verifiedBy?: UUID;
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface VendorOnboarding extends BaseEntity {
  vendorId?: UUID;
  key: string;
  status: OnboardingStatus;
  steps: OnboardingStep[];
  currentStep: number;
  submittedAt?: ISODate;
  reviewedBy?: UUID;
  reviewedAt?: ISODate;
  approvalNotes?: string;
  rejectedBy?: UUID;
  rejectedAt?: ISODate;
  rejectionReason?: string;
  ownerId: UUID;
  metadata: Record<string, unknown>;
}

export interface OnboardingStep {
  id: string;
  name: string;
  status: "pending" | "in_progress" | "completed" | "skipped" | "failed";
  completedAt?: ISODate;
  completedBy?: UUID;
  notes?: string;
}

export interface VendorPerformance extends BaseEntity {
  vendorId: UUID;
  period: string;
  deliveryScore: number;
  qualityScore: number;
  costScore: number;
  supportScore: number;
  overallScore: number;
  onTimeDeliveryRate: number;
  qualityIssueRate: number;
  slaComplianceRate: number;
  invoiceAccuracyRate: number;
  responseTimeHours?: number;
  reviewDate: ISODate;
  reviewedBy?: UUID;
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface VendorRisk extends BaseEntity {
  vendorId: UUID;
  category: "financial" | "security" | "compliance" | "delivery" | "dependency";
  level: RiskLevel;
  title: string;
  description?: string;
  status: "open" | "mitigated" | "accepted" | "escalated";
  mitigationPlan?: string;
  resolvedAt?: ISODate;
  resolvedBy?: UUID;
  ownerId?: UUID;
  dueDate?: ISODate;
  metadata: Record<string, unknown>;
}

export interface VendorInvoice extends BaseEntity {
  vendorId: UUID;
  invoiceNumber: string;
  poNumber?: string;
  amount: number;
  currency: string;
  taxAmount?: number;
  totalAmount: number;
  status: InvoiceStatus;
  issueDate: ISODate;
  dueDate: ISODate;
  paidDate?: ISODate;
  description?: string;
  lineItems: InvoiceLineItem[];
  approvedBy?: UUID;
  approvedAt?: ISODate;
  rejectedBy?: UUID;
  rejectedAt?: ISODate;
  rejectionReason?: string;
  disputeReason?: string;
  metadata: Record<string, unknown>;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  tax?: number;
  total: number;
}

export interface VendorPayment extends BaseEntity {
  vendorId: UUID;
  invoiceId?: UUID;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: string;
  paymentDate?: ISODate;
  scheduledDate?: ISODate;
  referenceNumber?: string;
  approvedBy?: UUID;
  approvedAt?: ISODate;
  failedAt?: ISODate;
  failureReason?: string;
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface VendorIssue extends BaseEntity {
  vendorId: UUID;
  key: string;
  type: "delivery" | "quality" | "invoice" | "payment" | "contract" | "sla" | "security" | "compliance" | "other";
  status: IssueStatus;
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description?: string;
  assignedTo?: UUID;
  escalatedTo?: UUID;
  resolvedAt?: ISODate;
  resolvedBy?: UUID;
  resolution?: string;
  slaDeadline?: ISODate;
  metadata: Record<string, unknown>;
}

export interface VendorSubscription extends BaseEntity {
  vendorId: UUID;
  name: string;
  plan?: string;
  status: SubscriptionStatus;
  startDate: ISODate;
  endDate?: ISODate;
  billingCycle: "monthly" | "quarterly" | "yearly" | "one_time";
  amount: number;
  currency: string;
  autoRenew: boolean;
  usageData?: Record<string, unknown>;
  nextBillingDate?: ISODate;
  metadata: Record<string, unknown>;
}

export interface VendorEvent extends BaseEntity {
  type: string;
  source: string;
  vendorId?: UUID;
  data: Record<string, unknown>;
  correlationId?: UUID;
}

export interface AuditLog extends BaseEntity {
  actorId: UUID;
  role: string;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
}

export interface VendorOverview {
  total: number;
  active: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
  highRisk: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  totalSpend: number;
  monthlySpend: number;
  openIssues: number;
  expiringContracts: number;
  expiringDocuments: number;
}

export interface VendorState {
  vendors: Vendor[];
  categories: VendorCategory[];
  contracts: VendorContract[];
  documents: VendorDocument[];
  onboardingRecords: VendorOnboarding[];
  performanceRecords: VendorPerformance[];
  riskRecords: VendorRisk[];
  invoices: VendorInvoice[];
  payments: VendorPayment[];
  issues: VendorIssue[];
  subscriptions: VendorSubscription[];
  events: VendorEvent[];
  auditLogs: AuditLog[];
}
