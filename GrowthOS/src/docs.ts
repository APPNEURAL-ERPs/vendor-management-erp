export function docs(routes?: Array<{ method: string; path: string; permission?: string }>) {
  return {
    name: "GrowthOS",
    version: "1.0.0",
    description: "Growth operating layer for campaigns, funnels, experiments, acquisition, activation, retention, and growth loops.",
    auth: {
      headers: {
        "x-role": "owner | admin | growth_manager | growth_analyst | campaign_manager | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    routes: routes || [],
    coreConcepts: {
      lead: "A potential customer captured from campaigns or channels with scoring and lifecycle stages.",
      segment: "A defined group of leads matching specific criteria and rules.",
      campaign: "A targeted initiative across channels (email, social, ads, webinar, etc.) to achieve growth goals.",
      funnel: "A customer journey from awareness to conversion with multiple stages and membership tracking.",
      experiment: "A structured A/B test with variants, traffic weights, and conversion tracking.",
      touchpoint: "Customer interactions across channels tracked for attribution and engagement.",
      landingPage: "Conversion pages with form submissions for lead capture.",
      nurtureSequence: "Automated multi-step engagement sequences for lead nurturing."
    },
    examples: {
      createLead: {
        method: "POST",
        path: "/growthos/leads",
        headers: { "x-role": "growth_manager" },
        body: {
          email: "new.lead@example.com",
          firstName: "New",
          lastName: "Lead",
          company: "Example Corp",
          source: "website_form"
        }
      },
      createCampaign: {
        method: "POST",
        path: "/growthos/campaigns",
        headers: { "x-role": "campaign_manager" },
        body: {
          name: "Summer Sale Campaign",
          channel: "email",
          objective: "conversions",
          budget: 5000,
          tags: ["summer", "sale"]
        }
      },
      createExperiment: {
        method: "POST",
        path: "/growthos/experiments",
        headers: { "x-role": "growth_analyst" },
        body: {
          name: "Pricing Page Test",
          hypothesis: "New pricing layout will increase conversions",
          targetMetric: "conversion_rate"
        }
      },
      captureTouchpoint: {
        method: "POST",
        path: "/growthos/touchpoints",
        headers: { "x-role": "viewer" },
        body: {
          leadId: "lead_001",
          type: "email_click",
          campaignId: "camp_q4_launch",
          metadata: { linkUrl: "/pricing" }
        }
      }
    }
  };
}
