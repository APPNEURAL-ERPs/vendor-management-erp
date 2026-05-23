import { DataStore } from "./core/datastore";
import {
  WorkflowDefinition,
  WorkflowTrigger,
  WorkflowStep,
  WorkflowTransition,
  Approval,
  Escalation,
  WorkflowExecution,
  StepResult,
  WorkflowError,
  WorkflowOverview,
  RequestActor,
  WorkflowCondition,
  ExecutionAuditEntry
} from "./domain";
import { badRequest, conflict, notFound } from "./core/errors";
import { newId, nowIso } from "./core/id";
import { clone, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, optionalObject, pickQuery } from "./core/utils";

export class WorkflowService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "WorkflowOS service is ready";
  }

  overview(actor: RequestActor): WorkflowOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;

    const workflows = state.workflows.filter(w => w.tenantId === tenant);
    const executions = state.executions.filter(e => e.tenantId === tenant);
    const approvals = state.approvals.filter(a => a.tenantId === tenant);
    const escalations = state.escalations.filter(e => e.tenantId === tenant);
    const queueItems = state.queueItems.filter(q => q.tenantId === tenant);
    const errors = state.errors.filter(e => e.tenantId === tenant);

    return {
      workflows: {
        total: workflows.length,
        active: workflows.filter(w => w.status === "active").length,
        paused: workflows.filter(w => w.status === "paused").length,
        draft: workflows.filter(w => w.status === "draft").length
      },
      executions: {
        total: executions.length,
        running: executions.filter(e => e.status === "running").length,
        completed: executions.filter(e => e.status === "completed").length,
        failed: executions.filter(e => e.status === "failed").length,
        waiting: executions.filter(e => e.status === "waiting").length,
        cancelled: executions.filter(e => e.status === "cancelled").length
      },
      approvals: {
        pending: approvals.filter(a => a.status === "pending").length,
        approved: approvals.filter(a => a.status === "approved").length,
        rejected: approvals.filter(a => a.status === "rejected").length,
        escalated: approvals.filter(a => a.status === "escalated").length
      },
      escalations: {
        pending: escalations.filter(e => e.status === "pending").length,
        resolved: escalations.filter(e => e.status === "resolved").length,
        expired: escalations.filter(e => e.status === "expired").length
      },
      queue: {
        queued: queueItems.filter(q => q.status === "queued").length,
        processing: queueItems.filter(q => q.status === "processing").length,
        deadLetter: queueItems.filter(q => q.status === "dead_letter").length
      },
      errors: {
        open: errors.filter(e => !e.resolved).length,
        resolved: errors.filter(e => e.resolved).length
      }
    };
  }

  listWorkflows(actor: RequestActor, query?: URLSearchParams): WorkflowDefinition[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");

    return clone(this.store.getState().workflows.filter(w => {
      if (w.tenantId !== actor.tenantId) return false;
      if (search && !`${w.key} ${w.name} ${w.description ?? ""}`.toLowerCase().includes(search)) return false;
      if (status && w.status !== status) return false;
      return true;
    }));
  }

  getWorkflow(id: string, actor: RequestActor): WorkflowDefinition {
    const workflow = this.store.getState().workflows.find(w => w.id === id && w.tenantId === actor.tenantId);
    if (!workflow) notFound("Workflow not found");
    return clone(workflow);
  }

  createWorkflow(input: unknown, actor: RequestActor): WorkflowDefinition {
    const body = ensureObject(input, "workflow");
    const state = this.store.getState();
    const key = ensureString(body.key, "workflow.key");

    if (state.workflows.some(w => w.tenantId === actor.tenantId && w.key === key)) {
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
      status: String(body.status ?? "draft") as any,
      triggerIds: [],
      stepIds: [],
      transitionIds: [],
      variables: optionalObject(body.variables),
      inputSchema: optionalObject(body.inputSchema),
      outputSchema: optionalObject(body.outputSchema),
      tags: ensureArray<string>(body.tags, "workflow.tags"),
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      createdBy: actor.userId,
      metadata: optionalObject(body.metadata)
    };

    state.workflows.push(workflow);
    this.store.save();
    this.store.audit(actor, "workflow.create", "workflow", workflow.id, undefined, workflow);

    return clone(workflow);
  }

  updateWorkflow(id: string, input: unknown, actor: RequestActor): WorkflowDefinition {
    const body = ensureObject(input, "workflow");
    const state = this.store.getState();
    const workflow = state.workflows.find(w => w.id === id && w.tenantId === actor.tenantId);

    if (!workflow) notFound("Workflow not found");

    const before = clone(workflow);

    if (body.name) workflow.name = String(body.name);
    if (body.description !== undefined) workflow.description = body.description ? String(body.description) : undefined;
    if (body.status) workflow.status = String(body.status) as any;
    if (body.variables) workflow.variables = { ...workflow.variables, ...optionalObject(body.variables) };
    if (body.tags) workflow.tags = ensureArray<string>(body.tags, "workflow.tags");
    if (body.ownerId !== undefined) workflow.ownerId = body.ownerId ? String(body.ownerId) : undefined;
    workflow.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "workflow.update", "workflow", workflow.id, before, workflow);

    return clone(workflow);
  }

  publishWorkflow(id: string, actor: RequestActor): WorkflowDefinition {
    const state = this.store.getState();
    const workflow = state.workflows.find(w => w.id === id && w.tenantId === actor.tenantId);

    if (!workflow) notFound("Workflow not found");
    if (workflow.status === "active") conflict("Workflow is already active");

    const before = clone(workflow);
    workflow.status = "active";
    workflow.version += 1;
    workflow.publishedAt = nowIso();
    workflow.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "workflow.publish", "workflow", workflow.id, before, workflow);

    return clone(workflow);
  }

  listTriggers(actor: RequestActor, query?: URLSearchParams): WorkflowTrigger[] {
    const workflowId = pickQuery(query, "workflowId");

    return clone(this.store.getState().triggers.filter(t => {
      if (t.tenantId !== actor.tenantId) return false;
      if (workflowId && t.workflowId !== workflowId) return false;
      return true;
    }));
  }

  createTrigger(workflowId: string, input: unknown, actor: RequestActor): WorkflowTrigger {
    const body = ensureObject(input, "trigger");
    const state = this.store.getState();
    const workflow = state.workflows.find(w => w.id === workflowId && w.tenantId === actor.tenantId);

    if (!workflow) notFound("Workflow not found");

    const key = ensureString(body.key, "trigger.key");
    if (state.triggers.some(t => t.workflowId === workflowId && t.key === key)) {
      conflict(`Trigger key '${key}' already exists for this workflow`);
    }

    const trigger: WorkflowTrigger = {
      id: newId("trigger"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      workflowId,
      key,
      type: String(body.type ?? "event") as any,
      eventName: body.eventName ? String(body.eventName) : undefined,
      scheduleCron: body.scheduleCron ? String(body.scheduleCron) : undefined,
      webhookPath: body.webhookPath ? String(body.webhookPath) : undefined,
      conditions: ensureArray<WorkflowCondition>(body.conditions, "trigger.conditions"),
      status: String(body.status ?? "active") as any,
      config: optionalObject(body.config)
    };

    state.triggers.push(trigger);
    workflow.triggerIds.push(trigger.id);
    this.store.save();
    this.store.audit(actor, "trigger.create", "trigger", trigger.id, undefined, trigger);

    return clone(trigger);
  }

  listSteps(actor: RequestActor, query?: URLSearchParams): WorkflowStep[] {
    const workflowId = pickQuery(query, "workflowId");

    return clone(this.store.getState().steps.filter(s => {
      if (s.tenantId !== actor.tenantId) return false;
      if (workflowId && s.workflowId !== workflowId) return false;
      return true;
    }));
  }

  createStep(workflowId: string, input: unknown, actor: RequestActor): WorkflowStep {
    const body = ensureObject(input, "step");
    const state = this.store.getState();
    const workflow = state.workflows.find(w => w.id === workflowId && w.tenantId === actor.tenantId);

    if (!workflow) notFound("Workflow not found");

    const key = ensureString(body.key, "step.key");
    if (state.steps.some(s => s.workflowId === workflowId && s.key === key)) {
      conflict(`Step key '${key}' already exists for this workflow`);
    }

    const step: WorkflowStep = {
      id: newId("step"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      workflowId,
      key,
      name: ensureString(body.name, "step.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "custom") as any,
      order: ensureNumber(body.order, "step.order", workflow.stepIds.length + 1),
      status: String(body.status ?? "active") as any,
      inputSchema: optionalObject(body.inputSchema),
      outputSchema: optionalObject(body.outputSchema),
      config: optionalObject(body.config),
      retryPolicy: body.retryPolicy ? optionalObject(body.retryPolicy) as any : undefined,
      timeout: body.timeout ? ensureNumber(body.timeout, "step.timeout") : undefined,
      continueOnError: ensureBoolean(body.continueOnError, false)
    };

    state.steps.push(step);
    workflow.stepIds.push(step.id);
    this.store.save();
    this.store.audit(actor, "step.create", "step", step.id, undefined, step);

    return clone(step);
  }

  listTransitions(actor: RequestActor, query?: URLSearchParams): WorkflowTransition[] {
    const workflowId = pickQuery(query, "workflowId");

    return clone(this.store.getState().transitions.filter(t => {
      if (t.tenantId !== actor.tenantId) return false;
      if (workflowId && t.workflowId !== workflowId) return false;
      return true;
    }));
  }

  createTransition(workflowId: string, input: unknown, actor: RequestActor): WorkflowTransition {
    const body = ensureObject(input, "transition");
    const state = this.store.getState();
    const workflow = state.workflows.find(w => w.id === workflowId && w.tenantId === actor.tenantId);

    if (!workflow) notFound("Workflow not found");

    const transition: WorkflowTransition = {
      id: newId("trans"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      workflowId,
      fromStepId: ensureString(body.fromStepId, "transition.fromStepId"),
      toStepId: ensureString(body.toStepId, "transition.toStepId"),
      name: ensureString(body.name, "transition.name"),
      conditions: ensureArray<WorkflowCondition>(body.conditions, "transition.conditions"),
      priority: ensureNumber(body.priority, "transition.priority", 1)
    };

    state.transitions.push(transition);
    workflow.transitionIds.push(transition.id);
    this.store.save();
    this.store.audit(actor, "transition.create", "transition", transition.id, undefined, transition);

    return clone(transition);
  }

  listExecutions(actor: RequestActor, query?: URLSearchParams): WorkflowExecution[] {
    const workflowId = pickQuery(query, "workflowId");
    const status = pickQuery(query, "status");

    return clone(this.store.getState().executions.filter(e => {
      if (e.tenantId !== actor.tenantId) return false;
      if (workflowId && e.workflowId !== workflowId) return false;
      if (status && e.status !== status) return false;
      return true;
    }));
  }

  getExecution(id: string, actor: RequestActor): WorkflowExecution {
    const execution = this.store.getState().executions.find(e => e.id === id && e.tenantId === actor.tenantId);
    if (!execution) notFound("Execution not found");
    return clone(execution);
  }

  runWorkflow(id: string, input: unknown, actor: RequestActor): WorkflowExecution {
    const body = optionalObject(input);
    const state = this.store.getState();
    const workflow = state.workflows.find(w => w.id === id && w.tenantId === actor.tenantId);

    if (!workflow) notFound("Workflow not found");
    if (workflow.status !== "active") badRequest("Workflow is not active");

    const execution: WorkflowExecution = {
      id: newId("exec"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      workflowId: workflow.id,
      workflowKey: workflow.key,
      status: "running",
      triggeredBy: "manual",
      input: body,
      output: {},
      currentStepId: workflow.stepIds[0],
      currentState: "started",
      stepResults: [],
      startedAt: nowIso(),
      retryCount: 0,
      maxRetries: ensureNumber(workflow.variables.maxRetries, "workflow.maxRetries", 3),
      context: { ...workflow.variables, ...body },
      auditTrail: [{
        timestamp: nowIso(),
        action: "execution.started",
        actor: actor.userId,
        details: "Manual workflow execution started"
      }]
    };

    state.executions.unshift(execution);
    this.store.save();
    this.store.audit(actor, "workflow.run", "execution", execution.id, undefined, execution);

    return clone(execution);
  }

  listStepResults(actor: RequestActor, query?: URLSearchParams): StepResult[] {
    const executionId = pickQuery(query, "executionId");

    return clone(this.store.getState().stepResults.filter(r => {
      if (r.tenantId !== actor.tenantId) return false;
      if (executionId && r.executionId !== executionId) return false;
      return true;
    }));
  }

  getStepResult(id: string, actor: RequestActor): StepResult {
    const result = this.store.getState().stepResults.find(r => r.id === id && r.tenantId === actor.tenantId);
    if (!result) notFound("Step result not found");
    return clone(result);
  }

  listApprovals(actor: RequestActor, query?: URLSearchParams): Approval[] {
    const status = pickQuery(query, "status");
    const approverRole = pickQuery(query, "approverRole");

    return clone(this.store.getState().approvals.filter(a => {
      if (a.tenantId !== actor.tenantId) return false;
      if (status && a.status !== status) return false;
      if (approverRole && a.approverRole !== approverRole) return false;
      return true;
    }));
  }

  getApproval(id: string, actor: RequestActor): Approval {
    const approval = this.store.getState().approvals.find(a => a.id === id && a.tenantId === actor.tenantId);
    if (!approval) notFound("Approval not found");
    return clone(approval);
  }

  approveStep(id: string, input: unknown, actor: RequestActor): Approval {
    const body = optionalObject(input);
    const state = this.store.getState();
    const approval = state.approvals.find(a => a.id === id && a.tenantId === actor.tenantId);

    if (!approval) notFound("Approval not found");
    if (approval.status !== "pending") conflict("Approval is not pending");

    const before = clone(approval);
    approval.status = "approved";
    approval.approverId = actor.userId;
    approval.decisionAt = nowIso();
    approval.reason = body.reason ? String(body.reason) : undefined;
    approval.currentApprovals += 1;
    approval.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "approval.approve", "approval", approval.id, before, approval);

    return clone(approval);
  }

  rejectApproval(id: string, input: unknown, actor: RequestActor): Approval {
    const body = optionalObject(input);
    const state = this.store.getState();
    const approval = state.approvals.find(a => a.id === id && a.tenantId === actor.tenantId);

    if (!approval) notFound("Approval not found");
    if (approval.status !== "pending") conflict("Approval is not pending");

    const before = clone(approval);
    approval.status = "rejected";
    approval.approverId = actor.userId;
    approval.decisionAt = nowIso();
    approval.reason = ensureString(body.reason, "reject.reason");
    approval.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "approval.reject", "approval", approval.id, before, approval);

    return clone(approval);
  }

  escalateApproval(id: string, input: unknown, actor: RequestActor): { approval: Approval; escalation: Escalation } {
    const body = ensureObject(input, "escalation");
    const state = this.store.getState();
    const approval = state.approvals.find(a => a.id === id && a.tenantId === actor.tenantId);

    if (!approval) notFound("Approval not found");
    if (approval.status !== "pending") conflict("Approval cannot be escalated");

    const before = clone(approval);
    approval.status = "escalated";
    approval.escalationId = newId("escalation");
    approval.updatedAt = nowIso();

    const escalation: Escalation = {
      id: approval.escalationId,
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      approvalId: approval.id,
      fromApproverId: approval.approverId,
      toApproverId: body.toApproverId ? String(body.toApproverId) : undefined,
      toApproverRole: body.toApproverRole ? String(body.toApproverRole) : undefined,
      reason: ensureString(body.reason, "escalation.reason"),
      escalatedBy: actor.userId,
      escalatedAt: nowIso(),
      status: "pending"
    };

    state.escalations.push(escalation);
    this.store.save();
    this.store.audit(actor, "approval.escalate", "approval", approval.id, before, approval);
    this.store.audit(actor, "escalation.create", "escalation", escalation.id, undefined, escalation);

    return { approval: clone(approval), escalation: clone(escalation) };
  }

  listEscalations(actor: RequestActor, query?: URLSearchParams): Escalation[] {
    const status = pickQuery(query, "status");

    return clone(this.store.getState().escalations.filter(e => {
      if (e.tenantId !== actor.tenantId) return false;
      if (status && e.status !== status) return false;
      return true;
    }));
  }

  getEscalation(id: string, actor: RequestActor): Escalation {
    const escalation = this.store.getState().escalations.find(e => e.id === id && e.tenantId === actor.tenantId);
    if (!escalation) notFound("Escalation not found");
    return clone(escalation);
  }

  resolveEscalation(id: string, actor: RequestActor): Escalation {
    const state = this.store.getState();
    const escalation = state.escalations.find(e => e.id === id && e.tenantId === actor.tenantId);

    if (!escalation) notFound("Escalation not found");
    if (escalation.status !== "pending") conflict("Escalation is not pending");

    const before = clone(escalation);
    escalation.status = "resolved";
    escalation.resolvedAt = nowIso();
    escalation.updatedAt = nowIso();

    const approval = state.approvals.find(a => a.id === escalation.approvalId);
    if (approval && approval.status === "escalated") {
      approval.status = "pending";
      approval.updatedAt = nowIso();
    }

    this.store.save();
    this.store.audit(actor, "escalation.resolve", "escalation", escalation.id, before, escalation);

    return clone(escalation);
  }

  cancelExecution(id: string, actor: RequestActor): WorkflowExecution {
    const state = this.store.getState();
    const execution = state.executions.find(e => e.id === id && e.tenantId === actor.tenantId);

    if (!execution) notFound("Execution not found");
    if (!["running", "waiting", "paused"].includes(execution.status)) {
      conflict("Execution cannot be cancelled");
    }

    const before = clone(execution);
    execution.status = "cancelled";
    execution.completedAt = nowIso();
    execution.output = { cancelled: true, cancelledBy: actor.userId };
    execution.auditTrail.push({
      timestamp: nowIso(),
      action: "execution.cancelled",
      actor: actor.userId,
      details: "Execution cancelled by user"
    });
    execution.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "execution.cancel", "execution", execution.id, before, execution);

    return clone(execution);
  }

  retryExecution(id: string, actor: RequestActor): WorkflowExecution {
    const state = this.store.getState();
    const execution = state.executions.find(e => e.id === id && e.tenantId === actor.tenantId);

    if (!execution) notFound("Execution not found");
    if (execution.status !== "failed") conflict("Only failed executions can be retried");
    if (execution.retryCount >= execution.maxRetries) conflict("Maximum retries exceeded");

    const before = clone(execution);
    execution.status = "running";
    execution.retryCount += 1;
    execution.error = undefined;
    execution.startedAt = nowIso();
    execution.auditTrail.push({
      timestamp: nowIso(),
      action: "execution.retry",
      actor: actor.userId,
      details: `Retry attempt ${execution.retryCount} of ${execution.maxRetries}`
    });
    execution.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "execution.retry", "execution", execution.id, before, execution);

    return clone(execution);
  }

  listErrors(actor: RequestActor, query?: URLSearchParams): WorkflowError[] {
    const executionId = pickQuery(query, "executionId");
    const resolved = query?.get("resolved");

    return clone(this.store.getState().errors.filter(e => {
      if (e.tenantId !== actor.tenantId) return false;
      if (executionId && e.executionId !== executionId) return false;
      if (resolved !== null && resolved !== undefined) {
        const isResolved = resolved === "true";
        if (e.resolved !== isResolved) return false;
      }
      return true;
    }));
  }

  resolveError(id: string, actor: RequestActor): WorkflowError {
    const state = this.store.getState();
    const error = state.errors.find(e => e.id === id && e.tenantId === actor.tenantId);

    if (!error) notFound("Workflow error not found");
    if (error.resolved) conflict("Error is already resolved");

    const before = clone(error);
    error.resolved = true;
    error.resolvedAt = nowIso();
    error.resolvedBy = actor.userId;
    error.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "error.resolve", "error", error.id, before, error);

    return clone(error);
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter(log => log.tenantId === actor.tenantId));
  }

  emitWorkflowEvent(type: string, data: Record<string, unknown>, actor: RequestActor): void {
    const execution: WorkflowExecution = {
      id: newId("event_exec"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      workflowId: "",
      workflowKey: "",
      status: "running",
      triggeredBy: "event",
      triggeredById: type,
      input: data,
      output: {},
      currentState: "event_received",
      stepResults: [],
      startedAt: nowIso(),
      auditTrail: [{
        timestamp: nowIso(),
        action: "event.received",
        actor: actor.userId,
        details: `Event ${type} received`
      }],
      context: data,
      maxRetries: 3,
      retryCount: 0
    };

    const state = this.store.getState();
    const matchingTriggers = state.triggers.filter(t =>
      t.tenantId === actor.tenantId &&
      t.status === "active" &&
      t.type === "event" &&
      t.eventName === type
    );

    for (const trigger of matchingTriggers) {
      const workflow = state.workflows.find(w => w.id === trigger.workflowId && w.status === "active");
      if (!workflow) continue;

      const newExecution = clone(execution);
      newExecution.id = newId("exec");
      newExecution.workflowId = workflow.id;
      newExecution.workflowKey = workflow.key;
      newExecution.context = { ...workflow.variables, ...data };
      newExecution.auditTrail.push({
        timestamp: nowIso(),
        action: "workflow.matched",
        details: `Matched workflow ${workflow.key}`
      });

      state.executions.unshift(newExecution);
    }

    this.store.save();
  }
}
