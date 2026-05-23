import { docs } from "../docs";
import { Router } from "../core/http";
import { InventoryService } from "../service";

export function registerRoutes(router: Router, service: InventoryService): Router {
  router.get("/health", () => ({ service: "InventoryOS", status: "ok", message: service.getRoutesSummary() }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));

  router.get("/inventory/overview", ({ actor }) => service.overview(actor), "inventory.item.read");

  router.get("/inventory/items", ({ actor, query }) => service.listItems(actor, query), "inventory.item.read");
  router.post("/inventory/items", ({ body, actor }) => service.createItem(body, actor), "inventory.item.write");
  router.get("/inventory/items/:id", ({ params, actor }) => service.getItem(params.id, actor), "inventory.item.read");
  router.patch("/inventory/items/:id", ({ params, body, actor }) => service.updateItem(params.id, body, actor), "inventory.item.write");
  router.get("/inventory/items/low-stock", ({ actor }) => service.getLowStockItems(actor), "inventory.item.read");

  router.get("/inventory/warehouses", ({ actor, query }) => service.listWarehouses(actor, query), "inventory.warehouse.read");
  router.get("/inventory/warehouses/:id", ({ params, actor }) => service.getWarehouse(params.id, actor), "inventory.warehouse.read");
  router.post("/inventory/warehouses", ({ body, actor }) => service.createWarehouse(body, actor), "inventory.warehouse.write");

  router.get("/inventory/stock", ({ actor, query }) => service.listStockLevels(actor, query), "inventory.stock.read");
  router.get("/inventory/stock/:itemId/:warehouseId", ({ params, actor }) => service.getStockLevel(params.itemId, params.warehouseId, actor), "inventory.stock.read");
  router.post("/inventory/stock/in", ({ body, actor }) => service.receiveStock(body, actor), "inventory.stock.write");
  router.post("/inventory/stock/out", ({ body, actor }) => service.issueStock(body, actor), "inventory.stock.write");

  router.get("/inventory/transfers", ({ actor, query }) => service.listTransfers(actor, query), "inventory.transfer.read");
  router.get("/inventory/transfers/:id", ({ params, actor }) => service.getTransfer(params.id, actor), "inventory.transfer.read");
  router.post("/inventory/transfers", ({ body, actor }) => service.createTransfer(body, actor), "inventory.transfer.write");
  router.post("/inventory/transfers/:id/approve", ({ params, actor }) => service.approveTransfer(params.id, actor), "inventory.transfer.write");
  router.post("/inventory/transfers/:id/receive", ({ params, body, actor }) => service.receiveTransfer(params.id, body, actor), "inventory.transfer.write");

  router.get("/inventory/adjustments", ({ actor, query }) => service.listAdjustments(actor, query), "inventory.adjustment.read");
  router.post("/inventory/adjustments", ({ body, actor }) => service.createAdjustment(body, actor), "inventory.adjustment.write");

  router.get("/inventory/audit", ({ actor }) => service.listAuditLogs(actor), "inventory.audit.read");

  return router;
}
