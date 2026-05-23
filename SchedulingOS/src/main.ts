import { createServer } from "http";
import { DataStore } from "./core/datastore";
import { Router } from "./core/http";
import { SchedulingService } from "./service";
import { createSeedState } from "./seed-state";
import { docs } from "./docs";

const port = Number(process.env.PORT ?? 11500);
const dbFile = process.env.SCHEDULINGOS_DB_FILE ?? "data/schedulingos.db.json";
const tenantId = process.env.DEFAULT_TENANT_ID ?? "demo-tenant";

const store = new DataStore(dbFile);
if (store.getState().calendars.length === 0) {
  store.reset(createSeedState(tenantId));
}

const service = new SchedulingService(store);
const router = new Router();

router.get("/health", () => ({ service: "SchedulingOS", status: "ok", message: service.getRoutesSummary() }));
router.get("/docs", () => ({ ...docs(), routes: router.listRoutes() }));

router.get("/scheduling/overview", ({ actor }) => service.overview(actor), "scheduling.read");

router.get("/scheduling/calendars", ({ actor }) => service.listCalendars(actor), "scheduling.read");
router.post("/scheduling/calendars", ({ body, actor }) => service.createCalendar(body, actor), "scheduling.schedule.write");

router.get("/scheduling/schedules", ({ actor, query }) => service.listSchedules(actor, query), "scheduling.read");
router.post("/scheduling/schedules", ({ body, actor }) => service.createSchedule(body, actor), "scheduling.schedule.write");
router.patch("/scheduling/schedules/:id", ({ params, body, actor }) => service.updateSchedule(params.id, body, actor), "scheduling.schedule.write");

router.get("/scheduling/appointments", ({ actor, query }) => service.listAppointments(actor, query), "scheduling.read");
router.post("/scheduling/appointments", ({ body, actor }) => service.createAppointment(body, actor), "scheduling.booking.write");
router.patch("/scheduling/appointments/:id/status", ({ params, body, actor }) => service.updateAppointmentStatus(params.id, body.status, actor, body.reason), "scheduling.booking.write");

router.get("/scheduling/bookings", ({ actor, query }) => service.listBookings(actor, query), "scheduling.read");
router.post("/scheduling/bookings", ({ body, actor }) => service.createBooking(body, actor), "scheduling.booking.write");
router.patch("/scheduling/bookings/:id/status", ({ params, body, actor }) => service.updateBookingStatus(params.id, body.status, actor, body.reason), "scheduling.booking.write");

router.get("/scheduling/slots", ({ actor, query }) => service.listTimeSlots(actor, query), "scheduling.read");
router.post("/scheduling/slots", ({ body, actor }) => service.createTimeSlot(body, actor), "scheduling.schedule.write");

router.get("/scheduling/availability", ({ actor, query }) => service.getAvailability(actor, query), "scheduling.read");
router.get("/scheduling/availability/rules", ({ actor, query }) => service.listAvailabilityRules(actor, query), "scheduling.read");
router.post("/scheduling/availability/rules", ({ body, actor }) => service.createAvailabilityRule(body, actor), "scheduling.availability.write");

router.get("/scheduling/reminders", ({ actor, query }) => service.listReminders(actor, query), "scheduling.read");
router.post("/scheduling/reminders", ({ body, actor }) => service.createReminder(body, actor), "scheduling.reminder.write");

router.get("/scheduling/deadlines", ({ actor, query }) => service.listDeadlines(actor, query), "scheduling.read");
router.post("/scheduling/deadlines", ({ body, actor }) => service.createDeadline(body, actor), "scheduling.schedule.write");

router.get("/scheduling/booking-pages", ({ actor, query }) => service.listBookingPages(actor, query), "scheduling.read");
router.post("/scheduling/booking-pages", ({ body, actor }) => service.createBookingPage(body, actor), "scheduling.schedule.write");

router.get("/scheduling/templates", ({ actor }) => service.listScheduleTemplates(actor), "scheduling.read");
router.post("/scheduling/templates", ({ body, actor }) => service.createScheduleTemplate(body, actor), "scheduling.schedule.write");

router.get("/scheduling/waitlist", ({ actor, query }) => service.listWaitlistEntries(actor, query), "scheduling.read");
router.post("/scheduling/waitlist", ({ body, actor }) => service.addToWaitlist(body, actor), "scheduling.booking.write");

router.get("/scheduling/events", ({ actor, query }) => service.listEvents(actor, query), "scheduling.read");
router.get("/scheduling/audit", ({ actor }) => service.listAuditLogs(actor), "scheduling.audit.read");
router.get("/scheduling/analytics", ({ actor, query }) => service.getAnalytics(actor, query), "scheduling.read");

const server = createServer((req, res) => {
  router.handle(req, res);
});

server.listen(port, () => {
  console.log(`SchedulingOS running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Docs:   http://localhost:${port}/docs`);
});
