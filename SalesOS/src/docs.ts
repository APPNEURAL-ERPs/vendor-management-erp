export function docs() {
  return {
    name: "SalesOS",
    version: "1.0.0",
    description: "SalesOS: lead, prospect, pipeline, deal, proposal, follow-up, sales automation, and revenue conversion management",
    auth: {
      headers: {
        "x-role": "owner | admin | sales_manager | sales_rep | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      lead: "A potential customer captured from various sources (website, referral, partner, etc.)",
      contact: "An individual person associated with a lead or account",
      account: "A company/business account that may have multiple contacts and deals",
      deal: "A sales opportunity with a value, stage, and probability",
      pipeline: "A structured sales process with defined stages",
      proposal: "A formal offer sent to a prospect with pricing and scope",
      followUp: "A task to follow up with a lead or contact",
      activity: "A record of sales activities (calls, emails, meetings, etc.)",
      forecast: "Revenue prediction based on deal probability",
      target: "Sales goals for revenue, leads, meetings, etc."
    },
    examples: {
      createLead: {
        method: "POST",
        path: "/salesos/leads",
        headers: { "x-role": "sales_rep" },
        body: {
          name: "John Doe",
          email: "john.doe@example.com",
          company: "Example Corp",
          source: "website",
          status: "new"
        }
      },
      listDeals: {
        method: "GET",
        path: "/salesos/deals",
        headers: { "x-role": "sales_manager" },
        query: { stage: "proposal" }
      },
      updateDealStage: {
        method: "PATCH",
        path: "/salesos/deals/:id",
        headers: { "x-role": "sales_rep" },
        body: { stage: "negotiation", probability: 90 }
      },
      createProposal: {
        method: "POST",
        path: "/salesos/proposals",
        headers: { "x-role": "sales_rep" },
        body: {
          title: "Example Corp Website Project",
          dealId: "deal_123",
          lineItems: [
            { description: "Website Development", quantity: 1, unitPrice: 100000 }
          ]
        }
      },
      viewOverview: {
        method: "GET",
        path: "/salesos/overview",
        headers: { "x-role": "sales_manager" }
      }
    },
    entities: {
      Lead: {
        statuses: ["new", "contacted", "qualified", "not_qualified", "discovery_scheduled", "proposal_needed", "proposal_sent", "negotiation", "won", "lost", "nurture", "archived"],
        sources: ["website", "linkedin", "referral", "partner", "cold_outreach", "workshop", "webinar", "community", "google_search", "paid_campaign", "marketplace", "manual_entry"]
      },
      Deal: {
        stages: ["lead", "qualified", "discovery", "solution_fit", "proposal", "negotiation", "verbal_approval", "contract", "won", "lost"]
      },
      Proposal: {
        statuses: ["draft", "sent", "viewed", "negotiating", "accepted", "rejected", "expired", "archived"]
      },
      Activity: {
        types: ["call", "email", "whatsapp", "linkedin_message", "meeting", "demo", "proposal_sent", "follow_up", "negotiation", "contract_discussion"]
      }
    }
  };
}
