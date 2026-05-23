export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "communication_admin" | "communication_manager" | "communication_agent" | "viewer";
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

export interface Contact extends BaseEntity {
  externalId?: string;
  email?: string;
  phone?: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  status: "active" | "inactive" | "blocked";
  metadata: Record<string, unknown>;
  tags: string[];
}

export interface Presence extends BaseEntity {
  userId: UUID;
  status: "online" | "away" | "busy" | "do_not_disturb" | "offline" | "in_call";
  statusMessage?: string;
  lastSeenAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface Channel extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "email" | "whatsapp" | "sms" | "chat" | "internal" | "webhook" | "api";
  status: EntityStatus;
  isPrivate: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
  config: Record<string, unknown>;
}

export interface Conversation extends BaseEntity {
  channelId: UUID;
  title?: string;
  status: "new" | "open" | "assigned" | "waiting_reply" | "waiting_customer" | "resolved" | "closed" | "archived";
  priority: "low" | "normal" | "high" | "urgent";
  type: "sales" | "support" | "client" | "partner" | "student" | "vendor" | "internal" | "ai_agent";
  assigneeId?: UUID;
  contactId?: UUID;
  tags: string[];
  metadata: Record<string, unknown>;
  lastMessageAt?: ISODate;
  messageCount: number;
  unreadCount: number;
  slaDeadlineAt?: ISODate;
  slaBreached: boolean;
}

export interface ConversationParticipant extends BaseEntity {
  conversationId: UUID;
  userId?: UUID;
  contactId?: UUID;
  role: "owner" | "participant" | "watcher";
  joinedAt: ISODate;
  leftAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface Message extends BaseEntity {
  conversationId: UUID;
  channelId: UUID;
  senderId?: UUID;
  senderType: "user" | "contact" | "system" | "ai";
  content: string;
  contentType: "text" | "html" | "template" | "system";
  direction: "inbound" | "outbound";
  status: "pending" | "sent" | "delivered" | "read" | "failed";
  attachments: MessageAttachment[];
  metadata: Record<string, unknown>;
  parentMessageId?: UUID;
  isRead: boolean;
  sentAt?: ISODate;
  deliveredAt?: ISODate;
  readAt?: ISODate;
  errorMessage?: string;
}

export interface MessageAttachment extends BaseEntity {
  messageId: UUID;
  fileName: string;
  fileType: string;
  fileSize: number;
  url?: string;
  storageKey?: string;
  thumbnailUrl?: string;
  metadata: Record<string, unknown>;
}

export interface MessageTemplate extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  channelType: Channel["type"];
  subject?: string;
  content: string;
  variables: string[];
  status: EntityStatus;
  tags: string[];
  createdBy: UUID;
  metadata: Record<string, unknown>;
}

export interface MessageDraft extends BaseEntity {
  conversationId?: UUID;
  channelId: UUID;
  recipientId?: UUID;
  recipientType: "user" | "contact";
  content: string;
  subject?: string;
  attachments: string[];
  status: "draft" | "ready" | "sent";
  scheduledAt?: ISODate;
  createdBy: UUID;
  metadata: Record<string, unknown>;
}

