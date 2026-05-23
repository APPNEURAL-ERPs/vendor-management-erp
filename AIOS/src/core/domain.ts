export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "ai_admin" | "ai_engineer" | "agent_operator" | "knowledge_manager" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";

export interface RequestActor {
  tenantId: TenantId;
  userId: UUID;
  role: Role;
}

export interface BaseEntity {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface ModelProvider extends BaseEntity {
  key: string;
  name: string;
  type: "mock" | "openai" | "anthropic" | "local" | "custom";
  status: EntityStatus;
  baseUrl?: string;
  maskedApiKey?: string;
  config: Record<string, unknown>;
}

export interface LlmModel extends BaseEntity {
  key: string;
  providerId: UUID;
  name: string;
  family: string;
  contextWindow: number;
  maxOutputTokens: number;
  temperatureDefault: number;
  status: EntityStatus;
  capabilities: Array<"chat" | "json" | "tool_calling" | "vision" | "embedding">;
}

export interface PromptVersion {
  version: number;
  template: string;
  variables: string[];
  createdAt: ISODate;
  createdBy: UUID;
  notes?: string;
}

export interface PromptTemplate extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  tags: string[];
  activeVersion: number;
  versions: PromptVersion[];
}

export interface KnowledgeBase extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  tags: string[];
  embeddingModelId?: UUID;
  chunkSize: number;
  chunkOverlap: number;
}

export interface KnowledgeDocument extends BaseEntity {
  knowledgeBaseId: UUID;
  title: string;
  sourceType: "text" | "url" | "file" | "api";
  sourceUri?: string;
  status: "indexed" | "processing" | "failed" | "archived";
  content: string;
  metadata: Record<string, unknown>;
}

export interface KnowledgeChunk extends BaseEntity {
  knowledgeBaseId: UUID;
  documentId: UUID;
  chunkIndex: number;
  text: string;
  tokenEstimate: number;
  keywords: string[];
  metadata: Record<string, unknown>;
}

export interface SearchHit {
  chunkId: UUID;
  documentId: UUID;
  knowledgeBaseId: UUID;
  title: string;
  text: string;
  score: number;
  keywords: string[];
  citation: string;
}

export interface LlmCompletion extends BaseEntity {
  modelId: UUID;
  prompt: string;
  response: string;
  status: "completed" | "blocked" | "failed";
  usage: UsageMetrics;
  metadata: Record<string, unknown>;
}

export interface UsageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface AITool extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "builtin" | "http" | "os_connector";
  status: EntityStatus;
  inputSchema: Record<string, unknown>;
  config: Record<string, unknown>;
}

export interface ToolRun extends BaseEntity {
  toolId: UUID;
  agentRunId?: UUID;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  status: "completed" | "failed";
  latencyMs: number;
}

export interface Guardrail extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  bannedTerms: string[];
  requiredTerms: string[];
  requireCitations: boolean;
  maxInputLength?: number;
  maxOutputLength?: number;
}

export interface GuardrailScanResult {
  allowed: boolean;
  violations: Array<{ guardrailId: UUID; guardrailKey: string; reason: string }>;
}

export interface AgentDefinition extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  modelId: UUID;
  promptId: UUID;
  knowledgeBaseIds: UUID[];
  toolIds: UUID[];
  guardrailIds: UUID[];
  memoryEnabled: boolean;
  variables: Record<string, unknown>;
}

export interface AgentRun extends BaseEntity {
  agentId: UUID;
  conversationId?: UUID;
  input: string;
  renderedPrompt: string;
  retrievedHits: SearchHit[];
  toolRunIds: UUID[];
  output: string;
  status: "completed" | "blocked" | "failed";
  usage: UsageMetrics;
  metadata: Record<string, unknown>;
}

export interface Conversation extends BaseEntity {
  agentId?: UUID;
  userId: UUID;
  title: string;
  status: "open" | "closed" | "archived";
  summary?: string;
}

export interface ConversationMessage extends BaseEntity {
  conversationId: UUID;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  agentRunId?: UUID;
  metadata: Record<string, unknown>;
}

export interface AutomationRule extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  triggerEvent: string;
  filters: Array<{ field: string; operator: "eq" | "contains" | "gte" | "lte" | "exists"; value?: unknown }>;
  action: "run_agent" | "rag_query" | "create_summary_event" | "call_tool";
  config: Record<string, unknown>;
}

export interface EvaluationCase {
  id: UUID;
  name: string;
  input: string;
  expectedContains: string[];
  metadata: Record<string, unknown>;
}

export interface EvaluationSuite extends BaseEntity {
  key: string;
  name: string;
  status: EntityStatus;
  agentId: UUID;
  cases: EvaluationCase[];
}

export interface EvaluationRun extends BaseEntity {
  suiteId: UUID;
  agentId: UUID;
  status: "completed" | "failed";
  totalCases: number;
  passedCases: number;
  results: Array<{ caseId: UUID; passed: boolean; output: string; missing: string[] }>;
}

export interface AiosEvent extends BaseEntity {
  type: string;
  source: string;
  data: Record<string, unknown>;
  correlationId?: UUID;
}

export interface AuditLog extends BaseEntity {
  actorId: UUID;
  role: Role;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
}

export interface AiosOverview {
  providers: number;
  models: number;
  prompts: { total: number; active: number };
  knowledge: { bases: number; documents: number; chunks: number };
  agents: { total: number; active: number };
  conversations: { open: number; messages: number };
  runs: { total: number; completed: number; blocked: number; failed: number };
  tools: { total: number; active: number; runs: number };
  guardrails: { total: number; active: number };
  usage: UsageMetrics;
}

export interface AiosState {
  providers: ModelProvider[];
  models: LlmModel[];
  prompts: PromptTemplate[];
  knowledgeBases: KnowledgeBase[];
  documents: KnowledgeDocument[];
  chunks: KnowledgeChunk[];
  completions: LlmCompletion[];
  tools: AITool[];
  toolRuns: ToolRun[];
  guardrails: Guardrail[];
  agents: AgentDefinition[];
  agentRuns: AgentRun[];
  conversations: Conversation[];
  messages: ConversationMessage[];
  automations: AutomationRule[];
  evaluationSuites: EvaluationSuite[];
  evaluationRuns: EvaluationRun[];
  events: AiosEvent[];
  auditLogs: AuditLog[];
}
