import { BusinessEvent, RequestActor } from "./domain";
import { newId, nowIso } from "./id";
import { DataStore } from "./datastore";
import { clone } from "./utils";

export class EventBus {
  constructor(private readonly store: DataStore) {}

  publish(actor: RequestActor, type: string, data: Record<string, unknown>, source = "BusinessOS", correlationId?: string): BusinessEvent {
    const now = nowIso();
    const event: BusinessEvent = {
      id: newId("evt"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      status: "active",
      type,
      source,
      correlationId,
      data
    };
    this.store.getState().events.unshift(event);
    this.store.save();
    return clone(event);
  }
}
