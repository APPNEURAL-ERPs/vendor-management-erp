import { createServer } from "http";
import { resolve } from "path";
import { DataStore } from "./core/datastore";
import { Router, requireString, asNumber, asBoolean, asArray } from "./core/utils";
import { ResourceService } from "./service";
import { ResourceCategory, ResourceStatus } from "./domain";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 11800;
const DATA_DIR = process.env.DATA_DIR ?? resolve(__dirname, "..", "data");
const DATA_FILE = resolve(DATA_DIR, "resourceos-state.json");

console.log("Starting ResourceOS...");
console.log(`Data file: ${DATA_FILE}`);

const store = new DataStore(DATA_FILE);
const service = new ResourceService(store);
const router = new Router();

router.get("/health", (ctx) => ({
  status: "ok",
  service: "ResourceOS",
  version: "1.0.0",
  timestamp: new Date().toISOString(),
}));

router.get("/docs", (ctx) => ({
  title: "ResourceOS API Documentation",
  version: "1.0.0",
  description: "Resource allocation, capacity planning, utilization tracking, and resource booking",
  endpoints: router.listRoutes(),
}));

router.post("/resources", (ctx) => {
  const data = ctx.body;
  return service.createResource(ctx.actor, {
    name: requireString(data, "name"),
    category: requireString(data, "category") as ResourceCategory,
    type: requireString(data, "type"),
    description: data.description,
    ownerId: data.ownerId,
    skills: asArray(data.skills),
    maxHoursPerDay: asNumber(data.maxHoursPerDay),
    maxHoursPerWeek: asNumber(data.maxHoursPerWeek),
    maxHoursPerMonth: asNumber(data.maxHoursPerMonth),
    maxUnits: asNumber(data.maxUnits),
    hourlyRate: asNumber(data.hourlyRate),
    dailyRate: asNumber(data.dailyRate),
    monthlyRate: asNumber(data.monthlyRate),
    currency: data.currency,
    billable: asBoolean(data.billable),
    location: data.location,
    tags: asArray(data.tags),
    metadata: data.metadata,
  });
}, "resource.write");

router.get("/resources", (ctx) => {
  return service.listResources(ctx.actor, {
    category: ctx.query.get("category") as ResourceCategory | undefined,
    status: ctx.query.get("status") as ResourceStatus | undefined,
    skill: ctx.query.get("skill") ?? undefined,
    search: ctx.query.get("search") ?? undefined,
  });
}, "resource.read");

router.get("/resources/:id", (ctx) => {
  return service.getResource(ctx.actor, ctx.params.id);
}, "resource.read");

router.patch("/resources/:id", (ctx) => {
  return service.updateResource(ctx.actor, ctx.params.id, ctx.body);
}, "resource.write");

router.delete("/resources/:id", (ctx) => {
  service.deleteResource(ctx.actor, ctx.params.id);
  return { deleted: true };
}, "resource.admin");

router.post("/resources/search", (ctx) => {
  const data = ctx.body;
  return service.searchResources(ctx.actor, {
    category: data.category as ResourceCategory | undefined,
    skills: asArray(data.skills),
    availableFrom: data.availableFrom,
    availableTo: data.availableTo,
    minUtilization: asNumber(data.minUtilization),
    maxUtilization: asNumber(data.maxUtilization),
    search: data.search,
  });
}, "resource.read");

router.post("/allocations", (ctx) => {
  const data = ctx.body;
  return service.createAllocation(ctx.actor, {
    resourceId: requireString(data, "resourceId"),
    allocationType: requireString(data, "allocationType"),
    projectId: data.projectId,
    taskId: data.taskId,
    startDate: requireString(data, "startDate"),
    endDate: requireString(data, "endDate"),
    allocationPercent: asNumber(data.allocationPercent),
    hoursPerWeek: asNumber(data.hoursPerWeek),
    status: data.status,
    notes: data.notes,
  });
}, "resource.allocate");

router.get("/allocations", (ctx) => {
  return store.getState().allocations.filter((a) => a.tenantId === ctx.actor.tenantId);
}, "resource.read");

router.get("/allocations/:id", (ctx) => {
  const allocation = store.getState().allocations.find(
    (a) => a.id === ctx.params.id && a.tenantId === ctx.actor.tenantId
  );
  if (!allocation) {
    throw new Error(`Allocation ${ctx.params.id} not found`);
  }
  return allocation;
}, "resource.read");

router.post("/bookings", (ctx) => {
  const data = ctx.body;
  return service.createBooking(ctx.actor, {
    resourceId: requireString(data, "resourceId"),
    bookingType: requireString(data, "bookingType"),
    startDate: requireString(data, "startDate"),
    endDate: requireString(data, "endDate"),
    startTime: data.startTime,
    endTime: data.endTime,
    attendees: asNumber(data.attendees),
    purpose: data.purpose,
    status: data.status,
    notes: data.notes,
  });
}, "resource.book");

router.get("/bookings", (ctx) => {
  return store.getState().bookings.filter((b) => b.tenantId === ctx.actor.tenantId);
}, "resource.read");

router.get("/bookings/:id", (ctx) => {
  const booking = store.getState().bookings.find(
    (b) => b.id === ctx.params.id && b.tenantId === ctx.actor.tenantId
  );
  if (!booking) {
    throw new Error(`Booking ${ctx.params.id} not found`);
  }
  return booking;
}, "resource.read");

