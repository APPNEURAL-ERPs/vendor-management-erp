export function docs() {
  return {
    service: "CommandOS",
    version: "1.0.0",
    description: "Reusable command-center operating layer for command registry, executions, runbooks, automation rules, schedules, incidents, events, permissions, and audit logs.",
    defaultTenant: "demo-tenant",
    headers: {
      tenant: "x-tenant-id",
      role: "x-role",
      user: "x-user-id"
    },
    roles: ["owner", "admin", "command_admin", "operator", "incident_commander", "automation_manager", "auditor", "viewer"],
    endpoints: {
      overview: ["GET /commandos/overview", "GET /commandos/permissions"],
      commands: ["GET /commandos/commands", "POST /commandos/commands", "GET /commandos/commands/:id", "PUT /commandos/commands/:id", "DELETE /commandos/commands/:id", "POST /commandos/commands/:id/execute"],
      executions: ["GET /commandos/executions", "PATCH /commandos/executions/:id/status"],
      runbooks: ["GET /commandos/runbooks", "POST /commandos/runbooks", "POST /commandos/runbooks/:id/start", "GET /commandos/runbook-runs", "PATCH /commandos/runbook-runs/:runId/steps/:stepId"],
      automation: ["GET /commandos/automation-rules", "POST /commandos/automation-rules", "POST /commandos/automation-rules/:key/trigger"],
      schedules: ["GET /commandos/schedules", "POST /commandos/schedules"],
      incidents: ["GET /commandos/incidents", "POST /commandos/incidents", "PATCH /commandos/incidents/:id"],
      logs: ["GET /commandos/events", "GET /commandos/audit"]
    }
  };
}
