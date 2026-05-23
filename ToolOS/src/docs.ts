export function docs() {
  return {
    service: "ToolOS",
    version: "1.0.0",
    description: "Reusable tool registry and execution gateway for APPNEUROX agents, workflows, and OS packages.",
    namespace: "tools",
    package: "@appneurox/toolos",
    defaultTenant: "demo-tenant",
    roles: ["owner", "admin", "tool_admin", "tool_developer", "tool_operator", "auditor", "viewer"],
    endpoints: {
      overview: ["GET /v1/tools/overview", "GET /v1/tools/permissions"],
      tools: ["GET /v1/tools", "POST /v1/tools", "PUT /v1/tools/:key", "POST /v1/tools/:key/execute"],
      manifests: ["POST /v1/tools/manifests/validate", "POST /v1/tools/install", "GET /v1/tools/discovery", "POST /v1/tools/generate"],
      analytics: ["GET /v1/tools/analytics/usage"],
      approvals: ["GET /v1/tools/approvals", "POST /v1/tools/approvals/:id/approve", "POST /v1/tools/approvals/:id/reject"],
      policies: ["GET /v1/tools/policies", "POST /v1/tools/policies"],
      credentials: ["GET /v1/tools/credentials", "POST /v1/tools/credentials"],
      logs: ["GET /v1/tools/events", "GET /v1/tools/audit"]
    },
    seededTools: ["tool.qr.generate", "tool.pdf.generate", "tool.domain.check", "tool.brand.check"]
  };
}
