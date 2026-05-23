import {
  Notification,
  NotificationTemplate,
  NotificationChannel_,
  NotificationPreference,
  NotificationRule,
  NotificationSchedule,
  Reminder,
  Alert,
  Announcement,
  NotificationCampaign,
  NotificationDeliveryLog,
  NotificationQueueItem,
  NotificationProvider,
  NotificationRetryPolicy,
  NotificationCostRecord,
  NotificationOverview,
  NotificationChannel,
  NotificationRecipient,
  RequestActor
} from "./core/domain";
import { DataStore } from "./core/datastore";
import { newId, nowIso, plusDays } from "./core/id";
import { ensureString, ensureNumber, ensureBoolean, ensureArray, renderTemplate, countBy, percentage, sum } from "./core/utils";
import { notFound, conflict, badRequest } from "./core/errors";

export class NotificationService {
  constructor(private readonly store: DataStore) {}

  getOverview(tenantId: string): NotificationOverview {
    const state = this.store.getState();
    const notifications = state.notifications.filter((n) => n.tenantId === tenantId);
    const templates = state.templates.filter((t) => t.tenantId === tenantId);
    const deliveryLogs = state.deliveryLogs.filter((d) => d.tenantId === tenantId);
    const queueItems = state.queueItems.filter((q) => q.tenantId === tenantId);
    const costRecords = state.costRecords.filter((c) => c.tenantId === tenantId);

    const totalSent = deliveryLogs.filter((d) => ["sent", "delivered", "opened", "clicked", "read"].includes(d.status)).length;
    const totalDelivered = deliveryLogs.filter((d) => ["delivered", "opened", "clicked", "read"].includes(d.status)).length;
    const totalOpened = deliveryLogs.filter((d) => ["opened", "clicked", "read"].includes(d.status)).length;
    const totalClicked = deliveryLogs.filter((d) => ["clicked", "read"].includes(d.status)).length;
    const totalFailed = deliveryLogs.filter((d) => d.status === "failed").length;

    const costByChannel: Record<string, number> = {};
    const costByProvider: Record<string, number> = {};
    for (const record of costRecords) {
      costByChannel[record.channel] = (costByChannel[record.channel] ?? 0) + record.cost;
      costByProvider[record.provider] = (costByProvider[record.provider] ?? 0) + record.cost;
    }

    return {
      notifications: {
        total: notifications.length,
        queued: notifications.filter((n) => n.status === "queued").length,
        sent: notifications.filter((n) => n.status === "sent" || n.status === "delivered").length,
        delivered: notifications.filter((n) => n.status === "delivered").length,
        failed: notifications.filter((n) => n.status === "failed").length,
        byChannel: countBy(notifications.flatMap((n) => n.channels.map((c) => c)), (c) => c)
      },
      templates: {
        total: templates.length,
        active: templates.filter((t) => t.status === "active").length,
        byChannel: countBy(templates, "type")
      },
      delivery: {
        totalSent,
        totalDelivered,
        deliveryRate: percentage(totalDelivered, totalSent),
        openRate: percentage(totalOpened, totalDelivered),
        clickRate: percentage(totalClicked, totalOpened),
        failureRate: percentage(totalFailed, totalSent)
      },
      cost: {
        total: sum(costRecords.map((c) => c.cost)),
        byChannel: costByChannel as any,
        byProvider: costByProvider
      },
      queue: {
        pending: queueItems.filter((q) => q.status === "queued").length,
        processing: queueItems.filter((q) => q.status === "processing").length,
        deadLetter: queueItems.filter((q) => q.status === "dead_letter").length
      }
    };
  }

  listNotifications(tenantId: string, filters?: { status?: string; channel?: NotificationChannel; type?: string }): Notification[] {
    let notifications = this.store.getState().notifications.filter((n) => n.tenantId === tenantId);
    if (filters?.status) notifications = notifications.filter((n) => n.status === filters.status);
    if (filters?.channel) notifications = notifications.filter((n) => n.channels.includes(filters.channel!));
    if (filters?.type) notifications = notifications.filter((n) => n.type === filters.type);
    return notifications;
  }

  getNotification(tenantId: string, id: string): Notification {
    const notification = this.store.getState().notifications.find((n) => n.id === id && n.tenantId === tenantId);
    if (!notification) notFound(`Notification ${id} not found`);
    return notification;
  }

