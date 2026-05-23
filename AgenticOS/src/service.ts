import { DataStore } from "./core/datastore";
import {
  Agent,
  AgentMemory,
  AgentRun,
  AgentRunStep,
  AgentTemplate,
  AgentWorkflow,
  AgenticOverview,
  ApprovalRequest,
  EvaluationRun,
  EvaluationSuite,
  Guardrail,
  GuardrailResult,
  RequestActor,
  RetryPolicy,
  RunUsageMetrics,
  ToolRegistryEntry,
  ToolRun,
  WorkflowErrorHandling,
  WorkflowStep
} from "./core/domain";
import { badRequest, conflict, notFound } from "./core/errors";
import { generateStepId, newId, nowIso } from "./core/id";
import { clone, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, getPathValue, maskSensitiveData, optionalArray, optionalObject, optionalString, pickQuery } from "./core/utils";

const zeroUsage = (): RunUsageMetrics => ({
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  toolCalls: 0,
  guardrailScans: 0,
  memoryOperations: 0,
  estimatedCost: 0,
  latencyMs: 0
});

export class AgenticService {
  constructor(private readonly store: DataStore) {}

  overview(actor: RequestActor): AgenticOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    const agents = state.agents.filter((a) => a.tenantId === tenant);
    const runs = state.agentRuns.filter((r) => r.tenantId === tenant);
    const usage = runs.reduce((acc, run) => addUsage(acc, run.usage), zeroUsage());

