import {
  Community,
  Member,
  Group,
  Post,
  Discussion,
  DiscussionReply,
  Event,
  EventRegistration,
  Resource,
  Badge,
  MemberBadge,
  Challenge,
  ChallengeCompletion,
  CommunityRole,
  CommunityOverview,
  CommunityEvent,
  RequestActor
} from "./domain";
import { DataStore } from "./core/datastore";
import { newId, nowIso } from "./core/id";
import {
  badRequest,
  notFound,
  conflict,
  ensureString,
  ensureNumber,
  ensureBoolean,
  ensureArray,
  ensureObject,
  optionalObject,
  pickQuery,
  uniq,
  includesText
} from "./core/utils";

export class CommunityService {
  constructor(private readonly store: DataStore) {}

  createCommunity(actor: RequestActor, data: Record<string, unknown>): Community {
    const key = ensureString(data.key, "key");
    const name = ensureString(data.name, "name");
    const type = ensureString(data.type, "type");
    const ownerId = ensureString(data.ownerId, "ownerId");

    const existing = this.store.getState().communities.find(c => c.key === key && c.tenantId === actor.tenantId);
    if (existing) conflict(`Community with key "${key}" already exists`);

    const community: Community = {
      id: newId("comm"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name,
      description: ensureString(data.description, "description", ""),
      type: type as any,
      status: "active",
      category: ensureString(data.category, "category", ""),
      visibility: (data.visibility as any) || "public",
      memberCount: 0,
      ownerId,
      metadata: optionalObject(data.metadata)
    };

    this.store.getState().communities.push(community);
    this.store.audit(actor, "create", "Community", community.id, undefined, community);
    this.store.save();
    return community;
  }

  getCommunity(actor: RequestActor, id: string): Community {
    const community = this.store.getState().communities.find(c => c.id === id && c.tenantId === actor.tenantId);
    if (!community) notFound(`Community ${id} not found`);
    return community;
  }

  listCommunities(actor: RequestActor, query: URLSearchParams): Community[] {
    const state = this.store.getState();
    let communities = state.communities.filter(c => c.tenantId === actor.tenantId);

    const search = pickQuery(query, "search");
    if (search) {
      communities = communities.filter(c =>
        includesText(c.name, search) || includesText(c.description, search)
      );
    }

    const type = pickQuery(query, "type");
    if (type) {
      communities = communities.filter(c => c.type === type);
    }

    const status = pickQuery(query, "status");
    if (status) {
      communities = communities.filter(c => c.status === status);
    }

    return communities;
  }

  addMember(actor: RequestActor, data: Record<string, unknown>): Member {
    const communityId = ensureString(data.communityId, "communityId");
    const userId = ensureString(data.userId, "userId");
    const displayName = ensureString(data.displayName, "displayName");

    const community = this.getCommunity(actor, communityId);

    const existing = this.store.getState().members.find(
      m => m.communityId === communityId && m.userId === userId && m.tenantId === actor.tenantId
    );
    if (existing) conflict(`Member ${userId} already exists in community ${communityId}`);

    const member: Member = {
      id: newId("mem"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      communityId,
      userId,
      displayName,
      email: ensureString(data.email, "email", ""),
      avatar: ensureString(data.avatar, "avatar", ""),
      status: "active",
      role: (data.role as any) || "member",
      joinedAt: nowIso(),
      lastActiveAt: nowIso(),
      engagementScore: 0,
      points: 0,
      level: 1,
      badges: [],
      tags: ensureArray(data.tags, "tags", []),
      metadata: optionalObject(data.metadata)
    };

    this.store.getState().members.push(member);
    community.memberCount++;
    this.store.audit(actor, "add_member", "Member", member.id, undefined, member);
    this.store.save();
    return member;
  }

  getMember(actor: RequestActor, id: string): Member {
    const member = this.store.getState().members.find(m => m.id === id && m.tenantId === actor.tenantId);
    if (!member) notFound(`Member ${id} not found`);
    return member;
  }

  listMembers(actor: RequestActor, query: URLSearchParams): Member[] {
    const state = this.store.getState();
    const communityId = pickQuery(query, "communityId");
    let members = state.members.filter(m => m.tenantId === actor.tenantId);

    if (communityId) {
      members = members.filter(m => m.communityId === communityId);
    }

    const status = pickQuery(query, "status");
    if (status) {
      members = members.filter(m => m.status === status);
    }

    const role = pickQuery(query, "role");
    if (role) {
      members = members.filter(m => m.role === role);
    }

    return members;
  }

  createGroup(actor: RequestActor, data: Record<string, unknown>): Group {
    const communityId = ensureString(data.communityId, "communityId");
    const name = ensureString(data.name, "name");
    const type = ensureString(data.type, "type");
    const ownerId = ensureString(data.ownerId, "ownerId");

    this.getCommunity(actor, communityId);

    const group: Group = {
      id: newId("grp"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      communityId,
      name,
      description: ensureString(data.description, "description", ""),
      type: type as any,
      status: "active",
      memberCount: 0,
      ownerId,
      metadata: optionalObject(data.metadata)
    };

    this.store.getState().groups.push(group);
    this.store.audit(actor, "create", "Group", group.id, undefined, group);
    this.store.save();
    return group;
  }

  listGroups(actor: RequestActor, query: URLSearchParams): Group[] {
    const communityId = pickQuery(query, "communityId");
    let groups = this.store.getState().groups.filter(g => g.tenantId === actor.tenantId);

    if (communityId) {
      groups = groups.filter(g => g.communityId === communityId);
    }

    return groups;
  }

  createPost(actor: RequestActor, data: Record<string, unknown>): Post {
    const communityId = ensureString(data.communityId, "communityId");
    const authorId = ensureString(data.authorId, "authorId");
    const type = ensureString(data.type, "type");
    const content = ensureString(data.content, "content");

    this.getCommunity(actor, communityId);

    const post: Post = {
      id: newId("post"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      communityId,
      groupId: ensureString(data.groupId, "groupId", ""),
      authorId,
      type: type as any,
      title: ensureString(data.title, "title", ""),
      content,
      status: "active",
      likes: 0,
      comments: 0,
      views: 0,
      isPinned: false,
      isLocked: false,
      tags: ensureArray(data.tags, "tags", []),
      metadata: optionalObject(data.metadata)
    };

    this.store.getState().posts.push(post);
    this.store.audit(actor, "create", "Post", post.id, undefined, post);
    this.emit(actor, "community.post.created", { postId: post.id, communityId });
    this.store.save();
    return post;
  }

  listPosts(actor: RequestActor, query: URLSearchParams): Post[] {
    const communityId = pickQuery(query, "communityId");
    let posts = this.store.getState().posts.filter(p => p.tenantId === actor.tenantId);

    if (communityId) {
      posts = posts.filter(p => p.communityId === communityId);
    }

    const type = pickQuery(query, "type");
    if (type) {
      posts = posts.filter(p => p.type === type);
    }

    const search = pickQuery(query, "search");
    if (search) {
      posts = posts.filter(p =>
        includesText(p.title, search) || includesText(p.content, search)
      );
    }

    return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createDiscussion(actor: RequestActor, data: Record<string, unknown>): Discussion {
    const communityId = ensureString(data.communityId, "communityId");
    const authorId = ensureString(data.authorId, "authorId");
    const title = ensureString(data.title, "title");
    const content = ensureString(data.content, "content");
    const category = ensureString(data.category, "category");

    this.getCommunity(actor, communityId);

    const discussion: Discussion = {
      id: newId("disc"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      communityId,
      groupId: ensureString(data.groupId, "groupId", ""),
      authorId,
      title,
      content,
      category: category as any,
      status: "active",
      replies: 0,
      views: 0,
      isPinned: false,
      isLocked: false,
      isSolved: false,
      tags: ensureArray(data.tags, "tags", []),
      metadata: optionalObject(data.metadata)
    };

    this.store.getState().discussions.push(discussion);
    this.store.audit(actor, "create", "Discussion", discussion.id, undefined, discussion);
    this.store.save();
    return discussion;
  }

  listDiscussions(actor: RequestActor, query: URLSearchParams): Discussion[] {
    const communityId = pickQuery(query, "communityId");
    let discussions = this.store.getState().discussions.filter(d => d.tenantId === actor.tenantId);

    if (communityId) {
      discussions = discussions.filter(d => d.communityId === communityId);
    }

    const category = pickQuery(query, "category");
    if (category) {
      discussions = discussions.filter(d => d.category === category);
    }

    return discussions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createEvent(actor: RequestActor, data: Record<string, unknown>): Event {
    const communityId = ensureString(data.communityId, "communityId");
    const organizerId = ensureString(data.organizerId, "organizerId");
    const title = ensureString(data.title, "title");
    const type = ensureString(data.type, "type");
    const startDate = ensureString(data.startDate, "startDate");

    this.getCommunity(actor, communityId);

    const event: Event = {
      id: newId("evt"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      communityId,
      organizerId,
      title,
      description: ensureString(data.description, "description", ""),
      type: type as any,
      status: "active",
      startDate,
      endDate: ensureString(data.endDate, "endDate", ""),
      timezone: ensureString(data.timezone, "timezone", "UTC"),
      location: ensureString(data.location, "location", ""),
      isOnline: ensureBoolean(data.isOnline, true),
      maxAttendees: ensureNumber(data.maxAttendees, "maxAttendees", 0),
      registeredCount: 0,
      attendedCount: 0,
      registrationRequired: ensureBoolean(data.registrationRequired, true),
      tags: ensureArray(data.tags, "tags", []),
      metadata: optionalObject(data.metadata)
    };

    this.store.getState().events.push(event);
    this.store.audit(actor, "create", "Event", event.id, undefined, event);
    this.emit(actor, "community.event.created", { eventId: event.id, communityId });
    this.store.save();
    return event;
  }

  listEvents(actor: RequestActor, query: URLSearchParams): Event[] {
    const communityId = pickQuery(query, "communityId");
    let events = this.store.getState().events.filter(e => e.tenantId === actor.tenantId);

    if (communityId) {
      events = events.filter(e => e.communityId === communityId);
    }

    const upcoming = pickQuery(query, "upcoming");
    if (upcoming === "true") {
      const now = nowIso();
      events = events.filter(e => e.startDate >= now && e.status === "active");
    }

    return events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  registerForEvent(actor: RequestActor, eventId: string, memberId: string): EventRegistration {
    const event = this.store.getState().events.find(e => e.id === eventId && e.tenantId === actor.tenantId);
    if (!event) notFound(`Event ${eventId} not found`);

    const member = this.getMember(actor, memberId);

    const existing = this.store.getState().eventRegistrations.find(
      r => r.eventId === eventId && r.memberId === memberId && r.tenantId === actor.tenantId
    );
    if (existing) conflict(`Member ${memberId} already registered for event ${eventId}`);

    const registration: EventRegistration = {
      id: newId("reg"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      eventId,
      memberId,
      status: "registered",
      registeredAt: nowIso(),
      feedbackSubmitted: false
    };

    this.store.getState().eventRegistrations.push(registration);
    event.registeredCount++;
    this.store.audit(actor, "register", "EventRegistration", registration.id, undefined, registration);
    this.emit(actor, "community.event.registered", { eventId, memberId });
    this.store.save();
    return registration;
  }

  createBadge(actor: RequestActor, data: Record<string, unknown>): Badge {
    const communityId = ensureString(data.communityId, "communityId");
    const key = ensureString(data.key, "key");
    const name = ensureString(data.name, "name");

    this.getCommunity(actor, communityId);

    const existing = this.store.getState().badges.find(
      b => b.communityId === communityId && b.key === key && b.tenantId === actor.tenantId
    );
    if (existing) conflict(`Badge with key "${key}" already exists in community ${communityId}`);

    const badge: Badge = {
      id: newId("badge"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      communityId,
      key,
      name,
      description: ensureString(data.description, "description", ""),
      icon: ensureString(data.icon, "icon", ""),
      type: (data.type as any) || "achievement",
      points: ensureNumber(data.points, "points", 0),
      criteria: ensureString(data.criteria, "criteria", ""),
      status: "active",
      awardedCount: 0,
      metadata: optionalObject(data.metadata)
    };

    this.store.getState().badges.push(badge);
    this.store.audit(actor, "create", "Badge", badge.id, undefined, badge);
    this.store.save();
    return badge;
  }

  awardBadge(actor: RequestActor, badgeId: string, memberId: string): MemberBadge {
    const badge = this.store.getState().badges.find(b => b.id === badgeId && b.tenantId === actor.tenantId);
    if (!badge) notFound(`Badge ${badgeId} not found`);

    const member = this.getMember(actor, memberId);

    const existing = this.store.getState().memberBadges.find(
      mb => mb.badgeId === badgeId && mb.memberId === memberId && mb.tenantId === actor.tenantId
    );
    if (existing) conflict(`Member ${memberId} already has badge ${badgeId}`);

    const memberBadge: MemberBadge = {
      id: newId("mbadge"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      badgeId,
      memberId,
      awardedAt: nowIso(),
      awardedBy: actor.userId,
      metadata: {}
    };

    this.store.getState().memberBadges.push(memberBadge);
    badge.awardedCount++;
    member.badges.push(badgeId);
    member.points += badge.points;
    this.recalculateLevel(member);
    this.store.audit(actor, "award", "MemberBadge", memberBadge.id, undefined, memberBadge);
    this.emit(actor, "community.badge.awarded", { badgeId, memberId });
    this.store.save();
    return memberBadge;
  }

  private recalculateLevel(member: Member): void {
    const levels = [
      { level: 1, points: 0 },
      { level: 2, points: 100 },
      { level: 3, points: 300 },
      { level: 4, points: 600 },
      { level: 5, points: 1000 },
      { level: 6, points: 1500 },
      { level: 7, points: 2100 },
      { level: 8, points: 2800 },
      { level: 9, points: 3600 },
      { level: 10, points: 4500 }
    ];

    for (let i = levels.length - 1; i >= 0; i--) {
      if (member.points >= levels[i].points) {
        member.level = levels[i].level;
        break;
      }
    }
  }

  createResource(actor: RequestActor, data: Record<string, unknown>): Resource {
    const communityId = ensureString(data.communityId, "communityId");
    const uploadedBy = ensureString(data.uploadedBy, "uploadedBy");
    const title = ensureString(data.title, "title");
    const type = ensureString(data.type, "type");

    this.getCommunity(actor, communityId);

    const resource: Resource = {
      id: newId("res"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      communityId,
      uploadedBy,
      title,
      description: ensureString(data.description, "description", ""),
      type: type as any,
      url: ensureString(data.url, "url", ""),
      fileSize: ensureNumber(data.fileSize, "fileSize", 0),
      downloads: 0,
      status: "active",
      tags: ensureArray(data.tags, "tags", []),
      accessLevel: (data.accessLevel as any) || "member",
      metadata: optionalObject(data.metadata)
    };

    this.store.getState().resources.push(resource);
    this.store.audit(actor, "create", "Resource", resource.id, undefined, resource);
    this.store.save();
    return resource;
  }

  listResources(actor: RequestActor, query: URLSearchParams): Resource[] {
    const communityId = pickQuery(query, "communityId");
    let resources = this.store.getState().resources.filter(r => r.tenantId === actor.tenantId);

    if (communityId) {
      resources = resources.filter(r => r.communityId === communityId);
    }

    const type = pickQuery(query, "type");
    if (type) {
      resources = resources.filter(r => r.type === type);
    }

    return resources.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getOverview(actor: RequestActor): CommunityOverview {
    const state = this.store.getState();
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const members = state.members.filter(m => m.tenantId === actor.tenantId);
    const activeMembers = members.filter(m => m.status === "active");
    const newMembers = members.filter(m => m.createdAt >= oneMonthAgo);

    const communities = state.communities.filter(c => c.tenantId === actor.tenantId);
    const groups = state.groups.filter(g => g.tenantId === actor.tenantId);
    const posts = state.posts.filter(p => p.tenantId === actor.tenantId);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentPosts = posts.filter(p => p.createdAt >= oneWeekAgo);

    const discussions = state.discussions.filter(d => d.tenantId === actor.tenantId);
    const events = state.events.filter(e => e.tenantId === actor.tenantId);
    const upcomingEvents = events.filter(e => e.startDate >= now.toISOString() && e.status === "active");
    const completedEvents = events.filter(e => e.startDate < now.toISOString());

    const resources = state.resources.filter(r => r.tenantId === actor.tenantId);
    const badges = state.badges.filter(b => b.tenantId === actor.tenantId);

    const avgEngagement = activeMembers.length > 0
      ? Math.round(activeMembers.reduce((sum, m) => sum + m.engagementScore, 0) / activeMembers.length)
      : 0;

    return {
      communities: communities.length,
      members: {
        total: members.length,
        active: activeMembers.length,
        newThisMonth: newMembers.length
      },
      groups: {
        total: groups.length,
        active: groups.filter(g => g.status === "active").length
      },
      posts: {
        total: posts.length,
        thisWeek: recentPosts.length
      },
      discussions: {
        total: discussions.length,
        open: discussions.filter(d => !d.isSolved && !d.isLocked).length,
        solved: discussions.filter(d => d.isSolved).length
      },
      events: {
        upcoming: upcomingEvents.length,
        completed: completedEvents.length
      },
      resources: {
        total: resources.length,
        downloads: resources.reduce((sum, r) => sum + r.downloads, 0)
      },
      badges: {
        total: badges.length,
        awarded: badges.reduce((sum, b) => sum + b.awardedCount, 0)
      },
      engagement: {
        score: avgEngagement,
        trend: "stable"
      },
      healthScore: this.calculateHealthScore(activeMembers, discussions, events, upcomingEvents)
    };
  }

  private calculateHealthScore(
    activeMembers: Member[],
    discussions: Discussion[],
    events: Event[],
    upcomingEvents: Event[]
  ): number {
    let score = 50;

    if (activeMembers.length > 10) score += 10;
    if (activeMembers.length > 50) score += 10;
    if (activeMembers.length > 100) score += 10;

    if (discussions.length > 20) score += 10;
    if (discussions.filter(d => d.isSolved).length / discussions.length > 0.5) score += 10;

    if (upcomingEvents.length > 0) score += 10;
    if (events.length > 5) score += 10;

    return Math.min(100, score);
  }

  private emit(actor: RequestActor, eventType: string, data: Record<string, unknown>): void {
    const event: CommunityEvent = {
      id: newId("cevt"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type: eventType,
      source: "CommunityOS",
      data
    };
    this.store.getState().events.push(event);
  }
}
