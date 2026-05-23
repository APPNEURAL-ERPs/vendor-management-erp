export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role =
  | "owner"
  | "admin"
  | "client_admin"
  | "account_manager"
  | "support_agent"
  | "support_manager"
  | "success_manager"
  | "sales_rep"
  | "auditor"
  | "viewer";

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
export type AccountType = "individual" | "company" | "household" | "nonprofit" | "government";
export type AccountStatus = "lead" | "prospect" | "active" | "at_risk" | "inactive" | "churned" | "archived";
export type LifecycleStage = "new" | "onboarding" | "active" | "renewal" | "retention" | "churned";
export type PreferredChannel = "email" | "phone" | "whatsapp" | "sms" | "portal" | "in_person";
export type ConsentStatus = "unknown" | "granted" | "revoked";

export interface Address {
  label: string;
  line1: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface CustomerAccount extends BaseEntity {
  code: string;
  name: string;
  type: AccountType;
  status: AccountStatus;
  lifecycleStage: LifecycleStage;
  industry?: string;
  website?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  ownerUserId?: UUID;
  healthScore: number;
  annualValue?: number;
  currency?: string;
  addresses: Address[];
  tags: string[];
  customFields: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdBy: UUID;
  lastContactedAt?: ISODate;
}

export type ContactStatus = "active" | "inactive" | "do_not_contact" | "archived";

export interface Contact extends BaseEntity {
  accountId?: UUID;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roleTitle?: string;
  department?: string;
  decisionMaker: boolean;
  status: ContactStatus;
  preferredChannel: PreferredChannel;
  consentStatus: ConsentStatus;
  tags: string[];
  customFields: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdBy: UUID;
  lastContactedAt?: ISODate;
}

export type OpportunityStage = "new" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
export type OpportunityStatus = "open" | "won" | "lost" | "archived";

export interface Opportunity extends BaseEntity {
  accountId: UUID;
  contactId?: UUID;
  name: string;
  stage: OpportunityStage;
  status: OpportunityStatus;
  value: number;
  currency: string;
  probability: number;
  expectedCloseDate?: ISODate;
  ownerUserId?: UUID;
  source?: string;
  products: string[];
  notes?: string;
  lostReason?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  createdBy: UUID;
  closedAt?: ISODate;
}

export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketSeverity = "s1" | "s2" | "s3" | "s4";
export type TicketChannel = "email" | "phone" | "chat" | "whatsapp" | "portal" | "social" | "internal";
export type TicketStatus = "open" | "triaged" | "in_progress" | "waiting_customer" | "waiting_internal" | "resolved" | "closed" | "cancelled";

export interface Ticket extends BaseEntity {
  ticketNumber: string;
  accountId?: UUID;
  contactId?: UUID;
  subject: string;
  description: string;
  category: string;
  priority: TicketPriority;
  severity: TicketSeverity;
  channel: TicketChannel;
  status: TicketStatus;
  assignedToUserId?: UUID;
  team?: string;
  slaPolicyId?: UUID;
  firstResponseDueAt?: ISODate;
  resolutionDueAt?: ISODate;
  firstResponseAt?: ISODate;
  resolvedAt?: ISODate;
  closedAt?: ISODate;
  resolutionSummary?: string;
  satisfactionScore?: number;
  tags: string[];
  metadata: Record<string, unknown>;
  createdBy: UUID;
}

export interface SlaPolicy extends BaseEntity {
  name: string;
  priority: TicketPriority;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  businessHoursOnly: boolean;
  escalationUserIds: UUID[];
  status: EntityStatus;
  metadata: Record<string, unknown>;
}

export type RelatedEntityType = "account" | "contact" | "opportunity" | "ticket";
export type NoteVisibility = "internal" | "shared";

export interface ClientNote extends BaseEntity {
  entityType: RelatedEntityType;
  entityId: UUID;
  note: string;
  visibility: NoteVisibility;
  pinned: boolean;
  tags: string[];
  createdBy: UUID;
}

export type InteractionChannel = "email" | "call" | "meeting" | "chat" | "whatsapp" | "sms" | "portal" | "in_person" | "social";
export type InteractionDirection = "inbound" | "outbound" | "internal";

export interface Interaction extends BaseEntity {
  entityType: RelatedEntityType;
  entityId: UUID;
  accountId?: UUID;
  contactId?: UUID;
  channel: InteractionChannel;
  direction: InteractionDirection;
  summary: string;
  content?: string;
  occurredAt: ISODate;
  participants: string[];
  createdBy: UUID;
  metadata: Record<string, unknown>;
}

export type ClientTaskStatus = "open" | "in_progress" | "done" | "cancelled" | "overdue";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface ClientTask extends BaseEntity {
  title: string;
  description?: string;
  relatedType?: RelatedEntityType;
  relatedId?: UUID;
  assignedToUserId?: UUID;
  dueAt?: ISODate;
  priority: TaskPriority;
  status: ClientTaskStatus;
  completedAt?: ISODate;
  createdBy: UUID;
  metadata: Record<string, unknown>;
}

export interface SegmentFilter {
  statuses?: AccountStatus[];
  tags?: string[];
  ownerUserId?: UUID;
  healthScoreBelow?: number;
  healthScoreAbove?: number;
  lifecycleStages?: LifecycleStage[];
}

export interface ClientSegment extends BaseEntity {
  name: string;
  description?: string;
  filters: SegmentFilter;
  accountIds: UUID[];
  dynamic: boolean;
  status: EntityStatus;
  ownerUserId?: UUID;
  metadata: Record<string, unknown>;
}

export interface ClientEvent extends BaseEntity {
  type: string;
  source: string;
  actorId?: UUID;
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

export interface ClientState {
  accounts: CustomerAccount[];
  contacts: Contact[];
  opportunities: Opportunity[];
  tickets: Ticket[];
  slaPolicies: SlaPolicy[];
  notes: ClientNote[];
  interactions: Interaction[];
  tasks: ClientTask[];
  segments: ClientSegment[];
  events: ClientEvent[];
  auditLogs: AuditLog[];
}
