import { ToolAnalyticsBridge } from "./ToolAnalyticsBridge";
import { ToolPermissionBridge } from "./ToolPermissionBridge";
import { ToolRegistry } from "./ToolRegistry";
import { ToolExecutionContext, ToolExecutionRecord, ToolHandler } from "./types";

export class ToolExecutor {
  constructor(
    private readonly registry: ToolRegistry,
    private readonly permissions: ToolPermissionBridge,
    private readonly analytics: ToolAnalyticsBridge,
    private readonly handlers: Record<string, ToolHandler>
  ) {}

  execute(commandName: string, input: Record<string, unknown>, context: ToolExecutionContext): ToolExecutionRecord {
    const manifest = this.registry.findByCommand(commandName);
    const started = Date.now();
    const startedAt = new Date(started).toISOString();
    this.validateInput(manifest.inputSchema, input);
    this.permissions.check(manifest, context);

    const handler = this.handlers[manifest.id] ?? this.defaultHandler;
    let record: ToolExecutionRecord;
    try {
      const output = handler(input, context, manifest);
      this.validateOutput(manifest.outputSchema, output);
      const completed = Date.now();
      record = {
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
    } catch (error) {
      const completed = Date.now();
      record = {
        id: `toolexec_${completed}_${Math.random().toString(36).slice(2, 8)}`,
        toolId: manifest.id,
        commandName,
        input,
        output: { error: error instanceof Error ? error.message : "Tool failed" },
        status: "failed",
        actorId: context.userId,
        tenantId: context.tenantId,
        startedAt,
        completedAt: new Date(completed).toISOString(),
        durationMs: completed - started
      };
    }

    this.analytics.publish({
      type: record.status === "succeeded" ? "tool.execution.completed" : "tool.execution.failed",
      toolId: manifest.id,
      commandName,
      tenantId: context.tenantId,
      actorId: context.userId,
      at: record.completedAt,
      data: { executionId: record.id, status: record.status }
    });
    this.analytics.track(record);
    return record;
  }

  private defaultHandler(input: Record<string, unknown>, _context: ToolExecutionContext, manifest: any): Record<string, unknown> {
    if (manifest.id === "tool.qr.generate") {
      return {
        fileUrl: `tool://qr/${encodeURIComponent(String(input.text ?? "qr"))}.png`,
        format: input.format ?? "png"
      };
    }
    return { ok: true, input };
  }

  private validateInput(schema: Record<string, unknown>, input: Record<string, unknown>): void {
    for (const [key, expected] of Object.entries(schema)) {
      if (typeof expected === "string" && expected.endsWith("?")) continue;
      if (!(key in input)) throw new Error(`Missing input field: ${key}`);
      if (expected === "string" && typeof input[key] !== "string") throw new Error(`Input ${key} must be string`);
      if (expected === "number" && typeof input[key] !== "number") throw new Error(`Input ${key} must be number`);
      if (expected === "boolean" && typeof input[key] !== "boolean") throw new Error(`Input ${key} must be boolean`);
    }
  }

  private validateOutput(schema: Record<string, unknown>, output: Record<string, unknown>): void {
    for (const [key, expected] of Object.entries(schema)) {
      if (typeof expected === "string" && expected.endsWith("?")) continue;
      if (!(key in output)) throw new Error(`Missing output field: ${key}`);
      if (expected === "string" && typeof output[key] !== "string") throw new Error(`Output ${key} must be string`);
      if (expected === "number" && typeof output[key] !== "number") throw new Error(`Output ${key} must be number`);
      if (expected === "boolean" && typeof output[key] !== "boolean") throw new Error(`Output ${key} must be boolean`);
    }
  }
}
