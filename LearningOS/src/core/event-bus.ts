import { LearningEvent, RequestActor } from "./domain";
import { DataStore } from "./datastore";
import { newId, nowIso } from "./id";

export class EventBus {
  constructor(private readonly store: DataStore) {}

  emit(actor: RequestActor, type: string, data: Record<string, unknown>): LearningEvent {
    const now = nowIso();
    const event: LearningEvent = { id: newId("evt"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, type, source: "LearningOS", actorId: actor.userId, data };
    this.store.getState().events.unshift(event);
    this.store.save();
    return event;
  }
}
