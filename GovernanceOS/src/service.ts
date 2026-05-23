import { DataStore } from "./core/datastore";
import {
  Director,
  Committee,
  BoardMeeting,
  Resolution,
  GovernancePolicy,
  RACIMatrix,
  ApprovalMatrix,
  Decision,
  EscalationRule,
  GovernanceException,
  RiskOwnership,
  GovernanceReview,
  GovernanceOverview,
  RequestActor,
  AgendaItem,
  VotingResult,
  VoteRecord,
  ReviewFinding,
  ReviewActionItem
} from "./core/domain";
import { badRequest, notFound, conflict } from "./core/errors";
import { newId, nowIso, plusDays, isDue } from "./core/id";
import { clone, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, optionalObject, pickQuery, countBy } from "./core/utils";

export class GovernanceService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "GovernanceOS service is ready";
  }

  overview(actor: RequestActor): GovernanceOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;

    const directors = state.directors.filter((d) => d.tenantId === tenant);
    const activeDirectors = directors.filter((d) => d.status === "active");

    const committees = state.committees.filter((c) => c.tenantId === tenant);
    const activeCommittees = committees.filter((c) => c.status === "active");

    const meetings = state.meetings.filter((m) => m.tenantId === tenant);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const resolutions = state.resolutions.filter((r) => r.tenantId === tenant);
    const policies = state.policies.filter((p) => p.tenantId === tenant);
    const exceptions = state.exceptions.filter((e) => e.tenantId === tenant);
    const risks = state.riskOwnerships.filter((r) => r.tenantId === tenant);

    return {
      directors: {
        total: directors.length,
        active: activeDirectors.length,
        byType: countBy(activeDirectors, "directorType")
      },
      committees: {
        total: committees.length,
        active: activeCommittees.length
      },
      meetings: {
        scheduled: meetings.filter((m) => m.status === "scheduled").length,
        completed: meetings.filter((m) => m.status === "completed").length,
        thisMonth: meetings.filter((m) => new Date(m.scheduledAt) >= startOfMonth).length
      },
      resolutions: {
        proposed: resolutions.filter((r) => r.status === "proposed").length,
        approved: resolutions.filter((r) => r.status === "approved").length,
        pending: resolutions.filter((r) => r.status === "proposed").length
      },
      policies: {
        active: policies.filter((p) => p.status === "active").length,
        dueForReview: policies.filter((p) => isDue(p.reviewDate)).length,
        draft: policies.filter((p) => p.status === "draft").length
      },
      exceptions: {
        pending: exceptions.filter((e) => e.status === "pending").length,
        approved: exceptions.filter((e) => e.status === "approved").length
      },
      risks: {
        open: risks.filter((r) => r.status !== "accepted" && r.status !== "transferred").length,
        bySeverity: countBy(risks, "severity")
      }
    };
  }

  listDirectors(actor: RequestActor): Director[] {
    return clone(this.store.getState().directors.filter((d) => d.tenantId === actor.tenantId));
  }

  createDirector(input: unknown, actor: RequestActor): Director {
    const body = ensureObject(input, "director");
    const state = this.store.getState();
    const key = ensureString(body.key, "director.key");
    if (state.directors.some((d) => d.tenantId === actor.tenantId && d.key === key)) {
      conflict(`Director key '${key}' already exists`);
    }
    const director: Director = {
      id: newId("director"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "director.name"),
      email: ensureString(body.email, "director.email"),
      title: ensureString(body.title, "director.title"),
      directorType: String(body.directorType ?? "non_executive") as Director["directorType"],
      status: String(body.status ?? "active") as Director["status"],
      committeeIds: ensureArray(body.committeeIds, "director.committeeIds", []),
      metadata: optionalObject(body.metadata)
    };
    state.directors.push(director);
    this.store.save();
    this.store.audit(actor, "director.create", "director", director.id, undefined, director);
    return clone(director);
  }

  getDirector(id: string, actor: RequestActor): Director {
    const director = this.store.getState().directors.find((d) => d.id === id && d.tenantId === actor.tenantId);
    if (!director) notFound("Director not found");
    return clone(director);
  }

  updateDirector(id: string, input: unknown, actor: RequestActor): Director {
    const body = ensureObject(input, "director");
    const state = this.store.getState();
    const director = state.directors.find((d) => d.id === id && d.tenantId === actor.tenantId);
    if (!director) notFound("Director not found");
    const before = clone(director);
    if (body.name) director.name = String(body.name);
    if (body.email) director.email = String(body.email);
    if (body.title) director.title = String(body.title);
    if (body.directorType) director.directorType = String(body.directorType) as Director["directorType"];
    if (body.status) director.status = String(body.status) as Director["status"];
    if (body.committeeIds) director.committeeIds = ensureArray(body.committeeIds, "director.committeeIds");
    if (body.metadata) director.metadata = optionalObject(body.metadata);
    director.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "director.update", "director", director.id, before, director);
    return clone(director);
  }

  listCommittees(actor: RequestActor): Committee[] {
    return clone(this.store.getState().committees.filter((c) => c.tenantId === actor.tenantId));
  }

  createCommittee(input: unknown, actor: RequestActor): Committee {
    const body = ensureObject(input, "committee");
    const state = this.store.getState();
    const key = ensureString(body.key, "committee.key");
    if (state.committees.some((c) => c.tenantId === actor.tenantId && c.key === key)) {
      conflict(`Committee key '${key}' already exists`);
    }
    const committee: Committee = {
      id: newId("committee"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "committee.name"),
      description: body.description ? String(body.description) : undefined,
      committeeType: String(body.committeeType ?? "other") as Committee["committeeType"],
      chairId: body.chairId ? String(body.chairId) : undefined,
      memberIds: ensureArray(body.memberIds, "committee.memberIds", []),
      status: String(body.status ?? "active") as Committee["status"],
      meetingFrequency: body.meetingFrequency ? String(body.meetingFrequency) : undefined,
      metadata: optionalObject(body.metadata)
    };
    state.committees.push(committee);
    this.store.save();
    this.store.audit(actor, "committee.create", "committee", committee.id, undefined, committee);
    return clone(committee);
  }

  getCommittee(id: string, actor: RequestActor): Committee {
    const committee = this.store.getState().committees.find((c) => c.id === id && c.tenantId === actor.tenantId);
    if (!committee) notFound("Committee not found");
    return clone(committee);
  }

  listMeetings(actor: RequestActor, query?: URLSearchParams): BoardMeeting[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");
    const meetingType = pickQuery(query, "meetingType");
    return clone(this.store.getState().meetings.filter((m) => {
      if (m.tenantId !== actor.tenantId) return false;
      if (search && !`${m.meetingNumber} ${m.title}`.toLowerCase().includes(search)) return false;
      if (status && m.status !== status) return false;
      if (meetingType && m.meetingType !== meetingType) return false;
      return true;
    }));
  }

  createMeeting(input: unknown, actor: RequestActor): BoardMeeting {
    const body = ensureObject(input, "meeting");
    const state = this.store.getState();
    const meeting: BoardMeeting = {
      id: newId("meeting"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      meetingNumber: ensureString(body.meetingNumber, "meeting.meetingNumber"),
      title: ensureString(body.title, "meeting.title"),
      meetingType: String(body.meetingType ?? "quarterly") as BoardMeeting["meetingType"],
      scheduledAt: ensureString(body.scheduledAt, "meeting.scheduledAt"),
      status: "scheduled",
      attendeeIds: ensureArray(body.attendeeIds, "meeting.attendeeIds", []),
      absentAttendeeIds: [],
      agendaItems: [],
      resolutions: [],
      createdBy: actor.userId
    };
    if (body.location) meeting.location = String(body.location);
    if (body.virtualLink) meeting.virtualLink = String(body.virtualLink);
    state.meetings.push(meeting);
    this.store.save();
    this.store.audit(actor, "meeting.create", "meeting", meeting.id, undefined, meeting);
    return clone(meeting);
  }

  getMeeting(id: string, actor: RequestActor): BoardMeeting {
    const meeting = this.store.getState().meetings.find((m) => m.id === id && m.tenantId === actor.tenantId);
    if (!meeting) notFound("Meeting not found");
    return clone(meeting);
  }

  updateMeeting(id: string, input: unknown, actor: RequestActor): BoardMeeting {
    const body = ensureObject(input, "meeting");
    const state = this.store.getState();
    const meeting = state.meetings.find((m) => m.id === id && m.tenantId === actor.tenantId);
    if (!meeting) notFound("Meeting not found");
    const before = clone(meeting);
    if (body.title) meeting.title = String(body.title);
    if (body.scheduledAt) meeting.scheduledAt = String(body.scheduledAt);
    if (body.status) meeting.status = String(body.status) as BoardMeeting["status"];
    if (body.attendeeIds) meeting.attendeeIds = ensureArray(body.attendeeIds, "meeting.attendeeIds");
    if (body.absentAttendeeIds) meeting.absentAttendeeIds = ensureArray(body.absentAttendeeIds, "meeting.absentAttendeeIds");
    if (body.agendaItems) meeting.agendaItems = ensureArray(body.agendaItems, "meeting.agendaItems");
    if (body.minutes) meeting.minutes = String(body.minutes);
    if (body.location) meeting.location = String(body.location);
    if (body.virtualLink) meeting.virtualLink = String(body.virtualLink);
    if (body.endedAt) meeting.endedAt = String(body.endedAt);
    meeting.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "meeting.update", "meeting", meeting.id, before, meeting);
    return clone(meeting);
  }

  addAgendaItem(meetingId: string, input: unknown, actor: RequestActor): AgendaItem {
    const body = ensureObject(input, "agendaItem");
    const state = this.store.getState();
    const meeting = state.meetings.find((m) => m.id === meetingId && m.tenantId === actor.tenantId);
    if (!meeting) notFound("Meeting not found");
    const agendaItem: AgendaItem = {
      id: newId("agenda"),
      itemNumber: ensureString(body.itemNumber, "agendaItem.itemNumber"),
      title: ensureString(body.title, "agendaItem.title"),
      description: body.description ? String(body.description) : undefined,
      presenterId: body.presenterId ? String(body.presenterId) : undefined,
      order: ensureNumber(body.order, "agendaItem.order"),
      duration: body.duration ? ensureNumber(body.duration, "agendaItem.duration") : undefined,
      attachments: ensureArray(body.attachments, "agendaItem.attachments", [])
    };
    meeting.agendaItems.push(agendaItem);
    meeting.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "meeting.agenda.add", "meeting", meeting.id, undefined, { agendaItemId: agendaItem.id });
    return clone(agendaItem);
  }

  listResolutions(actor: RequestActor, query?: URLSearchParams): Resolution[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");
    const meetingId = pickQuery(query, "meetingId");
    return clone(this.store.getState().resolutions.filter((r) => {
      if (r.tenantId !== actor.tenantId) return false;
      if (search && !`${r.resolutionNumber} ${r.title}`.toLowerCase().includes(search)) return false;
      if (status && r.status !== status) return false;
      if (meetingId && r.meetingId !== meetingId) return false;
      return true;
    }));
  }

  createResolution(input: unknown, actor: RequestActor): Resolution {
    const body = ensureObject(input, "resolution");
    const state = this.store.getState();
    const resolution: Resolution = {
      id: newId("resolution"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      resolutionNumber: ensureString(body.resolutionNumber, "resolution.resolutionNumber"),
      title: ensureString(body.title, "resolution.title"),
      description: body.description ? String(body.description) : undefined,
      resolutionType: String(body.resolutionType ?? "ordinary") as Resolution["resolutionType"],
      meetingId: body.meetingId ? String(body.meetingId) : undefined,
      proposedBy: body.proposedBy ? String(body.proposedBy) : undefined,
      status: "proposed",
      createdBy: actor.userId,
      metadata: optionalObject(body.metadata)
    };
    state.resolutions.push(resolution);
    if (resolution.meetingId) {
      const meeting = state.meetings.find((m) => m.id === resolution.meetingId);
      if (meeting) {
        meeting.resolutions.push(resolution.id);
        meeting.updatedAt = nowIso();
      }
    }
    this.store.save();
    this.store.audit(actor, "resolution.create", "resolution", resolution.id, undefined, resolution);
    return clone(resolution);
  }

  getResolution(id: string, actor: RequestActor): Resolution {
    const resolution = this.store.getState().resolutions.find((r) => r.id === id && r.tenantId === actor.tenantId);
    if (!resolution) notFound("Resolution not found");
    return clone(resolution);
  }

  updateResolution(id: string, input: unknown, actor: RequestActor): Resolution {
    const body = ensureObject(input, "resolution");
    const state = this.store.getState();
    const resolution = state.resolutions.find((r) => r.id === id && r.tenantId === actor.tenantId);
    if (!resolution) notFound("Resolution not found");
    const before = clone(resolution);
    if (body.title) resolution.title = String(body.title);
    if (body.description) resolution.description = String(body.description);
    if (body.status) resolution.status = String(body.status) as Resolution["status"];
    if (body.votingResults) resolution.votingResults = body.votingResults as VotingResult;
    if (body.rationale !== undefined) resolution.rationale = String(body.rationale);
    if (body.approvedBy) resolution.approvedBy = String(body.approvedBy);
    if (body.effectiveDate) resolution.effectiveDate = String(body.effectiveDate);
    if (body.expiryDate) resolution.expiryDate = String(body.expiryDate);
    if (body.approvedAt) resolution.approvedAt = String(body.approvedAt);
    if (body.metadata) resolution.metadata = optionalObject(body.metadata);
    resolution.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "resolution.update", "resolution", resolution.id, before, resolution);
    return clone(resolution);
  }

  voteOnResolution(id: string, input: unknown, actor: RequestActor): Resolution {
    const body = ensureObject(input, "vote");
    const state = this.store.getState();
    const resolution = state.resolutions.find((r) => r.id === id && r.tenantId === actor.tenantId);
    if (!resolution) notFound("Resolution not found");
    const voterId = ensureString(body.voterId, "vote.voterId");
    const voterName = ensureString(body.voterName, "vote.voterName");
    const vote = String(body.vote ?? "for") as "for" | "against" | "abstain";
    if (!["for", "against", "abstain"].includes(vote)) badRequest("Invalid vote value");
    const director = state.directors.find((d) => d.id === voterId && d.tenantId === actor.tenantId);
    const voteRecord: VoteRecord = {
      voterId,
      voterName: director?.name ?? voterName,
      vote,
      timestamp: nowIso()
    };
    if (!resolution.votingResults) {
      resolution.votingResults = {
        totalVotes: 0,
        votesFor: 0,
        votesAgainst: 0,
        abstentions: 0,
        voters: []
      };
    }
    const existingVote = resolution.votingResults.voters.findIndex((v) => v.voterId === voterId);
    if (existingVote >= 0) {
      const oldVote = resolution.votingResults.voters[existingVote].vote;
      if (oldVote === "for") resolution.votingResults.votesFor--;
      if (oldVote === "against") resolution.votingResults.votesAgainst--;
      if (oldVote === "abstain") resolution.votingResults.abstentions--;
      resolution.votingResults.voters.splice(existingVote, 1);
    }
    resolution.votingResults.voters.push(voteRecord);
    resolution.votingResults.totalVotes = resolution.votingResults.voters.length;
    if (vote === "for") resolution.votingResults.votesFor++;
    if (vote === "against") resolution.votingResults.votesAgainst++;
    if (vote === "abstain") resolution.votingResults.abstentions++;
    resolution.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "resolution.vote", "resolution", resolution.id, undefined, { voterId, vote });
    return clone(resolution);
  }

  listPolicies(actor: RequestActor, query?: URLSearchParams): GovernancePolicy[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");
    const category = pickQuery(query, "category");
    return clone(this.store.getState().policies.filter((p) => {
      if (p.tenantId !== actor.tenantId) return false;
      if (search && !`${p.key} ${p.name} ${p.description ?? ""}`.toLowerCase().includes(search)) return false;
      if (status && p.status !== status) return false;
      if (category && p.category !== category) return false;
      return true;
    }));
  }

  createPolicy(input: unknown, actor: RequestActor): GovernancePolicy {
    const body = ensureObject(input, "policy");
    const state = this.store.getState();
    const key = ensureString(body.key, "policy.key");
    if (state.policies.some((p) => p.tenantId === actor.tenantId && p.key === key)) {
      conflict(`Policy key '${key}' already exists`);
    }
    const policy: GovernancePolicy = {
      id: newId("policy"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "policy.name"),
      description: body.description ? String(body.description) : undefined,
      category: String(body.category ?? "other") as GovernancePolicy["category"],
      policyType: String(body.policyType ?? "internal") as GovernancePolicy["policyType"],
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      status: String(body.status ?? "draft") as GovernancePolicy["status"],
      version: 1,
      effectiveDate: body.effectiveDate ? String(body.effectiveDate) : undefined,
      reviewDate: body.reviewDate ? String(body.reviewDate) : plusDays(365),
      content: ensureString(body.content, "policy.content"),
      attachments: ensureArray(body.attachments, "policy.attachments", []),
      acknowledgments: [],
      exceptions: [],
      metadata: optionalObject(body.metadata)
    };
    state.policies.push(policy);
    this.store.save();
    this.store.audit(actor, "policy.create", "policy", policy.id, undefined, policy);
    return clone(policy);
  }

  getPolicy(id: string, actor: RequestActor): GovernancePolicy {
    const policy = this.store.getState().policies.find((p) => p.id === id && p.tenantId === actor.tenantId);
    if (!policy) notFound("Policy not found");
    return clone(policy);
  }

  updatePolicy(id: string, input: unknown, actor: RequestActor): GovernancePolicy {
    const body = ensureObject(input, "policy");
    const state = this.store.getState();
    const policy = state.policies.find((p) => p.id === id && p.tenantId === actor.tenantId);
    if (!policy) notFound("Policy not found");
    const before = clone(policy);
    if (body.name) policy.name = String(body.name);
    if (body.description) policy.description = String(body.description);
    if (body.category) policy.category = String(body.category) as GovernancePolicy["category"];
    if (body.policyType) policy.policyType = String(body.policyType) as GovernancePolicy["policyType"];
    if (body.ownerId) policy.ownerId = String(body.ownerId);
    if (body.status) policy.status = String(body.status) as GovernancePolicy["status"];
    if (body.content) policy.content = String(body.content);
    if (body.effectiveDate) policy.effectiveDate = String(body.effectiveDate);
    if (body.reviewDate) policy.reviewDate = String(body.reviewDate);
    if (body.attachments) policy.attachments = ensureArray(body.attachments, "policy.attachments");
    if (body.metadata) policy.metadata = optionalObject(body.metadata);
    if (body.updateVersion) {
      policy.version++;
    }
    policy.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "policy.update", "policy", policy.id, before, policy);
    return clone(policy);
  }

  acknowledgePolicy(id: string, input: unknown, actor: RequestActor): GovernancePolicy {
    const body = ensureObject(input, "acknowledgment");
    const state = this.store.getState();
    const policy = state.policies.find((p) => p.id === id && p.tenantId === actor.tenantId);
    if (!policy) notFound("Policy not found");
    const userId = ensureString(body.userId, "acknowledgment.userId");
    const userName = ensureString(body.userName, "acknowledgment.userName");
    const existingIdx = policy.acknowledgments.findIndex((a) => a.userId === userId);
    if (existingIdx < 0) {
      policy.acknowledgments.push({ userId, userName, acknowledgedAt: nowIso() });
    }
    policy.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "policy.acknowledge", "policy", policy.id, undefined, { userId });
    return clone(policy);
  }

  listDecisions(actor: RequestActor, query?: URLSearchParams): Decision[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");
    return clone(this.store.getState().decisions.filter((d) => {
      if (d.tenantId !== actor.tenantId) return false;
      if (search && !`${d.decisionNumber} ${d.title}`.toLowerCase().includes(search)) return false;
      if (status && d.status !== status) return false;
      return true;
    }));
  }

  createDecision(input: unknown, actor: RequestActor): Decision {
    const body = ensureObject(input, "decision");
    const state = this.store.getState();
    const decision: Decision = {
      id: newId("decision"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      decisionNumber: ensureString(body.decisionNumber, "decision.decisionNumber"),
      title: ensureString(body.title, "decision.title"),
      description: ensureString(body.description, "decision.description"),
      category: String(body.category ?? "business") as Decision["category"],
      status: "pending",
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      priority: String(body.priority ?? "medium") as Decision["priority"],
      deadline: body.deadline ? String(body.deadline) : undefined,
      options: ensureArray(body.options, "decision.options", []),
      createdBy: actor.userId
    };
    state.decisions.push(decision);
    this.store.save();
    this.store.audit(actor, "decision.create", "decision", decision.id, undefined, decision);
    return clone(decision);
  }

  getDecision(id: string, actor: RequestActor): Decision {
    const decision = this.store.getState().decisions.find((d) => d.id === id && d.tenantId === actor.tenantId);
    if (!decision) notFound("Decision not found");
    return clone(decision);
  }

  updateDecision(id: string, input: unknown, actor: RequestActor): Decision {
    const body = ensureObject(input, "decision");
    const state = this.store.getState();
    const decision = state.decisions.find((d) => d.id === id && d.tenantId === actor.tenantId);
    if (!decision) notFound("Decision not found");
    const before = clone(decision);
    if (body.title) decision.title = String(body.title);
    if (body.description) decision.description = String(body.description);
    if (body.status) decision.status = String(body.status) as Decision["status"];
    if (body.ownerId) decision.ownerId = String(body.ownerId);
    if (body.priority) decision.priority = String(body.priority) as Decision["priority"];
    if (body.deadline) decision.deadline = String(body.deadline);
    if (body.options) decision.options = ensureArray(body.options, "decision.options");
    if (body.selectedOptionId) decision.selectedOptionId = String(body.selectedOptionId);
    if (body.rationale) decision.rationale = String(body.rationale);
    if (body.approvedBy) decision.approvedBy = String(body.approvedBy);
    if (body.decidedAt) decision.decidedAt = String(body.decidedAt);
    if (body.impact) decision.impact = String(body.impact);
    if (body.risks) decision.risks = String(body.risks);
    decision.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "decision.update", "decision", decision.id, before, decision);
    return clone(decision);
  }

  listExceptions(actor: RequestActor, query?: URLSearchParams): GovernanceException[] {
    const status = pickQuery(query, "status");
    return clone(this.store.getState().exceptions.filter((e) => {
      if (e.tenantId !== actor.tenantId) return false;
      if (status && e.status !== status) return false;
      return true;
    }));
  }

  createException(input: unknown, actor: RequestActor): GovernanceException {
    const body = ensureObject(input, "exception");
    const state = this.store.getState();
    const exception: GovernanceException = {
      id: newId("exception"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      exceptionNumber: ensureString(body.exceptionNumber, "exception.exceptionNumber"),
      title: ensureString(body.title, "exception.title"),
      description: ensureString(body.description, "exception.description"),
      exceptionType: String(body.exceptionType ?? "other") as GovernanceException["exceptionType"],
      relatedPolicyId: body.relatedPolicyId ? String(body.relatedPolicyId) : undefined,
      relatedResolutionId: body.relatedResolutionId ? String(body.relatedResolutionId) : undefined,
      requestedBy: actor.userId,
      requestedByName: body.requestedByName ? String(body.requestedByName) : actor.userId,
      status: "pending",
      riskAssessment: body.riskAssessment ? String(body.riskAssessment) : undefined,
      expiryDate: body.expiryDate ? String(body.expiryDate) : undefined,
      conditions: body.conditions ? String(body.conditions) : undefined,
      metadata: optionalObject(body.metadata)
    };
    state.exceptions.push(exception);
    this.store.save();
    this.store.audit(actor, "exception.create", "exception", exception.id, undefined, exception);
    return clone(exception);
  }

  updateException(id: string, input: unknown, actor: RequestActor): GovernanceException {
    const body = ensureObject(input, "exception");
    const state = this.store.getState();
    const exception = state.exceptions.find((e) => e.id === id && e.tenantId === actor.tenantId);
    if (!exception) notFound("Exception not found");
    const before = clone(exception);
    if (body.status) exception.status = String(body.status) as GovernanceException["status"];
    if (body.approvedBy) exception.approvedBy = String(body.approvedBy);
    if (body.approvedAt) exception.approvedAt = String(body.approvedAt);
    if (body.riskAssessment) exception.riskAssessment = String(body.riskAssessment);
    if (body.expiryDate) exception.expiryDate = String(body.expiryDate);
    if (body.conditions) exception.conditions = String(body.conditions);
    if (body.metadata) exception.metadata = optionalObject(body.metadata);
    exception.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "exception.update", "exception", exception.id, before, exception);
    return clone(exception);
  }

  listRiskOwnerships(actor: RequestActor, query?: URLSearchParams): RiskOwnership[] {
    const status = pickQuery(query, "status");
    const severity = pickQuery(query, "severity");
    return clone(this.store.getState().riskOwnerships.filter((r) => {
      if (r.tenantId !== actor.tenantId) return false;
      if (status && r.status !== status) return false;
      if (severity && r.severity !== severity) return false;
      return true;
    }));
  }

  createRiskOwnership(input: unknown, actor: RequestActor): RiskOwnership {
    const body = ensureObject(input, "risk");
    const state = this.store.getState();
    const risk: RiskOwnership = {
      id: newId("risk"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      riskId: ensureString(body.riskId, "risk.riskId"),
      title: ensureString(body.title, "risk.title"),
      description: body.description ? String(body.description) : undefined,
      category: String(body.category ?? "operational") as RiskOwnership["category"],
      severity: String(body.severity ?? "medium") as RiskOwnership["severity"],
      likelihood: String(body.likelihood ?? "possible") as RiskOwnership["likelihood"],
      status: "identified",
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      mitigationPlan: body.mitigationPlan ? String(body.mitigationPlan) : undefined,
      reviewDate: body.reviewDate ? String(body.reviewDate) : undefined
    };
    state.riskOwnerships.push(risk);
    this.store.save();
    this.store.audit(actor, "risk.create", "riskOwnership", risk.id, undefined, risk);
    return clone(risk);
  }

  updateRiskOwnership(id: string, input: unknown, actor: RequestActor): RiskOwnership {
    const body = ensureObject(input, "risk");
    const state = this.store.getState();
    const risk = state.riskOwnerships.find((r) => r.id === id && r.tenantId === actor.tenantId);
    if (!risk) notFound("Risk ownership not found");
    const before = clone(risk);
    if (body.title) risk.title = String(body.title);
    if (body.description) risk.description = String(body.description);
    if (body.category) risk.category = String(body.category) as RiskOwnership["category"];
    if (body.severity) risk.severity = String(body.severity) as RiskOwnership["severity"];
    if (body.likelihood) risk.likelihood = String(body.likelihood) as RiskOwnership["likelihood"];
    if (body.status) risk.status = String(body.status) as RiskOwnership["status"];
    if (body.ownerId) risk.ownerId = String(body.ownerId);
    if (body.mitigationPlan) risk.mitigationPlan = String(body.mitigationPlan);
    if (body.reviewDate) risk.reviewDate = String(body.reviewDate);
    if (body.acceptanceDate) risk.acceptanceDate = String(body.acceptanceDate);
    if (body.acceptedBy) risk.acceptedBy = String(body.acceptedBy);
    risk.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "risk.update", "riskOwnership", risk.id, before, risk);
    return clone(risk);
  }

  listRACIMatrices(actor: RequestActor): RACIMatrix[] {
    return clone(this.store.getState().raciMatrices.filter((r) => r.tenantId === actor.tenantId));
  }

  createRACIMatrix(input: unknown, actor: RequestActor): RACIMatrix {
    const body = ensureObject(input, "raciMatrix");
    const state = this.store.getState();
    const matrix: RACIMatrix = {
      id: newId("raci"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: ensureString(body.key, "raciMatrix.key"),
      name: ensureString(body.name, "raciMatrix.name"),
      description: body.description ? String(body.description) : undefined,
      processName: ensureString(body.processName, "raciMatrix.processName"),
      items: ensureArray(body.items, "raciMatrix.items", []),
      status: "active",
      createdBy: actor.userId
    };
    state.raciMatrices.push(matrix);
    this.store.save();
    this.store.audit(actor, "raci.create", "raciMatrix", matrix.id, undefined, matrix);
    return clone(matrix);
  }

  listApprovalMatrices(actor: RequestActor): ApprovalMatrix[] {
    return clone(this.store.getState().approvalMatrices.filter((a) => a.tenantId === actor.tenantId));
  }

  createApprovalMatrix(input: unknown, actor: RequestActor): ApprovalMatrix {
    const body = ensureObject(input, "approvalMatrix");
    const state = this.store.getState();
    const matrix: ApprovalMatrix = {
      id: newId("approval"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: ensureString(body.key, "approvalMatrix.key"),
      name: ensureString(body.name, "approvalMatrix.name"),
      description: body.description ? String(body.description) : undefined,
      category: String(body.category ?? "other") as ApprovalMatrix["category"],
      rules: ensureArray(body.rules, "approvalMatrix.rules", []),
      status: "active",
      createdBy: actor.userId
    };
    state.approvalMatrices.push(matrix);
    this.store.save();
    this.store.audit(actor, "approval.create", "approvalMatrix", matrix.id, undefined, matrix);
    return clone(matrix);
  }

  listReviews(actor: RequestActor, query?: URLSearchParams): GovernanceReview[] {
    const status = pickQuery(query, "status");
    return clone(this.store.getState().reviews.filter((r) => {
      if (r.tenantId !== actor.tenantId) return false;
      if (status && r.status !== status) return false;
      return true;
    }));
  }

  createReview(input: unknown, actor: RequestActor): GovernanceReview {
    const body = ensureObject(input, "review");
    const state = this.store.getState();
    const review: GovernanceReview = {
      id: newId("review"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      reviewType: String(body.reviewType ?? "quarterly") as GovernanceReview["reviewType"],
      title: ensureString(body.title, "review.title"),
      description: body.description ? String(body.description) : undefined,
      status: "planned",
      scheduledAt: ensureString(body.scheduledAt, "review.scheduledAt"),
      reviewerIds: ensureArray(body.reviewerIds, "review.reviewerIds", []),
      areas: ensureArray(body.areas, "review.areas", []),
      findings: [],
      actionItems: []
    };
    state.reviews.push(review);
    this.store.save();
    this.store.audit(actor, "review.create", "review", review.id, undefined, review);
    return clone(review);
  }

  addReviewFinding(reviewId: string, input: unknown, actor: RequestActor): ReviewFinding {
    const body = ensureObject(input, "finding");
    const state = this.store.getState();
    const review = state.reviews.find((r) => r.id === reviewId && r.tenantId === actor.tenantId);
    if (!review) notFound("Review not found");
    const finding: ReviewFinding = {
      id: newId("finding"),
      severity: String(body.severity ?? "medium") as ReviewFinding["severity"],
      description: ensureString(body.description, "finding.description"),
      recommendation: body.recommendation ? String(body.recommendation) : undefined,
      status: "open"
    };
    review.findings.push(finding);
    review.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "review.finding.add", "review", review.id, undefined, { findingId: finding.id });
    return clone(finding);
  }

  addReviewActionItem(reviewId: string, input: unknown, actor: RequestActor): ReviewActionItem {
    const body = ensureObject(input, "actionItem");
    const state = this.store.getState();
    const review = state.reviews.find((r) => r.id === reviewId && r.tenantId === actor.tenantId);
    if (!review) notFound("Review not found");
    const actionItem: ReviewActionItem = {
      id: newId("action"),
      title: ensureString(body.title, "actionItem.title"),
      description: body.description ? String(body.description) : undefined,
      assigneeId: body.assigneeId ? String(body.assigneeId) : undefined,
      assigneeName: body.assigneeName ? String(body.assigneeName) : undefined,
      dueDate: body.dueDate ? String(body.dueDate) : undefined,
      status: "pending"
    };
    review.actionItems.push(actionItem);
    review.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "review.action.add", "review", review.id, undefined, { actionItemId: actionItem.id });
    return clone(actionItem);
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((a) => a.tenantId === actor.tenantId));
  }

  listEvents(actor: RequestActor) {
    return clone(this.store.getState().events.filter((e) => e.tenantId === actor.tenantId));
  }
}
