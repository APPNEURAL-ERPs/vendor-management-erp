export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "secret_admin" | "secret_manager" | "security_analyst" | "auditor" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";
export type SecretStatus = "active" | "rotated" | "disabled" | "deleted" | "expired" | "compromised";
export type SecretType = "api_key" | "oauth_token" | "jwt_secret" | "database_credential" | "cloud_credential" | "payment_key" | "webhook_secret" | "certificate" | "encryption_key" | "environment_variable" | "generic";
export type AccessLevel = "none" | "read" | "write" | "reveal" | "admin";

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

export interface Secret extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: SecretType;
  environment: "local" | "development" | "staging" | "preview" | "production" | "sandbox" | "enterprise-isolated";
  status: SecretStatus;
  maskedValue: string;
  tags: string[];
  ownerId?: UUID;
  rotationPolicyId?: UUID;
  expiresAt?: ISODate;
  lastRotatedAt?: ISODate;
  lastAccessedAt?: ISODate;
  usageCount: number;
  dependencies: SecretDependency[];
  metadata: Record<string, unknown>;
  createdBy: UUID;
  updatedBy?: UUID;
}

export interface SecretVersion extends BaseEntity {
  secretId: UUID;
  version: number;
  maskedValue: string;
  status: "active" | "superseded" | "deleted";
  rotatedAt: ISODate;
  rotatedBy: UUID;
  expiresAt?: ISODate;
}

export interface SecretDependency extends BaseEntity {
  secretId: UUID;
  dependencyType: "service" | "module" | "workflow" | "tenant" | "integration" | "ci_cd";
  dependencyId?: UUID;
  dependencyName: string;
  status: "active" | "removed" | "unknown";
  lastVerifiedAt?: ISODate;
}

export interface RotationPolicy extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  intervalDays: number;
  autoRotate: boolean;
  approvalRequired: boolean;
  notifyBeforeDays: number;
  status: EntityStatus;
  createdBy: UUID;
}

export interface RotationRun extends BaseEntity {
  secretId: UUID;
  policyId?: UUID;
  previousVersion: number;
  newVersion: number;
  status: "pending" | "in_progress" | "completed" | "failed" | "rolled_back";
  initiatedBy: UUID;
  approvedBy?: UUID;
  completedAt?: ISODate;
  rollbackReason?: string;
}

export interface AccessGrant extends BaseEntity {
  secretId: UUID;
  granteeId: UUID;
  granteeType: "user" | "service_account" | "ci_cd_pipeline" | "workflow" | "tenant";
  accessLevel: AccessLevel;
  reason?: string;
  approvedBy?: UUID;
  expiresAt?: ISODate;
  status: "active" | "expired" | "revoked";
  lastAccessedAt?: ISODate;
  accessCount: number;
}

export interface AccessRequest extends BaseEntity {
  secretId: UUID;
  requesterId: UUID;
  requestedLevel: AccessLevel;
  reason: string;
  status: "pending" | "approved" | "denied" | "cancelled";
  reviewedBy?: UUID;
  reviewedAt?: ISODate;
  notes?: string;
  approvalEvidence?: string;
}

export interface SecretAuditLog extends BaseEntity {
  secretId: UUID;
  actorId: UUID;
  actorRole: Role;
  action: "created" | "updated" | "rotated" | "revealed" | "accessed" | "revoked" | "deleted" | "exported" | "access_granted" | "access_revoked";
  accessLevel?: AccessLevel;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
}

export interface LeakEvent extends BaseEntity {
  secretId: UUID;
  leakType: "git_commit" | "log_file" | "prompt" | "document" | "webhook_payload" | "ci_cd" | "public_repo" | "screenshot" | "support_ticket";
  severity: "low" | "medium" | "high" | "critical";
  source: string;
  detectedAt: ISODate;
  status: "detected" | "investigating" | "contained" | "resolved" | "false_positive";
  responseActions: string[];
  affectedVersions: number[];
}

export interface SecretRisk extends BaseEntity {
  secretId: UUID;
  riskType: "expired" | "no_rotation" | "no_owner" | "overprivileged" | "unused" | "shared" | "hardcoded" | "public_exposure" | "weak_secret";
  severity: "low" | "medium" | "high" | "critical";
  score: number;
  description: string;
  recommendations: string[];
  status: "open" | "accepted" | "resolved";
  resolvedAt?: ISODate;
  resolvedBy?: UUID;
}

