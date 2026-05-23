export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "notification_admin" | "notification_manager" | "notification_operator" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";

export type NotificationChannel = "email" | "whatsapp" | "sms" | "push" | "in_app" | "slack" | "teams" | "webhook" | "voice";
export type NotificationStatus = "queued" | "sent" | "delivered" | "failed" | "bounced" | "rejected" | "expired" | "cancelled";
export type DeliveryStatus = "pending" | "sent" | "delivered" | "opened" | "clicked" | "read" | "failed";
export type AlertSeverity = "info" | "low" | "medium" | "high" | "critical" | "emergency";
export type ReminderTiming = "immediately" | "5_minutes" | "1_hour" | "1_day" | "3_days" | "7_days" | "custom";
export type ReminderFrequency = "once" | "daily" | "weekly" | "monthly";

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

export interface NotificationChannel_ extends BaseEntity {
  key: string;
  name: string;
  type: NotificationChannel;
  status: EntityStatus;
  provider?: string;
  config: Record<string, unknown>;
  credentials?: Record<string, string>;
  maskedCredentials?: Record<string, string>;
  rateLimit?: number;
  costPerUnit?: number;
}

export interface NotificationProvider extends BaseEntity {
  key: string;
  name: string;
  type: NotificationChannel;
  status: EntityStatus;
  apiKey?: string;
  maskedApiKey?: string;
  baseUrl?: string;
  config: Record<string, unknown>;
}

export interface NotificationTemplate extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: NotificationChannel;
  status: EntityStatus;
  subject?: string;
  body: string;
  variables: string[];
  tags: string[];
  version: number;
  approved: boolean;
  approvedBy?: UUID;
  approvedAt?: ISODate;
}

export interface NotificationRecipient extends BaseEntity {
  notificationId: UUID;
  channel: NotificationChannel;
  recipient: string;
  recipientName?: string;
  recipientId?: UUID;
  status: NotificationStatus;
  deliveryStatus: DeliveryStatus;
  deliveredAt?: ISODate;
  readAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface Notification extends BaseEntity {
  key: string;
  name: string;
  type: "transactional" | "marketing" | "reminder" | "alert" | "announcement" | "campaign";
  status: NotificationStatus;
  priority: "low" | "normal" | "high" | "urgent" | "critical";
  templateId?: UUID;
  channels: NotificationChannel[];
  recipients: NotificationRecipient[];
  subject?: string;
  body: string;
  variables: Record<string, unknown>;
  scheduledAt?: ISODate;
  sentAt?: ISODate;
  completedAt?: ISODate;
  retryCount: number;
  maxRetries: number;
  createdBy: UUID;
  metadata: Record<string, unknown>;
}

export interface NotificationPreference extends BaseEntity {
  userId: UUID;
  channel: NotificationChannel;
  enabled: boolean;
  optIn: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  frequencyLimit?: number;
  categories: string[];
  metadata: Record<string, unknown>;
}

export interface NotificationRule extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  event: string;
  conditions: Array<{
    field: string;
    operator: "eq" | "neq" | "contains" | "gte" | "lte" | "exists" | "not_exists";
    value?: unknown;
  }>;
  actions: Array<{
    type: "send_notification" | "send_reminder" | "escalate" | "webhook";
    channel: NotificationChannel;
    templateId?: UUID;
    delay?: number;
    recipients?: string[];
  }>;
  priority: number;
  createdBy: UUID;
}

export interface NotificationSchedule extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  notificationId?: UUID;
  templateId?: UUID;
  channels: NotificationChannel[];
  recipients: Array<{
    type: "user" | "role" | "tenant" | "team" | "dynamic";
    id?: UUID;
    query?: string;
  }>;
  timing: ReminderTiming;
  customTiming?: ISODate;
  frequency: ReminderFrequency;
  startDate: ISODate;
  endDate?: ISODate;
  timezone?: string;
  createdBy: UUID;
}

export interface Reminder extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  userId: UUID;
  type: "payment" | "meeting" | "task" | "course" | "appointment" | "custom";
  referenceId?: UUID;
  referenceType?: string;
  channels: NotificationChannel[];
  templateId?: UUID;
  scheduledAt: ISODate;
  timing: ReminderTiming;
  frequency: ReminderFrequency;
  sent: boolean;
  completed: boolean;
  metadata: Record<string, unknown>;
}

