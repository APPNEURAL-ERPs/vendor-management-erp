export function docs() {
  return {
    name: "EventOS",
    version: "1.0.0",
    description: "Domain events, event bus, event schema registry, subscriptions, webhooks, replay, and async communication",
    capabilities: [
      "Event publishing and delivery",
      "Event schema registry and validation",
      "Pub/sub with subscriptions",
      "Webhook delivery",
      "Dead letter queue management",
      "Event replay",
      "Event correlation tracking",
      "Event analytics and monitoring"
    ],
    endpoints: {
      overview: {
        "GET /eventos/overview": "Get event bus overview and metrics"
      },
      events: {
        "GET /eventos/events": "List events with optional filters (search, eventName, sourceOS, status, startDate, endDate)",
        "GET /eventos/events/:id": "Get single event by ID",
        "POST /eventos/events/publish": "Publish a new event"
      },
      schemas: {
        "GET /eventos/schemas": "List event schemas",
        "GET /eventos/schemas/:id": "Get schema by ID",
        "POST /eventos/schemas": "Create event schema"
      },
      streams: {
        "GET /eventos/streams": "List event streams",
        "POST /eventos/streams": "Create event stream"
      },
      publishers: {
        "GET /eventos/publishers": "List event publishers",
        "POST /eventos/publishers": "Create event publisher"
      },
      subscribers: {
        "GET /eventos/subscribers": "List event subscribers",
        "POST /eventos/subscribers": "Create event subscriber"
      },
      subscriptions: {
        "GET /eventos/subscriptions": "List subscriptions (filter by subscriberId, eventName, status)",
        "POST /eventos/subscriptions": "Create subscription"
      },
      webhooks: {
        "GET /eventos/webhooks": "List webhook endpoints",
        "POST /eventos/webhooks": "Create webhook endpoint"
      },
      deadLetter: {
        "GET /eventos/dead-letter": "List dead letter events (filter by eventName, reason, resolved)",
        "POST /eventos/dead-letter/:id/retry": "Retry dead letter event",
        "POST /eventos/dead-letter/:id/resolve": "Mark dead letter as resolved"
      },
      replays: {
        "GET /eventos/replays": "List event replays",
        "POST /eventos/replays": "Create replay job",
        "POST /eventos/replays/:id/execute": "Execute replay"
      },
      correlations: {
        "GET /eventos/correlations/:correlationId": "Get correlation chain"
      },
      logs: {
        "GET /eventos/logs": "List event delivery logs"
      },
      audit: {
        "GET /eventos/audit": "List audit logs"
      }
    },
    eventTypes: [
      "domain",
      "integration",
      "audit",
      "system",
      "external"
    ],
    exampleEvents: {
      "lead.created": {
        eventName: "lead.created",
        eventType: "domain",
        version: "1.0.0",
        sourceOS: "SalesOS",
        data: {
          leadId: "lead_123",
          name: "John Doe",
          email: "john@example.com",
          source: "website_form"
        }
      },
      "invoice.paid": {
        eventName: "invoice.paid",
        eventType: "domain",
        version: "1.0.0",
        sourceOS: "BillingOS",
        data: {
          invoiceId: "inv_456",
          amount: 12000,
          currency: "INR",
          paymentId: "pay_789"
        }
      },
      "course.completed": {
        eventName: "course.completed",
        eventType: "domain",
        version: "1.0.0",
        sourceOS: "LearningOS",
        data: {
          courseId: "course_101",
          userId: "user_abc",
          completedAt: "2026-05-21T10:30:00Z",
          certificateId: "cert_xyz"
        }
      }
    },
    eventNaming: {
      pattern: "noun.verb",
      examples: [
        "lead.created",
        "invoice.paid",
        "payment.failed",
        "user.invited",
        "tenant.created",
        "module.enabled",
        "workflow.failed",
        "agent.run.completed"
      ]
    },
    headers: {
      "x-tenant-id": "Tenant identifier (defaults to demo-tenant)",
      "x-user-id": "User identifier",
      "x-role": "User role (owner, admin, event_admin, event_engineer, event_analyst, viewer)"
    }
  };
}
