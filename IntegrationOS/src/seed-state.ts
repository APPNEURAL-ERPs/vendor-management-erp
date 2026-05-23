import { IntegrationState } from "./core/datastore";
import { nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): IntegrationState {
  const state: IntegrationState = {
    connectors: [],
    connectorVersions: [],
    integrations: [],
    connectedApps: [],
    oauthConnections: [],
    apiKeys: [],
    webhookEndpoints: [],
    webhookEvents: [],
    dataMappings: [],
    syncRules: [],
    syncJobs: [],
    logs: [],
    errors: [],
    templates: [],
    healthChecks: [],
    events: [],
    auditLogs: []
  };

  const createdAt = nowIso();

  state.connectors.push(
    {
      id: "conn_razorpay",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "razorpay",
      name: "Razorpay",
      description: "Razorpay payment gateway connector for processing payments",
      category: "payment",
      type: "rest",
      status: "active",
      version: "1.0.0",
      baseUrl: "https://api.razorpay.com/v1",
      authType: "api_key",
      scopes: ["payments", "refunds", "orders"],
      config: { webhookEvents: ["payment.captured", "payment.failed", "refund.processed"] },
      metadata: { provider: "razorpay", region: "india" }
    },
    {
      id: "conn_hubspot",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "hubspot",
      name: "HubSpot",
      description: "HubSpot CRM connector for managing leads and contacts",
      category: "crm",
      type: "rest",
      status: "active",
      version: "1.0.0",
      baseUrl: "https://api.hubapi.com",
      authType: "oauth2",
      scopes: ["crm.objects.contacts.read", "crm.objects.contacts.write"],
      config: {},
      metadata: { provider: "hubspot" }
    },
    {
      id: "conn_gmail",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "gmail",
      name: "Gmail",
      description: "Gmail integration for email communication",
      category: "email",
      type: "rest",
      status: "active",
      version: "1.0.0",
      baseUrl: "https://gmail.googleapis.com/gmail/v1",
      authType: "oauth2",
      scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
      config: {},
      metadata: { provider: "google" }
    },
    {
      id: "conn_whatsapp",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "whatsapp",
      name: "WhatsApp Business",
      description: "WhatsApp Business API for customer communication",
      category: "communication",
      type: "rest",
      status: "active",
      version: "1.0.0",
      baseUrl: "https://graph.facebook.com/v18.0",
      authType: "bearer_token",
      scopes: ["whatsapp_business_management", "whatsapp_business_messaging"],
      config: {},
      metadata: { provider: "meta", region: "india" }
    },
    {
      id: "conn_github",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "github",
      name: "GitHub",
      description: "GitHub connector for repository and issue management",
      category: "project_management",
      type: "rest",
      status: "active",
      version: "1.0.0",
      baseUrl: "https://api.github.com",
      authType: "oauth2",
      scopes: ["repo", "read:user"],
      config: {},
      metadata: { provider: "github" }
    }
  );

  state.integrations.push(
    {
      id: "intg_razorpay_finance",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Razorpay for FinanceOS",
      description: "Payment integration for FinanceOS invoice processing",
      connectorId: "conn_razorpay",
      status: "active",
      config: { webhookUrl: "https://api.appneural.com/webhooks/razorpay" },
      credentials: {},
      lastSyncAt: createdAt,
      healthStatus: "healthy",
      metadata: { module: "FinanceOS" }
    },
    {
      id: "intg_hubspot_sales",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "HubSpot for SalesOS",
      description: "CRM integration for SalesOS lead management",
      connectorId: "conn_hubspot",
      status: "active",
      config: {},
      credentials: {},
      lastSyncAt: createdAt,
      healthStatus: "healthy",
      metadata: { module: "SalesOS" }
    },
    {
      id: "intg_whatsapp_notifications",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "WhatsApp Notifications",
      description: "WhatsApp integration for customer notifications",
      connectorId: "conn_whatsapp",
      status: "active",
      config: { templates: ["payment_reminder", "workshop_reminder", "interview_reminder"] },
      credentials: {},
      lastSyncAt: createdAt,
      healthStatus: "healthy",
      metadata: { useCase: "notifications" }
    }
  );

  state.webhookEndpoints.push(
    {
      id: "wh_payment_captured",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      integrationId: "intg_razorpay_finance",
      name: "Payment Captured Webhook",
      description: "Receives payment captured events from Razorpay",
      url: "https://api.appneural.com/webhooks/razorpay/payment-captured",
      method: "POST",
      secret: "whsec_demo_secret_123",
      status: "active",
      events: ["payment.captured", "payment.authorized"],
      retryPolicy: {
        maxAttempts: 3,
        initialDelayMs: 1000,
        backoffMultiplier: 2,
        maxDelayMs: 30000,
        retryableStatuses: [408, 429, 500, 502, 503, 504]
      },
      headers: { "Content-Type": "application/json" },
      metadata: { provider: "razorpay" }
    },
    {
      id: "wh_lead_created",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      integrationId: "intg_hubspot_sales",
      name: "Lead Created Webhook",
      description: "Receives lead creation events",
      url: "https://api.appneural.com/webhooks/hubspot/lead-created",
      method: "POST",
      secret: "whsec_hubspot_lead_456",
      status: "active",
      events: ["lead.created", "contact.created"],
      retryPolicy: {
        maxAttempts: 3,
        initialDelayMs: 1000,
        backoffMultiplier: 2,
        maxDelayMs: 30000,
        retryableStatuses: [408, 429, 500, 502, 503, 504]
      },
      headers: {},
      metadata: { provider: "hubspot" }
    }
  );

  state.syncRules.push(
    {
      id: "sync_hubspot_to_salesos",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "hubspot_salesos_leads",
      name: "HubSpot to SalesOS Lead Sync",
      description: "Syncs leads from HubSpot to SalesOS",
      status: "active",
      sourceIntegrationId: "intg_hubspot_sales",
      targetIntegrationId: "",
      direction: "one-way",
      mode: "scheduled",
      schedule: "0 */5 * * * *",
      filters: [],
      conflictResolution: "source_wins",
      mappingId: "map_hubspot_lead_fields",
      enabled: true,
      lastRunAt: createdAt,
      nextRunAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      metadata: { frequency: "every 5 minutes" }
    },
    {
      id: "sync_razorpay_to_financeos",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "razorpay_financeos_payments",
      name: "Razorpay to FinanceOS Payment Sync",
      description: "Syncs payment data from Razorpay to FinanceOS",
      status: "active",
      sourceIntegrationId: "intg_razorpay_finance",
      targetIntegrationId: "",
      direction: "one-way",
      mode: "event-driven",
      filters: [],
      conflictResolution: "source_wins",
      mappingId: "map_razorpay_payment_fields",
      enabled: true,
      lastRunAt: createdAt,
      nextRunAt: undefined,
      metadata: { trigger: "payment.captured event" }
    }
  );

  state.dataMappings.push(
    {
      id: "map_hubspot_lead_fields",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "hubspot_lead_mapping",
      name: "HubSpot Lead Field Mapping",
      description: "Maps HubSpot contact fields to SalesOS lead fields",
      status: "active",
      sourceConnectorId: "conn_hubspot",
      targetConnectorId: "",
      fieldMappings: [
        { sourceField: "email", targetField: "email", transformType: "direct", required: true },
        { sourceField: "firstname", targetField: "firstName", transformType: "direct", required: true },
        { sourceField: "lastname", targetField: "lastName", transformType: "direct", required: true },
        { sourceField: "phone", targetField: "phoneNumber", transformType: "direct", required: false },
        { sourceField: "company", targetField: "company", transformType: "direct", required: false },
        { sourceField: "hs_lead_status", targetField: "status", transformType: "map", defaultValue: "new", required: false }
      ],
      transformations: [],
      tags: ["crm", "lead", "hubspot", "salesos"],
      metadata: {}
    },
    {
      id: "map_razorpay_payment_fields",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "razorpay_payment_mapping",
      name: "Razorpay Payment Field Mapping",
      description: "Maps Razorpay payment fields to FinanceOS invoice fields",
      status: "active",
      sourceConnectorId: "conn_razorpay",
      targetConnectorId: "",
      fieldMappings: [
        { sourceField: "id", targetField: "transactionId", transformType: "direct", required: true },
        { sourceField: "amount", targetField: "amount", transformType: "direct", required: true },
        { sourceField: "currency", targetField: "currency", transformType: "direct", required: true },
        { sourceField: "status", targetField: "paymentStatus", transformType: "map", defaultValue: "pending", required: true },
        { sourceField: "created_at", targetField: "paidAt", transformType: "format", defaultValue: undefined, required: false }
      ],
      transformations: [],
      tags: ["payment", "razorpay", "financeos"],
      metadata: {}
    }
  );

  state.connectedApps.push(
    {
      id: "app_hubspot_connection",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "HubSpot Production",
      provider: "hubspot",
      integrationId: "intg_hubspot_sales",
      status: "connected",
      accountInfo: { portalId: "12345678", plan: "Professional" },
      lastConnectedAt: createdAt,
      permissions: ["crm.objects.contacts.read", "crm.objects.contacts.write", "crm.objects.deals.read"],
      metadata: {}
    },
    {
      id: "app_razorpay_connection",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Razorpay Production",
      provider: "razorpay",
      integrationId: "intg_razorpay_finance",
      status: "connected",
      accountInfo: { accountId: "acc_demo123", merchantId: "demo_merchant" },
      lastConnectedAt: createdAt,
      permissions: ["payments", "refunds", "orders"],
      metadata: {}
    }
  );

  state.oauthConnections.push(
    {
      id: "oauth_hubspot_main",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      integrationId: "intg_hubspot_sales",
      provider: "hubspot",
      status: "active",
      accessToken: "demo_access_token_hubspot",
      refreshToken: "demo_refresh_token_hubspot",
      tokenType: "Bearer",
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      scopes: ["crm.objects.contacts.read", "crm.objects.contacts.write"],
      accountId: "hubspot_account_123",
      accountEmail: "integrations@appneural.com",
      metadata: {}
    },
    {
      id: "oauth_google_gmail",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      integrationId: "",
      provider: "google",
      status: "active",
      accessToken: "demo_access_token_google",
      refreshToken: "demo_refresh_token_google",
      tokenType: "Bearer",
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
      accountId: "google_user_456",
      accountEmail: "automation@appneural.com",
      metadata: {}
    }
  );

  state.templates.push(
    {
      id: "tpl_razorpay_invoice",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "razorpay_to_finance_invoice",
      name: "Razorpay to FinanceOS Invoice Template",
      description: "Syncs Razorpay payments to FinanceOS invoices",
      category: "payment",
      tags: ["razorpay", "financeos", "invoice", "payment"],
      connectorId: "conn_razorpay",
      config: {
        trigger: "payment.captured",
        actions: ["create_invoice", "send_receipt", "update_order_status"]
      },
      rating: 4.5,
      installs: 127,
      author: "APPNEURAL",
      status: "active",
      metadata: {}
    },
    {
      id: "tpl_hubspot_lead_sync",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "hubspot_to_salesos_lead",
      name: "HubSpot to SalesOS Lead Template",
      description: "Syncs leads from HubSpot to SalesOS",
      category: "crm",
      tags: ["hubspot", "salesos", "lead", "crm"],
      connectorId: "conn_hubspot",
      config: {
        trigger: "lead.created",
        actions: ["create_lead", "send_welcome_email", "assign_to_sales_rep"]
      },
      rating: 4.8,
      installs: 89,
      author: "APPNEURAL",
      status: "active",
      metadata: {}
    },
    {
      id: "tpl_github_issue_sync",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "github_to_support_issue",
      name: "GitHub Issue to SupportOS Ticket Template",
      description: "Creates SupportOS tickets from GitHub issues",
      category: "project_management",
      tags: ["github", "supportos", "issue", "ticket"],
      connectorId: "conn_github",
      config: {
        trigger: "issues.opened",
        actions: ["create_ticket", "notify_team", "assign_priority"]
      },
      rating: 4.2,
      installs: 45,
      author: "APPNEURAL",
      status: "active",
      metadata: {}
    }
  );

  state.logs.push(
    {
      id: "log_webhook_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      integrationId: "intg_razorpay_finance",
      connectorId: "conn_razorpay",
      action: "webhook.received",
      level: "info",
      message: "Payment captured webhook received",
      requestId: "req_123456",
      durationMs: 45,
      statusCode: 200,
      metadata: { event: "payment.captured", amount: 5000 }
    },
    {
      id: "log_sync_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      integrationId: "intg_hubspot_sales",
      connectorId: "conn_hubspot",
      action: "sync.completed",
      level: "info",
      message: "HubSpot to SalesOS sync completed",
      requestId: "sync_789",
      durationMs: 2340,
      metadata: { recordsSynced: 15, direction: "one-way" }
    }
  );

  state.errors.push(
    {
      id: "err_webhook_fail",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      integrationId: "intg_razorpay_finance",
      connectorId: "conn_razorpay",
      syncJobId: undefined,
      type: "connection",
      severity: "high",
      status: "open",
      message: "Webhook delivery failed: connection timeout",
      details: { webhookId: "wh_payment_captured", attempts: 3 },
      stackTrace: undefined,
      retryable: true,
      resolvedAt: undefined,
      resolvedBy: undefined
    }
  );

  return state;
}
