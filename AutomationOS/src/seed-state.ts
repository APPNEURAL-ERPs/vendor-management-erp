import { AutomationState, WorkflowStep } from "./types";
import { emptyState } from "./core/datastore";
import { newId, nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): AutomationState {
  const state = emptyState();
  const createdAt = nowIso();

  state.workflows.push(
    {
      id: "workflow_lead_followup",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "lead_followup",
      name: "Lead Follow-up Automation",
      description: "Automated lead follow-up sequence with email and task creation",
      status: "active",
      version: 1,
      steps: [
        {
          id: "wfstep_1",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          workflowId: "workflow_lead_followup",
          stepIndex: 0,
          name: "Parse Lead Data",
          type: "transform",
          config: { mapping: { firstName: "data.firstName", lastName: "data.lastName", email: "data.email" } },
          status: "active"
        },
        {
          id: "wfstep_2",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          workflowId: "workflow_lead_followup",
          stepIndex: 1,
          name: "Score Lead",
          type: "condition",
          config: { scoring: true },
          condition: {
            field: "data.budget",
            operator: "gte",
            value: 50000
          },
          status: "active"
        },
        {
          id: "wfstep_3",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          workflowId: "workflow_lead_followup",
          stepIndex: 2,
          name: "Send Welcome Email",
          type: "notification",
          config: { template: "welcome_email", channel: "email" },
          retryPolicy: {
            maxRetries: 3,
            retryDelaySeconds: 60,
            backoffMultiplier: 2
          },
          timeoutSeconds: 30,
          status: "active"
        },
        {
          id: "wfstep_4",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          workflowId: "workflow_lead_followup",
          stepIndex: 3,
          name: "Create Sales Task",
          type: "action",
          config: { actionType: "create_task", assigneeRole: "sales_rep", dueInDays: 1 },
          status: "active"
        }
      ],
      variables: { company: "Appneural", campaign: "Website Lead Form" },
      tags: ["sales", "lead-management", "automation"],
      publishedAt: createdAt,
      createdBy: "seed",
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0
    },
    {
      id: "workflow_invoice_approval",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "invoice_approval",
      name: "Invoice Approval Workflow",
      description: "Multi-level invoice approval with amount-based routing",
      status: "active",
      version: 1,
      steps: [
        {
          id: "wfstep_ia_1",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          workflowId: "workflow_invoice_approval",
          stepIndex: 0,
          name: "Validate Invoice",
          type: "action",
          config: { actionType: "validate_invoice" },
          status: "active"
        },
        {
          id: "wfstep_ia_2",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          workflowId: "workflow_invoice_approval",
          stepIndex: 1,
          name: "Check Amount Threshold",
          type: "condition",
          config: {},
          condition: {
            field: "data.amount",
            operator: "gt",
            value: 50000
          },
          status: "active"
        },
        {
          id: "wfstep_ia_3",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          workflowId: "workflow_invoice_approval",
          stepIndex: 2,
          name: "Request Manager Approval",
          type: "approval",
          config: { approvalName: "Invoice Approval" },
          status: "active"
        },
        {
          id: "wfstep_ia_4",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          workflowId: "workflow_invoice_approval",
          stepIndex: 3,
          name: "Generate PDF",
          type: "action",
          config: { actionType: "generate_pdf", template: "invoice" },
          status: "active"
        }
      ],
      variables: { defaultCurrency: "INR" },
      tags: ["finance", "approval", "invoice"],
      publishedAt: createdAt,
      createdBy: "seed",
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0
    },
    {
      id: "workflow_course_completion",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "course_completion",
      name: "Course Completion Automation",
      description: "Handles course completion with certificate generation and notifications",
      status: "draft",
      version: 1,
      steps: [
        {
          id: "wfstep_cc_1",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          workflowId: "workflow_course_completion",
          stepIndex: 0,
          name: "Verify Completion",
          type: "condition",
          config: {},
          condition: {
            field: "data.completedLessons",
            operator: "eq",
            value: "data.totalLessons"
          },
          status: "active"
        },
        {
          id: "wfstep_cc_2",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          workflowId: "workflow_course_completion",
          stepIndex: 1,
          name: "Generate Certificate",
          type: "action",
          config: { actionType: "generate_certificate", template: "course_completion" },
          status: "active"
        },
        {
          id: "wfstep_cc_3",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          workflowId: "workflow_course_completion",
          stepIndex: 2,
          name: "Send Completion Email",
          type: "notification",
          config: { template: "course_completion_email", channel: "email" },
          status: "active"
        }
      ],
      variables: {},
      tags: ["learning", "education", "certificate"],
      createdBy: "seed",
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0
    }
  );

  state.triggers.push(
    {
      id: "trigger_lead_form",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "lead_form_submitted",
      name: "Lead Form Submitted",
      description: "Fires when a new lead form is submitted on the website",
      status: "active",
      type: "form_submission",
      workflowId: "workflow_lead_followup",
      config: { formId: "contact_form", source: "website" },
      filters: [
        { field: "data.email", operator: "exists" },
        { field: "data.source", operator: "eq", value: "website" }
      ],
      enabled: true,
      createdBy: "seed",
      fireCount: 0
    },
    {
      id: "trigger_daily_report",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "daily_sales_report",
      name: "Daily Sales Report",
      description: "Scheduled trigger for daily sales report generation",
      status: "active",
      type: "schedule",
      config: { scheduleTime: "09:00" },
      filters: [],
      enabled: true,
      createdBy: "seed",
      fireCount: 0
    },
    {
      id: "trigger_invoice_created",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "invoice_created_event",
      name: "Invoice Created Event",
      description: "Fires when an invoice is created in the system",
      status: "active",
      type: "event",
      workflowId: "workflow_invoice_approval",
      config: { eventType: "invoice.created" },
      filters: [
        { field: "data.status", operator: "eq", value: "pending" }
      ],
      enabled: true,
      createdBy: "seed",
      fireCount: 0
    },
    {
      id: "trigger_webhook_github",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "github_webhook",
      name: "GitHub Webhook",
      description: "Receives events from GitHub",
      status: "active",
      type: "webhook",
      config: { events: ["push", "pull_request"] },
      filters: [],
      enabled: true,
      createdBy: "seed",
      fireCount: 0
    }
  );

  state.actions.push(
    {
      id: "action_send_email",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "send_email",
      name: "Send Email",
      description: "Send an email notification",
      status: "active",
      type: "send_email",
      inputSchema: {
        to: "string",
        subject: "string",
        body: "string",
        template: "string?"
      },
      outputSchema: {
        messageId: "string",
        sentAt: "string"
      },
      config: {
        provider: "smtp",
        fromAddress: "noreply@appneural.com"
      },
      retryPolicy: {
        maxRetries: 3,
        retryDelaySeconds: 60,
        backoffMultiplier: 2
      },
      timeoutSeconds: 30,
      createdBy: "seed"
    },
    {
      id: "action_create_task",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "create_task",
      name: "Create Task",
      description: "Create a task in the task management system",
      status: "active",
      type: "create_task",
      inputSchema: {
        title: "string",
        assigneeId: "string?",
        assigneeRole: "string?",
        dueDate: "string?",
        priority: "string?",
        description: "string?"
      },
      outputSchema: {
        taskId: "string",
        createdAt: "string"
      },
      config: {
        taskSystem: "internal"
      },
      createdBy: "seed"
    },
    {
      id: "action_generate_certificate",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "generate_certificate",
      name: "Generate Certificate",
      description: "Generate a completion certificate",
      status: "active",
      type: "generate_pdf",
      inputSchema: {
        recipientName: "string",
        courseName: "string",
        completionDate: "string",
        template: "string?"
      },
      outputSchema: {
        certificateId: "string",
        downloadUrl: "string"
      },
      config: {
        format: "pdf",
        orientation: "landscape"
      },
      createdBy: "seed"
    },
    {
      id: "action_http_api",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "call_external_api",
      name: "Call External API",
      description: "Make an HTTP request to an external API",
      status: "active",
      type: "call_api",
      inputSchema: {
        url: "string",
        method: "string",
        headers: "object?",
        body: "object?"
      },
      outputSchema: {
        statusCode: "number",
        response: "object",
        latencyMs: "number"
      },
      config: {
        timeout: 30,
        retryOnFailure: true
      },
      retryPolicy: {
        maxRetries: 2,
        retryDelaySeconds: 120,
        backoffMultiplier: 1.5
      },
      timeoutSeconds: 60,
      createdBy: "seed"
    }
  );

  state.schedules.push(
    {
      id: "schedule_daily_cleanup",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "daily_cleanup",
      name: "Daily Data Cleanup",
      description: "Clean up old temporary data every day at midnight",
      status: "active",
      cronExpression: "0 0 * * *",
      timezone: "UTC",
      enabled: true,
      executionCount: 0,
      createdBy: "seed"
    },
    {
      id: "schedule_weekly_report",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "weekly_sales_report",
      name: "Weekly Sales Report",
      description: "Generate and send weekly sales report every Monday at 9 AM",
      status: "active",
      cronExpression: "0 9 * * 1",
      timezone: "Asia/Kolkata",
      enabled: true,
      lastExecutedAt: createdAt,
      nextExecutionAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      executionCount: 12,
      createdBy: "seed"
    },
    {
      id: "schedule_monthly_invoice_run",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "monthly_invoice_generation",
      name: "Monthly Invoice Generation",
      description: "Generate monthly invoices on the 1st of every month",
      status: "active",
      cronExpression: "0 0 1 * *",
      timezone: "UTC",
      enabled: true,
      executionCount: 0,
      createdBy: "seed"
    }
  );

  state.approvals.push(
    {
      id: "approval_invoice_sample",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "invoice_approval_sample",
      name: "Sample Invoice Approval",
      description: "Sample invoice approval for testing",
      status: "pending",
      requesterId: "user_demo",
      requesterName: "Demo User",
      data: {
        invoiceId: "INV-001",
        amount: 75000,
        vendor: "Sample Vendor",
        description: "Q1 Software License"
      },
      steps: [
        {
          id: "approvalstep_1",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          approvalId: "approval_invoice_sample",
          stepIndex: 0,
          name: "Manager Approval",
          approverType: "role",
          approverRole: "manager",
          slaHours: 24,
          reminderHours: 4,
          status: "pending"
        },
        {
          id: "approvalstep_2",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          approvalId: "approval_invoice_sample",
          stepIndex: 1,
          name: "Finance Director Approval",
          approverType: "role",
          approverRole: "finance_director",
          slaHours: 48,
          status: "pending"
        }
      ],
      currentStepIndex: 0,
      createdBy: "seed",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  );

  state.webhookEndpoints.push({
    id: "webhook_github_push",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "github_push",
    name: "GitHub Push Webhook",
    description: "Receives push events from GitHub repositories",
    status: "active",
    secret: "github_secret_key_12345",
    authenticationType: "signature",
    createdBy: "seed",
    receivedCount: 0
  });

  state.events.push({
    id: "event_seed_bootstrap",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "automationos.seeded",
    source: "AutomationOS",
    data: { message: "AutomationOS demo data seeded" }
  });

  return state;
}
