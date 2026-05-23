export function docs() {
  return {
    name: "NotificationOS",
    version: "1.0.0",
    description: "Communication delivery engine for emails, WhatsApp, SMS, push, in-app alerts, reminders, announcements, campaigns, and system alerts with templates, preferences, delivery tracking, retries, and analytics.",
    auth: {
      headers: {
        "x-role": "owner | admin | notification_admin | notification_manager | notification_operator | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      notification: "A message sent to one or more recipients through one or more channels (email, WhatsApp, SMS, push, in-app).",
      template: "A reusable message format with placeholders for personalization (e.g., {{user_name}}, {{amount}}).",
      channel: "A delivery mechanism: email, WhatsApp, SMS, push, in_app, slack, teams, webhook, voice.",
      provider: "An external service that handles actual message delivery (SendGrid, Twilio, WhatsApp Business API).",
      rule: "An event-driven automation that triggers notifications when specific conditions are met.",
      schedule: "A timed notification that sends at a specific date/time or recurring interval.",
      reminder: "A scheduled notification tied to a specific user and reference (task, meeting, payment, course).",
      alert: "A high-priority notification for system, security, billing, or usage events.",
      announcement: "A broadcast message to users, tenants, roles, or segments.",
      campaign: "A marketing or engagement campaign targeting a specific audience segment.",
      preference: "User-controlled settings for notification channels, opt-in/opt-out, quiet hours, and frequency limits.",
      deliveryLog: "Detailed tracking of message delivery status including sent, delivered, opened, clicked, failed.",
      queueItem: "A notification waiting in queue for processing.",
      retryPolicy: "Rules for retrying failed notifications with exponential backoff and fallback channels.",
      costRecord: "Tracking of notification costs by channel, provider, and campaign."
    },
    channels: {
      email: "Transactional and marketing emails via SendGrid, Amazon SES, etc.",
      whatsapp: "WhatsApp Business API for high-engagement customer communication (India-focused).",
      sms: "Short message service via Twilio, MSG91 for urgent notifications.",
      push: "Mobile and web push notifications via Firebase Cloud Messaging, OneSignal.",
      in_app: "In-product notifications and alerts displayed in the application UI.",
      slack: "Slack messages for team notifications and alerts.",
      teams: "Microsoft Teams messages for enterprise collaboration.",
      webhook: "HTTP POST to external systems for integration.",
      voice: "Voice calls for critical alerts (OTP, emergency)."
    },
    examples: {
      sendNotification: {
        method: "POST",
        path: "/notificationos/notifications",
        headers: { "x-role": "notification_manager" },
        body: {
          key: "payment_confirmation",
          name: "Payment Confirmation",
          type: "transactional",
          priority: "high",
          channels: ["email", "whatsapp"],
          recipients: [
            { channel: "email", recipient: "customer@example.com", recipientName: "John Doe" },
            { channel: "whatsapp", recipient: "+919876543210", recipientName: "John Doe" }
          ],
          templateId: "template_payment_success",
          variables: { customer_name: "John Doe", invoice_no: "INV-001", amount: "₹10,000" }
        }
      },
      createTemplate: {
        method: "POST",
        path: "/notificationos/templates",
        headers: { "x-role": "notification_admin" },
        body: {
          key: "invoice_reminder_v2",
          name: "Invoice Reminder V2",
          description: "Updated invoice reminder template",
          type: "email",
          subject: "Invoice #{{invoice_no}} Due Soon",
          body: "Dear {{customer_name}},\n\nInvoice #{{invoice_no}} for {{amount}} is due on {{due_date}}.\n\nPlease pay on time.\n\nBest,\nBilling Team",
          variables: ["customer_name", "invoice_no", "amount", "due_date"],
          tags: ["billing", "reminder"]
        }
      },
      createRule: {
        method: "POST",
        path: "/notificationos/rules",
        headers: { "x-role": "notification_admin" },
        body: {
          key: "invoice_overdue_7days",
          name: "Invoice Overdue 7 Days",
          description: "Escalate if invoice overdue by 7 days",
          event: "invoice.overdue",
          conditions: [{ field: "data.daysOverdue", operator: "gte", value: 7 }],
          actions: [
            { type: "send_notification", channel: "email", templateId: "template_invoice_reminder" },
            { type: "escalate", channel: "slack", recipients: ["#sales-escalation"] }
          ],
          priority: 15
        }
      },
      createReminder: {
        method: "POST",
        path: "/notificationos/reminders",
        headers: { "x-role": "notification_manager" },
        body: {
          key: "monthly_review_meeting",
          name: "Monthly Review Meeting Reminder",
          userId: "user_123",
          type: "meeting",
          channels: ["email", "whatsapp"],
          templateId: "template_meeting_reminder",
          scheduledAt: "2026-05-25T10:00:00.000Z",
          timing: "1_hour",
          frequency: "monthly"
        }
      },
      createCampaign: {
        method: "POST",
        path: "/notificationos/campaigns",
        headers: { "x-role": "notification_admin" },
        body: {
          key: "workshop_launch_may",
          name: "AI Workshop Launch May",
          description: "Campaign for upcoming AI workshop",
          type: "marketing",
          channels: ["email", "whatsapp"],
          templateId: "template_workshop_announcement",
          segment: { type: "trial" },
          scheduledAt: "2026-06-01T09:00:00.000Z"
        }
      },
      getDeliveryLogs: {
        method: "GET",
        path: "/notificationos/delivery-logs?notificationId=notif_welcome_demo",
        headers: { "x-role": "notification_manager" }
      },
      updatePreferences: {
        method: "PATCH",
        path: "/notificationos/preferences/user_123",
        headers: { "x-role": "notification_operator" },
        body: {
          channel: "whatsapp",
          enabled: true,
          optIn: true,
          quietHoursStart: "22:00",
          quietHoursEnd: "08:00",
          categories: ["transactional", "reminders"]
        }
      },
      triggerAlert: {
        method: "POST",
        path: "/notificationos/alerts",
        headers: { "x-role": "notification_admin" },
        body: {
          key: "security_breach_alert",
          name: "Security Breach Detected",
          type: "security",
          severity: "critical",
          source: "SecurityOS",
          channels: ["email", "whatsapp"],
          recipients: ["admin@appneural.com", "+919876543210"],
          metadata: { breachType: "unauthorized_access", affectedUsers: 5 }
        }
      },
      publishAnnouncement: {
        method: "POST",
        path: "/notificationos/announcements",
        headers: { "x-role": "notification_admin" },
        body: {
          key: "platform_maintenance_june",
          name: "Platform Maintenance June",
          type: "maintenance",
          priority: "high",
          channels: ["email", "in_app"],
          subject: "Scheduled Maintenance Notice",
          body: "Platform maintenance scheduled for June 1, 2026 from 2:00-4:00 AM IST.",
          target: { type: "all" },
          scheduledAt: "2026-05-28T09:00:00.000Z"
        }
      }
    },
    useCases: {
      billingReminders: "Invoice reminders via email + WhatsApp with 7-day, 3-day, and 1-day reminders before due date.",
      workshopNotifications: "Class reminders via WhatsApp and SMS, recording links after class completion.",
      securityAlerts: "Critical security alerts sent immediately via multiple channels to admins and affected users.",
      supportUpdates: "Ticket status updates sent to customers via email when support agents reply.",
      marketingCampaigns: "Workshop promotions, trial conversion campaigns, re-engagement for inactive users.",
      taskReminders: "In-app and push notifications for task assignments, due dates, and escalations.",
      systemAnnouncements: "Platform updates, maintenance notices, policy changes broadcast to all or segmented users.",
      complianceAlerts: "Usage limit warnings, SLA breaches, cost spikes sent to finance and operations teams."
    },
    analytics: {
      deliveryRate: "Percentage of notifications successfully delivered vs sent.",
      openRate: "Percentage of delivered notifications that were opened (for email).",
      clickRate: "Percentage of opened notifications with link clicks.",
      failureRate: "Percentage of notifications that failed to deliver.",
      channelPerformance: "Comparison of delivery rates, costs, and engagement across channels.",
      campaignROI: "Campaign cost vs conversions, registrations, or other business outcomes.",
      costPerNotification: "Average cost by channel, provider, and notification type."
    },
    integrations: {
      BillingOS: "Invoice reminders, payment confirmations, subscription updates.",
      LearningOS: "Course reminders, class notifications, certificate delivery.",
      SupportOS: "Ticket updates, CSAT surveys, agent assignments.",
      SecurityOS: "Security alerts, suspicious login warnings, MFA notifications.",
      SalesOS: "Lead follow-up reminders, opportunity updates, meeting notifications.",
      OperationsOS: "Task reminders, approval requests, workflow notifications.",
      IdentityOS: "OTP verification, password reset, login alerts.",
      AnalyticsOS: "Notification performance metrics, engagement analytics."
    }
  };
}
