export function docs() {
  return {
    name: "AutomationOS",
    version: "1.0.0",
    description: "Triggers, workflows, schedules, approvals, retries, and automation runs",
    auth: {
      headers: {
        "x-role": "owner | admin | automation_admin | automation_operator | workflow_builder | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      workflow: "A sequence of steps (actions, conditions, approvals, delays) that automate business processes.",
      trigger: "An event source (webhook, schedule, manual, event) that initiates workflow execution.",
      action: "A discrete operation (send email, create task, call API) performed within a workflow step.",
      schedule: "Time-based triggers using cron expressions for recurring workflow execution.",
      approval: "A human decision point within a workflow requiring explicit approve/reject action.",
      automationRun: "An execution instance of a workflow, recording inputs, outputs, and step results."
    },
    examples: {
      runWorkflow: {
        method: "POST",
        path: "/automation/workflows/workflow_lead_followup/run",
        headers: { "x-role": "automation_operator" },
        body: {
          data: {
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            budget: 75000
          }
        }
      },
      fireTrigger: {
        method: "POST",
        path: "/automation/triggers/trigger_lead_form/fire",
        headers: { "x-role": "automation_operator" },
        body: {
          data: {
            email: "lead@example.com",
            source: "website",
            budget: 50000
          }
        }
      },
      createApproval: {
        method: "POST",
        path: "/automation/approvals",
        headers: { "x-role": "automation_admin" },
        body: {
          key: "expense_approval_001",
          name: "Q1 Marketing Expense Approval",
          workflowId: "workflow_expense_approval",
          requesterName: "John Doe",
          data: {
            expenseId: "EXP-2024-001",
            amount: 150000,
            category: "Marketing",
            description: "Trade show sponsorship"
          },
          steps: [
            {
              name: "Manager Approval",
              approverType: "role",
              approverRole: "manager",
              slaHours: 24
            },
            {
              name: "Finance Approval",
              approverType: "role",
              approverRole: "finance_director",
              slaHours: 48
            }
          ]
        }
      },
      decideApproval: {
        method: "POST",
        path: "/automation/approvals/approval_invoice_sample/decide",
        headers: { "x-role": "manager" },
        body: {
          decision: "approved",
          notes: "Verified vendor credentials and budget allocation"
        }
      }
    },
    commonUseCases: {
      leadAutomation: "When a lead form is submitted → parse lead → score lead → send welcome email → create sales task",
      invoiceApproval: "Invoice created → validate → check amount → route to approval → generate PDF → notify vendor",
      courseCompletion: "Course completed → verify completion → generate certificate → send notification → update profile",
      scheduledReporting: "Cron trigger → fetch data → generate report → send email → log execution"
    }
  };
}
