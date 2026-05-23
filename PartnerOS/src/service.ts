import {
  Partner,
  PartnerProgram,
  PartnerTier,
  PartnerLead,
  PartnerDeal,
  PartnerCommission,
  PartnerPayout,
  PartnerCampaign,
  Enablement,
  JointGTM,
  PartnerHealthScore,
  PartnerOverview,
  PartnerContact,
  PartnerState,
  RequestActor
} from "./domain";
import { DataStore } from "./core/datastore";
import { newId, nowIso } from "./core/id";
import { generateReferralCode, calculateHealthScore, countBy, asNumber } from "./core/utils";

export class PartnerService {
  constructor(private readonly store: DataStore) {}

  getOverview(tenantId: string): PartnerOverview {
    const state = this.store.getState();
    const partners = state.partners.filter((p) => p.tenantId === tenantId);
    const programs = state.programs.filter((p) => p.tenantId === tenantId);
    const leads = state.leads.filter((l) => l.tenantId === tenantId);
    const commissions = state.commissions.filter((c) => c.tenantId === tenantId);
    const campaigns = state.campaigns.filter((c) => c.tenantId === tenantId);

    const activePartners = partners.filter((p) => p.status === "active");
    const convertedLeads = leads.filter((l) => l.status === "won");
    const paidCommissions = commissions.filter((c) => c.status === "paid");
    const pendingCommissions = commissions.filter((c) => c.status === "calculated" || c.status === "pending_approval");
    const activeCampaigns = campaigns.filter((c) => c.status === "active");

    const totalRevenue = partners.reduce((sum, p) => sum + p.revenueGenerated, 0);
    const totalCommission = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const paidCommission = paidCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const pendingCommission = pendingCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);

