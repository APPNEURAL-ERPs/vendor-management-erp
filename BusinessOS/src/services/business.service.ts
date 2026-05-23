import { DataStore } from "../core/datastore";
import {
  BusinessOverview,
  BusinessPlan,
  BusinessProcess,
  BusinessModel,
  Competitor,
  CustomerJourney,
  CustomerPersona,
  Decision,
  Goal,
  Initiative,
  KeyResult,
  OKR,
  Offer,
  PricingPlan,
  RequestActor,
  RevenueModel,
  Risk,
  Roadmap,
  Scorecard,
  SOP,
  Strategy,
  SWOTAnalysis
} from "../core/domain";
import { conflict, notFound } from "../core/errors";
import { newId, nowIso } from "../core/id";
import { clone, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, pickQuery, optionalObject } from "../core/utils";

export class BusinessService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "BusinessOS service is ready";
  }

  overview(actor: RequestActor): BusinessOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;

    const strategies = state.strategies.filter((s) => s.tenantId === tenant);
    const goals = state.goals.filter((g) => g.tenantId === tenant);
    const okrs = state.okrs.filter((o) => o.tenantId === tenant);
    const initiatives = state.initiatives.filter((i) => i.tenantId === tenant);
    const businessPlans = state.businessPlans.filter((p) => p.tenantId === tenant);
    const scorecards = state.scorecards.filter((s) => s.tenantId === tenant);
    const decisions = state.decisions.filter((d) => d.tenantId === tenant);
    const swotAnalyses = state.swotAnalyses.filter((s) => s.tenantId === tenant);
    const competitors = state.competitors.filter((c) => c.tenantId === tenant);
    const risks = state.risks.filter((r) => r.tenantId === tenant);
    const offers = state.offers.filter((o) => o.tenantId === tenant);
    const roadmaps = state.roadmaps.filter((r) => r.tenantId === tenant);

    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    goals.forEach((g) => {
      byCategory[g.category] = (byCategory[g.category] ?? 0) + 1;
      byStatus[g.status] = (byStatus[g.status] ?? 0) + 1;
    });

    const bySeverity: Record<string, number> = {};
    risks.forEach((r) => {
      bySeverity[r.severity] = (bySeverity[r.severity] ?? 0) + 1;
    });

    const avgProgress = okrs.length ? Math.round(okrs.reduce((sum, o) => sum + o.progress, 0) / okrs.length) : 0;

    return {
      strategies: {
        total: strategies.length,
        active: strategies.filter((s) => s.status === "active").length
      },
      goals: {
        total: goals.length,
        byCategory,
        byStatus
      },
      okrs: {
        total: okrs.length,
        active: okrs.filter((o) => o.status !== "completed").length,
        averageProgress: avgProgress
      },
      initiatives: {
        total: initiatives.length,
        active: initiatives.filter((i) => i.status !== "completed").length
      },
      businessPlans: {
        total: businessPlans.length,
        approved: businessPlans.filter((p) => p.approved).length
      },
      scorecards: {
        total: scorecards.length,
        active: scorecards.filter((s) => s.status === "active").length
      },
      decisions: {
        total: decisions.length,
        pending: decisions.filter((d) => d.status === "pending").length,
        decided: decisions.filter((d) => d.status === "decided" || d.status === "implemented").length
      },
      swotAnalyses: swotAnalyses.length,
      competitors: competitors.length,
      risks: {
        total: risks.length,
        bySeverity
      },
      offers: {
        total: offers.length,
        active: offers.filter((o) => o.status === "active").length
      },
      roadmaps: roadmaps.length
    };
  }

  listStrategies(actor: RequestActor, query?: URLSearchParams): Strategy[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    return clone(this.store.getState().strategies.filter((s) => {
      if (s.tenantId !== actor.tenantId) return false;
      if (search && !`${s.key} ${s.name}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  createStrategy(input: unknown, actor: RequestActor): Strategy {
    const body = ensureObject(input, "strategy");
    const state = this.store.getState();
    const key = ensureString(body.key, "strategy.key");
    if (state.strategies.some((s) => s.tenantId === actor.tenantId && s.key === key)) conflict(`Strategy key '${key}' already exists`);

    const strategy: Strategy = {
      id: newId("strategy"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      status: body.status ?? "active",
      key,
      name: ensureString(body.name, "strategy.name"),
      description: body.description ? String(body.description) : undefined,
      vision: body.vision ? String(body.vision) : undefined,
      mission: body.mission ? String(body.mission) : undefined,
      values: ensureArray(body.values, "strategy.values", []),
      strategicThemes: ensureArray(body.strategicThemes, "strategy.strategicThemes", []),
      timeHorizon: body.timeHorizon ?? "medium_term",
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      tags: ensureArray(body.tags, "strategy.tags", [])
    };

    state.strategies.push(strategy);
    this.store.save();
    this.store.audit(actor, "strategy.create", "strategy", strategy.id, undefined, strategy);
    return clone(strategy);
  }

  listGoals(actor: RequestActor, query?: URLSearchParams): Goal[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const category = pickQuery(query, "category");
    return clone(this.store.getState().goals.filter((g) => {
      if (g.tenantId !== actor.tenantId) return false;
      if (search && !`${g.key} ${g.name}`.toLowerCase().includes(search)) return false;
      if (category && g.category !== category) return false;
      return true;
    }));
  }

  createGoal(input: unknown, actor: RequestActor): Goal {
    const body = ensureObject(input, "goal");
    const state = this.store.getState();
    const key = ensureString(body.key, "goal.key");
    if (state.goals.some((g) => g.tenantId === actor.tenantId && g.key === key)) conflict(`Goal key '${key}' already exists`);

    const goal: Goal = {
      id: newId("goal"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      status: body.status ?? "active",
      key,
      name: ensureString(body.name, "goal.name"),
      description: body.description ? String(body.description) : undefined,
      strategyId: body.strategyId ? String(body.strategyId) : undefined,
      category: body.category ?? "other",
      priority: body.priority ?? "medium",
      progress: ensureNumber(body.progress, "goal.progress", 0),
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      dueDate: body.dueDate ? String(body.dueDate) : undefined,
      tags: ensureArray(body.tags, "goal.tags", [])
    };

    state.goals.push(goal);
    this.store.save();
    this.store.audit(actor, "goal.create", "goal", goal.id, undefined, goal);
    return clone(goal);
  }

  updateGoal(id: string, input: unknown, actor: RequestActor): Goal {
    const state = this.store.getState();
    const goal = state.goals.find((g) => g.id === id && g.tenantId === actor.tenantId);
    if (!goal) notFound("Goal not found");

    const body = ensureObject(input, "goal");
    const before = clone(goal);

    if (body.name !== undefined) goal.name = String(body.name);
    if (body.description !== undefined) goal.description = String(body.description);
    if (body.category !== undefined) goal.category = body.category;
    if (body.priority !== undefined) goal.priority = body.priority;
    if (body.progress !== undefined) goal.progress = ensureNumber(body.progress, "progress");
    if (body.dueDate !== undefined) goal.dueDate = String(body.dueDate);
    if (body.status !== undefined) goal.status = body.status;
    if (body.tags !== undefined) goal.tags = ensureArray(body.tags, "tags");

    goal.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "goal.update", "goal", goal.id, before, goal);
    return clone(goal);
  }

  listOKRs(actor: RequestActor, query?: URLSearchParams): OKR[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    return clone(this.store.getState().okrs.filter((o) => {
      if (o.tenantId !== actor.tenantId) return false;
      if (search && !`${o.key} ${o.name}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  createOKR(input: unknown, actor: RequestActor): OKR {
    const body = ensureObject(input, "okr");
    const state = this.store.getState();
    const key = ensureString(body.key, "okr.key");
    if (state.okrs.some((o) => o.tenantId === actor.tenantId && o.key === key)) conflict(`OKR key '${key}' already exists`);

    const keyResults: KeyResult[] = ensureArray(body.keyResults, "okr.keyResults", []).map((kr: any) => ({
      id: kr.id ?? newId("kr"),
      name: kr.name ?? "",
      target: kr.target ?? 0,
      current: kr.current ?? 0,
      unit: kr.unit ?? "",
      confidence: kr.confidence ?? 50,
      status: kr.status ?? "not_started"
    }));

    const okr: OKR = {
      id: newId("okr"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "okr.name"),
      description: body.description ? String(body.description) : undefined,
      objective: ensureString(body.objective, "okr.objective"),
      keyResults,
      goalId: body.goalId ? String(body.goalId) : undefined,
      period: body.period ?? "quarterly",
      startDate: body.startDate ? String(body.startDate) : nowIso(),
      endDate: ensureString(body.endDate, "okr.endDate"),
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      progress: ensureNumber(body.progress, "okr.progress", 0),
      status: body.status ?? "in_progress"
    };

    state.okrs.push(okr);
    this.store.save();
    this.store.audit(actor, "okr.create", "okr", okr.id, undefined, okr);
    return clone(okr);
  }

  listInitiatives(actor: RequestActor, query?: URLSearchParams): Initiative[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    return clone(this.store.getState().initiatives.filter((i) => {
      if (i.tenantId !== actor.tenantId) return false;
      if (search && !`${i.key} ${i.name}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  createInitiative(input: unknown, actor: RequestActor): Initiative {
    const body = ensureObject(input, "initiative");
    const state = this.store.getState();
    const key = ensureString(body.key, "initiative.key");
    if (state.initiatives.some((i) => i.tenantId === actor.tenantId && i.key === key)) conflict(`Initiative key '${key}' already exists`);

    const initiative: Initiative = {
      id: newId("initiative"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "initiative.name"),
      description: body.description ? String(body.description) : undefined,
      strategyId: body.strategyId ? String(body.strategyId) : undefined,
      goalId: body.goalId ? String(body.goalId) : undefined,
      okrId: body.okrId ? String(body.okrId) : undefined,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      priority: body.priority ?? "medium",
      progress: ensureNumber(body.progress, "initiative.progress", 0),
      status: body.status ?? "in_progress",
      startDate: body.startDate ? String(body.startDate) : undefined,
      endDate: body.endDate ? String(body.endDate) : undefined,
      budget: body.budget ? ensureNumber(body.budget, "initiative.budget") : undefined,
      tags: ensureArray(body.tags, "initiative.tags", [])
    };

    state.initiatives.push(initiative);
    this.store.save();
    this.store.audit(actor, "initiative.create", "initiative", initiative.id, undefined, initiative);
    return clone(initiative);
  }

  listBusinessPlans(actor: RequestActor): BusinessPlan[] {
    return clone(this.store.getState().businessPlans.filter((p) => p.tenantId === actor.tenantId));
  }

  createBusinessPlan(input: unknown, actor: RequestActor): BusinessPlan {
    const body = ensureObject(input, "businessPlan");
    const state = this.store.getState();
    const key = ensureString(body.key, "businessPlan.key");
    if (state.businessPlans.some((p) => p.tenantId === actor.tenantId && p.key === key)) conflict(`Business plan key '${key}' already exists`);

    const plan: BusinessPlan = {
      id: newId("plan"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      status: body.status ?? "active",
      key,
      name: ensureString(body.name, "businessPlan.name"),
      description: body.description ? String(body.description) : undefined,
      type: body.type ?? "startup",
      executiveSummary: body.executiveSummary ? String(body.executiveSummary) : undefined,
      problem: body.problem ? String(body.problem) : undefined,
      solution: body.solution ? String(body.solution) : undefined,
      targetMarket: body.targetMarket ? String(body.targetMarket) : undefined,
      businessModel: body.businessModel ? String(body.businessModel) : undefined,
      revenueStreams: ensureArray(body.revenueStreams, "businessPlan.revenueStreams", []),
      competitors: body.competitors ? String(body.competitors) : undefined,
      goToMarket: body.goToMarket ? String(body.goToMarket) : undefined,
      operations: body.operations ? String(body.operations) : undefined,
      team: body.team ? String(body.team) : undefined,
      financialProjections: body.financialProjections ? String(body.financialProjections) : undefined,
      risks: body.risks ? String(body.risks) : undefined,
      roadmap: body.roadmap ? String(body.roadmap) : undefined,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      approved: ensureBoolean(body.approved, false)
    };

    state.businessPlans.push(plan);
    this.store.save();
    this.store.audit(actor, "businessPlan.create", "businessPlan", plan.id, undefined, plan);
    return clone(plan);
  }

  listScorecards(actor: RequestActor): Scorecard[] {
    return clone(this.store.getState().scorecards.filter((s) => s.tenantId === actor.tenantId));
  }

  createScorecard(input: unknown, actor: RequestActor): Scorecard {
    const body = ensureObject(input, "scorecard");
    const state = this.store.getState();
    const key = ensureString(body.key, "scorecard.key");
    if (state.scorecards.some((s) => s.tenantId === actor.tenantId && s.key === key)) conflict(`Scorecard key '${key}' already exists`);

    const scorecard: Scorecard = {
      id: newId("scorecard"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      status: body.status ?? "active",
      key,
      name: ensureString(body.name, "scorecard.name"),
      description: body.description ? String(body.description) : undefined,
      perspective: body.perspective ?? "financial",
      metrics: ensureArray(body.metrics, "scorecard.metrics", []),
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      period: body.period ?? "monthly"
    };

    state.scorecards.push(scorecard);
    this.store.save();
    this.store.audit(actor, "scorecard.create", "scorecard", scorecard.id, undefined, scorecard);
    return clone(scorecard);
  }

  listDecisions(actor: RequestActor, query?: URLSearchParams): Decision[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");
    return clone(this.store.getState().decisions.filter((d) => {
      if (d.tenantId !== actor.tenantId) return false;
      if (search && !`${d.key} ${d.title}`.toLowerCase().includes(search)) return false;
      if (status && d.status !== status) return false;
      return true;
    }));
  }

  createDecision(input: unknown, actor: RequestActor): Decision {
    const body = ensureObject(input, "decision");
    const state = this.store.getState();
    const key = ensureString(body.key, "decision.key");
    if (state.decisions.some((d) => d.tenantId === actor.tenantId && d.key === key)) conflict(`Decision key '${key}' already exists`);

    const decision: Decision = {
      id: newId("decision"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      title: ensureString(body.title, "decision.title"),
      description: ensureString(body.description, "decision.description"),
      category: body.category ?? "strategic",
      status: body.status ?? "pending",
      priority: body.priority ?? "medium",
      decisionMaker: body.decisionMaker ? String(body.decisionMaker) : undefined,
      options: ensureArray(body.options, "decision.options", []),
      selectedOptionId: body.selectedOptionId ? String(body.selectedOptionId) : undefined,
      rationale: body.rationale ? String(body.rationale) : undefined,
      implementationDate: body.implementationDate ? String(body.implementationDate) : undefined,
      reviewDate: body.reviewDate ? String(body.reviewDate) : undefined,
      outcome: body.outcome ? String(body.outcome) : undefined,
      relatedGoals: ensureArray(body.relatedGoals, "decision.relatedGoals", []),
      relatedInitiatives: ensureArray(body.relatedInitiatives, "decision.relatedInitiatives", [])
    };

    state.decisions.push(decision);
    this.store.save();
    this.store.audit(actor, "decision.create", "decision", decision.id, undefined, decision);
    return clone(decision);
  }

  listSWOTAnalyses(actor: RequestActor): SWOTAnalysis[] {
    return clone(this.store.getState().swotAnalyses.filter((s) => s.tenantId === actor.tenantId));
  }

  createSWOTAnalysis(input: unknown, actor: RequestActor): SWOTAnalysis {
    const body = ensureObject(input, "swotAnalysis");
    const state = this.store.getState();
    const key = ensureString(body.key, "swotAnalysis.key");
    if (state.swotAnalyses.some((s) => s.tenantId === actor.tenantId && s.key === key)) conflict(`SWOT analysis key '${key}' already exists`);

    const swot: SWOTAnalysis = {
      id: newId("swot"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      status: body.status ?? "active",
      key,
      name: ensureString(body.name, "swotAnalysis.name"),
      description: body.description ? String(body.description) : undefined,
      strategyId: body.strategyId ? String(body.strategyId) : undefined,
      items: ensureArray(body.items, "swotAnalysis.items", []),
      summary: body.summary ? String(body.summary) : undefined,
      ownerId: body.ownerId ? String(body.ownerId) : undefined
    };

    state.swotAnalyses.push(swot);
    this.store.save();
    this.store.audit(actor, "swotAnalysis.create", "swotAnalysis", swot.id, undefined, swot);
    return clone(swot);
  }

  listCompetitors(actor: RequestActor): Competitor[] {
    return clone(this.store.getState().competitors.filter((c) => c.tenantId === actor.tenantId));
  }

  createCompetitor(input: unknown, actor: RequestActor): Competitor {
    const body = ensureObject(input, "competitor");
    const state = this.store.getState();
    const key = ensureString(body.key, "competitor.key");
    if (state.competitors.some((c) => c.tenantId === actor.tenantId && c.key === key)) conflict(`Competitor key '${key}' already exists`);

    const competitor: Competitor = {
      id: newId("competitor"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      status: body.status ?? "active",
      key,
      name: ensureString(body.name, "competitor.name"),
      description: body.description ? String(body.description) : undefined,
      website: body.website ? String(body.website) : undefined,
      marketPosition: body.marketPosition ? String(body.marketPosition) : undefined,
      strengths: ensureArray(body.strengths, "competitor.strengths", []),
      weaknesses: ensureArray(body.weaknesses, "competitor.weaknesses", []),
      offerings: ensureArray(body.offerings, "competitor.offerings", []),
      pricing: body.pricing ? String(body.pricing) : "",
      marketShare: body.marketShare ? ensureNumber(body.marketShare, "competitor.marketShare") : undefined,
      threatLevel: body.threatLevel ?? "medium",
      opportunities: ensureArray(body.opportunities, "competitor.opportunities", []),
      threats: ensureArray(body.threats, "competitor.threats", [])
    };

    state.competitors.push(competitor);
    this.store.save();
    this.store.audit(actor, "competitor.create", "competitor", competitor.id, undefined, competitor);
    return clone(competitor);
  }

  listRisks(actor: RequestActor): Risk[] {
    return clone(this.store.getState().risks.filter((r) => r.tenantId === actor.tenantId));
  }

  createRisk(input: unknown, actor: RequestActor): Risk {
    const body = ensureObject(input, "risk");
    const state = this.store.getState();
    const key = ensureString(body.key, "risk.key");
    if (state.risks.some((r) => r.tenantId === actor.tenantId && r.key === key)) conflict(`Risk key '${key}' already exists`);

    const risk: Risk = {
      id: newId("risk"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "risk.name"),
      description: body.description ? String(body.description) : undefined,
      category: body.category ?? "financial",
      severity: body.severity ?? "medium",
      likelihood: body.likelihood ?? "medium",
      impact: body.impact ?? "medium",
      status: body.riskStatus ?? "identified",
      mitigation: body.mitigation ? String(body.mitigation) : undefined,
      contingency: body.contingency ? String(body.contingency) : undefined,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      identifiedDate: body.identifiedDate ? String(body.identifiedDate) : undefined,
      reviewDate: body.reviewDate ? String(body.reviewDate) : undefined,
      relatedGoals: ensureArray(body.relatedGoals, "risk.relatedGoals", [])
    };

    state.risks.push(risk);
    this.store.save();
    this.store.audit(actor, "risk.create", "risk", risk.id, undefined, risk);
    return clone(risk);
  }

  listOffers(actor: RequestActor): Offer[] {
    return clone(this.store.getState().offers.filter((o) => o.tenantId === actor.tenantId));
  }

  createOffer(input: unknown, actor: RequestActor): Offer {
    const body = ensureObject(input, "offer");
    const state = this.store.getState();
    const key = ensureString(body.key, "offer.key");
    if (state.offers.some((o) => o.tenantId === actor.tenantId && o.key === key)) conflict(`Offer key '${key}' already exists`);

    const offer: Offer = {
      id: newId("offer"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      status: body.status ?? "active",
      key,
      name: ensureString(body.name, "offer.name"),
      description: body.description ? String(body.description) : undefined,
      type: body.type ?? "service",
      components: ensureArray(body.components, "offer.components", []),
      price: ensureNumber(body.price, "offer.price"),
      currency: body.currency ?? "INR",
      targetSegment: body.targetSegment ? String(body.targetSegment) : undefined,
      painPoints: ensureArray(body.painPoints, "offer.painPoints", []),
      benefits: ensureArray(body.benefits, "offer.benefits", []),
      guarantee: body.guarantee ? String(body.guarantee) : undefined
    };

    state.offers.push(offer);
    this.store.save();
    this.store.audit(actor, "offer.create", "offer", offer.id, undefined, offer);
    return clone(offer);
  }

  listRoadmaps(actor: RequestActor): Roadmap[] {
    return clone(this.store.getState().roadmaps.filter((r) => r.tenantId === actor.tenantId));
  }

  createRoadmap(input: unknown, actor: RequestActor): Roadmap {
    const body = ensureObject(input, "roadmap");
    const state = this.store.getState();
    const key = ensureString(body.key, "roadmap.key");
    if (state.roadmaps.some((r) => r.tenantId === actor.tenantId && r.key === key)) conflict(`Roadmap key '${key}' already exists`);

    const roadmap: Roadmap = {
      id: newId("roadmap"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      status: body.status ?? "active",
      key,
      name: ensureString(body.name, "roadmap.name"),
      description: body.description ? String(body.description) : undefined,
      strategyId: body.strategyId ? String(body.strategyId) : undefined,
      phases: ensureArray(body.phases, "roadmap.phases", []),
      ownerId: body.ownerId ? String(body.ownerId) : undefined
    };

    state.roadmaps.push(roadmap);
    this.store.save();
    this.store.audit(actor, "roadmap.create", "roadmap", roadmap.id, undefined, roadmap);
    return clone(roadmap);
  }

  listProcesses(actor: RequestActor): BusinessProcess[] {
    return clone(this.store.getState().processes.filter((p) => p.tenantId === actor.tenantId));
  }

  createProcess(input: unknown, actor: RequestActor): BusinessProcess {
    const body = ensureObject(input, "process");
    const state = this.store.getState();
    const key = ensureString(body.key, "process.key");
    if (state.processes.some((p) => p.tenantId === actor.tenantId && p.key === key)) conflict(`Process key '${key}' already exists`);

    const process: BusinessProcess = {
      id: newId("process"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      status: body.status ?? "active",
      key,
      name: ensureString(body.name, "process.name"),
      description: body.description ? String(body.description) : undefined,
      type: body.type ?? "other",
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      steps: ensureArray(body.steps, "process.steps", []),
      kpis: ensureArray(body.kpis, "process.kpis", []),
      automation: ensureArray(body.automation, "process.automation", [])
    };

    state.processes.push(process);
    this.store.save();
    this.store.audit(actor, "process.create", "process", process.id, undefined, process);
    return clone(process);
  }

  listSOPs(actor: RequestActor): SOP[] {
    return clone(this.store.getState().sops.filter((s) => s.tenantId === actor.tenantId));
  }

  createSOP(input: unknown, actor: RequestActor): SOP {
    const body = ensureObject(input, "sop");
    const state = this.store.getState();
    const key = ensureString(body.key, "sop.key");
    if (state.sops.some((s) => s.tenantId === actor.tenantId && s.key === key)) conflict(`SOP key '${key}' already exists`);

    const sop: SOP = {
      id: newId("sop"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      status: body.status ?? "active",
      key,
      name: ensureString(body.name, "sop.name"),
      description: body.description ? String(body.description) : undefined,
      processId: body.processId ? String(body.processId) : undefined,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      version: 1,
      steps: ensureArray(body.steps, "sop.steps", []),
      approvalRequired: ensureBoolean(body.approvalRequired, false),
      approvedBy: body.approvedBy ? String(body.approvedBy) : undefined,
      effectiveDate: body.effectiveDate ? String(body.effectiveDate) : nowIso(),
      reviewCycle: body.reviewCycle ? String(body.reviewCycle) : undefined
    };

    state.sops.push(sop);
    this.store.save();
    this.store.audit(actor, "sop.create", "sop", sop.id, undefined, sop);
    return clone(sop);
  }

  listPersonas(actor: RequestActor): CustomerPersona[] {
    return clone(this.store.getState().personas.filter((p) => p.tenantId === actor.tenantId));
  }

  createPersona(input: unknown, actor: RequestActor): CustomerPersona {
    const body = ensureObject(input, "persona");
    const state = this.store.getState();
    const key = ensureString(body.key, "persona.key");
    if (state.personas.some((p) => p.tenantId === actor.tenantId && p.key === key)) conflict(`Persona key '${key}' already exists`);

    const persona: CustomerPersona = {
      id: newId("persona"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      status: body.status ?? "active",
      key,
      name: ensureString(body.name, "persona.name"),
      description: body.description ? String(body.description) : undefined,
      type: body.type ?? "buyer",
      demographics: body.demographics ? String(body.demographics) : undefined,
      goals: ensureArray(body.goals, "persona.goals", []),
      painPoints: ensureArray(body.painPoints, "persona.painPoints", []),
      motivations: ensureArray(body.motivations, "persona.motivations", []),
      objections: ensureArray(body.objections, "persona.objections", []),
      preferredChannels: ensureArray(body.preferredChannels, "persona.preferredChannels", []),
      buyingBehavior: body.buyingBehavior ? String(body.buyingBehavior) : undefined
    };

    state.personas.push(persona);
    this.store.save();
    this.store.audit(actor, "persona.create", "persona", persona.id, undefined, persona);
    return clone(persona);
  }

  listCustomerJourneys(actor: RequestActor): CustomerJourney[] {
    return clone(this.store.getState().customerJourneys.filter((j) => j.tenantId === actor.tenantId));
  }

  createCustomerJourney(input: unknown, actor: RequestActor): CustomerJourney {
    const body = ensureObject(input, "customerJourney");
    const state = this.store.getState();
    const key = ensureString(body.key, "customerJourney.key");
    if (state.customerJourneys.some((j) => j.tenantId === actor.tenantId && j.key === key)) conflict(`Customer journey key '${key}' already exists`);

    const journey: CustomerJourney = {
      id: newId("journey"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      status: body.status ?? "active",
      key,
      name: ensureString(body.name, "customerJourney.name"),
      description: body.description ? String(body.description) : undefined,
      personaId: body.personaId ? String(body.personaId) : undefined,
      stages: ensureArray(body.stages, "customerJourney.stages", []),
      totalDuration: body.totalDuration ? String(body.totalDuration) : undefined,
      ownerId: body.ownerId ? String(body.ownerId) : undefined
    };

    state.customerJourneys.push(journey);
    this.store.save();
    this.store.audit(actor, "customerJourney.create", "customerJourney", journey.id, undefined, journey);
    return clone(journey);
  }

  listRevenueModels(actor: RequestActor): RevenueModel[] {
    return clone(this.store.getState().revenueModels.filter((r) => r.tenantId === actor.tenantId));
  }

  createRevenueModel(input: unknown, actor: RequestActor): RevenueModel {
    const body = ensureObject(input, "revenueModel");
    const state = this.store.getState();
    const key = ensureString(body.key, "revenueModel.key");
    if (state.revenueModels.some((r) => r.tenantId === actor.tenantId && r.key === key)) conflict(`Revenue model key '${key}' already exists`);

    const model: RevenueModel = {
      id: newId("revenue"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      status: body.status ?? "active",
      key,
      name: ensureString(body.name, "revenueModel.name"),
      description: body.description ? String(body.description) : undefined,
      type: body.type ?? "service",
      streams: ensureArray(body.streams, "revenueModel.streams", []),
      pricing: body.pricing ? String(body.pricing) : "",
      projections: body.projections ? String(body.projections) : undefined
    };

    state.revenueModels.push(model);
    this.store.save();
    this.store.audit(actor, "revenueModel.create", "revenueModel", model.id, undefined, model);
    return clone(model);
  }

  listPricingPlans(actor: RequestActor): PricingPlan[] {
    return clone(this.store.getState().pricingPlans.filter((p) => p.tenantId === actor.tenantId));
  }

  createPricingPlan(input: unknown, actor: RequestActor): PricingPlan {
    const body = ensureObject(input, "pricingPlan");
    const state = this.store.getState();
    const key = ensureString(body.key, "pricingPlan.key");
    if (state.pricingPlans.some((p) => p.tenantId === actor.tenantId && p.key === key)) conflict(`Pricing plan key '${key}' already exists`);

    const plan: PricingPlan = {
      id: newId("pricing"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      status: body.status ?? "active",
      key,
      name: ensureString(body.name, "pricingPlan.name"),
      description: body.description ? String(body.description) : undefined,
      tiers: ensureArray(body.tiers, "pricingPlan.tiers", []),
      currency: body.currency ?? "INR",
      effectiveDate: body.effectiveDate ? String(body.effectiveDate) : nowIso(),
      competitors: ensureArray(body.competitors, "pricingPlan.competitors", [])
    };

    state.pricingPlans.push(plan);
    this.store.save();
    this.store.audit(actor, "pricingPlan.create", "pricingPlan", plan.id, undefined, plan);
    return clone(plan);
  }

  listBusinessModels(actor: RequestActor): BusinessModel[] {
    return clone(this.store.getState().businessModels.filter((m) => m.tenantId === actor.tenantId));
  }

  createBusinessModel(input: unknown, actor: RequestActor): BusinessModel {
    const body = ensureObject(input, "businessModel");
    const state = this.store.getState();
    const key = ensureString(body.key, "businessModel.key");
    if (state.businessModels.some((m) => m.tenantId === actor.tenantId && m.key === key)) conflict(`Business model key '${key}' already exists`);

    const canvasBody = optionalObject(body.canvas);
    const model: BusinessModel = {
      id: newId("bizmodel"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      status: body.status ?? "active",
      key,
      name: ensureString(body.name, "businessModel.name"),
      description: body.description ? String(body.description) : undefined,
      type: body.type ?? "canvas",
      canvas: {
        key: canvasBody.key ?? key,
        name: canvasBody.name ?? ensureString(body.name, "businessModel.canvas.name"),
        description: canvasBody.description ? String(canvasBody.description) : undefined,
        customerSegments: ensureArray(canvasBody.customerSegments, "businessModel.canvas.customerSegments", []),
        valuePropositions: ensureArray(canvasBody.valuePropositions, "businessModel.canvas.valuePropositions", []),
        channels: ensureArray(canvasBody.channels, "businessModel.canvas.channels", []),
        customerRelationships: ensureArray(canvasBody.customerRelationships, "businessModel.canvas.customerRelationships", []),
        revenueStreams: ensureArray(canvasBody.revenueStreams, "businessModel.canvas.revenueStreams", []),
        keyResources: ensureArray(canvasBody.keyResources, "businessModel.canvas.keyResources", []),
        keyActivities: ensureArray(canvasBody.keyActivities, "businessModel.canvas.keyActivities", []),
        keyPartners: ensureArray(canvasBody.keyPartners, "businessModel.canvas.keyPartners", []),
        costStructure: ensureArray(canvasBody.costStructure, "businessModel.canvas.costStructure", [])
      },
      validationStatus: body.validationStatus ?? "unvalidated",
      marketResearch: body.marketResearch ? String(body.marketResearch) : undefined,
      competitors: ensureArray(body.competitors, "businessModel.competitors", [])
    };

    state.businessModels.push(model);
    this.store.save();
    this.store.audit(actor, "businessModel.create", "businessModel", model.id, undefined, model);
    return clone(model);
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((l) => l.tenantId === actor.tenantId));
  }
}
