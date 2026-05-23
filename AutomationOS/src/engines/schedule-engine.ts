import { DataStore } from "../core/datastore";
import { AutomationExecution, AutomationSchedule, RequestActor } from "../core/domain";
import { notFound } from "../core/errors";
import { nowIso } from "../core/id";
import { clone, isIsoBeforeOrEqual } from "../core/utils";
import { WorkflowEngine } from "./workflow-engine";

export class ScheduleEngine {
  constructor(private readonly store: DataStore, private readonly workflowEngine: WorkflowEngine) {}

  runSchedule(scheduleId: string, actor: RequestActor): AutomationExecution {
    const state = this.store.getState();
    const schedule = state.schedules.find((item) => item.id === scheduleId && item.tenantId === actor.tenantId);
    if (!schedule) notFound("Schedule not found");
    const workflow = state.workflows.find((item) => item.id === schedule.workflowId && item.tenantId === actor.tenantId);
    if (!workflow) notFound("Workflow for schedule not found");

    const execution = this.workflowEngine.start(workflow, { schedule: clone(schedule), payload: clone(schedule.payload) }, actor);
    schedule.lastRunAt = nowIso();
    schedule.nextRunAt = estimateNextRunAt(schedule.expression);
    schedule.updatedAt = nowIso();
    this.store.save();
    return execution;
  }

  runDue(actor: RequestActor): { schedules: AutomationSchedule[]; executions: AutomationExecution[] } {
    const due = this.store.getState().schedules.filter((schedule) => (
      schedule.tenantId === actor.tenantId && schedule.enabled && isIsoBeforeOrEqual(schedule.nextRunAt)
    ));
    const executions = due.map((schedule) => this.runSchedule(schedule.id, actor));
    return { schedules: clone(due), executions };
  }
}

export function estimateNextRunAt(expression: string): string {
  const lower = expression.toLowerCase().trim();
  const now = new Date();
  const match = lower.match(/^every\s+(\d+)\s+(minute|minutes|hour|hours|day|days)$/);
  if (match) {
    const amount = Number(match[1]);
    const unit = match[2];
    if (unit.startsWith("minute")) now.setMinutes(now.getMinutes() + amount);
    if (unit.startsWith("hour")) now.setHours(now.getHours() + amount);
    if (unit.startsWith("day")) now.setDate(now.getDate() + amount);
    return now.toISOString();
  }
  now.setHours(now.getHours() + 24);
  return now.toISOString();
}
