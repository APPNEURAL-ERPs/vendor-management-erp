import { AnalyticsEvent, RequestActor } from "./domain";
import { newId, nowIso } from "./id";
import { DataStore } from "./datastore";

type EventHandler = (event: AnalyticsEvent) => void;

export class EventBus {
  private readonly handlers: EventHandler[] = [];

  constructor(private readonly store: DataStore) {}

  subscribe(handler: EventHandler): void {
    this.handlers.push(handler);
  }

  publish(actor: RequestActor, name: string, properties: Record<string, unknown>, source = "AnalyticsOS"): AnalyticsEvent {
    const event: AnalyticsEvent = {
      id: newId("event"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name,
      source,
      properties,
      timestamp: nowIso()
    };
    this.store.getState().events.unshift(event);
    this.store.save();
    for (const handler of this.handlers) handler(event);
    return event;
  }
}

export function wireAnalyticsIntegrations(events: EventBus): void {
  events.subscribe((event) => {
    if (event.name === "analytics.alert.triggered") {
      // Production integration point:
      // AutomationOS can listen here to send Slack, WhatsApp, email, or ticket alerts.
    }
  });
}
