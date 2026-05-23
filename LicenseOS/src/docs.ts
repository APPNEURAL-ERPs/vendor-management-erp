export function docs() {
  return {
    name: "LicenseOS",
    version: "1.0.0",
    description: "Software licenses, entitlements, usage tracking, compliance, renewals, and license lifecycle.",
    auth: {
      headers: {
        "x-role": "owner | admin | license_admin | license_manager | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      license: "A software license granting access to modules, tools, APIs, or resources with defined quotas and entitlements.",
      entitlement: "A specific permission or capability granted by a license (e.g., access to CareerOS, JD Matcher tool).",
      seat: "A user slot within a license, allocated to specific users for access.",
      quota: "Usage limits for resources like API calls, storage, workflow runs, or agent executions.",
      usageRecord: "A log entry tracking resource consumption for billing and analytics.",
      complianceCheck: "Verification that license usage adheres to terms, policies, and legal requirements.",
      renewal: "Process of extending a license's expiry date with updated terms."
    },
    examples: {
      createLicense: {
        method: "POST",
        path: "/licenseos/licenses",
        headers: { "x-role": "license_admin" },
        body: {
          name: "CareerOS Pro for ABC Corp",
          type: "module",
          plan: "pro",
          ownerId: "tenant_abc",
          ownerType: "tenant",
          seats: { total: 10 },
          entitlements: ["careeros.resume_builder", "careeros.jd_matcher"],
          pricing: { model: "subscription", amount: 99, currency: "USD", interval: "monthly" }
        }
      },
      validateLicense: {
        method: "POST",
        path: "/licenseos/licenses/:id/validate",
        headers: { "x-role": "license_manager" },
        body: { userId: "user_123", action: "access", resource: "careeros.jd_matcher" }
      },
      assignSeat: {
        method: "POST",
        path: "/licenseos/licenses/:id/seats",
        headers: { "x-role": "license_admin" },
        body: { userId: "user_456", seatType: "recruiter" }
      },
      recordUsage: {
        method: "POST",
        path: "/licenseos/usage",
        headers: { "x-role": "license_manager" },
        body: { licenseId: "lic_789", resourceType: "tool", action: "jd_matcher.run", quantity: 1 }
      },
      checkCompliance: {
        method: "POST",
        path: "/licenseos/licenses/:id/compliance",
        headers: { "x-role": "license_admin" },
        body: { checkType: "seat_compliance" }
      }
    },
    licenseStatuses: {
      draft: "License created but not yet activated",
      active: "License is currently active and in use",
      trial: "Trial license with limited duration",
      expired: "License has passed its expiry date",
      suspended: "License temporarily suspended (e.g., payment failure)",
      cancelled: "License cancelled by owner or admin",
      revoked: "License revoked due to policy violation",
      renewed: "License has been renewed",
      archived: "License archived after expiry or cancellation"
    },
    plans: {
      free: "Free tier with basic features and limited quotas",
      starter: "Entry-level paid plan with essential features",
      pro: "Professional plan with advanced features and higher quotas",
      business: "Business plan with team features and priority support",
      enterprise: "Enterprise plan with custom features, SLAs, and unlimited usage"
    }
  };
}