    const topPartners = [...partners]
      .sort((a, b) => b.revenueGenerated - a.revenueGenerated)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: p.name,
        revenue: p.revenueGenerated,
        leads: p.leadsSubmitted
      }));

    const recentActivity = leads
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map((l) => {
        const partner = partners.find((p) => p.id === l.partnerId);
        return {
          partnerId: l.partnerId,
          partnerName: partner?.name ?? "Unknown",
          action: `Lead ${l.status}: ${l.customerName}`,
          date: l.updatedAt
        };
      });

    return {
      partners: {
        total: partners.length,
        active: activePartners.length,
        byStatus: countBy(partners, "status"),
        byType: countBy(partners, "type")
      },
      programs: {
        total: programs.length,
        active: programs.filter((p) => p.status === "active").length
      },
      leads: {
        total: leads.length,
        submitted: leads.length,
        converted: convertedLeads.length,
        conversionRate: leads.length > 0 ? Math.round((convertedLeads.length / leads.length) * 100) : 0
      },
      revenue: {
        total: totalRevenue,
        partnerInfluenced: totalRevenue,
        commission: totalCommission,
        paid: paidCommission,
        pending: pendingCommission
      },
      campaigns: {
        total: campaigns.length,
        active: activeCampaigns.length
      },
      performance: {
        topPartners,
        recentActivity
      }
    };
  }

  listPartners(tenantId: string, filters?: {
    status?: string;
    type?: string;
    programId?: string;
    search?: string;
  }): Partner[] {
    let partners = this.store.getState().partners.filter((p) => p.tenantId === tenantId);

    if (filters?.status) {
      partners = partners.filter((p) => p.status === filters.status);
    }
    if (filters?.type) {
      partners = partners.filter((p) => p.type === filters.type);
    }
    if (filters?.programId) {
      partners = partners.filter((p) => p.programId === filters.programId);
    }
    if (filters?.search) {
      const query = filters.search.toLowerCase();
      partners = partners.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    return partners;
  }

  getPartner(tenantId: string, partnerId: string): Partner | undefined {
    return this.store
      .getState()
      .partners.find((p) => p.id === partnerId && p.tenantId === tenantId);
  }

  createPartner(
    actor: RequestActor,
    data: {
      name: string;
      type: Partner["type"];
      email: string;
      programId?: string;
      contactPerson?: string;
      phone?: string;
      website?: string;
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      description?: string;
      tags?: string[];
    }
  ): Partner {
    const state = this.store.getState();
    const now = nowIso();

    const partner: Partner = {
      id: newId("partner"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key: data.name.toLowerCase().replace(/\s+/g, "_"),
      name: data.name,
      type: data.type,
      status: "prospect",
      programId: data.programId,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      website: data.website,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      description: data.description,
      tags: data.tags ?? [],
      metadata: {},
      referralCode: generateReferralCode(),
      revenueGenerated: 0,
      leadsSubmitted: 0,
      dealsWon: 0,
      createdBy: actor.userId
    };

    state.partners.push(partner);
    this.store.save();
    this.store.audit(actor, "partner.created", "Partner", partner.id);

    return partner;
  }

  updatePartner(
    actor: RequestActor,
    partnerId: string,
    updates: Partial<Partner>
  ): Partner {
    const state = this.store.getState();
    const partner = state.partners.find((p) => p.id === partnerId);

    if (!partner) {
      throw new Error(`Partner ${partnerId} not found`);
    }

    const before = { ...partner };
    Object.assign(partner, updates, { updatedAt: nowIso() });

    this.store.save();
    this.store.audit(actor, "partner.updated", "Partner", partnerId, before, partner);

    return partner;
  }

  listPrograms(tenantId: string, filters?: { type?: string; status?: string }): PartnerProgram[] {
    let programs = this.store.getState().programs.filter((p) => p.tenantId === tenantId);

    if (filters?.type) {
      programs = programs.filter((p) => p.type === filters.type);
    }
    if (filters?.status) {
      programs = programs.filter((p) => p.status === filters.status);
    }

    return programs;
  }

  getProgram(tenantId: string, programId: string): PartnerProgram | undefined {
    return this.store
      .getState()
      .programs.find((p) => p.id === programId && p.tenantId === tenantId);
  }

  listTiers(tenantId: string, programId?: string): PartnerTier[] {
    let tiers = this.store.getState().tiers.filter((t) => t.tenantId === tenantId);

    if (programId) {
      tiers = tiers.filter((t) => t.programId === programId);
    }

    return tiers;
  }

  listLeads(
    tenantId: string,
    filters?: {
      partnerId?: string;
      status?: string;
      source?: string;
    }
  ): PartnerLead[] {
    let leads = this.store.getState().leads.filter((l) => l.tenantId === tenantId);

    if (filters?.partnerId) {
      leads = leads.filter((l) => l.partnerId === filters.partnerId);
    }
    if (filters?.status) {
      leads = leads.filter((l) => l.status === filters.status);
    }
    if (filters?.source) {
      leads = leads.filter((l) => l.source === filters.source);
    }

    return leads;
  }

  submitLead(
    actor: RequestActor,
    data: {
      partnerId: string;
      programId?: string;
      source: PartnerLead["source"];
      customerName: string;
      customerEmail: string;
      customerPhone?: string;
      company?: string;
      description?: string;
      dealValue?: number;
      referralCode?: string;
      tags?: string[];
    }
  ): PartnerLead {
    const state = this.store.getState();
    const now = nowIso();

    const lead: PartnerLead = {
      id: newId("lead"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      partnerId: data.partnerId,
      programId: data.programId,
      source: data.source,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      company: data.company,
      description: data.description,
      dealValue: data.dealValue,
      status: "submitted",
      commissionEligible: false,
      referralCode: data.referralCode,
      tags: data.tags ?? [],
      metadata: {},
      createdBy: actor.userId
    };

    state.leads.push(lead);

    const partner = state.partners.find((p) => p.id === data.partnerId);
    if (partner) {
      partner.leadsSubmitted += 1;
      partner.lastActivityAt = now;
    }

    this.store.save();
    this.store.audit(actor, "partner.lead.submitted", "PartnerLead", lead.id);

    return lead;
  }

  updateLeadStatus(
    actor: RequestActor,
    leadId: string,
    status: PartnerLead["status"]
  ): PartnerLead {
    const state = this.store.getState();
    const lead = state.leads.find((l) => l.id === leadId);

    if (!lead) {
      throw new Error(`Lead ${leadId} not found`);
    }

    const before = { ...lead };
    lead.status = status;
    lead.updatedAt = nowIso();

    if (status === "won") {
      lead.convertedAt = nowIso();
    }

    this.store.save();
    this.store.audit(actor, "partner.lead.status_updated", "PartnerLead", leadId, before, { status });

    return lead;
  }

  calculateCommission(
    actor: RequestActor,
    dealId: string
  ): PartnerCommission | undefined {
    const state = this.store.getState();
    const deal = state.deals.find((d) => d.id === dealId);

    if (!deal) {
      throw new Error(`Deal ${dealId} not found`);
    }

    const partner = state.partners.find((p) => p.id === deal.partnerId);
    if (!partner) {
      throw new Error(`Partner ${deal.partnerId} not found`);
    }

    const commissionRate = partner.commissionRate ?? 15;
    const commissionAmount = Math.round(deal.dealValue * (commissionRate / 100));

    const commission: PartnerCommission = {
      id: newId("commission"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      partnerId: deal.partnerId,
      dealId: deal.id,
      leadId: deal.leadId,
      commissionType: partner.commissionModel ?? "percentage",
      commissionRate,
      dealValue: deal.dealValue,
      commissionAmount,
      status: "calculated",
      createdBy: actor.userId
    };

    state.commissions.push(commission);
    this.store.save();
    this.store.audit(actor, "partner.commission.calculated", "PartnerCommission", commission.id);

    return commission;
  }

  listCommissions(
    tenantId: string,
    filters?: {
      partnerId?: string;
      status?: string;
    }
  ): PartnerCommission[] {
    let commissions = this.store.getState().commissions.filter((c) => c.tenantId === tenantId);

    if (filters?.partnerId) {
      commissions = commissions.filter((c) => c.partnerId === filters.partnerId);
    }
    if (filters?.status) {
      commissions = commissions.filter((c) => c.status === filters.status);
    }

    return commissions;
  }

  listPayouts(tenantId: string, filters?: { partnerId?: string; status?: string }): PartnerPayout[] {
    let payouts = this.store.getState().payouts.filter((p) => p.tenantId === tenantId);

    if (filters?.partnerId) {
      payouts = payouts.filter((p) => p.partnerId === filters.partnerId);
    }
    if (filters?.status) {
      payouts = payouts.filter((p) => p.status === filters.status);
    }

    return payouts;
  }

  listCampaigns(tenantId: string, filters?: { status?: string }): PartnerCampaign[] {
    let campaigns = this.store.getState().campaigns.filter((c) => c.tenantId === tenantId);

    if (filters?.status) {
      campaigns = campaigns.filter((c) => c.status === filters.status);
    }

    return campaigns;
  }

  listJointGTMs(tenantId: string): JointGTM[] {
    return this.store.getState().jointGTMs.filter((j) => j.tenantId === tenantId);
  }

  listEnablements(tenantId: string, partnerId?: string): Enablement[] {
    let enablements = this.store.getState().enablements.filter((e) => e.tenantId === tenantId);

    if (partnerId) {
      enablements = enablements.filter((e) => e.partnerId === partnerId);
    }

    return enablements;
  }

  calculatePartnerHealthScore(tenantId: string, partnerId: string): PartnerHealthScore | undefined {
    const state = this.store.getState();
    const partner = state.partners.find((p) => p.id === partnerId);

    if (!partner) {
      return undefined;
    }

    const leads = state.leads.filter((l) => l.partnerId === partnerId);
    const deals = state.deals.filter((d) => d.partnerId === partnerId);
    const enablements = state.enablements.filter((e) => e.partnerId === partnerId);
    const commissions = state.commissions.filter((c) => c.partnerId === partnerId);

    const activityScore = Math.min(100, (partner.leadsSubmitted * 5) + (deals.length * 20));
    const revenueScore = Math.min(100, (partner.revenueGenerated / 10000));
    const leadQualityScore = leads.length > 0
      ? Math.round((leads.filter((l) => ["qualified", "won"].includes(l.status)).length / leads.length) * 100)
      : 0;
    const engagementScore = Math.min(100, enablements.length * 25);
    const complianceScore = 100;

    const factors = {
      activity: activityScore,
      revenue: revenueScore,
      leadQuality: leadQualityScore,
      engagement: engagementScore,
      compliance: complianceScore
    };

    const overallScore = calculateHealthScore(factors);

    const recommendations: string[] = [];
    if (activityScore < 50) recommendations.push("Submit more leads to improve activity score");
    if (revenueScore < 50) recommendations.push("Focus on closing higher-value deals");
    if (leadQualityScore < 50) recommendations.push("Improve lead quality through better qualification");
    if (engagementScore < 50) recommendations.push("Complete more training and certifications");
    if (overallScore >= 80) recommendations.push("Great performance! Maintain current strategies");

    const healthScore: PartnerHealthScore = {
      id: newId("health"),
      tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      partnerId,
      overallScore,
      activityScore,
      revenueScore,
      leadQualityScore,
      engagementScore,
      complianceScore,
      lastCalculatedAt: nowIso(),
      factors,
      recommendations
    };

    const existingIndex = state.healthScores.findIndex((h) => h.partnerId === partnerId);
    if (existingIndex >= 0) {
      state.healthScores[existingIndex] = healthScore;
    } else {
      state.healthScores.push(healthScore);
    }

    partner.healthScore = overallScore;
    this.store.save();

    return healthScore;
  }

  getPartnerContacts(tenantId: string, partnerId: string): PartnerContact[] {
    return this.store
      .getState()
      .contacts.filter((c) => c.tenantId === tenantId && c.partnerId === partnerId);
  }

  searchPartners(tenantId: string, query: string): Partner[] {
    const q = query.toLowerCase();
    return this.store
      .getState()
      .partners.filter(
        (p) =>
          p.tenantId === tenantId &&
          (p.name.toLowerCase().includes(q) ||
            p.email.toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q)))
      );
  }
}
