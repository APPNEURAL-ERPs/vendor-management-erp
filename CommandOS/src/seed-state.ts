import { CommandState } from "./core/domain";

export function createSeedState(tenantId = "demo-tenant"): CommandState {
  const now = new Date().toISOString();
  return {
    commands: [
      {
        id: "cmd_restart_checkout",
        tenantId,
        createdAt: now,
        updatedAt: now,
        key: "commerce.restart-checkout-worker",
        name: "Restart checkout worker",
        description: "Queues a safe restart for the CommerceOS checkout worker.",
        category: "commerce",
        ownerTeam: "Platform Operations",
        priority: "high",
        status: "active",
        requiredRole: "operator",
        inputSchema: { reason: "string", drainSeconds: "number" },
        tags: ["commerce", "worker", "restart"],
        metadata: { targetService: "CommerceOS" },
        createdBy: "seed",
        updatedBy: "seed"
      },
      {
        id: "cmd_rotate_api_keys",
        tenantId,
        createdAt: now,
        updatedAt: now,
        key: "dev.rotate-api-keys",
        name: "Rotate developer API keys",
        description: "Starts a controlled API key rotation for a developer app.",
        category: "developer",
        ownerTeam: "Developer Experience",
        priority: "normal",
        status: "active",
        requiredRole: "automation_manager",
        inputSchema: { appId: "string", graceHours: "number" },
        tags: ["devos", "keys", "security"],
        metadata: { targetService: "DevOS" },
        createdBy: "seed",
        updatedBy: "seed"
      },
      {
        id: "cmd_freeze_signups",
        tenantId,
        createdAt: now,
        updatedAt: now,
        key: "security.freeze-signups",
        name: "Freeze new signups",
        description: "Temporarily blocks new account registration during a security incident.",
        category: "security",
        ownerTeam: "Security",
        priority: "critical",
        status: "active",
        requiredRole: "incident_commander",
        inputSchema: { durationMinutes: "number", reason: "string" },
        tags: ["security", "incident"],
        metadata: { targetService: "SecurityOS" },
        createdBy: "seed",
        updatedBy: "seed"
      }
    ],
    executions: [
      {
        id: "exec_demo_restart",
        tenantId,
        createdAt: now,
        updatedAt: now,
        commandId: "cmd_restart_checkout",
        commandKey: "commerce.restart-checkout-worker",
        requestedBy: "operator-user",
        role: "operator",
        status: "succeeded",
        priority: "high",
        input: { reason: "deploy verification", drainSeconds: 30 },
        output: { restartId: "rst_1001", healthy: true },
        startedAt: now,
        completedAt: now,
        durationMs: 850,
        logs: [`${now} queued by operator-user`, `${now} worker restarted successfully`]
      }
    ],
    runbooks: [
      {
        id: "runbook_checkout_degradation",
        tenantId,
        createdAt: now,
        updatedAt: now,
        key: "incident.checkout-degradation",
        name: "Checkout degradation response",
        description: "Coordinates triage, mitigation, and customer communication for checkout degradation.",
        category: "incident",
        ownerTeam: "Platform Operations",
        status: "active",
        triggers: ["commerce.checkout.error_rate.high", "incident.sev2"],
        tags: ["incident", "commerce", "checkout"],
        createdBy: "seed",
        updatedBy: "seed",
        steps: [
          {
            id: "step_confirm_metrics",
            name: "Confirm checkout metrics",
            type: "manual",
            instructions: "Review checkout latency and payment failure rate.",
            assigneeRole: "operator",
            timeoutMinutes: 10,
            required: true,
            metadata: { order: 1 }
          },
          {
            id: "step_restart_worker",
            name: "Restart checkout worker",
            type: "script",
            commandId: "cmd_restart_checkout",
            instructions: "Restart the worker only after draining active jobs.",
            assigneeRole: "operator",
            timeoutMinutes: 15,
            required: true,
            metadata: { order: 2 }
          },
          {
            id: "step_notify_status",
            name: "Notify status page",
            type: "notification",
            instructions: "Post mitigation status to customer-facing channels.",
            assigneeRole: "incident_commander",
            timeoutMinutes: 10,
            required: true,
            metadata: { order: 3 }
          }
        ]
      }
    ],
    runbookRuns: [],
    automationRules: [
      {
        id: "auto_checkout_error_rate",
        tenantId,
        createdAt: now,
        updatedAt: now,
        key: "checkout-error-rate-runbook",
        name: "Start checkout degradation runbook",
        description: "Starts incident response when checkout error rate crosses the threshold.",
        enabled: true,
        eventType: "commerce.checkout.error_rate.high",
        condition: { thresholdPercent: 5, windowMinutes: 5 },
        runbookId: "runbook_checkout_degradation",
        cooldownMinutes: 30,
        status: "active",
        createdBy: "seed",
        updatedBy: "seed"
      }
    ],
    schedules: [
      {
        id: "sched_weekly_key_rotation",
        tenantId,
        createdAt: now,
        updatedAt: now,
        key: "weekly-dev-key-rotation-check",
        name: "Weekly developer key rotation check",
        cadence: "weekly",
        timezone: "Asia/Kolkata",
        nextRunAt: now,
        commandId: "cmd_rotate_api_keys",
        input: { appId: "app_demo_partner", graceHours: 48 },
        enabled: true,
        status: "active",
        createdBy: "seed",
        updatedBy: "seed"
      }
    ],
    incidents: [
      {
        id: "inc_checkout_demo",
        tenantId,
        createdAt: now,
        updatedAt: now,
        key: "INC-1001",
        title: "Checkout latency elevated",
        severity: "sev2",
        status: "investigating",
        commanderUserId: "incident-lead",
        summary: "Checkout p95 latency crossed the alert threshold.",
        relatedRunbookRunIds: [],
        relatedExecutionIds: ["exec_demo_restart"],
        openedAt: now,
        timeline: [
          {
            id: "note_inc_opened",
            at: now,
            actorId: "incident-lead",
            message: "Incident opened from checkout latency alert"
          }
        ]
      }
    ],
    events: [
      {
        id: "evt_seed_ready",
        tenantId,
        createdAt: now,
        updatedAt: now,
        type: "commandos.seed.ready",
        source: "CommandOS",
        actorId: "seed",
        role: "command_admin",
        data: { commands: 3, runbooks: 1 }
      }
    ],
    auditLogs: []
  };
}
