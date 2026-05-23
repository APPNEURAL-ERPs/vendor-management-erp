export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role =
  | "owner"
  | "admin"
  | "command_admin"
  | "operator"
  | "incident_commander"
  | "automation_manager"
  | "auditor"
  | "viewer";

export type EntityStatus = "draft" | "active" | "paused" | "archived";
export type CommandPriority = "low" | "normal" | "high" | "critical";
export type CommandStatus = "queued" | "running" | "waiting" | "succeeded" | "failed" | "cancelled";
export type RunbookStepType = "manual" | "http" | "script" | "approval" | "notification" | "handoff";
export type RunbookStepStatus = "pending" | "running" | "waiting" | "completed" | "failed" | "skipped";
export type ScheduleCadence = "once" | "hourly" | "daily" | "weekly" | "monthly";
export type IncidentSeverity = "sev1" | "sev2" | "sev3" | "sev4";
export type IncidentStatus = "open" | "investigating" | "mitigated" | "resolved" | "closed";

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

export interface Command extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  category: string;
  ownerTeam?: string;
  priority: CommandPriority;
  status: EntityStatus;
  requiredRole: Role;
  inputSchema: Record<string, unknown>;
  tags: string[];
  metadata: Record<string, unknown>;
  createdBy: UUID;
  updatedBy?: UUID;
}

export interface CommandExecution extends BaseEntity {
  commandId: UUID;
  commandKey: string;
  requestedBy: UUID;
  role: Role;
  status: CommandStatus;
  priority: CommandPriority;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  correlationId?: string;
  startedAt?: ISODate;
  completedAt?: ISODate;
  cancelledAt?: ISODate;
  durationMs?: number;
  logs: string[];
}

export interface RunbookStep {
  id: UUID;
  name: string;
  type: RunbookStepType;
  commandId?: UUID;
  instructions?: string;
  assigneeRole?: Role;
  timeoutMinutes?: number;
  required: boolean;
  metadata: Record<string, unknown>;
}

export interface Runbook extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  category: string;
  ownerTeam?: string;
  status: EntityStatus;
  triggers: string[];
  steps: RunbookStep[];
  tags: string[];
  createdBy: UUID;
  updatedBy?: UUID;
}

export interface RunbookRunStep extends RunbookStep {
  status: RunbookStepStatus;
  startedAt?: ISODate;
  completedAt?: ISODate;
  output?: Record<string, unknown>;
  note?: string;
}

export interface RunbookRun extends BaseEntity {
  runbookId: UUID;
  runbookKey: string;
  status: CommandStatus;
  priority: CommandPriority;
  requestedBy: UUID;
  currentStepId?: UUID;
  context: Record<string, unknown>;
  steps: RunbookRunStep[];
  startedAt?: ISODate;
  completedAt?: ISODate;
  cancelledAt?: ISODate;
}

export interface AutomationRule extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  eventType: string;
  condition: Record<string, unknown>;
  commandId?: UUID;
  runbookId?: UUID;
  cooldownMinutes: number;
  lastTriggeredAt?: ISODate;
  status: EntityStatus;
  createdBy: UUID;
  updatedBy?: UUID;
}

export interface Schedule extends BaseEntity {
  key: string;
  name: string;
  cadence: ScheduleCadence;
  timezone: string;
  nextRunAt: ISODate;
  commandId?: UUID;
  runbookId?: UUID;
  input: Record<string, unknown>;
  enabled: boolean;
  status: EntityStatus;
  createdBy: UUID;
  updatedBy?: UUID;
}

export interface Incident extends BaseEntity {
  key: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  commanderUserId?: UUID;
  summary?: string;
  relatedRunbookRunIds: UUID[];
  relatedExecutionIds: UUID[];
  timeline: IncidentTimelineItem[];
  openedAt: ISODate;
  resolvedAt?: ISODate;
  closedAt?: ISODate;
}

export interface IncidentTimelineItem {
  id: UUID;
  at: ISODate;
  actorId: UUID;
  message: string;
}

export interface CommandEvent extends BaseEntity {
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

export interface CommandOverview {
  counts: {
    commands: number;
    activeCommands: number;
    runbooks: number;
    automationRules: number;
    enabledAutomationRules: number;
    schedules: number;
    openIncidents: number;
    runningExecutions: number;
    runningRunbooks: number;
  };
  recentExecutions: CommandExecution[];
  recentRunbookRuns: RunbookRun[];
  openIncidents: Incident[];
  recentEvents: CommandEvent[];
}

export interface CommandState {
  commands: Command[];
  executions: CommandExecution[];
  runbooks: Runbook[];
  runbookRuns: RunbookRun[];
  automationRules: AutomationRule[];
  schedules: Schedule[];
  incidents: Incident[];
  events: CommandEvent[];
  auditLogs: AuditLog[];
}
