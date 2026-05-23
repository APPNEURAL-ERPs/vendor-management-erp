import { ToolAnalyticsBridge } from "./ToolAnalyticsBridge";
import { ToolPermissionBridge } from "./ToolPermissionBridge";
import { ToolRegistry } from "./ToolRegistry";
import { SecurityBridge, ToolExecutionContext, ToolExecutionResult, ToolHandler } from "./types";

export class ToolExecutor {
  constructor(
    private readonly registry: ToolRegistry,
    private readonly security: SecurityBridge | ToolPermissionBridge,
    private readonly analytics: ToolAnalyticsBridge,
    private readonly handlers: Record<string, ToolHandler>
  ) {}

  executeTool(commandName: string, input: Record<string, unknown>, context: ToolExecutionContext): ToolExecutionResult {
    const manifest = this.registry.findByCommand(commandName);
    if (!manifest.enabled) throw new Error(`Tool is disabled: ${manifest.id}`);

    const started = Date.now();
    const startedAt = new Date(started).toISOString();

    this.validateShape("input", manifest.inputs, input);
    const permissionResult = this.security.checkPermission(manifest, context);
    if (permissionResult === false) {
      const missing = manifest.permissions.find((permission) => !(context.permissions ?? []).includes(permission) && !(context.permissions ?? []).includes("*"));
      throw new Error(`Permission denied: ${missing ?? manifest.id}`);
    }

    const handler = this.handlers[manifest.id] ?? this.handlers[commandName] ?? defaultHandler;
    const output = handler(input, context, manifest);
    this.validateShape("output", manifest.outputs, output);

    const completed = Date.now();
    const result: ToolExecutionResult = {
      id: `toolexec_${completed}_${Math.random().toString(36).slice(2, 8)}`,
      toolId: manifest.id,
      commandName,
      input,
      output,
      status: "succeeded",
      actorId: context.userId,
      tenantId: context.tenantId,
      startedAt,
      completedAt: new Date(completed).toISOString(),
      durationMs: completed - started
    };

    this.analytics.emit({
      type: "tool.execution.completed",
      toolId: manifest.id,
      commandName,
      tenantId: context.tenantId,
      actorId: context.userId,
      at: result.completedAt,
      data: { executionId: result.id, status: result.status }
    });
    this.analytics.track({
      toolId: manifest.id,
      commandName,
      tenantId: context.tenantId,
      actorId: context.userId,
      status: result.status,
      durationMs: result.durationMs,
      source: context.source,
      at: result.completedAt
    });
    return result;
  }

  private validateShape(label: "input" | "output", schema: Record<string, unknown>, value: Record<string, unknown>): void {
    for (const [key, expected] of Object.entries(schema)) {
      const optional = typeof expected === "string" && expected.endsWith("?");
      const type = optional ? String(expected).slice(0, -1) : expected;
      if (!(key in value)) {
        if (optional) continue;
        throw new Error(`Missing ${label} field: ${key}`);
      }
      if (type === "string" && typeof value[key] !== "string") throw new Error(`${label} ${key} must be string`);
      if (type === "number" && typeof value[key] !== "number") throw new Error(`${label} ${key} must be number`);
      if (type === "boolean" && typeof value[key] !== "boolean") throw new Error(`${label} ${key} must be boolean`);
      if (type === "object" && (typeof value[key] !== "object" || value[key] === null || Array.isArray(value[key]))) {
        throw new Error(`${label} ${key} must be object`);
      }
      if (type === "array" && !Array.isArray(value[key])) throw new Error(`${label} ${key} must be array`);
    }
  }
}

const defaultHandler: ToolHandler = (input, _context, manifest) => {
  if (manifest.id === "tool.qr.generate") {
    return {
      fileUrl: `tool://qr/${encodeURIComponent(String(input.text ?? "qr"))}.png`,
      format: String(input.format ?? "png")
    };
  }
  return { ok: true, input };
};
