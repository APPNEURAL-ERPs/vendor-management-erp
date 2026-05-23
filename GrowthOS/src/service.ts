import { DataStore } from "./core/datastore";
import {
  Audience,
  Campaign,
  Conversion,
  Funnel,
  FunnelStage,
  GrowthEvent,
  GrowthMetric,
  GrowthOverview,
  GrowthStrategy,
  Experiment,
  ExperimentVariant,
  Lead,
  RequestActor
} from "./core/domain";
import { newId, nowIso } from "./core/id";
import { clone, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, pickQuery } from "./core/utils";

export class GrowthService {
  constructor(private readonly store: DataStore) {}

  overview(actor: RequestActor): GrowthOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;

    const strategies = state.strategies.filter(s => s.tenantId === tenant);
    const funnels = state.funnels.filter(f => f.tenantId === tenant);
    const campaigns = state.campaigns.filter(c => c.tenantId === tenant);
    const audiences = state.audiences.filter(a => a.tenantId === tenant);
    const experiments = state.experiments.filter(e => e.tenantId === tenant);
    const leads = state.leads.filter(l => l.tenantId === tenant);
    const metrics = state.metrics.filter(m => m.tenantId === tenant);

    const funnelStages = state.funnelStages.filter(s => s.tenantId === tenant);
    const avgConversionRate = funnels.length > 0
      ? funnels.reduce((sum, f) => sum + (f.conversionRate || 0), 0) / funnels.length
      : 0;

