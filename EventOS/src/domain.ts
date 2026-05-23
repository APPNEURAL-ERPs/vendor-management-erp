export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "event_admin" | "event_engineer" | "event_analyst" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";
export type EventStatus = "pending" | "processing" | "processed" | "failed" | "dead_lettered";
export type SubscriptionStatus = "active" | "paused" | "inactive";
export type DeliveryStatus = "pending" | "delivered" | "failed" | "retrying";
export type ReplayStatus = "pending" | "running" | "completed" | "failed";
export type DeadLetterReason = "schema_validation_failed" | "subscriber_unavailable" | "permission_denied" | "timeout" | "invalid_payload" | "missing_tenant" | "external_api_failure" | "max_retries_exceeded" | "unknown";

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

export interface DomainEvent extends BaseEntity {
  eventId: string;
  eventName: string;
  eventType: "domain" | "integration" | "audit" | "system" | "external";
  version: string;
  sourceOS: string;
  sourceService?: string;
  actorId?: UUID;
  correlationId?: UUID;
  causationId?: UUID;
  occurredAt: ISODate;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  status: EventStatus;
  processedAt?: ISODate;
  deliveryAttempts: number;
  lastError?: string;
}

export interface EventSchema extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  version: string;
  status: EntityStatus;
  eventType: "domain" | "integration" | "audit" | "system" | "external";
  payloadSchema: Record<string, unknown>;
  requiredFields: string[];
  optionalFields: string[];
  examples: Record<string, unknown>[];
  ownerOS: string;
  tags: string[];
  lifecycleStatus: "draft" | "review" | "approved" | "active" | "deprecated" | "sunset_scheduled" | "retired";
  sunsetDate?: ISODate;
  replacementSchemaId?: UUID;
}

export interface EventStream extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  topic: string;
  partitionKey?: string;
  status: EntityStatus;
  retentionDays: number;
  messageTtlSeconds: number;
  partitions: number;
  config: Record<string, unknown>;
}

export interface EventPublisher extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  sourceOS: string;
  sourceService?: string;
  status: EntityStatus;
  eventTypes: string[];
  topics: string[];
  config: Record<string, unknown>;
}

export interface EventSubscriber extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  subscriberOS: string;
  status: EntityStatus;
  deliveryEndpoint?: string;
  webhookUrl?: string;
  authType?: "none" | "api_key" | "bearer" | "oauth2";
  authConfig?: Record<string, unknown>;
  healthStatus: "healthy" | "degraded" | "unhealthy" | "unknown";
  lastHealthCheck?: ISODate;
  eventTypes: string[];
  topics: string[];
  config: Record<string, unknown>;
}

export interface EventSubscription extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  subscriberId: UUID;
  eventName: string;
  eventVersion?: string;
  topic: string;
  filterCriteria?: Record<string, unknown>;
  priority: number;
  status: SubscriptionStatus;
  retryPolicy: RetryPolicy;
  deadLetterPolicy: DeadLetterPolicy;
  deliveryMode: "sync" | "async" | "webhook";
}

export interface RetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface DeadLetterPolicy {
  enabled: boolean;
  maxRetries: number;
  deadLetterQueueId?: UUID;
  notifyOnDeadLetter: boolean;
}

export interface WebhookEndpoint extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  url: string;
  method: "GET" | "POST" | "PUT";
  headers: Record<string, string>;
  authType: "none" | "api_key" | "bearer" | "oauth2" | "signature";
  authConfig?: Record<string, unknown>;
  eventFilters: string[];
  status: EntityStatus;
  healthStatus: "healthy" | "degraded" | "unhealthy" | "unknown";
  lastHealthCheck?: ISODate;
  lastDeliveryAt?: ISODate;
}

export interface EventLog extends BaseEntity {
  eventId: UUID;
  subscriptionId: UUID;
  subscriberId: UUID;
  eventName: string;
  topic: string;
  status: DeliveryStatus;
  deliveryAttempts: number;
  lastAttemptAt?: ISODate;
  deliveredAt?: ISODate;
  responseStatusCode?: number;
  responseBody?: string;
  errorMessage?: string;
  latencyMs: number;
}

export interface DeadLetterEvent extends BaseEntity {
  eventId: UUID;
  originalEventId: UUID;
  eventName: string;
  topic: string;
  reason: DeadLetterReason;
  errorMessage: string;
  stackTrace?: string;
  payload: Record<string, unknown>;
  retryCount: number;
  maxRetries: number;
  firstFailureAt: ISODate;
  lastFailureAt: ISODate;
  resolvedAt?: ISODate;
  resolvedBy?: UUID;
}

export interface EventReplay extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  eventName: string;
  eventVersion?: string;
  topic?: string;
  subscriberId?: UUID;
  startDate: ISODate;
  endDate: ISODate;
  filters?: Record<string, unknown>;
  status: ReplayStatus;
  totalEvents: number;
  processedEvents: number;
  failedEvents: number;
  startedAt?: ISODate;
  completedAt?: ISODate;
  triggeredBy: UUID;
}

export interface EventCorrelation extends BaseEntity {
  correlationId: UUID;
  events: UUID[];
  rootEventId?: UUID;
  userId?: UUID;
  sessionId?: string;
  description?: string;
}

export interface EventProjection extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  sourceEvents: string[];
  projectionLogic: string;
  status: EntityStatus;
  lastEventProcessed?: ISODate;
  currentState: Record<string, unknown>;
}

export interface EventContract extends BaseEntity {
  publisherId: UUID;
  subscriberId: UUID;
  eventName: string;
  schemaId: UUID;
  version: string;
  status: "active" | "deprecated" | "broken";
  breakingChanges: boolean;
  lastValidated?: ISODate;
  validationResult?: Record<string, unknown>;
}

export interface EventMetrics {
  totalEvents: number;
  processedEvents: number;
  failedEvents: number;
  deadLetteredEvents: number;
  pendingEvents: number;
  eventsPerSecond: number;
  averageLatencyMs: number;
  activeSubscriptions: number;
  activeTopics: number;
  eventsByType: Record<string, number>;
  eventsBySource: Record<string, number>;
  eventsByStatus: Record<string, number>;
}

export interface EventBusOverview {
  metrics: EventMetrics;
  healthySubscribers: number;
  degradedSubscribers: number;
  unhealthySubscribers: number;
  recentEvents: number;
  failedEvents: number;
  deadLetterCount: number;
}

export interface EventState {
  events: DomainEvent[];
  schemas: EventSchema[];
  streams: EventStream[];
  publishers: EventPublisher[];
  subscribers: EventSubscriber[];
  subscriptions: EventSubscription[];
  webhooks: WebhookEndpoint[];
  eventLogs: EventLog[];
  deadLetters: DeadLetterEvent[];
  replays: EventReplay[];
  correlations: EventCorrelation[];
  projections: EventProjection[];
  contracts: EventContract[];
  auditLogs: AuditLog[];
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
