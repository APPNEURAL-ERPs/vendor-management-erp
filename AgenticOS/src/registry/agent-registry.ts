import { AgentDefinition, RequestActor } from "../core/domain";
import { badRequest, conflict, notFound } from "../core/errors";
import { newId, nowIso } from "../core/id";
import { clone, ensureNumber, ensureObject, ensureString, normalizeStringArray, optionalString } from "../core/utils";
import { DataStore } from "../core/datastore";

export class AgentRegistry {
  constructor(private readonly store: DataStore) {}

  list(actor: RequestActor): AgentDefinition[] {
    return clone(this.store.getState().agents.filter((agent) => agent.tenantId === actor.tenantId && agent.status !== "archived"));
  }

  get(actor: RequestActor, id: string): AgentDefinition {
    const agent = this.store.getState().agents.find((item) => item.tenantId === actor.tenantId && item.status !== "archived" && item.id === id);
    if (!agent) notFound("Agent not found");
    return clone(agent);
  }

  register(actor: RequestActor, input: Partial<AgentDefinition>): AgentDefinition {
    const state = this.store.getState();
    const id = normalizeAgentId(input.id ?? input.name);
    if (state.agents.some((agent) => agent.tenantId === actor.tenantId && agent.id === id && agent.status !== "archived")) {
      conflict("Agent already exists");
    }
    const now = nowIso();
    const memory = ensureObject(input.memory, "memory");
    const approval = ensureObject(input.humanApproval, "humanApproval");
    const agent: AgentDefinition = {
      id,
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name: ensureString(input.name, "name"),
      description: optionalString(input.description),
      instructions: ensureString(input.instructions, "instructions"),
      model: optionalString(input.model) ?? "default",
      tools: normalizeStringArray(input.tools, "tools"),
      commands: normalizeStringArray(input.commands, "commands"),
      memory: {
        enabled: memory.enabled !== false,
        scopes: normalizeStringArray(memory.scopes ?? ["run"], "memory.scopes") as AgentDefinition["memory"]["scopes"]
      },
      permissions: normalizeStringArray(input.permissions, "permissions"),
      guardrails: normalizeStringArray(input.guardrails, "guardrails"),
      humanApproval: {
        requiredFor: normalizeStringArray(approval.requiredFor, "humanApproval.requiredFor")
      },
      maxCostPerRun: ensureNumber(input.maxCostPerRun, "maxCostPerRun", 1),
      maxSteps: Math.max(1, ensureNumber(input.maxSteps, "maxSteps", 12)),
      status: ensureAgentStatus(input.status ?? "active"),
      ownerTeam: optionalString(input.ownerTeam),
      tags: normalizeStringArray(input.tags, "tags"),
      metadata: ensureObject(input.metadata, "metadata"),
      updatedBy: actor.userId
    };
    state.agents.unshift(agent);
    this.store.save();
    return clone(agent);
  }
}

export function normalizeAgentId(value: unknown): string {
  return ensureString(value, "id").toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/-+/g, "-");
}

function ensureAgentStatus(value: unknown): AgentDefinition["status"] {
  const status = String(value) as AgentDefinition["status"];
  if (!["draft", "active", "disabled", "archived"].includes(status)) badRequest("Invalid agent status");
  return status;
}