export interface APIKey extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  ownerId: UUID;
  ownerType: "user" | "service_account" | "tenant" | "module";
  keyPrefix: string;
  keyHash: string;
  type: "public" | "private" | "tenant" | "service" | "developer" | "integration" | "webhook" | "temporary";
  scopes: string[];
  environment: "local" | "development" | "staging" | "preview" | "production" | "sandbox" | "enterprise-isolated";
  status: "active" | "revoked" | "expired";
  expiresAt?: ISODate;
  lastUsedAt?: ISODate;
  usageCount: number;
  createdBy: UUID;
  revokedAt?: ISODate;
}

export interface Credential extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "database" | "cloud" | "oauth" | "service_account" | "certificate" | "token";
  provider: string;
  environment: "local" | "development" | "staging" | "preview" | "production" | "sandbox" | "enterprise-isolated";
  status: "active" | "rotated" | "disabled" | "deleted";
  maskedValue: string;
  username?: string;
  rotationPolicyId?: UUID;
  expiresAt?: ISODate;
  lastRotatedAt?: ISODate;
  metadata: Record<string, unknown>;
  createdBy: UUID;
}

export interface EncryptionKey extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  algorithm: "AES-256-GCM" | "RSA-2048" | "RSA-4096" | "EC-P256" | "EC-P384";
  status: "active" | "rotated" | "disabled" | "deleted";
  rotationPolicyId?: UUID;
  expiresAt?: ISODate;
  lastRotatedAt?: ISODate;
  createdBy: UUID;
  metadata: Record<string, unknown>;
}

export interface SecretIncident extends BaseEntity {
  incidentType: "leak_detected" | "compromise_suspected" | "unauthorized_access" | "rotation_failed" | "expiry_ignored";
  secretId: UUID;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "contained" | "resolved";
  title: string;
  description?: string;
  affectedServices: string[];
  responseActions: string[];
  timeline: IncidentTimelineEntry[];
  createdBy: UUID;
  resolvedAt?: ISODate;
  resolvedBy?: UUID;
}

export interface IncidentTimelineEntry {
  timestamp: ISODate;
  action: string;
  actorId: UUID;
  actorName?: string;
  notes?: string;
}

export interface SecretPolicy extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  policyType: "naming" | "rotation" | "access" | "storage" | "retention" | "incident";
  rules: Record<string, unknown>;
  status: EntityStatus;
  severity: "low" | "medium" | "high" | "critical";
  enforced: boolean;
  createdBy: UUID;
}

export interface SecretBackup extends BaseEntity {
  secretId: UUID;
  encryptedBackup: string;
  backupVersion: number;
  status: "active" | "restored" | "expired";
  createdBy: UUID;
  expiresAt?: ISODate;
}

export interface SecretUsage extends BaseEntity {
  secretId: UUID;
  accessorType: "user" | "service" | "workflow" | "ci_cd" | "tenant" | "integration";
  accessorId?: UUID;
  accessorName?: string;
  accessedAt: ISODate;
  accessType: "read" | "reveal" | "rotate" | "update";
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface SecretNamespace extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  namespaceType: "tenant" | "environment" | "module" | "project" | "custom";
  parentId?: UUID;
  secretCount: number;
  status: EntityStatus;
  createdBy: UUID;
}

export interface SecretOSState {
  secrets: Secret[];
  secretVersions: SecretVersion[];
  dependencies: SecretDependency[];
  rotationPolicies: RotationPolicy[];
  rotationRuns: RotationRun[];
  accessGrants: AccessGrant[];
  accessRequests: AccessRequest[];
  auditLogs: SecretAuditLog[];
  leakEvents: LeakEvent[];
  secretRisks: SecretRisk[];
  apiKeys: APIKey[];
  credentials: Credential[];
  encryptionKeys: EncryptionKey[];
  incidents: SecretIncident[];
  policies: SecretPolicy[];
  backups: SecretBackup[];
  usage: SecretUsage[];
  namespaces: SecretNamespace[];
}

export interface SecretOverview {
  total: number;
  active: number;
  expired: number;
  rotated: number;
  compromised: number;
  dueForRotation: number;
  highRisk: number;
  healthScore: number;
  byType: Record<string, number>;
  byEnvironment: Record<string, number>;
}

export interface SecretDashboard {
  overview: SecretOverview;
  recentActivity: SecretUsage[];
  expiringSoon: Secret[];
  highRisk: SecretRisk[];
  pendingRequests: AccessRequest[];
  rotationDue: Secret[];
  recentAudits: SecretAuditLog[];
}
