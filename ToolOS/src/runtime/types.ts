export type ToolType = "core" | "api" | "sdk" | "cli" | "worker" | "ui";
export type ToolRiskLevel = "low" | "medium" | "high" | "critical";

export interface ToolManifest {
  id: string;
  name: string;
  packageName: string;
  version: string;
  category: string;
  type: ToolType;
  aiSupport: {
    enabled: boolean;
    toolName?: string;
    description?: string;
  };
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
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
  dependencies: {
    required: string[];
    optional: string[];
  };
  safety: {
    riskLevel: ToolRiskLevel;
    requiresApproval: boolean;
    rules: string[];
  };
  usedBy: string[];
}

export interface ToolExecutionContext {
  tenantId: string;
  userId: string;
  permissions: string[];
  requestId?: string;
  metadata?: Record<string, unknown>;
}

export interface ToolExecutionRecord {
  id: string;
  toolId: string;
  commandName: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: "succeeded" | "failed";
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
  status: "succeeded" | "failed";
  durationMs: number;
  at: string;
}

export type ToolHandler = (input: Record<string, unknown>, context: ToolExecutionContext, manifest: ToolManifest) => Record<string, unknown>;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ToolOSOptions {
  handlers?: Record<string, ToolHandler>;
}
