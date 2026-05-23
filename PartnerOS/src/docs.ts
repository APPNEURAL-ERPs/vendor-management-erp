export const docs = {
  title: "PartnerOS API Documentation",
  version: "1.0.0",
  description: "Partner programs, relationships, enablement, joint GTM, revenue sharing, and partner lifecycle management",

  baseUrl: "/v1/partners",
  standaloneUrl: "/partneros",

  overview: {
    description: "PartnerOS is the ecosystem growth engine that helps manage partners, referrals, resellers, affiliates, commissions, co-selling, co-marketing, training, agreements, and partner-driven revenue.",
    keyFeatures: [
      "Partner profile management and onboarding",
      "Partner program and tier management",
      "Lead generation and tracking",
      "Commission calculation and payouts",
      "Joint GTM and co-marketing campaigns",
      "Partner enablement and training",
      "Performance analytics and health scoring"
    ]
  },

  authentication: {
    description: "Use headers for authentication:",
    headers: [
      { name: "x-tenant-id", description: "Tenant identifier", example: "demo-tenant" },
      { name: "x-user-id", description: "User identifier", example: "admin-user" },
      { name: "x-role", description: "User role (owner, admin, partner_manager, partner, viewer)", example: "admin" }
    ]
  },

  endpoints: [
    {
      method: "GET",
      path: "/health",
      description: "Health check endpoint",
      response: {
        ok: true,
        status: "healthy",
        timestamp: "2026-05-23T00:00:00.000Z",
        uptime: 3600
      }
    },
    {
      method: "GET",
      path: "/docs",
      description: "API documentation",
      response: {
        title: "PartnerOS API Documentation",
        version: "1.0.0"
      }
    },
    {
      method: "GET",
      path: "/overview",
      description: "Get partner ecosystem overview with key metrics",
      response: {
        partners: {
          total: 42,
          active: 38,
          byStatus: { active: 38, inactive: 4 },
          byType: { agency: 15, technology: 10, training_institute: 8, affiliate: 9 }
        },
        programs: { total: 3, active: 3 },
        leads: {
          total: 130,
          submitted: 130,
          converted: 45,
          conversionRate: 35
        },
        revenue: {
          total: 850000,
          partnerInfluenced: 850000,
          commission: 127500,
          paid: 95000,
          pending: 32500
        },
        campaigns: { total: 5, active: 3 }
      }
    },
    {
      method: "GET",
      path: "/partners",
      description: "List all partners with optional filters",
      query: [
        { name: "status", type: "string", description: "Filter by status (active, inactive, prospect)", example: "active" },
        { name: "type", type: "string", description: "Filter by type (agency, technology, training_institute)", example: "agency" },
        { name: "programId", type: "string", description: "Filter by program ID", example: "program_agency" },
        { name: "search", type: "string", description: "Search partners by name, email, or tags", example: "agency" }
      ],
      response: {
        partners: []
      }
    },
    {
      method: "POST",
      path: "/partners",
      description: "Create a new partner",
      body: {
        name: { type: "string", required: true, description: "Partner company name", example: "ABC Solutions" },
        type: { type: "string", required: true, description: "Partner type (agency, technology, training_institute, etc.)", example: "agency" },
        email: { type: "string", required: true, description: "Primary contact email", example: "contact@abcsolutions.in" },
        programId: { type: "string", description: "Partner program ID to enroll in", example: "program_agency" },
        contactPerson: { type: "string", description: "Primary contact person name", example: "John Doe" },
        phone: { type: "string", description: "Contact phone number", example: "+91 98765 43210" },
        website: { type: "string", description: "Company website URL", example: "https://abcsolutions.in" },
        city: { type: "string", description: "City", example: "Mumbai" },
        state: { type: "string", description: "State", example: "Maharashtra" },
        country: { type: "string", description: "Country", example: "India" },
        description: { type: "string", description: "Partner description", example: "Digital solutions provider" },
        tags: { type: "array", description: "Tags for categorization", example: ["digital", "website", "ai"] }
      },
      response: {
        id: "partner_abc123",
        name: "ABC Solutions",
        type: "agency",
        status: "prospect",
        referralCode: "ABCSOL12"
      }
    },
    {
      method: "GET",
      path: "/partners/:id",
      description: "Get a specific partner by ID",
      response: {
        id: "partner_techsol",
        name: "TechSol Digital Agency",
        type: "agency",
        status: "active",
        tierId: "tier_gold",
        programId: "program_agency",
        revenueGenerated: 650000,
        leadsSubmitted: 45,
        dealsWon: 12,
        healthScore: 85
      }
    },
    {
      method: "PATCH",
      path: "/partners/:id",
      description: "Update partner information",
      body: {
        status: { type: "string", description: "New status (active, inactive, suspended)" },
        tierId: { type: "string", description: "New tier ID" },
        contactPerson: { type: "string", description: "Updated contact person" },
        phone: { type: "string", description: "Updated phone" }
      }
    },
    {
      method: "GET",
      path: "/partners/:id/health",
      description: "Get partner health score and recommendations",
      response: {
        partnerId: "partner_techsol",
        overallScore: 85,
        activityScore: 75,
        revenueScore: 90,
        leadQualityScore: 80,
        engagementScore: 85,
        complianceScore: 100,
        factors: {
          activity: 75,
          revenue: 90,
          leadQuality: 80,
          engagement: 85,
          compliance: 100
        },
        recommendations: [
          "Great performance! Maintain current strategies"
        ]
      }
    },
    {
      method: "GET",
      path: "/partners/:id/leads",
      description: "Get leads submitted by a partner",
      response: {
        leads: []
      }
    },
    {
      method: "GET",
      path: "/partners/:id/commissions",
      description: "Get commissions for a partner",
      query: [
        { name: "status", type: "string", description: "Filter by status (calculated, approved, paid)" }
      ],
      response: {
        commissions: []
      }
    },
    {
      method: "GET",
      path: "/programs",
      description: "List all partner programs",
      query: [
        { name: "type", type: "string", description: "Filter by type (agency, affiliate, implementation)" },
        { name: "status", type: "string", description: "Filter by status (active, inactive)" }
      ],
      response: {
        programs: []
      }
    },
    {
      method: "GET",
      path: "/programs/:id",
      description: "Get a specific program",
      response: {
        id: "program_agency",
        name: "APPNEURAL Agency Partner Program",
        type: "agency",
        status: "active",
        commissionModel: "percentage",
        defaultCommissionRate: 15
      }
    },
    {
      method: "GET",
      path: "/tiers",
      description: "List partner tiers",
      query: [
        { name: "programId", type: "string", description: "Filter by program ID" }
      ]
    },
    {
      method: "GET",
      path: "/leads",
      description: "List all leads",
      query: [
        { name: "partnerId", type: "string", description: "Filter by partner ID" },
        { name: "status", type: "string", description: "Filter by status (submitted, qualified, won)" },
        { name: "source", type: "string", description: "Filter by source (referral, affiliate)" }
      ],
      response: {
        leads: []
      }
    },
    {
      method: "POST",
      path: "/leads",
      description: "Submit a new lead from a partner",
      body: {
        partnerId: { type: "string", required: true, description: "Partner ID" },
        programId: { type: "string", description: "Program ID" },
        source: { type: "string", required: true, description: "Lead source (referral, affiliate, reseller, direct)" },
        customerName: { type: "string", required: true, description: "Customer name" },
        customerEmail: { type: "string", required: true, description: "Customer email" },
        customerPhone: { type: "string", description: "Customer phone" },
        company: { type: "string", description: "Customer company" },
        description: { type: "string", description: "Lead description" },
        dealValue: { type: "number", description: "Estimated deal value" },
        referralCode: { type: "string", description: "Referral code if applicable" },
        tags: { type: "array", description: "Tags for categorization" }
      },
      response: {
        id: "lead_new123",
        partnerId: "partner_techsol",
        status: "submitted",
        commissionEligible: false
      }
    },
    {
      method: "PATCH",
      path: "/leads/:id/status",
      description: "Update lead status",
      body: {
        status: { type: "string", required: true, description: "New status (submitted, accepted, qualified, won, lost)" }
      }
    },
    {
      method: "GET",
      path: "/commissions",
      description: "List all commissions",
      query: [
        { name: "partnerId", type: "string", description: "Filter by partner ID" },
        { name: "status", type: "string", description: "Filter by status" }
      ]
    },
    {
      method: "POST",
      path: "/commissions/calculate",
      description: "Calculate commission for a deal",
      body: {
        dealId: { type: "string", required: true, description: "Deal ID" }
      },
      response: {
        id: "commission_new",
        commissionAmount: 18000,
        commissionRate: 15,
        status: "calculated"
      }
    },
    {
      method: "GET",
      path: "/payouts",
      description: "List all payouts",
      query: [
        { name: "partnerId", type: "string", description: "Filter by partner ID" },
        { name: "status", type: "string", description: "Filter by status (pending, paid)" }
      ]
    },
    {
      method: "GET",
      path: "/campaigns",
      description: "List all campaigns",
      query: [
        { name: "status", type: "string", description: "Filter by status (active, completed)" }
      ]
    },
    {
      method: "GET",
      path: "/jointgtm",
      description: "List all joint GTM initiatives"
    },
    {
      method: "GET",
      path: "/enablement",
      description: "List enablement and training",
      query: [
        { name: "partnerId", type: "string", description: "Filter by partner ID" }
      ]
    },
    {
      method: "GET",
      path: "/search",
      description: "Search partners",
      query: [
        { name: "q", type: "string", required: true, description: "Search query", example: "agency" }
      ]
    }
  ],

  partnerTypes: [
    "agency - Marketing, consulting, or digital agencies",
    "consultant - Independent consultants",
    "freelancer - Freelance professionals",
    "training_institute - Training and educational institutes",
    "college - Universities and colleges",
    "technology - Technology and integration partners",
    "vendor - Service and product vendors",
    "reseller - Resellers and distributors",
    "affiliate - Affiliate marketers",
    "community - Community and user groups",
    "implementation - Implementation and delivery partners"
  ],

  partnerStatuses: [
    "prospect - Initial contact made",
    "invited - Invitation sent",
    "applied - Application submitted",
    "under_review - Under review",
    "approved - Approved",
    "active - Active partner",
    "inactive - Inactive partner",
    "suspended - Temporarily suspended",
    "terminated - Partnership terminated",
    "archived - Archived"
  ],

  leadStatuses: [
    "submitted - Lead submitted",
    "accepted - Lead accepted",
    "rejected - Lead rejected",
    "duplicate - Duplicate lead",
    "qualified - Lead qualified",
    "proposal_sent - Proposal sent",
    "won - Deal won",
    "lost - Deal lost",
    "expired - Lead expired",
    "commission_eligible - Commission eligible"
  ],

  commissionModels: [
    "fixed - Fixed amount per lead",
    "percentage - Percentage of deal value",
    "recurring_revenue_share - Recurring revenue share",
    "tier_based - Tier-based commission",
    "milestone_based - Milestone-based payout",
    "performance_bonus - Performance bonus"
  ],

  tierLevels: [
    "registered - Entry-level partner",
    "silver - Mid-tier partner",
    "gold - High-tier partner",
    "platinum - Top-tier partner",
    "strategic - Strategic partner",
    "certified - Certified partner",
    "authorized - Authorized partner"
  ],

  useCases: {
    agencyPartner: {
      title: "APPNEURAL Agency Partner Program",
      flow: [
        "Agency applies to program",
        "Documents verified",
        "Partner agreement signed",
        "Sales resources shared",
        "Agency submits leads",
        "Deals tracked",
        "Commission paid"
      ]
    },
    trainingInstitute: {
      title: "Training Institute Partner",
      flow: [
        "Institute onboarded",
        "Training program assigned",
        "Students enrolled",
        "Certificates issued",
        "Revenue share calculated",
        "Partner report generated"
      ]
    },
    technologyPartner: {
      title: "Technology Partner",
      flow: [
        "AI/payment/cloud provider added",
        "Integration validated",
        "Joint solution created",
        "Co-marketing campaign launched",
        "Usage tracked"
      ]
    },
    affiliatePartner: {
      title: "Affiliate Partner",
      flow: [
        "Affiliate receives link",
        "Promotes free tool",
        "Leads captured",
        "Paid conversion tracked",
        "Commission calculated"
      ]
    }
  },

  examples: {
    createPartner: {
      title: "Create Agency Partner",
      request: {
        method: "POST",
        path: "/partners",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": "demo-tenant",
          "x-user-id": "admin-user",
          "x-role": "admin"
        },
        body: {
          name: "TechSol Digital Agency",
          type: "agency",
          email: "rahul@techsol.in",
          programId: "program_agency",
          contactPerson: "Rahul Sharma",
          phone: "+91 98765 43210",
          city: "Mumbai",
          state: "Maharashtra",
          country: "India",
          description: "Leading digital agency specializing in website development",
          tags: ["agency", "website", "ai"]
        }
      }
    },
    submitLead: {
      title: "Submit Partner Lead",
      request: {
        method: "POST",
        path: "/leads",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": "demo-tenant",
          "x-user-id": "partner_techsol",
          "x-role": "partner"
        },
        body: {
          partnerId: "partner_techsol",
          programId: "program_agency",
          source: "referral",
          customerName: "Vikram Singh",
          customerEmail: "vikram@mnccorp.com",
          customerPhone: "+91 99887 76655",
          company: "MNC Corporation",
          description: "Enterprise website redesign and AI chatbot",
          dealValue: 250000,
          tags: ["enterprise", "website"]
        }
      }
    },
    calculateCommission: {
      title: "Calculate Commission",
      request: {
        method: "POST",
        path: "/commissions/calculate",
        body: {
          dealId: "deal_startup_mvp"
        }
      },
      response: {
        id: "commission_startup",
        partnerId: "partner_techsol",
        dealValue: 120000,
        commissionRate: 15,
        commissionAmount: 18000,
        status: "calculated"
      }
    }
  }
};

