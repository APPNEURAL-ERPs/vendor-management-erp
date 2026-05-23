import {
  Campaign,
  CampaignMetrics,
  Conversion,
  Experiment,
  Funnel,
  FunnelMembership,
  GrowthState,
  LandingPage,
  Lead,
  NurtureEnrollment,
  NurtureSequence,
  RequestActor,
  Role,
  Segment,
  SegmentRule,
  Touchpoint
} from "../core/domain";
import { DataStore } from "../core/datastore";
import { EventBus } from "../core/event-bus";
import { badRequest, notFound } from "../core/errors";
import { newId, nowIso } from "../core/id";
import { addDays, assertRequired, clone, includesText, normalizeEmail, numberOr, round, slugify, sum, unique } from "../core/utils";
import { listPermissions } from "../core/security";
import { AttributionEngine } from "../engines/attribution-engine";
import { FunnelEngine } from "../engines/funnel-engine";
import { ScoringEngine } from "../engines/scoring-engine";
import { SegmentEngine } from "../engines/segment-engine";

const defaultMetrics: CampaignMetrics = { impressions: 0, opens: 0, clicks: 0, leads: 0, conversions: 0, revenue: 0, cost: 0 };

export class GrowthService {
  constructor(private readonly store: DataStore, private readonly events: EventBus) {}

  permissions(role: Role): string[] { return listPermissions(role); }

  overview(actor: RequestActor): Record<string, unknown> {
    const state = this.store.getState();
    return {
      name: "GrowthOS",
      tenantId: actor.tenantId,
      analytics: this.analytics(actor),
      counts: {
        leads: this.scoped(actor, state.leads).length,
        segments: this.scoped(actor, state.segments).length,
        campaigns: this.scoped(actor, state.campaigns).length,
        funnels: this.scoped(actor, state.funnels).length,
        touchpoints: this.scoped(actor, state.touchpoints).length,
        conversions: this.scoped(actor, state.conversions).length,
        landingPages: this.scoped(actor, state.landingPages).length,
        experiments: this.scoped(actor, state.experiments).length,
        nurtureSequences: this.scoped(actor, state.nurtureSequences).length
      },
      hotLeads: this.listLeads(actor).filter((lead) => lead.score >= 75).slice(0, 5),
      recentEvents: this.scoped(actor, state.events).slice(0, 10),
      recentAuditLogs: this.scoped(actor, state.auditLogs).slice(0, 10)
    };
  }

