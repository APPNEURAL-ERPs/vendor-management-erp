export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "resource_admin" | "resource_analyst" | "viewer";
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

export interface AIModel extends BaseEntity {
  key: string;
  name: string;
  provider: string;
  type: "chat" | "embedding" | "vision" | "audio" | "multi-modal";
  contextWindow: number;
  maxOutputTokens: number;
  inputPricePer1MTokens: number;
  outputPricePer1MTokens: number;
  status: EntityStatus;
  capabilities: Array<"chat" | "json" | "tool_calling" | "vision" | "embedding">;
  metadata: Record<string, unknown>;
}

export interface TokenBudget extends BaseEntity {
  name: string;
  description?: string;
  totalTokens: number;
  usedTokens: number;
  period: "daily" | "weekly" | "monthly" | "quarterly" | "annual" | "unlimited";
  resetAt?: ISODate;
  scope: "global" | "team" | "project" | "user";
  scopeId?: UUID;
  status: EntityStatus;
  alerts: Array<{ threshold: number; enabled: boolean }>;
  metadata: Record<string, unknown>;
}

export interface AIUsage extends BaseEntity {
  modelId: UUID;
  budgetId?: UUID;
  userId?: UUID;
  projectId?: UUID;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  latencyMs: number;
  status: "success" | "blocked" | "failed";
  error?: string;
  metadata: Record<string, unknown>;
}

export interface ModelConfig extends BaseEntity {
  name: string;
  description?: string;
  modelId: UUID;
  defaultTemperature: number;
  maxTokens?: number;
  fallbackModelIds: UUID[];
  retryAttempts: number;
  timeoutMs: number;
  customParams: Record<string, unknown>;
  status: EntityStatus;
  metadata: Record<string, unknown>;
}

export interface CostAllocation extends BaseEntity {
  name: string;
  description?: string;
  amount: number;
  currency: string;
  period: "daily" | "weekly" | "monthly" | "quarterly" | "annual";
  scope: "global" | "team" | "project" | "user";
  scopeId?: UUID;
  category: "compute" | "storage" | "api_calls" | "training" | "inference" | "other";
  allocatedBy: UUID;
  status: EntityStatus;
  metadata: Record<string, unknown>;
}

export interface QuotaLimit extends BaseEntity {
  name: string;
  limitType: "requests_per_minute" | "tokens_per_day" | "cost_per_month" | "concurrent_requests";
  limitValue: number;
  scope: "global" | "team" | "project" | "user";
  scopeId?: UUID;
  modelId?: UUID;
  status: EntityStatus;
  metadata: Record<string, unknown>;
}

export interface AIResourceEvent extends BaseEntity {
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

export interface AIResourceOverview {
  models: { total: number; active: number };
  budgets: { total: number; active: number };
  usage: { totalRequests: number; totalTokens: number; totalCost: number };
  allocations: { total: number; active: number };
  quotas: { total: number; active: number };
  byModel: Array<{ modelId: UUID; modelName: string; requests: number; tokens: number; cost: number }>;
  byProject: Array<{ projectId?: UUID; requests: number; tokens: number; cost: number }>;
}

export interface AIResourceState {
  models: AIModel[];
  budgets: TokenBudget[];
  usage: AIUsage[];
  configs: ModelConfig[];
  allocations: CostAllocation[];
  quotas: QuotaLimit[];
  events: AIResourceEvent[];
  auditLogs: AuditLog[];
}