export interface Call extends BaseEntity {
  conversationId?: UUID;
  initiatorId: UUID;
  direction: "inbound" | "outbound";
  status: "initiated" | "ringing" | "answered" | "ended" | "missed" | "voicemail" | "failed";
  type: "voice" | "video";
  duration?: number;
  startedAt?: ISODate;
  answeredAt?: ISODate;
  endedAt?: ISODate;
  recordingUrl?: string;
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface CallParticipant extends BaseEntity {
  callId: UUID;
  userId?: UUID;
  contactId?: UUID;
  joinOrder: number;
  joinedAt?: ISODate;
  leftAt?: ISODate;
  duration?: number;
  status: "waiting" | "joined" | "left" | "declined";
  metadata: Record<string, unknown>;
}

export interface Conference extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "meeting" | "webinar" | "training" | "support";
  status: EntityStatus;
  scheduledStartAt: ISODate;
  scheduledEndAt: ISODate;
  actualStartAt?: ISODate;
  actualEndAt?: ISODate;
  hostId: UUID;
  maxParticipants: number;
  joinUrl?: string;
  recordingEnabled: boolean;
  recordingUrl?: string;
  agenda?: string;
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface ConferenceParticipant extends BaseEntity {
  conferenceId: UUID;
  userId?: UUID;
  contactId?: UUID;
  role: "host" | "presenter" | "attendee" | "observer";
  invitedBy: UUID;
  invitedAt: ISODate;
  joinedAt?: ISODate;
  leftAt?: ISODate;
  status: "invited" | "accepted" | "declined" | "joined" | "left";
  metadata: Record<string, unknown>;
}

export interface Announcement extends BaseEntity {
  key: string;
  title: string;
  content: string;
  channelType: Channel["type"];
  targetType: "all" | "role" | "team" | "contact_group" | "individual";
  targetIds: string[];
  status: EntityStatus;
  scheduledAt?: ISODate;
  sentAt?: ISODate;
  sentBy: UUID;
  recipientCount: number;
  deliveredCount: number;
  readCount: number;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface ConversationAssignment extends BaseEntity {
  conversationId: UUID;
  assigneeId: UUID;
  assignedBy: UUID;
  assignedAt: ISODate;
  reason?: string;
  metadata: Record<string, unknown>;
}

export interface ConversationTag extends BaseEntity {
  conversationId: UUID;
  tag: string;
  addedBy: UUID;
  addedAt: ISODate;
}

export interface ConversationTimelineEvent extends BaseEntity {
  conversationId: UUID;
  eventType: string;
  actorId?: UUID;
  actorType: "user" | "system" | "contact";
  description: string;
  metadata: Record<string, unknown>;
}

export interface CommunicationConsent extends BaseEntity {
  contactId: UUID;
  channelType: Channel["type"];
  consented: boolean;
  consentedAt?: ISODate;
  optedOutAt?: ISODate;
  source: "web" | "email" | "sms" | "phone" | "manual";
  metadata: Record<string, unknown>;
}

export interface CommunicationSLA extends BaseEntity {
  conversationId: UUID;
  type: "first_response" | "next_response" | "resolution";
  targetMinutes: number;
  startedAt: ISODate;
  deadlineAt: ISODate;
  completedAt?: ISODate;
  breached: boolean;
  metadata: Record<string, unknown>;
}

export interface CommunicationEvent extends BaseEntity {
  type: string;
  source: string;
  data: Record<string, unknown>;
  correlationId?: UUID;
  actorId?: UUID;
}

export interface AuditLog extends BaseEntity {
  actorId: UUID;
  role: Role;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}

export interface CommunicationOverview {
  conversations: { total: number; open: number; closed: number; byStatus: Record<string, number> };
  messages: { total: number; sent: number; received: number; pending: number; failed: number };
  channels: { total: number; active: number; byType: Record<string, number> };
  calls: { total: number; active: number; duration: number };
  conferences: { total: number; scheduled: number; completed: number };
  presence: { online: number; offline: number; away: number };
  unread: number;
  slaBreaches: number;
}

export interface CommunicationState {
  contacts: Contact[];
  presences: Presence[];
  channels: Channel[];
  conversations: Conversation[];
  conversationParticipants: ConversationParticipant[];
  messages: Message[];
  messageAttachments: MessageAttachment[];
  messageTemplates: MessageTemplate[];
  messageDrafts: MessageDraft[];
  calls: Call[];
  callParticipants: CallParticipant[];
  conferences: Conference[];
  conferenceParticipants: ConferenceParticipant[];
  announcements: Announcement[];
  conversationAssignments: ConversationAssignment[];
  conversationTags: ConversationTag[];
  conversationTimelineEvents: ConversationTimelineEvent[];
  consents: CommunicationConsent[];
  slas: CommunicationSLA[];
  events: CommunicationEvent[];
  auditLogs: AuditLog[];
}
