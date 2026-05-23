export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "infra_admin" | "devops_engineer" | "developer" | "viewer";
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

export interface Server extends BaseEntity {
  name: string;
  hostname: string;
  ipAddress: string;
  port?: number;
  provider: "aws" | "azure" | "gcp" | "digitalocean" | "cloudflare" | "self-hosted";
  region?: string;
  instanceType?: string;
  status: EntityStatus;
  environmentIds: UUID[];
  metadata: Record<string, unknown>;
}

export interface Database extends BaseEntity {
  name: string;
  type: "postgresql" | "mysql" | "mongodb" | "redis" | "sqlite" | "dynamodb" | "cosmosdb" | "clickhouse" | "aurora";
  status: EntityStatus;
  provider: "aws" | "azure" | "gcp" | "cloudflare" | "self-hosted";
  connectionString?: string;
  host?: string;
  port?: number;
  databaseName?: string;
  version?: string;
  maxConnections?: number;
  environmentIds: UUID[];
  metadata: Record<string, unknown>;
}

export interface Network extends BaseEntity {
  name: string;
  type: "vpc" | "vnet" | "network" | "private_network";
  status: EntityStatus;
  provider: "aws" | "azure" | "gcp" | "cloudflare" | "self-hosted";
  cidr?: string;
  region?: string;
  environmentIds: UUID[];
  metadata: Record<string, unknown>;
}

export interface Container extends BaseEntity {
  name: string;
  image: string;
  tag: string;
  status: EntityStatus;
  provider: "docker" | "kubernetes" | "cloudflare" | "aws" | "azure" | "gcp";
  replicas: number;
  port?: number;
  environmentIds: UUID[];
  environment: Record<string, string>;
  metadata: Record<string, unknown>;
}

export interface Deployment extends BaseEntity {
  name: string;
  version: string;
  status: "pending" | "running" | "completed" | "failed" | "rolled_back";
  environmentId: UUID;
  containerId?: UUID;
  serverId?: UUID;
  strategy: "rolling" | "blue_green" | "canary" | "direct";
  rolloutId?: UUID;
  previousVersion?: string;
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface DeploymentRun extends BaseEntity {
  deploymentId: UUID;
  status: "pending" | "running" | "completed" | "failed" | "rolled_back";
  startedAt?: ISODate;
  completedAt?: ISODate;
  durationMs?: number;
  logs: string[];
  error?: string;
  metadata: Record<string, unknown>;
}

export interface Environment extends BaseEntity {
  name: string;
  key: string;
  description?: string;
  type: "development" | "staging" | "production" | "preview" | "sandbox" | "local";
  status: EntityStatus;
  variables: Record<string, string>;
  serverIds: UUID[];
  databaseIds: UUID[];
  networkIds: UUID[];
  containerIds: UUID[];
  metadata: Record<string, unknown>;
}

export interface CloudProvider extends BaseEntity {
  name: string;
  key: string;
  type: "aws" | "azure" | "gcp" | "cloudflare" | "digitalocean" | "self-hosted";
  status: EntityStatus;
  region?: string;
  credentials?: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface StorageBucket extends BaseEntity {
  name: string;
  provider: "aws" | "azure" | "gcp" | "cloudflare";
  region?: string;
  status: EntityStatus;
  environmentIds: UUID[];
  metadata: Record<string, unknown>;
}

export interface QueueResource extends BaseEntity {
  name: string;
  provider: "aws" | "azure" | "cloudflare" | "rabbitmq" | "kafka";
  status: EntityStatus;
  environmentIds: UUID[];
  metadata: Record<string, unknown>;
}

export interface Secret extends BaseEntity {
  name: string;
  environmentId?: UUID;
  encryptedValue?: string;
  maskedValue?: string;
  status: EntityStatus;
  version: number;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface ConfigVariable extends BaseEntity {
  name: string;
  value: string;
  environmentId?: UUID;
  isSecret: boolean;
  status: EntityStatus;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface MonitoringMetric extends BaseEntity {
  resourceType: "server" | "database" | "container" | "deployment";
  resourceId: UUID;
  metric: string;
  value: number;
  unit: string;
  timestamp: ISODate;
  metadata: Record<string, unknown>;
}

export interface AlertRule extends BaseEntity {
  name: string;
  description?: string;
  resourceType: "server" | "database" | "container" | "deployment";
  condition: string;
  threshold: number;
  severity: "low" | "medium" | "high" | "critical";
  status: EntityStatus;
  notifiedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface Incident extends BaseEntity {
  title: string;
  description?: string;
  severity: "sev1" | "sev2" | "sev3" | "sev4";
  status: "open" | "investigating" | "mitigated" | "resolved" | "closed";
  resourceType?: "server" | "database" | "container" | "deployment" | "network";
  resourceId?: UUID;
  createdBy: UUID;
  assignedTo?: UUID;
  resolvedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface BackupJob extends BaseEntity {
  name: string;
  resourceType: "database" | "storage";
  resourceId: UUID;
  status: "pending" | "running" | "completed" | "failed";
  backupType: "full" | "incremental";
  startedAt?: ISODate;
  completedAt?: ISODate;
  sizeBytes?: number;
  location?: string;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface RestoreJob extends BaseEntity {
  name: string;
  backupJobId: UUID;
  resourceType: "database" | "storage";
  resourceId: UUID;
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: ISODate;
  completedAt?: ISODate;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface CostRecord extends BaseEntity {
  resourceType: "server" | "database" | "container" | "storage" | "network" | "other";
  resourceId: UUID;
  amount: number;
  currency: string;
  period: string;
  provider: string;
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

export interface InfrastructureEvent extends BaseEntity {
  type: string;
  source: string;
  data: Record<string, unknown>;
  correlationId?: UUID;
}

export interface InfrastructureOverview {
  environments: { total: number; active: number };
  servers: { total: number; active: number };
  databases: { total: number; active: number };
  networks: { total: number; active: number };
  containers: { total: number; active: number };
  deployments: { total: number; active: number; completed: number; failed: number };
  incidents: { open: number; resolved: number };
  cost: { total: number; currency: string; period: string };
}

export interface InfrastructureState {
  servers: Server[];
  databases: Database[];
  networks: Network[];
  containers: Container[];
  deployments: Deployment[];
  deploymentRuns: DeploymentRun[];
  environments: Environment[];
  cloudProviders: CloudProvider[];
  storageBuckets: StorageBucket[];
  queueResources: QueueResource[];
  secrets: Secret[];
  configVariables: ConfigVariable[];
  monitoringMetrics: MonitoringMetric[];
  alertRules: AlertRule[];
  incidents: Incident[];
  backupJobs: BackupJob[];
  restoreJobs: RestoreJob[];
  costRecords: CostRecord[];
  events: InfrastructureEvent[];
  auditLogs: AuditLog[];
}
