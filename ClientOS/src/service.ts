import {
  Client, ClientContact, ClientCompany, Account, Requirement, Proposal,
  Contract, Project, Deliverable, Task, Meeting, Note, Document, Approval,
  SupportTicket, Invoice, HealthScore, SuccessPlan, Risk, ClientOverview,
  RequestActor, ClientStatus, MeetingType, SupportTicketStatus, PaymentStatus,
  TaskStatus
} from "./domain";
import { DataStore } from "./core/datastore";
import { newId, nowIso, plusDays } from "./core/id";
import { asArray, asNumber, badRequest, countBy, includesText, notFound, optionalString, requireString } from "./core/utils";

export class ClientService {
  constructor(private readonly store: DataStore) {}

  getOverview(actor: RequestActor): ClientOverview {
    const state = this.store.getState();
    const clients = state.clients.filter(c => c.tenantId === actor.tenantId);
    const projects = state.projects.filter(p => p.tenantId === actor.tenantId);
    const meetings = state.meetings.filter(m => m.tenantId === actor.tenantId);
    const deliverables = state.deliverables.filter(d => d.tenantId === actor.tenantId);
    const proposals = state.proposals.filter(p => p.tenantId === actor.tenantId);
    const contracts = state.contracts.filter(c => c.tenantId === actor.tenantId);
    const supportTickets = state.supportTickets.filter(t => t.tenantId === actor.tenantId);
    const invoices = state.invoices.filter(i => i.tenantId === actor.tenantId);
    const healthScores = state.healthScores.filter(h => h.tenantId === actor.tenantId);

    return {
      clients: {
        total: clients.length,
        byStatus: countBy(clients, "status")
      },
      accounts: {
        total: state.accounts.filter(a => a.tenantId === actor.tenantId).length,
        active: state.accounts.filter(a => a.tenantId === actor.tenantId && a.status === "active").length
      },
      projects: {
        total: projects.length,
        active: projects.filter(p => p.status === "active").length,
        completed: projects.filter(p => p.status === "completed").length
      },
      meetings: {
        scheduled: meetings.filter(m => m.status === "scheduled").length,
        completed: meetings.filter(m => m.status === "completed").length
      },
      deliverables: {
        pending: deliverables.filter(d => ["planned", "in_progress"].includes(d.status)).length,
        inReview: deliverables.filter(d => d.status === "in_review").length,
        approved: deliverables.filter(d => d.status === "approved").length,
        delivered: deliverables.filter(d => d.status === "delivered").length
      },
      proposals: {
        draft: proposals.filter(p => p.status === "draft").length,
        sent: proposals.filter(p => p.status === "sent").length,
        approved: proposals.filter(p => p.status === "approved").length,
        rejected: proposals.filter(p => p.status === "rejected").length
      },
      contracts: {
        active: contracts.filter(c => c.status === "active").length,
        expiring: contracts.filter(c => c.status === "active" && c.endDate && new Date(c.endDate) <= new Date(plusDays(30))).length,
        expired: contracts.filter(c => c.status === "expired").length
      },
      support: {
        open: supportTickets.filter(t => !["resolved", "closed"].includes(t.status)).length,
        resolved: supportTickets.filter(t => ["resolved", "closed"].includes(t.status)).length
      },
      invoices: {
        pending: invoices.filter(i => i.status === "pending").length,
        paid: invoices.filter(i => i.status === "paid").length,
        overdue: invoices.filter(i => i.status === "overdue").length
      },
      healthScores: {
        average: healthScores.length > 0
          ? Math.round(healthScores.reduce((sum, h) => sum + h.overallScore, 0) / healthScores.length)
          : 0,
        atRisk: healthScores.filter(h => h.riskLevel === "high" || h.riskLevel === "critical").length
      }
    };
  }

