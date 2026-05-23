import { MarketplaceState, MarketplaceCategory, MarketplaceSeller, MarketplaceListing, MarketplaceBuyer, MarketplaceReview } from "./domain";
import { emptyState } from "./core/datastore";
import { nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): MarketplaceState {
  const state = emptyState();
  const createdAt = nowIso();

  state.categories.push(
    {
      id: "cat_os_modules",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "os_modules",
      name: "OS Modules",
      description: "Operating system modules and extensions",
      status: "active",
      sortOrder: 1,
      icon: "cpu",
      metadata: {}
    },
    {
      id: "cat_tools",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "tools",
      name: "Tools",
      description: "Reusable tools and utilities",
      status: "active",
      sortOrder: 2,
      icon: "wrench",
      metadata: {}
    },
    {
      id: "cat_templates",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "templates",
      name: "Templates",
      description: "Website, document, and workflow templates",
      status: "active",
      sortOrder: 3,
      icon: "file-text",
      metadata: {}
    },
    {
      id: "cat_workflows",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "workflows",
      name: "Workflows",
      description: "Automation workflow packs",
      status: "active",
      sortOrder: 4,
      icon: "git-branch",
      metadata: {}
    },
    {
      id: "cat_agents",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "agents",
      name: "AI Agents",
      description: "AI agents and assistants",
      status: "active",
      sortOrder: 5,
      icon: "bot",
      metadata: {}
    }
  );

  state.sellers.push(
    {
      id: "seller_appneural",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "appneural",
      name: "APPNEURAL",
      email: "team@appneural.com",
      status: "active",
      type: "internal",
      website: "https://appneural.com",
      logo: "https://appneural.com/logo.png",
      bio: "Official APPNEURAL ecosystem publisher",
      totalRevenue: 125000,
      totalPayouts: 100000,
      pendingPayouts: 15000,
      rating: 4.8,
      reviewCount: 234,
      listingCount: 45,
      verified: true,
      commission: { rate: 0.2, minAmount: 100 },
      metadata: {}
    },
    {
      id: "seller_partner_tech",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "partner_tech",
      name: "TechPartner Solutions",
      email: "contact@techpartner.io",
      status: "active",
      type: "partner",
      website: "https://techpartner.io",
      bio: "Enterprise automation partner",
      totalRevenue: 78000,
      totalPayouts: 62000,
      pendingPayouts: 8500,
      rating: 4.6,
      reviewCount: 156,
      listingCount: 28,
      verified: true,
      commission: { rate: 0.2, minAmount: 100 },
      metadata: {}
    },
    {
      id: "seller_dev_agency",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "dev_agency",
      name: "DevAgency Studio",
      email: "hello@devagency.co",
      status: "active",
      type: "agency",
      website: "https://devagency.co",
      bio: "Web development and design agency",
      totalRevenue: 45000,
      totalPayouts: 36000,
      pendingPayouts: 5000,
      rating: 4.5,
      reviewCount: 89,
      listingCount: 15,
      verified: true,
      commission: { rate: 0.2, minAmount: 100 },
      metadata: {}
    }
  );

  state.listings.push(
    {
      id: "listing_careeros",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "careeros",
      name: "CareerOS Starter Kit",
      description: "Complete career management system with resume builder, JD matcher, and ATS checker",
      categoryId: "cat_os_modules",
      sellerId: "seller_appneural",
      status: "published",
      type: "module",
      tags: ["career", "resume", "ATS", "job"],
      pricing: { type: "subscription", amount: 499, currency: "INR", interval: "monthly" },
      compatibility: { minVersion: "2.0", requiredOs: ["PlatformOS"] },
      media: [
        { type: "screenshot", url: "https://example.com/careeros-1.png", caption: "Dashboard" },
        { type: "screenshot", url: "https://example.com/careeros-2.png", caption: "Resume Builder" }
      ],
      version: "2.1.0",
      license: "marketplace_paid",
      supportPolicy: "Email support within 24 hours",
      refundPolicy: "7-day money-back guarantee",
      installInstructions: "One-click install from marketplace",
      rating: 4.7,
      reviewCount: 156,
      installCount: 2340,
      purchaseCount: 890,
      isFeatured: true,
      isTrending: true,
      metadata: {}
    },
    {
      id: "listing_ats_checker",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "ats_checker",
      name: "ATS Resume Checker",
      description: "AI-powered ATS score checker with actionable improvement suggestions",
      categoryId: "cat_tools",
      sellerId: "seller_appneural",
      status: "published",
      type: "tool",
      tags: ["ATS", "resume", "AI", "hiring"],
      pricing: { type: "credit", amount: 50, currency: "credits" },
      media: [{ type: "screenshot", url: "https://example.com/ats-1.png", caption: "Score Dashboard" }],
      version: "1.5.0",
      license: "marketplace_paid",
      supportPolicy: "In-app chat support",
      rating: 4.9,
      reviewCount: 412,
      installCount: 5670,
      purchaseCount: 2340,
      isFeatured: true,
      isTrending: false,
      metadata: {}
    },
    {
      id: "listing_invoice_workflow",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "invoice_workflow",
      name: "Invoice Reminder Workflow Pack",
      description: "Automated invoice collection with email, WhatsApp, and escalation workflows",
      categoryId: "cat_workflows",
      sellerId: "seller_partner_tech",
      status: "published",
      type: "workflow",
      tags: ["invoice", "reminder", "automation", "billing"],
      pricing: { type: "one_time", amount: 1999, currency: "INR" },
      compatibility: { requiredOs: ["WorkflowOS", "NotificationOS", "BillingOS"] },
      media: [
        { type: "screenshot", url: "https://example.com/invoice-workflow-1.png", caption: "Workflow Overview" }
      ],
      version: "2.0.0",
      license: "marketplace_paid",
      rating: 4.6,
      reviewCount: 78,
      installCount: 1200,
      purchaseCount: 450,
      isFeatured: false,
      isTrending: true,
      metadata: {}
    },
    {
      id: "listing_agency_template",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "agency_template",
      name: "Agency Website Template",
      description: "Professional agency website with case studies, services, and contact forms",
      categoryId: "cat_templates",
      sellerId: "seller_dev_agency",
      status: "published",
      type: "template",
      tags: ["agency", "website", "portfolio", "business"],
      pricing: { type: "one_time", amount: 2999, currency: "INR" },
      media: [{ type: "screenshot", url: "https://example.com/agency-1.png", caption: "Home Page" }],
      version: "3.1.0",
      license: "marketplace_paid",
      rating: 4.5,
      reviewCount: 45,
      installCount: 890,
      purchaseCount: 320,
      isFeatured: false,
      isTrending: false,
      metadata: {}
    },
    {
      id: "listing_support_agent",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "support_agent",
      name: "AI Support Agent",
      description: "Intelligent customer support agent with knowledge base integration",
      categoryId: "cat_agents",
      sellerId: "seller_appneural",
      status: "published",
      type: "agent",
      tags: ["support", "AI", "chatbot", "automation"],
      pricing: { type: "subscription", amount: 799, currency: "INR", interval: "monthly" },
      compatibility: { requiredOs: ["AIOS", "NotificationOS"] },
      media: [{ type: "demo", url: "https://example.com/support-agent-demo.mp4", caption: "Demo Video" }],
      version: "1.0.0",
      license: "marketplace_paid",
      rating: 4.8,
      reviewCount: 123,
      installCount: 567,
      purchaseCount: 234,
      isFeatured: true,
      isTrending: true,
      metadata: {}
    }
  );

  state.buyers.push(
    {
      id: "buyer_tenant_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      userId: "user_tenant_admin_1",
      email: "admin@company1.com",
      name: "Company1 Admin",
      organization: "Company1 Solutions",
      purchaseCount: 12,
      totalSpent: 15999,
      licenseCount: 8,
      wishlist: ["listing_invoice_workflow"],
      metadata: {}
    },
    {
      id: "buyer_tenant_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      userId: "user_tenant_admin_2",
      email: "admin@traininghub.in",
      name: "TrainingHub Admin",
      organization: "TrainingHub Institute",
      purchaseCount: 8,
      totalSpent: 8999,
      licenseCount: 5,
      wishlist: ["listing_careeros"],
      metadata: {}
    }
  );

  state.reviews.push(
    {
      id: "review_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      listingId: "listing_careeros",
      buyerId: "buyer_tenant_1",
      orderId: "order_1",
      rating: 5,
      title: "Excellent career tool!",
      content: "CareerOS has transformed our hiring process. The ATS checker is incredibly accurate.",
      status: "approved",
      verified: true,
      helpful: 45,
      pros: ["Easy to use", "Accurate ATS scoring", "Great support"],
      cons: [],
      version: "2.1.0",
      metadata: {}
    },
    {
      id: "review_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      listingId: "listing_ats_checker",
      buyerId: "buyer_tenant_2",
      orderId: "order_2",
      rating: 5,
      title: "Must have for job seekers",
      content: "This tool helped me improve my resume score from 60% to 95%!",
      status: "approved",
      verified: true,
      helpful: 123,
      version: "1.5.0",
      metadata: {}
    }
  );

  state.commissions.push({
    id: "commission_standard",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    sellerId: "seller_appneural",
    rate: 0.2,
    type: "standard",
    minAmount: 100,
    validFrom: createdAt,
    metadata: {}
  });

  state.events.push({
    id: "event_marketplace_bootstrap",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "marketplace.seeded",
    source: "MarketplaceOS",
    data: { message: "MarketplaceOS demo data seeded" }
  });

  return state;
}
