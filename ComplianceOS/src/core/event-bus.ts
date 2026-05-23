import { ComplianceEvent, RequestActor } from "./domain";
import { newId, nowIso } from "./id";
import { DataStore } from "./datastore";
import { clone } from "./utils";

export class EventBus {
  constructor(private readonly store: DataStore) {}

  publish(actor: RequestActor, type: string, data: Record<string, unknown>, source = "ComplianceOS"): ComplianceEvent {
    const now = nowIso();
    const event: ComplianceEvent = {
      id: newId("evt"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      type,
      source,
      actorId: actor.userId,
      role: actor.role,
      data
    };
    this.store.getState().events.unshift(event);
    this.store.save();
    return clone(event);
  }
}
