export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "client_manager" | "account_manager" | "project_manager" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";

export type ClientStatus = 
  | "lead" 
  | "qualified" 
  | "proposal_sent" 
  | "negotiation" 
  | "active" 
  | "on_hold" 
  | "completed" 
  | "renewal_due" 
  | "inactive" 
  | "lost" 
  | "archived";

export type MeetingStatus = "scheduled" | "completed" | "cancelled" | "rescheduled";
export type MeetingType = "discovery" | "kickoff" | "requirement_discussion" | "design_review" | "sprint_review" | "status" | "uat" | "delivery" | "renewal";
export type SupportTicketStatus = "open" | "assigned" | "in_progress" | "waiting_client" | "resolved" | "reopened" | "closed" | "escalated";
export type PaymentStatus = "pending" | "partial" | "paid" | "overdue" | "disputed" | "refunded" | "cancelled";
export type TaskStatus = "backlog" | "planned" | "in_progress" | "waiting_client" | "in_review" | "approved" | "blocked" | "done";

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

export interface ClientContact extends BaseEntity {
  clientId: UUID;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isPrimary: boolean;
  status: "active" | "inactive";
}

export interface ClientCompany extends BaseEntity {
  clientId: UUID;
  name: string;
  industry?: string;
  size?: string;
  website?: string;
  address?: string;
}

export interface Client extends BaseEntity {
  name: string;
  status: ClientStatus;
  ownerId?: UUID;
  companyId?: UUID;
  segment?: string;
  priority?: "low" | "medium" | "high" | "critical";
  tags: string[];
  notes?: string;
  source?: string;
  healthScore?: number;
  lifetimeValue?: number;
  renewalDate?: ISODate;
  nextAction?: string;
  nextActionDate?: ISODate;
}

export interface Account extends BaseEntity {
  clientId: UUID;
  name: string;
  type: "individual" | "business" | "enterprise";
  status: EntityStatus;
  billingEmail?: string;
  paymentTerms?: string;
  creditLimit?: number;
  balance?: number;
  taxId?: string;
  metadata: Record<string, unknown>;
}

