import { SupportState } from "./domain";
import { emptyState } from "./core/datastore";
import { nowIso } from "./core/id";
import { addHours } from "./core/utils";

export function createSeedState(tenantId = "demo-tenant"): SupportState {
  const state = emptyState();
  const createdAt = nowIso();

  state.slas.push(
    {
      id: "sla_critical",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Critical SLA",
      description: "For critical priority issues",
      priority: "critical",
      firstResponseHours: 0.5,
      resolutionHours: 4,
      status: "active",
      isDefault: true
    },
    {
      id: "sla_urgent",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Urgent SLA",
      description: "For urgent priority issues",
      priority: "urgent",
      firstResponseHours: 2,
      resolutionHours: 24,
      status: "active",
      isDefault: false
    },
    {
      id: "sla_high",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "High Priority SLA",
      description: "For high priority issues",
      priority: "high",
      firstResponseHours: 4,
      resolutionHours: 48,
      status: "active",
      isDefault: false
    },
    {
      id: "sla_medium",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Medium Priority SLA",
      description: "For medium priority issues",
      priority: "medium",
      firstResponseHours: 24,
      resolutionHours: 120,
      status: "active",
      isDefault: false
    },
    {
      id: "sla_low",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Low Priority SLA",
      description: "For low priority issues",
      priority: "low",
      firstResponseHours: 48,
      resolutionHours: 240,
      status: "active",
      isDefault: false
    }
  );

  state.agents.push(
    {
      id: "agent_alice",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Alice Johnson",
      email: "alice@support.com",
      role: "agent",
      status: "available",
      skills: ["billing", "technical"],
      teams: ["billing-team"],
      maxConcurrentTickets: 15,
      currentTicketCount: 5,
      avgResponseTimeMinutes: 45,
      csatScore: 4.5
    },
    {
      id: "agent_bob",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Bob Smith",
      email: "bob@support.com",
      role: "lead",
      status: "available",
      skills: ["technical", "escalations"],
      teams: ["technical-team"],
      maxConcurrentTickets: 10,
      currentTicketCount: 8,
      avgResponseTimeMinutes: 30,
      csatScore: 4.8
    },
    {
      id: "agent_carol",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Carol Davis",
      email: "carol@support.com",
      role: "agent",
      status: "busy",
      skills: ["account", "access"],
      teams: ["account-team"],
      maxConcurrentTickets: 12,
      currentTicketCount: 12,
      avgResponseTimeMinutes: 60,
      csatScore: 4.2
    }
  );

  state.queues.push(
    {
      id: "queue_all",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "All Tickets",
      type: "all",
      filter: {},
      assignedAgentIds: [],
      status: "active",
      order: 0
    },
    {
      id: "queue_unassigned",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Unassigned Tickets",
      type: "unassigned",
      filter: { assignedAgentId: null },
      assignedAgentIds: [],
      status: "active",
      order: 1
    },
    {
      id: "queue_priority",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Critical & Urgent",
      type: "priority",
      filter: { priority: ["critical", "urgent"] },
      assignedAgentIds: [],
      status: "active",
      order: 2
    }
  );

  state.macros.push(
    {
      id: "macro_welcome",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "welcome",
      name: "Welcome Message",
      content: "Hello! Thank you for contacting our support team. How can I help you today?",
      category: "general",
      tags: ["welcome", "greeting"],
      status: "active",
      usageCount: 156
    },
    {
      id: "macro_password_reset",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "password_reset",
      name: "Password Reset Instructions",
      content: "To reset your password, please follow these steps:\n1. Go to the login page\n2. Click on 'Forgot Password'\n3. Enter your email address\n4. Check your email for the reset link\n5. Click the link and set a new password",
      category: "account",
      tags: ["password", "reset", "account"],
      status: "active",
      usageCount: 89
    },
    {
      id: "macro_refund_process",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Refund Process",
      content: "I understand you'd like a refund. Let me help you with that. Refunds are typically processed within 5-7 business days. I'll submit this request to our billing team now.",
      category: "billing",
      tags: ["refund", "billing"],
      status: "active",
      usageCount: 45
    }
  );

  state.articles.push(
    {
      id: "article_password_reset",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "How to Reset Your Password",
      content: "This guide explains how to reset your password if you've forgotten it or want to change it for security reasons.\n\nSteps:\n1. Navigate to the login page\n2. Click 'Forgot Password' link\n3. Enter your registered email address\n4. Check your inbox for a password reset email\n5. Click the reset link within 24 hours\n6. Enter your new password (must be at least 8 characters)\n7. Confirm and log in",
      summary: "Step-by-step guide to reset your account password",
      category: "Account",
      tags: ["password", "account", "reset", "security"],
      status: "active",
      authorId: "agent_alice",
      authorName: "Alice Johnson",
      viewCount: 1245,
      helpfulCount: 892,
      notHelpfulCount: 34,
      relatedTicketIds: [],
      metadata: {}
    },
    {
      id: "article_billing_faq",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "Billing FAQ",
      content: "Common billing questions and answers:\n\nQ: When will I be charged?\nA: You're charged on your subscription anniversary date.\n\nQ: How do I update my payment method?\nA: Go to Settings > Billing > Payment Methods.\n\nQ: Can I get a refund?\nA: Refunds are available within 30 days of purchase for annual plans.\n\nQ: Where can I find my invoices?\nA: Invoices are available in Settings > Billing > Invoice History.",
      summary: "Frequently asked questions about billing and payments",
      category: "Billing",
      tags: ["billing", "payment", "invoice", "refund"],
      status: "active",
      authorId: "agent_alice",
      authorName: "Alice Johnson",
      viewCount: 2341,
      helpfulCount: 1876,
      notHelpfulCount: 67,
      relatedTicketIds: [],
      metadata: {}
    },
    {
      id: "article_technical_support",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "Technical Troubleshooting Guide",
      content: "Having technical issues? Try these steps:\n\n1. Clear your browser cache and cookies\n2. Try using a different browser or incognito mode\n3. Disable browser extensions\n4. Check your internet connection\n5. Try clearing DNS cache\n6. Disable VPN if you're using one\n\nIf issues persist, please contact support with:\n- Browser name and version\n- Operating system\n- Screenshots of any error messages\n- Steps to reproduce the issue",
      summary: "Common technical issues and their solutions",
      category: "Technical",
      tags: ["technical", "troubleshooting", "browser", "errors"],
      status: "active",
      authorId: "agent_bob",
      authorName: "Bob Smith",
      viewCount: 3421,
      helpfulCount: 2890,
      notHelpfulCount: 123,
      relatedTicketIds: [],
      metadata: {}
    }
  );

  const ticket1CreatedAt = addHours(new Date(), -2).toISOString();
  state.tickets.push({
    id: "ticket_001",
    tenantId,
    createdAt: ticket1CreatedAt,
    updatedAt: ticket1CreatedAt,
    title: "Cannot login to my account",
    description: "I'm trying to login but keep getting an error message. I've tried resetting my password but didn't receive the email.",
    status: "open",
    priority: "high",
    category: "login",
    channel: "email",
    customerId: "cust_001",
    customerName: "John Doe",
    customerEmail: "john@example.com",
    assignedAgentId: "agent_alice",
    tags: ["login", "password", "urgent"],
    metadata: {},
    responseCount: 1,
    reopenCount: 0,
    firstResponseAt: addHours(new Date(ticket1CreatedAt), 1).toISOString()
  });

  const slaStatus1: any = {
    id: "slastatus_001",
    tenantId,
    createdAt: ticket1CreatedAt,
    updatedAt: ticket1CreatedAt,
    ticketId: "ticket_001",
    slaId: "sla_high",
    status: "at_risk",
    firstResponseDueAt: addHours(new Date(ticket1CreatedAt), 4).toISOString(),
    resolutionDueAt: addHours(new Date(ticket1CreatedAt), 48).toISOString(),
    firstResponseMet: true,
    resolutionMet: false
  };
  state.slaStatuses.push(slaStatus1);

  state.ticketComments.push({
    id: "comment_001",
    tenantId,
    createdAt: addHours(new Date(ticket1CreatedAt), 1).toISOString(),
    updatedAt: addHours(new Date(ticket1CreatedAt), 1).toISOString(),
    ticketId: "ticket_001",
    authorId: "agent_alice",
    authorName: "Alice Johnson",
    content: "Hi John, I understand you're having trouble logging in. Let me check your account status and help resolve this issue. Can you confirm which email address you're using?",
    isInternal: false,
    attachments: []
  });

  const ticket2CreatedAt = addHours(new Date(), -24).toISOString();
  state.tickets.push({
    id: "ticket_002",
    tenantId,
    createdAt: ticket2CreatedAt,
    updatedAt: ticket2CreatedAt,
    title: "Billing discrepancy on last invoice",
    description: "I was charged $150 but my plan is only $99/month. Please review and correct this.",
    status: "in_progress",
    priority: "medium",
    category: "billing",
    channel: "website",
    customerId: "cust_002",
    customerName: "Jane Smith",
    customerEmail: "jane@company.com",
    assignedAgentId: "agent_alice",
    assignedTeam: "billing-team",
    tags: ["billing", "invoice", "discrepancy"],
    metadata: {},
    responseCount: 2,
    reopenCount: 0,
    firstResponseAt: addHours(new Date(ticket2CreatedAt), 2).toISOString()
  });

  state.ticketComments.push({
    id: "comment_002",
    tenantId,
    createdAt: addHours(new Date(ticket2CreatedAt), 2).toISOString(),
    updatedAt: addHours(new Date(ticket2CreatedAt), 2).toISOString(),
    ticketId: "ticket_002",
    authorId: "agent_alice",
    authorName: "Alice Johnson",
    content: "Hello Jane, thank you for bringing this to our attention. I've reviewed your account and can see the charge. Let me investigate this with our billing team.",
    isInternal: false,
    attachments: []
  });

  state.ticketComments.push({
    id: "comment_003",
    tenantId,
    createdAt: addHours(new Date(ticket2CreatedAt), 4).toISOString(),
    updatedAt: addHours(new Date(ticket2CreatedAt), 4).toISOString(),
    ticketId: "ticket_002",
    authorId: "agent_alice",
    authorName: "Alice Johnson",
    content: "Internal: Checking with billing team about the extra charge.",
    isInternal: true,
    attachments: []
  });

  const ticket3CreatedAt = addHours(new Date(), -72).toISOString();
  state.tickets.push({
    id: "ticket_003",
    tenantId,
    createdAt: ticket3CreatedAt,
    updatedAt: ticket3CreatedAt,
    title: "Feature request: Bulk import users",
    description: "It would be great if we could import multiple users at once using a CSV file. Currently we have to add them one by one which is time consuming.",
    status: "open",
    priority: "low",
    category: "feature_request",
    channel: "website",
    customerId: "cust_003",
    customerName: "Acme Corp",
    customerEmail: "support@acme.com",
    tags: ["feature-request", "users", "import"],
    metadata: {},
    responseCount: 0,
    reopenCount: 0
  });

  const ticket4CreatedAt = addHours(new Date(), -1).toISOString();
  state.tickets.push({
    id: "ticket_004",
    tenantId,
    createdAt: ticket4CreatedAt,
    updatedAt: ticket4CreatedAt,
    title: "System is down - Cannot access dashboard",
    description: "Critical issue: Our entire team cannot access the dashboard. We're getting a 500 error. This is affecting our entire organization.",
    status: "escalated",
    priority: "critical",
    category: "technical",
    channel: "phone",
    customerId: "cust_004",
    customerName: "Enterprise Client",
    customerEmail: "admin@enterprise.com",
    assignedAgentId: "agent_bob",
    assignedTeam: "technical-team",
    tags: ["critical", "system-down", "dashboard"],
    metadata: {},
    responseCount: 1,
    reopenCount: 0,
    firstResponseAt: addHours(new Date(ticket4CreatedAt), 0.5).toISOString()
  });

  state.escalations.push({
    id: "esc_001",
    tenantId,
    createdAt: ticket4CreatedAt,
    updatedAt: ticket4CreatedAt,
    ticketId: "ticket_004",
    reason: "Critical system outage affecting multiple users",
    level: "engineering",
    status: "acknowledged",
    escalatedBy: "agent_bob",
    escalatedTo: "eng_team",
    escalatedToTeam: "engineering",
    notes: "Escalated to engineering team for immediate investigation",
    resolvedAt: undefined
  });

  state.conversations.push({
    id: "conv_001",
    tenantId,
    createdAt: addHours(new Date(), -1).toISOString(),
    updatedAt: addHours(new Date(), -0.5).toISOString(),
    ticketId: "ticket_004",
    customerId: "cust_004",
    subject: "Urgent: System access issue",
    status: "open",
    lastMessageAt: addHours(new Date(), -0.5).toISOString(),
    messageCount: 3
  });

  state.conversationMessages.push(
    {
      id: "msg_001",
      tenantId,
      createdAt: addHours(new Date(), -1).toISOString(),
      updatedAt: addHours(new Date(), -1).toISOString(),
      conversationId: "conv_001",
      senderId: "cust_004",
      senderName: "Enterprise Client",
      senderType: "customer",
      content: "We cannot access our dashboard. This is affecting 50+ users. Please help immediately!",
      isInternal: false,
      channel: "phone"
    },
    {
      id: "msg_002",
      tenantId,
      createdAt: addHours(new Date(), -0.9).toISOString(),
      updatedAt: addHours(new Date(), -0.9).toISOString(),
      conversationId: "conv_001",
      senderId: "agent_bob",
      senderName: "Bob Smith",
      senderType: "agent",
      content: "I understand the urgency. I'm escalating this to our engineering team right now. They'll be investigating within minutes.",
      isInternal: false,
      channel: "phone"
    },
    {
      id: "msg_003",
      tenantId,
      createdAt: addHours(new Date(), -0.5).toISOString(),
      updatedAt: addHours(new Date(), -0.5).toISOString(),
      conversationId: "conv_001",
      senderId: "agent_bob",
      senderName: "Bob Smith",
      senderType: "agent",
      content: "Update: Engineering team is investigating. We expect a resolution within 2 hours. I'll keep you updated.",
      isInternal: false,
      channel: "phone"
    }
  );

  state.csatResponses.push(
    {
      id: "csat_001",
      tenantId,
      createdAt: addHours(new Date(), -48).toISOString(),
      updatedAt: addHours(new Date(), -48).toISOString(),
      ticketId: "ticket_002",
      customerId: "cust_002",
      rating: 5,
      comment: "Great support! Quick response and issue resolved.",
      feedbackType: "resolved",
      submittedAt: addHours(new Date(), -48).toISOString()
    },
    {
      id: "csat_002",
      tenantId,
      createdAt: addHours(new Date(), -120).toISOString(),
      updatedAt: addHours(new Date(), -120).toISOString(),
      ticketId: "ticket_001",
      customerId: "cust_001",
      rating: 4,
      comment: "Good help but took a bit longer than expected.",
      feedbackType: "resolved",
      submittedAt: addHours(new Date(), -120).toISOString()
    }
  );

  state.events.push({
    id: "event_seed",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "supportos.seeded",
    source: "SupportOS",
    data: { message: "SupportOS demo data seeded" }
  });

  return state;
}
