import { docs } from "../docs";
import { permissionsFor } from "../core/security";
import { Router } from "../core/http";
import { LocationService } from "../service";

export function registerRoutes(router: Router, service: LocationService): Router {
  router.get("/health", () => ({ service: "LocationOS", status: "ok", message: service.getRoutesSummary() }));
  router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));
  router.get("/permissions", ({ actor }) => ({ role: actor.role, permissions: permissionsFor(actor.role) }));

  router.get("/locationos/overview", ({ actor }) => service.overview(actor), "location.read");

  router.get("/locationos/locations", ({ actor, query }) => service.listLocations(actor, query), "location.read");
  router.post("/locationos/locations", ({ body, actor }) => service.createLocation(body, actor), "location.write");
  router.get("/locationos/locations/:id", ({ params, actor }) => service.getLocation(params.id, actor), "location.read");
  router.patch("/locationos/locations/:id", ({ params, body, actor }) => service.updateLocation(params.id, body, actor), "location.write");

  router.get("/locationos/addresses", ({ actor, query }) => service.listAddresses(actor, query), "location.read");
  router.post("/locationos/addresses", ({ body, actor }) => service.createAddress(body, actor), "location.write");
  router.get("/locationos/addresses/:id", ({ params, actor }) => service.getAddress(params.id, actor), "location.read");
  router.post("/locationos/addresses/:id/geocode", ({ params, actor }) => service.geocodeAddress(params.id, actor), "location.geocode");

  router.get("/locationos/zones", ({ actor, query }) => service.listZones(actor, query), "location.read");
  router.post("/locationos/zones", ({ body, actor }) => service.createZone(body, actor), "location.zone.write");
  router.get("/locationos/zones/:id", ({ params, actor }) => service.getZone(params.id, actor), "location.read");
  router.post("/locationos/zones/check-delivery", ({ body, actor }) => service.checkDeliveryAvailability(
    Number(body.latitude),
    Number(body.longitude),
    String(body.zoneId),
    actor
  ), "location.read");

  router.get("/locationos/routes", ({ actor, query }) => service.listRoutes(actor, query), "location.read");
  router.post("/locationos/routes", ({ body, actor }) => service.createRoute(body, actor), "location.route");
  router.get("/locationos/routes/:id", ({ params, actor }) => service.getRoute(params.id, actor), "location.read");
  router.post("/locationos/routes/calculate", ({ body, actor }) => service.calculateRoute(body.stops, String(body.travelMode ?? "car"), actor), "location.route");

  router.get("/locationos/geofences", ({ actor }) => service.listGeofences(actor), "location.read");
  router.post("/locationos/geofences", ({ body, actor }) => service.createGeofence(body, actor), "location.zone.write");
  router.get("/locationos/geofences/:id", ({ params, actor }) => service.getGeofence(params.id, actor), "location.read");
  router.post("/locationos/geofences/:id/check", ({ params, body, actor }) => service.checkGeofence(params.id, Number(body.latitude), Number(body.longitude), actor), "location.read");

  router.get("/locationos/checkins", ({ actor, query }) => service.listCheckins(actor, query), "location.read");
  router.post("/locationos/checkins", ({ body, actor }) => service.createCheckin(body, actor), "location.checkin");

  router.get("/locationos/field-visits", ({ actor, query }) => service.listFieldVisits(actor, query), "location.read");
  router.post("/locationos/field-visits", ({ body, actor }) => service.createFieldVisit(body, actor), "location.fieldvisit.write");
  router.get("/locationos/field-visits/:id", ({ params, actor }) => service.getFieldVisit(params.id, actor), "location.read");
  router.patch("/locationos/field-visits/:id", ({ params, body, actor }) => service.updateFieldVisit(params.id, body, actor), "location.fieldvisit.write");

  router.get("/locationos/venues", ({ actor }) => service.listVenues(actor), "location.read");
  router.post("/locationos/venues", ({ body, actor }) => service.createVenue(body, actor), "location.venue.write");
  router.get("/locationos/venues/:id", ({ params, actor }) => service.getVenue(params.id, actor), "location.read");

  router.get("/locationos/branches", ({ actor }) => service.listBranches(actor), "location.read");
  router.get("/locationos/branches/:id", ({ params, actor }) => service.getBranch(params.id, actor), "location.read");

  router.get("/locationos/nearby", ({ query, actor }) => service.searchNearby(
    Number(query.get("latitude")),
    Number(query.get("longitude")),
    Number(query.get("radius") ?? 10),
    String(query.get("type") ?? "all"),
    actor
  ), "location.nearby");

  router.get("/locationos/audit", ({ actor }) => service.listAuditLogs(actor), "location.audit.read");

  return router;
}
