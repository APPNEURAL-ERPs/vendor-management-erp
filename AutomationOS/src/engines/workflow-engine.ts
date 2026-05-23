import { DataStore } from "../core/datastore";
import {
  ActionDefinition,
  ApprovalRequest,
  AutomationEvent,
  AutomationExecution,
  AutomationNotification,
  AutomationTask,
  ExecutionLogEntry,
  RequestActor,
  WorkflowDefinition,
  WorkflowStep
} from "../core/domain";
import { badRequest, notFound } from "../core/errors";
import { EventBus } from "../core/event-bus";
import { newId, nowIso } from "../core/id";
import { addHours, clone, ensureString, renderTemplate, renderValue } from "../core/utils";
import { ConditionEngine } from "./condition-engine";

export class WorkflowEngine {
  constructor(
    private readonly store: DataStore,
    private readonly conditionEngine: ConditionEngine,
    private readonly eventBus: EventBus
  ) {}

  start(workflow: WorkflowDefinition, input: Record<string, unknown>, actor: RequestActor, triggerEventId?: string): AutomationExecution {
    if (workflow.status !== "active" && workflow.trigger.type !== "manual") {
      badRequest(`Workflow '${workflow.key}' is not active`);
    }

    const startedAt = nowIso();
    const execution: AutomationExecution = {
      id: newId("exec"),
      tenantId: actor.tenantId,
      createdAt: startedAt,
      updatedAt: startedAt,
      workflowId: workflow.id,
      workflowKey: workflow.key,
      workflowVersion: workflow.version,
      triggerType: workflow.trigger.type,
      triggerEventId,
      status: "running",
      startedAt,
      input,
      context: {
        variables: clone(workflow.variables ?? {}),
        outputs: {},
        actor: { userId: actor.userId, role: actor.role }
      },
      logs: [],
      approvalIds: [],
      taskIds: []
    };

    this.store.getState().executions.unshift(execution);
    this.appendLog(execution, "info", `Workflow '${workflow.key}' started`, undefined, { triggerType: workflow.trigger.type });
    this.runFromStep(execution, workflow, workflow.steps[0]?.id, actor);
    this.store.save();
    return clone(execution);
  }

  resumeAfterApproval(approvalId: string, decision: "approved" | "rejected", actor: RequestActor, note?: string): AutomationExecution {
    const state = this.store.getState();
    const approval = state.approvals.find((item) => item.id === approvalId && item.tenantId === actor.tenantId);
    if (!approval) notFound("Approval request not found");
    if (approval.status !== "pending") badRequest(`Approval is already ${approval.status}`);

    approval.status = decision;
    approval.decisionBy = actor.userId;
    approval.decisionAt = nowIso();
    approval.decisionNote = note;
    approval.updatedAt = nowIso();

    const execution = approval.executionId
      ? state.executions.find((item) => item.id === approval.executionId && item.tenantId === actor.tenantId)
      : undefined;
    if (!execution) {
      this.store.save();
      return {} as AutomationExecution;
    }

    const workflow = state.workflows.find((item) => item.id === execution.workflowId && item.tenantId === actor.tenantId);
    if (!workflow) notFound("Workflow for approval execution not found");

    execution.context = {
      ...execution.context,
      lastApproval: {
        approvalId: approval.id,
        decision,
        decisionBy: actor.userId,
        note
      }
    };

    if (decision === "approved") {
      this.appendLog(execution, "success", `Approval '${approval.title}' approved`, approval.stepId, { approvalId: approval.id, decisionBy: actor.userId });
      execution.status = "running";
      this.runFromStep(execution, workflow, approval.resumeStepId, actor);
    } else {
      this.appendLog(execution, "warning", `Approval '${approval.title}' rejected`, approval.stepId, { approvalId: approval.id, decisionBy: actor.userId });
      if (approval.rejectStepId) {
        execution.status = "running";
        this.runFromStep(execution, workflow, approval.rejectStepId, actor);
      } else {
        execution.status = "failed";
        execution.error = `Approval rejected: ${approval.title}`;
        execution.completedAt = nowIso();
      }
    }

    execution.updatedAt = nowIso();
    this.store.save();
    return clone(execution);
  }

  cancelExecution(executionId: string, actor: RequestActor, reason?: string): AutomationExecution {
    const execution = this.store.getState().executions.find((item) => item.id === executionId && item.tenantId === actor.tenantId);
    if (!execution) notFound("Execution not found");
    if (["completed", "failed", "cancelled"].includes(execution.status)) badRequest(`Execution is already ${execution.status}`);
    execution.status = "cancelled";
    execution.error = reason ?? "Cancelled by user";
    execution.completedAt = nowIso();
    execution.updatedAt = nowIso();
    this.appendLog(execution, "warning", execution.error, execution.currentStepId);
    this.store.save();
    return clone(execution);
  }

