import { emptyState } from "./core/datastore";
import { QualityState } from "./core/domain";
import { nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): QualityState {
  const state = emptyState();
  const createdAt = nowIso();

  state.processes.push({
    id: "process_sprint_qa",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "sprint_qa",
    name: "Sprint QA Process",
    description: "QA process for bi-weekly sprint releases",
    status: "active",
    type: "manual",
    ownerId: "user_qa_manager",
    assigneeIds: ["user_qa_engineer_1", "user_qa_engineer_2"],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {}
  });

  state.checklists.push({
    id: "checklist_release_prep",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "release_prep",
    name: "Release Preparation Checklist",
    description: "Checklist for preparing a release for deployment",
    status: "active",
    processId: "process_sprint_qa",
    items: [
      { id: "item_1", text: "All critical bugs are closed", checked: false, order: 1 },
      { id: "item_2", text: "Test coverage is above 80%", checked: false, order: 2 },
      { id: "item_3", text: "Security review completed", checked: false, order: 3 },
      { id: "item_4", text: "Performance benchmarks met", checked: false, order: 4 },
      { id: "item_5", text: "Documentation updated", checked: false, order: 5 }
    ],
    tags: ["release", "deployment"],
    metadata: {}
  });

  state.testPlans.push({
    id: "testplan_v2_login",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "v2_login",
    name: "Version 2 Login Feature Test Plan",
    description: "Comprehensive test plan for login feature v2",
    status: "active",
    processId: "process_sprint_qa",
    suiteIds: [],
    assigneeIds: ["user_qa_engineer_1"],
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {}
  });

  state.testCases.push(
    {
      id: "testcase_login_valid",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "tc_login_valid",
      name: "Login with Valid Credentials",
      description: "Test successful login with correct username and password",
      status: "active",
      suiteId: undefined,
      type: "functional",
      priority: "high",
      steps: [
        { order: 1, action: "Navigate to login page", expectedResult: "Login form displayed" },
        { order: 2, action: "Enter valid username", expectedResult: "Username field populated" },
        { order: 3, action: "Enter valid password", expectedResult: "Password field populated" },
        { order: 4, action: "Click Login button", expectedResult: "User redirected to dashboard" }
      ],
      expectedResult: "User successfully logged in and redirected to dashboard",
      assigneeId: "user_qa_engineer_1",
      tags: ["login", "authentication", "critical"],
      estimatedDuration: 300,
      metadata: {}
    },
    {
      id: "testcase_login_invalid",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "tc_login_invalid",
      name: "Login with Invalid Credentials",
      description: "Test login failure with incorrect username or password",
      status: "active",
      suiteId: undefined,
      type: "functional",
      priority: "high",
      steps: [
        { order: 1, action: "Navigate to login page", expectedResult: "Login form displayed" },
        { order: 2, action: "Enter invalid username", expectedResult: "Username field populated" },
        { order: 3, action: "Enter invalid password", expectedResult: "Password field populated" },
        { order: 4, action: "Click Login button", expectedResult: "Error message displayed" }
      ],
      expectedResult: "Error message shown and user remains on login page",
      assigneeId: "user_qa_engineer_1",
      tags: ["login", "authentication", "negative"],
      estimatedDuration: 180,
      metadata: {}
    },
    {
      id: "testcase_api_performance",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "tc_api_perf",
      name: "API Response Time Under Load",
      description: "Test API performance under concurrent requests",
      status: "active",
      suiteId: undefined,
      type: "performance",
      priority: "medium",
      steps: [
        { order: 1, action: "Set up load test with 100 concurrent users", expectedResult: "Load test configured" },
        { order: 2, action: "Execute API calls to /api/users endpoint", expectedResult: "Requests processed" },
        { order: 3, action: "Measure response times", expectedResult: "Response times recorded" }
      ],
      expectedResult: "API responds within 200ms for 95% of requests",
      tags: ["performance", "api", "load"],
      estimatedDuration: 600,
      metadata: {}
    }
  );

  state.testRuns.push({
    id: "testrun_sprint_15_login",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Sprint 15 Login Test Run",
    description: "Test run for login feature in Sprint 15",
    status: "active",
    planId: "testplan_v2_login",
    suiteId: undefined,
    testCaseIds: ["testcase_login_valid", "testcase_login_invalid"],
    results: [
      {
        testCaseId: "testcase_login_valid",
        status: "passed",
        executedAt: createdAt,
        executedBy: "user_qa_engineer_1",
        notes: "All steps executed successfully"
      },
      {
        testCaseId: "testcase_login_invalid",
        status: "failed",
        executedAt: createdAt,
        executedBy: "user_qa_engineer_1",
        notes: "Error message not displayed correctly",
        bugId: "bug_login_error_msg"
      }
    ],
    startedAt: createdAt,
    assigneeId: "user_qa_engineer_1",
    metadata: {}
  });

  state.bugs.push(
    {
      id: "bug_login_error_msg",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "bug_login_001",
      title: "Login error message not displayed correctly",
      description: "When login fails, the error message appears in wrong location and is not clearly visible",
      status: "active",
      bugStatus: "open",
      severity: "medium",
      priority: "medium",
      assigneeId: "user_qa_engineer_1",
      reporterId: "user_qa_engineer_1",
      testCaseId: "testcase_login_invalid",
      testRunId: "testrun_sprint_15_login",
      tags: ["login", "ui", "bug"],
      reproductionSteps: [
        "Navigate to login page",
        "Enter invalid credentials",
        "Click Login button",
        "Observe error message position"
      ],
      environment: "Production",
      metadata: {}
    },
    {
      id: "bug_api_timeout",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "bug_api_001",
      title: "API timeout after 30 seconds",
      description: "API calls timeout after 30 seconds even when server is responsive",
      status: "active",
      bugStatus: "assigned",
      severity: "high",
      priority: "high",
      assigneeId: "user_qa_engineer_2",
      reporterId: "user_qa_engineer_2",
      tags: ["api", "performance", "timeout"],
      reproductionSteps: [
        "Make API call to /api/users",
        "Wait for response",
        "Observe timeout after 30s"
      ],
      environment: "Production",
      metadata: {}
    },
    {
      id: "bug_critical_db",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "bug_db_001",
      title: "Database connection pool exhausted",
      description: "Critical: Database connection pool gets exhausted under high load",
      status: "active",
      bugStatus: "in_progress",
      severity: "critical",
      priority: "critical",
      assigneeId: "user_qa_engineer_2",
      reporterId: "user_qa_manager",
      tags: ["database", "critical", "performance"],
      reproductionSteps: [
        "Generate 1000 concurrent requests",
        "Observe database errors"
      ],
      environment: "Production",
      metadata: {}
    }
  );

  state.feedback.push(
    {
      id: "feedback_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      type: "general",
      status: "new",
      source: "web",
      rating: 4,
      subject: "Great user experience",
      content: "The new dashboard is very intuitive and easy to use. Love the color scheme!",
      authorEmail: "user@example.com",
      tags: ["ux", "positive", "dashboard"],
      metadata: {}
    },
    {
      id: "feedback_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      type: "complaint",
      status: "in_progress",
      source: "support",
      rating: 2,
      subject: "Slow performance",
      content: "The application is very slow when loading reports. It takes more than 10 seconds.",
      authorEmail: "enterprise@example.com",
      assigneeId: "user_qa_engineer_2",
      tags: ["performance", "reports", "complaint"],
      metadata: {}
    },
    {
      id: "feedback_3",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      type: "feature_request",
      status: "reviewed",
      source: "in_app",
      rating: undefined,
      subject: "Request for dark mode",
      content: "Please add dark mode option to the application. Many users prefer it.",
      authorId: "user_123",
      tags: ["feature-request", "ui", "accessibility"],
      metadata: {}
    }
  );

  state.surveys.push({
    id: "survey_q1_product",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Q1 Product Satisfaction Survey",
    description: "Quarterly customer satisfaction survey for Q1 2024",
    status: "active",
    questions: [
      {
        id: "q1",
        text: "How satisfied are you with our product?",
        type: "rating",
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        order: 1
      },
      {
        id: "q2",
        text: "Would you recommend our product to others?",
        type: "boolean",
        required: true,
        order: 2
      },
      {
        id: "q3",
        text: "What improvements would you suggest?",
        type: "text",
        required: false,
        order: 3
      }
    ],
    responses: [],
    targetAudience: "all_customers",
    createdBy: "user_qa_manager",
    metadata: {}
  });

  state.surveyResponses.push({
    id: "surveyresp_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    surveyId: "survey_q1_product",
    respondentEmail: "customer1@example.com",
    answers: [
      { questionId: "q1", value: 4 },
      { questionId: "q2", value: true },
      { questionId: "q3", value: "Add more export options" }
    ],
    submittedAt: createdAt,
    metadata: {}
  });

  state.metrics.push(
    {
      id: "metric_coverage",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "test_coverage",
      name: "Test Coverage Percentage",
      description: "Percentage of code covered by automated tests",
      category: "test_coverage",
      value: 86,
      unit: "%",
      target: 90,
      threshold: 80,
      status: "at_risk",
      period: "monthly",
      tags: ["coverage", "code-quality"],
      metadata: {}
    },
    {
      id: "metric_bugs_open",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "open_bugs",
      name: "Open Bugs Count",
      description: "Number of currently open bugs",
      category: "defect",
      value: 12,
      unit: "bugs",
      target: 5,
      threshold: 15,
      status: "at_risk",
      period: "weekly",
      tags: ["bugs", "defect-count"],
      metadata: {}
    },
    {
      id: "metric_csat",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "customer_satisfaction",
      name: "Customer Satisfaction Score",
      description: "Average customer satisfaction rating",
      category: "customer_satisfaction",
      value: 4.2,
      unit: "rating",
      target: 4.5,
      threshold: 3.5,
      status: "on_track",
      period: "quarterly",
      tags: ["satisfaction", "nps", "csat"],
      metadata: {}
    },
    {
      id: "metric_mttr",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "mean_time_to_resolution",
      name: "Mean Time to Bug Resolution",
      description: "Average time to resolve bugs from creation to closure",
      category: "process_efficiency",
      value: 3.5,
      unit: "days",
      target: 2,
      threshold: 5,
      status: "on_track",
      period: "monthly",
      tags: ["efficiency", "bug-resolution"],
      metadata: {}
    }
  );

  state.releaseReadiness.push({
    id: "release_v2_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Version 2.1 Release Readiness",
    description: "Release readiness check for version 2.1",
    status: "in_progress",
    releaseVersion: "2.1.0",
    releaseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    checklist: [
      { id: "check_1", text: "All critical bugs closed", status: "pending", category: "bugs", completedBy: undefined, completedAt: undefined },
      { id: "check_2", text: "Test coverage above 80%", status: "passed", category: "tests", completedBy: "user_qa_engineer_1", completedAt: createdAt },
      { id: "check_3", text: "Performance benchmarks met", status: "failed", category: "performance", notes: "API timeout issue still present" },
      { id: "check_4", text: "Security review completed", status: "pending", category: "security" },
      { id: "check_5", text: "Documentation updated", status: "passed", category: "documentation", completedBy: "user_qa_engineer_1", completedAt: createdAt }
    ],
    blockers: [
      {
        id: "blocker_1",
        type: "bug",
        severity: "critical",
        description: "Database connection pool exhaustion issue",
        relatedEntityType: "bug",
        relatedEntityId: "bug_critical_db",
        resolved: false
      },
      {
        id: "blocker_2",
        type: "performance",
        severity: "high",
        description: "API timeout issue under load",
        relatedEntityType: "bug",
        relatedEntityId: "bug_api_timeout",
        resolved: false
      }
    ],
    approvedBy: [],
    metadata: {}
  });

  state.rootCauseAnalyses.push({
    id: "rca_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "RCA: Login Page Performance Degradation",
    description: "Root cause analysis for login page loading slowly",
    status: "active",
    issue: "Login page takes 8-10 seconds to load in production",
    impact: "Negative user experience and increased bounce rate",
    timeline: "Issue started appearing after deployment on March 15, 2024",
    rootCause: "Multiple unoptimized database queries in the authentication module",
    contributingFactors: [
      "Missing database indexes on user table",
      "N+1 query problem in role loading",
      "No caching for permission checks"
    ],
    fixApplied: "Added database indexes, fixed N+1 queries, implemented Redis caching for permissions",
    preventionPlan: "Implement performance testing in CI/CD pipeline and add APM monitoring",
    ownerId: "user_qa_engineer_2",
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {}
  });

  state.events.push({
    id: "event_demo_bootstrap",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "qualityos.seeded",
    source: "QualityOS",
    data: { message: "QualityOS demo data seeded" }
  });

  return state;
}
