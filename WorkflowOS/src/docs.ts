export function docs() {
  return {
    name: "WorkflowOS",
    version: "1.0.0",
    description: "Workflow orchestration OS: triggers, actions, conditions, approvals, escalations, state management, execution, and monitoring",
    auth: {
      headers: {
        "x-role": "owner | admin | workflow_admin | workflow_designer | workflow_operator | workflow_viewer | approver",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      workflow: "A reusable automation definition with triggers, steps, transitions, and approval gates",
      trigger: "Event, schedule, webhook, or manual event that starts workflow execution",
      step: "A single action unit (create, update, notify, approval, AI call, etc.)",
      transition: "Conditional path between steps based on results or data",
      approval: "Human decision gate requiring one or more approvals",
      escalation: "Automatic or manual escalation of pending approvals",
      execution: "A running or completed instance of a workflow",
      stepResult: "Input, output, status, and timing for each step execution"
    },
    entities: {
      WorkflowDefinition: "Workflow metadata, version, status, steps, triggers, and configuration",
      WorkflowTrigger: "Event or schedule definition that activates a workflow",
      WorkflowStep: "Individual action with retry policy, timeout, and error handling",
      WorkflowTransition: "Conditional routing between steps",
      Approval: "Human-in-the-loop approval request with levels and escalations",
      Escalation: "Escalation chain for overdue or rejected approvals",
      WorkflowExecution: "Running or completed instance tracking state and step results",
      StepResult: "Detailed execution log for each step"
    },
    examples: {
      createWorkflow: {
        method: "POST",
        path: "/workflowos/workflows",
        headers: { "x-role": "workflow_admin" },
        body: {
          key: "lead_qualification",
          name: "Lead Qualification Workflow",
          description: "Automated lead scoring and routing",
          status: "draft",
          variables: { scoreThreshold: 80 }
        }
      },
      runWorkflow: {
        method: "POST",
        path: "/workflowos/workflows/:id/run",
        headers: { "x-role": "workflow_operator" },
        body: { input: { leadId: "lead_123", source: "website" } }
      },
      approveStep: {
        method: "POST",
        path: "/workflowos/approvals/:id/approve",
        headers: { "x-role": "approver" },
        body: { reason: "Approved - all criteria met" }
      },
      getExecutionStatus: {
        method: "GET",
        path: "/workflowos/executions/:id",
        headers: { "x-role": "workflow_operator" }
      }
    },
    statuses: {
      workflow: ["draft", "active", "paused", "running", "waiting", "completed", "failed", "cancelled"],
      step: ["pending", "running", "completed", "skipped", "failed", "waiting", "retrying", "cancelled"],
      approval: ["pending", "approved", "rejected", "escalated", "expired"],
      execution: ["running", "waiting", "completed", "failed", "cancelled", "paused"]
    },
    triggerTypes: ["event", "schedule", "webhook", "manual", "api", "form", "file", "email"],
    stepTypes: ["create", "update", "delete", "notify", "call_api", "run_tool", "generate_document", "condition", "approval", "delay", "ai_call", "custom"],
    conditionOperators: ["eq", "neq", "gt", "gte", "lt", "lte", "contains", "not_contains", "exists", "not_exists", "in", "not_in"]
  };
}
