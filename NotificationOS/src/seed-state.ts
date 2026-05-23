import { NotificationOSState, NotificationChannel_ } from "./core/domain";
import { emptyState } from "./core/datastore";
import { nowIso, plusDays, plusHours } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): NotificationOSState {
  const state = emptyState();
  const createdAt = nowIso();

  state.channels.push(
    {
      id: "channel_email",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "email_default",
      name: "Default Email Channel",
      type: "email",
      status: "active",
      provider: "sendgrid",
      config: { fromEmail: "noreply@appneural.com", fromName: "Appneural" },
      maskedCredentials: {},
      rateLimit: 1000,
      costPerUnit: 0.001
    },
    {
      id: "channel_whatsapp",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "whatsapp_default",
      name: "Default WhatsApp Channel",
      type: "whatsapp",
      status: "active",
      provider: "whatsapp_business_api",
      config: { businessAccountId: "demo-account" },
      maskedCredentials: {},
      rateLimit: 100,
      costPerUnit: 0.05
    },
    {
      id: "channel_sms",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "sms_default",
      name: "Default SMS Channel",
      type: "sms",
      status: "active",
      provider: "twilio",
      config: { fromNumber: "+1234567890" },
      maskedCredentials: {},
      rateLimit: 500,
      costPerUnit: 0.01
    },
    {
      id: "channel_push",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "push_default",
      name: "Default Push Channel",
      type: "push",
      status: "active",
      provider: "firebase",
      config: { projectId: "appneural-demo" },
      maskedCredentials: {},
      rateLimit: 10000,
      costPerUnit: 0
    },
    {
      id: "channel_inapp",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "in_app_default",
      name: "Default In-App Channel",
      type: "in_app",
      status: "active",
      config: {},
      maskedCredentials: {},
      rateLimit: 0,
      costPerUnit: 0
    }
  );

  state.providers.push(
    {
      id: "provider_sendgrid",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "sendgrid",
      name: "SendGrid",
      type: "email",
      status: "active",
      maskedApiKey: "SG.****************************",
      baseUrl: "https://api.sendgrid.com/v3",
      config: { ipPool: "main", trackingDomain: "email.appneural.com" }
    },
    {
      id: "provider_twilio",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "twilio",
      name: "Twilio",
      type: "sms",
      status: "active",
      maskedApiKey: "AC****************************",
      baseUrl: "https://api.twilio.com/2010-04-01",
      config: { messagingService: "demo-service" }
    }
  );

  state.templates.push(
    {
      id: "template_welcome_email",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "welcome_email",
      name: "Welcome Email",
      description: "Welcome email for new users",
      type: "email",
      status: "active",
      subject: "Welcome to {{tenant_name}}!",
      body: "Hi {{user_name}},\n\nWelcome to {{tenant_name}}! We're excited to have you on board.\n\nBest,\nThe {{tenant_name}} Team",
      variables: ["user_name", "tenant_name"],
      tags: ["welcome", "onboarding"],
      version: 1,
      approved: true,
      approvedBy: "seed",
      approvedAt: createdAt
    },
    {
      id: "template_invoice_reminder",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "invoice_reminder",
      name: "Invoice Reminder",
      description: "Reminder for upcoming invoice due date",
      type: "email",
      status: "active",
      subject: "Invoice #{{invoice_no}} Due in {{days_left}} days",
      body: "Dear {{customer_name}},\n\nThis is a reminder that Invoice #{{invoice_no}} for {{amount}} is due in {{days_left}} days.\n\nDue Date: {{due_date}}\n\nPlease ensure timely payment.\n\nBest regards,\nBilling Team",
      variables: ["customer_name", "invoice_no", "amount", "due_date", "days_left"],
      tags: ["billing", "reminder"],
      version: 1,
      approved: true,
      approvedBy: "seed",
      approvedAt: createdAt
    },
    {
      id: "template_payment_success",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "payment_success",
      name: "Payment Success",
      description: "Confirmation when payment is successful",
      type: "email",
      status: "active",
      subject: "Payment Received - {{amount}}",
      body: "Hi {{customer_name}},\n\nWe have received your payment of {{amount}} for Invoice #{{invoice_no}}.\n\nTransaction ID: {{transaction_id}}\nPaid On: {{paid_at}}\n\nThank you!\n\nBilling Team",
      variables: ["customer_name", "invoice_no", "amount", "transaction_id", "paid_at"],
      tags: ["billing", "transactional"],
      version: 1,
      approved: true,
      approvedBy: "seed",
      approvedAt: createdAt
    },
    {
      id: "template_workshop_reminder_whatsapp",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "workshop_reminder_whatsapp",
      name: "Workshop Reminder WhatsApp",
      description: "WhatsApp reminder for upcoming workshop",
      type: "whatsapp",
      status: "active",
      body: "Hi {{user_name}}! Your workshop '{{workshop_name}}' starts {{timing}}.\n\nDate: {{date}}\nTime: {{time}}\nJoin Link: {{link}}\n\nSee you there!",
      variables: ["user_name", "workshop_name", "timing", "date", "time", "link"],
      tags: ["workshop", "reminder"],
      version: 1,
      approved: true,
      approvedBy: "seed",
      approvedAt: createdAt
    },
    {
      id: "template_support_ticket_update",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "support_ticket_update",
      name: "Support Ticket Update",
      description: "Update on support ticket status",
      type: "email",
      status: "active",
      subject: "Ticket #{{ticket_id}} - Status Update",
      body: "Hi {{customer_name}},\n\nYour support ticket #{{ticket_id}} has been updated.\n\nStatus: {{status}}\nUpdated By: {{agent_name}}\nComment: {{comment}}\n\nView ticket: {{ticket_link}}\n\nBest,\nSupport Team",
      variables: ["customer_name", "ticket_id", "status", "agent_name", "comment", "ticket_link"],
      tags: ["support", "transactional"],
      version: 1,
      approved: true,
      approvedBy: "seed",
      approvedAt: createdAt
    },
    {
      id: "template_security_alert",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "security_alert",
      name: "Security Alert",
      description: "Critical security alert notification",
      type: "email",
      status: "active",
      subject: "⚠️ Security Alert: {{alert_type}}",
      body: "ALERT: {{alert_type}}\n\n{{alert_message}}\n\nTime: {{alert_time}}\nSource: {{source}}\nIP Address: {{ip_address}}\n\nIf this wasn't you, please secure your account immediately.\n\nSecurity Team",
      variables: ["alert_type", "alert_message", "alert_time", "source", "ip_address"],
      tags: ["security", "critical"],
      version: 1,
      approved: true,
      approvedBy: "seed",
      approvedAt: createdAt
    },
    {
      id: "template_course_reminder_sms",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "course_reminder_sms",
      name: "Course Reminder SMS",
      description: "SMS reminder for upcoming course session",
      type: "sms",
      status: "active",
      body: "Hi {{student_name}}! Your course '{{course_name}}' session starts {{timing}}. Don't forget to join!",
      variables: ["student_name", "course_name", "timing"],
      tags: ["course", "reminder"],
      version: 1,
      approved: true,
      approvedBy: "seed",
      approvedAt: createdAt
    },
    {
      id: "template_new_task_inapp",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "new_task_inapp",
      name: "New Task Assigned",
      description: "In-app notification for new task assignment",
      type: "in_app",
      status: "active",
      body: "New task assigned to you:\n\n{{task_title}}\n\nDue: {{due_date}}\nPriority: {{priority}}\n\n{{task_description}}",
      variables: ["task_title", "due_date", "priority", "task_description"],
      tags: ["task", "operations"],
      version: 1,
      approved: true,
      approvedBy: "seed",
      approvedAt: createdAt
    }
  );

  state.notifications.push(
    {
      id: "notif_welcome_demo",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "welcome_demo_user",
      name: "Welcome Demo User",
      type: "transactional",
      status: "delivered",
      priority: "normal",
      templateId: "template_welcome_email",
      channels: ["email"],
      recipients: [
        {
          id: "recipient_welcome_1",
          notificationId: "notif_welcome_demo",
          channel: "email",
          recipient: "demo@example.com",
          recipientName: "Demo User",
          status: "delivered",
          deliveryStatus: "delivered",
          deliveredAt: createdAt,
          metadata: {}
        }
      ],
      subject: "Welcome to Appneural!",
      body: "Hi Demo User,\n\nWelcome to Appneural! We're excited to have you on board.\n\nBest,\nThe Appneural Team",
      variables: { user_name: "Demo User", tenant_name: "Appneural" },
      sentAt: createdAt,
      completedAt: createdAt,
      retryCount: 0,
      maxRetries: 3,
      createdBy: "seed",
      metadata: { campaignId: "onboarding", source: "manual" }
    },
    {
      id: "notif_workshop_reminder",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "workshop_reminder_demo",
      name: "Workshop Reminder",
      type: "reminder",
      status: "sent",
      priority: "high",
      templateId: "template_workshop_reminder_whatsapp",
      channels: ["whatsapp"],
      recipients: [
        {
          id: "recipient_workshop_1",
          notificationId: "notif_workshop_reminder",
          channel: "whatsapp",
          recipient: "+919876543210",
          recipientName: "Test User",
          status: "sent",
          deliveryStatus: "sent",
          metadata: {}
        }
      ],
      body: "Hi Test User! Your workshop 'AI Fundamentals' starts tomorrow.\n\nDate: 2026-05-23\nTime: 10:00 AM IST\nJoin Link: https://meet.appneural.com/demo\n\nSee you there!",
      variables: { user_name: "Test User", workshop_name: "AI Fundamentals", timing: "tomorrow", date: "2026-05-23", time: "10:00 AM IST", link: "https://meet.appneural.com/demo" },
      sentAt: createdAt,
      retryCount: 0,
      maxRetries: 3,
      createdBy: "seed",
      metadata: { workshopId: "workshop_ai_001", scheduledBy: "system" }
    }
  );

  state.preferences.push(
    {
      id: "pref_user_demo_email",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      userId: "user_demo",
      channel: "email",
      enabled: true,
      optIn: true,
      categories: ["transactional", "marketing", "reminders"],
      metadata: {}
    },
    {
      id: "pref_user_demo_whatsapp",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      userId: "user_demo",
      channel: "whatsapp",
      enabled: true,
      optIn: true,
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
      categories: ["transactional", "reminders"],
      metadata: {}
    },
    {
      id: "pref_user_demo_sms",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      userId: "user_demo",
      channel: "sms",
      enabled: false,
      optIn: false,
      categories: ["security"],
      metadata: {}
    }
  );

  state.rules.push(
    {
      id: "rule_invoice_overdue",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "invoice_overdue_reminder",
      name: "Invoice Overdue Reminder",
      description: "Send reminder when invoice is overdue",
      status: "active",
      event: "invoice.overdue",
      conditions: [
        { field: "data.daysOverdue", operator: "gte", value: 3 },
        { field: "data.amount", operator: "exists" }
      ],
      actions: [
        { type: "send_notification", channel: "email", templateId: "template_invoice_reminder", delay: 0 },
        { type: "send_reminder", channel: "whatsapp", delay: 86400 }
      ],
      priority: 10,
      createdBy: "seed"
    },
    {
      id: "rule_security_alert",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "critical_security_alert",
      name: "Critical Security Alert",
      description: "Send critical security alerts immediately",
      status: "active",
      event: "security.critical",
      conditions: [
        { field: "data.severity", operator: "eq", value: "critical" }
      ],
      actions: [
        { type: "send_notification", channel: "email", templateId: "template_security_alert", delay: 0 },
        { type: "send_notification", channel: "whatsapp", templateId: "template_security_alert", delay: 0 }
      ],
      priority: 100,
      createdBy: "seed"
    },
    {
      id: "rule_workshop_reminder",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "workshop_1day_reminder",
      name: "Workshop 1-Day Reminder",
      description: "Send workshop reminder 1 day before",
      status: "active",
      event: "learning.class.scheduled",
      conditions: [
        { field: "data.classType", operator: "eq", value: "workshop" },
        { field: "data.scheduledAt", operator: "exists" }
      ],
      actions: [
        { type: "send_reminder", channel: "email", delay: 86400 },
        { type: "send_reminder", channel: "whatsapp", delay: 86400 }
      ],
      priority: 5,
      createdBy: "seed"
    }
  );

  state.reminders.push(
    {
      id: "reminder_invoice_demo",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "invoice_due_reminder",
      name: "Invoice Due Reminder",
      description: "Reminder for demo invoice",
      status: "active",
      userId: "user_demo",
      type: "payment",
      referenceId: "invoice_demo_001",
      referenceType: "invoice",
      channels: ["email", "whatsapp"],
      templateId: "template_invoice_reminder",
      scheduledAt: plusDays(3),
      timing: "1_day",
      frequency: "once",
      startDate: plusDays(3),
      sent: false,
      completed: false,
      metadata: { invoiceId: "invoice_demo_001", amount: 5000 }
    },
    {
      id: "reminder_workshop_demo",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "workshop_reminder_demo",
      name: "Workshop Reminder",
      description: "Reminder for demo workshop",
      status: "active",
      userId: "user_demo",
      type: "course",
      referenceId: "workshop_ai_001",
      referenceType: "workshop",
      channels: ["whatsapp"],
      templateId: "template_workshop_reminder_whatsapp",
      scheduledAt: plusHours(-24),
      timing: "1_day",
      frequency: "once",
      startDate: plusHours(-24),
      sent: false,
      completed: false,
      metadata: { workshopId: "workshop_ai_001", workshopName: "AI Fundamentals" }
    }
  );

  state.alerts.push(
    {
      id: "alert_payment_failed",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "payment_failed_demo",
      name: "Payment Failed Alert",
      type: "billing",
      severity: "high",
      status: "active",
      source: "BillingOS",
      channels: ["email"],
      templateId: "template_security_alert",
      recipients: ["admin@appneural.com"],
      triggeredAt: createdAt,
      metadata: { invoiceId: "invoice_001", customerId: "customer_demo", amount: 10000 }
    },
    {
      id: "alert_security_suspicious_login",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "suspicious_login_demo",
      name: "Suspicious Login Detected",
      type: "security",
      severity: "critical",
      status: "active",
      source: "SecurityOS",
      channels: ["email", "whatsapp"],
      templateId: "template_security_alert",
      recipients: ["security@appneural.com", "+919876543210"],
      triggeredAt: createdAt,
      metadata: { userId: "user_demo", ipAddress: "192.168.1.100", location: "Unknown", timestamp: createdAt }
    }
  );

  state.announcements.push(
    {
      id: "announcement_new_feature",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "new_ai_features_announcement",
      name: "New AI Features Released",
      description: "Announcing new AI capabilities",
      type: "product",
      status: "active",
      priority: "high",
      channels: ["email", "in_app"],
      templateId: "template_welcome_email",
      subject: "🚀 Exciting New AI Features Released!",
      body: "We're thrilled to announce major AI upgrades to the platform!\n\n✨ New Features:\n- Advanced RAG capabilities\n- Improved agent memory\n- Enhanced guardrails\n- Better analytics\n\nExplore now at app.appneural.com\n\nBest,\nThe Appneural Team",
      target: { type: "all" },
      publishedAt: createdAt,
      createdBy: "seed"
    },
    {
      id: "announcement_maintenance",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "scheduled_maintenance",
      name: "Scheduled Maintenance Notice",
      description: "Platform maintenance window",
      type: "maintenance",
      status: "active",
      priority: "normal",
      channels: ["email", "in_app"],
      subject: "Scheduled Maintenance - May 25, 2026",
      body: "Dear Users,\n\nWe will be performing scheduled maintenance on May 25, 2026 from 2:00 AM to 4:00 AM IST.\n\nDuring this time, the platform may be temporarily unavailable.\n\nWe apologize for any inconvenience.\n\nBest,\nAppneural Team",
      target: { type: "all" },
      scheduledAt: plusDays(3),
      createdBy: "seed"
    }
  );

  state.campaigns.push(
    {
      id: "campaign_reengagement",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "inactive_user_reengagement",
      name: "Inactive User Re-Engagement",
      description: "Re-engagement campaign for inactive users",
      type: "re_engagement",
      status: "active",
      channels: ["email"],
      templateId: "template_welcome_email",
      segment: { type: "inactive", query: "lastActive < 30_days_ago" },
      scheduledAt: plusDays(7),
      stats: {
        total: 1500,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        failed: 0,
        cost: 0
      },
      createdBy: "seed"
    },
    {
      id: "campaign_workshop_promo",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "workshop_promotion",
      name: "AI Workshop Promotion",
      description: "Marketing campaign for upcoming AI workshop",
      type: "marketing",
      status: "active",
      channels: ["email", "whatsapp"],
      segment: { type: "trial" },
      stats: {
        total: 5000,
        sent: 3200,
        delivered: 3100,
        opened: 1200,
        clicked: 450,
        failed: 100,
        cost: 32.5
      },
      createdBy: "seed"
    }
  );

  state.deliveryLogs.push(
    {
      id: "delivery_log_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      notificationId: "notif_welcome_demo",
      recipientId: "recipient_welcome_1",
      channel: "email",
      status: "delivered",
      providerMessageId: "SG_DELIVERED_001",
      sentAt: createdAt,
      deliveredAt: createdAt,
      openedAt: plusHours(1),
      attempts: 1,
      metadata: { provider: "sendgrid", ip: "smtp.sendgrid.net" }
    },
    {
      id: "delivery_log_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      notificationId: "notif_workshop_reminder",
      recipientId: "recipient_workshop_1",
      channel: "whatsapp",
      status: "sent",
      providerMessageId: "WA_MSG_001",
      sentAt: createdAt,
      attempts: 1,
      metadata: { provider: "whatsapp_business", wamId: "wamid.123456" }
    }
  );

  state.retryPolicies.push(
    {
      id: "retry_policy_email",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "email_retry_policy",
      name: "Email Retry Policy",
      channel: "email",
      status: "active",
      maxRetries: 5,
      retryDelays: [60, 300, 900, 3600, 14400],
      exponentialBackoff: true,
      fallbackChannels: ["whatsapp", "sms"]
    },
    {
      id: "retry_policy_sms",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "sms_retry_policy",
      name: "SMS Retry Policy",
      channel: "sms",
      status: "active",
      maxRetries: 3,
      retryDelays: [60, 300, 900],
      exponentialBackoff: true,
      fallbackChannels: ["whatsapp"]
    }
  );

  state.costRecords.push(
    {
      id: "cost_record_email_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      campaignId: "campaign_workshop_promo",
      channel: "email",
      provider: "sendgrid",
      units: 3200,
      cost: 3.2,
      currency: "USD",
      metadata: { period: "2026-05" }
    },
    {
      id: "cost_record_whatsapp_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      campaignId: "campaign_workshop_promo",
      channel: "whatsapp",
      provider: "whatsapp_business_api",
      units: 1800,
      cost: 90.0,
      currency: "USD",
      metadata: { period: "2026-05" }
    }
  );

  state.queueItems.push(
    {
      id: "queue_item_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      notificationId: "notif_welcome_demo",
      channel: "email",
      priority: 10,
      status: "sent",
      scheduledAt: createdAt,
      processedAt: createdAt,
      attempts: 1,
      metadata: {}
    },
    {
      id: "queue_item_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      notificationId: "notif_workshop_reminder",
      channel: "whatsapp",
      priority: 20,
      status: "sent",
      scheduledAt: createdAt,
      processedAt: createdAt,
      attempts: 1,
      metadata: {}
    }
  );

  state.events.push({
    id: "event_notificationos_seeded",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "notificationos.seeded",
    source: "NotificationOS",
    data: { message: "NotificationOS demo data seeded successfully" }
  });

  return state;
}
