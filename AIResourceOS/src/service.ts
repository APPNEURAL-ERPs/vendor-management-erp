import {
  AIModel,
  AIResourceOverview,
  AIUsage,
  CostAllocation,
  ModelConfig,
  QuotaLimit,
  RequestActor,
  TokenBudget
} from "./domain";
import { DataStore, EventBus } from "./core/datastore";
import {
  asArray,
  asBoolean,
  asNumber,
  calculateCost,
  clone,
  conflict,
  includesText,
  isExpired,
  newId,
  notFound,
  nowIso,
  optionalString,
  requireString,
  unique
} from "./core/utils";

export class AIResourceService {
  constructor(
    private readonly store: DataStore,
    private readonly events: EventBus
  ) {}

  overview(actor: RequestActor): AIResourceOverview {
    const s = this.store.getState();
    const scopedModels = this.scoped(actor, s.models);
    const scopedBudgets = this.scoped(actor, s.budgets);
    const scopedUsage = this.scoped(actor, s.usage);
    const scopedAllocations = this.scoped(actor, s.allocations);
    const scopedQuotas = this.scoped(actor, s.quotas);

    const totalTokens = scopedUsage.reduce((sum, u) => sum + u.totalTokens, 0);
    const totalCost = scopedUsage.reduce((sum, u) => sum + u.cost, 0);

    const byModel = scopedModels.map((model) => {
      const modelUsage = scopedUsage.filter((u) => u.modelId === model.id);
      return {
        modelId: model.id,
        modelName: model.name,
        requests: modelUsage.length,
        tokens: modelUsage.reduce((sum, u) => sum + u.totalTokens, 0),
        cost: modelUsage.reduce((sum, u) => sum + u.cost, 0)
      };
    });

    const byProject = Object.entries(
      scopedUsage.reduce((acc, u) => {
        const projectId = u.projectId ?? "unassigned";
        if (!acc[projectId]) acc[projectId] = { requests: 0, tokens: 0, cost: 0 };
        acc[projectId].requests += 1;
        acc[projectId].tokens += u.totalTokens;
        acc[projectId].cost += u.cost;
        return acc;
      }, {} as Record<string, { requests: number; tokens: number; cost: number }>)
    ).map(([projectId, data]) => ({
      projectId: projectId === "unassigned" ? undefined : projectId,
      ...data
    }));

    return {
      models: {
        total: scopedModels.length,
        active: scopedModels.filter((m) => m.status === "active").length
      },
      budgets: {
        total: scopedBudgets.length,
        active: scopedBudgets.filter((b) => b.status === "active").length
      },
      usage: {
        totalRequests: scopedUsage.length,
        totalTokens,
        totalCost
      },
      allocations: {
        total: scopedAllocations.length,
        active: scopedAllocations.filter((a) => a.status === "active").length
      },
      quotas: {
        total: scopedQuotas.length,
        active: scopedQuotas.filter((q) => q.status === "active").length
      },
      byModel,
      byProject
    };
  }

  listModels(actor: RequestActor, filters: Record<string, unknown> = {}): AIModel[] {
    const q = String(filters.q ?? "").trim();
    return this.scoped(actor, this.store.getState().models)
      .filter((m) => !filters.status || m.status === filters.status)
      .filter((m) => !filters.provider || m.provider === filters.provider)
      .filter((m) => !filters.type || m.type === filters.type)
      .filter((m) => !q || includesText(m.name, q) || includesText(m.key, q))
      .map(clone);
  }

  getModel(actor: RequestActor, id: string): AIModel {
    return clone(this.findModel(actor, id));
  }

