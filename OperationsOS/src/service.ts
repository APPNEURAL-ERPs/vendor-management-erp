import { DataStore } from "./core/datastore";
import {
  OperationalTask,
  TaskComment,
  Checklist,
  ChecklistItem,
  SOP,
  SOPExecution,
  Process,
  ProcessExecution,
  Issue,
  Incident,
  Resource,
  SLARule,
  SLAStatus,
  OperatingCalendarItem,
  WorkloadRecord,
  OperationsReport,
  OperationsOverview,
  RequestActor,
  TaskStatus,
  IssueStatus,
  IncidentStatus,
  IncidentTimelineEntry,
  UUID
} from "./domain";
import { badRequest, conflict, notFound } from "./core/errors";
import { newId, nowIso, plusDays } from "./core/id";
import { clone, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, optionalObject, pickQuery, isOverdue, daysUntil } from "./core/utils";

export class OperationsService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "OperationsOS service is ready";
  }

  overview(actor: RequestActor): OperationsOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    const tasks = state.tasks.filter((item) => item.tenantId === tenant);
    const issues = state.issues.filter((item) => item.tenantId === tenant);
    const incidents = state.incidents.filter((item) => item.tenantId === tenant);
    const checklists = state.checklists.filter((item) => item.tenantId === tenant);
    const processes = state.processes.filter((item) => item.tenantId === tenant);
    const sops = state.sops.filter((item) => item.tenantId === tenant);
    const sopExecutions = state.sopExecutions.filter((item) => item.tenantId === tenant);
    const slaRules = state.slaRules.filter((item) => item.tenantId === tenant);
    const slaStatuses = state.slaStatuses.filter((item) => item.tenantId === tenant);
    const resources = state.resources.filter((item) => item.tenantId === tenant);

    return {
      tasks: {
        total: tasks.length,
        open: tasks.filter((t) => ["backlog", "todo", "in_progress", "waiting"].includes(t.status)).length,
        inProgress: tasks.filter((t) => t.status === "in_progress").length,
        completed: tasks.filter((t) => ["done", "approved"].includes(t.status)).length,
        delayed: tasks.filter((t) => isOverdue(t.dueDate) && !["done", "cancelled"].includes(t.status)).length,
        blocked: tasks.filter((t) => t.status === "blocked").length
      },
      issues: {
        total: issues.length,
        open: issues.filter((i) => ["open", "assigned", "investigating", "in_progress"].includes(i.status)).length,
        resolved: issues.filter((i) => ["resolved", "closed"].includes(i.status)).length,
        escalated: issues.filter((i) => i.status === "escalated").length
      },
      incidents: {
        total: incidents.length,
        open: incidents.filter((i) => ["open", "acknowledged", "investigating"].includes(i.status)).length,
        resolved: incidents.filter((i) => ["resolved", "closed"].includes(i.status)).length,
        critical: incidents.filter((i) => i.severity === "critical" && !["resolved", "closed"].includes(i.status)).length
      },
      checklists: {
        total: checklists.length,
        completed: checklists.filter((c) => c.items.every((item) => item.completed)).length
      },
      processes: {
        total: processes.length,
        active: state.processExecutions.filter((e) => e.tenantId === tenant && e.status === "in_progress").length
      },
      sops: {
        total: sops.length,
        executions: sopExecutions.length
      },
      sla: {
        total: slaStatuses.length,
        breached: slaStatuses.filter((s) => s.status === "breached").length,
        atRisk: slaStatuses.filter((s) => s.status === "at_risk").length
      },
      resources: {
        total: resources.length,
        allocated: resources.filter((r) => r.allocatedTo).length
      }
    };
  }

  listTasks(actor: RequestActor, query?: URLSearchParams): OperationalTask[] {
    const status = pickQuery(query, "status");
    const priority = pickQuery(query, "priority");
    const assigneeId = pickQuery(query, "assigneeId");
    const search = pickQuery(query, "search")?.toLowerCase();

    return clone(this.store.getState().tasks.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (status && item.status !== status) return false;
      if (priority && item.priority !== priority) return false;
      if (assigneeId && item.assigneeId !== assigneeId) return false;
      if (search && !`${item.key} ${item.title} ${item.description ?? ""}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  createTask(input: unknown, actor: RequestActor): OperationalTask {
    const body = ensureObject(input, "task");
    const state = this.store.getState();
    const key = ensureString(body.key, "task.key");
    if (state.tasks.some((item) => item.tenantId === actor.tenantId && item.key === key)) conflict(`Task key '${key}' already exists`);

    const task: OperationalTask = {
      id: newId("task"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      title: ensureString(body.title, "task.title"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "backlog") as TaskStatus,
      priority: String(body.priority ?? "medium") as OperationalTask["priority"],
      assigneeId: body.assigneeId ? String(body.assigneeId) : undefined,
      assigneeName: body.assigneeName ? String(body.assigneeName) : undefined,
      dueDate: body.dueDate ? String(body.dueDate) : undefined,
      estimatedHours: body.estimatedHours ? ensureNumber(body.estimatedHours, "task.estimatedHours") : undefined,
      actualHours: body.actualHours ? ensureNumber(body.actualHours, "task.actualHours") : undefined,
      tags: ensureArray<string>(body.tags, "task.tags"),
      dependencies: ensureArray<UUID>(body.dependencies, "task.dependencies"),
      checklistId: body.checklistId ? String(body.checklistId) : undefined,
      processId: body.processId ? String(body.processId) : undefined,
      workflowId: body.workflowId ? String(body.workflowId) : undefined,
      parentTaskId: body.parentTaskId ? String(body.parentTaskId) : undefined,
      projectId: body.projectId ? String(body.projectId) : undefined,
      clientId: body.clientId ? String(body.clientId) : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.tasks.push(task);
    this.store.save();
    this.store.audit(actor, "task.create", "task", task.id, undefined, task);
    this.emitEvent(actor, "ops.task.created", { taskId: task.id, taskKey: task.key, title: task.title });

    return clone(task);
  }

  updateTask(id: string, input: unknown, actor: RequestActor): OperationalTask {
    const body = ensureObject(input, "task");
    const state = this.store.getState();
    const task = state.tasks.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!task) notFound("Task not found");

    const before = clone(task);

    if (body.title !== undefined) task.title = String(body.title);
    if (body.description !== undefined) task.description = body.description ? String(body.description) : undefined;
    if (body.status !== undefined) task.status = String(body.status) as TaskStatus;
    if (body.priority !== undefined) task.priority = String(body.priority) as OperationalTask["priority"];
    if (body.assigneeId !== undefined) task.assigneeId = body.assigneeId ? String(body.assigneeId) : undefined;
    if (body.assigneeName !== undefined) task.assigneeName = body.assigneeName ? String(body.assigneeName) : undefined;
    if (body.dueDate !== undefined) task.dueDate = body.dueDate ? String(body.dueDate) : undefined;
    if (body.estimatedHours !== undefined) task.estimatedHours = body.estimatedHours ? ensureNumber(body.estimatedHours, "task.estimatedHours") : undefined;
    if (body.actualHours !== undefined) task.actualHours = body.actualHours ? ensureNumber(body.actualHours, "task.actualHours") : undefined;
    if (body.tags !== undefined) task.tags = ensureArray<string>(body.tags, "task.tags");
    if (body.metadata !== undefined) task.metadata = optionalObject(body.metadata);

    task.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "task.update", "task", task.id, before, task);

    if (task.status === "done") {
      this.emitEvent(actor, "ops.task.completed", { taskId: task.id, taskKey: task.key, title: task.title });
    } else if (isOverdue(task.dueDate) && !["done", "cancelled"].includes(task.status)) {
      this.emitEvent(actor, "ops.task.delayed", { taskId: task.id, taskKey: task.key, title: task.title });
    }

    return clone(task);
  }

  listChecklists(actor: RequestActor, query?: URLSearchParams): Checklist[] {
    const type = pickQuery(query, "type");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().checklists.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (type && item.type !== type) return false;
      if (status && item.status !== status) return false;
      return true;
    }));
  }

  createChecklist(input: unknown, actor: RequestActor): Checklist {
    const body = ensureObject(input, "checklist");
    const state = this.store.getState();
    const key = ensureString(body.key, "checklist.key");
    if (state.checklists.some((item) => item.tenantId === actor.tenantId && item.key === key)) conflict(`Checklist key '${key}' already exists`);

    const items: ChecklistItem[] = ensureArray(body.items, "checklist.items", []).map((item: any, index: number) => ({
      id: String(item.id ?? newId("item")),
      text: ensureString(item.text, "item.text"),
      completed: ensureBoolean(item.completed, false),
      completedAt: item.completedAt ? String(item.completedAt) : undefined,
      completedBy: item.completedBy ? String(item.completedBy) : undefined,
      order: item.order ?? index
    }));

    const checklist: Checklist = {
      id: newId("checklist"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "checklist.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "custom") as Checklist["type"],
      status: String(body.status ?? "active") as Checklist["status"],
      assigneeId: body.assigneeId ? String(body.assigneeId) : undefined,
      dueDate: body.dueDate ? String(body.dueDate) : undefined,
      items,
      metadata: optionalObject(body.metadata)
    };

    state.checklists.push(checklist);
    this.store.save();
    this.store.audit(actor, "checklist.create", "checklist", checklist.id, undefined, checklist);

    return clone(checklist);
  }

  updateChecklistItem(checklistId: string, itemId: string, input: unknown, actor: RequestActor): Checklist {
    const body = ensureObject(input, "checklistItem");
    const state = this.store.getState();
    const checklist = state.checklists.find((item) => item.id === checklistId && item.tenantId === actor.tenantId);
    if (!checklist) notFound("Checklist not found");

    const item = checklist.items.find((i) => i.id === itemId);
    if (!item) notFound("Checklist item not found");

    if (body.completed !== undefined) {
      item.completed = ensureBoolean(body.completed);
      if (item.completed) {
        item.completedAt = nowIso();
        item.completedBy = actor.userId;
      } else {
        item.completedAt = undefined;
        item.completedBy = undefined;
      }
    }
    if (body.text !== undefined) item.text = String(body.text);
    if (body.order !== undefined) item.order = ensureNumber(body.order, "item.order");

    checklist.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "checklist.item.update", "checklist", checklist.id, undefined, { checklistId, itemId });

    return clone(checklist);
  }

  listSOPs(actor: RequestActor, query?: URLSearchParams): SOP[] {
    const category = pickQuery(query, "category");
    const status = pickQuery(query, "status");
    const search = pickQuery(query, "search")?.toLowerCase();

    return clone(this.store.getState().sops.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (category && item.category !== category) return false;
      if (status && item.status !== status) return false;
      if (search && !`${item.key} ${item.name} ${item.description ?? ""}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  createSOP(input: unknown, actor: RequestActor): SOP {
    const body = ensureObject(input, "sop");
    const state = this.store.getState();
    const key = ensureString(body.key, "sop.key");
    if (state.sops.some((item) => item.tenantId === actor.tenantId && item.key === key)) conflict(`SOP key '${key}' already exists`);

    const steps = ensureArray(body.steps, "sop.steps", []).map((step: any, index: number) => ({
      order: step.order ?? index,
      title: ensureString(step.title, "step.title"),
      description: ensureString(step.description, "step.description"),
      estimatedMinutes: step.estimatedMinutes ? ensureNumber(step.estimatedMinutes, "step.estimatedMinutes") : undefined,
      required: ensureBoolean(step.required, true)
    }));

    const sop: SOP = {
      id: newId("sop"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "sop.name"),
      description: body.description ? String(body.description) : undefined,
      category: ensureString(body.category, "sop.category"),
      status: String(body.status ?? "active") as SOP["status"],
      steps,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      estimatedMinutes: body.estimatedMinutes ? ensureNumber(body.estimatedMinutes, "sop.estimatedMinutes") : undefined,
      tags: ensureArray<string>(body.tags, "sop.tags"),
      version: 1
    };

    state.sops.push(sop);
    this.store.save();
    this.store.audit(actor, "sop.create", "sop", sop.id, undefined, sop);

    return clone(sop);
  }

  createSOPExecution(input: unknown, actor: RequestActor): SOPExecution {
    const body = ensureObject(input, "sopExecution");
    const state = this.store.getState();
    const sop = state.sops.find((item) => item.id === String(body.sopId) && item.tenantId === actor.tenantId);
    if (!sop) notFound("SOP not found");

    const execution: SOPExecution = {
      id: newId("sopexec"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      sopId: sop.id,
      status: "not_started",
      startedAt: undefined,
      completedAt: undefined,
      assigneeId: body.assigneeId ? String(body.assigneeId) : actor.userId,
      assigneeName: body.assigneeName ? String(body.assigneeName) : undefined,
      completedSteps: 0,
      totalSteps: sop.steps.length,
      notes: body.notes ? String(body.notes) : undefined
    };

    state.sopExecutions.push(execution);
    this.store.save();
    this.store.audit(actor, "sop.execution.create", "sopExecution", execution.id, undefined, execution);

    return clone(execution);
  }

  updateSOPExecution(id: string, input: unknown, actor: RequestActor): SOPExecution {
    const body = ensureObject(input, "sopExecution");
    const state = this.store.getState();
    const execution = state.sopExecutions.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!execution) notFound("SOP execution not found");

    if (body.status !== undefined) {
      execution.status = String(body.status) as SOPExecution["status"];
      if (execution.status === "in_progress" && !execution.startedAt) {
        execution.startedAt = nowIso();
      } else if (execution.status === "completed") {
        execution.completedAt = nowIso();
        execution.completedSteps = execution.totalSteps;
      }
    }
    if (body.completedSteps !== undefined) {
      execution.completedSteps = ensureNumber(body.completedSteps, "completedSteps");
    }
    if (body.notes !== undefined) execution.notes = body.notes ? String(body.notes) : undefined;

    execution.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "sop.execution.update", "sopExecution", execution.id, undefined, execution);

    return clone(execution);
  }

  listProcesses(actor: RequestActor, query?: URLSearchParams): Process[] {
    const category = pickQuery(query, "category");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().processes.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (category && item.category !== category) return false;
      if (status && item.status !== status) return false;
      return true;
    }));
  }

  createProcess(input: unknown, actor: RequestActor): Process {
    const body = ensureObject(input, "process");
    const state = this.store.getState();
    const key = ensureString(body.key, "process.key");
    if (state.processes.some((item) => item.tenantId === actor.tenantId && item.key === key)) conflict(`Process key '${key}' already exists`);

    const steps = ensureArray(body.steps, "process.steps", []).map((step: any, index: number) => ({
      order: step.order ?? index,
      title: ensureString(step.title, "step.title"),
      description: ensureString(step.description, "step.description"),
      assigneeId: step.assigneeId ? String(step.assigneeId) : undefined,
      estimatedMinutes: step.estimatedMinutes ? ensureNumber(step.estimatedMinutes, "step.estimatedMinutes") : undefined,
      dependencies: ensureArray<number>(step.dependencies, "step.dependencies", [])
    }));

    const process: Process = {
      id: newId("process"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "process.name"),
      description: body.description ? String(body.description) : undefined,
      category: ensureString(body.category, "process.category"),
      status: String(body.status ?? "active") as Process["status"],
      steps,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      version: 1,
      tags: ensureArray<string>(body.tags, "process.tags"),
      metadata: optionalObject(body.metadata)
    };

    state.processes.push(process);
    this.store.save();
    this.store.audit(actor, "process.create", "process", process.id, undefined, process);

    return clone(process);
  }

  createProcessExecution(input: unknown, actor: RequestActor): ProcessExecution {
    const body = ensureObject(input, "processExecution");
    const state = this.store.getState();
    const process = state.processes.find((item) => item.id === String(body.processId) && item.tenantId === actor.tenantId);
    if (!process) notFound("Process not found");

    const execution: ProcessExecution = {
      id: newId("processexec"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      processId: process.id,
      status: "not_started",
      currentStep: 0,
      startedAt: undefined,
      completedAt: undefined,
      assigneeId: body.assigneeId ? String(body.assigneeId) : actor.userId,
      assigneeName: body.assigneeName ? String(body.assigneeName) : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.processExecutions.push(execution);
    this.store.save();
    this.store.audit(actor, "process.execution.create", "processExecution", execution.id, undefined, execution);
    this.emitEvent(actor, "ops.process.started", { processId: process.id, executionId: execution.id });

    return clone(execution);
  }

  listIssues(actor: RequestActor, query?: URLSearchParams): Issue[] {
    const status = pickQuery(query, "status");
    const priority = pickQuery(query, "priority");
    const category = pickQuery(query, "category");
    return clone(this.store.getState().issues.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (status && item.status !== status) return false;
      if (priority && item.priority !== priority) return false;
      if (category && item.category !== category) return false;
      return true;
    }));
  }

  createIssue(input: unknown, actor: RequestActor): Issue {
    const body = ensureObject(input, "issue");
    const state = this.store.getState();
    const key = ensureString(body.key, "issue.key");
    if (state.issues.some((item) => item.tenantId === actor.tenantId && item.key === key)) conflict(`Issue key '${key}' already exists`);

    const issue: Issue = {
      id: newId("issue"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      title: ensureString(body.title, "issue.title"),
      description: body.description ? String(body.description) : undefined,
      category: ensureString(body.category, "issue.category"),
      status: String(body.status ?? "open") as IssueStatus,
      priority: String(body.priority ?? "medium") as Issue["priority"],
      assigneeId: body.assigneeId ? String(body.assigneeId) : undefined,
      assigneeName: body.assigneeName ? String(body.assigneeName) : undefined,
      dueDate: body.dueDate ? String(body.dueDate) : undefined,
      resolvedAt: undefined,
      closedAt: undefined,
      rootCause: body.rootCause ? String(body.rootCause) : undefined,
      resolution: body.resolution ? String(body.resolution) : undefined,
      tags: ensureArray<string>(body.tags, "issue.tags"),
      metadata: optionalObject(body.metadata)
    };

    state.issues.push(issue);
    this.store.save();
    this.store.audit(actor, "issue.create", "issue", issue.id, undefined, issue);
    this.emitEvent(actor, "ops.issue.created", { issueId: issue.id, issueKey: issue.key, title: issue.title });

    return clone(issue);
  }

  updateIssue(id: string, input: unknown, actor: RequestActor): Issue {
    const body = ensureObject(input, "issue");
    const state = this.store.getState();
    const issue = state.issues.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!issue) notFound("Issue not found");

    const before = clone(issue);

    if (body.title !== undefined) issue.title = String(body.title);
    if (body.description !== undefined) issue.description = body.description ? String(body.description) : undefined;
    if (body.category !== undefined) issue.category = String(body.category);
    if (body.status !== undefined) issue.status = String(body.status) as IssueStatus;
    if (body.priority !== undefined) issue.priority = String(body.priority) as Issue["priority"];
    if (body.assigneeId !== undefined) issue.assigneeId = body.assigneeId ? String(body.assigneeId) : undefined;
    if (body.assigneeName !== undefined) issue.assigneeName = body.assigneeName ? String(body.assigneeName) : undefined;
    if (body.dueDate !== undefined) issue.dueDate = body.dueDate ? String(body.dueDate) : undefined;
    if (body.rootCause !== undefined) issue.rootCause = body.rootCause ? String(body.rootCause) : undefined;
    if (body.resolution !== undefined) issue.resolution = body.resolution ? String(body.resolution) : undefined;
    if (body.tags !== undefined) issue.tags = ensureArray<string>(body.tags, "issue.tags");

    if (issue.status === "resolved" && !issue.resolvedAt) {
      issue.resolvedAt = nowIso();
      this.emitEvent(actor, "ops.issue.resolved", { issueId: issue.id, issueKey: issue.key });
    } else if (issue.status === "closed" && !issue.closedAt) {
      issue.closedAt = nowIso();
    }

    issue.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "issue.update", "issue", issue.id, before, issue);

    return clone(issue);
  }

  listIncidents(actor: RequestActor, query?: URLSearchParams): Incident[] {
    const status = pickQuery(query, "status");
    const severity = pickQuery(query, "severity");
    return clone(this.store.getState().incidents.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (status && item.status !== status) return false;
      if (severity && item.severity !== severity) return false;
      return true;
    }));
  }

  createIncident(input: unknown, actor: RequestActor): Incident {
    const body = ensureObject(input, "incident");
    const state = this.store.getState();
    const key = ensureString(body.key, "incident.key");
    if (state.incidents.some((item) => item.tenantId === actor.tenantId && item.key === key)) conflict(`Incident key '${key}' already exists`);

    const timeline: IncidentTimelineEntry[] = [{
      timestamp: nowIso(),
      userId: actor.userId,
      userName: actor.userId,
      action: "created",
      note: "Incident created"
    }];

    const incident: Incident = {
      id: newId("incident"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      title: ensureString(body.title, "incident.title"),
      description: body.description ? String(body.description) : undefined,
      severity: String(body.severity ?? "medium") as Incident["severity"],
      status: "open",
      assigneeId: body.assigneeId ? String(body.assigneeId) : undefined,
      assigneeName: body.assigneeName ? String(body.assigneeName) : undefined,
      startedAt: body.startedAt ? String(body.startedAt) : nowIso(),
      acknowledgedAt: undefined,
      resolvedAt: undefined,
      closedAt: undefined,
      timeline,
      rootCause: body.rootCause ? String(body.rootCause) : undefined,
      impact: body.impact ? String(body.impact) : undefined,
      actions: [],
      metadata: optionalObject(body.metadata)
    };

    state.incidents.push(incident);
    this.store.save();
    this.store.audit(actor, "incident.create", "incident", incident.id, undefined, incident);
    this.emitEvent(actor, "ops.incident.created", { incidentId: incident.id, incidentKey: incident.key, severity: incident.severity });

    return clone(incident);
  }

  updateIncident(id: string, input: unknown, actor: RequestActor): Incident {
    const body = ensureObject(input, "incident");
    const state = this.store.getState();
    const incident = state.incidents.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!incident) notFound("Incident not found");

    const before = clone(incident);
    const timelineEntry: IncidentTimelineEntry = {
      timestamp: nowIso(),
      userId: actor.userId,
      userName: actor.userId,
      action: ""
    };

    if (body.title !== undefined) incident.title = String(body.title);
    if (body.description !== undefined) incident.description = body.description ? String(body.description) : undefined;
    if (body.severity !== undefined) incident.severity = String(body.severity) as Incident["severity"];
    if (body.status !== undefined) incident.status = String(body.status) as IncidentStatus;
    if (body.assigneeId !== undefined) incident.assigneeId = body.assigneeId ? String(body.assigneeId) : undefined;
    if (body.assigneeName !== undefined) incident.assigneeName = body.assigneeName ? String(body.assigneeName) : undefined;
    if (body.rootCause !== undefined) incident.rootCause = body.rootCause ? String(body.rootCause) : undefined;
    if (body.impact !== undefined) incident.impact = body.impact ? String(body.impact) : undefined;
    if (body.actions !== undefined) incident.actions = ensureArray<string>(body.actions, "incident.actions");

    if (incident.status === "acknowledged" && !incident.acknowledgedAt) {
      incident.acknowledgedAt = nowIso();
      timelineEntry.action = "acknowledged";
    } else if (incident.status === "resolved" && !incident.resolvedAt) {
      incident.resolvedAt = nowIso();
      timelineEntry.action = "resolved";
      this.emitEvent(actor, "ops.incident.resolved", { incidentId: incident.id, incidentKey: incident.key });
    } else if (incident.status === "closed" && !incident.closedAt) {
      incident.closedAt = nowIso();
      timelineEntry.action = "closed";
    }

    if (body.timelineNote) {
      timelineEntry.note = String(body.timelineNote);
      incident.timeline.push(timelineEntry);
    }

    incident.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "incident.update", "incident", incident.id, before, incident);

    return clone(incident);
  }

  listResources(actor: RequestActor, query?: URLSearchParams): Resource[] {
    const type = pickQuery(query, "type");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().resources.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (type && item.type !== type) return false;
      if (status && item.status !== status) return false;
      return true;
    }));
  }

  createResource(input: unknown, actor: RequestActor): Resource {
    const body = ensureObject(input, "resource");
    const state = this.store.getState();
    const key = ensureString(body.key, "resource.key");
    if (state.resources.some((item) => item.tenantId === actor.tenantId && item.key === key)) conflict(`Resource key '${key}' already exists`);

    const resource: Resource = {
      id: newId("resource"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "resource.name"),
      type: String(body.type ?? "tools") as Resource["type"],
      status: String(body.status ?? "active") as Resource["status"],
      allocatedTo: body.allocatedTo ? String(body.allocatedTo) : undefined,
      capacity: body.capacity ? ensureNumber(body.capacity, "resource.capacity") : undefined,
      utilized: body.utilized ? ensureNumber(body.utilized, "resource.utilized") : undefined,
      cost: body.cost ? ensureNumber(body.cost, "resource.cost") : undefined,
      availableFrom: body.availableFrom ? String(body.availableFrom) : undefined,
      availableTo: body.availableTo ? String(body.availableTo) : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.resources.push(resource);
    this.store.save();
    this.store.audit(actor, "resource.create", "resource", resource.id, undefined, resource);

    return clone(resource);
  }

  listSLARules(actor: RequestActor): SLARule[] {
    return clone(this.store.getState().slaRules.filter((item) => item.tenantId === actor.tenantId));
  }

  createSLARule(input: unknown, actor: RequestActor): SLARule {
    const body = ensureObject(input, "slaRule");
    const state = this.store.getState();
    const key = ensureString(body.key, "slaRule.key");
    if (state.slaRules.some((item) => item.tenantId === actor.tenantId && item.key === key)) conflict(`SLA rule key '${key}' already exists`);

    const rule: SLARule = {
      id: newId("slarule"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "slaRule.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "task") as SLARule["type"],
      status: String(body.status ?? "active") as SLARule["status"],
      priority: String(body.priority ?? "medium") as SLARule["priority"],
      responseTimeMinutes: body.responseTimeMinutes ? ensureNumber(body.responseTimeMinutes, "slaRule.responseTimeMinutes") : undefined,
      resolutionTimeMinutes: body.resolutionTimeMinutes ? ensureNumber(body.resolutionTimeMinutes, "slaRule.resolutionTimeMinutes") : undefined,
      escalationAfterMinutes: body.escalationAfterMinutes ? ensureNumber(body.escalationAfterMinutes, "slaRule.escalationAfterMinutes") : undefined,
      notifyAtMinutes: body.notifyAtMinutes ? ensureArray<number>(body.notifyAtMinutes, "slaRule.notifyAtMinutes") : [],
      metadata: optionalObject(body.metadata)
    };

    state.slaRules.push(rule);
    this.store.save();
    this.store.audit(actor, "slaRule.create", "slaRule", rule.id, undefined, rule);

    return clone(rule);
  }

  listCalendarItems(actor: RequestActor, query?: URLSearchParams): OperatingCalendarItem[] {
    const type = pickQuery(query, "type");
    const startDate = pickQuery(query, "startDate");
    const endDate = pickQuery(query, "endDate");

    return clone(this.store.getState().calendarItems.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (type && item.type !== type) return false;
      if (startDate && item.startAt < startDate) return false;
      if (endDate && item.startAt > endDate) return false;
      return true;
    }));
  }

  createCalendarItem(input: unknown, actor: RequestActor): OperatingCalendarItem {
    const body = ensureObject(input, "calendarItem");
    const item: OperatingCalendarItem = {
      id: newId("calitem"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      title: ensureString(body.title, "calendarItem.title"),
      type: String(body.type ?? "other") as OperatingCalendarItem["type"],
      startAt: ensureString(body.startAt, "calendarItem.startAt"),
      endAt: body.endAt ? String(body.endAt) : undefined,
      allDay: ensureBoolean(body.allDay, false),
      assigneeId: body.assigneeId ? String(body.assigneeId) : undefined,
      assigneeName: body.assigneeName ? String(body.assigneeName) : undefined,
      recurrence: body.recurrence ? String(body.recurrence) : undefined,
      reminders: body.reminders ? ensureArray<number>(body.reminders, "calendarItem.reminders") : [],
      metadata: optionalObject(body.metadata)
    };

    this.store.getState().calendarItems.push(item);
    this.store.save();
    this.store.audit(actor, "calendarItem.create", "calendarItem", item.id, undefined, item);

    return clone(item);
  }

  generateDailyReport(actor: RequestActor): OperationsReport {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    const today = nowIso().split("T")[0];
    const tasks = state.tasks.filter((t) => t.tenantId === tenant);
    const issues = state.issues.filter((i) => i.tenantId === tenant);
    const incidents = state.incidents.filter((i) => i.tenantId === tenant);

    const report: OperationsReport = {
      id: newId("report"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type: "daily",
      name: `Daily Operations Report - ${today}`,
      period: {
        start: `${today}T00:00:00.000Z`,
        end: `${today}T23:59:59.999Z`
      },
      status: "ready",
      sections: [
        {
          title: "Tasks Summary",
          type: "tasks",
          data: {
            total: tasks.length,
            completed: tasks.filter((t) => t.status === "done" && t.updatedAt.startsWith(today)).length,
            delayed: tasks.filter((t) => isOverdue(t.dueDate) && !["done", "cancelled"].includes(t.status)).length,
            blocked: tasks.filter((t) => t.status === "blocked").length,
            inProgress: tasks.filter((t) => t.status === "in_progress").length
          }
        },
        {
          title: "Issues Summary",
          type: "issues",
          data: {
            total: issues.length,
            open: issues.filter((i) => ["open", "assigned", "investigating", "in_progress"].includes(i.status)).length,
            resolved: issues.filter((i) => i.resolvedAt?.startsWith(today)).length,
            escalated: issues.filter((i) => i.status === "escalated").length
          }
        },
        {
          title: "Incidents Summary",
          type: "incidents",
          data: {
            total: incidents.length,
            open: incidents.filter((i) => ["open", "acknowledged", "investigating"].includes(i.status)).length,
            resolved: incidents.filter((i) => i.resolvedAt?.startsWith(today)).length,
            critical: incidents.filter((i) => i.severity === "critical" && !["resolved", "closed"].includes(i.status)).length
          }
        }
      ],
      generatedBy: actor.userId,
      metadata: {}
    };

    state.reports.push(report);
    this.store.save();
    this.store.audit(actor, "report.generate", "operationsReport", report.id, undefined, report);

    return clone(report);
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((item) => item.tenantId === actor.tenantId));
  }

  private emitEvent(actor: RequestActor, type: string, data: Record<string, unknown>): void {
    const event = {
      id: newId("event"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type,
      source: "OperationsOS",
      data
    };
    this.store.getState().events.push(event);
  }
}
