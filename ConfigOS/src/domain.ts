export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role =
  | "owner"
  | "admin"
  | "config_admin"
  | "config_manager"
  | "config_viewer"
  | "tenant_admin"
  | "auditor";

export type EntityStatus = "active" | "inactive" | "archived" | "draft";

export type EnvironmentType =
  | "local"
  | "development"
  | "staging"
  | "preview"
  | "production"
  | "sandbox"
  | "enterprise-isolated"
  | "demo"
  | "test"
  | "global";

export type ConfigStatus = "draft" | "pending_approval" | "approved" | "published" | "rolled_back" | "deprecated";

export type ApprovalStatus = "pending" | "approved" | "rejected";

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

export interface Config extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  value: unknown;
  valueType: "string" | "number" | "boolean" | "object" | "array";
  environment: EnvironmentType;
  scope: "global" | "module" | "tenant" | "user";
  moduleId?: string;
  status: ConfigStatus;
  tags: string[];
  schema?: ConfigSchema;
  defaultValue?: unknown;
  sensitive: boolean;
  approvalRequired: boolean;
  version: number;
  createdBy: UUID;
  updatedBy?: UUID;
}

export interface ConfigSchema {
  type: string;
  required?: string[];
  properties?: Record<string, any>;
  default?: unknown;
  constraints?: ConfigConstraints;
}

export interface ConfigConstraints {
  min?: number;
  max?: number;
  pattern?: string;
  enum?: unknown[];
}

export interface FeatureFlag extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  environment: EnvironmentType;
  rolloutPercentage?: number;
  targetTenants?: UUID[];
  targetRoles?: string[];
  targetPlans?: string[];
  status: EntityStatus;
  killSwitch: boolean;
  tags: string[];
  createdBy: UUID;
  metadata?: Record<string, unknown>;
}

export interface FeatureFlagRule {
  ruleId: UUID;
  condition: string;
  value: unknown;
  priority: number;
}

export interface EnvironmentConfig extends BaseEntity {
  key: string;
  name: string;
  environment: EnvironmentType;
  values: Record<string, unknown>;
  status: EntityStatus;
  tags: string[];
  createdBy: UUID;
  updatedBy?: UUID;
}

export interface TenantSetting extends BaseEntity {
  tenantId: TenantId;
  key: string;
  name: string;
  value: unknown;
  valueType: "string" | "number" | "boolean" | "object" | "array";
  category: "branding" | "feature" | "billing" | "notification" | "security" | "integration" | "custom";
  status: EntityStatus;
  inherited: boolean;
  overrideGlobal: boolean;
  tags: string[];
  createdBy: UUID;
  updatedBy?: UUID;
}

export interface RuntimeOverride extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  moduleId?: string;
  target: string;
  value: unknown;
  valueType: "string" | "number" | "boolean" | "object" | "array";
  environment: EnvironmentType;
  priority: number;
  status: EntityStatus;
  expiresAt?: ISODate;
  createdBy: UUID;
  metadata?: Record<string, unknown>;
}

export interface ConfigVersion extends BaseEntity {
  configId: UUID;
  version: number;
  value: unknown;
  changedBy: UUID;
  changeReason?: string;
  status: ConfigStatus;
  approvedBy?: UUID;
  approvedAt?: ISODate;
  publishedAt?: ISODate;
  tags: string[];
}

export interface ConfigApproval extends BaseEntity {
  configId: UUID;
  version: number;
  requestedBy: UUID;
  requestedAt: ISODate;
  status: ApprovalStatus;
  reviewedBy?: UUID;
  reviewedAt?: ISODate;
  comments?: string;
  approvalType: "standard" | "emergency" | "sensitive";
}

export interface ConfigRollback extends BaseEntity {
  configId: UUID;
  fromVersion: number;
  toVersion: number;
  reason: string;
  performedBy: UUID;
  status: "success" | "failed";
  impactAssessment?: string;
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

export interface ConfigOverview {
  configs: {
    total: number;
    active: number;
    draft: number;
    pendingApproval: number;
  };
  featureFlags: {
    total: number;
    enabled: number;
    disabled: number;
  };
  environments: {
    total: number;
    active: number;
  };
  tenants: {
    total: number;
    withOverrides: number;
  };
  recentChanges: number;
  rollbackCount: number;
}

export interface ConfigState {
  configs: Config[];
  featureFlags: FeatureFlag[];
  environmentConfigs: EnvironmentConfig[];
  tenantSettings: TenantSetting[];
  runtimeOverrides: RuntimeOverride[];
  configVersions: ConfigVersion[];
  configApprovals: ConfigApproval[];
  configRollbacks: ConfigRollback[];
  auditLogs: AuditLog[];
}
