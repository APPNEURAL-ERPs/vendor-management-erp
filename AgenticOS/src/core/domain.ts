export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "agentic_admin" | "agent_operator" | "agent_developer" | "approval_manager" | "auditor" | "viewer";
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

export interface Agent extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  version: number;
  agentType: "builder" | "assistant" | "researcher" | "analyst" | "executor" | "orchestrator" | "custom";
  capabilities: string[];
  promptTemplate: string;
  variables: Record<string, unknown>;
  modelId?: string;
  knowledgeBaseIds: UUID[];
  toolIds: UUID[];
  guardrailIds: UUID[];
  memoryEnabled: boolean;
  workflowEnabled: boolean;
  outputFormat: "text" | "json" | "markdown" | "structured";
  metadata: Record<string, unknown>;
  createdBy: UUID;
}

export interface AgentTemplate extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  category: "career" | "sales" | "support" | "research" | "code_review" | "legal" | "finance" | "marketing" | "admin" | "custom";
  template: string;
  variables: string[];
  defaultCapabilities: string[];
  requiredTools: UUID[];
  recommendedGuardrails: UUID[];
  usageExamples: string[];
  tags: string[];
  version: number;
  createdBy: UUID;
}

export interface AgentRun extends BaseEntity {
  agentId: UUID;
  templateId?: UUID;
  workflowId?: UUID;
  status: "queued" | "running" | "waiting_approval" | "paused" | "completed" | "failed" | "cancelled" | "retrying" | "timed_out";
  input: Record<string, unknown>;
  steps: AgentRunStep[];
  output?: string;
  error?: string;
  guardrailResults: GuardrailResult[];
  toolRunIds: UUID[];
  memoryIds: UUID[];
  usage: RunUsageMetrics;
  startedAt?: ISODate;
  completedAt?: ISODate;
  pausedAt?: ISODate;
  resumedAt?: ISODate;
  approvalId?: UUID;
  metadata: Record<string, unknown>;
}

export interface AgentRunStep {
  stepId: string;
  stepName: string;
  stepOrder: number;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  input: Record<string, unknown>;
  output?: unknown;
  toolRunIds: UUID[];
  startedAt?: ISODate;
  completedAt?: ISODate;
  error?: string;
}

export interface AgentWorkflow extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  agentId: UUID;
  steps: WorkflowStep[];
  triggerType: "manual" | "scheduled" | "event" | "api";
  triggerConfig: Record<string, unknown>;
  conditions: WorkflowCondition[];
  errorHandling: WorkflowErrorHandling;
  timeoutSeconds: number;
  retryPolicy: RetryPolicy;
  version: number;
  createdBy: UUID;
}

export interface WorkflowStep {
  stepId: string;
  name: string;
  order: number;
  type: "prompt" | "tool_call" | "condition" | "approval" | "delay" | "transform" | "branch" | "loop";
  config: Record<string, unknown>;
  nextStepOnSuccess?: string;
  nextStepOnFailure?: string;
  toolId?: UUID;
  guardrailIds?: UUID[];
}

export interface WorkflowCondition {
  field: string;
  operator: "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "contains" | "exists" | "not_exists";
  value?: unknown;
  action: "continue" | "skip" | "fail" | "branch";
  targetStepId?: string;
}

export interface WorkflowErrorHandling {
  onError: "retry" | "skip" | "fail" | "pause";
  maxRetries: number;
  fallbackStepId?: string;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

export interface ToolRegistryEntry extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "builtin" | "http" | "script" | "os_connector" | "aios_tool";
  status: EntityStatus;
  category: "data" | "communication" | "computation" | "storage" | "integration" | "security" | "custom";
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  config: Record<string, unknown>;
  rateLimit?: { requestsPerMinute: number; requestsPerHour: number };
  timeoutMs: number;
  requiresApproval: boolean;
  capability: string;
  version: string;
  metadata: Record<string, unknown>;
}

export interface ToolRun extends BaseEntity {
  toolId: UUID;
  agentRunId?: UUID;
  workflowId?: UUID;
  stepId?: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  status: "pending" | "running" | "completed" | "failed" | "approved" | "rejected";
  latencyMs: number;
  error?: string;
  approvedBy?: UUID;
  approvedAt?: ISODate;
}

