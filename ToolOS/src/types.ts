export type ToolType =
  | "core"
  | "api"
  | "sdk"
  | "cli"
  | "worker"
  | "ui"
  | "deterministic"
  | "ai"
  | "hybrid"
  | "external-api"
  | "generator"
  | "validator"
  | "integration"
  | "manager";
export type ToolRiskLevel = "low" | "medium" | "high" | "critical";
export type ToolExecutionStatus = "succeeded" | "failed";

export interface ToolAIConfig {
  enabled: boolean;
  toolName?: string;
  description?: string;
}

export interface ToolManifest {
  id: string;
  name: string;
  packageName: string;
  version: string;
  category: string;
  type: ToolType;
  ai: ToolAIConfig;
  aiSupport?: ToolAIConfig;
  commands: string[];
  permissions: string[];
  events: {
    publishes: string[];
    subscribes: string[];
  };
  api: {
    route: string;
  };
  sdk: {
    namespace: string;
  };
  cli: {
    namespace: string;
  };
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  dependencies: {
    required: string[];
    optional: string[];
  };
  usedBy: string[];
  safety: {
    riskLevel: ToolRiskLevel;
    requiresApproval: boolean;
    rules: string[];
  };
  marketplace?: ToolMarketplaceMetadata;
  enabled: boolean;
  installed: boolean;
}

export type ToolManifestInput = Omit<ToolManifest, "ai" | "inputs" | "outputs" | "enabled" | "installed"> & {
  ai?: ToolAIConfig;
  aiSupport?: ToolAIConfig;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  enabled?: boolean;
  installed?: boolean;
};

export interface ToolMarketplaceMetadata {
  summary?: string;
  publisher?: string;
  license?: string;
  tags?: string[];
  homepage?: string;
  repository?: string;
}

export interface ToolExecutionContext {
  tenantId: string;
  userId: string;
  permissions?: string[];
  requestId?: string;
  source?: "sdk" | "cli" | "api" | "commandos" | "aios" | "platform";
  metadata?: Record<string, unknown>;
}

export interface ToolExecutionResult {
  id: string;
  toolId: string;
  commandName: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: ToolExecutionStatus;
  actorId: string;
  tenantId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

export interface ToolEvent {
  type: string;
  toolId: string;
  commandName?: string;
  tenantId: string;
  actorId: string;
  at: string;
  data: Record<string, unknown>;
}

export interface ToolAnalyticsMetric {
  toolId: string;
  commandName: string;
  tenantId: string;
  actorId: string;
  status: ToolExecutionStatus;
  durationMs: number;
  source?: string;
  at: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  manifest?: ToolManifest;
}

export type ToolHandler = (
  input: Record<string, unknown>,
  context: ToolExecutionContext,
  manifest: ToolManifest
) => Record<string, unknown>;

export interface SecurityBridge {
  checkPermission(manifest: ToolManifest, context: ToolExecutionContext): boolean | void;
}

export interface AnalyticsBridge {
  emit(event: ToolEvent): void;
  track(metric: ToolAnalyticsMetric): void;
}

export interface ToolOSOptions {
  handlers?: Record<string, ToolHandler>;
  security?: SecurityBridge;
  analytics?: AnalyticsBridge;
  marketplace?: Record<string, ToolManifestInput>;
}
