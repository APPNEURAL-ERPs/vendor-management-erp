export function docs() {
  return {
    name: "PolicyOS",
    version: "1.0.0",
    description: "PolicyOS: policy creation, management, approval, acknowledgment, enforcement, exception, review, versioning, and governance layer",
    auth: {
      headers: {
        "x-role": "owner | admin | policy_admin | policy_manager | compliance_manager | auditor | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      policy: "A structured policy document with versioning, rules, and lifecycle management.",
      rule: "Individual rule within a policy that defines allow/deny conditions.",
      guardrail: "Safety guardrails that evaluate actions before enforcement.",
      rateLimit: "Rate limiting rules to control resource access frequency.",
      approvalRule: "Workflow rules that require human approval before execution.",
      exception: "Controlled deviation from policy rules with approval workflow.",
      violation: "Detected breach of policy rules requiring investigation.",
      acknowledgment: "User acceptance tracking for policy versions."
    },
    examples: {
      createPolicy: {
        method: "POST",
        path: "/policyos/policies",
        headers: { "x-role": "policy_manager" },
        body: {
          key: "ai_usage_policy",
          name: "AI Usage Policy",
          description: "Policy for safe and responsible AI usage",
          category: "ai",
          tags: ["ai", "safety", "compliance"],
          ownerId: "user_admin",
          reviewCycle: "quarterly"
        }
      },
      createRule: {
        method: "POST",
        path: "/policyos/rules",
        headers: { "x-role": "policy_manager" },
        body: {
          key: "ai_human_review",
          name: "AI Human Review Rule",
          effect: "deny",
          actions: ["ai.generate.high_impact"],
          resources: ["*"],
          conditions: { requireHumanReview: true },
          priority: 100
        }
      },
      evaluateAccess: {
        method: "POST",
        path: "/policyos/evaluate",
        headers: { "x-role": "policy_manager" },
        body: {
          subjectId: "user_123",
          subjectType: "user",
          action: "ai.generate.high_impact",
          resource: "tenant:production"
        }
      },
      requestException: {
        method: "POST",
        path: "/policyos/exceptions",
        headers: { "x-role": "policy_manager" },
        body: {
          policyId: "policy_ai_usage",
          reason: "Emergency AI generation needed for customer escalation",
          justification: "Customer SLA at risk",
          riskLevel: "medium",
          expiresAt: "2026-05-25T00:00:00Z"
        }
      }
    }
  };
}
