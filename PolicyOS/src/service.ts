import { DataStore } from "./core/datastore";
import {
  AccessDecision,
  AcknowledgmentStatus,
  ApprovalRule,
  Decision,
  DecisionEffect,
  EnforcementLog,
  ExceptionStatus,
  Guardrail,
  Policy,
  PolicyAcknowledgment,
  PolicyEvent,
  PolicyException,
  PolicyOverview,
  PolicyRule,
  PolicyReview,
  PolicyVersion,
  RateLimit,
  RequestActor,
  ReviewStatus,
  ViolationSeverity,
  ViolationStatus
} from "./domain";
import { badRequest, conflict, notFound } from "./core/errors";
import { newId, nowIso, plusDays } from "./core/id";
import { clone, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, isExpired, matchPattern, optionalObject, pickQuery, uniq } from "./core/utils";

export class PolicyService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "PolicyOS service is ready";
  }

  overview(actor: RequestActor): PolicyOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;

    const policies = state.policies.filter((p) => p.tenantId === tenant);
    const rules = state.rules.filter((r) => r.tenantId === tenant);
    const guardrails = state.guardrails.filter((g) => g.tenantId === tenant);
    const rateLimits = state.rateLimits.filter((rl) => rl.tenantId === tenant);
    const exceptions = state.exceptions.filter((e) => e.tenantId === tenant);
    const violations = state.violations.filter((v) => v.tenantId === tenant);
    const acknowledgments = state.acknowledgments.filter((a) => a.tenantId === tenant);
    const reviews = state.reviews.filter((r) => r.tenantId === tenant);
    const decisions = state.decisions.filter((d) => d.tenantId === tenant);

    return {
      policies: {
        total: policies.length,
        active: policies.filter((p) => p.status === "published").length,
        draft: policies.filter((p) => p.status === "draft").length,
        inReview: policies.filter((p) => p.status === "in_review").length,
        published: policies.filter((p) => p.status === "published").length,
        deprecated: policies.filter((p) => p.status === "deprecated").length
      },
      rules: {
        total: rules.length,
        active: rules.filter((r) => r.status === "active").length
      },
      guardrails: {
        total: guardrails.length,
        active: guardrails.filter((g) => g.status === "active").length
      },
      rateLimits: {
        total: rateLimits.length,
        active: rateLimits.filter((rl) => rl.status === "active").length
      },
      exceptions: {
        total: exceptions.length,
        pending: exceptions.filter((e) => e.status === "requested" || e.status === "under_review").length,
        approved: exceptions.filter((e) => e.status === "approved").length,
        rejected: exceptions.filter((e) => e.status === "rejected").length
      },
      violations: {
        total: violations.length,
        open: violations.filter((v) => v.status === "open").length,
        resolved: violations.filter((v) => v.status === "resolved").length,
        bySeverity: this.countBySeverity(violations)
      },
      acknowledgments: {
        total: acknowledgments.length,
        pending: acknowledgments.filter((a) => a.status === "pending").length,
        acknowledged: acknowledgments.filter((a) => a.status === "acknowledged").length,
        overdue: acknowledgments.filter((a) => a.status === "overdue").length
      },
      reviews: {
        total: reviews.length,
        overdue: reviews.filter((r) => r.status === "overdue").length,
        scheduled: reviews.filter((r) => r.status === "scheduled").length
      },
      decisions: {
        total: decisions.length,
        allowed: decisions.filter((d) => d.effect === "allow").length,
        denied: decisions.filter((d) => d.effect === "deny").length
      }
    };
  }

  private countBySeverity(violations: PolicyViolation[]): Record<ViolationSeverity, number> {
    const counts: Record<ViolationSeverity, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const v of violations) {
      counts[v.severity] = (counts[v.severity] ?? 0) + 1;
    }
    return counts;
  }

  listPolicies(actor: RequestActor, query?: URLSearchParams): Policy[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const category = pickQuery(query, "category");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().policies.filter((p) => {
      if (p.tenantId !== actor.tenantId) return false;
      if (search && !`${p.key} ${p.name} ${p.description ?? ""}`.toLowerCase().includes(search)) return false;
      if (category && p.category !== category) return false;
      if (status && p.status !== status) return false;
      return true;
    }));
  }

  getPolicy(id: string, actor: RequestActor): Policy {
    const policy = this.store.getState().policies.find((p) => p.id === id && p.tenantId === actor.tenantId);
    if (!policy) notFound("Policy not found");
    return clone(policy);
  }

  createPolicy(input: unknown, actor: RequestActor): Policy {
    const body = ensureObject(input, "policy");
    const state = this.store.getState();
    const key = ensureString(body.key, "policy.key");
    if (state.policies.some((p) => p.tenantId === actor.tenantId && p.key === key)) conflict(`Policy key '${key}' already exists`);

    const rules = ensureArray<PolicyRule>(body.rules, "policy.rules", []).map((rule: any) => ({
      id: newId("rule"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: ensureString(rule.key, "rule.key"),
      name: ensureString(rule.name, "rule.name"),
      description: rule.description ? String(rule.description) : undefined,
      effect: String(rule.effect ?? "allow") as DecisionEffect,
      subjectRoles: ensureArray<string>(rule.subjectRoles, "rule.subjectRoles"),
      actions: ensureArray<string>(rule.actions, "rule.actions"),
      resources: ensureArray<string>(rule.resources, "rule.resources"),
      conditions: optionalObject(rule.conditions),
      priority: ensureNumber(rule.priority, "rule.priority", 0),
      status: String(rule.status ?? "draft") as any,
      createdBy: actor.userId
    }));

    const policyVersion: PolicyVersion = {
      id: newId("pv"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      policyId: "",
      version: 1,
      template: ensureString(body.template, "policy.template", ""),
      rules,
      createdBy: actor.userId,
      status: "draft"
    };

    const policy: Policy = {
      id: newId("policy"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "policy.name"),
      description: body.description ? String(body.description) : undefined,
      category: ensureString(body.category, "policy.category"),
      tags: ensureArray<string>(body.tags, "policy.tags"),
      status: "draft",
      ownerId: ensureString(body.ownerId, "policy.ownerId"),
      ownerName: body.ownerName ? String(body.ownerName) : undefined,
      reviewCycle: String(body.reviewCycle ?? "quarterly") as any,
      nextReviewDate: body.nextReviewDate ? String(body.nextReviewDate) : undefined,
      activeVersion: 1,
      versions: [policyVersion],
      metadata: optionalObject(body.metadata),
      createdBy: actor.userId
    };

    policyVersion.policyId = policy.id;
    state.policies.push(policy);
    state.rules.push(...rules);

    this.store.save();
    this.store.audit(actor, "policy.create", "policy", policy.id, undefined, policy);
    return clone(policy);
  }

  updatePolicy(id: string, input: unknown, actor: RequestActor): Policy {
    const body = ensureObject(input, "policy");
    const state = this.store.getState();
    const policy = state.policies.find((p) => p.id === id && p.tenantId === actor.tenantId);
    if (!policy) notFound("Policy not found");

    const before = clone(policy);

    if (body.name) policy.name = String(body.name);
    if (body.description) policy.description = String(body.description);
    if (body.category) policy.category = String(body.category);
    if (body.tags) policy.tags = ensureArray<string>(body.tags, "policy.tags");
    if (body.ownerId) policy.ownerId = String(body.ownerId);
    if (body.ownerName) policy.ownerName = String(body.ownerName);
    if (body.reviewCycle) policy.reviewCycle = String(body.reviewCycle) as any;
    if (body.metadata) policy.metadata = { ...policy.metadata, ...optionalObject(body.metadata) };
    policy.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "policy.update", "policy", policy.id, before, policy);
    return clone(policy);
  }

  publishPolicy(id: string, actor: RequestActor): Policy {
    const state = this.store.getState();
    const policy = state.policies.find((p) => p.id === id && p.tenantId === actor.tenantId);
    if (!policy) notFound("Policy not found");

    const before = clone(policy);
    policy.status = "published";
    policy.publishedAt = nowIso();
    policy.updatedAt = nowIso();

    const activeVersion = policy.versions.find((v) => v.version === policy.activeVersion);
    if (activeVersion) {
      activeVersion.status = "published";
      activeVersion.updatedAt = nowIso();
    }

    this.store.save();
    this.store.audit(actor, "policy.publish", "policy", policy.id, before, policy);
    this.emitEvent(actor, "policy.published", { policyId: policy.id, policyKey: policy.key });
    return clone(policy);
  }

  addPolicyVersion(id: string, input: unknown, actor: RequestActor): PolicyVersion {
    const body = ensureObject(input, "version");
    const state = this.store.getState();
    const policy = state.policies.find((p) => p.id === id && p.tenantId === actor.tenantId);
    if (!policy) notFound("Policy not found");

    const version = Math.max(...policy.versions.map((v) => v.version)) + 1;

    const rules = ensureArray<any>(body.rules, "version.rules", []).map((rule: any) => ({
      id: newId("rule"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: ensureString(rule.key, "rule.key"),
      name: ensureString(rule.name, "rule.name"),
      description: rule.description ? String(rule.description) : undefined,
      effect: String(rule.effect ?? "allow") as DecisionEffect,
      subjectRoles: ensureArray<string>(rule.subjectRoles, "rule.subjectRoles"),
      actions: ensureArray<string>(rule.actions, "rule.actions"),
      resources: ensureArray<string>(rule.resources, "rule.resources"),
      conditions: optionalObject(rule.conditions),
      priority: ensureNumber(rule.priority, "rule.priority", 0),
      status: String(rule.status ?? "draft") as any,
      createdBy: actor.userId
    }));

    const policyVersion: PolicyVersion = {
      id: newId("pv"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      policyId: policy.id,
      version,
      template: ensureString(body.template, "version.template", ""),
      rules,
      createdBy: actor.userId,
      approvedBy: body.approvedBy ? String(body.approvedBy) : undefined,
      approvedAt: body.approvedAt ? String(body.approvedAt) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      status: "draft"
    };

    policy.versions.push(policyVersion);
    state.rules.push(...rules);

    if (ensureBoolean(body.makeActive, false)) {
      policy.activeVersion = version;
    }

    policy.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "policy.version.add", "policy", policy.id, undefined, { version: policyVersion.version });
    return clone(policyVersion);
  }

  listRules(actor: RequestActor, query?: URLSearchParams): PolicyRule[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    return clone(this.store.getState().rules.filter((r) => {
      if (r.tenantId !== actor.tenantId) return false;
      if (search && !`${r.key} ${r.name} ${r.description ?? ""}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  getRule(id: string, actor: RequestActor): PolicyRule {
    const rule = this.store.getState().rules.find((r) => r.id === id && r.tenantId === actor.tenantId);
    if (!rule) notFound("Rule not found");
    return clone(rule);
  }

  createRule(input: unknown, actor: RequestActor): PolicyRule {
    const body = ensureObject(input, "rule");
    const state = this.store.getState();
    const key = ensureString(body.key, "rule.key");
    if (state.rules.some((r) => r.tenantId === actor.tenantId && r.key === key)) conflict(`Rule key '${key}' already exists`);

    const rule: PolicyRule = {
      id: newId("rule"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "rule.name"),
      description: body.description ? String(body.description) : undefined,
      effect: String(body.effect ?? "allow") as DecisionEffect,
      subjectRoles: ensureArray<string>(body.subjectRoles, "rule.subjectRoles"),
      actions: ensureArray<string>(body.actions, "rule.actions"),
      resources: ensureArray<string>(body.resources, "rule.resources"),
      conditions: optionalObject(body.conditions),
      priority: ensureNumber(body.priority, "rule.priority", 0),
      status: String(body.status ?? "active") as any,
      createdBy: actor.userId
    };

    state.rules.push(rule);
    this.store.save();
    this.store.audit(actor, "rule.create", "rule", rule.id, undefined, rule);
    return clone(rule);
  }

  evaluateAccess(input: unknown, actor: RequestActor): AccessDecision {
    const body = ensureObject(input, "accessDecision");
    const state = this.store.getState();

    const subjectId = ensureString(body.subjectId, "accessDecision.subjectId");
    const subjectType = String(body.subjectType ?? "user") as any;
    const action = ensureString(body.action, "accessDecision.action");
    const resource = ensureString(body.resource, "accessDecision.resource");

    const rules = state.rules.filter((r) => r.tenantId === actor.tenantId && r.status === "active");
    const matchedRules = rules.filter((r) => this.matchesRule(r, action, resource));

    const denies = matchedRules.filter((r) => r.effect === "deny").sort((a, b) => b.priority - a.priority);
    if (denies.length > 0) {
      const decision = this.createDecision(actor, denies[0], subjectId, subjectType, action, resource, denies.map((r) => r.id));
      return {
        allowed: false,
        subjectId,
        subjectType,
        action,
        resource,
        permissions: [],
        roles: [],
        matchedPolicyIds: [],
        matchedRuleIds: denies.map((r) => r.id),
        reasons: denies.map((r) => `rule.deny:${r.name}`),
        evaluatedAt: nowIso(),
        decisionId: decision.id
      };
    }

    const allows = matchedRules.filter((r) => r.effect === "allow");
    if (allows.length > 0) {
      const decision = this.createDecision(actor, allows[0], subjectId, subjectType, action, resource, allows.map((r) => r.id));
      return {
        allowed: true,
        subjectId,
        subjectType,
        action,
        resource,
        permissions: [],
        roles: [],
        matchedPolicyIds: [],
        matchedRuleIds: allows.map((r) => r.id),
        reasons: allows.map((r) => `rule.allow:${r.name}`),
        evaluatedAt: nowIso(),
        decisionId: decision.id
      };
    }

    const decision = this.createDecision(actor, undefined, subjectId, subjectType, action, resource, []);
    return {
      allowed: true,
      subjectId,
      subjectType,
      action,
      resource,
      permissions: [],
      roles: [],
      matchedPolicyIds: [],
      matchedRuleIds: [],
      reasons: ["no_matching_rule"],
      evaluatedAt: nowIso(),
      decisionId: decision.id
    };
  }

  private matchesRule(rule: PolicyRule, action: string, resource: string): boolean {
    const actionMatch = rule.actions.length === 0 || rule.actions.some((p) => matchPattern(p, action));
    const resourceMatch = rule.resources.length === 0 || rule.resources.some((p) => matchPattern(p, resource));
    return actionMatch && resourceMatch;
  }

  private createDecision(actor: RequestActor, rule: PolicyRule | undefined, subjectId: string, subjectType: string, action: string, resource: string, matchedRuleIds: UUID[]): Decision {
    const state = this.store.getState();
    const decision: Decision = {
      id: newId("decision"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      policyId: rule ? undefined : undefined,
      ruleId: rule ? rule.id : undefined,
      subjectId,
      subjectType,
      action,
      resource,
      effect: rule ? rule.effect : "allow",
      reasons: rule ? [`rule.${rule.effect}:${rule.name}`] : ["default_allow"],
      matchedPolicyIds: [],
      matchedRuleIds,
      evaluatedBy: actor.userId
    };
    state.decisions.unshift(decision);
    this.store.save();
    return decision;
  }

  listGuardrails(actor: RequestActor): Guardrail[] {
    return clone(this.store.getState().guardrails.filter((g) => g.tenantId === actor.tenantId));
  }

  createGuardrail(input: unknown, actor: RequestActor): Guardrail {
    const body = ensureObject(input, "guardrail");
    const state = this.store.getState();
    const key = ensureString(body.key, "guardrail.key");
    if (state.guardrails.some((g) => g.tenantId === actor.tenantId && g.key === key)) conflict(`Guardrail key '${key}' already exists`);

    const guardrail: Guardrail = {
      id: newId("guardrail"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "guardrail.name"),
      description: body.description ? String(body.description) : undefined,
      effect: String(body.effect ?? "deny") as DecisionEffect,
      conditions: optionalObject(body.conditions),
      priority: ensureNumber(body.priority, "guardrail.priority", 0),
      status: String(body.status ?? "active") as any,
      createdBy: actor.userId
    };

    state.guardrails.push(guardrail);
    this.store.save();
    this.store.audit(actor, "guardrail.create", "guardrail", guardrail.id, undefined, guardrail);
    return clone(guardrail);
  }

  evaluateGuardrail(input: unknown, actor: RequestActor): { allowed: boolean; violations: string[] } {
    const body = ensureObject(input, "guardrailEvaluation");
    const state = this.store.getState();
    const text = ensureString(body.text, "guardrailEvaluation.text");

    const guardrails = state.guardrails.filter((g) => g.tenantId === actor.tenantId && g.status === "active");
    const violations: string[] = [];

    for (const guardrail of guardrails) {
      if (this.evaluateGuardrailConditions(guardrail, text)) {
        if (guardrail.effect === "deny") {
          violations.push(`Guardrail '${guardrail.name}' blocked: ${guardrail.description}`);
        }
      }
    }

    return {
      allowed: violations.length === 0,
      violations
    };
  }

  private evaluateGuardrailConditions(guardrail: Guardrail, text: string): boolean {
    const conditions = guardrail.conditions as any;

    if (conditions.bannedTerms && Array.isArray(conditions.bannedTerms)) {
      const lowerText = text.toLowerCase();
      for (const term of conditions.bannedTerms) {
        if (lowerText.includes(term.toLowerCase())) {
          return true;
        }
      }
    }

    return false;
  }

  listRateLimits(actor: RequestActor): RateLimit[] {
    return clone(this.store.getState().rateLimits.filter((rl) => rl.tenantId === actor.tenantId));
  }

  createRateLimit(input: unknown, actor: RequestActor): RateLimit {
    const body = ensureObject(input, "rateLimit");
    const state = this.store.getState();
    const key = ensureString(body.key, "rateLimit.key");
    if (state.rateLimits.some((rl) => rl.tenantId === actor.tenantId && rl.key === key)) conflict(`Rate limit key '${key}' already exists`);

    const rateLimit: RateLimit = {
      id: newId("ratelimit"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "rateLimit.name"),
      description: body.description ? String(body.description) : undefined,
      resource: ensureString(body.resource, "rateLimit.resource"),
      limit: ensureNumber(body.limit, "rateLimit.limit"),
      windowSeconds: ensureNumber(body.windowSeconds, "rateLimit.windowSeconds"),
      status: String(body.status ?? "active") as any,
      createdBy: actor.userId
    };

    state.rateLimits.push(rateLimit);
    this.store.save();
    this.store.audit(actor, "ratelimit.create", "rateLimit", rateLimit.id, undefined, rateLimit);
    return clone(rateLimit);
  }

  listApprovalRules(actor: RequestActor): ApprovalRule[] {
    return clone(this.store.getState().approvalRules.filter((ar) => ar.tenantId === actor.tenantId));
  }

  createApprovalRule(input: unknown, actor: RequestActor): ApprovalRule {
    const body = ensureObject(input, "approvalRule");
    const state = this.store.getState();
    const key = ensureString(body.key, "approvalRule.key");
    if (state.approvalRules.some((ar) => ar.tenantId === actor.tenantId && ar.key === key)) conflict(`Approval rule key '${key}' already exists`);

    const approvalRule: ApprovalRule = {
      id: newId("approval"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "approvalRule.name"),
      description: body.description ? String(body.description) : undefined,
      policyId: body.policyId ? String(body.policyId) : undefined,
      ruleId: body.ruleId ? String(body.ruleId) : undefined,
      requiredApprovers: ensureArray(body.requiredApprovers, "approvalRule.requiredApprovers"),
      minApprovers: ensureNumber(body.minApprovers, "approvalRule.minApprovers", 1),
      autoExpireHours: body.autoExpireHours ? ensureNumber(body.autoExpireHours, "approvalRule.autoExpireHours") : undefined,
      status: String(body.status ?? "active") as any,
      createdBy: actor.userId
    };

    state.approvalRules.push(approvalRule);
    this.store.save();
    this.store.audit(actor, "approvalrule.create", "approvalRule", approvalRule.id, undefined, approvalRule);
    return clone(approvalRule);
  }

  listExceptions(actor: RequestActor, query?: URLSearchParams): PolicyException[] {
    const status = pickQuery(query, "status");
    return clone(this.store.getState().exceptions.filter((e) => {
      if (e.tenantId !== actor.tenantId) return false;
      if (status && e.status !== status) return false;
      return true;
    }));
  }

  createException(input: unknown, actor: RequestActor): PolicyException {
    const body = ensureObject(input, "exception");
    const state = this.store.getState();

    const exception: PolicyException = {
      id: newId("exception"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      policyId: ensureString(body.policyId, "exception.policyId"),
      ruleId: body.ruleId ? String(body.ruleId) : undefined,
      requestedBy: actor.userId,
      requestedByName: actor.userId,
      reason: ensureString(body.reason, "exception.reason"),
      justification: ensureString(body.justification, "exception.justification"),
      riskLevel: String(body.riskLevel ?? "medium") as any,
      evidenceIds: ensureArray<string>(body.evidenceIds, "exception.evidenceIds", []),
      expiresAt: body.expiresAt ? String(body.expiresAt) : undefined,
      status: "requested"
    };

    state.exceptions.push(exception);
    this.store.save();
    this.store.audit(actor, "exception.create", "exception", exception.id, undefined, exception);
    this.emitEvent(actor, "policy.exception.requested", { exceptionId: exception.id, policyId: exception.policyId });
    return clone(exception);
  }

  updateException(id: string, input: unknown, actor: RequestActor): PolicyException {
    const body = ensureObject(input, "exception");
    const state = this.store.getState();
    const exception = state.exceptions.find((e) => e.id === id && e.tenantId === actor.tenantId);
    if (!exception) notFound("Exception not found");

    const before = clone(exception);

    if (body.status) exception.status = String(body.status) as ExceptionStatus;
    if (body.approvedBy) {
      exception.approvedBy = String(body.approvedBy);
      exception.approvedByName = String(body.approvedBy);
      exception.approvedAt = nowIso();
    }
    if (body.notes) exception.notes = String(body.notes);
    exception.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "exception.update", "exception", exception.id, before, exception);
    return clone(exception);
  }

  listViolations(actor: RequestActor, query?: URLSearchParams): PolicyViolation[] {
    const status = pickQuery(query, "status");
    const severity = pickQuery(query, "severity");
    return clone(this.store.violations.filter((v) => {
      if (v.tenantId !== actor.tenantId) return false;
      if (status && v.status !== status) return false;
      if (severity && v.severity !== severity) return false;
      return true;
    }));
  }

  createViolation(input: unknown, actor: RequestActor): PolicyViolation {
    const body = ensureObject(input, "violation");
    const state = this.store.getState();

    const violation: PolicyViolation = {
      id: newId("violation"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: createdAt,
      policyId: ensureString(body.policyId, "violation.policyId"),
      ruleId: body.ruleId ? String(body.ruleId) : undefined,
      exceptionId: body.exceptionId ? String(body.exceptionId) : undefined,
      subjectId: ensureString(body.subjectId, "violation.subjectId"),
      subjectType: String(body.subjectType ?? "user") as any,
      action: ensureString(body.action, "violation.action"),
      resource: ensureString(body.resource, "violation.resource"),
      severity: String(body.severity ?? "medium") as ViolationSeverity,
      status: "open",
      detectedAt: nowIso(),
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      description: body.description ? String(body.description) : undefined,
      remediation: body.remediation ? String(body.remediation) : undefined,
      evidenceIds: ensureArray<string>(body.evidenceIds, "violation.evidenceIds", [])
    };

    state.violations.push(violation);
    this.store.save();
    this.store.audit(actor, "violation.create", "violation", violation.id, undefined, violation);
    this.emitEvent(actor, "policy.violated", { violationId: violation.id, policyId: violation.policyId, severity: violation.severity });
    return clone(violation);
  }

  updateViolation(id: string, input: unknown, actor: RequestActor): PolicyViolation {
    const body = ensureObject(input, "violation");
    const state = this.store.getState();
    const violation = state.violations.find((v) => v.id === id && v.tenantId === actor.tenantId);
    if (!violation) notFound("Violation not found");

    const before = clone(violation);

    if (body.status) violation.status = String(body.status) as ViolationStatus;
    if (body.resolvedBy) {
      violation.resolvedBy = String(body.resolvedBy);
      violation.resolvedAt = nowIso();
    }
    if (body.remediation) violation.remediation = String(body.remediation);
    if (body.notes) violation.notes = String(body.notes);
    violation.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "violation.update", "violation", violation.id, before, violation);
    return clone(violation);
  }

  listAcknowledgments(actor: RequestActor, query?: URLSearchParams): PolicyAcknowledgment[] {
    const status = pickQuery(query, "status");
    const policyId = pickQuery(query, "policyId");
    return clone(this.store.getState().acknowledgments.filter((a) => {
      if (a.tenantId !== actor.tenantId) return false;
      if (status && a.status !== status) return false;
      if (policyId && a.policyId !== policyId) return false;
      return true;
    }));
  }

  acknowledgePolicy(id: string, actor: RequestActor): PolicyAcknowledgment {
    const state = this.store.getState();
    const acknowledgment = state.acknowledgments.find((a) => a.id === id && a.tenantId === actor.tenantId);
    if (!acknowledgment) notFound("Acknowledgment not found");

    const before = clone(acknowledgment);
    acknowledgment.status = "acknowledged";
    acknowledgment.acknowledgedAt = nowIso();
    acknowledgment.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "acknowledgment.create", "acknowledgment", acknowledgment.id, before, acknowledgment);
    return clone(acknowledgment);
  }

  listReviews(actor: RequestActor, query?: URLSearchParams): PolicyReview[] {
    const status = pickQuery(query, "status");
    return clone(this.store.getState().reviews.filter((r) => {
      if (r.tenantId !== actor.tenantId) return false;
      if (status && r.status !== status) return false;
      return true;
    }));
  }

  createReview(input: unknown, actor: RequestActor): PolicyReview {
    const body = ensureObject(input, "review");
    const state = this.store.getState();

    const review: PolicyReview = {
      id: newId("review"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      policyId: ensureString(body.policyId, "review.policyId"),
      reviewerId: actor.userId,
      reviewerName: actor.userId,
      status: "scheduled",
      scheduledAt: ensureString(body.scheduledAt, "review.scheduledAt"),
      nextReviewDate: body.nextReviewDate ? String(body.nextReviewDate) : undefined,
      notes: body.notes ? String(body.notes) : undefined
    };

    state.reviews.push(review);
    this.store.save();
    this.store.audit(actor, "review.create", "review", review.id, undefined, review);
    return clone(review);
  }

  updateReview(id: string, input: unknown, actor: RequestActor): PolicyReview {
    const body = ensureObject(input, "review");
    const state = this.store.getState();
    const review = state.reviews.find((r) => r.id === id && r.tenantId === actor.tenantId);
    if (!review) notFound("Review not found");

    const before = clone(review);

    if (body.status) review.status = String(body.status) as ReviewStatus;
    if (body.completedAt) review.completedAt = String(body.completedAt);
    if (body.findings) review.findings = String(body.findings);
    if (body.nextReviewDate) review.nextReviewDate = String(body.nextReviewDate);
    if (body.notes) review.notes = String(body.notes);
    review.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "review.update", "review", review.id, before, review);
    return clone(review);
  }

  listDecisions(actor: RequestActor, query?: URLSearchParams): Decision[] {
    const subjectId = pickQuery(query, "subjectId");
    const effect = pickQuery(query, "effect");
    return clone(this.store.getState().decisions.filter((d) => {
      if (d.tenantId !== actor.tenantId) return false;
      if (subjectId && d.subjectId !== subjectId) return false;
      if (effect && d.effect !== effect) return false;
      return true;
    }));
  }

  listEnforcementLogs(actor: RequestActor, query?: URLSearchParams): EnforcementLog[] {
    const subjectId = pickQuery(query, "subjectId");
    const action = pickQuery(query, "action");
    return clone(this.store.getState().enforcementLogs.filter((el) => {
      if (el.tenantId !== actor.tenantId) return false;
      if (subjectId && el.subjectId !== subjectId) return false;
      if (action && el.action !== action) return false;
      return true;
    }));
  }

  listEvents(actor: RequestActor): PolicyEvent[] {
    return clone(this.store.getState().events.filter((e) => e.tenantId === actor.tenantId));
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((a) => a.tenantId === actor.tenantId));
  }

  private emitEvent(actor: RequestActor, type: string, data: Record<string, unknown>): PolicyEvent {
    const state = this.store.getState();
    const event: PolicyEvent = {
      id: newId("event"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type,
      source: "PolicyOS",
      data,
      actorId: actor.userId
    };
    state.events.unshift(event);
    this.store.save();
    return event;
  }
}
