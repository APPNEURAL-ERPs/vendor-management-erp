import { Router, HttpContext } from "../core/http";
import { IntegrationService } from "../service";
import { requirePermission } from "../core/security";

export function registerRoutes(router: Router, service: IntegrationService): Router {
  router.get("/health", async (ctx: HttpContext) => {
    return { status: "healthy", timestamp: new Date().toISOString() };
  });

  router.get("/docs", async (ctx: HttpContext) => {
    const docs = await import("../docs");
    return docs.docs();
  });

  router.get("/integrationos", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.read");
    return service.getOverview(ctx.actor.tenantId);
  });

  router.get("/integrationos/connectors", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.connectors.read");
    return service.listConnectors(ctx.actor.tenantId);
  });

  router.post("/integrationos/connectors", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.connectors.manage");
    return service.createConnector(ctx.actor, ctx.body);
  });

  router.get("/integrationos/connectors/:id", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.connectors.read");
    const connector = service.getConnector(ctx.actor.tenantId, ctx.params.id);
    if (!connector) throw new Error("Connector not found");
    return connector;
  });

  router.patch("/integrationos/connectors/:id", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.connectors.manage");
    return service.updateConnector(ctx.actor, ctx.params.id, ctx.body);
  });

  router.get("/integrationos/integrations", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.read");
    return service.listIntegrations(ctx.actor.tenantId);
  });

  router.post("/integrationos/integrations", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.write");
    return service.createIntegration(ctx.actor, ctx.body);
  });

  router.get("/integrationos/integrations/:id", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.read");
    const integration = service.getIntegration(ctx.actor.tenantId, ctx.params.id);
    if (!integration) throw new Error("Integration not found");
    return integration;
  });

  router.patch("/integrationos/integrations/:id", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.write");
    return service.updateIntegration(ctx.actor, ctx.params.id, ctx.body);
  });

  router.get("/integrationos/webhooks", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.webhooks.read");
    return service.listWebhooks(ctx.actor.tenantId);
  });

  router.post("/integrationos/webhooks", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.webhooks.manage");
    return service.createWebhook(ctx.actor, ctx.body);
  });

  router.get("/integrationos/webhooks/:id", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.webhooks.read");
    const webhook = service.getWebhook(ctx.actor.tenantId, ctx.params.id);
    if (!webhook) throw new Error("Webhook not found");
    return webhook;
  });

  router.patch("/integrationos/webhooks/:id", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.webhooks.manage");
    return service.updateWebhook(ctx.actor, ctx.params.id, ctx.body);
  });

  router.post("/integrationos/webhooks/:id/test", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.webhooks.manage");
    const webhook = service.getWebhook(ctx.actor.tenantId, ctx.params.id);
    if (!webhook) throw new Error("Webhook not found");
    return { message: "Webhook test triggered", webhookId: ctx.params.id };
  });

  router.post("/integrationos/webhooks/:id/receive", async (ctx: HttpContext) => {
    const headers: Record<string, string> = {};
    ctx.req.headers && Object.entries(ctx.req.headers).forEach(([key, value]) => {
      headers[key] = Array.isArray(value) ? value[0] : (value ?? "");
    });
    return service.receiveWebhook(ctx.actor, ctx.params.id, ctx.body ?? {}, headers);
  });

  router.get("/integrationos/sync-rules", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.sync.read");
    return service.listSyncRules(ctx.actor.tenantId);
  });

  router.post("/integrationos/sync-rules", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.sync.manage");
    return service.createSyncRule(ctx.actor, ctx.body);
  });

  router.get("/integrationos/sync-rules/:id", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.sync.read");
    const rule = service.getSyncRule(ctx.actor.tenantId, ctx.params.id);
    if (!rule) throw new Error("Sync rule not found");
    return rule;
  });

  router.patch("/integrationos/sync-rules/:id", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.sync.manage");
    return service.updateSyncRule(ctx.actor, ctx.params.id, ctx.body);
  });

  router.post("/integrationos/sync-rules/:id/run", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.sync.manage");
    return service.runSyncJob(ctx.actor, ctx.params.id);
  });

  router.get("/integrationos/oauth", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.oauth.manage");
    return service.listOAuthConnections(ctx.actor.tenantId);
  });

  router.post("/integrationos/oauth", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.oauth.manage");
    return service.createOAuthConnection(ctx.actor, ctx.body);
  });

  router.patch("/integrationos/oauth/:id", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.oauth.manage");
    return service.updateOAuthConnection(ctx.actor, ctx.params.id, ctx.body);
  });

  router.get("/integrationos/logs", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.read");
    const limit = parseInt(ctx.query.get("limit") ?? "100");
    return service.listLogs(ctx.actor.tenantId, limit);
  });

  router.get("/integrationos/errors", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.read");
    return service.listErrors(ctx.actor.tenantId);
  });

  router.post("/integrationos/errors/:id/resolve", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.write");
    return service.resolveError(ctx.actor, ctx.params.id);
  });

  router.get("/integrationos/templates", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.marketplace.access");
    return service.listTemplates(ctx.actor.tenantId);
  });

  router.get("/integrationos/mappings", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.read");
    return service.listDataMappings(ctx.actor.tenantId);
  });

  router.post("/integrationos/mappings", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.write");
    return service.createDataMapping(ctx.actor, ctx.body);
  });

  router.get("/integrationos/connected-apps", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.read");
    return service.listConnectedApps(ctx.actor.tenantId);
  });

  router.post("/integrationos/connected-apps", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.write");
    return service.createConnectedApp(ctx.actor, ctx.body);
  });

  router.get("/integrationos/api-keys", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.read");
    return service.listApiKeys(ctx.actor.tenantId);
  });

  router.post("/integrationos/api-keys", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.write");
    return service.createApiKey(ctx.actor, ctx.body);
  });

  router.get("/integrationos/audit-logs", async (ctx: HttpContext) => {
    requirePermission(ctx.actor.role, "integration.read");
    const limit = parseInt(ctx.query.get("limit") ?? "100");
    return service.getAuditLogs(ctx.actor.tenantId, limit);
  });

  return router;
}
