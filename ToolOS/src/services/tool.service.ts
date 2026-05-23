import {
  RequestActor,
  Role,
  ToolApproval,
  ToolCredential,
  ToolDefinition,
  ToolExecution,
  ToolExecutionStatus,
  ToolInstallation,
  ToolKind,
  ToolManifest,
  ToolOverview,
  ToolPolicy,
  ToolRiskLevel,
  ToolStatus,
  ToolUsageMetric
} from "../core/domain";
import { badRequest, conflict, forbidden, notFound } from "../core/errors";
import { newId, nowIso } from "../core/id";
import { clone, ensureBoolean, ensureNumber, ensureObject, ensureString, normalizeStringArray, optionalString, parseNumberQuery, pickQuery } from "../core/utils";
import { hasPermission } from "../core/security";
import { DataStore } from "../core/datastore";
import { EventBus } from "../core/event-bus";
import { assertValidToolManifest, validateToolManifest } from "../manifest/tool-manifest";
import { ToolPackageGenerator } from "../generator/tool-package-generator";

export class ToolService {
  constructor(private readonly store: DataStore, private readonly events: EventBus) {}

  overview(actor: RequestActor): ToolOverview {
    const state = this.store.getState();
    const tenantId = actor.tenantId;
    return clone({
      counts: {
        tools: state.tools.filter((item) => item.tenantId === tenantId && item.status !== "archived").length,
        activeTools: state.tools.filter((item) => item.tenantId === tenantId && item.status === "active").length,
        executions: state.executions.filter((item) => item.tenantId === tenantId).length,
        failedExecutions: state.executions.filter((item) => item.tenantId === tenantId && item.status === "failed").length,
        pendingApprovals: state.approvals.filter((item) => item.tenantId === tenantId && item.status === "pending").length,
        policies: state.policies.filter((item) => item.tenantId === tenantId).length,
        credentials: state.credentials.filter((item) => item.tenantId === tenantId && item.status !== "revoked").length,
        installations: state.installations.filter((item) => item.tenantId === tenantId && item.status === "installed").length
      },
      recentTools: state.tools.filter((item) => item.tenantId === tenantId && item.status !== "archived").slice(0, 10),
      recentExecutions: state.executions.filter((item) => item.tenantId === tenantId).slice(0, 10),
      pendingApprovals: state.approvals.filter((item) => item.tenantId === tenantId && item.status === "pending").slice(0, 10),
      recentEvents: state.events.filter((item) => item.tenantId === tenantId).slice(0, 10)
    });
  }

  validateManifest(input: unknown) {
    return validateToolManifest(input);
  }

