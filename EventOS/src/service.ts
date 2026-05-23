import { DataStore } from "./core/datastore";
import {
  AuditLog,
  DeadLetterEvent,
  DeadLetterPolicy,
  DomainEvent,
  EventBusOverview,
  EventCorrelation,
  EventLog,
  EventMetrics,
  EventProjection,
  EventPublisher,
  EventReplay,
  EventSchema,
  EventState,
  EventStream,
  EventSubscriber,
  EventSubscription,
  RequestActor,
  RetryPolicy,
  WebhookEndpoint
} from "./domain";
import { badRequest, conflict, notFound } from "./core/errors";
import { newCorrelationId, newEventId, nowIso } from "./core/id";
import {
  clone,
  ensureArray,
  ensureBoolean,
  ensureNumber,
  ensureObject,
  ensureString,
  matchesFilter,
  optionalObject,
  optionalString,
  pickQuery
} from "./core/utils";

const defaultRetryPolicy: RetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 60000,
  backoffMultiplier: 2,
  retryableErrors: ["timeout", "subscriber_unavailable", "external_api_failure"]
};

const defaultDeadLetterPolicy: DeadLetterPolicy = {
  enabled: true,
  maxRetries: 3,
  notifyOnDeadLetter: true
};

export class EventosService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "EventOS service is ready";
  }

  overview(actor: RequestActor): EventBusOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    const events = state.events.filter((e) => e.tenantId === tenant);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentEvents = events.filter((e) => new Date(e.occurredAt) >= oneHourAgo);
    const eventsPerSecond = recentEvents.length / 3600;

    const metrics: EventMetrics = {
      totalEvents: events.length,
      processedEvents: events.filter((e) => e.status === "processed").length,
      failedEvents: events.filter((e) => e.status === "failed").length,
      deadLetteredEvents: events.filter((e) => e.status === "dead_lettered").length,
      pendingEvents: events.filter((e) => e.status === "pending" || e.status === "processing").length,
      eventsPerSecond: Math.round(eventsPerSecond * 100) / 100,
      averageLatencyMs: this.calculateAverageLatency(events),
      activeSubscriptions: state.subscriptions.filter((s) => s.tenantId === tenant && s.status === "active").length,
      activeTopics: uniq(state.events.filter((e) => e.tenantId === tenant).map((e) => e.eventName.split(".")[0])).length,
      eventsByType: this.countBy(events, "eventType"),
      eventsBySource: this.countBy(events, "sourceOS"),
      eventsByStatus: this.countBy(events, "status")
    };

    const subscribers = state.subscribers.filter((s) => s.tenantId === tenant);
    return {
      metrics,
      healthySubscribers: subscribers.filter((s) => s.healthStatus === "healthy").length,
      degradedSubscribers: subscribers.filter((s) => s.healthStatus === "degraded").length,
      unhealthySubscribers: subscribers.filter((s) => s.healthStatus === "unhealthy").length,
      recentEvents: recentEvents.length,
      failedEvents: metrics.failedEvents,
      deadLetterCount: metrics.deadLetteredEvents
    };
  }

  private calculateAverageLatency(events: DomainEvent[]): number {
    const processed = events.filter((e) => e.processedAt && e.status === "processed");
    if (processed.length === 0) return 0;
    const total = processed.reduce((sum, e) => {
      const occurred = new Date(e.occurredAt).getTime();
      const processed = new Date(e.processedAt!).getTime();
      return sum + (processed - occurred);
    }, 0);
    return Math.round(total / processed.length);
  }

  private countBy(items: DomainEvent[], key: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const value = String((item as any)[key] ?? "unknown");
      acc[value] = (acc[value] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  publishEvent(input: unknown, actor: RequestActor): { event: DomainEvent; deliveredTo: number } {
    const body = ensureObject(input, "event");
    const state = this.store.getState();
    const eventName = ensureString(body.eventName, "event.eventName");

    const schema = state.schemas.find((s) => s.tenantId === actor.tenantId && s.key === eventName);
    if (schema && schema.status === "active") {
      this.validateAgainstSchema(body.data, schema);
    }

    const event: DomainEvent = {
      id: newEventId("evt"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      eventId: newEventId("evt"),
      eventName,
      eventType: String(body.eventType ?? "domain") as DomainEvent["eventType"],
      version: String(body.version ?? "1.0.0"),
      sourceOS: ensureString(body.sourceOS, "event.sourceOS", "EventOS"),
      sourceService: optionalString(body.sourceService),
      actorId: optionalString(body.actorId) as UUID | undefined,
      correlationId: optionalString(body.correlationId) as UUID | undefined,
      causationId: optionalString(body.causationId) as UUID | undefined,
      occurredAt: optionalString(body.occurredAt) ?? nowIso(),
      data: optionalObject(body.data),
      metadata: optionalObject(body.metadata),
      status: "pending",
      deliveryAttempts: 0
    };

    if (!event.correlationId) {
      event.correlationId = newCorrelationId();
      this.createCorrelation(event.correlationId, event.id, actor);
    } else {
      this.addToCorrelation(event.correlationId, event.id);
    }

    state.events.unshift(event);
    const deliveredTo = this.deliverToSubscribers(event, actor);
    this.store.save();
    this.store.audit(actor, "event.publish", "domainEvent", event.id, undefined, { eventName, deliveredTo });
    return { event: clone(event), deliveredTo };
  }

  private validateAgainstSchema(data: Record<string, unknown>, schema: EventSchema): void {
    for (const field of schema.requiredFields) {
      if (data[field] === undefined) {
        badRequest(`Missing required field: ${field}`);
      }
    }
  }

  private deliverToSubscribers(event: DomainEvent, actor: RequestActor): number {
    const state = this.store.getState();
    const subscriptions = state.subscriptions.filter(
      (s) => s.tenantId === actor.tenantId && s.status === "active" && (s.eventName === event.eventName || s.eventName === "*")
    );

    let delivered = 0;
    for (const subscription of subscriptions) {
      if (subscription.filterCriteria && !matchesFilter(event.data, subscription.filterCriteria)) {
        continue;
      }

      const startTime = Date.now();
      try {
        this.deliverEvent(event, subscription, actor);
        delivered++;
      } catch (error) {
        this.handleDeliveryFailure(event, subscription, error instanceof Error ? error.message : "Unknown error", actor);
      }

      const latencyMs = Date.now() - startTime;
      this.logDelivery(event, subscription, latencyMs, "delivered", actor);
    }

    event.status = delivered > 0 ? "processed" : "pending";
    event.processedAt = nowIso();
    return delivered;
  }

  private deliverEvent(event: DomainEvent, subscription: EventSubscription, actor: RequestActor): void {
    const state = this.store.getState();
    if (subscription.deliveryMode === "webhook") {
      const subscriber = state.subscribers.find((s) => s.id === subscription.subscriberId);
      if (subscriber?.webhookUrl) {
        this.sendWebhook(event, subscriber);
      }
    }
  }

  private sendWebhook(event: DomainEvent, subscriber: EventSubscriber): void {
    // Mock webhook delivery - in production this would make HTTP call
    console.log(`[Webhook] Sending ${event.eventName} to ${subscriber.key}`);
  }

  private handleDeliveryFailure(event: DomainEvent, subscription: EventSubscription, error: string, actor: RequestActor): void {
    event.deliveryAttempts++;
    event.lastError = error;

    if (event.deliveryAttempts >= subscription.retryPolicy.maxAttempts) {
      event.status = "dead_lettered";
      this.createDeadLetter(event, "max_retries_exceeded", error, actor);
    } else {
      event.status = "pending";
    }
  }

  private logDelivery(
    event: DomainEvent,
    subscription: EventSubscription,
    latencyMs: number,
    status: "delivered" | "failed",
    actor: RequestActor
  ): void {
    const log: EventLog = {
      id: newEventId("log"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      eventId: event.id,
      subscriptionId: subscription.id,
      subscriberId: subscription.subscriberId,
      eventName: event.eventName,
      topic: subscription.topic,
      status: status === "delivered" ? "delivered" : "failed",
      deliveryAttempts: event.deliveryAttempts,
      lastAttemptAt: nowIso(),
      deliveredAt: status === "delivered" ? nowIso() : undefined,
      latencyMs
    };
    this.store.getState().eventLogs.unshift(log);
  }

  private createDeadLetter(event: DomainEvent, reason: string, errorMessage: string, actor: RequestActor): void {
    const deadLetter: DeadLetterEvent = {
      id: newEventId("dlq"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      eventId: newEventId("dlq"),
      originalEventId: event.id,
      eventName: event.eventName,
      topic: event.eventName.split(".")[0],
      reason: reason as DeadLetterEvent["reason"],
      errorMessage,
      payload: event.data,
      retryCount: event.deliveryAttempts,
      maxRetries: 3,
      firstFailureAt: nowIso(),
      lastFailureAt: nowIso()
    };
    this.store.getState().deadLetters.unshift(deadLetter);
  }

  private createCorrelation(correlationId: UUID, eventId: UUID, actor: RequestActor): void {
    const correlation: EventCorrelation = {
      id: newEventId("corr"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      correlationId,
      events: [eventId],
      rootEventId: eventId
    };
    this.store.getState().correlations.unshift(correlation);
  }

  private addToCorrelation(correlationId: UUID, eventId: UUID): void {
    const correlation = this.store.getState().correlations.find((c) => c.correlationId === correlationId);
    if (correlation) {
      correlation.events.push(eventId);
      correlation.updatedAt = nowIso();
    }
  }

  listEvents(actor: RequestActor, query?: URLSearchParams): DomainEvent[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const eventName = pickQuery(query, "eventName");
    const sourceOS = pickQuery(query, "sourceOS");
    const status = pickQuery(query, "status");
    const startDate = pickQuery(query, "startDate");
    const endDate = pickQuery(query, "endDate");

    return clone(this.store.getState().events.filter((e) => {
      if (e.tenantId !== actor.tenantId) return false;
      if (search && !`${e.eventName} ${e.sourceOS}`.toLowerCase().includes(search)) return false;
      if (eventName && e.eventName !== eventName) return false;
      if (sourceOS && e.sourceOS !== sourceOS) return false;
      if (status && e.status !== status) return false;
      if (startDate && e.occurredAt < startDate) return false;
      if (endDate && e.occurredAt > endDate) return false;
      return true;
    }));
  }

  getEvent(id: string, actor: RequestActor): DomainEvent {
    const event = this.store.getState().events.find((e) => e.id === id && e.tenantId === actor.tenantId);
    if (!event) notFound("Event not found");
    return clone(event);
  }

  listSchemas(actor: RequestActor, query?: URLSearchParams): EventSchema[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const eventType = pickQuery(query, "eventType");
    return clone(this.store.getState().schemas.filter((s) => {
      if (s.tenantId !== actor.tenantId) return false;
      if (search && !`${s.key} ${s.name} ${s.description ?? ""}`.toLowerCase().includes(search)) return false;
      if (eventType && s.eventType !== eventType) return false;
      return true;
    }));
  }

  getSchema(id: string, actor: RequestActor): EventSchema {
    const schema = this.store.getState().schemas.find((s) => s.id === id && s.tenantId === actor.tenantId);
    if (!schema) notFound("Schema not found");
    return clone(schema);
  }

  createSchema(input: unknown, actor: RequestActor): EventSchema {
    const body = ensureObject(input, "schema");
    const state = this.store.getState();
    const key = ensureString(body.key, "schema.key");
    if (state.schemas.some((s) => s.tenantId === actor.tenantId && s.key === key)) {
      conflict(`Schema key '${key}' already exists`);
    }

    const schema: EventSchema = {
      id: newEventId("schema"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "schema.name"),
      description: optionalString(body.description),
      version: String(body.version ?? "1.0.0"),
      status: String(body.status ?? "active") as EventSchema["status"],
      eventType: String(body.eventType ?? "domain") as EventSchema["eventType"],
      payloadSchema: optionalObject(body.payloadSchema),
      requiredFields: ensureArray<string>(body.requiredFields, "schema.requiredFields"),
      optionalFields: ensureArray<string>(body.optionalFields, "schema.optionalFields"),
      examples: ensureArray(body.examples, "schema.examples"),
      ownerOS: ensureString(body.ownerOS, "schema.ownerOS"),
      tags: ensureArray<string>(body.tags, "schema.tags"),
      lifecycleStatus: String(body.lifecycleStatus ?? "active") as EventSchema["lifecycleStatus"],
      sunsetDate: optionalString(body.sunsetDate),
      replacementSchemaId: optionalString(body.replacementSchemaId)
    };

    state.schemas.push(schema);
    this.store.save();
    this.store.audit(actor, "schema.create", "eventSchema", schema.id, undefined, schema);
    return clone(schema);
  }

  listStreams(actor: RequestActor): EventStream[] {
    return clone(this.store.getState().streams.filter((s) => s.tenantId === actor.tenantId));
  }

  createStream(input: unknown, actor: RequestActor): EventStream {
    const body = ensureObject(input, "stream");
    const state = this.store.getState();
    const key = ensureString(body.key, "stream.key");
    if (state.streams.some((s) => s.tenantId === actor.tenantId && s.key === key)) {
      conflict(`Stream key '${key}' already exists`);
    }

    const stream: EventStream = {
      id: newEventId("stream"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "stream.name"),
      description: optionalString(body.description),
      topic: ensureString(body.topic, "stream.topic"),
      partitionKey: optionalString(body.partitionKey),
      status: String(body.status ?? "active") as EventStream["status"],
      retentionDays: ensureNumber(body.retentionDays, "stream.retentionDays", 90),
      messageTtlSeconds: ensureNumber(body.messageTtlSeconds, "stream.messageTtlSeconds", 86400),
      partitions: ensureNumber(body.partitions, "stream.partitions", 1),
      config: optionalObject(body.config)
    };

    state.streams.push(stream);
    this.store.save();
    this.store.audit(actor, "stream.create", "eventStream", stream.id, undefined, stream);
    return clone(stream);
  }

  listPublishers(actor: RequestActor): EventPublisher[] {
    return clone(this.store.getState().publishers.filter((p) => p.tenantId === actor.tenantId));
  }

  createPublisher(input: unknown, actor: RequestActor): EventPublisher {
    const body = ensureObject(input, "publisher");
    const state = this.store.getState();
    const key = ensureString(body.key, "publisher.key");
    if (state.publishers.some((p) => p.tenantId === actor.tenantId && p.key === key)) {
      conflict(`Publisher key '${key}' already exists`);
    }

    const publisher: EventPublisher = {
      id: newEventId("pub"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "publisher.name"),
      description: optionalString(body.description),
      sourceOS: ensureString(body.sourceOS, "publisher.sourceOS"),
      sourceService: optionalString(body.sourceService),
      status: String(body.status ?? "active") as EventPublisher["status"],
      eventTypes: ensureArray<string>(body.eventTypes, "publisher.eventTypes"),
      topics: ensureArray<string>(body.topics, "publisher.topics"),
      config: optionalObject(body.config)
    };

    state.publishers.push(publisher);
    this.store.save();
    this.store.audit(actor, "publisher.create", "eventPublisher", publisher.id, undefined, publisher);
    return clone(publisher);
  }

  listSubscribers(actor: RequestActor): EventSubscriber[] {
    return clone(this.store.getState().subscribers.filter((s) => s.tenantId === actor.tenantId));
  }

  createSubscriber(input: unknown, actor: RequestActor): EventSubscriber {
    const body = ensureObject(input, "subscriber");
    const state = this.store.getState();
    const key = ensureString(body.key, "subscriber.key");
    if (state.subscribers.some((s) => s.tenantId === actor.tenantId && s.key === key)) {
      conflict(`Subscriber key '${key}' already exists`);
    }

    const subscriber: EventSubscriber = {
      id: newEventId("sub"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "subscriber.name"),
      description: optionalString(body.description),
      subscriberOS: ensureString(body.subscriberOS, "subscriber.subscriberOS"),
      status: String(body.status ?? "active") as EventSubscriber["status"],
      eventTypes: ensureArray<string>(body.eventTypes, "subscriber.eventTypes", []),
      topics: ensureArray<string>(body.topics, "subscriber.topics", []),
      config: optionalObject(body.config),
      healthStatus: "unknown"
    };

    state.subscribers.push(subscriber);
    this.store.save();
    this.store.audit(actor, "subscriber.create", "eventSubscriber", subscriber.id, undefined, subscriber);
    return clone(subscriber);
  }

  listSubscriptions(actor: RequestActor, query?: URLSearchParams): EventSubscription[] {
    const subscriberId = pickQuery(query, "subscriberId");
    const eventName = pickQuery(query, "eventName");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().subscriptions.filter((s) => {
      if (s.tenantId !== actor.tenantId) return false;
      if (subscriberId && s.subscriberId !== subscriberId) return false;
      if (eventName && s.eventName !== eventName) return false;
      if (status && s.status !== status) return false;
      return true;
    }));
  }

  createSubscription(input: unknown, actor: RequestActor): EventSubscription {
    const body = ensureObject(input, "subscription");
    const state = this.store.getState();
    const key = ensureString(body.key, "subscription.key");
    if (state.subscriptions.some((s) => s.tenantId === actor.tenantId && s.key === key)) {
      conflict(`Subscription key '${key}' already exists`);
    }

    const subscription: EventSubscription = {
      id: newEventId("sub"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "subscription.name"),
      description: optionalString(body.description),
      subscriberId: ensureString(body.subscriberId, "subscription.subscriberId"),
      eventName: ensureString(body.eventName, "subscription.eventName"),
      eventVersion: optionalString(body.eventVersion),
      topic: ensureString(body.topic, "subscription.topic"),
      filterCriteria: optionalObject(body.filterCriteria),
      priority: ensureNumber(body.priority, "subscription.priority", 0),
      status: String(body.status ?? "active") as EventSubscription["status"],
      retryPolicy: body.retryPolicy ? ensureObject(body.retryPolicy, "subscription.retryPolicy") as RetryPolicy : defaultRetryPolicy,
      deadLetterPolicy: body.deadLetterPolicy ? ensureObject(body.deadLetterPolicy, "subscription.deadLetterPolicy") as DeadLetterPolicy : defaultDeadLetterPolicy,
      deliveryMode: String(body.deliveryMode ?? "async") as EventSubscription["deliveryMode"]
    };

    state.subscriptions.push(subscription);
    this.store.save();
    this.store.audit(actor, "subscription.create", "eventSubscription", subscription.id, undefined, subscription);
    return clone(subscription);
  }

  listWebhooks(actor: RequestActor): WebhookEndpoint[] {
    return clone(this.store.getState().webhooks.filter((w) => w.tenantId === actor.tenantId));
  }

  createWebhook(input: unknown, actor: RequestActor): WebhookEndpoint {
    const body = ensureObject(input, "webhook");
    const state = this.store.getState();
    const key = ensureString(body.key, "webhook.key");
    if (state.webhooks.some((w) => w.tenantId === actor.tenantId && w.key === key)) {
      conflict(`Webhook key '${key}' already exists`);
    }

    const webhook: WebhookEndpoint = {
      id: newEventId("wh"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "webhook.name"),
      description: optionalString(body.description),
      url: ensureString(body.url, "webhook.url"),
      method: String(body.method ?? "POST") as WebhookEndpoint["method"],
      headers: optionalObject(body.headers),
      authType: String(body.authType ?? "none") as WebhookEndpoint["authType"],
      authConfig: optionalObject(body.authConfig),
      eventFilters: ensureArray<string>(body.eventFilters, "webhook.eventFilters"),
      status: String(body.status ?? "active") as WebhookEndpoint["status"],
      healthStatus: "unknown"
    };

    state.webhooks.push(webhook);
    this.store.save();
    this.store.audit(actor, "webhook.create", "webhookEndpoint", webhook.id, undefined, webhook);
    return clone(webhook);
  }

  listDeadLetters(actor: RequestActor, query?: URLSearchParams): DeadLetterEvent[] {
    const eventName = pickQuery(query, "eventName");
    const reason = pickQuery(query, "reason");
    const resolved = pickQuery(query, "resolved");

    return clone(this.store.getState().deadLetters.filter((d) => {
      if (d.tenantId !== actor.tenantId) return false;
      if (eventName && d.eventName !== eventName) return false;
      if (reason && d.reason !== reason) return false;
      if (resolved === "true" && !d.resolvedAt) return false;
      if (resolved === "false" && d.resolvedAt) return false;
      return true;
    }));
  }

  retryDeadLetter(id: string, actor: RequestActor): DomainEvent {
    const state = this.store.getState();
    const deadLetter = state.deadLetters.find((d) => d.id === id && d.tenantId === actor.tenantId);
    if (!deadLetter) notFound("Dead letter event not found");
    if (deadLetter.resolvedAt) conflict("Dead letter already resolved");

    const newEvent: DomainEvent = {
      id: newEventId("evt"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      eventId: newEventId("evt"),
      eventName: deadLetter.eventName,
      eventType: "domain",
      version: "1.0.0",
      sourceOS: "EventOS",
      occurredAt: nowIso(),
      data: deadLetter.payload,
      status: "pending",
      deliveryAttempts: 0
    };

    state.events.unshift(newEvent);
    deadLetter.retryCount++;
    deadLetter.lastFailureAt = nowIso();
    this.store.save();
    this.store.audit(actor, "deadletter.retry", "deadLetterEvent", deadLetter.id, undefined, { newEventId: newEvent.id });
    return clone(newEvent);
  }

  resolveDeadLetter(id: string, actor: RequestActor): DeadLetterEvent {
    const state = this.store.getState();
    const deadLetter = state.deadLetters.find((d) => d.id === id && d.tenantId === actor.tenantId);
    if (!deadLetter) notFound("Dead letter event not found");

    deadLetter.resolvedAt = nowIso();
    deadLetter.resolvedBy = actor.userId;
    deadLetter.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "deadletter.resolve", "deadLetterEvent", deadLetter.id, undefined, deadLetter);
    return clone(deadLetter);
  }

  listReplays(actor: RequestActor): EventReplay[] {
    return clone(this.store.getState().replays.filter((r) => r.tenantId === actor.tenantId));
  }

  createReplay(input: unknown, actor: RequestActor): EventReplay {
    const body = ensureObject(input, "replay");
    const state = this.store.getState();

    const replay: EventReplay = {
      id: newEventId("replay"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: ensureString(body.key, "replay.key"),
      name: ensureString(body.name, "replay.name"),
      description: optionalString(body.description),
      eventName: ensureString(body.eventName, "replay.eventName"),
      eventVersion: optionalString(body.eventVersion),
      topic: optionalString(body.topic),
      subscriberId: optionalString(body.subscriberId),
      startDate: ensureString(body.startDate, "replay.startDate"),
      endDate: ensureString(body.endDate, "replay.endDate"),
      filters: optionalObject(body.filters),
      status: "pending",
      totalEvents: 0,
      processedEvents: 0,
      failedEvents: 0,
      triggeredBy: actor.userId
    };

    const matchingEvents = state.events.filter((e) => {
      if (e.tenantId !== actor.tenantId) return false;
      if (e.eventName !== replay.eventName) return false;
      if (e.occurredAt < replay.startDate || e.occurredAt > replay.endDate) return false;
      return true;
    });

    replay.totalEvents = matchingEvents.length;
    state.replays.push(replay);
    this.store.save();
    this.store.audit(actor, "replay.create", "eventReplay", replay.id, undefined, { eventName: replay.eventName, totalEvents: replay.totalEvents });
    return clone(replay);
  }

  executeReplay(id: string, actor: RequestActor): EventReplay {
    const state = this.store.getState();
    const replay = state.replays.find((r) => r.id === id && r.tenantId === actor.tenantId);
    if (!replay) notFound("Replay not found");
    if (replay.status === "running") conflict("Replay already running");

    replay.status = "running";
    replay.startedAt = nowIso();

    const events = state.events.filter((e) => {
      if (e.eventName !== replay.eventName) return false;
      if (e.occurredAt < replay.startDate || e.occurredAt > replay.endDate) return false;
      return true;
    });

    let processed = 0;
    let failed = 0;

    for (const event of events) {
      try {
        const newEvent: DomainEvent = {
          ...clone(event),
          id: newEventId("evt"),
          tenantId: actor.tenantId,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          eventId: newEventId("evt"),
          status: "pending",
          deliveryAttempts: 0
        };
        state.events.unshift(newEvent);
        this.deliverToSubscribers(newEvent, actor);
        processed++;
      } catch {
        failed++;
      }
    }

    replay.processedEvents = processed;
    replay.failedEvents = failed;
    replay.completedAt = nowIso();
    replay.status = failed > 0 ? "failed" : "completed";
    this.store.save();
    this.store.audit(actor, "replay.execute", "eventReplay", replay.id, undefined, { processed, failed });
    return clone(replay);
  }

  getCorrelation(correlationId: string, actor: RequestActor): EventCorrelation | undefined {
    const correlation = this.store.getState().correlations.find(
      (c) => c.correlationId === correlationId && c.tenantId === actor.tenantId
    );
    if (!correlation) return undefined;

    const events = correlation.events.map((eventId) => {
      return this.store.getState().events.find((e) => e.id === eventId);
    }).filter(Boolean);

    return clone({ ...correlation, eventDetails: events });
  }

  listEventLogs(actor: RequestActor, query?: URLSearchParams): EventLog[] {
    const eventId = pickQuery(query, "eventId");
    const subscriptionId = pickQuery(query, "subscriptionId");
    const status = pickQuery(query, "status");

    return clone(this.store.getState().eventLogs.filter((l) => {
      if (l.tenantId !== actor.tenantId) return false;
      if (eventId && l.eventId !== eventId) return false;
      if (subscriptionId && l.subscriptionId !== subscriptionId) return false;
      if (status && l.status !== status) return false;
      return true;
    }));
  }

  listAuditLogs(actor: RequestActor): AuditLog[] {
    return clone(this.store.getState().auditLogs.filter((a) => a.tenantId === actor.tenantId));
  }
}

function uniq<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

type UUID = string;
