export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "ops_manager" | "ops_engineer" | "ops_analyst" | "ops_viewer";

export type TaskStatus = "backlog" | "todo" | "in_progress" | "waiting" | "blocked" | "in_review" | "approved" | "done" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type IssueStatus = "open" | "assigned" | "investigating" | "in_progress" | "waiting" | "resolved" | "closed" | "reopened" | "escalated";
export type IssuePriority = "low" | "medium" | "high" | "critical";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "open" | "acknowledged" | "investigating" | "resolved" | "closed";
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

export interface OperationalTask extends BaseEntity {
  key: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: UUID;
  assigneeName?: string;
  dueDate?: ISODate;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  dependencies: UUID[];
  checklistId?: UUID;
  processId?: UUID;
  workflowId?: UUID;
  parentTaskId?: UUID;
  projectId?: UUID;
  clientId?: UUID;
  metadata: Record<string, unknown>;
}

export interface TaskComment extends BaseEntity {
  taskId: UUID;
  userId: UUID;
  userName?: string;
  content: string;
  mentions: UUID[];
}

export interface TaskAttachment extends BaseEntity {
  taskId: UUID;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: UUID;
}

export interface Checklist extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "daily" | "project" | "client_onboarding" | "quality" | "deployment" | "finance" | "hr" | "custom";
  status: EntityStatus;
  assigneeId?: UUID;
  dueDate?: ISODate;
  items: ChecklistItem[];
  metadata: Record<string, unknown>;
}

export interface ChecklistItem {
  id: UUID;
  text: string;
  completed: boolean;
  completedAt?: ISODate;
  completedBy?: UUID;
  order: number;
}

export interface SOP extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  category: string;
  status: EntityStatus;
  steps: SOPStep[];
  ownerId?: UUID;
  estimatedMinutes?: number;
  tags: string[];
  version: number;
}

export interface SOPStep {
  order: number;
  title: string;
  description: string;
  estimatedMinutes?: number;
  required: boolean;
}

export interface SOPExecution extends BaseEntity {
  sopId: UUID;
  status: "not_started" | "in_progress" | "completed" | "skipped" | "failed";
  startedAt?: ISODate;
  completedAt?: ISODate;
  assigneeId?: UUID;
  assigneeName?: string;
  completedSteps: number;
  totalSteps: number;
  notes?: string;
}

export interface Process extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  category: string;
  status: EntityStatus;
  steps: ProcessStep[];
  ownerId?: UUID;
  version: number;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface ProcessStep {
  order: number;
  title: string;
  description: string;
  assigneeId?: UUID;
  estimatedMinutes?: number;
  dependencies: number[];
}

export interface ProcessExecution extends BaseEntity {
  processId: UUID;
  status: "not_started" | "in_progress" | "completed" | "cancelled";
  currentStep: number;
  startedAt?: ISODate;
  completedAt?: ISODate;
  assigneeId?: UUID;
  assigneeName?: string;
  metadata: Record<string, unknown>;
}

export interface Issue extends BaseEntity {
  key: string;
  title: string;
  description?: string;
  category: string;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeId?: UUID;
  assigneeName?: string;
  dueDate?: ISODate;
  resolvedAt?: ISODate;
  closedAt?: ISODate;
  rootCause?: string;
  resolution?: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface Incident extends BaseEntity {
  key: string;
  title: string;
  description?: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  assigneeId?: UUID;
  assigneeName?: string;
  startedAt?: ISODate;
  acknowledgedAt?: ISODate;
  resolvedAt?: ISODate;
  closedAt?: ISODate;
  timeline: IncidentTimelineEntry[];
  rootCause?: string;
  impact?: string;
  actions: string[];
  metadata: Record<string, unknown>;
}

export interface IncidentTimelineEntry {
  timestamp: ISODate;
  userId?: UUID;
  userName?: string;
  action: string;
  note?: string;
}

export interface Resource extends BaseEntity {
  key: string;
  name: string;
  type: "people" | "tools" | "software_license" | "cloud_resource" | "meeting_room" | "equipment" | "training_asset" | "vendor_support" | "budget";
  status: EntityStatus;
  allocatedTo?: UUID;
  capacity?: number;
  utilized?: number;
  cost?: number;
  availableFrom?: ISODate;
  availableTo?: ISODate;
  metadata: Record<string, unknown>;
}

export interface SLARule extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "support" | "delivery" | "approval" | "incident" | "task" | "custom";
  status: EntityStatus;
  priority: IssuePriority | TaskPriority;
  responseTimeMinutes?: number;
  resolutionTimeMinutes?: number;
  escalationAfterMinutes?: number;
  notifyAtMinutes?: number[];
  metadata: Record<string, unknown>;
}

