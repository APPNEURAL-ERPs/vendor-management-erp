import { Router, HttpContext } from "../core/http";
import { NotificationService } from "../service";
import { pickQuery } from "../core/utils";
import { docs } from "../docs";
import { sendJson } from "../core/http";

export function registerRoutes(router: Router, service: NotificationService): Router {
  router.get("/health", (ctx) => ({ status: "ok", service: "NotificationOS", timestamp: new Date().toISOString() }));
  router.get("/docs", () => docs());

  router.get("/notificationos/overview", (ctx) => service.getOverview(ctx.actor.tenantId));

  router.get("/notificationos/notifications", (ctx) => {
    return service.listNotifications(ctx.actor.tenantId, {
      status: pickQuery(ctx.query, "status") ?? undefined,
      channel: pickQuery(ctx.query, "channel") as any ?? undefined,
      type: pickQuery(ctx.query, "type") ?? undefined
    });
  });

  router.post("/notificationos/notifications", (ctx) => service.createNotification(ctx.actor, ctx.body));

  router.get("/notificationos/notifications/:id", (ctx) => service.getNotification(ctx.actor.tenantId, ctx.params.id));

  router.post("/notificationos/notifications/:id/send", (ctx) => service.sendNotification(ctx.actor, ctx.params.id));

  router.post("/notificationos/notifications/:id/retry", (ctx) => service.retryNotification(ctx.actor, ctx.params.id));

  router.get("/notificationos/templates", (ctx) => {
    return service.listTemplates(ctx.actor.tenantId, {
      channel: pickQuery(ctx.query, "channel") as any ?? undefined,
      status: pickQuery(ctx.query, "status") ?? undefined
    });
  });

  router.post("/notificationos/templates", (ctx) => service.createTemplate(ctx.actor, ctx.body));

  router.get("/notificationos/templates/:id", (ctx) => service.getTemplate(ctx.actor.tenantId, ctx.params.id));

  router.patch("/notificationos/templates/:id", (ctx) => service.updateTemplate(ctx.actor, ctx.params.id, ctx.body));

  router.get("/notificationos/channels", (ctx) => service.listChannels(ctx.actor.tenantId));

  router.post("/notificationos/channels", (ctx) => service.createChannel(ctx.actor, ctx.body));

  router.get("/notificationos/channels/:id", (ctx) => service.getChannel(ctx.actor.tenantId, ctx.params.id));

  router.get("/notificationos/preferences", (ctx) => {
    const userId = pickQuery(ctx.query, "userId") ?? undefined;
    return service.listPreferences(ctx.actor.tenantId, userId);
  });

  router.get("/notificationos/preferences/:userId", (ctx) => service.listPreferences(ctx.actor.tenantId, ctx.params.userId));

  router.patch("/notificationos/preferences/:userId", (ctx) => service.updatePreference(ctx.actor, ctx.params.userId, ctx.body));

  router.get("/notificationos/rules", (ctx) => service.listRules(ctx.actor.tenantId));

  router.post("/notificationos/rules", (ctx) => service.createRule(ctx.actor, ctx.body));

  router.get("/notificationos/rules/:id", (ctx) => service.getRule(ctx.actor.tenantId, ctx.params.id));

  router.get("/notificationos/schedules", (ctx) => service.listSchedules(ctx.actor.tenantId));

  router.post("/notificationos/schedules", (ctx) => service.createSchedule(ctx.actor, ctx.body));

  router.get("/notificationos/reminders", (ctx) => {
    const userId = pickQuery(ctx.query, "userId") ?? undefined;
    return service.listReminders(ctx.actor.tenantId, userId);
  });

  router.post("/notificationos/reminders", (ctx) => service.createReminder(ctx.actor, ctx.body));

  router.get("/notificationos/alerts", (ctx) => service.listAlerts(ctx.actor.tenantId));

  router.post("/notificationos/alerts", (ctx) => service.createAlert(ctx.actor, ctx.body));

  router.post("/notificationos/alerts/:id/acknowledge", (ctx) => service.acknowledgeAlert(ctx.actor, ctx.params.id));

  router.get("/notificationos/announcements", (ctx) => service.listAnnouncements(ctx.actor.tenantId));

  router.post("/notificationos/announcements", (ctx) => service.createAnnouncement(ctx.actor, ctx.body));

  router.get("/notificationos/campaigns", (ctx) => service.listCampaigns(ctx.actor.tenantId));

  router.post("/notificationos/campaigns", (ctx) => service.createCampaign(ctx.actor, ctx.body));

  router.get("/notificationos/delivery-logs", (ctx) => {
    const notificationId = pickQuery(ctx.query, "notificationId") ?? undefined;
    return service.getDeliveryLogs(ctx.actor.tenantId, notificationId);
  });

  router.get("/notificationos/queue", (ctx) => service.listQueueItems(ctx.actor.tenantId));

  router.get("/notificationos/analytics", (ctx) => service.getAnalytics(ctx.actor.tenantId));

  router.get("/notificationos/events", (ctx) => service.getEvents(ctx.actor.tenantId));

  router.get("/notificationos/audit-logs", (ctx) => service.getAuditLogs(ctx.actor.tenantId));

  return router;
}
