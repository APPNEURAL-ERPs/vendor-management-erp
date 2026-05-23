import { DataStore } from "./core/datastore";
import {
  Candidate,
  Department,
  Employee,
  EmployeeDocument,
  EngagementRecord,
  Goal,
  HiringPipeline,
  Interview,
  JobRole,
  LeaveBalance,
  LeaveRequest,
  Offer,
  OnboardingChecklist,
  PerformanceReview,
  PeopleOverview,
  RequestActor,
  Team
} from "./core/domain";
import { newId, nowIso } from "./core/id";
import { clone, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, optionalObject, pickQuery } from "./core/utils";

export class PeopleService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "PeopleOS service is ready";
  }

  overview(actor: RequestActor): PeopleOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    const employees = state.employees.filter((e) => e.tenantId === tenant);
    const activeEmployees = employees.filter((e) => e.status === "active");

    return {
      employees: {
        total: employees.length,
        active: activeEmployees.length,
        byStatus: this.countBy(employees, "status")
      },
      teams: {
        total: state.teams.filter((t) => t.tenantId === tenant).length,
        active: state.teams.filter((t) => t.tenantId === tenant && t.status === "active").length
      },
      roles: {
        total: state.roles.filter((r) => r.tenantId === tenant).length,
        active: state.roles.filter((r) => r.tenantId === tenant && r.status === "active").length
      },
      pipelines: {
        total: state.pipelines.filter((p) => p.tenantId === tenant).length,
        active: state.pipelines.filter((p) => p.tenantId === tenant && p.status === "active").length,
        openPositions: state.pipelines.filter((p) => p.tenantId === tenant && p.status === "active").reduce((sum, p) => sum + (p.targetHires || 0), 0)
      },
      candidates: {
        total: state.candidates.filter((c) => c.tenantId === tenant).length,
        byStage: this.countBy(state.candidates.filter((c) => c.tenantId === tenant), "stage")
      },
      reviews: {
        total: state.performanceReviews.filter((r) => r.tenantId === tenant).length,
        pending: state.performanceReviews.filter((r) => r.tenantId === tenant && r.status !== "completed").length,
        completed: state.performanceReviews.filter((r) => r.tenantId === tenant && r.status === "completed").length
      },
      engagements: {
        total: state.engagementRecords.filter((e) => e.tenantId === tenant).length,
        recent: state.engagementRecords.filter((e) => e.tenantId === tenant && new Date(e.date).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000).length
      },
      leaves: {
        pending: state.leaveRequests.filter((l) => l.tenantId === tenant && l.status === "pending").length,
        approved: state.leaveRequests.filter((l) => l.tenantId === tenant && l.status === "approved").length
      }
    };
  }

  listEmployees(actor: RequestActor, query?: URLSearchParams): Employee[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");
    const departmentId = pickQuery(query, "departmentId");
    const teamId = pickQuery(query, "teamId");

    return clone(this.store.getState().employees.filter((e) => {
      if (e.tenantId !== actor.tenantId) return false;
      if (search && !`${e.displayName} ${e.email}`.toLowerCase().includes(search)) return false;
      if (status && e.status !== status) return false;
      if (departmentId && e.departmentId !== departmentId) return false;
      if (teamId && e.teamId !== teamId) return false;
      return true;
    }));
  }

  getEmployee(id: string, actor: RequestActor): Employee {
    const employee = this.store.getState().employees.find((e) => e.id === id && e.tenantId === actor.tenantId);
    if (!employee) throw new Error("Employee not found");
    return clone(employee);
  }

  createEmployee(input: unknown, actor: RequestActor): Employee {
    const body = ensureObject(input, "employee");
    const state = this.store.getState();
    const email = ensureString(body.email, "employee.email").toLowerCase();
    if (state.employees.some((e) => e.tenantId === actor.tenantId && e.email === email)) {
      throw new Error(`Employee with email '${email}' already exists`);
    }

    const employee: Employee = {
      id: newId("emp"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      email,
      displayName: ensureString(body.displayName, "employee.displayName"),
      phone: body.phone ? String(body.phone) : undefined,
      status: String(body.status || "candidate") as Employee["status"],
      employmentType: String(body.employmentType || "full_time") as Employee["employmentType"],
      departmentId: body.departmentId ? String(body.departmentId) : undefined,
      teamId: body.teamId ? String(body.teamId) : undefined,
      roleId: body.roleId ? String(body.roleId) : undefined,
      managerId: body.managerId ? String(body.managerId) : undefined,
      joiningDate: body.joiningDate ? String(body.joiningDate) : undefined,
      probationEndDate: body.probationEndDate ? String(body.probationEndDate) : undefined,
      skills: ensureArray<string>(body.skills, "employee.skills"),
      workLocation: body.workLocation ? String(body.workLocation) : undefined,
      emergencyContact: body.emergencyContact ? ensureObject(body.emergencyContact, "employee.emergencyContact") : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.employees.push(employee);
    this.store.save();
    this.store.audit(actor, "employee.create", "employee", employee.id, undefined, employee);
    this.emitEvent(actor, "people.employee.created", { employeeId: employee.id, email: employee.email });
    return clone(employee);
  }

  updateEmployee(id: string, input: unknown, actor: RequestActor): Employee {
    const body = ensureObject(input, "employee");
    const state = this.store.getState();
    const employee = state.employees.find((e) => e.id === id && e.tenantId === actor.tenantId);
    if (!employee) throw new Error("Employee not found");

    const before = clone(employee);
    if (body.displayName !== undefined) employee.displayName = String(body.displayName);
    if (body.phone !== undefined) employee.phone = body.phone ? String(body.phone) : undefined;
    if (body.status !== undefined) employee.status = String(body.status) as Employee["status"];
    if (body.employmentType !== undefined) employee.employmentType = String(body.employmentType) as Employee["employmentType"];
    if (body.departmentId !== undefined) employee.departmentId = body.departmentId ? String(body.departmentId) : undefined;
    if (body.teamId !== undefined) employee.teamId = body.teamId ? String(body.teamId) : undefined;
    if (body.roleId !== undefined) employee.roleId = body.roleId ? String(body.roleId) : undefined;
    if (body.managerId !== undefined) employee.managerId = body.managerId ? String(body.managerId) : undefined;
    if (body.skills !== undefined) employee.skills = ensureArray<string>(body.skills, "employee.skills");
    if (body.workLocation !== undefined) employee.workLocation = body.workLocation ? String(body.workLocation) : undefined;
    if (body.emergencyContact !== undefined) employee.emergencyContact = body.emergencyContact ? ensureObject(body.emergencyContact, "employee.emergencyContact") : undefined;
    employee.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "employee.update", "employee", employee.id, before, employee);
    this.emitEvent(actor, "people.employee.updated", { employeeId: employee.id, status: employee.status });
    return clone(employee);
  }

  listDepartments(actor: RequestActor): Department[] {
    return clone(this.store.getState().departments.filter((d) => d.tenantId === actor.tenantId));
  }

  createDepartment(input: unknown, actor: RequestActor): Department {
    const body = ensureObject(input, "department");
    const state = this.store.getState();
    const name = ensureString(body.name, "department.name");

    if (state.departments.some((d) => d.tenantId === actor.tenantId && d.name === name)) {
      throw new Error(`Department '${name}' already exists`);
    }

    const department: Department = {
      id: newId("dept"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name,
      description: body.description ? String(body.description) : undefined,
      headId: body.headId ? String(body.headId) : undefined,
      status: String(body.status || "active") as Department["status"]
    };

    state.departments.push(department);
    this.store.save();
    this.store.audit(actor, "department.create", "department", department.id, undefined, department);
    return clone(department);
  }

  listTeams(actor: RequestActor): Team[] {
    const departmentId = pickQuery(actor.tenantId ? undefined : undefined, "departmentId");
    return clone(this.store.getState().teams.filter((t) => {
      if (t.tenantId !== actor.tenantId) return false;
      if (departmentId && t.departmentId !== departmentId) return false;
      return true;
    }));
  }

  createTeam(input: unknown, actor: RequestActor): Team {
    const body = ensureObject(input, "team");
    const state = this.store.getState();
    const name = ensureString(body.name, "team.name");

    const team: Team = {
      id: newId("team"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name,
      description: body.description ? String(body.description) : undefined,
      departmentId: body.departmentId ? String(body.departmentId) : undefined,
      leadId: body.leadId ? String(body.leadId) : undefined,
      memberIds: ensureArray<string>(body.memberIds, "team.memberIds"),
      status: String(body.status || "active") as Team["status"]
    };

    state.teams.push(team);
    this.store.save();
    this.store.audit(actor, "team.create", "team", team.id, undefined, team);
    this.emitEvent(actor, "people.team.created", { teamId: team.id, name: team.name });
    return clone(team);
  }

  listRoles(actor: RequestActor): JobRole[] {
    return clone(this.store.getState().roles.filter((r) => r.tenantId === actor.tenantId));
  }

  createRole(input: unknown, actor: RequestActor): JobRole {
    const body = ensureObject(input, "role");
    const state = this.store.getState();
    const name = ensureString(body.name, "role.name");

    const role: JobRole = {
      id: newId("role"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name,
      description: body.description ? String(body.description) : undefined,
      departmentId: body.departmentId ? String(body.departmentId) : undefined,
      level: body.level ? String(body.level) : undefined,
      status: String(body.status || "active") as JobRole["status"],
      responsibilities: ensureArray<string>(body.responsibilities, "role.responsibilities"),
      requirements: ensureArray<string>(body.requirements, "role.requirements")
    };

    state.roles.push(role);
    this.store.save();
    this.store.audit(actor, "role.create", "role", role.id, undefined, role);
    return clone(role);
  }

  listPipelines(actor: RequestActor): HiringPipeline[] {
    return clone(this.store.getState().pipelines.filter((p) => p.tenantId === actor.tenantId));
  }

  createPipeline(input: unknown, actor: RequestActor): HiringPipeline {
    const body = ensureObject(input, "pipeline");
    const state = this.store.getState();
    const title = ensureString(body.title, "pipeline.title");

    const pipeline: HiringPipeline = {
      id: newId("pipe"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      title,
      description: body.description ? String(body.description) : undefined,
      departmentId: body.departmentId ? String(body.departmentId) : undefined,
      roleId: body.roleId ? String(body.roleId) : undefined,
      status: String(body.status || "active") as HiringPipeline["status"],
      openDate: body.openDate ? String(body.openDate) : undefined,
      closeDate: body.closeDate ? String(body.closeDate) : undefined,
      targetHires: body.targetHires ? ensureNumber(body.targetHires, "pipeline.targetHires") : undefined,
      salaryRange: body.salaryRange ? ensureObject(body.salaryRange, "pipeline.salaryRange") : undefined
    };

    state.pipelines.push(pipeline);
    this.store.save();
    this.store.audit(actor, "pipeline.create", "pipeline", pipeline.id, undefined, pipeline);
    this.emitEvent(actor, "people.pipeline.created", { pipelineId: pipeline.id, title: pipeline.title });
    return clone(pipeline);
  }

  listCandidates(actor: RequestActor, query?: URLSearchParams): Candidate[] {
    const pipelineId = pickQuery(query, "pipelineId");
    const stage = pickQuery(query, "stage");

    return clone(this.store.getState().candidates.filter((c) => {
      if (c.tenantId !== actor.tenantId) return false;
      if (pipelineId && c.pipelineId !== pipelineId) return false;
      if (stage && c.stage !== stage) return false;
      return true;
    }));
  }

  createCandidate(input: unknown, actor: RequestActor): Candidate {
    const body = ensureObject(input, "candidate");
    const state = this.store.getState();
    const email = ensureString(body.email, "candidate.email").toLowerCase();

    const candidate: Candidate = {
      id: newId("cand"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      pipelineId: body.pipelineId ? String(body.pipelineId) : undefined,
      name: ensureString(body.name, "candidate.name"),
      email,
      phone: body.phone ? String(body.phone) : undefined,
      stage: String(body.stage || "applied") as Candidate["stage"],
      resumeUrl: body.resumeUrl ? String(body.resumeUrl) : undefined,
      skills: ensureArray<string>(body.skills, "candidate.skills"),
      experience: body.experience ? String(body.experience) : undefined,
      education: body.education ? String(body.education) : undefined,
      expectedSalary: body.expectedSalary ? ensureNumber(body.expectedSalary, "candidate.expectedSalary") : undefined,
      noticePeriod: body.noticePeriod ? String(body.noticePeriod) : undefined,
      currentLocation: body.currentLocation ? String(body.currentLocation) : undefined,
      source: body.source ? String(body.source) : undefined,
      interviewFeedback: [],
      metadata: optionalObject(body.metadata)
    };

    state.candidates.push(candidate);
    this.store.save();
    this.store.audit(actor, "candidate.create", "candidate", candidate.id, undefined, candidate);
    return clone(candidate);
  }

  updateCandidateStage(id: string, input: unknown, actor: RequestActor): Candidate {
    const body = ensureObject(input, "candidate");
    const state = this.store.getState();
    const candidate = state.candidates.find((c) => c.id === id && c.tenantId === actor.tenantId);
    if (!candidate) throw new Error("Candidate not found");

    const before = clone(candidate);
    const newStage = ensureString(body.stage, "candidate.stage");
    candidate.stage = newStage as Candidate["stage"];
    candidate.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "candidate.stage.update", "candidate", candidate.id, before, candidate);
    this.emitEvent(actor, "people.pipeline.updated", { candidateId: candidate.id, stage: candidate.stage });
    return clone(candidate);
  }

  createInterview(input: unknown, actor: RequestActor): Interview {
    const body = ensureObject(input, "interview");
    const state = this.store.getState();

    const interview: Interview = {
      id: newId("interview"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      candidateId: ensureString(body.candidateId, "interview.candidateId"),
      pipelineId: body.pipelineId ? String(body.pipelineId) : undefined,
      round: ensureString(body.round, "interview.round"),
      scheduledAt: body.scheduledAt ? String(body.scheduledAt) : undefined,
      interviewerIds: ensureArray<string>(body.interviewerIds, "interview.interviewerIds"),
      status: String(body.status || "scheduled") as Interview["status"],
      feedback: body.feedback ? String(body.feedback) : undefined,
      rating: body.rating ? ensureNumber(body.rating, "interview.rating") : undefined
    };

    state.interviews.push(interview);
    this.store.save();
    this.store.audit(actor, "interview.create", "interview", interview.id, undefined, interview);
    return clone(interview);
  }

  createOffer(input: unknown, actor: RequestActor): Offer {
    const body = ensureObject(input, "offer");
    const state = this.store.getState();

    const offer: Offer = {
      id: newId("offer"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      candidateId: ensureString(body.candidateId, "offer.candidateId"),
      pipelineId: body.pipelineId ? String(body.pipelineId) : undefined,
      status: String(body.status || "draft") as Offer["status"],
      salary: body.salary ? ensureNumber(body.salary, "offer.salary") : undefined,
      currency: body.currency ? String(body.currency) : undefined,
      benefits: body.benefits ? String(body.benefits) : undefined,
      startDate: body.startDate ? String(body.startDate) : undefined,
      expiryDate: body.expiryDate ? String(body.expiryDate) : undefined,
      approvedBy: body.approvedBy ? String(body.approvedBy) : undefined,
      sentAt: body.sentAt ? String(body.sentAt) : undefined,
      acceptedAt: body.acceptedAt ? String(body.acceptedAt) : undefined,
      rejectedAt: body.rejectedAt ? String(body.rejectedAt) : undefined,
      notes: body.notes ? String(body.notes) : undefined
    };

    state.offers.push(offer);
    this.store.save();
    this.store.audit(actor, "offer.create", "offer", offer.id, undefined, offer);
    return clone(offer);
  }

  createOnboardingChecklist(input: unknown, actor: RequestActor): OnboardingChecklist {
    const body = ensureObject(input, "checklist");
    const state = this.store.getState();

    const checklist: OnboardingChecklist = {
      id: newId("onboard"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      employeeId: ensureString(body.employeeId, "checklist.employeeId"),
      items: ensureArray(body.items, "checklist.items").map((item: any) => ({
        task: ensureString(item.task, "item.task"),
        status: String(item.status || "pending") as "pending" | "completed" | "skipped",
        completedAt: item.completedAt ? String(item.completedAt) : undefined,
        assignee: item.assignee ? String(item.assignee) : undefined
      })),
      startDate: body.startDate ? String(body.startDate) : undefined,
      completionDate: body.completionDate ? String(body.completionDate) : undefined,
      status: String(body.status || "active") as OnboardingChecklist["status"]
    };

    state.onboardingChecklists.push(checklist);
    this.store.save();
    this.store.audit(actor, "onboarding.create", "onboardingChecklist", checklist.id, undefined, checklist);
    return clone(checklist);
  }

  createLeaveRequest(input: unknown, actor: RequestActor): LeaveRequest {
    const body = ensureObject(input, "leave");
    const state = this.store.getState();

    const leave: LeaveRequest = {
      id: newId("leave"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      employeeId: ensureString(body.employeeId, "leave.employeeId"),
      leaveType: ensureString(body.leaveType, "leave.leaveType") as LeaveRequest["leaveType"],
      startDate: ensureString(body.startDate, "leave.startDate"),
      endDate: ensureString(body.endDate, "leave.endDate"),
      days: ensureNumber(body.days, "leave.days"),
      reason: body.reason ? String(body.reason) : undefined,
      status: "pending",
      approvedBy: body.approvedBy ? String(body.approvedBy) : undefined,
      approvedAt: body.approvedAt ? String(body.approvedAt) : undefined,
      rejectionReason: body.rejectionReason ? String(body.rejectionReason) : undefined,
      balance: body.balance ? ensureNumber(body.balance, "leave.balance") : undefined
    };

    state.leaveRequests.push(leave);
    this.store.save();
    this.store.audit(actor, "leave.create", "leaveRequest", leave.id, undefined, leave);
    return clone(leave);
  }

  approveLeaveRequest(id: string, input: unknown, actor: RequestActor): LeaveRequest {
    const body = ensureObject(input, "leave");
    const state = this.store.getState();
    const leave = state.leaveRequests.find((l) => l.id === id && l.tenantId === actor.tenantId);
    if (!leave) throw new Error("Leave request not found");

    const before = clone(leave);
    leave.status = "approved";
    leave.approvedBy = body.approvedBy ? String(body.approvedBy) : actor.userId;
    leave.approvedAt = nowIso();
    leave.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "leave.approve", "leaveRequest", leave.id, before, leave);
    return clone(leave);
  }

  createPerformanceReview(input: unknown, actor: RequestActor): PerformanceReview {
    const body = ensureObject(input, "review");
    const state = this.store.getState();

    const review: PerformanceReview = {
      id: newId("review"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      employeeId: ensureString(body.employeeId, "review.employeeId"),
      reviewerId: body.reviewerId ? String(body.reviewerId) : undefined,
      cycle: ensureString(body.cycle, "review.cycle") as PerformanceReview["cycle"],
      status: String(body.status || "draft") as PerformanceReview["status"],
      scheduledDate: body.scheduledDate ? String(body.scheduledDate) : undefined,
      completedDate: body.completedDate ? String(body.completedDate) : undefined,
      rating: body.rating ? ensureNumber(body.rating, "review.rating") : undefined,
      goals: ensureArray(body.goals, "review.goals").map((goal: any) => ({
        description: ensureString(goal.description, "goal.description"),
        target: goal.target ? String(goal.target) : undefined,
        achievement: goal.achievement ? String(goal.achievement) : undefined,
        rating: goal.rating ? ensureNumber(goal.rating, "goal.rating") : undefined
      })),
      strengths: body.strengths ? String(body.strengths) : undefined,
      areasForImprovement: body.areasForImprovement ? String(body.areasForImprovement) : undefined,
      comments: body.comments ? String(body.comments) : undefined,
      selfAssessment: body.selfAssessment ? String(body.selfAssessment) : undefined
    };

    state.performanceReviews.push(review);
    this.store.save();
    this.store.audit(actor, "review.create", "performanceReview", review.id, undefined, review);
    this.emitEvent(actor, "people.review.completed", { reviewId: review.id, employeeId: review.employeeId });
    return clone(review);
  }

  createGoal(input: unknown, actor: RequestActor): Goal {
    const body = ensureObject(input, "goal");
    const state = this.store.getState();

    const goal: Goal = {
      id: newId("goal"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      employeeId: ensureString(body.employeeId, "goal.employeeId"),
      title: ensureString(body.title, "goal.title"),
      description: body.description ? String(body.description) : undefined,
      category: body.category ? String(body.category) : undefined,
      startDate: body.startDate ? String(body.startDate) : undefined,
      dueDate: body.dueDate ? String(body.dueDate) : undefined,
      status: String(body.status || "active") as Goal["status"],
      progress: ensureNumber(body.progress, "goal.progress", 0),
      weight: body.weight ? ensureNumber(body.weight, "goal.weight") : undefined,
      linkedReviews: body.linkedReviews ? ensureArray<string>(body.linkedReviews, "goal.linkedReviews") : undefined
    };

    state.goals.push(goal);
    this.store.save();
    this.store.audit(actor, "goal.create", "goal", goal.id, undefined, goal);
    return clone(goal);
  }

  createEngagement(input: unknown, actor: RequestActor): EngagementRecord {
    const body = ensureObject(input, "engagement");
    const state = this.store.getState();

    const engagement: EngagementRecord = {
      id: newId("eng"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      employeeId: body.employeeId ? String(body.employeeId) : undefined,
      type: ensureString(body.type, "engagement.type") as EngagementRecord["type"],
      title: ensureString(body.title, "engagement.title"),
      description: body.description ? String(body.description) : undefined,
      date: ensureString(body.date, "engagement.date"),
      sentiment: body.sentiment ? String(body.sentiment) as EngagementRecord["sentiment"] : undefined,
      score: body.score ? ensureNumber(body.score, "engagement.score") : undefined,
      participants: body.participants ? ensureArray<string>(body.participants, "engagement.participants") : undefined,
      createdBy: body.createdBy ? String(body.createdBy) : actor.userId,
      metadata: optionalObject(body.metadata)
    };

    state.engagementRecords.push(engagement);
    this.store.save();
    this.store.audit(actor, "engagement.create", "engagementRecord", engagement.id, undefined, engagement);
    this.emitEvent(actor, "people.engagement.created", { engagementId: engagement.id, type: engagement.type });
    return clone(engagement);
  }

  listLeaveRequests(actor: RequestActor, query?: URLSearchParams): LeaveRequest[] {
    const employeeId = pickQuery(query, "employeeId");
    const status = pickQuery(query, "status");

    return clone(this.store.getState().leaveRequests.filter((l) => {
      if (l.tenantId !== actor.tenantId) return false;
      if (employeeId && l.employeeId !== employeeId) return false;
      if (status && l.status !== status) return false;
      return true;
    }));
  }

  listPerformanceReviews(actor: RequestActor, query?: URLSearchParams): PerformanceReview[] {
    const employeeId = pickQuery(query, "employeeId");
    const status = pickQuery(query, "status");

    return clone(this.store.getState().performanceReviews.filter((r) => {
      if (r.tenantId !== actor.tenantId) return false;
      if (employeeId && r.employeeId !== employeeId) return false;
      if (status && r.status !== status) return false;
      return true;
    }));
  }

  listEngagements(actor: RequestActor, query?: URLSearchParams): EngagementRecord[] {
    const employeeId = pickQuery(query, "employeeId");
    const type = pickQuery(query, "type");

    return clone(this.store.getState().engagementRecords.filter((e) => {
      if (e.tenantId !== actor.tenantId) return false;
      if (employeeId && e.employeeId !== employeeId) return false;
      if (type && e.type !== type) return false;
      return true;
    }));
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((log) => log.tenantId === actor.tenantId));
  }

  private emitEvent(actor: RequestActor, type: string, data: Record<string, unknown>): void {
    const event = {
      id: newId("event"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type,
      source: "PeopleOS",
      data
    };
    this.store.getState().events.unshift(event as any);
    this.store.save();
  }

  private countBy(items: any[], key: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const value = String(item[key]);
      acc[value] = (acc[value] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}
