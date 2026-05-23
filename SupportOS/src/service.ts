import { DataStore } from "./core/datastore";
import {
  Ticket,
  TicketComment,
  TicketPriority,
  TicketStatus,
  TicketCategory,
  SupportChannel,
  SLA,
  SLAStatus,
  SlaStatus,
  SupportConversation,
  ConversationMessage,
  Escalation,
  Resolution,
  SupportArticle,
  SupportMacro,
  SupportAgent,
  SupportQueue,
  SupportComplaint,
  RefundRequest,
  SupportCSAT,
  SupportQualityReview,
  SupportEvent,
  RequestActor,
  SupportOverview
} from "./domain";
import { badRequest, conflict, notFound } from "./core/utils";
import { newId, nowIso } from "./core/id";
import { clone, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, pickQuery, isOverdue, countBy, addHours } from "./core/utils";

export class SupportService {
  constructor(private readonly store: DataStore) {}

  overview(actor: RequestActor): SupportOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;

    const tickets = state.tickets.filter((item) => item.tenantId === tenant);
    const openTickets = tickets.filter((item) => ["new", "open", "assigned", "in_progress", "waiting_customer", "waiting_internal", "escalated", "reopened"].includes(item.status));
    const slaStatuses = state.slaStatuses.filter((item) => item.tenantId === tenant);
    const escalations = state.escalations.filter((item) => item.tenantId === tenant);
    const csatResponses = state.csatResponses.filter((item) => item.tenantId === tenant);
    const agents = state.agents.filter((item) => item.tenantId === tenant);
    const conversations = state.conversations.filter((item) => item.tenantId === tenant);

