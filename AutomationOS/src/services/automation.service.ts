import { DataStore } from "../core/datastore";
import {
  AutomationConnector,
  AutomationEvent,
  AutomationOverview,
  AutomationSchedule,
  AutomationTask,
  FilterCondition,
  RequestActor,
  WorkflowDefinition,
  WorkflowStep
} from "../core/domain";
import { badRequest, conflict, notFound } from "../core/errors";
import { EventBus } from "../core/event-bus";
import { newId, nowIso } from "../core/id";
import { clone, ensureArray, ensureNumber, ensureObject, ensureString, pickQuery, toBoolean } from "../core/utils";
import { ConditionEngine } from "../engines/condition-engine";
import { ScheduleEngine, estimateNextRunAt } from "../engines/schedule-engine";
import { WorkflowEngine } from "../engines/workflow-engine";

export class AutomationService {
  readonly conditionEngine: ConditionEngine;
  readonly workflowEngine: WorkflowEngine;
  readonly scheduleEngine: ScheduleEngine;

  constructor(private readonly store: DataStore, private readonly eventBus = new EventBus()) {
    this.conditionEngine = new ConditionEngine();
    this.workflowEngine = new WorkflowEngine(store, this.conditionEngine, eventBus);
    this.scheduleEngine = new ScheduleEngine(store, this.workflowEngine);
  }

  getRoutesSummary(): string {
    return "AutomationOS service is ready";
  }

  listWorkflows(actor: RequestActor, query?: URLSearchParams): WorkflowDefinition[] {
    const status = query ? pickQuery(query, "status") : undefined;
    const search = query ? pickQuery(query, "search")?.toLowerCase() : undefined;
    return clone(this.store.getState().workflows.filter((workflow) => {
      if (workflow.tenantId !== actor.tenantId) return false;
      if (status && workflow.status !== status) return false;
      if (search && !`${workflow.key} ${workflow.name} ${workflow.description ?? ""}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  getWorkflow(id: string, actor: RequestActor): WorkflowDefinition {
    const workflow = this.store.getState().workflows.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!workflow) notFound("Workflow not found");
    return clone(workflow);
  }

  createWorkflow(input: unknown, actor: RequestActor): WorkflowDefinition {
    const body = ensureObject(input, "workflow");
    const state = this.store.getState();
    const key = ensureString(body.key, "workflow.key");
    if (state.workflows.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Workflow key '${key}' already exists`);
    }

    const workflow: WorkflowDefinition = {
      id: newId("workflow"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "workflow.name"),
      description: body.description ? String(body.description) : undefined,
      version: 1,
      status: String(body.status ?? "draft") as WorkflowDefinition["status"],
      tags: ensureArray<string>(body.tags, "workflow.tags"),
      trigger: normalizeTrigger(body.trigger),
      variables: ensureObject(body.variables, "workflow.variables"),
      steps: normalizeSteps(body.steps),
      retryPolicy: {
        maxAttempts: ensureNumber((body.retryPolicy as any)?.maxAttempts, "workflow.retryPolicy.maxAttempts", 1),
        backoffSeconds: ensureNumber((body.retryPolicy as any)?.backoffSeconds, "workflow.retryPolicy.backoffSeconds", 0)
      },
      timeoutSeconds: ensureNumber(body.timeoutSeconds, "workflow.timeoutSeconds", 300),
      createdBy: actor.userId
    };

    state.workflows.unshift(workflow);
    this.store.audit(actor, "workflow.created", "workflow", workflow.id, undefined, workflow);
    this.store.save();
    return clone(workflow);
  }

  updateWorkflow(id: string, input: unknown, actor: RequestActor): WorkflowDefinition {
    const workflow = this.store.getState().workflows.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!workflow) notFound("Workflow not found");
    const before = clone(workflow);
    const body = ensureObject(input, "workflow");

    if (body.name !== undefined) workflow.name = ensureString(body.name, "workflow.name");
    if (body.description !== undefined) workflow.description = String(body.description);
    if (body.status !== undefined) workflow.status = String(body.status) as WorkflowDefinition["status"];
    if (body.tags !== undefined) workflow.tags = ensureArray<string>(body.tags, "workflow.tags");
    if (body.trigger !== undefined) workflow.trigger = normalizeTrigger(body.trigger);
    if (body.variables !== undefined) workflow.variables = ensureObject(body.variables, "workflow.variables");
    if (body.steps !== undefined) workflow.steps = normalizeSteps(body.steps);
    if (body.retryPolicy !== undefined) {
      const retryPolicy = ensureObject(body.retryPolicy, "workflow.retryPolicy");
      workflow.retryPolicy = {
        maxAttempts: ensureNumber(retryPolicy.maxAttempts, "workflow.retryPolicy.maxAttempts", workflow.retryPolicy.maxAttempts),
        backoffSeconds: ensureNumber(retryPolicy.backoffSeconds, "workflow.retryPolicy.backoffSeconds", workflow.retryPolicy.backoffSeconds)
      };
    }
    if (body.timeoutSeconds !== undefined) workflow.timeoutSeconds = ensureNumber(body.timeoutSeconds, "workflow.timeoutSeconds", workflow.timeoutSeconds);

    workflow.version += 1;
    workflow.updatedAt = nowIso();
    workflow.updatedBy = actor.userId;
    this.store.audit(actor, "workflow.updated", "workflow", workflow.id, before, workflow);
    this.store.save();
    return clone(workflow);
  }

  setWorkflowStatus(id: string, status: WorkflowDefinition["status"], actor: RequestActor): WorkflowDefinition {
    const workflow = this.store.getState().workflows.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!workflow) notFound("Workflow not found");
    const before = clone(workflow);
    workflow.status = status;
    workflow.updatedAt = nowIso();
    workflow.updatedBy = actor.userId;
    this.store.audit(actor, `workflow.${status}`, "workflow", workflow.id, before, workflow);
    this.store.save();
    return clone(workflow);
  }