  private runFromStep(execution: AutomationExecution, workflow: WorkflowDefinition, startStepId: string | undefined, actor: RequestActor): void {
    let currentStepId = startStepId;
    let guard = 0;

    if (!currentStepId) {
      this.completeExecution(execution, "Workflow completed without steps");
      return;
    }

    while (currentStepId && guard < 100) {
      guard += 1;
      const step = workflow.steps.find((item) => item.id === currentStepId);
      if (!step) {
        this.failExecution(execution, `Step '${currentStepId}' not found`);
        return;
      }

      execution.currentStepId = step.id;
      execution.updatedAt = nowIso();

      try {
        if (step.type === "end") {
          this.completeExecution(execution, step.name || "Workflow completed");
          return;
        }

        if (step.type === "condition") {
          const conditionContext = this.executionContext(execution, workflow, actor);
          const matched = this.conditionEngine.matches(conditionContext, step.filters ?? []);
          const explanation = this.conditionEngine.explain(conditionContext, step.filters ?? []);
          this.appendLog(execution, matched ? "success" : "warning", `Condition '${step.key}' evaluated to ${matched}`, step.id, { explanation });
          currentStepId = matched ? (step.onTrueStepId ?? step.nextStepId) : (step.onFalseStepId ?? step.onFailureStepId);
          continue;
        }

        if (step.type === "approval") {
          const approval = this.createApproval(execution, workflow, step, actor);
          execution.status = "waiting_approval";
          execution.approvalIds.push(approval.id);
          execution.updatedAt = nowIso();
          this.appendLog(execution, "info", `Waiting for approval '${approval.title}'`, step.id, { approvalId: approval.id });
          return;
        }

        if (step.type === "delay") {
          const seconds = Number(step.delaySeconds ?? 0);
          this.appendLog(execution, "info", `Delay step '${step.key}' recorded for ${seconds} seconds`, step.id, { delaySeconds: seconds, simulated: true });
          currentStepId = step.nextStepId ?? step.onSuccessStepId;
          continue;
        }

        if (step.type === "action") {
          if (!step.action) badRequest(`Action step '${step.key}' is missing action definition`);
          const output = this.executeAction(execution, workflow, step, step.action, actor);
          const outputs = (execution.context.outputs ?? {}) as Record<string, unknown>;
          outputs[step.key] = output;
          execution.context.outputs = outputs;
          this.appendLog(execution, "success", `Action '${step.action.type}' completed`, step.id, { output });
          currentStepId = step.onSuccessStepId ?? step.nextStepId;
          continue;
        }

        this.failExecution(execution, `Unsupported step type '${step.type}'`);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Step failed";
        this.appendLog(execution, "error", message, step.id);
        if (step.onFailureStepId) {
          currentStepId = step.onFailureStepId;
          continue;
        }
        this.failExecution(execution, message);
        return;
      }
    }

    if (guard >= 100) {
      this.failExecution(execution, "Workflow stopped because maximum step guard of 100 was reached");
      return;
    }

    this.completeExecution(execution, "Workflow completed");
  }

  private createApproval(execution: AutomationExecution, workflow: WorkflowDefinition, step: WorkflowStep, actor: RequestActor): ApprovalRequest {
    const context = this.executionContext(execution, workflow, actor);
    const approval: ApprovalRequest = {
      id: newId("approval"),
      tenantId: execution.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      workflowId: workflow.id,
      executionId: execution.id,
      stepId: step.id,
      title: renderTemplate(step.titleTemplate ?? `Approval needed: ${workflow.name}`, context),
      description: renderTemplate(step.descriptionTemplate ?? `Review workflow execution ${execution.id}`, context),
      status: "pending",
      requestedBy: actor.userId,
      approverRole: step.approverRole ?? "approver",
      approverUserIds: step.approverUserIds ?? [],
      dueAt: step.dueInHours ? addHours(step.dueInHours) : undefined,
      payload: renderValue(step.config ?? {}, context) as Record<string, unknown>,
      resumeStepId: step.nextStepId ?? step.onSuccessStepId,
      rejectStepId: step.onFailureStepId
    };
    this.store.getState().approvals.unshift(approval);
    return approval;
  }