  installManifest(actor: RequestActor, input: unknown): ToolInstallation {
    const manifest = assertValidToolManifest(input);
    const state = this.store.getState();
    if (state.installations.some((item) => item.tenantId === actor.tenantId && item.manifestId === manifest.id && item.status === "installed")) {
      conflict("Tool package is already installed");
    }
    const tool = this.createTool(actor, manifestToToolDefinition(manifest));
    const now = nowIso();
    const installation: ToolInstallation = {
      id: newId("install"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      manifestId: manifest.id,
      packageName: manifest.packageName,
      version: manifest.version,
      status: "installed",
      installedBy: actor.userId,
      source: "manifest",
      manifest
    };
    state.installations.unshift(installation);
    this.store.save();
    this.store.audit(actor, "tool.installation.create", "tool_installation", installation.id, undefined, installation);
    this.events.publish(actor, "tool.installed", { manifestId: manifest.id, packageName: manifest.packageName, toolKey: tool.key });
    return clone(installation);
  }

  discoverTools(actor: RequestActor): ToolInstallation[] {
    return clone(this.store.getState().installations.filter((item) => item.tenantId === actor.tenantId && item.status === "installed"));
  }

  usageAnalytics(actor: RequestActor) {
    const metrics = this.store.getState().usageMetrics.filter((item) => item.tenantId === actor.tenantId);
    const byTool: Record<string, { calls: number; failures: number; cost: number }> = {};
    for (const metric of metrics) {
      byTool[metric.toolKey] ??= { calls: 0, failures: 0, cost: 0 };
      byTool[metric.toolKey].calls += 1;
      byTool[metric.toolKey].cost += metric.cost;
      if (metric.status === "failed" || metric.status === "blocked") byTool[metric.toolKey].failures += 1;
    }
    return clone({
      totalCalls: metrics.length,
      totalCost: Number(metrics.reduce((sum, metric) => sum + metric.cost, 0).toFixed(4)),
      byTool
    });
  }

  generateToolPackage(_actor: RequestActor, manifestInput: unknown, outputDir: string) {
    return new ToolPackageGenerator().generate(manifestInput, outputDir);
  }

  listTools(actor: RequestActor, query?: URLSearchParams): ToolDefinition[] {
    const category = query ? pickQuery(query, "category") : undefined;
    const search = query ? pickQuery(query, "search") : undefined;
    const limit = query ? parseNumberQuery(query, "limit", 100) : 100;
    return clone(this.store.getState().tools.filter((tool) => {
      if (tool.tenantId !== actor.tenantId || tool.status === "archived") return false;
      if (category && tool.category !== category) return false;
      if (search) {
        const haystack = [tool.key, tool.name, tool.description, tool.kind, tool.category, tool.tags.join(" ")].join(" ").toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    }).slice(0, limit));
  }

  createTool(actor: RequestActor, input: Partial<ToolDefinition>): ToolDefinition {
    const state = this.store.getState();
    const key = normalizeToolKey(input.key ?? input.name);
    if (state.tools.some((item) => item.tenantId === actor.tenantId && item.key === key && item.status !== "archived")) conflict("Tool key already exists");
    const now = nowIso();
    const tool: ToolDefinition = {
      id: newId("tool"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key,
      name: ensureString(input.name, "name"),
      description: optionalString(input.description),
      kind: ensureKind(input.kind ?? "generator"),
      category: ensureString(input.category ?? "general", "category"),
      status: ensureToolStatus(input.status ?? "active"),
      riskLevel: ensureRisk(input.riskLevel ?? "low"),
      inputSchema: ensureObject(input.inputSchema, "inputSchema"),
      outputSchema: ensureObject(input.outputSchema, "outputSchema"),
      requiredPermissions: normalizeStringArray(input.requiredPermissions, "requiredPermissions"),
      requiresApproval: ensureBoolean(input.requiresApproval, "requiresApproval", false),
      rateLimitPerMinute: Math.max(1, ensureNumber(input.rateLimitPerMinute, "rateLimitPerMinute", 60)),
      timeoutMs: Math.max(100, ensureNumber(input.timeoutMs, "timeoutMs", 5000)),
      ownerTeam: ensureString(input.ownerTeam ?? "Tool Platform", "ownerTeam"),
      tags: normalizeStringArray(input.tags, "tags"),
      metadata: ensureObject(input.metadata, "metadata"),
      updatedBy: actor.userId
    };
    state.tools.unshift(tool);
    this.store.save();
    this.store.audit(actor, "tool.definition.create", "tool", tool.id, undefined, tool);
    this.events.publish(actor, "tool.definition.created", { toolKey: tool.key });
    return clone(tool);
  }

  updateTool(actor: RequestActor, key: string, input: Partial<ToolDefinition>): ToolDefinition {
    const tool = this.findTool(actor, key);
    const before = clone(tool);
    if (input.name !== undefined) tool.name = ensureString(input.name, "name");
    if (input.description !== undefined) tool.description = optionalString(input.description);
    if (input.kind !== undefined) tool.kind = ensureKind(input.kind);
    if (input.category !== undefined) tool.category = ensureString(input.category, "category");
    if (input.status !== undefined) tool.status = ensureToolStatus(input.status);
    if (input.riskLevel !== undefined) tool.riskLevel = ensureRisk(input.riskLevel);
    if (input.inputSchema !== undefined) tool.inputSchema = ensureObject(input.inputSchema, "inputSchema");
    if (input.outputSchema !== undefined) tool.outputSchema = ensureObject(input.outputSchema, "outputSchema");
    if (input.requiredPermissions !== undefined) tool.requiredPermissions = normalizeStringArray(input.requiredPermissions, "requiredPermissions");
    if (input.requiresApproval !== undefined) tool.requiresApproval = ensureBoolean(input.requiresApproval, "requiresApproval");
    if (input.rateLimitPerMinute !== undefined) tool.rateLimitPerMinute = Math.max(1, ensureNumber(input.rateLimitPerMinute, "rateLimitPerMinute"));
    if (input.timeoutMs !== undefined) tool.timeoutMs = Math.max(100, ensureNumber(input.timeoutMs, "timeoutMs"));
    if (input.ownerTeam !== undefined) tool.ownerTeam = ensureString(input.ownerTeam, "ownerTeam");
    if (input.tags !== undefined) tool.tags = normalizeStringArray(input.tags, "tags");
    if (input.metadata !== undefined) tool.metadata = ensureObject(input.metadata, "metadata");
    tool.updatedAt = nowIso();
    tool.updatedBy = actor.userId;
    this.store.save();
    this.store.audit(actor, "tool.definition.update", "tool", tool.id, before, tool);
    this.events.publish(actor, "tool.definition.updated", { toolKey: tool.key });
    return clone(tool);
  }

  executeTool(actor: RequestActor, key: string, input: Record<string, unknown> = {}): ToolExecution {
    const tool = this.findTool(actor, key);
    if (tool.status !== "active") badRequest("Only active tools can be executed");
    this.checkToolPermissions(actor, tool);
    const now = nowIso();
    const execution: ToolExecution = {
      id: newId("toolexec"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      toolKey: tool.key,
      requestedBy: actor.userId,
      status: "running",
      input: ensureObject(input, "input"),
      startedAt: now
    };
    this.store.getState().executions.unshift(execution);
    if (tool.requiresApproval || tool.riskLevel === "critical") {
      const approval = this.requestApproval(actor, tool, execution, `${tool.key} requires approval`);
      execution.status = "blocked";
      execution.approvalId = approval.id;
      this.store.save();
      this.events.publish(actor, "tool.approval.requested", { toolKey: tool.key, executionId: execution.id, approvalId: approval.id });
      this.recordUsage(actor, execution, 0.001);
      return clone(execution);
    }

    try {
      execution.output = this.simulateTool(tool, execution.input);
      execution.status = "succeeded";
      execution.completedAt = nowIso();
      execution.durationMs = new Date(execution.completedAt).getTime() - new Date(execution.startedAt ?? execution.createdAt).getTime();
      this.store.audit(actor, "tool.execution.run", "tool_execution", execution.id, undefined, execution);
      this.events.publish(actor, "tool.execution.completed", { toolKey: tool.key, executionId: execution.id });
    } catch (error) {
      execution.status = "failed";
      execution.error = error instanceof Error ? error.message : "Tool execution failed";
      execution.completedAt = nowIso();
      this.events.publish(actor, "tool.execution.failed", { toolKey: tool.key, executionId: execution.id, error: execution.error });
    }
    execution.updatedAt = nowIso();
    this.recordUsage(actor, execution, 0.002);
    this.store.save();
    return clone(execution);
  }

  approve(actor: RequestActor, id: string, note?: string): ToolApproval {
    return this.decideApproval(actor, id, "approved", note);
  }

  reject(actor: RequestActor, id: string, note?: string): ToolApproval {
    return this.decideApproval(actor, id, "rejected", note);
  }

  listExecutions(actor: RequestActor): ToolExecution[] {
    return clone(this.store.getState().executions.filter((item) => item.tenantId === actor.tenantId));
  }

  listApprovals(actor: RequestActor): ToolApproval[] {
    return clone(this.store.getState().approvals.filter((item) => item.tenantId === actor.tenantId));
  }

  createPolicy(actor: RequestActor, input: Partial<ToolPolicy>): ToolPolicy {
    const tool = this.findTool(actor, ensureString(input.toolKey, "toolKey"));
    const now = nowIso();
    const policy: ToolPolicy = {
      id: newId("toolpol"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      toolKey: tool.key,
      allowedRoles: normalizeStringArray(input.allowedRoles, "allowedRoles") as Role[],
      blockedTenants: normalizeStringArray(input.blockedTenants, "blockedTenants"),
      maxCallsPerRun: Math.max(1, ensureNumber(input.maxCallsPerRun, "maxCallsPerRun", 20)),
      maxPayloadBytes: Math.max(100, ensureNumber(input.maxPayloadBytes, "maxPayloadBytes", 100000)),
      requiresApprovalFor: normalizeStringArray(input.requiresApprovalFor, "requiresApprovalFor")
    };
    this.store.getState().policies.unshift(policy);
    this.store.save();
    this.store.audit(actor, "tool.policy.create", "tool_policy", policy.id, undefined, policy);
    return clone(policy);
  }

  listPolicies(actor: RequestActor): ToolPolicy[] {
    return clone(this.store.getState().policies.filter((item) => item.tenantId === actor.tenantId));
  }

  createCredential(actor: RequestActor, input: Partial<ToolCredential> & { value?: string }): ToolCredential {
    const tool = this.findTool(actor, ensureString(input.toolKey, "toolKey"));
    const now = nowIso();
    const credential: ToolCredential = {
      id: newId("cred"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key: normalizeToolKey(input.key ?? input.label),
      toolKey: tool.key,
      label: ensureString(input.label, "label"),
      status: "active",
      maskedValue: maskSecret(ensureString(input.value ?? "demo-secret", "value")),
      updatedBy: actor.userId
    };
    this.store.getState().credentials.unshift(credential);
    this.store.save();
    this.store.audit(actor, "tool.credential.create", "tool_credential", credential.id, undefined, { ...credential, maskedValue: "***" });
    return clone(credential);
  }

  listCredentials(actor: RequestActor): ToolCredential[] {
    return clone(this.store.getState().credentials.filter((item) => item.tenantId === actor.tenantId && item.status !== "revoked"));
  }

  listEvents(actor: RequestActor) {
    return clone(this.store.getState().events.filter((item) => item.tenantId === actor.tenantId));
  }

  auditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((item) => item.tenantId === actor.tenantId));
  }

  private findTool(actor: RequestActor, key: string): ToolDefinition {
    const tool = this.store.getState().tools.find((item) => item.tenantId === actor.tenantId && item.status !== "archived" && (item.key === key || item.id === key));
    if (!tool) notFound("Tool not found");
    return tool;
  }

  private checkToolPermissions(actor: RequestActor, tool: ToolDefinition): void {
    if (!hasPermission(actor.role, "tool.executions.run")) forbidden("Role cannot execute tools");
    for (const permission of tool.requiredPermissions) {
      if (!hasPermission(actor.role, permission)) forbidden(`Role lacks required permission ${permission}`);
    }
  }

  private requestApproval(actor: RequestActor, tool: ToolDefinition, execution: ToolExecution, reason: string): ToolApproval {
    const now = nowIso();
    const approval: ToolApproval = {
      id: newId("approval"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      toolKey: tool.key,
      executionId: execution.id,
      action: tool.key,
      reason,
      status: "pending",
      requestedBy: actor.userId
    };
    this.store.getState().approvals.unshift(approval);
    return approval;
  }

  private decideApproval(actor: RequestActor, id: string, status: "approved" | "rejected", note?: string): ToolApproval {
    const approval = this.store.getState().approvals.find((item) => item.tenantId === actor.tenantId && item.id === id);
    if (!approval) notFound("Approval not found");
    approval.status = status;
    approval.updatedAt = nowIso();
    approval.decidedAt = approval.updatedAt;
    approval.decidedBy = actor.userId;
    approval.note = optionalString(note);
    this.store.save();
    this.events.publish(actor, status === "approved" ? "tool.approval.approved" : "tool.approval.rejected", { approvalId: approval.id, toolKey: approval.toolKey });
    return clone(approval);
  }

  private simulateTool(tool: ToolDefinition, input: Record<string, unknown>): Record<string, unknown> {
    if (tool.key === "tool.qr.generate") {
      return { fileUrl: `tool://qr/${newId("qr")}.png`, format: input.format ?? "png", text: input.text ?? "" };
    }
    if (tool.key === "tool.pdf.generate") {
      return { fileUrl: `tool://pdf/${newId("pdf")}.pdf`, template: input.template ?? "default", pages: 1 };
    }
    if (tool.key === "tool.domain.check") {
      const domain = ensureString(input.domain, "domain").toLowerCase();
      return { domain, available: !domain.includes("taken"), suggestions: [`get${domain}`, `${domain.replace(".", "")}.app`] };
    }
    if (tool.key === "tool.brand.check") {
      const text = ensureString(input.text, "text");
      const banned = ["guaranteed", "risk-free"].filter((word) => text.toLowerCase().includes(word));
      return { compliant: banned.length === 0, bannedClaims: banned, score: banned.length ? 62 : 96 };
    }
    return { ok: true, tool: tool.key, input };
  }

  private recordUsage(actor: RequestActor, execution: ToolExecution, cost: number): ToolUsageMetric {
    const now = nowIso();
    const metric: ToolUsageMetric = {
      id: newId("metric"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      toolKey: execution.toolKey,
      executionId: execution.id,
      actorId: actor.userId,
      status: execution.status,
      durationMs: execution.durationMs,
      cost,
      metadata: {}
    };
    this.store.getState().usageMetrics.unshift(metric);
    return metric;
  }
}

function manifestToToolDefinition(manifest: ToolManifest): Partial<ToolDefinition> {
  return {
    key: manifest.id,
    name: manifest.name,
    description: `${manifest.name} installed from ${manifest.packageName}.`,
    kind: manifest.type === "api" || manifest.type === "worker" ? "connector" : "generator",
    category: manifest.category,
    status: "active",
    riskLevel: manifest.safety.riskLevel,
    inputSchema: manifest.inputSchema,
    outputSchema: manifest.outputSchema,
    requiredPermissions: manifest.permissions,
    requiresApproval: manifest.safety.requiresApproval,
    ownerTeam: "Tool Platform",
    tags: [manifest.category, manifest.type],
    metadata: {
      manifestId: manifest.id,
      packageName: manifest.packageName,
      apiRoute: manifest.api.route,
      sdkNamespace: manifest.sdk.namespace,
      cliNamespace: manifest.cli.namespace,
      aiSupport: manifest.aiSupport,
      usedBy: manifest.usedBy
    }
  };
}

function normalizeToolKey(value: unknown): string {
  return ensureString(value, "key").toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/-+/g, "-");
}

function ensureKind(value: unknown): ToolKind {
  const kind = String(value) as ToolKind;
  if (!["generator", "validator", "checker", "converter", "enrichment", "connector"].includes(kind)) badRequest("Invalid tool kind");
  return kind;
}

function ensureToolStatus(value: unknown): ToolStatus {
  const status = String(value) as ToolStatus;
  if (!["draft", "active", "disabled", "archived"].includes(status)) badRequest("Invalid tool status");
  return status;
}

function ensureRisk(value: unknown): ToolRiskLevel {
  const risk = String(value) as ToolRiskLevel;
  if (!["low", "medium", "high", "critical"].includes(risk)) badRequest("Invalid risk level");
  return risk;
}

function maskSecret(value: string): string {
  if (value.length <= 4) return "****";
  return `${value.slice(0, 2)}${"*".repeat(Math.max(4, value.length - 4))}${value.slice(-2)}`;
}