  analytics(actor: RequestActor): Record<string, unknown> {
    const state = this.store.getState();
    const leads = this.scoped(actor, state.leads);
    const campaigns = this.scoped(actor, state.campaigns);
    const touchpoints = this.scoped(actor, state.touchpoints);
    const conversions = this.scoped(actor, state.conversions);
    const funnels = this.scoped(actor, state.funnels);
    const memberships = this.scoped(actor, state.funnelMemberships);
    const landingPages = this.scoped(actor, state.landingPages);
    const experiments = this.scoped(actor, state.experiments);
    const enrollments = this.scoped(actor, state.nurtureEnrollments);
    const revenue = sum(conversions.map((conversion) => conversion.amount));
    const campaignCost = sum(campaigns.map((campaign) => campaign.metrics.cost));

    const campaignPerformance = campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      channel: campaign.channel,
      status: campaign.status,
      impressions: campaign.metrics.impressions,
      opens: campaign.metrics.opens,
      clicks: campaign.metrics.clicks,
      leads: campaign.metrics.leads,
      conversions: campaign.metrics.conversions,
      revenue: campaign.metrics.revenue,
      cost: campaign.metrics.cost,
      clickThroughRate: campaign.metrics.impressions ? round((campaign.metrics.clicks / campaign.metrics.impressions) * 100) : 0,
      leadConversionRate: campaign.metrics.clicks ? round((campaign.metrics.leads / campaign.metrics.clicks) * 100) : 0,
      roi: AttributionEngine.campaignRoi(campaign.metrics.cost, campaign.metrics.revenue)
    }));

    return {
      totalLeads: leads.length,
      newLeads: leads.filter((lead) => lead.status === "new").length,
      qualifiedLeads: leads.filter((lead) => ["qualified", "opportunity", "customer"].includes(lead.status)).length,
      customers: leads.filter((lead) => lead.status === "customer" || lead.lifecycleStage === "customer").length,
      activeCampaigns: campaigns.filter((campaign) => campaign.status === "active").length,
      totalTouchpoints: touchpoints.length,
      totalConversions: conversions.length,
      revenue,
      campaignCost,
      roi: AttributionEngine.campaignRoi(campaignCost, revenue),
      averageLeadScore: leads.length ? round(sum(leads.map((lead) => lead.score)) / leads.length) : 0,
      sourceBreakdown: AttributionEngine.sourceBreakdown(touchpoints, conversions),
      campaignPerformance,
      funnelPerformance: funnels.map((funnel) => FunnelEngine.metrics(funnel, memberships)),
      landingPagePerformance: landingPages.map((page) => ({ ...page.metrics, id: page.id, name: page.name, slug: page.slug, status: page.status })),
      experimentPerformance: experiments.map((experiment) => this.experimentSummary(experiment)),
      nurturePerformance: {
        activeEnrollments: enrollments.filter((enrollment) => enrollment.status === "active").length,
        completedEnrollments: enrollments.filter((enrollment) => enrollment.status === "completed").length
      }
    };
  }

  listLeads(actor: RequestActor, filters: Record<string, string | undefined> = {}): Lead[] {
    const query = String(filters.q ?? filters.search ?? "").trim();
    return this.scoped(actor, this.store.getState().leads)
      .filter((lead) => !filters.status || lead.status === filters.status)
      .filter((lead) => !filters.source || lead.source === filters.source)
      .filter((lead) => !filters.tag || lead.tags.includes(filters.tag))
      .filter((lead) => !query || includesText(lead.email, query) || includesText(lead.firstName, query) || includesText(lead.lastName, query) || includesText(lead.company, query))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getLead(actor: RequestActor, id: string): Lead { return clone(this.findLead(actor, id)); }

  createLead(actor: RequestActor, input: any): Lead {
    assertRequired(input.email, "email");
    const email = normalizeEmail(input.email);
    if (this.store.getState().leads.some((lead) => lead.tenantId === actor.tenantId && lead.email === email)) badRequest(`Lead with email ${email} already exists`);
    const now = nowIso();
    const fullName = String(input.fullName ?? "").trim();
    const nameParts = fullName ? fullName.split(/\s+/) : [];
    const lead: Lead = {
      id: newId("lead"), tenantId: actor.tenantId, createdAt: now, updatedAt: now,
      firstName: input.firstName ?? nameParts[0], lastName: input.lastName ?? (nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined),
      email, phone: input.phone, company: input.company, jobTitle: input.jobTitle ?? input.title,
      source: String(input.source ?? "website"), ownerId: input.ownerId, status: input.status ?? "new", lifecycleStage: input.lifecycleStage ?? "lead",
      score: 0, tags: unique((Array.isArray(input.tags) ? input.tags : []).map(String)), consent: input.consent ?? "unknown",
      lastActivityAt: input.lastActivityAt, customFields: input.customFields ?? input.attributes ?? {}, createdBy: actor.userId
    };
    this.applyScore(lead);
    this.store.getState().leads.unshift(lead);
    this.store.save();
    this.store.audit(actor, "lead.created", "lead", lead.id, undefined, lead);
    this.events.emit(actor, "growth.lead.created", { leadId: lead.id, email: lead.email, source: lead.source, score: lead.score });
    return clone(lead);
  }

  updateLead(actor: RequestActor, id: string, input: any): Lead {
    const lead = this.findLead(actor, id);
    const before = clone(lead);
    const fields = ["firstName", "lastName", "phone", "company", "jobTitle", "source", "ownerId", "status", "lifecycleStage", "consent", "customFields"];
    for (const field of fields) if (input[field] !== undefined) (lead as any)[field] = input[field];
    if (input.title !== undefined) lead.jobTitle = input.title;
    if (input.email !== undefined) lead.email = normalizeEmail(input.email);
    if (input.tags !== undefined) lead.tags = unique((Array.isArray(input.tags) ? input.tags : []).map(String));
    lead.updatedAt = nowIso();
    this.applyScore(lead);
    this.store.save();
    this.store.audit(actor, "lead.updated", "lead", lead.id, before, lead);
    this.events.emit(actor, "growth.lead.updated", { leadId: lead.id, status: lead.status, score: lead.score });
    return clone(lead);
  }

  qualifyLead(actor: RequestActor, id: string): Lead {
    const lead = this.findLead(actor, id);
    const before = clone(lead);
    lead.status = "qualified";
    lead.lifecycleStage = lead.score >= 70 ? "sql" : "mql";
    lead.updatedAt = nowIso();
    this.applyScore(lead);
    this.store.save();
    this.store.audit(actor, "lead.qualified", "lead", lead.id, before, lead);
    this.events.emit(actor, "growth.lead.qualified", { leadId: lead.id, lifecycleStage: lead.lifecycleStage, score: lead.score });
    return clone(lead);
  }

  recalculateLeadScore(actor: RequestActor, id: string): Record<string, unknown> {
    const lead = this.findLead(actor, id);
    const before = clone(lead);
    const breakdown = this.applyScore(lead);
    lead.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "lead.score.recalculated", "lead", lead.id, before, lead);
    this.events.emit(actor, "growth.lead.score.recalculated", { leadId: lead.id, score: lead.score });
    return { lead: clone(lead), breakdown };
  }

  listSegments(actor: RequestActor): Segment[] { return this.scoped(actor, this.store.getState().segments); }

  createSegment(actor: RequestActor, input: any): Segment {
    assertRequired(input.name, "name");
    const now = nowIso();
    const segment: Segment = { id: newId("seg"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, name: String(input.name), description: input.description, rules: this.normalizeRules(input.rules ?? input.criteria), status: input.status ?? "active", evaluatedCount: 0, createdBy: actor.userId };
    this.store.getState().segments.unshift(segment);
    this.store.save();
    this.store.audit(actor, "segment.created", "segment", segment.id, undefined, segment);
    this.events.emit(actor, "growth.segment.created", { segmentId: segment.id, name: segment.name });
    return clone(segment);
  }

  evaluateSegment(actor: RequestActor, id: string): Record<string, unknown> {
    const segment = this.findSegment(actor, id);
    const before = clone(segment);
    const leads = this.listLeads(actor).filter((lead) => SegmentEngine.matches(lead, segment.rules));
    segment.evaluatedCount = leads.length;
    segment.lastEvaluatedAt = nowIso();
    segment.updatedAt = segment.lastEvaluatedAt;
    this.store.save();
    this.store.audit(actor, "segment.evaluated", "segment", segment.id, before, segment);
    this.events.emit(actor, "growth.segment.evaluated", { segmentId: segment.id, evaluatedCount: leads.length });
    return { segment: clone(segment), leads, leadIds: leads.map((lead) => lead.id) };
  }

  listCampaigns(actor: RequestActor): Campaign[] { return this.scoped(actor, this.store.getState().campaigns); }

  createCampaign(actor: RequestActor, input: any): Campaign {
    assertRequired(input.name, "name");
    const now = nowIso();
    const campaign: Campaign = {
      id: newId("camp"), tenantId: actor.tenantId, createdAt: now, updatedAt: now,
      name: String(input.name), channel: input.channel ?? input.type ?? "email", objective: input.objective ?? "Generate qualified leads", status: input.status ?? "draft",
      targetSegmentId: input.targetSegmentId, landingPageId: input.landingPageId, startAt: input.startAt ?? input.startDate, endAt: input.endAt ?? input.endDate,
      budget: round(Math.max(0, numberOr(input.budget, 0))), currency: input.currency ?? "INR", metrics: { ...defaultMetrics, ...(input.metrics ?? {}) }, tags: unique((Array.isArray(input.tags) ? input.tags : []).map(String)), createdBy: actor.userId
    };
    this.store.getState().campaigns.unshift(campaign);
    this.store.save();
    this.store.audit(actor, "campaign.created", "campaign", campaign.id, undefined, campaign);
    this.events.emit(actor, "growth.campaign.created", { campaignId: campaign.id, name: campaign.name, channel: campaign.channel });
    return clone(campaign);
  }

  launchCampaign(actor: RequestActor, id: string): Campaign { return this.setCampaignStatus(actor, id, "active"); }
  completeCampaign(actor: RequestActor, id: string): Campaign { return this.setCampaignStatus(actor, id, "completed"); }

  recordCampaignMetrics(actor: RequestActor, id: string, input: Partial<CampaignMetrics>): Campaign {
    const campaign = this.findCampaign(actor, id);
    const before = clone(campaign);
    campaign.metrics = { ...campaign.metrics, ...input };
    campaign.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "campaign.metrics.recorded", "campaign", campaign.id, before, campaign);
    this.events.emit(actor, "growth.campaign.metrics.recorded", { campaignId: campaign.id, metrics: campaign.metrics });
    return clone(campaign);
  }

  listTouchpoints(actor: RequestActor): Touchpoint[] { return this.scoped(actor, this.store.getState().touchpoints); }

  captureTouchpoint(actor: RequestActor, input: any): Touchpoint {
    assertRequired(input.eventType ?? input.type, "eventType");
    const now = nowIso();
    const eventType = input.eventType ?? input.type;
    const touchpoint: Touchpoint = {
      id: newId("tp"), tenantId: actor.tenantId, createdAt: now, updatedAt: now,
      leadId: input.leadId, anonymousId: input.anonymousId, campaignId: input.campaignId, landingPageId: input.landingPageId,
      channel: input.channel ?? "direct", source: input.source ?? "direct", medium: input.medium, content: input.content,
      eventType, occurredAt: input.occurredAt ?? now, value: input.value !== undefined ? numberOr(input.value, 0) : undefined, metadata: input.metadata ?? {}, createdBy: actor.userId
    };
    if (touchpoint.leadId) this.findLead(actor, touchpoint.leadId);
    if (touchpoint.campaignId) this.findCampaign(actor, touchpoint.campaignId);
    if (touchpoint.landingPageId) this.findLandingPage(actor, touchpoint.landingPageId);
    this.store.getState().touchpoints.unshift(touchpoint);
    if (touchpoint.leadId) {
      const lead = this.findLead(actor, touchpoint.leadId);
      lead.lastActivityAt = touchpoint.occurredAt;
      this.applyScore(lead);
      lead.updatedAt = now;
    }
    if (touchpoint.campaignId) {
      const campaign = this.findCampaign(actor, touchpoint.campaignId);
      if (eventType === "visit") campaign.metrics.impressions += 1;
      if (eventType === "email_open") campaign.metrics.opens += 1;
      if (eventType === "email_click" || eventType === "ad_click") campaign.metrics.clicks += 1;
      if (eventType === "form_submit") campaign.metrics.leads += 1;
      campaign.updatedAt = now;
    }
    if (touchpoint.landingPageId) this.bumpLandingPageMetrics(actor, touchpoint.landingPageId, eventType);
    this.store.save();
    this.store.audit(actor, "touchpoint.captured", "touchpoint", touchpoint.id, undefined, touchpoint);
    this.events.emit(actor, "growth.touchpoint.captured", { touchpointId: touchpoint.id, eventType: touchpoint.eventType, leadId: touchpoint.leadId });
    return clone(touchpoint);
  }

  listConversions(actor: RequestActor): Conversion[] { return this.scoped(actor, this.store.getState().conversions); }

  createConversion(actor: RequestActor, input: any): Conversion {
    assertRequired(input.leadId, "leadId");
    assertRequired(input.type, "type");
    const lead = this.findLead(actor, input.leadId);
    const now = nowIso();
    const conversion: Conversion = {
      id: newId("conv"), tenantId: actor.tenantId, createdAt: now, updatedAt: now,
      leadId: lead.id, campaignId: input.campaignId, funnelId: input.funnelId, type: input.type, amount: round(Math.max(0, numberOr(input.amount ?? input.value, 0))), currency: input.currency ?? "INR",
      attributionModel: input.attributionModel ?? "last_touch", source: input.source, occurredAt: input.occurredAt ?? now, metadata: input.metadata ?? {}, createdBy: actor.userId
    };
    if (conversion.campaignId) this.findCampaign(actor, conversion.campaignId);
    if (conversion.funnelId) this.findFunnel(actor, conversion.funnelId);
    this.store.getState().conversions.unshift(conversion);
    this.applyConversionToLead(lead, conversion);
    if (conversion.campaignId) {
      const campaign = this.findCampaign(actor, conversion.campaignId);
      campaign.metrics.conversions += 1;
      campaign.metrics.revenue = round(campaign.metrics.revenue + conversion.amount);
      campaign.updatedAt = now;
    }
    this.applyScore(lead);
    this.store.save();
    this.store.audit(actor, "conversion.created", "conversion", conversion.id, undefined, conversion);
    this.events.emit(actor, "growth.conversion.created", { conversionId: conversion.id, leadId: lead.id, type: conversion.type, amount: conversion.amount });
    return clone(conversion);
  }

  listFunnels(actor: RequestActor): Funnel[] { return this.scoped(actor, this.store.getState().funnels); }
  listFunnelMemberships(actor: RequestActor): FunnelMembership[] { return this.scoped(actor, this.store.getState().funnelMemberships); }

  createFunnel(actor: RequestActor, input: any): Funnel {
    assertRequired(input.name, "name");
    const now = nowIso();
    const stages = (Array.isArray(input.stages) && input.stages.length ? input.stages : [
      { name: "Visitor", probability: 10 }, { name: "Lead", probability: 25 }, { name: "MQL", probability: 45 }, { name: "SQL", probability: 70 }, { name: "Customer", probability: 100 }
    ]).map((stage: any, index: number) => ({ id: stage.id ?? newId("stage"), name: String(stage.name), order: numberOr(stage.order, index + 1), probability: round(Math.max(0, Math.min(100, numberOr(stage.probability, 0)))), entryCriteria: stage.entryCriteria }));
    const funnel: Funnel = { id: newId("funnel"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, name: String(input.name), description: input.description, status: input.status ?? "active", stages, createdBy: actor.userId };
    this.store.getState().funnels.unshift(funnel);
    this.store.save();
    this.store.audit(actor, "funnel.created", "funnel", funnel.id, undefined, funnel);
    this.events.emit(actor, "growth.funnel.created", { funnelId: funnel.id, stages: funnel.stages.length });
    return clone(funnel);
  }

  enrollLeadInFunnel(actor: RequestActor, funnelId: string, input: any): FunnelMembership {
    const funnel = this.findFunnel(actor, funnelId);
    const lead = this.findLead(actor, input.leadId);
    const stageId = input.stageId ?? funnel.stages[0]?.id;
    if (!funnel.stages.some((stage) => stage.id === stageId)) notFound(`Stage ${stageId} not found`);
    const now = nowIso();
    const membership: FunnelMembership = { id: newId("fm"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, funnelId: funnel.id, leadId: lead.id, stageId, status: "active", enteredAt: now, createdBy: actor.userId, notes: input.notes };
    this.store.getState().funnelMemberships.unshift(membership);
    this.store.save();
    this.store.audit(actor, "funnel.lead.enrolled", "funnel_membership", membership.id, undefined, membership);
    this.events.emit(actor, "growth.funnel.lead.enrolled", { funnelId: funnel.id, leadId: lead.id, stageId });
    return clone(membership);
  }

  moveFunnelMembership(actor: RequestActor, id: string, input: any): FunnelMembership {
    const membership = this.findFunnelMembership(actor, id);
    const funnel = this.findFunnel(actor, membership.funnelId);
    const targetStageId = input.stageId ?? funnel.stages.find((stage) => stage.order === Number(input.stageOrder))?.id;
    if (!targetStageId || !funnel.stages.some((stage) => stage.id === targetStageId)) notFound(`Stage ${input.stageId ?? input.stageOrder} not found`);
    const before = clone(membership);
    membership.stageId = targetStageId;
    membership.movedAt = nowIso();
    membership.updatedAt = membership.movedAt;
    this.store.save();
    this.store.audit(actor, "funnel.membership.moved", "funnel_membership", membership.id, before, membership);
    this.events.emit(actor, "growth.funnel.membership.moved", { membershipId: membership.id, stageId: membership.stageId });
    return clone(membership);
  }

  closeFunnelMembership(actor: RequestActor, id: string, input: any): FunnelMembership {
    const membership = this.findFunnelMembership(actor, id);
    const before = clone(membership);
    membership.status = input.status === "lost" ? "lost" : "converted";
    membership.notes = input.notes ?? membership.notes;
    if (membership.status === "converted") membership.convertedAt = nowIso();
    if (membership.status === "lost") membership.lostAt = nowIso();
    membership.updatedAt = nowIso();
    const lead = this.findLead(actor, membership.leadId);
    lead.status = membership.status === "converted" ? "customer" : "lost";
    lead.lifecycleStage = membership.status === "converted" ? "customer" : lead.lifecycleStage;
    this.applyScore(lead);
    this.store.save();
    this.store.audit(actor, "funnel.membership.closed", "funnel_membership", membership.id, before, membership);
    this.events.emit(actor, "growth.funnel.membership.closed", { membershipId: membership.id, status: membership.status });
    return clone(membership);
  }

  listLandingPages(actor: RequestActor): LandingPage[] { return this.scoped(actor, this.store.getState().landingPages); }

  createLandingPage(actor: RequestActor, input: any): LandingPage {
    assertRequired(input.name ?? input.title, "name");
    const now = nowIso();
    const name = String(input.name ?? input.title);
    const page: LandingPage = { id: newId("lp"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, name, slug: input.slug ?? slugify(name), headline: input.headline ?? name, description: input.description ?? input.body, campaignId: input.campaignId, status: input.status ?? "draft", formFields: Array.isArray(input.formFields) ? input.formFields : ["firstName", "email", "company"], thankYouMessage: input.thankYouMessage ?? "Thanks. We will contact you soon.", metrics: { visits: 0, submissions: 0, conversionRate: 0 }, createdBy: actor.userId };
    if (page.campaignId) this.findCampaign(actor, page.campaignId);
    this.store.getState().landingPages.unshift(page);
    this.store.save();
    this.store.audit(actor, "landing_page.created", "landing_page", page.id, undefined, page);
    this.events.emit(actor, "growth.landing_page.created", { landingPageId: page.id, slug: page.slug });
    return clone(page);
  }

  publishLandingPage(actor: RequestActor, id: string): LandingPage {
    const page = this.findLandingPage(actor, id);
    const before = clone(page);
    page.status = "published";
    page.publishedAt = page.publishedAt ?? nowIso();
    page.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "landing_page.published", "landing_page", page.id, before, page);
    this.events.emit(actor, "growth.landing_page.published", { landingPageId: page.id, slug: page.slug });
    return clone(page);
  }

  submitLandingPage(actor: RequestActor, id: string, input: any): Record<string, unknown> {
    const page = this.findLandingPage(actor, id);
    if (page.status !== "published") badRequest("Landing page must be published before submission");
    let lead = this.store.getState().leads.find((item) => item.tenantId === actor.tenantId && input.email && item.email === normalizeEmail(input.email));
    if (!lead) lead = this.createLead(actor, { ...input, source: input.source ?? "website", tags: unique([...(Array.isArray(input.tags) ? input.tags : []), "landing-page"]) });
    if (page.campaignId) {
      const campaign = this.findCampaign(actor, page.campaignId);
      campaign.metrics.leads += 1;
      campaign.updatedAt = nowIso();
    }
    const touchpoint = this.captureTouchpoint(actor, { leadId: lead.id, campaignId: page.campaignId, landingPageId: page.id, channel: "website", source: page.slug, eventType: "form_submit", metadata: { payload: input } });
    this.store.save();
    this.events.emit(actor, "growth.landing_page.submitted", { landingPageId: page.id, leadId: lead.id });
    return { lead: clone(lead), touchpoint, message: page.thankYouMessage };
  }

  listExperiments(actor: RequestActor): Experiment[] { return this.scoped(actor, this.store.getState().experiments); }

  createExperiment(actor: RequestActor, input: any): Experiment {
    assertRequired(input.name, "name");
    const now = nowIso();
    const variants = Array.isArray(input.variants) && input.variants.length ? input.variants : [{ name: "Control", trafficWeight: 50 }, { name: "Variant", trafficWeight: 50 }];
    const experiment: Experiment = { id: newId("exp"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, name: String(input.name), hypothesis: input.hypothesis ?? "Variant will improve conversion", targetMetric: input.targetMetric ?? input.metric ?? "conversion_rate", status: input.status ?? "draft", variants: variants.map((variant: any) => ({ id: variant.id ?? newId("var"), name: String(variant.name), trafficWeight: round(Math.max(0, numberOr(variant.trafficWeight ?? variant.weight, 50))), visitors: numberOr(variant.visitors, 0), conversions: numberOr(variant.conversions, 0), revenue: round(numberOr(variant.revenue, 0)) })), createdBy: actor.userId };
    this.store.getState().experiments.unshift(experiment);
    this.store.save();
    this.store.audit(actor, "experiment.created", "experiment", experiment.id, undefined, experiment);
    this.events.emit(actor, "growth.experiment.created", { experimentId: experiment.id, variants: experiment.variants.length });
    return clone(experiment);
  }

  startExperiment(actor: RequestActor, id: string): Experiment {
    const experiment = this.findExperiment(actor, id);
    const before = clone(experiment);
    experiment.status = "running";
    experiment.startedAt = experiment.startedAt ?? nowIso();
    experiment.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "experiment.started", "experiment", experiment.id, before, experiment);
    this.events.emit(actor, "growth.experiment.started", { experimentId: experiment.id });
    return clone(experiment);
  }

  recordExperimentEvent(actor: RequestActor, id: string, input: any): Experiment {
    const experiment = this.findExperiment(actor, id);
    const variant = experiment.variants.find((item) => item.id === input.variantId || item.name === input.variantName);
    if (!variant) notFound(`Variant ${input.variantId ?? input.variantName} not found`);
    const before = clone(experiment);
    const count = Math.max(0, numberOr(input.count, 1));
    variant.visitors += Math.max(0, numberOr(input.visitors, input.event === "visit" || input.event === "visitor" ? count : 0));
    variant.conversions += Math.max(0, numberOr(input.conversions, input.event === "conversion" ? count : 0));
    variant.revenue = round(variant.revenue + Math.max(0, numberOr(input.revenue, 0)));
    experiment.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "experiment.event.recorded", "experiment", experiment.id, before, experiment);
    this.events.emit(actor, "growth.experiment.event.recorded", { experimentId: experiment.id, variantId: variant.id });
    return clone(experiment);
  }

  analyzeExperiment(actor: RequestActor, id: string): Record<string, unknown> {
    return this.experimentSummary(this.findExperiment(actor, id));
  }

  listNurtureSequences(actor: RequestActor): NurtureSequence[] { return this.scoped(actor, this.store.getState().nurtureSequences); }

  createNurtureSequence(actor: RequestActor, input: any): NurtureSequence {
    assertRequired(input.name, "name");
    const steps = Array.isArray(input.steps) && input.steps.length ? input.steps : [
      { order: 1, channel: "email", delayDays: 0, templateName: "welcome", subject: "Thanks for your interest" },
      { order: 2, channel: "email", delayDays: 2, templateName: "case-study", subject: "See how teams use Appneural" },
      { order: 3, channel: "task", delayDays: 4, templateName: "sales-follow-up", subject: "Call lead" }
    ];
    const now = nowIso();
    const sequence: NurtureSequence = { id: newId("seq"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, name: String(input.name), description: input.description, status: input.status ?? "active", targetSegmentId: input.targetSegmentId, steps: steps.map((step: any, index: number) => ({ id: step.id ?? newId("step"), order: numberOr(step.order, index + 1), channel: step.channel ?? "email", delayDays: Math.max(0, numberOr(step.delayDays, 0)), templateName: step.templateName ?? `step-${index + 1}`, subject: step.subject })), enrollmentCount: 0, createdBy: actor.userId };
    this.store.getState().nurtureSequences.unshift(sequence);
    this.store.save();
    this.store.audit(actor, "nurture_sequence.created", "nurture_sequence", sequence.id, undefined, sequence);
    this.events.emit(actor, "growth.nurture_sequence.created", { sequenceId: sequence.id, steps: sequence.steps.length });
    return clone(sequence);
  }

  enrollLeadInNurture(actor: RequestActor, sequenceId: string, input: any): NurtureEnrollment {
    const sequence = this.findNurtureSequence(actor, sequenceId);
    const lead = this.findLead(actor, input.leadId);
    if (this.store.getState().nurtureEnrollments.some((item) => item.tenantId === actor.tenantId && item.sequenceId === sequence.id && item.leadId === lead.id && item.status === "active")) badRequest("Lead is already active in this nurture sequence");
    const now = nowIso();
    const enrollment: NurtureEnrollment = { id: newId("enr"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, sequenceId: sequence.id, leadId: lead.id, status: "active", currentStepOrder: 1, enrolledAt: now, createdBy: actor.userId };
    sequence.enrollmentCount += 1;
    sequence.updatedAt = now;
    this.store.getState().nurtureEnrollments.unshift(enrollment);
    this.store.save();
    this.store.audit(actor, "nurture.lead.enrolled", "nurture_enrollment", enrollment.id, undefined, enrollment);
    this.events.emit(actor, "growth.nurture.lead.enrolled", { sequenceId: sequence.id, leadId: lead.id, enrollmentId: enrollment.id });
    return clone(enrollment);
  }

  advanceNurtureEnrollment(actor: RequestActor, enrollmentId: string): Record<string, unknown> {
    const enrollment = this.findNurtureEnrollment(actor, enrollmentId);
    const sequence = this.findNurtureSequence(actor, enrollment.sequenceId);
    const step = sequence.steps.find((item) => item.order === enrollment.currentStepOrder);
    if (!step) badRequest("No step available for currentStepOrder");
    const before = clone(enrollment);
    this.captureTouchpoint(actor, { leadId: enrollment.leadId, channel: step.channel, source: sequence.name, eventType: step.channel === "email" ? "email_open" : "custom", metadata: { sequenceId: sequence.id, stepId: step.id, templateName: step.templateName } });
    const nextStep = sequence.steps.find((item) => item.order === enrollment.currentStepOrder + 1);
    if (nextStep) enrollment.currentStepOrder = nextStep.order;
    else { enrollment.status = "completed"; enrollment.completedAt = nowIso(); }
    enrollment.lastStepAt = nowIso();
    enrollment.updatedAt = enrollment.lastStepAt;
    this.store.save();
    this.store.audit(actor, "nurture_enrollment.advanced", "nurture_enrollment", enrollment.id, before, enrollment);
    this.events.emit(actor, "growth.nurture_enrollment.advanced", { enrollmentId: enrollment.id, status: enrollment.status });
    return { enrollment: clone(enrollment), step, currentStepOrder: enrollment.currentStepOrder, status: enrollment.status };
  }

  listEvents(actor: RequestActor) { return this.scoped(actor, this.store.getState().events); }
  listAuditLogs(actor: RequestActor) { return this.scoped(actor, this.store.getState().auditLogs); }

  private setCampaignStatus(actor: RequestActor, id: string, status: Campaign["status"]): Campaign {
    const campaign = this.findCampaign(actor, id);
    const before = clone(campaign);
    campaign.status = status;
    if (status === "active") campaign.startAt = campaign.startAt ?? nowIso();
    if (status === "completed") campaign.endAt = campaign.endAt ?? nowIso();
    campaign.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, `campaign.${status}`, "campaign", campaign.id, before, campaign);
    this.events.emit(actor, `growth.campaign.${status}`, { campaignId: campaign.id });
    return clone(campaign);
  }

  private applyConversionToLead(lead: Lead, conversion: Conversion): void {
    if (conversion.type === "mql") { lead.status = "qualified"; lead.lifecycleStage = "mql"; }
    if (conversion.type === "sql" || conversion.type === "demo") { lead.status = "opportunity"; lead.lifecycleStage = "sql"; }
    if (conversion.type === "customer" || conversion.type === "revenue") { lead.status = "customer"; lead.lifecycleStage = "customer"; }
    lead.lastActivityAt = conversion.occurredAt;
    lead.updatedAt = nowIso();
  }

  private applyScore(lead: Lead) {
    const touchpoints = this.store.getState().touchpoints.filter((touchpoint) => touchpoint.tenantId === lead.tenantId && touchpoint.leadId === lead.id);
    const conversions = this.store.getState().conversions.filter((conversion) => conversion.tenantId === lead.tenantId && conversion.leadId === lead.id);
    const breakdown = ScoringEngine.scoreLead(lead, touchpoints, conversions);
    lead.score = breakdown.total;
    return breakdown;
  }

  private experimentSummary(experiment: Experiment): Record<string, unknown> {
    const variants = experiment.variants.map((variant) => ({ ...variant, conversionRate: variant.visitors ? round((variant.conversions / variant.visitors) * 100) : 0, revenuePerVisitor: variant.visitors ? round(variant.revenue / variant.visitors) : 0 }));
    const winner = variants.slice().sort((a, b) => experiment.targetMetric === "revenue" ? b.revenuePerVisitor - a.revenuePerVisitor : b.conversionRate - a.conversionRate)[0];
    return { id: experiment.id, name: experiment.name, status: experiment.status, targetMetric: experiment.targetMetric, variants, winnerVariantId: winner?.id, winnerVariantName: winner?.name, suggestedWinnerName: winner?.name };
  }

  private normalizeRules(value: unknown): SegmentRule[] {
    if (!Array.isArray(value)) return [];
    return value.map((rule: any) => ({ field: String(rule.field), operator: rule.operator ?? "eq", value: rule.value }));
  }

  private bumpLandingPageMetrics(actor: RequestActor, id: string, eventType: string): void {
    const page = this.findLandingPage(actor, id);
    if (eventType === "visit") page.metrics.visits += 1;
    if (eventType === "form_submit") page.metrics.submissions += 1;
    this.recalculateLandingPage(page);
  }

  private recalculateLandingPage(page: LandingPage): void {
    page.metrics.conversionRate = page.metrics.visits ? round((page.metrics.submissions / page.metrics.visits) * 100) : 0;
    page.updatedAt = nowIso();
  }

  private scoped<T extends { tenantId: string; createdAt?: string }>(actor: RequestActor, items: T[]): T[] {
    return items.filter((item) => item.tenantId === actor.tenantId).sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
  }

  private findLead(actor: RequestActor, id: string): Lead { const item = this.store.getState().leads.find((lead) => lead.tenantId === actor.tenantId && lead.id === id); if (!item) notFound(`Lead ${id} not found`); return item; }
  private findSegment(actor: RequestActor, id: string): Segment { const item = this.store.getState().segments.find((segment) => segment.tenantId === actor.tenantId && segment.id === id); if (!item) notFound(`Segment ${id} not found`); return item; }
  private findCampaign(actor: RequestActor, id: string): Campaign { const item = this.store.getState().campaigns.find((campaign) => campaign.tenantId === actor.tenantId && campaign.id === id); if (!item) notFound(`Campaign ${id} not found`); return item; }
  private findFunnel(actor: RequestActor, id: string): Funnel { const item = this.store.getState().funnels.find((funnel) => funnel.tenantId === actor.tenantId && funnel.id === id); if (!item) notFound(`Funnel ${id} not found`); return item; }
  private findFunnelMembership(actor: RequestActor, id: string): FunnelMembership { const item = this.store.getState().funnelMemberships.find((membership) => membership.tenantId === actor.tenantId && membership.id === id); if (!item) notFound(`Funnel membership ${id} not found`); return item; }
  private findLandingPage(actor: RequestActor, id: string): LandingPage { const item = this.store.getState().landingPages.find((page) => page.tenantId === actor.tenantId && page.id === id); if (!item) notFound(`Landing page ${id} not found`); return item; }
  private findExperiment(actor: RequestActor, id: string): Experiment { const item = this.store.getState().experiments.find((experiment) => experiment.tenantId === actor.tenantId && experiment.id === id); if (!item) notFound(`Experiment ${id} not found`); return item; }
  private findNurtureSequence(actor: RequestActor, id: string): NurtureSequence { const item = this.store.getState().nurtureSequences.find((sequence) => sequence.tenantId === actor.tenantId && sequence.id === id); if (!item) notFound(`Nurture sequence ${id} not found`); return item; }
  private findNurtureEnrollment(actor: RequestActor, id: string): NurtureEnrollment { const item = this.store.getState().nurtureEnrollments.find((enrollment) => enrollment.tenantId === actor.tenantId && enrollment.id === id); if (!item) notFound(`Nurture enrollment ${id} not found`); return item; }
}
