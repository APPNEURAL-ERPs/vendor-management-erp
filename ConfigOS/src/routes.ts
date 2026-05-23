import { docs } from "./docs";
import { Router } from "./core/http";
import { ConfigService } from "./service";

export function registerRoutes(router: Router, service: ConfigService): Router {
  router.get("/health", () => ({ service: "ConfigOS", status: "ok", timestamp: new Date().toISOString() }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));

  router.get("/configos/overview", ({ actor }) => service.getOverview(actor), "config.overview.view");

  router.get("/configos/configs", ({ actor, query }) => service.listConfigs(actor, {
    environment: query?.get("environment") || undefined,
    scope: query?.get("scope") || undefined,
    moduleId: query?.get("moduleId") || undefined,
    status: query?.get("status") || undefined,
    search: query?.get("search") || undefined
  }), "config.read");

  router.get("/configos/configs/resolve", ({ actor, query }) => {
    const key = query?.get("key");
    const environment = query?.get("environment");
    const tenantId = query?.get("tenantId");
    if (!key) throw new Error("key query parameter is required");
    return { key, value: service.resolveConfigValue(actor, key, environment || undefined, tenantId || undefined) };
  }, "config.read");

  router.get("/configos/configs/:id", ({ params, actor }) => service.getConfig(actor, params.id), "config.read");
  router.post("/configos/configs", ({ body, actor }) => service.createConfig(actor, body), "config.write");
  router.patch("/configos/configs/:id", ({ params, body, actor }) => service.updateConfig(actor, params.id, body), "config.write");
  router.delete("/configos/configs/:id", ({ params, actor }) => service.deleteConfig(actor, params.id), "config.write");

  router.post("/configos/configs/:id/rollback", ({ params, body, actor }) => {
    return service.rollbackConfig(actor, params.id, body.version);
  }, "config.rollback.perform");

  router.get("/configos/feature-flags", ({ actor, query }) => service.listFeatureFlags(actor, {
    environment: query?.get("environment") || undefined,
    enabled: query?.get("enabled") !== undefined ? query?.get("enabled") === "true" : undefined,
    status: query?.get("status") || undefined,
    search: query?.get("search") || undefined
  }), "config.feature_flag.manage");

  router.get("/configos/feature-flags/:id", ({ params, actor }) => service.getFeatureFlag(actor, params.id), "config.read");
  router.post("/configos/feature-flags", ({ body, actor }) => service.createFeatureFlag(actor, body), "config.feature_flag.manage");
  router.patch("/configos/feature-flags/:id", ({ params, body, actor }) => service.updateFeatureFlag(actor, params.id, body), "config.feature_flag.manage");
  router.post("/configos/feature-flags/:id/toggle", ({ params, actor }) => service.toggleFeatureFlag(actor, params.id), "config.feature_flag.manage");

  router.get("/configos/feature-flags/check/:key", ({ params, actor, query }) => {
    const tenantId = query?.get("tenantId");
    const userRole = query?.get("userRole");
    return { key: params.key, enabled: service.isFeatureEnabled(actor, params.key, tenantId || undefined, userRole || undefined) };
  }, "config.read");

  router.get("/configos/environments", ({ actor, query }) => service.listEnvironmentConfigs(actor, {
    environment: query?.get("environment") || undefined,
    status: query?.get("status") || undefined
  }), "config.read");

  router.get("/configos/environments/:id", ({ params, actor }) => service.getEnvironmentConfig(actor, params.id), "config.read");
  router.post("/configos/environments", ({ body, actor }) => service.createEnvironmentConfig(actor, body), "config.environment.manage");
  router.patch("/configos/environments/:id", ({ params, body, actor }) => service.updateEnvironmentConfig(actor, params.id, body), "config.environment.manage");

  router.get("/configos/tenants", ({ actor, query }) => service.listTenantSettings(actor, {
    tenantId: query?.get("tenantId") || undefined,
    category: query?.get("category") || undefined,
    status: query?.get("status") || undefined
  }), "config.tenant.manage");

  router.get("/configos/tenants/:id", ({ params, actor }) => service.getTenantSetting(actor, params.id), "config.read");
  router.post("/configos/tenants", ({ body, actor }) => service.createTenantSetting(actor, body), "config.tenant.manage");
  router.patch("/configos/tenants/:id", ({ params, body, actor }) => service.updateTenantSetting(actor, params.id, body), "config.tenant.manage");

  router.get("/configos/runtime-overrides", ({ actor, query }) => service.listRuntimeOverrides(actor, {
    environment: query?.get("environment") || undefined,
    moduleId: query?.get("moduleId") || undefined,
    status: query?.get("status") || undefined
  }), "config.read");

  router.get("/configos/runtime-overrides/:id", ({ params, actor }) => service.getRuntimeOverride(actor, params.id), "config.read");
  router.post("/configos/runtime-overrides", ({ body, actor }) => service.createRuntimeOverride(actor, body), "config.write");
  router.patch("/configos/runtime-overrides/:id", ({ params, body, actor }) => service.updateRuntimeOverride(actor, params.id, body), "config.write");

  return router;
}
