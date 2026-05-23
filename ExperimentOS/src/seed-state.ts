import { ExperimentosState } from "./core/domain";
import { emptyState } from "./core/datastore";
import { nowIso, newId } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): ExperimentosState {
  const state = emptyState();
  const createdAt = nowIso();

  state.hypotheses.push({
    id: "hyp_cta_test",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    hypothesis: "If we reduce landing page content and add a stronger CTA, then demo bookings should increase, because users will understand the offer faster.",
    ifStatement: "we reduce landing page content and add a stronger CTA",
    thenStatement: "demo bookings should increase",
    becauseStatement: "users will understand the offer faster",
    problemStatement: "Current landing page has too much content, reducing conversion rate",
    assumptions: ["Users are overwhelmed by current content", "A clearer CTA will drive action"],
    successCriteria: ["Increase demo booking rate by 15%", "Maintain bounce rate below 40%"],
    failureCriteria: ["Demo booking rate drops below current baseline", "Bounce rate increases above 50%"],
    status: "active"
  });

  state.metricDefinitions.push(
    {
      id: "metric_demo_booking_rate",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "demo_booking_rate",
      name: "Demo Booking Rate",
      description: "Percentage of visitors who book a demo",
      type: "primary",
      unit: "percentage",
      aggregator: "rate",
      status: "active"
    },
    {
      id: "metric_bounce_rate",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "bounce_rate",
      name: "Bounce Rate",
      description: "Percentage of visitors who leave without action",
      type: "guardrail",
      unit: "percentage",
      aggregator: "rate",
      status: "active"
    },
    {
      id: "metric_cta_click_rate",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "cta_click_rate",
      name: "CTA Click Rate",
      description: "Percentage of visitors who click the CTA",
      type: "secondary",
      unit: "percentage",
      aggregator: "rate",
      status: "active"
    }
  );

  state.audienceDefinitions.push({
    id: "audience_all_visitors",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "all_visitors",
    name: "All Website Visitors",
    description: "All visitors to the landing page",
    rules: [],
    estimatedSize: 10000,
    status: "active"
  });

  state.experiments.push({
    id: "exp_cta_test_001",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "cta_landing_page_test",
    name: "Landing Page CTA Test",
    description: "Testing different CTA button text and placement",
    type: "landing_page_experiment",
    hypothesisId: "hyp_cta_test",
    status: "running",
    audienceId: "audience_all_visitors",
    primaryMetricId: "metric_demo_booking_rate",
    secondaryMetricIds: ["metric_cta_click_rate"],
    guardrailMetricIds: ["metric_bounce_rate"],
    startDate: createdAt,
    targetSampleSize: 1000,
    currentSampleSize: 234,
    confidenceLevel: 0.95,
    decisionRule: "Winner if demo booking rate improves by 15% with 95% confidence",
    ownerId: "user_experimenter",
    tags: ["landing-page", "cta", "conversion"],
    metadata: { productArea: "WebsiteOS", priority: "high" },
    createdBy: "user_experimenter"
  });

  state.variants.push(
    {
      id: "var_control_cta",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      experimentId: "exp_cta_test_001",
      key: "control",
      name: "Control - Current CTA",
      description: "Current CTA: 'Get Your Free Website Audit'",
      type: "control",
      isControl: true,
      trafficPercentage: 50,
      config: { buttonText: "Get Your Free Website Audit", position: "below-hero" },
      status: "active"
    },
    {
      id: "var_treatment_cta",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      experimentId: "exp_cta_test_001",
      key: "treatment",
      name: "Treatment - Stronger CTA",
      description: "New CTA: 'Find What Is Blocking Your Website Growth'",
      type: "treatment",
      isControl: false,
      trafficPercentage: 50,
      config: { buttonText: "Find What Is Blocking Your Website Growth", position: "below-hero" },
      status: "active"
    }
  );

  state.trafficSplits.push({
    id: "split_001",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    experimentId: "exp_cta_test_001",
    splits: [
      { variantId: "var_control_cta", percentage: 50 },
      { variantId: "var_treatment_cta", percentage: 50 }
    ],
    stickyAssignment: true,
    assignmentSeed: "cta_experiment_2024"
  });

  for (let i = 0; i < 50; i++) {
    const isTreatment = Math.random() > 0.5;
    const variantId = isTreatment ? "var_treatment_cta" : "var_control_cta";
    const converted = Math.random() > 0.9;

    state.assignments.push({
      id: newId("assign"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      experimentId: "exp_cta_test_001",
      variantId,
      userId: `user_${i}`,
      sessionId: `session_${i}`,
      trafficSplit: isTreatment ? 50 : 50,
      status: converted ? "converted" : "exposed",
      exposureAt: createdAt,
      convertedAt: converted ? createdAt : undefined,
      metadata: {}
    });
  }

  state.observations.push(
    {
      id: newId("obs"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      experimentId: "exp_cta_test_001",
      variantId: "var_control_cta",
      metricId: "metric_demo_booking_rate",
      type: "conversion",
      value: 0.05,
      count: 25,
      timestamp: createdAt,
      metadata: {}
    },
    {
      id: newId("obs"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      experimentId: "exp_cta_test_001",
      variantId: "var_treatment_cta",
      metricId: "metric_demo_booking_rate",
      type: "conversion",
      value: 0.08,
      count: 28,
      timestamp: createdAt,
      metadata: {}
    }
  );

  state.experiments.push({
    id: "exp_email_subject_test",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "email_subject_test",
    name: "Email Subject Line Test",
    description: "Testing different email subject lines",
    type: "email_experiment",
    status: "planned",
    primaryMetricId: "metric_email_open_rate",
    secondaryMetricIds: [],
    guardrailMetricIds: [],
    targetSampleSize: 500,
    currentSampleSize: 0,
    confidenceLevel: 0.95,
    ownerId: "user_marketing",
    tags: ["email", "marketing", "subject-line"],
    metadata: { campaign: "Q4 Newsletter" },
    createdBy: "user_marketing"
  });

  state.featureFlags.push(
    {
      id: "flag_new_resume_builder",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "enable_new_resume_builder",
      name: "New Resume Builder",
      description: "Enable the new AI-powered resume builder",
      experimentId: "exp_resume_builder_test",
      enabled: true,
      rolloutPercentage: 20,
      rules: { plan: "pro", region: ["IN", "US"] },
      status: "active",
      killSwitch: true,
      metadata: { version: "2.0" }
    },
    {
      id: "flag_ai_assistant",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "enable_ai_assistant_v2",
      name: "AI Assistant V2",
      description: "Enable the new AI assistant version",
      enabled: false,
      rolloutPercentage: 0,
      rules: {},
      status: "inactive",
      killSwitch: true,
      metadata: { version: "2.0", model: "gpt-4" }
    }
  );

  state.experimentEvents.push({
    id: newId("event"),
    tenantId,
    createdAt,
    updatedAt: createdAt,
    experimentId: "exp_cta_test_001",
    type: "experiment.started",
    source: "ExperimentOS",
    data: { message: "CTA landing page test started" },
    actorId: "user_experimenter"
  });

  state.experimentRisks.push({
    id: newId("risk"),
    tenantId,
    createdAt,
    updatedAt: createdAt,
    experimentId: "exp_cta_test_001",
    category: "user_impact",
    severity: "low",
    description: "May affect user experience during test",
    mitigation: "Monitor user feedback closely",
    status: "open",
    ownerId: "user_experimenter"
  });

  state.analyses.push({
    id: newId("analysis"),
    tenantId,
    createdAt,
    updatedAt: createdAt,
    experimentId: "exp_cta_test_001",
    type: "interim",
    winnerVariantId: "var_treatment_cta",
    lift: 0.6,
    confidenceLevel: 0.78,
    isConclusive: false,
    recommendation: "Continue experiment to reach statistical significance",
    statisticalResults: [
      {
        id: newId("stat"),
        tenantId,
        createdAt,
        updatedAt: createdAt,
        experimentId: "exp_cta_test_001",
        variantId: "var_treatment_cta",
        metricId: "metric_demo_booking_rate",
        sampleSize: 28,
        mean: 0.08,
        variance: 0.001,
        standardDeviation: 0.032,
        confidenceInterval: [0.04, 0.12],
        pValue: 0.22,
        isSignificant: false,
        testType: "t_test",
        effectSize: 0.6
      }
    ],
    guardrailResults: [
      { metricId: "metric_bounce_rate", status: "passed", value: 0.35 }
    ],
    createdBy: "user_analyst"
  });

  return state;
}
