export function docs() {
  return {
    name: "AuditOS",
    version: "1.0.0",
    description: "Immutable audit trails, evidence, compliance proof, activity tracking, change history, access review, and accountability layer.",
    auth: {
      headers: {
        "x-role": "owner | admin | audit_admin | compliance_manager | security_analyst | auditor | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      auditEvent: "An immutable record of an action performed by an actor on a target resource.",
      actor: "The entity (user, service account, admin, AI agent, or system) that performed the action.",
      target: "The resource (invoice, user, role, document, etc.) that was acted upon.",
      changeSet: "A record of field-level changes (old value, new value) for update actions.",
      evidenceLink: "Attached proof (document, screenshot, approval) supporting an audit event.",
      retentionPolicy: "Rules defining how long different types of audit data must be retained.",
      auditReport: "A generated report of audit events matching specific filters.",
      complianceAudit: "A structured compliance audit covering a specific framework and time period.",
      integrityHash: "A hash chain link ensuring tamper-evident audit trail."
    },
    examples: {
      createEvent: {
        method: "POST",
        path: "/auditos/events",
        headers: { "x-role": "audit_admin" },
        body: {
          eventType: "invoice.updated",
          module: "FinanceOS",
          action: "update",
          status: "success",
          actorId: "user_123",
          actorType: "user",
          actorDisplayName: "John Doe",
          resourceType: "invoice",
          resourceId: "inv_456",
          resourceName: "Invoice #1001",
          sensitive: true,
          complianceRelevant: true,
          ipAddress: "192.168.1.1",
          metadata: { oldAmount: 25000, newAmount: 22000 }
        }
      },
      searchEvents: {
        method: "POST",
        path: "/auditos/search",
        headers: { "x-role": "auditor" },
        body: {
          tenantId: "demo-tenant",
          startDate: "2024-01-01T00:00:00Z",
          endDate: "2024-12-31T23:59:59Z",
          eventTypes: ["invoice.updated", "invoice.paid"],
          sensitive: true
        }
      },
      attachEvidence: {
        method: "POST",
        path: "/auditos/evidence",
        headers: { "x-role": "compliance_manager" },
        body: {
          eventId: "evt_abc123",
          evidenceType: "approval",
          title: "Finance Manager Approval Screenshot",
          uri: "https://storage.example.com/approvals/abc123.png",
          uploadedBy: "user_789"
        }
      }
    }
  };
}
