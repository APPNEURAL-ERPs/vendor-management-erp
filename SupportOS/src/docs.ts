export function docs() {
  return {
    name: "SupportOS",
    version: "1.0.0",
    description: "Customer support, helpdesk, ticketing, SLA, knowledge base, escalation, and support quality management",
    auth: {
      headers: {
        "x-role": "owner | admin | support_admin | support_agent | support_lead | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      ticket: "A customer support issue or request that needs to be resolved",
      sla: "Service Level Agreement defining response and resolution timeframes",
      escalation: "When a ticket needs to be handled by higher-level support or engineering",
      resolution: "The solution provided to resolve a ticket",
      article: "Knowledge base article for customer self-service",
      macro: "Reusable response templates for common support scenarios"
    },
    ticketStatuses: {
      new: "New ticket, not yet assigned",
      open: "Open and being worked on",
      assigned: "Assigned to an agent",
      in_progress: "Agent is actively working on it",
      waiting_customer: "Waiting for customer response",
      waiting_internal: "Waiting for internal team",
      escalated: "Escalated to higher level support",
      resolved: "Issue resolved",
      closed: "Ticket closed",
      reopened: "Previously closed, now reopened",
      cancelled: "Ticket cancelled"
    },
    ticketPriorities: {
      low: "Low priority, can wait",
      medium: "Medium priority, normal handling",
      high: "High priority, needs quick attention",
      urgent: "Urgent, needs immediate attention",
      critical: "Critical, system down or major issue"
    },
    examples: {
      createTicket: {
        method: "POST",
        path: "/supportos/tickets",
        headers: { "x-role": "support_agent" },
        body: {
          title: "Cannot access my account",
          description: "I'm getting an error when trying to login",
          priority: "high",
          category: "login",
          channel: "email",
          customerName: "John Doe",
          customerEmail: "john@example.com",
          tags: ["login", "urgent"]
        }
      },
      listTickets: {
        method: "GET",
        path: "/supportos/tickets",
        headers: { "x-role": "support_agent" },
        query: "?status=open&priority=high"
      },
      createEscalation: {
        method: "POST",
        path: "/supportos/tickets/ticket_001/escalations",
        headers: { "x-role": "support_lead" },
        body: {
          reason: "Customer is VIP, needs management attention",
          level: "management"
        }
      },
      submitCSAT: {
        method: "POST",
        path: "/supportos/tickets/ticket_001/csat",
        headers: { "x-role": "viewer" },
        body: {
          rating: 5,
          comment: "Great support!",
          feedbackType: "resolved"
        }
      }
    }
  };
}
