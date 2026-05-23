import {
  CareerState, JobRequisition, Application, Interview, Offer,
  CareerPath, SkillProfile, CareerOverview, CareerEvent, AuditLog,
  RequestActor
} from "./core/domain";
import { DataStore } from "./core/datastore";
import { EventBus } from "./core/event-bus";
import { newId, nowIso } from "./core/id";
import { badRequest, notFound, clone } from "./core/utils";

export class CareerService {
  constructor(private readonly store: DataStore, private readonly events: EventBus) {}

  overview(actor: RequestActor): CareerOverview {
    const state = this.store.getState();
    const tenantJobs = state.jobs.filter(j => j.tenantId === actor.tenantId && j.status !== "archived");
    const tenantApps = state.applications.filter(a => a.tenantId === actor.tenantId && a.status !== "archived");
    const tenantInterviews = state.interviews.filter(i => i.tenantId === actor.tenantId);
    const tenantOffers = state.offers.filter(o => o.tenantId === actor.tenantId);
    const tenantPaths = state.careerPaths.filter(c => c.tenantId === actor.tenantId);
    const tenantProfiles = state.skillProfiles.filter(p => p.tenantId === actor.tenantId);
    const tenantCandidates = state.candidates.filter(c => c.tenantId === actor.tenantId && c.status !== "archived");

    const activeStatuses = ["applied", "screening", "assessment", "interview", "offer"];

    return {
      jobs: {
        total: tenantJobs.length,
        open: tenantJobs.filter(j => j.status === "open").length,
        closed: tenantJobs.filter(j => j.status === "closed" || j.status === "filled").length
      },
      applications: {
        total: tenantApps.length,
        byStatus: this.countBy(tenantApps, "status")
      },
      interviews: {
        total: tenantInterviews.length,
        upcoming: tenantInterviews.filter(i => i.status === "scheduled" && new Date(i.scheduledAt) > new Date()).length,
        completed: tenantInterviews.filter(i => i.status === "completed").length
      },
      offers: {
        total: tenantOffers.length,
        extended: tenantOffers.filter(o => o.status === "extended" || o.status === "sent").length,
        accepted: tenantOffers.filter(o => o.status === "accepted").length
      },
      careerPaths: {
        total: tenantPaths.length,
        active: tenantPaths.filter(c => c.status === "active").length
      },
      skillProfiles: {
        total: tenantProfiles.length
      },
      counts: {
        jobs: tenantJobs.length,
        openJobs: tenantJobs.filter(j => j.status === "open").length,
        candidates: tenantCandidates.length,
        applications: tenantApps.length,
        activeApplications: tenantApps.filter(a => activeStatuses.includes(a.status)).length,
        interviewsScheduled: tenantInterviews.filter(i => i.status === "scheduled").length,
        offersOpen: tenantOffers.filter(o => ["draft", "pending_approval", "approved", "sent"].includes(o.status)).length,
        hired: tenantApps.filter(a => a.status === "hired").length,
        talentPools: (state.talentPools || []).filter(t => t.tenantId === actor.tenantId && t.status !== "archived").length
      },
      recentJobs: tenantJobs.slice(0, 5),
      recentCandidates: tenantCandidates.slice(0, 5),
      recentEvents: state.events.filter(e => e.tenantId === actor.tenantId).slice(0, 10)
    };
  }