  deleteWorkflow(id: string, actor: RequestActor): WorkflowDefinition {
    return this.setWorkflowStatus(id, "archived", actor);
  }

  runWorkflow(id: string, input: unknown, actor: RequestActor) {
    const workflow = this.store.getState().workflows.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!workflow) notFound("Workflow not found");
    const payload = ensureObject(input, "run.payload");
    const execution = this.workflowEngine.start(workflow, { manual: true, payload }, actor);
    this.store.audit(actor, "workflow.run", "workflow", workflow.id, undefined, { executionId: execution.id });
    return execution;
  }

  ingestEvent(input: unknown, actor: RequestActor) {
    const body = ensureObject(input, "event");
    const event: AutomationEvent = {
      id: newId("event"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type: ensureString(body.type, "event.type"),
      source: String(body.source ?? "external"),
      actorId: actor.userId,
      role: actor.role,
      correlationId: body.correlationId ? String(body.correlationId) : undefined,
      data: ensureObject(body.data, "event.data"),
      handledExecutionIds: []
    };

    this.store.getState().events.unshift(event);
    const workflows = this.matchingEventWorkflows(event, "event");
    const executions = workflows.map((workflow) => this.workflowEngine.start(workflow, { ...clone(event) }, actor, event.id));
    event.handledExecutionIds = executions.map((execution) => execution.id);
    this.eventBus.publish(event);
    this.store.audit(actor, "event.ingested", "event", event.id, undefined, { type: event.type, executions: event.handledExecutionIds });
    this.store.save();
    return { event: clone(event), matchedWorkflows: workflows.length, executions };
  }

  handleWebhook(path: string, input: unknown, actor: RequestActor) {
    const body = ensureObject(input, "webhook.payload");
    const event: AutomationEvent = {
      id: newId("event"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type: `webhook.${path}`,
      source: String(body.source ?? "webhook"),
      actorId: actor.userId,
      role: actor.role,
      correlationId: body.correlationId ? String(body.correlationId) : undefined,
      data: ensureObject(body.data ?? body, "webhook.data"),
      handledExecutionIds: []
    };

    this.store.getState().events.unshift(event);
    const workflows = this.matchingEventWorkflows(event, "webhook", path);
    const executions = workflows.map((workflow) => this.workflowEngine.start(workflow, { ...clone(event) }, actor, event.id));
    event.handledExecutionIds = executions.map((execution) => execution.id);
    this.store.audit(actor, "webhook.received", "event", event.id, undefined, { path, executions: event.handledExecutionIds });
    this.store.save();
    return { event: clone(event), matchedWorkflows: workflows.length, executions };
  }

  listEvents(actor: RequestActor): AutomationEvent[] {
    return clone(this.store.getState().events.filter((event) => event.tenantId === actor.tenantId));
  }

  listExecutions(actor: RequestActor, query?: URLSearchParams) {
    const status = query ? pickQuery(query, "status") : undefined;
    return clone(this.store.getState().executions.filter((execution) => {
      if (execution.tenantId !== actor.tenantId) return false;
      if (status && execution.status !== status) return false;
      return true;
    }));
  }

  getExecution(id: string, actor: RequestActor) {
    const execution = this.store.getState().executions.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!execution) notFound("Execution not found");
    return clone(execution);
  }

  cancelExecution(id: string, input: unknown, actor: RequestActor) {
    const body = ensureObject(input, "cancel");
    const execution = this.workflowEngine.cancelExecution(id, actor, body.reason ? String(body.reason) : undefined);
    this.store.audit(actor, "execution.cancelled", "execution", id, undefined, { reason: body.reason });
    return execution;
  }

  listApprovals(actor: RequestActor, query?: URLSearchParams) {
    const status = query ? pickQuery(query, "status") : undefined;
    return clone(this.store.getState().approvals.filter((approval) => {
      if (approval.tenantId !== actor.tenantId) return false;
      if (status && approval.status !== status) return false;
      return true;
    }));
  }

  createApproval(input: unknown, actor: RequestActor) {
    const body = ensureObject(input, "approval");
    const approval = {
      id: newId("approval"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      title: ensureString(body.title, "approval.title"),
      description: body.description ? String(body.description) : undefined,
      status: "pending" as const,
      requestedBy: actor.userId,
      approverRole: body.approverRole ? String(body.approverRole) as any : "approver",
      approverUserIds: ensureArray<string>(body.approverUserIds, "approval.approverUserIds"),
      dueAt: body.dueAt ? String(body.dueAt) : undefined,
      payload: ensureObject(body.payload, "approval.payload")
    };
    this.store.getState().approvals.unshift(approval);
    this.store.audit(actor, "approval.created", "approval", approval.id, undefined, approval);
    this.store.save();
    return clone(approval);
  }

  decideApproval(id: string, input: unknown, actor: RequestActor) {
    const body = ensureObject(input, "approval.decision");
    const decision = String(body.decision ?? "");
    if (decision !== "approved" && decision !== "rejected") badRequest("decision must be 'approved' or 'rejected'");
    const execution = this.workflowEngine.resumeAfterApproval(id, decision, actor, body.note ? String(body.note) : undefined);
    this.store.audit(actor, `approval.${decision}`, "approval", id, undefined, { note: body.note, executionId: execution?.id });
    return execution;
  }

  listTasks(actor: RequestActor, query?: URLSearchParams): AutomationTask[] {
    const status = query ? pickQuery(query, "status") : undefined;
    return clone(this.store.getState().tasks.filter((task) => {
      if (task.tenantId !== actor.tenantId) return false;
      if (status && task.status !== status) return false;
      return true;
    }));
  }

  createTask(input: unknown, actor: RequestActor): AutomationTask {
    const body = ensureObject(input, "task");
    const task: AutomationTask = {
      id: newId("task"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      title: ensureString(body.title, "task.title"),
      description: body.description ? String(body.description) : undefined,
      status: "open",
      priority: String(body.priority ?? "normal") as AutomationTask["priority"],
      assigneeRole: body.assigneeRole ? String(body.assigneeRole) as AutomationTask["assigneeRole"] : undefined,
      assigneeId: body.assigneeId ? String(body.assigneeId) : undefined,
      dueAt: body.dueAt ? String(body.dueAt) : undefined,
      payload: ensureObject(body.payload, "task.payload")
    };
    this.store.getState().tasks.unshift(task);
    this.store.audit(actor, "task.created", "task", task.id, undefined, task);
    this.store.save();
    return clone(task);
  }

  updateTaskStatus(id: string, input: unknown, actor: RequestActor): AutomationTask {
    const body = ensureObject(input, "task.status");
    const task = this.store.getState().tasks.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!task) notFound("Task not found");
    const before = clone(task);
    task.status = String(body.status ?? task.status) as AutomationTask["status"];
    if (task.status === "completed") task.completedAt = nowIso();
    task.updatedAt = nowIso();
    this.store.audit(actor, "task.status_updated", "task", task.id, before, task);
    this.store.save();
    return clone(task);
  }

  listSchedules(actor: RequestActor) {
    return clone(this.store.getState().schedules.filter((schedule) => schedule.tenantId === actor.tenantId));
  }

  createSchedule(input: unknown, actor: RequestActor): AutomationSchedule {
    const body = ensureObject(input, "schedule");
    const workflowId = ensureString(body.workflowId, "schedule.workflowId");
    const workflow = this.store.getState().workflows.find((item) => item.id === workflowId && item.tenantId === actor.tenantId);
    if (!workflow) notFound("Workflow for schedule not found");
    const schedule: AutomationSchedule = {
      id: newId("schedule"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: ensureString(body.key, "schedule.key"),
      name: ensureString(body.name, "schedule.name"),
      workflowId,
      expression: String(body.expression ?? "every 1 day"),
      enabled: toBoolean(body.enabled, true),
      payload: ensureObject(body.payload, "schedule.payload"),
      nextRunAt: body.nextRunAt ? String(body.nextRunAt) : estimateNextRunAt(String(body.expression ?? "every 1 day"))
    };
    this.store.getState().schedules.unshift(schedule);
    this.store.audit(actor, "schedule.created", "schedule", schedule.id, undefined, schedule);
    this.store.save();
    return clone(schedule);
  }

  runSchedule(id: string, actor: RequestActor) {
    const execution = this.scheduleEngine.runSchedule(id, actor);
    this.store.audit(actor, "schedule.run", "schedule", id, undefined, { executionId: execution.id });
    return execution;
  }

  runDueSchedules(actor: RequestActor) {
    const result = this.scheduleEngine.runDue(actor);
    this.store.audit(actor, "schedule.run_due", "schedule", undefined, undefined, { count: result.executions.length });
    return result;
  }

  listConnectors(actor: RequestActor) {
    return clone(this.store.getState().connectors.filter((connector) => connector.tenantId === actor.tenantId));
  }

  createConnector(input: unknown, actor: RequestActor): AutomationConnector {
    const body = ensureObject(input, "connector");
    const connector: AutomationConnector = {
      id: newId("connector"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "connector.name"),
      type: String(body.type ?? "internal") as AutomationConnector["type"],
      status: String(body.status ?? "active") as AutomationConnector["status"],
      config: ensureObject(body.config, "connector.config")
    };
    this.store.getState().connectors.unshift(connector);
    this.store.audit(actor, "connector.created", "connector", connector.id, undefined, connector);
    this.store.save();
    return clone(connector);
  }

  listNotifications(actor: RequestActor) {
    return clone(this.store.getState().notifications.filter((notification) => notification.tenantId === actor.tenantId));
  }

  auditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((audit) => audit.tenantId === actor.tenantId));
  }

  overview(actor: RequestActor): AutomationOverview {
    const state = this.store.getState();
    const workflows = state.workflows.filter((item) => item.tenantId === actor.tenantId);
    const executions = state.executions.filter((item) => item.tenantId === actor.tenantId);
    const approvals = state.approvals.filter((item) => item.tenantId === actor.tenantId);
    const tasks = state.tasks.filter((item) => item.tenantId === actor.tenantId);
    const notifications = state.notifications.filter((item) => item.tenantId === actor.tenantId);
    const events = state.events.filter((item) => item.tenantId === actor.tenantId);
    return {
      workflows: {
        total: workflows.length,
        active: workflows.filter((item) => item.status === "active").length,
        paused: workflows.filter((item) => item.status === "paused").length,
        draft: workflows.filter((item) => item.status === "draft").length,
        archived: workflows.filter((item) => item.status === "archived").length
      },
      executions: {
        total: executions.length,
        running: executions.filter((item) => item.status === "running").length,
        waitingApproval: executions.filter((item) => item.status === "waiting_approval").length,
        completed: executions.filter((item) => item.status === "completed").length,
        failed: executions.filter((item) => item.status === "failed").length,
        cancelled: executions.filter((item) => item.status === "cancelled").length
      },
      approvals: {
        total: approvals.length,
        pending: approvals.filter((item) => item.status === "pending").length,
        approved: approvals.filter((item) => item.status === "approved").length,
        rejected: approvals.filter((item) => item.status === "rejected").length
      },
      tasks: {
        total: tasks.length,
        open: tasks.filter((item) => item.status === "open").length,
        inProgress: tasks.filter((item) => item.status === "in_progress").length,
        completed: tasks.filter((item) => item.status === "completed").length,
        cancelled: tasks.filter((item) => item.status === "cancelled").length
      },
      events: { total: events.length },
      notifications: {
        total: notifications.length,
        sent: notifications.filter((item) => item.status === "sent").length,
        queued: notifications.filter((item) => item.status === "queued").length,
        failed: notifications.filter((item) => item.status === "failed").length
      }
    };
  }

  private matchingEventWorkflows(event: AutomationEvent, triggerType: "event" | "webhook", path?: string): WorkflowDefinition[] {
    return this.store.getState().workflows.filter((workflow) => {
      if (workflow.tenantId !== event.tenantId || workflow.status !== "active") return false;
      if (workflow.trigger.type !== triggerType) return false;
      if (triggerType === "webhook" && workflow.trigger.webhookPath !== path) return false;
      if (workflow.trigger.eventType && workflow.trigger.eventType !== event.type) return false;
      if (workflow.trigger.source && workflow.trigger.source !== event.source) return false;
      return this.conditionEngine.matches(event, workflow.trigger.filters ?? []);
    });
  }
}

