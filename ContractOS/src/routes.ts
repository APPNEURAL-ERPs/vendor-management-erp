import { docs } from "./docs";
import { permissionsFor } from "./core/errors";
import { Router } from "./core/http";
import { ContractService } from "./service";

export function registerRoutes(router: Router, service: ContractService): Router {
  router.get("/health", () => ({ service: "ContractOS", status: "ok", message: "ContractOS is running" }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
  router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsFor(actor.role) }));

  router.get("/contractos/overview", ({ actor }) => service.overview(actor), "contract.read");

  router.get("/contractos/contracts", ({ actor, query }) => service.listContracts(actor, query), "contract.read");
  router.post("/contractos/contracts", ({ body, actor }) => service.createContract(body, actor), "contract.write");
  router.get("/contractos/contracts/:id", ({ params, actor }) => service.getContract(params.id, actor), "contract.read");
  router.patch("/contractos/contracts/:id", ({ params, body, actor }) => service.updateContract(params.id, body, actor), "contract.write");
  router.delete("/contractos/contracts/:id", ({ params, actor }) => service.deleteContract(params.id, actor), "contract.delete");
  router.post("/contractos/contracts/:id/submit-review", ({ params, actor }) => service.submitForReview(params.id, actor), "contract.write");
  router.post("/contractos/contracts/:id/submit-approval", ({ params, actor }) => service.submitForApproval(params.id, actor), "contract.write");
  router.post("/contractos/contracts/:id/approve", ({ params, body, actor }) => service.approveContract(params.id, body, actor), "contract.approve");
  router.post("/contractos/contracts/:id/sign", ({ params, body, actor }) => service.signContract(params.id, body, actor), "contract.sign");

  router.get("/contractos/parties", ({ actor }) => service.listParties(actor), "party.read");
  router.post("/contractos/parties", ({ body, actor }) => service.createParty(body, actor), "party.write");

  router.get("/contractos/clauses", ({ actor, query }) => service.listClauses(actor, query), "clause.read");
  router.post("/contractos/clauses", ({ body, actor }) => service.createClause(body, actor), "clause.write");

  router.get("/contractos/templates", ({ actor, query }) => service.listTemplates(actor, query), "template.read");
  router.post("/contractos/templates", ({ body, actor }) => service.createTemplate(body, actor), "template.write");

  router.get("/contractos/obligations", ({ actor, query }) => service.listObligations(actor, query), "obligation.read");
  router.post("/contractos/contracts/:id/obligations", ({ params, body, actor }) => service.createObligation(params.id, body, actor), "obligation.write");
  router.patch("/contractos/obligations/:id", ({ params, body, actor }) => service.updateObligation(params.id, body, actor), "obligation.write");

  router.get("/contractos/negotiations", ({ actor, query }) => service.listNegotiations(actor, query), "contract.read");
  router.post("/contractos/contracts/:id/negotiations", ({ params, actor }) => service.createNegotiation(params.id, actor), "contract.write");

  router.get("/contractos/signatures", ({ actor, query }) => service.listSignatures(actor, query), "contract.read");
  router.post("/contractos/contracts/:id/signatures", ({ params, body, actor }) => service.createSignature(params.id, body, actor), "contract.sign");

  router.get("/contractos/amendments", ({ actor, query }) => service.listAmendments(actor, query), "contract.read");
  router.post("/contractos/contracts/:id/amendments", ({ params, body, actor }) => service.createAmendment(params.id, body, actor), "contract.write");

  router.get("/contractos/risks", ({ actor, query }) => service.listRisks(actor, query), "contract.read");
  router.post("/contractos/contracts/:id/risks", ({ params, body, actor }) => service.createRisk(params.id, body, actor), "contract.write");

  router.get("/contractos/renewals", ({ actor, query }) => service.listRenewals(actor, query), "contract.read");
  router.post("/contractos/contracts/:id/renewals", ({ params, body, actor }) => service.createRenewal(params.id, body, actor), "contract.write");

  router.get("/contractos/audit", ({ actor }) => service.listAuditLogs(actor), "audit.read");

  return router;
}
