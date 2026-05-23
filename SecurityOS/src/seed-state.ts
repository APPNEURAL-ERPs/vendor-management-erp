import { emptyState, plusDays, nowIso, SecretEngine, SecurityState } from "./core";
export function createSeedState(tenantId = "demo-tenant"): SecurityState {
  const now = nowIso(); const state = emptyState(); const secretValue = "sk_demo_appneural_prod"; const apiToken = "ak_demo_seed_token";
  state.identities = [
    { id: "ident_demo_maya", tenantId, createdAt: now, updatedAt: now, email: "maya@appneural.com", displayName: "Maya Security Admin", identityType: "user", status: "active", mfaEnabled: true, lastLoginAt: now, riskScore: 15, groups: ["group_security"], metadata: { department: "Security" }, createdBy: "seed" },
    { id: "ident_demo_rahul", tenantId, createdAt: now, updatedAt: now, email: "rahul@appneural.com", displayName: "Rahul Platform Engineer", identityType: "user", status: "active", mfaEnabled: false, riskScore: 72, groups: ["group_engineering"], metadata: { department: "Engineering" }, createdBy: "seed" },
    { id: "ident_demo_asha", tenantId, createdAt: now, updatedAt: now, email: "asha@appneural.com", displayName: "Asha Compliance Auditor", identityType: "user", status: "active", mfaEnabled: true, riskScore: 20, groups: ["group_compliance"], metadata: { department: "Compliance" }, createdBy: "seed" },
    { id: "ident_demo_service_commerce", tenantId, createdAt: now, updatedAt: now, email: "commerce-service@appneural.local", displayName: "CommerceOS Service Account", identityType: "service_account", status: "active", mfaEnabled: true, riskScore: 30, groups: ["group_engineering"], metadata: { service: "CommerceOS" }, createdBy: "seed" }
  ];
  state.roles = [
    { id: "role_security_admin", tenantId, createdAt: now, updatedAt: now, name: "Security Admin", description: "Full SecurityOS administration", permissions: ["*"], system: true, status: "active", createdBy: "seed" },
    { id: "role_iam_operator", tenantId, createdAt: now, updatedAt: now, name: "IAM Operator", description: "Manage identities, groups, and assignments", permissions: ["security.identities.*", "security.groups.*", "security.assignments.*", "security.access.check"], system: true, status: "active", createdBy: "seed" },
    { id: "role_security_auditor", tenantId, createdAt: now, updatedAt: now, name: "Security Auditor", description: "Read security, audit, and compliance records", permissions: ["security.*.read", "security.audit.read", "security.events.read", "security.analytics.read"], system: true, status: "active", createdBy: "seed" },
    { id: "role_commerce_operator", tenantId, createdAt: now, updatedAt: now, name: "Commerce Operator", description: "Operate CommerceOS orders and products", permissions: ["commerce.orders.*", "commerce.products.read", "commerce.checkout.use"], system: false, status: "active", createdBy: "seed" },
    { id: "role_secret_operator", tenantId, createdAt: now, updatedAt: now, name: "Secret Operator", description: "Manage secrets", permissions: ["security.secrets.read", "security.secrets.write", "security.secrets.reveal"], system: false, status: "active", createdBy: "seed" }
  ];
  state.groups = [
    { id: "group_security", tenantId, createdAt: now, updatedAt: now, name: "Security Team", description: "Security administrators", members: ["ident_demo_maya"], roleIds: ["role_security_admin"], status: "active", createdBy: "seed" },
    { id: "group_engineering", tenantId, createdAt: now, updatedAt: now, name: "Engineering", description: "Platform engineering team", members: ["ident_demo_rahul", "ident_demo_service_commerce"], roleIds: ["role_commerce_operator"], status: "active", createdBy: "seed" },
    { id: "group_compliance", tenantId, createdAt: now, updatedAt: now, name: "Compliance", description: "Compliance reviewers", members: ["ident_demo_asha"], roleIds: ["role_security_auditor"], status: "active", createdBy: "seed" }
  ];
  state.assignments = [
    { id: "assign_maya_admin", tenantId, createdAt: now, updatedAt: now, subjectType: "identity", subjectId: "ident_demo_maya", roleId: "role_security_admin", scope: "global", status: "active", assignedBy: "seed" },
    { id: "assign_asha_auditor", tenantId, createdAt: now, updatedAt: now, subjectType: "identity", subjectId: "ident_demo_asha", roleId: "role_security_auditor", scope: "global", status: "active", assignedBy: "seed" },
    { id: "assign_eng_commerce", tenantId, createdAt: now, updatedAt: now, subjectType: "group", subjectId: "group_engineering", roleId: "role_commerce_operator", scope: "commerce", status: "active", assignedBy: "seed" }
  ];
  state.policies = [
    { id: "policy_deny_secret_reveal_commerce", tenantId, createdAt: now, updatedAt: now, name: "Deny Secret Reveal To Commerce Operators", description: "Commerce operators cannot reveal secrets", effect: "deny", subjectRoles: ["Commerce Operator"], actions: ["security.secrets.reveal"], resources: ["security.secrets"], conditions: {}, priority: 100, status: "active", createdBy: "seed" },
    { id: "policy_allow_auditor_read", tenantId, createdAt: now, updatedAt: now, name: "Auditors Can Read Security", description: "Security auditors can read audit and compliance data", effect: "allow", subjectRoles: ["Security Auditor"], actions: ["security.audit.read", "security.controls.read", "security.evidence.read"], resources: ["security.audit", "security.controls", "security.evidence"], conditions: {}, priority: 50, status: "active", createdBy: "seed" }
  ];
  state.sessions = [
    { id: "sess_maya_active", tenantId, createdAt: now, updatedAt: now, identityId: "ident_demo_maya", status: "active", ipAddress: "10.0.0.10", userAgent: "SecurityOS Demo", expiresAt: plusDays(7) },
    { id: "sess_rahul_expired", tenantId, createdAt: now, updatedAt: now, identityId: "ident_demo_rahul", status: "active", ipAddress: "10.0.0.11", userAgent: "SecurityOS Demo", expiresAt: plusDays(-1) }
  ];
  state.apiKeys = [{ id: "apikey_demo_commerce", tenantId, createdAt: now, updatedAt: now, ownerId: "ident_demo_service_commerce", name: "CommerceOS service key", keyPrefix: apiToken.slice(0,10), keyHash: SecretEngine.sha256(apiToken), scopes: ["commerce.orders.write", "commerce.products.read"], status: "active", expiresAt: plusDays(90), createdBy: "seed" }];
  state.secrets = [{ id: "secret_demo_stripe", tenantId, createdAt: now, updatedAt: now, name: "STRIPE_SECRET", description: "Demo payment secret", environment: "prod", encryptedValue: SecretEngine.seal(secretValue), maskedValue: SecretEngine.mask(secretValue), version: 1, tags: ["payments", "financeos"], status: "active", createdBy: "seed" }];
  state.secretVersions = [{ id: "secver_demo_stripe_v1", tenantId, createdAt: now, updatedAt: now, secretId: "secret_demo_stripe", version: 1, encryptedValue: SecretEngine.seal(secretValue), maskedValue: SecretEngine.mask(secretValue), createdBy: "seed" }];
  state.controls = [
    { id: "ctrl_soc2_cc6_1", tenantId, createdAt: now, updatedAt: now, framework: "SOC2", code: "CC6.1", title: "Logical access controls", description: "Access is granted based on roles and reviewed regularly.", ownerId: "ident_demo_asha", status: "in_progress", severity: "high", dueDate: "2026-06-30", evidenceIds: ["evd_access_policy"], createdBy: "seed" },
    { id: "ctrl_iso_a_5_15", tenantId, createdAt: now, updatedAt: now, framework: "ISO27001", code: "A.5.15", title: "Access control", description: "Access control rules are defined and implemented.", ownerId: "ident_demo_maya", status: "compliant", severity: "medium", dueDate: "2026-07-15", evidenceIds: [], createdBy: "seed" }
  ];
  state.evidences = [{ id: "evd_access_policy", tenantId, createdAt: now, updatedAt: now, controlId: "ctrl_soc2_cc6_1", title: "Access control policy", evidenceType: "policy", uri: "appneural://policies/access-control", notes: "Demo policy evidence", uploadedBy: "seed" }];
  state.accessReviews = [{ id: "review_q2_access", tenantId, createdAt: now, updatedAt: now, name: "Q2 privileged access review", reviewerId: "ident_demo_asha", status: "active", dueAt: plusDays(30), items: [ { identityId: "ident_demo_maya", roleId: "role_security_admin", assignmentId: "assign_maya_admin", status: "pending" }, { identityId: "ident_demo_asha", roleId: "role_security_auditor", assignmentId: "assign_asha_auditor", status: "pending" } ], createdBy: "seed" }];
  state.findings = [
    { id: "finding_rahul_mfa", tenantId, createdAt: now, updatedAt: now, title: "MFA disabled for platform engineer", description: "Rahul has CommerceOS access but MFA is not enabled.", category: "iam", severity: "high", status: "open", ownerId: "ident_demo_maya", createdBy: "seed" },
    { id: "finding_expired_session", tenantId, createdAt: now, updatedAt: now, title: "Expired session still marked active", description: "An expired active session should be revoked or cleaned up.", category: "session", severity: "medium", status: "open", ownerId: "ident_demo_maya", createdBy: "seed" }
  ];
  return state;
}