export interface SLAStatus extends BaseEntity {
  slaRuleId: UUID;
  entityType: "task" | "issue" | "incident" | "approval";
  entityId: UUID;
  status: "on_track" | "at_risk" | "breached" | "met";
  breachedAt?: ISODate;
  responseBreached: boolean;
  resolutionBreached: boolean;
  nextNotifyAt?: ISODate;
}

export interface OperatingCalendarItem extends BaseEntity {
  title: string;
  type: "standup" | "review" | "meeting" | "deadline" | "maintenance" | "deployment" | "holiday" | "other";
  startAt: ISODate;
  endAt?: ISODate;
  allDay: boolean;
  assigneeId?: UUID;
  assigneeName?: string;
  recurrence?: string;
  reminders: number[];
  metadata: Record<string, unknown>;
}

export interface WorkloadRecord extends BaseEntity {
  userId: UUID;
  userName?: string;
  date: string;
  tasksAssigned: number;
  tasksCompleted: number;
  tasksOverdue: number;
  utilizationPercent: number;
  status: "under" | "optimal" | "over" | "critical";
}

export interface OperationsReport extends BaseEntity {
  type: "daily" | "weekly" | "monthly" | "quarterly" | "custom";
  name: string;
  period: { start: ISODate; end: ISODate };
  status: "generating" | "ready" | "failed";
  sections: ReportSection[];
  generatedBy: UUID;
  metadata: Record<string, unknown>;
}

export interface ReportSection {
  title: string;
  type: "tasks" | "issues" | "incidents" | "sla" | "workload" | "processes" | "custom";
  data: Record<string, unknown>;
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

export interface OperationsEvent extends BaseEntity {
  type: string;
  source: string;
  data: Record<string, unknown>;
  correlationId?: UUID;
}

export interface OperationsState {
  tasks: OperationalTask[];
  taskComments: TaskComment[];
  taskAttachments: TaskAttachment[];
  checklists: Checklist[];
  sops: SOP[];
  sopExecutions: SOPExecution[];
  processes: Process[];
  processExecutions: ProcessExecution[];
  issues: Issue[];
  incidents: Incident[];
  resources: Resource[];
  slaRules: SLARule[];
  slaStatuses: SLAStatus[];
  calendarItems: OperatingCalendarItem[];
  workloadRecords: WorkloadRecord[];
  reports: OperationsReport[];
  auditLogs: AuditLog[];
  events: OperationsEvent[];
}

export interface OperationsOverview {
  tasks: {
    total: number;
    open: number;
    inProgress: number;
    completed: number;
    delayed: number;
    blocked: number;
  };
  issues: {
    total: number;
    open: number;
    resolved: number;
    escalated: number;
  };
  incidents: {
    total: number;
    open: number;
    resolved: number;
    critical: number;
  };
  checklists: {
    total: number;
    completed: number;
  };
  processes: {
    total: number;
    active: number;
  };
  sops: {
    total: number;
    executions: number;
  };
  sla: {
    total: number;
    breached: number;
    atRisk: number;
  };
  resources: {
    total: number;
    allocated: number;
  };
}
