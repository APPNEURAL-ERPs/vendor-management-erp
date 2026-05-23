import { DataStore } from "./core/datastore";
import {
  ABTest,
  ABTestVariant,
  AccessibilityCheck,
  ExperienceMetric,
  ExperienceOverview,
  FeedbackItem,
  Journey,
  JourneyStage,
  Microcopy,
  Onboarding,
  OnboardingStep,
  Persona,
  PersonalizationRule,
  RequestActor,
  UserFlow,
  FlowStep,
  UXAudit,
  UXIssue,
  Wireframe,
  ExperienceTemplate
} from "./core/domain";
import { badRequest, conflict, notFound } from "./core/errors";
import { newId, nowIso } from "./core/id";
import { clone, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, optionalObject, pickQuery } from "./core/utils";

export class ExperienceService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "ExperienceOS service is ready";
  }

  overview(actor: RequestActor): ExperienceOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    
    const personas = state.personas.filter(p => p.tenantId === tenant);
    const journeys = state.journeys.filter(j => j.tenantId === tenant);
    const onboardings = state.onboardings.filter(o => o.tenantId === tenant);
    const flows = state.flows.filter(f => f.tenantId === tenant);
    const audits = state.audits.filter(a => a.tenantId === tenant);
    const abTests = state.abTests.filter(t => t.tenantId === tenant);
    const feedback = state.feedback.filter(f => f.tenantId === tenant);
    const metrics = state.metrics.filter(m => m.tenantId === tenant);

    const avgCompletionRate = onboardings.length > 0 
      ? Math.round(onboardings.reduce((sum, o) => sum + (o.completionRate || 0), 0) / onboardings.length) 
      : 0;

    const avgConversionRate = abTests.length > 0
      ? Math.round(abTests.reduce((sum, t) => sum + (t.metrics.overallConversionRate || 0), 0) / abTests.length)
      : 0;

    const avgNps = feedback.filter(f => f.npsScore !== undefined).length > 0
      ? Math.round(feedback.filter(f => f.npsScore !== undefined).reduce((sum, f) => sum + (f.npsScore || 0), 0) / feedback.filter(f => f.npsScore !== undefined).length)
      : 0;

    return {
      personas: {
        total: personas.length,
        active: personas.filter(p => p.status === "active").length
      },
      journeys: {
        total: journeys.length,
        active: journeys.filter(j => j.status === "active").length
      },
      onboarding: {
        total: onboardings.length,
        active: onboardings.filter(o => o.status === "active").length,
        avgCompletionRate
      },
      flows: {
        total: flows.length,
        active: flows.filter(f => f.status === "active").length
      },
      audits: {
        total: audits.length,
        completed: audits.filter(a => a.completedAt).length
      },
      abTests: {
        total: abTests.length,
        active: abTests.filter(t => t.status === "active").length,
        avgConversionRate
      },
      feedback: {
        total: feedback.length,
        new: feedback.filter(f => f.status === "new").length,
        avgNps
      },
      metrics: clone(metrics.slice(0, 10))
    };
  }

  listPersonas(actor: RequestActor, query?: URLSearchParams): Persona[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const type = pickQuery(query, "type");
    return clone(this.store.getState().personas.filter(p => {
      if (p.tenantId !== actor.tenantId) return false;
      if (search && !`${p.key} ${p.name} ${p.description || ""}`.toLowerCase().includes(search)) return false;
      if (type && p.type !== type) return false;
      return true;
    }));
  }

  getPersona(id: string, actor: RequestActor): Persona {
    const persona = this.store.getState().personas.find(p => p.id === id && p.tenantId === actor.tenantId);
    if (!persona) notFound("Persona not found");
    return clone(persona);
  }

  createPersona(input: unknown, actor: RequestActor): Persona {
    const body = ensureObject(input, "persona");
    const state = this.store.getState();
    const key = ensureString(body.key, "persona.key");
    if (state.personas.some(p => p.tenantId === actor.tenantId && p.key === key)) conflict(`Persona key '${key}' already exists`);
    
    const persona: Persona = {
      id: newId("persona"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "persona.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type || "user") as Persona["type"],
      status: String(body.status || "active") as Persona["status"],
      demographics: optionalObject(body.demographics),
      goals: ensureArray(body.goals, "persona.goals", []),
      painPoints: ensureArray(body.painPoints, "persona.painPoints", []),
      behaviors: ensureArray(body.behaviors, "persona.behaviors", []),
      needs: ensureArray(body.needs, "persona.needs", []),
      metadata: optionalObject(body.metadata)
    };
    state.personas.push(persona);
    this.store.save();
    this.store.audit(actor, "persona.create", "persona", persona.id, undefined, persona);
    return clone(persona);
  }

  listJourneys(actor: RequestActor, query?: URLSearchParams): Journey[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const type = pickQuery(query, "type");
    return clone(this.store.getState().journeys.filter(j => {
      if (j.tenantId !== actor.tenantId) return false;
      if (search && !`${j.key} ${j.name} ${j.description || ""}`.toLowerCase().includes(search)) return false;
      if (type && j.type !== type) return false;
      return true;
    }));
  }

  getJourney(id: string, actor: RequestActor): Journey {
    const journey = this.store.getState().journeys.find(j => j.id === id && j.tenantId === actor.tenantId);
    if (!journey) notFound("Journey not found");
    return clone(journey);
  }

  createJourney(input: unknown, actor: RequestActor): Journey {
    const body = ensureObject(input, "journey");
    const state = this.store.getState();
    const key = ensureString(body.key, "journey.key");
    if (state.journeys.some(j => j.tenantId === actor.tenantId && j.key === key)) conflict(`Journey key '${key}' already exists`);
    
    const stages: JourneyStage[] = ensureArray(body.stages, "journey.stages", []).map((s: any, idx: number) => ({
      id: newId("stage"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      journeyId: "",
      name: ensureString(s.name, `stage[${idx}].name`),
      description: s.description ? String(s.description) : undefined,
      order: s.order ?? idx,
      touchpoints: ensureArray(s.touchpoints, `stage[${idx}].touchpoints`, []),
      painPoints: ensureArray(s.painPoints, `stage[${idx}].painPoints`, []),
      opportunities: ensureArray(s.opportunities, `stage[${idx}].opportunities`, []),
      emotion: String(s.emotion || "neutral") as JourneyStage["emotion"],
      metrics: optionalObject(s.metrics)
    }));

    const journey: Journey = {
      id: newId("journey"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "journey.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type || "user") as Journey["type"],
      status: String(body.status || "active") as Journey["status"],
      personaId: body.personaId ? String(body.personaId) : undefined,
      stages,
      totalDuration: body.totalDuration ? ensureNumber(body.totalDuration, "journey.totalDuration") : undefined,
      completionRate: body.completionRate ? ensureNumber(body.completionRate, "journey.completionRate") : undefined,
      metadata: optionalObject(body.metadata)
    };

    stages.forEach(s => s.journeyId = journey.id);
    state.journeys.push(journey);
    this.store.save();
    this.store.audit(actor, "journey.create", "journey", journey.id, undefined, journey);
    return clone(journey);
  }

  listOnboardings(actor: RequestActor, query?: URLSearchParams): Onboarding[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    return clone(this.store.getState().onboardings.filter(o => {
      if (o.tenantId !== actor.tenantId) return false;
      if (search && !`${o.key} ${o.name}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  getOnboarding(id: string, actor: RequestActor): Onboarding {
    const onboarding = this.store.getState().onboardings.find(o => o.id === id && o.tenantId === actor.tenantId);
    if (!onboarding) notFound("Onboarding not found");
    return clone(onboarding);
  }

  createOnboarding(input: unknown, actor: RequestActor): Onboarding {
    const body = ensureObject(input, "onboarding");
    const state = this.store.getState();
    const key = ensureString(body.key, "onboarding.key");
    if (state.onboardings.some(o => o.tenantId === actor.tenantId && o.key === key)) conflict(`Onboarding key '${key}' already exists`);
    
    const steps: OnboardingStep[] = ensureArray(body.steps, "onboarding.steps", []).map((s: any, idx: number) => ({
      id: newId("step"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      onboardingId: "",
      name: ensureString(s.name, `step[${idx}].name`),
      description: s.description ? String(s.description) : undefined,
      order: s.order ?? idx,
      type: String(s.type || "setup") as OnboardingStep["type"],
      status: "pending" as OnboardingStep["status"],
      required: ensureBoolean(s.required, true),
      estimatedTime: s.estimatedTime ? ensureNumber(s.estimatedTime, `step[${idx}].estimatedTime`) : undefined,
      completionCriteria: ensureArray(s.completionCriteria, `step[${idx}].completionCriteria`, [])
    }));

    const requiredSteps = steps.filter(s => s.required).length;

    const onboarding: Onboarding = {
      id: newId("onboarding"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "onboarding.name"),
      description: body.description ? String(body.description) : undefined,
      targetType: String(body.targetType || "user") as Onboarding["targetType"],
      status: String(body.status || "active") as Onboarding["status"],
      personaId: body.personaId ? String(body.personaId) : undefined,
      steps,
      timeToValue: body.timeToValue ? ensureNumber(body.timeToValue, "onboarding.timeToValue") : undefined,
      completionRate: body.completionRate ? ensureNumber(body.completionRate, "onboarding.completionRate") : undefined,
      totalSteps: steps.length,
      requiredSteps,
      metadata: optionalObject(body.metadata)
    };

    steps.forEach(s => s.onboardingId = onboarding.id);
    state.onboardings.push(onboarding);
    this.store.save();
    this.store.audit(actor, "onboarding.create", "onboarding", onboarding.id, undefined, onboarding);
    return clone(onboarding);
  }

  listFlows(actor: RequestActor, query?: URLSearchParams): UserFlow[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const type = pickQuery(query, "type");
    return clone(this.store.getState().flows.filter(f => {
      if (f.tenantId !== actor.tenantId) return false;
      if (search && !`${f.key} ${f.name}`.toLowerCase().includes(search)) return false;
      if (type && f.type !== type) return false;
      return true;
    }));
  }

  getFlow(id: string, actor: RequestActor): UserFlow {
    const flow = this.store.getState().flows.find(f => f.id === id && f.tenantId === actor.tenantId);
    if (!flow) notFound("Flow not found");
    return clone(flow);
  }

  createFlow(input: unknown, actor: RequestActor): UserFlow {
    const body = ensureObject(input, "flow");
    const state = this.store.getState();
    const key = ensureString(body.key, "flow.key");
    if (state.flows.some(f => f.tenantId === actor.tenantId && f.key === key)) conflict(`Flow key '${key}' already exists`);
    
    const steps: FlowStep[] = ensureArray(body.steps, "flow.steps", []).map((s: any, idx: number) => ({
      id: newId("flowstep"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      flowId: "",
      name: ensureString(s.name, `step[${idx}].name`),
      description: s.description ? String(s.description) : undefined,
      order: s.order ?? idx,
      type: String(s.type || "action") as FlowStep["type"],
      nextSteps: ensureArray(s.nextSteps, `step[${idx}].nextSteps`, []),
      previousSteps: ensureArray(s.previousSteps, `step[${idx}].previousSteps`, []),
      required: ensureBoolean(s.required, true),
      estimatedTime: s.estimatedTime ? ensureNumber(s.estimatedTime, `step[${idx}].estimatedTime`) : undefined,
      validation: s.validation ? { required: ensureBoolean(s.validation.required, false), rules: ensureArray(s.validation.rules, `step[${idx}].validation.rules`, []) } : undefined
    }));

    const requiredSteps = steps.filter(s => s.required).length;
    const estimatedTotalTime = steps.reduce((sum, s) => sum + (s.estimatedTime || 0), 0);

    const flow: UserFlow = {
      id: newId("flow"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "flow.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type || "custom") as UserFlow["type"],
      status: String(body.status || "active") as UserFlow["status"],
      personaId: body.personaId ? String(body.personaId) : undefined,
      steps,
      totalSteps: steps.length,
      requiredSteps,
      estimatedTotalTime: body.estimatedTotalTime ? ensureNumber(body.estimatedTotalTime, "flow.estimatedTotalTime") : estimatedTotalTime,
      metadata: optionalObject(body.metadata)
    };

    steps.forEach(s => s.flowId = flow.id);
    state.flows.push(flow);
    this.store.save();
    this.store.audit(actor, "flow.create", "flow", flow.id, undefined, flow);
    return clone(flow);
  }

  listAudits(actor: RequestActor): UXAudit[] {
    return clone(this.store.getState().audits.filter(a => a.tenantId === actor.tenantId));
  }

  getAudit(id: string, actor: RequestActor): UXAudit {
    const audit = this.store.getState().audits.find(a => a.id === id && a.tenantId === actor.tenantId);
    if (!audit) notFound("Audit not found");
    return clone(audit);
  }

  createAudit(input: unknown, actor: RequestActor): UXAudit {
    const body = ensureObject(input, "audit");
    const state = this.store.getState();
    const key = ensureString(body.key, "audit.key");
    if (state.audits.some(a => a.tenantId === actor.tenantId && a.key === key)) conflict(`Audit key '${key}' already exists`);
    
    const issues: UXIssue[] = ensureArray(body.issues, "audit.issues", []).map((issue: any) => ({
      id: newId("issue"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      journeyId: issue.journeyId ? String(issue.journeyId) : undefined,
      flowId: issue.flowId ? String(issue.flowId) : undefined,
      title: ensureString(issue.title, "issue.title"),
      description: ensureString(issue.description, "issue.description"),
      severity: String(issue.severity || "medium") as UXIssue["severity"],
      category: String(issue.category || "design") as UXIssue["category"],
      stage: issue.stage ? String(issue.stage) : undefined,
      affectedUsers: issue.affectedUsers ? ensureNumber(issue.affectedUsers, "issue.affectedUsers") : undefined,
      impact: String(issue.impact || "medium") as UXIssue["impact"],
      status: "open" as UXIssue["status"],
      recommendation: issue.recommendation ? String(issue.recommendation) : undefined,
      createdBy: actor.userId
    }));

    const audit: UXAudit = {
      id: newId("audit"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "audit.name"),
      targetType: String(body.targetType || "website") as UXAudit["targetType"],
      status: String(body.status || "draft") as UXAudit["status"],
      scope: body.scope ? String(body.scope) : undefined,
      issues,
      metrics: {
        usabilityScore: body.metrics?.usabilityScore ? ensureNumber(body.metrics.usabilityScore, "metrics.usabilityScore") : undefined,
        accessibilityScore: body.metrics?.accessibilityScore ? ensureNumber(body.metrics.accessibilityScore, "metrics.accessibilityScore") : undefined,
        performanceScore: body.metrics?.performanceScore ? ensureNumber(body.metrics.performanceScore, "metrics.performanceScore") : undefined,
        overallScore: body.metrics?.overallScore ? ensureNumber(body.metrics.overallScore, "metrics.overallScore") : undefined
      },
      recommendations: ensureArray(body.recommendations, "audit.recommendations", []),
      createdBy: actor.userId,
      completedAt: body.completedAt ? String(body.completedAt) : undefined
    };

    state.audits.push(audit);
    this.store.save();
    this.store.audit(actor, "audit.create", "audit", audit.id, undefined, audit);
    return clone(audit);
  }

  listABTests(actor: RequestActor): ABTest[] {
    return clone(this.store.getState().abTests.filter(t => t.tenantId === actor.tenantId));
  }

  getABTest(id: string, actor: RequestActor): ABTest {
    const test = this.store.getState().abTests.find(t => t.id === id && t.tenantId === actor.tenantId);
    if (!test) notFound("A/B test not found");
    return clone(test);
  }

  createABTest(input: unknown, actor: RequestActor): ABTest {
    const body = ensureObject(input, "abTest");
    const state = this.store.getState();
    const key = ensureString(body.key, "abTest.key");
    if (state.abTests.some(t => t.tenantId === actor.tenantId && t.key === key)) conflict(`A/B test key '${key}' already exists`);
    
    const variants: ABTestVariant[] = ensureArray(body.variants, "abTest.variants", []).map((v: any, idx: number) => ({
      id: newId("variant"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      testId: "",
      name: ensureString(v.name, `variant[${idx}].name`),
      description: v.description ? String(v.description) : undefined,
      weight: ensureNumber(v.weight, `variant[${idx}].weight`, 50),
      metrics: {
        impressions: v.metrics?.impressions ? ensureNumber(v.metrics.impressions, `variant[${idx}].metrics.impressions`) : 0,
        conversions: v.metrics?.conversions ? ensureNumber(v.metrics.conversions, `variant[${idx}].metrics.conversions`) : 0,
        conversionRate: v.metrics?.conversionRate ? ensureNumber(v.metrics.conversionRate, `variant[${idx}].metrics.conversionRate`) : undefined
      },
      status: "active" as ABTestVariant["status"]
    }));

    const totalImpressions = variants.reduce((sum, v) => sum + v.metrics.impressions, 0);
    const totalConversions = variants.reduce((sum, v) => sum + v.metrics.conversions, 0);

    const test: ABTest = {
      id: newId("abtest"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "abTest.name"),
      description: body.description ? String(body.description) : undefined,
      targetType: String(body.targetType || "button") as ABTest["targetType"],
      status: String(body.status || "active") as ABTest["status"],
      hypothesis: body.hypothesis ? String(body.hypothesis) : undefined,
      variants,
      startDate: body.startDate ? String(body.startDate) : undefined,
      endDate: body.endDate ? String(body.endDate) : undefined,
      statisticalSignificance: body.statisticalSignificance ? ensureNumber(body.statisticalSignificance, "abTest.statisticalSignificance") : undefined,
      winner: body.winner ? String(body.winner) : undefined,
      metrics: {
        totalImpressions,
        totalConversions,
        overallConversionRate: totalImpressions > 0 ? Math.round((totalConversions / totalImpressions) * 10000) / 100 : undefined
      },
      createdBy: actor.userId,
      metadata: optionalObject(body.metadata)
    };

    variants.forEach(v => v.testId = test.id);
    state.abTests.push(test);
    this.store.save();
    this.store.audit(actor, "abtest.create", "abTest", test.id, undefined, test);
    return clone(test);
  }

  listFeedback(actor: RequestActor, query?: URLSearchParams): FeedbackItem[] {
    const type = pickQuery(query, "type");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().feedback.filter(f => {
      if (f.tenantId !== actor.tenantId) return false;
      if (type && f.type !== type) return false;
      if (status && f.status !== status) return false;
      return true;
    }));
  }

  createFeedback(input: unknown, actor: RequestActor): FeedbackItem {
    const body = ensureObject(input, "feedback");
    const feedback: FeedbackItem = {
      id: newId("feedback"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type: String(body.type || "comment") as FeedbackItem["type"],
      source: String(body.source || "in_app") as FeedbackItem["source"],
      rating: body.rating ? ensureNumber(body.rating, "feedback.rating") : undefined,
      npsScore: body.npsScore ? ensureNumber(body.npsScore, "feedback.npsScore") : undefined,
      text: body.text ? String(body.text) : undefined,
      category: body.category ? String(body.category) : undefined,
      userId: body.userId ? String(body.userId) : undefined,
      relatedEntityType: body.relatedEntityType ? String(body.relatedEntityType) as FeedbackItem["relatedEntityType"] : undefined,
      relatedEntityId: body.relatedEntityId ? String(body.relatedEntityId) : undefined,
      status: "new" as FeedbackItem["status"],
      sentiment: body.sentiment ? String(body.sentiment) as FeedbackItem["sentiment"] : undefined,
      tags: ensureArray(body.tags, "feedback.tags", []),
      createdBy: actor.userId
    };
    
    this.store.getState().feedback.unshift(feedback);
    this.store.save();
    this.store.audit(actor, "feedback.create", "feedback", feedback.id, undefined, feedback);
    return clone(feedback);
  }

  listMicrocopy(actor: RequestActor, query?: URLSearchParams): Microcopy[] {
    const type = pickQuery(query, "type");
    return clone(this.store.getState().microcopy.filter(m => {
      if (m.tenantId !== actor.tenantId) return false;
      if (type && m.type !== type) return false;
      return true;
    }));
  }

  createMicrocopy(input: unknown, actor: RequestActor): Microcopy {
    const body = ensureObject(input, "microcopy");
    const state = this.store.getState();
    const key = ensureString(body.key, "microcopy.key");
    if (state.microcopy.some(m => m.tenantId === actor.tenantId && m.key === key)) conflict(`Microcopy key '${key}' already exists`);
    
    const microcopy: Microcopy = {
      id: newId("microcopy"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      type: String(body.type || "button") as Microcopy["type"],
      context: ensureString(body.context, "microcopy.context"),
      text: ensureString(body.text, "microcopy.text"),
      alternatives: ensureArray(body.alternatives, "microcopy.alternatives", []),
      language: String(body.language || "en"),
      status: String(body.status || "active") as Microcopy["status"],
      metadata: optionalObject(body.metadata)
    };

    state.microcopy.push(microcopy);
    this.store.save();
    this.store.audit(actor, "microcopy.create", "microcopy", microcopy.id, undefined, microcopy);
    return clone(microcopy);
  }

  listPersonalizationRules(actor: RequestActor): PersonalizationRule[] {
    return clone(this.store.getState().personalizationRules.filter(r => r.tenantId === actor.tenantId));
  }

  createPersonalizationRule(input: unknown, actor: RequestActor): PersonalizationRule {
    const body = ensureObject(input, "rule");
    const state = this.store.getState();
    const key = ensureString(body.key, "rule.key");
    if (state.personalizationRules.some(r => r.tenantId === actor.tenantId && r.key === key)) conflict(`Personalization rule key '${key}' already exists`);
    
    const rule: PersonalizationRule = {
      id: newId("rule"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "rule.name"),
      description: body.description ? String(body.description) : undefined,
      targetType: String(body.targetType || "content") as PersonalizationRule["targetType"],
      conditions: ensureArray(body.conditions, "rule.conditions", []),
      actions: ensureArray(body.actions, "rule.actions", []),
      priority: ensureNumber(body.priority, "rule.priority", 0),
      status: String(body.status || "active") as PersonalizationRule["status"],
      metadata: optionalObject(body.metadata)
    };

    state.personalizationRules.push(rule);
    this.store.save();
    this.store.audit(actor, "personalization.create", "personalizationRule", rule.id, undefined, rule);
    return clone(rule);
  }

  listWireframes(actor: RequestActor): Wireframe[] {
    return clone(this.store.getState().wireframes.filter(w => w.tenantId === actor.tenantId));
  }

  createWireframe(input: unknown, actor: RequestActor): Wireframe {
    const body = ensureObject(input, "wireframe");
    const state = this.store.getState();
    const key = ensureString(body.key, "wireframe.key");
    if (state.wireframes.some(w => w.tenantId === actor.tenantId && w.key === key)) conflict(`Wireframe key '${key}' already exists`);
    
    const layoutObj = body.layout && typeof body.layout === "object" ? body.layout : { grid: "12-column", sections: [] };
    
    const wireframe: Wireframe = {
      id: newId("wireframe"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "wireframe.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type || "low_fidelity") as Wireframe["type"],
      targetType: String(body.targetType || "dashboard") as Wireframe["targetType"],
      status: String(body.status || "active") as Wireframe["status"],
      layout: {
        grid: String(layoutObj.grid || "12-column"),
        sections: Array.isArray(layoutObj.sections) ? layoutObj.sections.map((s: any) => ({
          name: String(s.name || "Untitled"),
          components: Array.isArray(s.components) ? s.components : [],
          order: Number(s.order || 0)
        })) : []
      },
      components: ensureArray(body.components, "wireframe.components", []),
      metadata: optionalObject(body.metadata)
    };

    state.wireframes.push(wireframe);
    this.store.save();
    this.store.audit(actor, "wireframe.create", "wireframe", wireframe.id, undefined, wireframe);
    return clone(wireframe);
  }

  listTemplates(actor: RequestActor, query?: URLSearchParams): ExperienceTemplate[] {
    const type = pickQuery(query, "type");
    return clone(this.store.getState().templates.filter(t => {
      if (t.tenantId !== actor.tenantId) return false;
      if (type && t.type !== type) return false;
      return true;
    }));
  }

  createTemplate(input: unknown, actor: RequestActor): ExperienceTemplate {
    const body = ensureObject(input, "template");
    const state = this.store.getState();
    const key = ensureString(body.key, "template.key");
    if (state.templates.some(t => t.tenantId === actor.tenantId && t.key === key)) conflict(`Template key '${key}' already exists`);
    
    const template: ExperienceTemplate = {
      id: newId("template"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "template.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type || "journey") as ExperienceTemplate["type"],
      status: String(body.status || "active") as ExperienceTemplate["status"],
      content: optionalObject(body.content),
      tags: ensureArray(body.tags, "template.tags", []),
      metadata: optionalObject(body.metadata)
    };

    state.templates.push(template);
    this.store.save();
    this.store.audit(actor, "template.create", "template", template.id, undefined, template);
    return clone(template);
  }

  listMetrics(actor: RequestActor): ExperienceMetric[] {
    return clone(this.store.getState().metrics.filter(m => m.tenantId === actor.tenantId));
  }

  createMetric(input: unknown, actor: RequestActor): ExperienceMetric {
    const body = ensureObject(input, "metric");
    const metric: ExperienceMetric = {
      id: newId("metric"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type: String(body.type || "conversion") as ExperienceMetric["type"],
      name: ensureString(body.name, "metric.name"),
      value: ensureNumber(body.value, "metric.value"),
      unit: String(body.unit || "%"),
      timeframe: String(body.timeframe || "daily") as ExperienceMetric["timeframe"],
      dimensions: optionalObject(body.dimensions),
      trend: body.trend ? String(body.trend) as ExperienceMetric["trend"] : undefined,
      change: body.change ? ensureNumber(body.change, "metric.change") : undefined,
      metadata: optionalObject(body.metadata)
    };

    this.store.getState().metrics.unshift(metric);
    this.store.save();
    this.store.audit(actor, "metric.create", "metric", metric.id, undefined, metric);
    return clone(metric);
  }

  listAccessibilityChecks(actor: RequestActor, query?: URLSearchParams): AccessibilityCheck[] {
    const auditId = pickQuery(query, "auditId");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().accessibilityChecks.filter(c => {
      if (c.tenantId !== actor.tenantId) return false;
      if (auditId && c.auditId !== auditId) return false;
      if (status && c.status !== status) return false;
      return true;
    }));
  }

  createAccessibilityCheck(input: unknown, actor: RequestActor): AccessibilityCheck {
    const body = ensureObject(input, "check");
    const check: AccessibilityCheck = {
      id: newId("accesscheck"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      auditId: body.auditId ? String(body.auditId) : undefined,
      title: ensureString(body.title, "check.title"),
      type: String(body.type || "contrast") as AccessibilityCheck["type"],
      status: String(body.status || "pass") as AccessibilityCheck["status"],
      severity: String(body.severity || "low") as AccessibilityCheck["severity"],
      element: body.element ? String(body.element) : undefined,
      description: ensureString(body.description, "check.description"),
      recommendation: body.recommendation ? String(body.recommendation) : undefined,
      wcagLevel: body.wcagLevel ? String(body.wcagLevel) as AccessibilityCheck["wcagLevel"] : undefined
    };

    this.store.getState().accessibilityChecks.push(check);
    this.store.save();
    this.store.audit(actor, "accessibility.create", "accessibilityCheck", check.id, undefined, check);
    return clone(check);
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter(log => log.tenantId === actor.tenantId));
  }
}
