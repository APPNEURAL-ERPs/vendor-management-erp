import { ToolState } from "./core/domain";

export function createSeedState(tenantId = "demo-tenant"): ToolState {
  const now = new Date().toISOString();
  return {
    tools: [
      {
        id: "tool_qr_generate",
        tenantId,
        createdAt: now,
        updatedAt: now,
        key: "tool.qr.generate",
        name: "QR Generator",
        description: "Generates QR image assets for payment links, URLs, and codes.",
        kind: "generator",
        category: "media",
        status: "active",
        riskLevel: "low",
        inputSchema: { text: "string", format: "png|svg" },
        outputSchema: { fileUrl: "string", format: "string" },
        requiredPermissions: ["tools.qr.generate"],
        requiresApproval: false,
        rateLimitPerMinute: 120,
        timeoutMs: 5000,
        ownerTeam: "Tool Platform",
        tags: ["qr", "payment", "media"],
        metadata: {},
        updatedBy: "seed"
      },
      {
        id: "tool_pdf_generate",
        tenantId,
        createdAt: now,
        updatedAt: now,
        key: "tool.pdf.generate",
        name: "PDF Generator",
        description: "Generates PDF documents from templates and structured data.",
        kind: "generator",
        category: "documents",
        status: "active",
        riskLevel: "medium",
        inputSchema: { template: "string", data: "object" },
        outputSchema: { fileUrl: "string", pages: "number" },
        requiredPermissions: ["tools.pdf.generate"],
        requiresApproval: false,
        rateLimitPerMinute: 60,
        timeoutMs: 10000,
        ownerTeam: "Tool Platform",
        tags: ["pdf", "documents"],
        metadata: {},
        updatedBy: "seed"
      },
      {
        id: "tool_domain_check",
        tenantId,
        createdAt: now,
        updatedAt: now,
        key: "tool.domain.check",
        name: "Domain Checker",
        description: "Checks domain availability and suggests alternatives.",
        kind: "checker",
        category: "web",
        status: "active",
        riskLevel: "low",
        inputSchema: { domain: "string" },
        outputSchema: { available: "boolean", suggestions: "array" },
        requiredPermissions: ["tools.domain.check"],
        requiresApproval: false,
        rateLimitPerMinute: 60,
        timeoutMs: 5000,
        ownerTeam: "Web Platform",
        tags: ["domain", "website"],
        metadata: {},
        updatedBy: "seed"
      },
      {
        id: "tool_brand_check",
        tenantId,
        createdAt: now,
        updatedAt: now,
        key: "tool.brand.check",
        name: "Brand Checker",
        description: "Checks content for brand and claim compliance.",
        kind: "validator",
        category: "brand",
        status: "active",
        riskLevel: "medium",
        inputSchema: { text: "string", channel: "string" },
        outputSchema: { compliant: "boolean", score: "number" },
        requiredPermissions: ["tools.brand.check"],
        requiresApproval: false,
        rateLimitPerMinute: 90,
        timeoutMs: 5000,
        ownerTeam: "Brand",
        tags: ["brand", "claims", "content"],
        metadata: {},
        updatedBy: "seed"
      }
    ],
    executions: [],
    approvals: [],
    policies: [
      {
        id: "policy_pdf_generate",
        tenantId,
        createdAt: now,
        updatedAt: now,
        toolKey: "tool.pdf.generate",
        allowedRoles: ["tool_admin", "tool_developer", "tool_operator"],
        blockedTenants: [],
        maxCallsPerRun: 20,
        maxPayloadBytes: 1000000,
        requiresApprovalFor: []
      }
    ],
    credentials: [],
    installations: [],
    usageMetrics: [],
    events: [
      {
        id: "evt_seed_ready",
        tenantId,
        createdAt: now,
        updatedAt: now,
        type: "tool.seed.ready",
        source: "ToolOS",
        actorId: "seed",
        role: "tool_admin",
        data: { tools: 4 }
      }
    ],
    auditLogs: []
  };
}
