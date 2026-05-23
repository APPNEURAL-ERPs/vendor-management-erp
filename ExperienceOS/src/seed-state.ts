import { ExperienceState } from "./core/domain";
import { emptyState } from "./core/datastore";
import { nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): ExperienceState {
  const state = emptyState();
  const createdAt = nowIso();

  state.personas.push({
    id: "persona_job_seeker",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "job_seeker",
    name: "Job Seeker",
    description: "Professional looking for career opportunities and resume improvement",
    type: "user",
    status: "active",
    demographics: {
      age: "25-40",
      occupation: "Professional",
      industry: "Various"
    },
    goals: [
      "Get job-ready resume",
      "Improve interview skills",
      "Match with target positions",
      "Track application status"
    ],
    painPoints: [
      "Does not know why resume is rejected",
      "Confused about missing skills",
      "Spends too much time on applications"
    ],
    behaviors: [
      "Uploads resume regularly",
      "Searches for jobs daily",
      "Checks match scores"
    ],
    needs: [
      "Better resume",
      "JD match score",
      "Interview preparation",
      "Recruiter messaging"
    ],
    metadata: { priority: "high", segment: "premium" }
  });

  state.personas.push({
    id: "persona_recruiter",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "recruiter",
    name: "Recruiter",
    description: "HR professional sourcing and evaluating candidates",
    type: "user",
    status: "active",
    demographics: {
      occupation: "HR/Recruiter",
      companySize: "Medium to Large"
    },
    goals: [
      "Find qualified candidates quickly",
      "Streamline screening process",
      "Improve hiring quality",
      "Reduce time-to-hire"
    ],
    painPoints: [
      "Too many unqualified applications",
      "Time-consuming resume review",
      "Difficulty assessing culture fit"
    ],
    behaviors: [
      "Searches candidate database daily",
      "Uses ATS features",
      "Reviews match scores"
    ],
    needs: [
      "Candidate ranking",
      "Skills matching",
      "Quick screening tools",
      "Interview scheduling"
    ],
    metadata: { priority: "high" }
  });

  state.journeys.push({
    id: "journey_careeros",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "careeros_job_seeker",
    name: "CareerOS Job Seeker Journey",
    description: "Complete job search and resume improvement journey",
    type: "user",
    status: "active",
    personaId: "persona_job_seeker",
    stages: [
      {
        id: "stage_awareness",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        journeyId: "journey_careeros",
        name: "Awareness",
        description: "User discovers the platform",
        order: 1,
        touchpoints: ["website", "ads", "referral"],
        painPoints: ["Doesn't trust platform yet"],
        opportunities: ["Showcase success stories"],
        emotion: "neutral",
        metrics: { dropOffRate: 0.3 }
      },
      {
        id: "stage_signup",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        journeyId: "journey_careeros",
        name: "Signup",
        description: "User creates account",
        order: 2,
        touchpoints: ["signup form", "email verification"],
        painPoints: ["Form too long", "Email verification delay"],
        opportunities: ["Social login", "Reduced fields"],
        emotion: "positive",
        metrics: { completionRate: 0.7 }
      },
      {
        id: "stage_onboarding",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        journeyId: "journey_careeros",
        name: "Onboarding",
        description: "User completes initial setup",
        order: 3,
        touchpoints: ["dashboard", "tutorial", "profile setup"],
        painPoints: ["Unclear next steps", "Too many options"],
        opportunities: ["Progressive disclosure", "Guided tour"],
        emotion: "neutral",
        metrics: { completionRate: 0.5, averageTime: 480 }
      },
      {
        id: "stage_upload_resume",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        journeyId: "journey_careeros",
        name: "Upload Resume",
        description: "User uploads their resume",
        order: 4,
        touchpoints: ["upload zone", "file processing"],
        painPoints: ["File size limits", "Format issues"],
        opportunities: ["Auto-parsing", "Format conversion"],
        emotion: "positive",
        metrics: { completionRate: 0.85 }
      },
      {
        id: "stage_match_score",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        journeyId: "journey_careeros",
        name: "Get Match Score",
        description: "User views JD match analysis",
        order: 5,
        touchpoints: ["JD paste box", "score display", "skill gaps"],
        painPoints: ["Confusing metrics", "Too many gaps shown"],
        opportunities: ["Prioritized gaps", "Quick wins highlighted"],
        emotion: "very_positive",
        metrics: { completionRate: 0.9, averageTime: 120 }
      }
    ],
    completionRate: 0.45,
    metadata: { version: "2.0", lastOptimized: createdAt }
  });

  state.onboardings.push({
    id: "onboarding_careeros",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "careeros_new_user",
    name: "CareerOS New User Onboarding",
    description: "Guided setup for new CareerOS users",
    targetType: "user",
    status: "active",
    personaId: "persona_job_seeker",
    steps: [
      {
        id: "onboard_step_1",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        onboardingId: "onboarding_careeros",
        name: "Add career goal",
        description: "Define your target role",
        order: 1,
        type: "setup",
        status: "pending",
        required: true,
        estimatedTime: 60,
        completionCriteria: ["Goal selected", "Industry chosen"]
      },
      {
        id: "onboard_step_2",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        onboardingId: "onboarding_careeros",
        name: "Upload resume",
        description: "Upload your current resume",
        order: 2,
        type: "setup",
        status: "pending",
        required: true,
        estimatedTime: 120,
        completionCriteria: ["Resume uploaded", "Parse complete"]
      },
      {
        id: "onboard_step_3",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        onboardingId: "onboarding_careeros",
        name: "Paste target JD",
        description: "Enter job description to match",
        order: 3,
        type: "learning",
        status: "pending",
        required: false,
        estimatedTime: 180,
        completionCriteria: ["JD pasted", "Analysis complete"]
      },
      {
        id: "onboard_step_4",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        onboardingId: "onboarding_careeros",
        name: "View match score",
        description: "See how your resume matches",
        order: 4,
        type: "verification",
        status: "pending",
        required: false,
        estimatedTime: 60,
        completionCriteria: ["Score viewed", "Gaps reviewed"]
      },
      {
        id: "onboard_step_5",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        onboardingId: "onboarding_careeros",
        name: "Improve resume",
        description: "Use AI suggestions to improve",
        order: 5,
        type: "learning",
        status: "pending",
        required: false,
        estimatedTime: 300,
        completionCriteria: ["Suggestions reviewed", "Changes saved"]
      }
    ],
    timeToValue: 720,
    completionRate: 0.62,
    totalSteps: 5,
    requiredSteps: 2,
    metadata: { version: "2.1", optimizationDate: createdAt }
  });

  state.flows.push({
    id: "flow_resume_upload",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "resume_upload_flow",
    name: "Resume Upload Flow",
    description: "Step-by-step resume upload and analysis",
    type: "onboarding",
    status: "active",
    personaId: "persona_job_seeker",
    steps: [
      {
        id: "flowstep_1",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        flowId: "flow_resume_upload",
        name: "Click upload button",
        description: "Initiate resume upload",
        order: 1,
        type: "action",
        nextSteps: ["flowstep_2"],
        previousSteps: [],
        required: true,
        estimatedTime: 5
      },
      {
        id: "flowstep_2",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        flowId: "flow_resume_upload",
        name: "Select file",
        description: "Choose resume file from device",
        order: 2,
        type: "action",
        nextSteps: ["flowstep_3"],
        previousSteps: ["flowstep_1"],
        required: true,
        estimatedTime: 30,
        validation: { required: true, rules: ["file_type:pdf,docx", "file_size:max_5mb"] }
      },
      {
        id: "flowstep_3",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        flowId: "flow_resume_upload",
        name: "Confirm upload",
        description: "Confirm file selection",
        order: 3,
        type: "confirmation",
        nextSteps: ["flowstep_4"],
        previousSteps: ["flowstep_2"],
        required: true,
        estimatedTime: 5
      },
      {
        id: "flowstep_4",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        flowId: "flow_resume_upload",
        name: "Processing",
        description: "System parses resume",
        order: 4,
        type: "action",
        nextSteps: ["flowstep_5"],
        previousSteps: ["flowstep_3"],
        required: true,
        estimatedTime: 120
      },
      {
        id: "flowstep_5",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        flowId: "flow_resume_upload",
        name: "View results",
        description: "See parsed resume data",
        order: 5,
        type: "action",
        nextSteps: [],
        previousSteps: ["flowstep_4"],
        required: true,
        estimatedTime: 60
      }
    ],
    totalSteps: 5,
    requiredSteps: 5,
    estimatedTotalTime: 220,
    metadata: { conversionRate: 0.78 }
  });

  state.microcopy.push({
    id: "microcopy_upload_cta",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "upload_resume_cta",
    type: "button",
    context: "Resume upload section",
    text: "Upload Resume",
    alternatives: ["Upload My Resume", "Add Resume"],
    language: "en",
    status: "active",
    metadata: {}
  });

  state.microcopy.push({
    id: "microcopy_match_score",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "match_score_title",
    type: "label",
    context: "Score display section",
    text: "Your Match Score",
    language: "en",
    status: "active",
    metadata: {}
  });

  state.microcopy.push({
    id: "microcopy_empty_state",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "no_resumes_empty",
    type: "empty_state",
    context: "Resume list page",
    text: "No resumes yet",
    alternatives: ["You haven't uploaded any resumes"],
    language: "en",
    status: "active",
    metadata: {}
  });

  state.microcopy.push({
    id: "microcopy_success",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "upload_success",
    type: "success",
    context: "After successful upload",
    text: "Resume uploaded successfully!",
    alternatives: ["Your resume is ready", "Upload complete"],
    language: "en",
    status: "active",
    metadata: {}
  });

  state.abTests.push({
    id: "abtest_cta_color",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "cta_button_color_test",
    name: "CTA Button Color Test",
    description: "Testing blue vs green CTA buttons",
    targetType: "button",
    status: "active",
    hypothesis: "Green buttons will have higher click-through rate",
    variants: [
      {
        id: "variant_blue",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        testId: "abtest_cta_color",
        name: "Blue Button",
        description: "Current blue CTA",
        weight: 50,
        metrics: { impressions: 1250, conversions: 187, conversionRate: 14.96 },
        status: "active"
      },
      {
        id: "variant_green",
        tenantId,
        createdAt,
        updatedAt: createdAt,
        testId: "abtest_cta_color",
        name: "Green Button",
        description: "Alternative green CTA",
        weight: 50,
        metrics: { impressions: 1245, conversions: 224, conversionRate: 17.99 },
        status: "active"
      }
    ],
    startDate: createdAt,
    metrics: { totalImpressions: 2495, totalConversions: 411, overallConversionRate: 16.47 },
    createdBy: "seed",
    metadata: { confidenceLevel: 0.95 }
  });

  state.feedback.push({
    id: "feedback_nps_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "nps",
    source: "in_app",
    npsScore: 9,
    text: "Great tool for improving my resume quickly!",
    category: "general",
    userId: "user_1",
    relatedEntityType: "onboarding",
    relatedEntityId: "onboarding_careeros",
    status: "reviewed",
    sentiment: "positive",
    tags: ["positive", "easy-to-use"],
    createdBy: "user_1"
  });

  state.feedback.push({
    id: "feedback_nps_2",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "nps",
    source: "email",
    npsScore: 6,
    text: "Good concept but interface is confusing at first",
    category: "usability",
    userId: "user_2",
    status: "new",
    sentiment: "neutral",
    tags: ["confusing", "needs-improvement"],
    createdBy: "user_2"
  });

  state.metrics.push({
    id: "metric_task_completion",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "task_completion",
    name: "Resume Upload Completion",
    value: 78.5,
    unit: "%",
    timeframe: "daily",
    dimensions: { platform: "web", persona: "job_seeker" },
    trend: "up",
    change: 3.2,
    metadata: {}
  });

  state.metrics.push({
    id: "metric_conversion",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "conversion",
    name: "Onboarding to First Action",
    value: 62,
    unit: "%",
    timeframe: "weekly",
    dimensions: { onboarding: "careeros_new_user" },
    trend: "stable",
    metadata: {}
  });

  state.metrics.push({
    id: "metric_satisfaction",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "satisfaction",
    name: "Average NPS Score",
    value: 7.4,
    unit: "/10",
    timeframe: "monthly",
    dimensions: {},
    trend: "up",
    change: 0.8,
    metadata: {}
  });

  state.events.push({
    id: "event_seed_bootstrap",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "experience.seeded",
    source: "ExperienceOS",
    data: { message: "ExperienceOS demo data seeded" }
  });

  return state;
}
