import { DataStore, IntegrationState } from "./core/datastore";
import {
  Connector,
  Integration,
  WebhookEndpoint,
  WebhookEvent,
  SyncRule,
  SyncJob,
  OAuthConnection,
  DataMapping,
  IntegrationError,
  IntegrationLog,
  IntegrationTemplate,
  ConnectedApp,
  ApiKey,
  IntegrationOverview,
  RequestActor
} from "./core/domain";
import { newId, nowIso, generateWebhookSecret } from "./core/id";
import { clone } from "./core/utils";

export class IntegrationService {
  constructor(private readonly store: DataStore) {}

  getOverview(tenantId: string): IntegrationOverview {
    const state = this.store.getState();
    const connectors = state.connectors.filter((c: any) => c.tenantId === tenantId);
    const integrations = state.integrations.filter((i: any) => i.tenantId === tenantId);
    const webhooks = state.webhookEndpoints.filter((w: any) => w.tenantId === tenantId);
    const syncJobs = state.syncJobs.filter((j: any) => j.tenantId === tenantId);
    const oauth = state.oauthConnections.filter((o: any) => o.tenantId === tenantId);
    const logs = state.logs.filter((l: any) => l.tenantId === tenantId);
    const errors = state.errors.filter((e: any) => e.tenantId === tenantId && e.status === "open");

    const byCategory: Record<string, number> = {};
    connectors.forEach((c: any) => {
      byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
    });

    return {
      connectors: {
        total: connectors.length,
        active: connectors.filter((c: any) => c.status === "active").length,
        byCategory
      },
      integrations: {
        total: integrations.length,
        healthy: integrations.filter((i: any) => i.healthStatus === "healthy").length,
        degraded: integrations.filter((i: any) => i.healthStatus === "degraded").length,
        down: integrations.filter((i: any) => i.healthStatus === "down").length
      },
      webhooks: {
        total: webhooks.length,
        active: webhooks.filter((w: any) => w.status === "active").length,
        recentDeliveries: state.webhookEvents.filter((e: any) => e.tenantId === tenantId).length,
        failures: state.webhookEvents.filter((e: any) => e.tenantId === tenantId && e.status === "failed").length
      },
      syncJobs: {
        total: syncJobs.length,
        completed: syncJobs.filter((j: any) => j.status === "completed").length,
        failed: syncJobs.filter((j: any) => j.status === "failed").length,
        running: syncJobs.filter((j: any) => j.status === "running").length
      },
      oauthConnections: {
        total: oauth.length,
        active: oauth.filter((o: any) => o.status === "active").length,
        expired: oauth.filter((o: any) => o.expiresAt && new Date(o.expiresAt) < new Date()).length
      },
      logs: {
        total: logs.length,
        errors: logs.filter((l: any) => l.level === "error").length,
        warnings: logs.filter((l: any) => l.level === "warn").length
      },
      errors: {
        total: errors.length,
        open: errors.filter((e: any) => e.status === "open").length,
        critical: errors.filter((e: any) => e.severity === "critical" && e.status === "open").length
      }
    };
  }

  listConnectors(tenantId: string): Connector[] {
    return this.store.getState().connectors.filter((c: any) => c.tenantId === tenantId);
  }

  getConnector(tenantId: string, id: string): Connector | undefined {
    return this.store.getState().connectors.find((c: any) => c.tenantId === tenantId && c.id === id);
  }

