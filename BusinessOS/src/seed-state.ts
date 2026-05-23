import { BusinessState } from "./core/domain";
import { emptyState } from "./core/datastore";
import { newId, nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): BusinessState {
  const state = emptyState();
  const createdAt = nowIso();

  state.strategies.push({
    id: "strategy_demo_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    status: "active",
    key: "growth_strategy_2024",
    name: "APPNEURAL Growth Strategy 2024",
    description: "Primary growth strategy for APPNEURAL platform",
    vision: "To become the leading AI-powered business OS platform for SMEs and enterprises",
    mission: "Help businesses automate, scale, and succeed with intelligent operating systems",
    values: ["Customer Success", "Innovation", "Integrity", "Excellence", "Collaboration"],
    strategicThemes: ["Product Innovation", "Market Expansion", "Customer Excellence", "Operational Excellence"],
    timeHorizon: "medium_term",
    ownerId: "user_demo",
    tags: ["growth", "2024", "strategic"]
  });

  state.goals.push(
    {
      id: "goal_demo_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      status: "active",
      key: "revenue_goal_10l",
      name: "Generate first ₹10 lakh revenue",
      description: "Achieve ₹10 lakh in revenue from APPNEURAL services",
      strategyId: "strategy_demo_1",
      category: "revenue",
      priority: "high",
      progress: 45,
      ownerId: "user_demo",
      dueDate: "2024-12-31T00:00:00.000Z",
      tags: ["revenue", "2024", "primary"]
    },
    {
      id: "goal_demo_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      status: "active",
      key: "client_goal_10",
      name: "Acquire 10 service clients",
      description: "Sign and onboard 10 paying service clients",
      category: "growth",
      priority: "high",
      progress: 60,
      ownerId: "user_demo",
      dueDate: "2024-12-31T00:00:00.000Z",
      tags: ["clients", "growth"]
    },
    {
      id: "goal_demo_3",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      status: "active",
      key: "brand_goal_awareness",
      name: "Increase brand awareness",
      description: "Build thought leadership through content and community",
      category: "market",
      priority: "medium",
      progress: 30,
      ownerId: "user_demo",
      tags: ["brand", "marketing"]
    }
  );

  state.okrs.push({
    id: "okr_demo_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "q1_revenue_okr",
    name: "Q1 2024 Revenue OKR",
    description: "Primary OKR for Q1 2024",
    objective: "Generate ₹10 lakh revenue from APPNEURAL services",
    goalId: "goal_demo_1",
    period: "quarterly",
    startDate: "2024-01-01T00:00:00.000Z",
    endDate: "2024-03-31T00:00:00.000Z",
    ownerId: "user_demo",
    progress: 45,
    status: "in_progress",
    keyResults: [
      {
        id: "kr_1",
        name: "Close 5 service clients",
        target: 5,
        current: 3,
        unit: "clients",
        confidence: 70,
        status: "in_progress"
      },
      {
        id: "kr_2",
        name: "Publish 30 LinkedIn posts",
        target: 30,
        current: 18,
        unit: "posts",
        confidence: 90,
        status: "in_progress"
      },
      {
        id: "kr_3",
        name: "Build 3 service landing pages",
        target: 3,
        current: 2,
        unit: "pages",
        confidence: 85,
        status: "in_progress"
      },
      {
        id: "kr_4",
        name: "Conduct 10 discovery calls",
        target: 10,
        current: 7,
        unit: "calls",
        confidence: 75,
        status: "in_progress"
      }
    ]
  });

  state.initiatives.push(
    {
      id: "init_demo_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "linkedin_content_init",
      name: "LinkedIn Content Initiative",
      description: "Create and publish consistent LinkedIn content for brand building",
      strategyId: "strategy_demo_1",
      goalId: "goal_demo_3",
      ownerId: "user_demo",
      priority: "medium",
      progress: 40,
      status: "in_progress",
      startDate: "2024-01-01T00:00:00.000Z",
      endDate: "2024-06-30T00:00:00.000Z",
      tags: ["content", "linkedin", "brand"]
    },
    {
      id: "init_demo_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "client_acquisition_init",
      name: "Client Acquisition Campaign",
      description: "Systematic outreach and proposal process for new clients",
      goalId: "goal_demo_2",
      ownerId: "user_demo",
      priority: "high",
      progress: 55,
      status: "in_progress",
      startDate: "2024-01-01T00:00:00.000Z",
      endDate: "2024-12-31T00:00:00.000Z",
      budget: 50000,
      tags: ["sales", "clients"]
    }
  );

  state.businessPlans.push({
    id: "plan_demo_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    status: "active",
    key: "appneural_service_plan",
    name: "APPNEURAL Service Business Plan",
    description: "Business plan for APPNEURAL consulting and implementation services",
    type: "startup",
    executiveSummary: "APPNEURAL provides AI-powered business operating systems and consulting services to help SMEs and enterprises automate operations, scale growth, and succeed with intelligent tools.",
    problem: "SMEs struggle with fragmented tools, manual processes, and lack of systematic business operations.",
    solution: "We offer customizable OS platforms and implementation services that integrate AI capabilities.",
    targetMarket: "Small to medium enterprises, startups, agencies, and training institutes in India and globally.",
    businessModel: "Service-based with productized offerings. Mix of consulting, implementation, and recurring services.",
    revenueStreams: ["Consulting fees", "Implementation services", "Monthly retainers", "Training programs", "Platform subscriptions"],
    competitors: "Traditional IT consultants, generic SaaS platforms, system integrators",
    goToMarket: "Direct outreach, LinkedIn content marketing, partnerships with complementary service providers",
    operations: "Remote-first team with strategic partnerships for delivery",
    team: "Founder-led with contracted specialists for different OS domains",
    financialProjections: "Year 1: ₹10 lakh revenue, Year 2: ₹50 lakh, Year 3: ₹2 crore",
    risks: "Market competition, talent availability, cash flow management",
    roadmap: "MVP services -> Productized offerings -> Platform subscription -> Enterprise expansion",
    ownerId: "user_demo",
    approved: true
  });

  state.scorecards.push({
    id: "score_demo_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    status: "active",
    key: "monthly_bsc",
    name: "Monthly Balanced Scorecard",
    description: "Balanced scorecard for monthly business performance tracking",
    perspective: "financial",
    period: "monthly",
    ownerId: "user_demo",
    metrics: [
      {
        id: "metric_1",
        name: "Monthly Revenue",
        target: 100000,
        current: 45000,
        unit: "INR",
        trend: "up"
      },
      {
        id: "metric_2",
        name: "Active Clients",
        target: 10,
        current: 6,
        unit: "clients",
        trend: "up"
      },
      {
        id: "metric_3",
        name: "Customer Satisfaction",
        target: 4.5,
        current: 4.2,
        unit: "rating",
        trend: "stable"
      }
    ]
  });

  state.decisions.push({
    id: "dec_demo_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "pricing_decision",
    title: "APPNEURAL Service Pricing Strategy",
    description: "Define pricing tiers for consulting and implementation services",
    category: "strategic",
    status: "decided",
    priority: "high",
    decisionMaker: "user_demo",
    options: [
      {
        id: "opt_1",
        title: "Premium Pricing",
        description: "High-value positioning with premium pricing for enterprise clients",
        pros: ["Higher margins", "Better brand perception", "Attracts serious clients"],
        cons: ["Smaller market", "Longer sales cycles"],
        estimatedImpact: 8,
        estimatedCost: 10000,
        risks: ["May limit volume", "Requires strong value proposition"]
      },
      {
        id: "opt_2",
        title: "Volume-based Pricing",
        description: "Competitive pricing with focus on volume and recurring revenue",
        pros: ["Larger market", "Recurring revenue", "Faster growth"],
        cons: ["Lower margins", "Higher operational load"],
        estimatedImpact: 7,
        estimatedCost: 5000,
        risks: ["Margin pressure", "May attract price-sensitive clients"]
      }
    ],
    selectedOptionId: "opt_1",
    rationale: "Premium positioning aligns better with our brand strategy and target market of serious SMEs and enterprises. The higher impact score justifies the market size trade-off.",
    implementationDate: "2024-02-01T00:00:00.000Z",
    relatedGoals: ["goal_demo_1"],
    relatedInitiatives: ["init_demo_2"]
  });

  state.swotAnalyses.push({
    id: "swot_demo_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    status: "active",
    key: "appneural_swot",
    name: "APPNEURAL SWOT Analysis",
    description: "Strategic SWOT analysis for APPNEURAL",
    strategyId: "strategy_demo_1",
    ownerId: "user_demo",
    summary: "Strong technical capabilities with early-stage brand awareness. Growing demand for AI automation in SMEs presents opportunity, but competition from established SaaS platforms poses threat.",
    items: [
      {
        id: "swot_1",
        category: "strength",
        title: "Strong Technical Architecture",
        description: "Deep expertise in building scalable, modular OS platforms",
        impact: "high",
        mitigation: "Leverage as primary differentiator"
      },
      {
        id: "swot_2",
        category: "strength",
        title: "AI-Native Approach",
        description: "Built-in AI capabilities across all OS modules",
        impact: "high"
      },
      {
        id: "swot_3",
        category: "weakness",
        title: "Early-stage Brand Awareness",
        description: "Limited brand recognition in the market",
        impact: "medium",
        mitigation: "Invest in content marketing and thought leadership"
      },
      {
        id: "swot_4",
        category: "weakness",
        title: "Limited Resources",
        description: "Small team with constrained bandwidth",
        impact: "medium"
      },
      {
        id: "swot_5",
        category: "opportunity",
        title: "SME AI Automation Demand",
        description: "Growing market demand for AI-powered business tools among SMEs",
        impact: "critical"
      },
      {
        id: "swot_6",
        category: "opportunity",
        title: "Platform Ecosystem",
        description: "Potential to build ecosystem of complementary OS modules",
        impact: "high"
      },
      {
        id: "swot_7",
        category: "threat",
        title: "Established SaaS Competition",
        description: "Competition from established players with larger budgets",
        impact: "high",
        mitigation: "Focus on niche segments and differentiation"
      },
      {
        id: "swot_8",
        category: "threat",
        title: "Economic Uncertainty",
        description: "Potential impact of economic slowdown on business spending",
        impact: "medium"
      }
    ]
  });

  state.competitors.push(
    {
      id: "comp_demo_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      status: "active",
      key: "comp_zoho",
      name: "Zoho Corporation",
      description: "Indian enterprise software company",
      website: "https://www.zoho.com",
      marketPosition: "Comprehensive business suite for SMEs",
      strengths: ["Strong brand in India", "Wide product portfolio", "Affordable pricing", "Good customer support"],
      weaknesses: ["Complex onboarding", " dated UI in some products", "Limited AI capabilities"],
      offerings: ["CRM", "Books", "People", "Projects", "Desk"],
      pricing: "₹700-₹2000/user/month",
      marketShare: 15,
      threatLevel: "medium",
      opportunities: ["SME market expansion", "AI integration"],
      threats: ["Price competition", "Feature parity pressure"]
    },
    {
      id: "comp_demo_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      status: "active",
      key: "comp_salesforce",
      name: "Salesforce",
      description: "Global CRM and enterprise cloud platform",
      website: "https://www.salesforce.com",
      marketPosition: "Enterprise CRM and platform leader",
      strengths: ["Market leader", "Strong ecosystem", "Robust platform", "AI capabilities (Einstein)"],
      weaknesses: ["High cost", "Complex implementation", "Steep learning curve"],
      offerings: ["Sales Cloud", "Service Cloud", "Marketing Cloud", "Platform"],
      pricing: "₹25,000+/month for enterprise",
      marketShare: 25,
      threatLevel: "high",
      opportunities: ["Enterprise market", "AI-first strategy"],
      threats: ["Market dominance", "Acquisition strategy"]
    }
  );

  state.risks.push(
    {
      id: "risk_demo_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "risk_cashflow",
      name: "Cash Flow Management",
      description: "Risk of cash flow challenges during early growth phase",
      category: "financial",
      severity: "high",
      likelihood: "medium",
      impact: "high",
      status: "mitigated",
      mitigation: "Maintain 6-month runway, invoice promptly, require deposits",
      ownerId: "user_demo",
      identifiedDate: "2024-01-01T00:00:00.000Z",
      reviewDate: "2024-06-30T00:00:00.000Z",
      relatedGoals: ["goal_demo_1"]
    },
    {
      id: "risk_demo_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "risk_competition",
      name: "Competitive Pressure",
      description: "Risk from established competitors with larger budgets",
      category: "market",
      severity: "medium",
      likelihood: "high",
      impact: "medium",
      status: "mitigated",
      mitigation: "Focus on niche segments, differentiate through AI and modular approach",
      ownerId: "user_demo",
      identifiedDate: "2024-01-01T00:00:00.000Z",
      reviewDate: "2024-12-31T00:00:00.000Z",
      relatedGoals: ["goal_demo_2"]
    }
  );

  state.offers.push({
    id: "offer_demo_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    status: "active",
    key: "agency_os_package",
    name: "AgencyOS Implementation Package",
    description: "Complete AgencyOS platform implementation with training and support",
    type: "productized_service",
    components: [
      {
        id: "comp_1",
        name: "Platform Setup",
        description: "Complete platform configuration and customization",
        included: true,
        value: 50000
      },
      {
        id: "comp_2",
        name: "Training Program",
        description: "2-day intensive training for your team",
        included: true,
        value: 25000
      },
      {
        id: "comp_3",
        name: "3-Month Support",
        description: "Ongoing support and troubleshooting",
        included: true,
        value: 15000
      },
      {
        id: "comp_4",
        name: "Custom Integrations",
        description: "Custom API integrations with existing tools",
        included: false,
        value: 30000
      }
    ],
    price: 90000,
    currency: "INR",
    targetSegment: "Digital agencies, consulting firms",
    painPoints: ["Manual client management", "Inefficient workflows", "Lack of visibility"],
    benefits: ["Automated client onboarding", "Real-time dashboards", "Professional branding"],
    guarantee: "100% satisfaction or money-back within 30 days"
  });

  state.roadmaps.push({
    id: "road_demo_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    status: "active",
    key: "2024_roadmap",
    name: "APPNEURAL 2024 Roadmap",
    description: "Strategic roadmap for APPNEURAL 2024",
    strategyId: "strategy_demo_1",
    ownerId: "user_demo",
    phases: [
      {
        id: "phase_1",
        name: "Foundation",
        description: "Establish core service offerings and initial client base",
        startDate: "2024-01-01T00:00:00.000Z",
        endDate: "2024-03-31T00:00:00.000Z",
        objectives: ["Validate service offerings", "Acquire first 5 clients", "Build delivery framework"],
        deliverables: ["Service packages", "Proposal templates", "Delivery playbooks"],
        milestones: [
          { id: "m1", name: "Service packages ready", date: "2024-01-15T00:00:00.000Z", completed: true },
          { id: "m2", name: "First client signed", date: "2024-02-28T00:00:00.000Z", completed: true },
          { id: "m3", name: "5 clients milestone", date: "2024-03-31T00:00:00.000Z", completed: false }
        ]
      },
      {
        id: "phase_2",
        name: "Growth",
        description: "Scale client base and expand service offerings",
        startDate: "2024-04-01T00:00:00.000Z",
        endDate: "2024-06-30T00:00:00.000Z",
        objectives: ["Reach 10 clients", "Launch productized offerings", "Build thought leadership"],
        deliverables: ["Productized service packages", "Content calendar", "Case studies"],
        milestones: [
          { id: "m4", name: "Productized packages launched", date: "2024-04-30T00:00:00.000Z", completed: false },
          { id: "m5", name: "10 clients milestone", date: "2024-06-30T00:00:00.000Z", completed: false }
        ]
      },
      {
        id: "phase_3",
        name: "Expansion",
        description: "Expand team and explore partnerships",
        startDate: "2024-07-01T00:00:00.000Z",
        endDate: "2024-09-30T00:00:00.000Z",
        objectives: ["Build partner network", "Hire delivery team", "Reach ₹5 lakh quarterly revenue"],
        deliverables: ["Partner program", "Expanded team", "Revenue dashboard"],
        milestones: [
          { id: "m6", name: "Partner program launched", date: "2024-08-31T00:00:00.000Z", completed: false },
          { id: "m7", name: "Team expansion complete", date: "2024-09-30T00:00:00.000Z", completed: false }
        ]
      },
      {
        id: "phase_4",
        name: "Scale",
        description: "Scale operations and prepare for next phase",
        startDate: "2024-10-01T00:00:00.000Z",
        endDate: "2024-12-31T00:00:00.000Z",
        objectives: ["Achieve ₹10 lakh annual revenue", "Launch subscription model", "Build repeat clients"],
        deliverables: ["Subscription offerings", "Client success playbook", "Annual report"],
        milestones: [
          { id: "m8", name: "Subscription model launched", date: "2024-11-30T00:00:00.000Z", completed: false },
          { id: "m9", name: "₹10 lakh revenue achieved", date: "2024-12-31T00:00:00.000Z", completed: false }
        ]
      }
    ]
  });

  state.processes.push({
    id: "proc_demo_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    status: "active",
    key: "lead_to_client",
    name: "Lead to Client Process",
    description: "End-to-end process for converting leads to clients",
    type: "lead_to_client",
    ownerId: "user_demo",
    steps: [
      {
        id: "step_1",
        order: 1,
        name: "Lead Capture",
        description: "Capture and log lead information",
        ownerId: "user_demo",
        duration: 5,
        dependencies: []
      },
      {
        id: "step_2",
        order: 2,
        name: "Initial Outreach",
        description: "Send welcome email and schedule discovery call",
        ownerId: "user_demo",
        duration: 24,
        dependencies: ["step_1"]
      },
      {
        id: "step_3",
        order: 3,
        name: "Discovery Call",
        description: "Understand needs, pain points, and requirements",
        ownerId: "user_demo",
        duration: 60,
        dependencies: ["step_2"]
      },
      {
        id: "step_4",
        order: 4,
        name: "Proposal Creation",
        description: "Create customized proposal with scope and pricing",
        ownerId: "user_demo",
        duration: 48,
        dependencies: ["step_3"]
      },
      {
        id: "step_5",
        order: 5,
        name: "Follow-up",
        description: "Follow up on proposal and address questions",
        ownerId: "user_demo",
        duration: 72,
        dependencies: ["step_4"]
      },
      {
        id: "step_6",
        order: 6,
        name: "Contract & Onboarding",
        description: "Sign contract and begin onboarding process",
        ownerId: "user_demo",
        duration: 120,
        dependencies: ["step_5"]
      }
    ],
    kpis: ["Lead conversion rate", "Time to close", "Proposal acceptance rate"],
    automation: ["Email sequences", "Task reminders", "Pipeline updates"]
  });

  state.events.push({
    id: "event_demo_bootstrap",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    status: "active",
    type: "businessos.seeded",
    source: "BusinessOS",
    data: { message: "BusinessOS demo data seeded" }
  });

  return state;
}
