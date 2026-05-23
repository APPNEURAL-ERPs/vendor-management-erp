import { docs } from "./docs";
import { Router } from "./core/http";
import { ProcurementService } from "./service";

export function registerRoutes(router: Router, service: ProcurementService): Router {
  router.get("/health", () => ({ service: "ProcurementOS", status: "ok", message: "ProcurementOS is running" }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));

  router.get("/procurementos/overview", ({ actor }) => service.overview(actor), "procurement.overview.view");

  router.get("/procurementos/vendors", ({ actor, query }) => service.listVendors(actor, query), "procurement.vendor.read");
  router.post("/procurementos/vendors", ({ body, actor }) => service.createVendor(body, actor), "procurement.vendor.write");

  router.get("/procurementos/requests", ({ actor, query }) => service.listPurchaseRequests(actor, query), "procurement.request.read");
  router.post("/procurementos/requests", ({ body, actor }) => service.createPurchaseRequest(body, actor), "procurement.request.write");
  router.get("/procurementos/requests/:id", ({ params, actor }) => service.getPurchaseRequest(params.id, actor), "procurement.request.read");
  router.post("/procurementos/requests/:id/submit", ({ params, actor }) => service.submitPurchaseRequest(params.id, actor), "procurement.request.write");
  router.post("/procurementos/requests/:id/approve", ({ params, body, actor }) => service.approvePurchaseRequest(params.id, body, actor), "procurement.approval.write");
  router.post("/procurementos/requests/:id/reject", ({ params, body, actor }) => service.rejectPurchaseRequest(params.id, body, actor), "procurement.approval.write");

  router.get("/procurementos/purchase-orders", ({ actor, query }) => service.listPurchaseOrders(actor, query), "procurement.order.read");
  router.post("/procurementos/purchase-orders", ({ body, actor }) => service.createPurchaseOrder(body, actor), "procurement.order.write");
  router.get("/procurementos/purchase-orders/:id", ({ params, actor }) => service.getPurchaseOrder(params.id, actor), "procurement.order.read");
  router.post("/procurementos/purchase-orders/:id/send", ({ params, actor }) => service.sendPurchaseOrder(params.id, actor), "procurement.order.write");
  router.post("/procurementos/purchase-orders/:id/acknowledge", ({ params, actor }) => service.acknowledgePurchaseOrder(params.id, actor), "procurement.order.write");

  router.get("/procurementos/receipts", ({ actor, query }) => service.listReceipts(actor, query), "procurement.receipt.read");
  router.get("/procurementos/receipts/:id", ({ params, actor }) => service.getReceipt(params.id, actor), "procurement.receipt.read");
  router.post("/procurementos/receipts", ({ body, actor }) => service.createReceipt(body, actor), "procurement.receipt.write");

  router.get("/procurementos/rfqs", ({ actor, query }) => service.listRFQs(actor, query), "procurement.rfq.read");
  router.post("/procurementos/rfqs", ({ body, actor }) => service.createRFQ(body, actor), "procurement.rfq.write");

  router.get("/procurementos/quotes", ({ actor, query }) => service.listQuotes(actor, query), "procurement.quote.read");
  router.post("/procurementos/quotes", ({ body, actor }) => service.createQuote(body, actor), "procurement.quote.write");

  router.get("/procurementos/budgets", ({ actor, query }) => service.listBudgetAllocations(actor, query), "procurement.budget.read");
  router.get("/procurementos/budgets/:id", ({ params, actor }) => service.getBudgetAllocation(params.id, actor), "procurement.budget.read");

  router.get("/procurementos/audit", ({ actor }) => service.listAuditLogs(actor), "procurement.audit.read");
  router.get("/procurementos/events", ({ actor }) => service.listEvents(actor), "procurement.event.read");

  return router;
}
