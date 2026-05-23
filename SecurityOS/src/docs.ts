export const docs = {
  name: "SecurityOS",
  version: "1.0.0",
  description: "Reusable security operating layer for IAM, RBAC, access policies, audit logs, secrets, API keys, sessions, compliance controls, access reviews, findings, and security analytics.",
  authentication: { type: "header based demo auth", headers: { "x-tenant-id": "Tenant id. Defaults to demo-tenant.", "x-user-id": "Actor/user id.", "x-role": "viewer | security_analyst | iam_admin | secret_manager | compliance_manager | security_admin | admin | owner | auditor" } },
  examples: {
    createIdentity: { method: "POST", path: "/securityos/identities", body: { email: "dev@appneural.com", displayName: "Dev Engineer", mfaEnabled: true } },
    createRole: { method: "POST", path: "/securityos/roles", body: { name: "Commerce Manager", permissions: ["commerce.orders.*", "commerce.products.read"] } },
    checkAccess: { method: "POST", path: "/securityos/access/check", body: { subjectId: "ident_demo_rahul", action: "commerce.orders.write", resource: "commerce.orders" } },
    createSecret: { method: "POST", path: "/securityos/secrets", body: { name: "STRIPE_SECRET", environment: "prod", value: "sk_live_demo" } }
  },
  productionNotes: ["Replace the demo JSON datastore with PostgreSQL using database/schema.sql.", "Replace demo secret sealing with a real KMS/HSM provider before production.", "Use SSO/OIDC or another identity provider for real authentication."]
};
