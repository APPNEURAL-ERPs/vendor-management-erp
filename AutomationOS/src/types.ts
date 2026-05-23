export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "automation_admin" | "automation_operator" | "workflow_builder" | "viewer";
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

export interface WorkflowStep extends BaseEntity {
  workflowId: UUID;
  stepIndex: number;
  name: string;
  type: "action" | "condition" | "approval" | "delay" | "http" | "notification" | "ai_agent" | "transform";
  config: Record<string, unknown>;
  condition?: WorkflowCondition;
  retryPolicy?: RetryPolicy;
  timeoutSeconds?: number;
  status: EntityStatus;
}

export interface WorkflowCondition {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "exists" | "not_exists";
  value?: unknown;
  logic?: "and" | "or";
  conditions?: WorkflowCondition[];
}

export interface Workflow extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  version: number;
  triggerId?: UUID;
  steps: WorkflowStep[];
  variables: Record<string, unknown>;
  tags: string[];
  publishedAt?: ISODate;
  createdBy: UUID;
  lastRunAt?: ISODate;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
}

export type TriggerType = "webhook" | "schedule" | "event" | "manual" | "api" | "form_submission" | "email" | "database" | "file_upload";

export interface Trigger extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  type: TriggerType;
  workflowId?: UUID;
  config: Record<string, unknown>;
  filters: TriggerFilter[];
  enabled: boolean;
  createdBy: UUID;
  lastFiredAt?: ISODate;
  fireCount: number;
}

export interface TriggerFilter {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "exists" | "not_exists";
  value?: unknown;
}

export type ActionType = "send_email" | "send_sms" | "send_notification" | "create_task" | "update_crm" | "generate_pdf" | "create_ticket" | "update_database" | "call_api" | "assign_user" | "add_tag" | "change_status" | "export_data" | "whatsapp" | "webhook" | "http" | "transform";

export interface Action extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  type: ActionType;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  config: Record<string, unknown>;
  retryPolicy?: RetryPolicy;
  timeoutSeconds?: number;
  createdBy: UUID;
}

export interface RetryPolicy {
  maxRetries: number;
  retryDelaySeconds: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
}

export interface Schedule extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  workflowId?: UUID;
  cronExpression?: string;
  timezone: string;
  intervalSeconds?: number;
  startAt?: ISODate;
  endAt?: ISODate;
  enabled: boolean;
  lastExecutedAt?: ISODate;
  nextExecutionAt?: ISODate;
  executionCount: number;
  createdBy: UUID;
}

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired" | "cancelled";

export interface ApprovalStep extends BaseEntity {
  approvalId: UUID;
  stepIndex: number;
  name: string;
  approverType: "user" | "role" | "group" | "dynamic";
  approverId?: UUID;
  approverRole?: string;
  approverGroupId?: UUID;
  dynamicApproverExpression?: string;
  slaHours?: number;
  reminderHours?: number;
  escalationUserId?: UUID;
  escalationRole?: string;
  status: ApprovalStatus;
  decidedAt?: ISODate;
  decidedBy?: UUID;
  notes?: string;
}

export interface Approval extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: ApprovalStatus;
  workflowId?: UUID;
  workflowRunId?: UUID;
  requesterId: UUID;
  requesterName?: string;
  data: Record<string, unknown>;
  steps: ApprovalStep[];
  currentStepIndex: number;
  finalDecision?: ApprovalStatus;
  decidedAt?: ISODate;
  decidedBy?: UUID;
  expiresAt?: ISODate;
  createdBy: UUID;
}

export type RunStatus = "pending" | "running" | "completed" | "failed" | "cancelled" | "paused";

export interface StepRun extends BaseEntity {
  workflowRunId: UUID;
  stepId: UUID;
  stepIndex: number;
  stepName: string;
  status: RunStatus;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt?: ISODate;
  completedAt?: ISODate;
  retryCount: number;
  latencyMs?: number;
}

export interface AutomationRun extends BaseEntity {
  workflowId: UUID;
  workflowKey: string;
  triggerId?: UUID;
  triggerType?: TriggerType;
  status: RunStatus;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  stepRuns: StepRun[];
  startedAt?: ISODate;
  completedAt?: ISODate;
  durationMs?: number;
  retryCount: number;
  userId?: UUID;
  correlationId?: UUID;
  metadata: Record<string, unknown>;
}

export interface WebhookEndpoint extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  workflowId?: UUID;
  triggerId?: UUID;
  secret?: string;
  allowedOrigins?: string[];
  authenticationType?: "none" | "api_key" | "bearer" | "signature";
  createdBy: UUID;
  lastReceivedAt?: ISODate;
  receivedCount: number;
}

export interface AutomationEvent extends BaseEntity {
  type: string;
  source: string;
  data: Record<string, unknown>;
  correlationId?: UUID;
  workflowRunId?: UUID;
}

export interface AutomationLog extends BaseEntity {
  workflowRunId?: UUID;
  stepRunId?: UUID;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  data?: Record<string, unknown>;
  actorId?: UUID;
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

export interface AutomationOverview {
  workflows: { total: number; active: number; draft: number };
  triggers: { total: number; active: number };
  actions: { total: number; active: number };
  schedules: { total: number; active: number };
  approvals: { total: number; pending: number; approved: number; rejected: number };
  runs: { total: number; completed: number; failed: number; running: number };
  webhookEndpoints: { total: number; active: number };
}

export interface AutomationState {
  workflows: Workflow[];
  triggers: Trigger[];
  actions: Action[];
  schedules: Schedule[];
  approvals: Approval[];
  runs: AutomationRun[];
  webhookEndpoints: WebhookEndpoint[];
  events: AutomationEvent[];
  logs: AutomationLog[];
  auditLogs: AuditLog[];
}
