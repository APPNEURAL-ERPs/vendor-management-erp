import { DataStore } from "./core/datastore";
import {
  License,
  Entitlement,
  UsageRecord,
  ComplianceCheck,
  Renewal,
  LicenseSeat,
  LicenseQuota,
  LicenseKey,
  CreditWallet,
  LicenseSubscription,
  LicenseTrial,
  LicenseAddOn,
  LicensePolicy,
  LicenseViolation,
  LicenseOverview,
  LicenseState,
  RequestActor,
  HttpContext
} from "./domain";
import { newId, nowIso, plusDays, isExpired, isExpiringSoon, daysUntilExpiry, generateLicenseKey } from "./core/id";
import { requireString, asNumber, asBoolean, notFound, badRequest, conflict } from "./core/utils";

export class LicenseService {
  constructor(private readonly store: DataStore) {}

  getLicenses(actor: RequestActor): License[] {
    return this.store.getState().licenses.filter((l) => l.tenantId === actor.tenantId);
  }

  getLicense(actor: RequestActor, licenseId: string): License {
    const license = this.store.getState().licenses.find(
      (l) => l.id === licenseId && l.tenantId === actor.tenantId
    );
    if (!license) notFound(`License ${licenseId} not found`);
    return license;
  }

  createLicense(actor: RequestActor, data: Partial<License>): License {
    if (!data.name) badRequest("License name is required");
    if (!data.type) badRequest("License type is required");
    if (!data.ownerId) badRequest("Owner ID is required");

    const existingKey = this.store.getState().licenses.find(
      (l) => l.key === data.key && l.tenantId === actor.tenantId
    );
    if (existingKey) conflict(`License with key ${data.key} already exists`);

    const now = nowIso();
    const sequence = this.store.getState().licenses.filter(
      (l) => l.tenantId === actor.tenantId && l.type === data.type
    ).length + 1;

    const license: License = {
      id: newId("lic"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key: data.key || generateLicenseKey(`LIC-${data.type?.toUpperCase() || "GEN"}`, new Date().getFullYear(), sequence),
      name: data.name,
      description: data.description,
      type: data.type || "tenant",
      status: "draft",
      plan: data.plan || "free",
      ownerId: data.ownerId,
      ownerType: data.ownerType || "tenant",
      seats: data.seats || { total: 1, used: 0, available: 1 },
      quotas: data.quotas || {
        monthly: 10,
        daily: 5,
        api: 1000,
        storage: 1,
        workflowRuns: 50,
        agentRuns: 10
      },
      entitlements: data.entitlements || [],
      pricing: data.pricing || { model: "free" },
      startDate: data.startDate || now,
      expiryDate: data.expiryDate,
      metadata: data.metadata || {},
      tags: data.tags || [],
      createdBy: actor.userId
    };

    this.store.getState().licenses.push(license);
    this.store.audit(actor, "license.created", "License", license.id, undefined, license);
    this.store.save();
    return license;
  }

  updateLicense(actor: RequestActor, licenseId: string, data: Partial<License>): License {
    const license = this.getLicense(actor, licenseId);
    const before = { ...license };
    
    if (data.name) license.name = data.name;
    if (data.description !== undefined) license.description = data.description;
    if (data.seats) license.seats = data.seats;
    if (data.quotas) license.quotas = data.quotas;
    if (data.entitlements) license.entitlements = data.entitlements;
    if (data.expiryDate) license.expiryDate = data.expiryDate;
    if (data.metadata) license.metadata = data.metadata;
    if (data.tags) license.tags = data.tags;
    
    license.updatedAt = nowIso();
    this.store.audit(actor, "license.updated", "License", licenseId, before, license);
    this.store.save();
    return license;
  }

  activateLicense(actor: RequestActor, licenseId: string): License {
    const license = this.getLicense(actor, licenseId);
    if (license.status !== "draft" && license.status !== "trial") {
      badRequest(`Cannot activate license with status ${license.status}`);
    }

    const before = { status: license.status };
    license.status = "active";
    license.activatedAt = nowIso();
    license.activatedBy = actor.userId;
    license.updatedAt = nowIso();
    
    if (!license.expiryDate && license.pricing.interval) {
      const days = license.pricing.interval === "annual" ? 365 : 30;
      license.expiryDate = plusDays(days);
    }

    this.store.audit(actor, "license.activated", "License", licenseId, before, { status: license.status });
    this.store.save();
    return license;
  }

  suspendLicense(actor: RequestActor, licenseId: string, reason?: string): License {
    const license = this.getLicense(actor, licenseId);
    if (license.status === "suspended") {
      conflict("License is already suspended");
    }
    if (license.status === "cancelled" || license.status === "revoked") {
      badRequest(`Cannot suspend license with status ${license.status}`);
    }

    const before = { status: license.status };
    license.status = "suspended";
    license.metadata = { ...license.metadata, suspensionReason: reason || "manual" };
    license.suspendedBy = actor.userId;
    license.updatedAt = nowIso();

    this.store.audit(actor, "license.suspended", "License", licenseId, before, { status: license.status, reason });
    this.store.save();
    return license;
  }

  revokeLicense(actor: RequestActor, licenseId: string, reason?: string): License {
    const license = this.getLicense(actor, licenseId);
    if (license.status === "revoked") {
      conflict("License is already revoked");
    }

    const before = { status: license.status };
    license.status = "revoked";
    license.metadata = { ...license.metadata, revocationReason: reason || "manual" };
    license.revokedBy = actor.userId;
    license.updatedAt = nowIso();

    this.store.getState().licenseKeys
      .filter((k) => k.licenseId === licenseId && k.status === "active")
      .forEach((key) => {
        key.status = "revoked";
        key.revokedAt = nowIso();
        key.revokedBy = actor.userId;
      });

    this.store.audit(actor, "license.revoked", "License", licenseId, before, { status: license.status, reason });
    this.store.save();
    return license;
  }

  validateLicense(actor: RequestActor, licenseId: string, userId?: string, action?: string, resource?: string): {
    valid: boolean;
    license: License;
    entitlements: Entitlement[];
    reasons: string[];
  } {
    const license = this.getLicense(actor, licenseId);
    const reasons: string[] = [];

    if (license.status === "expired" || isExpired(license.expiryDate)) {
      reasons.push("License has expired");
    }
    if (license.status === "suspended") {
      reasons.push("License is suspended");
    }
    if (license.status === "cancelled" || license.status === "revoked") {
      reasons.push("License is cancelled or revoked");
    }

    const entitlements = this.getEntitlements(actor, licenseId);
    if (resource && !entitlements.some((e) => e.key === resource && e.status === "active")) {
      reasons.push(`Missing entitlement: ${resource}`);
    }

    const valid = reasons.length === 0;
    return { valid, license, entitlements, reasons };
  }

  getEntitlements(actor: RequestActor, licenseId: string): Entitlement[] {
    return this.store.getState().entitlements.filter(
      (e) => e.licenseId === licenseId && e.tenantId === actor.tenantId
    );
  }

  createEntitlement(actor: RequestActor, licenseId: string, data: Partial<Entitlement>): Entitlement {
    const license = this.getLicense(actor, licenseId);
    if (!data.key) badRequest("Entitlement key is required");
    if (!data.name) badRequest("Entitlement name is required");

    const entitlement: Entitlement = {
      id: newId("ent"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      licenseId,
      key: data.key,
      name: data.name,
      description: data.description,
      type: data.type || "feature",
      resourceId: data.resourceId,
      resourceKey: data.resourceKey,
      status: data.status || "active",
      limits: data.limits,
      createdBy: actor.userId
    };

    this.store.getState().entitlements.push(entitlement);
    if (!license.entitlements.includes(data.key)) {
      license.entitlements.push(data.key);
    }
    license.updatedAt = nowIso();
    this.store.audit(actor, "entitlement.created", "Entitlement", entitlement.id, undefined, entitlement);
    this.store.save();
    return entitlement;
  }

  assignSeat(actor: RequestActor, licenseId: string, userId: string, seatType = "standard"): LicenseSeat {
    const license = this.getLicense(actor, licenseId);
    if (license.seats.used >= license.seats.total) {
      badRequest("No available seats");
    }
    if (license.status !== "active" && license.status !== "trial") {
      badRequest("Cannot assign seats to inactive license");
    }

    const existingSeat = this.store.getState().seats.find(
      (s) => s.licenseId === licenseId && s.userId === userId && s.status === "assigned"
    );
    if (existingSeat) {
      conflict("User already has an assigned seat");
    }

    const now = nowIso();
    const seat: LicenseSeat = {
      id: newId("seat"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      licenseId,
      userId,
      seatType,
      status: "assigned",
      assignedAt: now,
      assignedBy: actor.userId
    };

    this.store.getState().seats.push(seat);
    license.seats.used++;
    license.seats.available = license.seats.total - license.seats.used;
    license.updatedAt = now;

    this.store.audit(actor, "seat.assigned", "LicenseSeat", seat.id, undefined, { licenseId, userId, seatType });
    this.store.save();
    return seat;
  }

  releaseSeat(actor: RequestActor, licenseId: string, userId: string): LicenseSeat {
    const license = this.getLicense(actor, licenseId);
    const seat = this.store.getState().seats.find(
      (s) => s.licenseId === licenseId && s.userId === userId && s.status === "assigned"
    );
    if (!seat) notFound(`No assigned seat found for user ${userId}`);

    const now = nowIso();
    seat.status = "released";
    seat.releasedAt = now;
    seat.releasedBy = actor.userId;
    seat.updatedAt = now;

    license.seats.used--;
    license.seats.available = license.seats.total - license.seats.used;
    license.updatedAt = now;

    this.store.audit(actor, "seat.released", "LicenseSeat", seat.id, { status: "assigned" }, { status: "released" });
    this.store.save();
    return seat;
  }

  recordUsage(actor: RequestActor, data: {
    licenseId: string;
    userId?: string;
    resourceType: string;
    resourceId?: string;
    action: string;
    quantity: number;
    unit: string;
    cost?: number;
    metadata?: Record<string, unknown>;
  }): UsageRecord {
    const license = this.getLicense(actor, data.licenseId);
    if (license.status !== "active" && license.status !== "trial") {
      badRequest("Cannot record usage for inactive license");
    }

    const now = nowIso();
    const usage: UsageRecord = {
      id: newId("usage"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      licenseId: data.licenseId,
      userId: data.userId,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      action: data.action,
      quantity: data.quantity,
      unit: data.unit,
      cost: data.cost,
      metadata: data.metadata || {},
      recordedBy: actor.userId
    };

    this.store.getState().usageRecords.push(usage);

    const quota = this.store.getState().quotas.find(
      (q) => q.licenseId === data.licenseId && q.quotaType === data.resourceType
    );
    if (quota) {
      quota.used += data.quantity;
      quota.remaining = Math.max(0, quota.limit - quota.used);
      if (quota.remaining === 0) {
        quota.status = "limit_reached";
      } else if (quota.remaining < quota.limit * 0.1) {
        quota.status = "near_limit";
      }
      quota.updatedAt = now;
    }

    this.store.save();
    return usage;
  }

  checkCompliance(actor: RequestActor, licenseId: string, checkType: string): ComplianceCheck {
    const license = this.getLicense(actor, licenseId);
    const now = nowIso();
    const violations: string[] = [];
    let severity: "low" | "medium" | "high" | "critical" = "low";
    let status: "compliant" | "non_compliant" = "compliant";

    switch (checkType) {
      case "seat_compliance":
        if (license.seats.used > license.seats.total) {
          violations.push(`Seat limit exceeded: ${license.seats.used}/${license.seats.total}`);
          severity = "high";
          status = "non_compliant";
        }
        break;

      case "quota_compliance":
        const quotas = this.store.getState().quotas.filter((q) => q.licenseId === licenseId);
        for (const quota of quotas) {
          if (quota.used > quota.limit && !quota.overageAllowed) {
            violations.push(`Quota ${quota.quotaType} exceeded: ${quota.used}/${quota.limit}`);
            severity = "high";
            status = "non_compliant";
          }
        }
        break;

      case "expiry_compliance":
        if (isExpired(license.expiryDate) && license.status === "active") {
          violations.push("Active license has expired");
          severity = "critical";
          status = "non_compliant";
        }
        break;

      default:
        violations.push(`Unknown check type: ${checkType}`);
        severity = "medium";
    }

    const check: ComplianceCheck = {
      id: newId("comp"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      licenseId,
      checkType: checkType as any,
      status,
      severity,
      description: violations.length ? violations.join("; ") : `All checks passed for ${checkType}`,
      violations,
      checkedAt: now,
      checkedBy: actor.userId
    };

    this.store.getState().complianceChecks.push(check);
    this.store.audit(actor, "compliance.check", "ComplianceCheck", check.id, undefined, { checkType, status, violations });
    this.store.save();
    return check;
  }

  createRenewal(actor: RequestActor, licenseId: string, data: {
    newExpiryDate: string;
    amount?: number;
    currency?: string;
  }): Renewal {
    const license = this.getLicense(actor, licenseId);
    if (!data.newExpiryDate) badRequest("New expiry date is required");

    const now = nowIso();
    const renewal: Renewal = {
      id: newId("renewal"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      licenseId,
      status: "pending",
      renewalDate: now,
      expiryDate: license.expiryDate || now,
      newExpiryDate: data.newExpiryDate,
      amount: data.amount,
      currency: data.currency || "USD",
      createdBy: actor.userId
    };

    this.store.getState().renewals.push(renewal);
    this.store.audit(actor, "renewal.created", "Renewal", renewal.id, undefined, renewal);
    this.store.save();
    return renewal;
  }

  completeRenewal(actor: RequestActor, renewalId: string): Renewal {
    const renewal = this.store.getState().renewals.find((r) => r.id === renewalId);
    if (!renewal) notFound(`Renewal ${renewalId} not found`);
    if (renewal.status !== "pending") badRequest(`Renewal is not pending (current: ${renewal.status})`);

    const license = this.getLicense(actor, renewal.licenseId);
    const before = { status: renewal.status, expiryDate: license.expiryDate };

    renewal.status = "completed";
    renewal.approvedBy = actor.userId;
    renewal.approvedAt = nowIso();
    renewal.completedAt = nowIso();
    renewal.updatedAt = nowIso();

    license.expiryDate = renewal.newExpiryDate;
    license.status = "renewed";
    license.renewedAt = nowIso();
    license.renewedBy = actor.userId;
    license.updatedAt = nowIso();

    this.store.audit(actor, "renewal.completed", "Renewal", renewalId, before, { status: renewal.status });
    this.store.save();
    return renewal;
  }

  getOverview(actor: RequestActor): LicenseOverview {
    const state = this.store.getState();
    const licenses = state.licenses.filter((l) => l.tenantId === actor.tenantId);
    
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const activeLicenses = licenses.filter((l) => l.status === "active");
    const trialLicenses = licenses.filter((l) => l.status === "trial");
    const expiredLicenses = licenses.filter((l) => l.status === "expired" || isExpired(l.expiryDate));
    const suspendedLicenses = licenses.filter((l) => l.status === "suspended");

    const totalSeats = licenses.reduce((sum, l) => sum + l.seats.total, 0);
    const usedSeats = licenses.reduce((sum, l) => sum + l.seats.used, 0);

    const usageRecords = state.usageRecords.filter((u) => u.tenantId === actor.tenantId);
    const today = new Date().toISOString().split("T")[0];
    const thisWeek = weekStart.toISOString();
    const thisMonth = monthStart.toISOString();

    const renewals = state.renewals.filter((r) => r.tenantId === actor.tenantId);
    const complianceChecks = state.complianceChecks.filter((c) => c.tenantId === actor.tenantId);
    const quotas = state.quotas.filter((q) => q.tenantId === actor.tenantId);

    return {
      licenses: {
        total: licenses.length,
        active: activeLicenses.length,
        trial: trialLicenses.length,
        expired: expiredLicenses.length,
        suspended: suspendedLicenses.length
      },
      seats: {
        total: totalSeats,
        used: usedSeats,
        available: totalSeats - usedSeats
      },
      usage: {
        totalRecords: usageRecords.length,
        thisMonth: usageRecords.filter((u) => u.createdAt >= thisMonth).length,
        thisWeek: usageRecords.filter((u) => u.createdAt >= thisWeek).length,
        today: usageRecords.filter((u) => u.createdAt.startsWith(today)).length
      },
      renewals: {
        pending: renewals.filter((r) => r.status === "pending").length,
        upcoming: licenses.filter((l) => isExpiringSoon(l.expiryDate, 30) && l.status === "active").length,
        thisMonth: licenses.filter((l) => {
          if (!l.expiryDate) return false;
          const expiry = new Date(l.expiryDate);
          return expiry.getMonth() === now.getMonth() && expiry.getFullYear() === now.getFullYear();
        }).length
      },
      compliance: {
        checks: complianceChecks.length,
        compliant: complianceChecks.filter((c) => c.status === "compliant").length,
        nonCompliant: complianceChecks.filter((c) => c.status === "non_compliant").length,
        violations: complianceChecks.filter((c) => c.violations.length > 0).length
      },
      quotas: {
        atLimit: quotas.filter((q) => q.status === "limit_reached").length,
        nearLimit: quotas.filter((q) => q.status === "near_limit").length,
        overage: quotas.filter((q) => q.used > q.limit).length
      }
    };
  }

  searchLicenses(actor: RequestActor, query?: string, filters?: {
    status?: string;
    plan?: string;
    type?: string;
    ownerId?: string;
  }): License[] {
    let licenses = this.store.getState().licenses.filter((l) => l.tenantId === actor.tenantId);
    
    if (query) {
      const q = query.toLowerCase();
      licenses = licenses.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.key.toLowerCase().includes(q) ||
          (l.description && l.description.toLowerCase().includes(q)) ||
          l.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    
    if (filters) {
      if (filters.status) {
        licenses = licenses.filter((l) => l.status === filters.status);
      }
      if (filters.plan) {
        licenses = licenses.filter((l) => l.plan === filters.plan);
      }
      if (filters.type) {
        licenses = licenses.filter((l) => l.type === filters.type);
      }
      if (filters.ownerId) {
        licenses = licenses.filter((l) => l.ownerId === filters.ownerId);
      }
    }
    
    return licenses;
  }

  getUsageAnalytics(actor: RequestActor, licenseId?: string, period?: string): {
    totalUsage: number;
    byResourceType: Record<string, number>;
    byUser: Record<string, number>;
    trend: Array<{ date: string; count: number }>;
  } {
    let usage = this.store.getState().usageRecords.filter((u) => u.tenantId === actor.tenantId);
    
    if (licenseId) {
      usage = usage.filter((u) => u.licenseId === licenseId);
    }

    const byResourceType: Record<string, number> = {};
    const byUser: Record<string, number> = {};
    const trendMap = new Map<string, number>();

    for (const record of usage) {
      byResourceType[record.resourceType] = (byResourceType[record.resourceType] || 0) + record.quantity;
      if (record.userId) {
        byUser[record.userId] = (byUser[record.userId] || 0) + record.quantity;
      }
      const date = record.createdAt.split("T")[0];
      trendMap.set(date, (trendMap.get(date) || 0) + record.quantity);
    }

    const trend = Array.from(trendMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalUsage: usage.reduce((sum, r) => sum + r.quantity, 0),
      byResourceType,
      byUser,
      trend
    };
  }
}
