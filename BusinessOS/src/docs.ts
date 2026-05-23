export function docs() {
  return {
    name: "BusinessOS",
    version: "1.0.0",
    description: "BusinessOS: strategy, OKRs, initiatives, operating model, scorecards, and business decisions management.",
    auth: {
      headers: {
        "x-role": "owner | admin | business_admin | strategy_manager | goal_manager | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      strategy: "A long-term plan defining vision, mission, values, and strategic themes.",
      goal: "A measurable objective that supports strategy implementation.",
      okr: "Objectives and Key Results framework for tracking goals.",
      initiative: "A specific project or effort that drives goals forward.",
      businessPlan: "Comprehensive document outlining business model, market, and strategy.",
      scorecard: "Balanced scorecard for tracking business metrics.",
      decision: "A recorded business decision with options, rationale, and outcomes.",
      swotAnalysis: "Strategic analysis of Strengths, Weaknesses, Opportunities, and Threats."
    },
    examples: {
      listGoals: {
        method: "GET",
        path: "/businessos/goals",
        headers: { "x-role": "strategy_manager" }
      },
      createGoal: {
        method: "POST",
        path: "/businessos/goals",
        headers: { "x-role": "goal_manager" },
        body: {
          key: "revenue_q1",
          name: "Q1 Revenue Target",
          description: "Achieve ₹5 lakh in Q1",
          category: "revenue",
          priority: "high",
          progress: 0
        }
      },
      createOKR: {
        method: "POST",
        path: "/businessos/okrs",
        headers: { "x-role": "goal_manager" },
        body: {
          key: "q1_okr",
          name: "Q1 2024 OKR",
          objective: "Achieve revenue target",
          period: "quarterly"
        }
      },
      createDecision: {
        method: "POST",
        path: "/businessos/decisions",
        headers: { "x-role": "strategy_manager" },
        body: {
          key: "pricing_decision",
          title: "Pricing Strategy for 2024",
          description: "Define pricing tiers",
          category: "strategic",
          priority: "high",
          options: [
            { title: "Premium", description: "High-value positioning" },
            { title: "Volume", description: "Competitive pricing" }
          ]
        }
      }
    }
  };
}