    return {
      tickets: {
        total: tickets.length,
        open: openTickets.length,
        resolved: tickets.filter((item) => item.status === "resolved").length,
        closed: tickets.filter((item) => item.status === "closed").length,
        atRisk: slaStatuses.filter((item) => item.status === "at_risk").length,
        breached: slaStatuses.filter((item) => item.status === "breached").length
      },
      sla: {
        active: slaStatuses.length,
        atRisk: slaStatuses.filter((item) => item.status === "at_risk").length,
        breached: slaStatuses.filter((item) => item.status === "breached").length,
        compliancePercent: slaStatuses.length > 0 ? Math.round((slaStatuses.filter((item) => item.status !== "breached").length / slaStatuses.length) * 100) : 100
      },
      conversations: {
        open: conversations.filter((item) => item.status === "open").length,
        messages: state.conversationMessages.filter((item) => item.tenantId === tenant).length
      },
      escalations: {
        open: escalations.filter((item) => item.status === "open").length,
        resolved: escalations.filter((item) => item.status === "resolved" || item.status === "closed").length
      },
      csat: {
        average: csatResponses.length > 0 ? Number((csatResponses.reduce((sum, item) => sum + item.rating, 0) / csatResponses.length).toFixed(1)) : 0,
        responses: csatResponses.length
      },
      agents: {
        total: agents.length,
        active: agents.filter((item) => item.status !== "offline").length
      }
    };
  }

  listTickets(actor: RequestActor, query?: URLSearchParams): Ticket[] {
    const state = this.store.getState();
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");
    const priority = pickQuery(query, "priority");
    const category = pickQuery(query, "category");
    const agentId = pickQuery(query, "agentId");

    return clone(state.tickets.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (search && !`${item.title} ${item.description} ${item.customerName ?? ""}`.toLowerCase().includes(search)) return false;
      if (status && item.status !== status) return false;
      if (priority && item.priority !== priority) return false;
      if (category && item.category !== category) return false;
      if (agentId && item.assignedAgentId !== agentId) return false;
      return true;
    }));
  }

  getTicket(id: string, actor: RequestActor): Ticket {
    const ticket = this.store.getState().tickets.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!ticket) notFound("Ticket not found");
    return clone(ticket);
  }

  createTicket(input: unknown, actor: RequestActor): Ticket {
    const body = ensureObject(input, "ticket");
    const state = this.store.getState();
    const createdAt = nowIso();

    const priority = (body.priority ?? "medium") as TicketPriority;
    const sla = this.getDefaultSla(priority, actor.tenantId);

    const ticket: Ticket = {
      id: newId("ticket"),
      tenantId: actor.tenantId,
      createdAt,
      updatedAt: createdAt,
      title: ensureString(body.title, "ticket.title"),
      description: ensureString(body.description, "ticket.description"),
      status: "new",
      priority,
      category: (body.category ?? "other") as TicketCategory,
      channel: (body.channel ?? "website") as SupportChannel,
      customerId: body.customerId ? String(body.customerId) : undefined,
      customerName: body.customerName ? String(body.customerName) : undefined,
      customerEmail: body.customerEmail ? String(body.customerEmail) : undefined,
      tags: ensureArray<string>(body.tags, "ticket.tags"),
      metadata: ensureObject(body.metadata ?? {}),
      responseCount: 0,
      reopenCount: 0
    };

    state.tickets.unshift(ticket);

    if (sla) {
      ticket.slaId = sla.id;
      const firstResponseDueAt = addHours(new Date(createdAt), sla.firstResponseHours).toISOString();
      const resolutionDueAt = addHours(new Date(createdAt), sla.resolutionHours).toISOString();

      const slaStatus: SLAStatus = {
        id: newId("slastatus"),
        tenantId: actor.tenantId,
        createdAt,
        updatedAt: createdAt,
        ticketId: ticket.id,
        slaId: sla.id,
        status: "active",
        firstResponseDueAt,
        resolutionDueAt,
        firstResponseMet: false,
        resolutionMet: false
      };

      state.slaStatuses.push(slaStatus);
    }

    this.store.save();
    this.store.audit(actor, "ticket.create", "ticket", ticket.id, undefined, { title: ticket.title, priority: ticket.priority });

    return clone(ticket);
  }

  updateTicket(id: string, input: unknown, actor: RequestActor): Ticket {
    const body = ensureObject(input, "ticket");
    const state = this.store.getState();
    const ticket = state.tickets.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!ticket) notFound("Ticket not found");

    const before = clone(ticket);

    if (body.title !== undefined) ticket.title = ensureString(body.title, "title");
    if (body.description !== undefined) ticket.description = ensureString(body.description, "description");
    if (body.status !== undefined) ticket.status = body.status as TicketStatus;
    if (body.priority !== undefined) ticket.priority = body.priority as TicketPriority;
    if (body.category !== undefined) ticket.category = body.category as TicketCategory;
    if (body.assignedAgentId !== undefined) ticket.assignedAgentId = body.assignedAgentId ? String(body.assignedAgentId) : undefined;
    if (body.assignedTeam !== undefined) ticket.assignedTeam = body.assignedTeam ? String(body.assignedTeam) : undefined;
    if (body.tags !== undefined) ticket.tags = ensureArray<string>(body.tags, "tags");

    if (body.status === "assigned" && !ticket.assignedAgentId) {
      ticket.assignedAgentId = actor.userId;
    }

    if (body.status === "resolved" && !ticket.resolvedAt) {
      ticket.resolvedAt = nowIso();
      this.createResolution(ticket, "Resolved by agent", actor);
    }

    if (body.status === "closed" && !ticket.closedAt) {
      ticket.closedAt = nowIso();
    }

    ticket.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "ticket.update", "ticket", ticket.id, before, clone(ticket));

    return clone(ticket);
  }

  addTicketComment(ticketId: string, input: unknown, actor: RequestActor): TicketComment {
    const body = ensureObject(input, "comment");
    const state = this.store.getState();
    const ticket = state.tickets.find((item) => item.id === ticketId && item.tenantId === actor.tenantId);
    if (!ticket) notFound("Ticket not found");

    const createdAt = nowIso();
    const comment: TicketComment = {
      id: newId("comment"),
      tenantId: actor.tenantId,
      createdAt,
      updatedAt: createdAt,
      ticketId,
      authorId: actor.userId,
      authorName: String(body.authorName ?? actor.userId),
      content: ensureString(body.content, "comment.content"),
      isInternal: ensureBoolean(body.isInternal, false),
      attachments: ensureArray<string>(body.attachments, "attachments", [])
    };

    state.ticketComments.push(comment);
    ticket.responseCount += 1;
    ticket.updatedAt = nowIso();

    if (!ticket.firstResponseAt && !comment.isInternal) {
      ticket.firstResponseAt = createdAt;
      this.updateSlaFirstResponse(ticketId);
    }

    this.store.save();
    this.store.audit(actor, "ticket.comment.add", "ticket", ticketId, undefined, { commentId: comment.id });

    return clone(comment);
  }

  listSLAs(actor: RequestActor): SLA[] {
    return clone(this.store.getState().slas.filter((item) => item.tenantId === actor.tenantId));
  }

  createSLA(input: unknown, actor: RequestActor): SLA {
    const body = ensureObject(input, "sla");
    const state = this.store.getState();
    const createdAt = nowIso();

    const sla: SLA = {
      id: newId("sla"),
      tenantId: actor.tenantId,
      createdAt,
      updatedAt: createdAt,
      name: ensureString(body.name, "sla.name"),
      description: body.description ? String(body.description) : undefined,
      priority: (body.priority ?? "medium") as TicketPriority,
      firstResponseHours: ensureNumber(body.firstResponseHours, "sla.firstResponseHours"),
      resolutionHours: ensureNumber(body.resolutionHours, "sla.resolutionHours"),
      status: (body.status ?? "active") as any,
      isDefault: ensureBoolean(body.isDefault, false)
    };

    if (sla.isDefault) {
      state.slas.filter((item) => item.tenantId === actor.tenantId && item.priority === sla.priority).forEach((item) => item.isDefault = false);
    }

    state.slas.push(sla);
    this.store.save();
    this.store.audit(actor, "sla.create", "sla", sla.id, undefined, sla);

    return clone(sla);
  }

  getSlaStatus(ticketId: string, actor: RequestActor): SLAStatus | undefined {
    const status = this.store.getState().slaStatuses.find((item) => item.ticketId === ticketId && item.tenantId === actor.tenantId);
    if (!status) return undefined;

    if (status.status === "active" || status.status === "at_risk") {
      const now = Date.now();
      if (status.firstResponseDueAt && !status.firstResponseMet && new Date(status.firstResponseDueAt).getTime() < now) {
        status.status = "breached";
        status.breachedAt = nowIso();
      } else if (status.firstResponseDueAt && !status.firstResponseMet) {
        const hoursUntilDue = (new Date(status.firstResponseDueAt).getTime() - now) / (1000 * 60 * 60);
        if (hoursUntilDue <= 1) {
          status.status = "at_risk";
        }
      }
    }

    return clone(status);
  }

  listConversations(actor: RequestActor): SupportConversation[] {
    return clone(this.store.getState().conversations.filter((item) => item.tenantId === actor.tenantId));
  }

  createConversation(ticketId: string, input: unknown, actor: RequestActor): SupportConversation {
    const body = ensureObject(input, "conversation");
    const state = this.store.getState();
    const createdAt = nowIso();

    const conversation: SupportConversation = {
      id: newId("conv"),
      tenantId: actor.tenantId,
      createdAt,
      updatedAt: createdAt,
      ticketId,
      customerId: body.customerId ? String(body.customerId) : undefined,
      subject: ensureString(body.subject, "conversation.subject"),
      status: "open",
      messageCount: 0
    };

    state.conversations.unshift(conversation);
    this.store.save();
    this.store.audit(actor, "conversation.create", "conversation", conversation.id, undefined, conversation);

    return clone(conversation);
  }

  addConversationMessage(conversationId: string, input: unknown, actor: RequestActor): ConversationMessage {
    const body = ensureObject(input, "message");
    const state = this.store.getState();
    const conversation = state.conversations.find((item) => item.id === conversationId && item.tenantId === actor.tenantId);
    if (!conversation) notFound("Conversation not found");

    const createdAt = nowIso();
    const message: ConversationMessage = {
      id: newId("msg"),
      tenantId: actor.tenantId,
      createdAt,
      updatedAt: createdAt,
      conversationId,
      senderId: actor.userId,
      senderName: ensureString(body.senderName, "message.senderName"),
      senderType: (body.senderType ?? "agent") as any,
      content: ensureString(body.content, "message.content"),
      isInternal: ensureBoolean(body.isInternal, false),
      channel: (body.channel ?? "chat") as SupportChannel
    };

    state.conversationMessages.push(message);
    conversation.messageCount += 1;
    conversation.lastMessageAt = createdAt;
    conversation.updatedAt = createdAt;

    this.store.save();
    this.store.audit(actor, "conversation.message.add", "conversation", conversationId, undefined, { messageId: message.id });

    return clone(message);
  }

  listEscalations(actor: RequestActor): Escalation[] {
    return clone(this.store.getState().escalations.filter((item) => item.tenantId === actor.tenantId));
  }

  createEscalation(ticketId: string, input: unknown, actor: RequestActor): Escalation {
    const body = ensureObject(input, "escalation");
    const state = this.store.getState();
    const ticket = state.tickets.find((item) => item.id === ticketId && item.tenantId === actor.tenantId);
    if (!ticket) notFound("Ticket not found");

    const createdAt = nowIso();
    const escalation: Escalation = {
      id: newId("esc"),
      tenantId: actor.tenantId,
      createdAt,
      updatedAt: createdAt,
      ticketId,
      reason: ensureString(body.reason, "escalation.reason"),
      level: (body.level ?? "l1") as any,
      status: "open",
      escalatedBy: actor.userId,
      escalatedTo: body.escalatedTo ? String(body.escalatedTo) : undefined,
      escalatedToTeam: body.escalatedToTeam ? String(body.escalatedToTeam) : undefined,
      notes: "",
      resolvedAt: undefined
    };

    state.escalations.push(escalation);
    ticket.status = "escalated";
    ticket.updatedAt = createdAt;

    this.store.save();
    this.store.audit(actor, "escalation.create", "escalation", escalation.id, undefined, { ticketId, level: escalation.level });

    return clone(escalation);
  }

  updateEscalation(id: string, input: unknown, actor: RequestActor): Escalation {
    const body = ensureObject(input, "escalation");
    const state = this.store.getState();
    const escalation = state.escalations.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!escalation) notFound("Escalation not found");

    const before = clone(escalation);

    if (body.status !== undefined) escalation.status = body.status as any;
    if (body.notes !== undefined) escalation.notes = String(body.notes);
    if (body.escalatedTo !== undefined) escalation.escalatedTo = body.escalatedTo ? String(body.escalatedTo) : undefined;
    if (body.escalatedToTeam !== undefined) escalation.escalatedToTeam = body.escalatedToTeam ? String(body.escalatedToTeam) : undefined;

    if (body.status === "resolved" || body.status === "closed") {
      escalation.resolvedAt = nowIso();
    }

    escalation.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "escalation.update", "escalation", escalation.id, before, clone(escalation));

    return clone(escalation);
  }

  createResolution(ticket: Ticket, solution: string, actor: RequestActor): Resolution {
    const state = this.store.getState();
    const resolvedAt = nowIso();

    const resolution: Resolution = {
      id: newId("res"),
      tenantId: actor.tenantId,
      createdAt: resolvedAt,
      updatedAt: resolvedAt,
      ticketId: ticket.id,
      solution,
      resolvedBy: actor.userId,
      resolvedByName: actor.userId,
      resolutionType: "fixed",
      helpful: true,
      resolvedAt
    };

    state.resolutions.push(resolution);
    return resolution;
  }

  listResolutions(actor: RequestActor): Resolution[] {
    return clone(this.store.getState().resolutions.filter((item) => item.tenantId === actor.tenantId));
  }

  listArticles(actor: RequestActor, query?: URLSearchParams): SupportArticle[] {
    const state = this.store.getState();
    const search = pickQuery(query, "search")?.toLowerCase();
    const category = pickQuery(query, "category");

    return clone(state.articles.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (item.status !== "active") return false;
      if (search && !`${item.title} ${item.summary ?? ""} ${item.tags.join(" ")}`.toLowerCase().includes(search)) return false;
      if (category && item.category !== category) return false;
      return true;
    }));
  }

  createArticle(input: unknown, actor: RequestActor): SupportArticle {
    const body = ensureObject(input, "article");
    const state = this.store.getState();
    const createdAt = nowIso();

    const article: SupportArticle = {
      id: newId("article"),
      tenantId: actor.tenantId,
      createdAt,
      updatedAt: createdAt,
      title: ensureString(body.title, "article.title"),
      content: ensureString(body.content, "article.content"),
      summary: body.summary ? String(body.summary) : undefined,
      category: ensureString(body.category, "article.category"),
      tags: ensureArray<string>(body.tags, "article.tags"),
      status: (body.status ?? "active") as any,
      authorId: actor.userId,
      authorName: String(body.authorName ?? actor.userId),
      viewCount: 0,
      helpfulCount: 0,
      notHelpfulCount: 0,
      relatedTicketIds: [],
      metadata: ensureObject(body.metadata ?? {})
    };

    state.articles.push(article);
    this.store.save();
    this.store.audit(actor, "article.create", "article", article.id, undefined, article);

    return clone(article);
  }

  listMacros(actor: RequestActor): SupportMacro[] {
    return clone(this.store.getState().macros.filter((item) => item.tenantId === actor.tenantId && item.status === "active"));
  }

  createMacro(input: unknown, actor: RequestActor): SupportMacro {
    const body = ensureObject(input, "macro");
    const state = this.store.getState();
    const createdAt = nowIso();

    const macro: SupportMacro = {
      id: newId("macro"),
      tenantId: actor.tenantId,
      createdAt,
      updatedAt: createdAt,
      key: ensureString(body.key, "macro.key"),
      name: ensureString(body.name, "macro.name"),
      content: ensureString(body.content, "macro.content"),
      category: ensureString(body.category, "macro.category"),
      tags: ensureArray<string>(body.tags, "macro.tags"),
      status: (body.status ?? "active") as any,
      usageCount: 0
    };

    state.macros.push(macro);
    this.store.save();
    this.store.audit(actor, "macro.create", "macro", macro.id, undefined, macro);

    return clone(macro);
  }

  listAgents(actor: RequestActor): SupportAgent[] {
    return clone(this.store.getState().agents.filter((item) => item.tenantId === actor.tenantId));
  }

  createAgent(input: unknown, actor: RequestActor): SupportAgent {
    const body = ensureObject(input, "agent");
    const state = this.store.getState();
    const createdAt = nowIso();

    const agent: SupportAgent = {
      id: newId("agent"),
      tenantId: actor.tenantId,
      createdAt,
      updatedAt: createdAt,
      name: ensureString(body.name, "agent.name"),
      email: ensureString(body.email, "agent.email"),
      role: (body.role ?? "agent") as any,
      status: "available",
      skills: ensureArray<string>(body.skills, "agent.skills"),
      teams: ensureArray<string>(body.teams, "agent.teams"),
      maxConcurrentTickets: ensureNumber(body.maxConcurrentTickets, "agent.maxConcurrentTickets", 10),
      currentTicketCount: 0
    };

    state.agents.push(agent);
    this.store.save();
    this.store.audit(actor, "agent.create", "agent", agent.id, undefined, agent);

    return clone(agent);
  }

  listQueues(actor: RequestActor): SupportQueue[] {
    return clone(this.store.getState().queues.filter((item) => item.tenantId === actor.tenantId));
  }

  createQueue(input: unknown, actor: RequestActor): SupportQueue {
    const body = ensureObject(input, "queue");
    const state = this.store.getState();
    const createdAt = nowIso();

    const queue: SupportQueue = {
      id: newId("queue"),
      tenantId: actor.tenantId,
      createdAt,
      updatedAt: createdAt,
      name: ensureString(body.name, "queue.name"),
      description: body.description ? String(body.description) : undefined,
      type: (body.type ?? "all") as any,
      filter: ensureObject(body.filter ?? {}),
      assignedAgentIds: ensureArray<string>(body.assignedAgentIds, "queue.assignedAgentIds"),
      status: (body.status ?? "active") as any,
      order: ensureNumber(body.order, "queue.order", 0)
    };

    state.queues.push(queue);
    this.store.save();
    this.store.audit(actor, "queue.create", "queue", queue.id, undefined, queue);

    return clone(queue);
  }

  submitCSAT(ticketId: string, input: unknown, actor: RequestActor): SupportCSAT {
    const body = ensureObject(input, "csat");
    const state = this.store.getState();
    const createdAt = nowIso();

    const csat: SupportCSAT = {
      id: newId("csat"),
      tenantId: actor.tenantId,
      createdAt,
      updatedAt: createdAt,
      ticketId,
      customerId: body.customerId ? String(body.customerId) : undefined,
      rating: ensureNumber(body.rating, "csat.rating"),
      comment: body.comment ? String(body.comment) : undefined,
      feedbackType: (body.feedbackType ?? "resolved") as any,
      submittedAt: createdAt
    };

    state.csatResponses.push(csat);
    this.store.save();
    this.store.audit(actor, "csat.submit", "csat", csat.id, undefined, { ticketId, rating: csat.rating });

    return clone(csat);
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((item) => item.tenantId === actor.tenantId));
  }

  private getDefaultSla(priority: TicketPriority, tenantId: string): SLA | undefined {
    return this.store.getState().slas.find((item) => item.tenantId === tenantId && item.priority === priority && item.isDefault && item.status === "active");
  }

  private updateSlaFirstResponse(ticketId: string): void {
    const state = this.store.getState();
    const slaStatus = state.slaStatuses.find((item) => item.ticketId === ticketId);
    if (!slaStatus || slaStatus.firstResponseMet) return;

    slaStatus.firstResponseMet = true;
    slaStatus.firstResponseAt = nowIso();
    slaStatus.updatedAt = nowIso();

    if (slaStatus.status === "breached") {
      slaStatus.status = "met";
    }
  }
}
