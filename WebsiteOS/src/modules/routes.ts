import { Router, HttpContext } from "../core/http";
import { WebsiteService } from "../service";
import { nowIso } from "../core/utils";
import { getDocs } from "../docs";

export function registerRoutes(router: Router, service: WebsiteService): Router {
  router.get("/health", (ctx) => ({ ok: true, timestamp: nowIso() }));
  router.get("/docs", () => getDocs());

  router.get("/dashboard", (ctx) => service.getDashboard(ctx.actor));
  router.get("/websites", (ctx) => service.listWebsites(ctx.actor));
  router.post("/websites", (ctx) => service.createWebsite(ctx.actor, ctx.body));
  router.get("/websites/:id", (ctx) => service.getWebsite(ctx.actor, ctx.params.id));
  router.patch("/websites/:id", (ctx) => service.updateWebsite(ctx.actor, ctx.params.id, ctx.body));
  router.delete("/websites/:id", (ctx) => service.deleteWebsite(ctx.actor, ctx.params.id));

  router.get("/websites/:websiteId/pages", (ctx) => service.listPages(ctx.actor, ctx.params.websiteId));
  router.post("/websites/:websiteId/pages", (ctx) => service.createPage(ctx.actor, ctx.params.websiteId, ctx.body));

  router.get("/pages/:id", (ctx) => service.getPage(ctx.actor, ctx.params.id));
  router.patch("/pages/:id", (ctx) => service.updatePage(ctx.actor, ctx.params.id, ctx.body));
  router.post("/pages/:id/publish", (ctx) => service.publishPage(ctx.actor, ctx.params.id));
  router.delete("/pages/:id", (ctx) => service.deletePage(ctx.actor, ctx.params.id));

  router.get("/websites/:websiteId/landing-pages", (ctx) => service.listLandingPages(ctx.actor, ctx.params.websiteId));
  router.post("/websites/:websiteId/landing-pages", (ctx) => service.createLandingPage(ctx.actor, ctx.params.websiteId, ctx.body));

  router.get("/landing-pages/:id", (ctx) => service.getLandingPage(ctx.actor, ctx.params.id));
  router.patch("/landing-pages/:id", (ctx) => service.updateLandingPage(ctx.actor, ctx.params.id, ctx.body));

  router.get("/websites/:websiteId/forms", (ctx) => service.listForms(ctx.actor, ctx.params.websiteId));
  router.post("/websites/:websiteId/forms", (ctx) => service.createForm(ctx.actor, ctx.params.websiteId, ctx.body));

  router.get("/forms/:id", (ctx) => service.getForm(ctx.actor, ctx.params.id));
  router.patch("/forms/:id", (ctx) => service.updateForm(ctx.actor, ctx.params.id, ctx.body));
  router.post("/forms/:id/submissions", (ctx) => service.submitForm(ctx.actor, ctx.params.id, ctx.body.fields || {}, ctx.body.metadata || {}));
  router.get("/forms/:formId/submissions", (ctx) => service.listFormSubmissions(ctx.actor, ctx.params.formId));

  router.get("/submissions", (ctx) => service.listFormSubmissions(ctx.actor));

  router.get("/websites/:websiteId/ctas", (ctx) => service.listCTAs(ctx.actor, ctx.params.websiteId));
  router.post("/websites/:websiteId/ctas", (ctx) => service.createCTA(ctx.actor, ctx.params.websiteId, ctx.body));

  router.get("/websites/:websiteId/domains", (ctx) => service.listDomains(ctx.actor, ctx.params.websiteId));
  router.post("/websites/:websiteId/domains", (ctx) => service.createDomain(ctx.actor, ctx.params.websiteId, ctx.body.domain));

  router.get("/websites/:websiteId/deployments", (ctx) => service.listDeployments(ctx.actor, ctx.params.websiteId));
  router.post("/websites/:websiteId/deployments", (ctx) => service.createDeployment(ctx.actor, ctx.params.websiteId, ctx.body.environment));

  router.get("/websites/:websiteId/analytics", (ctx) => service.getAnalytics(ctx.actor, ctx.params.websiteId));
  router.post("/websites/:websiteId/analytics", (ctx) => service.createAnalytics(ctx.actor, ctx.params.websiteId, ctx.body));

  router.post("/websites/:websiteId/events", (ctx) => {
    const { event, category, data } = ctx.body;
    return service.trackEvent(ctx.actor, ctx.params.websiteId, event, category, data || {});
  });

  router.post("/websites/:websiteId/sitemap", (ctx) => service.createSitemap(ctx.actor, ctx.params.websiteId));

  router.post("/websites/:websiteId/audit/seo", (ctx) => service.runSEOAudit(ctx.actor, ctx.params.websiteId));
  router.post("/websites/:websiteId/audit/cro", (ctx) => service.runCROCheck(ctx.actor, ctx.params.websiteId, ctx.body?.pageId));

  return router;
}
