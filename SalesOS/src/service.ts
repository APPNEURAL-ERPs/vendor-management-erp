import { DataStore } from "./core/datastore";
import {
  Account,
  ActivityType,
  Contact,
  Deal,
  DealStage,
  FollowUpTask,
  FollowUpStatus,
  FollowUpPriority,
  Lead,
  LeadScore,
  LeadSource,
  LeadStatus,
  LostDealAnalysis,
  LostDealReason,
  Pipeline,
  PipelineStage,
  Proposal,
  ProposalLineItem,
  ProposalSection,
  ProposalStatus,
  Quote,
  QuoteLineItem,
  RequestActor,
  SalesActivity,
  SalesForecast,
  SalesOverview,
  SalesReport,
  SalesState,
  SalesTarget,
  TargetPeriod,
  TargetType
} from "./types";
import { badRequest, conflict, countBy, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, newId, notFound, nowIso, optionalObject, pickQuery, plusDays } from "./core/utils";
import { isExpired } from "./core/id";
import { clone } from "./core/utils";

const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
  { name: "lead", displayName: "Lead", order: 1, probability: 10 },
  { name: "qualified", displayName: "Qualified", order: 2, probability: 25 },
  { name: "discovery", displayName: "Discovery", order: 3, probability: 40 },
  { name: "solution_fit", displayName: "Solution Fit", order: 4, probability: 60 },
  { name: "proposal", displayName: "Proposal", order: 5, probability: 75 },
  { name: "negotiation", displayName: "Negotiation", order: 6, probability: 90 },
  { name: "verbal_approval", displayName: "Verbal Approval", order: 7, probability: 95 },
  { name: "contract", displayName: "Contract", order: 8, probability: 98 },
  { name: "won", displayName: "Won", order: 9, probability: 100 },
  { name: "lost", displayName: "Lost", order: 10, probability: 0 }
];

