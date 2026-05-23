import { docs } from "../docs";
import { permissionsFor } from "../core/security";
import { Router } from "../core/http";
import { TemplateService } from "../service";

export function registerRoutes(router: Router, service: TemplateService): Router {
  router.get("/health", () => ({ service: "TemplateOS", status: "ok", message: service.getRoutesSummary() }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
  router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsFor(actor.role) }));

  router.get("/templateos/overview", ({ actor }) => service.overview(actor), "template.overview.view");

  router.get("/templateos/templates", ({ actor, query }) => service.listTemplates(actor, query), "template.read");
  router.post("/templateos/templates", ({ body, actor }) => service.createTemplate(body, actor), "template.create");
  router.get("/templateos/templates/:id", ({ params, actor }) => service.getTemplate(params.id, actor), "template.read");
  router.patch("/templateos/templates/:id", ({ params, body, actor }) => service.updateTemplate(params.id, body, actor), "template.update");
  router.delete("/templateos/templates/:id", ({ params, actor }) => service.deleteTemplate(params.id, actor), "template.delete");
  router.post("/templateos/templates/:id/versions", ({ params, body, actor }) => service.addTemplateVersion(params.id, body, actor), "template.create");
  router.post("/templateos/templates/:id/render", ({ params, body, actor }) => service.renderTemplate(params.id, body, actor), "template.render");
  router.post("/templateos/templates/:id/validate", ({ params, body, actor }) => service.validateTemplate(params.id, body, actor), "template.validate");

  router.get("/templateos/templates/key/:key", ({ params, actor }) => service.getTemplateByKey(params.key, actor), "template.read");

  router.get("/templateos/categories", ({ actor }) => service.listCategories(actor), "category.read");
  router.post("/templateos/categories", ({ body, actor }) => service.createCategory(body, actor), "category.create");

  router.get("/templateos/variables", ({ actor, query }) => service.listVariables(actor, query), "variable.read");
  router.post("/templateos/variables", ({ body, actor }) => service.createVariable(body, actor), "variable.create");

  router.get("/templateos/renders", ({ actor, query }) => service.listRenders(actor, query), "render.read");

  router.get("/templateos/audit", ({ actor }) => service.listAuditLogs(actor), "audit.read");

  return router;
}