  listJobs(actor: RequestActor, query?: URLSearchParams): JobRequisition[] {
    let jobs = this.store.getState().jobs.filter(j => j.tenantId === actor.tenantId && j.status !== "archived");
    const status = query?.get("status");
    if (status) jobs = jobs.filter(j => j.status === status);
    const department = query?.get("department");
    if (department) jobs = jobs.filter(j => j.department === department);
    return jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getJob(actor: RequestActor, id: string): JobRequisition {
    const job = this.store.getState().jobs.find(j => j.id === id && j.tenantId === actor.tenantId);
    if (!job || job.status === "archived") notFound(`Job ${id} not found`);
    return job;
  }

  createJob(actor: RequestActor, body: any): JobRequisition {
    const now = nowIso();
    const job: JobRequisition = {
      id: newId("job"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      code: body.code || `JOB-${Date.now().toString(36).toUpperCase()}`,
      title: body.title || "Untitled Position",
      department: body.department || "General",
      location: body.location || "Remote",
      employmentType: body.employmentType || "full_time",
      workplaceType: body.workplaceType || "remote",
      openings: Math.max(1, Number(body.openings) || 1),
      status: body.status || "draft",
      priority: body.priority || "medium",
      description: body.description || "",
      requirements: body.requirements || [],
      responsibilities: body.responsibilities || [],
      requiredSkills: body.requiredSkills || [],
      niceToHaveSkills: body.niceToHaveSkills || [],
      experienceMinYears: Number(body.experienceMinYears) || 0,
      experienceMaxYears: body.experienceMaxYears ? Number(body.experienceMaxYears) : undefined,
      salaryRange: body.salaryRange,
      recruiterId: body.recruiterId,
      hiringManagerId: body.hiringManagerId,
      pipelineTemplateId: body.pipelineTemplateId,
      screeningQuestions: body.screeningQuestions || [],
      tags: body.tags || [],
      metadata: body.metadata || {},
      createdBy: actor.userId
    };
    this.store.getState().jobs.push(job);
    this.store.audit(actor, "job.create", "job", job.id, undefined, job);
    this.events.publish(actor, "career.job.created", { title: job.title });
    this.store.save();
    return job;
  }

  updateJob(actor: RequestActor, id: string, body: any): JobRequisition {
    const job = this.getJob(actor, id);
    const before = clone(job);
    Object.assign(job, body, { updatedAt: nowIso() });
    this.store.audit(actor, "job.update", "job", id, before, job);
    this.store.save();
    return job;
  }

  listApplications(actor: RequestActor, query?: URLSearchParams): Application[] {
    let apps = this.store.getState().applications.filter(a => a.tenantId === actor.tenantId && a.status !== "archived");
    const status = query?.get("status");
    if (status) apps = apps.filter(a => a.status === status);
    const jobId = query?.get("jobId");
    if (jobId) apps = apps.filter(a => a.jobId === jobId);
    return apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getApplication(actor: RequestActor, id: string): Application {
    const app = this.store.getState().applications.find(a => a.id === id && a.tenantId === actor.tenantId);
    if (!app) notFound(`Application ${id} not found`);
    return app;
  }

  createApplication(actor: RequestActor, body: any): Application {
    const job = this.getJob(actor, body.jobId);
    const now = nowIso();
    const app: Application = {
      id: newId("app"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      jobId: body.jobId,
      candidateId: body.candidateId,
      source: body.source || "direct",
      status: "applied",
      currentStageId: undefined,
      stageEnteredAt: now,
      matchScore: body.matchScore,
      screeningAnswers: [],
      tags: body.tags || [],
      metadata: body.metadata || {},
      createdBy: actor.userId
    };
    this.store.getState().applications.push(app);
    this.store.audit(actor, "application.create", "application", app.id, undefined, app);
    this.events.publish(actor, "career.application.submitted", { jobTitle: job.title });
    this.store.save();
    return app;
  }

  updateApplication(actor: RequestActor, id: string, body: any): Application {
    const app = this.getApplication(actor, id);
    const before = clone(app);
    Object.assign(app, body, { updatedAt: nowIso() });
    this.store.audit(actor, "application.update", "application", id, before, app);
    this.store.save();
    return app;
  }

  listInterviews(actor: RequestActor, query?: URLSearchParams): Interview[] {
    let interviews = this.store.getState().interviews.filter(i => i.tenantId === actor.tenantId);
    const status = query?.get("status");
    if (status) interviews = interviews.filter(i => i.status === status);
    const applicationId = query?.get("applicationId");
    if (applicationId) interviews = interviews.filter(i => i.applicationId === applicationId);
    return interviews.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }

  getInterview(actor: RequestActor, id: string): Interview {
    const interview = this.store.getState().interviews.find(i => i.id === id && i.tenantId === actor.tenantId);
    if (!interview) notFound(`Interview ${id} not found`);
    return interview;
  }

  createInterview(actor: RequestActor, body: any): Interview {
    const now = nowIso();
    const interview: Interview = {
      id: newId("int"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      applicationId: body.applicationId,
      jobId: body.jobId,
      candidateId: body.candidateId,
      interviewerId: body.interviewerId,
      interviewerName: body.interviewerName,
      title: body.title || "Interview",
      interviewType: body.interviewType || "technical",
      scheduledAt: body.scheduledAt,
      durationMinutes: body.durationMinutes || 60,
      duration: body.durationMinutes || 60,
      timezone: body.timezone || "UTC",
      interviewerUserIds: body.interviewerUserIds || [],
      status: "scheduled",
      meetingLink: body.meetingLink,
      location: body.location,
      notes: body.notes,
      createdBy: actor.userId
    };
    this.store.getState().interviews.push(interview);
    this.store.audit(actor, "interview.create", "interview", interview.id, undefined, interview);
    this.events.publish(actor, "career.interview.scheduled", { type: interview.interviewType });
    this.store.save();
    return interview;
  }

  updateInterview(actor: RequestActor, id: string, body: any): Interview {
    const interview = this.getInterview(actor, id);
    const before = clone(interview);
    Object.assign(interview, body, { updatedAt: nowIso() });
    this.store.audit(actor, "interview.update", "interview", id, before, interview);
    this.store.save();
    return interview;
  }

  listOffers(actor: RequestActor, query?: URLSearchParams): Offer[] {
    let offers = this.store.getState().offers.filter(o => o.tenantId === actor.tenantId);
    const status = query?.get("status");
    if (status) offers = offers.filter(o => o.status === status);
    return offers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getOffer(actor: RequestActor, id: string): Offer {
    const offer = this.store.getState().offers.find(o => o.id === id && o.tenantId === actor.tenantId);
    if (!offer) notFound(`Offer ${id} not found`);
    return offer;
  }

  createOffer(actor: RequestActor, body: any): Offer {
    const now = nowIso();
    const offer: Offer = {
      id: newId("offer"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      applicationId: body.applicationId,
      jobId: body.jobId,
      candidateId: body.candidateId,
      candidateName: body.candidateName,
      candidateEmail: body.candidateEmail,
      status: "draft",
      title: body.title,
      compensation: body.compensation || { currency: body.currency || "USD", baseSalary: body.salary || 0, benefits: body.benefits || [] },
      salary: body.salary,
      currency: body.currency || "USD",
      startDate: body.startDate,
      expiresAt: body.expiresAt,
      approvals: [],
      terms: body.terms || [],
      sentAt: undefined,
      acceptedAt: undefined,
      declinedAt: undefined,
      createdBy: actor.userId,
      metadata: body.metadata || {},
      benefits: body.benefits,
      extendedAt: now
    };
    this.store.getState().offers.push(offer);
    this.store.audit(actor, "offer.create", "offer", offer.id, undefined, offer);
    this.events.publish(actor, "career.offer.issued", { candidateName: offer.candidateName });
    this.store.save();
    return offer;
  }

  updateOffer(actor: RequestActor, id: string, body: any): Offer {
    const offer = this.getOffer(actor, id);
    const before = clone(offer);
    Object.assign(offer, body, { updatedAt: nowIso() });
    this.store.audit(actor, "offer.update", "offer", id, before, offer);
    this.store.save();
    return offer;
  }

  listCareerPaths(actor: RequestActor): CareerPath[] {
    return this.store.getState().careerPaths.filter(c => c.tenantId === actor.tenantId);
  }

  getCareerPath(actor: RequestActor, id: string): CareerPath {
    const path = this.store.getState().careerPaths.find(c => c.id === id && c.tenantId === actor.tenantId);
    if (!path) notFound(`Career path ${id} not found`);
    return path;
  }

  createCareerPath(actor: RequestActor, body: any): CareerPath {
    const now = nowIso();
    const path: CareerPath = {
      id: newId("path"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      title: body.title,
      description: body.description || "",
      currentLevel: body.currentLevel,
      targetLevel: body.targetLevel,
      requiredSkills: body.requiredSkills || [],
      currentSkills: body.currentSkills || [],
      skillGaps: body.skillGaps || [],
      milestones: body.milestones || [],
      estimatedDuration: body.estimatedDuration,
      status: body.status || "draft"
    };
    this.store.getState().careerPaths.push(path);
    this.store.audit(actor, "careerpath.create", "careerPath", path.id, undefined, path);
    this.store.save();
    return path;
  }

  listSkillProfiles(actor: RequestActor): SkillProfile[] {
    return this.store.getState().skillProfiles.filter(p => p.tenantId === actor.tenantId);
  }

  getSkillProfile(actor: RequestActor, id: string): SkillProfile {
    const profile = this.store.getState().skillProfiles.find(p => p.id === id && p.tenantId === actor.tenantId);
    if (!profile) notFound(`Skill profile ${id} not found`);
    return profile;
  }

  createSkillProfile(actor: RequestActor, body: any): SkillProfile {
    const now = nowIso();
    const profile: SkillProfile = {
      id: newId("profile"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      candidateId: body.candidateId || newId("candidate"),
      candidateName: body.candidateName,
      skills: body.skills || [],
      certifications: body.certifications || [],
      experience: body.experience || [],
      education: body.education || [],
      projects: body.projects || [],
      overallScore: body.overallScore
    };
    this.store.getState().skillProfiles.push(profile);
    this.store.audit(actor, "skillprofile.create", "skillProfile", profile.id, undefined, profile);
    this.store.save();
    return profile;
  }

  listEvents(actor: RequestActor): CareerEvent[] {
    return this.store.getState().events.filter(e => e.tenantId === actor.tenantId).slice(0, 50);
  }

  listAuditLogs(actor: RequestActor): AuditLog[] {
    return this.store.getState().auditLogs.filter(a => a.tenantId === actor.tenantId).slice(0, 50);
  }

  private countBy<T extends { status: string }>(items: T[], key: keyof T): Record<string, number> {
    return items.reduce((acc, item) => {
      const value = String(item[key]);
      acc[value] = (acc[value] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}
