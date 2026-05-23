import { DataStore } from "./core/datastore";
import { HttpError } from "./core/http";
import {
  Budget,
  Milestone,
  MilestoneStatus,
  Project,
  ProjectIssue,
  ProjectOverview,
  ProjectPhase,
  ProjectRisk,
  ProjectStatus,
  RequestActor,
  Resource,
  ResourceType,
  Sprint,
  SprintStatus,
  Task,
  TaskStatus,
  TimeEntry
} from "./core/domain";
import { newId, nowIso, plusDays } from "./core/id";
import { clone, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, optionalObject, pickQuery } from "./core/utils";

export class ProjectosService {
  constructor(private readonly store: DataStore) {}

  overview(actor: RequestActor): ProjectOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;

    const projects = state.projects.filter((p) => p.tenantId === tenant);
    const milestones = state.milestones.filter((m) => m.tenantId === tenant);
    const sprints = state.sprints.filter((s) => s.tenantId === tenant);
    const tasks = state.tasks.filter((t) => t.tenantId === tenant);
    const budgets = state.budgets.filter((b) => b.tenantId === tenant);
    const resources = state.resources.filter((r) => r.tenantId === tenant);

    return {
      projects: {
        total: projects.length,
        active: projects.filter((p) => p.status === "active").length,
        completed: projects.filter((p) => p.status === "completed").length,
        delayed: projects.filter((p) => p.status === "delayed").length,
        atRisk: projects.filter((p) => p.status === "at_risk").length
      },
      milestones: {
        total: milestones.length,
        completed: milestones.filter((m) => m.status === "completed").length,
        pending: milestones.filter((m) => m.status === "not_started" || m.status === "in_progress").length,
        overdue: milestones.filter((m) => m.dueDate && new Date(m.dueDate) < new Date() && m.status !== "completed").length
      },
      sprints: {
        total: sprints.length,
        active: sprints.filter((s) => s.status === "active").length,
        completed: sprints.filter((s) => s.status === "completed").length
      },
      tasks: {
        total: tasks.length,
        todo: tasks.filter((t) => t.status === "todo").length,
        inProgress: tasks.filter((t) => t.status === "in_progress").length,
        done: tasks.filter((t) => t.status === "done").length,
        blocked: tasks.filter((t) => t.status === "blocked").length
      },
      budget: {
        totalBudget: budgets.reduce((sum, b) => sum + b.approvedBudget, 0),
        totalSpent: budgets.reduce((sum, b) => sum + b.actualCost, 0),
        totalRemaining: budgets.reduce((sum, b) => sum + b.remainingBudget, 0),
        burnRate: 0
      },
      team: {
        totalResources: resources.length,
        allocatedResources: resources.filter((r) => r.allocationPercentage > 0).length,
        utilizationRate: resources.length ? Math.round((resources.filter((r) => r.allocationPercentage > 0).length / resources.length) * 100) : 0
      }
    };
  }

  listProjects(actor: RequestActor, query?: URLSearchParams): Project[] {
    const state = this.store.getState();
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");
    
    return clone(state.projects.filter((p) => {
      if (p.tenantId !== actor.tenantId) return false;
      if (search && !`${p.key} ${p.name} ${p.description ?? ""}`.toLowerCase().includes(search)) return false;
      if (status && p.status !== status) return false;
      return true;
    }));
  }

  getProject(id: string, actor: RequestActor): Project {
    const project = this.store.getState().projects.find((p) => p.id === id && p.tenantId === actor.tenantId);
    if (!project) throw new HttpError(404, "Project not found");
    return clone(project);
  }

  createProject(input: unknown, actor: RequestActor): Project {
    const body = ensureObject(input, "project");
    const state = this.store.getState();
    const key = ensureString(body.key, "project.key");
    
    if (state.projects.some((p) => p.tenantId === actor.tenantId && p.key === key)) {
      throw new HttpError(409, `Project key '${key}' already exists`);
    }

    const project: Project = {
      id: newId("project"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "project.name"),
      description: body.description ? String(body.description) : undefined,
      clientId: body.clientId ? String(body.clientId) : undefined,
      ownerId: ensureString(body.ownerId, "project.ownerId", actor.userId),
      managerId: body.managerId ? String(body.managerId) : undefined,
      status: String(body.status ?? "draft") as ProjectStatus,
      priority: String(body.priority ?? "medium") as any,
      health: "healthy",
      startDate: body.startDate ? String(body.startDate) : undefined,
      endDate: body.endDate ? String(body.endDate) : undefined,
      tags: ensureArray<string>(body.tags, "project.tags"),
      metadata: optionalObject(body.metadata)
    };

    state.projects.push(project);
    this.store.save();
    this.store.audit(actor, "project.create", "project", project.id, undefined, project);
    return clone(project);
  }

  updateProject(id: string, input: unknown, actor: RequestActor): Project {
    const body = ensureObject(input, "project");
    const state = this.store.getState();
    const project = state.projects.find((p) => p.id === id && p.tenantId === actor.tenantId);
    if (!project) throw new HttpError(404, "Project not found");

    const before = clone(project);

    if (body.name !== undefined) project.name = ensureString(body.name, "project.name");
    if (body.description !== undefined) project.description = body.description ? String(body.description) : undefined;
    if (body.ownerId !== undefined) project.ownerId = ensureString(body.ownerId, "project.ownerId");
    if (body.managerId !== undefined) project.managerId = body.managerId ? String(body.managerId) : undefined;
    if (body.status !== undefined) project.status = String(body.status) as ProjectStatus;
    if (body.priority !== undefined) project.priority = String(body.priority) as any;
    if (body.health !== undefined) project.health = String(body.health) as any;
    if (body.startDate !== undefined) project.startDate = body.startDate ? String(body.startDate) : undefined;
    if (body.endDate !== undefined) project.endDate = body.endDate ? String(body.endDate) : undefined;
    if (body.tags !== undefined) project.tags = ensureArray<string>(body.tags, "project.tags");
    if (body.metadata !== undefined) project.metadata = optionalObject(body.metadata);

    project.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "project.update", "project", project.id, before, project);
    return clone(project);
  }

  listMilestones(actor: RequestActor, query?: URLSearchParams): Milestone[] {
    const state = this.store.getState();
    const projectId = pickQuery(query, "projectId");
    return clone(state.milestones.filter((m) => {
      if (m.tenantId !== actor.tenantId) return false;
      if (projectId && m.projectId !== projectId) return false;
      return true;
    }));
  }

  createMilestone(input: unknown, actor: RequestActor): Milestone {
    const body = ensureObject(input, "milestone");
    const state = this.store.getState();

    const projectId = ensureString(body.projectId, "milestone.projectId");
    this.requireProject(projectId, actor.tenantId);

    const key = ensureString(body.key, "milestone.key");
    if (state.milestones.some((m) => m.tenantId === actor.tenantId && m.projectId === projectId && m.key === key)) {
      throw new HttpError(409, `Milestone key '${key}' already exists`);
    }

    const milestone: Milestone = {
      id: newId("milestone"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      projectId,
      key,
      name: ensureString(body.name, "milestone.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "not_started") as MilestoneStatus,
      approvalStatus: "pending",
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      dueDate: body.dueDate ? String(body.dueDate) : undefined,
      order: ensureNumber(body.order, "milestone.order", state.milestones.filter((m) => m.projectId === projectId).length + 1),
      budgetAmount: body.budgetAmount ? ensureNumber(body.budgetAmount, "milestone.budgetAmount") : undefined,
      billingPercentage: body.billingPercentage ? ensureNumber(body.billingPercentage, "milestone.billingPercentage") : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.milestones.push(milestone);
    this.store.save();
    this.store.audit(actor, "milestone.create", "milestone", milestone.id, undefined, milestone);
    return clone(milestone);
  }

  updateMilestone(id: string, input: unknown, actor: RequestActor): Milestone {
    const body = ensureObject(input, "milestone");
    const state = this.store.getState();
    const milestone = state.milestones.find((m) => m.id === id && m.tenantId === actor.tenantId);
    if (!milestone) throw new HttpError(404, "Milestone not found");

    const before = clone(milestone);

    if (body.name !== undefined) milestone.name = ensureString(body.name, "milestone.name");
    if (body.description !== undefined) milestone.description = body.description ? String(body.description) : undefined;
    if (body.status !== undefined) milestone.status = String(body.status) as MilestoneStatus;
    if (body.approvalStatus !== undefined) milestone.approvalStatus = String(body.approvalStatus) as any;
    if (body.ownerId !== undefined) milestone.ownerId = body.ownerId ? String(body.ownerId) : undefined;
    if (body.dueDate !== undefined) milestone.dueDate = body.dueDate ? String(body.dueDate) : undefined;
    if (body.order !== undefined) milestone.order = ensureNumber(body.order, "milestone.order");
    if (body.completedAt !== undefined) milestone.completedAt = body.completedAt ? String(body.completedAt) : undefined;
    if (body.approvedBy !== undefined) milestone.approvedBy = body.approvedBy ? String(body.approvedBy) : undefined;
    if (body.approvedAt !== undefined) milestone.approvedAt = body.approvedAt ? String(body.approvedAt) : undefined;
    if (body.budgetAmount !== undefined) milestone.budgetAmount = ensureNumber(body.budgetAmount, "milestone.budgetAmount");
    if (body.billingPercentage !== undefined) milestone.billingPercentage = ensureNumber(body.billingPercentage, "milestone.billingPercentage");
    if (body.metadata !== undefined) milestone.metadata = optionalObject(body.metadata);

    milestone.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "milestone.update", "milestone", milestone.id, before, milestone);
    return clone(milestone);
  }

  listSprints(actor: RequestActor, query?: URLSearchParams): Sprint[] {
    const state = this.store.getState();
    const projectId = pickQuery(query, "projectId");
    return clone(state.sprints.filter((s) => {
      if (s.tenantId !== actor.tenantId) return false;
      if (projectId && s.projectId !== projectId) return false;
      return true;
    }));
  }

  createSprint(input: unknown, actor: RequestActor): Sprint {
    const body = ensureObject(input, "sprint");
    const state = this.store.getState();

    const projectId = ensureString(body.projectId, "sprint.projectId");
    this.requireProject(projectId, actor.tenantId);

    const key = ensureString(body.key, "sprint.key");
    if (state.sprints.some((s) => s.tenantId === actor.tenantId && s.projectId === projectId && s.key === key)) {
      throw new HttpError(409, `Sprint key '${key}' already exists`);
    }

    const sprint: Sprint = {
      id: newId("sprint"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      projectId,
      key,
      name: ensureString(body.name, "sprint.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "planned") as SprintStatus,
      goal: body.goal ? String(body.goal) : undefined,
      startDate: ensureString(body.startDate, "sprint.startDate"),
      endDate: ensureString(body.endDate, "sprint.endDate"),
      velocity: body.velocity ? ensureNumber(body.velocity, "sprint.velocity") : undefined,
      capacity: body.capacity ? ensureNumber(body.capacity, "sprint.capacity") : undefined,
      order: ensureNumber(body.order, "sprint.order", state.sprints.filter((s) => s.projectId === projectId).length + 1),
      metadata: optionalObject(body.metadata)
    };

    state.sprints.push(sprint);
    this.store.save();
    this.store.audit(actor, "sprint.create", "sprint", sprint.id, undefined, sprint);
    return clone(sprint);
  }

  updateSprint(id: string, input: unknown, actor: RequestActor): Sprint {
    const body = ensureObject(input, "sprint");
    const state = this.store.getState();
    const sprint = state.sprints.find((s) => s.id === id && s.tenantId === actor.tenantId);
    if (!sprint) throw new HttpError(404, "Sprint not found");

    const before = clone(sprint);

    if (body.name !== undefined) sprint.name = ensureString(body.name, "sprint.name");
    if (body.description !== undefined) sprint.description = body.description ? String(body.description) : undefined;
    if (body.status !== undefined) sprint.status = String(body.status) as SprintStatus;
    if (body.goal !== undefined) sprint.goal = body.goal ? String(body.goal) : undefined;
    if (body.startDate !== undefined) sprint.startDate = ensureString(body.startDate, "sprint.startDate");
    if (body.endDate !== undefined) sprint.endDate = ensureString(body.endDate, "sprint.endDate");
    if (body.velocity !== undefined) sprint.velocity = ensureNumber(body.velocity, "sprint.velocity");
    if (body.capacity !== undefined) sprint.capacity = ensureNumber(body.capacity, "sprint.capacity");
    if (body.order !== undefined) sprint.order = ensureNumber(body.order, "sprint.order");
    if (body.completedAt !== undefined) sprint.completedAt = body.completedAt ? String(body.completedAt) : undefined;
    if (body.metadata !== undefined) sprint.metadata = optionalObject(body.metadata);

    sprint.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "sprint.update", "sprint", sprint.id, before, sprint);
    return clone(sprint);
  }

  listTasks(actor: RequestActor, query?: URLSearchParams): Task[] {
    const state = this.store.getState();
    const projectId = pickQuery(query, "projectId");
    const sprintId = pickQuery(query, "sprintId");
    const status = pickQuery(query, "status");
    return clone(state.tasks.filter((t) => {
      if (t.tenantId !== actor.tenantId) return false;
      if (projectId && t.projectId !== projectId) return false;
      if (sprintId && t.sprintId !== sprintId) return false;
      if (status && t.status !== status) return false;
      return true;
    }));
  }

  createTask(input: unknown, actor: RequestActor): Task {
    const body = ensureObject(input, "task");
    const state = this.store.getState();

    const projectId = ensureString(body.projectId, "task.projectId");
    this.requireProject(projectId, actor.tenantId);

    const key = ensureString(body.key, "task.key");
    if (state.tasks.some((t) => t.tenantId === actor.tenantId && t.projectId === projectId && t.key === key)) {
      throw new HttpError(409, `Task key '${key}' already exists`);
    }

    const task: Task = {
      id: newId("task"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      projectId,
      sprintId: body.sprintId ? String(body.sprintId) : undefined,
      milestoneId: body.milestoneId ? String(body.milestoneId) : undefined,
      key,
      title: ensureString(body.title, "task.title"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "todo") as TaskStatus,
      priority: String(body.priority ?? "medium") as any,
      assigneeId: body.assigneeId ? String(body.assigneeId) : undefined,
      reporterId: body.reporterId ? String(body.reporterId) : undefined,
      storyPoints: body.storyPoints ? ensureNumber(body.storyPoints, "task.storyPoints") : undefined,
      estimatedHours: body.estimatedHours ? ensureNumber(body.estimatedHours, "task.estimatedHours") : undefined,
      actualHours: body.actualHours ? ensureNumber(body.actualHours, "task.actualHours") : undefined,
      startDate: body.startDate ? String(body.startDate) : undefined,
      dueDate: body.dueDate ? String(body.dueDate) : undefined,
      completedAt: body.completedAt ? String(body.completedAt) : undefined,
      parentTaskId: body.parentTaskId ? String(body.parentTaskId) : undefined,
      order: ensureNumber(body.order, "task.order", state.tasks.filter((t) => t.projectId === projectId).length + 1),
      tags: ensureArray<string>(body.tags, "task.tags"),
      metadata: optionalObject(body.metadata)
    };

    state.tasks.push(task);
    this.store.save();
    this.store.audit(actor, "task.create", "task", task.id, undefined, task);
    return clone(task);
  }

  updateTask(id: string, input: unknown, actor: RequestActor): Task {
    const body = ensureObject(input, "task");
    const state = this.store.getState();
    const task = state.tasks.find((t) => t.id === id && t.tenantId === actor.tenantId);
    if (!task) throw new HttpError(404, "Task not found");

    const before = clone(task);

    if (body.title !== undefined) task.title = ensureString(body.title, "task.title");
    if (body.description !== undefined) task.description = body.description ? String(body.description) : undefined;
    if (body.status !== undefined) task.status = String(body.status) as TaskStatus;
    if (body.priority !== undefined) task.priority = String(body.priority) as any;
    if (body.assigneeId !== undefined) task.assigneeId = body.assigneeId ? String(body.assigneeId) : undefined;
    if (body.reporterId !== undefined) task.reporterId = body.reporterId ? String(body.reporterId) : undefined;
    if (body.sprintId !== undefined) task.sprintId = body.sprintId ? String(body.sprintId) : undefined;
    if (body.milestoneId !== undefined) task.milestoneId = body.milestoneId ? String(body.milestoneId) : undefined;
    if (body.storyPoints !== undefined) task.storyPoints = ensureNumber(body.storyPoints, "task.storyPoints");
    if (body.estimatedHours !== undefined) task.estimatedHours = ensureNumber(body.estimatedHours, "task.estimatedHours");
    if (body.actualHours !== undefined) task.actualHours = ensureNumber(body.actualHours, "task.actualHours");
    if (body.startDate !== undefined) task.startDate = body.startDate ? String(body.startDate) : undefined;
    if (body.dueDate !== undefined) task.dueDate = body.dueDate ? String(body.dueDate) : undefined;
    if (body.completedAt !== undefined) task.completedAt = body.completedAt ? String(body.completedAt) : undefined;
    if (body.order !== undefined) task.order = ensureNumber(body.order, "task.order");
    if (body.tags !== undefined) task.tags = ensureArray<string>(body.tags, "task.tags");
    if (body.metadata !== undefined) task.metadata = optionalObject(body.metadata);

    task.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "task.update", "task", task.id, before, task);
    return clone(task);
  }

  listResources(actor: RequestActor, query?: URLSearchParams): Resource[] {
    const state = this.store.getState();
    const projectId = pickQuery(query, "projectId");
    return clone(state.resources.filter((r) => {
      if (r.tenantId !== actor.tenantId) return false;
      if (projectId && r.projectId !== projectId) return false;
      return true;
    }));
  }

  createResource(input: unknown, actor: RequestActor): Resource {
    const body = ensureObject(input, "resource");
    const state = this.store.getState();

    const projectId = ensureString(body.projectId, "resource.projectId");
    this.requireProject(projectId, actor.tenantId);

    const key = ensureString(body.key, "resource.key");
    if (state.resources.some((r) => r.tenantId === actor.tenantId && r.projectId === projectId && r.key === key)) {
      throw new HttpError(409, `Resource key '${key}' already exists`);
    }

    const resource: Resource = {
      id: newId("resource"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      projectId,
      key,
      name: ensureString(body.name, "resource.name"),
      type: String(body.type ?? "developer") as ResourceType,
      description: body.description ? String(body.description) : undefined,
      allocatedUserId: body.allocatedUserId ? String(body.allocatedUserId) : undefined,
      allocationPercentage: ensureNumber(body.allocationPercentage, "resource.allocationPercentage", 0),
      hourlyRate: body.hourlyRate ? ensureNumber(body.hourlyRate, "resource.hourlyRate") : undefined,
      totalCost: body.totalCost ? ensureNumber(body.totalCost, "resource.totalCost") : undefined,
      status: String(body.status ?? "active") as any,
      metadata: optionalObject(body.metadata)
    };

    state.resources.push(resource);
    this.store.save();
    this.store.audit(actor, "resource.create", "resource", resource.id, undefined, resource);
    return clone(resource);
  }

  listBudgets(actor: RequestActor, query?: URLSearchParams): Budget[] {
    const state = this.store.getState();
    const projectId = pickQuery(query, "projectId");
    return clone(state.budgets.filter((b) => {
      if (b.tenantId !== actor.tenantId) return false;
      if (projectId && b.projectId !== projectId) return false;
      return true;
    }));
  }

  createBudget(input: unknown, actor: RequestActor): Budget {
    const body = ensureObject(input, "budget");
    const state = this.store.getState();

    const projectId = ensureString(body.projectId, "budget.projectId");
    this.requireProject(projectId, actor.tenantId);

    const key = ensureString(body.key, "budget.key");
    if (state.budgets.some((b) => b.tenantId === actor.tenantId && b.projectId === projectId && b.key === key)) {
      throw new HttpError(409, `Budget key '${key}' already exists`);
    }

    const estimatedCost = ensureNumber(body.estimatedCost, "budget.estimatedCost", 0);
    const approvedBudget = ensureNumber(body.approvedBudget, "budget.approvedBudget", estimatedCost);

    const budget: Budget = {
      id: newId("budget"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      projectId,
      key,
      name: ensureString(body.name, "budget.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "planned") as any,
      estimatedCost,
      approvedBudget,
      actualCost: 0,
      resourceCost: 0,
      toolCost: 0,
      cloudCost: 0,
      aiCost: 0,
      vendorCost: 0,
      contingencyBudget: ensureNumber(body.contingencyBudget, "budget.contingencyBudget", 0),
      remainingBudget: approvedBudget,
      currency: String(body.currency ?? "USD"),
      metadata: optionalObject(body.metadata)
    };

    state.budgets.push(budget);
    this.store.save();
    this.store.audit(actor, "budget.create", "budget", budget.id, undefined, budget);
    return clone(budget);
  }

  updateBudget(id: string, input: unknown, actor: RequestActor): Budget {
    const body = ensureObject(input, "budget");
    const state = this.store.getState();
    const budget = state.budgets.find((b) => b.id === id && b.tenantId === actor.tenantId);
    if (!budget) throw new HttpError(404, "Budget not found");

    const before = clone(budget);

    if (body.name !== undefined) budget.name = ensureString(body.name, "budget.name");
    if (body.description !== undefined) budget.description = body.description ? String(body.description) : undefined;
    if (body.status !== undefined) budget.status = String(body.status) as any;
    if (body.estimatedCost !== undefined) {
      budget.estimatedCost = ensureNumber(body.estimatedCost, "budget.estimatedCost");
    }
    if (body.approvedBudget !== undefined) {
      budget.approvedBudget = ensureNumber(body.approvedBudget, "budget.approvedBudget");
      budget.remainingBudget = budget.approvedBudget - budget.actualCost;
    }
    if (body.actualCost !== undefined) {
      budget.actualCost = ensureNumber(body.actualCost, "budget.actualCost");
      budget.remainingBudget = budget.approvedBudget - budget.actualCost;
    }
    if (body.resourceCost !== undefined) budget.resourceCost = ensureNumber(body.resourceCost, "budget.resourceCost");
    if (body.toolCost !== undefined) budget.toolCost = ensureNumber(body.toolCost, "budget.toolCost");
    if (body.cloudCost !== undefined) budget.cloudCost = ensureNumber(body.cloudCost, "budget.cloudCost");
    if (body.aiCost !== undefined) budget.aiCost = ensureNumber(body.aiCost, "budget.aiCost");
    if (body.vendorCost !== undefined) budget.vendorCost = ensureNumber(body.vendorCost, "budget.vendorCost");
    if (body.contingencyBudget !== undefined) budget.contingencyBudget = ensureNumber(body.contingencyBudget, "budget.contingencyBudget");
    if (body.remainingBudget !== undefined) budget.remainingBudget = ensureNumber(body.remainingBudget, "budget.remainingBudget");
    if (body.profitMargin !== undefined) budget.profitMargin = ensureNumber(body.profitMargin, "budget.profitMargin");
    if (body.metadata !== undefined) budget.metadata = optionalObject(body.metadata);

    budget.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "budget.update", "budget", budget.id, before, budget);
    return clone(budget);
  }

  listTimeEntries(actor: RequestActor, query?: URLSearchParams): TimeEntry[] {
    const state = this.store.getState();
    const projectId = pickQuery(query, "projectId");
    const taskId = pickQuery(query, "taskId");
    const userId = pickQuery(query, "userId");
    return clone(state.timeEntries.filter((t) => {
      if (t.tenantId !== actor.tenantId) return false;
      if (projectId && t.projectId !== projectId) return false;
      if (taskId && t.taskId !== taskId) return false;
      if (userId && t.userId !== userId) return false;
      return true;
    }));
  }

  createTimeEntry(input: unknown, actor: RequestActor): TimeEntry {
    const body = ensureObject(input, "timeEntry");
    const state = this.store.getState();

    const projectId = ensureString(body.projectId, "timeEntry.projectId");
    this.requireProject(projectId, actor.tenantId);

    const timeEntry: TimeEntry = {
      id: newId("timeentry"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      projectId,
      taskId: body.taskId ? String(body.taskId) : undefined,
      resourceId: body.resourceId ? String(body.resourceId) : undefined,
      userId: ensureString(body.userId, "timeEntry.userId", actor.userId),
      description: ensureString(body.description, "timeEntry.description"),
      date: ensureString(body.date, "timeEntry.date"),
      hours: ensureNumber(body.hours, "timeEntry.hours"),
      billable: ensureBoolean(body.billable, false),
      billedAt: body.billedAt ? String(body.billedAt) : undefined,
      billingRate: body.billingRate ? ensureNumber(body.billingRate, "timeEntry.billingRate") : undefined,
      billingAmount: body.billingAmount ? ensureNumber(body.billingAmount, "timeEntry.billingAmount") : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.timeEntries.push(timeEntry);
    this.store.save();
    this.store.audit(actor, "timeEntry.create", "timeEntry", timeEntry.id, undefined, timeEntry);
    return clone(timeEntry);
  }

  listPhases(actor: RequestActor, query?: URLSearchParams): ProjectPhase[] {
    const state = this.store.getState();
    const projectId = pickQuery(query, "projectId");
    return clone(state.phases.filter((p) => {
      if (p.tenantId !== actor.tenantId) return false;
      if (projectId && p.projectId !== projectId) return false;
      return true;
    }));
  }

  createPhase(input: unknown, actor: RequestActor): ProjectPhase {
    const body = ensureObject(input, "phase");
    const state = this.store.getState();

    const projectId = ensureString(body.projectId, "phase.projectId");
    this.requireProject(projectId, actor.tenantId);

    const key = ensureString(body.key, "phase.key");
    if (state.phases.some((p) => p.tenantId === actor.tenantId && p.projectId === projectId && p.key === key)) {
      throw new HttpError(409, `Phase key '${key}' already exists`);
    }

    const phase: ProjectPhase = {
      id: newId("phase"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      projectId,
      key,
      name: ensureString(body.name, "phase.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as any,
      order: ensureNumber(body.order, "phase.order", state.phases.filter((p) => p.projectId === projectId).length + 1),
      startDate: body.startDate ? String(body.startDate) : undefined,
      endDate: body.endDate ? String(body.endDate) : undefined,
      completedAt: body.completedAt ? String(body.completedAt) : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.phases.push(phase);
    this.store.save();
    this.store.audit(actor, "phase.create", "phase", phase.id, undefined, phase);
    return clone(phase);
  }

  listRisks(actor: RequestActor, query?: URLSearchParams): ProjectRisk[] {
    const state = this.store.getState();
    const projectId = pickQuery(query, "projectId");
    return clone(state.risks.filter((r) => {
      if (r.tenantId !== actor.tenantId) return false;
      if (projectId && r.projectId !== projectId) return false;
      return true;
    }));
  }

  createRisk(input: unknown, actor: RequestActor): ProjectRisk {
    const body = ensureObject(input, "risk");
    const state = this.store.getState();

    const projectId = ensureString(body.projectId, "risk.projectId");
    this.requireProject(projectId, actor.tenantId);

    const key = ensureString(body.key, "risk.key");
    if (state.risks.some((r) => r.tenantId === actor.tenantId && r.projectId === projectId && r.key === key)) {
      throw new HttpError(409, `Risk key '${key}' already exists`);
    }

    const risk: ProjectRisk = {
      id: newId("risk"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      projectId,
      key,
      title: ensureString(body.title, "risk.title"),
      description: body.description ? String(body.description) : undefined,
      category: String(body.category ?? "general") as any,
      level: String(body.level ?? "medium") as any,
      status: String(body.status ?? "identified") as any,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      probability: body.probability ? ensureNumber(body.probability, "risk.probability") : undefined,
      impact: body.impact ? ensureNumber(body.impact, "risk.impact") : undefined,
      mitigationPlan: body.mitigationPlan ? String(body.mitigationPlan) : undefined,
      dueDate: body.dueDate ? String(body.dueDate) : undefined,
      resolvedAt: body.resolvedAt ? String(body.resolvedAt) : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.risks.push(risk);
    this.store.save();
    this.store.audit(actor, "risk.create", "risk", risk.id, undefined, risk);
    return clone(risk);
  }

  listIssues(actor: RequestActor, query?: URLSearchParams): ProjectIssue[] {
    const state = this.store.getState();
    const projectId = pickQuery(query, "projectId");
    return clone(state.issues.filter((i) => {
      if (i.tenantId !== actor.tenantId) return false;
      if (projectId && i.projectId !== projectId) return false;
      return true;
    }));
  }

  createIssue(input: unknown, actor: RequestActor): ProjectIssue {
    const body = ensureObject(input, "issue");
    const state = this.store.getState();

    const projectId = ensureString(body.projectId, "issue.projectId");
    this.requireProject(projectId, actor.tenantId);

    const key = ensureString(body.key, "issue.key");
    if (state.issues.some((i) => i.tenantId === actor.tenantId && i.projectId === projectId && i.key === key)) {
      throw new HttpError(409, `Issue key '${key}' already exists`);
    }

    const issue: ProjectIssue = {
      id: newId("issue"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      projectId,
      key,
      title: ensureString(body.title, "issue.title"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "open") as any,
      priority: String(body.priority ?? "medium") as any,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      reporterId: body.reporterId ? String(body.reporterId) : undefined,
      dueDate: body.dueDate ? String(body.dueDate) : undefined,
      resolvedAt: body.resolvedAt ? String(body.resolvedAt) : undefined,
      closedAt: body.closedAt ? String(body.closedAt) : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.issues.push(issue);
    this.store.save();
    this.store.audit(actor, "issue.create", "issue", issue.id, undefined, issue);
    return clone(issue);
  }

  listAuditLogs(actor: RequestActor): any[] {
    return clone(this.store.getState().auditLogs.filter((a) => a.tenantId === actor.tenantId));
  }

  private requireProject(idOrKey: string, tenantId: string): Project {
    const project = this.store.getState().projects.find((p) => p.tenantId === tenantId && (p.id === idOrKey || p.key === idOrKey));
    if (!project) throw new HttpError(404, "Project not found");
    return project;
  }
}
