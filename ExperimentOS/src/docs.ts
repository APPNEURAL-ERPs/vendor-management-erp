export function docs() {
  return {
    name: "ExperimentOS",
    version: "1.0.0",
    description: "A/B testing, experiments, variants, metrics, statistical analysis, and experimentation lifecycle for APPNEURAL ecosystem",
    auth: {
      headers: {
        "x-role": "owner | admin | experiment_admin | experimenter | analyst | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      experiment: "A controlled test comparing different variants to measure impact on defined metrics",
      variant: "A specific version or treatment in an experiment (control vs treatment)",
      hypothesis: "A testable statement following 'If [change], then [outcome] should improve, because [reason]'",
      assignment: "The act of assigning a user to a specific variant in an experiment",
      observation: "A recorded data point capturing a metric value for a variant",
      analysis: "Statistical analysis comparing variant performance and determining winners",
      featureFlag: "A toggle to enable/disable features with gradual rollout capabilities",
      decision: "A documented decision about an experiment (rollout, stop, continue, etc.)"
    },
    experimentTypes: [
      "ab_test",
      "multivariate_test",
      "feature_experiment",
      "pricing_experiment",
      "landing_page_experiment",
      "email_experiment",
      "workflow_experiment",
      "ai_prompt_experiment",
      "ux_experiment",
      "growth_experiment"
    ],
    experimentStatuses: [
      "draft",
      "planned",
      "running",
      "paused",
      "completed",
      "inconclusive",
      "winner_selected",
      "stopped",
      "archived"
    ],
    examples: {
      createExperiment: {
        method: "POST",
        path: "/experimentos/experiments",
        headers: { "x-role": "experimenter" },
        body: {
          key: "landing_page_cta_test",
          name: "Landing Page CTA Test",
          description: "Testing different CTA button text",
          type: "landing_page_experiment",
          hypothesisId: "hyp_cta_test",
          primaryMetricId: "metric_demo_booking_rate",
          targetSampleSize: 1000,
          confidenceLevel: 0.95,
          tags: ["landing-page", "cta"]
        }
      },
      addVariant: {
        method: "POST",
        path: "/experimentos/experiments/:experimentId/variants",
        headers: { "x-role": "experimenter" },
        body: {
          key: "control",
          name: "Control - Original CTA",
          description: "Current CTA: 'Get Your Free Audit'",
          type: "control",
          isControl: true,
          trafficPercentage: 50,
          config: { buttonText: "Get Your Free Audit" }
        }
      },
      assignUser: {
        method: "POST",
        path: "/experimentos/experiments/:experimentId/assign",
        headers: { "x-role": "experimenter" },
        body: { userId: "user_12345" }
      },
      recordObservation: {
        method: "POST",
        path: "/experimentos/experiments/:experimentId/observations",
        headers: { "x-role": "experimenter" },
        body: {
          variantId: "var_treatment_1",
          metricId: "metric_demo_booking_rate",
          type: "conversion",
          value: 0.08,
          count: 1
        }
      },
      analyzeExperiment: {
        method: "POST",
        path: "/experimentos/experiments/:experimentId/analyze",
        headers: { "x-role": "analyst" },
        body: {
          type: "interim",
          conclusion: "Treatment variant showing positive lift"
        }
      }
    }
  };
}
