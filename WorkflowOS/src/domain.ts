export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type WorkflowRole = "owner" | "admin" | "workflow_admin" | "workflow_designer" | "workflow_operator" | "workflow_viewer" | "approver" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";
export type WorkflowStatus = "draft" | "active" | "paused" | "running" | "waiting" | "completed" | "failed" | "cancelled";
export type StepStatus = "pending" | "running" | "completed" | "skipped" | "failed" | "waiting" | "retrying" | "cancelled";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "escalated" | "expired";
export type ExecutionStatus = "running" | "waiting" | "completed" | "failed" | "cancelled" | "paused";
export type TriggerType = "event" | "schedule" | "webhook" | "manual" | "api" | "form" | "file" | "email";
export type ActionType = "create" | "update" | "delete" | "notify" | "call_api" | "run_tool" | "generate_document" | "condition" | "approval" | "delay" | "ai_call" | "custom";
export type ConditionOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "not_contains" | "exists" | "not_exists" | "in" | "not_in";
export type RetryPolicyType = "fixed" | "exponential" | "linear";
export type QueuePriority = "low" | "normal" | "high" | "critical";

export interface RequestActor {
  tenantId: TenantId;
  userId: UUID;
  role: WorkflowRole;
}

export interface BaseEntity {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface WorkflowTrigger extends BaseEntity {
  workflowId: UUID;
  key: string;
  type: TriggerType;
  eventName?: string;
  scheduleCron?: string;
  webhookPath?: string;
  conditions: WorkflowCondition[];
  status: EntityStatus;
  config: Record<string, unknown>;
}

export interface WorkflowCondition {
  field: string;
  operator: ConditionOperator;
  value?: unknown;
  logic?: "and" | "or";
}

export interface WorkflowStep extends BaseEntity {
  workflowId: UUID;
  key: string;
  name: string;
  description?: string;
  type: ActionType;
  order: number;
  status: EntityStatus;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  config: Record<string, unknown>;
  retryPolicy?: RetryPolicy;
  timeout?: number;
  continueOnError: boolean;
}

export interface RetryPolicy {
  type: RetryPolicyType;
  maxAttempts: number;
  delaySeconds?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

export interface WorkflowTransition extends BaseEntity {
  workflowId: UUID;
  fromStepId: UUID;
  toStepId: UUID;
  name: string;
  conditions: WorkflowCondition[];
  priority: number;
}

export interface Approval extends BaseEntity {
  executionId: UUID;
  stepId: UUID;
  requestedBy: UUID;
  approverId?: UUID;
  approverRole?: string;
  status: ApprovalStatus;
  level: number;
  requiredApprovals: number;
  currentApprovals: number;
  reason?: string;
  decisionAt?: ISODate;
  deadline?: ISODate;
  escalationId?: UUID;
  notes?: string;
}

export interface Escalation extends BaseEntity {
  approvalId: UUID;
  fromApproverId?: UUID;
  toApproverId?: UUID;
  toApproverRole?: string;
  reason: string;
  escalatedBy: UUID;
  escalatedAt: ISODate;
  resolvedAt?: ISODate;
  status: "pending" | "resolved" | "expired";
}

export interface WorkflowDefinition extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  version: number;
  status: WorkflowStatus;
  triggerIds: UUID[];
  stepIds: UUID[];
  transitionIds: UUID[];
  variables: Record<string, unknown>;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  tags: string[];
  ownerId?: UUID;
  createdBy: UUID;
  publishedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface StepResult extends BaseEntity {
  executionId: UUID;
  stepId: UUID;
  status: StepStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error?: string;
  retryCount: number;
  startedAt?: ISODate;
  completedAt?: ISODate;
  latencyMs?: number;
  config: Record<string, unknown>;
}

export interface WorkflowExecution extends BaseEntity {
  workflowId: UUID;
  workflowKey: string;
  status: ExecutionStatus;
  triggeredBy: "trigger" | "manual" | "api" | "schedule" | "event";
  triggeredById?: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  currentStepId?: UUID;
  currentState: string;
  stepResults: UUID[];
  error?: string;
  startedAt?: ISODate;
  completedAt?: ISODate;
  estimatedDurationMs?: number;
  actualDurationMs?: number;
  retryCount: number;
  maxRetries: number;
  context: Record<string, unknown>;
  auditTrail: ExecutionAuditEntry[];
}

export interface ExecutionAuditEntry {
  timestamp: ISODate;
  stepId?: UUID;
  action: string;
  actor?: UUID;
  details?: string;
  state?: string;
}

export interface QueueItem extends BaseEntity {
  executionId: UUID;
  stepId?: UUID;
  priority: QueuePriority;
  scheduledAt: ISODate;
  startedAt?: ISODate;
  completedAt?: ISODate;
  status: "queued" | "processing" | "completed" | "failed" | "dead_letter";
  attempts: number;
  maxAttempts: number;
  error?: string;
  payload: Record<string, unknown>;
}

export interface WorkflowError extends BaseEntity {
  executionId: UUID;
  stepId?: UUID;
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  context: Record<string, unknown>;
  retryable: boolean;
  resolved: boolean;
  resolvedAt?: ISODate;
  resolvedBy?: UUID;
}

export interface AuditLog extends BaseEntity {
  actorId: UUID;
  role: WorkflowRole;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
}

export interface WorkflowTemplate extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  category: string;
  workflow: Partial<WorkflowDefinition>;
  tags: string[];
  usageCount: number;
  status: EntityStatus;
}

export interface WorkflowOverview {
  workflows: { total: number; active: number; paused: number; draft: number };
  executions: { total: number; running: number; completed: number; failed: number; waiting: number; cancelled: number };
  approvals: { pending: number; approved: number; rejected: number; escalated: number };
  escalations: { pending: number; resolved: number; expired: number };
  queue: { queued: number; processing: number; deadLetter: number };
  errors: { open: number; resolved: number };
}

export interface WorkflowState {
  workflows: WorkflowDefinition[];
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  transitions: WorkflowTransition[];
  approvals: Approval[];
  escalations: Escalation[];
  executions: WorkflowExecution[];
  stepResults: StepResult[];
  queueItems: QueueItem[];
  errors: WorkflowError[];
  auditLogs: AuditLog[];
}