export interface Requirement extends BaseEntity {
  clientId: UUID;
  projectId?: UUID;
  title: string;
  description: string;
  category: "business_goal" | "feature" | "technical" | "design" | "integration" | "compliance" | "other";
  priority: "low" | "medium" | "high" | "critical";
  status: "draft" | "submitted" | "reviewed" | "approved" | "rejected" | "implemented";
  source?: string;
  dependencies?: UUID[];
  approvedBy?: UUID;
  approvedAt?: ISODate;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface Proposal extends BaseEntity {
  clientId: UUID;
  title: string;
  description?: string;
  status: "draft" | "sent" | "negotiation" | "approved" | "rejected" | "expired";
  version: number;
  scope: string;
  deliverables: string[];
  timeline: string;
  pricing: number;
  currency?: string;
  validUntil?: ISODate;
  approvedBy?: UUID;
  approvedAt?: ISODate;
  sentAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface Contract extends BaseEntity {
  clientId: UUID;
  proposalId?: UUID;
  title: string;
  type: "service" | "project" | "retainer" | "maintenance" | "nda" | "partnership" | "training" | "consulting";
  status: "draft" | "sent" | "signed" | "active" | "expired" | "terminated" | "renewed";
  value?: number;
  currency?: string;
  startDate?: ISODate;
  endDate?: ISODate;
  signedDate?: ISODate;
  autoRenew?: boolean;
  terms?: string;
  metadata: Record<string, unknown>;
}

export interface Project extends BaseEntity {
  clientId: UUID;
  accountId?: UUID;
  name: string;
  description?: string;
  status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  startDate?: ISODate;
  targetDate?: ISODate;
  completedDate?: ISODate;
  budget?: number;
  spent?: number;
  currency?: string;
  ownerId?: UUID;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface Deliverable extends BaseEntity {
  projectId: UUID;
  clientId: UUID;
  title: string;
  description?: string;
  status: "planned" | "in_progress" | "in_review" | "approved" | "delivered" | "rejected";
  dueDate?: ISODate;
  deliveredDate?: ISODate;
  approvedBy?: UUID;
  approvedAt?: ISODate;
  version?: number;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface Task extends BaseEntity {
  projectId?: UUID;
  clientId?: UUID;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high" | "critical";
  assigneeId?: UUID;
  dueDate?: ISODate;
  completedAt?: ISODate;
  estimatedHours?: number;
  actualHours?: number;
  parentTaskId?: UUID;
  dependencies?: UUID[];
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface Meeting extends BaseEntity {
  clientId: UUID;
  projectId?: UUID;
  title: string;
  description?: string;
  type: MeetingType;
  status: MeetingStatus;
  scheduledAt: ISODate;
  duration?: number;
  location?: string;
  meetingLink?: string;
  attendeeIds: UUID[];
  attendeeNames: string[];
  notes?: string;
  summary?: string;
  actionItems?: string[];
  followUpMeetingId?: UUID;
  recordingUrl?: string;
  metadata: Record<string, unknown>;
}

export interface Note extends BaseEntity {
  clientId?: UUID;
  projectId?: UUID;
  meetingId?: UUID;
  title: string;
  content: string;
  authorId: UUID;
  authorName: string;
  visibility: "private" | "team" | "client";
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface Document extends BaseEntity {
  clientId?: UUID;
  projectId?: UUID;
  title: string;
  type: "proposal" | "contract" | "nda" | "sow" | "invoice" | "receipt" | "requirement" | "design" | "meeting_notes" | "report" | "certificate" | "other";
  status: "draft" | "sent" | "signed" | "active" | "archived";
  url?: string;
  size?: number;
  mimeType?: string;
  version?: number;
  uploadedBy?: UUID;
  approvedBy?: UUID;
  approvedAt?: ISODate;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface Approval extends BaseEntity {
  clientId?: UUID;
  projectId?: UUID;
  deliverableId?: UUID;
  documentId?: UUID;
  type: "proposal" | "scope" | "design" | "document" | "uat" | "content" | "delivery" | "other";
  title: string;
  description?: string;
  status: "pending" | "approved" | "rejected" | "revision_requested";
  requestedBy: UUID;
  requestedAt: ISODate;
  decidedBy?: UUID;
  decidedAt?: ISODate;
  comments?: string;
  metadata: Record<string, unknown>;
}

export interface SupportTicket extends BaseEntity {
  clientId: UUID;
  projectId?: UUID;
  title: string;
  description: string;
  type: "bug" | "feature" | "support" | "question" | "feedback" | "other";
  priority: "low" | "medium" | "high" | "critical";
  status: SupportTicketStatus;
  assigneeId?: UUID;
  assigneeName?: string;
  resolvedAt?: ISODate;
  resolution?: string;
  satisfaction?: number;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface Invoice extends BaseEntity {
  clientId: UUID;
  projectId?: UUID;
  accountId?: UUID;
  number: string;
  title: string;
  amount: number;
  tax?: number;
  total: number;
  currency?: string;
  status: PaymentStatus;
  issueDate: ISODate;
  dueDate: ISODate;
  paidDate?: ISODate;
  paidAmount?: number;
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface HealthScore extends BaseEntity {
  clientId: UUID;
  overallScore: number;
  engagementScore: number;
  paymentScore: number;
  communicationScore: number;
  satisfactionScore: number;
  deliveryScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  factors: Array<{ factor: string; impact: "positive" | "negative" | "neutral"; weight: number; note?: string }>;
  risks: string[];
  recommendations: string[];
  nextReviewDate: ISODate;
  metadata: Record<string, unknown>;
}

export interface SuccessPlan extends BaseEntity {
  clientId: UUID;
  title: string;
  description?: string;
  status: "draft" | "active" | "completed" | "archived";
  goals: Array<{ id: UUID; title: string; description: string; targetDate: ISODate; status: "not_started" | "in_progress" | "completed" | "at_risk"; progress: number; metrics?: string }>;
  milestones: Array<{ id: UUID; title: string; targetDate: ISODate; status: "pending" | "completed" | "missed"; completedAt?: ISODate }>;
  checkIns: Array<{ id: UUID; date: ISODate; notes: string; outcomes: string }>;
  ownerId?: UUID;
  metadata: Record<string, unknown>;
}

export interface Risk extends BaseEntity {
  clientId: UUID;
  projectId?: UUID;
  title: string;
  description: string;
  category: "scope" | "payment" | "communication" | "timeline" | "dependency" | "satisfaction" | "churn" | "other";
  severity: "low" | "medium" | "high" | "critical";
  status: "identified" | "mitigating" | "resolved" | "accepted";
  ownerId?: UUID;
  mitigationPlan?: string;
  identifiedAt: ISODate;
  resolvedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface ClientEvent extends BaseEntity {
  type: string;
  source: string;
  clientId?: UUID;
  projectId?: UUID;
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

export interface ClientOverview {
  clients: { total: number; byStatus: Record<string, number> };
  accounts: { total: number; active: number };
  projects: { total: number; active: number; completed: number };
  meetings: { scheduled: number; completed: number };
  deliverables: { pending: number; inReview: number; approved: number; delivered: number };
  proposals: { draft: number; sent: number; approved: number; rejected: number };
  contracts: { active: number; expiring: number; expired: number };
  support: { open: number; resolved: number };
  invoices: { pending: number; paid: number; overdue: number };
  healthScores: { average: number; atRisk: number };
}

export interface ClientState {
  clients: Client[];
  contacts: ClientContact[];
  companies: ClientCompany[];
  accounts: Account[];
  requirements: Requirement[];
  proposals: Proposal[];
  contracts: Contract[];
  projects: Project[];
  deliverables: Deliverable[];
  tasks: Task[];
  meetings: Meeting[];
  notes: Note[];
  documents: Document[];
  approvals: Approval[];
  supportTickets: SupportTicket[];
  invoices: Invoice[];
  healthScores: HealthScore[];
  successPlans: SuccessPlan[];
  risks: Risk[];
  events: ClientEvent[];
  auditLogs: AuditLog[];
}
