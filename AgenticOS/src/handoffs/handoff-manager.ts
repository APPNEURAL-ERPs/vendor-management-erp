import { AgentHandoff, RequestActor } from "../core/domain";
import { newId, nowIso } from "../core/id";
import { clone, ensureString } from "../core/utils";
import { DataStore } from "../core/datastore";

export class HandoffManager {
  constructor(private readonly store: DataStore) {}

  request(actor: RequestActor, runId: string, fromAgentId: string, toAgentId: string, reason: unknown): AgentHandoff {
    const now = nowIso();
    const handoff: AgentHandoff = {
      id: newId("handoff"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      runId,
      fromAgentId,
      toAgentId,
      reason: ensureString(reason, "reason"),
      status: "requested"
    };
    this.store.getState().handoffs.unshift(handoff);
    this.store.save();
    return clone(handoff);
  }
}
