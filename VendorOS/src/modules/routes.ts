import { Router } from "../core/http";
import { VendorService } from "../service";
import { docs } from "../docs";

export function registerRoutes(router: Router, service: VendorService): Router {
  router.get("/health", () => ({ service: "VendorOS", status: "ok", message: "VendorOS is running" }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));

  router.get("/vendoros/overview", ({ actor }) => service.overview(actor));

  router.get("/vendoros/vendors", ({ actor, query }) => service.listVendors(actor, query));
  router.post("/vendoros/vendors", ({ body, actor }) => service.createVendor(body, actor));
  router.get("/vendoros/vendors/:id", ({ params, actor }) => service.getVendor(params.id, actor));
  router.patch("/vendoros/vendors/:id", ({ params, body, actor }) => service.updateVendor(params.id, body, actor));
  router.post("/vendoros/vendors/:id/approve", ({ params, body, actor }) => service.approveVendor(params.id, body, actor));
  router.post("/vendoros/vendors/:id/reject", ({ params, body, actor }) => service.rejectVendor(params.id, body, actor));
  router.post("/vendoros/vendors/:id/suspend", ({ params, body, actor }) => service.suspendVendor(params.id, body, actor));
  router.post("/vendoros/vendors/:id/activate", ({ params, actor }) => service.activateVendor(params.id, actor));

  router.get("/vendoros/categories", ({ actor }) => service.listCategories(actor));
  router.post("/vendoros/categories", ({ body, actor }) => service.createCategory(body, actor));

  router.get("/vendoros/contracts", ({ actor, query }) => service.listContracts(actor, query));
  router.post("/vendoros/contracts", ({ body, actor }) => service.createContract(body, actor));

  router.get("/vendoros/documents", ({ actor, query }) => service.listDocuments(actor, query));
  router.post("/vendoros/documents", ({ body, actor }) => service.createDocument(body, actor));

  router.get("/vendoros/onboarding", ({ actor, query }) => service.listOnboardingRecords(actor, query));
  router.post("/vendoros/onboarding", ({ body, actor }) => service.createOnboarding(body, actor));

  router.get("/vendoros/performance", ({ actor, query }) => service.listPerformanceRecords(actor, query));
  router.post("/vendoros/performance", ({ body, actor }) => service.createPerformance(body, actor));

  router.get("/vendoros/risks", ({ actor, query }) => service.listRiskRecords(actor, query));
  router.post("/vendoros/risks", ({ body, actor }) => service.createRisk(body, actor));

  router.get("/vendoros/invoices", ({ actor, query }) => service.listInvoices(actor, query));
  router.post("/vendoros/invoices", ({ body, actor }) => service.createInvoice(body, actor));

  router.get("/vendoros/payments", ({ actor, query }) => service.listPayments(actor, query));
  router.post("/vendoros/payments", ({ body, actor }) => service.createPayment(body, actor));

  router.get("/vendoros/issues", ({ actor, query }) => service.listIssues(actor, query));
  router.post("/vendoros/issues", ({ body, actor }) => service.createIssue(body, actor));

  router.get("/vendoros/subscriptions", ({ actor, query }) => service.listSubscriptions(actor, query));
  router.post("/vendoros/subscriptions", ({ body, actor }) => service.createSubscription(body, actor));

  router.get("/vendoros/audit", ({ actor }) => service.listAuditLogs(actor));

  return router;
}
