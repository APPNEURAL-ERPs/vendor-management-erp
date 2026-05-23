export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role =
  | "owner"
  | "admin"
  | "tool_admin"
  | "tool_developer"
  | "tool_operator"
  | "auditor"
  | "viewer";

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

export type ToolStatus = "draft" | "active" | "disabled" | "archived";
export type ToolExecutionStatus = "queued" | "running" | "succeeded" | "failed" | "blocked";
export type ToolRiskLevel = "low" | "medium" | "high" | "critical";
export type ToolKind = "generator" | "validator" | "checker" | "converter" | "enrichment" | "connector";
export type ToolPackageType = "core" | "api" | "sdk" | "cli" | "worker" | "ui";

export interface ToolManifest {
  id: string;
  name: string;
  packageName: string;
  version: string;
  category: string;
  type: ToolPackageType;
  aiSupport: {
    enabled: boolean;
    toolName?: string;
    description?: string;
  };
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  commands: string[];
  permissions: string[];
  events: {
    publishes: string[];
    subscribes: string[];
  };
  api: {
    route: string;
  };
  sdk: {
    namespace: string;
  };
  cli: {
    namespace: string;
  };
  dependencies: {
    required: string[];
    optional: string[];
  };
  safety: {
    riskLevel: ToolRiskLevel;
    requiresApproval: boolean;
    rules: string[];
  };
  usedBy: string[];
}

export interface ToolDefinition extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  kind: ToolKind;
  category: string;
  status: ToolStatus;
  riskLevel: ToolRiskLevel;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  requiredPermissions: string[];
  requiresApproval: boolean;
  rateLimitPerMinute: number;
  timeoutMs: number;
  ownerTeam: string;
  tags: string[];
  metadata: Record<string, unknown>;
  updatedBy: UUID;
}

export interface ToolExecution extends BaseEntity {
  toolKey: string;
  requestedBy: UUID;
  status: ToolExecutionStatus;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  approvalId?: UUID;
  startedAt?: ISODate;
  completedAt?: ISODate;
  durationMs?: number;
}

export interface ToolApproval extends BaseEntity {
  toolKey: string;
  executionId: UUID;
  action: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestedBy: UUID;
  decidedBy?: UUID;
  decidedAt?: ISODate;
  note?: string;
}

export interface ToolPolicy extends BaseEntity {
  toolKey: string;
  allowedRoles: Role[];
  blockedTenants: string[];
  maxCallsPerRun: number;
  maxPayloadBytes: number;
  requiresApprovalFor: string[];
}

export interface ToolCredential extends BaseEntity {
  key: string;
  toolKey: string;
  label: string;
  status: "active" | "rotating" | "revoked";
  maskedValue: string;
  updatedBy: UUID;
}

export interface ToolInstallation extends BaseEntity {
  manifestId: string;
  packageName: string;
  version: string;
  status: "installed" | "disabled" | "failed" | "uninstalled";
  installedBy: UUID;
  source: "manifest" | "generator" | "package";
  manifest: ToolManifest;
}

export interface ToolUsageMetric extends BaseEntity {
  toolKey: string;
  executionId?: UUID;
  actorId: UUID;
  status: ToolExecutionStatus;
  durationMs?: number;
  cost: number;
  metadata: Record<string, unknown>;
}

export interface ToolEvent extends BaseEntity {
  type: string;
  source: string;
  actorId?: UUID;
  role?: Role;
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

export interface ToolOverview {
  counts: {
    tools: number;
    activeTools: number;
    executions: number;
    failedExecutions: number;
    pendingApprovals: number;
    policies: number;
    credentials: number;
    installations: number;
  };
  recentTools: ToolDefinition[];
  recentExecutions: ToolExecution[];
  pendingApprovals: ToolApproval[];
  recentEvents: ToolEvent[];
}

export interface ToolState {
  tools: ToolDefinition[];
  executions: ToolExecution[];
  approvals: ToolApproval[];
  policies: ToolPolicy[];
  credentials: ToolCredential[];
  installations: ToolInstallation[];
  usageMetrics: ToolUsageMetric[];
  events: ToolEvent[];
  auditLogs: AuditLog[];
}
