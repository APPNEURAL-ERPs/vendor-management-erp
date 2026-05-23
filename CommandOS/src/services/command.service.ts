import {
  AutomationRule,
  Command,
  CommandExecution,
  CommandOverview,
  CommandPriority,
  CommandStatus,
  EntityStatus,
  Incident,
  IncidentSeverity,
  IncidentStatus,
  RequestActor,
  Role,
  Runbook,
  RunbookRun,
  RunbookRunStep,
  RunbookStep,
  RunbookStepStatus,
  RunbookStepType,
  Schedule,
  ScheduleCadence
} from "../core/domain";
import { badRequest, conflict, notFound } from "../core/errors";
import { newId, nowIso } from "../core/id";
import { asIso, clone, ensureBoolean, ensureNumber, ensureObject, ensureString, normalizeCode, normalizeStringArray, optionalString, parseNumberQuery, pickQuery } from "../core/utils";
import { DataStore } from "../core/datastore";
import { EventBus } from "../core/event-bus";

export class CommandService {
  constructor(private readonly store: DataStore, private readonly events: EventBus) {}

  overview(actor: RequestActor): CommandOverview {
    const state = this.store.getState();
    const tenantId = actor.tenantId;
    return clone({
      counts: {
        commands: state.commands.filter((item) => item.tenantId === tenantId && item.status !== "archived").length,
        activeCommands: state.commands.filter((item) => item.tenantId === tenantId && item.status === "active").length,
        runbooks: state.runbooks.filter((item) => item.tenantId === tenantId && item.status !== "archived").length,
        automationRules: state.automationRules.filter((item) => item.tenantId === tenantId && item.status !== "archived").length,
        enabledAutomationRules: state.automationRules.filter((item) => item.tenantId === tenantId && item.status !== "archived" && item.enabled).length,
        schedules: state.schedules.filter((item) => item.tenantId === tenantId && item.status !== "archived").length,
        openIncidents: state.incidents.filter((item) => item.tenantId === tenantId && !["resolved", "closed"].includes(item.status)).length,
        runningExecutions: state.executions.filter((item) => item.tenantId === tenantId && ["queued", "running", "waiting"].includes(item.status)).length,
        runningRunbooks: state.runbookRuns.filter((item) => item.tenantId === tenantId && ["queued", "running", "waiting"].includes(item.status)).length
      },
      recentExecutions: state.executions.filter((item) => item.tenantId === tenantId).slice(0, 10),
      recentRunbookRuns: state.runbookRuns.filter((item) => item.tenantId === tenantId).slice(0, 10),
      openIncidents: state.incidents.filter((item) => item.tenantId === tenantId && !["resolved", "closed"].includes(item.status)).slice(0, 10),
      recentEvents: state.events.filter((item) => item.tenantId === tenantId).slice(0, 10)
    });
  }

