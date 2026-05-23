import { Router } from "../core/http";
import { getPermissions } from "../core/security";
import { docs } from "../docs";
import { PlatformService } from "../services/platform.service";

export function registerRoutes(router: Router, service: PlatformService): Router {
  router.get("/health", () => ({ status: "ok", service: "PlatformOS", time: new Date().toISOString() }));
  router.get("/docs", () => docs());
  router.get("/routes", () => router.listRoutes());

  router.get("/platformos/overview", ({ actor }) => service.overview(actor), "platform.overview.view");
  router.get("/platformos/permissions", ({ actor }) => ({ role: actor.role, permissions: getPermissions(actor.role) }), "platform.permission.view");

  router.get("/platformos/catalog", ({ actor }) => service.catalog(actor), "platform.service.view");
  router.post("/platformos/catalog/ingest", async ({ body, actor }) => service.ingestManifests(actor, body), "platform.service.create");

  router.get("/platformos/profile", ({ actor }) => service.getProfile(actor), "platform.profile.view");
  router.put("/platformos/profile", ({ body, actor }) => service.updateProfile(actor, body), "platform.profile.update");

  router.get("/platformos/services", ({ actor, query }) => service.listServices(actor, query), "platform.service.view");
  router.post("/platformos/services", ({ body, actor }) => service.createService(actor, body), "platform.service.create");
  router.put("/platformos/services/:key", ({ params, body, actor }) => service.updateService(actor, params.key, body), "platform.service.update");
  router.delete("/platformos/services/:key", ({ params, actor }) => service.archiveService(actor, params.key), "platform.service.delete");

  router.get("/platformos/environments", ({ actor }) => service.listEnvironments(actor), "platform.environment.view");
  router.post("/platformos/environments", ({ body, actor }) => service.createEnvironment(actor, body), "platform.environment.create");

  router.get("/platformos/deployments", ({ actor }) => service.listDeployments(actor), "platform.deployment.view");
  router.post("/platformos/deployments", ({ body, actor }) => service.createDeployment(actor, body), "platform.deployment.create");
  router.patch("/platformos/deployments/:id/status", ({ params, body, actor }) => service.updateDeploymentStatus(actor, params.id, body), "platform.deployment.update");

  router.get("/platformos/integrations", ({ actor }) => service.listIntegrations(actor), "platform.integration.view");
  router.post("/platformos/integrations", ({ body, actor }) => service.createIntegration(actor, body), "platform.integration.create");

  router.get("/platformos/feature-flags", ({ actor }) => service.listFeatureFlags(actor), "platform.flag.view");
  router.post("/platformos/feature-flags", ({ body, actor }) => service.createFeatureFlag(actor, body), "platform.flag.create");
  router.patch("/platformos/feature-flags/:key/toggle", ({ params, body, actor }) => service.toggleFeatureFlag(actor, params.key, body?.enabled), "platform.flag.update");

  router.get("/platformos/releases", ({ actor }) => service.listReleases(actor), "platform.release.view");
  router.post("/platformos/releases", ({ body, actor }) => service.createRelease(actor, body), "platform.release.create");
  router.patch("/platformos/releases/:key/status", ({ params, body, actor }) => service.updateReleaseStatus(actor, params.key, body), "platform.release.update");

  router.get("/platformos/health-checks", ({ actor }) => service.listHealthChecks(actor), "platform.health.view");
  router.post("/platformos/health-checks", ({ body, actor }) => service.recordHealthCheck(actor, body), "platform.health.record");

  router.get("/platformos/events", ({ actor }) => service.listEvents(actor), "platform.event.view");
  router.get("/platformos/audit", ({ actor }) => service.auditLogs(actor), "platform.audit.view");

  return router;
}
