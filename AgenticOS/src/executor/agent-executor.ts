import { AgentDefinition, AgentPlan, AgentRun, AgentStep, RequestActor } from "../core/domain";
import { nowIso } from "../core/id";
import { DataStore } from "../core/datastore";
import { EventBus } from "../core/event-bus";
import { ApprovalEngine } from "../approvals/approval-engine";
import { CommandGateway } from "../commands/command-gateway";
import { ToolGateway } from "../tools/tool-gateway";
import { TraceRecorder } from "../traces/trace-recorder";

export interface ExecutePlanInput {
  actor: RequestActor;
  agent: AgentDefinition;
  run: AgentRun;
  plan: AgentPlan;
  traceId: string;
}

export interface ExecutePlanResult {
  run: AgentRun;
  plan: AgentPlan;
  waitingApproval?: boolean;
  output: Record<string, unknown>;
}

export class AgentExecutor {
  constructor(
    private readonly store: DataStore,
    private readonly events: EventBus,
    private readonly tools: ToolGateway,
    private readonly commands: CommandGateway,
    private readonly approvals: ApprovalEngine,
    private readonly traces: TraceRecorder
  ) {}

  execute(input: ExecutePlanInput): ExecutePlanResult {
    const { actor, agent, run, plan, traceId } = input;
    const output: Record<string, unknown> = { steps: [] };
    for (const step of plan.steps) {
      if (step.status === "completed" || step.status === "skipped") continue;
      if (this.approvals.requiresApproval(agent, step)) {
        const approval = this.approvals.request(actor, agent, run.id, step, `${step.name} requires human approval`);
        run.status = "waiting_approval";
        run.updatedAt = nowIso();
        this.store.save();
        this.events.publish(actor, "agentic.approval.requested", { approvalId: approval.id, runId: run.id, action: approval.action });
        this.traces.add(traceId, "approval.requested", `Approval requested for ${approval.action}`, { approvalId: approval.id });
        return { run, plan, waitingApproval: true, output };
      }

      this.executeStep(actor, step, traceId, output);
    }

    run.status = "completed";
    run.completedAt = nowIso();
    run.updatedAt = run.completedAt;
    run.output = { result: "Agent run completed", ...output };
    plan.status = "completed";
    plan.updatedAt = run.completedAt;
    this.store.save();
    return { run, plan, output: run.output };
  }

  private executeStep(actor: RequestActor, step: AgentStep, traceId: string, output: Record<string, unknown>): void {
    step.status = "running";
    this.traces.add(traceId, "step.started", `Started ${step.name}`, { stepId: step.id, type: step.type });
    if (step.type === "tool" && step.tool) {
      const result = this.tools.call(step.tool, step.input, actor);
      step.output = result.output;
      output.steps = [...(output.steps as unknown[]), { stepId: step.id, type: step.type, result }];
      this.events.publish(actor, "agentic.tool.called", { stepId: step.id, tool: step.tool, callId: result.callId });
      this.traces.add(traceId, "tool.called", `Called ${step.tool}`, { stepId: step.id, callId: result.callId });
    } else if (step.type === "command" && step.command) {
      const result = this.commands.run(step.command, step.input, actor);
      step.output = result.output;
      output.steps = [...(output.steps as unknown[]), { stepId: step.id, type: step.type, result }];
      this.events.publish(actor, "agentic.command.executed", { stepId: step.id, command: step.command, executionId: result.executionId });
      this.traces.add(traceId, "command.executed", `Executed ${step.command}`, { stepId: step.id, executionId: result.executionId });
    } else {
      step.output = { ok: true, message: `${step.name} completed` };
      output.steps = [...(output.steps as unknown[]), { stepId: step.id, type: step.type, output: step.output }];
    }
    step.status = "completed";
    this.events.publish(actor, "agentic.step.completed", { stepId: step.id, type: step.type });
    this.traces.add(traceId, "step.completed", `Completed ${step.name}`, { stepId: step.id });
    this.store.save();
  }
}
