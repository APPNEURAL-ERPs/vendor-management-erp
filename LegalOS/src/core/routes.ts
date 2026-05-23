import { docs } from "../docs";
import { Router } from "./http";
import { LegalService } from "../service";

export function registerRoutes(router: Router, service: LegalService): Router {
  router.get("/health", () => ({ service: "LegalOS", status: "ok" }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));

  router.get("/legalos/overview", ({ actor }) => service.overview(actor));

  router.get("/legalos/cases", ({ actor }) => service.listCases(actor));
  router.post("/legalos/cases", ({ body, actor }) => service.createCase(body, actor));
  router.get("/legalos/cases/:id", ({ params, actor }) => service.getCase(params.id, actor));
  router.patch("/legalos/cases/:id", ({ params, body, actor }) => service.updateCase(params.id, body, actor));

  router.get("/legalos/matters", ({ actor }) => service.listMatters(actor));
  router.post("/legalos/matters", ({ body, actor }) => service.createMatter(body, actor));
  router.get("/legalos/matters/:id", ({ params, actor }) => service.getMatter(params.id, actor));

  router.get("/legalos/contracts", ({ actor }) => service.listContracts(actor));
  router.post("/legalos/contracts", ({ body, actor }) => service.createContract(body, actor));
  router.get("/legalos/contracts/:id", ({ params, actor }) => service.getContract(params.id, actor));
  router.patch("/legalos/contracts/:id", ({ params, body, actor }) => service.updateContract(params.id, body, actor));
  router.post("/legalos/contracts/:id/clauses", ({ params, body, actor }) => service.addContractClause(params.id, body, actor));

  router.get("/legalos/ndas", ({ actor }) => service.listNDAs(actor));
  router.post("/legalos/ndas", ({ body, actor }) => service.createNDA(body, actor));
  router.get("/legalos/ndas/:id", ({ params, actor }) => service.getNDA(params.id, actor));

  router.get("/legalos/counsel", ({ actor }) => service.listCounsel(actor));
  router.post("/legalos/counsel", ({ body, actor }) => service.createCounsel(body, actor));
  router.get("/legalos/counsel/:id", ({ params, actor }) => service.getCounsel(params.id, actor));

  router.get("/legalos/invoices", ({ actor }) => service.listInvoices(actor));
  router.post("/legalos/invoices", ({ body, actor }) => service.createInvoice(body, actor));
  router.get("/legalos/invoices/:id", ({ params, actor }) => service.getInvoice(params.id, actor));

  router.get("/legalos/documents", ({ actor }) => service.listDocuments(actor));
  router.post("/legalos/documents", ({ body, actor }) => service.createDocument(body, actor));
  router.get("/legalos/documents/:id", ({ params, actor }) => service.getDocument(params.id, actor));

  router.get("/legalos/holds", ({ actor }) => service.listHolds(actor));
  router.post("/legalos/holds", ({ body, actor }) => service.createHold(body, actor));
  router.get("/legalos/holds/:id", ({ params, actor }) => service.getHold(params.id, actor));

  router.get("/legalos/disputes", ({ actor }) => service.listDisputes(actor));
  router.post("/legalos/disputes", ({ body, actor }) => service.createDispute(body, actor));
  router.get("/legalos/disputes/:id", ({ params, actor }) => service.getDispute(params.id, actor));

  router.get("/legalos/ip-assets", ({ actor }) => service.listIPAssets(actor));
  router.post("/legalos/ip-assets", ({ body, actor }) => service.createIPAsset(body, actor));
  router.get("/legalos/ip-assets/:id", ({ params, actor }) => service.getIPAsset(params.id, actor));

  router.get("/legalos/approvals", ({ actor }) => service.listApprovals(actor));
  router.post("/legalos/approvals", ({ body, actor }) => service.createApproval(body, actor));
  router.get("/legalos/approvals/:id", ({ params, actor }) => service.getApproval(params.id, actor));

  router.get("/legalos/templates", ({ actor }) => service.listTemplates(actor));
  router.get("/legalos/notices", ({ actor }) => service.listNotices(actor));

  router.get("/legalos/audit", ({ actor }) => service.listAuditLogs(actor));
  router.get("/legalos/events", ({ actor }) => service.listEvents(actor));

  return router;
}
