import { AgentDefinition, AgentPlan, AgentStep, RequestActor } from "../core/domain";
import { forbidden } from "../core/errors";
import { hasPermission } from "../core/security";

export class GuardrailEngine {
  validateInput(input: Record<string, unknown>): void {
    const text = JSON.stringify(input).toLowerCase();
    if (text.includes("ignore previous instructions") || text.includes("exfiltrate")) {
      forbidden("Input blocked by prompt-injection guardrail");
    }
  }

  validatePlan(agent: AgentDefinition, plan: AgentPlan, actor: RequestActor): AgentPlan {
    const issues: string[] = [];
    for (const step of plan.steps) {
      if (step.type === "command") this.validateCommandStep(agent, step, actor, issues);
      if (step.type === "tool") this.validateToolStep(agent, step, actor, issues);
    }
    plan.validationIssues = issues;
    plan.status = issues.length ? "blocked" : "validated";
    if (issues.length) forbidden(`Plan blocked: ${issues.join("; ")}`);
    return plan;
  }

  validateOutput(output: Record<string, unknown>): void {
    const text = JSON.stringify(output).toLowerCase();
    if (text.includes("secret_access_key")) forbidden("Output blocked by sensitive data guardrail");
  }

  private validateCommandStep(agent: AgentDefinition, step: AgentStep, actor: RequestActor, issues: string[]): void {
    const command = step.command ?? "";
    if (!agent.commands.includes(command)) issues.push(`Agent cannot execute command ${command}`);
    const matchingPermission = agent.permissions.find((permission) => commandToPermission(command, permission));
    if (!matchingPermission) issues.push(`Agent lacks mapped permission for command ${command}`);
    if (matchingPermission && !hasPermission(actor.role, matchingPermission)) issues.push(`User lacks permission ${matchingPermission}`);
  }

  private validateToolStep(agent: AgentDefinition, step: AgentStep, actor: RequestActor, issues: string[]): void {
    const tool = step.tool ?? "";
    if (!agent.tools.includes(tool)) issues.push(`Agent cannot use tool ${tool}`);
    const normalized = tool.replace(/^tool\./, "tools.");
    if (!agent.permissions.includes(normalized)) issues.push(`Agent lacks permission ${normalized}`);
    if (!hasPermission(actor.role, normalized) && !hasPermission(actor.role, "agentic.tools.use")) issues.push(`User lacks tool permission ${normalized}`);
  }
}

function commandToPermission(command: string, permission: string): boolean {
  const parts = command.split(".");
  if (parts.length < 3) return permission === command;
  const [domain, resource, action] = parts;
  const plural = resource.endsWith("s") ? resource : `${resource}s`;
  return permission === command || permission === `${domain}.${plural}.${action}` || permission === `${domain}.${resource}.${action}`;
}
