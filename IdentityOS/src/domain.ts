export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type ApiRole = "owner" | "admin" | "identity_admin" | "user_manager" | "security_admin" | "viewer" | "auditor";
export type UserStatus = "invited" | "active" | "inactive" | "suspended" | "locked" | "deleted" | "archived" | "pending_verification";
export type AccountType = "personal" | "business" | "tenant" | "admin" | "developer" | "student" | "client" | "partner" | "support" | "service";
export type AccountStatus = "active" | "inactive" | "suspended" | "locked" | "deleted";
export type SessionStatus = "active" | "revoked" | "expired";
export type DeviceStatus = "trusted" | "untrusted" | "revoked";
export type MFAFactorType = "totp" | "sms" | "email" | "backup_code" | "security_key" | "passkey";
export type MFAFactorStatus = "active" | "inactive" | "revoked";
export type RoleStatus = "active" | "inactive" | "archived";
export type PermissionStatus = "active" | "inactive" | "archived";
export type RoleAssignmentStatus = "active" | "expired" | "revoked";
export type InvitationStatus = "draft" | "sent" | "accepted" | "expired" | "revoked" | "rejected" | "pending_approval";
export type SSOProviderType = "saml" | "oidc" | "google" | "microsoft" | "github" | "linkedin" | "facebook";
export type SSOProviderStatus = "active" | "inactive";
export type APIKeyStatus = "active" | "revoked" | "expired";
export type ServiceAccountStatus = "active" | "inactive" | "locked";
export type AccessReviewStatus = "draft" | "active" | "completed";
export type AccessReviewItemStatus = "pending" | "approved" | "revoked" | "needs_change";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type OrganizationStatus = "active" | "inactive" | "suspended";
export type IdentityEventType = "user" | "role" | "permission" | "session" | "mfa" | "sso" | "api_key" | "access_review" | "risk";

export interface RequestActor {
  tenantId: TenantId;
  userId: UUID;
  role: ApiRole;
}

export interface BaseEntity {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface User extends BaseEntity {
  email: string;
  username?: string;
  displayName: string;
  phone?: string;
  avatar?: string;
  status: UserStatus;
  primaryRoleId?: UUID;
  primaryAccountId?: UUID;
  tenantId: TenantId;
  organizationId?: UUID;
  mfaEnabled: boolean;
  mfaVerified: boolean;
  passwordHash?: string;
  passwordChangedAt?: ISODate;
  passwordExpiresAt?: ISODate;
  lastLoginAt?: ISODate;
  lastLoginIp?: string;
  failedLoginAttempts: number;
  lockedAt?: ISODate;
  riskScore: number;
  riskLevel: RiskLevel;
  verifiedAt?: ISODate;
  metadata: Record<string, unknown>;
  createdBy: UUID;
}

export interface Account extends BaseEntity {
  userId: UUID;
  type: AccountType;
  name: string;
  status: AccountStatus;
  email?: string;
  phone?: string;
  metadata: Record<string, unknown>;
  createdBy: UUID;
}

export interface TenantIdentity extends BaseEntity {
  tenantId: TenantId;
  userId: UUID;
  email: string;
  displayName: string;
  status: UserStatus;
  primary: boolean;
  roleId?: UUID;
  createdBy: UUID;
}

export interface OrganizationIdentity extends BaseEntity {
  organizationId: UUID;
  userId: UUID;
  email: string;
  displayName: string;
  status: UserStatus;
  roleId?: UUID;
  department?: string;
  title?: string;
  createdBy: UUID;
}

export interface Organization extends BaseEntity {
  name: string;
  displayName: string;
  domain?: string;
  status: OrganizationStatus;
  type: "company" | "agency" | "college" | "institute" | "restaurant" | "saas" | "partner" | "client";
  verified: boolean;
  verifiedAt?: ISODate;
  metadata: Record<string, unknown>;
  createdBy: UUID;
}

export interface LoginSession extends BaseEntity {
  userId: UUID;
  tenantId: TenantId;
  status: SessionStatus;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  mfaVerified: boolean;
  refreshToken?: string;
  expiresAt: ISODate;
  revokedAt?: ISODate;
  revokedBy?: UUID;
  lastActivityAt?: ISODate;
}

export interface TrustedDevice extends BaseEntity {
  userId: UUID;
  tenantId: TenantId;
  deviceFingerprint: string;
  deviceName?: string;
  deviceType?: string;
  status: DeviceStatus;
  lastUsedAt?: ISODate;
  lastIp?: string;
  riskScore: number;
  createdBy: UUID;
}

export interface MFAFactor extends BaseEntity {
  userId: UUID;
  type: MFAFactorType;
  name?: string;
  status: MFAFactorStatus;
  phone?: string;
  email?: string;
  secret?: string;
  backupCodes?: string[];
  createdAt: ISODate;
  lastUsedAt?: ISODate;
  createdBy: UUID;
}

export interface Role extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: RoleStatus;
  permissions: string[];
  system: boolean;
  isDefault: boolean;
  metadata: Record<string, unknown>;
  createdBy: UUID;
}

