import { DataStore } from "../core/datastore";
import {
  AgentDefinition,
  AgentRun,
  AiosEvent,
  AiosOverview,
  AITool,
  AutomationRule,
  Conversation,
  ConversationMessage,
  EvaluationRun,
  EvaluationSuite,
  Guardrail,
  KnowledgeBase,
  KnowledgeDocument,
  LlmCompletion,
  LlmModel,
  ModelProvider,
  PromptTemplate,
  RequestActor,
  SearchHit,
  ToolRun,
  UsageMetrics
} from "../core/domain";
import { badRequest, conflict, notFound } from "../core/errors";
import { estimateTokens, newId, nowIso } from "../core/id";
import { clone, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, getPathValue, optionalObject, pickQuery } from "../core/utils";
import { GuardrailEngine } from "../engines/guardrail-engine";
import { MockLlmEngine } from "../engines/mock-llm-engine";
import { PromptEngine } from "../engines/prompt-engine";
import { chunkText, SearchEngine } from "../engines/search-engine";
import { ToolEngine } from "../engines/tool-engine";

const zeroUsage = (): UsageMetrics => ({ promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 });

export class AiosService {
  readonly promptEngine = new PromptEngine();
  readonly searchEngine = new SearchEngine();
  readonly llmEngine = new MockLlmEngine();
  readonly toolEngine = new ToolEngine();
  readonly guardrailEngine = new GuardrailEngine();

  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "AIOS service is ready";
  }

  overview(actor: RequestActor): AiosOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    const runs = state.agentRuns.filter((item) => item.tenantId === tenant);
    const usage = runs.reduce((acc, run) => addUsage(acc, run.usage), zeroUsage());
    return {
      providers: state.providers.filter((item) => item.tenantId === tenant).length,
      models: state.models.filter((item) => item.tenantId === tenant).length,
      prompts: {
        total: state.prompts.filter((item) => item.tenantId === tenant).length,
        active: state.prompts.filter((item) => item.tenantId === tenant && item.status === "active").length
      },
      knowledge: {
        bases: state.knowledgeBases.filter((item) => item.tenantId === tenant).length,
        documents: state.documents.filter((item) => item.tenantId === tenant).length,
        chunks: state.chunks.filter((item) => item.tenantId === tenant).length
      },
      agents: {
        total: state.agents.filter((item) => item.tenantId === tenant).length,
        active: state.agents.filter((item) => item.tenantId === tenant && item.status === "active").length
      },
      conversations: {
        open: state.conversations.filter((item) => item.tenantId === tenant && item.status === "open").length,
        messages: state.messages.filter((item) => item.tenantId === tenant).length
      },
      runs: {
        total: runs.length,
        completed: runs.filter((item) => item.status === "completed").length,
        blocked: runs.filter((item) => item.status === "blocked").length,
        failed: runs.filter((item) => item.status === "failed").length
      },
      tools: {
        total: state.tools.filter((item) => item.tenantId === tenant).length,
        active: state.tools.filter((item) => item.tenantId === tenant && item.status === "active").length,
        runs: state.toolRuns.filter((item) => item.tenantId === tenant).length
      },
      guardrails: {
        total: state.guardrails.filter((item) => item.tenantId === tenant).length,
        active: state.guardrails.filter((item) => item.tenantId === tenant && item.status === "active").length
      },
      usage
    };
  }

  listProviders(actor: RequestActor): ModelProvider[] {
    return clone(this.store.getState().providers.filter((item) => item.tenantId === actor.tenantId));
  }

  createProvider(input: unknown, actor: RequestActor): ModelProvider {
    const body = ensureObject(input, "provider");
    const state = this.store.getState();
    const key = ensureString(body.key, "provider.key");
    if (state.providers.some((item) => item.tenantId === actor.tenantId && item.key === key)) conflict(`Provider key '${key}' already exists`);
    const provider: ModelProvider = {
      id: newId("provider"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "provider.name"),
      type: String(body.type ?? "mock") as ModelProvider["type"],
      status: String(body.status ?? "active") as ModelProvider["status"],
      baseUrl: body.baseUrl ? String(body.baseUrl) : undefined,
      maskedApiKey: body.apiKey ? maskSecret(String(body.apiKey)) : body.maskedApiKey ? String(body.maskedApiKey) : undefined,
      config: optionalObject(body.config)
    };
    state.providers.push(provider);
    this.store.save();
    this.store.audit(actor, "provider.create", "provider", provider.id, undefined, provider);
    return clone(provider);
  }

  listModels(actor: RequestActor): LlmModel[] {
    return clone(this.store.getState().models.filter((item) => item.tenantId === actor.tenantId));
  }

  createModel(input: unknown, actor: RequestActor): LlmModel {
    const body = ensureObject(input, "model");
    const state = this.store.getState();
    const key = ensureString(body.key, "model.key");
    if (state.models.some((item) => item.tenantId === actor.tenantId && item.key === key)) conflict(`Model key '${key}' already exists`);
    const provider = this.requireProvider(String(body.providerId), actor.tenantId);
    const model: LlmModel = {
      id: newId("model"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      providerId: provider.id,
      name: ensureString(body.name, "model.name"),
      family: ensureString(body.family, "model.family", "mock"),
      contextWindow: ensureNumber(body.contextWindow, "model.contextWindow", 128000),
      maxOutputTokens: ensureNumber(body.maxOutputTokens, "model.maxOutputTokens", 2048),
      temperatureDefault: ensureNumber(body.temperatureDefault, "model.temperatureDefault", 0.2),
      status: String(body.status ?? "active") as LlmModel["status"],
      capabilities: ensureArray(body.capabilities, "model.capabilities", ["chat", "json", "tool_calling", "embedding"])
    };
    state.models.push(model);
    this.store.save();
    this.store.audit(actor, "model.create", "model", model.id, undefined, model);
    return clone(model);
  }

  listPrompts(actor: RequestActor, query?: URLSearchParams): PromptTemplate[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    return clone(this.store.getState().prompts.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (search && !`${item.key} ${item.name} ${item.description ?? ""}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  getPrompt(id: string, actor: RequestActor): PromptTemplate {
    const prompt = this.store.getState().prompts.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!prompt) notFound("Prompt not found");
    return clone(prompt);
  }

  createPrompt(input: unknown, actor: RequestActor): PromptTemplate {
    const body = ensureObject(input, "prompt");
    const state = this.store.getState();
    const key = ensureString(body.key, "prompt.key");
    if (state.prompts.some((item) => item.tenantId === actor.tenantId && item.key === key)) conflict(`Prompt key '${key}' already exists`);
    const template = ensureString(body.template, "prompt.template");
    const prompt: PromptTemplate = {
      id: newId("prompt"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "prompt.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as PromptTemplate["status"],
      tags: ensureArray<string>(body.tags, "prompt.tags"),
      activeVersion: 1,
      versions: [{
        version: 1,
        template,
        variables: ensureArray<string>(body.variables, "prompt.variables", this.promptEngine.extractVariables(template)),
        createdAt: nowIso(),
        createdBy: actor.userId,
        notes: body.notes ? String(body.notes) : undefined
      }]
    };
    state.prompts.push(prompt);
    this.store.save();
    this.store.audit(actor, "prompt.create", "prompt", prompt.id, undefined, prompt);
    return clone(prompt);
  }

  addPromptVersion(id: string, input: unknown, actor: RequestActor): PromptTemplate {
    const body = ensureObject(input, "promptVersion");
    const state = this.store.getState();
    const prompt = state.prompts.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!prompt) notFound("Prompt not found");
    const before = clone(prompt);
    const template = ensureString(body.template, "promptVersion.template");
    const version = Math.max(...prompt.versions.map((item) => item.version)) + 1;
    prompt.versions.push({
      version,
      template,
      variables: ensureArray<string>(body.variables, "promptVersion.variables", this.promptEngine.extractVariables(template)),
      createdAt: nowIso(),
      createdBy: actor.userId,
      notes: body.notes ? String(body.notes) : undefined
    });
    prompt.activeVersion = ensureBoolean(body.makeActive, true) ? version : prompt.activeVersion;
    prompt.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "prompt.version.add", "prompt", prompt.id, before, prompt);
    return clone(prompt);
  }

  renderPrompt(id: string, input: unknown, actor: RequestActor): { promptId: string; version: number; rendered: string; variables: Record<string, unknown> } {
    const body = ensureObject(input ?? {}, "render");
    const prompt = this.store.getState().prompts.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!prompt) notFound("Prompt not found");
    const version = prompt.versions.find((item) => item.version === Number(body.version ?? prompt.activeVersion));
    if (!version) notFound("Prompt version not found");
    const variables = optionalObject(body.variables);
    return { promptId: prompt.id, version: version.version, rendered: this.promptEngine.render(version.template, variables), variables };
  }

  complete(input: unknown, actor: RequestActor): LlmCompletion {
    const body = ensureObject(input, "completion");
    const state = this.store.getState();
    const model = this.requireModel(String(body.modelId ?? "model_mock_mind"), actor.tenantId);
    const prompt = ensureString(body.prompt, "completion.prompt");
    const result = this.llmEngine.complete({ model, prompt, context: body.context ? String(body.context) : undefined, mode: String(body.mode ?? "chat") as any });
    const completion: LlmCompletion = {
      id: newId("completion"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      modelId: model.id,
      prompt,
      response: result.response,
      status: "completed",
      usage: result.usage,
      metadata: optionalObject(body.metadata)
    };
    state.completions.unshift(completion);
    this.store.save();
    this.store.audit(actor, "llm.complete", "completion", completion.id, undefined, { modelId: model.id, usage: completion.usage });
    return clone(completion);
  }

  listKnowledgeBases(actor: RequestActor): KnowledgeBase[] {
    return clone(this.store.getState().knowledgeBases.filter((item) => item.tenantId === actor.tenantId));
  }

  createKnowledgeBase(input: unknown, actor: RequestActor): KnowledgeBase {
    const body = ensureObject(input, "knowledgeBase");
    const state = this.store.getState();
    const key = ensureString(body.key, "knowledgeBase.key");
    if (state.knowledgeBases.some((item) => item.tenantId === actor.tenantId && item.key === key)) conflict(`Knowledge base key '${key}' already exists`);
    const kb: KnowledgeBase = {
      id: newId("kb"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "knowledgeBase.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as KnowledgeBase["status"],
      tags: ensureArray<string>(body.tags, "knowledgeBase.tags"),
      embeddingModelId: body.embeddingModelId ? String(body.embeddingModelId) : undefined,
      chunkSize: ensureNumber(body.chunkSize, "knowledgeBase.chunkSize", 700),
      chunkOverlap: ensureNumber(body.chunkOverlap, "knowledgeBase.chunkOverlap", 100)
    };
    state.knowledgeBases.push(kb);
    this.store.save();
    this.store.audit(actor, "kb.create", "knowledgeBase", kb.id, undefined, kb);
    return clone(kb);
  }

  listDocuments(actor: RequestActor, query?: URLSearchParams): KnowledgeDocument[] {
    const kbId = pickQuery(query, "knowledgeBaseId");
    return clone(this.store.getState().documents.filter((item) => item.tenantId === actor.tenantId && (!kbId || item.knowledgeBaseId === kbId)));
  }

  addDocument(input: unknown, actor: RequestActor): KnowledgeDocument {
    const body = ensureObject(input, "document");
    const state = this.store.getState();
    const kb = this.requireKnowledgeBase(String(body.knowledgeBaseId), actor.tenantId);
    const document: KnowledgeDocument = {
      id: newId("doc"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      knowledgeBaseId: kb.id,
      title: ensureString(body.title, "document.title"),
      sourceType: String(body.sourceType ?? "text") as KnowledgeDocument["sourceType"],
      sourceUri: body.sourceUri ? String(body.sourceUri) : undefined,
      status: "indexed",
      content: ensureString(body.content, "document.content"),
      metadata: optionalObject(body.metadata)
    };
    state.documents.push(document);
    this.reindexDocument(document, kb);
    this.store.save();
    this.store.audit(actor, "document.add", "document", document.id, undefined, { title: document.title, chunkCount: state.chunks.filter((chunk) => chunk.documentId === document.id).length });
    return clone(document);
  }

  reindexDocumentById(id: string, actor: RequestActor): { document: KnowledgeDocument; chunks: number } {
    const state = this.store.getState();
    const document = state.documents.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!document) notFound("Document not found");
    const kb = this.requireKnowledgeBase(document.knowledgeBaseId, actor.tenantId);
    state.chunks = state.chunks.filter((chunk) => chunk.documentId !== document.id);
    this.reindexDocument(document, kb);
    document.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "document.reindex", "document", document.id, undefined, { chunks: state.chunks.filter((chunk) => chunk.documentId === document.id).length });
    return { document: clone(document), chunks: state.chunks.filter((chunk) => chunk.documentId === document.id).length };
  }

  searchKnowledge(input: unknown, actor: RequestActor): SearchHit[] {
    const body = ensureObject(input, "search");
    const query = ensureString(body.query, "search.query");
    const kbIds = ensureArray<string>(body.knowledgeBaseIds, "search.knowledgeBaseIds", this.store.getState().knowledgeBases.filter((kb) => kb.tenantId === actor.tenantId).map((kb) => kb.id));
    return this.searchEngine.search(this.store.getState(), actor.tenantId, kbIds, query, ensureNumber(body.limit, "search.limit", 5));
  }

  ragQuery(input: unknown, actor: RequestActor): { query: string; hits: SearchHit[]; answer: string; usage: UsageMetrics } {
    const body = ensureObject(input, "ragQuery");
    const query = ensureString(body.query, "ragQuery.query");
    const kbIds = ensureArray<string>(body.knowledgeBaseIds, "ragQuery.knowledgeBaseIds", this.store.getState().knowledgeBases.filter((kb) => kb.tenantId === actor.tenantId).map((kb) => kb.id));
    const hits = this.searchEngine.search(this.store.getState(), actor.tenantId, kbIds, query, ensureNumber(body.limit, "ragQuery.limit", 5));
    const context = hits.map((hit) => `[${hit.citation}] ${hit.text}`).join("\n");
    const model = this.requireModel(String(body.modelId ?? "model_mock_mind"), actor.tenantId);
    const promptId = body.promptId ? String(body.promptId) : "prompt_rag_answer";
    const prompt = this.resolvePromptText(promptId, actor.tenantId, { query, context, hits, variables: optionalObject(body.variables) });
    const result = this.llmEngine.complete({ model, prompt, context, mode: "rag" });
    return { query, hits, answer: result.response, usage: result.usage };
  }

  listTools(actor: RequestActor): AITool[] {
    return clone(this.store.getState().tools.filter((item) => item.tenantId === actor.tenantId));
  }

  createTool(input: unknown, actor: RequestActor): AITool {
    const body = ensureObject(input, "tool");
    const state = this.store.getState();
    const key = ensureString(body.key, "tool.key");
    if (state.tools.some((item) => item.tenantId === actor.tenantId && item.key === key)) conflict(`Tool key '${key}' already exists`);
    const tool: AITool = {
      id: newId("tool"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "tool.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "builtin") as AITool["type"],
      status: String(body.status ?? "active") as AITool["status"],
      inputSchema: optionalObject(body.inputSchema),
      config: optionalObject(body.config)
    };
    state.tools.push(tool);
    this.store.save();
    this.store.audit(actor, "tool.create", "tool", tool.id, undefined, tool);
    return clone(tool);
  }

  runTool(id: string, input: unknown, actor: RequestActor): ToolRun {
    const tool = this.requireTool(id, actor.tenantId);
    const run = this.toolEngine.run(tool, optionalObject(input), actor.tenantId);
    this.store.getState().toolRuns.unshift(run);
    this.store.save();
    this.store.audit(actor, "tool.run", "tool", tool.id, undefined, { runId: run.id, status: run.status });
    return clone(run);
  }

  listGuardrails(actor: RequestActor): Guardrail[] {
    return clone(this.store.getState().guardrails.filter((item) => item.tenantId === actor.tenantId));
  }

  createGuardrail(input: unknown, actor: RequestActor): Guardrail {
    const body = ensureObject(input, "guardrail");
    const state = this.store.getState();
    const key = ensureString(body.key, "guardrail.key");
    if (state.guardrails.some((item) => item.tenantId === actor.tenantId && item.key === key)) conflict(`Guardrail key '${key}' already exists`);
    const guardrail: Guardrail = {
      id: newId("guardrail"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "guardrail.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as Guardrail["status"],
      bannedTerms: ensureArray<string>(body.bannedTerms, "guardrail.bannedTerms"),
      requiredTerms: ensureArray<string>(body.requiredTerms, "guardrail.requiredTerms"),
      requireCitations: ensureBoolean(body.requireCitations, false),
      maxInputLength: body.maxInputLength ? ensureNumber(body.maxInputLength, "guardrail.maxInputLength") : undefined,
      maxOutputLength: body.maxOutputLength ? ensureNumber(body.maxOutputLength, "guardrail.maxOutputLength") : undefined
    };
    state.guardrails.push(guardrail);
    this.store.save();
    this.store.audit(actor, "guardrail.create", "guardrail", guardrail.id, undefined, guardrail);
    return clone(guardrail);
  }

  scanGuardrails(input: unknown, actor: RequestActor): ReturnType<GuardrailEngine["scan"]> {
    const body = ensureObject(input, "guardrailScan");
    const guardrailIds = ensureArray<string>(body.guardrailIds, "guardrailScan.guardrailIds", this.store.getState().guardrails.filter((guardrail) => guardrail.tenantId === actor.tenantId).map((guardrail) => guardrail.id));
    const guardrails = this.store.getState().guardrails.filter((item) => item.tenantId === actor.tenantId && guardrailIds.includes(item.id));
    return this.guardrailEngine.scan(ensureString(body.text, "guardrailScan.text"), guardrails, String(body.phase ?? "input") as any);
  }

  listAgents(actor: RequestActor, query?: URLSearchParams): AgentDefinition[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    return clone(this.store.getState().agents.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (search && !`${item.key} ${item.name} ${item.description ?? ""}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  getAgent(id: string, actor: RequestActor): AgentDefinition {
    const agent = this.store.getState().agents.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!agent) notFound("Agent not found");
    return clone(agent);
  }

  createAgent(input: unknown, actor: RequestActor): AgentDefinition {
    const body = ensureObject(input, "agent");
    const state = this.store.getState();
    const key = ensureString(body.key, "agent.key");
    if (state.agents.some((item) => item.tenantId === actor.tenantId && item.key === key)) conflict(`Agent key '${key}' already exists`);
    const model = this.requireModel(String(body.modelId ?? "model_mock_mind"), actor.tenantId);
    const prompt = this.requirePrompt(String(body.promptId ?? "prompt_agent_assistant"), actor.tenantId);
    const knowledgeBaseIds = ensureArray<string>(body.knowledgeBaseIds, "agent.knowledgeBaseIds");
    knowledgeBaseIds.forEach((kbId) => this.requireKnowledgeBase(kbId, actor.tenantId));
    const toolIds = ensureArray<string>(body.toolIds, "agent.toolIds");
    toolIds.forEach((toolId) => this.requireTool(toolId, actor.tenantId));
    const guardrailIds = ensureArray<string>(body.guardrailIds, "agent.guardrailIds");
    guardrailIds.forEach((guardrailId) => this.requireGuardrail(guardrailId, actor.tenantId));
    const agent: AgentDefinition = {
      id: newId("agent"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "agent.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as AgentDefinition["status"],
      modelId: model.id,
      promptId: prompt.id,
      knowledgeBaseIds,
      toolIds,
      guardrailIds,
      memoryEnabled: ensureBoolean(body.memoryEnabled, true),
      variables: optionalObject(body.variables)
    };
    state.agents.push(agent);
    this.store.save();
    this.store.audit(actor, "agent.create", "agent", agent.id, undefined, agent);
    return clone(agent);
  }

  runAgent(id: string, input: unknown, actor: RequestActor): AgentRun {
    const body = ensureObject(input, "agentRun");
    const state = this.store.getState();
    const agent = this.requireAgent(id, actor.tenantId);
    if (agent.status !== "active") badRequest("Agent is not active");
    const userInput = ensureString(body.input, "agentRun.input");
    const model = this.requireModel(agent.modelId, actor.tenantId);
    const guardrails = state.guardrails.filter((item) => item.tenantId === actor.tenantId && agent.guardrailIds.includes(item.id));
    const inputScan = this.guardrailEngine.scan(userInput, guardrails, "input");

    if (!inputScan.allowed) {
      const blockedRun = this.createBlockedAgentRun(agent, userInput, inputScan.violations.map((item) => item.reason).join("; "), actor, body.conversationId ? String(body.conversationId) : undefined);
      return clone(blockedRun);
    }

    const hits = this.searchEngine.search(state, actor.tenantId, agent.knowledgeBaseIds, userInput, ensureNumber(body.limit, "agentRun.limit", 5));
    const context = hits.map((hit) => `[${hit.citation}] ${hit.text}`).join("\n");
    const toolRuns = this.runAgentTools(agent, body, userInput, actor);
    const variables = {
      ...agent.variables,
      ...optionalObject(body.variables),
      input: userInput,
      context,
      hits,
      toolOutputs: toolRuns.map((run) => ({ toolRunId: run.id, output: run.output })),
      agent: { key: agent.key, name: agent.name }
    };
    const renderedPrompt = this.resolvePromptText(agent.promptId, actor.tenantId, variables);
    const result = this.llmEngine.complete({ model, prompt: renderedPrompt, context, mode: hits.length ? "rag" : "chat" });
    const outputScan = this.guardrailEngine.scan(result.response, guardrails, "output");
    const run: AgentRun = {
      id: newId("agentrun"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      agentId: agent.id,
      conversationId: body.conversationId ? String(body.conversationId) : undefined,
      input: userInput,
      renderedPrompt,
      retrievedHits: hits,
      toolRunIds: toolRuns.map((run) => run.id),
      output: outputScan.allowed ? result.response : `Blocked by guardrail: ${outputScan.violations.map((item) => item.reason).join("; ")}`,
      status: outputScan.allowed ? "completed" : "blocked",
      usage: result.usage,
      metadata: { inputScan, outputScan, ...optionalObject(body.metadata) }
    };
    for (const toolRun of toolRuns) toolRun.agentRunId = run.id;
    state.agentRuns.unshift(run);
    const completion: LlmCompletion = {
      id: newId("completion"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      modelId: model.id,
      prompt: renderedPrompt,
      response: run.output,
      status: run.status === "completed" ? "completed" : "blocked",
      usage: result.usage,
      metadata: { agentId: agent.id, agentRunId: run.id }
    };
    state.completions.unshift(completion);
    this.appendConversationMessages(agent, run, actor, body.conversationId ? String(body.conversationId) : undefined);
    this.emitInternalEvent("agent.run.completed", "AIOS", { agentId: agent.id, agentRunId: run.id, status: run.status }, actor);
    this.store.save();
    this.store.audit(actor, "agent.run", "agent", agent.id, undefined, { runId: run.id, status: run.status, usage: run.usage });
    return clone(run);
  }

  listAgentRuns(actor: RequestActor, query?: URLSearchParams): AgentRun[] {
    const agentId = pickQuery(query, "agentId");
    return clone(this.store.getState().agentRuns.filter((item) => item.tenantId === actor.tenantId && (!agentId || item.agentId === agentId)));
  }

  listConversations(actor: RequestActor): Conversation[] {
    return clone(this.store.getState().conversations.filter((item) => item.tenantId === actor.tenantId));
  }

  createConversation(input: unknown, actor: RequestActor): Conversation {
    const body = ensureObject(input, "conversation");
    if (body.agentId) this.requireAgent(String(body.agentId), actor.tenantId);
    const conversation: Conversation = {
      id: newId("conv"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      agentId: body.agentId ? String(body.agentId) : undefined,
      userId: String(body.userId ?? actor.userId),
      title: ensureString(body.title, "conversation.title", "AIOS conversation"),
      status: "open",
      summary: body.summary ? String(body.summary) : undefined
    };
    this.store.getState().conversations.unshift(conversation);
    this.store.save();
    this.store.audit(actor, "conversation.create", "conversation", conversation.id, undefined, conversation);
    return clone(conversation);
  }

  getConversation(id: string, actor: RequestActor): { conversation: Conversation; messages: ConversationMessage[] } {
    const conversation = this.store.getState().conversations.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!conversation) notFound("Conversation not found");
    return {
      conversation: clone(conversation),
      messages: clone(this.store.getState().messages.filter((item) => item.conversationId === id && item.tenantId === actor.tenantId))
    };
  }

  addConversationMessage(id: string, input: unknown, actor: RequestActor): ConversationMessage {
    const body = ensureObject(input, "message");
    const conversation = this.store.getState().conversations.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!conversation) notFound("Conversation not found");
    const message: ConversationMessage = {
      id: newId("msg"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      conversationId: conversation.id,
      role: String(body.role ?? "user") as ConversationMessage["role"],
      content: ensureString(body.content, "message.content"),
      agentRunId: body.agentRunId ? String(body.agentRunId) : undefined,
      metadata: optionalObject(body.metadata)
    };
    this.store.getState().messages.push(message);
    conversation.updatedAt = nowIso();
    this.store.save();
    return clone(message);
  }

  listAutomations(actor: RequestActor): AutomationRule[] {
    return clone(this.store.getState().automations.filter((item) => item.tenantId === actor.tenantId));
  }

  createAutomation(input: unknown, actor: RequestActor): AutomationRule {
    const body = ensureObject(input, "automation");
    const state = this.store.getState();
    const key = ensureString(body.key, "automation.key");
    if (state.automations.some((item) => item.tenantId === actor.tenantId && item.key === key)) conflict(`Automation key '${key}' already exists`);
    const automation: AutomationRule = {
      id: newId("automation"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "automation.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as AutomationRule["status"],
      triggerEvent: ensureString(body.triggerEvent, "automation.triggerEvent"),
      filters: ensureArray(body.filters, "automation.filters"),
      action: String(body.action ?? "run_agent") as AutomationRule["action"],
      config: optionalObject(body.config)
    };
    state.automations.push(automation);
    this.store.save();
    this.store.audit(actor, "automation.create", "automation", automation.id, undefined, automation);
    return clone(automation);
  }

  ingestEvent(input: unknown, actor: RequestActor): { event: AiosEvent; matchedAutomations: number; actions: unknown[] } {
    const body = ensureObject(input, "event");
    const event = this.emitInternalEvent(ensureString(body.type, "event.type"), ensureString(body.source, "event.source", "external"), optionalObject(body.data), actor, body.correlationId ? String(body.correlationId) : undefined);
    const state = this.store.getState();
    const automations = state.automations.filter((automation) => automation.tenantId === actor.tenantId && automation.status === "active" && automation.triggerEvent === event.type && filtersMatch(automation.filters, event));
    const actions = automations.map((automation) => this.executeAutomation(automation, event, actor));
    this.store.save();
    return { event: clone(event), matchedAutomations: automations.length, actions: clone(actions) };
  }

  listEvents(actor: RequestActor): AiosEvent[] {
    return clone(this.store.getState().events.filter((item) => item.tenantId === actor.tenantId));
  }

  listEvaluationSuites(actor: RequestActor): EvaluationSuite[] {
    return clone(this.store.getState().evaluationSuites.filter((item) => item.tenantId === actor.tenantId));
  }

  createEvaluationSuite(input: unknown, actor: RequestActor): EvaluationSuite {
    const body = ensureObject(input, "evaluationSuite");
    const agent = this.requireAgent(String(body.agentId), actor.tenantId);
    const suite: EvaluationSuite = {
      id: newId("evalsuite"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: ensureString(body.key, "evaluationSuite.key"),
      name: ensureString(body.name, "evaluationSuite.name"),
      status: String(body.status ?? "active") as EvaluationSuite["status"],
      agentId: agent.id,
      cases: ensureArray(body.cases, "evaluationSuite.cases").map((item: any) => ({
        id: String(item.id ?? newId("evalcase")),
        name: ensureString(item.name, "case.name"),
        input: ensureString(item.input, "case.input"),
        expectedContains: ensureArray<string>(item.expectedContains, "case.expectedContains"),
        metadata: optionalObject(item.metadata)
      }))
    };
    this.store.getState().evaluationSuites.push(suite);
    this.store.save();
    this.store.audit(actor, "evaluation.create", "evaluationSuite", suite.id, undefined, suite);
    return clone(suite);
  }

  runEvaluationSuite(id: string, actor: RequestActor): EvaluationRun {
    const suite = this.store.getState().evaluationSuites.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!suite) notFound("Evaluation suite not found");
    const results = suite.cases.map((testCase) => {
      const run = this.runAgent(suite.agentId, { input: testCase.input, metadata: { evaluationSuiteId: suite.id, evaluationCaseId: testCase.id } }, actor);
      const lower = run.output.toLowerCase();
      const missing = testCase.expectedContains.filter((term) => !lower.includes(term.toLowerCase()));
      return { caseId: testCase.id, passed: missing.length === 0, output: run.output, missing };
    });
    const evaluationRun: EvaluationRun = {
      id: newId("evalrun"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      suiteId: suite.id,
      agentId: suite.agentId,
      status: "completed",
      totalCases: suite.cases.length,
      passedCases: results.filter((item) => item.passed).length,
      results
    };
    this.store.getState().evaluationRuns.unshift(evaluationRun);
    this.store.save();
    this.store.audit(actor, "evaluation.run", "evaluationSuite", suite.id, undefined, { runId: evaluationRun.id, passedCases: evaluationRun.passedCases });
    return clone(evaluationRun);
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((item) => item.tenantId === actor.tenantId));
  }

  private requireProvider(idOrKey: string, tenantId: string): ModelProvider {
    const item = this.store.getState().providers.find((provider) => provider.tenantId === tenantId && (provider.id === idOrKey || provider.key === idOrKey));
    if (!item) notFound("Provider not found");
    return item;
  }

  private requireModel(idOrKey: string, tenantId: string): LlmModel {
    const item = this.store.getState().models.find((model) => model.tenantId === tenantId && (model.id === idOrKey || model.key === idOrKey));
    if (!item) notFound("Model not found");
    return item;
  }

  private requirePrompt(idOrKey: string, tenantId: string): PromptTemplate {
    const item = this.store.getState().prompts.find((prompt) => prompt.tenantId === tenantId && (prompt.id === idOrKey || prompt.key === idOrKey));
    if (!item) notFound("Prompt not found");
    return item;
  }

  private requireKnowledgeBase(idOrKey: string, tenantId: string): KnowledgeBase {
    const item = this.store.getState().knowledgeBases.find((kb) => kb.tenantId === tenantId && (kb.id === idOrKey || kb.key === idOrKey));
    if (!item) notFound("Knowledge base not found");
    return item;
  }

  private requireTool(idOrKey: string, tenantId: string): AITool {
    const item = this.store.getState().tools.find((tool) => tool.tenantId === tenantId && (tool.id === idOrKey || tool.key === idOrKey));
    if (!item) notFound("Tool not found");
    return item;
  }

  private requireGuardrail(idOrKey: string, tenantId: string): Guardrail {
    const item = this.store.getState().guardrails.find((guardrail) => guardrail.tenantId === tenantId && (guardrail.id === idOrKey || guardrail.key === idOrKey));
    if (!item) notFound("Guardrail not found");
    return item;
  }

  private requireAgent(idOrKey: string, tenantId: string): AgentDefinition {
    const item = this.store.getState().agents.find((agent) => agent.tenantId === tenantId && (agent.id === idOrKey || agent.key === idOrKey));
    if (!item) notFound("Agent not found");
    return item;
  }

  private resolvePromptText(idOrKey: string, tenantId: string, variables: Record<string, unknown>): string {
    const prompt = this.requirePrompt(idOrKey, tenantId);
    const version = prompt.versions.find((item) => item.version === prompt.activeVersion) ?? prompt.versions[prompt.versions.length - 1];
    return this.promptEngine.render(version.template, variables);
  }

  private reindexDocument(document: KnowledgeDocument, kb: KnowledgeBase): void {
    const state = this.store.getState();
    const pieces = chunkText(document.content, kb.chunkSize, kb.chunkOverlap);
    pieces.forEach((text, chunkIndex) => {
      state.chunks.push(this.searchEngine.buildChunk({
        id: newId("chunk"),
        tenantId: document.tenantId,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        knowledgeBaseId: document.knowledgeBaseId,
        documentId: document.id,
        chunkIndex,
        text,
        metadata: { title: document.title, sourceType: document.sourceType }
      }));
    });
  }

  private runAgentTools(agent: AgentDefinition, body: Record<string, any>, userInput: string, actor: RequestActor): ToolRun[] {
    const state = this.store.getState();
    const tools = state.tools.filter((tool) => tool.tenantId === actor.tenantId && agent.toolIds.includes(tool.id) && tool.status === "active");
    const requestedInputs = ensureArray<any>(body.toolInputs, "agentRun.toolInputs", []);
    const runs: ToolRun[] = [];

    for (const requested of requestedInputs) {
      const toolId = String(requested.toolId ?? requested.toolKey ?? "");
      const tool = tools.find((item) => item.id === toolId || item.key === toolId);
      if (!tool) continue;
      const run = this.toolEngine.run(tool, optionalObject(requested.input), actor.tenantId);
      state.toolRuns.unshift(run);
      runs.push(run);
    }

    const lower = userInput.toLowerCase();
    const calculator = tools.find((tool) => tool.key === "calculator");
    const expressionMatch = userInput.match(/(?:calculate|calc|what is)\s+([0-9+\-*/().\s]+)/i);
    if (calculator && expressionMatch && !runs.some((run) => run.toolId === calculator.id)) {
      const run = this.toolEngine.run(calculator, { expression: expressionMatch[1].trim() }, actor.tenantId);
      state.toolRuns.unshift(run);
      runs.push(run);
    }

    const taskCreator = tools.find((tool) => tool.key === "task_creator");
    if (taskCreator && lower.includes("create task") && !runs.some((run) => run.toolId === taskCreator.id)) {
      const run = this.toolEngine.run(taskCreator, { title: userInput.replace(/create task:?/i, "").trim() || "AIOS generated task" }, actor.tenantId);
      state.toolRuns.unshift(run);
      runs.push(run);
    }

    return runs;
  }

  private createBlockedAgentRun(agent: AgentDefinition, input: string, reason: string, actor: RequestActor, conversationId?: string): AgentRun {
    const run: AgentRun = {
      id: newId("agentrun"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      agentId: agent.id,
      conversationId,
      input,
      renderedPrompt: "",
      retrievedHits: [],
      toolRunIds: [],
      output: `Blocked by guardrail: ${reason}`,
      status: "blocked",
      usage: zeroUsage(),
      metadata: { reason }
    };
    this.store.getState().agentRuns.unshift(run);
    this.appendConversationMessages(agent, run, actor, conversationId);
    this.store.save();
    this.store.audit(actor, "agent.run.blocked", "agent", agent.id, undefined, { runId: run.id, reason });
    return run;
  }

  private appendConversationMessages(agent: AgentDefinition, run: AgentRun, actor: RequestActor, conversationId?: string): void {
    if (!agent.memoryEnabled && !conversationId) return;
    const state = this.store.getState();
    let conversation = conversationId ? state.conversations.find((item) => item.id === conversationId && item.tenantId === actor.tenantId) : undefined;
    if (!conversation && agent.memoryEnabled) {
      conversation = {
        id: newId("conv"),
        tenantId: actor.tenantId,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        agentId: agent.id,
        userId: actor.userId,
        title: `${agent.name} conversation`,
        status: "open"
      };
      state.conversations.unshift(conversation);
      run.conversationId = conversation.id;
    }
    if (!conversation) return;
    conversation.updatedAt = nowIso();
    state.messages.push({
      id: newId("msg"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      conversationId: conversation.id,
      role: "user",
      content: run.input,
      agentRunId: run.id,
      metadata: {}
    });
    state.messages.push({
      id: newId("msg"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      conversationId: conversation.id,
      role: "assistant",
      content: run.output,
      agentRunId: run.id,
      metadata: { status: run.status }
    });
  }

  private emitInternalEvent(type: string, source: string, data: Record<string, unknown>, actor: RequestActor, correlationId?: string): AiosEvent {
    const event: AiosEvent = {
      id: newId("event"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type,
      source,
      data,
      correlationId
    };
    this.store.getState().events.unshift(event);
    return event;
  }

  private executeAutomation(automation: AutomationRule, event: AiosEvent, actor: RequestActor): unknown {
    if (automation.action === "run_agent") {
      const agentId = String(automation.config.agentId ?? "agent_business_assistant");
      const inputTemplate = String(automation.config.inputTemplate ?? "Handle event {{type}} from {{source}} with data {{data}}");
      const input = this.promptEngine.render(inputTemplate, { ...event, data: event.data });
      const run = this.runAgent(agentId, { input, metadata: { automationId: automation.id, eventId: event.id } }, actor);
      return { automationId: automation.id, action: automation.action, agentRunId: run.id, status: run.status };
    }
    if (automation.action === "rag_query") {
      const queryTemplate = String(automation.config.queryTemplate ?? "{{data.query}}");
      const query = this.promptEngine.render(queryTemplate, { ...event, data: event.data });
      const result = this.ragQuery({ query, knowledgeBaseIds: automation.config.knowledgeBaseIds ?? undefined }, actor);
      return { automationId: automation.id, action: automation.action, answer: result.answer };
    }
    if (automation.action === "call_tool") {
      const tool = this.requireTool(String(automation.config.toolId ?? automation.config.toolKey), actor.tenantId);
      const run = this.toolEngine.run(tool, optionalObject(automation.config.input), actor.tenantId);
      this.store.getState().toolRuns.unshift(run);
      return { automationId: automation.id, action: automation.action, toolRunId: run.id };
    }
    const summary = this.emitInternalEvent("ai.summary.created", "AIOS", { automationId: automation.id, originalEventId: event.id, summary: `${event.type} from ${event.source}` }, actor, event.id);
    return { automationId: automation.id, action: automation.action, eventId: summary.id };
  }
}

function addUsage(a: UsageMetrics, b: UsageMetrics): UsageMetrics {
  return {
    promptTokens: a.promptTokens + b.promptTokens,
    completionTokens: a.completionTokens + b.completionTokens,
    totalTokens: a.totalTokens + b.totalTokens,
    estimatedCost: Number((a.estimatedCost + b.estimatedCost).toFixed(6))
  };
}

function maskSecret(value: string): string {
  if (value.length <= 8) return "****";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function filtersMatch(filters: AutomationRule["filters"], event: AiosEvent): boolean {
  for (const filter of filters ?? []) {
    const actual = getPathValue(event, filter.field);
    if (filter.operator === "exists" && actual === undefined) return false;
    if (filter.operator === "eq" && actual !== filter.value) return false;
    if (filter.operator === "contains" && !String(actual ?? "").toLowerCase().includes(String(filter.value ?? "").toLowerCase())) return false;
    if (filter.operator === "gte" && Number(actual) < Number(filter.value)) return false;
    if (filter.operator === "lte" && Number(actual) > Number(filter.value)) return false;
  }
  return true;
}
