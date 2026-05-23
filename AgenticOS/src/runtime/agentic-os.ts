import { AgentDefinition, AgentPlan, AgentRun, AgentTask, AgenticOverview, RequestActor } from "../core/domain";
import { badRequest, notFound } from "../core/errors";
import { newId, nowIso } from "../core/id";
import { clone, ensureObject, ensureString, optionalString } from "../core/utils";
import { requireActorPermission } from "../core/security";
import { DataStore } from "../core/datastore";
import { EventBus } from "../core/event-bus";
import { AgentRegistry } from "../registry/agent-registry";
import { SimplePlanner } from "../planner/simple-planner";
import { ToolGateway } from "../tools/tool-gateway";
import { CommandGateway } from "../commands/command-gateway";
import { GuardrailEngine } from "../guardrails/guardrail-engine";
import { ApprovalEngine } from "../approvals/approval-engine";
import { MemoryManager } from "../memory/memory-manager";
import { TraceRecorder } from "../traces/trace-recorder";
import { EvaluationEngine } from "../evals/evaluation-engine";
import { AgentExecutor } from "../executor/agent-executor";

export class AgenticOS {
  readonly registry: AgentRegistry;
  readonly planner: SimplePlanner;
  readonly tools: ToolGateway;
  readonly commands: CommandGateway;
  readonly guardrails: GuardrailEngine;
  readonly approvals: ApprovalEngine;
  readonly memory: MemoryManager;
  readonly traces: TraceRecorder;
  readonly evals: EvaluationEngine;
  readonly executor: AgentExecutor;

  constructor(private readonly store: DataStore, private readonly events: EventBus) {
    this.registry = new AgentRegistry(store);
    this.planner = new SimplePlanner();
    this.tools = new ToolGateway();
    this.commands = new CommandGateway();
    this.guardrails = new GuardrailEngine();
    this.approvals = new ApprovalEngine(store);
    this.memory = new MemoryManager(store);
    this.traces = new TraceRecorder(store);
    this.evals = new EvaluationEngine(store);
    this.executor = new AgentExecutor(store, events, this.tools, this.commands, this.approvals, this.traces);
  }

  overview(actor: RequestActor): AgenticOverview {
    const state = this.store.getState();
    return clone({
      counts: {
        agents: state.agents.filter((item) => item.tenantId === actor.tenantId && item.status !== "archived").length,
        activeAgents: state.agents.filter((item) => item.tenantId === actor.tenantId && item.status === "active").length,
        runs: state.runs.filter((item) => item.tenantId === actor.tenantId).length,
        runningRuns: state.runs.filter((item) => item.tenantId === actor.tenantId && ["queued", "running", "waiting_approval"].includes(item.status)).length,
        waitingApprovals: state.approvals.filter((item) => item.tenantId === actor.tenantId && item.status === "pending").length,
        memories: state.memories.filter((item) => item.tenantId === actor.tenantId).length,
        evaluations: state.evaluations.filter((item) => item.tenantId === actor.tenantId).length
      },
      recentRuns: state.runs.filter((item) => item.tenantId === actor.tenantId).slice(0, 10),
      pendingApprovals: state.approvals.filter((item) => item.tenantId === actor.tenantId && item.status === "pending").slice(0, 10),
      recentTraces: state.traces.filter((item) => item.tenantId === actor.tenantId).slice(0, 10),
      recentEvents: state.events.filter((item) => item.tenantId === actor.tenantId).slice(0, 10)
    });
  }

  registerAgent(actor: RequestActor, input: Partial<AgentDefinition>): AgentDefinition {
    requireActorPermission(actor, "agentic.agents.create");
    const agent = this.registry.register(actor, input);
    this.store.audit(actor, "agentic.agent.create", "agent", agent.id, undefined, agent);
    this.events.publish(actor, "agentic.agent.created", { agentId: agent.id });
    return agent;
  }

  listAgents(actor: RequestActor): AgentDefinition[] {
    requireActorPermission(actor, "agentic.agents.read");
    return this.registry.list(actor);
  }

  getAgent(actor: RequestActor, id: string): AgentDefinition {
    requireActorPermission(actor, "agentic.agents.read");
    return this.registry.get(actor, id);
  }

