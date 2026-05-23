import { DataStore } from "./core/datastore";
import {
  Experiment,
  Variant,
  Hypothesis,
  Assignment,
  Observation,
  Analysis,
  MetricDefinition,
  AudienceDefinition,
  TrafficSplit,
  FeatureFlag,
  Rollout,
  Decision,
  ExperimentEvent,
  ExperimentRisk,
  ExperimentOverview,
  RequestActor,
  ExperimentStatus,
  ExperimentType,
  VariantType,
  AssignmentStatus,
  StatisticalResult
} from "./core/domain";
import { badRequest, conflict, notFound, ensureString, ensureNumber, ensureBoolean, ensureArray, optionalObject, pickQuery, clone, newId, nowIso, randomAssignment } from "./core/utils";

export class ExperimentosService {
  constructor(private readonly store: DataStore) {}

  overview(actor: RequestActor): ExperimentOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    const experiments = state.experiments.filter((e) => e.tenantId === tenant);
    const variants = state.variants.filter((v) => v.tenantId === tenant);
    const assignments = state.assignments.filter((a) => a.tenantId === tenant);
    const observations = state.observations.filter((o) => o.tenantId === tenant);
    const analyses = state.analyses.filter((a) => a.tenantId === tenant);
    const featureFlags = state.featureFlags.filter((f) => f.tenantId === tenant);
    const rollouts = state.rollouts.filter((r) => r.tenantId === tenant);
    const metrics = state.metricDefinitions.filter((m) => m.tenantId === tenant);

