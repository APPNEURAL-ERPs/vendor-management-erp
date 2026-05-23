import { AIResourceState } from "./domain";
import { nowIso, plusDays } from "./core/id";
import { emptyState } from "./core/datastore";

export function createSeedState(tenantId = "demo-tenant"): AIResourceState {
  const now = nowIso();
  const state = emptyState();

  state.models = [
    {
      id: "model_gpt4o_demo",
      tenantId,
      createdAt: now,
      updatedAt: now,
      key: "gpt-4o",
      name: "GPT-4o",
      provider: "openai",
      type: "chat",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      inputPricePer1MTokens: 5.0,
      outputPricePer1MTokens: 15.0,
      status: "active",
      capabilities: ["chat", "json", "tool_calling"],
      metadata: {}
    },
    {
      id: "model_gpt4o_mini_demo",
      tenantId,
      createdAt: now,
      updatedAt: now,
      key: "gpt-4o-mini",
      name: "GPT-4o Mini",
      provider: "openai",
      type: "chat",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      inputPricePer1MTokens: 0.15,
      outputPricePer1MTokens: 0.6,
      status: "active",
      capabilities: ["chat", "json", "tool_calling"],
      metadata: {}
    },
    {
      id: "model_claude3_demo",
      tenantId,
      createdAt: now,
      updatedAt: now,
      key: "claude-3-5-sonnet",
      name: "Claude 3.5 Sonnet",
      provider: "anthropic",
      type: "chat",
      contextWindow: 200000,
      maxOutputTokens: 8192,
      inputPricePer1MTokens: 3.0,
      outputPricePer1MTokens: 15.0,
      status: "active",
      capabilities: ["chat", "json", "tool_calling", "vision"],
      metadata: {}
    }
  ];

  state.budgets = [
    {
      id: "budget_eng_demo",
      tenantId,
      createdAt: now,
      updatedAt: now,
      name: "Engineering Team Budget",
      description: "Monthly token budget for the engineering team",
      totalTokens: 100000000,
      usedTokens: 12500000,
      period: "monthly",
      resetAt: plusDays(15),
      scope: "team",
      scopeId: "team_engineering",
      status: "active",
      alerts: [
        { threshold: 0.5, enabled: true },
        { threshold: 0.8, enabled: true },
        { threshold: 0.95, enabled: false }
      ],
      metadata: {}
    },
    {
      id: "budget_data_demo",
      tenantId,
      createdAt: now,
      updatedAt: now,
      name: "Data Science Budget",
      description: "Monthly token budget for data science experiments",
      totalTokens: 50000000,
      usedTokens: 8000000,
      period: "monthly",
      resetAt: plusDays(20),
      scope: "team",
      scopeId: "team_data_science",
      status: "active",
      alerts: [
        { threshold: 0.7, enabled: true },
        { threshold: 0.9, enabled: true }
      ],
      metadata: {}
    },
    {
      id: "budget_unlimited_demo",
      tenantId,
      createdAt: now,
      updatedAt: now,
      name: "Production Unrestricted",
      description: "Unlimited budget for production workloads",
      totalTokens: 1000000000,
      usedTokens: 250000000,
      period: "unlimited",
      scope: "global",
      status: "active",
      alerts: [],
      metadata: {}
    }
  ];

  state.usage = [
    {
      id: "usage_demo_1",
      tenantId,
      createdAt: now,
      updatedAt: now,
      modelId: "model_gpt4o_demo",
      budgetId: "budget_eng_demo",
      userId: "user_demo_engineer",
      promptTokens: 1500,
      completionTokens: 800,
      totalTokens: 2300,
      cost: 0.0195,
      latencyMs: 2500,
      status: "success",
      metadata: { requestId: "req_abc123" }
    },
    {
      id: "usage_demo_2",
      tenantId,
      createdAt: now,
      updatedAt: now,
      modelId: "model_gpt4o_mini_demo",
      budgetId: "budget_eng_demo",
      userId: "user_demo_engineer",
      promptTokens: 500,
      completionTokens: 200,
      totalTokens: 700,
      cost: 0.00135,
      latencyMs: 800,
      status: "success",
      metadata: { requestId: "req_def456" }
    },
    {
      id: "usage_demo_3",
      tenantId,
      createdAt: now,
      updatedAt: now,
      modelId: "model_claude3_demo",
      budgetId: "budget_data_demo",
      userId: "user_demo_data",
      promptTokens: 3000,
      completionTokens: 1500,
      totalTokens: 4500,
      cost: 0.0315,
      latencyMs: 3200,
      status: "success",
      metadata: { requestId: "req_ghi789" }
    }
  ];

  state.configs = [
    {
      id: "config_production_demo",
      tenantId,
      createdAt: now,
      updatedAt: now,
      name: "Production Config",
      description: "Default production model configuration",
      modelId: "model_gpt4o_demo",
      defaultTemperature: 0.7,
      maxTokens: 4096,
      fallbackModelIds: ["model_gpt4o_mini_demo"],
      retryAttempts: 3,
      timeoutMs: 30000,
      customParams: { top_p: 0.9 },
      status: "active",
      metadata: {}
    },
    {
      id: "config_experimentation_demo",
      tenantId,
      createdAt: now,
      updatedAt: now,
      name: "Experimentation Config",
      description: "Configuration for experimental workloads",
      modelId: "model_claude3_demo",
      defaultTemperature: 0.9,
      maxTokens: 8192,
      fallbackModelIds: ["model_gpt4o_demo"],
      retryAttempts: 2,
      timeoutMs: 45000,
      customParams: { top_p: 0.95 },
      status: "active",
      metadata: {}
    }
  ];

  state.allocations = [
    {
      id: "alloc_eng_demo",
      tenantId,
      createdAt: now,
      updatedAt: now,
      name: "Engineering Monthly Allocation",
      description: "Monthly cost allocation for engineering team",
      amount: 5000.0,
      currency: "USD",
      period: "monthly",
      scope: "team",
      scopeId: "team_engineering",
      category: "compute",
      allocatedBy: "user_admin_demo",
      status: "active",
      metadata: {}
    },
    {
      id: "alloc_data_demo",
      tenantId,
      createdAt: now,
      updatedAt: now,
      name: "Data Science Monthly Allocation",
      description: "Monthly cost allocation for data science",
      amount: 3000.0,
      currency: "USD",
      period: "monthly",
      scope: "team",
      scopeId: "team_data_science",
      category: "compute",
      allocatedBy: "user_admin_demo",
      status: "active",
      metadata: {}
    }
  ];

  state.quotas = [
    {
      id: "quota_rpm_demo",
      tenantId,
      createdAt: now,
      updatedAt: now,
      name: "Global RPM Limit",
      limitType: "requests_per_minute",
      limitValue: 1000,
      scope: "global",
      status: "active",
      metadata: {}
    },
    {
      id: "quota_user_rpm_demo",
      tenantId,
      createdAt: now,
      updatedAt: now,
      name: "Per-User RPM Limit",
      limitType: "requests_per_minute",
      limitValue: 60,
      scope: "user",
      status: "active",
      metadata: {}
    },
    {
      id: "quota_tpd_demo",
      tenantId,
      createdAt: now,
      updatedAt: now,
      name: "Daily Token Limit",
      limitType: "tokens_per_day",
      limitValue: 10000000,
      scope: "global",
      status: "active",
      metadata: {}
    }
  ];

  return state;
}
