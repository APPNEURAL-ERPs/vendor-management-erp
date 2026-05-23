import { DataStore } from "./core/datastore";
import { newId, nowIso } from "./core/id";
import {
  ResearchState,
  Study,
  ResearchQuestion,
  Source,
  Note,
  Hypothesis,
  Evidence,
  Insight,
  Competitor,
  UserInterview,
  Survey,
  PainPoint,
  MarketSegment,
  ResearchReport,
  ResearchOverview,
  RequestActor
} from "./domain";
import { badRequest, notFound } from "./core/errors";
import { countBy } from "./core/utils";

export class ResearchService {
  constructor(private readonly store: DataStore) {}

  private state(): ResearchState {
    return this.store.getState();
  }

  private audit(actor: RequestActor, action: string, entityType: string, entityId?: string, before?: unknown, after?: unknown) {
    return this.store.audit(actor, action, entityType, entityId, before, after);
  }

  getOverview(actor: RequestActor): ResearchOverview {
    const state = this.state();
    const studies = state.studies.filter(s => s.tenantId === actor.tenantId);
    const questions = state.questions.filter(q => q.tenantId === actor.tenantId);
    const sources = state.sources.filter(s => s.tenantId === actor.tenantId);
    const insights = state.insights.filter(i => i.tenantId === actor.tenantId);
    const evidence = state.evidence.filter(e => e.tenantId === actor.tenantId);
    const interviews = state.interviews.filter(i => i.tenantId === actor.tenantId);
    const surveys = state.surveys.filter(s => s.tenantId === actor.tenantId);
    const competitors = state.competitors.filter(c => c.tenantId === actor.tenantId);

    return {
      studies: {
        total: studies.length,
        active: studies.filter(s => s.status === "in_progress").length,
        completed: studies.filter(s => s.status === "completed").length
      },
      questions: {
        total: questions.length,
        open: questions.filter(q => q.status === "open").length,
        answered: questions.filter(q => q.status === "answered").length
      },
      sources: {
        total: sources.length,
        high_reliability: sources.filter(s => s.reliability === "high").length
      },
      insights: {
        total: insights.length,
        published: insights.filter(i => i.status === "published").length,
        draft: insights.filter(i => i.status === "draft").length
      },
      evidence: {
        total: evidence.length,
        strong: evidence.filter(e => e.strength === "strong").length
      },
      interviews: {
        total: interviews.length,
        completed: interviews.filter(i => i.status === "completed").length
      },
      surveys: {
        total: surveys.length,
        active: surveys.filter(s => s.status === "active").length
      },
      competitors: {
        total: competitors.length
      }
    };
  }

  listStudies(actor: RequestActor): Study[] {
    return this.state().studies.filter(s => s.tenantId === actor.tenantId);
  }

  getStudy(actor: RequestActor, id: string): Study {
    const study = this.state().studies.find(s => s.id === id && s.tenantId === actor.tenantId);
    if (!study) notFound(`Study ${id} not found`);
    return study;
  }

