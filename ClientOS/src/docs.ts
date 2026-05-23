export function docs() {
  return {
    name: "ClientOS",
    version: "1.0.0",
    description: "ClientOS: Client relationship management, onboarding, requirements, proposals, communication, delivery, support, health scores, and retention.",
    auth: {
      headers: {
        "x-role": "owner | admin | client_manager | account_manager | project_manager | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      client: "A client record representing a company or individual. Tracks status, priority, health score, and lifecycle.",
      contact: "Contact person associated with a client. Multiple contacts per client supported.",
      account: "Billing account for a client. Tracks payment terms, credit limit, and balance.",
      project: "A project delivery for a client. Contains deliverables, tasks, and milestones.",
      meeting: "Scheduled or completed meetings with clients. Includes notes, attendees, and action items.",
      deliverable: "A deliverable within a project. Tracks approval status and delivery dates.",
      requirement: "Client requirement or feature request. Can be approved, rejected, or implemented.",
      proposal: "Sales proposal sent to clients. Includes scope, pricing, and timeline.",
      contract: "Signed agreement with a client. Tracks contract value, dates, and renewal status.",
      healthScore: "Composite score measuring client relationship health. Factors: engagement, payment, communication, satisfaction, delivery.",
      successPlan: "Strategic plan for client success. Includes goals, milestones, and check-ins.",
      supportTicket: "Support issue or request from a client. Tracks priority, status, and resolution.",
      invoice: "Billing invoice sent to a client. Tracks payment status and due dates.",
      task: "Work task related to a client or project. Tracks status, assignment, and time.",
      risk: "Identified risk for a client or project. Tracks severity, status, and mitigation plan."
    },
    apiEndpoints: {
      overview: {
        method: "GET",
        path: "/clientos/overview",
        description: "Get overview statistics for all clients",
        example: {
          headers: { "x-role": "viewer" },
          response: {
            clients: { total: 3, byStatus: { active: 1, proposal_sent: 1, qualified: 1 } },
            projects: { total: 1, active: 1, completed: 0 },
            healthScores: { average: 61, atRisk: 0 }
          }
        }
      },
      clients: {
        list: {
          method: "GET",
          path: "/clientos/clients",
          description: "List all clients with optional filters",
          query: { status: "filter by client status", search: "search by name/tags", segment: "filter by segment", tags: "filter by tags" },
          example: { method: "GET", path: "/clientos/clients?status=active&search=acme" }
        },
        create: {
          method: "POST",
          path: "/clientos/clients",
          description: "Create a new client",
          body: { name: "required", status: "optional, defaults to lead", segment: "optional", priority: "optional", tags: "optional array" },
          example: {
            method: "POST",
            path: "/clientos/clients",
            body: { name: "New Client Corp", status: "qualified", segment: "enterprise", priority: "high", tags: ["ai", "automation"] }
          }
        },
        get: {
          method: "GET",
          path: "/clientos/clients/:id",
          description: "Get a specific client by ID"
        },
        update: {
          method: "PATCH",
          path: "/clientos/clients/:id",
          description: "Update a client"
        },
        delete: {
          method: "DELETE",
          path: "/clientos/clients/:id",
          description: "Delete a client"
        }
      },
      contacts: {
        list: {
          method: "GET",
          path: "/clientos/clients/:id/contacts",
          description: "List contacts for a client"
        },
        create: {
          method: "POST",
          path: "/clientos/clients/:id/contacts",
          description: "Create a contact for a client",
          body: { name: "required", email: "required", phone: "optional", role: "required", isPrimary: "optional" }
        }
      },
      projects: {
        list: {
          method: "GET",
          path: "/clientos/clients/:id/projects",
          description: "List projects for a client"
        },
        create: {
          method: "POST",
          path: "/clientos/clients/:id/projects",
          description: "Create a project for a client",
          body: { name: "required", description: "optional", startDate: "optional", targetDate: "optional", budget: "optional", tags: "optional" }
        }
      },
      meetings: {
        listClient: {
          method: "GET",
          path: "/clientos/clients/:id/meetings",
          description: "List meetings for a client"
        },
        listAll: {
          method: "GET",
          path: "/clientos/meetings",
          description: "List all meetings",
          query: { clientId: "optional, filter by client" }
        },
        create: {
          method: "POST",
          path: "/clientos/clients/:id/meetings",
          description: "Schedule a meeting",
          body: { title: "required", type: "required", scheduledAt: "required", duration: "optional", location: "optional", meetingLink: "optional", attendeeIds: "optional", attendeeNames: "optional" }
        },
        update: {
          method: "PATCH",
          path: "/clientos/meetings/:id",
          description: "Update a meeting (e.g., add notes, change status)"
        }
      },
      deliverables: {
        list: {
          method: "GET",
          path: "/clientos/deliverables",
          description: "List all deliverables",
          query: { projectId: "optional, filter by project" }
        },
        create: {
          method: "POST",
          path: "/clientos/deliverables",
          description: "Create a deliverable",
          body: { projectId: "required", clientId: "required", title: "required", description: "optional", dueDate: "optional", tags: "optional" }
        }
      },
      healthScores: {
        list: {
          method: "GET",
          path: "/clientos/health-scores",
          description: "List all health scores",
          query: { clientId: "optional, filter by client" }
        },
        get: {
          method: "GET",
          path: "/clientos/clients/:id/health",
          description: "Get health score for a client"
        },
        update: {
          method: "PUT",
          path: "/clientos/clients/:id/health",
          description: "Update health score for a client",
          body: { overallScore: "required (0-100)", engagementScore: "optional", paymentScore: "optional", communicationScore: "optional", satisfactionScore: "optional", deliveryScore: "optional", factors: "optional array", risks: "optional array", recommendations: "optional array" }
        }
      },
      successPlans: {
        list: {
          method: "GET",
          path: "/clientos/clients/:id/success-plans",
          description: "List success plans for a client"
        },
        create: {
          method: "POST",
          path: "/clientos/clients/:id/success-plans",
          description: "Create a success plan",
          body: { title: "required", description: "optional", ownerId: "optional" }
        }
      },
      supportTickets: {
        list: {
          method: "GET",
          path: "/clientos/clients/:id/support-tickets",
          description: "List support tickets for a client"
        },
        create: {
          method: "POST",
          path: "/clientos/clients/:id/support-tickets",
          description: "Create a support ticket",
          body: { title: "required", description: "required", type: "optional", priority: "optional", tags: "optional" }
        }
      },
      invoices: {
        list: {
          method: "GET",
          path: "/clientos/clients/:id/invoices",
          description: "List invoices for a client"
        },
        create: {
          method: "POST",
          path: "/clientos/clients/:id/invoices",
          description: "Create an invoice",
          body: { number: "required", title: "required", amount: "required", tax: "optional", currency: "optional", issueDate: "required", dueDate: "required", notes: "optional" }
        }
      },
      tasks: {
        list: {
          method: "GET",
          path: "/clientos/tasks",
          description: "List all tasks",
          query: { projectId: "optional", clientId: "optional", status: "optional" }
        },
        create: {
          method: "POST",
          path: "/clientos/tasks",
          description: "Create a task",
          body: { title: "required", projectId: "optional", clientId: "optional", description: "optional", priority: "optional", assigneeId: "optional", dueDate: "optional", estimatedHours: "optional", tags: "optional" }
        }
      },
      risks: {
        list: {
          method: "GET",
          path: "/clientos/clients/:id/risks",
          description: "List risks for a client"
        },
        create: {
          method: "POST",
          path: "/clientos/clients/:id/risks",
          description: "Create a risk",
          body: { title: "required", description: "required", category: "optional", severity: "optional", mitigationPlan: "optional" }
        }
      }
    },
    clientStatuses: ["lead", "qualified", "proposal_sent", "negotiation", "active", "on_hold", "completed", "renewal_due", "inactive", "lost", "archived"],
    meetingTypes: ["discovery", "kickoff", "requirement_discussion", "design_review", "sprint_review", "status", "uat", "delivery", "renewal"],
    meetingStatuses: ["scheduled", "completed", "cancelled", "rescheduled"],
    supportTicketStatuses: ["open", "assigned", "in_progress", "waiting_client", "resolved", "reopened", "closed", "escalated"],
    paymentStatuses: ["pending", "partial", "paid", "overdue", "disputed", "refunded", "cancelled"],
    taskStatuses: ["backlog", "planned", "in_progress", "waiting_client", "in_review", "approved", "blocked", "done"],
    riskLevels: ["low", "medium", "high", "critical"],
    exampleWorkflows: {
      clientOnboarding: {
        steps: ["Create client", "Add contacts", "Create account", "Create success plan", "Schedule kickoff meeting"]
      },
      projectDelivery: {
        steps: ["Create project", "Add requirements", "Create deliverables", "Track tasks", "Request approvals", "Deliver and get sign-off"]
      },
      healthMonitoring: {
        steps: ["Check health score", "Review risk factors", "Update health metrics", "Take recommended actions", "Schedule check-in"]
      }
    }
  };
}