    return {
      agents: {
        total: agents.length,
        active: agents.filter((a) => a.status === "active").length,
        byType: countBy(agents, "agentType")
      },
      templates: {
        total: state.agentTemplates.filter((t) => t.tenantId === tenant).length,
        active: state.agentTemplates.filter((t) => t.tenantId === tenant && t.status === "active").length
      },
      runs: {
        total: runs.length,
        queued: runs.filter((r) => r.status === "queued").length,
        running: runs.filter((r) => r.status === "running").length,
        completed: runs.filter((r) => r.status === "completed").length,
        failed: runs.filter((r) => r.status === "failed").length,
        awaiting_approval: runs.filter((r) => r.status === "waiting_approval").length
      },
      workflows: {
        total: state.agentWorkflows.filter((w) => w.tenantId === tenant).length,
        active: state.agentWorkflows.filter((w) => w.tenantId === tenant && w.status === "active").length
      },
      tools: {
        total: state.toolRegistry.filter((t) => t.tenantId === tenant).length,
        active: state.toolRegistry.filter((t) => t.tenantId === tenant && t.status === "active").length,
        runs: state.toolRuns.filter((tr) => tr.tenantId === tenant).length
      },
      guardrails: {
        total: state.guardrails.filter((g) => g.tenantId === tenant).length,
        active: state.guardrails.filter((g) => g.tenantId === tenant && g.status === "active").length
      },
      approvals: {
        pending: state.approvalRequests.filter((a) => a.tenantId === tenant && a.status === "pending").length,
        approved: state.approvalRequests.filter((a) => a.tenantId === tenant && a.status === "approved").length,
        rejected: state.approvalRequests.filter((a) => a.tenantId === tenant && a.status === "rejected").length
      },
      memory: {
        total: state.agentMemories.filter((m) => m.tenantId === tenant).length,
        byType: countBy(state.agentMemories.filter((m) => m.tenantId === tenant), "memoryType")
      },
      evaluations: {
        suites: state.evaluationSuites.filter((e) => e.tenantId === tenant).length,
        runs: state.evaluationRuns.filter((e) => e.tenantId === tenant).length,
        averagePassRate: this.calculateAveragePassRate(state.evaluationRuns.filter((e) => e.tenantId === tenant))
      },
      usage
    };
  }

  listAgents(actor: RequestActor, query?: URLSearchParams): Agent[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const type = pickQuery(query, "type");
    return clone(this.store.getState().agents.filter((a) => {
      if (a.tenantId !== actor.tenantId) return false;
      if (search && !`${a.key} ${a.name} ${a.description ?? ""}`.toLowerCase().includes(search)) return false;
      if (type && a.agentType !== type) return false;
      return true;
    }));
  }

  getAgent(id: string, actor: RequestActor): Agent {
    const agent = this.store.getState().agents.find((a) => a.id === id && a.tenantId === actor.tenantId);
    if (!agent) notFound("Agent not found");
    return clone(agent);
  }

  createAgent(input: unknown, actor: RequestActor): Agent {
    const body = ensureObject(input, "agent");
    const state = this.store.getState();
    const key = ensureString(body.key, "agent.key");
    if (state.agents.some((a) => a.tenantId === actor.tenantId && a.key === key)) conflict(`Agent key '${key}' already exists`);

    const now = nowIso();
    const agent: Agent = {
      id: newId("agent"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key,
      name: ensureString(body.name, "agent.name"),
      description: optionalString(body.description),
      status: String(body.status ?? "active") as Agent["status"],
      version: 1,
      agentType: String(body.agentType ?? "assistant") as Agent["agentType"],
      capabilities: ensureArray<string>(body.capabilities, "agent.capabilities", []),
      promptTemplate: ensureString(body.promptTemplate, "agent.promptTemplate"),
      variables: optionalObject(body.variables),
      modelId: optionalString(body.modelId),
      knowledgeBaseIds: optionalArray(body.knowledgeBaseIds),
      toolIds: optionalArray(body.toolIds),
      guardrailIds: optionalArray(body.guardrailIds),
      memoryEnabled: ensureBoolean(body.memoryEnabled, true),
      workflowEnabled: ensureBoolean(body.workflowEnabled, false),
      outputFormat: String(body.outputFormat ?? "text") as Agent["outputFormat"],
      metadata: optionalObject(body.metadata),
      createdBy: actor.userId
    };

    state.agents.push(agent);
    this.store.save();
    this.store.audit(actor, "agent.create", "agent", agent.id, undefined, { key: agent.key, name: agent.name });
    this.store.emit(actor, "agentic.agent.created", { agentId: agent.id, key: agent.key });
    return clone(agent);
  }

  updateAgent(id: string, input: unknown, actor: RequestActor): Agent {
    const state = this.store.getState();
    const agent = state.agents.find((a) => a.id === id && a.tenantId === actor.tenantId);
    if (!agent) notFound("Agent not found");
    const before = clone(agent);
    const body = ensureObject(input, "agent");

    if (body.name !== undefined) agent.name = String(body.name);
    if (body.description !== undefined) agent.description = optionalString(body.description);
    if (body.status !== undefined) agent.status = String(body.status) as Agent["status"];
    if (body.agentType !== undefined) agent.agentType = String(body.agentType) as Agent["agentType"];
    if (body.capabilities !== undefined) agent.capabilities = ensureArray(body.capabilities, "capabilities");
    if (body.promptTemplate !== undefined) agent.promptTemplate = String(body.promptTemplate);
    if (body.variables !== undefined) agent.variables = optionalObject(body.variables);
    if (body.toolIds !== undefined) agent.toolIds = optionalArray(body.toolIds);
    if (body.guardrailIds !== undefined) agent.guardrailIds = optionalArray(body.guardrailIds);
    if (body.memoryEnabled !== undefined) agent.memoryEnabled = ensureBoolean(body.memoryEnabled);
    if (body.workflowEnabled !== undefined) agent.workflowEnabled = ensureBoolean(body.workflowEnabled);
    if (body.outputFormat !== undefined) agent.outputFormat = String(body.outputFormat) as Agent["outputFormat"];
    if (body.metadata !== undefined) agent.metadata = optionalObject(body.metadata);
    agent.updatedAt = nowIso();
    agent.version += 1;

    this.store.save();
    this.store.audit(actor, "agent.update", "agent", agent.id, before, agent);
    return clone(agent);
  }

  listAgentRuns(actor: RequestActor, query?: URLSearchParams): AgentRun[] {
    const agentId = pickQuery(query, "agentId");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().agentRuns.filter((r) => {
      if (r.tenantId !== actor.tenantId) return false;
      if (agentId && r.agentId !== agentId) return false;
      if (status && r.status !== status) return false;
      return true;
    }));
  }

  getAgentRun(id: string, actor: RequestActor): AgentRun {
    const run = this.store.getState().agentRuns.find((r) => r.id === id && r.tenantId === actor.tenantId);
    if (!run) notFound("Agent run not found");
    return clone(run);
  }

  runAgent(id: string, input: unknown, actor: RequestActor): AgentRun {
    const body = ensureObject(input, "run");
    const state = this.store.getState();
    const agent = state.agents.find((a) => a.id === id && a.tenantId === actor.tenantId);
    if (!agent) notFound("Agent not found");
    if (agent.status !== "active") badRequest("Agent is not active");

    const startTime = Date.now();
    const now = nowIso();
    const run: AgentRun = {
      id: newId("run"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      agentId: agent.id,
      status: "running",
      input: optionalObject(body.input),
      steps: [],
      guardrailResults: [],
      toolRunIds: [],
      memoryIds: [],
      usage: zeroUsage(),
      startedAt: now,
      metadata: optionalObject(body.metadata)
    };

    const inputText = ensureString(body.input?.query ?? body.input?.text ?? body.input, "run.input", "");
    const inputScan = this.scanInputGuardrails(inputText, agent.guardrailIds, state, actor.tenantId);
    run.guardrailResults.push(...inputScan);

    if (!inputScan.every((r) => r.passed)) {
      run.status = "failed";
      run.error = `Input blocked by guardrails: ${inputScan.filter((r) => !r.passed).map((r) => r.guardrailKey).join(", ")}`;
      run.completedAt = nowIso();
      run.usage.latencyMs = Date.now() - startTime;
      state.agentRuns.unshift(run);
      this.store.save();
      this.store.audit(actor, "agent.run.blocked", "agent", agent.id, undefined, { runId: run.id, violations: inputScan.filter((r) => !r.passed).map((r) => r.guardrailKey) });
      return clone(run);
    }

    const steps = this.createDefaultSteps(agent);
    run.steps = steps;

    for (const step of steps) {
      step.status = "completed";
      step.startedAt = now;
      step.completedAt = nowIso();
      step.output = { message: `Step ${step.stepName} completed for agent ${agent.name}` };
    }

    const output = this.generateAgentOutput(agent, inputText, run);
    run.output = output;
    run.status = "completed";
    run.completedAt = nowIso();
    run.usage = {
      promptTokens: Math.ceil(inputText.length / 4),
      completionTokens: Math.ceil(output.length / 4),
      totalTokens: Math.ceil((inputText.length + output.length) / 4),
      toolCalls: 0,
      guardrailScans: inputScan.length,
      memoryOperations: agent.memoryEnabled ? 1 : 0,
      estimatedCost: 0.001,
      latencyMs: Date.now() - startTime
    };

    const outputScan = this.scanOutputGuardrails(output, agent.guardrailIds, state, actor.tenantId);
    run.guardrailResults.push(...outputScan);
    run.usage.guardrailScans += outputScan.length;

    if (!outputScan.every((r) => r.passed)) {
      run.output = `Output filtered by guardrails: ${outputScan.filter((r) => !r.passed).map((r) => r.guardrailKey).join(", ")}`;
    }

    state.agentRuns.unshift(run);
    this.store.save();
    this.store.audit(actor, "agent.run", "agent", agent.id, undefined, { runId: run.id, status: run.status });
    this.store.emit(actor, "agentic.agent.run.completed", { agentId: agent.id, runId: run.id, status: run.status });
    return clone(run);
  }

  pauseAgentRun(id: string, actor: RequestActor): AgentRun {
    const run = this.store.getState().agentRuns.find((r) => r.id === id && r.tenantId === actor.tenantId);
    if (!run) notFound("Agent run not found");
    if (!["running", "waiting_approval"].includes(run.status)) badRequest("Can only pause running or waiting_approval runs");

    run.status = "paused";
    run.pausedAt = nowIso();
    run.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "agent.run.pause", "agentRun", run.id);
    return clone(run);
  }

  resumeAgentRun(id: string, actor: RequestActor): AgentRun {
    const run = this.store.getState().agentRuns.find((r) => r.id === id && r.tenantId === actor.tenantId);
    if (!run) notFound("Agent run not found");
    if (run.status !== "paused") badRequest("Can only resume paused runs");

    run.status = "running";
    run.resumedAt = nowIso();
    run.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "agent.run.resume", "agentRun", run.id);
    return clone(run);
  }

  cancelAgentRun(id: string, actor: RequestActor): AgentRun {
    const run = this.store.getState().agentRuns.find((r) => r.id === id && r.tenantId === actor.tenantId);
    if (!run) notFound("Agent run not found");
    if (["completed", "failed", "cancelled"].includes(run.status)) badRequest("Cannot cancel completed, failed, or already cancelled runs");

    run.status = "cancelled";
    run.completedAt = nowIso();
    run.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "agent.run.cancel", "agentRun", run.id);
    return clone(run);
  }

  listTemplates(actor: RequestActor): AgentTemplate[] {
    return clone(this.store.getState().agentTemplates.filter((t) => t.tenantId === actor.tenantId));
  }

  createTemplate(input: unknown, actor: RequestActor): AgentTemplate {
    const body = ensureObject(input, "template");
    const state = this.store.getState();
    const key = ensureString(body.key, "template.key");
    if (state.agentTemplates.some((t) => t.tenantId === actor.tenantId && t.key === key)) conflict(`Template key '${key}' already exists`);

    const now = nowIso();
    const template: AgentTemplate = {
      id: newId("tmpl"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key,
      name: ensureString(body.name, "template.name"),
      description: optionalString(body.description),
      status: String(body.status ?? "active") as AgentTemplate["status"],
      category: String(body.category ?? "custom") as AgentTemplate["category"],
      template: ensureString(body.template, "template.template"),
      variables: ensureArray<string>(body.variables, "template.variables", []),
      defaultCapabilities: ensureArray(body.defaultCapabilities, "defaultCapabilities", []),
      requiredTools: optionalArray(body.requiredTools),
      recommendedGuardrails: optionalArray(body.recommendedGuardrails),
      usageExamples: optionalArray(body.usageExamples),
      tags: optionalArray(body.tags),
      version: 1,
      createdBy: actor.userId
    };

    state.agentTemplates.push(template);
    this.store.save();
    this.store.audit(actor, "template.create", "template", template.id, undefined, template);
    return clone(template);
  }

  listToolRegistry(actor: RequestActor): ToolRegistryEntry[] {
    return clone(this.store.getState().toolRegistry.filter((t) => t.tenantId === actor.tenantId));
  }

  registerTool(input: unknown, actor: RequestActor): ToolRegistryEntry {
    const body = ensureObject(input, "tool");
    const state = this.store.getState();
    const key = ensureString(body.key, "tool.key");
    if (state.toolRegistry.some((t) => t.tenantId === actor.tenantId && t.key === key)) conflict(`Tool key '${key}' already exists`);

    const now = nowIso();
    const tool: ToolRegistryEntry = {
      id: newId("tool"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key,
      name: ensureString(body.name, "tool.name"),
      description: optionalString(body.description),
      type: String(body.type ?? "builtin") as ToolRegistryEntry["type"],
      status: String(body.status ?? "active") as ToolRegistryEntry["status"],
      category: String(body.category ?? "custom") as ToolRegistryEntry["category"],
      inputSchema: optionalObject(body.inputSchema),
      outputSchema: optionalObject(body.outputSchema),
      config: optionalObject(body.config),
      timeoutMs: ensureNumber(body.timeoutMs, "tool.timeoutMs", 30000),
      requiresApproval: ensureBoolean(body.requiresApproval, false),
      capability: ensureString(body.capability, "tool.capability"),
      version: String(body.version ?? "1.0.0"),
      metadata: optionalObject(body.metadata)
    };

    state.toolRegistry.push(tool);
    this.store.save();
    this.store.audit(actor, "tool.register", "tool", tool.id, undefined, tool);
    return clone(tool);
  }

  runTool(id: string, input: unknown, actor: RequestActor): ToolRun {
    const state = this.store.getState();
    const tool = state.toolRegistry.find((t) => t.id === id && t.tenantId === actor.tenantId);
    if (!tool) notFound("Tool not found");
    if (tool.status !== "active") badRequest("Tool is not active");

    const now = nowIso();
    const startTime = Date.now();
    const run: ToolRun = {
      id: newId("toolrun"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      toolId: tool.id,
      input: maskSensitiveData(optionalObject(input)),
      output: { result: `Tool ${tool.name} executed successfully`, input: "received" },
      status: "completed",
      latencyMs: Date.now() - startTime
    };

    state.toolRuns.unshift(run);
    this.store.save();
    this.store.audit(actor, "tool.run", "tool", tool.id, undefined, { runId: run.id });
    return clone(run);
  }

  listGuardrails(actor: RequestActor): Guardrail[] {
    return clone(this.store.getState().guardrails.filter((g) => g.tenantId === actor.tenantId));
  }

  createGuardrail(input: unknown, actor: RequestActor): Guardrail {
    const body = ensureObject(input, "guardrail");
    const state = this.store.getState();
    const key = ensureString(body.key, "guardrail.key");
    if (state.guardrails.some((g) => g.tenantId === actor.tenantId && g.key === key)) conflict(`Guardrail key '${key}' already exists`);

    const now = nowIso();
    const guardrail: Guardrail = {
      id: newId("guard"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key,
      name: ensureString(body.name, "guardrail.name"),
      description: optionalString(body.description),
      status: String(body.status ?? "active") as Guardrail["status"],
      type: String(body.type ?? "both") as Guardrail["type"],
      bannedTerms: ensureArray(body.bannedTerms, "bannedTerms", []),
      requiredTerms: ensureArray(body.requiredTerms, "requiredTerms", []),
      maxInputLength: body.maxInputLength ? ensureNumber(body.maxInputLength, "maxInputLength") : undefined,
      maxOutputLength: body.maxOutputLength ? ensureNumber(body.maxOutputLength, "maxOutputLength") : undefined,
      requireCitations: ensureBoolean(body.requireCitations, false),
      allowCustomData: ensureBoolean(body.allowCustomData, true),
      sensitiveDataPatterns: optionalArray(body.sensitiveDataPatterns),
      actionOnViolation: String(body.actionOnViolation ?? "block") as Guardrail["actionOnViolation"],
      severityLevel: String(body.severityLevel ?? "medium") as Guardrail["severityLevel"],
      metadata: optionalObject(body.metadata)
    };

    state.guardrails.push(guardrail);
    this.store.save();
    this.store.audit(actor, "guardrail.create", "guardrail", guardrail.id, undefined, guardrail);
    return clone(guardrail);
  }

  listWorkflows(actor: RequestActor): AgentWorkflow[] {
    return clone(this.store.getState().agentWorkflows.filter((w) => w.tenantId === actor.tenantId));
  }

  createWorkflow(input: unknown, actor: RequestActor): AgentWorkflow {
    const body = ensureObject(input, "workflow");
    const state = this.store.getState();
    const key = ensureString(body.key, "workflow.key");
    if (state.agentWorkflows.some((w) => w.tenantId === actor.tenantId && w.key === key)) conflict(`Workflow key '${key}' already exists`);

    const agent = state.agents.find((a) => a.id === body.agentId && a.tenantId === actor.tenantId);
    if (!agent) notFound("Agent not found for workflow");

    const now = nowIso();
    const workflow: AgentWorkflow = {
      id: newId("wf"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key,
      name: ensureString(body.name, "workflow.name"),
      description: optionalString(body.description),
      status: String(body.status ?? "active") as AgentWorkflow["status"],
      agentId: agent.id,
      steps: optionalArray(body.steps),
      triggerType: String(body.triggerType ?? "manual") as AgentWorkflow["triggerType"],
      triggerConfig: optionalObject(body.triggerConfig),
      conditions: optionalArray(body.conditions),
      errorHandling: optionalObject(body.errorHandling) as WorkflowErrorHandling,
      timeoutSeconds: ensureNumber(body.timeoutSeconds, "timeoutSeconds", 300),
      retryPolicy: optionalObject(body.retryPolicy) as RetryPolicy,
      version: 1,
      createdBy: actor.userId
    };

    state.agentWorkflows.push(workflow);
    this.store.save();
    this.store.audit(actor, "workflow.create", "workflow", workflow.id, undefined, workflow);
    return clone(workflow);
  }

  listApprovalRequests(actor: RequestActor): ApprovalRequest[] {
    return clone(this.store.getState().approvalRequests.filter((a) => a.tenantId === actor.tenantId));
  }

  createApprovalRequest(input: unknown, actor: RequestActor): ApprovalRequest {
    const body = ensureObject(input, "approval");
    const state = this.store.getState();
    const run = state.agentRuns.find((r) => r.id === body.agentRunId && r.tenantId === actor.tenantId);
    if (!run) notFound("Agent run not found");

    const now = nowIso();
    const approval: ApprovalRequest = {
      id: newId("apr"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      agentRunId: run.id,
      stepId: optionalString(body.stepId),
      toolRunId: optionalString(body.toolRunId),
      type: String(body.type ?? "tool_execution") as ApprovalRequest["type"],
      status: "pending",
      requestorId: actor.userId,
      requestedAt: now,
      summary: ensureString(body.summary, "approval.summary"),
      details: optionalObject(body.details),
      preview: optionalString(body.preview),
      priority: String(body.priority ?? "normal") as ApprovalRequest["priority"]
    };

    state.approvalRequests.push(approval);
    run.status = "waiting_approval";
    run.approvalId = approval.id;
    run.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "approval.request", "approvalRequest", approval.id, undefined, approval);
    this.store.emit(actor, "agentic.approval.requested", { approvalId: approval.id, agentRunId: run.id });
    return clone(approval);
  }

  respondToApproval(id: string, input: unknown, actor: RequestActor): ApprovalRequest {
    const state = this.store.getState();
    const approval = state.approvalRequests.find((a) => a.id === id && a.tenantId === actor.tenantId);
    if (!approval) notFound("Approval request not found");
    if (approval.status !== "pending") badRequest("Approval request already processed");

    const body = ensureObject(input, "response");
    const now = nowIso();
    approval.status = ensureString(body.decision, "decision") === "approve" ? "approved" : "rejected";
    approval.approverId = actor.userId;
    approval.respondedAt = now;
    approval.updatedAt = now;
    if (body.comments) approval.comments = String(body.comments);

    const run = state.agentRuns.find((r) => r.id === approval.agentRunId);
    if (run) {
      run.status = approval.status === "approved" ? "running" : "failed";
      run.approvalId = approval.id;
      run.updatedAt = now;
      if (approval.status === "rejected") run.error = "Approval rejected";
    }

    this.store.save();
    this.store.audit(actor, `approval.${approval.status}`, "approvalRequest", approval.id, undefined, approval);
    return clone(approval);
  }

  listMemory(actor: RequestActor, query?: URLSearchParams): AgentMemory[] {
    const agentId = pickQuery(query, "agentId");
    const memoryType = pickQuery(query, "type");
    return clone(this.store.getState().agentMemories.filter((m) => {
      if (m.tenantId !== actor.tenantId) return false;
      if (agentId && m.agentId !== agentId) return false;
      if (memoryType && m.memoryType !== memoryType) return false;
      return true;
    }));
  }

  createMemory(input: unknown, actor: RequestActor): AgentMemory {
    const body = ensureObject(input, "memory");
    const state = this.store.getState();
    const agent = state.agents.find((a) => a.id === body.agentId && a.tenantId === actor.tenantId);
    if (!agent) notFound("Agent not found");

    const now = nowIso();
    const memory: AgentMemory = {
      id: newId("mem"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      agentId: agent.id,
      memoryType: String(body.memoryType ?? "short_term") as AgentMemory["memoryType"],
      content: ensureString(body.content, "memory.content"),
      importance: ensureNumber(body.importance, "importance", 5),
      expiresAt: optionalString(body.expiresAt),
      source: String(body.source ?? "agent") as AgentMemory["source"],
      linkedEntityIds: optionalArray(body.linkedEntityIds),
      tags: optionalArray(body.tags),
      metadata: optionalObject(body.metadata)
    };

    state.agentMemories.push(memory);
    this.store.save();
    this.store.audit(actor, "memory.create", "memory", memory.id, undefined, memory);
    return clone(memory);
  }

  searchMemory(input: unknown, actor: RequestActor): AgentMemory[] {
    const body = ensureObject(input, "search");
    const query = ensureString(body.query, "search.query");
    const agentId = optionalString(body.agentId);
    const memories = this.store.getState().agentMemories.filter((m) => {
      if (m.tenantId !== actor.tenantId) return false;
      if (agentId && m.agentId !== agentId) return false;
      return m.content.toLowerCase().includes(query.toLowerCase()) || m.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
    });
    return clone(memories.slice(0, 20));
  }

  listEvaluations(actor: RequestActor): EvaluationSuite[] {
    return clone(this.store.getState().evaluationSuites.filter((e) => e.tenantId === actor.tenantId));
  }

  createEvaluation(input: unknown, actor: RequestActor): EvaluationSuite {
    const body = ensureObject(input, "evaluation");
    const state = this.store.getState();
    const key = ensureString(body.key, "evaluation.key");
    if (state.evaluationSuites.some((e) => e.tenantId === actor.tenantId && e.key === key)) conflict(`Evaluation key '${key}' already exists`);

    const agent = state.agents.find((a) => a.id === body.agentId && a.tenantId === actor.tenantId);
    if (!agent) notFound("Agent not found");

    const now = nowIso();
    const suite: EvaluationSuite = {
      id: newId("evalsuite"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key,
      name: ensureString(body.name, "evaluation.name"),
      description: optionalString(body.description),
      status: String(body.status ?? "active") as EvaluationSuite["status"],
      agentId: agent.id,
      version: 1,
      cases: ensureArray(body.cases, "cases", []),
      tags: optionalArray(body.tags),
      createdBy: actor.userId
    };

    state.evaluationSuites.push(suite);
    this.store.save();
    this.store.audit(actor, "evaluation.create", "evaluationSuite", suite.id, undefined, suite);
    return clone(suite);
  }

  runEvaluation(id: string, actor: RequestActor): EvaluationRun {
    const state = this.store.getState();
    const suite = state.evaluationSuites.find((e) => e.id === id && e.tenantId === actor.tenantId);
    if (!suite) notFound("Evaluation suite not found");

    const now = nowIso();
    const results = suite.cases.map((c) => ({
      caseId: c.id,
      passed: true,
      output: `Evaluated: ${c.name}`,
      expectedContains: c.expectedContains,
      missingTerms: [] as string[],
      forbiddenTermsFound: [] as string[],
      scores: { correctness: 8, relevance: 8, safety: 9, formatCompliance: 8, toolUsageAccuracy: 7 },
      feedback: "Auto-evaluation completed"
    }));

    const run: EvaluationRun = {
      id: newId("evalrun"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      suiteId: suite.id,
      agentId: suite.agentId,
      status: "completed",
      totalCases: suite.cases.length,
      passedCases: results.filter((r) => r.passed).length,
      failedCases: results.filter((r) => !r.passed).length,
      results,
      startedAt: now,
      completedAt: nowIso(),
      summary: {
        averageCorrectness: 8,
        averageRelevance: 8,
        averageSafety: 9,
        averageFormatCompliance: 8,
        overallPassRate: (results.filter((r) => r.passed).length / results.length) * 100
      }
    };

    state.evaluationRuns.unshift(run);
    this.store.save();
    this.store.audit(actor, "evaluation.run", "evaluationSuite", suite.id, undefined, { runId: run.id, passedCases: run.passedCases });
    return clone(run);
  }

  listEvents(actor: RequestActor): unknown[] {
    return clone(this.store.getState().events.filter((e) => e.tenantId === actor.tenantId).slice(0, 100));
  }

  listAuditLogs(actor: RequestActor): unknown[] {
    return clone(this.store.getState().auditLogs.filter((a) => a.tenantId === actor.tenantId).slice(0, 100));
  }

  private scanInputGuardrails(text: string, guardrailIds: string[], state: ReturnType<typeof this.store.getState>, tenantId: string): GuardrailResult[] {
    const results: GuardrailResult[] = [];
    const guardrails = state.guardrails.filter((g) => g.tenantId === tenantId && guardrailIds.includes(g.id) && ["input", "both"].includes(g.type) && g.status === "active");

    for (const guardrail of guardrails) {
      const violations: Array<{ term: string; position: number; action: string }> = [];
      for (const term of guardrail.bannedTerms) {
        const pos = text.toLowerCase().indexOf(term.toLowerCase());
        if (pos !== -1) violations.push({ term, position: pos, action: "blocked" });
      }
      results.push({
        guardrailId: guardrail.id,
        guardrailKey: guardrail.key,
        passed: violations.length === 0,
        violations,
        scannedAt: nowIso()
      });
    }
    return results;
  }

  private scanOutputGuardrails(text: string, guardrailIds: string[], state: ReturnType<typeof this.store.getState>, tenantId: string): GuardrailResult[] {
    return this.scanInputGuardrails(text, guardrailIds, state, tenantId);
  }

  private createDefaultSteps(agent: Agent): AgentRunStep[] {
    return [
      {
        stepId: generateStepId("analyze_input"),
        stepName: "Analyze Input",
        stepOrder: 1,
        status: "pending",
        input: {},
        toolRunIds: []
      },
      {
        stepId: generateStepId("process_request"),
        stepName: "Process Request",
        stepOrder: 2,
        status: "pending",
        input: {},
        toolRunIds: []
      },
      {
        stepId: generateStepId("generate_output"),
        stepName: "Generate Output",
        stepOrder: 3,
        status: "pending",
        input: {},
        toolRunIds: []
      }
    ];
  }

  private generateAgentOutput(agent: Agent, input: string, run: AgentRun): string {
    return `Agent: ${agent.name}\n\nInput processed: ${input.slice(0, 100)}${input.length > 100 ? "..." : ""}\n\nStatus: ${run.status}\n\nThis is a demo response from AgenticOS. The agent "${agent.name}" has successfully processed the request and generated this output.`;
  }

  private calculateAveragePassRate(runs: EvaluationRun[]): number {
    if (runs.length === 0) return 0;
    const completedRuns = runs.filter((r) => r.status === "completed");
    if (completedRuns.length === 0) return 0;
    const totalPassRate = completedRuns.reduce((acc, r) => acc + r.summary.overallPassRate, 0);
    return Math.round((totalPassRate / completedRuns.length) * 100) / 100;
  }
}

function countBy(items: any[], key: string): Record<string, number> {
  return items.reduce((acc, item) => {
    const value = String(item[key] ?? "unknown");
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function addUsage(a: RunUsageMetrics, b: RunUsageMetrics): RunUsageMetrics {
  return {
    promptTokens: a.promptTokens + b.promptTokens,
    completionTokens: a.completionTokens + b.completionTokens,
    totalTokens: a.totalTokens + b.totalTokens,
    toolCalls: a.toolCalls + b.toolCalls,
    guardrailScans: a.guardrailScans + b.guardrailScans,
    memoryOperations: a.memoryOperations + b.memoryOperations,
    estimatedCost: Number((a.estimatedCost + b.estimatedCost).toFixed(6)),
    latencyMs: a.latencyMs + b.latencyMs
  };
}
