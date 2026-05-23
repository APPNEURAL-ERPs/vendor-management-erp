import { Router } from "./core";
import { docs } from "./docs";
import { WebsiteService } from "./website.service";

const q = (query: URLSearchParams): Record<string, string> => Object.fromEntries(query.entries());

export function registerRoutes(router: Router, service: WebsiteService): Router {
  router.get("/health", () => ({ status: "ok", os: "WebsiteOS" }));
  router.get("/docs", () => ({ ...docs, routes: router.listRoutes() }));

  router.get("/websiteos/permissions", ({ actor }) => ({ role: actor.role, permissions: service.permissions(actor.role) }), "website.read");
  router.get("/websiteos/overview", ({ actor }) => service.overview(actor), "website.read");
  router.get("/websiteos/analytics", ({ actor, query }) => service.analytics(actor, q(query)), "website.analytics.read");
  router.post("/websiteos/analytics/events", ({ actor, body }) => service.recordAnalytics(actor, body), "website.analytics.read");

  router.get("/websiteos/sites", ({ actor, query }) => service.listSites(actor, q(query)), "website.read");
  router.post("/websiteos/sites", ({ actor, body }) => service.createSite(actor, body), "website.pages.write");
  router.get("/websiteos/sites/:id", ({ actor, params }) => service.getSite(actor, params.id), "website.read");
  router.put("/websiteos/sites/:id", ({ actor, params, body }) => service.updateSite(actor, params.id, body), "website.pages.write");

  router.get("/websiteos/domains", ({ actor, query }) => service.listDomains(actor, q(query)), "website.read");
  router.post("/websiteos/domains", ({ actor, body }) => service.addDomain(actor, body), "website.publish.write");
  router.post("/websiteos/domains/:id/verify", ({ actor, params }) => service.verifyDomain(actor, params.id), "website.publish.write");
  router.post("/websiteos/domains/:id/primary", ({ actor, params }) => service.setPrimaryDomain(actor, params.id), "website.publish.write");

  router.get("/websiteos/themes", ({ actor, query }) => service.listThemes(actor, q(query)), "website.read");
  router.post("/websiteos/themes", ({ actor, body }) => service.createTheme(actor, body), "website.themes.write");
  router.put("/websiteos/themes/:id", ({ actor, params, body }) => service.updateTheme(actor, params.id, body), "website.themes.write");
  router.post("/websiteos/themes/:id/activate", ({ actor, params }) => service.activateTheme(actor, params.id), "website.themes.write");

  router.get("/websiteos/pages", ({ actor, query }) => service.listPages(actor, q(query)), "website.read");
  router.post("/websiteos/pages", ({ actor, body }) => service.createPage(actor, body), "website.pages.write");
  router.get("/websiteos/pages/:id", ({ actor, params }) => service.getPage(actor, params.id), "website.read");
  router.put("/websiteos/pages/:id", ({ actor, params, body }) => service.updatePage(actor, params.id, body), "website.pages.write");
  router.post("/websiteos/pages/:id/publish", ({ actor, params }) => service.publishPage(actor, params.id), "website.publish.write");
  router.post("/websiteos/pages/:id/clone", ({ actor, params, body }) => service.clonePage(actor, params.id, body), "website.pages.write");
  router.post("/websiteos/pages/:id/blocks", ({ actor, params, body }) => service.addBlock(actor, params.id, body), "website.pages.write");
  router.post("/websiteos/pages/:id/blocks/reorder", ({ actor, params, body }) => service.reorderBlocks(actor, params.id, body), "website.pages.write");
  router.put("/websiteos/blocks/:id", ({ actor, params, body }) => service.updateBlock(actor, params.id, body), "website.pages.write");

  router.get("/websiteos/menus", ({ actor, query }) => service.listMenus(actor, q(query)), "website.read");
  router.post("/websiteos/menus", ({ actor, body }) => service.createMenu(actor, body), "website.menus.write");
  router.put("/websiteos/menus/:id", ({ actor, params, body }) => service.updateMenu(actor, params.id, body), "website.menus.write");
  router.post("/websiteos/menus/:id/items", ({ actor, params, body }) => service.addMenuItem(actor, params.id, body), "website.menus.write");
  router.delete("/websiteos/menus/:id/items/:itemId", ({ actor, params }) => service.removeMenuItem(actor, params.id, params.itemId), "website.menus.write");

  router.get("/websiteos/media", ({ actor, query }) => service.listMedia(actor, q(query)), "website.read");
  router.post("/websiteos/media", ({ actor, body }) => service.createMedia(actor, body), "website.media.write");
  router.put("/websiteos/media/:id", ({ actor, params, body }) => service.updateMedia(actor, params.id, body), "website.media.write");

  router.get("/websiteos/posts", ({ actor, query }) => service.listPosts(actor, q(query)), "website.read");
  router.post("/websiteos/posts", ({ actor, body }) => service.createPost(actor, body), "website.posts.write");
  router.put("/websiteos/posts/:id", ({ actor, params, body }) => service.updatePost(actor, params.id, body), "website.posts.write");
  router.post("/websiteos/posts/:id/publish", ({ actor, params }) => service.publishPost(actor, params.id), "website.publish.write");

  router.get("/websiteos/forms", ({ actor, query }) => service.listForms(actor, q(query)), "website.read");
  router.post("/websiteos/forms", ({ actor, body }) => service.createForm(actor, body), "website.forms.write");
  router.put("/websiteos/forms/:id", ({ actor, params, body }) => service.updateForm(actor, params.id, body), "website.forms.write");
  router.post("/websiteos/forms/:id/submit", ({ actor, params, body }) => service.submitForm(actor, params.id, body), "website.forms.write");
  router.get("/websiteos/submissions", ({ actor, query }) => service.listSubmissions(actor, q(query)), "website.submissions.read");
  router.post("/websiteos/submissions/:id/triage", ({ actor, params, body }) => service.triageSubmission(actor, params.id, body), "website.forms.write");

  router.get("/websiteos/redirects", ({ actor, query }) => service.listRedirects(actor, q(query)), "website.read");
  router.post("/websiteos/redirects", ({ actor, body }) => service.createRedirect(actor, body), "website.redirects.write");
  router.put("/websiteos/redirects/:id", ({ actor, params, body }) => service.updateRedirect(actor, params.id, body), "website.redirects.write");

  router.post("/websiteos/seo/pages/:id/audit", ({ actor, params }) => service.auditPageSeo(actor, params.id), "website.seo.write");
  router.get("/websiteos/seo/audits", ({ actor, query }) => service.listSeoAudits(actor, q(query)), "website.read");

  router.get("/websiteos/publish/snapshots", ({ actor, query }) => service.listSnapshots(actor, q(query)), "website.read");
  router.post("/websiteos/publish/snapshots", ({ actor, body }) => service.createSnapshot(actor, body), "website.publish.write");
  router.post("/websiteos/publish/snapshots/:id/deploy", ({ actor, params }) => service.deploySnapshot(actor, params.id), "website.publish.write");
  router.get("/websiteos/sitemap/:siteId", ({ actor, params }) => service.sitemap(actor, params.siteId), "website.read");
  router.get("/websiteos/robots/:siteId", ({ actor, params }) => service.robots(actor, params.siteId), "website.read");

  router.get("/websiteos/events", ({ actor }) => service.eventsLog(actor), "website.read");
  router.get("/websiteos/audit-logs", ({ actor }) => service.auditLogs(actor), "website.read");

  return router;
}