  createNotification(actor: RequestActor, data: any): Notification {
    const state = this.store.getState();

    if (data.templateId) {
      const template = state.templates.find((t) => t.id === data.templateId);
      if (!template) notFound(`Template ${data.templateId} not found`);
    }

    const now = nowIso();
    const recipients: NotificationRecipient[] = (data.recipients ?? []).map((r: any) => ({
      id: newId("recipient"),
      notificationId: "",
      channel: r.channel,
      recipient: r.recipient,
      recipientName: r.recipientName,
      recipientId: r.recipientId,
      status: "queued",
      deliveryStatus: "pending",
      metadata: r.metadata ?? {}
    }));

    const notification: Notification = {
      id: newId("notif"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key: ensureString(data.key, "key"),
      name: ensureString(data.name, "name"),
      type: data.type ?? "transactional",
      status: "queued",
      priority: data.priority ?? "normal",
      templateId: data.templateId,
      channels: ensureArray(data.channels, "channels"),
      recipients,
      subject: data.subject,
      body: data.body,
      variables: data.variables ?? {},
      scheduledAt: data.scheduledAt,
      sentAt: data.sentAt,
      completedAt: data.completedAt,
      retryCount: 0,
      maxRetries: data.maxRetries ?? 3,
      createdBy: actor.userId,
      metadata: data.metadata ?? {}
    };

    recipients.forEach((r) => (r.notificationId = notification.id));

    if (data.templateId) {
      const template = state.templates.find((t) => t.id === data.templateId)!;
      notification.subject = notification.subject ?? renderTemplate(template.subject ?? "", notification.variables);
      notification.body = renderTemplate(template.body, notification.variables);
    }

    this.store.getState().notifications.unshift(notification);
    this.store.save();
    this.store.audit(actor, "notification.created", "notification", notification.id);
    this.store.emit("notification.created", "NotificationOS", { notificationId: notification.id, channels: notification.channels });

    return notification;
  }

  sendNotification(actor: RequestActor, id: string): Notification {
    const notification = this.getNotification(actor.tenantId, id);
    if (notification.status !== "queued") conflict("Notification already sent");

    const now = nowIso();
    notification.status = "sent";
    notification.sentAt = now;
    notification.updatedAt = now;

    for (const recipient of notification.recipients) {
      recipient.status = "sent";
      const log: NotificationDeliveryLog = {
        id: newId("log"),
        tenantId: actor.tenantId,
        createdAt: now,
        updatedAt: now,
        notificationId: notification.id,
        recipientId: recipient.id,
        channel: recipient.channel,
        status: "sent",
        sentAt: now,
        attempts: 1,
        metadata: { provider: this.getProviderForChannel(recipient.channel) }
      };
      this.store.getState().deliveryLogs.unshift(log);
    }

    this.store.save();
    this.store.audit(actor, "notification.sent", "notification", id);
    this.store.emit("notification.sent", "NotificationOS", { notificationId: id, channels: notification.channels });

    return notification;
  }

  private getProviderForChannel(channel: NotificationChannel): string {
    const providers: Record<NotificationChannel, string> = {
      email: "sendgrid",
      whatsapp: "whatsapp_business_api",
      sms: "twilio",
      push: "firebase",
      in_app: "internal",
      slack: "slack_api",
      teams: "microsoft_teams",
      webhook: "webhook",
      voice: "twilio_voice"
    };
    return providers[channel] ?? "unknown";
  }

  listTemplates(tenantId: string, filters?: { channel?: NotificationChannel; status?: string }): NotificationTemplate[] {
    let templates = this.store.getState().templates.filter((t) => t.tenantId === tenantId);
    if (filters?.channel) templates = templates.filter((t) => t.type === filters.channel);
    if (filters?.status) templates = templates.filter((t) => t.status === filters.status);
    return templates;
  }

  getTemplate(tenantId: string, id: string): NotificationTemplate {
    const template = this.store.getState().templates.find((t) => t.id === id && t.tenantId === tenantId);
    if (!template) notFound(`Template ${id} not found`);
    return template;
  }

  createTemplate(actor: RequestActor, data: any): NotificationTemplate {
    const now = nowIso();
    const template: NotificationTemplate = {
      id: newId("template"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key: ensureString(data.key, "key"),
      name: ensureString(data.name, "name"),
      description: data.description,
      type: ensureString(data.type, "type"),
      status: data.status ?? "active",
      subject: data.subject,
      body: ensureString(data.body, "body"),
      variables: ensureArray(data.variables, "variables", []),
      tags: data.tags ?? [],
      version: 1,
      approved: data.approved ?? false,
      approvedBy: data.approved ? actor.userId : undefined,
      approvedAt: data.approved ? now : undefined
    };

    this.store.getState().templates.unshift(template);
    this.store.save();
    this.store.audit(actor, "template.created", "template", template.id);
    this.store.emit("notification.template.created", "NotificationOS", { templateId: template.id, type: template.type });

    return template;
  }

  updateTemplate(actor: RequestActor, id: string, data: any): NotificationTemplate {
    const template = this.getTemplate(actor.tenantId, id);
    Object.assign(template, {
      ...data,
      updatedAt: nowIso(),
      version: template.version + 1
    });
    this.store.save();
    this.store.audit(actor, "template.updated", "template", id, undefined, template);
    return template;
  }

  listChannels(tenantId: string): NotificationChannel_[] {
    return this.store.getState().channels.filter((c) => c.tenantId === tenantId);
  }

  getChannel(tenantId: string, id: string): NotificationChannel_ {
    const channel = this.store.getState().channels.find((c) => c.id === id && c.tenantId === tenantId);
    if (!channel) notFound(`Channel ${id} not found`);
    return channel;
  }

  createChannel(actor: RequestActor, data: any): NotificationChannel_ {
    const now = nowIso();
    const channel: NotificationChannel_ = {
      id: newId("channel"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key: ensureString(data.key, "key"),
      name: ensureString(data.name, "name"),
      type: ensureString(data.type, "type") as NotificationChannel,
      status: data.status ?? "active",
      provider: data.provider,
      config: data.config ?? {},
      maskedCredentials: data.credentials ? {} : {},
      rateLimit: data.rateLimit,
      costPerUnit: data.costPerUnit
    };

    this.store.getState().channels.unshift(channel);
    this.store.save();
    this.store.audit(actor, "channel.created", "channel", channel.id);
    return channel;
  }

  listPreferences(tenantId: string, userId?: string): NotificationPreference[] {
    let preferences = this.store.getState().preferences.filter((p) => p.tenantId === tenantId);
    if (userId) preferences = preferences.filter((p) => p.userId === userId);
    return preferences;
  }

  getPreference(tenantId: string, userId: string, channel: NotificationChannel): NotificationPreference {
    const preference = this.store.getState().preferences.find(
      (p) => p.tenantId === tenantId && p.userId === userId && p.channel === channel
    );
    if (!preference) notFound(`Preference for user ${userId} channel ${channel} not found`);
    return preference;
  }

  updatePreference(actor: RequestActor, userId: string, data: any): NotificationPreference {
    let preference = this.store.getState().preferences.find(
      (p) => p.tenantId === actor.tenantId && p.userId === userId && p.channel === data.channel
    );

    const now = nowIso();
    if (preference) {
      Object.assign(preference, data, { updatedAt: now });
    } else {
      preference = {
        id: newId("pref"),
        tenantId: actor.tenantId,
        createdAt: now,
        updatedAt: now,
        userId,
        channel: data.channel,
        enabled: data.enabled ?? true,
        optIn: data.optIn ?? true,
        quietHoursStart: data.quietHoursStart,
        quietHoursEnd: data.quietHoursEnd,
        frequencyLimit: data.frequencyLimit,
        categories: data.categories ?? [],
        metadata: data.metadata ?? {}
      };
      this.store.getState().preferences.push(preference);
    }

    this.store.save();
    this.store.audit(actor, "preference.updated", "preference", preference.id);
    return preference;
  }

  listRules(tenantId: string): NotificationRule[] {
    return this.store.getState().rules.filter((r) => r.tenantId === tenantId);
  }

  getRule(tenantId: string, id: string): NotificationRule {
    const rule = this.store.getState().rules.find((r) => r.id === id && r.tenantId === tenantId);
    if (!rule) notFound(`Rule ${id} not found`);
    return rule;
  }

  createRule(actor: RequestActor, data: any): NotificationRule {
    const now = nowIso();
    const rule: NotificationRule = {
      id: newId("rule"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key: ensureString(data.key, "key"),
      name: ensureString(data.name, "name"),
      description: data.description,
      status: data.status ?? "active",
      event: ensureString(data.event, "event"),
      conditions: ensureArray(data.conditions, "conditions", []),
      actions: ensureArray(data.actions, "actions", []),
      priority: ensureNumber(data.priority, "priority", 0),
      createdBy: actor.userId
    };

    this.store.getState().rules.unshift(rule);
    this.store.save();
    this.store.audit(actor, "rule.created", "rule", rule.id);
    return rule;
  }

  listSchedules(tenantId: string): NotificationSchedule[] {
    return this.store.getState().schedules.filter((s) => s.tenantId === tenantId);
  }

  createSchedule(actor: RequestActor, data: any): NotificationSchedule {
    const now = nowIso();
    const schedule: NotificationSchedule = {
      id: newId("schedule"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key: ensureString(data.key, "key"),
      name: ensureString(data.name, "name"),
      description: data.description,
      status: data.status ?? "active",
      notificationId: data.notificationId,
      templateId: data.templateId,
      channels: ensureArray(data.channels, "channels"),
      recipients: ensureArray(data.recipients, "recipients", []),
      timing: data.timing ?? "immediately",
      customTiming: data.customTiming,
      frequency: data.frequency ?? "once",
      startDate: data.startDate ?? now,
      endDate: data.endDate,
      timezone: data.timezone ?? "Asia/Kolkata",
      createdBy: actor.userId
    };

    this.store.getState().schedules.unshift(schedule);
    this.store.save();
    this.store.audit(actor, "schedule.created", "schedule", schedule.id);
    return schedule;
  }

  listReminders(tenantId: string, userId?: string): Reminder[] {
    let reminders = this.store.getState().reminders.filter((r) => r.tenantId === tenantId);
    if (userId) reminders = reminders.filter((r) => r.userId === userId);
    return reminders;
  }

  createReminder(actor: RequestActor, data: any): Reminder {
    const now = nowIso();
    const reminder: Reminder = {
      id: newId("reminder"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key: ensureString(data.key, "key"),
      name: ensureString(data.name, "name"),
      description: data.description,
      status: data.status ?? "active",
      userId: ensureString(data.userId, "userId"),
      type: data.type ?? "custom",
      referenceId: data.referenceId,
      referenceType: data.referenceType,
      channels: ensureArray(data.channels, "channels"),
      templateId: data.templateId,
      scheduledAt: ensureString(data.scheduledAt, "scheduledAt"),
      timing: data.timing ?? "immediately",
      frequency: data.frequency ?? "once",
      startDate: data.startDate ?? now,
      sent: false,
      completed: false,
      metadata: data.metadata ?? {}
    };

    this.store.getState().reminders.unshift(reminder);
    this.store.save();
    this.store.audit(actor, "reminder.created", "reminder", reminder.id);
    return reminder;
  }

  listAlerts(tenantId: string): Alert[] {
    return this.store.getState().alerts.filter((a) => a.tenantId === tenantId);
  }

  createAlert(actor: RequestActor, data: any): Alert {
    const now = nowIso();
    const alert: Alert = {
      id: newId("alert"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key: ensureString(data.key, "key"),
      name: ensureString(data.name, "name"),
      type: data.type ?? "system",
      severity: data.severity ?? "medium",
      status: "active",
      source: ensureString(data.source, "source"),
      channels: ensureArray(data.channels, "channels"),
      templateId: data.templateId,
      recipients: ensureArray(data.recipients, "recipients"),
      triggeredAt: now,
      metadata: data.metadata ?? {}
    };

    this.store.getState().alerts.unshift(alert);
    this.store.save();
    this.store.audit(actor, "alert.created", "alert", alert.id);
    this.store.emit("notification.alert.triggered", "NotificationOS", { alertId: alert.id, severity: alert.severity });

    return alert;
  }

  acknowledgeAlert(actor: RequestActor, id: string): Alert {
    const alert = this.store.getState().alerts.find((a) => a.id === id && a.tenantId === actor.tenantId);
    if (!alert) notFound(`Alert ${id} not found`);

    alert.acknowledgedAt = nowIso();
    alert.acknowledgedBy = actor.userId;
    alert.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "alert.acknowledged", "alert", id);
    return alert;
  }

  listAnnouncements(tenantId: string): Announcement[] {
    return this.store.getState().announcements.filter((a) => a.tenantId === tenantId);
  }

  createAnnouncement(actor: RequestActor, data: any): Announcement {
    const now = nowIso();
    const announcement: Announcement = {
      id: newId("announcement"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key: ensureString(data.key, "key"),
      name: ensureString(data.name, "name"),
      description: data.description,
      type: data.type ?? "product",
      status: data.status ?? "active",
      priority: data.priority ?? "normal",
      channels: ensureArray(data.channels, "channels"),
      templateId: data.templateId,
      subject: ensureString(data.subject, "subject"),
      body: ensureString(data.body, "body"),
      target: data.target ?? { type: "all" },
      scheduledAt: data.scheduledAt,
      publishedAt: data.publishedAt ?? now,
      expiresAt: data.expiresAt,
      createdBy: actor.userId
    };

    this.store.getState().announcements.unshift(announcement);
    this.store.save();
    this.store.audit(actor, "announcement.created", "announcement", announcement.id);
    return announcement;
  }

  listCampaigns(tenantId: string): NotificationCampaign[] {
    return this.store.getState().campaigns.filter((c) => c.tenantId === tenantId);
  }

  createCampaign(actor: RequestActor, data: any): NotificationCampaign {
    const now = nowIso();
    const campaign: NotificationCampaign = {
      id: newId("campaign"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key: ensureString(data.key, "key"),
      name: ensureString(data.name, "name"),
      description: data.description,
      type: data.type ?? "marketing",
      status: data.status ?? "active",
      channels: ensureArray(data.channels, "channels"),
      templateId: data.templateId,
      segment: data.segment,
      scheduledAt: data.scheduledAt,
      stats: {
        total: 0,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        failed: 0,
        cost: 0
      },
      createdBy: actor.userId
    };

    this.store.getState().campaigns.unshift(campaign);
    this.store.save();
    this.store.audit(actor, "campaign.created", "campaign", campaign.id);
    return campaign;
  }

  getDeliveryLogs(tenantId: string, notificationId?: string): NotificationDeliveryLog[] {
    let logs = this.store.getState().deliveryLogs.filter((l) => l.tenantId === tenantId);
    if (notificationId) logs = logs.filter((l) => l.notificationId === notificationId);
    return logs;
  }

  listQueueItems(tenantId: string): NotificationQueueItem[] {
    return this.store.getState().queueItems.filter((q) => q.tenantId === tenantId);
  }

  retryNotification(actor: RequestActor, notificationId: string): Notification {
    const notification = this.getNotification(actor.tenantId, notificationId);
    if (notification.status !== "failed") badRequest("Can only retry failed notifications");

    notification.status = "queued";
    notification.retryCount += 1;
    notification.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "notification.retry", "notification", notificationId);
    return notification;
  }

  getAnalytics(tenantId: string) {
    const state = this.store.getState();
    const notifications = state.notifications.filter((n) => n.tenantId === tenantId);
    const deliveryLogs = state.deliveryLogs.filter((l) => l.tenantId === tenantId);
    const costRecords = state.costRecords.filter((c) => c.tenantId === tenantId);

    return {
      overview: this.getOverview(tenantId),
      notificationsByDay: this.groupByDay(notifications),
      deliveryByChannel: countBy(deliveryLogs, "channel"),
      costByProvider: this.aggregateCostByProvider(costRecords),
      topTemplates: this.getTopTemplates(tenantId),
      failedNotifications: notifications.filter((n) => n.status === "failed").length
    };
  }

  private groupByDay(items: any[]): Record<string, number> {
    const groups: Record<string, number> = {};
    for (const item of items) {
      const day = item.createdAt?.split("T")[0] ?? "unknown";
      groups[day] = (groups[day] ?? 0) + 1;
    }
    return groups;
  }

  private aggregateCostByProvider(costRecords: NotificationCostRecord[]): Record<string, number> {
    const costs: Record<string, number> = {};
    for (const record of costRecords) {
      costs[record.provider] = (costs[record.provider] ?? 0) + record.cost;
    }
    return costs;
  }

  private getTopTemplates(tenantId: string): Array<{ templateId: string; count: number }> {
    const logs = this.store.getState().deliveryLogs.filter((l) => l.tenantId === tenantId);
    const notificationIds = logs.map((l) => l.notificationId);
    const notifications = this.store.getState().notifications.filter((n) => notificationIds.includes(n.id) && n.templateId);
    const counts = countBy(notifications.filter((n) => n.templateId), "templateId");
    return Object.entries(counts).map(([templateId, count]) => ({ templateId, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }

  getEvents(tenantId: string): any[] {
    return this.store.getState().events.filter((e) => e.tenantId === tenantId);
  }

  getAuditLogs(tenantId: string): any[] {
    return this.store.getState().auditLogs.filter((a) => a.tenantId === tenantId);
  }
}
