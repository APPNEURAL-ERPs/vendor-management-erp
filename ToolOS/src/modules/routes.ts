import { Router } from "../core/http";
import { getPermissions } from "../core/security";
import { docs } from "../docs";
import { ToolService } from "../services/tool.service";

export function registerRoutes(router: Router, service: ToolService): Router {
  router.get("/health", () => ({ status: "ok", service: "ToolOS", time: new Date().toISOString() }));
  router.get("/docs", () => docs());
  router.get("/routes", () => router.listRoutes());

  router.get("/v1/tools/overview", ({ actor }) => service.overview(actor), "tool.overview.view");
  router.get("/v1/tools/permissions", ({ actor }) => ({ role: actor.role, permissions: getPermissions(actor.role) }), "tool.permission.view");
  router.get("/v1/tools", ({ actor, query }) => service.listTools(actor, query), "tool.definitions.view");
  router.post("/v1/tools", ({ actor, body }) => service.createTool(actor, body), "tool.definitions.create");
  router.post("/v1/tools/manifests/validate", ({ body }) => service.validateManifest(body), "tool.definitions.view");
  router.post("/v1/tools/install", ({ actor, body }) => service.installManifest(actor, body), "tool.definitions.create");
  router.get("/v1/tools/discovery", ({ actor }) => service.discoverTools(actor), "tool.definitions.view");
  router.post("/v1/tools/generate", ({ actor, body }) => service.generateToolPackage(actor, body?.manifest, body?.outputDir ?? "generated-tools"), "tool.definitions.create");
  router.get("/v1/tools/analytics/usage", ({ actor }) => service.usageAnalytics(actor), "tool.executions.view");
  router.put("/v1/tools/:key", ({ actor, params, body }) => service.updateTool(actor, params.key, body), "tool.definitions.update");
  router.post("/v1/tools/:key/execute", ({ actor, params, body }) => service.executeTool(actor, params.key, body), "tool.executions.run");
  router.get("/v1/tools/executions", ({ actor }) => service.listExecutions(actor), "tool.executions.view");
  router.get("/v1/tools/approvals", ({ actor }) => service.listApprovals(actor), "tool.approvals.view");
  router.post("/v1/tools/approvals/:id/approve", ({ actor, params, body }) => service.approve(actor, params.id, body?.note), "tool.approvals.manage");
  router.post("/v1/tools/approvals/:id/reject", ({ actor, params, body }) => service.reject(actor, params.id, body?.note), "tool.approvals.manage");
  router.get("/v1/tools/policies", ({ actor }) => service.listPolicies(actor), "tool.policies.view");
  router.post("/v1/tools/policies", ({ actor, body }) => service.createPolicy(actor, body), "tool.policies.manage");
  router.get("/v1/tools/credentials", ({ actor }) => service.listCredentials(actor), "tool.credentials.view");
  router.post("/v1/tools/credentials", ({ actor, body }) => service.createCredential(actor, body), "tool.credentials.manage");
  router.get("/v1/tools/events", ({ actor }) => service.listEvents(actor), "tool.event.view");
  router.get("/v1/tools/audit", ({ actor }) => service.auditLogs(actor), "tool.audit.view");
  return router;
}
