import { DataStore } from "./core/datastore";
import {
  Action,
  Approval,
  ApprovalStep,
  AutomationEvent,
  AutomationLog,
  AutomationOverview,
  AutomationRun,
  RequestActor,
  RetryPolicy,
  RunStatus,
  Schedule,
  StepRun,
  Trigger,
  TriggerFilter,
  Workflow,
  WorkflowCondition,
  WorkflowStep
} from "./types";
import { newId, nowIso } from "./core/id";
import { clone, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, getPathValue, optionalObject, pickQuery } from "./core/utils";
import { HttpError } from "./router";

export class AutomationService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "AutomationOS service is ready";
  }

  overview(actor: RequestActor): AutomationOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    const runs = state.runs.filter((item) => item.tenantId === tenant);
    return {
      workflows: {
        total: state.workflows.filter((item) => item.tenantId === tenant).length,
        active: state.workflows.filter((item) => item.tenantId === tenant && item.status === "active").length,
        draft: state.workflows.filter((item) => item.tenantId === tenant && item.status === "draft").length
      },
      triggers: {
        total: state.triggers.filter((item) => item.tenantId === tenant).length,
        active: state.triggers.filter((item) => item.tenantId === tenant && item.enabled).length
      },
      actions: {
        total: state.actions.filter((item) => item.tenantId === tenant).length,
        active: state.actions.filter((item) => item.tenantId === tenant && item.status === "active").length
      },
      schedules: {
        total: state.schedules.filter((item) => item.tenantId === tenant).length,
        active: state.schedules.filter((item) => item.tenantId === tenant && item.enabled).length
      },
      approvals: {
        total: state.approvals.filter((item) => item.tenantId === tenant).length,
        pending: state.approvals.filter((item) => item.tenantId === tenant && item.status === "pending").length,
        approved: state.approvals.filter((item) => item.tenantId === tenant && item.status === "approved").length,
        rejected: state.approvals.filter((item) => item.tenantId === tenant && item.status === "rejected").length
      },
      runs: {
        total: runs.length,
        completed: runs.filter((item) => item.status === "completed").length,
        failed: runs.filter((item) => item.status === "failed").length,
        running: runs.filter((item) => item.status === "running").length
      },
      webhookEndpoints: {
        total: state.webhookEndpoints.filter((item) => item.tenantId === tenant).length,
        active: state.webhookEndpoints.filter((item) => item.tenantId === tenant && item.status === "active").length
      }
    };
  }

  listWorkflows(actor: RequestActor, query?: URLSearchParams): Workflow[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");
    return clone(
      this.store.getState().workflows.filter((item) => {
        if (item.tenantId !== actor.tenantId) return false;
        if (search && !`${item.key} ${item.name} ${item.description ?? ""}`.toLowerCase().includes(search)) return false;
        if (status && item.status !== status) return false;
        return true;
      })
    );
  }

  getWorkflow(id: string, actor: RequestActor): Workflow {
    const workflow = this.store.getState().workflows.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!workflow) throw new HttpError(404, "Workflow not found");
    return clone(workflow);
  }

  createWorkflow(input: unknown, actor: RequestActor): Workflow {
    const body = ensureObject(input, "workflow");
    const state = this.store.getState();
    const key = ensureString(body.key, "workflow.key");
    if (state.workflows.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      throw new HttpError(409, `Workflow key '${key}' already exists`);
    }
    const workflow: Workflow = {
      id: newId("workflow"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "workflow.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "draft") as Workflow["status"],
      version: 1,
      triggerId: body.triggerId ? String(body.triggerId) : undefined,
      steps: ensureArray(body.steps, "workflow.steps", []).map((step: any, index: number) => this.createWorkflowStep(step, index)),
      variables: optionalObject(body.variables),
      tags: ensureArray(body.tags, "workflow.tags"),
      createdBy: actor.userId,
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0
    };
    state.workflows.push(workflow);
    this.store.save();
    this.store.audit(actor, "workflow.create", "workflow", workflow.id, undefined, workflow);
    return clone(workflow);
  }

  private createWorkflowStep(input: any, index: number): WorkflowStep {
    return {
      id: newId("wfstep"),
      tenantId: this.getCurrentTenantId(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      workflowId: "",
      stepIndex: index,
      name: ensureString(input.name, "step.name", `Step ${index + 1}`),
      type: String(input.type ?? "action") as WorkflowStep["type"],
      config: optionalObject(input.config),
      condition: input.condition ? this.createCondition(input.condition) : undefined,
      retryPolicy: input.retryPolicy ? this.createRetryPolicy(input.retryPolicy) : undefined,
      timeoutSeconds: input.timeoutSeconds ? ensureNumber(input.timeoutSeconds, "step.timeoutSeconds") : undefined,
      status: String(input.status ?? "active") as WorkflowStep["status"]
    };
  }

  private createCondition(input: any): WorkflowCondition {
    return {
      field: ensureString(input.field, "condition.field"),
      operator: String(input.operator ?? "eq") as WorkflowCondition["operator"],
      value: input.value,
      logic: input.logic ? String(input.logic) as "and" | "or" : undefined,
      conditions: input.conditions ? input.conditions.map((c: any) => this.createCondition(c)) : undefined
    };
  }

  private createRetryPolicy(input: any): RetryPolicy {
    return {
      maxRetries: ensureNumber(input.maxRetries, "retryPolicy.maxRetries", 3),
      retryDelaySeconds: ensureNumber(input.retryDelaySeconds, "retryPolicy.retryDelaySeconds", 60),
      backoffMultiplier: ensureNumber(input.backoffMultiplier, "retryPolicy.backoffMultiplier", 2),
      retryableErrors: input.retryableErrors ? ensureArray(input.retryableErrors, "retryPolicy.retryableErrors") : undefined
    };
  }

  private getCurrentTenantId(): string {
    return "demo-tenant";
  }

  updateWorkflow(id: string, input: unknown, actor: RequestActor): Workflow {
    const state = this.store.getState();
    const workflow = state.workflows.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!workflow) throw new HttpError(404, "Workflow not found");
    const before = clone(workflow);
    const body = ensureObject(input, "workflow");
    if (body.name !== undefined) workflow.name = ensureString(body.name, "workflow.name");
    if (body.description !== undefined) workflow.description = body.description ? String(body.description) : undefined;
    if (body.status !== undefined) workflow.status = String(body.status) as Workflow["status"];
    if (body.variables !== undefined) workflow.variables = optionalObject(body.variables);
    if (body.tags !== undefined) workflow.tags = ensureArray(body.tags, "workflow.tags");
    if (body.steps !== undefined) {
      workflow.steps = ensureArray(body.steps, "workflow.steps").map((step: any, index: number) => ({
        ...this.createWorkflowStep(step, index),
        workflowId: workflow.id
      }));
    }
    workflow.updatedAt = nowIso();
    workflow.version++;
    this.store.save();
    this.store.audit(actor, "workflow.update", "workflow", workflow.id, before, workflow);
    return clone(workflow);
  }

  deleteWorkflow(id: string, actor: RequestActor): void {
    const state = this.store.getState();
    const index = state.workflows.findIndex((item) => item.id === id && item.tenantId === actor.tenantId);
    if (index === -1) throw new HttpError(404, "Workflow not found");
    const before = clone(state.workflows[index]);
    state.workflows.splice(index, 1);
    this.store.save();
    this.store.audit(actor, "workflow.delete", "workflow", id, before, undefined);
  }

  publishWorkflow(id: string, actor: RequestActor): Workflow {
    const workflow = this.updateWorkflow(id, { status: "active", publishedAt: nowIso() }, actor);
    this.store.audit(actor, "workflow.publish", "workflow", id, undefined, { publishedAt: workflow.publishedAt });
    return workflow;
  }

  runWorkflow(id: string, input: unknown, actor: RequestActor): AutomationRun {
    const state = this.store.getState();
    const workflow = this.getWorkflow(id, actor);
    const body = optionalObject(input);
    const run: AutomationRun = {
      id: newId("run"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      workflowId: workflow.id,
      workflowKey: workflow.key,
      triggerType: body.triggerType ? String(body.triggerType) as any : "manual",
      status: "pending",
      input: { ...workflow.variables, ...body },
      stepRuns: [],
      retryCount: 0,
      userId: actor.userId,
      correlationId: body.correlationId ? String(body.correlationId) : undefined,
      metadata: optionalObject(body.metadata)
    };
    state.runs.unshift(run);
    workflow.totalRuns++;
    workflow.lastRunAt = nowIso();
    this.executeWorkflowRun(run, workflow, actor);
    this.store.save();
    this.emitEvent(actor, "automation.workflow.started", { workflowId: workflow.id, runId: run.id, triggerType: run.triggerType });
    return clone(run);
  }

  private executeWorkflowRun(run: AutomationRun, workflow: Workflow, actor: RequestActor): void {
    const state = this.store.getState();
    run.status = "running";
    run.startedAt = nowIso();
    const startTime = Date.now();
    const stepRuns: StepRun[] = [];
    try {
      for (const step of workflow.steps) {
        if (step.status === "inactive") continue;
        const stepRun = this.executeStep(step, run.input, actor);
        stepRuns.push(stepRun);
        if (stepRun.status === "failed" && !step.retryPolicy) {
          run.status = "failed";
          run.error = stepRun.error;
          break;
        }
      }
      if (run.status !== "failed") {
        run.status = "completed";
        run.output = { steps: stepRuns.length, completed: stepRuns.filter((s) => s.status === "completed").length };
        workflow.successfulRuns++;
      } else {
        workflow.failedRuns++;
      }
    } catch (error) {
      run.status = "failed";
      run.error = error instanceof Error ? error.message : "Unknown error";
      workflow.failedRuns++;
    }
    run.stepRuns = stepRuns;
    run.completedAt = nowIso();
    run.durationMs = Date.now() - startTime;
    this.store.save();
    this.emitEvent(actor, run.status === "completed" ? "automation.workflow.completed" : "automation.workflow.failed", {
      workflowId: workflow.id,
      runId: run.id,
      status: run.status,
      durationMs: run.durationMs
    });
  }

  private executeStep(step: WorkflowStep, input: Record<string, unknown>, actor: RequestActor): StepRun {
    const stepRun: StepRun = {
      id: newId("steprun"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      workflowRunId: "",
      stepId: step.id,
      stepIndex: step.stepIndex,
      stepName: step.name,
      status: "pending",
      input,
      retryCount: 0
    };
    const startTime = Date.now();
    try {
      if (step.condition && !this.evaluateCondition(step.condition, input)) {
        stepRun.status = "skipped";
        stepRun.output = { reason: "Condition not met" };
      } else {
        stepRun.output = this.executeStepAction(step, input);
        stepRun.status = "completed";
      }
    } catch (error) {
      stepRun.status = "failed";
      stepRun.error = error instanceof Error ? error.message : "Unknown error";
      if (step.retryPolicy && stepRun.retryCount < step.retryPolicy.maxRetries) {
        stepRun.retryCount++;
        return this.executeStepWithRetry(step, input, actor, step.retryPolicy);
      }
    }
    stepRun.completedAt = nowIso();
    stepRun.latencyMs = Date.now() - startTime;
    return stepRun;
  }

  private executeStepWithRetry(step: WorkflowStep, input: Record<string, unknown>, actor: RequestActor, policy: RetryPolicy): StepRun {
    let attempt = 0;
    while (attempt < policy.maxRetries) {
      const result = this.executeStep(step, input, actor);
      if (result.status !== "failed") return result;
      attempt++;
      if (attempt < policy.maxRetries) {
        const delay = policy.retryDelaySeconds * Math.pow(policy.backoffMultiplier, attempt);
        console.log(`Retrying step ${step.name} in ${delay}s (attempt ${attempt + 1}/${policy.maxRetries})`);
      }
    }
    return this.executeStep(step, input, actor);
  }

  private evaluateCondition(condition: WorkflowCondition, data: Record<string, unknown>): boolean {
    const value = getPathValue(data, condition.field);
    switch (condition.operator) {
      case "exists":
        return value !== undefined && value !== null;
      case "not_exists":
        return value === undefined || value === null;
      case "eq":
        return value === condition.value;
      case "neq":
        return value !== condition.value;
      case "gt":
        return Number(value) > Number(condition.value);
      case "gte":
        return Number(value) >= Number(condition.value);
      case "lt":
        return Number(value) < Number(condition.value);
      case "lte":
        return Number(value) <= Number(condition.value);
      case "contains":
        return String(value ?? "").includes(String(condition.value ?? ""));
      default:
        return true;
    }
  }

  private executeStepAction(step: WorkflowStep, input: Record<string, unknown>): Record<string, unknown> {
    switch (step.type) {
      case "action":
      case "notification":
        return { executed: true, step: step.name, config: step.config };
      case "delay":
        return { delayed: true, duration: step.config.delaySeconds ?? 0 };
      case "http":
        return { http_called: true, url: step.config.url };
      case "ai_agent":
        return { agent_executed: true, agentId: step.config.agentId };
      default:
        return { executed: true, type: step.type };
    }
  }

  listTriggers(actor: RequestActor, query?: URLSearchParams): Trigger[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const enabled = query?.get("enabled");
    return clone(
      this.store.getState().triggers.filter((item) => {
        if (item.tenantId !== actor.tenantId) return false;
        if (search && !`${item.key} ${item.name} ${item.description ?? ""}`.toLowerCase().includes(search)) return false;
        if (enabled !== null && item.enabled !== (enabled === "true")) return false;
        return true;
      })
    );
  }

  getTrigger(id: string, actor: RequestActor): Trigger {
    const trigger = this.store.getState().triggers.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!trigger) throw new HttpError(404, "Trigger not found");
    return clone(trigger);
  }

  createTrigger(input: unknown, actor: RequestActor): Trigger {
    const body = ensureObject(input, "trigger");
    const state = this.store.getState();
    const key = ensureString(body.key, "trigger.key");
    if (state.triggers.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      throw new HttpError(409, `Trigger key '${key}' already exists`);
    }
    const trigger: Trigger = {
      id: newId("trigger"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "trigger.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as Trigger["status"],
      type: String(body.type ?? "manual") as Trigger["type"],
      workflowId: body.workflowId ? String(body.workflowId) : undefined,
      config: optionalObject(body.config),
      filters: ensureArray(body.filters, "trigger.filters", []).map((f: any) => this.createTriggerFilter(f)),
      enabled: ensureBoolean(body.enabled, true),
      createdBy: actor.userId,
      fireCount: 0
    };
    state.triggers.push(trigger);
    this.store.save();
    this.store.audit(actor, "trigger.create", "trigger", trigger.id, undefined, trigger);
    return clone(trigger);
  }

  private createTriggerFilter(input: any): TriggerFilter {
    return {
      field: ensureString(input.field, "filter.field"),
      operator: String(input.operator ?? "eq") as TriggerFilter["operator"],
      value: input.value
    };
  }

  fireTrigger(id: string, input: unknown, actor: RequestActor): AutomationRun | null {
    const trigger = this.getTrigger(id, actor);
    if (!trigger.enabled) throw new HttpError(400, "Trigger is not enabled");
    if (!trigger.workflowId) return null;
    trigger.lastFiredAt = nowIso();
    trigger.fireCount++;
    this.store.save();
    this.emitEvent(actor, "automation.trigger.fired", { triggerId: trigger.id, type: trigger.type });
    return this.runWorkflow(trigger.workflowId, { ...optionalObject(input), triggerType: trigger.type, triggerId: trigger.id }, actor);
  }

  listActions(actor: RequestActor, query?: URLSearchParams): Action[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    return clone(
      this.store.getState().actions.filter((item) => {
        if (item.tenantId !== actor.tenantId) return false;
        if (search && !`${item.key} ${item.name} ${item.description ?? ""}`.toLowerCase().includes(search)) return false;
        return true;
      })
    );
  }

  createAction(input: unknown, actor: RequestActor): Action {
    const body = ensureObject(input, "action");
    const state = this.store.getState();
    const key = ensureString(body.key, "action.key");
    if (state.actions.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      throw new HttpError(409, `Action key '${key}' already exists`);
    }
    const action: Action = {
      id: newId("action"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "action.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as Action["status"],
      type: String(body.type ?? "http") as Action["type"],
      inputSchema: optionalObject(body.inputSchema),
      outputSchema: optionalObject(body.outputSchema),
      config: optionalObject(body.config),
      retryPolicy: body.retryPolicy ? this.createRetryPolicy(body.retryPolicy) : undefined,
      timeoutSeconds: body.timeoutSeconds ? ensureNumber(body.timeoutSeconds, "action.timeoutSeconds") : undefined,
      createdBy: actor.userId
    };
    state.actions.push(action);
    this.store.save();
    this.store.audit(actor, "action.create", "action", action.id, undefined, action);
    return clone(action);
  }

  listSchedules(actor: RequestActor, query?: URLSearchParams): Schedule[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const enabled = query?.get("enabled");
    return clone(
      this.store.getState().schedules.filter((item) => {
        if (item.tenantId !== actor.tenantId) return false;
        if (search && !`${item.key} ${item.name} ${item.description ?? ""}`.toLowerCase().includes(search)) return false;
        if (enabled !== null && item.enabled !== (enabled === "true")) return false;
        return true;
      })
    );
  }

  createSchedule(input: unknown, actor: RequestActor): Schedule {
    const body = ensureObject(input, "schedule");
    const state = this.store.getState();
    const key = ensureString(body.key, "schedule.key");
    if (state.schedules.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      throw new HttpError(409, `Schedule key '${key}' already exists`);
    }
    const schedule: Schedule = {
      id: newId("schedule"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "schedule.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as Schedule["status"],
      workflowId: body.workflowId ? String(body.workflowId) : undefined,
      cronExpression: body.cronExpression ? String(body.cronExpression) : undefined,
      timezone: String(body.timezone ?? "UTC"),
      intervalSeconds: body.intervalSeconds ? ensureNumber(body.intervalSeconds, "schedule.intervalSeconds") : undefined,
      startAt: body.startAt ? String(body.startAt) : undefined,
      endAt: body.endAt ? String(body.endAt) : undefined,
      enabled: ensureBoolean(body.enabled, true),
      executionCount: 0,
      createdBy: actor.userId
    };
    state.schedules.push(schedule);
    this.store.save();
    this.store.audit(actor, "schedule.create", "schedule", schedule.id, undefined, schedule);
    return clone(schedule);
  }

  listApprovals(actor: RequestActor, query?: URLSearchParams): Approval[] {
    const status = pickQuery(query, "status");
    return clone(
      this.store.getState().approvals.filter((item) => {
        if (item.tenantId !== actor.tenantId) return false;
        if (status && item.status !== status) return false;
        return true;
      })
    );
  }

  getApproval(id: string, actor: RequestActor): Approval {
    const approval = this.store.getState().approvals.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!approval) throw new HttpError(404, "Approval not found");
    return clone(approval);
  }

  createApproval(input: unknown, actor: RequestActor): Approval {
    const body = ensureObject(input, "approval");
    const state = this.store.getState();
    const key = ensureString(body.key, "approval.key");
    if (state.approvals.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      throw new HttpError(409, `Approval key '${key}' already exists`);
    }
    const steps = ensureArray(body.steps, "approval.steps", []).map((step: any, index: number) => this.createApprovalStep(step, index));
    const approval: Approval = {
      id: newId("approval"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "approval.name"),
      description: body.description ? String(body.description) : undefined,
      status: "pending",
      workflowId: body.workflowId ? String(body.workflowId) : undefined,
      workflowRunId: body.workflowRunId ? String(body.workflowRunId) : undefined,
      requesterId: actor.userId,
      requesterName: body.requesterName ? String(body.requesterName) : undefined,
      data: optionalObject(body.data),
      steps,
      currentStepIndex: 0,
      createdBy: actor.userId,
      expiresAt: body.expiresAt ? String(body.expiresAt) : undefined
    };
    state.approvals.push(approval);
    this.store.save();
    this.store.audit(actor, "approval.create", "approval", approval.id, undefined, approval);
    this.emitEvent(actor, "automation.approval.requested", { approvalId: approval.id, name: approval.name, steps: steps.length });
    return clone(approval);
  }

  private createApprovalStep(input: any, index: number): ApprovalStep {
    return {
      id: newId("approvalstep"),
      tenantId: this.getCurrentTenantId(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      approvalId: "",
      stepIndex: index,
      name: ensureString(input.name, "approvalStep.name", `Approval Step ${index + 1}`),
      approverType: String(input.approverType ?? "user") as ApprovalStep["approverType"],
      approverId: input.approverId ? String(input.approverId) : undefined,
      approverRole: input.approverRole ? String(input.approverRole) : undefined,
      approverGroupId: input.approverGroupId ? String(input.approverGroupId) : undefined,
      dynamicApproverExpression: input.dynamicApproverExpression ? String(input.dynamicApproverExpression) : undefined,
      slaHours: input.slaHours ? ensureNumber(input.slaHours, "approvalStep.slaHours") : undefined,
      reminderHours: input.reminderHours ? ensureNumber(input.reminderHours, "approvalStep.reminderHours") : undefined,
      escalationUserId: input.escalationUserId ? String(input.escalationUserId) : undefined,
      escalationRole: input.escalationRole ? String(input.escalationRole) : undefined,
      status: "pending"
    };
  }

  decideApproval(id: string, input: unknown, actor: RequestActor): Approval {
    const state = this.store.getState();
    const approval = state.approvals.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!approval) throw new HttpError(404, "Approval not found");
    if (approval.status !== "pending") throw new HttpError(400, "Approval is not pending");
    const body = ensureObject(input, "approvalDecision");
    const decision = ensureString(body.decision, "approvalDecision.decision");
    if (!["approved", "rejected"].includes(decision)) {
      throw new HttpError(400, "Decision must be 'approved' or 'rejected'");
    }
    const currentStep = approval.steps[approval.currentStepIndex];
    if (currentStep) {
      currentStep.status = decision as any;
      currentStep.decidedAt = nowIso();
      currentStep.decidedBy = actor.userId;
      currentStep.notes = body.notes ? String(body.notes) : undefined;
    }
    if (decision === "rejected") {
      approval.status = "rejected";
      approval.finalDecision = "rejected";
    } else {
      approval.currentStepIndex++;
      if (approval.currentStepIndex >= approval.steps.length) {
        approval.status = "approved";
        approval.finalDecision = "approved";
      }
    }
    approval.decidedAt = nowIso();
    approval.decidedBy = actor.userId;
    approval.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, `approval.${decision}`, "approval", approval.id, undefined, { decision, stepIndex: approval.currentStepIndex });
    this.emitEvent(actor, `automation.approval.${decision}`, { approvalId: approval.id, decidedBy: actor.userId });
    return clone(approval);
  }

  listRuns(actor: RequestActor, query?: URLSearchParams): AutomationRun[] {
    const workflowId = pickQuery(query, "workflowId");
    const status = pickQuery(query, "status");
    return clone(
      this.store.getState().runs.filter((item) => {
        if (item.tenantId !== actor.tenantId) return false;
        if (workflowId && item.workflowId !== workflowId) return false;
        if (status && item.status !== status) return false;
        return true;
      })
    );
  }

  getRun(id: string, actor: RequestActor): AutomationRun {
    const run = this.store.getState().runs.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!run) throw new HttpError(404, "Run not found");
    return clone(run);
  }

  listWebhookEndpoints(actor: RequestActor): any[] {
    return clone(this.store.getState().webhookEndpoints.filter((item) => item.tenantId === actor.tenantId));
  }

  createWebhookEndpoint(input: unknown, actor: RequestActor): any {
    const body = ensureObject(input, "webhookEndpoint");
    const state = this.store.getState();
    const key = ensureString(body.key, "webhookEndpoint.key");
    if (state.webhookEndpoints.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      throw new HttpError(409, `Webhook endpoint key '${key}' already exists`);
    }
    const endpoint: any = {
      id: newId("webhook"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "webhookEndpoint.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active"),
      workflowId: body.workflowId ? String(body.workflowId) : undefined,
      triggerId: body.triggerId ? String(body.triggerId) : undefined,
      secret: body.secret ? String(body.secret) : undefined,
      allowedOrigins: body.allowedOrigins ? ensureArray(body.allowedOrigins, "webhookEndpoint.allowedOrigins") : undefined,
      authenticationType: body.authenticationType ? String(body.authenticationType) : "none",
      createdBy: actor.userId,
      receivedCount: 0
    };
    state.webhookEndpoints.push(endpoint);
    this.store.save();
    this.store.audit(actor, "webhook.create", "webhookEndpoint", endpoint.id, undefined, endpoint);
    return clone(endpoint);
  }

  receiveWebhook(id: string, payload: unknown, actor: RequestActor): AutomationRun | null {
    const state = this.store.getState();
    const endpoint = state.webhookEndpoints.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!endpoint) throw new HttpError(404, "Webhook endpoint not found");
    if (endpoint.status !== "active") throw new HttpError(400, "Webhook endpoint is not active");
    endpoint.lastReceivedAt = nowIso();
    endpoint.receivedCount++;
    this.store.save();
    this.emitEvent(actor, "automation.webhook.received", { webhookId: endpoint.id, endpointKey: endpoint.key });
    if (endpoint.triggerId) {
      return this.fireTrigger(endpoint.triggerId, payload, actor);
    } else if (endpoint.workflowId) {
      return this.runWorkflow(endpoint.workflowId, { ...optionalObject(payload), triggerType: "webhook", webhookId: endpoint.id }, actor);
    }
    return null;
  }

  private emitEvent(actor: RequestActor, type: string, data: Record<string, unknown>): void {
    const state = this.store.getState();
    const event: AutomationEvent = {
      id: newId("event"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type,
      source: "AutomationOS",
      data
    };
    state.events.unshift(event);
  }

  listEvents(actor: RequestActor): AutomationEvent[] {
    return clone(this.store.getState().events.filter((item) => item.tenantId === actor.tenantId));
  }

  listAuditLogs(actor: RequestActor): any[] {
    return clone(this.store.getState().auditLogs.filter((item) => item.tenantId === actor.tenantId));
  }
}
