import { createId, nowIso } from "./id";

export interface CommerceEvent<T = unknown> {
  id: string;
  name: string;
  source: string;
  tenantId: string;
  data: T;
  occurredAt: string;
}

export type EventHandler<T = unknown> = (event: CommerceEvent<T>) => void | Promise<void>;

export class EventBus {
  private handlers = new Map<string, EventHandler[]>();
  private recent: CommerceEvent[] = [];

  subscribe<T = unknown>(eventName: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventName) ?? [];
    handlers.push(handler as EventHandler);
    this.handlers.set(eventName, handlers);
  }

  publish<T>(name: string, source: string, tenantId: string, data: T): CommerceEvent<T> {
    const event: CommerceEvent<T> = {
      id: createId("EVT"),
      name,
      source,
      tenantId,
      data,
      occurredAt: nowIso()
    };

    this.recent.unshift(event);
    this.recent = this.recent.slice(0, 200);

    const handlers = [...(this.handlers.get(name) ?? []), ...(this.handlers.get("*") ?? [])];
    for (const handler of handlers) {
      Promise.resolve(handler(event)).catch((error) => {
        // In production, replace this with a structured logger and retry policy.
        console.error(`[EventBus] handler failed for ${name}`, error);
      });
    }

    return event;
  }

  recentEvents(limit = 50): CommerceEvent[] {
    return this.recent.slice(0, limit);
  }
}
