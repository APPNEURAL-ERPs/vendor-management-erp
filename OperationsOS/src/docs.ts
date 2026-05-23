export function docs() {
  return {
    name: "OperationsOS",
    version: "1.0.0",
    description: "Operating cadence, processes, tasks, resources, incidents, SOPs, and cross-team execution",
    auth: {
      headers: {
        "x-role": "owner | admin | ops_manager | ops_engineer | ops_analyst | ops_viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      task: "An operational task that tracks work items with status, priority, assignee, and due date.",
      checklist: "A checklist for repeatable work execution with multiple items.",
      sop: "Standard Operating Procedure with step-by-step instructions.",
      process: "A business process with multiple steps and dependencies.",
      issue: "A problem or blocker that needs to be tracked and resolved.",
      incident: "An operational incident requiring immediate attention.",
      resource: "An operational resource (people, tools, equipment, etc.).",
      slaRule: "Service Level Agreement rule defining response and resolution times.",
      calendarItem: "An item in the operational calendar (meetings, deadlines, etc.)."
    },
    examples: {
      createTask: {
        method: "POST",
        path: "/operations/tasks",
        headers: { "x-role": "ops_engineer" },
        body: {
          key: "task-001",
          title: "Prepare client proposal",
          status: "todo",
          priority: "high",
          dueDate: "2026-05-30T00:00:00.000Z",
          tags: ["client", "proposal"]
        }
      },
      createChecklist: {
        method: "POST",
        path: "/operations/checklists",
        headers: { "x-role": "ops_manager" },
        body: {
          key: "client-onboard-checklist",
          name: "Client Onboarding Checklist",
          type: "client_onboarding",
          items: [
            { text: "Create client profile", order: 0 },
            { text: "Send welcome message", order: 1 },
            { text: "Schedule kickoff meeting", order: 2 }
          ]
        }
      },
      createIssue: {
        method: "POST",
        path: "/operations/issues",
        headers: { "x-role": "ops_engineer" },
        body: {
          key: "issue-001",
          title: "Client not responding",
          category: "communication",
          priority: "high",
          status: "open"
        }
      },
      createIncident: {
        method: "POST",
        path: "/operations/incidents",
        headers: { "x-role": "ops_manager" },
        body: {
          key: "incident-001",
          title: "Production outage",
          severity: "critical",
          description: "Website is down"
        }
      },
      dailyReport: {
        method: "POST",
        path: "/operations/reports/daily",
        headers: { "x-role": "ops_manager" }
      }
    }
  };
}
