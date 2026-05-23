import { DataStore } from "./core/datastore";
import {
  Bug,
  BugComment,
  ChecklistItem,
  Feedback,
  QualityChecklist,
  QualityMetric,
  QualityOverview,
  QAProcess,
  RequestActor,
  ReleaseBlocker,
  ReleaseReadiness,
  ReleaseReadinessCheck,
  RootCauseAnalysis,
  SatisfactionSurvey,
  SurveyAnswer,
  SurveyQuestion,
  SurveyResponse,
  TestCase,
  TestPlan,
  TestResult,
  TestRun,
  TestStep
} from "./core/domain";
import { badRequest, conflict, notFound } from "./core/errors";
import { newId, nowIso } from "./core/id";
import { clone, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, optionalObject, pickQuery } from "./core/utils";

function countBy(items: any[], key: string): Record<string, number> {
  return items.reduce((acc, item) => {
    const value = String(item[key]);
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export class QualityService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "QualityOS service is ready";
  }

  overview(actor: RequestActor): QualityOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;

    const processes = state.processes.filter((p) => p.tenantId === tenant);
    const testCases = state.testCases.filter((p) => p.tenantId === tenant);
    const testRuns = state.testRuns.filter((p) => p.tenantId === tenant);
    const bugs = state.bugs.filter((p) => p.tenantId === tenant);
    const feedback = state.feedback.filter((p) => p.tenantId === tenant);
    const surveys = state.surveys.filter((p) => p.tenantId === tenant);
    const metrics = state.metrics.filter((p) => p.tenantId === tenant);

    const allResults = testRuns.flatMap((run) => run.results);

    return {
      processes: {
        total: processes.length,
        active: processes.filter((p) => p.status === "active").length,
        completed: processes.filter((p) => p.completedAt).length
      },
      testCases: {
        total: testCases.length,
        byPriority: countBy(testCases, "priority"),
        byStatus: countBy(testCases, "status")
      },
      testRuns: {
        total: testRuns.length,
        passed: allResults.filter((r) => r.status === "passed").length,
        failed: allResults.filter((r) => r.status === "failed").length,
        blocked: allResults.filter((r) => r.status === "blocked").length
      },
      bugs: {
        total: bugs.length,
        open: bugs.filter((b) => ["open", "triaged", "assigned", "in_progress"].includes(b.bugStatus)).length,
        critical: bugs.filter((b) => b.severity === "critical" && b.bugStatus !== "closed").length,
        byStatus: countBy(bugs, "bugStatus")
      },
      feedback: {
        total: feedback.length,
        new: feedback.filter((f) => f.status === "new").length,
        resolved: feedback.filter((f) => f.status === "resolved").length,
        avgRating: feedback.filter((f) => f.rating !== undefined).reduce((sum, f) => sum + (f.rating ?? 0), 0) /
                   Math.max(1, feedback.filter((f) => f.rating !== undefined).length)
      },
      surveys: {
        total: surveys.length,
        active: surveys.filter((s) => s.status === "active").length,
        responses: state.surveyResponses.filter((r) => r.tenantId === tenant).length
      },
      metrics: {
        total: metrics.length,
        onTrack: metrics.filter((m) => m.status === "on_track").length,
        atRisk: metrics.filter((m) => m.status === "at_risk").length,
        breached: metrics.filter((m) => m.status === "breached").length
      }
    };
  }

  listProcesses(actor: RequestActor) {
    return clone(this.store.getState().processes.filter((p) => p.tenantId === actor.tenantId));
  }

  createProcess(input: unknown, actor: RequestActor): QAProcess {
    const body = ensureObject(input, "process");
    const state = this.store.getState();
    const key = ensureString(body.key, "process.key");
    if (state.processes.some((p) => p.tenantId === actor.tenantId && p.key === key)) conflict(`Process key '${key}' already exists`);

    const process: QAProcess = {
      id: newId("process"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "process.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as any,
      type: String(body.type ?? "manual") as any,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      assigneeIds: ensureArray(body.assigneeIds, "process.assigneeIds", []),
      dueDate: body.dueDate ? String(body.dueDate) : undefined,
      completedAt: body.completedAt ? String(body.completedAt) : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.processes.push(process);
    this.store.save();
    this.store.audit(actor, "process.create", "process", process.id, undefined, process);
    return clone(process);
  }

  listChecklists(actor: RequestActor) {
    return clone(this.store.getState().checklists.filter((p) => p.tenantId === actor.tenantId));
  }

  createChecklist(input: unknown, actor: RequestActor): QualityChecklist {
    const body = ensureObject(input, "checklist");
    const state = this.store.getState();
    const key = ensureString(body.key, "checklist.key");
    if (state.checklists.some((p) => p.tenantId === actor.tenantId && p.key === key)) conflict(`Checklist key '${key}' already exists`);

    const checklist: QualityChecklist = {
      id: newId("checklist"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "checklist.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as any,
      processId: body.processId ? String(body.processId) : undefined,
      items: ensureArray(body.items, "checklist.items", []).map((item: any, index: number) => ({
        id: String(item.id ?? newId("item")),
        text: ensureString(item.text, `checklist.items[${index}].text`),
        checked: ensureBoolean(item.checked, false),
        order: index,
        notes: item.notes ? String(item.notes) : undefined
      })),
      tags: ensureArray(body.tags, "checklist.tags", []),
      metadata: optionalObject(body.metadata)
    };

    state.checklists.push(checklist);
    this.store.save();
    this.store.audit(actor, "checklist.create", "checklist", checklist.id, undefined, checklist);
    return clone(checklist);
  }

  listTestPlans(actor: RequestActor) {
    return clone(this.store.getState().testPlans.filter((p) => p.tenantId === actor.tenantId));
  }

  createTestPlan(input: unknown, actor: RequestActor): TestPlan {
    const body = ensureObject(input, "testPlan");
    const state = this.store.getState();
    const key = ensureString(body.key, "testPlan.key");
    if (state.testPlans.some((p) => p.tenantId === actor.tenantId && p.key === key)) conflict(`TestPlan key '${key}' already exists`);

    const plan: TestPlan = {
      id: newId("testplan"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "testPlan.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as any,
      processId: body.processId ? String(body.processId) : undefined,
      suiteIds: ensureArray(body.suiteIds, "testPlan.suiteIds", []),
      assigneeIds: ensureArray(body.assigneeIds, "testPlan.assigneeIds", []),
      dueDate: body.dueDate ? String(body.dueDate) : undefined,
      completedAt: body.completedAt ? String(body.completedAt) : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.testPlans.push(plan);
    this.store.save();
    this.store.audit(actor, "testplan.create", "testPlan", plan.id, undefined, plan);
    return clone(plan);
  }

  listTestCases(actor: RequestActor, query?: URLSearchParams) {
    const suiteId = pickQuery(query, "suiteId");
    const search = pickQuery(query, "search")?.toLowerCase();
    return clone(this.store.getState().testCases.filter((p) => {
      if (p.tenantId !== actor.tenantId) return false;
      if (suiteId && p.suiteId !== suiteId) return false;
      if (search && !`${p.key} ${p.name} ${p.description ?? ""}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  createTestCase(input: unknown, actor: RequestActor): TestCase {
    const body = ensureObject(input, "testCase");
    const state = this.store.getState();
    const key = ensureString(body.key, "testCase.key");
    if (state.testCases.some((p) => p.tenantId === actor.tenantId && p.key === key)) conflict(`TestCase key '${key}' already exists`);

    const testCase: TestCase = {
      id: newId("testcase"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "testCase.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as any,
      suiteId: body.suiteId ? String(body.suiteId) : undefined,
      type: String(body.type ?? "functional") as any,
      priority: String(body.priority ?? "medium") as any,
      steps: ensureArray(body.steps, "testCase.steps", []).map((step: any, index: number) => ({
        order: index + 1,
        action: ensureString(step.action, `testCase.steps[${index}].action`),
        expectedResult: step.expectedResult ? String(step.expectedResult) : undefined,
        data: step.data ? String(step.data) : undefined
      })),
      prerequisites: body.prerequisites ? ensureArray(body.prerequisites, "testCase.prerequisites") : undefined,
      expectedResult: ensureString(body.expectedResult, "testCase.expectedResult"),
      assigneeId: body.assigneeId ? String(body.assigneeId) : undefined,
      tags: ensureArray(body.tags, "testCase.tags", []),
      estimatedDuration: body.estimatedDuration ? ensureNumber(body.estimatedDuration, "testCase.estimatedDuration") : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.testCases.push(testCase);
    this.store.save();
    this.store.audit(actor, "testcase.create", "testCase", testCase.id, undefined, testCase);
    return clone(testCase);
  }

  listTestRuns(actor: RequestActor, query?: URLSearchParams) {
    const planId = pickQuery(query, "planId");
    const search = pickQuery(query, "search")?.toLowerCase();
    return clone(this.store.getState().testRuns.filter((p) => {
      if (p.tenantId !== actor.tenantId) return false;
      if (planId && p.planId !== planId) return false;
      if (search && !`${p.name} ${p.description ?? ""}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  createTestRun(input: unknown, actor: RequestActor): TestRun {
    const body = ensureObject(input, "testRun");
    const state = this.store.getState();

    const run: TestRun = {
      id: newId("testrun"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "testRun.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as any,
      planId: body.planId ? String(body.planId) : undefined,
      suiteId: body.suiteId ? String(body.suiteId) : undefined,
      testCaseIds: ensureArray(body.testCaseIds, "testRun.testCaseIds", []),
      results: [],
      startedAt: body.startedAt ? String(body.startedAt) : undefined,
      completedAt: body.completedAt ? String(body.completedAt) : undefined,
      assigneeId: body.assigneeId ? String(body.assigneeId) : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.testRuns.push(run);
    this.store.save();
    this.store.audit(actor, "testrun.create", "testRun", run.id, undefined, run);
    return clone(run);
  }

  executeTestCase(testRunId: string, testCaseId: string, input: unknown, actor: RequestActor): TestRun {
    const body = ensureObject(input, "result");
    const state = this.store.getState();
    const run = state.testRuns.find((r) => r.id === testRunId && r.tenantId === actor.tenantId);
    if (!run) notFound("TestRun not found");

    const existingIndex = run.results.findIndex((r) => r.testCaseId === testCaseId);
    const result: TestResult = {
      testCaseId,
      status: String(body.status ?? "passed") as any,
      executedAt: nowIso(),
      executedBy: actor.userId,
      notes: body.notes ? String(body.notes) : undefined,
      evidenceUrls: body.evidenceUrls ? ensureArray(body.evidenceUrls, "result.evidenceUrls") : undefined,
      bugId: body.bugId ? String(body.bugId) : undefined
    };

    if (existingIndex >= 0) {
      run.results[existingIndex] = result;
    } else {
      run.results.push(result);
    }

    run.updatedAt = nowIso();
    if (!run.startedAt) run.startedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "testcase.execute", "testRun", run.id, undefined, { testCaseId, status: result.status });
    return clone(run);
  }

  listBugs(actor: RequestActor, query?: URLSearchParams) {
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");
    return clone(this.store.getState().bugs.filter((p) => {
      if (p.tenantId !== actor.tenantId) return false;
      if (status && p.bugStatus !== status) return false;
      if (search && !`${p.key} ${p.title} ${p.description ?? ""}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  createBug(input: unknown, actor: RequestActor): Bug {
    const body = ensureObject(input, "bug");
    const state = this.store.getState();
    const key = ensureString(body.key, "bug.key");
    if (state.bugs.some((p) => p.tenantId === actor.tenantId && p.key === key)) conflict(`Bug key '${key}' already exists`);

    const bug: Bug = {
      id: newId("bug"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      title: ensureString(body.title, "bug.title"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as any,
      bugStatus: String(body.bugStatus ?? "open") as any,
      severity: String(body.severity ?? "medium") as any,
      priority: String(body.priority ?? "medium") as any,
      assigneeId: body.assigneeId ? String(body.assigneeId) : undefined,
      reporterId: actor.userId,
      testCaseId: body.testCaseId ? String(body.testCaseId) : undefined,
      testRunId: body.testRunId ? String(body.testRunId) : undefined,
      tags: ensureArray(body.tags, "bug.tags", []),
      reproductionSteps: body.reproductionSteps ? ensureArray(body.reproductionSteps, "bug.reproductionSteps") : undefined,
      environment: body.environment ? String(body.environment) : undefined,
      resolvedAt: body.resolvedAt ? String(body.resolvedAt) : undefined,
      closedAt: body.closedAt ? String(body.closedAt) : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.bugs.push(bug);
    this.store.save();
    this.store.audit(actor, "bug.create", "bug", bug.id, undefined, bug);
    return clone(bug);
  }

  updateBug(bugId: string, input: unknown, actor: RequestActor): Bug {
    const body = ensureObject(input, "bug");
    const state = this.store.getState();
    const bug = state.bugs.find((b) => b.id === bugId && b.tenantId === actor.tenantId);
    if (!bug) notFound("Bug not found");

    const before = clone(bug);

    if (body.title !== undefined) bug.title = ensureString(body.title, "bug.title");
    if (body.description !== undefined) bug.description = body.description ? String(body.description) : undefined;
    if (body.status !== undefined) bug.status = String(body.status) as any;
    if (body.bugStatus !== undefined) bug.bugStatus = String(body.bugStatus) as any;
    if (body.severity !== undefined) bug.severity = String(body.severity) as any;
    if (body.priority !== undefined) bug.priority = String(body.priority) as any;
    if (body.assigneeId !== undefined) bug.assigneeId = body.assigneeId ? String(body.assigneeId) : undefined;
    if (body.tags !== undefined) bug.tags = ensureArray(body.tags, "bug.tags", []);
    if (body.reproductionSteps !== undefined) bug.reproductionSteps = body.reproductionSteps ? ensureArray(body.reproductionSteps, "bug.reproductionSteps") : undefined;
    if (body.environment !== undefined) bug.environment = body.environment ? String(body.environment) : undefined;
    if (body.resolvedAt !== undefined) bug.resolvedAt = body.resolvedAt ? String(body.resolvedAt) : undefined;
    if (body.closedAt !== undefined) bug.closedAt = body.closedAt ? String(body.closedAt) : undefined;
    if (body.metadata !== undefined) bug.metadata = optionalObject(body.metadata);

    bug.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "bug.update", "bug", bug.id, before, bug);
    return clone(bug);
  }

  addBugComment(bugId: string, input: unknown, actor: RequestActor): BugComment {
    const body = ensureObject(input, "comment");
    const state = this.store.getState();
    const bug = state.bugs.find((b) => b.id === bugId && b.tenantId === actor.tenantId);
    if (!bug) notFound("Bug not found");

    const comment: BugComment = {
      id: newId("bugcomment"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      bugId,
      authorId: actor.userId,
      content: ensureString(body.content, "comment.content"),
      type: String(body.type ?? "comment") as any,
      metadata: optionalObject(body.metadata)
    };

    state.bugComments.push(comment);
    this.store.save();
    this.store.audit(actor, "bugcomment.create", "bugComment", comment.id, undefined, comment);
    return clone(comment);
  }

  listFeedback(actor: RequestActor, query?: URLSearchParams) {
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");
    return clone(this.store.getState().feedback.filter((p) => {
      if (p.tenantId !== actor.tenantId) return false;
      if (status && p.status !== status) return false;
      if (search && !`${p.subject ?? ""} ${p.content}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  createFeedback(input: unknown, actor: RequestActor): Feedback {
    const body = ensureObject(input, "feedback");

    const feedback: Feedback = {
      id: newId("feedback"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type: String(body.type ?? "general") as any,
      status: String(body.status ?? "new") as any,
      source: String(body.source ?? "web") as any,
      rating: body.rating !== undefined ? ensureNumber(body.rating, "feedback.rating") : undefined,
      subject: body.subject ? String(body.subject) : undefined,
      content: ensureString(body.content, "feedback.content"),
      authorId: body.authorId ? String(body.authorId) : undefined,
      authorEmail: body.authorEmail ? String(body.authorEmail) : undefined,
      assigneeId: body.assigneeId ? String(body.assigneeId) : undefined,
      relatedEntityType: body.relatedEntityType ? String(body.relatedEntityType) : undefined,
      relatedEntityId: body.relatedEntityId ? String(body.relatedEntityId) : undefined,
      tags: ensureArray(body.tags, "feedback.tags", []),
      resolvedAt: body.resolvedAt ? String(body.resolvedAt) : undefined,
      metadata: optionalObject(body.metadata)
    };

    this.store.getState().feedback.push(feedback);
    this.store.save();
    this.store.audit(actor, "feedback.create", "feedback", feedback.id, undefined, feedback);
    return clone(feedback);
  }

  listSurveys(actor: RequestActor) {
    return clone(this.store.getState().surveys.filter((p) => p.tenantId === actor.tenantId));
  }

  createSurvey(input: unknown, actor: RequestActor): SatisfactionSurvey {
    const body = ensureObject(input, "survey");
    const state = this.store.getState();

    const survey: SatisfactionSurvey = {
      id: newId("survey"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "survey.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as any,
      questions: ensureArray(body.questions, "survey.questions", []).map((q: any, index: number) => ({
        id: String(q.id ?? newId("question")),
        text: ensureString(q.text, `survey.questions[${index}].text`),
        type: String(q.type ?? "rating") as any,
        required: ensureBoolean(q.required, true),
        options: q.options ? ensureArray(q.options, `survey.questions[${index}].options`) : undefined,
        scaleMin: q.scaleMin !== undefined ? ensureNumber(q.scaleMin, `survey.questions[${index}].scaleMin`) : undefined,
        scaleMax: q.scaleMax !== undefined ? ensureNumber(q.scaleMax, `survey.questions[${index}].scaleMax`) : undefined,
        order: index
      })),
      responses: [],
      targetAudience: ensureString(body.targetAudience, "survey.targetAudience"),
      createdBy: actor.userId,
      closedAt: body.closedAt ? String(body.closedAt) : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.surveys.push(survey);
    this.store.save();
    this.store.audit(actor, "survey.create", "survey", survey.id, undefined, survey);
    return clone(survey);
  }

  submitSurveyResponse(surveyId: string, input: unknown, actor: RequestActor): SurveyResponse {
    const body = ensureObject(input, "response");
    const state = this.store.getState();
    const survey = state.surveys.find((s) => s.id === surveyId && s.tenantId === actor.tenantId);
    if (!survey) notFound("Survey not found");

    const response: SurveyResponse = {
      id: newId("surveyresponse"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      surveyId,
      respondentId: body.respondentId ? String(body.respondentId) : undefined,
      respondentEmail: body.respondentEmail ? String(body.respondentEmail) : undefined,
      answers: ensureArray(body.answers, "response.answers", []).map((a: any) => ({
        questionId: String(a.questionId),
        value: a.value
      })),
      submittedAt: nowIso(),
      metadata: optionalObject(body.metadata)
    };

    state.surveyResponses.push(response);
    this.store.save();
    this.store.audit(actor, "surveyresponse.submit", "surveyResponse", response.id, undefined, response);
    return clone(response);
  }

  listMetrics(actor: RequestActor, query?: URLSearchParams) {
    const category = pickQuery(query, "category");
    return clone(this.store.getState().metrics.filter((p) => {
      if (p.tenantId !== actor.tenantId) return false;
      if (category && p.category !== category) return false;
      return true;
    }));
  }

  createMetric(input: unknown, actor: RequestActor): QualityMetric {
    const body = ensureObject(input, "metric");
    const state = this.store.getState();
    const key = ensureString(body.key, "metric.key");
    if (state.metrics.some((p) => p.tenantId === actor.tenantId && p.key === key)) conflict(`Metric key '${key}' already exists`);

    const value = ensureNumber(body.value, "metric.value");
    const target = body.target !== undefined ? ensureNumber(body.target, "metric.target") : undefined;
    const threshold = body.threshold !== undefined ? ensureNumber(body.threshold, "metric.threshold") : undefined;

    let status: "on_track" | "at_risk" | "breached" = "on_track";
    if (threshold !== undefined && value >= threshold) status = "breached";
    else if (target !== undefined && value < target * 0.9) status = "at_risk";

    const metric: QualityMetric = {
      id: newId("metric"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "metric.name"),
      description: body.description ? String(body.description) : undefined,
      category: String(body.category) as any,
      value,
      unit: body.unit ? String(body.unit) : undefined,
      target,
      threshold,
      status,
      period: String(body.period ?? "monthly") as any,
      tags: ensureArray(body.tags, "metric.tags", []),
      metadata: optionalObject(body.metadata)
    };

    state.metrics.push(metric);
    this.store.save();
    this.store.audit(actor, "metric.create", "metric", metric.id, undefined, metric);
    return clone(metric);
  }

  listReleaseReadiness(actor: RequestActor) {
    return clone(this.store.getState().releaseReadiness.filter((p) => p.tenantId === actor.tenantId));
  }

  createReleaseReadiness(input: unknown, actor: RequestActor): ReleaseReadiness {
    const body = ensureObject(input, "releaseReadiness");

    const release: ReleaseReadiness = {
      id: newId("release"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "releaseReadiness.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "pending") as any,
      releaseVersion: body.releaseVersion ? String(body.releaseVersion) : undefined,
      releaseDate: body.releaseDate ? String(body.releaseDate) : undefined,
      checklist: ensureArray(body.checklist, "releaseReadiness.checklist", []).map((c: any, index: number) => ({
        id: String(c.id ?? newId("check")),
        text: ensureString(c.text, `releaseReadiness.checklist[${index}].text`),
        status: String(c.status ?? "pending") as any,
        category: String(c.category ?? "tests") as any,
        notes: c.notes ? String(c.notes) : undefined,
        completedBy: c.completedBy ? String(c.completedBy) : undefined,
        completedAt: c.completedAt ? String(c.completedAt) : undefined
      })),
      blockers: ensureArray(body.blockers, "releaseReadiness.blockers", []).map((b: any) => ({
        id: String(b.id ?? newId("blocker")),
        type: String(b.type ?? "other") as any,
        severity: String(b.severity ?? "medium") as any,
        description: ensureString(b.description, "blocker.description"),
        relatedEntityType: b.relatedEntityType ? String(b.relatedEntityType) : undefined,
        relatedEntityId: b.relatedEntityId ? String(b.relatedEntityId) : undefined,
        resolved: ensureBoolean(b.resolved, false),
        resolvedBy: b.resolvedBy ? String(b.resolvedBy) : undefined,
        resolvedAt: b.resolvedAt ? String(b.resolvedAt) : undefined
      })),
      approvedBy: [],
      approvedAt: body.approvedAt ? String(body.approvedAt) : undefined,
      metadata: optionalObject(body.metadata)
    };

    this.store.getState().releaseReadiness.push(release);
    this.store.save();
    this.store.audit(actor, "release.create", "releaseReadiness", release.id, undefined, release);
    return clone(release);
  }

  listRootCauseAnalyses(actor: RequestActor) {
    return clone(this.store.getState().rootCauseAnalyses.filter((p) => p.tenantId === actor.tenantId));
  }

  createRootCauseAnalysis(input: unknown, actor: RequestActor): RootCauseAnalysis {
    const body = ensureObject(input, "rca");

    const rca: RootCauseAnalysis = {
      id: newId("rca"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "rca.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as any,
      issue: ensureString(body.issue, "rca.issue"),
      impact: ensureString(body.impact, "rca.impact"),
      timeline: ensureString(body.timeline, "rca.timeline"),
      rootCause: ensureString(body.rootCause, "rca.rootCause"),
      contributingFactors: ensureArray(body.contributingFactors, "rca.contributingFactors", []),
      fixApplied: ensureString(body.fixApplied, "rca.fixApplied"),
      preventionPlan: ensureString(body.preventionPlan, "rca.preventionPlan"),
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      dueDate: body.dueDate ? String(body.dueDate) : undefined,
      completedAt: body.completedAt ? String(body.completedAt) : undefined,
      metadata: optionalObject(body.metadata)
    };

    this.store.getState().rootCauseAnalyses.push(rca);
    this.store.save();
    this.store.audit(actor, "rca.create", "rootCauseAnalysis", rca.id, undefined, rca);
    return clone(rca);
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((p) => p.tenantId === actor.tenantId));
  }
}
