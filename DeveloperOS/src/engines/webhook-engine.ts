import { WebhookDelivery, WebhookSubscription } from "../core/domain";
import { addSeconds, hmacSha256 } from "../core/utils";
import { newId, nowIso } from "../core/id";

export class WebhookEngine {
  createDelivery(subscription: WebhookSubscription, eventType: string, payload: Record<string, unknown>): WebhookDelivery {
    const now = nowIso();
    const canSend = subscription.status === "active" && subscription.eventTypes.includes(eventType) && /^https?:\/\//.test(subscription.targetUrl);
    const status = canSend ? "sent" : "failed";
    return {
      id: newId("whd"),
      tenantId: subscription.tenantId,
      createdAt: now,
      updatedAt: now,
      subscriptionId: subscription.id,
      eventType,
      payload,
      status,
      attempts: 1,
      responseStatus: canSend ? 200 : undefined,
      error: canSend ? undefined : "Subscription inactive, event not subscribed, or invalid targetUrl",
      signature: subscription.secretHash ? hmacSha256(subscription.secretHash, payload) : undefined,
      nextRetryAt: canSend ? undefined : addSeconds(now, subscription.retryPolicy.backoffSeconds),
      sentAt: canSend ? now : undefined
    };
  }

  retry(delivery: WebhookDelivery, subscription?: WebhookSubscription): WebhookDelivery {
    const now = nowIso();
    delivery.attempts += 1;
    const maxAttempts = subscription?.retryPolicy.maxAttempts ?? 3;
    if (delivery.attempts > maxAttempts) {
      delivery.status = "failed";
      delivery.error = "Retry limit exceeded";
    } else {
      delivery.status = "sent";
      delivery.responseStatus = 200;
      delivery.error = undefined;
      delivery.sentAt = now;
      delivery.nextRetryAt = undefined;
    }
    delivery.updatedAt = now;
    return delivery;
  }
}
