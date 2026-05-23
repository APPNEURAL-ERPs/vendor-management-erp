import { DataStore } from "../core/datastore";
import { EventBus } from "../core/event-bus";
import { badRequest, notFound } from "../core/errors";
import { humanNumber, newId, nowIso } from "../core/id";
import { assertRequired, asArray, clamp, clone, includesText, normalizeEmail, numberOr, unique } from "../core/utils";
import { CustomerAnalyticsEngine } from "../engines/customer-analytics-engine";
import { TicketSlaEngine } from "../engines/ticket-sla-engine";
import {
  AccountStatus,
  ClientSegment,
  ClientTask,
  Contact,
  CustomerAccount,
  Interaction,
  LifecycleStage,
  Opportunity,
  OpportunityStage,
  RequestActor,
  SlaPolicy,
  Ticket
} from "../core/domain";

export class ClientService {
  private readonly analytics = new CustomerAnalyticsEngine();
  private readonly sla = new TicketSlaEngine();
  constructor(private readonly store: DataStore, private readonly events: EventBus) {}

  health(): Record<string, unknown> {
    const state = this.store.getState();
    return { service: "ClientOS", status: "ok", accounts: state.accounts.length, contacts: state.contacts.length, tickets: state.tickets.length, timestamp: nowIso() };
  }

  overview(actor: RequestActor): Record<string, unknown> {
    return {
      analytics: this.analytics.summarize(this.store.getState(), actor.tenantId),
      recentTickets: this.listTickets(actor, { limit: "5" }).items,
      recentInteractions: this.listInteractions(actor, { limit: "5" }).items,
      recentEvents: this.listEvents(actor).slice(0, 10)
    };
  }

  listAccounts(actor: RequestActor, query: Record<string, string | undefined> = {}): { items: CustomerAccount[]; total: number } {
    const q = String(query.q ?? "").trim();
    let items = this.store.getState().accounts.filter((item) => item.tenantId === actor.tenantId);
    if (query.status) items = items.filter((item) => item.status === query.status);
    if (query.ownerUserId) items = items.filter((item) => item.ownerUserId === query.ownerUserId);
    if (query.tag) items = items.filter((item) => item.tags.includes(String(query.tag)));
    if (q) items = items.filter((item) => includesText(item.name, q) || includesText(item.primaryEmail, q) || includesText(item.code, q));
    return { items: this.limit(items, query.limit), total: items.length };
  }

  createAccount(actor: RequestActor, input: any): CustomerAccount {
    assertRequired(input?.name, "name");
    const now = nowIso();
    const account: CustomerAccount = {
      id: newId("acct"), tenantId: actor.tenantId, createdAt: now, updatedAt: now,
      code: input.code ?? humanNumber("ACC"), name: String(input.name).trim(), type: input.type ?? "company", status: input.status ?? "prospect",
      lifecycleStage: input.lifecycleStage ?? "new", industry: input.industry, website: input.website, primaryEmail: input.primaryEmail ? normalizeEmail(input.primaryEmail) : undefined,
      primaryPhone: input.primaryPhone, ownerUserId: input.ownerUserId ?? actor.userId, healthScore: clamp(numberOr(input.healthScore, 80), 0, 100),
      annualValue: input.annualValue, currency: input.currency ?? "INR", addresses: asArray(input.addresses), tags: unique(asArray<string>(input.tags)),
      customFields: input.customFields ?? {}, metadata: input.metadata ?? {}, createdBy: actor.userId, lastContactedAt: input.lastContactedAt
    };
    this.store.getState().accounts.unshift(account);
    this.store.audit(actor, "account.created", "account", account.id, undefined, account);
    this.events.emit(actor, "client.account.created", { accountId: account.id, name: account.name, status: account.status });
    this.store.save();
    return account;
  }

  getAccount(actor: RequestActor, id: string): CustomerAccount { return this.findAccount(actor, id); }

