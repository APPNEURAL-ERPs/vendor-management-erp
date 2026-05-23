export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role =
  | "owner"
  | "admin"
  | "platform_admin"
  | "architect"
  | "ops_manager"
  | "integration_manager"
  | "auditor"
  | "viewer";

export type EntityStatus = "planned" | "active" | "maintenance" | "deprecated" | "archived";
export type EnvironmentType = "dev" | "test" | "staging" | "prod";
export type HealthStatus = "healthy" | "degraded" | "down" | "unknown";
export type DeploymentStatus = "planned" | "deploying" | "succeeded" | "failed" | "rolled_back";
export type IntegrationStatus = "draft" | "active" | "paused" | "error" | "archived";
export type ReleaseStatus = "draft" | "scheduled" | "released" | "rolled_back" | "cancelled";

export interface BaseEntity {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface RequestActor {
  tenantId: TenantId;
  userId: UUID;
  role: Role;
}

export interface PlatformProfile extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  region: string;
  primaryDomain?: string;
  ownerTeam: string;
  status: EntityStatus;
  metadata: Record<string, unknown>;
  updatedBy: UUID;
}

export interface OSService extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  category: string;
  ownerTeam: string;
  baseUrl?: string;
  version: string;
  status: EntityStatus;
  health: HealthStatus;
  dependencies: string[];
  capabilities: string[];
  tags: string[];
  metadata: Record<string, unknown>;
  updatedBy: UUID;
}

export interface PlatformEnvironment extends BaseEntity {
  key: string;
  name: string;
  type: EnvironmentType;
  region: string;
  domain?: string;
  status: EntityStatus;
  variables: Record<string, unknown>;
  updatedBy: UUID;
}

export interface PlatformDeployment extends BaseEntity {
  serviceKey: string;
  environmentKey: string;
  version: string;
  status: DeploymentStatus;
  commitSha?: string;
  artifactUrl?: string;
  startedAt?: ISODate;
  completedAt?: ISODate;
  deployedBy: UUID;
  notes?: string;
}

export interface PlatformIntegration extends BaseEntity {
  key: string;
  name: string;
  sourceServiceKey: string;
  targetServiceKey: string;
  eventTypes: string[];
  status: IntegrationStatus;
  contractVersion: string;
  metadata: Record<string, unknown>;
  updatedBy: UUID;
}

export interface PlatformFeatureFlag extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutPercentage: number;
  environmentKeys: string[];
  ownerTeam: string;
  status: EntityStatus;
  updatedBy: UUID;
}

export interface PlatformRelease extends BaseEntity {
  key: string;
  title: string;
  version: string;
  status: ReleaseStatus;
  serviceKeys: string[];
  environmentKey: string;
  scheduledAt?: ISODate;
  releasedAt?: ISODate;
  notes?: string;
  createdBy: UUID;
  updatedBy?: UUID;
}

export interface HealthCheck extends BaseEntity {
  serviceKey: string;
  environmentKey: string;
  status: HealthStatus;
  latencyMs?: number;
  message?: string;
  checkedAt: ISODate;
}

export interface PlatformEvent extends BaseEntity {
  type: string;
  source: string;
  actorId?: UUID;
  role?: Role;
  correlationId?: string;
  data: Record<string, unknown>;
}

export interface AuditLog extends BaseEntity {
  action: string;
  actorId: UUID;
  role: Role;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
}

export interface PlatformOverview {
  counts: {
    profiles: number;
    services: number;
    activeServices: number;
    environments: number;
    deployments: number;
    integrations: number;
    activeIntegrations: number;
    enabledFlags: number;
    releases: number;
    unhealthyServices: number;
  };
  profile?: PlatformProfile;
  recentDeployments: PlatformDeployment[];
  unhealthyServices: OSService[];
  recentHealthChecks: HealthCheck[];
  recentEvents: PlatformEvent[];
}

export interface PlatformState {
  profiles: PlatformProfile[];
  services: OSService[];
  environments: PlatformEnvironment[];
  deployments: PlatformDeployment[];
  integrations: PlatformIntegration[];
  featureFlags: PlatformFeatureFlag[];
  releases: PlatformRelease[];
  healthChecks: HealthCheck[];
  events: PlatformEvent[];
  auditLogs: AuditLog[];
}
