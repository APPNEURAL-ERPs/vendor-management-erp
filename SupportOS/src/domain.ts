export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "support_admin" | "support_agent" | "support_lead" | "viewer";
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

export type TicketStatus = "new" | "open" | "assigned" | "in_progress" | "waiting_customer" | "waiting_internal" | "escalated" | "resolved" | "closed" | "reopened" | "cancelled";
export type TicketPriority = "low" | "medium" | "high" | "urgent" | "critical";
export type TicketCategory = "bug" | "feature_request" | "billing" | "login" | "access" | "howto" | "technical" | "data" | "payment" | "integration" | "account" | "complaint" | "other";
export type SupportChannel = "email" | "website" | "chat" | "whatsapp" | "phone" | "social" | "in_app" | "community" | "api";

export interface Ticket extends BaseEntity {
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  channel: SupportChannel;
  customerId?: UUID;
  customerName?: string;
  customerEmail?: string;
  assignedAgentId?: UUID;
  assignedTeam?: string;
  tags: string[];
  slaId?: UUID;
  firstResponseAt?: ISODate;
  resolvedAt?: ISODate;
  closedAt?: ISODate;
  responseCount: number;
  reopenCount: number;
  metadata: Record<string, unknown>;
}

export interface TicketComment extends BaseEntity {
  ticketId: UUID;
  authorId: UUID;
  authorName: string;
  content: string;
  isInternal: boolean;
  attachments: string[];
}

export interface TicketAttachment extends BaseEntity {
  ticketId: UUID;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadedBy: UUID;
}

export type SlaStatus = "active" | "breached" | "met" | "at_risk";

export interface SLA extends BaseEntity {
  name: string;
  description?: string;
  priority: TicketPriority;
  firstResponseHours: number;
  resolutionHours: number;
  status: EntityStatus;
  isDefault: boolean;
}

export interface SLAStatus extends BaseEntity {
  ticketId: UUID;
  slaId: UUID;
  status: SlaStatus;
  firstResponseDueAt?: ISODate;
  resolutionDueAt?: ISODate;
  firstResponseMet: boolean;
  firstResponseAt?: ISODate;
  resolutionMet: boolean;
  resolvedAt?: ISODate;
  breachedAt?: ISODate;
}

export interface SupportConversation extends BaseEntity {
  ticketId: UUID;
  customerId?: UUID;
  subject: string;
  status: "open" | "closed" | "archived";
  lastMessageAt?: ISODate;
  messageCount: number;
}

export interface ConversationMessage extends BaseEntity {
  conversationId: UUID;
  senderId: UUID;
  senderName: string;
  senderType: "customer" | "agent" | "system";
  content: string;
  isInternal: boolean;
  channel: SupportChannel;
}

export interface Escalation extends BaseEntity {
  ticketId: UUID;
  reason: string;
  level: "l1" | "l2" | "l3" | "management" | "engineering" | "legal" | "executive";
  status: "open" | "acknowledged" | "resolved" | "closed";
  escalatedBy: UUID;
  escalatedTo?: UUID;
  escalatedToTeam?: string;
  notes: string;
  resolvedAt?: ISODate;
}

export interface Resolution extends BaseEntity {
  ticketId: UUID;
  solution: string;
  rootCause?: string;
  resolvedBy: UUID;
  resolvedByName: string;
  resolutionType: "fixed" | "workaround" | "informational" | "escalated" | "refunded" | "cancelled";
  helpful: boolean;
  customerFeedback?: string;
  resolvedAt: ISODate;
}

export interface SupportArticle extends BaseEntity {
  title: string;
  content: string;
  summary?: string;
  category: string;
  tags: string[];
  status: EntityStatus;
  authorId: UUID;
  authorName: string;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  relatedTicketIds: UUID[];
  metadata: Record<string, unknown>;
}

export interface SupportMacro extends BaseEntity {
  key: string;
  name: string;
  content: string;
  category: string;
  tags: string[];
  status: EntityStatus;
  usageCount: number;
}

export interface SupportAgent extends BaseEntity {
  name: string;
  email: string;
  role: "agent" | "lead" | "admin";
  status: "available" | "busy" | "offline";
  skills: string[];
  teams: string[];
  maxConcurrentTickets: number;
  currentTicketCount: number;
  avgResponseTimeMinutes?: number;
  csatScore?: number;
}

export interface SupportQueue extends BaseEntity {
  name: string;
  description?: string;
  type: "all" | "unassigned" | "my_tickets" | "priority" | "escalated" | "sla_risk" | "channel" | "category" | "team" | "agent";
  filter: Record<string, unknown>;
  assignedAgentIds: UUID[];
  status: EntityStatus;
  order: number;
}

export interface SupportComplaint extends BaseEntity {
  ticketId: UUID;
  customerId?: UUID;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  status: "open" | "investigating" | "resolved" | "closed";
  assignedTo?: UUID;
  resolution?: string;
  closedAt?: ISODate;
}

export interface RefundRequest extends BaseEntity {
  ticketId: UUID;
  customerId?: UUID;
  amount: number;
  currency: string;
  reason: string;
  status: "requested" | "under_review" | "approved" | "rejected" | "processed" | "failed" | "closed";
  approvedBy?: UUID;
  approvedAt?: ISODate;
  processedAt?: ISODate;
}

export interface SupportCSAT extends BaseEntity {
  ticketId: UUID;
  customerId?: UUID;
  rating: number;
  comment?: string;
  feedbackType: "resolved" | "agent_rating" | "overall";
  submittedAt: ISODate;
}

export interface SupportQualityReview extends BaseEntity {
  ticketId: UUID;
  reviewerId: UUID;
  reviewerName: string;
  scores: {
    politeness?: number;
    accuracy?: number;
    completeness?: number;
    slaCompliance?: number;
    knowledgeUsage?: number;
    overall?: number;
  };
  issues: string[];
  notes: string;
  status: "draft" | "completed";
  completedAt?: ISODate;
}

export interface SupportEvent extends BaseEntity {
  type: string;
  source: string;
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

export interface SupportOverview {
  tickets: {
    total: number;
    open: number;
    resolved: number;
    closed: number;
    atRisk: number;
    breached: number;
  };
  sla: {
    active: number;
    atRisk: number;
    breached: number;
    compliancePercent: number;
  };
  conversations: {
    open: number;
    messages: number;
  };
  escalations: {
    open: number;
    resolved: number;
  };
  csat: {
    average: number;
    responses: number;
  };
  agents: {
    total: number;
    active: number;
  };
}

export interface SupportState {
  tickets: Ticket[];
  ticketComments: TicketComment[];
  ticketAttachments: TicketAttachment[];
  slas: SLA[];
  slaStatuses: SLAStatus[];
  conversations: SupportConversation[];
  conversationMessages: ConversationMessage[];
  escalations: Escalation[];
  resolutions: Resolution[];
  articles: SupportArticle[];
  macros: SupportMacro[];
  agents: SupportAgent[];
  queues: SupportQueue[];
  complaints: SupportComplaint[];
  refundRequests: RefundRequest[];
  csatResponses: SupportCSAT[];
  qualityReviews: SupportQualityReview[];
  events: SupportEvent[];
  auditLogs: AuditLog[];
}
