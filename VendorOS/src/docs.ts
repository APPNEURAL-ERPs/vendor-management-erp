export function docs() {
  return {
    name: "VendorOS",
    version: "1.0.0",
    description: "Vendor management, relationships, performance tracking, contracts, and vendor lifecycle",
    auth: {
      headers: {
        "x-role": "owner | admin | vendor_manager | procurement | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      vendor: "External party providing goods or services to the organization",
      contract: "Formal agreement between organization and vendor",
      onboarding: "Process of adding and verifying new vendors",
      performance: "Tracking vendor delivery, quality, cost, and support metrics",
      risk: "Identified risks associated with vendor relationships"
    },
    entities: {
      Vendor: "External supplier, contractor, or service provider",
      VendorContract: "Legal agreement with vendor terms",
      VendorDocument: "KYB documents, certificates, agreements",
      VendorOnboarding: "Workflow for adding new vendors",
      VendorPerformance: "Scorecard metrics for vendor evaluation",
      VendorRisk: "Identified vendor-related risks",
      VendorInvoice: "Bills received from vendors",
      VendorPayment: "Payments made to vendors",
      VendorIssue: "Problems or complaints with vendor",
      VendorSubscription: "Recurring SaaS or service subscriptions"
    },
    examples: {
      createVendor: {
        method: "POST",
        path: "/vendoros/vendors",
        headers: { "x-role": "admin" },
        body: {
          key: "cloudflare_services",
          name: "Cloudflare Services",
          type: "cloud_provider",
          riskLevel: "low",
          services: ["CDN", "DDoS protection", "DNS"],
          contacts: [{ name: "John Doe", email: "john@cloudflare.com", isPrimary: true }]
        }
      },
      approveVendor: {
        method: "POST",
        path: "/vendoros/vendors/:id/approve",
        headers: { "x-role": "admin" },
        body: {}
      },
      recordPerformance: {
        method: "POST",
        path: "/vendoros/performance",
        headers: { "x-role": "vendor_manager" },
        body: {
          vendorId: "vendor_xxx",
          period: "2025-Q1",
          deliveryScore: 95,
          qualityScore: 88,
          costScore: 75,
          supportScore: 92
        }
      }
    }
  };
}