function normalizeTrigger(input: unknown): WorkflowDefinition["trigger"] {
  const trigger = ensureObject(input, "workflow.trigger");
  const type = String(trigger.type ?? "manual") as WorkflowDefinition["trigger"]["type"];
  return {
    type,
    eventType: trigger.eventType ? String(trigger.eventType) : undefined,
    source: trigger.source ? String(trigger.source) : undefined,
    webhookPath: trigger.webhookPath ? String(trigger.webhookPath).replace(/^\//, "") : undefined,
    scheduleKey: trigger.scheduleKey ? String(trigger.scheduleKey) : undefined,
    filters: ensureArray<FilterCondition>(trigger.filters, "workflow.trigger.filters"),
    config: ensureObject(trigger.config, "workflow.trigger.config")
  };
}

function normalizeSteps(input: unknown): WorkflowStep[] {
  const steps = ensureArray<any>(input, "workflow.steps");
  return steps.map((step, index) => {
    const normalized: WorkflowStep = {
      id: String(step.id ?? step.key ?? `step_${index + 1}`),
      key: ensureString(step.key ?? step.id ?? `step_${index + 1}`, "step.key"),
      name: ensureString(step.name ?? step.key ?? step.id ?? `Step ${index + 1}`, "step.name"),
      type: String(step.type ?? "action") as WorkflowStep["type"],
      action: step.action ? {
        type: String(step.action.type) as any,
        config: ensureObject(step.action.config, "step.action.config")
      } : undefined,
      filters: ensureArray<FilterCondition>(step.filters, "step.filters"),
      nextStepId: step.nextStepId ? String(step.nextStepId) : undefined,
      onSuccessStepId: step.onSuccessStepId ? String(step.onSuccessStepId) : undefined,
      onFailureStepId: step.onFailureStepId ? String(step.onFailureStepId) : undefined,
      onTrueStepId: step.onTrueStepId ? String(step.onTrueStepId) : undefined,
      onFalseStepId: step.onFalseStepId ? String(step.onFalseStepId) : undefined,
      delaySeconds: step.delaySeconds !== undefined ? Number(step.delaySeconds) : undefined,
      approverRole: step.approverRole ? String(step.approverRole) as any : undefined,
      approverUserIds: ensureArray<string>(step.approverUserIds, "step.approverUserIds"),
      dueInHours: step.dueInHours !== undefined ? Number(step.dueInHours) : undefined,
      titleTemplate: step.titleTemplate ? String(step.titleTemplate) : undefined,
      descriptionTemplate: step.descriptionTemplate ? String(step.descriptionTemplate) : undefined,
      config: ensureObject(step.config, "step.config")
    };
    return normalized;
  });
}