export interface Guardrail extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  type: "input" | "output" | "both" | "tool_call" | "approval_gate";
  bannedTerms: string[];
  requiredTerms: string[];
  maxInputLength?: number;
  maxOutputLength?: number;
  requireCitations: boolean;
  allowCustomData: boolean;
  sensitiveDataPatterns: string[];
  actionOnViolation: "block" | "warn" | "redact" | "approve_with_flag";
  severityLevel: "low" | "medium" | "high" | "critical";
  metadata: Record<string, unknown>;
}

export interface GuardrailResult {
  guardrailId: UUID;
  guardrailKey: string;
  passed: boolean;
  violations: Array<{ term: string; position: number; action: string }>;
  scannedAt: ISODate;
}

export interface AgentMemory extends BaseEntity {
  agentId: UUID;
  memoryType: "short_term" | "long_term" | "user_preference" | "project" | "task" | "knowledge";
  content: string;
  embedding?: number[];
  importance: number;
  expiresAt?: ISODate;
  source: "user" | "agent" | "tool" | "workflow" | "system";
  linkedEntityIds: UUID[];
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface ApprovalRequest extends BaseEntity {
  agentRunId: UUID;
  stepId?: string;
  toolRunId?: UUID;
  type: "tool_execution" | "data_access" | "external_action" | "content_generation" | "deletion";
  status: "pending" | "approved" | "rejected" | "expired";
  requestorId: UUID;
  approverId?: UUID;
  requestedAt: ISODate;
  respondedAt?: ISODate;
  summary: string;
  details: Record<string, unknown>;
  preview?: string;
  expiresAt?: ISODate;
  comments?: string;
  priority: "low" | "normal" | "high" | "urgent";
}

export interface EvaluationSuite extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  agentId: UUID;
  version: number;
  cases: EvaluationCase[];
  tags: string[];
  createdBy: UUID;
}

export interface EvaluationCase {
  id: UUID;
  name: string;
  input: Record<string, unknown>;
  expectedOutput?: string;
  expectedContains: string[];
  forbiddenTerms: string[];
  evaluationCriteria: EvaluationCriteria;
  metadata: Record<string, unknown>;
}

export interface EvaluationCriteria {
  correctness: number;
  relevance: number;
  safety: number;
  formatCompliance: number;
  toolUsageAccuracy: number;
}

export interface EvaluationRun extends BaseEntity {
  suiteId: UUID;
  agentId: UUID;
  agentRunId?: UUID;
  status: "running" | "completed" | "failed";
  totalCases: number;
  passedCases: number;
  failedCases: number;
  results: EvaluationResult[];
  startedAt: ISODate;
  completedAt?: ISODate;
  summary: EvaluationSummary;
}

export interface EvaluationResult {
  caseId: UUID;
  passed: boolean;
  output: string;
  expectedContains: string[];
  missingTerms: string[];
  forbiddenTermsFound: string[];
  scores: EvaluationCriteria;
  feedback: string;
}

export interface EvaluationSummary {
  averageCorrectness: number;
  averageRelevance: number;
  averageSafety: number;
  averageFormatCompliance: number;
  overallPassRate: number;
}

export interface RunUsageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  toolCalls: number;
  guardrailScans: number;
  memoryOperations: number;
  estimatedCost: number;
  latencyMs: number;
}

export interface AgentEvent extends BaseEntity {
  type: string;
  source: string;
  agentId?: UUID;
  agentRunId?: UUID;
  workflowId?: UUID;
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
  metadata: Record<string, unknown>;
}

export interface AgenticState {
  agents: Agent[];
  agentTemplates: AgentTemplate[];
  agentRuns: AgentRun[];
  agentWorkflows: AgentWorkflow[];
  toolRegistry: ToolRegistryEntry[];
  toolRuns: ToolRun[];
  guardrails: Guardrail[];
  agentMemories: AgentMemory[];
  approvalRequests: ApprovalRequest[];
  evaluationSuites: EvaluationSuite[];
  evaluationRuns: EvaluationRun[];
  events: AgentEvent[];
  auditLogs: AuditLog[];
}

export interface AgenticOverview {
  agents: { total: number; active: number; byType: Record<string, number> };
  templates: { total: number; active: number };
  runs: { total: number; queued: number; running: number; completed: number; failed: number; awaiting_approval: number };
  workflows: { total: number; active: number };
  tools: { total: number; active: number; runs: number };
  guardrails: { total: number; active: number };
  approvals: { pending: number; approved: number; rejected: number };
  memory: { total: number; byType: Record<string, number> };
  evaluations: { suites: number; runs: number; averagePassRate: number };
  usage: RunUsageMetrics;
}
