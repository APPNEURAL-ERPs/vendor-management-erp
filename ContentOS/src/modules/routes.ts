import { docs } from "../docs";
import { permissionsFor } from "../core/security";
import { Router } from "../core/http";
import { ContentService } from "../service";

export function registerRoutes(router: Router, service: ContentService): Router {
  router.get("/health", () => ({ service: "ContentOS", status: "ok", message: service.getRoutesSummary() }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
  router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsFor(actor.role) }));

  router.get("/contentos/overview", ({ actor }) => service.overview(actor), "content.overview.view");

  router.get("/contentos/strategies", ({ actor }) => service.listStrategies(actor), "content.strategy.view");
  router.post("/contentos/strategies", ({ body, actor }) => service.createStrategy(body, actor), "content.strategy.create");

  router.get("/contentos/pillars", ({ actor }) => service.listPillars(actor), "content.pillar.view");
  router.post("/contentos/pillars", ({ body, actor }) => service.createPillar(body, actor), "content.pillar.create");

  router.get("/contentos/topics", ({ actor, query }) => service.listTopics(actor, query), "content.topic.view");
  router.post("/contentos/topics", ({ body, actor }) => service.createTopic(body, actor), "content.topic.create");

  router.get("/contentos/calendars", ({ actor }) => service.listCalendars(actor), "content.calendar.view");
  router.post("/contentos/calendars", ({ body, actor }) => service.createCalendar(body, actor), "content.calendar.create");

  router.get("/contentos/calendar-items", ({ actor, query }) => service.listCalendarItems(actor, query), "content.calendar.view");
  router.post("/contentos/calendar-items", ({ body, actor }) => service.createCalendarItem(body, actor), "content.calendar.create");

  router.get("/contentos/briefs", ({ actor }) => service.listBriefs(actor), "content.brief.view");
  router.post("/contentos/briefs", ({ body, actor }) => service.createBrief(body, actor), "content.brief.create");

  router.get("/contentos/posts", ({ actor, query }) => service.listPosts(actor, query), "content.post.view");
  router.post("/contentos/posts", ({ body, actor }) => service.createPost(body, actor), "content.post.create");
  router.patch("/contentos/posts/:id", ({ params, body, actor }) => service.updatePost(params.id, body, actor), "content.post.update");

  router.get("/contentos/blogs", ({ actor, query }) => service.listBlogs(actor, query), "content.blog.view");
  router.post("/contentos/blogs", ({ body, actor }) => service.createBlog(body, actor), "content.blog.create");
  router.patch("/contentos/blogs/:id", ({ params, body, actor }) => service.updateBlog(params.id, body, actor), "content.blog.update");

  router.get("/contentos/carousels", ({ actor }) => service.listCarousels(actor), "content.carousel.view");
  router.post("/contentos/carousels", ({ body, actor }) => service.createCarousel(body, actor), "content.carousel.create");

  router.get("/contentos/newsletters", ({ actor }) => service.listNewsletters(actor), "content.newsletter.view");
  router.post("/contentos/newsletters", ({ body, actor }) => service.createNewsletter(body, actor), "content.newsletter.create");

  router.get("/contentos/campaigns", ({ actor }) => service.listCampaigns(actor), "content.campaign.view");
  router.post("/contentos/campaigns", ({ body, actor }) => service.createCampaign(body, actor), "content.campaign.create");

  router.get("/contentos/templates", ({ actor }) => service.listTemplates(actor), "content.template.view");
  router.post("/contentos/templates", ({ body, actor }) => service.createTemplate(body, actor), "content.template.create");

  router.get("/contentos/keywords", ({ actor }) => service.listKeywords(actor), "content.seo.view");
  router.post("/contentos/keywords", ({ body, actor }) => service.createKeyword(body, actor), "content.seo.create");

  router.post("/contentos/quality/check", ({ body, actor }) => service.checkContentQuality(body, actor), "content.quality.check");

  router.get("/contentos/approvals", ({ actor }) => service.listApprovals(actor), "content.approval.view");
  router.post("/contentos/approvals", ({ body, actor }) => service.createApproval(body, actor), "content.approval.create");
  router.patch("/contentos/approvals/:id", ({ params, body, actor }) => service.updateApproval(params.id, body, actor), "content.approval.update");

  router.post("/contentos/generate/ideas", ({ body, actor }) => service.generatePostIdeas(body, actor), "content.post.create");
  router.post("/contentos/repurpose", ({ body, actor }) => service.repurposeContent(body, actor), "content.post.create");

  router.get("/contentos/audit", ({ actor }) => service.listAuditLogs(actor), "content.audit.view");

  return router;
}