    return {
      strategies: {
        total: strategies.length,
        active: strategies.filter(s => s.status === "active").length
      },
      funnels: {
        total: funnels.length,
        avgConversionRate: Math.round(avgConversionRate * 100) / 100
      },
      campaigns: {
        total: campaigns.length,
        active: campaigns.filter(c => c.status === "active").length,
        totalBudget: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
        totalSpent: campaigns.reduce((sum, c) => sum + (c.spent || 0), 0)
      },
      audiences: {
        total: audiences.length,
        avgSize: audiences.length > 0
          ? audiences.reduce((sum, a) => sum + (a.size || 0), 0) / audiences.length
          : 0
      },
      experiments: {
        total: experiments.length,
        active: experiments.filter(e => e.status === "active").length,
        completed: experiments.filter(e => e.status === "archived" && e.result).length
      },
      leads: {
        total: leads.length,
        qualified: leads.filter(l => l.status === "qualified").length,
        converted: leads.filter(l => l.status === "converted").length
      },
      metrics: {
        acquisition: metrics.find(m => m.type === "acquisition")?.value || 0,
        activation: metrics.find(m => m.type === "activation")?.value || 0,
        retention: metrics.find(m => m.type === "retention")?.value || 0,
        revenue: metrics.find(m => m.type === "revenue")?.value || 0,
        referral: metrics.find(m => m.type === "referral")?.value || 0
      }
    };
  }

  listStrategies(actor: RequestActor, query?: URLSearchParams): GrowthStrategy[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    return clone(this.store.getState().strategies.filter(s => {
      if (s.tenantId !== actor.tenantId) return false;
      if (search && !`${s.key} ${s.name} ${s.description || ""}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  createStrategy(input: unknown, actor: RequestActor): GrowthStrategy {
    const body = ensureObject(input, "strategy");
    const state = this.store.getState();
    const key = ensureString(body.key, "strategy.key");
    if (state.strategies.some(s => s.tenantId === actor.tenantId && s.key === key)) {
      throw new Error(`Strategy key '${key}' already exists`);
    }
    const strategy: GrowthStrategy = {
      id: newId("strategy"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "strategy.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status || "active") as GrowthStrategy["status"],
      goals: ensureArray(body.goals, "strategy.goals", []),
      channels: ensureArray(body.channels, "strategy.channels", []),
      model: String(body.model || "hybrid") as GrowthStrategy["model"],
      priorities: ensureArray(body.priorities, "strategy.priorities", []),
      metrics: ensureObject(body.metrics, "strategy.metrics"),
      createdBy: actor.userId
    };
    state.strategies.push(strategy);
    this.store.save();
    this.store.audit(actor, "strategy.create", "strategy", strategy.id, undefined, strategy);
    return clone(strategy);
  }

  listFunnels(actor: RequestActor): Funnel[] {
    return clone(this.store.getState().funnels.filter(f => f.tenantId === actor.tenantId));
  }

  getFunnel(id: string, actor: RequestActor): { funnel: Funnel; stages: FunnelStage[] } {
    const funnel = this.store.getState().funnels.find(f => f.id === id && f.tenantId === actor.tenantId);
    if (!funnel) throw new Error("Funnel not found");
    const stages = this.store.getState().funnelStages.filter(s => s.funnelId === id && s.tenantId === actor.tenantId);
    return { funnel: clone(funnel), stages: clone(stages) };
  }

  createFunnel(input: unknown, actor: RequestActor): Funnel {
    const body = ensureObject(input, "funnel");
    const state = this.store.getState();
    const key = ensureString(body.key, "funnel.key");
    if (state.funnels.some(f => f.tenantId === actor.tenantId && f.key === key)) {
      throw new Error(`Funnel key '${key}' already exists`);
    }
    const funnel: Funnel = {
      id: newId("funnel"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "funnel.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status || "active") as Funnel["status"],
      type: String(body.type || "acquisition") as Funnel["type"],
      createdBy: actor.userId
    };
    state.funnels.push(funnel);
    this.store.save();
    this.store.audit(actor, "funnel.create", "funnel", funnel.id, undefined, funnel);
    return clone(funnel);
  }

  addFunnelStage(funnelId: string, input: unknown, actor: RequestActor): FunnelStage {
    const body = ensureObject(input, "funnelStage");
    const funnel = this.store.getState().funnels.find(f => f.id === funnelId && f.tenantId === actor.tenantId);
    if (!funnel) throw new Error("Funnel not found");
    const existingStages = this.store.getState().funnelStages.filter(s => s.funnelId === funnelId);
    const order = ensureNumber(body.order, "funnelStage.order", existingStages.length + 1);
    const stage: FunnelStage = {
      id: newId("stage"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      funnelId,
      name: ensureString(body.name, "funnelStage.name"),
      order,
      description: body.description ? String(body.description) : undefined,
      visitors: ensureNumber(body.visitors, "funnelStage.visitors", 0),
      leads: ensureNumber(body.leads, "funnelStage.leads", 0),
      conversions: ensureNumber(body.conversions, "funnelStage.conversions", 0),
      dropoffRate: 0,
      conversionRate: 0,
      avgTimeInStage: body.avgTimeInStage ? Number(body.avgTimeInStage) : undefined
    };
    if (stage.visitors > 0) {
      stage.conversionRate = Math.round((stage.conversions / stage.visitors) * 100);
      if (existingStages.length > 0) {
        const prevVisitors = existingStages[order - 2]?.visitors || stage.visitors;
        stage.dropoffRate = Math.round(((prevVisitors - stage.visitors) / prevVisitors) * 100);
      }
    }
    this.store.getState().funnelStages.push(stage);
    this.updateFunnelMetrics(funnel);
    this.store.save();
    this.store.audit(actor, "funnel.stage.add", "funnelStage", stage.id, undefined, stage);
    return clone(stage);
  }

  private updateFunnelMetrics(funnel: Funnel): void {
    const stages = this.store.getState().funnelStages
      .filter(s => s.funnelId === funnel.id)
      .sort((a, b) => a.order - b.order);
    if (stages.length > 0) {
      funnel.totalVisitors = stages[0].visitors;
      funnel.totalLeads = stages.reduce((sum, s) => sum + s.leads, 0);
      funnel.totalConversions = stages[stages.length - 1]?.conversions || 0;
      funnel.conversionRate = funnel.totalVisitors ? funnel.totalConversions / funnel.totalVisitors : 0;
    }
    funnel.updatedAt = nowIso();
  }

  listCampaigns(actor: RequestActor, query?: URLSearchParams): Campaign[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");
    return clone(this.store.getState().campaigns.filter(c => {
      if (c.tenantId !== actor.tenantId) return false;
      if (search && !`${c.key} ${c.name} ${c.description || ""}`.toLowerCase().includes(search)) return false;
      if (status && c.status !== status) return false;
      return true;
    }));
  }

  getCampaign(id: string, actor: RequestActor): Campaign {
    const campaign = this.store.getState().campaigns.find(c => c.id === id && c.tenantId === actor.tenantId);
    if (!campaign) throw new Error("Campaign not found");
    return clone(campaign);
  }

  createCampaign(input: unknown, actor: RequestActor): Campaign {
    const body = ensureObject(input, "campaign");
    const state = this.store.getState();
    const key = ensureString(body.key, "campaign.key");
    if (state.campaigns.some(c => c.tenantId === actor.tenantId && c.key === key)) {
      throw new Error(`Campaign key '${key}' already exists`);
    }
    const campaign: Campaign = {
      id: newId("campaign"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "campaign.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status || "active") as Campaign["status"],
      type: String(body.type || "lead_magnet") as Campaign["type"],
      funnelId: body.funnelId ? String(body.funnelId) : undefined,
      audienceId: body.audienceId ? String(body.audienceId) : undefined,
      channels: ensureArray(body.channels, "campaign.channels", []),
      startDate: body.startDate ? String(body.startDate) : undefined,
      endDate: body.endDate ? String(body.endDate) : undefined,
      budget: body.budget ? Number(body.budget) : undefined,
      createdBy: actor.userId
    };
    state.campaigns.push(campaign);
    this.store.save();
    this.store.audit(actor, "campaign.create", "campaign", campaign.id, undefined, campaign);
    return clone(campaign);
  }

  updateCampaignMetrics(id: string, input: unknown, actor: RequestActor): Campaign {
    const campaign = this.store.getState().campaigns.find(c => c.id === id && c.tenantId === actor.tenantId);
    if (!campaign) throw new Error("Campaign not found");
    const body = ensureObject(input, "campaignMetrics");
    if (body.spent !== undefined) campaign.spent = Number(body.spent);
    if (body.impressions !== undefined) campaign.impressions = Number(body.impressions);
    if (body.clicks !== undefined) campaign.clicks = Number(body.clicks);
    if (body.conversions !== undefined) campaign.conversions = Number(body.conversions);
    if (body.revenue !== undefined) campaign.revenue = Number(body.revenue);
    if (campaign.budget && campaign.spent && campaign.revenue) {
      campaign.roi = (campaign.revenue - campaign.spent) / campaign.spent;
    }
    campaign.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "campaign.metrics.update", "campaign", campaign.id, undefined, campaign);
    return clone(campaign);
  }

  listAudiences(actor: RequestActor): Audience[] {
    return clone(this.store.getState().audiences.filter(a => a.tenantId === actor.tenantId));
  }

  createAudience(input: unknown, actor: RequestActor): Audience {
    const body = ensureObject(input, "audience");
    const state = this.store.getState();
    const key = ensureString(body.key, "audience.key");
    if (state.audiences.some(a => a.tenantId === actor.tenantId && a.key === key)) {
      throw new Error(`Audience key '${key}' already exists`);
    }
    const audience: Audience = {
      id: newId("audience"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "audience.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status || "active") as Audience["status"],
      size: body.size ? Number(body.size) : undefined,
      segments: ensureArray(body.segments, "audience.segments", []),
      sources: ensureArray(body.sources, "audience.sources", []),
      createdBy: actor.userId
    };
    state.audiences.push(audience);
    this.store.save();
    this.store.audit(actor, "audience.create", "audience", audience.id, undefined, audience);
    return clone(audience);
  }

  listExperiments(actor: RequestActor): Experiment[] {
    return clone(this.store.getState().experiments.filter(e => e.tenantId === actor.tenantId));
  }

  createExperiment(input: unknown, actor: RequestActor): Experiment {
    const body = ensureObject(input, "experiment");
    const state = this.store.getState();
    const key = ensureString(body.key, "experiment.key");
    if (state.experiments.some(e => e.tenantId === actor.tenantId && e.key === key)) {
      throw new Error(`Experiment key '${key}' already exists`);
    }
    const experiment: Experiment = {
      id: newId("exp"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "experiment.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status || "active") as Experiment["status"],
      type: String(body.type || "ab_test") as Experiment["type"],
      hypothesis: body.hypothesis ? String(body.hypothesis) : undefined,
      metric: ensureString(body.metric, "experiment.metric"),
      successCriteria: body.successCriteria ? Number(body.successCriteria) : undefined,
      funnelStageId: body.funnelStageId ? String(body.funnelStageId) : undefined,
      variants: [],
      trafficSplit: ensureArray(body.trafficSplit, "experiment.trafficSplit", []),
      startDate: body.startDate ? String(body.startDate) : undefined,
      endDate: body.endDate ? String(body.endDate) : undefined,
      createdBy: actor.userId
    };
    state.experiments.push(experiment);
    this.store.save();
    this.store.audit(actor, "experiment.create", "experiment", experiment.id, undefined, experiment);
    return clone(experiment);
  }

  addExperimentVariant(experimentId: string, input: unknown, actor: RequestActor): ExperimentVariant {
    const body = ensureObject(input, "variant");
    const experiment = this.store.getState().experiments.find(e => e.id === experimentId && e.tenantId === actor.tenantId);
    if (!experiment) throw new Error("Experiment not found");
    const variant: ExperimentVariant = {
      id: newId("var"),
      name: ensureString(body.name, "variant.name"),
      description: body.description ? String(body.description) : undefined,
      config: ensureObject(body.config, "variant.config"),
      traffic: ensureNumber(body.traffic, "variant.traffic", 50),
      conversions: 0,
      visitors: 0
    };
    experiment.variants.push(variant);
    experiment.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "experiment.variant.add", "experimentVariant", variant.id, undefined, { experimentId, variant });
    return clone(variant);
  }

  recordExperimentResult(experimentId: string, input: unknown, actor: RequestActor): Experiment {
    const experiment = this.store.getState().experiments.find(e => e.id === experimentId && e.tenantId === actor.tenantId);
    if (!experiment) throw new Error("Experiment not found");
    const body = ensureObject(input, "result");
    experiment.winner = body.winner ? String(body.winner) : undefined;
    experiment.status = "archived";
    if (body.variants) {
      for (const v of body.variants) {
        const variant = experiment.variants.find(vv => vv.id === v.id);
        if (variant) {
          variant.conversions = Number(v.conversions || 0);
          variant.visitors = Number(v.visitors || 0);
          variant.conversionRate = variant.visitors ? (variant.conversions / variant.visitors) * 100 : 0;
        }
      }
    }
    experiment.result = body.result ? {
      winner: String(body.result.winner || experiment.winner || ""),
      confidence: Number(body.result.confidence || 0),
      lift: Number(body.result.lift || 0),
      sampleSize: Number(body.result.sampleSize || 0),
      statisticalSignificance: ensureBoolean(body.result.statisticalSignificance, false)
    } : undefined;
    experiment.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "experiment.complete", "experiment", experiment.id, undefined, experiment);
    return clone(experiment);
  }

  listLeads(actor: RequestActor, query?: URLSearchParams): Lead[] {
    const status = pickQuery(query, "status");
    const campaignId = pickQuery(query, "campaignId");
    return clone(this.store.getState().leads.filter(l => {
      if (l.tenantId !== actor.tenantId) return false;
      if (status && l.status !== status) return false;
      if (campaignId && l.campaignId !== campaignId) return false;
      return true;
    }));
  }

  createLead(input: unknown, actor: RequestActor): Lead {
    const body = ensureObject(input, "lead");
    const lead: Lead = {
      id: newId("lead"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      email: ensureString(body.email, "lead.email"),
      name: body.name ? String(body.name) : undefined,
      company: body.company ? String(body.company) : undefined,
      source: ensureString(body.source, "lead.source"),
      campaignId: body.campaignId ? String(body.campaignId) : undefined,
      audienceId: body.audienceId ? String(body.audienceId) : undefined,
      status: String(body.status || "new") as Lead["status"],
      score: body.score ? Number(body.score) : undefined,
      tags: ensureArray(body.tags, "lead.tags", []),
      metadata: ensureObject(body.metadata, "lead.metadata")
    };
    this.store.getState().leads.push(lead);
    this.store.save();
    this.store.audit(actor, "lead.create", "lead", lead.id, undefined, lead);
    return clone(lead);
  }

  updateLeadStatus(id: string, input: unknown, actor: RequestActor): Lead {
    const lead = this.store.getState().leads.find(l => l.id === id && l.tenantId === actor.tenantId);
    if (!lead) throw new Error("Lead not found");
    const body = ensureObject(input, "leadUpdate");
    if (body.status) lead.status = String(body.status) as Lead["status"];
    if (body.score !== undefined) lead.score = Number(body.score);
    if (body.tags) lead.tags = ensureArray(body.tags, "tags", lead.tags);
    lead.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "lead.update", "lead", lead.id, undefined, lead);
    return clone(lead);
  }

  recordConversion(input: unknown, actor: RequestActor): Conversion {
    const body = ensureObject(input, "conversion");
    const conversion: Conversion = {
      id: newId("conv"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      leadId: body.leadId ? String(body.leadId) : undefined,
      campaignId: body.campaignId ? String(body.campaignId) : undefined,
      funnelStageId: body.funnelStageId ? String(body.funnelStageId) : undefined,
      type: String(body.type || "signup") as Conversion["type"],
      value: body.value ? Number(body.value) : undefined,
      currency: body.currency ? String(body.currency) : undefined,
      metadata: ensureObject(body.metadata, "conversion.metadata")
    };
    this.store.getState().conversions.push(conversion);
    if (conversion.leadId) {
      const lead = this.store.getState().leads.find(l => l.id === conversion.leadId);
      if (lead && lead.status !== "converted") {
        lead.status = "converted";
        lead.updatedAt = nowIso();
      }
    }
    this.store.save();
    this.store.audit(actor, "conversion.record", "conversion", conversion.id, undefined, conversion);
    return clone(conversion);
  }

  listMetrics(actor: RequestActor): GrowthMetric[] {
    return clone(this.store.getState().metrics.filter(m => m.tenantId === actor.tenantId));
  }

  recordMetric(input: unknown, actor: RequestActor): GrowthMetric {
    const body = ensureObject(input, "metric");
    const metric: GrowthMetric = {
      id: newId("metric"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "metric.name"),
      type: String(body.type || "acquisition") as GrowthMetric["type"],
      value: ensureNumber(body.value, "metric.value"),
      previousValue: body.previousValue ? Number(body.previousValue) : undefined,
      change: body.change ? Number(body.change) : undefined,
      changePercent: body.changePercent ? Number(body.changePercent) : undefined,
      period: ensureString(body.period, "metric.period", "monthly"),
      unit: body.unit ? String(body.unit) : undefined,
      metadata: ensureObject(body.metadata, "metric.metadata")
    };
    this.store.getState().metrics.push(metric);
    this.store.save();
    this.store.audit(actor, "metric.record", "growthMetric", metric.id, undefined, metric);
    return clone(metric);
  }

  listEvents(actor: RequestActor): GrowthEvent[] {
    return clone(this.store.getState().events.filter(e => e.tenantId === actor.tenantId));
  }

  emitEvent(input: unknown, actor: RequestActor): GrowthEvent {
    const body = ensureObject(input, "event");
    const event: GrowthEvent = {
      id: newId("event"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type: ensureString(body.type, "event.type"),
      source: ensureString(body.source, "event.source"),
      data: ensureObject(body.data, "event.data"),
      correlationId: body.correlationId ? String(body.correlationId) : undefined
    };
    this.store.getState().events.unshift(event);
    this.store.save();
    return clone(event);
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter(l => l.tenantId === actor.tenantId));
  }
}
