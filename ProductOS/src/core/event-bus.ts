import { DataStore } from "./datastore";
import { ProductEvent, RequestActor } from "./domain";
import { newId, nowIso } from "./id";
export class EventBus { constructor(private readonly store: DataStore) {} emit(actor: RequestActor, event: string, data: Record<string, unknown>): ProductEvent { const now = nowIso(); const productEvent: ProductEvent = { id: newId("evt"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, event, source: "ProductOS", actorId: actor.userId, data }; this.store.getState().events.unshift(productEvent); this.store.save(); return productEvent; } }