  createTask(actor: RequestActor, input: Partial<AgentTask>): AgentTask {
    requireActorPermission(actor, "agentic.tasks.manage");
    const agent = this.registry.get(actor, ensureString(input.agentId, "agentId"));
    const now = nowIso();
    const task: AgentTask = {
      id: newId("task"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      agentId: agent.id,
      title: ensureString(input.title, "title"),
      input: ensureObject(input.input, "input"),
      status: "todo",
      requestedBy: actor.userId
    };
    this.store.getState().tasks.unshift(task);
    this.store.save();
    this.events.publish(actor, "agentic.task.created", { taskId: task.id, agentId: agent.id });
    return clone(task);
  }

  runAgent(actor: RequestActor, agentId: string, input: Record<string, unknown> = {}): AgentRun {
    requireActorPermission(actor, "agentic.agents.run");
    const agent = this.registry.get(actor, agentId);
    if (agent.status !== "active") badRequest("Only active agents can run");
    for (const permission of agent.permissions) requireActorPermission(actor, permission);
    this.guardrails.validateInput(input);

    const now = nowIso();
    const run: AgentRun = {
      id: newId("run"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      agentId: agent.id,
      userId: actor.userId,
      workspaceId: optionalString(input.workspaceId),
      input: ensureObject(input, "input"),
      status: "running",
      startedAt: now,
      cost: 0
    };
    this.store.getState().runs.unshift(run);
    this.store.save();
    this.events.publish(actor, "agentic.agent.started", { runId: run.id, agentId: agent.id });

    const trace = this.traces.start(actor, agent, run.id);
    const plan = this.planner.createPlan(agent, run, run.input, { tenantId: actor.tenantId, workspaceId: run.workspaceId, userId: actor.userId });
    this.guardrails.validatePlan(agent, plan, actor);
    this.store.getState().plans.unshift(plan);
    run.planId = plan.id;
    this.store.save();
    this.events.publish(actor, "agentic.plan.created", { runId: run.id, planId: plan.id, agentId: agent.id });

    const result = this.executor.execute({ actor, agent, run, plan, traceId: trace.id });
    const latencyMs = Date.now() - new Date(run.startedAt ?? now).getTime();
    run.cost = Math.min(agent.maxCostPerRun, Number((plan.steps.length * 0.01).toFixed(2)));
    run.latencyMs = latencyMs;

    if (result.waitingApproval) {
      this.store.save();
      return clone(run);
    }

    this.guardrails.validateOutput(run.output ?? {});
    this.traces.complete(trace.id, "Agent run completed", run.cost, latencyMs);
    if (agent.memory.enabled) {
      this.memory.write(actor, agent, {
        runId: run.id,
        scope: "run",
        key: `run:${run.id}:summary`,
        value: { input: run.input, output: run.output }
      });
      this.events.publish(actor, "agentic.memory.updated", { agentId: agent.id, runId: run.id });
    }
    this.events.publish(actor, "agentic.agent.completed", { runId: run.id, agentId: agent.id });
    this.store.save();
    return clone(run);
  }

  getRun(actor: RequestActor, id: string): AgentRun {
    requireActorPermission(actor, "agentic.runs.read");
    const run = this.store.getState().runs.find((item) => item.tenantId === actor.tenantId && item.id === id);
    if (!run) notFound("Run not found");
    return clone(run);
  }

  getRunTrace(actor: RequestActor, runId: string) {
    requireActorPermission(actor, "agentic.trace.read");
    return this.traces.getByRun(actor, runId);
  }

  approve(actor: RequestActor, approvalId: string, note?: string) {
    requireActorPermission(actor, "agentic.approvals.manage");
    const approval = this.approvals.decide(actor, approvalId, "approved", note);
    this.events.publish(actor, "agentic.approval.approved", { approvalId });
    return approval;
  }

  reject(actor: RequestActor, approvalId: string, note?: string) {
    requireActorPermission(actor, "agentic.approvals.manage");
    return this.approvals.decide(actor, approvalId, "rejected", note);
  }

  searchMemory(actor: RequestActor, query: unknown) {
    requireActorPermission(actor, "agentic.memory.read");
    return this.memory.search(actor, ensureString(query, "query"));
  }

  runEvaluation(actor: RequestActor, agentId: string, dataset: unknown) {
    requireActorPermission(actor, "agentic.evals.run");
    const agent = this.registry.get(actor, agentId);
    const evaluation = this.evals.run(actor, agent, dataset);
    this.events.publish(actor, "agentic.eval.completed", { evaluationId: evaluation.id, agentId });
    return evaluation;
  }

  listEvents(actor: RequestActor) {
    return clone(this.store.getState().events.filter((item) => item.tenantId === actor.tenantId));
  }

  auditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((item) => item.tenantId === actor.tenantId));
  }
}
