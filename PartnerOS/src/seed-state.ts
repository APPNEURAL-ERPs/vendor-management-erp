import { PartnerState } from "./domain";
import { emptyState } from "./core/datastore";
import { nowIso, newId } from "./core/id";
import { generateReferralCode } from "./core/utils";

export function createSeedState(tenantId = "demo-tenant"): PartnerState {
  const state = emptyState();
  const createdAt = nowIso();

  state.programs.push(
    {
      id: "program_agency",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "agency_partner_program",
      name: "APPNEURAL Agency Partner Program",
      type: "agency",
      description: "Refer clients and sell APPNEURAL services. Earn commission or delivery share.",
      status: "active",
      benefits: [
        "Access to sales materials and templates",
        "Priority lead referrals",
        "Co-marketing opportunities",
        "Training and certification",
        "Dedicated account manager"
      ],
      requirements: [
        "Minimum 2 successful client referrals",
        "Complete onboarding training",
        "Sign partnership agreement",
        "Attend quarterly business reviews"
      ],
      commissionModel: "percentage",
      defaultCommissionRate: 15,
      tierEnabled: true,
      tierIds: [],
      tags: ["agency", "referral", "reseller"],
      metadata: {},
      startDate: createdAt,
      createdBy: "seed"
    },
    {
      id: "program_affiliate",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "affiliate_program",
      name: "APPNEURAL Affiliate Program",
      type: "affiliate",
      description: "Earn commissions by promoting APPNEURAL tools and services through referral links.",
      status: "active",
      benefits: [
        "Competitive commission rates",
        "Real-time tracking dashboard",
        "Marketing assets library",
        "Performance bonuses",
        "Monthly payouts"
      ],
      requirements: [
        "Valid website or social presence",
        "Agree to affiliate terms",
        "Use approved marketing methods"
      ],
      commissionModel: "percentage",
      defaultCommissionRate: 10,
      tierEnabled: true,
      tierIds: [],
      tags: ["affiliate", "referral", "online"],
      metadata: {},
      startDate: createdAt,
      createdBy: "seed"
    },
    {
      id: "program_implementation",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "implementation_partner_program",
      name: "APPNEURAL Implementation Partner Program",
      type: "implementation",
      description: "Certified partners for delivering APPNEURAL solutions to clients.",
      status: "active",
      benefits: [
        "Technical certification",
        "Implementation toolkit",
        "Priority project referrals",
        "Delivery support",
        "Revenue share on projects"
      ],
      requirements: [
        "Pass technical certification",
        "Maintain quality standards",
        "Complete onboarding",
        "Deliver minimum projects"
      ],
      commissionModel: "recurring_revenue_share",
      defaultCommissionRate: 20,
      tierEnabled: true,
      tierIds: [],
      tags: ["implementation", "technical", "delivery"],
      metadata: {},
      startDate: createdAt,
      createdBy: "seed"
    }
  );

  state.tiers.push(
    {
      id: "tier_registered",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "registered_partner",
      name: "Registered Partner",
      programId: "program_agency",
      level: "registered",
      description: "Entry-level partner with basic benefits",
      benefits: ["Access to basic resources", "Email support", "Standard commission rates"],
      requirements: ["Complete registration", "Sign agreement"],
      commissionMultiplier: 1.0,
      status: "active",
      badgeColor: "#808080",
      createdBy: "seed"
    },
    {
      id: "tier_silver",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "silver_partner",
      name: "Silver Partner",
      programId: "program_agency",
      level: "silver",
      description: "Mid-level partner with enhanced benefits",
      benefits: ["Priority support", "Enhanced commission rates", "Marketing assistance"],
      requirements: ["5+ referrals", "Complete training", "Good performance"],
      minRevenue: 100000,
      minLeads: 10,
      commissionMultiplier: 1.2,
      status: "active",
      badgeColor: "#C0C0C0",
      createdBy: "seed"
    },
    {
      id: "tier_gold",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "gold_partner",
      name: "Gold Partner",
      programId: "program_agency",
      level: "gold",
      description: "Top-tier partner with premium benefits",
      benefits: ["Dedicated account manager", "Premium commission rates", "Co-marketing opportunities", "Early access to features"],
      requirements: ["25+ referrals", "Complete advanced training", "Excellent performance"],
      minRevenue: 500000,
      minLeads: 50,
      minDeals: 15,
      commissionMultiplier: 1.5,
      status: "active",
      badgeColor: "#FFD700",
      createdBy: "seed"
    }
  );

  state.partners.push(
    {
      id: "partner_techsol",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "techsol_agency",
      name: "TechSol Digital Agency",
      type: "agency",
      status: "active",
      tierId: "tier_gold",
      programId: "program_agency",
      contactPerson: "Rahul Sharma",
      email: "rahul@techsol.in",
      phone: "+91 98765 43210",
      website: "https://techsol.in",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      description: "Leading digital agency specializing in website development and AI solutions",
      tags: ["agency", "website", "ai", "digital"],
      metadata: {},
      referralCode: generateReferralCode(),
      commissionModel: "percentage",
      commissionRate: 15,
      revenueGenerated: 650000,
      leadsSubmitted: 45,
      dealsWon: 12,
      activeSince: createdAt,
      lastActivityAt: createdAt,
      healthScore: 85,
      createdBy: "seed"
    },
    {
      id: "partner_cloudpro",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "cloudpro_solutions",
      name: "CloudPro Solutions",
      type: "technology",
      status: "active",
      tierId: "tier_silver",
      programId: "program_implementation",
      contactPerson: "Priya Patel",
      email: "priya@cloudpro.tech",
      phone: "+91 87654 32109",
      website: "https://cloudpro.tech",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      description: "Cloud infrastructure and deployment specialists",
      tags: ["technology", "cloud", "deployment", "infrastructure"],
      metadata: {},
      referralCode: generateReferralCode(),
      commissionModel: "recurring_revenue_share",
      commissionRate: 20,
      revenueGenerated: 320000,
      leadsSubmitted: 28,
      dealsWon: 8,
      activeSince: createdAt,
      lastActivityAt: createdAt,
      healthScore: 78,
      createdBy: "seed"
    },
    {
      id: "partner_learnit",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "learnit_institute",
      name: "LearnIt Training Institute",
      type: "training_institute",
      status: "active",
      tierId: "tier_registered",
      programId: "program_agency",
      contactPerson: "Anita Desai",
      email: "anita@learnit.edu",
      phone: "+91 76543 21098",
      website: "https://learnit.edu",
      city: "Pune",
      state: "Maharashtra",
      country: "India",
      description: "Professional training institute for software and AI courses",
      tags: ["training", "education", "courses", "certification"],
      metadata: {},
      referralCode: generateReferralCode(),
      commissionModel: "percentage",
      commissionRate: 12,
      revenueGenerated: 180000,
      leadsSubmitted: 15,
      dealsWon: 5,
      activeSince: createdAt,
      lastActivityAt: createdAt,
      healthScore: 72,
      createdBy: "seed"
    }
  );

  state.leads.push(
    {
      id: "lead_mnc_corp",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      partnerId: "partner_techsol",
      programId: "program_agency",
      source: "referral",
      customerName: "Vikram Singh",
      customerEmail: "vikram@mnccorp.com",
      customerPhone: "+91 99887 76655",
      company: "MNC Corporation",
      description: "Enterprise website redesign and AI chatbot integration",
      dealValue: 250000,
      status: "qualified",
      commissionEligible: true,
      tags: ["enterprise", "website", "ai"],
      metadata: {},
      createdBy: "partner_techsol"
    },
    {
      id: "lead_startup_io",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      partnerId: "partner_techsol",
      programId: "program_agency",
      source: "referral",
      customerName: "Neha Gupta",
      customerEmail: "neha@startup.io",
      customerPhone: "+91 88776 65544",
      company: "Startup.io",
      description: "MVP website with career portal integration",
      dealValue: 120000,
      status: "won",
      convertedAt: createdAt,
      convertedDealId: "deal_startup_mvp",
      commissionEligible: true,
      commissionAmount: 18000,
      tags: ["startup", "website", "career"],
      metadata: {},
      createdBy: "partner_techsol"
    }
  );

  state.deals.push(
    {
      id: "deal_startup_mvp",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      partnerId: "partner_techsol",
      leadId: "lead_startup_io",
      dealName: "Startup.io MVP Website",
      dealValue: 120000,
      stage: "closed_won",
      status: "won",
      closedAt: createdAt,
      partnerCommission: 18000,
      commissionPaid: true,
      createdBy: "partner_techsol"
    },
    {
      id: "deal_ecommerce_platform",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      partnerId: "partner_cloudpro",
      leadId: undefined,
      dealName: "CloudPro E-commerce Cloud Setup",
      dealValue: 350000,
      stage: "negotiation",
      status: "active",
      partnerCommission: 70000,
      commissionPaid: false,
      createdBy: "partner_cloudpro"
    }
  );

  state.commissions.push(
    {
      id: "commission_startup",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      partnerId: "partner_techsol",
      dealId: "deal_startup_mvp",
      leadId: "lead_startup_io",
      commissionType: "percentage",
      commissionRate: 15,
      dealValue: 120000,
      commissionAmount: 18000,
      status: "paid",
      paidAt: createdAt,
      payoutId: "payout_001",
      createdBy: "seed"
    }
  );

  state.payouts.push(
    {
      id: "payout_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      partnerId: "partner_techsol",
      commissionIds: ["commission_startup"],
      totalAmount: 18000,
      status: "paid",
      paymentMethod: "bank_transfer",
      bankAccount: "****4532",
      transactionId: "TXN123456",
      paidAt: createdAt,
      createdBy: "seed"
    }
  );

  state.enablements.push(
    {
      id: "enable_agency_training",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "agency_onboarding_training",
      name: "Agency Partner Onboarding Training",
      partnerId: "partner_techsol",
      type: "training",
      description: "Comprehensive onboarding program for new agency partners",
      status: "completed",
      completionDate: createdAt,
      score: 92,
      createdBy: "seed"
    },
    {
      id: "enable_cloud_cert",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "cloud_implementation_certification",
      name: "Cloud Implementation Certification",
      partnerId: "partner_cloudpro",
      type: "certification",
      description: "Technical certification for cloud deployment partners",
      status: "completed",
      completionDate: createdAt,
      score: 88,
      certificateUrl: "https://appneurox.in/certificates/cloudpro-001",
      createdBy: "seed"
    }
  );

  state.jointGTMs.push(
    {
      id: "jointgtm_cloud_ai",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "cloud_ai_integration",
      name: "Cloud-AI Integration Campaign",
      partnerIds: ["partner_cloudpro"],
      initiative: "Joint go-to-market for cloud + AI automation solutions",
      type: "joint_solution",
      status: "active",
      description: "Co-selling initiative combining CloudPro's infrastructure with APPNEURAL AI tools",
      targetRevenue: 1000000,
      actualRevenue: 350000,
      startDate: createdAt,
      activities: [
        { type: "webinar", description: "Joint webinar on AI-powered cloud solutions", date: createdAt, outcome: "50+ registrations" },
        { type: "demo", description: "Live demo session with potential clients", date: createdAt, outcome: "3 qualified leads" }
      ],
      createdBy: "seed"
    }
  );

  state.resources.push(
    {
      id: "resource_sales_deck",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "agency_sales_deck",
      name: "Agency Partner Sales Deck",
      type: "sales_deck",
      description: "Comprehensive presentation for selling APPNEURAL services",
      url: "https://appneurox.in/resources/agency-sales-deck.pdf",
      tags: ["sales", "presentation", "agency"],
      accessLevels: ["registered", "silver", "gold", "platinum"],
      createdBy: "seed"
    },
    {
      id: "resource_pricing_sheet",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "partner_pricing_sheet",
      name: "Partner Pricing Sheet",
      type: "pricing_sheet",
      description: "Standard pricing for partner-referred clients",
      url: "https://appneurox.in/resources/partner-pricing.xlsx",
      tags: ["pricing", "reference", "standard"],
      accessLevels: ["silver", "gold", "platinum"],
      createdBy: "seed"
    }
  );

  state.campaigns.push(
    {
      id: "campaign_q1_referral",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "q1_referral_bonus",
      name: "Q1 Referral Bonus Campaign",
      programId: "program_agency",
      partnerIds: ["partner_techsol", "partner_learnit"],
      type: "referral",
      status: "active",
      description: "Special bonus commission for Q1 referrals",
      budget: 100000,
      startDate: createdAt,
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      targetLeads: 20,
      targetRevenue: 500000,
      actualLeads: 8,
      actualRevenue: 180000,
      assets: [],
      createdBy: "seed"
    }
  );

  state.events.push({
    id: "event_partneros_bootstrap",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "partneros.seeded",
    source: "PartnerOS",
    data: { message: "PartnerOS demo data seeded" }
  });

  return state;
}
