import { LicenseState } from "./domain";
import { emptyState } from "./core/datastore";
import { nowIso, plusDays, plusMonths, generateLicenseKey } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): LicenseState {
  const state = emptyState();
  const createdAt = nowIso();

  state.licenses.push(
    {
      id: "lic_careeros_pro_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "LIC-CAREEROS-2026-0001",
      name: "CareerOS Pro for ABC Corp",
      description: "Professional CareerOS license for ABC Corp recruitment team",
      type: "module",
      status: "active",
      plan: "pro",
      ownerId: "tenant_abc",
      ownerType: "tenant",
      seats: { total: 10, used: 7, available: 3 },
      quotas: {
        monthly: 100,
        daily: 20,
        api: 10000,
        storage: 5,
        workflowRuns: 500,
        agentRuns: 100
      },
      entitlements: ["careeros.resume_builder", "careeros.jd_matcher", "careeros.pdf_export"],
      pricing: {
        model: "subscription",
        amount: 99,
        currency: "USD",
        interval: "monthly"
      },
      startDate: plusDays(-30),
      expiryDate: plusDays(30),
      activatedAt: plusDays(-30),
      metadata: {},
      tags: ["careeros", "pro", "recruitment"],
      createdBy: "admin_user",
      activatedBy: "admin_user"
    },
    {
      id: "lic_toolos_trial_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "LIC-TOOLOS-2026-0002",
      name: "ToolOS ATS Checker Trial",
      description: "14-day trial for ATS Checker tool",
      type: "tool",
      status: "trial",
      plan: "free",
      ownerId: "user_demo",
      ownerType: "user",
      seats: { total: 1, used: 1, available: 0 },
      quotas: {
        monthly: 3,
        daily: 1,
        api: 100,
        storage: 0,
        workflowRuns: 0,
        agentRuns: 0
      },
      entitlements: ["toolos.ats_checker"],
      pricing: {
        model: "free",
        trialDays: 14
      },
      startDate: plusDays(-7),
      expiryDate: plusDays(7),
      metadata: {},
      tags: ["toolos", "trial", "ats_checker"],
      createdBy: "demo_user",
      activatedBy: "demo_user"
    },
    {
      id: "lic_api_jdmatch_003",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "LIC-API-2026-0003",
      name: "JD Matcher API - Developer Plan",
      description: "API access for JD Matcher with 100k calls/month",
      type: "api",
      status: "active",
      plan: "business",
      ownerId: "tenant_xyz",
      ownerType: "tenant",
      seats: { total: 3, used: 2, available: 1 },
      quotas: {
        monthly: 100000,
        daily: 5000,
        api: 100000,
        storage: 10,
        workflowRuns: 0,
        agentRuns: 0
      },
      entitlements: ["careeros.jd_matcher", "careeros.api_access"],
      pricing: {
        model: "subscription",
        amount: 299,
        currency: "USD",
        interval: "monthly"
      },
      startDate: plusDays(-60),
      expiryDate: plusDays(305),
      activatedAt: plusDays(-60),
      metadata: {},
      tags: ["api", "jd_matcher", "business"],
      createdBy: "admin_user",
      activatedBy: "admin_user"
    },
    {
      id: "lic_expired_004",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "LIC-LEARNINGOS-2025-0004",
      name: "LearningOS Institute - Expired",
      description: "Expired LearningOS license for Training Institute",
      type: "module",
      status: "expired",
      plan: "pro",
      ownerId: "tenant_institute",
      ownerType: "tenant",
      seats: { total: 25, used: 0, available: 25 },
      quotas: {
        monthly: 500,
        daily: 50,
        api: 50000,
        storage: 20,
        workflowRuns: 1000,
        agentRuns: 200
      },
      entitlements: ["learningos.course_builder", "learningos.certificate_gen"],
      pricing: {
        model: "subscription",
        amount: 199,
        currency: "USD",
        interval: "monthly"
      },
      startDate: plusDays(-365),
      expiryDate: plusDays(-5),
      metadata: {},
      tags: ["learningos", "expired", "institute"],
      createdBy: "admin_user"
    },
    {
      id: "lic_suspended_005",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "LIC-BILLINGOS-2026-0005",
      name: "BillingOS Enterprise - Suspended",
      description: "Suspended due to payment failure",
      type: "module",
      status: "suspended",
      plan: "enterprise",
      ownerId: "tenant_enterprise",
      ownerType: "tenant",
      seats: { total: 50, used: 48, available: 2 },
      quotas: {
        monthly: 1000,
        daily: 100,
        api: 200000,
        storage: 50,
        workflowRuns: 5000,
        agentRuns: 1000
      },
      entitlements: [
        "billingos.invoice_gen",
        "billingos.payment_processor",
        "billingos.reporting",
        "billingos.api_access"
      ],
      pricing: {
        model: "subscription",
        amount: 999,
        currency: "USD",
        interval: "monthly"
      },
      startDate: plusDays(-180),
      expiryDate: plusDays(15),
      activatedAt: plusDays(-180),
      metadata: { suspensionReason: "payment_failed" },
      tags: ["billingos", "suspended", "enterprise"],
      createdBy: "admin_user",
      activatedBy: "admin_user",
      suspendedBy: "system"
    }
  );

  state.licenseKeys.push(
    {
      id: "key_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      licenseId: "lic_careeros_pro_001",
      key: "LIC-CAREEROS-2026-0001",
      keyHash: "***redacted***",
      status: "active",
      createdBy: "admin_user"
    },
    {
      id: "key_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      licenseId: "lic_api_jdmatch_003",
      key: "sk_abc123xyz789...",
      keyHash: "***redacted***",
      status: "active",
      expiresAt: plusDays(305),
      createdBy: "admin_user"
    }
  );

  state.entitlements.push(
    {
      id: "ent_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      licenseId: "lic_careeros_pro_001",
      key: "careeros.resume_builder",
      name: "Resume Builder",
      description: "Access to resume building tools",
      type: "module",
      resourceKey: "careeros",
      status: "active",
      createdBy: "admin_user"
    },
    {
      id: "ent_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      licenseId: "lic_careeros_pro_001",
      key: "careeros.jd_matcher",
      name: "JD Matcher",
      description: "Job description matching tool",
      type: "tool",
      resourceKey: "jd_matcher",
      status: "active",
      limits: { monthly: 100, daily: 20 },
      createdBy: "admin_user"
    },
    {
      id: "ent_003",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      licenseId: "lic_careeros_pro_001",
      key: "careeros.pdf_export",
      name: "PDF Export",
      description: "Export reports to PDF",
      type: "feature",
      status: "active",
      createdBy: "admin_user"
    }
  );

  state.seats.push(
    {
      id: "seat_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      licenseId: "lic_careeros_pro_001",
      userId: "user_recruiter_1",
      seatType: "recruiter",
      status: "assigned",
      assignedAt: plusDays(-25),
      assignedBy: "admin_user"
    },
    {
      id: "seat_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      licenseId: "lic_careeros_pro_001",
      userId: "user_recruiter_2",
      seatType: "recruiter",
      status: "assigned",
      assignedAt: plusDays(-20),
      assignedBy: "admin_user"
    },
    {
      id: "seat_003",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      licenseId: "lic_careeros_pro_001",
      userId: "user_recruiter_3",
      seatType: "recruiter",
      status: "assigned",
      assignedAt: plusDays(-15),
      assignedBy: "admin_user"
    }
  );

  state.quotas.push(
    {
      id: "quota_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      licenseId: "lic_careeros_pro_001",
      quotaType: "monthly",
      limit: 100,
      used: 67,
      remaining: 33,
      status: "within_limit",
      resetAt: plusDays(30),
      overageAllowed: false,
      createdBy: "admin_user"
    },
    {
      id: "quota_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      licenseId: "lic_api_jdmatch_003",
      quotaType: "api",
      limit: 100000,
      used: 45678,
      remaining: 54322,
      status: "within_limit",
      resetAt: plusDays(30),
      overageAllowed: true,
      overageCost: 0.001,
      createdBy: "admin_user"
    }
  );

  state.usageRecords.push(
    {
      id: "usage_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      licenseId: "lic_careeros_pro_001",
      userId: "user_recruiter_1",
      resourceType: "tool",
      resourceId: "tool_jd_matcher",
      action: "jd_matcher.run",
      quantity: 1,
      unit: "run",
      cost: 0,
      metadata: { query: "Senior Developer Position", matches: 15 },
      recordedBy: "system"
    },
    {
      id: "usage_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      licenseId: "lic_careeros_pro_001",
      userId: "user_recruiter_2",
      resourceType: "export",
      action: "pdf_export",
      quantity: 1,
      unit: "report",
      cost: 0,
      metadata: { format: "PDF", template: "professional" },
      recordedBy: "system"
    },
    {
      id: "usage_003",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      licenseId: "lic_api_jdmatch_003",
      resourceType: "api",
      action: "jd_matcher.api_call",
      quantity: 100,
      unit: "calls",
      cost: 0,
      metadata: { endpoint: "/api/v1/match", responseTime: 245 },
      recordedBy: "api_gateway"
    }
  );

  state.creditWallets.push({
    id: "wallet_001",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    licenseId: "lic_toolos_trial_002",
    totalCredits: 10,
    usedCredits: 3,
    availableCredits: 7,
    expiresAt: plusDays(7),
    status: "active",
    transactions: [
      {
        id: "txn_001",
        type: "topup",
        amount: 10,
        balance: 10,
        reason: "Trial credits",
        createdAt: plusDays(-7),
        createdBy: "system"
      },
      {
        id: "txn_002",
        type: "deduct",
        amount: 3,
        balance: 7,
        reason: "ATS Checker usage",
        createdAt: plusDays(-5),
        createdBy: "system"
      }
    ]
  });

  state.complianceChecks.push(
    {
      id: "comp_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      licenseId: "lic_careeros_pro_001",
      checkType: "seat_compliance",
      status: "compliant",
      severity: "low",
      description: "All assigned seats are within the 10-seat limit",
      violations: [],
      checkedAt: plusDays(-1),
      checkedBy: "system"
    },
    {
      id: "comp_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      licenseId: "lic_api_jdmatch_003",
      checkType: "api_license",
      status: "compliant",
      severity: "low",
      description: "API usage within allowed quota",
      violations: [],
      checkedAt: plusDays(-1),
      checkedBy: "system"
    }
  );

  state.renewals.push({
    id: "renewal_001",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    licenseId: "lic_careeros_pro_001",
    status: "pending",
    renewalDate: plusDays(15),
    expiryDate: plusDays(30),
    newExpiryDate: plusMonths(1),
    amount: 99,
    currency: "USD",
    createdBy: "admin_user"
  });

  state.subscriptions.push(
    {
      id: "sub_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      licenseId: "lic_careeros_pro_001",
      status: "active",
      plan: "pro",
      amount: 99,
      currency: "USD",
      interval: "monthly",
      startDate: plusDays(-30),
      currentPeriodStart: plusDays(-30),
      currentPeriodEnd: plusDays(0),
      cancelAtPeriodEnd: false,
      createdBy: "admin_user"
    },
    {
      id: "sub_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      licenseId: "lic_suspended_005",
      status: "payment_failed",
      plan: "enterprise",
      amount: 999,
      currency: "USD",
      interval: "monthly",
      startDate: plusDays(-180),
      currentPeriodStart: plusDays(-15),
      currentPeriodEnd: plusDays(15),
      cancelAtPeriodEnd: false,
      paymentFailedAt: plusDays(-3),
      createdBy: "admin_user"
    }
  );

  state.trials.push({
    id: "trial_001",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    licenseId: "lic_toolos_trial_002",
    startDate: plusDays(-7),
    endDate: plusDays(7),
    features: ["ats_checker.basic_reports"],
    usageLimits: {
      reports: 3,
      apiCalls: 100
    },
    convertedToPaid: false,
    createdBy: "demo_user"
  });

  state.policies.push(
    {
      id: "policy_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      policyType: "seat_sharing",
      name: "No Seat Sharing",
      description: "Seats cannot be shared among multiple users",
      rules: ["One user per seat", "Seats are non-transferable without admin approval"],
      enforcement: "block",
      status: "active",
      createdBy: "admin_user"
    },
    {
      id: "policy_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      policyType: "api_key_sharing",
      name: "API Key Security",
      description: "API keys must not be publicly shared or embedded in client-side code",
      rules: ["Keys are server-side only", "Keys must be rotated every 90 days"],
      enforcement: "alert",
      status: "active",
      createdBy: "admin_user"
    }
  );

  state.events.push({
    id: "event_001",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "licenseos.seeded",
    source: "LicenseOS",
    data: { message: "LicenseOS demo data seeded" },
    licenseId: "lic_careeros_pro_001"
  });

  state.auditLogs.push({
    id: "audit_001",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    actorId: "admin_user",
    role: "admin",
    action: "license.created",
    entityType: "License",
    entityId: "lic_careeros_pro_001",
    after: { name: "CareerOS Pro for ABC Corp", status: "draft" }
  });

  return state;
}
