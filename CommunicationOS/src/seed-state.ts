import { CommunicationState } from "./domain";
import { emptyState } from "./core/datastore";
import { nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): CommunicationState {
  const state = emptyState();
  const createdAt = nowIso();

  state.channels.push(
    {
      id: "channel_email",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "email",
      name: "Email",
      description: "Email communication channel",
      type: "email",
      status: "active",
      isPrivate: false,
      tags: ["email", "formal"],
      metadata: {},
      config: { smtpServer: "smtp.example.com", port: 587 }
    },
    {
      id: "channel_whatsapp",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "whatsapp",
      name: "WhatsApp",
      description: "WhatsApp Business messaging",
      type: "whatsapp",
      status: "active",
      isPrivate: false,
      tags: ["whatsapp", "mobile"],
      metadata: {},
      config: { phoneNumberId: "+1234567890" }
    },
    {
      id: "channel_internal",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "internal",
      name: "Internal Chat",
      description: "Internal team communication",
      type: "internal",
      status: "active",
      isPrivate: false,
      tags: ["internal", "team"],
      metadata: {},
      config: {}
    },
    {
      id: "channel_sms",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "sms",
      name: "SMS",
      description: "SMS text messaging",
      type: "sms",
      status: "active",
      isPrivate: false,
      tags: ["sms", "mobile"],
      metadata: {},
      config: { provider: "twilio" }
    }
  );

  state.contacts.push(
    {
      id: "contact_john",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      email: "john@example.com",
      phone: "+1234567891",
      displayName: "John Doe",
      firstName: "John",
      lastName: "Doe",
      status: "active",
      metadata: {},
      tags: ["customer", "sales"]
    },
    {
      id: "contact_jane",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      email: "jane@example.com",
      phone: "+1234567892",
      displayName: "Jane Smith",
      firstName: "Jane",
      lastName: "Smith",
      status: "active",
      metadata: {},
      tags: ["customer", "support"]
    },
    {
      id: "contact_acme",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      email: "contact@acmecorp.com",
      displayName: "Acme Corporation",
      status: "active",
      metadata: {},
      tags: ["client", "enterprise"]
    }
  );

  state.conversations.push(
    {
      id: "conv_sales_lead",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      channelId: "channel_email",
      title: "Sales Lead - John Doe",
      status: "open",
      priority: "high",
      type: "sales",
      assigneeId: "user_sales_1",
      contactId: "contact_john",
      tags: ["lead", "enterprise"],
      metadata: {},
      lastMessageAt: nowIso(),
      messageCount: 5,
      unreadCount: 2,
      slaBreached: false
    },
    {
      id: "conv_support_ticket",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      channelId: "channel_whatsapp",
      title: "Support - Jane Smith",
      status: "waiting_reply",
      priority: "normal",
      type: "support",
      assigneeId: "user_support_1",
      contactId: "contact_jane",
      tags: ["bug", "urgent"],
      metadata: {},
      lastMessageAt: nowIso(),
      messageCount: 8,
      unreadCount: 0,
      slaBreached: false
    },
    {
      id: "conv_internal_team",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      channelId: "channel_internal",
      title: "Team Standup",
      status: "open",
      priority: "low",
      type: "internal",
      tags: ["daily", "standup"],
      metadata: {},
      lastMessageAt: nowIso(),
      messageCount: 12,
      unreadCount: 3,
      slaBreached: false
    }
  );

  state.messages.push(
    {
      id: "msg_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      conversationId: "conv_sales_lead",
      channelId: "channel_email",
      senderId: "contact_john",
      senderType: "contact",
      content: "Hi, I'm interested in your AI automation services. Can you send me more details?",
      contentType: "text",
      direction: "inbound",
      status: "read",
      attachments: [],
      metadata: {},
      isRead: true,
      readAt: createdAt
    },
    {
      id: "msg_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      conversationId: "conv_sales_lead",
      channelId: "channel_email",
      senderId: "user_sales_1",
      senderType: "user",
      content: "Hello John! Thank you for your interest. I'd be happy to share our AI automation capabilities with you.",
      contentType: "text",
      direction: "outbound",
      status: "delivered",
      attachments: [],
      metadata: {},
      isRead: true,
      sentAt: createdAt,
      deliveredAt: createdAt
    },
    {
      id: "msg_3",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      conversationId: "conv_support_ticket",
      channelId: "channel_whatsapp",
      senderId: "contact_jane",
      senderType: "contact",
      content: "The login button is not working on the dashboard",
      contentType: "text",
      direction: "inbound",
      status: "read",
      attachments: [],
      metadata: { hasScreenshot: true },
      isRead: true,
      readAt: createdAt
    }
  );

  state.messageTemplates.push(
    {
      id: "template_welcome",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "welcome_email",
      name: "Welcome Email",
      description: "Initial welcome message for new customers",
      channelType: "email",
      subject: "Welcome to {{company_name}}!",
      content: "Dear {{customer_name}},\n\nWelcome aboard! We're excited to have you.\n\nBest regards,\n{{sender_name}}",
      variables: ["company_name", "customer_name", "sender_name"],
      status: "active",
      tags: ["onboarding", "email"],
      createdBy: "user_admin",
      metadata: {}
    },
    {
      id: "template_follow_up",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "follow_up_whatsapp",
      name: "Follow-up WhatsApp",
      description: "Follow-up message for sales leads",
      channelType: "whatsapp",
      content: "Hi {{name}}! Just checking in on our conversation. Let me know if you have any questions!",
      variables: ["name"],
      status: "active",
      tags: ["sales", "whatsapp"],
      createdBy: "user_sales_1",
      metadata: {}
    },
    {
      id: "template_support_ack",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "support_acknowledgment",
      name: "Support Acknowledgment",
      description: "Auto-acknowledgment for support tickets",
      channelType: "email",
      subject: "We received your support request - {{ticket_id}}",
      content: "Hi {{customer_name}},\n\nWe've received your request and our team is looking into it.\n\nTicket ID: {{ticket_id}}\nExpected response: within {{response_time}} hours.\n\nThank you for your patience.",
      variables: ["customer_name", "ticket_id", "response_time"],
      status: "active",
      tags: ["support", "email"],
      createdBy: "user_support_1",
      metadata: {}
    }
  );

  state.calls.push(
    {
      id: "call_demo_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      conversationId: "conv_sales_lead",
      initiatorId: "user_sales_1",
      direction: "outbound",
      status: "answered",
      type: "voice",
      duration: 1800,
      startedAt: createdAt,
      answeredAt: createdAt,
      endedAt: createdAt,
      notes: "Discovery call with John. Interested in AI automation.",
      metadata: {}
    }
  );

  state.conferences.push(
    {
      id: "conf_team_standup",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "team_standup",
      name: "Daily Team Standup",
      description: "Quick sync on daily progress and blockers",
      type: "meeting",
      status: "active",
      scheduledStartAt: new Date(Date.now() + 3600000).toISOString(),
      scheduledEndAt: new Date(Date.now() + 5400000).toISOString(),
      hostId: "user_lead",
      maxParticipants: 10,
      joinUrl: "https://meet.example.com/standup-123",
      recordingEnabled: false,
      agenda: "1. Yesterday accomplishments\n2. Today's plan\n3. Blockers",
      metadata: {}
    },
    {
      id: "conf_training_session",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "product_training",
      name: "Product Training - Q1 2024",
      description: "Quarterly product training for sales team",
      type: "training",
      status: "active",
      scheduledStartAt: new Date(Date.now() + 86400000).toISOString(),
      scheduledEndAt: new Date(Date.now() + 97200000).toISOString(),
      hostId: "user_trainer",
      maxParticipants: 25,
      joinUrl: "https://meet.example.com/training-456",
      recordingEnabled: true,
      agenda: "New features overview\nCompetitive positioning\nDemo walkthrough",
      metadata: {}
    }
  );

  state.presences.push(
    {
      id: "presence_user_sales_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      userId: "user_sales_1",
      status: "online",
      statusMessage: "Available for calls",
      lastSeenAt: createdAt,
      metadata: {}
    },
    {
      id: "presence_user_support_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      userId: "user_support_1",
      status: "busy",
      statusMessage: "In a customer call",
      lastSeenAt: createdAt,
      metadata: {}
    },
    {
      id: "presence_user_lead",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      userId: "user_lead",
      status: "away",
      statusMessage: "Back in 30 minutes",
      lastSeenAt: createdAt,
      metadata: {}
    }
  );

  state.announcements.push(
    {
      id: "announcement_maintenance",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "scheduled_maintenance",
      title: "Scheduled Maintenance - January 20",
      content: "Our platform will undergo scheduled maintenance on January 20, 2024 from 2:00 AM to 4:00 AM UTC. Please plan accordingly.",
      channelType: "email",
      targetType: "all",
      targetIds: [],
      status: "active",
      scheduledAt: new Date(Date.now() + 604800000).toISOString(),
      sentBy: "user_admin",
      recipientCount: 150,
      deliveredCount: 145,
      readCount: 89,
      tags: ["maintenance", "announcement"],
      metadata: {}
    }
  );

  state.consents.push(
    {
      id: "consent_john_email",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      contactId: "contact_john",
      channelType: "email",
      consented: true,
      consentedAt: createdAt,
      source: "web",
      metadata: {}
    },
    {
      id: "consent_john_sms",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      contactId: "contact_john",
      channelType: "sms",
      consented: true,
      consentedAt: createdAt,
      source: "manual",
      metadata: {}
    }
  );

  state.events.push({
    id: "event_bootstrap",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "communicationos.seeded",
    source: "CommunicationOS",
    data: { message: "CommunicationOS demo data seeded" }
  });

  return state;
}
