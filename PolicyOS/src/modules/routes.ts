import { docs } from "../docs";
import { permissionsFor } from "../core/security";
import { Router } from "../core/http";
import { PolicyService } from "../service";

export function registerRoutes(router: Router, service: PolicyService): Router {
  router.get("/health", () => ({ service: "PolicyOS", status: "ok", message: service.getRoutesSummary() }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
  router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsFor(actor.role) }));

  router.get("/policyos/overview", ({ actor }) => service.overview(actor), "policy.overview.view");

  router.get("/policyos/policies", ({ actor, query }) => service.listPolicies(actor, query), "policy.read");
  router.post("/policyos/policies", ({ body, actor }) => service.createPolicy(body, actor), "policy.write");
  router.get("/policyos/policies/:id", ({ params, actor }) => service.getPolicy(params.id, actor), "policy.read");
  router.patch("/policyos/policies/:id", ({ params, body, actor }) => service.updatePolicy(params.id, body, actor), "policy.write");
  router.post("/policyos/policies/:id/publish", ({ params, actor }) => service.publishPolicy(params.id, actor), "policy.publish");
  router.post("/policyos/policies/:id/versions", ({ params, body, actor }) => service.addPolicyVersion(params.id, body, actor), "policy.write");

  router.get("/policyos/rules", ({ actor, query }) => service.listRules(actor, query), "policy.rule.read");
  router.post("/policyos/rules", ({ body, actor }) => service.createRule(body, actor), "policy.rule.write");
  router.get("/policyos/rules/:id", ({ params, actor }) => service.getRule(params.id, actor), "policy.rule.read");

  router.post("/policyos/evaluate", ({ body, actor }) => service.evaluateAccess(body, actor), "policy.enforce");
  router.get("/policyos/decisions", ({ actor, query }) => service.listDecisions(actor, query), "policy.decision.read");
  router.get("/policyos/enforcement-logs", ({ actor, query }) => service.listEnforcementLogs(actor, query), "policy.enforcement.view");

  router.get("/policyos/guardrails", ({ actor }) => service.listGuardrails(actor), "policy.guardrail.read");
  router.post("/policyos/guardrails", ({ body, actor }) => service.createGuardrail(body, actor), "policy.guardrail.write");
  router.post("/policyos/guardrails/evaluate", ({ body, actor }) => service.evaluateGuardrail(body, actor), "policy.enforce");

  router.get("/policyos/rate-limits", ({ actor }) => service.listRateLimits(actor), "policy.read");
  router.post("/policyos/rate-limits", ({ body, actor }) => service.createRateLimit(body, actor), "policy.write");

  router.get("/policyos/approval-rules", ({ actor }) => service.listApprovalRules(actor), "policy.read");
  router.post("/policyos/approval-rules", ({ body, actor }) => service.createApprovalRule(body, actor), "policy.write");

  router.get("/policyos/exceptions", ({ actor, query }) => service.listExceptions(actor, query), "policy.exception.read");
  router.post("/policyos/exceptions", ({ body, actor }) => service.createException(body, actor), "policy.exception.write");
  router.patch("/policyos/exceptions/:id", ({ params, body, actor }) => service.updateException(params.id, body, actor), "policy.exception.write");

  router.get("/policyos/violations", ({ actor, query }) => service.listViolations(actor, query), "policy.violation.read");
  router.post("/policyos/violations", ({ body, actor }) => service.createViolation(body, actor), "policy.violation.write");
  router.patch("/policyos/violations/:id", ({ params, body, actor }) => service.updateViolation(params.id, body, actor), "policy.violation.write");

  router.get("/policyos/acknowledgments", ({ actor, query }) => service.listAcknowledgments(actor, query), "policy.acknowledgment.read");
  router.post("/policyos/acknowledgments/:id/acknowledge", ({ params, actor }) => service.acknowledgePolicy(params.id, actor), "policy.acknowledgment.write");

  router.get("/policyos/reviews", ({ actor, query }) => service.listReviews(actor, query), "policy.review.read");
  router.post("/policyos/reviews", ({ body, actor }) => service.createReview(body, actor), "policy.review.write");
  router.patch("/policyos/reviews/:id", ({ params, body, actor }) => service.updateReview(params.id, body, actor), "policy.review.write");

  router.get("/policyos/events", ({ actor }) => service.listEvents(actor), "policy.read");
  router.get("/policyos/audit", ({ actor }) => service.listAuditLogs(actor), "policy.audit.read");

  return router;
}
