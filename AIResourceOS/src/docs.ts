export const docs = {
  name: "AIResourceOS",
  version: "1.0.0",
  description: "AI resource management operating layer for token budgets, model selection, cost tracking, and quota management.",
  authentication: {
    type: "header based demo auth",
    headers: {
      "x-tenant-id": "Tenant id. Defaults to demo-tenant.",
      "x-user-id": "Actor/user id.",
      "x-role": "owner | admin | resource_admin | resource_analyst | viewer"
    }
  },
  examples: {
    createModel: {
      method: "POST",
      path: "/airesourceos/models",
      body: {
        key: "gpt-4o",
        name: "GPT-4o",
        provider: "openai",
        type: "chat",
        contextWindow: 128000,
        maxOutputTokens: 16384,
        inputPricePer1MTokens: 5.0,
        outputPricePer1MTokens: 15.0
      }
    },
    createBudget: {
      method: "POST",
      path: "/airesourceos/budgets",
      body: {
        name: "Engineering Team Budget",
        totalTokens: 100000000,
        period: "monthly",
        scope: "team",
        alerts: [{ threshold: 0.8, enabled: true }]
      }
    },
    trackUsage: {
      method: "POST",
      path: "/airesourceos/usage",
      body: {
        modelId: "model_gpt4o_demo",
        budgetId: "budget_eng_demo",
        promptTokens: 1000,
        completionTokens: 500,
        latencyMs: 2500
      }
    },
    checkQuota: {
      method: "POST",
      path: "/airesourceos/quotas/check",
      body: {
        scope: "user",
        scopeId: "user_demo_engineer",
        limitType: "requests_per_minute",
        modelId: "model_gpt4o_demo"
      }
    }
  },
  productionNotes: [
    "Replace the demo JSON datastore with PostgreSQL for production deployments.",
    "Integrate with real pricing APIs for accurate cost calculations.",
    "Add webhook support for budget threshold alerts.",
    "Implement real-time quota enforcement using Redis or similar.",
    "Add support for multi-cloud AI provider cost aggregation."
  ]
};
