export function docs() {
  return {
    name: "QualityOS",
    version: "1.0.0",
    description: "QualityOS: QA processes, test cases, bug tracking, feedback, satisfaction surveys, and quality metrics for the APPNEURAL ecosystem.",
    auth: {
      headers: {
        "x-role": "owner | admin | qa_manager | qa_engineer | tester | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      process: "A QA process defining testing activities, ownership, and timelines.",
      checklist: "A quality checklist with items to verify during testing or release.",
      testPlan: "A test plan containing test suites and test cases for a release or feature.",
      testCase: "An individual test case with steps, expected results, and priority.",
      testRun: "An execution of test cases with results (passed, failed, blocked, skipped).",
      bug: "A defect or issue discovered during testing with severity, priority, and lifecycle.",
      feedback: "Customer or user feedback including ratings, source, and status.",
      survey: "A satisfaction survey with questions and responses.",
      metric: "A quality metric tracking performance against targets and thresholds.",
      releaseReadiness: "A release readiness checklist with blockers and approvals.",
      rootCauseAnalysis: "An RCA documenting issue, root cause, and prevention plans."
    },
    entities: {
      processes: "QA processes managing testing activities",
      checklists: "Quality checklists for verification",
      testPlans: "Test plans containing suites",
      testCases: "Test cases with steps and expected results",
      testRuns: "Test executions with results",
      bugs: "Defects and issues with lifecycle tracking",
      feedback: "User and customer feedback",
      surveys: "Satisfaction surveys",
      metrics: "Quality metrics and KPIs",
      releaseReadiness: "Release readiness checks",
      rootCauseAnalyses: "Root cause analysis documents"
    },
    examples: {
      createProcess: {
        method: "POST",
        path: "/qualityos/processes",
        headers: { "x-role": "qa_manager" },
        body: { key: "sprint_qa", name: "Sprint QA Process", type: "manual", description: "QA process for sprint testing" }
      },
      createBug: {
        method: "POST",
        path: "/qualityos/bugs",
        headers: { "x-role": "qa_engineer" },
        body: { key: "bug_login_001", title: "Login fails with special characters", severity: "high", priority: "high", description: "Users cannot login when password contains special characters" }
      },
      createTestCase: {
        method: "POST",
        path: "/qualityos/test-cases",
        headers: { "x-role": "qa_engineer" },
        body: { key: "tc_login_001", name: "Test Login with Valid Credentials", type: "functional", priority: "high", steps: [{ action: "Enter valid username", expectedResult: "Username accepted" }, { action: "Enter valid password", expectedResult: "Password accepted" }], expectedResult: "User successfully logged in" }
      },
      createMetric: {
        method: "POST",
        path: "/qualityos/metrics",
        headers: { "x-role": "qa_manager" },
        body: { key: "test_coverage_pct", name: "Test Coverage Percentage", category: "test_coverage", value: 86, unit: "%", target: 90, threshold: 80, period: "monthly" }
      }
    }
  };
}
