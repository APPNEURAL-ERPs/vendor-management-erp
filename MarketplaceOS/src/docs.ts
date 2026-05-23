export function docs() {
  return {
    name: "MarketplaceOS",
    version: "1.0.0",
    description: "MarketplaceOS: ecosystem distribution engine for publishing, discovering, buying, installing, licensing, reviewing, and managing OS modules, tools, templates, workflows, agents, connectors, plugins, themes, APIs, datasets, prompts, and service packs.",
    auth: {
      headers: {
        "x-role": "owner | admin | marketplace_admin | seller | buyer | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      marketplace: "Central hub for discovering and managing all marketplace items",
      listing: "A publishable item in the marketplace (module, tool, template, workflow, agent, etc.)",
      seller: "Creator or vendor who publishes listings and earns revenue",
      buyer: "Customer who purchases and installs marketplace items",
      order: "Record of a purchase transaction",
      license: "Usage rights granted after purchase",
      install: "Instance of a listing installed in a tenant workspace",
      review: "Buyer feedback and rating for a listing",
      payout: "Revenue transfer to a seller",
      commission: "Platform fee structure for marketplace transactions"
    },
    listingTypes: {
      module: "OS modules and extensions",
      tool: "Reusable tools and utilities",
      template: "Website, document, and workflow templates",
      workflow: "Automation workflow packs",
      agent: "AI agents and assistants",
      connector: "External system integrations",
      plugin: "Platform extensibility extensions",
      theme: "UI and brand customization packs",
      api: "API services and endpoints",
      dataset: "Data packs and reusable datasets",
      prompt: "Reusable AI prompts",
      service: "Implementation and service packages",
      "micro-erp": "Industry-specific ERP packs",
      other: "Miscellaneous items"
    },
    pricingModels: {
      free: "No cost",
      one_time: "Single payment",
      subscription: "Recurring payment (monthly/yearly)",
      credit: "Credit-based usage",
      usage: "Usage-based billing",
      enterprise: "Custom enterprise pricing"
    },
    examples: {
      createListing: {
        method: "POST",
        path: "/marketplaceos/listings",
        headers: { "x-role": "seller" },
        body: {
          key: "invoice-reminder-workflow",
          name: "Invoice Reminder Workflow Pack",
          type: "workflow",
          description: "Automated invoice collection with email, WhatsApp, and escalation workflows",
          sellerId: "seller_partner_tech",
          pricing: { type: "one_time", amount: 1999, currency: "INR" },
          tags: ["invoice", "reminder", "automation"],
          version: "1.0.0"
        }
      },
      searchListings: {
        method: "GET",
        path: "/marketplaceos/listings?search=invoice&categoryId=cat_workflows",
        headers: { "x-role": "buyer" }
      },
      createOrder: {
        method: "POST",
        path: "/marketplaceos/orders",
        headers: { "x-role": "buyer" },
        body: {
          listingId: "listing_invoice_workflow",
          quantity: 1
        }
      },
      createReview: {
        method: "POST",
        path: "/marketplaceos/reviews",
        headers: { "x-role": "buyer" },
        body: {
          listingId: "listing_invoice_workflow",
          rating: 5,
          title: "Great workflow pack!",
          content: "This has saved us hours of manual follow-ups.",
          pros: ["Easy to install", "Clear documentation"],
          cons: []
        }
      },
      installListing: {
        method: "POST",
        path: "/marketplaceos/installs",
        headers: { "x-role": "buyer" },
        body: {
          listingId: "listing_careeros",
          licenseId: "license_xxx",
          tenantId: "my-tenant",
          config: {}
        }
      }
    }
  };
}
