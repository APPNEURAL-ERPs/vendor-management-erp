import {
  Application,
  ApplicationStatus,
  Candidate,
  CandidateMatch,
  CandidateResume,
  CandidateSource,
  CareerAnalytics,
  CareerOverview,
  CompensationPackage,
  ConsentStatus,
  EmploymentType,
  EntityStatus,
  Interview,
  InterviewStatus,
  InterviewType,
  JobRequisition,
  JobStatus,
  Offer,
  OfferApproval,
  OfferStatus,
  PipelineStage,
  PipelineStageType,
  RequestActor,
  ScreeningQuestion,
  ScoreRecommendation,
  Scorecard,
  TalentPool,
  WorkplaceType
} from "../core/domain";
import { badRequest, conflict, notFound } from "../core/errors";
import { newId, nowIso } from "../core/id";
import {
  asIso,
  clamp,
  clone,
  ensureArray,
  ensureNumber,
  ensureObject,
  ensureString,
  normalizeCode,
  normalizeSkillArray,
  normalizeStringArray,
  optionalString,
  parseNumberQuery,
  pickQuery,
  toRecord,
  unique
} from "../core/utils";
import { DataStore } from "../core/datastore";
import { EventBus } from "../core/event-bus";
import { MatchEngine } from "../engines/match-engine";
import { OfferEngine } from "../engines/offer-engine";
import { PipelineEngine } from "../engines/pipeline-engine";

const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "internship", "temporary"] as const;
const WORKPLACE_TYPES = ["onsite", "remote", "hybrid"] as const;
const JOB_STATUSES = ["draft", "open", "paused", "closed", "archived"] as const;
const CANDIDATE_SOURCES = ["career_site", "referral", "linkedin", "agency", "job_board", "manual", "import"] as const;
const CONSENT_STATUSES = ["unknown", "granted", "revoked"] as const;
const APPLICATION_STATUSES = ["applied", "screening", "assessment", "interview", "offer", "hired", "rejected", "withdrawn", "archived"] as const;
const STAGE_TYPES = ["applied", "screening", "assessment", "interview", "offer", "hired", "rejected"] as const;
const INTERVIEW_TYPES = ["phone", "video", "onsite", "panel", "technical", "hr"] as const;
const INTERVIEW_STATUSES = ["scheduled", "rescheduled", "completed", "cancelled", "no_show"] as const;
const SCORE_RECOMMENDATIONS = ["strong_yes", "yes", "maybe", "no", "strong_no"] as const;
const OFFER_STATUSES = ["draft", "pending_approval", "approved", "sent", "accepted", "declined", "revoked"] as const;

export class CareerService {
  private readonly matchEngine = new MatchEngine();
  private readonly offerEngine = new OfferEngine();
  private readonly pipelineEngine = new PipelineEngine();

  constructor(private readonly store: DataStore, private readonly events: EventBus) {}

  overview(actor: RequestActor): CareerOverview {
    const state = this.store.getState();
    const tenantId = actor.tenantId;
    const jobs = state.jobs.filter((item) => item.tenantId === tenantId && item.status !== "archived");
    const candidates = state.candidates.filter((item) => item.tenantId === tenantId && item.status !== "archived");
    const applications = state.applications.filter((item) => item.tenantId === tenantId && item.status !== "archived");
    const activeStatuses: ApplicationStatus[] = ["applied", "screening", "assessment", "interview", "offer"];
    const pipelineSummary = APPLICATION_STATUSES.map((status) => ({
      stage: this.labelStatus(status),
      status,
      count: applications.filter((app) => app.status === status).length
    })).filter((item) => item.count > 0);

    return clone({
      counts: {
        jobs: jobs.length,
        openJobs: jobs.filter((item) => item.status === "open").length,
        candidates: candidates.length,
        applications: applications.length,
        activeApplications: applications.filter((item) => activeStatuses.includes(item.status)).length,
        interviewsScheduled: state.interviews.filter((item) => item.tenantId === tenantId && ["scheduled", "rescheduled"].includes(item.status)).length,
        offersOpen: state.offers.filter((item) => item.tenantId === tenantId && ["draft", "pending_approval", "approved", "sent"].includes(item.status)).length,
        hired: applications.filter((item) => item.status === "hired").length,
        talentPools: state.talentPools.filter((item) => item.tenantId === tenantId && item.status !== "archived").length
      },
      pipelineSummary,
      recentJobs: jobs.slice(0, 5),
      recentCandidates: candidates.slice(0, 5),
      recentEvents: state.events.filter((item) => item.tenantId === tenantId).slice(0, 10)
    });
  }

  analytics(actor: RequestActor): CareerAnalytics {
    const overview = this.overview(actor);
    const state = this.store.getState();
    const applications = state.applications.filter((item) => item.tenantId === actor.tenantId && item.status !== "archived");
    const jobs = state.jobs.filter((item) => item.tenantId === actor.tenantId);
    const interviews = state.interviews.filter((item) => item.tenantId === actor.tenantId);
    const offers = state.offers.filter((item) => item.tenantId === actor.tenantId);
    const applicationsByStatus = toRecord(APPLICATION_STATUSES);
    const applicationsBySource = toRecord(CANDIDATE_SOURCES);
    const jobsByStatus = toRecord(JOB_STATUSES);

    for (const app of applications) applicationsByStatus[app.status] += 1;
    for (const app of applications) applicationsBySource[app.source] += 1;
    for (const job of jobs) jobsByStatus[job.status] += 1;

    const matchScores = applications.map((item) => item.matchScore ?? 0).filter((score) => score > 0);
    const sentOffers = offers.filter((item) => ["sent", "accepted", "declined"].includes(item.status));
    const completedInterviews = interviews.filter((item) => item.status === "completed").length;

    return clone({
      totals: overview.counts,
      applicationsByStatus,
      applicationsBySource,
      jobsByStatus,
      averageMatchScore: matchScores.length ? Math.round(matchScores.reduce((sum, score) => sum + score, 0) / matchScores.length) : 0,
      offerAcceptanceRate: sentOffers.length ? Math.round((offers.filter((item) => item.status === "accepted").length / sentOffers.length) * 100) : 0,
      interviewCompletionRate: interviews.length ? Math.round((completedInterviews / interviews.length) * 100) : 0,
      recentHires: applications.filter((item) => item.status === "hired").slice(0, 10)
    });
  }

