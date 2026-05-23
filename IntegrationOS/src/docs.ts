export function docs() {
  return {
    name: "IntegrationOS",
    version: "1.0.0",
    description: "External integrations, connectors, sync rules, webhooks, OAuth, and integration marketplace",
    auth: {
      headers: {
        "x-role": "owner | admin | integration_admin | integration_engineer | connector_manager | webhook_operator | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      connector: "A configured connection to an external service or API",
      integration: "An active connection to an external service using a connector",
      webhook: "An HTTP endpoint that receives events from external services",
      syncRule: "Automated data synchronization between integrations",
      oauthConnection: "OAuth 2.0 authentication for third-party services",
      dataMapping: "Field-by-field transformation rules for data sync"
    },
    endpoints: {
      overview: {
        method: "GET",
        path: "/integrationos",
        description: "Get integration dashboard overview",
        headers: { "x-role": "integration_admin" }
      },
      connectors: {
        list: {
          method: "GET",
          path: "/integrationos/connectors",
          description: "List all connectors"
        },
        create: {
          method: "POST",
          path: "/integrationos/connectors",
          description: "Create a new connector",
          headers: { "x-role": "integration_admin" },
          body: {
            name: "string",
            category: "payment | crm | email | calendar | storage | communication | accounting | analytics | ai_platforms | ecommerce | social_media | notification | custom",
            type: "rest | graphql | soap | database | file",
            authType: "api_key | bearer_token | oauth2 | basic_auth | jwt | hmac_signature",
            baseUrl: "string"
          }
        },
        get: {
          method: "GET",
          path: "/integrationos/connectors/:id",
          description: "Get connector by ID"
        },
        update: {
          method: "PATCH",
          path: "/integrationos/connectors/:id",
          description: "Update connector",
          headers: { "x-role": "integration_admin" },
          body: { status: "active | inactive | archived" }
        }
      },
      integrations: {
        list: {
          method: "GET",
          path: "/integrationos/integrations",
          description: "List all integrations"
        },
        create: {
          method: "POST",
          path: "/integrationos/integrations",
          description: "Create a new integration",
          headers: { "x-role": "integration_admin" },
          body: {
            name: "string",
            connectorId: "string",
            config: "object"
          }
        },
        get: {
          method: "GET",
          path: "/integrationos/integrations/:id",
          description: "Get integration by ID"
        },
        update: {
          method: "PATCH",
          path: "/integrationos/integrations/:id",
          description: "Update integration"
        }
      },
      webhooks: {
        list: {
          method: "GET",
          path: "/integrationos/webhooks",
          description: "List all webhook endpoints"
        },
        create: {
          method: "POST",
          path: "/integrationos/webhooks",
          description: "Create a webhook endpoint",
          headers: { "x-role": "webhook_operator" },
          body: {
            name: "string",
            url: "string",
            events: ["string"],
            retryPolicy: "object"
          }
        },
        get: {
          method: "GET",
          path: "/integrationos/webhooks/:id",
          description: "Get webhook by ID"
        },
        test: {
          method: "POST",
          path: "/integrationos/webhooks/:id/test",
          description: "Test webhook delivery"
        },
        receive: {
          method: "POST",
          path: "/integrationos/webhooks/:id/receive",
          description: "Receive webhook event"
        }
      },
      syncRules: {
        list: {
          method: "GET",
          path: "/integrationos/sync-rules",
          description: "List all sync rules"
        },
        create: {
          method: "POST",
          path: "/integrationos/sync-rules",
          description: "Create a sync rule",
          body: {
            name: "string",
            sourceIntegrationId: "string",
            targetIntegrationId: "string",
            direction: "one-way | two-way",
            mode: "realtime | scheduled | manual | event-driven",
            mappingId: "string"
          }
        },
        run: {
          method: "POST",
          path: "/integrationos/sync-rules/:id/run",
          description: "Run a sync job"
        }
      },
      oauth: {
        list: {
          method: "GET",
          path: "/integrationos/oauth",
          description: "List OAuth connections"
        },
        create: {
          method: "POST",
          path: "/integrationos/oauth",
          description: "Create OAuth connection",
          body: {
            integrationId: "string",
            provider: "google | microsoft | github | linkedin | slack | hubspot | salesforce | custom",
            accessToken: "string",
            refreshToken: "string",
            expiresAt: "ISO date string"
          }
        }
      },
      logs: {
        method: "GET",
        path: "/integrationos/logs",
        description: "Get integration logs",
        query: { limit: "number (default 100)" }
      },
      errors: {
        method: "GET",
        path: "/integrationos/errors",
        description: "List integration errors"
      },
      templates: {
        method: "GET",
        path: "/integrationos/templates",
        description: "List integration templates (marketplace)"
      }
    },
    examples: {
      createConnector: {
        method: "POST",
        path: "/integrationos/connectors",
        headers: { "x-role": "integration_admin" },
        body: {
          name: "Stripe",
          category: "payment",
          type: "rest",
          baseUrl: "https://api.stripe.com/v1",
          authType: "api_key"
        }
      },
      createWebhook: {
        method: "POST",
        path: "/integrationos/webhooks",
        headers: { "x-role": "webhook_operator" },
        body: {
          name: "Payment Webhook",
          url: "https://api.example.com/webhooks/payment",
          events: ["payment.succeeded", "payment.failed"]
        }
      },
      runSync: {
        method: "POST",
        path: "/integrationos/sync-rules/sync_hubspot_to_salesos/run",
        headers: { "x-role": "integration_admin" }
      }
    }
  };
}
