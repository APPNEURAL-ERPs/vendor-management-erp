import { docs } from "../docs";
import { permissionsFor } from "../core/security";
import { Router } from "../core/http";
import { DeliveryService } from "../service";

export function registerRoutes(router: Router, service: DeliveryService): Router {
  router.get("/health", () => ({ service: "DeliveryOS", status: "ok", message: service.getRoutesSummary() }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
  router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsFor(actor.role) }));

  router.get("/deliveryos/overview", ({ actor }) => service.overview(actor), "delivery.analytics.read");

  router.get("/deliveryos/orders", ({ actor, query }) => service.listOrders(actor, query), "delivery.order.read");
  router.post("/deliveryos/orders", ({ body, actor }) => service.createOrder(body, actor), "delivery.order.write");
  router.get("/deliveryos/orders/:id", ({ params, actor }) => service.getOrder(params.id, actor), "delivery.order.read");
  router.patch("/deliveryos/orders/:id", ({ params, body, actor }) => service.updateOrder(params.id, body, actor), "delivery.order.write");
  router.delete("/deliveryos/orders/:id", ({ params, actor }) => service.deleteOrder(params.id, actor), "delivery.order.write");
  router.post("/deliveryos/orders/:id/assign", ({ params, body, actor }) => service.assignDriver(params.id, String(body.driverId), actor), "delivery.order.write");
  router.post("/deliveryos/orders/:id/dispatch", ({ params, body, actor }) => service.dispatchOrder(params.id, body, actor), "delivery.shipment.write");

  router.get("/deliveryos/shipments", ({ actor, query }) => service.listShipments(actor, query), "delivery.shipment.read");
  router.get("/deliveryos/shipments/:id", ({ params, actor }) => service.getShipment(params.id, actor), "delivery.shipment.read");
  router.get("/deliveryos/shipments/:id/tracking", ({ params, actor }) => service.getShipmentTracking(params.id, actor), "delivery.tracking.read");
  router.patch("/deliveryos/shipments/:id/status", ({ params, body, actor }) => {
    const status = String(body.status);
    const location = String(body.location ?? "");
    return service.updateShipmentStatus(params.id, status as any, location, actor);
  }, "delivery.shipment.write");

  router.get("/deliveryos/drivers", ({ actor, query }) => service.listDrivers(actor, query), "delivery.driver.read");
  router.post("/deliveryos/drivers", ({ body, actor }) => service.createDriver(body, actor), "delivery.driver.write");
  router.get("/deliveryos/drivers/:id", ({ params, actor }) => service.getDriver(params.id, actor), "delivery.driver.read");
  router.patch("/deliveryos/drivers/:id/status", ({ params, body, actor }) => {
    const status = String(body.status);
    return service.updateDriverStatus(params.id, status as any, actor);
  }, "delivery.driver.write");

  router.get("/deliveryos/routes", ({ actor, query }) => service.listRoutes(actor, query), "delivery.route.read");
  router.post("/deliveryos/routes", ({ body, actor }) => service.createRoute(body, actor), "delivery.route.write");
  router.get("/deliveryos/routes/:id", ({ params, actor }) => service.getRoute(params.id, actor), "delivery.route.read");

  router.get("/deliveryos/proofs", ({ actor, query }) => service.listProofs(actor, query), "delivery.proof.read");
  router.post("/deliveryos/proofs", ({ body, actor }) => service.addProof(body, actor), "delivery.proof.write");

  router.get("/deliveryos/issues", ({ actor, query }) => service.listIssues(actor, query), "delivery.analytics.read");
  router.post("/deliveryos/issues", ({ body, actor }) => service.createIssue(body, actor), "delivery.order.write");

  router.get("/deliveryos/events", ({ actor }) => service.listEvents(actor), "delivery.analytics.read");
  router.get("/deliveryos/audit", ({ actor }) => service.listAuditLogs(actor), "delivery.audit.read");

  return router;
}
