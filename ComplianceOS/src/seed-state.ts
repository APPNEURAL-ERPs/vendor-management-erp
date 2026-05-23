import { ComplianceState } from "./domain";
import { emptyState } from "./core/datastore";
import { nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): ComplianceState {
  const state = emptyState();
  const createdAt = nowIso();

  state.frameworks.push(
    {
      id: "framework_soc2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "soc2_type2",
      name: "SOC 2 Type II",
      description: "Service Organization Control 2 - Trust Services Criteria",
      type: "soc2",
      version: "2017",
      status: "active",
      controlCount: 5,
      complianceScore: 78
    },
    {
      id: "framework_iso27001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "iso27001",
      name: "ISO 27001",
      description: "Information Security Management System",
      type: "iso",
      version: "2022",
      status: "active",
      controlCount: 3,
      complianceScore: 85
    },
    {
      id: "framework_gdpr",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "gdpr",
      name: "GDPR Compliance",
      description: "General Data Protection Regulation for EU data subjects",
      type: "gdpr",
      status: "active",
      controlCount: 2,
      complianceScore: 92
    }
  );

  state.controls.push(
    {
      id: "control_mfa",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "ctrl_mfa_001",
      name: "Multi-Factor Authentication",
      description: "MFA must be enabled for all production access",
      frameworkId: "framework_soc2",
      category: "Access Control",
      controlType: "preventive",
      status: "compliant",
      severity: "high",
      ownerId: "user_security_admin",
      frequency: "monthly",
      lastTestedAt: createdAt,
      nextTestAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      evidenceIds: ["evidence_mfa_logs"],
      riskIds: [],
      metadata: { evidenceType: "access_logs", coverage: "100%" }
    },
    {
      id: "control_encryption",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "ctrl_enc_001",
      name: "Data Encryption at Rest",
      description: "All sensitive data must be encrypted at rest",
      frameworkId: "framework_iso27001",
      category: "Cryptography",
      controlType: "preventive",
      status: "compliant",
      severity: "critical",
      ownerId: "user_security_admin",
      frequency: "quarterly",
      lastTestedAt: createdAt,
      evidenceIds: ["evidence_enc_config"],
      riskIds: [],
      metadata: { algorithm: "AES-256", coverage: "100%" }
    },
    {
      id: "control_access_review",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "ctrl_acc_001",
      name: "Quarterly Access Review",
      description: "Review user access rights quarterly",
      frameworkId: "framework_soc2",
      category: "Access Control",
      controlType: "detective",
      status: "in_progress",
      severity: "medium",
      ownerId: "user_iam_admin",
      frequency: "quarterly",
      lastTestedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      nextTestAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      evidenceIds: [],
      riskIds: ["risk_orphaned_accounts"],
      metadata: {}
    },
    {
      id: "control_breach_notification",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "ctrl_gdpr_001",
      name: "Data Breach Notification",
      description: "Notify supervisory authority within 72 hours of breach",
      frameworkId: "framework_gdpr",
      category: "Incident Response",
      controlType: "corrective",
      status: "compliant",
      severity: "critical",
      ownerId: "user_dpo",
      frequency: "annually",
      lastTestedAt: createdAt,
      evidenceIds: ["evidence_incident_plan"],
      riskIds: [],
      metadata: { notificationPeriod: "72_hours" }
    },
    {
      id: "control_backup",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "ctrl_bk_001",
      name: "Backup and Recovery",
      description: "Daily backups with weekly restoration testing",
      frameworkId: "framework_iso27001",
      category: "Business Continuity",
      controlType: "corrective",
      status: "non_compliant",
      severity: "high",
      ownerId: "user_ops_admin",
      frequency: "daily",
      lastTestedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      nextTestAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      evidenceIds: ["evidence_backup_logs"],
      riskIds: ["risk_data_loss"],
      metadata: { backupFrequency: "daily", retention: "30_days" }
    }
  );

  state.audits.push(
    {
      id: "audit_soc2_2024",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "audit_soc2_2024",
      name: "SOC 2 Type II Audit 2024",
      description: "Annual SOC 2 Type II examination",
      type: "certification",
      status: "completed",
      frameworkId: "framework_soc2",
      auditorName: "Big Four Accounting Firm",
      scope: "Security, Availability, Confidentiality",
      startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      findings: [],
      ownerId: "user_compliance_manager",
      evidenceIds: [],
      checklistIds: ["checklist_soc2"]
    }
  );

  state.auditFindings.push(
    {
      id: "finding_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      auditId: "audit_soc2_2024",
      title: "Backup restoration testing not documented",
      description: "Quarterly backup restoration tests were performed but not documented",
      severity: "medium",
      status: "resolved",
      ownerId: "user_ops_admin",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      resolvedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      remediationTaskId: "remtask_001",
      evidenceIds: ["evidence_restoration_test"],
      notes: "Documentation process updated"
    }
  );

  state.risks.push(
    {
      id: "risk_data_loss",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "risk_data_loss",
      title: "Data loss due to backup failures",
      description: "Inadequate backup procedures may result in data loss",
      category: "operational",
      likelihood: "medium",
      impact: "high",
      riskScore: 6,
      status: "mitigated",
      ownerId: "user_ops_admin",
      mitigationPlan: "Implement automated backup testing and monitoring",
      mitigationTaskIds: ["remtask_001"],
      controlIds: ["control_backup"],
      residualRisk: 3,
      reviewedAt: createdAt
    },
    {
      id: "risk_orphaned_accounts",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "risk_orphaned_accounts",
      title: "Orphaned user accounts",
      description: "Inactive accounts may retain unnecessary access rights",
      category: "access_control",
      likelihood: "medium",
      impact: "medium",
      riskScore: 4,
      status: "identified",
      ownerId: "user_iam_admin",
      mitigationPlan: "Implement automated access review process",
      mitigationTaskIds: [],
      controlIds: ["control_access_review"],
      residualRisk: undefined,
      reviewedAt: undefined
    }
  );

  state.remediationTasks.push(
    {
      id: "remtask_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "Document backup restoration procedures",
      description: "Create runbook for backup restoration testing",
      status: "closed",
      priority: "high",
      ownerId: "user_ops_admin",
      assignedTo: "user_ops_admin",
      findingId: "finding_001",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      evidenceIds: ["evidence_restoration_test"],
      notes: "Completed and documented in Confluence"
    }
  );

  state.evidences.push(
    {
      id: "evidence_mfa_logs",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "evidence_mfa_logs",
      title: "MFA Configuration Audit Logs",
      description: "System logs showing MFA enforcement",
      type: "log",
      uri: "s3://compliance-evidence/mfa-audit-2024.log",
      uploadedBy: "user_security_admin",
      status: "active",
      controlIds: ["control_mfa"],
      requirementIds: [],
      auditIds: ["audit_soc2_2024"],
      metadata: { logFormat: "json", period: "2024" }
    },
    {
      id: "evidence_enc_config",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "evidence_enc_config",
      title: "Encryption Configuration Screenshot",
      description: "Screenshot of AES-256 encryption settings",
      type: "screenshot",
      uri: "s3://compliance-evidence/encryption-config.png",
      uploadedBy: "user_security_admin",
      status: "active",
      controlIds: ["control_encryption"],
      requirementIds: [],
      auditIds: ["audit_soc2_2024"],
      metadata: {}
    },
    {
      id: "evidence_incident_plan",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "evidence_incident_plan",
      title: "GDPR Incident Response Plan",
      description: "Documented incident response procedures",
      type: "policy",
      uri: "s3://compliance-evidence/gdpr-incident-plan.pdf",
      uploadedBy: "user_dpo",
      status: "active",
      controlIds: ["control_breach_notification"],
      requirementIds: [],
      auditIds: [],
      metadata: { version: "2.1", approvedDate: createdAt }
    },
    {
      id: "evidence_restoration_test",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "evidence_restoration_test",
      title: "Backup Restoration Test Report",
      description: "Documented backup restoration test results",
      type: "report",
      uri: "s3://compliance-evidence/backup-test-q3-2024.pdf",
      uploadedBy: "user_ops_admin",
      status: "active",
      controlIds: ["control_backup"],
      requirementIds: [],
      auditIds: ["audit_soc2_2024"],
      metadata: { testDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), result: "success" }
    }
  );

  state.policies.push(
    {
      id: "policy_access_control",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "policy_access_control",
      name: "Access Control Policy",
      description: "Defines access control requirements and procedures",
      version: 3,
      status: "active",
      ownerId: "user_security_admin",
      reviewFrequency: "annually",
      lastReviewedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      nextReviewAt: new Date(Date.now() + 305 * 24 * 60 * 60 * 1000).toISOString(),
      acknowledgmentRequired: true,
      acknowledgmentCount: 45,
      totalAcknowledgmentRequired: 50,
      documentUri: "s3://policies/access-control-policy-v3.pdf",
      tags: ["security", "access", "iam"]
    },
    {
      id: "policy_data_privacy",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "policy_data_privacy",
      name: "Data Privacy Policy",
      description: "Data privacy and protection requirements",
      version: 2,
      status: "active",
      ownerId: "user_dpo",
      reviewFrequency: "annually",
      lastReviewedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      nextReviewAt: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString(),
      acknowledgmentRequired: true,
      acknowledgmentCount: 50,
      totalAcknowledgmentRequired: 50,
      documentUri: "s3://policies/data-privacy-policy-v2.pdf",
      tags: ["privacy", "gdpr", "data"]
    }
  );

  state.complianceChecklists.push(
    {
      id: "checklist_soc2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "checklist_soc2_2024",
      name: "SOC 2 Audit Checklist 2024",
      description: "Pre-audit readiness checklist",
      type: "general",
      status: "active",
      ownerId: "user_compliance_manager",
      items: [
        {
          id: "item_1",
          title: "Collect access control evidence",
          description: "Gather MFA, RBAC, and access review documentation",
          category: "Access Control",
          status: "completed",
          evidenceIds: ["evidence_mfa_logs"],
          completedAt: createdAt,
          completedBy: "user_security_admin"
        },
        {
          id: "item_2",
          title: "Collect encryption evidence",
          description: "Gather encryption configuration and key management evidence",
          category: "Data Protection",
          status: "completed",
          evidenceIds: ["evidence_enc_config"],
          completedAt: createdAt,
          completedBy: "user_security_admin"
        },
        {
          id: "item_3",
          title: "Document incident response",
          description: "Prepare incident response plan and procedures",
          category: "Incident Response",
          status: "completed",
          evidenceIds: ["evidence_incident_plan"],
          completedAt: createdAt,
          completedBy: "user_dpo"
        }
      ],
      dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      completionRate: 100
    }
  );

  state.vendorCompliances.push(
    {
      id: "vendor_aws",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Amazon Web Services",
      description: "Cloud infrastructure provider",
      vendorType: "infrastructure",
      riskLevel: "low",
      status: "approved",
      questionnaireIds: [],
      documentIds: [],
      securityScore: 95,
      complianceScore: 92,
      lastReviewedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      nextReviewAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      contractExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      evidenceIds: [],
      ownerId: "user_security_admin",
      notes: "SOC 2 and ISO 27001 certified"
    }
  );

  state.reports.push({
    id: "report_compliance_q3",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Q3 2024 Compliance Summary",
    description: "Quarterly compliance status report",
    type: "executive_summary",
    frameworkId: undefined,
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: createdAt,
    generatedBy: "user_compliance_manager",
    status: "generated",
    content: "Compliance score improved from 75% to 82% this quarter. Key improvements in MFA coverage and encryption controls."
  });

  state.events.push({
    id: "event_seed",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "compliance.seeded",
    source: "ComplianceOS",
    data: { message: "ComplianceOS demo data seeded" }
  });

  return state;
}
