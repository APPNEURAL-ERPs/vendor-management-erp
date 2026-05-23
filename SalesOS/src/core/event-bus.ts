import { DataStore } from "./datastore";
import { RequestActor, SalesEvent } from "./domain";
import { newId, nowIso } from "./id";
export class EventBus { constructor(private readonly store: DataStore) {} emit(actor: RequestActor, event: string, data: Record<string, unknown>): SalesEvent { const now = nowIso(); const salesEvent: SalesEvent = { id: newId("evt"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, event, source: "SalesOS", actorId: actor.userId, data }; this.store.getState().events.unshift(salesEvent); this.store.save(); return salesEvent; } }