export interface Alert extends BaseEntity {
  key: string;
  name: string;
  type: "system" | "security" | "billing" | "usage" | "sla" | "cost" | "incident" | "risk";
  severity: AlertSeverity;
  status: EntityStatus;
  source: string;
  channels: NotificationChannel[];
  templateId?: UUID;
  recipients: string[];
  triggeredAt: ISODate;
  acknowledgedAt?: ISODate;
  acknowledgedBy?: UUID;
  resolvedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface Announcement extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "product" | "system" | "maintenance" | "policy" | "course" | "team" | "client" | "partner";
  status: EntityStatus;
  priority: "low" | "normal" | "high";
  channels: NotificationChannel[];
  templateId?: UUID;
  subject: string;
  body: string;
  target: {
    type: "all" | "tenant" | "role" | "module" | "plan" | "geography" | "segment";
    value?: string;
  };
  scheduledAt?: ISODate;
  publishedAt?: ISODate;
  expiresAt?: ISODate;
  createdBy: UUID;
}

export interface NotificationCampaign extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "marketing" | "engagement" | "re_engagement" | "transactional" | "announcement";
  status: EntityStatus;
  channels: NotificationChannel[];
  templateId?: UUID;
  segment?: {
    type: "all" | "trial" | "paid" | "inactive" | "plan" | "role" | "custom";
    query?: string;
  };
  scheduledAt?: ISODate;
  completedAt?: ISODate;
  stats: {
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
    cost: number;
  };
  createdBy: UUID;
}

export interface NotificationDeliveryLog extends BaseEntity {
  notificationId: UUID;
  recipientId: UUID;
  channel: NotificationChannel;
  status: DeliveryStatus;
  providerMessageId?: string;
  sentAt?: ISODate;
  deliveredAt?: ISODate;
  openedAt?: ISODate;
  clickedAt?: ISODate;
  failedAt?: ISODate;
  errorMessage?: string;
  retryCount: number;
  metadata: Record<string, unknown>;
}

export interface NotificationQueueItem extends BaseEntity {
  notificationId: UUID;
  channel: NotificationChannel;
  priority: number;
  status: "queued" | "processing" | "sent" | "failed" | "dead_letter";
  scheduledAt: ISODate;
  processedAt?: ISODate;
  attempts: number;
  lastError?: string;
  metadata: Record<string, unknown>;
}

export interface NotificationRetryPolicy extends BaseEntity {
  key: string;
  name: string;
  channel: NotificationChannel;
  status: EntityStatus;
  maxRetries: number;
  retryDelays: number[];
  exponentialBackoff: boolean;
  fallbackChannels: NotificationChannel[];
}

export interface NotificationCostRecord extends BaseEntity {
  notificationId?: UUID;
  campaignId?: UUID;
  channel: NotificationChannel;
  provider: string;
  units: number;
  cost: number;
  currency: string;
  metadata: Record<string, unknown>;
}

export interface NotificationAuditLog extends BaseEntity {
  actorId: UUID;
  role: Role;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
  metadata: Record<string, unknown>;
}

export interface NotificationEvent extends BaseEntity {
  type: string;
  source: string;
  data: Record<string, unknown>;
  correlationId?: UUID;
}

export interface NotificationOSState {
  channels: NotificationChannel_[];
  providers: NotificationProvider[];
  templates: NotificationTemplate[];
  notifications: Notification[];
  preferences: NotificationPreference[];
  rules: NotificationRule[];
  schedules: NotificationSchedule[];
  reminders: Reminder[];
  alerts: Alert[];
  announcements: Announcement[];
  campaigns: NotificationCampaign[];
  deliveryLogs: NotificationDeliveryLog[];
  queueItems: NotificationQueueItem[];
  retryPolicies: NotificationRetryPolicy[];
  costRecords: NotificationCostRecord[];
  events: NotificationEvent[];
  auditLogs: NotificationAuditLog[];
}

export interface NotificationOverview {
  notifications: {
    total: number;
    queued: number;
    sent: number;
    delivered: number;
    failed: number;
    byChannel: Record<NotificationChannel, number>;
  };
  templates: {
    total: number;
    active: number;
    byChannel: Record<NotificationChannel, number>;
  };
  delivery: {
    totalSent: number;
    totalDelivered: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    failureRate: number;
  };
  cost: {
    total: number;
    byChannel: Record<NotificationChannel, number>;
    byProvider: Record<string, number>;
  };
  queue: {
    pending: number;
    processing: number;
    deadLetter: number;
  };
}
