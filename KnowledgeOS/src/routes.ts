import { docs } from "./docs";
import { permissionsFor } from "./core/http";
import { Router } from "./core/http";
import { KnowledgeService } from "./service";

export function registerRoutes(router: Router, service: KnowledgeService): Router {
  router.get("/health", () => ({ service: "KnowledgeOS", status: "ok", message: service.getRoutesSummary() }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
  router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsFor(actor.role) }));

  router.get("/knowledge/overview", ({ actor }) => service.overview(actor), "knowledge.overview.view");

  router.get("/knowledge/spaces", ({ actor }) => service.listSpaces(actor), "knowledge.space.read");
  router.post("/knowledge/spaces", ({ body, actor }) => service.createSpace(body, actor), "knowledge.space.write");
  router.get("/knowledge/spaces/:id", ({ params, actor }) => service.getSpace(params.id, actor), "knowledge.space.read");

  router.get("/knowledge/articles", ({ actor, query }) => service.listArticles(actor, query), "knowledge.article.read");
  router.post("/knowledge/articles", ({ body, actor }) => service.createArticle(body, actor), "knowledge.article.write");
  router.get("/knowledge/articles/:id", ({ params, actor }) => service.getArticle(params.id, actor), "knowledge.article.read");
  router.patch("/knowledge/articles/:id", ({ params, body, actor }) => service.updateArticle(params.id, body, actor), "knowledge.article.write");

  router.get("/knowledge/sops", ({ actor, query }) => service.listSOPs(actor, query), "knowledge.sop.read");
  router.post("/knowledge/sops", ({ body, actor }) => service.createSOP(body, actor), "knowledge.sop.write");
  router.get("/knowledge/sops/:id", ({ params, actor }) => service.getSOP(params.id, actor), "knowledge.sop.read");

  router.get("/knowledge/playbooks", ({ actor, query }) => service.listPlaybooks(actor, query), "knowledge.playbook.read");
  router.post("/knowledge/playbooks", ({ body, actor }) => service.createPlaybook(body, actor), "knowledge.playbook.write");

  router.get("/knowledge/faqs", ({ actor, query }) => service.listFAQs(actor, query), "knowledge.faq.read");
  router.post("/knowledge/faqs", ({ body, actor }) => service.createFAQ(body, actor), "knowledge.faq.write");

  router.get("/knowledge/decisions", ({ actor, query }) => service.listDecisions(actor, query), "knowledge.decision.read");
  router.post("/knowledge/decisions", ({ body, actor }) => service.createDecision(body, actor), "knowledge.decision.write");

  router.get("/knowledge/nodes", ({ actor }) => service.listNodes(actor), "knowledge.graph.read");
  router.post("/knowledge/nodes", ({ body, actor }) => service.createNode(body, actor), "knowledge.graph.write");
  router.post("/knowledge/edges", ({ body, actor }) => service.createGraphEdge(body, actor), "knowledge.graph.write");

  router.post("/knowledge/search", ({ body, actor }) => service.search(body, actor), "knowledge.search.execute");

  router.post("/knowledge/feedback", ({ body, actor }) => service.addFeedback(body, actor), "knowledge.feedback.write");
  router.post("/knowledge/reviews", ({ body, actor }) => service.createReview(body, actor), "knowledge.review.write");

  router.get("/knowledge/audit", ({ actor }) => service.listAuditLogs(actor), "knowledge.audit.read");

  return router;
}