  listJobs(actor: RequestActor, query?: URLSearchParams): JobRequisition[] {
    const search = query ? pickQuery(query, "search") : undefined;
    const status = query ? pickQuery(query, "status") : undefined;
    const department = query ? pickQuery(query, "department") : undefined;
    const limit = query ? parseNumberQuery(query, "limit", 100) : 100;
    return clone(this.store.getState().jobs.filter((job) => {
      if (job.tenantId !== actor.tenantId || job.status === "archived") return false;
      if (status && job.status !== status) return false;
      if (department && job.department !== department) return false;
      if (search) {
        const haystack = [job.code, job.title, job.department, job.location, job.requiredSkills.join(" "), job.tags.join(" ")].join(" ").toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    }).slice(0, limit));
  }

  getJob(actor: RequestActor, id: string): JobRequisition {
    return clone(this.requireJob(actor.tenantId, id));
  }

  createJob(actor: RequestActor, input: Partial<JobRequisition>): JobRequisition {
    const state = this.store.getState();
    const now = nowIso();
    const code = normalizeCode(input.code ?? input.title ?? "JOB", "code");
    if (state.jobs.some((job) => job.tenantId === actor.tenantId && job.code === code && job.status !== "archived")) {
      conflict(`Job code '${code}' already exists`);
    }

    const job: JobRequisition = {
      id: newId("job"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      code,
      title: ensureString(input.title, "title"),
      department: ensureString(input.department ?? "General", "department"),
      location: ensureString(input.location ?? "Remote", "location"),
      employmentType: this.ensureEmploymentType(input.employmentType ?? "full_time"),
      workplaceType: this.ensureWorkplaceType(input.workplaceType ?? "remote"),
      openings: Math.max(1, Math.round(ensureNumber(input.openings ?? 1, "openings", 1))),
      status: this.ensureJobStatus(input.status ?? "draft"),
      priority: this.ensurePriority(input.priority ?? "medium"),
      description: ensureString(input.description ?? `Hiring for ${input.title ?? code}`, "description"),
      responsibilities: normalizeStringArray(input.responsibilities, "responsibilities"),
      requirements: normalizeStringArray(input.requirements, "requirements"),
      requiredSkills: normalizeSkillArray(input.requiredSkills, "requiredSkills"),
      niceToHaveSkills: normalizeSkillArray(input.niceToHaveSkills, "niceToHaveSkills"),
      experienceMinYears: Math.max(0, ensureNumber(input.experienceMinYears ?? 0, "experienceMinYears", 0)),
      experienceMaxYears: input.experienceMaxYears === undefined ? undefined : Math.max(0, ensureNumber(input.experienceMaxYears, "experienceMaxYears")),
      salaryRange: input.salaryRange ? this.normalizeSalary(input.salaryRange) : undefined,
      recruiterId: optionalString(input.recruiterId),
      hiringManagerId: optionalString(input.hiringManagerId),
      pipelineTemplateId: optionalString(input.pipelineTemplateId),
      screeningQuestions: this.normalizeScreeningQuestions(input.screeningQuestions),
      tags: normalizeStringArray(input.tags, "tags"),
      metadata: ensureObject(input.metadata, "metadata"),
      createdBy: actor.userId,
      publishedAt: input.status === "open" ? now : undefined
    };

    state.jobs.unshift(job);
    state.pipelineStages.push(...this.pipelineEngine.defaultStages(actor.tenantId, job.id));
    this.store.save();
    this.store.audit(actor, "career.job.create", "job", job.id, undefined, job);
    this.events.publish(actor, "career.job.created", { jobId: job.id, code: job.code, title: job.title });
    return clone(job);
  }

  updateJob(actor: RequestActor, id: string, input: Partial<JobRequisition>): JobRequisition {
    const job = this.requireJob(actor.tenantId, id);
    const before = clone(job);
    if (input.title !== undefined) job.title = ensureString(input.title, "title");
    if (input.department !== undefined) job.department = ensureString(input.department, "department");
    if (input.location !== undefined) job.location = ensureString(input.location, "location");
    if (input.employmentType !== undefined) job.employmentType = this.ensureEmploymentType(input.employmentType);
    if (input.workplaceType !== undefined) job.workplaceType = this.ensureWorkplaceType(input.workplaceType);
    if (input.openings !== undefined) job.openings = Math.max(1, Math.round(ensureNumber(input.openings, "openings")));
    if (input.priority !== undefined) job.priority = this.ensurePriority(input.priority);
    if (input.description !== undefined) job.description = ensureString(input.description, "description");
    if (input.responsibilities !== undefined) job.responsibilities = normalizeStringArray(input.responsibilities, "responsibilities");
    if (input.requirements !== undefined) job.requirements = normalizeStringArray(input.requirements, "requirements");
    if (input.requiredSkills !== undefined) job.requiredSkills = normalizeSkillArray(input.requiredSkills, "requiredSkills");
    if (input.niceToHaveSkills !== undefined) job.niceToHaveSkills = normalizeSkillArray(input.niceToHaveSkills, "niceToHaveSkills");
    if (input.experienceMinYears !== undefined) job.experienceMinYears = Math.max(0, ensureNumber(input.experienceMinYears, "experienceMinYears"));
    if (input.experienceMaxYears !== undefined) job.experienceMaxYears = Math.max(0, ensureNumber(input.experienceMaxYears, "experienceMaxYears"));
    if (input.salaryRange !== undefined) job.salaryRange = input.salaryRange ? this.normalizeSalary(input.salaryRange) : undefined;
    if (input.recruiterId !== undefined) job.recruiterId = optionalString(input.recruiterId);
    if (input.hiringManagerId !== undefined) job.hiringManagerId = optionalString(input.hiringManagerId);
    if (input.screeningQuestions !== undefined) job.screeningQuestions = this.normalizeScreeningQuestions(input.screeningQuestions);
    if (input.tags !== undefined) job.tags = normalizeStringArray(input.tags, "tags");
    if (input.metadata !== undefined) job.metadata = ensureObject(input.metadata, "metadata");
    job.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "career.job.update", "job", job.id, before, job);
    this.events.publish(actor, "career.job.updated", { jobId: job.id, code: job.code });
    return clone(job);
  }

  publishJob(actor: RequestActor, id: string): JobRequisition {
    const job = this.requireJob(actor.tenantId, id);
    if (job.status === "archived") badRequest("Archived jobs cannot be published");
    const before = clone(job);
    job.status = "open";
    job.publishedAt = nowIso();
    job.updatedAt = job.publishedAt;
    this.store.save();
    this.store.audit(actor, "career.job.publish", "job", job.id, before, job);
    this.events.publish(actor, "career.job.published", { jobId: job.id, code: job.code, title: job.title });
    return clone(job);
  }

  pauseJob(actor: RequestActor, id: string): JobRequisition {
    return this.setJobStatus(actor, id, "paused", "career.job.paused");
  }

  closeJob(actor: RequestActor, id: string): JobRequisition {
    const job = this.setJobStatus(actor, id, "closed", "career.job.closed");
    job.closedAt = job.closedAt ?? nowIso();
    this.store.save();
    return clone(job);
  }

  archiveJob(actor: RequestActor, id: string): JobRequisition {
    return this.setJobStatus(actor, id, "archived", "career.job.archived");
  }

  listCandidates(actor: RequestActor, query?: URLSearchParams): Candidate[] {
    const search = query ? pickQuery(query, "search") : undefined;
    const status = query ? pickQuery(query, "status") : undefined;
    const skill = query ? pickQuery(query, "skill") : undefined;
    const limit = query ? parseNumberQuery(query, "limit", 100) : 100;
    return clone(this.store.getState().candidates.filter((candidate) => {
      if (candidate.tenantId !== actor.tenantId || candidate.status === "archived") return false;
      if (status && candidate.status !== status) return false;
      if (skill && !candidate.skills.includes(skill.toLowerCase())) return false;
      if (search) {
        const haystack = [candidate.firstName, candidate.lastName, candidate.email, candidate.phone, candidate.location, candidate.currentCompany, candidate.currentTitle, candidate.skills.join(" "), candidate.tags.join(" ")].join(" ").toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    }).slice(0, limit));
  }

  getCandidate(actor: RequestActor, id: string): Candidate & { resumes: CandidateResume[]; applications: Application[] } {
    const candidate = this.requireCandidate(actor.tenantId, id);
    return clone({
      ...candidate,
      resumes: this.store.getState().resumes.filter((resume) => resume.tenantId === actor.tenantId && resume.candidateId === id),
      applications: this.store.getState().applications.filter((app) => app.tenantId === actor.tenantId && app.candidateId === id && app.status !== "archived")
    });
  }

  createCandidate(actor: RequestActor, input: Partial<Candidate>): Candidate {
    const state = this.store.getState();
    const email = ensureString(input.email, "email").toLowerCase();
    if (state.candidates.some((candidate) => candidate.tenantId === actor.tenantId && candidate.email.toLowerCase() === email && candidate.status !== "archived")) {
      conflict(`Candidate email '${email}' already exists`);
    }
    const now = nowIso();
    const candidate: Candidate = {
      id: newId("cand"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      firstName: ensureString(input.firstName, "firstName"),
      lastName: ensureString(input.lastName, "lastName"),
      email,
      phone: optionalString(input.phone),
      location: optionalString(input.location),
      currentCompany: optionalString(input.currentCompany),
      currentTitle: optionalString(input.currentTitle),
      source: this.ensureCandidateSource(input.source ?? "manual"),
      status: this.ensureCandidateStatus(input.status ?? "active"),
      consentStatus: this.ensureConsentStatus(input.consentStatus ?? "unknown"),
      tags: normalizeStringArray(input.tags, "tags"),
      skills: normalizeSkillArray(input.skills, "skills"),
      experienceYears: Math.max(0, ensureNumber(input.experienceYears ?? 0, "experienceYears", 0)),
      linkedInUrl: optionalString(input.linkedInUrl),
      portfolioUrl: optionalString(input.portfolioUrl),
      notes: optionalString(input.notes),
      metadata: ensureObject(input.metadata, "metadata"),
      createdBy: actor.userId
    };
    state.candidates.unshift(candidate);
    this.store.save();
    this.store.audit(actor, "career.candidate.create", "candidate", candidate.id, undefined, candidate);
    this.events.publish(actor, "career.candidate.created", { candidateId: candidate.id, email: candidate.email, source: candidate.source });
    return clone(candidate);
  }

  updateCandidate(actor: RequestActor, id: string, input: Partial<Candidate>): Candidate {
    const candidate = this.requireCandidate(actor.tenantId, id);
    const before = clone(candidate);
    if (input.firstName !== undefined) candidate.firstName = ensureString(input.firstName, "firstName");
    if (input.lastName !== undefined) candidate.lastName = ensureString(input.lastName, "lastName");
    if (input.email !== undefined) candidate.email = ensureString(input.email, "email").toLowerCase();
    if (input.phone !== undefined) candidate.phone = optionalString(input.phone);
    if (input.location !== undefined) candidate.location = optionalString(input.location);
    if (input.currentCompany !== undefined) candidate.currentCompany = optionalString(input.currentCompany);
    if (input.currentTitle !== undefined) candidate.currentTitle = optionalString(input.currentTitle);
    if (input.source !== undefined) candidate.source = this.ensureCandidateSource(input.source);
    if (input.status !== undefined) candidate.status = this.ensureCandidateStatus(input.status);
    if (input.consentStatus !== undefined) candidate.consentStatus = this.ensureConsentStatus(input.consentStatus);
    if (input.tags !== undefined) candidate.tags = normalizeStringArray(input.tags, "tags");
    if (input.skills !== undefined) candidate.skills = normalizeSkillArray(input.skills, "skills");
    if (input.experienceYears !== undefined) candidate.experienceYears = Math.max(0, ensureNumber(input.experienceYears, "experienceYears"));
    if (input.linkedInUrl !== undefined) candidate.linkedInUrl = optionalString(input.linkedInUrl);
    if (input.portfolioUrl !== undefined) candidate.portfolioUrl = optionalString(input.portfolioUrl);
    if (input.notes !== undefined) candidate.notes = optionalString(input.notes);
    if (input.metadata !== undefined) candidate.metadata = ensureObject(input.metadata, "metadata");
    candidate.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "career.candidate.update", "candidate", candidate.id, before, candidate);
    this.events.publish(actor, "career.candidate.updated", { candidateId: candidate.id, email: candidate.email });
    return clone(candidate);
  }

  archiveCandidate(actor: RequestActor, id: string): Candidate {
    const candidate = this.requireCandidate(actor.tenantId, id);
    const before = clone(candidate);
    candidate.status = "archived";
    candidate.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "career.candidate.archive", "candidate", candidate.id, before, candidate);
    this.events.publish(actor, "career.candidate.archived", { candidateId: candidate.id });
    return clone(candidate);
  }

  addResume(actor: RequestActor, candidateId: string, input: Partial<CandidateResume>): CandidateResume {
    const candidate = this.requireCandidate(actor.tenantId, candidateId);
    const now = nowIso();
    const resume: CandidateResume = {
      id: newId("resume"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      candidateId,
      fileName: ensureString(input.fileName ?? `${candidate.firstName}-${candidate.lastName}.txt`, "fileName"),
      mimeType: ensureString(input.mimeType ?? "text/plain", "mimeType"),
      text: ensureString(input.text, "text"),
      parsedSkills: normalizeSkillArray(input.parsedSkills ?? candidate.skills, "parsedSkills"),
      experienceYears: input.experienceYears === undefined ? candidate.experienceYears : Math.max(0, ensureNumber(input.experienceYears, "experienceYears")),
      education: normalizeStringArray(input.education, "education"),
      certifications: normalizeStringArray(input.certifications, "certifications"),
      uploadedBy: actor.userId
    };
    this.store.getState().resumes.unshift(resume);
    candidate.skills = unique([...candidate.skills, ...resume.parsedSkills]);
    candidate.experienceYears = Math.max(candidate.experienceYears, resume.experienceYears ?? 0);
    candidate.updatedAt = now;
    this.store.save();
    this.store.audit(actor, "career.resume.add", "resume", resume.id, undefined, resume);
    this.events.publish(actor, "career.resume.added", { resumeId: resume.id, candidateId });
    return clone(resume);
  }

  listResumes(actor: RequestActor, candidateId?: string): CandidateResume[] {
    return clone(this.store.getState().resumes.filter((resume) => resume.tenantId === actor.tenantId && (!candidateId || resume.candidateId === candidateId)));
  }

  listPipelineStages(actor: RequestActor, jobId?: string): PipelineStage[] {
    return clone(this.store.getState().pipelineStages.filter((stage) => stage.tenantId === actor.tenantId && (!jobId || stage.jobId === jobId)).sort((a, b) => a.order - b.order));
  }

  createPipelineStage(actor: RequestActor, input: Partial<PipelineStage>): PipelineStage {
    const now = nowIso();
    if (input.jobId) this.requireJob(actor.tenantId, input.jobId);
    const stage: PipelineStage = {
      id: newId("stage"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      jobId: optionalString(input.jobId),
      templateId: optionalString(input.templateId),
      name: ensureString(input.name, "name"),
      type: this.ensureStageType(input.type ?? "screening"),
      order: ensureNumber(input.order ?? 1, "order", 1),
      required: input.required === undefined ? true : Boolean(input.required),
      slaDays: input.slaDays === undefined ? undefined : ensureNumber(input.slaDays, "slaDays"),
      interviewRequired: Boolean(input.interviewRequired),
      scorecardTemplate: optionalString(input.scorecardTemplate),
      metadata: ensureObject(input.metadata, "metadata")
    };
    this.store.getState().pipelineStages.push(stage);
    this.store.save();
    this.store.audit(actor, "career.pipeline.stage.create", "pipeline_stage", stage.id, undefined, stage);
    this.events.publish(actor, "career.pipeline.stage.created", { stageId: stage.id, jobId: stage.jobId, name: stage.name });
    return clone(stage);
  }

  listApplications(actor: RequestActor, query?: URLSearchParams): Application[] {
    const jobId = query ? pickQuery(query, "jobId") : undefined;
    const candidateId = query ? pickQuery(query, "candidateId") : undefined;
    const status = query ? pickQuery(query, "status") : undefined;
    const limit = query ? parseNumberQuery(query, "limit", 100) : 100;
    return clone(this.store.getState().applications.filter((app) => {
      if (app.tenantId !== actor.tenantId || app.status === "archived") return false;
      if (jobId && app.jobId !== jobId) return false;
      if (candidateId && app.candidateId !== candidateId) return false;
      if (status && app.status !== status) return false;
      return true;
    }).slice(0, limit));
  }

  getApplication(actor: RequestActor, id: string): Application & { job: JobRequisition; candidate: Candidate; interviews: Interview[]; scorecards: Scorecard[]; offers: Offer[] } {
    const application = this.requireApplication(actor.tenantId, id);
    return clone({
      ...application,
      job: this.requireJob(actor.tenantId, application.jobId),
      candidate: this.requireCandidate(actor.tenantId, application.candidateId),
      interviews: this.store.getState().interviews.filter((item) => item.tenantId === actor.tenantId && item.applicationId === id),
      scorecards: this.store.getState().scorecards.filter((item) => item.tenantId === actor.tenantId && item.applicationId === id),
      offers: this.store.getState().offers.filter((item) => item.tenantId === actor.tenantId && item.applicationId === id)
    });
  }

  applyCandidate(actor: RequestActor, input: Partial<Application>): Application {
    const state = this.store.getState();
    const job = this.requireJob(actor.tenantId, ensureString(input.jobId, "jobId"));
    if (!["open", "draft"].includes(job.status)) badRequest("Candidates can only be applied to draft or open jobs");
    const candidate = this.requireCandidate(actor.tenantId, ensureString(input.candidateId, "candidateId"));
    if (candidate.status !== "active") badRequest("Candidate must be active before applying");
    if (state.applications.some((app) => app.tenantId === actor.tenantId && app.jobId === job.id && app.candidateId === candidate.id && !["rejected", "withdrawn", "archived"].includes(app.status))) {
      conflict("Candidate already has an active application for this job");
    }
    const now = nowIso();
    const firstStage = this.getFirstStage(actor.tenantId, job.id);
    const resume = this.latestResume(actor.tenantId, candidate.id);
    const match = this.matchEngine.score(job, candidate, resume);
    const application: Application = {
      id: newId("app"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      jobId: job.id,
      candidateId: candidate.id,
      source: this.ensureCandidateSource(input.source ?? candidate.source),
      status: firstStage ? this.pipelineEngine.statusForStage(firstStage) : "applied",
      currentStageId: firstStage?.id,
      stageEnteredAt: now,
      matchScore: match.score,
      screeningAnswers: Array.isArray(input.screeningAnswers) ? input.screeningAnswers : [],
      rating: undefined,
      tags: normalizeStringArray(input.tags, "tags"),
      metadata: ensureObject(input.metadata, "metadata"),
      createdBy: actor.userId
    };
    state.applications.unshift(application);
    this.store.save();
    this.store.audit(actor, "career.application.create", "application", application.id, undefined, application);
    this.events.publish(actor, "career.application.created", { applicationId: application.id, jobId: job.id, candidateId: candidate.id, matchScore: match.score });
    return clone(application);
  }

  moveApplication(actor: RequestActor, id: string, input: { stageId?: string; status?: ApplicationStatus; note?: string }): Application {
    const application = this.requireApplication(actor.tenantId, id);
    const before = clone(application);
    let nextStage: PipelineStage | undefined;
    if (input.stageId) {
      nextStage = this.requireStage(actor.tenantId, input.stageId);
      if (nextStage.jobId && nextStage.jobId !== application.jobId) badRequest("Pipeline stage does not belong to application job");
      application.currentStageId = nextStage.id;
      application.status = this.pipelineEngine.statusForStage(nextStage);
    }
    if (input.status !== undefined) application.status = this.ensureApplicationStatus(input.status);
    application.stageEnteredAt = nowIso();
    application.updatedAt = application.stageEnteredAt;
    if (input.note) application.metadata = { ...application.metadata, lastMoveNote: input.note };
    this.store.save();
    this.store.audit(actor, "career.application.move", "application", application.id, before, application);
    this.events.publish(actor, "career.application.moved", { applicationId: application.id, status: application.status, stageId: application.currentStageId });
    return clone(application);
  }

  updateApplicationStatus(actor: RequestActor, id: string, status: unknown, reason?: unknown): Application {
    const nextStatus = this.ensureApplicationStatus(status);
    const application = this.requireApplication(actor.tenantId, id);
    const before = clone(application);
    application.status = nextStatus;
    application.updatedAt = nowIso();
    if (nextStatus === "rejected") application.rejectionReason = optionalString(reason) ?? "Not selected";
    if (nextStatus === "withdrawn") application.withdrawnAt = application.updatedAt;
    if (nextStatus === "hired") application.hiredAt = application.updatedAt;
    this.store.save();
    this.store.audit(actor, "career.application.status", "application", application.id, before, application);
    this.events.publish(actor, "career.application.status_changed", { applicationId: application.id, status: application.status, reason: application.rejectionReason });
    return clone(application);
  }

  rejectApplication(actor: RequestActor, id: string, reason?: unknown): Application {
    return this.updateApplicationStatus(actor, id, "rejected", reason);
  }

  hireApplication(actor: RequestActor, id: string): Application {
    return this.updateApplicationStatus(actor, id, "hired");
  }

  scheduleInterview(actor: RequestActor, input: Partial<Interview>): Interview {
    const application = this.requireApplication(actor.tenantId, ensureString(input.applicationId, "applicationId"));
    const job = this.requireJob(actor.tenantId, application.jobId);
    const candidate = this.requireCandidate(actor.tenantId, application.candidateId);
    const now = nowIso();
    const interview: Interview = {
      id: newId("int"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      applicationId: application.id,
      jobId: job.id,
      candidateId: candidate.id,
      stageId: optionalString(input.stageId) ?? application.currentStageId,
      title: ensureString(input.title ?? `${job.title} interview with ${candidate.firstName} ${candidate.lastName}`, "title"),
      interviewType: this.ensureInterviewType(input.interviewType ?? "video"),
      scheduledAt: asIso(input.scheduledAt ?? new Date(Date.now() + 86400000).toISOString(), "scheduledAt")!,
      durationMinutes: Math.max(15, ensureNumber(input.durationMinutes ?? 60, "durationMinutes", 60)),
      timezone: ensureString(input.timezone ?? "Asia/Kolkata", "timezone"),
      interviewerUserIds: normalizeStringArray(input.interviewerUserIds, "interviewerUserIds"),
      status: this.ensureInterviewStatus(input.status ?? "scheduled"),
      meetingLink: optionalString(input.meetingLink),
      location: optionalString(input.location),
      notes: optionalString(input.notes),
      createdBy: actor.userId
    };
    this.store.getState().interviews.unshift(interview);
    if (!["offer", "hired", "rejected", "withdrawn"].includes(application.status)) {
      const before = clone(application);
      application.status = "interview";
      application.updatedAt = now;
      this.store.audit(actor, "career.application.status", "application", application.id, before, application);
    }
    this.store.save();
    this.store.audit(actor, "career.interview.schedule", "interview", interview.id, undefined, interview);
    this.events.publish(actor, "career.interview.scheduled", { interviewId: interview.id, applicationId: application.id, scheduledAt: interview.scheduledAt });
    return clone(interview);
  }

  listInterviews(actor: RequestActor, query?: URLSearchParams): Interview[] {
    const applicationId = query ? pickQuery(query, "applicationId") : undefined;
    const status = query ? pickQuery(query, "status") : undefined;
    return clone(this.store.getState().interviews.filter((interview) => {
      if (interview.tenantId !== actor.tenantId) return false;
      if (applicationId && interview.applicationId !== applicationId) return false;
      if (status && interview.status !== status) return false;
      return true;
    }));
  }

  updateInterviewStatus(actor: RequestActor, id: string, status: unknown, notes?: unknown): Interview {
    const interview = this.requireInterview(actor.tenantId, id);
    const before = clone(interview);
    interview.status = this.ensureInterviewStatus(status);
    interview.updatedAt = nowIso();
    if (interview.status === "completed") interview.completedAt = interview.updatedAt;
    if (notes !== undefined) interview.notes = optionalString(notes);
    this.store.save();
    this.store.audit(actor, "career.interview.status", "interview", interview.id, before, interview);
    this.events.publish(actor, "career.interview.status_changed", { interviewId: interview.id, status: interview.status });
    return clone(interview);
  }

  submitScorecard(actor: RequestActor, input: Partial<Scorecard>): Scorecard {
    const interview = this.requireInterview(actor.tenantId, ensureString(input.interviewId, "interviewId"));
    const application = this.requireApplication(actor.tenantId, interview.applicationId);
    const existing = this.store.getState().scorecards.find((card) => card.tenantId === actor.tenantId && card.interviewId === interview.id && card.interviewerUserId === (input.interviewerUserId ?? actor.userId));
    if (existing) conflict("Scorecard already submitted by this interviewer for this interview");
    const now = nowIso();
    const criteriaScores = ensureObject(input.criteriaScores, "criteriaScores") as Record<string, number>;
    for (const [key, value] of Object.entries(criteriaScores)) {
      criteriaScores[key] = clamp(Number(value), 1, 5);
    }
    const scorecard: Scorecard = {
      id: newId("score"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      interviewId: interview.id,
      applicationId: application.id,
      interviewerUserId: ensureString(input.interviewerUserId ?? actor.userId, "interviewerUserId"),
      criteriaScores,
      overallRating: clamp(ensureNumber(input.overallRating ?? this.averageScore(criteriaScores), "overallRating", this.averageScore(criteriaScores)), 1, 5),
      recommendation: this.ensureScoreRecommendation(input.recommendation ?? "maybe"),
      strengths: normalizeStringArray(input.strengths, "strengths"),
      concerns: normalizeStringArray(input.concerns, "concerns"),
      notes: optionalString(input.notes),
      submittedAt: now
    };
    this.store.getState().scorecards.unshift(scorecard);
    this.recalculateApplicationRating(application.id);
    this.store.save();
    this.store.audit(actor, "career.scorecard.submit", "scorecard", scorecard.id, undefined, scorecard);
    this.events.publish(actor, "career.scorecard.submitted", { scorecardId: scorecard.id, interviewId: interview.id, applicationId: application.id, recommendation: scorecard.recommendation });
    return clone(scorecard);
  }

  listScorecards(actor: RequestActor, query?: URLSearchParams): Scorecard[] {
    const applicationId = query ? pickQuery(query, "applicationId") : undefined;
    const interviewId = query ? pickQuery(query, "interviewId") : undefined;
    return clone(this.store.getState().scorecards.filter((scorecard) => {
      if (scorecard.tenantId !== actor.tenantId) return false;
      if (applicationId && scorecard.applicationId !== applicationId) return false;
      if (interviewId && scorecard.interviewId !== interviewId) return false;
      return true;
    }));
  }

  createOffer(actor: RequestActor, input: Partial<Offer>): Offer {
    const application = this.requireApplication(actor.tenantId, ensureString(input.applicationId, "applicationId"));
    const job = this.requireJob(actor.tenantId, application.jobId);
    const candidate = this.requireCandidate(actor.tenantId, application.candidateId);
    const now = nowIso();
    const approvals = this.normalizeApprovals(input.approvals);
    const offer: Offer = {
      id: newId("offer"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      applicationId: application.id,
      jobId: job.id,
      candidateId: candidate.id,
      status: approvals.length ? "pending_approval" : this.ensureOfferStatus(input.status ?? "draft"),
      title: ensureString(input.title ?? `${job.title} offer for ${candidate.firstName} ${candidate.lastName}`, "title"),
      compensation: this.normalizeCompensation(input.compensation),
      startDate: asIso(input.startDate, "startDate"),
      expiresAt: asIso(input.expiresAt, "expiresAt"),
      approvals,
      terms: normalizeStringArray(input.terms, "terms"),
      createdBy: actor.userId,
      metadata: ensureObject(input.metadata, "metadata")
    };
    this.store.getState().offers.unshift(offer);
    const before = clone(application);
    application.status = "offer";
    application.updatedAt = now;
    this.store.save();
    this.store.audit(actor, "career.application.status", "application", application.id, before, application);
    this.store.audit(actor, "career.offer.create", "offer", offer.id, undefined, offer);
    this.events.publish(actor, "career.offer.created", { offerId: offer.id, applicationId: application.id, status: offer.status });
    return clone(offer);
  }

  listOffers(actor: RequestActor, query?: URLSearchParams): Offer[] {
    const applicationId = query ? pickQuery(query, "applicationId") : undefined;
    const status = query ? pickQuery(query, "status") : undefined;
    return clone(this.store.getState().offers.filter((offer) => {
      if (offer.tenantId !== actor.tenantId) return false;
      if (applicationId && offer.applicationId !== applicationId) return false;
      if (status && offer.status !== status) return false;
      return true;
    }));
  }

  approveOffer(actor: RequestActor, id: string, input: { approverUserId?: string; decision?: string; comment?: string }): Offer {
    const offer = this.requireOffer(actor.tenantId, id);
    const before = clone(offer);
    const approverUserId = input.approverUserId ?? actor.userId;
    let approval = offer.approvals.find((item) => item.approverUserId === approverUserId);
    if (!approval) {
      approval = { approverUserId, status: "pending" };
      offer.approvals.push(approval);
    }
    const decision = String(input.decision ?? "approved");
    if (!["approved", "rejected"].includes(decision)) badRequest("decision must be approved or rejected");
    approval.status = decision as "approved" | "rejected";
    approval.decidedAt = nowIso();
    approval.comment = optionalString(input.comment);
    offer.status = this.offerEngine.nextStatusAfterApproval(offer);
    offer.updatedAt = approval.decidedAt;
    this.store.save();
    this.store.audit(actor, "career.offer.approve", "offer", offer.id, before, offer);
    this.events.publish(actor, "career.offer.approval_decided", { offerId: offer.id, approverUserId, decision: approval.status, offerStatus: offer.status });
    return clone(offer);
  }

  sendOffer(actor: RequestActor, id: string): Offer {
    const offer = this.requireOffer(actor.tenantId, id);
    if (!["approved", "draft"].includes(offer.status)) badRequest("Only approved or draft offers can be sent");
    if (offer.approvals.length && !this.offerEngine.isFullyApproved(offer.approvals)) badRequest("Offer approval is not complete");
    const before = clone(offer);
    offer.status = "sent";
    offer.sentAt = nowIso();
    offer.updatedAt = offer.sentAt;
    this.store.save();
    this.store.audit(actor, "career.offer.send", "offer", offer.id, before, offer);
    this.events.publish(actor, "career.offer.sent", { offerId: offer.id, applicationId: offer.applicationId, candidateId: offer.candidateId });
    return clone(offer);
  }

  acceptOffer(actor: RequestActor, id: string): Offer {
    const offer = this.requireOffer(actor.tenantId, id);
    if (offer.status !== "sent") badRequest("Only sent offers can be accepted");
    const before = clone(offer);
    offer.status = "accepted";
    offer.acceptedAt = nowIso();
    offer.updatedAt = offer.acceptedAt;
    const application = this.requireApplication(actor.tenantId, offer.applicationId);
    const appBefore = clone(application);
    application.status = "hired";
    application.hiredAt = offer.acceptedAt;
    application.updatedAt = offer.acceptedAt;
    this.store.save();
    this.store.audit(actor, "career.offer.accept", "offer", offer.id, before, offer);
    this.store.audit(actor, "career.application.hire", "application", application.id, appBefore, application);
    this.events.publish(actor, "career.offer.accepted", { offerId: offer.id, applicationId: application.id, candidateId: offer.candidateId });
    this.events.publish(actor, "career.application.hired", { applicationId: application.id, jobId: application.jobId, candidateId: application.candidateId });
    return clone(offer);
  }

  declineOffer(actor: RequestActor, id: string, reason?: unknown): Offer {
    const offer = this.requireOffer(actor.tenantId, id);
    if (!["sent", "approved"].includes(offer.status)) badRequest("Only sent or approved offers can be declined");
    const before = clone(offer);
    offer.status = "declined";
    offer.declinedAt = nowIso();
    offer.updatedAt = offer.declinedAt;
    if (reason !== undefined) offer.metadata = { ...offer.metadata, declineReason: optionalString(reason) };
    this.store.save();
    this.store.audit(actor, "career.offer.decline", "offer", offer.id, before, offer);
    this.events.publish(actor, "career.offer.declined", { offerId: offer.id, reason: offer.metadata.declineReason });
    return clone(offer);
  }

  revokeOffer(actor: RequestActor, id: string, reason?: unknown): Offer {
    const offer = this.requireOffer(actor.tenantId, id);
    const before = clone(offer);
    offer.status = "revoked";
    offer.updatedAt = nowIso();
    if (reason !== undefined) offer.metadata = { ...offer.metadata, revokeReason: optionalString(reason) };
    this.store.save();
    this.store.audit(actor, "career.offer.revoke", "offer", offer.id, before, offer);
    this.events.publish(actor, "career.offer.revoked", { offerId: offer.id, reason: offer.metadata.revokeReason });
    return clone(offer);
  }

  createTalentPool(actor: RequestActor, input: Partial<TalentPool>): TalentPool {
    const now = nowIso();
    const candidateIds = normalizeStringArray(input.candidateIds, "candidateIds");
    for (const candidateId of candidateIds) this.requireCandidate(actor.tenantId, candidateId);
    const pool: TalentPool = {
      id: newId("pool"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name: ensureString(input.name, "name"),
      description: optionalString(input.description),
      ownerUserId: optionalString(input.ownerUserId) ?? actor.userId,
      tags: normalizeStringArray(input.tags, "tags"),
      candidateIds,
      status: this.ensureEntityStatus(input.status ?? "active"),
      metadata: ensureObject(input.metadata, "metadata")
    };
    this.store.getState().talentPools.unshift(pool);
    this.store.save();
    this.store.audit(actor, "career.pool.create", "talent_pool", pool.id, undefined, pool);
    this.events.publish(actor, "career.pool.created", { poolId: pool.id, name: pool.name, candidates: pool.candidateIds.length });
    return clone(pool);
  }

  listTalentPools(actor: RequestActor, query?: URLSearchParams): TalentPool[] {
    const status = query ? pickQuery(query, "status") : undefined;
    return clone(this.store.getState().talentPools.filter((pool) => {
      if (pool.tenantId !== actor.tenantId || pool.status === "archived") return false;
      if (status && pool.status !== status) return false;
      return true;
    }));
  }

  addCandidateToPool(actor: RequestActor, poolId: string, candidateId: string): TalentPool {
    const pool = this.requirePool(actor.tenantId, poolId);
    this.requireCandidate(actor.tenantId, candidateId);
    const before = clone(pool);
    pool.candidateIds = unique([...pool.candidateIds, candidateId]);
    pool.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "career.pool.member.add", "talent_pool", pool.id, before, pool);
    this.events.publish(actor, "career.pool.member_added", { poolId: pool.id, candidateId });
    return clone(pool);
  }

  matchCandidatesForJob(actor: RequestActor, jobId: string, limit = 10): CandidateMatch[] {
    const job = this.requireJob(actor.tenantId, jobId);
    const candidates = this.store.getState().candidates.filter((candidate) => candidate.tenantId === actor.tenantId && candidate.status === "active");
    return candidates
      .map((candidate) => this.matchEngine.score(job, candidate, this.latestResume(actor.tenantId, candidate.id)))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((match) => clone(match));
  }

  listEvents(actor: RequestActor): unknown[] {
    return clone(this.store.getState().events.filter((event) => event.tenantId === actor.tenantId));
  }

  auditLogs(actor: RequestActor): unknown[] {
    return clone(this.store.getState().auditLogs.filter((audit) => audit.tenantId === actor.tenantId));
  }

  private setJobStatus(actor: RequestActor, id: string, status: JobStatus, eventType: string): JobRequisition {
    const job = this.requireJob(actor.tenantId, id);
    const before = clone(job);
    job.status = status;
    job.updatedAt = nowIso();
    if (status === "closed") job.closedAt = job.updatedAt;
    this.store.save();
    this.store.audit(actor, `career.job.${status}`, "job", job.id, before, job);
    this.events.publish(actor, eventType, { jobId: job.id, code: job.code, status: job.status });
    return clone(job);
  }

  private recalculateApplicationRating(applicationId: string): void {
    const state = this.store.getState();
    const cards = state.scorecards.filter((card) => card.applicationId === applicationId);
    const application = state.applications.find((app) => app.id === applicationId);
    if (!application || cards.length === 0) return;
    application.rating = Math.round((cards.reduce((sum, card) => sum + card.overallRating, 0) / cards.length) * 10) / 10;
    application.updatedAt = nowIso();
  }

  private averageScore(scores: Record<string, number>): number {
    const values = Object.values(scores).map(Number).filter(Number.isFinite);
    if (!values.length) return 3;
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
  }

  private getFirstStage(tenantId: string, jobId: string): PipelineStage | undefined {
    return this.store.getState().pipelineStages.filter((stage) => stage.tenantId === tenantId && stage.jobId === jobId).sort((a, b) => a.order - b.order)[0];
  }

  private latestResume(tenantId: string, candidateId: string): CandidateResume | undefined {
    return this.store.getState().resumes.filter((resume) => resume.tenantId === tenantId && resume.candidateId === candidateId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  }

  private requireJob(tenantId: string, id: string): JobRequisition {
    const job = this.store.getState().jobs.find((item) => item.tenantId === tenantId && item.id === id);
    if (!job || job.status === "archived") notFound("Job not found");
    return job;
  }

  private requireCandidate(tenantId: string, id: string): Candidate {
    const candidate = this.store.getState().candidates.find((item) => item.tenantId === tenantId && item.id === id);
    if (!candidate || candidate.status === "archived") notFound("Candidate not found");
    return candidate;
  }

  private requireApplication(tenantId: string, id: string): Application {
    const application = this.store.getState().applications.find((item) => item.tenantId === tenantId && item.id === id);
    if (!application || application.status === "archived") notFound("Application not found");
    return application;
  }

  private requireStage(tenantId: string, id: string): PipelineStage {
    const stage = this.store.getState().pipelineStages.find((item) => item.tenantId === tenantId && item.id === id);
    if (!stage) notFound("Pipeline stage not found");
    return stage;
  }

  private requireInterview(tenantId: string, id: string): Interview {
    const interview = this.store.getState().interviews.find((item) => item.tenantId === tenantId && item.id === id);
    if (!interview) notFound("Interview not found");
    return interview;
  }

  private requireOffer(tenantId: string, id: string): Offer {
    const offer = this.store.getState().offers.find((item) => item.tenantId === tenantId && item.id === id);
    if (!offer) notFound("Offer not found");
    return offer;
  }

  private requirePool(tenantId: string, id: string): TalentPool {
    const pool = this.store.getState().talentPools.find((item) => item.tenantId === tenantId && item.id === id);
    if (!pool || pool.status === "archived") notFound("Talent pool not found");
    return pool;
  }

  private normalizeScreeningQuestions(value: unknown): ScreeningQuestion[] {
    return ensureArray<Partial<ScreeningQuestion>>(value, "screeningQuestions").map((question) => ({
      id: optionalString(question.id) ?? newId("q"),
      question: ensureString(question.question, "screeningQuestions.question"),
      required: question.required === undefined ? false : Boolean(question.required),
      type: this.ensureQuestionType(question.type ?? "text"),
      options: normalizeStringArray(question.options, "screeningQuestions.options")
    }));
  }

  private normalizeSalary(value: unknown): JobRequisition["salaryRange"] {
    const input = ensureObject(value, "salaryRange");
    return {
      currency: ensureString(input.currency ?? "INR", "salaryRange.currency"),
      min: input.min === undefined ? undefined : ensureNumber(input.min, "salaryRange.min"),
      max: input.max === undefined ? undefined : ensureNumber(input.max, "salaryRange.max"),
      period: this.ensureSalaryPeriod(input.period ?? "year"),
      public: Boolean(input.public)
    };
  }

  private normalizeCompensation(value: unknown): CompensationPackage {
    const input = ensureObject(value, "compensation");
    return {
      currency: ensureString(input.currency ?? "INR", "compensation.currency"),
      baseSalary: ensureNumber(input.baseSalary, "compensation.baseSalary"),
      bonus: input.bonus === undefined ? undefined : ensureNumber(input.bonus, "compensation.bonus"),
      equity: optionalString(input.equity),
      benefits: normalizeStringArray(input.benefits, "compensation.benefits")
    };
  }

  private normalizeApprovals(value: unknown): OfferApproval[] {
    return ensureArray<Partial<OfferApproval>>(value, "approvals").map((item) => ({
      approverUserId: ensureString(item.approverUserId, "approvals.approverUserId"),
      status: item.status === "approved" || item.status === "rejected" ? item.status : "pending",
      decidedAt: asIso(item.decidedAt, "approvals.decidedAt"),
      comment: optionalString(item.comment)
    }));
  }

  private labelStatus(status: string): string {
    return status.split("_").map((part) => part.slice(0, 1).toUpperCase() + part.slice(1)).join(" ");
  }

  private ensureEmploymentType(value: unknown): EmploymentType {
    return this.ensureOneOf(value, EMPLOYMENT_TYPES, "employmentType");
  }

  private ensureWorkplaceType(value: unknown): WorkplaceType {
    return this.ensureOneOf(value, WORKPLACE_TYPES, "workplaceType");
  }

  private ensureJobStatus(value: unknown): JobStatus {
    return this.ensureOneOf(value, JOB_STATUSES, "jobStatus");
  }

  private ensureCandidateSource(value: unknown): CandidateSource {
    return this.ensureOneOf(value, CANDIDATE_SOURCES, "source");
  }

  private ensureConsentStatus(value: unknown): ConsentStatus {
    return this.ensureOneOf(value, CONSENT_STATUSES, "consentStatus");
  }

  private ensureCandidateStatus(value: unknown): Candidate["status"] {
    return this.ensureOneOf(value, ["active", "do_not_contact", "blacklisted", "archived"] as const, "candidateStatus");
  }

  private ensureApplicationStatus(value: unknown): ApplicationStatus {
    return this.ensureOneOf(value, APPLICATION_STATUSES, "applicationStatus");
  }

  private ensureStageType(value: unknown): PipelineStageType {
    return this.ensureOneOf(value, STAGE_TYPES, "stageType");
  }

  private ensureInterviewType(value: unknown): InterviewType {
    return this.ensureOneOf(value, INTERVIEW_TYPES, "interviewType");
  }

  private ensureInterviewStatus(value: unknown): InterviewStatus {
    return this.ensureOneOf(value, INTERVIEW_STATUSES, "interviewStatus");
  }

  private ensureScoreRecommendation(value: unknown): ScoreRecommendation {
    return this.ensureOneOf(value, SCORE_RECOMMENDATIONS, "recommendation");
  }

  private ensureOfferStatus(value: unknown): OfferStatus {
    return this.ensureOneOf(value, OFFER_STATUSES, "offerStatus");
  }

  private ensureEntityStatus(value: unknown): EntityStatus {
    return this.ensureOneOf(value, ["active", "inactive", "archived"] as const, "status");
  }

  private ensurePriority(value: unknown): JobRequisition["priority"] {
    return this.ensureOneOf(value, ["low", "medium", "high", "critical"] as const, "priority");
  }

  private ensureQuestionType(value: unknown): ScreeningQuestion["type"] {
    return this.ensureOneOf(value, ["text", "number", "boolean", "select"] as const, "questionType");
  }

  private ensureSalaryPeriod(value: unknown): SalaryRangePeriod {
    return this.ensureOneOf(value, ["hour", "month", "year"] as const, "salaryPeriod");
  }

  private ensureOneOf<T extends string>(value: unknown, allowed: readonly T[], fieldName: string): T {
    const normalized = String(value);
    if (!allowed.includes(normalized as T)) badRequest(`${fieldName} must be one of: ${allowed.join(", ")}`);
    return normalized as T;
  }
}

type SalaryRangePeriod = "hour" | "month" | "year";
