import { AuditEvent, AuditState } from "./domain";
import { emptyState } from "./core/datastore";
import { newId, nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): AuditState {
  const state = emptyState();
  const createdAt = nowIso();

  state.actors.push(
    {
      id: "actor_user_demo",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      actorId: "user_demo",
      actorType: "user",
      displayName: "Demo User",
      email: "demo@appneural.com",
      metadata: {}
    },
    {
      id: "actor_admin_demo",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      actorId: "admin_demo",
      actorType: "admin",
      displayName: "Demo Admin",
      email: "admin@appneural.com",
      metadata: {}
    },
    {
      id: "actor_ai_demo",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      actorId: "ai_agent_demo",
      actorType: "ai_agent",
      displayName: "Finance AI Assistant",
      metadata: {}
    }
  );

  state.targets.push(
    {
      id: "target_invoice_demo",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      resourceType: "invoice",
      resourceId: "inv_demo_001",
      resourceName: "Invoice #1001",
      module: "FinanceOS",
      metadata: {}
    },
    {
      id: "target_user_demo",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      resourceType: "user",
      resourceId: "user_123",
      resourceName: "John Doe",
      module: "IdentityOS",
      metadata: {}
    },
    {
      id: "target_role_demo",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      resourceType: "role",
      resourceId: "role_admin",
      resourceName: "Admin Role",
      module: "IdentityOS",
      metadata: {}
    }
  );

  const events = [
    {
      id: "evt_login_success",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      eventType: "auth.login",
      module: "IdentityOS",
      action: "login",
      status: "success",
      actorId: "actor_user_demo",
      actorType: "user",
      actorDisplayName: "Demo User",
      resourceType: "session",
      resourceId: "session_001",
      ipAddress: "192.168.1.100",
      device: "Chrome on Windows",
      location: "Mumbai, India",
      sensitive: false,
      complianceRelevant: true,
      metadata: { mfaUsed: true }
    },
    {
      id: "evt_invoice_update",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      eventType: "invoice.updated",
      module: "FinanceOS",
      action: "update",
      status: "success",
      actorId: "actor_admin_demo",
      actorType: "admin",
      actorDisplayName: "Demo Admin",
      resourceType: "invoice",
      resourceId: "inv_demo_001",
      resourceName: "Invoice #1001",
      approvalId: "approval_001",
      sensitive: true,
      complianceRelevant: true,
      metadata: { oldAmount: 25000, newAmount: 22000, currency: "INR" }
    },
    {
      id: "evt_role_change",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      eventType: "permission.role_changed",
      module: "IdentityOS",
      action: "role_assign",
      status: "success",
      actorId: "actor_admin_demo",
      actorType: "admin",
      actorDisplayName: "Demo Admin",
      resourceType: "role_assignment",
      resourceId: "assign_001",
      resourceName: "Admin Role Assignment",
      sensitive: true,
      complianceRelevant: true,
      metadata: { targetUserId: "user_123", role: "admin" }
    },
    {
      id: "evt_data_export",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      eventType: "data.exported",
      module: "DataOS",
      action: "export",
      status: "success",
      actorId: "actor_admin_demo",
      actorType: "admin",
      actorDisplayName: "Demo Admin",
      resourceType: "customer_data",
      resourceId: "export_001",
      resourceName: "Customer Data Export",
      reason: "Monthly compliance report",
      sensitive: true,
      complianceRelevant: true,
      metadata: { recordCount: 1500, format: "CSV" }
    },
    {
      id: "evt_refund_approved",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      eventType: "finance.refund_approved",
      module: "FinanceOS",
      action: "approve",
      status: "success",
      actorId: "actor_admin_demo",
      actorType: "admin",
      actorDisplayName: "Demo Admin",
      resourceType: "refund",
      resourceId: "refund_001",
      resourceName: "Refund Request #R500",
      approvalId: "approval_002",
      sensitive: true,
      complianceRelevant: true,
      metadata: { amount: 5000, reason: "Customer complaint" }
    },
    {
      id: "evt_ai_tool_call",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      eventType: "ai.tool_called",
      module: "AIOS",
      action: "execute",
      status: "success",
      actorId: "actor_ai_demo",
      actorType: "ai_agent",
      actorDisplayName: "Finance AI Assistant",
      resourceType: "tool",
      resourceId: "tool_invoice_generator",
      resourceName: "Invoice Generator",
      sensitive: false,
      complianceRelevant: true,
      metadata: { toolName: "invoice_generator", tokensUsed: 1200 }
    },
    {
      id: "evt_login_failed",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      eventType: "auth.login_failed",
      module: "IdentityOS",
      action: "login",
      status: "failure",
      actorId: "actor_user_demo",
      actorType: "user",
      actorDisplayName: "Demo User",
      resourceType: "session",
      resourceId: "session_failed",
      ipAddress: "10.0.0.50",
      location: "Unknown",
      sensitive: false,
      complianceRelevant: true,
      metadata: { reason: "Invalid password", attempts: 3 }
    }
  ] as AuditEvent[];

  state.events.push(...events);

  for (const event of events) {
    const changeSet: typeof state.changeSets[0] = {
      id: `changeset_${event.id}`,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      eventId: event.id,
      field: "metadata",
      fieldPath: "metadata",
      oldValue: event.metadata && "oldAmount" in event.metadata ? { amount: event.metadata.oldAmount } : undefined,
      newValue: "metadata" in event ? event.metadata : undefined,
      changeType: event.action === "login" ? "access" : "update"
    };
    state.changeSets.push(changeSet);
    event.changeSetIds = [changeSet.id];
  }

  state.evidenceLinks.push(
    {
      id: "evidence_approval_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      eventId: "evt_invoice_update",
      evidenceType: "approval",
      title: "Finance Manager Approval for Invoice Update",
      uri: "https://storage.example.com/approvals/invoice_update_001.pdf",
      uploadedBy: "admin_demo",
      reviewStatus: "approved",
      metadata: {}
    },
    {
      id: "evidence_screenshot_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      eventId: "evt_refund_approved",
      evidenceType: "screenshot",
      title: "Refund Approval Screen",
      uri: "https://storage.example.com/screenshots/refund_001.png",
      uploadedBy: "admin_demo",
      reviewStatus: "approved",
      metadata: {}
    },
    {
      id: "evidence_policy_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      eventId: "evt_data_export",
      evidenceType: "policy",
      title: "Data Export Policy Acknowledgment",
      uri: "https://storage.example.com/policies/data_export_v2.pdf",
      uploadedBy: "admin_demo",
      reviewStatus: "approved",
      metadata: {}
    }
  );

  state.events[1].evidenceLinkIds = ["evidence_approval_001"];
  state.events[4].evidenceLinkIds = ["evidence_screenshot_001"];
  state.events[3].evidenceLinkIds = ["evidence_policy_001"];

  state.retentionPolicies.push(
    {
      id: "policy_financial",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Financial Audit Retention",
      description: "Retain financial audit events for 7 years per regulatory requirements",
      retentionDays: 2555,
      appliesTo: ["FinanceOS", "BillingOS"],
      status: "active",
      metadata: { framework: "SOX", region: "India" }
    },
    {
      id: "policy_security",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Security Audit Retention",
      description: "Retain security audit events for 1 year",
      retentionDays: 365,
      appliesTo: ["IdentityOS", "SecurityOS"],
      status: "active",
      metadata: { framework: "SOC2" }
    },
    {
      id: "policy_access",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Access Review Retention",
      description: "Retain access review evidence for 3 years",
      retentionDays: 1095,
      appliesTo: ["IdentityOS", "ComplianceOS"],
      status: "active",
      metadata: { framework: "ISO27001" }
    }
  );

  state.reports.push({
    id: "report_monthly_access",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Monthly Access Audit Report",
    description: "Comprehensive access audit for January 2024",
    reportType: "access",
    format: "json",
    status: "completed",
    filters: {
      tenantId,
      startDate: "2024-01-01T00:00:00Z",
      endDate: "2024-01-31T23:59:59Z",
      eventTypes: ["auth.login", "auth.login_failed", "permission.role_changed"]
    },
    generatedBy: "admin_demo",
    completedAt: createdAt,
    metadata: {}
  });

  state.investigations.push({
    id: "investigation_001",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    title: "Investigate Suspicious Login Attempts",
    description: "Multiple failed login attempts from unknown IP address",
    status: "in_progress",
    priority: "high",
    eventIds: ["evt_login_failed"],
    evidenceIds: [],
    assignedTo: "admin_demo",
    metadata: {}
  });

  let previousHash = "genesis";
  for (const event of state.events) {
    const hashInput = `${event.id}:${event.eventType}:${event.actorId}:${event.createdAt}:${previousHash}`;
    const hash = simpleHash(hashInput);
    event.previousHash = previousHash;
    event.currentHash = hash;
    previousHash = hash;

    state.integrityHashes.push({
      id: `integrity_${event.id}`,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      eventId: event.id,
      previousHash: event.previousHash,
      currentHash: hash,
      chainValid: true,
      computedAt: createdAt
    });
  }

  return state;
}

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}
