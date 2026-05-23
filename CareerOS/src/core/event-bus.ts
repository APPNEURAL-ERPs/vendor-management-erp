import { CareerEvent, RequestActor } from "./domain";
import { newId, nowIso } from "./id";
import { DataStore } from "./datastore";
import { clone } from "./utils";

export class EventBus {
  constructor(private readonly store: DataStore) {}

  publish(actor: RequestActor, type: string, data?: Record<string, unknown>): CareerEvent {
    const now = nowIso();
    const event: CareerEvent = {
      id: newId("evt"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      type,
      entityType: undefined,
      entityId: undefined,
      actorId: actor.userId,
      role: actor.role,
      data: data || {}
    };
    this.store.getState().events.unshift(event);
    this.store.save();
    return clone(event);
  }
}
