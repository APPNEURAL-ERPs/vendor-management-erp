import { DataStore } from "./core/datastore";
import {
  Contact,
  Presence,
  Channel,
  Conversation,
  ConversationParticipant,
  Message,
  MessageAttachment,
  MessageTemplate,
  MessageDraft,
  Call,
  CallParticipant,
  Conference,
  ConferenceParticipant,
  Announcement,
  CommunicationOverview,
  RequestActor,
  Channel as ChannelType
} from "./domain";
import { badRequest, conflict, notFound } from "./core/errors";
import { newId, nowIso } from "./core/id";
import { clone, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, optionalObject, pickQuery } from "./core/utils";

export class CommunicationService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "CommunicationOS service is ready";
  }

  overview(actor: RequestActor): CommunicationOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;

    const conversations = state.conversations.filter(c => c.tenantId === tenant);
    const messages = state.messages.filter(m => m.tenantId === tenant);
    const channels = state.channels.filter(c => c.tenantId === tenant);
    const calls = state.calls.filter(c => c.tenantId === tenant);
    const conferences = state.conferences.filter(c => c.tenantId === tenant);
    const presences = state.presences.filter(p => p.tenantId === tenant);

    return {
      conversations: {
        total: conversations.length,
        open: conversations.filter(c => ["open", "assigned", "waiting_reply", "waiting_customer"].includes(c.status)).length,
        closed: conversations.filter(c => ["closed", "archived", "resolved"].includes(c.status)).length,
        byStatus: this.countBy(conversations, "status")
      },
      messages: {
        total: messages.length,
        sent: messages.filter(m => m.direction === "outbound").length,
        received: messages.filter(m => m.direction === "inbound").length,
        pending: messages.filter(m => m.status === "pending").length,
        failed: messages.filter(m => m.status === "failed").length
      },
      channels: {
        total: channels.length,
        active: channels.filter(c => c.status === "active").length,
        byType: this.countBy(channels, "type")
      },
      calls: {
        total: calls.length,
        active: calls.filter(c => ["initiated", "ringing", "answered"].includes(c.status)).length,
        duration: calls.filter(c => c.duration).reduce((sum, c) => sum + (c.duration || 0), 0)
      },
      conferences: {
        total: conferences.length,
        scheduled: conferences.filter(c => c.status === "active").length,
        completed: conferences.filter(c => c.actualEndAt).length
      },
      presence: {
        online: presences.filter(p => p.status === "online").length,
        offline: presences.filter(p => p.status === "offline").length,
        away: presences.filter(p => ["away", "do_not_disturb"].includes(p.status)).length
      },
      unread: conversations.reduce((sum, c) => sum + c.unreadCount, 0),
      slaBreaches: conversations.filter(c => c.slaBreached).length
    };
  }

  private countBy(items: any[], key: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const value = String(item[key]);
      acc[value] = (acc[value] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  listChannels(actor: RequestActor): Channel[] {
    return clone(this.store.getState().channels.filter(c => c.tenantId === actor.tenantId));
  }

  createChannel(input: unknown, actor: RequestActor): Channel {
    const body = ensureObject(input, "channel");
    const state = this.store.getState();
    const key = ensureString(body.key, "channel.key");
    if (state.channels.some(c => c.tenantId === actor.tenantId && c.key === key)) {
      conflict(`Channel key '${key}' already exists`);
    }
    const channel: Channel = {
      id: newId("channel"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "channel.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "email") as ChannelType["type"],
      status: String(body.status ?? "active") as any,
      isPrivate: ensureBoolean(body.isPrivate, false),
      tags: ensureArray<string>(body.tags, "channel.tags"),
      metadata: optionalObject(body.metadata),
      config: optionalObject(body.config)
    };
    state.channels.push(channel);
    this.store.save();
    this.store.audit(actor, "channel.create", "channel", channel.id, undefined, channel);
    return clone(channel);
  }

  listContacts(actor: RequestActor, query?: URLSearchParams): Contact[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    return clone(this.store.getState().contacts.filter(c => {
      if (c.tenantId !== actor.tenantId) return false;
      if (search && !`${c.displayName} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  createContact(input: unknown, actor: RequestActor): Contact {
    const body = ensureObject(input, "contact");
    const contact: Contact = {
      id: newId("contact"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      externalId: body.externalId ? String(body.externalId) : undefined,
      email: body.email ? String(body.email) : undefined,
      phone: body.phone ? String(body.phone) : undefined,
      displayName: ensureString(body.displayName, "contact.displayName"),
      firstName: body.firstName ? String(body.firstName) : undefined,
      lastName: body.lastName ? String(body.lastName) : undefined,
      avatarUrl: body.avatarUrl ? String(body.avatarUrl) : undefined,
      status: String(body.status ?? "active") as Contact["status"],
      metadata: optionalObject(body.metadata),
      tags: ensureArray<string>(body.tags, "contact.tags")
    };
    this.store.getState().contacts.push(contact);
    this.store.save();
    this.store.audit(actor, "contact.create", "contact", contact.id, undefined, contact);
    return clone(contact);
  }

  listConversations(actor: RequestActor, query?: URLSearchParams): Conversation[] {
    const channelId = pickQuery(query, "channelId");
    const status = pickQuery(query, "status");
    const type = pickQuery(query, "type");
    const search = pickQuery(query, "search")?.toLowerCase();

    return clone(this.store.getState().conversations.filter(c => {
      if (c.tenantId !== actor.tenantId) return false;
      if (channelId && c.channelId !== channelId) return false;
      if (status && c.status !== status) return false;
      if (type && c.type !== type) return false;
      if (search && !`${c.title ?? ""} ${c.tags.join(" ")}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  getConversation(id: string, actor: RequestActor): { conversation: Conversation; messages: Message[] } {
    const conversation = this.store.getState().conversations.find(c => c.id === id && c.tenantId === actor.tenantId);
    if (!conversation) notFound("Conversation not found");

    const messages = this.store.getState().messages.filter(m => m.conversationId === id && m.tenantId === actor.tenantId);
    return { conversation: clone(conversation), messages: clone(messages) };
  }

  createConversation(input: unknown, actor: RequestActor): Conversation {
    const body = ensureObject(input, "conversation");
    const state = this.store.getState();

    const channel = state.channels.find(c => c.id === body.channelId && c.tenantId === actor.tenantId);
    if (!channel) notFound("Channel not found");

    const contact = body.contactId ? state.contacts.find(c => c.id === body.contactId && c.tenantId === actor.tenantId) : undefined;
    if (body.contactId && !contact) notFound("Contact not found");

    const conversation: Conversation = {
      id: newId("conv"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      channelId: channel.id,
      title: body.title ? String(body.title) : undefined,
      status: String(body.status ?? "new") as Conversation["status"],
      priority: String(body.priority ?? "normal") as Conversation["priority"],
      type: String(body.type ?? "support") as Conversation["type"],
      assigneeId: body.assigneeId ? String(body.assigneeId) : undefined,
      contactId: contact?.id,
      tags: ensureArray<string>(body.tags, "conversation.tags"),
      metadata: optionalObject(body.metadata),
      lastMessageAt: nowIso(),
      messageCount: 0,
      unreadCount: 0,
      slaBreached: false
    };

    state.conversations.unshift(conversation);
    this.store.save();
    this.store.audit(actor, "conversation.create", "conversation", conversation.id, undefined, conversation);
    return clone(conversation);
  }

  updateConversation(id: string, input: unknown, actor: RequestActor): Conversation {
    const body = ensureObject(input, "conversation");
    const state = this.store.getState();
    const conversation = state.conversations.find(c => c.id === id && c.tenantId === actor.tenantId);
    if (!conversation) notFound("Conversation not found");

    const before = clone(conversation);

    if (body.status) conversation.status = String(body.status) as Conversation["status"];
    if (body.priority) conversation.priority = String(body.priority) as Conversation["priority"];
    if (body.assigneeId !== undefined) conversation.assigneeId = body.assigneeId ? String(body.assigneeId) : undefined;
    if (body.title !== undefined) conversation.title = body.title ? String(body.title) : undefined;
    if (body.tags) conversation.tags = ensureArray<string>(body.tags, "tags");

    conversation.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "conversation.update", "conversation", conversation.id, before, conversation);
    return clone(conversation);
  }

  listMessages(actor: RequestActor, query?: URLSearchParams): Message[] {
    const conversationId = pickQuery(query, "conversationId");
    const channelId = pickQuery(query, "channelId");
    const status = pickQuery(query, "status");

    return clone(this.store.getState().messages.filter(m => {
      if (m.tenantId !== actor.tenantId) return false;
      if (conversationId && m.conversationId !== conversationId) return false;
      if (channelId && m.channelId !== channelId) return false;
      if (status && m.status !== status) return false;
      return true;
    }));
  }

  createMessage(input: unknown, actor: RequestActor): Message {
    const body = ensureObject(input, "message");
    const state = this.store.getState();

    const conversation = state.conversations.find(c => c.id === body.conversationId && c.tenantId === actor.tenantId);
    if (!conversation) notFound("Conversation not found");

    const channel = state.channels.find(c => c.id === body.channelId && c.tenantId === actor.tenantId);
    if (!channel) notFound("Channel not found");

    const message: Message = {
      id: newId("msg"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      conversationId: conversation.id,
      channelId: channel.id,
      senderId: body.senderId ? String(body.senderId) : actor.userId,
      senderType: String(body.senderType ?? "user") as Message["senderType"],
      content: ensureString(body.content, "message.content"),
      contentType: String(body.contentType ?? "text") as Message["contentType"],
      direction: String(body.direction ?? "outbound") as Message["direction"],
      status: "sent",
      attachments: [],
      metadata: optionalObject(body.metadata),
      parentMessageId: body.parentMessageId ? String(body.parentMessageId) : undefined,
      isRead: body.direction === "inbound" ? false : true,
      sentAt: nowIso()
    };

    state.messages.push(message);
    conversation.lastMessageAt = nowIso();
    conversation.messageCount++;
    if (message.direction === "inbound") conversation.unreadCount++;

    this.store.save();
    this.store.audit(actor, "message.create", "message", message.id, undefined, message);
    return clone(message);
  }

  listMessageTemplates(actor: RequestActor): MessageTemplate[] {
    return clone(this.store.getState().messageTemplates.filter(t => t.tenantId === actor.tenantId));
  }

  createMessageTemplate(input: unknown, actor: RequestActor): MessageTemplate {
    const body = ensureObject(input, "template");
    const state = this.store.getState();
    const key = ensureString(body.key, "template.key");
    if (state.messageTemplates.some(t => t.tenantId === actor.tenantId && t.key === key)) {
      conflict(`Template key '${key}' already exists`);
    }

    const template: MessageTemplate = {
      id: newId("template"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "template.name"),
      description: body.description ? String(body.description) : undefined,
      channelType: String(body.channelType ?? "email") as ChannelType["type"],
      subject: body.subject ? String(body.subject) : undefined,
      content: ensureString(body.content, "template.content"),
      variables: ensureArray<string>(body.variables, "template.variables"),
      status: String(body.status ?? "active") as any,
      tags: ensureArray<string>(body.tags, "template.tags"),
      createdBy: actor.userId,
      metadata: optionalObject(body.metadata)
    };

    state.messageTemplates.push(template);
    this.store.save();
    this.store.audit(actor, "template.create", "messageTemplate", template.id, undefined, template);
    return clone(template);
  }

  listCalls(actor: RequestActor, query?: URLSearchParams): Call[] {
    const status = pickQuery(query, "status");
    return clone(this.store.getState().calls.filter(c => {
      if (c.tenantId !== actor.tenantId) return false;
      if (status && c.status !== status) return false;
      return true;
    }));
  }

  createCall(input: unknown, actor: RequestActor): Call {
    const body = ensureObject(input, "call");
    const call: Call = {
      id: newId("call"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      conversationId: body.conversationId ? String(body.conversationId) : undefined,
      initiatorId: actor.userId,
      direction: String(body.direction ?? "outbound") as Call["direction"],
      status: "initiated",
      type: String(body.type ?? "voice") as Call["type"],
      startedAt: nowIso(),
      metadata: optionalObject(body.metadata)
    };

    this.store.getState().calls.unshift(call);
    this.store.save();
    this.store.audit(actor, "call.create", "call", call.id, undefined, call);
    return clone(call);
  }

  updateCall(id: string, input: unknown, actor: RequestActor): Call {
    const body = ensureObject(input, "call");
    const state = this.store.getState();
    const call = state.calls.find(c => c.id === id && c.tenantId === actor.tenantId);
    if (!call) notFound("Call not found");

    const before = clone(call);

    if (body.status) call.status = String(body.status) as Call["status"];
    if (body.duration !== undefined) call.duration = ensureNumber(body.duration, "duration");
    if (body.answeredAt) call.answeredAt = String(body.answeredAt);
    if (body.endedAt) call.endedAt = String(body.endedAt);
    if (body.recordingUrl) call.recordingUrl = String(body.recordingUrl);
    if (body.notes) call.notes = String(body.notes);

    call.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "call.update", "call", call.id, before, call);
    return clone(call);
  }

  listConferences(actor: RequestActor): Conference[] {
    return clone(this.store.getState().conferences.filter(c => c.tenantId === actor.tenantId));
  }

  createConference(input: unknown, actor: RequestActor): Conference {
    const body = ensureObject(input, "conference");
    const conference: Conference = {
      id: newId("conf"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: ensureString(body.key, "conference.key"),
      name: ensureString(body.name, "conference.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "meeting") as Conference["type"],
      status: String(body.status ?? "active") as any,
      scheduledStartAt: ensureString(body.scheduledStartAt, "conference.scheduledStartAt"),
      scheduledEndAt: ensureString(body.scheduledEndAt, "conference.scheduledEndAt"),
      hostId: actor.userId,
      maxParticipants: ensureNumber(body.maxParticipants, "conference.maxParticipants", 10),
      joinUrl: body.joinUrl ? String(body.joinUrl) : undefined,
      recordingEnabled: ensureBoolean(body.recordingEnabled, false),
      agenda: body.agenda ? String(body.agenda) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      metadata: optionalObject(body.metadata)
    };

    this.store.getState().conferences.push(conference);
    this.store.save();
    this.store.audit(actor, "conference.create", "conference", conference.id, undefined, conference);
    return clone(conference);
  }

  listPresences(actor: RequestActor): Presence[] {
    return clone(this.store.getState().presences.filter(p => p.tenantId === actor.tenantId));
  }

  updatePresence(userId: string, input: unknown, actor: RequestActor): Presence {
    const body = ensureObject(input, "presence");
    const state = this.store.getState();
    let presence = state.presences.find(p => p.userId === userId && p.tenantId === actor.tenantId);

    if (!presence) {
      presence = {
        id: newId("presence"),
        tenantId: actor.tenantId,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        userId,
        status: "online",
        metadata: {}
      };
      state.presences.push(presence);
    }

    const before = clone(presence);

    if (body.status) presence.status = String(body.status) as Presence["status"];
    if (body.statusMessage !== undefined) presence.statusMessage = body.statusMessage ? String(body.statusMessage) : undefined;
    presence.lastSeenAt = nowIso();
    if (body.metadata) presence.metadata = optionalObject(body.metadata);

    presence.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "presence.update", "presence", presence.id, before, presence);
    return clone(presence);
  }

  listAnnouncements(actor: RequestActor): Announcement[] {
    return clone(this.store.getState().announcements.filter(a => a.tenantId === actor.tenantId));
  }

  createAnnouncement(input: unknown, actor: RequestActor): Announcement {
    const body = ensureObject(input, "announcement");
    const announcement: Announcement = {
      id: newId("announcement"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: ensureString(body.key, "announcement.key"),
      title: ensureString(body.title, "announcement.title"),
      content: ensureString(body.content, "announcement.content"),
      channelType: String(body.channelType ?? "email") as ChannelType["type"],
      targetType: String(body.targetType ?? "all") as Announcement["targetType"],
      targetIds: ensureArray<string>(body.targetIds, "announcement.targetIds"),
      status: String(body.status ?? "active") as any,
      scheduledAt: body.scheduledAt ? String(body.scheduledAt) : undefined,
      sentBy: actor.userId,
      recipientCount: 0,
      deliveredCount: 0,
      readCount: 0,
      tags: ensureArray<string>(body.tags, "announcement.tags"),
      metadata: optionalObject(body.metadata)
    };

    this.store.getState().announcements.push(announcement);
    this.store.save();
    this.store.audit(actor, "announcement.create", "announcement", announcement.id, undefined, announcement);
    return clone(announcement);
  }

  searchMessages(actor: RequestActor, query: string): Message[] {
    const lowerQuery = query.toLowerCase();
    return clone(this.store.getState().messages.filter(m => {
      if (m.tenantId !== actor.tenantId) return false;
      if (!m.content.toLowerCase().includes(lowerQuery)) return false;
      return true;
    }));
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter(log => log.tenantId === actor.tenantId));
  }
}
