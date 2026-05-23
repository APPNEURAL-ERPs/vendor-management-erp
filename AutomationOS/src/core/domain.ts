export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "automation_manager" | "operator" | "approver" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived";

export interface BaseEntity {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type WorkflowStatus = "draft" | "active" | "paused" | "archived";
export type AutomationTriggerType = "manual" | "event" | "schedule" | "webhook";
export type FilterOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "in" | "exists" | "not_exists";

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value?: unknown;
}

export interface TriggerDefinition {
  type: AutomationTriggerType;
  eventType?: string;
  source?: string;
  webhookPath?: string;
  scheduleKey?: string;
  filters: FilterCondition[];
  config?: Record<string, unknown>;
}

export type WorkflowStepType = "action" | "condition" | "approval" | "delay" | "end";
export type ActionType =
  | "send_notification"
  | "create_task"
  | "webhook_call"
  | "emit_event"
  | "update_record"
  | "set_variable"
  | "log";

export interface ActionDefinition {
  type: ActionType;
  config: Record<string, unknown>;
}

export interface WorkflowStep {
  id: UUID;
  key: string;
  name: string;
  type: WorkflowStepType;
  action?: ActionDefinition;
  filters?: FilterCondition[];
  nextStepId?: UUID;
  onSuccessStepId?: UUID;
  onFailureStepId?: UUID;
  onTrueStepId?: UUID;
  onFalseStepId?: UUID;
  delaySeconds?: number;
  approverRole?: Role;
  approverUserIds?: UUID[];
  dueInHours?: number;
  titleTemplate?: string;
  descriptionTemplate?: string;
  config?: Record<string, unknown>;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffSeconds: number;
}

export interface WorkflowDefinition extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  version: number;
  status: WorkflowStatus;
  tags: string[];
  trigger: TriggerDefinition;
  variables: Record<string, unknown>;
  steps: WorkflowStep[];
  retryPolicy: RetryPolicy;
  timeoutSeconds: number;
  createdBy: UUID;
  updatedBy?: UUID;
}

export type ExecutionStatus = "running" | "waiting_approval" | "completed" | "failed" | "cancelled";
export type ExecutionLogStatus = "info" | "success" | "warning" | "error";

export interface ExecutionLogEntry {
  id: UUID;
  stepId?: UUID;
  stepKey?: string;
  status: ExecutionLogStatus;
  message: string;
  data?: Record<string, unknown>;
  createdAt: ISODate;
}

export interface AutomationExecution extends BaseEntity {
  workflowId: UUID;
  workflowKey: string;
  workflowVersion: number;
  triggerType: AutomationTriggerType;
  triggerEventId?: UUID;
  status: ExecutionStatus;
  startedAt: ISODate;
  completedAt?: ISODate;
  currentStepId?: UUID;
  input: Record<string, unknown>;
  context: Record<string, unknown>;
  logs: ExecutionLogEntry[];
  approvalIds: UUID[];
  taskIds: UUID[];
  error?: string;
}

export type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled" | "expired";

export interface ApprovalRequest extends BaseEntity {
  workflowId?: UUID;
  executionId?: UUID;
  stepId?: UUID;
  title: string;
  description?: string;
  status: ApprovalStatus;
  requestedBy: UUID;
  approverRole?: Role;
  approverUserIds: UUID[];
  decisionBy?: UUID;
  decisionAt?: ISODate;
  decisionNote?: string;
  dueAt?: ISODate;
  payload: Record<string, unknown>;
  resumeStepId?: UUID;
  rejectStepId?: UUID;
}

export type TaskStatus = "open" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "normal" | "high" | "urgent";

export interface AutomationTask extends BaseEntity {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeRole?: Role;
  assigneeId?: UUID;
  workflowId?: UUID;
  executionId?: UUID;
  dueAt?: ISODate;
  payload: Record<string, unknown>;
  completedAt?: ISODate;
}

export interface AutomationSchedule extends BaseEntity {
  key: string;
  name: string;
  workflowId: UUID;
  expression: string;
  enabled: boolean;
  payload: Record<string, unknown>;
  lastRunAt?: ISODate;
  nextRunAt?: ISODate;
}

export type ConnectorType = "http" | "email" | "slack" | "whatsapp" | "internal";

export interface AutomationConnector extends BaseEntity {
  name: string;
  type: ConnectorType;
  status: EntityStatus;
  config: Record<string, unknown>;
}

export type NotificationStatus = "queued" | "sent" | "failed";

export interface AutomationNotification extends BaseEntity {
  channel: "email" | "sms" | "whatsapp" | "slack" | "in_app";
  recipient: string;
  subject?: string;
  message: string;
  status: NotificationStatus;
  workflowId?: UUID;
  executionId?: UUID;
  metadata: Record<string, unknown>;
}

export interface AutomationEvent extends BaseEntity {
  type: string;
  source: string;
  actorId?: UUID;
  role?: Role;
  correlationId?: string;
  data: Record<string, unknown>;
  handledExecutionIds: UUID[];
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

export interface AutomationOverview {
  workflows: { total: number; active: number; paused: number; draft: number; archived: number };
  executions: { total: number; running: number; waitingApproval: number; completed: number; failed: number; cancelled: number };
  approvals: { total: number; pending: number; approved: number; rejected: number };
  tasks: { total: number; open: number; inProgress: number; completed: number; cancelled: number };
  events: { total: number };
  notifications: { total: number; sent: number; queued: number; failed: number };
}

export interface AutomationState {
  workflows: WorkflowDefinition[];
  executions: AutomationExecution[];
  approvals: ApprovalRequest[];
  tasks: AutomationTask[];
  schedules: AutomationSchedule[];
  connectors: AutomationConnector[];
  notifications: AutomationNotification[];
  events: AutomationEvent[];
  auditLogs: AuditLog[];
}

export interface RequestActor {
  tenantId: TenantId;
  userId: UUID;
  role: Role;
}
