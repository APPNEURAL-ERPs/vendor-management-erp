import { PolicyState } from "./domain";
import { emptyState } from "./core/datastore";
import { nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): PolicyState {
  const state = emptyState();
  const createdAt = nowIso();

  state.policies.push(
    {
      id: "policy_ai_usage",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "ai_usage_policy",
      name: "AI Usage Policy",
      description: "Policy for safe and responsible AI usage across APPNEURAL platforms",
      category: "ai",
      tags: ["ai", "safety", "compliance"],
      status: "published",
      ownerId: "user_security_admin",
      ownerName: "Security Team",
      reviewCycle: "quarterly",
      nextReviewDate: "2026-08-22T00:00:00Z",
      activeVersion: 1,
      versions: [
        {
          id: "pv_ai_usage_1",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          policyId: "policy_ai_usage",
          version: 1,
          template: "AI Usage Policy v1: High-impact AI outputs require human review. AI agents cannot execute payments without approval. Sensitive customer data cannot be sent to unapproved models. AI-generated legal documents must show lawyer review disclaimer. AI cost per tenant must stay within plan limit.",
          rules: [
            {
              id: "rule_ai_human_review",
              tenantId,
              createdAt,
              updatedAt: createdAt,
              key: "ai_human_review",
              name: "AI Human Review Rule",
              effect: "deny",
              subjectRoles: ["agent"],
              actions: ["ai.generate.high_impact"],
              resources: ["*"],
              conditions: { requireHumanReview: true },
              priority: 100,
              status: "active",
              createdBy: "user_security_admin"
            },
            {
              id: "rule_ai_payment_block",
              tenantId,
              createdAt,
              updatedAt: createdAt,
              key: "ai_payment_block",
              name: "AI Payment Block Rule",
              effect: "deny",
              subjectRoles: ["agent"],
              actions: ["billing.execute_payment"],
              resources: ["*"],
              conditions: { requireApproval: true },
              priority: 100,
              status: "active",
              createdBy: "user_security_admin"
            }
          ],
          createdBy: "user_security_admin",
          approvedBy: "user_governance_admin",
          approvedAt: createdAt,
          status: "published"
        }
      ],
      metadata: { domain: "ai", compliance: ["gdpr", "sox"] },
      createdBy: "user_security_admin",
      publishedAt: createdAt
    },
    {
      id: "policy_access_control",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "access_control_policy",
      name: "Access Control Policy",
      description: "Identity and access management policy for APPNEURAL",
      category: "security",
      tags: ["access", "security", "iam"],
      status: "published",
      ownerId: "user_iam_admin",
      ownerName: "IAM Team",
      reviewCycle: "quarterly",
      nextReviewDate: "2026-08-22T00:00:00Z",
      activeVersion: 1,
      versions: [
        {
          id: "pv_access_control_1",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          policyId: "policy_access_control",
          version: 1,
          template: "Access Control Policy v1: All admin users must use MFA. Production access requires approval. Inactive users are disabled after 90 days. Enterprise tenants must use SSO. Service accounts must have scoped permissions only.",
          rules: [
            {
              id: "rule_mfa_required",
              tenantId,
              createdAt,
              updatedAt: createdAt,
              key: "mfa_required",
              name: "MFA Required Rule",
              effect: "deny",
              subjectRoles: ["admin", "super_admin"],
              actions: ["auth.login"],
              resources: ["*"],
              conditions: { requireMfa: true },
              priority: 100,
              status: "active",
              createdBy: "user_iam_admin"
            }
          ],
          createdBy: "user_iam_admin",
          approvedBy: "user_security_admin",
          approvedAt: createdAt,
          status: "published"
        }
      ],
      metadata: { domain: "security" },
      createdBy: "user_iam_admin",
      publishedAt: createdAt
    },
    {
      id: "policy_refund",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "refund_policy",
      name: "Refund and Billing Policy",
      description: "Refund and billing policy for customer transactions",
      category: "finance",
      tags: ["refund", "billing", "finance"],
      status: "published",
      ownerId: "user_finance_admin",
      ownerName: "Finance Team",
      reviewCycle: "half_yearly",
      nextReviewDate: "2026-11-22T00:00:00Z",
      activeVersion: 1,
      versions: [
        {
          id: "pv_refund_1",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          policyId: "policy_refund",
          version: 1,
          template: "Refund Policy v1: Refunds above ₹10,000 require finance head approval. Discounts above 15% require founder approval. Invoices cannot be deleted after being issued. Manual payment marking requires payment evidence.",
          rules: [
            {
              id: "rule_refund_approval",
              tenantId,
              createdAt,
              updatedAt: createdAt,
              key: "refund_approval_required",
              name: "Refund Approval Required Rule",
              effect: "deny",
              subjectRoles: ["billing_user"],
              actions: ["billing.refund.execute"],
              resources: ["*"],
              conditions: { minAmount: 10000, requireApproval: true },
              priority: 100,
              status: "active",
              createdBy: "user_finance_admin"
            }
          ],
          createdBy: "user_finance_admin",
          approvedBy: "user_governance_admin",
          approvedAt: createdAt,
          status: "published"
        }
      ],
      metadata: { domain: "finance" },
      createdBy: "user_finance_admin",
      publishedAt: createdAt
    },
    {
      id: "policy_data_privacy",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "data_privacy_policy",
      name: "Data Privacy and Protection Policy",
      description: "Data handling, retention, and privacy policy",
      category: "data",
      tags: ["data", "privacy", "gdpr"],
      status: "published",
      ownerId: "user_data_officer",
      ownerName: "Data Governance Team",
      reviewCycle: "yearly",
      nextReviewDate: "2027-05-22T00:00:00Z",
      activeVersion: 1,
      versions: [
        {
          id: "pv_data_privacy_1",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          policyId: "policy_data_privacy",
          version: 1,
          template: "Data Privacy Policy v1: Resume data is retained for 12 months after account inactivity. Customer data export requires approval. PII must be masked in logs. Deleted tenant data must be purged after retention period. AI prompts must not include unnecessary sensitive data.",
          rules: [
            {
              id: "rule_pii_masking",
              tenantId,
              createdAt,
              updatedAt: createdAt,
              key: "pii_masking",
              name: "PII Masking Rule",
              effect: "deny",
              subjectRoles: ["*"],
              actions: ["data.log", "data.export"],
              resources: ["*"],
              conditions: { maskPii: true },
              priority: 100,
              status: "active",
              createdBy: "user_data_officer"
            }
          ],
          createdBy: "user_data_officer",
          approvedBy: "user_governance_admin",
          approvedAt: createdAt,
          status: "published"
        }
      ],
      metadata: { domain: "data", compliance: ["gdpr", "ccpa"] },
      createdBy: "user_data_officer",
      publishedAt: createdAt
    },
    {
      id: "policy_notification",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "notification_consent_policy",
      name: "Notification and Communication Policy",
      description: "Communication consent and delivery rules",
      category: "notification",
      tags: ["notification", "consent", "communication"],
      status: "published",
      ownerId: "user_marketing_ops",
      ownerName: "Marketing Operations Team",
      reviewCycle: "quarterly",
      nextReviewDate: "2026-08-22T00:00:00Z",
      activeVersion: 1,
      versions: [
        {
          id: "pv_notification_1",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          policyId: "policy_notification",
          version: 1,
          template: "Notification Policy v1: Marketing messages require explicit opt-in. Security alerts bypass quiet hours. Transactional billing emails cannot be disabled. SMS should not include sensitive data. WhatsApp messages require user consent.",
          rules: [
            {
              id: "rule_marketing_consent",
              tenantId,
              createdAt,
              updatedAt: createdAt,
              key: "marketing_consent_required",
              name: "Marketing Consent Required Rule",
              effect: "deny",
              subjectRoles: ["*"],
              actions: ["notification.send.marketing"],
              resources: ["*"],
              conditions: { requireConsent: true },
              priority: 100,
              status: "active",
              createdBy: "user_marketing_ops"
            }
          ],
          createdBy: "user_marketing_ops",
          approvedBy: "user_governance_admin",
          approvedAt: createdAt,
          status: "published"
        }
      ],
      metadata: { domain: "notification" },
      createdBy: "user_marketing_ops",
      publishedAt: createdAt
    }
  );

  state.rules.push(
    {
      id: "rule_ai_human_review",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "ai_human_review",
      name: "AI Human Review Rule",
      effect: "deny",
      subjectRoles: ["agent"],
      actions: ["ai.generate.high_impact"],
      resources: ["*"],
      conditions: { requireHumanReview: true },
      priority: 100,
      status: "active",
      createdBy: "user_security_admin"
    },
    {
      id: "rule_ai_payment_block",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "ai_payment_block",
      name: "AI Payment Block Rule",
      effect: "deny",
      subjectRoles: ["agent"],
      actions: ["billing.execute_payment"],
      resources: ["*"],
      conditions: { requireApproval: true },
      priority: 100,
      status: "active",
      createdBy: "user_security_admin"
    },
    {
      id: "rule_mfa_required",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "mfa_required",
      name: "MFA Required Rule",
      effect: "deny",
      subjectRoles: ["admin", "super_admin"],
      actions: ["auth.login"],
      resources: ["*"],
      conditions: { requireMfa: true },
      priority: 100,
      status: "active",
      createdBy: "user_iam_admin"
    }
  );

  state.guardrails.push(
    {
      id: "guardrail_safe_ai",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "safe_ai_guardrail",
      name: "Safe AI Guardrail",
      description: "Blocks unsafe or harmful AI inputs and outputs",
      effect: "deny",
      conditions: { bannedTerms: ["harmful", "malicious", "illegal"], maxRiskScore: 80 },
      priority: 100,
      status: "active",
      createdBy: "user_security_admin"
    },
    {
      id: "guardrail_data_privacy",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "data_privacy_guardrail",
      name: "Data Privacy Guardrail",
      description: "Enforces data privacy and PII protection",
      effect: "deny",
      conditions: { requirePiiMasking: true, requireConsent: true },
      priority: 100,
      status: "active",
      createdBy: "user_data_officer"
    }
  );

  state.rateLimits.push(
    {
      id: "ratelimit_api_calls",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "api_rate_limit",
      name: "API Rate Limit",
      description: "Rate limit for API calls per tenant",
      resource: "api",
      limit: 1000,
      windowSeconds: 60,
      status: "active",
      createdBy: "user_platform_admin"
    },
    {
      id: "ratelimit_ai_requests",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "ai_request_rate_limit",
      name: "AI Request Rate Limit",
      description: "Rate limit for AI requests per tenant",
      resource: "ai",
      limit: 100,
      windowSeconds: 60,
      status: "active",
      createdBy: "user_security_admin"
    }
  );

  state.approvalRules.push(
    {
      id: "approval_refund_large",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "large_refund_approval",
      name: "Large Refund Approval Rule",
      description: "Refunds above ₹10,000 require finance head approval",
      policyId: "policy_refund",
      requiredApprovers: [
        { role: "finance_head" },
        { role: "governance_admin" }
      ],
      minApprovers: 1,
      autoExpireHours: 72,
      status: "active",
      createdBy: "user_finance_admin"
    },
    {
      id: "approval_production_access",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "production_access_approval",
      name: "Production Access Approval Rule",
      description: "Production environment access requires approval",
      policyId: "policy_access_control",
      requiredApprovers: [
        { role: "security_admin" }
      ],
      minApprovers: 1,
      autoExpireHours: 24,
      status: "active",
      createdBy: "user_iam_admin"
    }
  );

  state.acknowledgments.push(
    {
      id: "ack_user_security_ai",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      policyId: "policy_ai_usage",
      version: 1,
      userId: "user_employee_1",
      userName: "Employee 1",
      status: "acknowledged",
      acknowledgedAt: createdAt
    },
    {
      id: "ack_user_employee_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      policyId: "policy_ai_usage",
      version: 1,
      userId: "user_employee_2",
      userName: "Employee 2",
      status: "pending",
      dueDate: "2026-05-30T00:00:00Z"
    },
    {
      id: "ack_user_employee_3",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      policyId: "policy_access_control",
      version: 1,
      userId: "user_employee_3",
      userName: "Employee 3",
      status: "acknowledged",
      acknowledgedAt: createdAt
    }
  );

  state.events.push({
    id: "event_policyos_bootstrap",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "policyos.seeded",
    source: "PolicyOS",
    data: { message: "PolicyOS demo data seeded" }
  });

  return state;
}
