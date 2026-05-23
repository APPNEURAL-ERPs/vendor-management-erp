import { GrowthState } from "./core/domain";
import { emptyState } from "./core/datastore";

export function createSeedState(tenantId = "demo-tenant"): GrowthState {
  const state = emptyState();
  const now = new Date().toISOString();

  state.leads.push(
    {
      id: "lead_001",
      tenantId,
      createdAt: now,
      updatedAt: now,
      email: "sarah.chen@techcorp.io",
      firstName: "Sarah",
      lastName: "Chen",
      company: "TechCorp",
      phone: "+1-555-0123",
      source: "webinar",
      status: "qualified",
      lifecycleStage: "lead",
      score: 85,
      tags: ["enterprise", "decision-maker"],
      consent: "opted_in",
      customFields: { role: "VP Engineering", teamSize: 45 },
      createdBy: "seed"
    },
    {
      id: "lead_002",
      tenantId,
      createdAt: now,
      updatedAt: now,
      email: "marcus.johnson@startupxyz.com",
      firstName: "Marcus",
      lastName: "Johnson",
      company: "StartupXYZ",
      phone: "+1-555-0456",
      source: "content_download",
      status: "new",
      lifecycleStage: "lead",
      score: 62,
      tags: ["startup", "saas"],
      consent: "opted_in",
      customFields: { role: "Founder", teamSize: 12 },
      createdBy: "seed"
    }
  );

  state.segments.push(
    {
      id: "seg_enterprise",
      tenantId,
      createdAt: now,
      updatedAt: now,
      name: "Enterprise",
      description: "Large enterprise companies",
      rules: [
        { field: "customFields.teamSize", operator: "gte", value: 100 }
      ],
      status: "active",
      evaluatedCount: 2450,
      createdBy: "seed"
    },
    {
      id: "seg_startups",
      tenantId,
      createdAt: now,
      updatedAt: now,
      name: "Startups",
      description: "Early stage startups",
      rules: [
        { field: "customFields.teamSize", operator: "lte", value: 50 }
      ],
      status: "active",
      evaluatedCount: 8200,
      createdBy: "seed"
    }
  );

  state.campaigns.push(
    {
      id: "camp_q4_launch",
      tenantId,
      createdAt: now,
      updatedAt: now,
      name: "Q4 Product Launch",
      status: "active",
      channel: "mixed",
      objective: "conversions",
      budget: 5000,
      currency: "USD",
      metrics: {
        impressions: 75000,
        opens: 0,
        clicks: 2250,
        leads: 45,
        conversions: 45,
        revenue: 22500,
        cost: 2500
      },
      tags: ["q4", "launch", "product"],
      createdBy: "seed"
    },
    {
      id: "camp_webinar",
      tenantId,
      createdAt: now,
      updatedAt: now,
      name: "Growth Workshop Webinar",
      status: "active",
      channel: "webinar",
      objective: "leads",
      budget: 2000,
      currency: "USD",
      metrics: {
        impressions: 35000,
        opens: 0,
        clicks: 1050,
        leads: 85,
        conversions: 85,
        revenue: 4250,
        cost: 1200
      },
      tags: ["webinar", "education", "lead-gen"],
      createdBy: "seed"
    }
  );

  state.funnels.push({
    id: "funnel_main",
    tenantId,
    createdAt: now,
    updatedAt: now,
    name: "Main Conversion Funnel",
    description: "Primary funnel from awareness to conversion",
    status: "active",
    stages: [
      { id: "stage_awareness", name: "Awareness", order: 1, probability: 100 },
      { id: "stage_interest", name: "Interest", order: 2, probability: 80 },
      { id: "stage_consideration", name: "Consideration", order: 3, probability: 50 },
      { id: "stage_intent", name: "Intent", order: 4, probability: 20 },
      { id: "stage_conversion", name: "Conversion", order: 5, probability: 5 }
    ],
    createdBy: "seed"
  });

  state.landingPages.push({
    id: "lp_webinar",
    tenantId,
    createdAt: now,
    updatedAt: now,
    name: "Growth Workshop Registration",
    slug: "growth-workshop",
    headline: "Learn Growth Strategies",
    description: "Join our workshop to learn growth strategies",
    status: "published",
    formFields: ["email", "firstName", "lastName", "company", "jobTitle"],
    thankYouMessage: "Thank you for registering!",
    metrics: {
      visits: 500,
      submissions: 120,
      conversionRate: 24
    },
    createdBy: "seed"
  });

  state.experiments.push({
    id: "exp_cta_01",
    tenantId,
    createdAt: now,
    updatedAt: now,
    name: "CTA Button Color Test",
    hypothesis: "Green button will increase clicks",
    targetMetric: "click_rate",
    status: "running",
    variants: [
      { id: "var_ctrl", name: "Control", trafficWeight: 50, conversions: 45, visitors: 1000, revenue: 2250 },
      { id: "var_test", name: "Test", trafficWeight: 50, conversions: 58, visitors: 1000, revenue: 2900 }
    ],
    createdBy: "seed"
  });

  state.nurtureSequences.push({
    id: "nurture_welcome",
    tenantId,
    createdAt: now,
    updatedAt: now,
    name: "Welcome Series",
    description: "Onboarding email sequence for new leads",
    status: "active",
    steps: [
      { id: "step_1", order: 1, channel: "email", delayDays: 0, templateName: "welcome_email", subject: "Welcome to APPNEURAL" },
      { id: "step_2", order: 2, channel: "email", delayDays: 3, templateName: "feature_overview", subject: "Discover APPNEURAL Features" },
      { id: "step_3", order: 3, channel: "email", delayDays: 7, templateName: "case_study", subject: "Success Story" }
    ],
    enrollmentCount: 225,
    createdBy: "seed"
  });

  return state;
}