export function getDocs() {
  return docs;
}

export function getDocsHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>${docs.title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    h2 { color: #666; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    h3 { color: #888; }
    .endpoint { background: #f9f9f9; padding: 15px; margin: 10px 0; border-left: 4px solid #007bff; }
    .method { display: inline-block; padding: 5px 10px; font-weight: bold; color: white; border-radius: 3px; }
    .method.GET { background: #28a745; }
    .method.POST { background: #007bff; }
    .method.PATCH { background: #ffc107; color: #333; }
    .method.DELETE { background: #dc3545; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #f4f4f4; }
  </style>
</head>
<body>
  <h1>${docs.title}</h1>
  <p>${docs.description}</p>

  <h2>Authentication</h2>
  <p>${docs.authentication.description}</p>
  <table>
    <tr><th>Header</th><th>Description</th><th>Example</th></tr>
    ${docs.authentication.headers.map(h => `
      <tr><td><code>${h.name}</code></td><td>${h.description}</td><td><code>${h.example}</code></td></tr>
    `).join('')}
  </table>

  <h2>Endpoints</h2>
  ${docs.endpoints.map(e => `
    <div class="endpoint">
      <span class="method ${e.method}">${e.method}</span>
      <strong>${e.path}</strong>
      <p>${e.description}</p>
      ${e.query ? `<p><strong>Query Parameters:</strong></p><ul>${e.query.map(q => `<li><code>${q.name}</code>: ${q.description}</li>`).join('')}</ul>` : ''}
    </div>
  `).join('')}

  <h2>Partner Types</h2>
  <ul>
    ${docs.partnerTypes.map(t => `<li>${t}</li>`).join('')}
  </ul>

  <h2>Partner Statuses</h2>
  <ul>
    ${docs.partnerStatuses.map(s => `<li>${s}</li>`).join('')}
  </ul>

  <h2>Lead Statuses</h2>
  <ul>
    ${docs.leadStatuses.map(s => `<li>${s}</li>`).join('')}
  </ul>

  <h2>Commission Models</h2>
  <ul>
    ${docs.commissionModels.map(m => `<li>${m}</li>`).join('')}
  </ul>

  <h2>Tier Levels</h2>
  <ul>
    ${docs.tierLevels.map(t => `<li>${t}</li>`).join('')}
  </ul>
</body>
</html>`;
}
