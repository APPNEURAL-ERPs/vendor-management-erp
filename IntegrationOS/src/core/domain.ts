export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "integration_admin" | "integration_engineer" | "connector_manager" | "webhook_operator" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";
export type SyncMode = "realtime" | "scheduled" | "manual" | "event-driven";
export type SyncDirection = "one-way" | "two-way";
export type OAuthProvider = "google" | "microsoft" | "github" | "linkedin" | "slack" | "hubspot" | "salesforce" | "custom";
export type WebhookMethod = "POST" | "GET" | "PUT" | "PATCH";
export type ApiAuthType = "api_key" | "bearer_token" | "oauth2" | "basic_auth" | "jwt" | "hmac_signature";
export type ConnectorCategory = "crm" | "payment" | "email" | "calendar" | "storage" | "project_management" | "communication" | "accounting" | "marketing" | "analytics" | "ai_platforms" | "ecommerce" | "social_media" | "notification" | "custom";
export type ConnectorType = "rest" | "graphql" | "soap" | "database" | "file";

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

export interface Connector extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  category: ConnectorCategory;
  type: ConnectorType;
  status: EntityStatus;
  version: string;
  baseUrl?: string;
  authType: ApiAuthType;
  scopes: string[];
  config: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface ConnectorVersion extends BaseEntity {
  connectorId: UUID;
  version: string;
  changelog?: string;
  breakingChanges: boolean;
  createdBy: UUID;
}

export interface Integration extends BaseEntity {
  name: string;
  description?: string;
  connectorId: UUID;
  status: EntityStatus;
  config: Record<string, unknown>;
  credentials?: Record<string, unknown>;
  lastSyncAt?: ISODate;
  healthStatus: "healthy" | "degraded" | "down" | "unknown";
  metadata: Record<string, unknown>;
}

export interface ConnectedApp extends BaseEntity {
  name: string;
  provider: string;
  integrationId: UUID;
  status: "connected" | "disconnected" | "pending" | "error";
  accountInfo?: Record<string, unknown>;
  lastConnectedAt?: ISODate;
  permissions: string[];
  metadata: Record<string, unknown>;
}

export interface OAuthConnection extends BaseEntity {
  integrationId: UUID;
  provider: OAuthProvider;
  status: EntityStatus;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresAt?: ISODate;
  scopes: string[];
  accountId?: string;
  accountEmail?: string;
  metadata: Record<string, unknown>;
}

export interface ApiKey extends BaseEntity {
  ownerId: UUID;
  name: string;
  keyPrefix: string;
  keyHash: string;
  scopes: string[];
  status: EntityStatus;
  expiresAt?: ISODate;
  lastUsedAt?: ISODate;
  createdBy: UUID;
}

export interface WebhookEndpoint extends BaseEntity {
  integrationId?: UUID;
  name: string;
  description?: string;
  url: string;
  method: WebhookMethod;
  secret?: string;
  status: EntityStatus;
  events: string[];
  retryPolicy: RetryPolicy;
  headers: Record<string, string>;
  metadata: Record<string, unknown>;
}

export interface WebhookEvent extends BaseEntity {
  endpointId: UUID;
  event: string;
  payload: Record<string, unknown>;
  headers: Record<string, string>;
  status: "received" | "processing" | "completed" | "failed" | "retrying";
  attempts: number;
  lastAttemptAt?: ISODate;
  errorMessage?: string;
  responseStatus?: number;
  responseBody?: string;
  processedAt?: ISODate;
}

export interface DataMapping extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  sourceConnectorId?: UUID;
  targetConnectorId?: UUID;
  fieldMappings: FieldMapping[];
  transformations: DataTransformation[];
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformType?: "direct" | "map" | "merge" | "split" | "format" | "custom";
  defaultValue?: unknown;
  required: boolean;
}

export interface DataTransformation {
  field: string;
  type: "string" | "number" | "date" | "boolean" | "array" | "object";
  operations: Array<"uppercase" | "lowercase" | "trim" | "parse" | "format" | "convert" | "filter" | "map">;
  config?: Record<string, unknown>;
}

export interface SyncRule extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  sourceIntegrationId: UUID;
  targetIntegrationId: UUID;
  direction: SyncDirection;
  mode: SyncMode;
  schedule?: string;
  filters?: Array<{ field: string; operator: "eq" | "neq" | "gt" | "lt" | "contains" | "in" | "exists"; value?: unknown }>;
  conflictResolution: "source_wins" | "target_wins" | "latest_wins" | "manual";
  mappingId?: UUID;
  enabled: boolean;
  lastRunAt?: ISODate;
  nextRunAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface SyncJob extends BaseEntity {
  syncRuleId: UUID;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  direction: SyncDirection;
  mode: SyncMode;
  totalRecords?: number;
  syncedRecords?: number;
  failedRecords?: number;
  startedAt?: ISODate;
  completedAt?: ISODate;
  errorMessage?: string;
  logs: SyncLog[];
  metadata: Record<string, unknown>;
}

export interface SyncLog {
  timestamp: ISODate;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  recordId?: string;
  details?: Record<string, unknown>;
}

export interface IntegrationLog extends BaseEntity {
  integrationId?: UUID;
  connectorId?: UUID;
  action: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  requestId?: string;
  durationMs?: number;
  statusCode?: number;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface IntegrationError extends BaseEntity {
  integrationId?: UUID;
  connectorId?: UUID;
  syncJobId?: UUID;
  type: "connection" | "authentication" | "validation" | "rate_limit" | "timeout" | "data" | "unknown";
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "resolved" | "ignored";
  message: string;
  details?: Record<string, unknown>;
  stackTrace?: string;
  retryable: boolean;
  resolvedAt?: ISODate;
  resolvedBy?: UUID;
}

export interface RetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
  retryableStatuses: number[];
}

export interface IntegrationTemplate extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  category: ConnectorCategory;
  tags: string[];
  connectorId?: UUID;
  config: Record<string, unknown>;
  rating?: number;
  installs: number;
  author: string;
  status: EntityStatus;
  metadata: Record<string, unknown>;
}

export interface IntegrationHealthCheck extends BaseEntity {
  integrationId: UUID;
  status: "healthy" | "degraded" | "down";
  latencyMs?: number;
  uptimePercent?: number;
  lastCheckAt: ISODate;
  nextCheckAt?: ISODate;
  checks: HealthCheck[];
  alerts: HealthAlert[];
}

export interface HealthCheck {
  name: string;
  status: "pass" | "fail" | "warn";
  latencyMs?: number;
  message?: string;
  details?: Record<string, unknown>;
}

export interface HealthAlert {
  type: string;
  severity: "info" | "warning" | "critical";
  message: string;
  triggeredAt: ISODate;
  acknowledgedAt?: ISODate;
}

export interface EventPayload {
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

export interface IntegrationEvent extends BaseEntity {
  type: string;
  source: string;
  actorId: UUID;
  role: Role;
  data: Record<string, unknown>;
  correlationId?: UUID;
}

export interface IntegrationOverview {
  connectors: { total: number; active: number; byCategory: Record<string, number> };
  integrations: { total: number; healthy: number; degraded: number; down: number };
  webhooks: { total: number; active: number; recentDeliveries: number; failures: number };
  syncJobs: { total: number; completed: number; failed: number; running: number };
  oauthConnections: { total: number; active: number; expired: number };
  logs: { total: number; errors: number; warnings: number };
  errors: { total: number; open: number; critical: number };
}