export interface Permission extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: PermissionStatus;
  category?: string;
  resource?: string;
  action?: string;
  createdBy: UUID;
}

export interface RoleAssignment extends BaseEntity {
  subjectType: "user" | "group";
  subjectId: UUID;
  roleId: UUID;
  scope?: string;
  status: RoleAssignmentStatus;
  expiresAt?: ISODate;
  assignedBy: UUID;
  revokedAt?: ISODate;
  revokedBy?: UUID;
}

export interface Group extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: RoleStatus;
  members: UUID[];
  roleIds: UUID[];
  isDefault: boolean;
  createdBy: UUID;
}

export interface Invitation extends BaseEntity {
  email: string;
  roleId?: UUID;
  tenantId?: TenantId;
  organizationId?: UUID;
  status: InvitationStatus;
  invitedBy: UUID;
  acceptedAt?: ISODate;
  expiresAt: ISODate;
  acceptedUserId?: UUID;
  metadata: Record<string, unknown>;
}

export interface SSOProvider extends BaseEntity {
  key: string;
  name: string;
  type: SSOProviderType;
  status: SSOProviderStatus;
  clientId?: string;
  clientSecret?: string;
  issuerUrl?: string;
  metadata: Record<string, unknown>;
  createdBy: UUID;
}

export interface APIKey extends BaseEntity {
  ownerId: UUID;
  name: string;
  keyPrefix: string;
  keyHash: string;
  scopes: string[];
  status: APIKeyStatus;
  expiresAt?: ISODate;
  lastUsedAt?: ISODate;
  createdBy: UUID;
  revokedAt?: ISODate;
  revokedBy?: UUID;
}

export interface ServiceAccount extends BaseEntity {
  name: string;
  description?: string;
  status: ServiceAccountStatus;
  permissions: string[];
  keyPrefix: string;
  keyHash: string;
  rotationRequired: boolean;
  rotationDays?: number;
  lastRotatedAt?: ISODate;
  expiresAt?: ISODate;
  createdBy: UUID;
}

export interface IdentityAuditLog extends BaseEntity {
  actorId: UUID;
  actorEmail?: string;
  role: ApiRole;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
  userAgent?: string;
  tenantId: TenantId;
  metadata: Record<string, unknown>;
}

export interface AccessReview extends BaseEntity {
  name: string;
  description?: string;
  status: AccessReviewStatus;
  reviewerId: UUID;
  dueAt?: ISODate;
  completedAt?: ISODate;
  items: AccessReviewItem[];
  createdBy: UUID;
}

export interface AccessReviewItem {
  id: UUID;
  subjectId: UUID;
  subjectType: "user" | "service_account";
  roleId: UUID;
  roleName?: string;
  assignmentId?: UUID;
  status: AccessReviewItemStatus;
  decisionBy?: UUID;
  decisionAt?: ISODate;
  notes?: string;
  riskLevel?: RiskLevel;
}

export interface IdentityRiskEvent extends BaseEntity {
  userId: UUID;
  tenantId: TenantId;
  eventType: string;
  severity: RiskLevel;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, unknown>;
  resolvedAt?: ISODate;
  resolvedBy?: UUID;
}

export interface IdentityEvent extends BaseEntity {
  type: IdentityEventType;
  source: string;
  actorId: UUID;
  data: Record<string, unknown>;
  correlationId?: UUID;
}

export interface IdentityPolicy extends BaseEntity {
  name: string;
  description?: string;
  type: "password" | "session" | "mfa" | "login" | "api_key" | "access_review";
  rules: Record<string, unknown>;
  status: RoleStatus;
  createdBy: UUID;
}

export interface IdentityState {
  users: User[];
  accounts: Account[];
  tenantIdentities: TenantIdentity[];
  organizationIdentities: OrganizationIdentity[];
  organizations: Organization[];
  sessions: LoginSession[];
  trustedDevices: TrustedDevice[];
  mfaFactors: MFAFactor[];
  roles: Role[];
  permissions: Permission[];
  roleAssignments: RoleAssignment[];
  groups: Group[];
  invitations: Invitation[];
  ssoProviders: SSOProvider[];
  apiKeys: APIKey[];
  serviceAccounts: ServiceAccount[];
  auditLogs: IdentityAuditLog[];
  accessReviews: AccessReview[];
  riskEvents: IdentityRiskEvent[];
  events: IdentityEvent[];
  policies: IdentityPolicy[];
}

export interface IdentityOverview {
  users: { total: number; active: number; invited: number; locked: number; byStatus: Record<string, number> };
  sessions: { active: number; expired: number };
  mfa: { enabled: number; coveragePercent: number };
  roles: { total: number; active: number };
  permissions: { total: number };
  invitations: { pending: number; accepted: number; expired: number };
  accessReviews: { active: number; completed: number };
  riskEvents: { open: number; bySeverity: Record<string, number> };
  apiKeys: { active: number; expired: number };
  serviceAccounts: { active: number };
}