    return {
      experiments: {
        total: experiments.length,
        active: experiments.filter((e) => e.status === "running").length,
        completed: experiments.filter((e) => ["completed", "winner_selected"].includes(e.status)).length,
        failed: experiments.filter((e) => ["inconclusive", "stopped"].includes(e.status)).length
      },
      variants: {
        total: variants.length,
        winners: variants.filter((v) => state.analyses.some((a) => a.winnerVariantId === v.id)).length
      },
      assignments: {
        total: assignments.length,
        active: assignments.filter((a) => a.status === "exposed").length
      },
      observations: {
        total: observations.length,
        today: observations.filter((o) => o.timestamp.startsWith(new Date().toISOString().split("T")[0])).length
      },
      analyses: {
        total: analyses.length,
        conclusive: analyses.filter((a) => a.isConclusive).length
      },
      featureFlags: {
        total: featureFlags.length,
        enabled: featureFlags.filter((f) => f.enabled).length
      },
      rollout: {
        active: rollouts.filter((r) => r.status === "in_progress").length,
        completed: rollouts.filter((r) => r.status === "completed").length
      },
      metrics: {
        total: metrics.length,
        primary: metrics.filter((m) => m.type === "primary").length,
        guardrail: metrics.filter((m) => m.type === "guardrail").length
      }
    };
  }

  listExperiments(actor: RequestActor, query?: URLSearchParams): Experiment[] {
    const state = this.store.getState();
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");
    const type = pickQuery(query, "type");

    return clone(state.experiments.filter((e) => {
      if (e.tenantId !== actor.tenantId) return false;
      if (search && !`${e.key} ${e.name} ${e.description ?? ""}`.toLowerCase().includes(search)) return false;
      if (status && e.status !== status) return false;
      if (type && e.type !== type) return false;
      return true;
    }));
  }

  getExperiment(id: string, actor: RequestActor): Experiment {
    const experiment = this.store.getState().experiments.find((e) => e.id === id && e.tenantId === actor.tenantId);
    if (!experiment) notFound("Experiment not found");
    return clone(experiment);
  }

  createExperiment(input: unknown, actor: RequestActor): Experiment {
    const body = ensureObject(input, "experiment");
    const state = this.store.getState();
    const key = ensureString(body.key, "experiment.key");
    if (state.experiments.some((e) => e.tenantId === actor.tenantId && e.key === key)) conflict(`Experiment key '${key}' already exists`);

    const experiment: Experiment = {
      id: newId("exp"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "experiment.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "ab_test") as ExperimentType,
      hypothesisId: body.hypothesisId ? String(body.hypothesisId) : undefined,
      status: "draft",
      audienceId: body.audienceId ? String(body.audienceId) : undefined,
      primaryMetricId: body.primaryMetricId ? String(body.primaryMetricId) : undefined,
      secondaryMetricIds: ensureArray<string>(body.secondaryMetricIds, "experiment.secondaryMetricIds"),
      guardrailMetricIds: ensureArray<string>(body.guardrailMetricIds, "experiment.guardrailMetricIds"),
      targetSampleSize: body.targetSampleSize ? ensureNumber(body.targetSampleSize, "experiment.targetSampleSize") : undefined,
      currentSampleSize: 0,
      confidenceLevel: ensureNumber(body.confidenceLevel, "experiment.confidenceLevel", 0.95),
      decisionRule: body.decisionRule ? String(body.decisionRule) : undefined,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      tags: ensureArray<string>(body.tags, "experiment.tags"),
      metadata: optionalObject(body.metadata),
      createdBy: actor.userId
    };

    state.experiments.push(experiment);
    this.store.save();
    this.store.audit(actor, "experiment.create", "experiment", experiment.id, undefined, experiment);
    this.emitEvent(experiment.id, "experiment.created", { key: experiment.key, name: experiment.name }, actor);

    return clone(experiment);
  }

  updateExperiment(id: string, input: unknown, actor: RequestActor): Experiment {
    const body = ensureObject(input, "experiment");
    const state = this.store.getState();
    const experiment = state.experiments.find((e) => e.id === id && e.tenantId === actor.tenantId);
    if (!experiment) notFound("Experiment not found");

    const before = clone(experiment);

    if (body.name) experiment.name = ensureString(body.name, "experiment.name");
    if (body.description !== undefined) experiment.description = body.description ? String(body.description) : undefined;
    if (body.status) experiment.status = body.status as ExperimentStatus;
    if (body.audienceId !== undefined) experiment.audienceId = body.audienceId ? String(body.audienceId) : undefined;
    if (body.primaryMetricId !== undefined) experiment.primaryMetricId = body.primaryMetricId ? String(body.primaryMetricId) : undefined;
    if (body.secondaryMetricIds !== undefined) experiment.secondaryMetricIds = ensureArray<string>(body.secondaryMetricIds, "experiment.secondaryMetricIds");
    if (body.guardrailMetricIds !== undefined) experiment.guardrailMetricIds = ensureArray<string>(body.guardrailMetricIds, "experiment.guardrailMetricIds");
    if (body.targetSampleSize !== undefined) experiment.targetSampleSize = body.targetSampleSize ? ensureNumber(body.targetSampleSize, "experiment.targetSampleSize") : undefined;
    if (body.confidenceLevel !== undefined) experiment.confidenceLevel = ensureNumber(body.confidenceLevel, "experiment.confidenceLevel");
    if (body.decisionRule !== undefined) experiment.decisionRule = body.decisionRule ? String(body.decisionRule) : undefined;
    if (body.tags !== undefined) experiment.tags = ensureArray<string>(body.tags, "experiment.tags");
    if (body.metadata !== undefined) experiment.metadata = optionalObject(body.metadata);

    experiment.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "experiment.update", "experiment", experiment.id, before, experiment);

    return clone(experiment);
  }

  startExperiment(id: string, actor: RequestActor): Experiment {
    const state = this.store.getState();
    const experiment = state.experiments.find((e) => e.id === id && e.tenantId === actor.tenantId);
    if (!experiment) notFound("Experiment not found");
    if (experiment.status !== "planned" && experiment.status !== "paused") badRequest("Experiment can only be started from 'planned' or 'paused' status");

    const before = clone(experiment);
    experiment.status = "running";
    experiment.startDate = nowIso();
    experiment.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "experiment.start", "experiment", experiment.id, before, experiment);
    this.emitEvent(experiment.id, "experiment.started", { key: experiment.key }, actor);

    return clone(experiment);
  }

  pauseExperiment(id: string, actor: RequestActor): Experiment {
    const state = this.store.getState();
    const experiment = state.experiments.find((e) => e.id === id && e.tenantId === actor.tenantId);
    if (!experiment) notFound("Experiment not found");
    if (experiment.status !== "running") badRequest("Experiment can only be paused when running");

    const before = clone(experiment);
    experiment.status = "paused";
    experiment.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "experiment.pause", "experiment", experiment.id, before, experiment);
    this.emitEvent(experiment.id, "experiment.paused", { key: experiment.key }, actor);

    return clone(experiment);
  }

  stopExperiment(id: string, actor: RequestActor): Experiment {
    const state = this.store.getState();
    const experiment = state.experiments.find((e) => e.id === id && e.tenantId === actor.tenantId);
    if (!experiment) notFound("Experiment not found");
    if (!["running", "paused"].includes(experiment.status)) badRequest("Experiment can only be stopped when running or paused");

    const before = clone(experiment);
    experiment.status = "stopped";
    experiment.endDate = nowIso();
    experiment.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "experiment.stop", "experiment", experiment.id, before, experiment);
    this.emitEvent(experiment.id, "experiment.stopped", { key: experiment.key }, actor);

    return clone(experiment);
  }

  completeExperiment(id: string, actor: RequestActor): Experiment {
    const state = this.store.getState();
    const experiment = state.experiments.find((e) => e.id === id && e.tenantId === actor.tenantId);
    if (!experiment) notFound("Experiment not found");
    if (experiment.status !== "running") badRequest("Experiment can only be completed when running");

    const before = clone(experiment);
    experiment.status = "completed";
    experiment.endDate = nowIso();
    experiment.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "experiment.complete", "experiment", experiment.id, before, experiment);
    this.emitEvent(experiment.id, "experiment.completed", { key: experiment.key }, actor);

    return clone(experiment);
  }

  listVariants(experimentId: string, actor: RequestActor): Variant[] {
    return clone(this.store.getState().variants.filter((v) => v.experimentId === experimentId && v.tenantId === actor.tenantId));
  }

  createVariant(experimentId: string, input: unknown, actor: RequestActor): Variant {
    const body = ensureObject(input, "variant");
    const state = this.store.getState();
    const experiment = state.experiments.find((e) => e.id === experimentId && e.tenantId === actor.tenantId);
    if (!experiment) notFound("Experiment not found");

    const key = ensureString(body.key, "variant.key");
    if (state.variants.some((v) => v.experimentId === experimentId && v.tenantId === actor.tenantId && v.key === key)) conflict(`Variant key '${key}' already exists in experiment`);

    const variant: Variant = {
      id: newId("var"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      experimentId,
      key,
      name: ensureString(body.name, "variant.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "treatment") as VariantType,
      isControl: ensureBoolean(body.isControl, body.type === "control"),
      trafficPercentage: ensureNumber(body.trafficPercentage, "variant.trafficPercentage", 50),
      config: optionalObject(body.config),
      status: "active"
    };

    state.variants.push(variant);
    this.store.save();
    this.store.audit(actor, "variant.create", "variant", variant.id, undefined, variant);

    return clone(variant);
  }

  updateVariant(id: string, input: unknown, actor: RequestActor): Variant {
    const body = ensureObject(input, "variant");
    const state = this.store.getState();
    const variant = state.variants.find((v) => v.id === id && v.tenantId === actor.tenantId);
    if (!variant) notFound("Variant not found");

    const before = clone(variant);

    if (body.name) variant.name = ensureString(body.name, "variant.name");
    if (body.description !== undefined) variant.description = body.description ? String(body.description) : undefined;
    if (body.type) variant.type = body.type as VariantType;
    if (body.isControl !== undefined) variant.isControl = ensureBoolean(body.isControl);
    if (body.trafficPercentage !== undefined) variant.trafficPercentage = ensureNumber(body.trafficPercentage, "variant.trafficPercentage");
    if (body.config !== undefined) variant.config = optionalObject(body.config);
    if (body.status) variant.status = body.status;

    variant.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "variant.update", "variant", variant.id, before, variant);

    return clone(variant);
  }

  assignVariant(experimentId: string, userId: string, actor: RequestActor): Assignment {
    const state = this.store.getState();
    const experiment = state.experiments.find((e) => e.id === experimentId && e.tenantId === actor.tenantId);
    if (!experiment) notFound("Experiment not found");
    if (experiment.status !== "running") badRequest("Cannot assign variant to non-running experiment");

    const existingAssignment = state.assignments.find((a) => a.experimentId === experimentId && a.userId === userId && a.tenantId === actor.tenantId);
    if (existingAssignment) {
      const variant = state.variants.find((v) => v.id === existingAssignment.variantId);
      return clone(existingAssignment);
    }

    const variants = state.variants.filter((v) => v.experimentId === experimentId && v.tenantId === actor.tenantId && v.status === "active");
    if (variants.length === 0) badRequest("No active variants found");

    const trafficSplit = state.trafficSplits.find((ts) => ts.experimentId === experimentId);
    let selectedVariant: Variant;
    let trafficPercentage = 0;

    if (trafficSplit && trafficSplit.stickyAssignment) {
      const hash = randomAssignment(`${userId}_${experimentId}_${trafficSplit.assignmentSeed ?? experimentId}`, 100);
      let cumulative = 0;
      selectedVariant = variants[0];
      for (const split of trafficSplit.splits) {
        cumulative += split.percentage;
        if (hash < cumulative) {
          selectedVariant = variants.find((v) => v.id === split.variantId) ?? variants[0];
          trafficPercentage = split.percentage;
          break;
        }
      }
    } else {
      const random = Math.random() * 100;
      let cumulative = 0;
      selectedVariant = variants[0];
      for (const variant of variants) {
        cumulative += variant.trafficPercentage;
        if (random < cumulative) {
          selectedVariant = variant;
          trafficPercentage = variant.trafficPercentage;
          break;
        }
      }
    }

    const assignment: Assignment = {
      id: newId("assign"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      experimentId,
      variantId: selectedVariant.id,
      userId,
      trafficSplit: trafficPercentage,
      status: "exposed",
      exposureAt: nowIso(),
      metadata: {}
    };

    state.assignments.push(assignment);
    experiment.currentSampleSize++;
    this.store.save();
    this.store.audit(actor, "assignment.create", "assignment", assignment.id, undefined, assignment);
    this.emitEvent(experimentId, "variant.exposed", { variantId: selectedVariant.id, userId }, actor);

    return clone(assignment);
  }

  recordObservation(experimentId: string, input: unknown, actor: RequestActor): Observation {
    const body = ensureObject(input, "observation");
    const state = this.store.getState();

    const experiment = state.experiments.find((e) => e.id === experimentId && e.tenantId === actor.tenantId);
    if (!experiment) notFound("Experiment not found");

    const observation: Observation = {
      id: newId("obs"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      experimentId,
      variantId: ensureString(body.variantId, "observation.variantId"),
      metricId: ensureString(body.metricId, "observation.metricId"),
      type: String(body.type ?? "custom"),
      value: ensureNumber(body.value, "observation.value"),
      count: ensureNumber(body.count, "observation.count", 1),
      timestamp: nowIso(),
      segment: body.segment ? String(body.segment) : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.observations.push(observation);
    this.store.save();
    this.store.audit(actor, "observation.create", "observation", observation.id, undefined, observation);

    return clone(observation);
  }

  recordConversion(experimentId: string, userId: string, metricId: string, value: number, actor: RequestActor): Observation {
    const state = this.store.getState();
    const assignment = state.assignments.find((a) => a.experimentId === experimentId && a.userId === userId && a.tenantId === actor.tenantId);
    if (!assignment) notFound("Assignment not found");

    assignment.status = "converted";
    assignment.convertedAt = nowIso();
    assignment.updatedAt = nowIso();

    const observation: Observation = {
      id: newId("obs"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      experimentId,
      variantId: assignment.variantId,
      metricId,
      type: "conversion",
      value,
      count: 1,
      timestamp: nowIso(),
      metadata: { userId }
    };

    state.observations.push(observation);
    this.store.save();
    this.store.audit(actor, "conversion.recorded", "observation", observation.id, undefined, observation);

    return clone(observation);
  }

  analyzeExperiment(experimentId: string, input: unknown, actor: RequestActor): Analysis {
    const body = ensureObject(input, "analysis");
    const state = this.store.getState();

    const experiment = state.experiments.find((e) => e.id === experimentId && e.tenantId === actor.tenantId);
    if (!experiment) notFound("Experiment not found");

    const variants = state.variants.filter((v) => v.experimentId === experimentId && v.tenantId === actor.tenantId);
    const observations = state.observations.filter((o) => o.experimentId === experimentId && o.tenantId === actor.tenantId);

    const statisticalResults: StatisticalResult[] = [];
    let winnerVariantId: string | undefined;
    let maxLift = -Infinity;
    let totalLift = 0;

    const controlVariant = variants.find((v) => v.isControl);
    if (controlVariant) {
      const controlObservations = observations.filter((o) => o.variantId === controlVariant.id && o.metricId === experiment.primaryMetricId);
      const controlMean = controlObservations.length > 0 ? controlObservations.reduce((sum, o) => sum + o.value, 0) / controlObservations.length : 0;

      for (const variant of variants) {
        if (variant.isControl) continue;
        const variantObservations = observations.filter((o) => o.variantId === variant.id && o.metricId === experiment.primaryMetricId);
        const variantMean = variantObservations.length > 0 ? variantObservations.reduce((sum, o) => sum + o.value, 0) / variantObservations.length : 0;

        const lift = controlMean > 0 ? (variantMean - controlMean) / controlMean : 0;
        totalLift += lift;
        if (lift > maxLift) {
          maxLift = lift;
          winnerVariantId = variant.id;
        }

        const sampleSize = variantObservations.length;
        const variance = variantObservations.length > 1 ? variantObservations.reduce((sum, o) => sum + Math.pow(o.value - variantMean, 2), 0) / (variantObservations.length - 1) : 0;
        const pValue = this.calculatePValue(variantMean, controlMean, Math.sqrt(variance / sampleSize), sampleSize);

        statisticalResults.push({
          id: newId("stat"),
          tenantId: actor.tenantId,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          experimentId,
          variantId: variant.id,
          metricId: experiment.primaryMetricId ?? "",
          sampleSize,
          mean: variantMean,
          variance,
          standardDeviation: Math.sqrt(variance),
          confidenceInterval: [variantMean - 1.96 * Math.sqrt(variance / sampleSize), variantMean + 1.96 * Math.sqrt(variance / sampleSize)],
          pValue,
          isSignificant: pValue < (1 - experiment.confidenceLevel),
          testType: "t_test",
          effectSize: lift
        });
      }
    }

    const analysis: Analysis = {
      id: newId("analysis"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      experimentId,
      type: String(body.type ?? "interim"),
      winnerVariantId,
      lift: maxLift,
      confidenceLevel: experiment.confidenceLevel,
      isConclusive: statisticalResults.some((r) => r.isSignificant),
      recommendation: statisticalResults.some((r) => r.isSignificant) ? "Winner detected with statistical significance. Consider rolling out." : "Continue experiment to reach statistical significance.",
      statisticalResults,
      guardrailResults: experiment.guardrailMetricIds.map((metricId) => {
        const observations = state.observations.filter((o) => o.experimentId === experimentId && o.metricId === metricId);
        const avg = observations.length > 0 ? observations.reduce((sum, o) => sum + o.value, 0) / observations.length : 0;
        return { metricId, status: "passed" as const, value: avg };
      }),
      conclusion: body.conclusion ? String(body.conclusion) : undefined,
      createdBy: actor.userId
    };

    state.analyses.push(analysis);
    this.store.save();
    this.store.audit(actor, "analysis.create", "analysis", analysis.id, undefined, analysis);

    return clone(analysis);
  }

  listHypotheses(actor: RequestActor): Hypothesis[] {
    return clone(this.store.getState().hypotheses.filter((h) => h.tenantId === actor.tenantId));
  }

  createHypothesis(input: unknown, actor: RequestActor): Hypothesis {
    const body = ensureObject(input, "hypothesis");
    const hypothesis: Hypothesis = {
      id: newId("hyp"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      hypothesis: ensureString(body.hypothesis, "hypothesis.hypothesis"),
      ifStatement: ensureString(body.ifStatement, "hypothesis.ifStatement"),
      thenStatement: ensureString(body.thenStatement, "hypothesis.thenStatement"),
      becauseStatement: body.becauseStatement ? String(body.becauseStatement) : undefined,
      problemStatement: body.problemStatement ? String(body.problemStatement) : undefined,
      assumptions: ensureArray<string>(body.assumptions, "hypothesis.assumptions"),
      successCriteria: ensureArray<string>(body.successCriteria, "hypothesis.successCriteria"),
      failureCriteria: ensureArray<string>(body.failureCriteria, "hypothesis.failureCriteria"),
      status: "draft"
    };

    this.store.getState().hypotheses.push(hypothesis);
    this.store.save();
    this.store.audit(actor, "hypothesis.create", "hypothesis", hypothesis.id, undefined, hypothesis);

    return clone(hypothesis);
  }

  listMetricDefinitions(actor: RequestActor): MetricDefinition[] {
    return clone(this.store.getState().metricDefinitions.filter((m) => m.tenantId === actor.tenantId));
  }

  createMetricDefinition(input: unknown, actor: RequestActor): MetricDefinition {
    const body = ensureObject(input, "metricDefinition");
    const metric: MetricDefinition = {
      id: newId("metric"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: ensureString(body.key, "metricDefinition.key"),
      name: ensureString(body.name, "metricDefinition.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "primary"),
      unit: ensureString(body.unit, "metricDefinition.unit"),
      aggregator: String(body.aggregator ?? "sum"),
      formula: body.formula ? String(body.formula) : undefined,
      status: "active"
    };

    this.store.getState().metricDefinitions.push(metric);
    this.store.save();
    this.store.audit(actor, "metric.create", "metricDefinition", metric.id, undefined, metric);

    return clone(metric);
  }

  listFeatureFlags(actor: RequestActor): FeatureFlag[] {
    return clone(this.store.getState().featureFlags.filter((f) => f.tenantId === actor.tenantId));
  }

  createFeatureFlag(input: unknown, actor: RequestActor): FeatureFlag {
    const body = ensureObject(input, "featureFlag");
    const flag: FeatureFlag = {
      id: newId("flag"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: ensureString(body.key, "featureFlag.key"),
      name: ensureString(body.name, "featureFlag.name"),
      description: body.description ? String(body.description) : undefined,
      experimentId: body.experimentId ? String(body.experimentId) : undefined,
      enabled: ensureBoolean(body.enabled, false),
      rolloutPercentage: ensureNumber(body.rolloutPercentage, "featureFlag.rolloutPercentage", 0),
      targetAudience: body.targetAudience ? String(body.targetAudience) : undefined,
      rules: optionalObject(body.rules),
      status: "active",
      killSwitch: ensureBoolean(body.killSwitch, false),
      metadata: optionalObject(body.metadata)
    };

    this.store.getState().featureFlags.push(flag);
    this.store.save();
    this.store.audit(actor, "feature_flag.create", "featureFlag", flag.id, undefined, flag);

    return clone(flag);
  }

  toggleFeatureFlag(id: string, actor: RequestActor): FeatureFlag {
    const state = this.store.getState();
    const flag = state.featureFlags.find((f) => f.id === id && f.tenantId === actor.tenantId);
    if (!flag) notFound("Feature flag not found");

    const before = clone(flag);
    flag.enabled = !flag.enabled;
    flag.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "feature_flag.toggle", "featureFlag", flag.id, before, flag);

    return clone(flag);
  }

  listDecisions(actor: RequestActor): Decision[] {
    return clone(this.store.getState().decisions.filter((d) => d.tenantId === actor.tenantId));
  }

  createDecision(experimentId: string, input: unknown, actor: RequestActor): Decision {
    const body = ensureObject(input, "decision");
    const decision: Decision = {
      id: newId("decision"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      experimentId,
      type: ensureString(body.type, "decision.type"),
      variantId: body.variantId ? String(body.variantId) : undefined,
      status: "pending",
      reason: ensureString(body.reason, "decision.reason"),
      notes: body.notes ? String(body.notes) : undefined
    };

    this.store.getState().decisions.push(decision);
    this.store.save();
    this.store.audit(actor, "decision.create", "decision", decision.id, undefined, decision);

    return clone(decision);
  }

  approveDecision(id: string, actor: RequestActor): Decision {
    const state = this.store.getState();
    const decision = state.decisions.find((d) => d.id === id && d.tenantId === actor.tenantId);
    if (!decision) notFound("Decision not found");

    decision.status = "approved";
    decision.approvedBy = actor.userId;
    decision.approvedAt = nowIso();
    decision.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "decision.approve", "decision", decision.id, undefined, decision);

    return clone(decision);
  }

  listAuditLogs(actor: RequestActor): any[] {
    return clone(this.store.getState().auditLogs.filter((a) => a.tenantId === actor.tenantId));
  }

  getExperimentAnalytics(experimentId: string, actor: RequestActor): any {
    const state = this.store.getState();
    const experiment = state.experiments.find((e) => e.id === experimentId && e.tenantId === actor.tenantId);
    if (!experiment) notFound("Experiment not found");

    const variants = state.variants.filter((v) => v.experimentId === experimentId);
    const observations = state.observations.filter((o) => o.experimentId === experimentId);
    const assignments = state.assignments.filter((a) => a.experimentId === experimentId);

    const variantStats = variants.map((v) => {
      const variantObservations = observations.filter((o) => o.variantId === v.id);
      const variantAssignments = assignments.filter((a) => a.variantId === v.id);
      const conversions = variantAssignments.filter((a) => a.status === "converted").length;

      return {
        variantId: v.id,
        variantName: v.name,
        variantType: v.type,
        trafficPercentage: v.trafficPercentage,
        assignments: variantAssignments.length,
        conversions,
        conversionRate: variantAssignments.length > 0 ? conversions / variantAssignments.length : 0,
        totalObservations: variantObservations.length,
        avgValue: variantObservations.length > 0 ? variantObservations.reduce((sum, o) => sum + o.value, 0) / variantObservations.length : 0
      };
    });

    return {
      experimentId,
      experimentName: experiment.name,
      status: experiment.status,
      currentSampleSize: experiment.currentSampleSize,
      targetSampleSize: experiment.targetSampleSize,
      progressPercent: experiment.targetSampleSize ? (experiment.currentSampleSize / experiment.targetSampleSize) * 100 : 0,
      variants: variantStats,
      totalAssignments: assignments.length,
      totalConversions: assignments.filter((a) => a.status === "converted").length,
      overallConversionRate: assignments.length > 0 ? assignments.filter((a) => a.status === "converted").length / assignments.length : 0
    };
  }

  private emitEvent(experimentId: string, type: string, data: Record<string, unknown>, actor: RequestActor): void {
    const event: ExperimentEvent = {
      id: newId("event"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      experimentId,
      type,
      source: "ExperimentOS",
      data,
      actorId: actor.userId
    };
    this.store.getState().experimentEvents.push(event);
  }

  private calculatePValue(treatmentMean: number, controlMean: number, standardError: number, sampleSize: number): number {
    if (standardError === 0 || sampleSize === 0) return 1;
    const zScore = (treatmentMean - controlMean) / standardError;
    return 2 * (1 - this.normalCDF(Math.abs(zScore)));
  }

  private normalCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return 0.5 * (1.0 + sign * y);
  }
}
