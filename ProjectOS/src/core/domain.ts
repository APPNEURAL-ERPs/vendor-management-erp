export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "project_manager" | "project_owner" | "team_member" | "viewer";
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

export type ProjectStatus = "draft" | "planned" | "active" | "on_hold" | "at_risk" | "delayed" | "completed" | "cancelled" | "archived";
export type ProjectPriority = "low" | "medium" | "high" | "critical";
export type ProjectHealth = "healthy" | "at_risk" | "delayed" | "critical";

export interface Project extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  clientId?: UUID;
  ownerId: UUID;
  managerId?: UUID;
  status: ProjectStatus;
  priority: ProjectPriority;
  health: ProjectHealth;
  startDate?: ISODate;
  endDate?: ISODate;
  actualEndDate?: ISODate;
  budgetId?: UUID;
  tags: string[];
  metadata: Record<string, unknown>;
}

export type MilestoneStatus = "not_started" | "in_progress" | "pending_approval" | "completed" | "delayed" | "blocked" | "cancelled";
export type MilestoneApprovalStatus = "pending" | "approved" | "rejected";

export interface Milestone extends BaseEntity {
  projectId: UUID;
  key: string;
  name: string;
  description?: string;
  status: MilestoneStatus;
  approvalStatus: MilestoneApprovalStatus;
  ownerId?: UUID;
  dueDate?: ISODate;
  completedAt?: ISODate;
  approvedBy?: UUID;
  approvedAt?: ISODate;
  order: number;
  budgetAmount?: number;
  billingPercentage?: number;
  metadata: Record<string, unknown>;
}

export type SprintStatus = "planned" | "active" | "completed" | "cancelled";

export interface Sprint extends BaseEntity {
  projectId: UUID;
  key: string;
  name: string;
  description?: string;
  status: SprintStatus;
  goal?: string;
  startDate: ISODate;
  endDate: ISODate;
  completedAt?: ISODate;
  velocity?: number;
  capacity?: number;
  order: number;
  metadata: Record<string, unknown>;
}

export type TaskStatus = "todo" | "in_progress" | "in_review" | "done" | "blocked" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Task extends BaseEntity {
  projectId: UUID;
  sprintId?: UUID;
  milestoneId?: UUID;
  key: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: UUID;
  reporterId?: UUID;
  storyPoints?: number;
  estimatedHours?: number;
  actualHours?: number;
  startDate?: ISODate;
  dueDate?: ISODate;
  completedAt?: ISODate;
  parentTaskId?: UUID;
  order: number;
  tags: string[];
  metadata: Record<string, unknown>;
}

export type ResourceType = "developer" | "designer" | "qa" | "project_manager" | "business_analyst" | "trainer" | "consultant" | "support_engineer" | "tool" | "server" | "license" | "meeting_room";

export interface Resource extends BaseEntity {
  projectId: UUID;
  key: string;
  name: string;
  type: ResourceType;
  description?: string;
  allocatedUserId?: UUID;
  allocationPercentage: number;
  hourlyRate?: number;
  totalCost?: number;
  status: EntityStatus;
  metadata: Record<string, unknown>;
}

export type BudgetStatus = "planned" | "approved" | "in_use" | "exceeded" | "completed";

export interface Budget extends BaseEntity {
  projectId: UUID;
  key: string;
  name: string;
  description?: string;
  status: BudgetStatus;
  estimatedCost: number;
  approvedBudget: number;
  actualCost: number;
  resourceCost: number;
  toolCost: number;
  cloudCost: number;
  aiCost: number;
  vendorCost: number;
  contingencyBudget: number;
  remainingBudget: number;
  profitMargin?: number;
  currency: string;
  metadata: Record<string, unknown>;
}

export interface TimeEntry extends BaseEntity {
  projectId: UUID;
  taskId?: UUID;
  resourceId?: UUID;
  userId: UUID;
  description: string;
  date: ISODate;
  hours: number;
  billable: boolean;
  billedAt?: ISODate;
  billingRate?: number;
  billingAmount?: number;
  metadata: Record<string, unknown>;
}

export interface ProjectPhase extends BaseEntity {
  projectId: UUID;
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  order: number;
  startDate?: ISODate;
  endDate?: ISODate;
  completedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type RiskStatus = "identified" | "mitigated" | "resolved" | "accepted" | "closed";

export interface ProjectRisk extends BaseEntity {
  projectId: UUID;
  key: string;
  title: string;
  description?: string;
  category: "timeline" | "budget" | "scope" | "resource" | "dependency" | "client" | "quality" | "technical";
  level: RiskLevel;
  status: RiskStatus;
  ownerId?: UUID;
  probability?: number;
  impact?: number;
  mitigationPlan?: string;
  dueDate?: ISODate;
  resolvedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export type IssueStatus = "open" | "assigned" | "in_progress" | "blocked" | "resolved" | "closed" | "reopened";

export interface ProjectIssue extends BaseEntity {
  projectId: UUID;
  key: string;
  title: string;
  description?: string;
  status: IssueStatus;
  priority: TaskPriority;
  ownerId?: UUID;
  reporterId?: UUID;
  dueDate?: ISODate;
  resolvedAt?: ISODate;
  closedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface ProjectOverview {
  projects: { total: number; active: number; completed: number; delayed: number; atRisk: number };
  milestones: { total: number; completed: number; pending: number; overdue: number };
  sprints: { total: number; active: number; completed: number };
  tasks: { total: number; todo: number; inProgress: number; done: number; blocked: number };
  budget: { totalBudget: number; totalSpent: number; totalRemaining: number; burnRate: number };
  team: { totalResources: number; allocatedResources: number; utilizationRate: number };
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

export interface ProjectState {
  projects: Project[];
  milestones: Milestone[];
  sprints: Sprint[];
  tasks: Task[];
  resources: Resource[];
  budgets: Budget[];
  timeEntries: TimeEntry[];
  phases: ProjectPhase[];
  risks: ProjectRisk[];
  issues: ProjectIssue[];
  auditLogs: AuditLog[];
}