  createModel(actor: RequestActor, input: any): AIModel {
    const key = requireString(input.key, "key");
    this.ensureModelKeyUnique(actor.tenantId, key);

    const now = nowIso();
    const model: AIModel = {
      id: input.id ?? newId("model"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key,
      name: requireString(input.name, "name"),
      provider: requireString(input.provider, "provider"),
      type: input.type ?? "chat",
      contextWindow: asNumber(input.contextWindow, 128000),
      maxOutputTokens: asNumber(input.maxOutputTokens, 4096),
      inputPricePer1MTokens: asNumber(input.inputPricePer1MTokens, 0),
      outputPricePer1MTokens: asNumber(input.outputPricePer1MTokens, 0),
      status: input.status ?? "active",
      capabilities: unique(asArray<string>(input.capabilities)),
      metadata: input.metadata ?? {}
    };

    this.store.getState().models.unshift(model);
    this.commit(actor, "model.created", "AIModel", model.id, undefined, model);
    return clone(model);
  }

  updateModel(actor: RequestActor, id: string, input: any): AIModel {
    const model = this.findModel(actor, id);
    const before = clone(model);

    if (input.key !== undefined) {
      const key = requireString(input.key, "key");
      if (key !== model.key) this.ensureModelKeyUnique(actor.tenantId, key);
      model.key = key;
    }
    model.name = optionalString(input.name) ?? model.name;
    model.provider = optionalString(input.provider) ?? model.provider;
    model.type = input.type ?? model.type;
    model.contextWindow = input.contextWindow === undefined ? model.contextWindow : asNumber(input.contextWindow);
    model.maxOutputTokens = input.maxOutputTokens === undefined ? model.maxOutputTokens : asNumber(input.maxOutputTokens);
    model.inputPricePer1MTokens = input.inputPricePer1MTokens === undefined ? model.inputPricePer1MTokens : asNumber(input.inputPricePer1MTokens);
    model.outputPricePer1MTokens = input.outputPricePer1MTokens === undefined ? model.outputPricePer1MTokens : asNumber(input.outputPricePer1MTokens);
    model.status = input.status ?? model.status;
    model.capabilities = input.capabilities === undefined ? model.capabilities : unique(asArray<string>(input.capabilities));
    model.metadata = input.metadata ?? model.metadata;
    model.updatedAt = nowIso();

    this.commit(actor, "model.updated", "AIModel", model.id, before, model);
    return clone(model);
  }

  listBudgets(actor: RequestActor, filters: Record<string, unknown> = {}): TokenBudget[] {
    const q = String(filters.q ?? "").trim();
    return this.scoped(actor, this.store.getState().budgets)
      .filter((b) => !filters.status || b.status === filters.status)
      .filter((b) => !filters.period || b.period === filters.period)
      .filter((b) => !filters.scope || b.scope === filters.scope)
      .filter((b) => !q || includesText(b.name, q))
      .map(clone);
  }

  getBudget(actor: RequestActor, id: string): TokenBudget {
    return clone(this.findBudget(actor, id));
  }

  createBudget(actor: RequestActor, input: any): TokenBudget {
    const name = requireString(input.name, "name");
    const now = nowIso();

    const budget: TokenBudget = {
      id: input.id ?? newId("budget"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name,
      description: optionalString(input.description),
      totalTokens: asNumber(input.totalTokens, 0),
      usedTokens: 0,
      period: input.period ?? "monthly",
      resetAt: input.resetAt,
      scope: input.scope ?? "global",
      scopeId: optionalString(input.scopeId),
      status: input.status ?? "active",
      alerts: asArray(input.alerts),
      metadata: input.metadata ?? {}
    };

    this.store.getState().budgets.unshift(budget);
    this.commit(actor, "budget.created", "TokenBudget", budget.id, undefined, budget);
    return clone(budget);
  }

  updateBudget(actor: RequestActor, id: string, input: any): TokenBudget {
    const budget = this.findBudget(actor, id);
    const before = clone(budget);

    budget.name = optionalString(input.name) ?? budget.name;
    budget.description = input.description === undefined ? budget.description : optionalString(input.description);
    budget.totalTokens = input.totalTokens === undefined ? budget.totalTokens : asNumber(input.totalTokens);
    budget.period = input.period ?? budget.period;
    budget.resetAt = input.resetAt === undefined ? budget.resetAt : optionalString(input.resetAt);
    budget.scope = input.scope ?? budget.scope;
    budget.scopeId = input.scopeId === undefined ? budget.scopeId : optionalString(input.scopeId);
    budget.status = input.status ?? budget.status;
    budget.alerts = input.alerts === undefined ? budget.alerts : asArray(input.alerts);
    budget.metadata = input.metadata ?? budget.metadata;
    budget.updatedAt = nowIso();

    this.commit(actor, "budget.updated", "TokenBudget", budget.id, before, budget);
    return clone(budget);
  }

  listUsage(actor: RequestActor, filters: Record<string, unknown> = {}): AIUsage[] {
    return this.scoped(actor, this.store.getState().usage)
      .filter((u) => !filters.modelId || u.modelId === filters.modelId)
      .filter((u) => !filters.budgetId || u.budgetId === filters.budgetId)
      .filter((u) => !filters.userId || u.userId === filters.userId)
      .filter((u) => !filters.status || u.status === filters.status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(clone);
  }

  trackUsage(actor: RequestActor, input: any): AIUsage {
    const modelId = requireString(input.modelId, "modelId");
    const model = this.findModel(actor, modelId);

    const promptTokens = asNumber(input.promptTokens, 0);
    const completionTokens = asNumber(input.completionTokens, 0);
    const totalTokens = promptTokens + completionTokens;
    const cost = calculateCost(
      promptTokens,
      completionTokens,
      model.inputPricePer1MTokens + model.outputPricePer1MTokens
    );

    const now = nowIso();
    const usage: AIUsage = {
      id: input.id ?? newId("usage"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      modelId,
      budgetId: optionalString(input.budgetId),
      userId: optionalString(input.userId),
      projectId: optionalString(input.projectId),
      promptTokens,
      completionTokens,
      totalTokens,
      cost,
      latencyMs: asNumber(input.latencyMs, 0),
      status: input.status ?? "success",
      error: optionalString(input.error),
      metadata: input.metadata ?? {}
    };

    if (usage.budgetId) {
      const budget = this.findBudget(actor, usage.budgetId);
      budget.usedTokens += totalTokens;
      budget.updatedAt = now;
      const usagePercent = budget.usedTokens / budget.totalTokens;
      const triggeredAlert = budget.alerts.find(
        (a) => a.enabled && usagePercent >= a.threshold
      );
      if (triggeredAlert) {
        this.events.emit(actor, "budget.threshold_reached", {
          budgetId: budget.id,
          budgetName: budget.name,
          threshold: triggeredAlert.threshold,
          currentUsage: usagePercent
        });
      }
    }

    this.store.getState().usage.unshift(usage);
    this.commit(actor, "usage.recorded", "AIUsage", usage.id, undefined, usage);
    return clone(usage);
  }

  listConfigs(actor: RequestActor, filters: Record<string, unknown> = {}): ModelConfig[] {
    const q = String(filters.q ?? "").trim();
    return this.scoped(actor, this.store.getState().configs)
      .filter((c) => !filters.status || c.status === filters.status)
      .filter((c) => !filters.modelId || c.modelId === filters.modelId)
      .filter((c) => !q || includesText(c.name, q))
      .map(clone);
  }

  getConfig(actor: RequestActor, id: string): ModelConfig {
    return clone(this.findConfig(actor, id));
  }

  createConfig(actor: RequestActor, input: any): ModelConfig {
    const name = requireString(input.name, "name");
    const modelId = requireString(input.modelId, "modelId");
    this.findModel(actor, modelId);

    const now = nowIso();
    const config: ModelConfig = {
      id: input.id ?? newId("config"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name,
      description: optionalString(input.description),
      modelId,
      defaultTemperature: asNumber(input.defaultTemperature, 0.7),
      maxTokens: input.maxTokens,
      fallbackModelIds: unique(asArray<string>(input.fallbackModelIds)),
      retryAttempts: asNumber(input.retryAttempts, 3),
      timeoutMs: asNumber(input.timeoutMs, 30000),
      customParams: input.customParams ?? {},
      status: input.status ?? "active",
      metadata: input.metadata ?? {}
    };

    this.store.getState().configs.unshift(config);
    this.commit(actor, "config.created", "ModelConfig", config.id, undefined, config);
    return clone(config);
  }

  updateConfig(actor: RequestActor, id: string, input: any): ModelConfig {
    const config = this.findConfig(actor, id);
    const before = clone(config);

    config.name = optionalString(input.name) ?? config.name;
    config.description = input.description === undefined ? config.description : optionalString(input.description);
    config.defaultTemperature = input.defaultTemperature === undefined ? config.defaultTemperature : asNumber(input.defaultTemperature);
    config.maxTokens = input.maxTokens === undefined ? config.maxTokens : input.maxTokens;
    config.fallbackModelIds = input.fallbackModelIds === undefined ? config.fallbackModelIds : unique(asArray<string>(input.fallbackModelIds));
    config.retryAttempts = input.retryAttempts === undefined ? config.retryAttempts : asNumber(input.retryAttempts);
    config.timeoutMs = input.timeoutMs === undefined ? config.timeoutMs : asNumber(input.timeoutMs);
    config.customParams = input.customParams ?? config.customParams;
    config.status = input.status ?? config.status;
    config.metadata = input.metadata ?? config.metadata;
    config.updatedAt = nowIso();

    this.commit(actor, "config.updated", "ModelConfig", config.id, before, config);
    return clone(config);
  }

  listAllocations(actor: RequestActor, filters: Record<string, unknown> = {}): CostAllocation[] {
    const q = String(filters.q ?? "").trim();
    return this.scoped(actor, this.store.getState().allocations)
      .filter((a) => !filters.status || a.status === filters.status)
      .filter((a) => !filters.period || a.period === filters.period)
      .filter((a) => !filters.category || a.category === filters.category)
      .filter((a) => !filters.scope || a.scope === filters.scope)
      .filter((a) => !q || includesText(a.name, q))
      .map(clone);
  }

  getAllocation(actor: RequestActor, id: string): CostAllocation {
    return clone(this.findAllocation(actor, id));
  }

  createAllocation(actor: RequestActor, input: any): CostAllocation {
    const name = requireString(input.name, "name");
    const now = nowIso();

    const allocation: CostAllocation = {
      id: input.id ?? newId("alloc"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name,
      description: optionalString(input.description),
      amount: asNumber(input.amount, 0),
      currency: input.currency ?? "USD",
      period: input.period ?? "monthly",
      scope: input.scope ?? "global",
      scopeId: optionalString(input.scopeId),
      category: input.category ?? "compute",
      allocatedBy: actor.userId,
      status: input.status ?? "active",
      metadata: input.metadata ?? {}
    };

    this.store.getState().allocations.unshift(allocation);
    this.commit(actor, "allocation.created", "CostAllocation", allocation.id, undefined, allocation);
    return clone(allocation);
  }

  updateAllocation(actor: RequestActor, id: string, input: any): CostAllocation {
    const allocation = this.findAllocation(actor, id);
    const before = clone(allocation);

    allocation.name = optionalString(input.name) ?? allocation.name;
    allocation.description = input.description === undefined ? allocation.description : optionalString(input.description);
    allocation.amount = input.amount === undefined ? allocation.amount : asNumber(input.amount);
    allocation.currency = input.currency ?? allocation.currency;
    allocation.period = input.period ?? allocation.period;
    allocation.scope = input.scope ?? allocation.scope;
    allocation.scopeId = input.scopeId === undefined ? allocation.scopeId : optionalString(input.scopeId);
    allocation.category = input.category ?? allocation.category;
    allocation.status = input.status ?? allocation.status;
    allocation.metadata = input.metadata ?? allocation.metadata;
    allocation.updatedAt = nowIso();

    this.commit(actor, "allocation.updated", "CostAllocation", allocation.id, before, allocation);
    return clone(allocation);
  }

  listQuotas(actor: RequestActor, filters: Record<string, unknown> = {}): QuotaLimit[] {
    return this.scoped(actor, this.store.getState().quotas)
      .filter((q) => !filters.status || q.status === filters.status)
      .filter((q) => !filters.limitType || q.limitType === filters.limitType)
      .filter((q) => !filters.scope || q.scope === filters.scope)
      .map(clone);
  }

  getQuota(actor: RequestActor, id: string): QuotaLimit {
    return clone(this.findQuota(actor, id));
  }

  createQuota(actor: RequestActor, input: any): QuotaLimit {
    const name = requireString(input.name, "name");
    const now = nowIso();

    const quota: QuotaLimit = {
      id: input.id ?? newId("quota"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name,
      limitType: input.limitType,
      limitValue: asNumber(input.limitValue, 0),
      scope: input.scope ?? "global",
      scopeId: optionalString(input.scopeId),
      modelId: optionalString(input.modelId),
      status: input.status ?? "active",
      metadata: input.metadata ?? {}
    };

    this.store.getState().quotas.unshift(quota);
    this.commit(actor, "quota.created", "QuotaLimit", quota.id, undefined, quota);
    return clone(quota);
  }

  updateQuota(actor: RequestActor, id: string, input: any): QuotaLimit {
    const quota = this.findQuota(actor, id);
    const before = clone(quota);

    quota.name = optionalString(input.name) ?? quota.name;
    quota.limitType = input.limitType ?? quota.limitType;
    quota.limitValue = input.limitValue === undefined ? quota.limitValue : asNumber(input.limitValue);
    quota.scope = input.scope ?? quota.scope;
    quota.scopeId = input.scopeId === undefined ? quota.scopeId : optionalString(input.scopeId);
    quota.modelId = input.modelId === undefined ? quota.modelId : optionalString(input.modelId);
    quota.status = input.status ?? quota.status;
    quota.metadata = input.metadata ?? quota.metadata;
    quota.updatedAt = nowIso();

    this.commit(actor, "quota.updated", "QuotaLimit", quota.id, before, quota);
    return clone(quota);
  }

  checkQuota(actor: RequestActor, input: any): Record<string, unknown> {
    const limitType = requireString(input.limitType, "limitType");
    const scope = input.scope ?? "global";
    const scopeId = optionalString(input.scopeId);
    const modelId = optionalString(input.modelId);

    const quotas = this.scoped(actor, this.store.getState().quotas).filter(
      (q) =>
        q.status === "active" &&
        q.limitType === limitType &&
        (q.scope === scope || q.scope === "global") &&
        (!scopeId || q.scopeId === scopeId || q.scope === "global") &&
        (!modelId || q.modelId === modelId || !q.modelId)
    );

    if (quotas.length === 0) {
      return { allowed: true, reason: "no_quota_limits" };
    }

    const quota = quotas.reduce((min, q) =>
      !min || q.limitValue < min.limitValue ? q : min
    );

    if (limitType === "requests_per_minute") {
      const recentRequests = this.scoped(actor, this.store.getState().usage)
        .filter((u) => {
          const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
          return u.createdAt >= oneMinuteAgo;
        })
        .filter((u) => !scopeId || u.userId === scopeId)
        .filter((u) => !modelId || u.modelId === modelId)
        .length;

      return {
        allowed: recentRequests < quota.limitValue,
        current: recentRequests,
        limit: quota.limitValue,
        quotaId: quota.id,
        scope,
        scopeId
      };
    }

    if (limitType === "tokens_per_day") {
      const todayUsage = this.scoped(actor, this.store.getState().usage)
        .filter((u) => {
          const today = new Date().toISOString().split("T")[0];
          return u.createdAt.startsWith(today);
        })
        .filter((u) => !scopeId || u.userId === scopeId || u.projectId === scopeId)
        .reduce((sum, u) => sum + u.totalTokens, 0);

      return {
        allowed: todayUsage + 1000000 < quota.limitValue,
        current: todayUsage,
        limit: quota.limitValue,
        quotaId: quota.id,
        scope,
        scopeId
      };
    }

    return { allowed: true, reason: "unknown_limit_type" };
  }

  eventsLog(actor: RequestActor) {
    return this.scoped(actor, this.store.getState().events);
  }

  auditLogs(actor: RequestActor) {
    return this.scoped(actor, this.store.getState().auditLogs);
  }

  private findModel(actor: RequestActor, id: string): AIModel {
    return this.findOne(this.store.getState().models, actor.tenantId, id, "AIModel");
  }

  private findBudget(actor: RequestActor, id: string): TokenBudget {
    return this.findOne(this.store.getState().budgets, actor.tenantId, id, "TokenBudget");
  }

  private findConfig(actor: RequestActor, id: string): ModelConfig {
    return this.findOne(this.store.getState().configs, actor.tenantId, id, "ModelConfig");
  }

  private findAllocation(actor: RequestActor, id: string): CostAllocation {
    return this.findOne(this.store.getState().allocations, actor.tenantId, id, "CostAllocation");
  }

  private findQuota(actor: RequestActor, id: string): QuotaLimit {
    return this.findOne(this.store.getState().quotas, actor.tenantId, id, "QuotaLimit");
  }

  private findOne<T extends { id: string; tenantId: string }>(
    items: T[],
    tenantId: string,
    id: string,
    name: string
  ): T {
    const item = items.find((x) => x.tenantId === tenantId && x.id === id);
    if (!item) notFound(`${name} not found`, { id });
    return item;
  }

  private scoped<T extends { tenantId: string }>(actor: Pick<RequestActor, "tenantId">, items: T[]): T[] {
    return items.filter((item) => item.tenantId === actor.tenantId);
  }

  private ensureModelKeyUnique(tenantId: string, key: string): void {
    if (this.store.getState().models.some((m) => m.tenantId === tenantId && m.key === key)) {
      conflict("Model key must be unique", { key });
    }
  }

  private commit(
    actor: RequestActor,
    event: string,
    entityType: string,
    entityId: string,
    before: unknown,
    after: unknown
  ): void {
    this.store.save();
    this.store.audit(actor, event, entityType, entityId, before, after);
    this.events.emit(actor, event, { entityId, entityType });
  }
}
