import { AgentDefinition, AgentMemory, MemoryScope, RequestActor } from "../core/domain";
import { badRequest } from "../core/errors";
import { newId, nowIso } from "../core/id";
import { clone, ensureObject, ensureString, optionalString } from "../core/utils";
import { DataStore } from "../core/datastore";

export class MemoryManager {
  constructor(private readonly store: DataStore) {}

  write(actor: RequestActor, agent: AgentDefinition, input: Partial<AgentMemory>): AgentMemory {
    if (!agent.memory.enabled) badRequest("Agent memory is disabled");
    const scope = ensureScope(input.scope ?? "run");
    if (!agent.memory.scopes.includes(scope)) badRequest(`Agent cannot write ${scope} memory`);
    const now = nowIso();
    const memory: AgentMemory = {
      id: newId("mem"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      agentId: agent.id,
      runId: optionalString(input.runId),
      scope,
      scopeId: optionalString(input.scopeId),
      key: ensureString(input.key, "key"),
      value: ensureObject(input.value, "value"),
      sensitivity: ensureSensitivity(input.sensitivity ?? "internal")
    };
    this.store.getState().memories.unshift(memory);
    this.store.save();
    return clone(memory);
  }

  search(actor: RequestActor, query: string): AgentMemory[] {
    const needle = query.toLowerCase();
    return clone(this.store.getState().memories.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      return [item.key, JSON.stringify(item.value), item.scope].join(" ").toLowerCase().includes(needle);
    }));
  }
}

function ensureScope(value: unknown): MemoryScope {
  const scope = String(value) as MemoryScope;
  if (!["run", "session", "user", "workspace", "tenant", "agent"].includes(scope)) badRequest("Invalid memory scope");
  return scope;
}

function ensureSensitivity(value: unknown): AgentMemory["sensitivity"] {
  const sensitivity = String(value) as AgentMemory["sensitivity"];
  if (!["public", "internal", "confidential", "restricted"].includes(sensitivity)) badRequest("Invalid memory sensitivity");
  return sensitivity;
}
