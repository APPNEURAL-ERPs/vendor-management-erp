export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "developer_admin" | "sdk_engineer" | "api_developer" | "portal_manager" | "viewer";
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

export interface API extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  version: string;
  status: EntityStatus;
  endpoints: APIEndpoint[];
  schemas: DataSchema[];
  authentication: "none" | "api_key" | "oauth2" | "jwt";
  rateLimit?: number;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface APIEndpoint extends BaseEntity {
  apiId: UUID;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  name: string;
  description?: string;
  requestSchema?: DataSchema;
  responseSchema?: DataSchema;
  authentication: "none" | "api_key" | "oauth2" | "jwt";
  rateLimit?: number;
  tags: string[];
  status: EntityStatus;
  examples: Record<string, unknown>[];
}

export interface DataSchema extends BaseEntity {
  apiId: UUID;
  name: string;
  type: "object" | "array" | "string" | "number" | "boolean" | "integer";
  description?: string;
  properties?: DataSchemaProperty[];
  required?: string[];
  example?: unknown;
  format?: string;
  enum?: string[];
  metadata: Record<string, unknown>;
}

export interface DataSchemaProperty {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  format?: string;
  enum?: string[];
  default?: unknown;
  example?: unknown;
}

export interface SDK extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  version: string;
  language: "typescript" | "python" | "go" | "java" | "csharp" | "ruby" | "php";
  framework?: string;
  status: EntityStatus;
  apiId?: UUID;
  sourceCode?: string;
  packageJson?: Record<string, unknown>;
  readme?: string;
  examples: SDKExample[];
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface SDKExample extends BaseEntity {
  sdkId: UUID;
  title: string;
  description?: string;
  language: SDK["language"];
  code: string;
  useCase?: string;
}

export interface CLICommand extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  version: string;
  status: EntityStatus;
  commands: CLISubCommand[];
  options: CLIOption[];
  examples: CLIExample[];
  sdkId?: UUID;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface CLISubCommand {
  name: string;
  description?: string;
  options: CLIOption[];
  subCommands?: CLISubCommand[];
}

export interface CLIOption {
  name: string;
  short?: string;
  type: "string" | "number" | "boolean";
  description?: string;
  required: boolean;
  default?: unknown;
}

export interface CLIExample {
  command: string;
  description?: string;
  output?: string;
}

export interface APIKey extends BaseEntity {
  ownerId: UUID;
  ownerType: "service_account" | "developer_app";
  name: string;
  keyPrefix: string;
  keyHash: string;
  scopes: string[];
  status: "active" | "revoked" | "expired";
  expiresAt?: ISODate;
  lastUsedAt?: ISODate;
  createdBy: UUID;
  revokedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface ServiceAccount extends BaseEntity {
  name: string;
  description?: string;
  email?: string;
  status: "active" | "inactive" | "disabled";
  ownerId?: UUID;
  scopes: string[];
  apiKeys: APIKey[];
  metadata: Record<string, unknown>;
}

export interface Webhook extends BaseEntity {
  name: string;
  description?: string;
  url: string;
  events: string[];
  secret?: string;
  status: "active" | "inactive" | "disabled";
  retryPolicy: WebhookRetryPolicy;
  headers: Record<string, string>;
  apiId?: UUID;
  createdBy: UUID;
  lastTriggeredAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface WebhookRetryPolicy {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier?: number;
}

export interface WebhookDelivery extends BaseEntity {
  webhookId: UUID;
  event: string;
  payload: Record<string, unknown>;
  response?: WebhookResponse;
  status: "pending" | "delivered" | "failed";
  attempts: number;
  lastAttemptAt?: ISODate;
  nextRetryAt?: ISODate;
  error?: string;
}

export interface WebhookResponse {
  statusCode: number;
  body?: string;
  headers?: Record<string, string>;
  durationMs: number;
}

export interface Sandbox extends BaseEntity {
  name: string;
  description?: string;
  environment: "development" | "staging" | "production";
  status: "active" | "inactive" | "expired";
  ownerId: UUID;
  expiresAt?: ISODate;
  resources: SandboxResources;
  services: string[];
  variables: Record<string, string>;
  createdBy: UUID;
  metadata: Record<string, unknown>;
}

export interface SandboxResources {
  cpu?: number;
  memory?: number;
  disk?: number;
  network?: boolean;
}

export interface DeveloperApp extends BaseEntity {
  name: string;
  description?: string;
  status: "active" | "inactive" | "disabled";
  ownerId: UUID;
  websiteUrl?: string;
  redirectUrls?: string[];
  apiKeys: APIKey[];
  webhooks: Webhook[];
  scopes: string[];
  metadata: Record<string, unknown>;
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

export interface DeveloperOSEvent extends BaseEntity {
  type: string;
  source: string;
  data: Record<string, unknown>;
  correlationId?: UUID;
}

export interface DeveloperOSOverview {
  apis: { total: number; active: number };
  sdks: { total: number; active: number };
  cliCommands: { total: number; active: number };
  apiKeys: { total: number; active: number };
  serviceAccounts: { total: number; active: number };
  webhooks: { total: number; active: number };
  sandboxes: { total: number; active: number };
  developerApps: { total: number; active: number };
}

export interface DeveloperOSState {
  apis: API[];
  endpoints: APIEndpoint[];
  schemas: DataSchema[];
  sdks: SDK[];
  sdkExamples: SDKExample[];
  cliCommands: CLICommand[];
  apiKeys: APIKey[];
  serviceAccounts: ServiceAccount[];
  webhooks: Webhook[];
  webhookDeliveries: WebhookDelivery[];
  sandboxes: Sandbox[];
  developerApps: DeveloperApp[];
  events: DeveloperOSEvent[];
  auditLogs: AuditLog[];
}