export class SalesService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "SalesOS service is ready";
  }

  overview(actor: RequestActor): SalesOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    
    const leads = state.leads.filter((l) => l.tenantId === tenant);
    const deals = state.deals.filter((d) => d.tenantId === tenant);
    const activities = state.activities.filter((a) => a.tenantId === tenant);
    const followUps = state.followUps.filter((f) => f.tenantId === tenant);
    const proposals = state.proposals.filter((p) => p.tenantId === tenant);
    const targets = state.targets.filter((t) => t.tenantId === tenant);
    const forecasts = state.forecasts.filter((f) => f.tenantId === tenant);

    const openDeals = deals.filter((d) => !["won", "lost"].includes(d.stage));
    const wonDeals = deals.filter((d) => d.stage === "won");
    const lostDeals = deals.filter((d) => d.stage === "lost");
    const qualifiedLeads = leads.filter((l) => ["qualified", "discovery_scheduled", "proposal_needed", "proposal_sent", "negotiation"].includes(l.status));

    const pipelineByStage: Record<string, { count: number; value: number }> = {};
    for (const deal of openDeals) {
      const stage = deal.stage;
      if (!pipelineByStage[stage]) pipelineByStage[stage] = { count: 0, value: 0 };
      pipelineByStage[stage].count++;
      pipelineByStage[stage].value += deal.value;
    }

    const pendingFollowUps = followUps.filter((f) => f.status === "pending");
    const today = new Date().toISOString().split("T")[0];
    const dueTodayFollowUps = pendingFollowUps.filter((f) => f.dueDate.startsWith(today));
    const overdueFollowUps = pendingFollowUps.filter((f) => f.dueDate < today && !f.dueDate.startsWith(today));

    const totalTargetValue = targets.filter((t) => t.status === "active").reduce((sum, t) => sum + t.targetValue, 0);
    const totalCurrentValue = targets.filter((t) => t.status === "active").reduce((sum, t) => sum + t.currentValue, 0);
    const achievementPercent = totalTargetValue > 0 ? Math.round((totalCurrentValue / totalTargetValue) * 100) : 0;

    const totalForecastValue = forecasts.filter((f) => f.status !== "draft").reduce((sum, f) => sum + f.totalValue, 0);
    const totalWeightedValue = forecasts.filter((f) => f.status !== "draft").reduce((sum, f) => sum + f.totalWeightedValue, 0);

    const leadToQualified = leads.length > 0 ? Math.round((qualifiedLeads.length / leads.length) * 100) : 0;
    const qualifiedToDeal = qualifiedLeads.length > 0 ? Math.round((openDeals.length / qualifiedLeads.length) * 100) : 0;
    const dealToWon = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;

    return {
      leads: {
        total: leads.length,
        qualified: qualifiedLeads.length,
        byStatus: countBy(leads, "status")
      },
      deals: {
        total: deals.length,
        open: openDeals.length,
        won: wonDeals.length,
        lost: lostDeals.length,
        value: openDeals.reduce((sum, d) => sum + d.value, 0)
      },
      pipeline: { total: openDeals.length, byStage: pipelineByStage },
      activities: { total: activities.length, byType: countBy(activities, "type") },
      followUps: {
        total: followUps.length,
        pending: pendingFollowUps.length,
        overdue: overdueFollowUps.length,
        dueToday: dueTodayFollowUps.length
      },
      proposals: {
        total: proposals.length,
        pending: proposals.filter((p) => ["sent", "viewed", "negotiating"].includes(p.status)).length,
        accepted: proposals.filter((p) => p.status === "accepted").length,
        rejected: proposals.filter((p) => p.status === "rejected").length
      },
      targets: { total: targets.length, active: targets.filter((t) => t.status === "active").length, achievementPercent },
      forecast: { total: totalForecastValue, weighted: totalWeightedValue },
      conversion: { leadToQualified, qualifiedToDeal, dealToWon }
    };
  }

  listLeads(actor: RequestActor, query?: URLSearchParams): Lead[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");
    const source = pickQuery(query, "source");
    const ownerId = pickQuery(query, "ownerId");
    
    return clone(this.store.getState().leads.filter((lead) => {
      if (lead.tenantId !== actor.tenantId) return false;
      if (search && !`${lead.name} ${lead.email} ${lead.company ?? ""}`.toLowerCase().includes(search)) return false;
      if (status && lead.status !== status) return false;
      if (source && lead.source !== source) return false;
      if (ownerId && lead.ownerId !== ownerId) return false;
      return true;
    }));
  }

  getLead(id: string, actor: RequestActor): Lead {
    const lead = this.store.getState().leads.find((l) => l.id === id && l.tenantId === actor.tenantId);
    if (!lead) notFound("Lead not found");
    return clone(lead);
  }

  createLead(input: unknown, actor: RequestActor): Lead {
    const body = ensureObject(input, "lead");
    const state = this.store.getState();
    const email = ensureString(body.email, "lead.email");
    
    if (state.leads.some((l) => l.tenantId === actor.tenantId && l.email.toLowerCase() === email.toLowerCase())) {
      conflict(`Lead with email '${email}' already exists`);
    }

    const score = this.calculateLeadScore(body);
    
    const lead: Lead = {
      id: newId("lead"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: ensureString(body.key, "lead.key", `lead_${Date.now()}`),
      name: ensureString(body.name, "lead.name"),
      email,
      phone: body.phone ? String(body.phone) : undefined,
      company: body.company ? String(body.company) : undefined,
      jobTitle: body.jobTitle ? String(body.jobTitle) : undefined,
      source: String(body.source ?? "manual_entry") as LeadSource,
      status: String(body.status ?? "new") as LeadStatus,
      score,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      estimatedValue: body.estimatedValue ? ensureNumber(body.estimatedValue, "lead.estimatedValue") : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      tags: ensureArray<string>(body.tags, "lead.tags", []),
      metadata: optionalObject(body.metadata)
    };

    state.leads.unshift(lead);
    this.store.save();
    this.store.audit(actor, "lead.create", "lead", lead.id, undefined, lead);
    this.emitEvent(actor, "sales.lead.created", { leadId: lead.id, leadName: lead.name, source: lead.source });
    return clone(lead);
  }

  updateLead(id: string, input: unknown, actor: RequestActor): Lead {
    const body = ensureObject(input, "lead");
    const state = this.store.getState();
    const lead = state.leads.find((l) => l.id === id && l.tenantId === actor.tenantId);
    if (!lead) notFound("Lead not found");

    const before = clone(lead);
    
    if (body.name) lead.name = ensureString(body.name, "lead.name");
    if (body.email) lead.email = ensureString(body.email, "lead.email");
    if (body.phone !== undefined) lead.phone = body.phone ? String(body.phone) : undefined;
    if (body.company !== undefined) lead.company = body.company ? String(body.company) : undefined;
    if (body.jobTitle !== undefined) lead.jobTitle = body.jobTitle ? String(body.jobTitle) : undefined;
    if (body.source) lead.source = String(body.source) as LeadSource;
    if (body.status) {
      lead.status = String(body.status) as LeadStatus;
      if (lead.status === "qualified") {
        this.emitEvent(actor, "sales.lead.qualified", { leadId: lead.id, leadName: lead.name });
      }
    }
    if (body.ownerId !== undefined) lead.ownerId = body.ownerId ? String(body.ownerId) : undefined;
    if (body.estimatedValue !== undefined) lead.estimatedValue = body.estimatedValue ? ensureNumber(body.estimatedValue, "lead.estimatedValue") : undefined;
    if (body.notes !== undefined) lead.notes = body.notes ? String(body.notes) : undefined;
    if (body.tags) lead.tags = ensureArray<string>(body.tags, "lead.tags", []);
    if (body.metadata) lead.metadata = { ...lead.metadata, ...optionalObject(body.metadata) };

    lead.score = this.calculateLeadScore(lead);
    lead.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "lead.update", "lead", lead.id, before, lead);
    return clone(lead);
  }

  private calculateLeadScore(leadData: any): LeadScore {
    let fit = 50;
    let intent = 50;
    let engagement = 50;
    let budget = 50;
    let urgency = 50;
    const reasons: string[] = [];

    if (leadData.company) {
      fit += 10;
      reasons.push("Has company name");
    }
    if (leadData.jobTitle) {
      fit += 10;
      reasons.push("Has job title");
    }
    if (leadData.estimatedValue && leadData.estimatedValue > 50000) {
      budget += 20;
      reasons.push("High estimated value");
    }
    if (leadData.source === "referral" || leadData.source === "partner") {
      intent += 15;
      engagement += 15;
      reasons.push("Warm source: " + leadData.source);
    }
    if (leadData.tags && leadData.tags.length > 0) {
      engagement += 10;
      reasons.push("Has tags");
    }

    const total = Math.min(100, fit + intent + engagement + budget + urgency) / 5;

    return { total: Math.round(total), fit: Math.round(fit), intent: Math.round(intent), engagement: Math.round(engagement), budget: Math.round(budget), urgency: Math.round(urgency), reasons };
  }

  listContacts(actor: RequestActor, query?: URLSearchParams): Contact[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const accountId = pickQuery(query, "accountId");
    const leadId = pickQuery(query, "leadId");
    
    return clone(this.store.getState().contacts.filter((contact) => {
      if (contact.tenantId !== actor.tenantId) return false;
      if (search && !`${contact.firstName} ${contact.lastName} ${contact.email}`.toLowerCase().includes(search)) return false;
      if (accountId && contact.accountId !== accountId) return false;
      if (leadId && contact.leadId !== leadId) return false;
      return true;
    }));
  }

  getContact(id: string, actor: RequestActor): Contact {
    const contact = this.store.getState().contacts.find((c) => c.id === id && c.tenantId === actor.tenantId);
    if (!contact) notFound("Contact not found");
    return clone(contact);
  }

  createContact(input: unknown, actor: RequestActor): Contact {
    const body = ensureObject(input, "contact");
    const contact: Contact = {
      id: newId("contact"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: ensureString(body.key, "contact.key", `contact_${Date.now()}`),
      firstName: ensureString(body.firstName, "contact.firstName"),
      lastName: ensureString(body.lastName, "contact.lastName"),
      email: ensureString(body.email, "contact.email"),
      phone: body.phone ? String(body.phone) : undefined,
      jobTitle: body.jobTitle ? String(body.jobTitle) : undefined,
      department: body.department ? String(body.department) : undefined,
      role: String(body.role ?? "influencer") as any,
      accountId: body.accountId ? String(body.accountId) : undefined,
      leadId: body.leadId ? String(body.leadId) : undefined,
      isPrimary: ensureBoolean(body.isPrimary, false),
      notes: body.notes ? String(body.notes) : undefined,
      metadata: optionalObject(body.metadata)
    };

    this.store.getState().contacts.unshift(contact);
    this.store.save();
    this.store.audit(actor, "contact.create", "contact", contact.id, undefined, contact);
    return clone(contact);
  }

  listAccounts(actor: RequestActor, query?: URLSearchParams): Account[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    return clone(this.store.getState().accounts.filter((account) => {
      if (account.tenantId !== actor.tenantId) return false;
      if (search && !`${account.name} ${account.industry ?? ""} ${account.website ?? ""}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  getAccount(id: string, actor: RequestActor): Account {
    const account = this.store.getState().accounts.find((a) => a.id === id && a.tenantId === actor.tenantId);
    if (!account) notFound("Account not found");
    return clone(account);
  }

  createAccount(input: unknown, actor: RequestActor): Account {
    const body = ensureObject(input, "account");
    const account: Account = {
      id: newId("account"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: ensureString(body.key, "account.key", `account_${Date.now()}`),
      name: ensureString(body.name, "account.name"),
      industry: body.industry ? String(body.industry) : undefined,
      website: body.website ? String(body.website) : undefined,
      size: body.size ? String(body.size) as any : undefined,
      location: body.location ? String(body.location) : undefined,
      revenue: body.revenue ? ensureNumber(body.revenue, "account.revenue") : undefined,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      status: String(body.status ?? "active") as any,
      notes: body.notes ? String(body.notes) : undefined,
      tags: ensureArray<string>(body.tags, "account.tags", []),
      metadata: optionalObject(body.metadata)
    };

    this.store.getState().accounts.unshift(account);
    this.store.save();
    this.store.audit(actor, "account.create", "account", account.id, undefined, account);
    return clone(account);
  }

  listDeals(actor: RequestActor, query?: URLSearchParams): Deal[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const stage = pickQuery(query, "stage");
    const ownerId = pickQuery(query, "ownerId");
    const accountId = pickQuery(query, "accountId");
    
    return clone(this.store.getState().deals.filter((deal) => {
      if (deal.tenantId !== actor.tenantId) return false;
      if (search && !`${deal.title} ${deal.key}`.toLowerCase().includes(search)) return false;
      if (stage && deal.stage !== stage) return false;
      if (ownerId && deal.ownerId !== ownerId) return false;
      if (accountId && deal.accountId !== accountId) return false;
      return true;
    }));
  }

  getDeal(id: string, actor: RequestActor): Deal {
    const deal = this.store.getState().deals.find((d) => d.id === id && d.tenantId === actor.tenantId);
    if (!deal) notFound("Deal not found");
    return clone(deal);
  }

  createDeal(input: unknown, actor: RequestActor): Deal {
    const body = ensureObject(input, "deal");
    const deal: Deal = {
      id: newId("deal"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: ensureString(body.key, "deal.key", `deal_${Date.now()}`),
      title: ensureString(body.title, "deal.title"),
      value: ensureNumber(body.value, "deal.value"),
      stage: String(body.stage ?? "lead") as DealStage,
      probability: body.probability ? ensureNumber(body.probability, "deal.probability") : this.getStageProbability(String(body.stage ?? "lead")),
      expectedCloseDate: body.expectedCloseDate ? String(body.expectedCloseDate) : undefined,
      actualCloseDate: body.actualCloseDate ? String(body.actualCloseDate) : undefined,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      accountId: body.accountId ? String(body.accountId) : undefined,
      leadId: body.leadId ? String(body.leadId) : undefined,
      contactIds: ensureArray<string>(body.contactIds, "deal.contactIds", []),
      lostReason: body.lostReason ? String(body.lostReason) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      tags: ensureArray<string>(body.tags, "deal.tags", []),
      metadata: optionalObject(body.metadata)
    };

    this.store.getState().deals.unshift(deal);
    this.store.save();
    this.store.audit(actor, "deal.create", "deal", deal.id, undefined, deal);
    return clone(deal);
  }

  updateDeal(id: string, input: unknown, actor: RequestActor): Deal {
    const body = ensureObject(input, "deal");
    const state = this.store.getState();
    const deal = state.deals.find((d) => d.id === id && d.tenantId === actor.tenantId);
    if (!deal) notFound("Deal not found");

    const before = clone(deal);
    const previousStage = deal.stage;

    if (body.title) deal.title = ensureString(body.title, "deal.title");
    if (body.value !== undefined) deal.value = ensureNumber(body.value, "deal.value");
    if (body.stage) {
      deal.stage = String(body.stage) as DealStage;
      deal.probability = body.probability ? ensureNumber(body.probability, "deal.probability") : this.getStageProbability(deal.stage);
      if (deal.stage === "won") {
        deal.actualCloseDate = nowIso();
        this.emitEvent(actor, "sales.deal.won", { dealId: deal.id, dealTitle: deal.title, value: deal.value });
      } else if (deal.stage === "lost") {
        deal.actualCloseDate = nowIso();
        deal.lostReason = body.lostReason ? String(body.lostReason) : undefined;
        this.emitEvent(actor, "sales.deal.lost", { dealId: deal.id, dealTitle: deal.title, reason: deal.lostReason });
      }
    }
    if (body.expectedCloseDate !== undefined) deal.expectedCloseDate = body.expectedCloseDate ? String(body.expectedCloseDate) : undefined;
    if (body.ownerId !== undefined) deal.ownerId = body.ownerId ? String(body.ownerId) : undefined;
    if (body.accountId !== undefined) deal.accountId = body.accountId ? String(body.accountId) : undefined;
    if (body.leadId !== undefined) deal.leadId = body.leadId ? String(body.leadId) : undefined;
    if (body.contactIds) deal.contactIds = ensureArray<string>(body.contactIds, "deal.contactIds", []);
    if (body.lostReason !== undefined) deal.lostReason = body.lostReason ? String(body.lostReason) : undefined;
    if (body.notes !== undefined) deal.notes = body.notes ? String(body.notes) : undefined;
    if (body.tags) deal.tags = ensureArray<string>(body.tags, "deal.tags", []);

    deal.updatedAt = nowIso();

    if (previousStage !== deal.stage) {
      this.emitEvent(actor, "sales.deal.stage.changed", { dealId: deal.id, dealTitle: deal.title, from: previousStage, to: deal.stage });
    }

    this.store.save();
    this.store.audit(actor, "deal.update", "deal", deal.id, before, deal);
    return clone(deal);
  }

  private getStageProbability(stage: DealStage): number {
    const pipeline = this.store.getState().pipelines.find((p) => p.isDefault && p.tenantId === this.store.getState().deals[0]?.tenantId);
    if (pipeline) {
      const stageConfig = pipeline.stages.find((s) => s.name === stage);
      if (stageConfig) return stageConfig.probability;
    }
    const defaultStage = DEFAULT_PIPELINE_STAGES.find((s) => s.name === stage);
    return defaultStage?.probability ?? 50;
  }

  listPipelines(actor: RequestActor): Pipeline[] {
    return clone(this.store.getState().pipelines.filter((p) => p.tenantId === actor.tenantId));
  }

  createPipeline(input: unknown, actor: RequestActor): Pipeline {
    const body = ensureObject(input, "pipeline");
    const pipeline: Pipeline = {
      id: newId("pipeline"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: ensureString(body.key, "pipeline.key", `pipeline_${Date.now()}`),
      name: ensureString(body.name, "pipeline.name"),
      description: body.description ? String(body.description) : undefined,
      stages: ensureArray(body.stages, "pipeline.stages", DEFAULT_PIPELINE_STAGES) as any,
      isDefault: ensureBoolean(body.isDefault, false),
      status: String(body.status ?? "active") as any
    };

    if (pipeline.isDefault) {
      this.store.getState().pipelines.forEach((p) => { if (p.tenantId === actor.tenantId) p.isDefault = false; });
    }

    this.store.getState().pipelines.push(pipeline);
    this.store.save();
    this.store.audit(actor, "pipeline.create", "pipeline", pipeline.id, undefined, pipeline);
    return clone(pipeline);
  }

  listActivities(actor: RequestActor, query?: URLSearchParams): SalesActivity[] {
    const type = pickQuery(query, "type");
    const dealId = pickQuery(query, "dealId");
    const leadId = pickQuery(query, "leadId");
    
    return clone(this.store.getState().activities.filter((activity) => {
      if (activity.tenantId !== actor.tenantId) return false;
      if (type && activity.type !== type) return false;
      if (dealId && activity.dealId !== dealId) return false;
      if (leadId && activity.leadId !== leadId) return false;
      return true;
    }));
  }

  createActivity(input: unknown, actor: RequestActor): SalesActivity {
    const body = ensureObject(input, "activity");
    const activity: SalesActivity = {
      id: newId("activity"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: ensureString(body.key, "activity.key", `activity_${Date.now()}`),
      type: String(body.type) as ActivityType,
      subject: body.subject ? String(body.subject) : undefined,
      description: body.description ? String(body.description) : undefined,
      dealId: body.dealId ? String(body.dealId) : undefined,
      leadId: body.leadId ? String(body.leadId) : undefined,
      contactId: body.contactId ? String(body.contactId) : undefined,
      accountId: body.accountId ? String(body.accountId) : undefined,
      ownerId: body.ownerId ? String(body.ownerId) : actor.userId,
      duration: body.duration ? ensureNumber(body.duration, "activity.duration") : undefined,
      outcome: body.outcome ? String(body.outcome) : undefined,
      metadata: optionalObject(body.metadata)
    };

    this.store.getState().activities.unshift(activity);
    this.store.save();
    this.store.audit(actor, "activity.create", "activity", activity.id, undefined, activity);
    return clone(activity);
  }

  listFollowUps(actor: RequestActor, query?: URLSearchParams): FollowUpTask[] {
    const status = pickQuery(query, "status");
    const leadId = pickQuery(query, "leadId");
    const dealId = pickQuery(query, "dealId");
    
    return clone(this.store.getState().followUps.filter((followUp) => {
      if (followUp.tenantId !== actor.tenantId) return false;
      if (status && followUp.status !== status) return false;
      if (leadId && followUp.leadId !== leadId) return false;
      if (dealId && followUp.dealId !== dealId) return false;
      return true;
    }));
  }

  createFollowUp(input: unknown, actor: RequestActor): FollowUpTask {
    const body = ensureObject(input, "followUp");
    const followUp: FollowUpTask = {
      id: newId("followup"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: ensureString(body.key, "followUp.key", `followup_${Date.now()}`),
      subject: ensureString(body.subject, "followUp.subject"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "follow_up") as ActivityType,
      status: String(body.status ?? "pending") as FollowUpStatus,
      priority: String(body.priority ?? "medium") as FollowUpPriority,
      dueDate: body.dueDate ? String(body.dueDate) : plusDays(1),
      completedAt: body.completedAt ? String(body.completedAt) : undefined,
      leadId: body.leadId ? String(body.leadId) : undefined,
      dealId: body.dealId ? String(body.dealId) : undefined,
      contactId: body.contactId ? String(body.contactId) : undefined,
      accountId: body.accountId ? String(body.accountId) : undefined,
      ownerId: body.ownerId ? String(body.ownerId) : actor.userId,
      assignedTo: body.assignedTo ? String(body.assignedTo) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      metadata: optionalObject(body.metadata)
    };

    this.store.getState().followUps.unshift(followUp);
    this.store.save();
    this.store.audit(actor, "followup.create", "followUp", followUp.id, undefined, followUp);
    return clone(followUp);
  }

  updateFollowUp(id: string, input: unknown, actor: RequestActor): FollowUpTask {
    const body = ensureObject(input, "followUp");
    const state = this.store.getState();
    const followUp = state.followUps.find((f) => f.id === id && f.tenantId === actor.tenantId);
    if (!followUp) notFound("Follow-up not found");

    const before = clone(followUp);

    if (body.subject) followUp.subject = ensureString(body.subject, "followUp.subject");
    if (body.description !== undefined) followUp.description = body.description ? String(body.description) : undefined;
    if (body.type) followUp.type = String(body.type) as ActivityType;
    if (body.status) {
      followUp.status = String(body.status) as FollowUpStatus;
      if (followUp.status === "completed") {
        followUp.completedAt = nowIso();
      }
    }
    if (body.priority) followUp.priority = String(body.priority) as FollowUpPriority;
    if (body.dueDate) followUp.dueDate = String(body.dueDate);
    if (body.assignedTo !== undefined) followUp.assignedTo = body.assignedTo ? String(body.assignedTo) : undefined;
    if (body.notes !== undefined) followUp.notes = body.notes ? String(body.notes) : undefined;

    followUp.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "followup.update", "followUp", followUp.id, before, followUp);
    return clone(followUp);
  }

  listProposals(actor: RequestActor, query?: URLSearchParams): Proposal[] {
    const status = pickQuery(query, "status");
    const dealId = pickQuery(query, "dealId");
    
    return clone(this.store.getState().proposals.filter((proposal) => {
      if (proposal.tenantId !== actor.tenantId) return false;
      if (status && proposal.status !== status) return false;
      if (dealId && proposal.dealId !== dealId) return false;
      return true;
    }));
  }

  getProposal(id: string, actor: RequestActor): Proposal {
    const proposal = this.store.getState().proposals.find((p) => p.id === id && p.tenantId === actor.tenantId);
    if (!proposal) notFound("Proposal not found");
    return clone(proposal);
  }

  createProposal(input: unknown, actor: RequestActor): Proposal {
    const body = ensureObject(input, "proposal");
    const lineItems: ProposalLineItem[] = ensureArray(body.lineItems, "proposal.lineItems", []).map((item: any) => ({
      description: ensureString(item.description, "lineItem.description"),
      quantity: ensureNumber(item.quantity, "lineItem.quantity", 1),
      unitPrice: ensureNumber(item.unitPrice, "lineItem.unitPrice"),
      total: 0,
      metadata: optionalObject(item.metadata)
    }));
    lineItems.forEach((item) => { item.total = item.quantity * item.unitPrice; });

    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const discount = body.discount ? ensureNumber(body.discount, "proposal.discount") : 0;
    const tax = body.tax ? ensureNumber(body.tax, "proposal.tax") : 0;
    const total = subtotal - discount + tax;

    const proposal: Proposal = {
      id: newId("proposal"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: ensureString(body.key, "proposal.key", `proposal_${Date.now()}`),
      title: ensureString(body.title, "proposal.title"),
      status: String(body.status ?? "draft") as ProposalStatus,
      dealId: body.dealId ? String(body.dealId) : undefined,
      leadId: body.leadId ? String(body.leadId) : undefined,
      accountId: body.accountId ? String(body.accountId) : undefined,
      contactId: body.contactId ? String(body.contactId) : undefined,
      ownerId: body.ownerId ? String(body.ownerId) : actor.userId,
      validUntil: body.validUntil ? String(body.validUntil) : plusDays(30),
      sections: ensureArray(body.sections, "proposal.sections", []) as any,
      lineItems,
      subtotal,
      tax,
      discount,
      total,
      notes: body.notes ? String(body.notes) : undefined,
      sentAt: body.sentAt ? String(body.sentAt) : undefined,
      viewedAt: body.viewedAt ? String(body.viewedAt) : undefined,
      acceptedAt: body.acceptedAt ? String(body.acceptedAt) : undefined,
      rejectedAt: body.rejectedAt ? String(body.rejectedAt) : undefined,
      metadata: optionalObject(body.metadata)
    };

    this.store.getState().proposals.unshift(proposal);
    this.store.save();
    this.store.audit(actor, "proposal.create", "proposal", proposal.id, undefined, proposal);
    return clone(proposal);
  }

  updateProposal(id: string, input: unknown, actor: RequestActor): Proposal {
    const body = ensureObject(input, "proposal");
    const state = this.store.getState();
    const proposal = state.proposals.find((p) => p.id === id && p.tenantId === actor.tenantId);
    if (!proposal) notFound("Proposal not found");

    const before = clone(proposal);

    if (body.title) proposal.title = ensureString(body.title, "proposal.title");
    if (body.status) {
      proposal.status = String(body.status) as ProposalStatus;
      if (proposal.status === "sent") proposal.sentAt = nowIso();
      if (proposal.status === "viewed" && !proposal.viewedAt) proposal.viewedAt = nowIso();
      if (proposal.status === "accepted") proposal.acceptedAt = nowIso();
      if (proposal.status === "rejected") proposal.rejectedAt = nowIso();
    }
    if (body.validUntil) proposal.validUntil = String(body.validUntil);
    if (body.notes !== undefined) proposal.notes = body.notes ? String(body.notes) : undefined;

    proposal.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "proposal.update", "proposal", proposal.id, before, proposal);
    
    if (proposal.status === "sent") {
      this.emitEvent(actor, "sales.proposal.sent", { proposalId: proposal.id, proposalTitle: proposal.title, dealId: proposal.dealId });
    }
    
    return clone(proposal);
  }

  listTargets(actor: RequestActor): SalesTarget[] {
    return clone(this.store.getState().targets.filter((t) => t.tenantId === actor.tenantId));
  }

  createTarget(input: unknown, actor: RequestActor): SalesTarget {
    const body = ensureObject(input, "target");
    const target: SalesTarget = {
      id: newId("target"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: ensureString(body.key, "target.key", `target_${Date.now()}`),
      title: ensureString(body.title, "target.title"),
      type: String(body.type) as TargetType,
      period: String(body.period) as TargetPeriod,
      targetValue: ensureNumber(body.targetValue, "target.targetValue"),
      currentValue: body.currentValue ? ensureNumber(body.currentValue, "target.currentValue") : 0,
      startDate: body.startDate ? String(body.startDate) : new Date().toISOString().split("T")[0],
      endDate: body.endDate ? String(body.endDate) : plusDays(30).split("T")[0],
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      teamId: body.teamId ? String(body.teamId) : undefined,
      status: String(body.status ?? "active") as any,
      metadata: optionalObject(body.metadata)
    };

    this.store.getState().targets.unshift(target);
    this.store.save();
    this.store.audit(actor, "target.create", "target", target.id, undefined, target);
    return clone(target);
  }

  listForecasts(actor: RequestActor): SalesForecast[] {
    return clone(this.store.getState().forecasts.filter((f) => f.tenantId === actor.tenantId));
  }

  createForecast(input: unknown, actor: RequestActor): SalesForecast {
    const body = ensureObject(input, "forecast");
    const items = ensureArray(body.items, "forecast.items", []).map((item: any) => ({
      dealId: item.dealId ? String(item.dealId) : undefined,
      accountName: item.accountName ? String(item.accountName) : undefined,
      dealTitle: item.dealTitle ? String(item.dealTitle) : undefined,
      value: ensureNumber(item.value, "item.value", 0),
      probability: ensureNumber(item.probability, "item.probability", 50),
      weightedValue: 0,
      expectedCloseDate: item.expectedCloseDate ? String(item.expectedCloseDate) : undefined,
      stage: String(item.stage ?? "proposal") as DealStage,
      notes: item.notes ? String(item.notes) : undefined
    }));
    items.forEach((item) => { item.weightedValue = Math.round(item.value * (item.probability / 100)); });

    const totalValue = items.reduce((sum, item) => sum + item.value, 0);
    const totalWeightedValue = items.reduce((sum, item) => sum + item.weightedValue, 0);

    const forecast: SalesForecast = {
      id: newId("forecast"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: ensureString(body.key, "forecast.key", `forecast_${Date.now()}`),
      title: ensureString(body.title, "forecast.title"),
      period: String(body.period ?? "monthly") as any,
      startDate: body.startDate ? String(body.startDate) : new Date().toISOString().split("T")[0],
      endDate: body.endDate ? String(body.endDate) : plusDays(30).split("T")[0],
      status: String(body.status ?? "draft") as any,
      ownerId: body.ownerId ? String(body.ownerId) : actor.userId,
      totalValue,
      totalWeightedValue,
      items,
      assumptions: body.assumptions ? String(body.assumptions) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      submittedAt: body.submittedAt ? String(body.submittedAt) : undefined,
      approvedAt: body.approvedAt ? String(body.approvedAt) : undefined,
      metadata: optionalObject(body.metadata)
    };

    this.store.getState().forecasts.unshift(forecast);
    this.store.save();
    this.store.audit(actor, "forecast.create", "forecast", forecast.id, undefined, forecast);
    return clone(forecast);
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((log) => log.tenantId === actor.tenantId));
  }

  private emitEvent(actor: RequestActor, type: string, data: Record<string, unknown>): void {
    const event: any = {
      id: newId("event"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type,
      source: "SalesOS",
      data
    };
    this.store.getState().events.unshift(event);
  }
}