  updateAccount(actor: RequestActor, id: string, input: any): CustomerAccount {
    const account = this.findAccount(actor, id); const before = clone(account);
    const fields = ["name", "type", "status", "lifecycleStage", "industry", "website", "primaryPhone", "ownerUserId", "annualValue", "currency", "addresses", "tags", "customFields", "metadata", "lastContactedAt"];
    for (const field of fields) if (input[field] !== undefined) (account as any)[field] = field === "tags" ? unique(asArray<string>(input[field])) : input[field];
    if (input.primaryEmail !== undefined) account.primaryEmail = normalizeEmail(input.primaryEmail);
    if (input.healthScore !== undefined) account.healthScore = clamp(numberOr(input.healthScore, account.healthScore), 0, 100);
    account.updatedAt = nowIso();
    this.store.audit(actor, "account.updated", "account", account.id, before, account);
    this.events.emit(actor, "client.account.updated", { accountId: account.id, status: account.status, healthScore: account.healthScore });
    this.store.save();
    return account;
  }

  accountProfile(actor: RequestActor, id: string): Record<string, unknown> {
    const account = this.findAccount(actor, id);
    const state = this.store.getState();
    const tickets = state.tickets.filter((item) => item.tenantId === actor.tenantId && item.accountId === id);
    return {
      account,
      contacts: state.contacts.filter((item) => item.tenantId === actor.tenantId && item.accountId === id),
      opportunities: state.opportunities.filter((item) => item.tenantId === actor.tenantId && item.accountId === id),
      tickets: tickets.map((ticket) => ({ ...ticket, sla: this.sla.evaluate(ticket) })),
      notes: state.notes.filter((item) => item.tenantId === actor.tenantId && item.entityType === "account" && item.entityId === id),
      interactions: state.interactions.filter((item) => item.tenantId === actor.tenantId && item.accountId === id),
      tasks: state.tasks.filter((item) => item.tenantId === actor.tenantId && item.relatedType === "account" && item.relatedId === id)
    };
  }

  listContacts(actor: RequestActor, query: Record<string, string | undefined> = {}): { items: Contact[]; total: number } {
    const q = String(query.q ?? "").trim();
    let items = this.store.getState().contacts.filter((item) => item.tenantId === actor.tenantId);
    if (query.accountId) items = items.filter((item) => item.accountId === query.accountId);
    if (query.status) items = items.filter((item) => item.status === query.status);
    if (query.tag) items = items.filter((item) => item.tags.includes(String(query.tag)));
    if (q) items = items.filter((item) => includesText(item.firstName, q) || includesText(item.lastName, q) || includesText(item.email, q) || includesText(item.phone, q));
    return { items: this.limit(items, query.limit), total: items.length };
  }

