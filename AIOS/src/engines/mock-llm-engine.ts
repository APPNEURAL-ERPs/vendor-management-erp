import { LlmModel, UsageMetrics } from "../core/domain";
import { estimateTokens } from "../core/id";

export interface CompletionRequest {
  model: LlmModel;
  prompt: string;
  context?: string;
  temperature?: number;
  mode?: "chat" | "rag" | "summary";
}

export interface CompletionResult {
  response: string;
  usage: UsageMetrics;
}

export class MockLlmEngine {
  complete(request: CompletionRequest): CompletionResult {
    const prompt = request.prompt.trim();
    const context = request.context?.trim();
    const response = this.composeResponse(request.model, prompt, context, request.mode ?? "chat");
    const promptTokens = estimateTokens(`${prompt}\n${context ?? ""}`);
    const completionTokens = estimateTokens(response);
    return {
      response,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCost: Number(((promptTokens + completionTokens) * 0.000001).toFixed(6))
      }
    };
  }

  private composeResponse(model: LlmModel, prompt: string, context: string | undefined, mode: string): string {
    const question = extractQuestion(prompt);
    if (context) {
      const contextLines = context.split("\n").filter(Boolean).slice(0, 3);
      const summary = contextLines.map((line) => line.replace(/^\[[^\]]+\]\s*/, "")).join(" ").slice(0, 650);
      return `AIOS ${model.name} answer for: "${question}"\n\n${summary}\n\nReasoning: I used the retrieved knowledge context and generated a concise operational answer.\n\nCitations: ${contextLines.map((line) => line.match(/^\[([^\]]+)\]/)?.[1]).filter(Boolean).join(", ")}`;
    }
    if (mode === "summary") {
      return `AIOS ${model.name} summary: ${prompt.slice(0, 700)}`;
    }
    return `AIOS ${model.name} response: ${question || prompt.slice(0, 240)}. This is a deterministic mock LLM completion for development and testing.`;
  }
}

function extractQuestion(prompt: string): string {
  const match = prompt.match(/(?:question|input|user request)\s*:?\s*(.+)$/im);
  return (match?.[1] ?? prompt.split("\n").filter(Boolean).slice(-1)[0] ?? "").trim().slice(0, 240);
}