router.get("/resources/:id/availability", (ctx) => {
  const startDate = ctx.query.get("startDate") ?? new Date().toISOString().split("T")[0];
  const endDate = ctx.query.get("endDate") ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  return service.getResourceAvailability(ctx.actor, ctx.params.id, startDate, endDate);
}, "resource.read");

router.get("/resources/:id/utilization", (ctx) => {
  const periodStart = ctx.query.get("periodStart") ?? new Date().toISOString().split("T")[0];
  const periodEnd = ctx.query.get("periodEnd") ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const existing = service.getResourceUtilization(ctx.actor, ctx.params.id, periodStart, periodEnd);
  if (existing) {
    return existing;
  }

  return service.calculateResourceUtilization(ctx.actor, ctx.params.id, periodStart, periodEnd);
}, "resource.read");

router.post("/resources/:id/utilization/calculate", (ctx) => {
  const data = ctx.body;
  const periodStart = data.periodStart ?? new Date().toISOString().split("T")[0];
  const periodEnd = data.periodEnd ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  return service.calculateResourceUtilization(ctx.actor, ctx.params.id, periodStart, periodEnd);
}, "resource.read");

router.post("/skills", (ctx) => {
  const data = ctx.body;
  return service.createSkill(ctx.actor, {
    resourceId: requireString(data, "resourceId"),
    skillName: requireString(data, "skillName"),
    proficiencyLevel: requireString(data, "proficiencyLevel"),
    yearsOfExperience: asNumber(data.yearsOfExperience),
    certifications: asArray(data.certifications),
    verified: asBoolean(data.verified),
  });
}, "resource.write");

router.get("/skills", (ctx) => {
  const resourceId = ctx.query.get("resourceId");
  let skills = store.getState().skills.filter((s) => s.tenantId === ctx.actor.tenantId);
  if (resourceId) {
    skills = skills.filter((s) => s.resourceId === resourceId);
  }
  return skills;
}, "resource.read");

router.post("/pools", (ctx) => {
  const data = ctx.body;
  return service.createPool(ctx.actor, {
    name: requireString(data, "name"),
    description: data.description,
    poolType: requireString(data, "poolType"),
    resourceIds: asArray(data.resourceIds),
    ownerId: data.ownerId,
  });
}, "resource.write");

router.get("/pools", (ctx) => {
  return store.getState().pools.filter((p) => p.tenantId === ctx.actor.tenantId);
}, "resource.read");

router.post("/requests", (ctx) => {
  const data = ctx.body;
  return service.createRequest(ctx.actor, {
    requestType: requireString(data, "requestType") as ResourceCategory,
    resourceName: data.resourceName,
    skills: asArray(data.skills),
    quantity: asNumber(data.quantity, 1),
    startDate: requireString(data, "startDate"),
    endDate: requireString(data, "endDate"),
    allocationPercent: asNumber(data.allocationPercent),
    purpose: data.purpose,
    projectId: data.projectId,
  });
}, "resource.write");

router.get("/requests", (ctx) => {
  return store.getState().requests.filter((r) => r.tenantId === ctx.actor.tenantId);
}, "resource.read");

router.post("/maintenance", (ctx) => {
  const data = ctx.body;
  return service.createMaintenance(ctx.actor, {
    resourceId: requireString(data, "resourceId"),
    maintenanceType: requireString(data, "maintenanceType"),
    scheduledDate: requireString(data, "scheduledDate"),
    description: requireString(data, "description"),
    cost: asNumber(data.cost),
    performedBy: data.performedBy,
  });
}, "resource.write");

router.get("/maintenance", (ctx) => {
  const resourceId = ctx.query.get("resourceId");
  let maintenances = store.getState().maintenances.filter((m) => m.tenantId === ctx.actor.tenantId);
  if (resourceId) {
    maintenances = maintenances.filter((m) => m.resourceId === resourceId);
  }
  return maintenances;
}, "resource.read");

router.get("/conflicts", (ctx) => {
  return store.getState().conflicts.filter((c) => c.tenantId === ctx.actor.tenantId);
}, "resource.read");

router.post("/conflicts/detect", (ctx) => {
  return service.detectConflicts(ctx.actor);
}, "resource.read");

router.get("/analytics", (ctx) => {
  return service.getAnalytics(ctx.actor);
}, "resource.read");

router.get("/events", (ctx) => {
  const limit = asNumber(ctx.query.get("limit"), 100);
  return store.getState().events
    .filter((e) => e.tenantId === ctx.actor.tenantId)
    .slice(0, limit);
}, "resource.read");

router.get("/audit", (ctx) => {
  const limit = asNumber(ctx.query.get("limit"), 100);
  return store.getState().auditLogs
    .filter((a) => a.tenantId === ctx.actor.tenantId)
    .slice(0, limit);
}, "resource.audit.read");

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(PORT, () => {
  console.log(`ResourceOS is running on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/docs`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
});

process.on("SIGINT", () => {
  console.log("\nShutting down ResourceOS...");
  server.close(() => {
    console.log("ResourceOS stopped");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("\nShutting down ResourceOS...");
  server.close(() => {
    console.log("ResourceOS stopped");
    process.exit(0);
  });
});
