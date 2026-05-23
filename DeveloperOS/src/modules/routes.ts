import { docs } from "../docs";
import { permissionsFor } from "../core/http";
import { Router } from "../core/http";
import { DeveloperOSService } from "../service";

export function registerRoutes(router: Router, service: DeveloperOSService): Router {
  router.get("/health", () => ({ service: "DeveloperOS", status: "ok", message: service.getRoutesSummary() }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
  router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsFor(actor.role) }));

  router.get("/developeros/overview", ({ actor }) => service.overview(actor), "developer.item.read");

  router.get("/developeros/apis", ({ actor, query }) => service.listApis(actor, query), "developer.item.read");
  router.post("/developeros/apis", ({ body, actor }) => service.createApi(body, actor), "developer.item.write");
  router.get("/developeros/apis/:id", ({ params, actor }) => service.getApi(params.id, actor), "developer.item.read");
  router.put("/developeros/apis/:id", ({ params, body, actor }) => service.updateApi(params.id, body, actor), "developer.item.write");
  router.delete("/developeros/apis/:id", ({ params, actor }) => service.deleteApi(params.id, actor), "developer.item.write");

  router.get("/developeros/endpoints", ({ actor, query }) => service.listEndpoints(actor, query), "developer.item.read");
  router.post("/developeros/apis/:id/endpoints", ({ params, body, actor }) => service.createEndpoint(params.id, body, actor), "developer.item.write");

  router.get("/developeros/schemas", ({ actor, query }) => service.listSchemas(actor, query), "developer.item.read");
  router.post("/developeros/apis/:id/schemas", ({ params, body, actor }) => service.createSchema(params.id, body, actor), "developer.item.write");

  router.get("/developeros/sdks", ({ actor, query }) => service.listSDKs(actor, query), "developer.item.read");
  router.post("/developeros/sdks", ({ body, actor }) => service.createSDK(body, actor), "developer.sdk.generate");
  router.get("/developeros/sdks/:id", ({ params, actor }) => service.getSDK(params.id, actor), "developer.item.read");
  router.post("/developeros/sdks/generate", ({ body, actor }) => service.generateSDK(body.apiId, body, actor), "developer.sdk.generate");

  router.get("/developeros/clis", ({ actor, query }) => service.listCLIs(actor, query), "developer.item.read");
  router.post("/developeros/clis", ({ body, actor }) => service.createCLI(body, actor), "developer.cli.create");
  router.get("/developeros/clis/:id", ({ params, actor }) => service.getCLI(params.id, actor), "developer.item.read");

  router.get("/developeros/api-keys", ({ actor, query }) => service.listAPIKeys(actor, query), "developer.apikey.manage");
  router.post("/developeros/api-keys", ({ body, actor }) => service.createAPIKey(body.ownerId, body.ownerType, body, actor), "developer.apikey.manage");
  router.put("/developeros/api-keys/:id/revoke", ({ params, actor }) => service.revokeAPIKey(params.id, actor), "developer.apikey.manage");

  router.get("/developeros/service-accounts", ({ actor }) => service.listServiceAccounts(actor), "developer.item.read");
  router.post("/developeros/service-accounts", ({ body, actor }) => service.createServiceAccount(body, actor), "developer.item.write");
  router.get("/developeros/service-accounts/:id", ({ params, actor }) => service.getServiceAccount(params.id, actor), "developer.item.read");

  router.get("/developeros/webhooks", ({ actor, query }) => service.listWebhooks(actor, query), "developer.webhook.manage");
  router.post("/developeros/webhooks", ({ body, actor }) => service.createWebhook(body, actor), "developer.webhook.manage");
  router.get("/developeros/webhooks/:id", ({ params, actor }) => service.getWebhook(params.id, actor), "developer.webhook.manage");
  router.put("/developeros/webhooks/:id", ({ params, body, actor }) => service.updateWebhook(params.id, body, actor), "developer.webhook.manage");
  router.delete("/developeros/webhooks/:id", ({ params, actor }) => service.deleteWebhook(params.id, actor), "developer.webhook.manage");

  router.get("/developeros/sandboxes", ({ actor, query }) => service.listSandboxes(actor, query), "developer.sandbox.access");
  router.post("/developeros/sandboxes", ({ body, actor }) => service.createSandbox(body, actor), "developer.portal.manage");
  router.get("/developeros/sandboxes/:id", ({ params, actor }) => service.getSandbox(params.id, actor), "developer.sandbox.access");
  router.delete("/developeros/sandboxes/:id", ({ params, actor }) => service.deleteSandbox(params.id, actor), "developer.portal.manage");

  router.get("/developeros/developer-apps", ({ actor }) => service.listDeveloperApps(actor), "developer.item.read");
  router.post("/developeros/developer-apps", ({ body, actor }) => service.createDeveloperApp(body, actor), "developer.portal.manage");
  router.get("/developeros/developer-apps/:id", ({ params, actor }) => service.getDeveloperApp(params.id, actor), "developer.item.read");

  router.get("/developeros/events", ({ actor }) => service.listEvents(actor), "developer.item.read");
  router.post("/developeros/events", ({ body, actor }) => service.emitEvent(body, actor), "developer.item.write");

  router.get("/developeros/audit", ({ actor }) => service.listAuditLogs(actor), "developer.audit.read");

  return router;
}
