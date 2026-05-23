import { AITool, ToolRun } from "../core/domain";
import { estimateTokens, newId, nowIso } from "../core/id";

export class ToolEngine {
  run(tool: AITool, input: Record<string, unknown>, tenantId: string, agentRunId?: string): ToolRun {
    const started = Date.now();
    let output: Record<string, unknown>;
    let status: ToolRun["status"] = "completed";

    try {
      if (tool.type === "builtin" && tool.key === "calculator") {
        output = runCalculator(input);
      } else if (tool.type === "builtin" && tool.key === "summarizer") {
        output = runSummarizer(input);
      } else if (tool.type === "builtin" && tool.key === "task_creator") {
        output = runTaskCreator(input);
      } else if (tool.type === "builtin" && tool.key === "os_event_emitter") {
        output = { emitted: true, eventType: String(input.eventType ?? "aios.tool.event"), data: input.data ?? {} };
      } else {
        output = {
          simulated: true,
          toolType: tool.type,
          message: `Tool '${tool.key}' executed in development simulation mode`,
          input
        };
      }
    } catch (error) {
      status = "failed";
      output = { error: error instanceof Error ? error.message : "Tool failed" };
    }

    return {
      id: newId("toolrun"),
      tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      toolId: tool.id,
      agentRunId,
      input,
      output,
      status,
      latencyMs: Date.now() - started
    };
  }
}

function runCalculator(input: Record<string, unknown>): Record<string, unknown> {
  const expression = String(input.expression ?? "");
  if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
    throw new Error("Calculator allows only arithmetic expressions");
  }
  // Development-only safe-ish arithmetic evaluator: characters are restricted above.
  const result = Function(`"use strict"; return (${expression});`)();
  return { expression, result, tokenEstimate: estimateTokens(expression) };
}

function runSummarizer(input: Record<string, unknown>): Record<string, unknown> {
  const text = String(input.text ?? "").replace(/\s+/g, " ").trim();
  const maxLength = Number(input.maxLength ?? 280);
  return { summary: text.slice(0, maxLength), originalLength: text.length };
}

function runTaskCreator(input: Record<string, unknown>): Record<string, unknown> {
  return {
    taskId: newId("task"),
    title: String(input.title ?? "AIOS task"),
    assigneeId: input.assigneeId ? String(input.assigneeId) : undefined,
    status: "open",
    source: "AIOS"
  };
}