  listCommands(actor: RequestActor, query?: URLSearchParams): Command[] {
    const search = query ? pickQuery(query, "search") : undefined;
    const category = query ? pickQuery(query, "category") : undefined;
    const status = query ? pickQuery(query, "status") : undefined;
    const limit = query ? parseNumberQuery(query, "limit", 100) : 100;
    return clone(this.store.getState().commands.filter((command) => {
      if (command.tenantId !== actor.tenantId || command.status === "archived") return false;
      if (category && command.category !== category) return false;
      if (status && command.status !== status) return false;
      if (search) {
        const haystack = [command.key, command.name, command.description, command.category, command.ownerTeam, command.tags.join(" ")].join(" ").toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    }).slice(0, limit));
  }

  createCommand(actor: RequestActor, input: Partial<Command>): Command {
    const state = this.store.getState();
    const key = normalizeCommandKey(input.key ?? input.name);
    this.ensureUnique(state.commands, actor.tenantId, key, "Command");
    const now = nowIso();
    const command: Command = {
      id: newId("cmd"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key,
      name: ensureString(input.name, "name"),
      description: optionalString(input.description),
      category: ensureString(input.category ?? "operations", "category"),
      ownerTeam: optionalString(input.ownerTeam),
      priority: this.ensurePriority(input.priority ?? "normal"),
      status: this.ensureEntityStatus(input.status ?? "active"),
      requiredRole: this.ensureRole(input.requiredRole ?? "operator"),
      inputSchema: ensureObject(input.inputSchema, "inputSchema"),
      tags: normalizeStringArray(input.tags, "tags"),
      metadata: ensureObject(input.metadata, "metadata"),
      createdBy: actor.userId,
      updatedBy: actor.userId
    };
    state.commands.unshift(command);
    this.store.save();
    this.store.audit(actor, "command.command.create", "command", command.id, undefined, command);
    this.events.publish(actor, "command.created", { commandId: command.id, key: command.key });
    return clone(command);
  }

  getCommand(actor: RequestActor, idOrKey: string): Command {
    const command = this.store.getState().commands.find((item) => item.tenantId === actor.tenantId && item.status !== "archived" && (item.id === idOrKey || item.key === idOrKey));
    if (!command) notFound("Command not found");
    return clone(command);
  }

  updateCommand(actor: RequestActor, idOrKey: string, input: Partial<Command>): Command {
    const state = this.store.getState();
    const command = state.commands.find((item) => item.tenantId === actor.tenantId && item.status !== "archived" && (item.id === idOrKey || item.key === idOrKey));
    if (!command) notFound("Command not found");
    const before = clone(command);
    if (input.key !== undefined) {
      const key = normalizeCommandKey(input.key);
      this.ensureUnique(state.commands.filter((item) => item.id !== command.id), actor.tenantId, key, "Command");
      command.key = key;
    }
    if (input.name !== undefined) command.name = ensureString(input.name, "name");
    if (input.description !== undefined) command.description = optionalString(input.description);
    if (input.category !== undefined) command.category = ensureString(input.category, "category");
    if (input.ownerTeam !== undefined) command.ownerTeam = optionalString(input.ownerTeam);
    if (input.priority !== undefined) command.priority = this.ensurePriority(input.priority);
    if (input.status !== undefined) command.status = this.ensureEntityStatus(input.status);
    if (input.requiredRole !== undefined) command.requiredRole = this.ensureRole(input.requiredRole);
    if (input.inputSchema !== undefined) command.inputSchema = ensureObject(input.inputSchema, "inputSchema");
    if (input.tags !== undefined) command.tags = normalizeStringArray(input.tags, "tags");
    if (input.metadata !== undefined) command.metadata = ensureObject(input.metadata, "metadata");
    command.updatedAt = nowIso();
    command.updatedBy = actor.userId;
    this.store.save();
    this.store.audit(actor, "command.command.update", "command", command.id, before, command);
    this.events.publish(actor, "command.updated", { commandId: command.id, key: command.key });
    return clone(command);
  }

  archiveCommand(actor: RequestActor, idOrKey: string): Command {
    return this.updateCommand(actor, idOrKey, { status: "archived" });
  }

  executeCommand(actor: RequestActor, idOrKey: string, input: Record<string, unknown> = {}): CommandExecution {
    const command = this.getCommand(actor, idOrKey);
    if (command.status !== "active") badRequest("Only active commands can be executed");
    const now = nowIso();
    const execution: CommandExecution = {
      id: newId("exec"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      commandId: command.id,
      commandKey: command.key,
      requestedBy: actor.userId,
      role: actor.role,
      status: "queued",
      priority: this.ensurePriority(input.priority ?? command.priority),
      input: ensureObject(input.input ?? input, "input"),
      correlationId: optionalString(input.correlationId),
      logs: [`${now} queued by ${actor.userId}`]
    };
    this.store.getState().executions.unshift(execution);
    this.store.save();
    this.store.audit(actor, "command.execution.create", "execution", execution.id, undefined, execution);
    this.events.publish(actor, "command.execution.queued", { executionId: execution.id, commandId: command.id, commandKey: command.key }, "CommandOS", execution.correlationId);
    return clone(execution);
  }

  updateExecutionStatus(actor: RequestActor, id: string, input: Partial<CommandExecution>): CommandExecution {
    const execution = this.findExecution(actor, id);
    const before = clone(execution);
    const status = this.ensureCommandStatus(input.status);
    const now = nowIso();
    execution.status = status;
    execution.updatedAt = now;
    if (status === "running" && !execution.startedAt) execution.startedAt = now;
    if (["succeeded", "failed", "cancelled"].includes(status)) {
      execution.completedAt = status === "cancelled" ? execution.completedAt : now;
      execution.cancelledAt = status === "cancelled" ? now : execution.cancelledAt;
      if (execution.startedAt) execution.durationMs = new Date(now).getTime() - new Date(execution.startedAt).getTime();
    }
    if (input.output !== undefined) execution.output = ensureObject(input.output, "output");
    if (input.error !== undefined) execution.error = optionalString(input.error);
    if (Array.isArray(input.logs)) execution.logs.push(...input.logs.map(String));
    execution.logs.push(`${now} status changed to ${status} by ${actor.userId}`);
    this.store.save();
    this.store.audit(actor, "command.execution.update", "execution", execution.id, before, execution);
    this.events.publish(actor, `command.execution.${status}`, { executionId: execution.id, commandKey: execution.commandKey }, "CommandOS", execution.correlationId);
    return clone(execution);
  }

  listExecutions(actor: RequestActor, query?: URLSearchParams): CommandExecution[] {
    const status = query ? pickQuery(query, "status") : undefined;
    const commandKey = query ? pickQuery(query, "commandKey") : undefined;
    return clone(this.store.getState().executions.filter((execution) => {
      if (execution.tenantId !== actor.tenantId) return false;
      if (status && execution.status !== status) return false;
      if (commandKey && execution.commandKey !== commandKey) return false;
      return true;
    }));
  }

  listRunbooks(actor: RequestActor): Runbook[] {
    return clone(this.store.getState().runbooks.filter((item) => item.tenantId === actor.tenantId && item.status !== "archived"));
  }

  createRunbook(actor: RequestActor, input: Partial<Runbook>): Runbook {
    const state = this.store.getState();
    const key = normalizeCommandKey(input.key ?? input.name);
    this.ensureUnique(state.runbooks, actor.tenantId, key, "Runbook");
    const now = nowIso();
    const runbook: Runbook = {
      id: newId("runbook"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key,
      name: ensureString(input.name, "name"),
      description: optionalString(input.description),
      category: ensureString(input.category ?? "operations", "category"),
      ownerTeam: optionalString(input.ownerTeam),
      status: this.ensureEntityStatus(input.status ?? "active"),
      triggers: normalizeStringArray(input.triggers, "triggers"),
      steps: this.normalizeSteps(input.steps),
      tags: normalizeStringArray(input.tags, "tags"),
      createdBy: actor.userId,
      updatedBy: actor.userId
    };
    state.runbooks.unshift(runbook);
    this.store.save();
    this.store.audit(actor, "command.runbook.create", "runbook", runbook.id, undefined, runbook);
    this.events.publish(actor, "command.runbook.created", { runbookId: runbook.id, key: runbook.key });
    return clone(runbook);
  }

  startRunbook(actor: RequestActor, idOrKey: string, input: Record<string, unknown> = {}): RunbookRun {
    const runbook = this.getRunbook(actor, idOrKey);
    if (runbook.status !== "active") badRequest("Only active runbooks can be started");
    const now = nowIso();
    const steps = runbook.steps.map((step, index): RunbookRunStep => ({
      ...clone(step),
      status: index === 0 ? "running" : "pending",
      startedAt: index === 0 ? now : undefined
    }));
    const run: RunbookRun = {
      id: newId("rbrun"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      runbookId: runbook.id,
      runbookKey: runbook.key,
      status: steps.length ? "running" : "succeeded",
      priority: this.ensurePriority(input.priority ?? "normal"),
      requestedBy: actor.userId,
      currentStepId: steps[0]?.id,
      context: ensureObject(input.context ?? input, "context"),
      steps,
      startedAt: now,
      completedAt: steps.length ? undefined : now
    };
    this.store.getState().runbookRuns.unshift(run);
    this.store.save();
    this.store.audit(actor, "command.runbook.run", "runbook_run", run.id, undefined, run);
    this.events.publish(actor, "command.runbook.started", { runbookRunId: run.id, runbookKey: run.runbookKey });
    return clone(run);
  }

  updateRunbookStep(actor: RequestActor, runId: string, stepId: string, input: Partial<RunbookRunStep>): RunbookRun {
    const run = this.findRunbookRun(actor, runId);
    const before = clone(run);
    const step = run.steps.find((item) => item.id === stepId);
    if (!step) notFound("Runbook step not found");
    const status = this.ensureStepStatus(input.status);
    const now = nowIso();
    step.status = status;
    if (status === "running" && !step.startedAt) step.startedAt = now;
    if (["completed", "failed", "skipped"].includes(status)) step.completedAt = now;
    if (input.output !== undefined) step.output = ensureObject(input.output, "output");
    if (input.note !== undefined) step.note = optionalString(input.note);
    run.updatedAt = now;
    if (status === "failed") run.status = "failed";
    if (status === "completed" || status === "skipped") {
      const next = run.steps.find((item) => item.status === "pending");
      if (next) {
        next.status = "running";
        next.startedAt = now;
        run.currentStepId = next.id;
        run.status = "running";
      } else if (run.steps.every((item) => ["completed", "skipped"].includes(item.status))) {
        run.status = "succeeded";
        run.currentStepId = undefined;
        run.completedAt = now;
      }
    }
    this.store.save();
    this.store.audit(actor, "command.runbook.step", "runbook_run", run.id, before, run);
    this.events.publish(actor, "command.runbook.step.updated", { runbookRunId: run.id, stepId, status });
    return clone(run);
  }

  listRunbookRuns(actor: RequestActor): RunbookRun[] {
    return clone(this.store.getState().runbookRuns.filter((item) => item.tenantId === actor.tenantId));
  }

  createAutomationRule(actor: RequestActor, input: Partial<AutomationRule>): AutomationRule {
    const state = this.store.getState();
    const key = normalizeCommandKey(input.key ?? input.name);
    this.ensureUnique(state.automationRules, actor.tenantId, key, "Automation rule");
    if (!input.commandId && !input.runbookId) badRequest("Either commandId or runbookId is required");
    const now = nowIso();
    const rule: AutomationRule = {
      id: newId("auto"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key,
      name: ensureString(input.name, "name"),
      description: optionalString(input.description),
      enabled: ensureBoolean(input.enabled, "enabled", true),
      eventType: ensureString(input.eventType, "eventType"),
      condition: ensureObject(input.condition, "condition"),
      commandId: optionalString(input.commandId),
      runbookId: optionalString(input.runbookId),
      cooldownMinutes: Math.max(0, ensureNumber(input.cooldownMinutes, "cooldownMinutes", 5)),
      lastTriggeredAt: asIso(input.lastTriggeredAt, "lastTriggeredAt"),
      status: this.ensureEntityStatus(input.status ?? "active"),
      createdBy: actor.userId,
      updatedBy: actor.userId
    };
    state.automationRules.unshift(rule);
    this.store.save();
    this.store.audit(actor, "command.automation.create", "automation_rule", rule.id, undefined, rule);
    this.events.publish(actor, "command.automation.created", { ruleId: rule.id, key: rule.key });
    return clone(rule);
  }

  triggerAutomation(actor: RequestActor, key: string): CommandExecution | RunbookRun {
    const rule = this.store.getState().automationRules.find((item) => item.tenantId === actor.tenantId && item.key === key && item.status !== "archived");
    if (!rule) notFound("Automation rule not found");
    if (!rule.enabled || rule.status !== "active") badRequest("Automation rule is not enabled");
    rule.lastTriggeredAt = nowIso();
    rule.updatedAt = rule.lastTriggeredAt;
    this.store.save();
    if (rule.commandId) return this.executeCommand(actor, rule.commandId, { source: "automation", automationRuleId: rule.id });
    return this.startRunbook(actor, ensureString(rule.runbookId, "runbookId"), { source: "automation", automationRuleId: rule.id });
  }

  listAutomationRules(actor: RequestActor): AutomationRule[] {
    return clone(this.store.getState().automationRules.filter((item) => item.tenantId === actor.tenantId && item.status !== "archived"));
  }

  createSchedule(actor: RequestActor, input: Partial<Schedule>): Schedule {
    const state = this.store.getState();
    const key = normalizeCommandKey(input.key ?? input.name);
    this.ensureUnique(state.schedules, actor.tenantId, key, "Schedule");
    if (!input.commandId && !input.runbookId) badRequest("Either commandId or runbookId is required");
    const now = nowIso();
    const schedule: Schedule = {
      id: newId("sched"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key,
      name: ensureString(input.name, "name"),
      cadence: this.ensureCadence(input.cadence ?? "daily"),
      timezone: ensureString(input.timezone ?? "Asia/Kolkata", "timezone"),
      nextRunAt: asIso(input.nextRunAt, "nextRunAt") ?? now,
      commandId: optionalString(input.commandId),
      runbookId: optionalString(input.runbookId),
      input: ensureObject(input.input, "input"),
      enabled: ensureBoolean(input.enabled, "enabled", true),
      status: this.ensureEntityStatus(input.status ?? "active"),
      createdBy: actor.userId,
      updatedBy: actor.userId
    };
    state.schedules.unshift(schedule);
    this.store.save();
    this.store.audit(actor, "command.schedule.create", "schedule", schedule.id, undefined, schedule);
    this.events.publish(actor, "command.schedule.created", { scheduleId: schedule.id, key: schedule.key });
    return clone(schedule);
  }

  listSchedules(actor: RequestActor): Schedule[] {
    return clone(this.store.getState().schedules.filter((item) => item.tenantId === actor.tenantId && item.status !== "archived"));
  }

  openIncident(actor: RequestActor, input: Partial<Incident>): Incident {
    const now = nowIso();
    const incident: Incident = {
      id: newId("inc"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key: normalizeCode(input.key ?? `INC-${Date.now()}`, "key"),
      title: ensureString(input.title, "title"),
      severity: this.ensureSeverity(input.severity ?? "sev3"),
      status: this.ensureIncidentStatus(input.status ?? "open"),
      commanderUserId: optionalString(input.commanderUserId ?? actor.userId),
      summary: optionalString(input.summary),
      relatedRunbookRunIds: normalizeStringArray(input.relatedRunbookRunIds, "relatedRunbookRunIds"),
      relatedExecutionIds: normalizeStringArray(input.relatedExecutionIds, "relatedExecutionIds"),
      timeline: [{
        id: newId("note"),
        at: now,
        actorId: actor.userId,
        message: "Incident opened"
      }],
      openedAt: now,
      resolvedAt: undefined,
      closedAt: undefined
    };
    this.store.getState().incidents.unshift(incident);
    this.store.save();
    this.store.audit(actor, "command.incident.create", "incident", incident.id, undefined, incident);
    this.events.publish(actor, "command.incident.opened", { incidentId: incident.id, key: incident.key, severity: incident.severity });
    return clone(incident);
  }

  updateIncident(actor: RequestActor, idOrKey: string, input: Partial<Incident> & { note?: string }): Incident {
    const incident = this.findIncident(actor, idOrKey);
    const before = clone(incident);
    const now = nowIso();
    if (input.title !== undefined) incident.title = ensureString(input.title, "title");
    if (input.severity !== undefined) incident.severity = this.ensureSeverity(input.severity);
    if (input.status !== undefined) {
      incident.status = this.ensureIncidentStatus(input.status);
      if (incident.status === "resolved") incident.resolvedAt = now;
      if (incident.status === "closed") incident.closedAt = now;
    }
    if (input.commanderUserId !== undefined) incident.commanderUserId = optionalString(input.commanderUserId);
    if (input.summary !== undefined) incident.summary = optionalString(input.summary);
    if (input.relatedRunbookRunIds !== undefined) incident.relatedRunbookRunIds = normalizeStringArray(input.relatedRunbookRunIds, "relatedRunbookRunIds");
    if (input.relatedExecutionIds !== undefined) incident.relatedExecutionIds = normalizeStringArray(input.relatedExecutionIds, "relatedExecutionIds");
    if (input.note !== undefined) {
      incident.timeline.unshift({ id: newId("note"), at: now, actorId: actor.userId, message: ensureString(input.note, "note") });
    }
    incident.updatedAt = now;
    this.store.save();
    this.store.audit(actor, "command.incident.update", "incident", incident.id, before, incident);
    this.events.publish(actor, "command.incident.updated", { incidentId: incident.id, key: incident.key, status: incident.status });
    return clone(incident);
  }

  listIncidents(actor: RequestActor): Incident[] {
    return clone(this.store.getState().incidents.filter((item) => item.tenantId === actor.tenantId));
  }

  listEvents(actor: RequestActor) {
    return clone(this.store.getState().events.filter((item) => item.tenantId === actor.tenantId));
  }

  auditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((item) => item.tenantId === actor.tenantId));
  }

  private getRunbook(actor: RequestActor, idOrKey: string): Runbook {
    const runbook = this.store.getState().runbooks.find((item) => item.tenantId === actor.tenantId && item.status !== "archived" && (item.id === idOrKey || item.key === idOrKey));
    if (!runbook) notFound("Runbook not found");
    return clone(runbook);
  }

  private findExecution(actor: RequestActor, id: string): CommandExecution {
    const execution = this.store.getState().executions.find((item) => item.tenantId === actor.tenantId && item.id === id);
    if (!execution) notFound("Execution not found");
    return execution;
  }

  private findRunbookRun(actor: RequestActor, id: string): RunbookRun {
    const run = this.store.getState().runbookRuns.find((item) => item.tenantId === actor.tenantId && item.id === id);
    if (!run) notFound("Runbook run not found");
    return run;
  }

  private findIncident(actor: RequestActor, idOrKey: string): Incident {
    const incident = this.store.getState().incidents.find((item) => item.tenantId === actor.tenantId && (item.id === idOrKey || item.key === idOrKey));
    if (!incident) notFound("Incident not found");
    return incident;
  }

  private normalizeSteps(value: unknown): RunbookStep[] {
    if (!Array.isArray(value) || value.length === 0) badRequest("steps must include at least one runbook step");
    return value.map((item, index) => {
      const step = ensureObject(item, "step");
      return {
        id: optionalString(step.id) ?? newId("step"),
        name: ensureString(step.name, "step.name"),
        type: this.ensureStepType(step.type ?? "manual"),
        commandId: optionalString(step.commandId),
        instructions: optionalString(step.instructions),
        assigneeRole: step.assigneeRole === undefined ? undefined : this.ensureRole(step.assigneeRole),
        timeoutMinutes: step.timeoutMinutes === undefined ? undefined : Math.max(1, ensureNumber(step.timeoutMinutes, "timeoutMinutes")),
        required: ensureBoolean(step.required, "required", true),
        metadata: ensureObject(step.metadata ?? { order: index + 1 }, "metadata")
      };
    });
  }

  private ensureUnique(items: Array<{ tenantId: string; key: string }>, tenantId: string, key: string, label: string): void {
    if (items.some((item) => item.tenantId === tenantId && item.key === key)) conflict(`${label} key already exists`);
  }

  private ensureRole(value: unknown): Role {
    const role = String(value) as Role;
    if (!["owner", "admin", "command_admin", "operator", "incident_commander", "automation_manager", "auditor", "viewer"].includes(role)) badRequest("Invalid role");
    return role;
  }

  private ensureEntityStatus(value: unknown): EntityStatus {
    const status = String(value) as EntityStatus;
    if (!["draft", "active", "paused", "archived"].includes(status)) badRequest("Invalid status");
    return status;
  }

  private ensurePriority(value: unknown): CommandPriority {
    const priority = String(value) as CommandPriority;
    if (!["low", "normal", "high", "critical"].includes(priority)) badRequest("Invalid priority");
    return priority;
  }

  private ensureCommandStatus(value: unknown): CommandStatus {
    const status = String(value) as CommandStatus;
    if (!["queued", "running", "waiting", "succeeded", "failed", "cancelled"].includes(status)) badRequest("Invalid execution status");
    return status;
  }

  private ensureStepType(value: unknown): RunbookStepType {
    const type = String(value) as RunbookStepType;
    if (!["manual", "http", "script", "approval", "notification", "handoff"].includes(type)) badRequest("Invalid step type");
    return type;
  }

  private ensureStepStatus(value: unknown): RunbookStepStatus {
    const status = String(value) as RunbookStepStatus;
    if (!["pending", "running", "waiting", "completed", "failed", "skipped"].includes(status)) badRequest("Invalid step status");
    return status;
  }

  private ensureCadence(value: unknown): ScheduleCadence {
    const cadence = String(value) as ScheduleCadence;
    if (!["once", "hourly", "daily", "weekly", "monthly"].includes(cadence)) badRequest("Invalid cadence");
    return cadence;
  }

  private ensureSeverity(value: unknown): IncidentSeverity {
    const severity = String(value) as IncidentSeverity;
    if (!["sev1", "sev2", "sev3", "sev4"].includes(severity)) badRequest("Invalid severity");
    return severity;
  }

  private ensureIncidentStatus(value: unknown): IncidentStatus {
    const status = String(value) as IncidentStatus;
    if (!["open", "investigating", "mitigated", "resolved", "closed"].includes(status)) badRequest("Invalid incident status");
    return status;
  }
}

function normalizeCommandKey(value: unknown): string {
  return ensureString(value, "key").toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/-+/g, "-");
}
