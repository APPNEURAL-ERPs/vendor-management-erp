export function docs() {
  return {
    name: "ComplianceOS",
    version: "1.0.0",
    description: "Regulatory compliance, certifications, standards, audits, controls, and compliance monitoring",
    auth: {
      headers: {
        "x-role": "owner | admin | compliance_manager | compliance_analyst | auditor | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      framework: "A compliance framework like SOC 2, ISO 27001, or GDPR.",
      control: "A security or compliance control that maps to framework requirements.",
      audit: "An examination or review against compliance requirements.",
      finding: "An issue or gap discovered during an audit.",
      risk: "An identified risk with likelihood and impact scoring.",
      evidence: "Proof of compliance such as logs, screenshots, or documents.",
      policy: "Company policies that require acknowledgment and periodic review.",
      checklist: "A checklist for tracking compliance tasks and audit readiness."
    },
    entities: {
      ComplianceFramework: "Standards and certifications (SOC 2, ISO 27001, GDPR, HIPAA, PCI DSS, NIST)",
      Control: "Security and compliance controls with testing and evidence requirements",
      Audit: "Internal, external, certification, or regulatory audits",
      AuditFinding: "Issues identified during audits with severity and remediation",
      Risk: "Identified risks with likelihood, impact, and mitigation plans",
      Evidence: "Documents, logs, screenshots, and other proof of compliance",
      Policy: "Company policies requiring acknowledgment and review",
      ComplianceChecklist: "Tasks and evidence requirements for compliance activities",
      VendorCompliance: "Third-party vendor risk and compliance tracking",
      RemediationTask: "Tasks to fix findings or mitigate risks"
    },
    examples: {
      getOverview: {
        method: "GET",
        path: "/compliance/overview",
        headers: { "x-role": "viewer" }
      },
      listControls: {
        method: "GET",
        path: "/compliance/controls",
        headers: { "x-role": "viewer" },
        query: "?status=non_compliant"
      },
      createControl: {
        method: "POST",
        path: "/compliance/controls",
        headers: { "x-role": "compliance_manager" },
        body: {
          key: "ctrl_mfa_002",
          name: "Password Complexity",
          description: "Passwords must meet complexity requirements",
          category: "Access Control",
          controlType: "preventive",
          severity: "high"
        }
      },
      startAudit: {
        method: "POST",
        path: "/compliance/audits",
        headers: { "x-role": "auditor" },
        body: {
          key: "audit_q4_2024",
          name: "Q4 2024 Internal Audit",
          type: "internal",
          frameworkId: "framework_soc2",
          auditorName: "Internal Audit Team",
          scope: "Security and availability controls"
        }
      },
      registerRisk: {
        method: "POST",
        path: "/compliance/risks",
        headers: { "x-role": "compliance_manager" },
        body: {
          key: "risk_vendor_data",
          title: "Vendor data breach risk",
          description: "Risk of unauthorized data access by vendor",
          category: "vendor",
          likelihood: "medium",
          impact: "high",
          mitigationPlan: "Implement vendor access controls and monitoring"
        }
      },
      uploadEvidence: {
        method: "POST",
        path: "/compliance/evidences",
        headers: { "x-role": "compliance_manager" },
        body: {
          title: "MFA Configuration Evidence",
          type: "screenshot",
          uri: "s3://evidence/mfa-config.png",
          controlIds: ["control_mfa"]
        }
      }
    },
    permissions: {
      viewer: "Can read all compliance data",
      compliance_analyst: "Can read and execute audits",
      compliance_manager: "Full write access to all compliance entities",
      auditor: "Can read and execute audits",
      admin: "Full administrative access",
      owner: "Full administrative access"
    }
  };
}
