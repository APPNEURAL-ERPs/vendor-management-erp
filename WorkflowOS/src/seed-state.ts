import { WorkflowDefinition, WorkflowTrigger, WorkflowStep, WorkflowTransition, Approval, Escalation, WorkflowExecution, StepResult, WorkflowState } from "./domain";
import { emptyState } from "./core/datastore";
import { newId, nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): WorkflowState {
  const state = emptyState();
  const createdAt = nowIso();

  const stepIds = {
    createLead: newId("step"),
    scoreLead: newId("step"),
    checkScore: newId("step"),
    assignOwner: newId("step"),
    sendEmail: newId("step"),
    createTask: newId("step"),
    managerApproval: newId("step"),
    createDeal: newId("step"),
    notifyFailure: newId("step")
  };

  const steps: WorkflowStep[] = [
    {
      id: stepIds.createLead,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      workflowId: "",
      key: "create_lead",
      name: "Create Lead",
      description: "Create lead in CRM system",
      type: "create",
      order: 1,
      status: "active",
      inputSchema: { leadData: "object" },
      outputSchema: { leadId: "string" },
      config: { target: "SalesOS" },
      continueOnError: false
    },
    {
      id: stepIds.scoreLead,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      workflowId: "",
      key: "score_lead",
      name: "Score Lead",
      description: "AI-powered lead scoring",
      type: "ai_call",
      order: 2,
      status: "active",
      inputSchema: { leadId: "string" },
      outputSchema: { score: "number", reasons: "array" },
      config: { model: "ai_model_1", prompt: "score_lead_prompt" },
      timeout: 30000,
      continueOnError: false
    },
    {
      id: stepIds.checkScore,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      workflowId: "",
      key: "check_score",
      name: "Check Score Threshold",
      description: "Evaluate if lead score meets threshold",
      type: "condition",
      order: 3,
      status: "active",
      inputSchema: { score: "number", threshold: "number" },
      outputSchema: { passes: "boolean" },
      config: { field: "score", operator: "gte", valueField: "threshold" },
      continueOnError: false
    },
    {
      id: stepIds.assignOwner,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      workflowId: "",
      key: "assign_owner",
      name: "Assign Sales Owner",
      description: "Route lead to appropriate sales owner",
      type: "update",
      order: 4,
      status: "active",
      inputSchema: { leadId: "string", score: "number" },
      outputSchema: { ownerId: "string" },
      config: { assignmentRule: "score_based" },
      continueOnError: false
    },
    {
      id: stepIds.sendEmail,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      workflowId: "",
      key: "send_email",
      name: "Send Welcome Email",
      description: "Send welcome email to lead",
      type: "notify",
      order: 5,
      status: "active",
      inputSchema: { leadId: "string", email: "string" },
      outputSchema: { sent: "boolean" },
      config: { template: "welcome_email", channel: "email" },
      continueOnError: true
    },
    {
      id: stepIds.createTask,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      workflowId: "",
      key: "create_task",
      name: "Create Follow-up Task",
      description: "Create task for sales follow-up",
      type: "create",
      order: 6,
      status: "active",
      inputSchema: { leadId: "string", ownerId: "string" },
      outputSchema: { taskId: "string" },
      config: { target: "OperationsOS", priority: "high" },
      continueOnError: true
    },
    {
      id: stepIds.managerApproval,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      workflowId: "",
      key: "manager_approval",
      name: "Manager Approval",
      description: "High-value lead requires manager approval",
      type: "approval",
      order: 7,
      status: "active",
      inputSchema: { leadId: "string", amount: "number" },
      outputSchema: { approved: "boolean", reason: "string" },
      config: {
        requiredApprovals: 1,
        approverRole: "sales_manager",
        slaMinutes: 1440,
        autoEscalate: true
      },
      timeout: 86400000,
      continueOnError: false
    },
    {
      id: stepIds.createDeal,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      workflowId: "",
      key: "create_deal",
      name: "Create Deal",
      description: "Create deal in CRM",
      type: "create",
      order: 8,
      status: "active",
      inputSchema: { leadId: "string", ownerId: "string" },
      outputSchema: { dealId: "string" },
      config: { target: "SalesOS", stage: "qualified" },
      continueOnError: false
    },
    {
      id: stepIds.notifyFailure,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      workflowId: "",
      key: "notify_failure",
      name: "Notify Failure",
      description: "Send failure notification",
      type: "notify",
      order: 9,
      status: "active",
      inputSchema: { executionId: "string", error: "string" },
      outputSchema: { sent: "boolean" },
      config: { template: "workflow_failure", channel: "email", recipients: ["ops@company.com"] },
      continueOnError: true
    }
  ];

  steps.forEach(step => state.steps.push(step));

  const transitionIds = {
    toAssign: newId("trans"),
    toEmail: newId("trans"),
    toApproval: newId("trans"),
    toDeal: newId("trans"),
    toTask: newId("trans"),
    toFailure: newId("trans")
  };

  const transitions: WorkflowTransition[] = [
    {
      id: transitionIds.toAssign,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      workflowId: "",
      fromStepId: stepIds.checkScore,
      toStepId: stepIds.assignOwner,
      name: "Score meets threshold",
      conditions: [{ field: "passes", operator: "eq", value: true }],
      priority: 1
    },
    {
      id: transitionIds.toEmail,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      workflowId: "",
      fromStepId: stepIds.assignOwner,
      toStepId: stepIds.sendEmail,
      name: "Assign owner success",
      conditions: [],
      priority: 1
    },
    {
      id: transitionIds.toApproval,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      workflowId: "",
      fromStepId: stepIds.assignOwner,
      toStepId: stepIds.managerApproval,
      name: "High value lead",
      conditions: [{ field: "amount", operator: "gte", value: 10000 }],
      priority: 2
    },
    {
      id: transitionIds.toDeal,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      workflowId: "",
      fromStepId: stepIds.managerApproval,
      toStepId: stepIds.createDeal,
      name: "Approval granted",
      conditions: [],
      priority: 1
    },
    {
      id: transitionIds.toTask,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      workflowId: "",
      fromStepId: stepIds.sendEmail,
      toStepId: stepIds.createTask,
      name: "Email sent",
      conditions: [{ field: "sent", operator: "eq", value: true }],
      priority: 1
    },
    {
      id: transitionIds.toFailure,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      workflowId: "",
      fromStepId: stepIds.scoreLead,
      toStepId: stepIds.notifyFailure,
      name: "Scoring failed",
      conditions: [],
      priority: 1
    }
  ];

  transitions.forEach(trans => state.transitions.push(trans));

  const workflowId = newId("workflow");

  const workflow: WorkflowDefinition = {
    id: workflowId,
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "lead_qualification",
    name: "Lead Qualification Workflow",
    description: "Automated lead scoring, routing, and follow-up workflow",
    version: 1,
    status: "active",
    triggerIds: [newId("trigger")],
    stepIds: Object.values(stepIds),
    transitionIds: Object.values(transitionIds),
    variables: {
      scoreThreshold: 80,
      emailTemplate: "welcome_email",
      slaHours: 24,
      maxRetries: 3
    },
    inputSchema: {
      leadId: { type: "string", required: true },
      source: { type: "string", required: false },
      amount: { type: "number", required: false }
    },
    outputSchema: {
      leadId: "string",
      score: "number",
      ownerId: "string",
      dealId: "string",
      taskId: "string"
    },
    tags: ["sales", "automation", "lead-management"],
    ownerId: "user_admin",
    createdBy: "user_admin",
    publishedAt: createdAt,
    metadata: { category: "sales", complexity: "medium" }
  };

  state.workflows.push(workflow);

  const trigger: WorkflowTrigger = {
    id: newId("trigger"),
    tenantId,
    createdAt,
    updatedAt: createdAt,
    workflowId,
    key: "lead_created_trigger",
    type: "event",
    eventName: "lead.created",
    conditions: [
      { field: "data.source", operator: "exists" }
    ],
    status: "active",
    config: {
      async: true,
      deduplicate: true,
      deduplicateWindowSeconds: 300
    }
  };

  state.triggers.push(trigger);

  const executionId = newId("exec");
  const stepResultIds = {
    step1: newId("result"),
    step2: newId("result")
  };

  const execution: WorkflowExecution = {
    id: executionId,
    tenantId,
    createdAt,
    updatedAt: createdAt,
    workflowId,
    workflowKey: "lead_qualification",
    status: "running",
    triggeredBy: "event",
    triggeredById: "evt_lead_123",
    input: { leadId: "lead_123", source: "website", amount: 15000 },
    output: {},
    currentStepId: stepIds.scoreLead,
    currentState: "scoring",
    stepResults: Object.values(stepResultIds),
    startedAt: createdAt,
    estimatedDurationMs: 60000,
    retryCount: 0,
    maxRetries: 3,
    context: {
      leadId: "lead_123",
      source: "website",
      amount: 15000,
      score: 85
    },
    auditTrail: [
      {
        timestamp: createdAt,
        action: "execution.started",
        details: "Workflow triggered by lead.created event"
      },
      {
        timestamp: createdAt,
        stepId: stepIds.createLead,
        action: "step.completed",
        details: "Lead created successfully"
      }
    ]
  };

  state.executions.push(execution);

  const stepResults: StepResult[] = [
    {
      id: stepResultIds.step1,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      executionId,
      stepId: stepIds.createLead,
      status: "completed",
      input: { leadData: { source: "website" } },
      output: { leadId: "lead_123" },
      retryCount: 0,
      startedAt: createdAt,
      completedAt: createdAt,
      latencyMs: 250,
      config: {}
    },
    {
      id: stepResultIds.step2,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      executionId,
      stepId: stepIds.scoreLead,
      status: "running",
      input: { leadId: "lead_123" },
      output: {},
      retryCount: 0,
      startedAt: createdAt,
      config: { model: "ai_model_1" }
    }
  ];

  stepResults.forEach(result => state.stepResults.push(result));

  const approvalId = newId("approval");
  const approval: Approval = {
    id: approvalId,
    tenantId,
    createdAt,
    updatedAt: createdAt,
    executionId,
    stepId: stepIds.managerApproval,
    requestedBy: "user_system",
    approverRole: "sales_manager",
    status: "pending",
    level: 1,
    requiredApprovals: 1,
    currentApprovals: 0,
    deadline: new Date(Date.now() + 86400000).toISOString(),
    notes: "High-value lead requires manager approval"
  };

  state.approvals.push(approval);

  return state;
}