  createStudy(actor: RequestActor, data: Partial<Study>): Study {
    if (!data.name) badRequest("Study name is required");
    const now = nowIso();
    const study: Study = {
      id: newId("study"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key: data.key ?? `study_${Date.now()}`,
      name: data.name,
      description: data.description,
      type: data.type ?? "general",
      status: data.status ?? "planning",
      tags: data.tags ?? [],
      questionIds: [],
      sourceIds: [],
      insightIds: [],
      ownerId: data.ownerId,
      dueDate: data.dueDate,
      metadata: data.metadata ?? {}
    };
    this.state().studies.push(study);
    this.store.save();
    this.audit(actor, "create", "Study", study.id, undefined, study);
    return study;
  }

  updateStudy(actor: RequestActor, id: string, data: Partial<Study>): Study {
    const study = this.getStudy(actor, id);
    const before = { ...study };
    Object.assign(study, data, { updatedAt: nowIso() });
    this.store.save();
    this.audit(actor, "update", "Study", study.id, before, study);
    return study;
  }

  listQuestions(actor: RequestActor, studyId?: string): ResearchQuestion[] {
    let questions = this.state().questions.filter(q => q.tenantId === actor.tenantId);
    if (studyId) questions = questions.filter(q => q.studyId === studyId);
    return questions;
  }

  getQuestion(actor: RequestActor, id: string): ResearchQuestion {
    const question = this.state().questions.find(q => q.id === id && q.tenantId === actor.tenantId);
    if (!question) notFound(`Research question ${id} not found`);
    return question;
  }

  createQuestion(actor: RequestActor, data: Partial<ResearchQuestion>): ResearchQuestion {
    if (!data.studyId) badRequest("Study ID is required");
    if (!data.question) badRequest("Question text is required");
    const now = nowIso();
    const question: ResearchQuestion = {
      id: newId("question"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      studyId: data.studyId,
      question: data.question,
      type: data.type ?? "exploratory",
      status: data.status ?? "open",
      hypothesisIds: [],
      evidenceIds: [],
      priority: data.priority ?? "medium",
      metadata: data.metadata ?? {}
    };
    this.state().questions.push(question);
    const study = this.getStudy(actor, data.studyId);
    study.questionIds.push(question.id);
    this.store.save();
    this.audit(actor, "create", "ResearchQuestion", question.id, undefined, question);
    return question;
  }

  updateQuestion(actor: RequestActor, id: string, data: Partial<ResearchQuestion>): ResearchQuestion {
    const question = this.getQuestion(actor, id);
    const before = { ...question };
    Object.assign(question, data, { updatedAt: nowIso() });
    this.store.save();
    this.audit(actor, "update", "ResearchQuestion", question.id, before, question);
    return question;
  }

  listSources(actor: RequestActor, studyId?: string): Source[] {
    let sources = this.state().sources.filter(s => s.tenantId === actor.tenantId);
    if (studyId) sources = sources.filter(s => s.studyId === studyId);
    return sources;
  }

  getSource(actor: RequestActor, id: string): Source {
    const source = this.state().sources.find(s => s.id === id && s.tenantId === actor.tenantId);
    if (!source) notFound(`Source ${id} not found`);
    return source;
  }

  createSource(actor: RequestActor, data: Partial<Source>): Source {
    if (!data.title) badRequest("Source title is required");
    const now = nowIso();
    const source: Source = {
      id: newId("source"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      studyId: data.studyId,
      sourceType: data.sourceType ?? "website",
      title: data.title,
      url: data.url,
      author: data.author,
      publishedAt: data.publishedAt,
      reliability: data.reliability ?? "medium",
      content: data.content,
      tags: data.tags ?? [],
      metadata: data.metadata ?? {}
    };
    this.state().sources.push(source);
    if (data.studyId) {
      const study = this.getStudy(actor, data.studyId);
      study.sourceIds.push(source.id);
    }
    this.store.save();
    this.audit(actor, "create", "Source", source.id, undefined, source);
    return source;
  }

  updateSource(actor: RequestActor, id: string, data: Partial<Source>): Source {
    const source = this.getSource(actor, id);
    const before = { ...source };
    Object.assign(source, data, { updatedAt: nowIso() });
    this.store.save();
    this.audit(actor, "update", "Source", source.id, before, source);
    return source;
  }

  listNotes(actor: RequestActor, studyId?: string): Note[] {
    let notes = this.state().notes.filter(n => n.tenantId === actor.tenantId);
    if (studyId) notes = notes.filter(n => n.studyId === studyId);
    return notes;
  }

  createNote(actor: RequestActor, data: Partial<Note>): Note {
    if (!data.title) badRequest("Note title is required");
    if (!data.content) badRequest("Note content is required");
    const now = nowIso();
    const note: Note = {
      id: newId("note"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      studyId: data.studyId,
      questionId: data.questionId,
      title: data.title,
      content: data.content,
      authorId: data.authorId ?? actor.userId,
      tags: data.tags ?? [],
      linkedSourceIds: data.linkedSourceIds ?? [],
      metadata: data.metadata ?? {}
    };
    this.state().notes.push(note);
    this.store.save();
    this.audit(actor, "create", "Note", note.id, undefined, note);
    return note;
  }

  listHypotheses(actor: RequestActor, questionId?: string): Hypothesis[] {
    let hypotheses = this.state().hypotheses.filter(h => h.tenantId === actor.tenantId);
    if (questionId) hypotheses = hypotheses.filter(h => h.questionId === questionId);
    return hypotheses;
  }

  createHypothesis(actor: RequestActor, data: Partial<Hypothesis>): Hypothesis {
    if (!data.questionId) badRequest("Question ID is required");
    if (!data.statement) badRequest("Hypothesis statement is required");
    const now = nowIso();
    const hypothesis: Hypothesis = {
      id: newId("hypothesis"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      questionId: data.questionId,
      statement: data.statement,
      confidence: data.confidence ?? "medium",
      status: data.status ?? "proposed",
      evidenceIds: [],
      metadata: data.metadata ?? {}
    };
    this.state().hypotheses.push(hypothesis);
    const question = this.getQuestion(actor, data.questionId);
    question.hypothesisIds.push(hypothesis.id);
    this.store.save();
    this.audit(actor, "create", "Hypothesis", hypothesis.id, undefined, hypothesis);
    return hypothesis;
  }

  listEvidence(actor: RequestActor, sourceId?: string): Evidence[] {
    let evidence = this.state().evidence.filter(e => e.tenantId === actor.tenantId);
    if (sourceId) evidence = evidence.filter(e => e.sourceId === sourceId);
    return evidence;
  }

  createEvidence(actor: RequestActor, data: Partial<Evidence>): Evidence {
    if (!data.sourceId) badRequest("Source ID is required");
    if (!data.content) badRequest("Evidence content is required");
    const now = nowIso();
    const evidence: Evidence = {
      id: newId("evidence"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      sourceId: data.sourceId,
      hypothesisId: data.hypothesisId,
      type: data.type ?? "observation",
      content: data.content,
      relevance: data.relevance ?? "medium",
      strength: data.strength ?? "moderate",
      insightIds: [],
      metadata: data.metadata ?? {}
    };
    this.state().evidence.push(evidence);
    if (data.hypothesisId) {
      const hypothesis = this.state().hypotheses.find(h => h.id === data.hypothesisId);
      if (hypothesis) hypothesis.evidenceIds.push(evidence.id);
    }
    this.store.save();
    this.audit(actor, "create", "Evidence", evidence.id, undefined, evidence);
    return evidence;
  }

  listInsights(actor: RequestActor, studyId?: string): Insight[] {
    let insights = this.state().insights.filter(i => i.tenantId === actor.tenantId);
    if (studyId) insights = insights.filter(i => i.studyId === studyId);
    return insights;
  }

  getInsight(actor: RequestActor, id: string): Insight {
    const insight = this.state().insights.find(i => i.id === id && i.tenantId === actor.tenantId);
    if (!insight) notFound(`Insight ${id} not found`);
    return insight;
  }

  createInsight(actor: RequestActor, data: Partial<Insight>): Insight {
    if (!data.title) badRequest("Insight title is required");
    if (!data.observation) badRequest("Insight observation is required");
    const now = nowIso();
    const insight: Insight = {
      id: newId("insight"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      studyId: data.studyId,
      insightType: data.insightType ?? "observation",
      title: data.title,
      observation: data.observation,
      evidence: data.evidence ?? [],
      meaning: data.meaning ?? "",
      impact: data.impact ?? "medium",
      confidence: data.confidence ?? "medium",
      status: data.status ?? "draft",
      nextActions: data.nextActions ?? [],
      metadata: data.metadata ?? {}
    };
    this.state().insights.push(insight);
    if (data.studyId) {
      const study = this.getStudy(actor, data.studyId);
      study.insightIds.push(insight.id);
    }
    this.store.save();
    this.audit(actor, "create", "Insight", insight.id, undefined, insight);
    return insight;
  }

  updateInsight(actor: RequestActor, id: string, data: Partial<Insight>): Insight {
    const insight = this.getInsight(actor, id);
    const before = { ...insight };
    Object.assign(insight, data, { updatedAt: nowIso() });
    this.store.save();
    this.audit(actor, "update", "Insight", insight.id, before, insight);
    return insight;
  }

  listCompetitors(actor: RequestActor, studyId?: string): Competitor[] {
    let competitors = this.state().competitors.filter(c => c.tenantId === actor.tenantId);
    if (studyId) competitors = competitors.filter(c => c.studyId === studyId);
    return competitors;
  }

  createCompetitor(actor: RequestActor, data: Partial<Competitor>): Competitor {
    if (!data.name) badRequest("Competitor name is required");
    const now = nowIso();
    const competitor: Competitor = {
      id: newId("competitor"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      studyId: data.studyId,
      name: data.name,
      productName: data.productName,
      website: data.website,
      targetAudience: data.targetAudience,
      description: data.description,
      strengths: data.strengths ?? [],
      weaknesses: data.weaknesses ?? [],
      pricing: data.pricing,
      features: data.features ?? [],
      reviews: data.reviews ?? [],
      metadata: data.metadata ?? {}
    };
    this.state().competitors.push(competitor);
    this.store.save();
    this.audit(actor, "create", "Competitor", competitor.id, undefined, competitor);
    return competitor;
  }

  listInterviews(actor: RequestActor, studyId?: string): UserInterview[] {
    let interviews = this.state().interviews.filter(i => i.tenantId === actor.tenantId);
    if (studyId) interviews = interviews.filter(i => i.studyId === studyId);
    return interviews;
  }

  createInterview(actor: RequestActor, data: Partial<UserInterview>): UserInterview {
    const now = nowIso();
    const interview: UserInterview = {
      id: newId("interview"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      studyId: data.studyId,
      participantName: data.participantName,
      participantRole: data.participantRole,
      interviewType: data.interviewType ?? "discovery",
      status: data.status ?? "scheduled",
      scheduledAt: data.scheduledAt,
      completedAt: data.completedAt,
      questions: data.questions ?? [],
      painPoints: data.painPoints ?? [],
      quotes: data.quotes ?? [],
      metadata: data.metadata ?? {}
    };
    this.state().interviews.push(interview);
    this.store.save();
    this.audit(actor, "create", "UserInterview", interview.id, undefined, interview);
    return interview;
  }

  listSurveys(actor: RequestActor, studyId?: string): Survey[] {
    let surveys = this.state().surveys.filter(s => s.tenantId === actor.tenantId);
    if (studyId) surveys = surveys.filter(s => s.studyId === studyId);
    return surveys;
  }

  createSurvey(actor: RequestActor, data: Partial<Survey>): Survey {
    if (!data.name) badRequest("Survey name is required");
    const now = nowIso();
    const survey: Survey = {
      id: newId("survey"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      studyId: data.studyId,
      name: data.name,
      description: data.description,
      targetAudience: data.targetAudience,
      status: data.status ?? "draft",
      questions: data.questions ?? [],
      responses: [],
      metadata: data.metadata ?? {}
    };
    this.state().surveys.push(survey);
    this.store.save();
    this.audit(actor, "create", "Survey", survey.id, undefined, survey);
    return survey;
  }

  listPainPoints(actor: RequestActor, studyId?: string): PainPoint[] {
    let painPoints = this.state().painPoints.filter(p => p.tenantId === actor.tenantId);
    if (studyId) painPoints = painPoints.filter(p => p.studyId === studyId);
    return painPoints;
  }

  createPainPoint(actor: RequestActor, data: Partial<PainPoint>): PainPoint {
    if (!data.description) badRequest("Pain point description is required");
    const now = nowIso();
    const painPoint: PainPoint = {
      id: newId("painpoint"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      studyId: data.studyId,
      description: data.description,
      severity: data.severity ?? "medium",
      frequency: data.frequency ?? "occasional",
      currentSolution: data.currentSolution,
      opportunity: data.opportunity,
      relatedSourceIds: data.relatedSourceIds ?? [],
      metadata: data.metadata ?? {}
    };
    this.state().painPoints.push(painPoint);
    this.store.save();
    this.audit(actor, "create", "PainPoint", painPoint.id, undefined, painPoint);
    return painPoint;
  }

  listMarketSegments(actor: RequestActor, studyId?: string): MarketSegment[] {
    let segments = this.state().marketSegments.filter(s => s.tenantId === actor.tenantId);
    if (studyId) segments = segments.filter(s => s.studyId === studyId);
    return segments;
  }

  createMarketSegment(actor: RequestActor, data: Partial<MarketSegment>): MarketSegment {
    if (!data.name) badRequest("Segment name is required");
    const now = nowIso();
    const segment: MarketSegment = {
      id: newId("segment"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      studyId: data.studyId,
      name: data.name,
      description: data.description,
      size: data.size,
      growth: data.growth,
      trends: data.trends ?? [],
      metadata: data.metadata ?? {}
    };
    this.state().marketSegments.push(segment);
    this.store.save();
    this.audit(actor, "create", "MarketSegment", segment.id, undefined, segment);
    return segment;
  }

  listReports(actor: RequestActor, studyId?: string): ResearchReport[] {
    let reports = this.state().reports.filter(r => r.tenantId === actor.tenantId);
    if (studyId) reports = reports.filter(r => r.studyId === studyId);
    return reports;
  }

  createReport(actor: RequestActor, data: Partial<ResearchReport>): ResearchReport {
    if (!data.title) badRequest("Report title is required");
    const now = nowIso();
    const report: ResearchReport = {
      id: newId("report"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      studyId: data.studyId,
      title: data.title,
      type: data.type ?? "detailed",
      status: data.status ?? "draft",
      sections: data.sections ?? [],
      insights: data.insights ?? [],
      recommendations: data.recommendations ?? [],
      metadata: data.metadata ?? {}
    };
    this.state().reports.push(report);
    this.store.save();
    this.audit(actor, "create", "ResearchReport", report.id, undefined, report);
    return report;
  }
}
