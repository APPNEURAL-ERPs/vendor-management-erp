import { AutomationEvent } from "./domain";

export type EventHandler = (event: AutomationEvent) => void | Promise<void>;

export class EventBus {
  private handlers: Record<string, EventHandler[]> = {};

  subscribe(eventType: string, handler: EventHandler): () => void {
    this.handlers[eventType] = this.handlers[eventType] ?? [];
    this.handlers[eventType].push(handler);
    return () => {
      this.handlers[eventType] = (this.handlers[eventType] ?? []).filter((current) => current !== handler);
    };
  }

  async publish(event: AutomationEvent): Promise<void> {
    const exact = this.handlers[event.type] ?? [];
    const wildcard = this.handlers["*"] ?? [];
    for (const handler of [...exact, ...wildcard]) {
      await handler(event);
    }
  }
}
