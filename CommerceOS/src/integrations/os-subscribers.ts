import type { EventBus } from "../shared/events";

export function registerOSSubscribers(eventBus: EventBus): void {
  eventBus.subscribe("order.created", (event) => {
    const order = event.data as { id: string; customerId?: string; totalMinor: number; taxMinor: number };

    eventBus.publish("finance.invoice.requested", "CommerceOS", event.tenantId, {
      orderId: order.id,
      customerId: order.customerId,
      amountMinor: order.totalMinor,
      taxMinor: order.taxMinor
    });

    eventBus.publish("analytics.revenue.update.requested", "CommerceOS", event.tenantId, {
      orderId: order.id,
      amountMinor: order.totalMinor
    });
  });

  eventBus.subscribe("order.status.updated", (event) => {
    const payload = event.data as { orderId: string; to: string };
    eventBus.publish("automation.order.notification.requested", "CommerceOS", event.tenantId, {
      orderId: payload.orderId,
      status: payload.to
    });
  });
}