  listClients(actor: RequestActor, filters?: {
    status?: ClientStatus;
    search?: string;
    segment?: string;
    tags?: string[];
  }): Client[] {
    let clients = this.store.getState().clients.filter(c => c.tenantId === actor.tenantId);

    if (filters?.status) {
      clients = clients.filter(c => c.status === filters.status);
    }

    if (filters?.search) {
      const query = filters.search.toLowerCase();
      clients = clients.filter(c =>
        includesText(c.name, query) ||
        includesText(c.notes, query) ||
        c.tags.some(tag => includesText(tag, query))
      );
    }

    if (filters?.segment) {
      clients = clients.filter(c => c.segment === filters.segment);
    }

    if (filters?.tags && filters.tags.length > 0) {
      clients = clients.filter(c =>
        filters.tags!.some(tag => c.tags.includes(tag))
      );
    }

    return clients;
  }

  getClient(actor: RequestActor, clientId: string): Client {
    const client = this.store.getState().clients.find(c => c.id === clientId && c.tenantId === actor.tenantId);
    if (!client) {
      notFound(`Client ${clientId} not found`);
    }
    return client!;
  }

  createClient(actor: RequestActor, input: {
    name: string;
    status?: ClientStatus;
    ownerId?: string;
    segment?: string;
    priority?: string;
    tags?: string[];
    source?: string;
    notes?: string;
  }): Client {
    const now = nowIso();
    const client: Client = {
      id: newId("client"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name: requireString(input, "name"),
      status: input.status ?? "lead",
      ownerId: input.ownerId,
      segment: input.segment,
      priority: input.priority as any,
      tags: asArray(input.tags),
      source: input.source,
      notes: input.notes
    };

    this.store.getState().clients.push(client);
    this.store.audit(actor, "client.created", "Client", client.id);
    this.store.save();

    return client;
  }

  updateClient(actor: RequestActor, clientId: string, updates: Partial<Client>): Client {
    const state = this.store.getState();
    const index = state.clients.findIndex(c => c.id === clientId && c.tenantId === actor.tenantId);
    if (index === -1) {
      notFound(`Client ${clientId} not found`);
    }

    const before = { ...state.clients[index] };
    state.clients[index] = {
      ...state.clients[index],
      ...updates,
      updatedAt: nowIso()
    };

    this.store.audit(actor, "client.updated", "Client", clientId, before, state.clients[index]);
    this.store.save();

    return state.clients[index];
  }

  deleteClient(actor: RequestActor, clientId: string): void {
    const state = this.store.getState();
    const index = state.clients.findIndex(c => c.id === clientId && c.tenantId === actor.tenantId);
    if (index === -1) {
      notFound(`Client ${clientId} not found`);
    }

    state.clients.splice(index, 1);
    this.store.audit(actor, "client.deleted", "Client", clientId);
    this.store.save();
  }

  listContacts(actor: RequestActor, clientId: string): ClientContact[] {
    return this.store.getState().contacts.filter(
      c => c.tenantId === actor.tenantId && c.clientId === clientId
    );
  }

  createContact(actor: RequestActor, clientId: string, input: {
    name: string;
    email: string;
    phone?: string;
    role: string;
    isPrimary?: boolean;
  }): ClientContact {
    this.getClient(actor, clientId);

    const now = nowIso();
    const contact: ClientContact = {
      id: newId("contact"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      clientId,
      name: requireString(input, "name"),
      email: requireString(input, "email"),
      phone: input.phone,
      role: requireString(input, "role"),
      isPrimary: input.isPrimary ?? false,
      status: "active"
    };

    this.store.getState().contacts.push(contact);
    this.store.audit(actor, "contact.created", "Contact", contact.id);
    this.store.save();

    return contact;
  }

  listProjects(actor: RequestActor, clientId: string): Project[] {
    return this.store.getState().projects.filter(
      p => p.tenantId === actor.tenantId && p.clientId === clientId
    );
  }

  createProject(actor: RequestActor, clientId: string, input: {
    name: string;
    description?: string;
    startDate?: string;
    targetDate?: string;
    budget?: number;
    ownerId?: string;
    tags?: string[];
  }): Project {
    this.getClient(actor, clientId);

    const now = nowIso();
    const project: Project = {
      id: newId("project"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      clientId,
      name: requireString(input, "name"),
      description: input.description,
      status: "planning",
      startDate: input.startDate,
      targetDate: input.targetDate,
      budget: input.budget,
      ownerId: input.ownerId,
      tags: asArray(input.tags),
      metadata: {}
    };

    this.store.getState().projects.push(project);
    this.store.audit(actor, "project.created", "Project", project.id);
    this.store.save();

    return project;
  }

  listMeetings(actor: RequestActor, clientId?: string): Meeting[] {
    let meetings = this.store.getState().meetings.filter(m => m.tenantId === actor.tenantId);
    if (clientId) {
      meetings = meetings.filter(m => m.clientId === clientId);
    }
    return meetings;
  }

  createMeeting(actor: RequestActor, input: {
    clientId: string;
    projectId?: string;
    title: string;
    description?: string;
    type: MeetingType;
    scheduledAt: string;
    duration?: number;
    location?: string;
    meetingLink?: string;
    attendeeIds?: string[];
    attendeeNames?: string[];
  }): Meeting {
    this.getClient(actor, input.clientId);

    const now = nowIso();
    const meeting: Meeting = {
      id: newId("meeting"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      clientId: input.clientId,
      projectId: input.projectId,
      title: requireString(input, "title"),
      description: input.description,
      type: input.type,
      status: "scheduled",
      scheduledAt: requireString(input, "scheduledAt"),
      duration: input.duration,
      location: input.location,
      meetingLink: input.meetingLink,
      attendeeIds: asArray(input.attendeeIds),
      attendeeNames: asArray(input.attendeeNames),
      metadata: {}
    };

    this.store.getState().meetings.push(meeting);
    this.store.audit(actor, "meeting.created", "Meeting", meeting.id);
    this.store.save();

    return meeting;
  }

  updateMeeting(actor: RequestActor, meetingId: string, updates: Partial<Meeting>): Meeting {
    const state = this.store.getState();
    const index = state.meetings.findIndex(m => m.id === meetingId && m.tenantId === actor.tenantId);
    if (index === -1) {
      notFound(`Meeting ${meetingId} not found`);
    }

    const before = { ...state.meetings[index] };
    state.meetings[index] = {
      ...state.meetings[index],
      ...updates,
      updatedAt: nowIso()
    };

    this.store.audit(actor, "meeting.updated", "Meeting", meetingId, before, state.meetings[index]);
    this.store.save();

    return state.meetings[index];
  }

  listDeliverables(actor: RequestActor, projectId?: string): Deliverable[] {
    let deliverables = this.store.getState().deliverables.filter(d => d.tenantId === actor.tenantId);
    if (projectId) {
      deliverables = deliverables.filter(d => d.projectId === projectId);
    }
    return deliverables;
  }

  createDeliverable(actor: RequestActor, input: {
    projectId: string;
    clientId: string;
    title: string;
    description?: string;
    dueDate?: string;
    tags?: string[];
  }): Deliverable {
    const now = nowIso();
    const deliverable: Deliverable = {
      id: newId("deliverable"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      projectId: input.projectId,
      clientId: input.clientId,
      title: requireString(input, "title"),
      description: input.description,
      status: "planned",
      dueDate: input.dueDate,
      tags: asArray(input.tags),
      metadata: {}
    };

    this.store.getState().deliverables.push(deliverable);
    this.store.audit(actor, "deliverable.created", "Deliverable", deliverable.id);
    this.store.save();

    return deliverable;
  }

  listHealthScores(actor: RequestActor, clientId?: string): HealthScore[] {
    let scores = this.store.getState().healthScores.filter(h => h.tenantId === actor.tenantId);
    if (clientId) {
      scores = scores.filter(h => h.clientId === clientId);
    }
    return scores;
  }

  getHealthScore(actor: RequestActor, clientId: string): HealthScore | undefined {
    return this.store.getState().healthScores.find(
      h => h.clientId === clientId && h.tenantId === actor.tenantId
    );
  }

  updateHealthScore(actor: RequestActor, clientId: string, input: {
    overallScore: number;
    engagementScore?: number;
    paymentScore?: number;
    communicationScore?: number;
    satisfactionScore?: number;
    deliveryScore?: number;
    factors?: Array<{ factor: string; impact: "positive" | "negative" | "neutral"; weight: number; note?: string }>;
    risks?: string[];
    recommendations?: string[];
  }): HealthScore {
    this.getClient(actor, clientId);

    const state = this.store.getState();
    const existing = state.healthScores.find(h => h.clientId === clientId && h.tenantId === actor.tenantId);

    const now = nowIso();
    const riskLevel = this.calculateRiskLevel(input.overallScore, input.factors);

    const healthScore: HealthScore = {
      id: existing?.id ?? newId("health"),
      tenantId: actor.tenantId,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      clientId,
      overallScore: asNumber(input.overallScore),
      engagementScore: input.engagementScore ?? existing?.engagementScore ?? 70,
      paymentScore: input.paymentScore ?? existing?.paymentScore ?? 70,
      communicationScore: input.communicationScore ?? existing?.communicationScore ?? 70,
      satisfactionScore: input.satisfactionScore ?? existing?.satisfactionScore ?? 70,
      deliveryScore: input.deliveryScore ?? existing?.deliveryScore ?? 70,
      riskLevel,
      factors: input.factors ?? existing?.factors ?? [],
      risks: input.risks ?? existing?.risks ?? [],
      recommendations: input.recommendations ?? existing?.recommendations ?? [],
      nextReviewDate: plusDays(30),
      metadata: {}
    };

    if (existing) {
      const index = state.healthScores.indexOf(existing);
      state.healthScores[index] = healthScore;
    } else {
      state.healthScores.push(healthScore);
    }

    this.store.audit(actor, "health.updated", "HealthScore", healthScore.id);
    this.store.save();

    return healthScore;
  }

  private calculateRiskLevel(
    overallScore: number,
    factors?: Array<{ factor: string; impact: "positive" | "negative" | "neutral"; weight: number }>
  ): "low" | "medium" | "high" | "critical" {
    if (overallScore >= 80) return "low";
    if (overallScore >= 60) return "medium";
    if (overallScore >= 40) return "high";
    return "critical";
  }

  listSuccessPlans(actor: RequestActor, clientId?: string): SuccessPlan[] {
    let plans = this.store.getState().successPlans.filter(s => s.tenantId === actor.tenantId);
    if (clientId) {
      plans = plans.filter(s => s.clientId === clientId);
    }
    return plans;
  }

  createSuccessPlan(actor: RequestActor, clientId: string, input: {
    title: string;
    description?: string;
    ownerId?: string;
  }): SuccessPlan {
    this.getClient(actor, clientId);

    const now = nowIso();
    const plan: SuccessPlan = {
      id: newId("success"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      clientId,
      title: requireString(input, "title"),
      description: input.description,
      status: "draft",
      goals: [],
      milestones: [],
      checkIns: [],
      ownerId: input.ownerId,
      metadata: {}
    };

    this.store.getState().successPlans.push(plan);
    this.store.audit(actor, "success_plan.created", "SuccessPlan", plan.id);
    this.store.save();

    return plan;
  }

  listSupportTickets(actor: RequestActor, clientId?: string): SupportTicket[] {
    let tickets = this.store.getState().supportTickets.filter(t => t.tenantId === actor.tenantId);
    if (clientId) {
      tickets = tickets.filter(t => t.clientId === clientId);
    }
    return tickets;
  }

  createSupportTicket(actor: RequestActor, input: {
    clientId: string;
    projectId?: string;
    title: string;
    description: string;
    type?: string;
    priority?: string;
    tags?: string[];
  }): SupportTicket {
    this.getClient(actor, input.clientId);

    const now = nowIso();
    const ticket: SupportTicket = {
      id: newId("ticket"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      clientId: input.clientId,
      projectId: input.projectId,
      title: requireString(input, "title"),
      description: requireString(input, "description"),
      type: input.type as any ?? "support",
      priority: input.priority as any ?? "medium",
      status: "open",
      tags: asArray(input.tags),
      metadata: {}
    };

    this.store.getState().supportTickets.push(ticket);
    this.store.audit(actor, "ticket.created", "SupportTicket", ticket.id);
    this.store.save();

    return ticket;
  }

  listInvoices(actor: RequestActor, clientId?: string): Invoice[] {
    let invoices = this.store.getState().invoices.filter(i => i.tenantId === actor.tenantId);
    if (clientId) {
      invoices = invoices.filter(i => i.clientId === clientId);
    }
    return invoices;
  }

  createInvoice(actor: RequestActor, input: {
    clientId: string;
    projectId?: string;
    accountId?: string;
    number: string;
    title: string;
    amount: number;
    tax?: number;
    currency?: string;
    issueDate: string;
    dueDate: string;
    notes?: string;
  }): Invoice {
    this.getClient(actor, input.clientId);

    const now = nowIso();
    const amount = asNumber(input.amount);
    const tax = asNumber(input.tax, 0);
    const invoice: Invoice = {
      id: newId("invoice"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      clientId: input.clientId,
      projectId: input.projectId,
      accountId: input.accountId,
      number: requireString(input, "number"),
      title: requireString(input, "title"),
      amount,
      tax,
      total: amount + tax,
      currency: input.currency ?? "USD",
      status: "pending",
      issueDate: requireString(input, "issueDate"),
      dueDate: requireString(input, "dueDate"),
      notes: input.notes,
      metadata: {}
    };

    this.store.getState().invoices.push(invoice);
    this.store.audit(actor, "invoice.created", "Invoice", invoice.id);
    this.store.save();

    return invoice;
  }

  listTasks(actor: RequestActor, filters?: {
    projectId?: string;
    clientId?: string;
    status?: TaskStatus;
  }): Task[] {
    let tasks = this.store.getState().tasks.filter(t => t.tenantId === actor.tenantId);

    if (filters?.projectId) {
      tasks = tasks.filter(t => t.projectId === filters.projectId);
    }
    if (filters?.clientId) {
      tasks = tasks.filter(t => t.clientId === filters.clientId);
    }
    if (filters?.status) {
      tasks = tasks.filter(t => t.status === filters.status);
    }

    return tasks;
  }

  createTask(actor: RequestActor, input: {
    projectId?: string;
    clientId?: string;
    title: string;
    description?: string;
    priority?: string;
    assigneeId?: string;
    dueDate?: string;
    estimatedHours?: number;
    tags?: string[];
  }): Task {
    const now = nowIso();
    const task: Task = {
      id: newId("task"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      projectId: input.projectId,
      clientId: input.clientId,
      title: requireString(input, "title"),
      description: input.description,
      status: "backlog",
      priority: input.priority as any ?? "medium",
      assigneeId: input.assigneeId,
      dueDate: input.dueDate,
      estimatedHours: input.estimatedHours,
      tags: asArray(input.tags),
      metadata: {}
    };

    this.store.getState().tasks.push(task);
    this.store.audit(actor, "task.created", "Task", task.id);
    this.store.save();

    return task;
  }

  listRisks(actor: RequestActor, clientId?: string): Risk[] {
    let risks = this.store.getState().risks.filter(r => r.tenantId === actor.tenantId);
    if (clientId) {
      risks = risks.filter(r => r.clientId === clientId);
    }
    return risks;
  }

  createRisk(actor: RequestActor, input: {
    clientId: string;
    projectId?: string;
    title: string;
    description: string;
    category?: string;
    severity?: string;
    mitigationPlan?: string;
  }): Risk {
    this.getClient(actor, input.clientId);

    const now = nowIso();
    const risk: Risk = {
      id: newId("risk"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      clientId: input.clientId,
      projectId: input.projectId,
      title: requireString(input, "title"),
      description: requireString(input, "description"),
      category: input.category as any ?? "other",
      severity: input.severity as any ?? "medium",
      status: "identified",
      mitigationPlan: input.mitigationPlan,
      identifiedAt: now,
      metadata: {}
    };

    this.store.getState().risks.push(risk);
    this.store.audit(actor, "risk.created", "Risk", risk.id);
    this.store.save();

    return risk;
  }
}