  createContact(actor: RequestActor, input: any): Contact {
    assertRequired(input?.firstName, "firstName"); assertRequired(input?.lastName, "lastName"); assertRequired(input?.email, "email");
    if (input.accountId) this.findAccount(actor, input.accountId);
    const now = nowIso();
    const contact: Contact = {
      id: newId("ctc"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, accountId: input.accountId,
      firstName: String(input.firstName).trim(), lastName: String(input.lastName).trim(), email: normalizeEmail(input.email), phone: input.phone,
      roleTitle: input.roleTitle, department: input.department, decisionMaker: Boolean(input.decisionMaker), status: input.status ?? "active",
      preferredChannel: input.preferredChannel ?? "email", consentStatus: input.consentStatus ?? "unknown", tags: unique(asArray<string>(input.tags)),
      customFields: input.customFields ?? {}, metadata: input.metadata ?? {}, createdBy: actor.userId, lastContactedAt: input.lastContactedAt
    };
    this.store.getState().contacts.unshift(contact);
    this.store.audit(actor, "contact.created", "contact", contact.id, undefined, contact);
    this.events.emit(actor, "client.contact.created", { contactId: contact.id, accountId: contact.accountId, email: contact.email });
    this.store.save();
    return contact;
  }

  getContact(actor: RequestActor, id: string): Contact { return this.findContact(actor, id); }

  updateContact(actor: RequestActor, id: string, input: any): Contact {
    const contact = this.findContact(actor, id); const before = clone(contact);
    if (input.accountId !== undefined) { if (input.accountId) this.findAccount(actor, input.accountId); contact.accountId = input.accountId; }
    const fields = ["firstName", "lastName", "phone", "roleTitle", "department", "decisionMaker", "status", "preferredChannel", "consentStatus", "tags", "customFields", "metadata", "lastContactedAt"];
    for (const field of fields) if (input[field] !== undefined) (contact as any)[field] = field === "tags" ? unique(asArray<string>(input[field])) : input[field];
    if (input.email !== undefined) contact.email = normalizeEmail(input.email);
    contact.updatedAt = nowIso();
    this.store.audit(actor, "contact.updated", "contact", contact.id, before, contact);
    this.events.emit(actor, "client.contact.updated", { contactId: contact.id, accountId: contact.accountId });
    this.store.save();
    return contact;
  }

  listOpportunities(actor: RequestActor, query: Record<string, string | undefined> = {}): { items: Opportunity[]; total: number } {
    let items = this.store.getState().opportunities.filter((item) => item.tenantId === actor.tenantId);
    if (query.accountId) items = items.filter((item) => item.accountId === query.accountId);
    if (query.stage) items = items.filter((item) => item.stage === query.stage);
    if (query.status) items = items.filter((item) => item.status === query.status);
    if (query.ownerUserId) items = items.filter((item) => item.ownerUserId === query.ownerUserId);
    return { items: this.limit(items, query.limit), total: items.length };
  }

  createOpportunity(actor: RequestActor, input: any): Opportunity {
    assertRequired(input?.accountId, "accountId"); assertRequired(input?.name, "name");
    this.findAccount(actor, input.accountId); if (input.contactId) this.findContact(actor, input.contactId);
    const now = nowIso(); const stage: OpportunityStage = input.stage ?? "new";
    const opportunity: Opportunity = {
      id: newId("opp"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, accountId: input.accountId, contactId: input.contactId,
      name: String(input.name).trim(), stage, status: stage === "won" ? "won" : stage === "lost" ? "lost" : "open", value: numberOr(input.value, 0), currency: input.currency ?? "INR",
      probability: clamp(numberOr(input.probability, probabilityForStage(stage)), 0, 100), expectedCloseDate: input.expectedCloseDate, ownerUserId: input.ownerUserId ?? actor.userId,
      source: input.source, products: unique(asArray<string>(input.products)), notes: input.notes, lostReason: input.lostReason, tags: unique(asArray<string>(input.tags)), metadata: input.metadata ?? {}, createdBy: actor.userId,
      closedAt: stage === "won" || stage === "lost" ? now : undefined
    };
    this.store.getState().opportunities.unshift(opportunity);
    this.store.audit(actor, "opportunity.created", "opportunity", opportunity.id, undefined, opportunity);
    this.events.emit(actor, "client.opportunity.created", { opportunityId: opportunity.id, accountId: opportunity.accountId, value: opportunity.value });
    this.store.save();
    return opportunity;
  }

  getOpportunity(actor: RequestActor, id: string): Opportunity { return this.findOpportunity(actor, id); }

  updateOpportunity(actor: RequestActor, id: string, input: any): Opportunity {
    const opportunity = this.findOpportunity(actor, id); const before = clone(opportunity);
    if (input.accountId !== undefined) { this.findAccount(actor, input.accountId); opportunity.accountId = input.accountId; }
    if (input.contactId !== undefined) { if (input.contactId) this.findContact(actor, input.contactId); opportunity.contactId = input.contactId; }
    const fields = ["name", "value", "currency", "probability", "expectedCloseDate", "ownerUserId", "source", "products", "notes", "lostReason", "tags", "metadata"];
    for (const field of fields) if (input[field] !== undefined) (opportunity as any)[field] = ["products", "tags"].includes(field) ? unique(asArray<string>(input[field])) : input[field];
    if (input.stage !== undefined) this.applyOpportunityStage(opportunity, input.stage, input.lostReason);
    opportunity.updatedAt = nowIso();
    this.store.audit(actor, "opportunity.updated", "opportunity", opportunity.id, before, opportunity);
    this.events.emit(actor, "client.opportunity.updated", { opportunityId: opportunity.id, stage: opportunity.stage, status: opportunity.status });
    this.store.save();
    return opportunity;
  }

  changeOpportunityStage(actor: RequestActor, id: string, input: any): Opportunity {
    const opportunity = this.findOpportunity(actor, id); const before = clone(opportunity);
    this.applyOpportunityStage(opportunity, input?.stage, input?.lostReason);
    opportunity.updatedAt = nowIso();
    this.store.audit(actor, "opportunity.stage.changed", "opportunity", id, before, opportunity);
    this.events.emit(actor, "client.opportunity.stage_changed", { opportunityId: id, stage: opportunity.stage, status: opportunity.status });
    this.store.save();
    return opportunity;
  }

  listTickets(actor: RequestActor, query: Record<string, string | undefined> = {}): { items: Array<Ticket & { sla: ReturnType<TicketSlaEngine["evaluate"]> }>; total: number } {
    const q = String(query.q ?? "").trim();
    let items = this.store.getState().tickets.filter((item) => item.tenantId === actor.tenantId);
    if (query.accountId) items = items.filter((item) => item.accountId === query.accountId);
    if (query.contactId) items = items.filter((item) => item.contactId === query.contactId);
    if (query.status) items = items.filter((item) => item.status === query.status);
    if (query.priority) items = items.filter((item) => item.priority === query.priority);
    if (query.assignedToUserId) items = items.filter((item) => item.assignedToUserId === query.assignedToUserId);
    if (q) items = items.filter((item) => includesText(item.ticketNumber, q) || includesText(item.subject, q) || includesText(item.description, q));
    const mapped = items.map((ticket) => ({ ...ticket, sla: this.sla.evaluate(ticket) }));
    return { items: this.limit(mapped, query.limit), total: mapped.length };
  }

  createTicket(actor: RequestActor, input: any): Ticket {
    assertRequired(input?.subject, "subject"); assertRequired(input?.description, "description");
    if (input.accountId) this.findAccount(actor, input.accountId); if (input.contactId) this.findContact(actor, input.contactId);
    const now = nowIso();
    const priority = input.priority ?? "medium";
    const policy = input.slaPolicyId ? this.findSlaPolicy(actor, input.slaPolicyId) : this.defaultSlaPolicy(actor, priority);
    const deadlines = this.sla.calculateDeadlines(now, policy);
    const ticket: Ticket = {
      id: newId("tkt"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, ticketNumber: input.ticketNumber ?? humanNumber("TCK"), accountId: input.accountId, contactId: input.contactId,
      subject: String(input.subject).trim(), description: String(input.description).trim(), category: input.category ?? "general", priority, severity: input.severity ?? severityForPriority(priority), channel: input.channel ?? "portal",
      status: input.status ?? "open", assignedToUserId: input.assignedToUserId, team: input.team ?? "support", slaPolicyId: policy?.id, firstResponseDueAt: deadlines.firstResponseDueAt, resolutionDueAt: deadlines.resolutionDueAt,
      tags: unique(asArray<string>(input.tags)), metadata: input.metadata ?? {}, createdBy: actor.userId
    };
    this.store.getState().tickets.unshift(ticket);
    this.store.audit(actor, "ticket.created", "ticket", ticket.id, undefined, ticket);
    this.events.emit(actor, "client.ticket.created", { ticketId: ticket.id, ticketNumber: ticket.ticketNumber, priority: ticket.priority, accountId: ticket.accountId });
    this.store.save();
    return ticket;
  }

  getTicket(actor: RequestActor, id: string): Ticket & { sla: ReturnType<TicketSlaEngine["evaluate"]> } { const ticket = this.findTicket(actor, id); return { ...ticket, sla: this.sla.evaluate(ticket) }; }

  updateTicket(actor: RequestActor, id: string, input: any): Ticket {
    const ticket = this.findTicket(actor, id); const before = clone(ticket);
    if (input.accountId !== undefined) { if (input.accountId) this.findAccount(actor, input.accountId); ticket.accountId = input.accountId; }
    if (input.contactId !== undefined) { if (input.contactId) this.findContact(actor, input.contactId); ticket.contactId = input.contactId; }
    const fields = ["subject", "description", "category", "priority", "severity", "channel", "status", "assignedToUserId", "team", "slaPolicyId", "resolutionSummary", "satisfactionScore", "tags", "metadata"];
    for (const field of fields) if (input[field] !== undefined) (ticket as any)[field] = field === "tags" ? unique(asArray<string>(input[field])) : input[field];
    if (input.slaPolicyId !== undefined) {
      const policy = input.slaPolicyId ? this.findSlaPolicy(actor, input.slaPolicyId) : undefined;
      const deadlines = this.sla.calculateDeadlines(ticket.createdAt, policy);
      ticket.firstResponseDueAt = deadlines.firstResponseDueAt;
      ticket.resolutionDueAt = deadlines.resolutionDueAt;
    }
    ticket.updatedAt = nowIso();
    this.store.audit(actor, "ticket.updated", "ticket", ticket.id, before, ticket);
    this.events.emit(actor, "client.ticket.updated", { ticketId: ticket.id, status: ticket.status, priority: ticket.priority });
    this.store.save();
    return ticket;
  }

  assignTicket(actor: RequestActor, id: string, input: any): Ticket {
    const ticket = this.findTicket(actor, id); const before = clone(ticket);
    assertRequired(input?.assignedToUserId, "assignedToUserId");
    ticket.assignedToUserId = input.assignedToUserId; ticket.team = input.team ?? ticket.team; ticket.status = ticket.status === "open" ? "triaged" : ticket.status; ticket.updatedAt = nowIso();
    this.store.audit(actor, "ticket.assigned", "ticket", id, before, ticket);
    this.events.emit(actor, "client.ticket.assigned", { ticketId: id, assignedToUserId: ticket.assignedToUserId, team: ticket.team });
    this.store.save();
    return ticket;
  }

  respondToTicket(actor: RequestActor, id: string, input: any): Record<string, unknown> {
    const ticket = this.findTicket(actor, id); const before = clone(ticket);
    const now = nowIso(); if (!ticket.firstResponseAt) ticket.firstResponseAt = now;
    ticket.status = input.status ?? "waiting_customer"; ticket.updatedAt = now;
    const interaction = this.createInteraction(actor, { entityType: "ticket", entityId: id, accountId: ticket.accountId, contactId: ticket.contactId, channel: input.channel ?? "email", direction: "outbound", summary: input.summary ?? `Response sent for ${ticket.ticketNumber}`, content: input.message ?? input.content, participants: input.participants ?? [] }, false);
    this.store.audit(actor, "ticket.responded", "ticket", id, before, ticket);
    this.events.emit(actor, "client.ticket.responded", { ticketId: id, firstResponseAt: ticket.firstResponseAt });
    this.store.save();
    return { ticket, interaction };
  }

  resolveTicket(actor: RequestActor, id: string, input: any): Ticket {
    const ticket = this.findTicket(actor, id); const before = clone(ticket); const now = nowIso();
    ticket.status = "resolved"; ticket.resolvedAt = now; ticket.resolutionSummary = input?.resolutionSummary ?? input?.resolution ?? ticket.resolutionSummary; if (input?.satisfactionScore !== undefined) ticket.satisfactionScore = numberOr(input.satisfactionScore, 0); ticket.updatedAt = now;
    this.store.audit(actor, "ticket.resolved", "ticket", id, before, ticket);
    this.events.emit(actor, "client.ticket.resolved", { ticketId: id, ticketNumber: ticket.ticketNumber, resolutionSummary: ticket.resolutionSummary });
    this.store.save();
    return ticket;
  }

  closeTicket(actor: RequestActor, id: string, input: any = {}): Ticket {
    const ticket = this.findTicket(actor, id); const before = clone(ticket); const now = nowIso();
    ticket.status = "closed"; ticket.closedAt = now; if (!ticket.resolvedAt) ticket.resolvedAt = now; if (input.satisfactionScore !== undefined) ticket.satisfactionScore = numberOr(input.satisfactionScore, 0); ticket.updatedAt = now;
    this.store.audit(actor, "ticket.closed", "ticket", id, before, ticket);
    this.events.emit(actor, "client.ticket.closed", { ticketId: id, ticketNumber: ticket.ticketNumber });
    this.store.save();
    return ticket;
  }

  listSlaPolicies(actor: RequestActor): SlaPolicy[] { return this.store.getState().slaPolicies.filter((item) => item.tenantId === actor.tenantId); }

  createSlaPolicy(actor: RequestActor, input: any): SlaPolicy {
    assertRequired(input?.name, "name"); assertRequired(input?.priority, "priority");
    const now = nowIso();
    const policy: SlaPolicy = { id: newId("sla"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, name: input.name, priority: input.priority, firstResponseMinutes: numberOr(input.firstResponseMinutes, 120), resolutionMinutes: numberOr(input.resolutionMinutes, 1440), businessHoursOnly: Boolean(input.businessHoursOnly), escalationUserIds: unique(asArray<string>(input.escalationUserIds)), status: input.status ?? "active", metadata: input.metadata ?? {} };
    this.store.getState().slaPolicies.unshift(policy);
    this.store.audit(actor, "sla_policy.created", "sla_policy", policy.id, undefined, policy);
    this.events.emit(actor, "client.sla_policy.created", { policyId: policy.id, priority: policy.priority });
    this.store.save();
    return policy;
  }

  updateSlaPolicy(actor: RequestActor, id: string, input: any): SlaPolicy {
    const policy = this.findSlaPolicy(actor, id); const before = clone(policy);
    const fields = ["name", "priority", "firstResponseMinutes", "resolutionMinutes", "businessHoursOnly", "escalationUserIds", "status", "metadata"];
    for (const field of fields) if (input[field] !== undefined) (policy as any)[field] = field === "escalationUserIds" ? unique(asArray<string>(input[field])) : input[field];
    policy.updatedAt = nowIso();
    this.store.audit(actor, "sla_policy.updated", "sla_policy", id, before, policy);
    this.events.emit(actor, "client.sla_policy.updated", { policyId: id, status: policy.status });
    this.store.save();
    return policy;
  }

  listNotes(actor: RequestActor, query: Record<string, string | undefined> = {}): { items: any[]; total: number } {
    let items = this.store.getState().notes.filter((item) => item.tenantId === actor.tenantId);
    if (query.entityType) items = items.filter((item) => item.entityType === query.entityType);
    if (query.entityId) items = items.filter((item) => item.entityId === query.entityId);
    return { items: this.limit(items, query.limit), total: items.length };
  }

  createNote(actor: RequestActor, input: any): any {
    assertRequired(input?.entityType, "entityType"); assertRequired(input?.entityId, "entityId"); assertRequired(input?.note, "note"); this.assertRelatedExists(actor, input.entityType, input.entityId);
    const now = nowIso();
    const note = { id: newId("note"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, entityType: input.entityType, entityId: input.entityId, note: input.note, visibility: input.visibility ?? "internal", pinned: Boolean(input.pinned), tags: unique(asArray<string>(input.tags)), createdBy: actor.userId };
    this.store.getState().notes.unshift(note);
    this.store.audit(actor, "note.created", "note", note.id, undefined, note);
    this.events.emit(actor, "client.note.created", { noteId: note.id, entityType: note.entityType, entityId: note.entityId });
    this.store.save();
    return note;
  }

  listInteractions(actor: RequestActor, query: Record<string, string | undefined> = {}): { items: Interaction[]; total: number } {
    let items = this.store.getState().interactions.filter((item) => item.tenantId === actor.tenantId);
    if (query.entityType) items = items.filter((item) => item.entityType === query.entityType);
    if (query.entityId) items = items.filter((item) => item.entityId === query.entityId);
    if (query.accountId) items = items.filter((item) => item.accountId === query.accountId);
    if (query.contactId) items = items.filter((item) => item.contactId === query.contactId);
    return { items: this.limit(items, query.limit), total: items.length };
  }

  createInteraction(actor: RequestActor, input: any, shouldSave = true): Interaction {
    assertRequired(input?.entityType, "entityType"); assertRequired(input?.entityId, "entityId"); assertRequired(input?.summary, "summary"); this.assertRelatedExists(actor, input.entityType, input.entityId);
    const now = nowIso();
    const interaction: Interaction = { id: newId("int"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, entityType: input.entityType, entityId: input.entityId, accountId: input.accountId, contactId: input.contactId, channel: input.channel ?? "email", direction: input.direction ?? "outbound", summary: input.summary, content: input.content, occurredAt: input.occurredAt ?? now, participants: unique(asArray<string>(input.participants)), createdBy: actor.userId, metadata: input.metadata ?? {} };
    this.store.getState().interactions.unshift(interaction);
    if (interaction.accountId) { const account = this.findAccount(actor, interaction.accountId); account.lastContactedAt = interaction.occurredAt; account.updatedAt = now; }
    if (interaction.contactId) { const contact = this.findContact(actor, interaction.contactId); contact.lastContactedAt = interaction.occurredAt; contact.updatedAt = now; }
    this.store.audit(actor, "interaction.created", "interaction", interaction.id, undefined, interaction);
    this.events.emit(actor, "client.interaction.created", { interactionId: interaction.id, entityType: interaction.entityType, channel: interaction.channel });
    if (shouldSave) this.store.save();
    return interaction;
  }

  listTasks(actor: RequestActor, query: Record<string, string | undefined> = {}): { items: ClientTask[]; total: number } {
    let items = this.store.getState().tasks.filter((item) => item.tenantId === actor.tenantId);
    if (query.status) items = items.filter((item) => item.status === query.status);
    if (query.assignedToUserId) items = items.filter((item) => item.assignedToUserId === query.assignedToUserId);
    if (query.relatedType) items = items.filter((item) => item.relatedType === query.relatedType);
    if (query.relatedId) items = items.filter((item) => item.relatedId === query.relatedId);
    return { items: this.limit(items, query.limit), total: items.length };
  }

  createTask(actor: RequestActor, input: any): ClientTask {
    assertRequired(input?.title, "title"); if (input.relatedType && input.relatedId) this.assertRelatedExists(actor, input.relatedType, input.relatedId);
    const now = nowIso();
    const task: ClientTask = { id: newId("task"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, title: input.title, description: input.description, relatedType: input.relatedType, relatedId: input.relatedId, assignedToUserId: input.assignedToUserId ?? actor.userId, dueAt: input.dueAt, priority: input.priority ?? "medium", status: input.status ?? "open", createdBy: actor.userId, metadata: input.metadata ?? {} };
    this.store.getState().tasks.unshift(task);
    this.store.audit(actor, "task.created", "task", task.id, undefined, task);
    this.events.emit(actor, "client.task.created", { taskId: task.id, relatedType: task.relatedType, assignedToUserId: task.assignedToUserId });
    this.store.save();
    return task;
  }

  updateTask(actor: RequestActor, id: string, input: any): ClientTask {
    const task = this.findTask(actor, id); const before = clone(task);
    const fields = ["title", "description", "relatedType", "relatedId", "assignedToUserId", "dueAt", "priority", "status", "metadata"];
    for (const field of fields) if (input[field] !== undefined) (task as any)[field] = input[field];
    if (task.relatedType && task.relatedId) this.assertRelatedExists(actor, task.relatedType, task.relatedId);
    if (task.status === "done" && !task.completedAt) task.completedAt = nowIso();
    task.updatedAt = nowIso();
    this.store.audit(actor, "task.updated", "task", id, before, task);
    this.events.emit(actor, "client.task.updated", { taskId: id, status: task.status });
    this.store.save();
    return task;
  }

  completeTask(actor: RequestActor, id: string): ClientTask { return this.updateTask(actor, id, { status: "done", completedAt: nowIso() }); }

  listSegments(actor: RequestActor): ClientSegment[] { return this.store.getState().segments.filter((item) => item.tenantId === actor.tenantId); }

  createSegment(actor: RequestActor, input: any): ClientSegment {
    assertRequired(input?.name, "name");
    const now = nowIso(); const filters = input.filters ?? {}; const dynamic = input.dynamic !== false;
    const segment: ClientSegment = { id: newId("seg"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, name: input.name, description: input.description, filters, accountIds: dynamic ? this.evaluateSegmentFilters(actor, filters).map((item) => item.id) : unique(asArray<string>(input.accountIds)), dynamic, status: input.status ?? "active", ownerUserId: input.ownerUserId ?? actor.userId, metadata: input.metadata ?? {} };
    segment.accountIds.forEach((id) => this.findAccount(actor, id));
    this.store.getState().segments.unshift(segment);
    this.store.audit(actor, "segment.created", "segment", segment.id, undefined, segment);
    this.events.emit(actor, "client.segment.created", { segmentId: segment.id, size: segment.accountIds.length });
    this.store.save();
    return segment;
  }

  evaluateSegment(actor: RequestActor, id: string): ClientSegment {
    const segment = this.findSegment(actor, id); const before = clone(segment);
    segment.accountIds = this.evaluateSegmentFilters(actor, segment.filters).map((item) => item.id); segment.updatedAt = nowIso();
    this.store.audit(actor, "segment.evaluated", "segment", id, before, segment);
    this.events.emit(actor, "client.segment.evaluated", { segmentId: id, size: segment.accountIds.length });
    this.store.save();
    return segment;
  }

  listEvents(actor: RequestActor): any[] { return this.store.getState().events.filter((item) => item.tenantId === actor.tenantId); }
  listAuditLogs(actor: RequestActor): any[] { return this.store.getState().auditLogs.filter((item) => item.tenantId === actor.tenantId); }

  private limit<T>(items: T[], limit?: string): T[] { const parsed = Number(limit ?? 50); return items.slice(0, Number.isFinite(parsed) ? parsed : 50); }
  private findAccount(actor: RequestActor, id: string): CustomerAccount { const item = this.store.getState().accounts.find((account) => account.tenantId === actor.tenantId && account.id === id); if (!item) notFound(`Account ${id} not found`); return item; }
  private findContact(actor: RequestActor, id: string): Contact { const item = this.store.getState().contacts.find((contact) => contact.tenantId === actor.tenantId && contact.id === id); if (!item) notFound(`Contact ${id} not found`); return item; }
  private findOpportunity(actor: RequestActor, id: string): Opportunity { const item = this.store.getState().opportunities.find((opp) => opp.tenantId === actor.tenantId && opp.id === id); if (!item) notFound(`Opportunity ${id} not found`); return item; }
  private findTicket(actor: RequestActor, id: string): Ticket { const item = this.store.getState().tickets.find((ticket) => ticket.tenantId === actor.tenantId && ticket.id === id); if (!item) notFound(`Ticket ${id} not found`); return item; }
  private findTask(actor: RequestActor, id: string): ClientTask { const item = this.store.getState().tasks.find((task) => task.tenantId === actor.tenantId && task.id === id); if (!item) notFound(`Task ${id} not found`); return item; }
  private findSegment(actor: RequestActor, id: string): ClientSegment { const item = this.store.getState().segments.find((segment) => segment.tenantId === actor.tenantId && segment.id === id); if (!item) notFound(`Segment ${id} not found`); return item; }
  private findSlaPolicy(actor: RequestActor, id: string): SlaPolicy { const item = this.store.getState().slaPolicies.find((policy) => policy.tenantId === actor.tenantId && policy.id === id); if (!item) notFound(`SLA policy ${id} not found`); return item; }
  private defaultSlaPolicy(actor: RequestActor, priority: string): SlaPolicy | undefined { return this.store.getState().slaPolicies.find((policy) => policy.tenantId === actor.tenantId && policy.priority === priority && policy.status === "active"); }

  private applyOpportunityStage(opportunity: Opportunity, stage: OpportunityStage, lostReason?: string): void {
    if (!stage) badRequest("stage is required");
    opportunity.stage = stage;
    opportunity.probability = probabilityForStage(stage);
    if (stage === "won") { opportunity.status = "won"; opportunity.closedAt = nowIso(); opportunity.lostReason = undefined; }
    else if (stage === "lost") { opportunity.status = "lost"; opportunity.closedAt = nowIso(); opportunity.lostReason = lostReason ?? opportunity.lostReason; }
    else { opportunity.status = "open"; opportunity.closedAt = undefined; opportunity.lostReason = undefined; }
  }

  private assertRelatedExists(actor: RequestActor, type: string, id: string): void {
    if (type === "account") this.findAccount(actor, id); else if (type === "contact") this.findContact(actor, id); else if (type === "opportunity") this.findOpportunity(actor, id); else if (type === "ticket") this.findTicket(actor, id); else badRequest(`Unsupported related entity type: ${type}`);
  }

  private evaluateSegmentFilters(actor: RequestActor, filters: any): CustomerAccount[] {
    let accounts = this.store.getState().accounts.filter((account) => account.tenantId === actor.tenantId && account.status !== "archived");
    const statuses = asArray<AccountStatus>(filters.statuses);
    const lifecycleStages = asArray<LifecycleStage>(filters.lifecycleStages);
    const tags = asArray<string>(filters.tags);
    if (statuses.length) accounts = accounts.filter((account) => statuses.includes(account.status));
    if (lifecycleStages.length) accounts = accounts.filter((account) => lifecycleStages.includes(account.lifecycleStage));
    if (tags.length) accounts = accounts.filter((account) => tags.every((tag) => account.tags.includes(tag)));
    if (filters.ownerUserId) accounts = accounts.filter((account) => account.ownerUserId === filters.ownerUserId);
    if (filters.healthScoreBelow !== undefined) accounts = accounts.filter((account) => account.healthScore < Number(filters.healthScoreBelow));
    if (filters.healthScoreAbove !== undefined) accounts = accounts.filter((account) => account.healthScore > Number(filters.healthScoreAbove));
    return accounts;
  }
}

function probabilityForStage(stage: OpportunityStage): number {
  const map: Record<OpportunityStage, number> = { new: 10, qualified: 30, proposal: 55, negotiation: 75, won: 100, lost: 0 };
  return map[stage] ?? 10;
}
function severityForPriority(priority: string): "s1" | "s2" | "s3" | "s4" { return priority === "urgent" ? "s1" : priority === "high" ? "s2" : priority === "medium" ? "s3" : "s4"; }
