import { Router } from "../core/http";
import { GovernanceService } from "../service";
import { permissionsFor } from "../core/security";
import { docs } from "../docs";

export function registerRoutes(router: Router, service: GovernanceService): Router {
  router.get("/health", () => ({ service: "GovernanceOS", status: "ok", message: service.getRoutesSummary() }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
  router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsFor(actor.role) }));

  router.get("/governanceos/overview", ({ actor }) => service.overview(actor), "governance.read");

  router.get("/governanceos/directors", ({ actor }) => service.listDirectors(actor), "governance.director.read");
  router.post("/governanceos/directors", ({ body, actor }) => service.createDirector(body, actor), "governance.director.write");
  router.get("/governanceos/directors/:id", ({ params, actor }) => service.getDirector(params.id, actor), "governance.director.read");
  router.put("/governanceos/directors/:id", ({ params, body, actor }) => service.updateDirector(params.id, body, actor), "governance.director.write");

  router.get("/governanceos/committees", ({ actor }) => service.listCommittees(actor), "governance.committee.read");
  router.post("/governanceos/committees", ({ body, actor }) => service.createCommittee(body, actor), "governance.committee.write");
  router.get("/governanceos/committees/:id", ({ params, actor }) => service.getCommittee(params.id, actor), "governance.committee.read");

  router.get("/governanceos/meetings", ({ actor, query }) => service.listMeetings(actor, query), "governance.meeting.read");
  router.post("/governanceos/meetings", ({ body, actor }) => service.createMeeting(body, actor), "governance.meeting.write");
  router.get("/governanceos/meetings/:id", ({ params, actor }) => service.getMeeting(params.id, actor), "governance.meeting.read");
  router.put("/governanceos/meetings/:id", ({ params, body, actor }) => service.updateMeeting(params.id, body, actor), "governance.meeting.write");
  router.post("/governanceos/meetings/:id/agenda", ({ params, body, actor }) => service.addAgendaItem(params.id, body, actor), "governance.meeting.write");

  router.get("/governanceos/resolutions", ({ actor, query }) => service.listResolutions(actor, query), "governance.resolution.read");
  router.post("/governanceos/resolutions", ({ body, actor }) => service.createResolution(body, actor), "governance.resolution.write");
  router.get("/governanceos/resolutions/:id", ({ params, actor }) => service.getResolution(params.id, actor), "governance.resolution.read");
  router.put("/governanceos/resolutions/:id", ({ params, body, actor }) => service.updateResolution(params.id, body, actor), "governance.resolution.write");
  router.post("/governanceos/resolutions/:id/vote", ({ params, body, actor }) => service.voteOnResolution(params.id, body, actor), "governance.resolution.write");

  router.get("/governanceos/policies", ({ actor, query }) => service.listPolicies(actor, query), "governance.policy.read");
  router.post("/governanceos/policies", ({ body, actor }) => service.createPolicy(body, actor), "governance.policy.write");
  router.get("/governanceos/policies/:id", ({ params, actor }) => service.getPolicy(params.id, actor), "governance.policy.read");
  router.put("/governanceos/policies/:id", ({ params, body, actor }) => service.updatePolicy(params.id, body, actor), "governance.policy.write");
  router.post("/governanceos/policies/:id/acknowledge", ({ params, body, actor }) => service.acknowledgePolicy(params.id, body, actor), "governance.policy.write");

  router.get("/governanceos/decisions", ({ actor, query }) => service.listDecisions(actor, query), "governance.decision.read");
  router.post("/governanceos/decisions", ({ body, actor }) => service.createDecision(body, actor), "governance.decision.write");
  router.get("/governanceos/decisions/:id", ({ params, actor }) => service.getDecision(params.id, actor), "governance.decision.read");
  router.put("/governanceos/decisions/:id", ({ params, body, actor }) => service.updateDecision(params.id, body, actor), "governance.decision.write");

  router.get("/governanceos/exceptions", ({ actor, query }) => service.listExceptions(actor, query), "governance.exception.read");
  router.post("/governanceos/exceptions", ({ body, actor }) => service.createException(body, actor), "governance.exception.write");
  router.put("/governanceos/exceptions/:id", ({ params, body, actor }) => service.updateException(params.id, body, actor), "governance.exception.write");

  router.get("/governanceos/risks", ({ actor, query }) => service.listRiskOwnerships(actor, query), "governance.risk.read");
  router.post("/governanceos/risks", ({ body, actor }) => service.createRiskOwnership(body, actor), "governance.risk.write");
  router.put("/governanceos/risks/:id", ({ params, body, actor }) => service.updateRiskOwnership(params.id, body, actor), "governance.risk.write");

  router.get("/governanceos/raci", ({ actor }) => service.listRACIMatrices(actor), "governance.raci.read");
  router.post("/governanceos/raci", ({ body, actor }) => service.createRACIMatrix(body, actor), "governance.raci.write");

  router.get("/governanceos/approvals", ({ actor }) => service.listApprovalMatrices(actor), "governance.approval.read");
  router.post("/governanceos/approvals", ({ body, actor }) => service.createApprovalMatrix(body, actor), "governance.approval.write");

  router.get("/governanceos/reviews", ({ actor, query }) => service.listReviews(actor, query), "governance.review.read");
  router.post("/governanceos/reviews", ({ body, actor }) => service.createReview(body, actor), "governance.review.write");
  router.post("/governanceos/reviews/:id/findings", ({ params, body, actor }) => service.addReviewFinding(params.id, body, actor), "governance.review.write");
  router.post("/governanceos/reviews/:id/actions", ({ params, body, actor }) => service.addReviewActionItem(params.id, body, actor), "governance.review.write");

  router.get("/governanceos/audit", ({ actor }) => service.listAuditLogs(actor), "governance.audit.read");
  router.get("/governanceos/events", ({ actor }) => service.listEvents(actor), "governance.read");

  return router;
}
