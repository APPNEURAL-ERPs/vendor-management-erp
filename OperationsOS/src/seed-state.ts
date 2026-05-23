import { OperationsState } from "./domain";
import { emptyState } from "./core/datastore";
import { nowIso, plusDays, newId } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): OperationsState {
  const state = emptyState();
  const createdAt = nowIso();

  state.tasks.push(
    {
      id: newId("task"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "task-001",
      title: "Prepare client proposal",
      description: "Create a comprehensive proposal for the new client",
      status: "todo",
      priority: "high",
      assigneeId: "user-001",
      assigneeName: "John Doe",
      dueDate: plusDays(3),
      estimatedHours: 8,
      tags: ["client", "proposal"],
      dependencies: [],
      metadata: {}
    },
    {
      id: newId("task"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "task-002",
      title: "Review website content",
      description: "Review and approve all website content updates",
      status: "in_progress",
      priority: "medium",
      assigneeId: "user-002",
      assigneeName: "Jane Smith",
      dueDate: plusDays(1),
      estimatedHours: 4,
      tags: ["website", "content"],
      dependencies: [],
      metadata: {}
    },
    {
      id: newId("task"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "task-003",
      title: "Generate invoice",
      description: "Create invoice for completed project",
      status: "blocked",
      priority: "high",
      assigneeId: "user-003",
      assigneeName: "Bob Johnson",
      dueDate: plusDays(-1),
      estimatedHours: 2,
      tags: ["finance", "invoice"],
      dependencies: [],
      metadata: {}
    },
    {
      id: newId("task"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "task-004",
      title: "Publish LinkedIn post",
      description: "Create and publish weekly LinkedIn update",
      status: "done",
      priority: "low",
      assigneeId: "user-001",
      assigneeName: "John Doe",
      dueDate: plusDays(-2),
      estimatedHours: 1,
      actualHours: 1,
      tags: ["marketing", "social"],
      dependencies: [],
      metadata: {}
    },
    {
      id: newId("task"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "task-005",
      title: "Fix production issue",
      description: "Critical bug in production needs immediate attention",
      status: "in_progress",
      priority: "critical",
      assigneeId: "user-002",
      assigneeName: "Jane Smith",
      dueDate: nowIso(),
      estimatedHours: 6,
      tags: ["bug", "production"],
      dependencies: [],
      metadata: {}
    }
  );

  state.checklists.push(
    {
      id: newId("checklist"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "client-onboard-checklist",
      name: "Client Onboarding Checklist",
      description: "Standard checklist for onboarding new clients",
      type: "client_onboarding",
      status: "active",
      assigneeId: "user-001",
      dueDate: plusDays(7),
      items: [
        { id: newId("item"), text: "Create client profile", completed: true, completedAt: createdAt, completedBy: "user-001", order: 0 },
        { id: newId("item"), text: "Send welcome message", completed: true, completedAt: createdAt, completedBy: "user-001", order: 1 },
        { id: newId("item"), text: "Collect requirements", completed: false, order: 2 },
        { id: newId("item"), text: "Collect brand assets", completed: false, order: 3 },
        { id: newId("item"), text: "Schedule kickoff meeting", completed: false, order: 4 },
        { id: newId("item"), text: "Create project workspace", completed: false, order: 5 },
        { id: newId("item"), text: "Assign delivery team", completed: false, order: 6 }
      ],
      metadata: {}
    },
    {
      id: newId("checklist"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "website-launch-checklist",
      name: "Website Launch Checklist",
      description: "Checklist for launching a new website",
      type: "deployment",
      status: "active",
      items: [
        { id: newId("item"), text: "Final QA check", completed: true, completedAt: createdAt, completedBy: "user-002", order: 0 },
        { id: newId("item"), text: "SEO check", completed: true, completedAt: createdAt, completedBy: "user-002", order: 1 },
        { id: newId("item"), text: "Performance test", completed: false, order: 2 },
        { id: newId("item"), text: "Deployment approval", completed: false, order: 3 },
        { id: newId("item"), text: "Post-launch monitoring", completed: false, order: 4 }
      ],
      metadata: {}
    }
  );

  state.sops.push(
    {
      id: newId("sop"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "client-onboarding-sop",
      name: "Client Onboarding SOP",
      description: "Standard procedure for onboarding new clients",
      category: "client",
      status: "active",
      steps: [
        { order: 0, title: "Create client profile", description: "Create client profile in CRM with all contact details", estimatedMinutes: 15, required: true },
        { order: 1, title: "Send welcome message", description: "Send personalized welcome email with next steps", estimatedMinutes: 10, required: true },
        { order: 2, title: "Collect requirements", description: "Schedule and conduct requirements gathering meeting", estimatedMinutes: 60, required: true },
        { order: 3, title: "Collect brand assets", description: "Request and organize brand guidelines, logos, and assets", estimatedMinutes: 30, required: true },
        { order: 4, title: "Schedule kickoff meeting", description: "Schedule project kickoff with all stakeholders", estimatedMinutes: 15, required: true },
        { order: 5, title: "Create project workspace", description: "Set up project folder, tools, and communication channels", estimatedMinutes: 20, required: true },
        { order: 6, title: "Assign delivery team", description: "Assign team members and set initial task assignments", estimatedMinutes: 15, required: true }
      ],
      ownerId: "user-001",
      estimatedMinutes: 165,
      tags: ["client", "onboarding", "standard"],
      version: 1
    }
  );

  state.processes.push(
    {
      id: newId("process"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "lead-to-client-process",
      name: "Lead to Client Process",
      description: "Process for converting a lead into a paying client",
      category: "sales",
      status: "active",
      steps: [
        { order: 0, title: "Initial contact", description: "Reach out to lead within 24 hours", assigneeId: "user-001", estimatedMinutes: 30, dependencies: [] },
        { order: 1, title: "Discovery call", description: "Schedule and conduct discovery call", assigneeId: "user-001", estimatedMinutes: 60, dependencies: [0] },
        { order: 2, title: "Proposal preparation", description: "Create customized proposal", assigneeId: "user-001", estimatedMinutes: 240, dependencies: [1] },
        { order: 3, title: "Proposal review", description: "Review and present proposal to client", assigneeId: "user-001", estimatedMinutes: 60, dependencies: [2] },
        { order: 4, title: "Contract negotiation", description: "Negotiate terms and pricing", assigneeId: "user-001", estimatedMinutes: 120, dependencies: [3] },
        { order: 5, title: "Contract signature", description: "Obtain signed contract", assigneeId: "user-001", estimatedMinutes: 15, dependencies: [4] }
      ],
      ownerId: "user-001",
      version: 1,
      tags: ["sales", "conversion"],
      metadata: {}
    }
  );

  state.issues.push(
    {
      id: newId("issue"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "issue-001",
      title: "Client not responding",
      description: "Client has not responded to last 3 emails",
      category: "communication",
      status: "open",
      priority: "high",
      assigneeId: "user-001",
      assigneeName: "John Doe",
      dueDate: plusDays(2),
      resolvedAt: undefined,
      closedAt: undefined,
      tags: ["client", "communication"],
      metadata: {}
    },
    {
      id: newId("issue"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "issue-002",
      title: "Payment delayed",
      description: "Invoice overdue by 15 days",
      category: "finance",
      status: "assigned",
      priority: "critical",
      assigneeId: "user-003",
      assigneeName: "Bob Johnson",
      dueDate: plusDays(-5),
      resolvedAt: undefined,
      closedAt: undefined,
      tags: ["finance", "payment"],
      metadata: {}
    },
    {
      id: newId("issue"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "issue-003",
      title: "Scope unclear",
      description: "Client requirements are vague and keep changing",
      category: "scope",
      status: "escalated",
      priority: "high",
      assigneeId: "user-002",
      assigneeName: "Jane Smith",
      dueDate: plusDays(1),
      resolvedAt: undefined,
      closedAt: undefined,
      tags: ["scope", "client"],
      metadata: {}
    }
  );

  state.incidents.push(
    {
      id: newId("incident"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "incident-001",
      title: "Production outage",
      description: "Website completely down, no access to services",
      severity: "critical",
      status: "investigating",
      assigneeId: "user-002",
      assigneeName: "Jane Smith",
      startedAt: nowIso(),
      acknowledgedAt: nowIso(),
      resolvedAt: undefined,
      closedAt: undefined,
      timeline: [
        { timestamp: createdAt, userId: "user-001", userName: "John Doe", action: "created", note: "Incident reported" },
        { timestamp: createdAt, userId: "user-002", userName: "Jane Smith", action: "acknowledged", note: "Investigating" }
      ],
      rootCause: undefined,
      impact: "All users unable to access services",
      actions: [],
      metadata: {}
    }
  );

  state.resources.push(
    {
      id: newId("resource"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "resource-001",
      name: "Design Team",
      type: "people",
      status: "active",
      allocatedTo: "user-002",
      capacity: 40,
      utilized: 32,
      metadata: {}
    },
    {
      id: newId("resource"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "resource-002",
      name: "Cloud Server - Production",
      type: "cloud_resource",
      status: "active",
      capacity: 100,
      utilized: 78,
      cost: 500,
      metadata: {}
    },
    {
      id: newId("resource"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "resource-003",
      name: "Meeting Room A",
      type: "meeting_room",
      status: "active",
      capacity: 10,
      metadata: {}
    }
  );

  state.slaRules.push(
    {
      id: newId("slarule"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "sla-support-high",
      name: "High Priority Support",
      description: "SLA for high priority support requests",
      type: "support",
      status: "active",
      priority: "high",
      responseTimeMinutes: 60,
      resolutionTimeMinutes: 240,
      escalationAfterMinutes: 120,
      notifyAtMinutes: [30, 60, 120],
      metadata: {}
    },
    {
      id: newId("slarule"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "sla-task-critical",
      name: "Critical Task Resolution",
      description: "SLA for critical task completion",
      type: "task",
      status: "active",
      priority: "critical",
      responseTimeMinutes: 30,
      resolutionTimeMinutes: 120,
      escalationAfterMinutes: 60,
      notifyAtMinutes: [15, 30, 60],
      metadata: {}
    }
  );

  state.calendarItems.push(
    {
      id: newId("calitem"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "Daily Standup",
      type: "standup",
      startAt: `${nowIso().split("T")[0]}T09:00:00.000Z`,
      allDay: false,
      assigneeId: "user-001",
      assigneeName: "John Doe",
      recurrence: "0 9 * * 1-5",
      reminders: [15],
      metadata: {}
    },
    {
      id: newId("calitem"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "Weekly Review Meeting",
      type: "review",
      startAt: `${nowIso().split("T")[0]}T14:00:00.000Z`,
      allDay: false,
      assigneeId: "user-001",
      assigneeName: "John Doe",
      recurrence: "0 14 * * 5",
      reminders: [60, 15],
      metadata: {}
    }
  );

  state.events.push({
    id: newId("event"),
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "operations.seeded",
    source: "OperationsOS",
    data: { message: "OperationsOS demo data seeded" }
  });

  return state;
}