  private executeAction(execution: AutomationExecution, workflow: WorkflowDefinition, step: WorkflowStep, action: ActionDefinition, actor: RequestActor): Record<string, unknown> {
    const state = this.store.getState();
    const context = this.executionContext(execution, workflow, actor);
    const config = renderValue(action.config ?? {}, context) as Record<string, unknown>;

    switch (action.type) {
      case "send_notification": {
        const notification: AutomationNotification = {
          id: newId("notification"),
          tenantId: execution.tenantId,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          channel: String(config.channel ?? "in_app") as AutomationNotification["channel"],
          recipient: String(config.recipient ?? actor.userId),
          subject: config.subject ? String(config.subject) : undefined,
          message: String(config.message ?? "Automation notification"),
          status: "sent",
          workflowId: workflow.id,
          executionId: execution.id,
          metadata: config.metadata && typeof config.metadata === "object" ? config.metadata as Record<string, unknown> : {}
        };
        state.notifications.unshift(notification);
        return { notificationId: notification.id, status: notification.status };
      }

      case "create_task": {
        const task: AutomationTask = {
          id: newId("task"),
          tenantId: execution.tenantId,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          title: ensureString(config.title ?? `Task from ${workflow.name}`, "task.title"),
          description: config.description ? String(config.description) : undefined,
          status: "open",
          priority: String(config.priority ?? "normal") as AutomationTask["priority"],
          assigneeRole: config.assigneeRole ? String(config.assigneeRole) as AutomationTask["assigneeRole"] : undefined,
          assigneeId: config.assigneeId ? String(config.assigneeId) : undefined,
          workflowId: workflow.id,
          executionId: execution.id,
          dueAt: config.dueAt ? String(config.dueAt) : undefined,
          payload: config.payload && typeof config.payload === "object" ? config.payload as Record<string, unknown> : {}
        };
        state.tasks.unshift(task);
        execution.taskIds.push(task.id);
        return { taskId: task.id, status: task.status };
      }

      case "webhook_call": {
        const url = ensureString(config.url, "webhook.url");
        return {
          url,
          method: String(config.method ?? "POST"),
          statusCode: 200,
          simulated: true,
          body: config.body ?? {}
        };
      }

      case "emit_event": {
        const event: AutomationEvent = {
          id: newId("event"),
          tenantId: execution.tenantId,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          type: ensureString(config.type ?? `${workflow.key}.event`, "event.type"),
          source: String(config.source ?? "AutomationOS"),
          actorId: actor.userId,
          role: actor.role,
          correlationId: config.correlationId ? String(config.correlationId) : execution.id,
          data: config.data && typeof config.data === "object" ? config.data as Record<string, unknown> : {},
          handledExecutionIds: []
        };
        state.events.unshift(event);
        this.eventBus.publish(event);
        return { eventId: event.id, type: event.type };
      }

      case "update_record": {
        return {
          recordType: String(config.recordType ?? "record"),
          recordId: String(config.recordId ?? "unknown"),
          patch: config.patch ?? {},
          simulated: true
        };
      }

      case "set_variable": {
        const key = ensureString(config.key, "variable.key");
        const variables = (execution.context.variables ?? {}) as Record<string, unknown>;
        variables[key] = config.value;
        execution.context.variables = variables;
        return { key, value: config.value };
      }

      case "log": {
        return { message: String(config.message ?? "Log action completed") };
      }

      default:
        badRequest(`Unsupported action type '${action.type}'`);
    }
  }

  private executionContext(execution: AutomationExecution, workflow: WorkflowDefinition, actor: RequestActor): Record<string, unknown> {
    return {
      input: execution.input,
      context: execution.context,
      variables: execution.context.variables ?? {},
      outputs: execution.context.outputs ?? {},
      execution,
      workflow,
      actor
    };
  }

  private appendLog(execution: AutomationExecution, status: ExecutionLogEntry["status"], message: string, stepId?: string, data?: Record<string, unknown>): void {
    execution.logs.push({
      id: newId("log"),
      stepId,
      status,
      message,
      data,
      createdAt: nowIso()
    });
  }

  private completeExecution(execution: AutomationExecution, message: string): void {
    execution.status = "completed";
    execution.completedAt = nowIso();
    execution.updatedAt = nowIso();
    this.appendLog(execution, "success", message, execution.currentStepId);
  }

  private failExecution(execution: AutomationExecution, message: string): void {
    execution.status = "failed";
    execution.error = message;
    execution.completedAt = nowIso();
    execution.updatedAt = nowIso();
    this.appendLog(execution, "error", message, execution.currentStepId);
  }
}