  createConnector(actor: RequestActor, data: Partial<Connector>): Connector {
    const now = nowIso();
    const connector: Connector = {
      id: newId("conn"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key: data.key ?? newId("connector"),
      name: data.name ?? "New Connector",
      description: data.description,
      category: data.category ?? "custom",
      type: data.type ?? "rest",
      status: data.status ?? "active",
      version: data.version ?? "1.0.0",
      baseUrl: data.baseUrl,
      authType: data.authType ?? "api_key",
      scopes: data.scopes ?? [],
      config: data.config ?? {},
      metadata: data.metadata ?? {}
    };
    this.store.getState().connectors.push(connector);
    this.store.save();
    this.store.audit(actor, "create", "connector", connector.id, undefined, connector);
    return connector;
  }

  updateConnector(actor: RequestActor, id: string, data: Partial<Connector>): Connector {
    const state = this.store.getState();
    const index = state.connectors.findIndex((c: any) => c.tenantId === actor.tenantId && c.id === id);
    if (index === -1) throw new Error("Connector not found");
    const before = clone(state.connectors[index]);
    state.connectors[index] = { ...state.connectors[index], ...data, updatedAt: nowIso() };
    this.store.save();
    this.store.audit(actor, "update", "connector", id, before, state.connectors[index]);
    return state.connectors[index];
  }

  listIntegrations(tenantId: string): Integration[] {
    return this.store.getState().integrations.filter((i: any) => i.tenantId === tenantId);
  }

  getIntegration(tenantId: string, id: string): Integration | undefined {
    return this.store.getState().integrations.find((i: any) => i.tenantId === tenantId && i.id === id);
  }

  createIntegration(actor: RequestActor, data: Partial<Integration>): Integration {
    const now = nowIso();
    const integration: Integration = {
      id: newId("intg"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name: data.name ?? "New Integration",
      description: data.description,
      connectorId: data.connectorId ?? "",
      status: data.status ?? "active",
      config: data.config ?? {},
      credentials: data.credentials,
      lastSyncAt: data.lastSyncAt,
      healthStatus: data.healthStatus ?? "unknown",
      metadata: data.metadata ?? {}
    };
    this.store.getState().integrations.push(integration);
    this.store.save();
    this.store.audit(actor, "create", "integration", integration.id, undefined, integration);
    return integration;
  }

  updateIntegration(actor: RequestActor, id: string, data: Partial<Integration>): Integration {
    const state = this.store.getState();
    const index = state.integrations.findIndex((i: any) => i.tenantId === actor.tenantId && i.id === id);
    if (index === -1) throw new Error("Integration not found");
    const before = clone(state.integrations[index]);
    state.integrations[index] = { ...state.integrations[index], ...data, updatedAt: nowIso() };
    this.store.save();
    this.store.audit(actor, "update", "integration", id, before, state.integrations[index]);
    return state.integrations[index];
  }

  listWebhooks(tenantId: string): WebhookEndpoint[] {
    return this.store.getState().webhookEndpoints.filter((w: any) => w.tenantId === tenantId);
  }

  getWebhook(tenantId: string, id: string): WebhookEndpoint | undefined {
    return this.store.getState().webhookEndpoints.find((w: any) => w.tenantId === tenantId && w.id === id);
  }

  createWebhook(actor: RequestActor, data: Partial<WebhookEndpoint>): WebhookEndpoint {
    const now = nowIso();
    const webhook: WebhookEndpoint = {
      id: newId("wh"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      integrationId: data.integrationId,
      name: data.name ?? "New Webhook",
      description: data.description,
      url: data.url ?? "",
      method: data.method ?? "POST",
      secret: data.secret ?? generateWebhookSecret(),
      status: data.status ?? "active",
      events: data.events ?? [],
      retryPolicy: data.retryPolicy ?? {
        maxAttempts: 3,
        initialDelayMs: 1000,
        backoffMultiplier: 2,
        maxDelayMs: 30000,
        retryableStatuses: [408, 429, 500, 502, 503, 504]
      },
      headers: data.headers ?? {},
      metadata: data.metadata ?? {}
    };
    this.store.getState().webhookEndpoints.push(webhook);
    this.store.save();
    this.store.audit(actor, "create", "webhook", webhook.id, undefined, webhook);
    return webhook;
  }

  updateWebhook(actor: RequestActor, id: string, data: Partial<WebhookEndpoint>): WebhookEndpoint {
    const state = this.store.getState();
    const index = state.webhookEndpoints.findIndex((w: any) => w.tenantId === actor.tenantId && w.id === id);
    if (index === -1) throw new Error("Webhook not found");
    const before = clone(state.webhookEndpoints[index]);
    state.webhookEndpoints[index] = { ...state.webhookEndpoints[index], ...data, updatedAt: nowIso() };
    this.store.save();
    this.store.audit(actor, "update", "webhook", id, before, state.webhookEndpoints[index]);
    return state.webhookEndpoints[index];
  }

  receiveWebhook(actor: RequestActor, webhookId: string, payload: Record<string, unknown>, headers: Record<string, string>): WebhookEvent {
    const now = nowIso();
    const event: WebhookEvent = {
      id: newId("whe"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      endpointId: webhookId,
      event: headers["x-webhook-event"] ?? "unknown",
      payload,
      headers,
      status: "received",
      attempts: 0,
      lastAttemptAt: now
    };
    this.store.getState().webhookEvents.push(event);
    this.store.save();
    this.store.audit(actor, "receive", "webhook_event", event.id, undefined, event);
    return event;
  }

  listSyncRules(tenantId: string): SyncRule[] {
    return this.store.getState().syncRules.filter((s: any) => s.tenantId === tenantId);
  }

  getSyncRule(tenantId: string, id: string): SyncRule | undefined {
    return this.store.getState().syncRules.find((s: any) => s.tenantId === tenantId && s.id === id);
  }

  createSyncRule(actor: RequestActor, data: Partial<SyncRule>): SyncRule {
    const now = nowIso();
    const syncRule: SyncRule = {
      id: newId("sync"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key: data.key ?? newId("sync_rule"),
      name: data.name ?? "New Sync Rule",
      description: data.description,
      status: data.status ?? "active",
      sourceIntegrationId: data.sourceIntegrationId ?? "",
      targetIntegrationId: data.targetIntegrationId ?? "",
      direction: data.direction ?? "one-way",
      mode: data.mode ?? "manual",
      schedule: data.schedule,
      filters: data.filters,
      conflictResolution: data.conflictResolution ?? "source_wins",
      mappingId: data.mappingId,
      enabled: data.enabled ?? true,
      lastRunAt: data.lastRunAt,
      nextRunAt: data.nextRunAt,
      metadata: data.metadata ?? {}
    };
    this.store.getState().syncRules.push(syncRule);
    this.store.save();
    this.store.audit(actor, "create", "sync_rule", syncRule.id, undefined, syncRule);
    return syncRule;
  }

  updateSyncRule(actor: RequestActor, id: string, data: Partial<SyncRule>): SyncRule {
    const state = this.store.getState();
    const index = state.syncRules.findIndex((s: any) => s.tenantId === actor.tenantId && s.id === id);
    if (index === -1) throw new Error("Sync rule not found");
    const before = clone(state.syncRules[index]);
    state.syncRules[index] = { ...state.syncRules[index], ...data, updatedAt: nowIso() };
    this.store.save();
    this.store.audit(actor, "update", "sync_rule", id, before, state.syncRules[index]);
    return state.syncRules[index];
  }

  runSyncJob(actor: RequestActor, syncRuleId: string): SyncJob {
    const now = nowIso();
    const job: SyncJob = {
      id: newId("job"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      syncRuleId,
      status: "running",
      direction: "one-way",
      mode: "manual",
      totalRecords: 0,
      syncedRecords: 0,
      failedRecords: 0,
      startedAt: now,
      logs: [{ timestamp: now, level: "info", message: "Sync job started" }],
      metadata: {}
    };
    this.store.getState().syncJobs.push(job);
    this.store.save();
    this.store.audit(actor, "run", "sync_job", job.id, undefined, job);
    return job;
  }

  listOAuthConnections(tenantId: string): OAuthConnection[] {
    return this.store.getState().oauthConnections.filter((o: any) => o.tenantId === tenantId);
  }

  createOAuthConnection(actor: RequestActor, data: Partial<OAuthConnection>): OAuthConnection {
    const now = nowIso();
    const oauth: OAuthConnection = {
      id: newId("oauth"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      integrationId: data.integrationId ?? "",
      provider: data.provider ?? "custom",
      status: data.status ?? "active",
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      tokenType: data.tokenType ?? "Bearer",
      expiresAt: data.expiresAt,
      scopes: data.scopes ?? [],
      accountId: data.accountId,
      accountEmail: data.accountEmail,
      metadata: data.metadata ?? {}
    };
    this.store.getState().oauthConnections.push(oauth);
    this.store.save();
    this.store.audit(actor, "create", "oauth_connection", oauth.id, undefined, oauth);
    return oauth;
  }

  updateOAuthConnection(actor: RequestActor, id: string, data: Partial<OAuthConnection>): OAuthConnection {
    const state = this.store.getState();
    const index = state.oauthConnections.findIndex((o: any) => o.tenantId === actor.tenantId && o.id === id);
    if (index === -1) throw new Error("OAuth connection not found");
    const before = clone(state.oauthConnections[index]);
    state.oauthConnections[index] = { ...state.oauthConnections[index], ...data, updatedAt: nowIso() };
    this.store.save();
    this.store.audit(actor, "update", "oauth_connection", id, before, state.oauthConnections[index]);
    return state.oauthConnections[index];
  }

  listLogs(tenantId: string, limit = 100): IntegrationLog[] {
    return this.store.getState().logs.filter((l: any) => l.tenantId === tenantId).slice(0, limit);
  }

  createLog(actor: RequestActor, data: Partial<IntegrationLog>): IntegrationLog {
    const now = nowIso();
    const log: IntegrationLog = {
      id: newId("log"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      integrationId: data.integrationId,
      connectorId: data.connectorId,
      action: data.action ?? "",
      level: data.level ?? "info",
      message: data.message ?? "",
      requestId: data.requestId,
      durationMs: data.durationMs,
      statusCode: data.statusCode,
      error: data.error,
      metadata: data.metadata ?? {}
    };
    this.store.getState().logs.push(log);
    this.store.save();
    return log;
  }

  listErrors(tenantId: string): IntegrationError[] {
    return this.store.getState().errors.filter((e: any) => e.tenantId === tenantId);
  }

  createError(actor: RequestActor, data: Partial<IntegrationError>): IntegrationError {
    const now = nowIso();
    const error: IntegrationError = {
      id: newId("err"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      integrationId: data.integrationId,
      connectorId: data.connectorId,
      syncJobId: data.syncJobId,
      type: data.type ?? "unknown",
      severity: data.severity ?? "medium",
      status: data.status ?? "open",
      message: data.message ?? "",
      details: data.details,
      stackTrace: data.stackTrace,
      retryable: data.retryable ?? true,
      resolvedAt: data.resolvedAt,
      resolvedBy: data.resolvedBy
    };
    this.store.getState().errors.push(error);
    this.store.save();
    this.store.audit(actor, "create", "error", error.id, undefined, error);
    return error;
  }

  resolveError(actor: RequestActor, id: string): IntegrationError {
    const state = this.store.getState();
    const index = state.errors.findIndex((e: any) => e.tenantId === actor.tenantId && e.id === id);
    if (index === -1) throw new Error("Error not found");
    const before = clone(state.errors[index]);
    state.errors[index].status = "resolved";
    state.errors[index].resolvedAt = nowIso();
    state.errors[index].resolvedBy = actor.userId;
    state.errors[index].updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "resolve", "error", id, before, state.errors[index]);
    return state.errors[index];
  }

  listTemplates(tenantId: string): IntegrationTemplate[] {
    return this.store.getState().templates.filter((t: any) => t.tenantId === tenantId || !t.tenantId);
  }

  listDataMappings(tenantId: string): DataMapping[] {
    return this.store.getState().dataMappings.filter((m: any) => m.tenantId === tenantId);
  }

  createDataMapping(actor: RequestActor, data: Partial<DataMapping>): DataMapping {
    const now = nowIso();
    const mapping: DataMapping = {
      id: newId("map"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key: data.key ?? newId("mapping"),
      name: data.name ?? "New Mapping",
      description: data.description,
      status: data.status ?? "active",
      sourceConnectorId: data.sourceConnectorId,
      targetConnectorId: data.targetConnectorId,
      fieldMappings: data.fieldMappings ?? [],
      transformations: data.transformations ?? [],
      tags: data.tags ?? [],
      metadata: data.metadata ?? {}
    };
    this.store.getState().dataMappings.push(mapping);
    this.store.save();
    this.store.audit(actor, "create", "data_mapping", mapping.id, undefined, mapping);
    return mapping;
  }

  listConnectedApps(tenantId: string): ConnectedApp[] {
    return this.store.getState().connectedApps.filter((a: any) => a.tenantId === tenantId);
  }

  createConnectedApp(actor: RequestActor, data: Partial<ConnectedApp>): ConnectedApp {
    const now = nowIso();
    const app: ConnectedApp = {
      id: newId("app"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name: data.name ?? "New App",
      provider: data.provider ?? "unknown",
      integrationId: data.integrationId ?? "",
      status: data.status ?? "pending",
      accountInfo: data.accountInfo,
      lastConnectedAt: data.lastConnectedAt,
      permissions: data.permissions ?? [],
      metadata: data.metadata ?? {}
    };
    this.store.getState().connectedApps.push(app);
    this.store.save();
    this.store.audit(actor, "create", "connected_app", app.id, undefined, app);
    return app;
  }

  listApiKeys(tenantId: string): ApiKey[] {
    return this.store.getState().apiKeys.filter((k: any) => k.tenantId === tenantId);
  }

  createApiKey(actor: RequestActor, data: Partial<ApiKey>): ApiKey {
    const now = nowIso();
    const apiKey: ApiKey = {
      id: newId("key"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      ownerId: data.ownerId ?? actor.userId,
      name: data.name ?? "New API Key",
      keyPrefix: data.keyPrefix ?? "ios_",
      keyHash: data.keyHash ?? newId("hash"),
      scopes: data.scopes ?? [],
      status: data.status ?? "active",
      expiresAt: data.expiresAt,
      lastUsedAt: data.lastUsedAt,
      createdBy: actor.userId
    };
    this.store.getState().apiKeys.push(apiKey);
    this.store.save();
    this.store.audit(actor, "create", "api_key", apiKey.id, undefined, apiKey);
    return apiKey;
  }

  getAuditLogs(tenantId: string, limit = 100): any[] {
    return this.store.getState().auditLogs.filter((a: any) => a.tenantId === tenantId).slice(0, limit);
  }
}
