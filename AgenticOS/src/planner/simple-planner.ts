import { AgentDefinition, AgentPlan, AgentRun, AgentStep } from "../core/domain";
import { badRequest } from "../core/errors";
import { newId, nowIso } from "../core/id";
import { ensureObject, ensureString } from "../core/utils";

export interface PlannerContext {
  tenantId: string;
  workspaceId?: string;
  userId: string;
}

export class SimplePlanner {
  createPlan(agent: AgentDefinition, run: AgentRun, input: Record<string, unknown>, context: PlannerContext): AgentPlan {
    const now = nowIso();
    const goal = ensureString(input.task ?? input.goal ?? "Run agent task", "task");
    const explicitSteps = Array.isArray(input.steps) ? input.steps : undefined;
    const steps = explicitSteps ? explicitSteps.map((step, index) => this.normalizeStep(step, index)) : this.inferSteps(agent, goal, input);
    if (steps.length > agent.maxSteps) badRequest(`Plan exceeds maxSteps ${agent.maxSteps}`);
    return {
      id: newId("plan"),
      tenantId: context.tenantId,
      createdAt: now,
      updatedAt: now,
      runId: run.id,
      agentId: agent.id,
      goal,
      steps,
      status: "draft",
      validationIssues: []
    };
  }

  private inferSteps(agent: AgentDefinition, goal: string, input: Record<string, unknown>): AgentStep[] {
    const lower = goal.toLowerCase();
    const steps: AgentStep[] = [];
    steps.push({ id: newId("step"), type: "think", name: "Understand goal", input: { goal }, status: "pending" });

    if (lower.includes("invoice") && agent.commands.includes("finance.invoice.create")) {
      steps.push({
        id: newId("step"),
        type: "command",
        name: "Create invoice",
        command: "finance.invoice.create",
        input: {
          client: input.client ?? "Acme",
          amount: input.amount ?? 50000,
          currency: input.currency ?? "INR"
        },
        status: "pending"
      });
    }
    if ((lower.includes("qr") || lower.includes("payment")) && agent.tools.includes("tool.qr.generate")) {
      steps.push({ id: newId("step"), type: "tool", name: "Generate payment QR", tool: "tool.qr.generate", input: { text: "{{invoice.paymentLink}}" }, status: "pending" });
    }
    if ((lower.includes("pdf") || lower.includes("invoice")) && agent.tools.includes("tool.pdf.generate")) {
      steps.push({ id: newId("step"), type: "tool", name: "Generate PDF", tool: "tool.pdf.generate", input: { template: "invoice" }, status: "pending" });
    }
    if ((lower.includes("send") || lower.includes("email")) && agent.commands.includes("finance.invoice.send")) {
      steps.push({ id: newId("step"), type: "command", name: "Send invoice", command: "finance.invoice.send", input: { channel: "email" }, status: "pending" });
    }

    if (steps.length === 1) {
      steps.push({ id: newId("step"), type: "response", name: "Respond with plan summary", input: { goal }, status: "pending" });
    } else {
      steps.push({ id: newId("step"), type: "response", name: "Return final result", input: { goal }, status: "pending" });
    }
    return steps;
  }

  private normalizeStep(value: unknown, index: number): AgentStep {
    const step = ensureObject(value, "step");
    const type = ensureString(step.type, "step.type") as AgentStep["type"];
    if (!["think", "tool", "command", "handoff", "approval", "response"].includes(type)) badRequest("Invalid step type");
    return {
      id: typeof step.id === "string" ? step.id : newId("step"),
      type,
      name: ensureString(step.name ?? `Step ${index + 1}`, "step.name"),
      command: typeof step.command === "string" ? step.command : undefined,
      tool: typeof step.tool === "string" ? step.tool : undefined,
      handoffAgentId: typeof step.handoffAgentId === "string" ? step.handoffAgentId : undefined,
      input: step.input,
      output: step.output,
      status: "pending"
    };
  }
}
