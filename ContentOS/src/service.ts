import { DataStore } from "./core/datastore";
import {
  ContentStrategy,
  ContentPillar,
  ContentTopic,
  ContentCalendar,
  CalendarItem,
  ContentBrief,
  ContentPost,
  BlogPost,
  CarouselContent,
  NewsletterContent,
  ContentCampaign,
  ContentTemplate,
  ContentKeyword,
  SEOData,
  ContentApproval,
  ContentInsight,
  ContentOverview,
  RequestActor,
  CarouselSlide,
  NewsletterSection
} from "./domain";
import { badRequest, conflict, notFound } from "./core/errors";
import { newId, nowIso } from "./core/id";
import { clone, ensureArray, ensureBoolean, ensureNumber, ensureString, optionalObject, pickQuery } from "./core/utils";

export class ContentService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "ContentOS service is ready";
  }

  overview(actor: RequestActor): ContentOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;

    return {
      strategies: state.strategies.filter(item => item.tenantId === tenant).length,
      pillars: state.pillars.filter(item => item.tenantId === tenant).length,
      topics: state.topics.filter(item => item.tenantId === tenant).length,
      calendars: state.calendars.filter(item => item.tenantId === tenant).length,
      briefs: {
        total: state.briefs.filter(item => item.tenantId === tenant).length,
        pending: state.briefs.filter(item => item.tenantId === tenant && item.status === "draft").length,
        approved: state.briefs.filter(item => item.tenantId === tenant && item.status === "approved").length
      },
      posts: {
        total: state.posts.filter(item => item.tenantId === tenant).length,
        draft: state.posts.filter(item => item.tenantId === tenant && item.status === "draft").length,
        published: state.posts.filter(item => item.tenantId === tenant && item.status === "published").length,
        archived: state.posts.filter(item => item.tenantId === tenant && item.status === "archived").length
      },
      blogs: {
        total: state.blogs.filter(item => item.tenantId === tenant).length,
        draft: state.blogs.filter(item => item.tenantId === tenant && item.status === "draft").length,
        published: state.blogs.filter(item => item.tenantId === tenant && item.status === "published").length
      },
      carousels: {
        total: state.carousels.filter(item => item.tenantId === tenant).length,
        draft: state.carousels.filter(item => item.tenantId === tenant && item.status === "draft").length,
        published: state.carousels.filter(item => item.tenantId === tenant && item.status === "published").length
      },
      newsletters: {
        total: state.newsletters.filter(item => item.tenantId === tenant).length,
        draft: state.newsletters.filter(item => item.tenantId === tenant && item.status === "draft").length,
        sent: state.newsletters.filter(item => item.tenantId === tenant && item.status === "published").length
      },
      campaigns: {
        total: state.campaigns.filter(item => item.tenantId === tenant).length,
        active: state.campaigns.filter(item => item.tenantId === tenant && item.status === "active").length
      },
      templates: state.templates.filter(item => item.tenantId === tenant).length,
      keywords: state.keywords.filter(item => item.tenantId === tenant).length,
      approvals: {
        pending: state.approvals.filter(item => item.tenantId === tenant && item.status === "pending").length,
        approved: state.approvals.filter(item => item.tenantId === tenant && item.status === "approved").length,
        changesRequested: state.approvals.filter(item => item.tenantId === tenant && item.status === "changes_requested").length
      }
    };
  }

  listStrategies(actor: RequestActor): ContentStrategy[] {
    return clone(this.store.getState().strategies.filter(item => item.tenantId === actor.tenantId));
  }

  createStrategy(input: unknown, actor: RequestActor): ContentStrategy {
    const body = ensureObject(input, "strategy");
    const state = this.store.getState();
    const key = ensureString(body.key, "strategy.key");
    if (state.strategies.some(item => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Strategy key '${key}' already exists`);
    }
    const strategy: ContentStrategy = {
      id: newId("strategy"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "strategy.name"),
      description: body.description ? String(body.description) : undefined,
      goals: ensureArray<string>(body.goals, "strategy.goals", []),
      targetAudience: ensureString(body.targetAudience, "strategy.targetAudience"),
      pillars: ensureArray<string>(body.pillars, "strategy.pillars", []),
      channels: ensureArray<string>(body.channels, "strategy.channels", []),
      status: String(body.status ?? "active") as ContentStrategy["status"],
      metrics: optionalObject(body.metrics),
      createdBy: actor.userId
    };
    state.strategies.push(strategy);
    this.store.save();
    this.store.audit(actor, "strategy.create", "strategy", strategy.id, undefined, strategy);
    return clone(strategy);
  }

  listPillars(actor: RequestActor): ContentPillar[] {
    return clone(this.store.getState().pillars.filter(item => item.tenantId === actor.tenantId));
  }

  createPillar(input: unknown, actor: RequestActor): ContentPillar {
    const body = ensureObject(input, "pillar");
    const state = this.store.getState();
    const key = ensureString(body.key, "pillar.key");
    if (state.pillars.some(item => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Pillar key '${key}' already exists`);
    }
    const pillar: ContentPillar = {
      id: newId("pillar"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "pillar.name"),
      description: body.description ? String(body.description) : undefined,
      topics: ensureArray<string>(body.topics, "pillar.topics", []),
      status: String(body.status ?? "active") as ContentPillar["status"],
      contentCount: 0,
      engagementScore: 0,
      createdBy: actor.userId
    };
    state.pillars.push(pillar);
    this.store.save();
    this.store.audit(actor, "pillar.create", "pillar", pillar.id, undefined, pillar);
    return clone(pillar);
  }

  listTopics(actor: RequestActor, query?: URLSearchParams): ContentTopic[] {
    const pillarId = pickQuery(query, "pillarId");
    return clone(this.store.getState().topics.filter(item => {
      if (item.tenantId !== actor.tenantId) return false;
      if (pillarId && item.pillarId !== pillarId) return false;
      return true;
    }));
  }

  createTopic(input: unknown, actor: RequestActor): ContentTopic {
    const body = ensureObject(input, "topic");
    const state = this.store.getState();
    const key = ensureString(body.key, "topic.key");
    if (state.topics.some(item => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Topic key '${key}' already exists`);
    }
    const topic: ContentTopic = {
      id: newId("topic"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      title: ensureString(body.title, "topic.title"),
      description: body.description ? String(body.description) : undefined,
      pillarId: body.pillarId ? String(body.pillarId) : undefined,
      keywords: ensureArray<string>(body.keywords, "topic.keywords", []),
      status: String(body.status ?? "active") as ContentTopic["status"],
      contentCount: 0,
      priority: String(body.priority ?? "medium") as ContentTopic["priority"],
      createdBy: actor.userId
    };
    state.topics.push(topic);
    this.store.save();
    this.store.audit(actor, "topic.create", "topic", topic.id, undefined, topic);
    return clone(topic);
  }

  listCalendars(actor: RequestActor): ContentCalendar[] {
    return clone(this.store.getState().calendars.filter(item => item.tenantId === actor.tenantId));
  }

  createCalendar(input: unknown, actor: RequestActor): ContentCalendar {
    const body = ensureObject(input, "calendar");
    const state = this.store.getState();
    const key = ensureString(body.key, "calendar.key");
    if (state.calendars.some(item => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Calendar key '${key}' already exists`);
    }
    const calendar: ContentCalendar = {
      id: newId("calendar"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "calendar.name"),
      description: body.description ? String(body.description) : undefined,
      startDate: ensureString(body.startDate, "calendar.startDate"),
      endDate: ensureString(body.endDate, "calendar.endDate"),
      status: String(body.status ?? "active") as ContentCalendar["status"],
      createdBy: actor.userId
    };
    state.calendars.push(calendar);
    this.store.save();
    this.store.audit(actor, "calendar.create", "calendar", calendar.id, undefined, calendar);
    return clone(calendar);
  }

  listCalendarItems(actor: RequestActor, query?: URLSearchParams): CalendarItem[] {
    const calendarId = pickQuery(query, "calendarId");
    const date = pickQuery(query, "date");
    return clone(this.store.getState().calendarItems.filter(item => {
      if (item.tenantId !== actor.tenantId) return false;
      if (calendarId && item.calendarId !== calendarId) return false;
      if (date && item.date !== date) return false;
      return true;
    }));
  }

  createCalendarItem(input: unknown, actor: RequestActor): CalendarItem {
    const body = ensureObject(input, "calendarItem");
    const state = this.store.getState();
    if (body.calendarId) {
      const calendar = state.calendars.find(item => item.id === body.calendarId && item.tenantId === actor.tenantId);
      if (!calendar) notFound("Calendar not found");
    }
    const item: CalendarItem = {
      id: newId("calitem"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      calendarId: ensureString(body.calendarId, "calendarItem.calendarId"),
      date: ensureString(body.date, "calendarItem.date"),
      platform: ensureString(body.platform, "calendarItem.platform"),
      topic: ensureString(body.topic, "calendarItem.topic"),
      format: ensureString(body.format, "calendarItem.format"),
      hook: body.hook ? String(body.hook) : undefined,
      cta: body.cta ? String(body.cta) : undefined,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      status: String(body.status ?? "idea") as CalendarItem["status"],
      contentId: body.contentId ? String(body.contentId) : undefined,
      campaignId: body.campaignId ? String(body.campaignId) : undefined,
      targetAudience: body.targetAudience ? String(body.targetAudience) : undefined,
      createdBy: actor.userId
    };
    state.calendarItems.push(item);
    this.store.save();
    this.store.audit(actor, "calendarItem.create", "calendarItem", item.id, undefined, item);
    return clone(item);
  }

  listBriefs(actor: RequestActor): ContentBrief[] {
    return clone(this.store.getState().briefs.filter(item => item.tenantId === actor.tenantId));
  }

  createBrief(input: unknown, actor: RequestActor): ContentBrief {
    const body = ensureObject(input, "brief");
    const state = this.store.getState();
    const key = ensureString(body.key, "brief.key");
    if (state.briefs.some(item => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Brief key '${key}' already exists`);
    }
    const brief: ContentBrief = {
      id: newId("brief"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      title: ensureString(body.title, "brief.title"),
      topic: ensureString(body.topic, "brief.topic"),
      audience: ensureString(body.audience, "brief.audience"),
      goal: ensureString(body.goal, "brief.goal"),
      tone: ensureString(body.tone, "brief.tone"),
      keyMessage: ensureString(body.keyMessage, "brief.keyMessage"),
      structure: body.structure ? String(body.structure) : undefined,
      keywords: ensureArray<string>(body.keywords, "brief.keywords", []),
      references: body.references ? String(body.references) : undefined,
      cta: body.cta ? String(body.cta) : undefined,
      length: body.length ? String(body.length) : undefined,
      outputFormat: ensureString(body.outputFormat, "brief.outputFormat"),
      status: String(body.status ?? "draft") as ContentBrief["status"],
      createdBy: actor.userId,
      assignedTo: body.assignedTo ? String(body.assignedTo) : undefined
    };
    state.briefs.push(brief);
    this.store.save();
    this.store.audit(actor, "brief.create", "brief", brief.id, undefined, brief);
    return clone(brief);
  }

  listPosts(actor: RequestActor, query?: URLSearchParams): ContentPost[] {
    const platform = pickQuery(query, "platform");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().posts.filter(item => {
      if (item.tenantId !== actor.tenantId) return false;
      if (platform && item.platform !== platform) return false;
      if (status && item.status !== status) return false;
      return true;
    }));
  }

  createPost(input: unknown, actor: RequestActor): ContentPost {
    const body = ensureObject(input, "post");
    const state = this.store.getState();
    const key = ensureString(body.key, "post.key");
    if (state.posts.some(item => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Post key '${key}' already exists`);
    }
    const post: ContentPost = {
      id: newId("post"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      platform: ensureString(body.platform, "post.platform"),
      format: String(body.format ?? "text") as ContentPost["format"],
      hook: body.hook ? String(body.hook) : undefined,
      body: ensureString(body.body, "post.body"),
      cta: body.cta ? String(body.cta) : undefined,
      hashtags: ensureArray<string>(body.hashtags, "post.hashtags", []),
      status: String(body.status ?? "draft") as ContentPost["status"],
      authorId: body.authorId ? String(body.authorId) : undefined,
      briefId: body.briefId ? String(body.briefId) : undefined,
      campaignId: body.campaignId ? String(body.campaignId) : undefined,
      publishedAt: body.publishedAt ? String(body.publishedAt) : undefined,
      metrics: optionalObject(body.metrics),
      createdBy: actor.userId
    };
    state.posts.push(post);
    this.store.save();
    this.store.audit(actor, "post.create", "post", post.id, undefined, post);
    return clone(post);
  }

  updatePost(id: string, input: unknown, actor: RequestActor): ContentPost {
    const body = ensureObject(input, "post");
    const state = this.store.getState();
    const post = state.posts.find(item => item.id === id && item.tenantId === actor.tenantId);
    if (!post) notFound("Post not found");

    if (body.status === "published" && !post.publishedAt) {
      post.publishedAt = nowIso();
    }

    if (body.key) post.key = String(body.key);
    if (body.platform) post.platform = String(body.platform);
    if (body.format) post.format = String(body.format) as ContentPost["format"];
    if (body.hook !== undefined) post.hook = body.hook ? String(body.hook) : undefined;
    if (body.body) post.body = String(body.body);
    if (body.cta !== undefined) post.cta = body.cta ? String(body.cta) : undefined;
    if (body.hashtags) post.hashtags = ensureArray<string>(body.hashtags, "post.hashtags");
    if (body.status) post.status = String(body.status) as ContentPost["status"];
    if (body.metrics) post.metrics = optionalObject(body.metrics);
    post.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "post.update", "post", post.id, undefined, post);
    return clone(post);
  }

  listBlogs(actor: RequestActor, query?: URLSearchParams): BlogPost[] {
    const status = pickQuery(query, "status");
    const categoryId = pickQuery(query, "categoryId");
    return clone(this.store.getState().blogs.filter(item => {
      if (item.tenantId !== actor.tenantId) return false;
      if (status && item.status !== status) return false;
      if (categoryId && item.categoryId !== categoryId) return false;
      return true;
    }));
  }

  createBlog(input: unknown, actor: RequestActor): BlogPost {
    const body = ensureObject(input, "blog");
    const state = this.store.getState();
    const key = ensureString(body.key, "blog.key");
    if (state.blogs.some(item => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Blog key '${key}' already exists`);
    }
    const blog: BlogPost = {
      id: newId("blog"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      title: ensureString(body.title, "blog.title"),
      slug: ensureString(body.slug, "blog.slug"),
      content: ensureString(body.content, "blog.content"),
      excerpt: body.excerpt ? String(body.excerpt) : undefined,
      coverImage: body.coverImage ? String(body.coverImage) : undefined,
      authorId: body.authorId ? String(body.authorId) : undefined,
      categoryId: body.categoryId ? String(body.categoryId) : undefined,
      tags: ensureArray<string>(body.tags, "blog.tags", []),
      status: String(body.status ?? "draft") as BlogPost["status"],
      seoTitle: body.seoTitle ? String(body.seoTitle) : undefined,
      seoDescription: body.seoDescription ? String(body.seoDescription) : undefined,
      readingTime: body.readingTime ? ensureNumber(body.readingTime, "blog.readingTime") : undefined,
      publishedAt: body.publishedAt ? String(body.publishedAt) : undefined,
      scheduledAt: body.scheduledAt ? String(body.scheduledAt) : undefined,
      views: body.views ? ensureNumber(body.views, "blog.views", 0) : undefined,
      createdBy: actor.userId
    };
    state.blogs.push(blog);
    this.store.save();
    this.store.audit(actor, "blog.create", "blog", blog.id, undefined, blog);
    return clone(blog);
  }

  updateBlog(id: string, input: unknown, actor: RequestActor): BlogPost {
    const body = ensureObject(input, "blog");
    const state = this.store.getState();
    const blog = state.blogs.find(item => item.id === id && item.tenantId === actor.tenantId);
    if (!blog) notFound("Blog not found");

    if (body.status === "published" && !blog.publishedAt) {
      blog.publishedAt = nowIso();
    }

    if (body.key) blog.key = String(body.key);
    if (body.title) blog.title = String(body.title);
    if (body.slug) blog.slug = String(body.slug);
    if (body.content) blog.content = String(body.content);
    if (body.excerpt !== undefined) blog.excerpt = body.excerpt ? String(body.excerpt) : undefined;
    if (body.coverImage !== undefined) blog.coverImage = body.coverImage ? String(body.coverImage) : undefined;
    if (body.tags) blog.tags = ensureArray<string>(body.tags, "blog.tags");
    if (body.status) blog.status = String(body.status) as BlogPost["status"];
    if (body.seoTitle !== undefined) blog.seoTitle = body.seoTitle ? String(body.seoTitle) : undefined;
    if (body.seoDescription !== undefined) blog.seoDescription = body.seoDescription ? String(body.seoDescription) : undefined;
    if (body.views !== undefined) blog.views = body.views ? ensureNumber(body.views, "blog.views", 0) : undefined;
    blog.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "blog.update", "blog", blog.id, undefined, blog);
    return clone(blog);
  }

  listCarousels(actor: RequestActor): CarouselContent[] {
    return clone(this.store.getState().carousels.filter(item => item.tenantId === actor.tenantId));
  }

  createCarousel(input: unknown, actor: RequestActor): CarouselContent {
    const body = ensureObject(input, "carousel");
    const state = this.store.getState();
    const key = ensureString(body.key, "carousel.key");
    if (state.carousels.some(item => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Carousel key '${key}' already exists`);
    }
    const carousel: CarouselContent = {
      id: newId("carousel"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      title: ensureString(body.title, "carousel.title"),
      slides: ensureArray<CarouselSlide>(body.slides, "carousel.slides", []),
      hook: body.hook ? String(body.hook) : undefined,
      cta: body.cta ? String(body.cta) : undefined,
      platform: ensureString(body.platform, "carousel.platform"),
      status: String(body.status ?? "draft") as CarouselContent["status"],
      authorId: body.authorId ? String(body.authorId) : undefined,
      briefId: body.briefId ? String(body.briefId) : undefined,
      publishedAt: body.publishedAt ? String(body.publishedAt) : undefined,
      metrics: optionalObject(body.metrics),
      createdBy: actor.userId
    };
    state.carousels.push(carousel);
    this.store.save();
    this.store.audit(actor, "carousel.create", "carousel", carousel.id, undefined, carousel);
    return clone(carousel);
  }

  listNewsletters(actor: RequestActor): NewsletterContent[] {
    return clone(this.store.getState().newsletters.filter(item => item.tenantId === actor.tenantId));
  }

  createNewsletter(input: unknown, actor: RequestActor): NewsletterContent {
    const body = ensureObject(input, "newsletter");
    const state = this.store.getState();
    const key = ensureString(body.key, "newsletter.key");
    if (state.newsletters.some(item => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Newsletter key '${key}' already exists`);
    }
    const newsletter: NewsletterContent = {
      id: newId("newsletter"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      subject: ensureString(body.subject, "newsletter.subject"),
      preview: body.preview ? String(body.preview) : undefined,
      content: ensureString(body.content, "newsletter.content"),
      sections: ensureArray<NewsletterSection>(body.sections, "newsletter.sections", []),
      status: String(body.status ?? "draft") as NewsletterContent["status"],
      authorId: body.authorId ? String(body.authorId) : undefined,
      scheduledAt: body.scheduledAt ? String(body.scheduledAt) : undefined,
      sentAt: body.sentAt ? String(body.sentAt) : undefined,
      openRate: body.openRate ? ensureNumber(body.openRate, "newsletter.openRate") : undefined,
      clickRate: body.clickRate ? ensureNumber(body.clickRate, "newsletter.clickRate") : undefined,
      createdBy: actor.userId
    };
    state.newsletters.push(newsletter);
    this.store.save();
    this.store.audit(actor, "newsletter.create", "newsletter", newsletter.id, undefined, newsletter);
    return clone(newsletter);
  }

  listCampaigns(actor: RequestActor): ContentCampaign[] {
    return clone(this.store.getState().campaigns.filter(item => item.tenantId === actor.tenantId));
  }

  createCampaign(input: unknown, actor: RequestActor): ContentCampaign {
    const body = ensureObject(input, "campaign");
    const state = this.store.getState();
    const key = ensureString(body.key, "campaign.key");
    if (state.campaigns.some(item => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Campaign key '${key}' already exists`);
    }
    const campaign: ContentCampaign = {
      id: newId("campaign"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "campaign.name"),
      description: body.description ? String(body.description) : undefined,
      startDate: ensureString(body.startDate, "campaign.startDate"),
      endDate: ensureString(body.endDate, "campaign.endDate"),
      goals: ensureArray<string>(body.goals, "campaign.goals", []),
      channels: ensureArray<string>(body.channels, "campaign.channels", []),
      contentIds: ensureArray<string>(body.contentIds, "campaign.contentIds", []),
      status: String(body.status ?? "active") as ContentCampaign["status"],
      metrics: optionalObject(body.metrics),
      createdBy: actor.userId
    };
    state.campaigns.push(campaign);
    this.store.save();
    this.store.audit(actor, "campaign.create", "campaign", campaign.id, undefined, campaign);
    return clone(campaign);
  }

  listTemplates(actor: RequestActor): ContentTemplate[] {
    return clone(this.store.getState().templates.filter(item => item.tenantId === actor.tenantId));
  }

  createTemplate(input: unknown, actor: RequestActor): ContentTemplate {
    const body = ensureObject(input, "template");
    const state = this.store.getState();
    const key = ensureString(body.key, "template.key");
    if (state.templates.some(item => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Template key '${key}' already exists`);
    }
    const template: ContentTemplate = {
      id: newId("template"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "template.name"),
      description: body.description ? String(body.description) : undefined,
      type: ensureString(body.type, "template.type") as ContentTemplate["type"],
      content: ensureString(body.content, "template.content"),
      variables: ensureArray<string>(body.variables, "template.variables", []),
      tags: ensureArray<string>(body.tags, "template.tags", []),
      status: String(body.status ?? "active") as ContentTemplate["status"],
      usageCount: 0,
      createdBy: actor.userId
    };
    state.templates.push(template);
    this.store.save();
    this.store.audit(actor, "template.create", "template", template.id, undefined, template);
    return clone(template);
  }

  listKeywords(actor: RequestActor): ContentKeyword[] {
    return clone(this.store.getState().keywords.filter(item => item.tenantId === actor.tenantId));
  }

  createKeyword(input: unknown, actor: RequestActor): ContentKeyword {
    const body = ensureObject(input, "keyword");
    const keyword: ContentKeyword = {
      id: newId("keyword"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      keyword: ensureString(body.keyword, "keyword.keyword"),
      searchVolume: body.searchVolume ? ensureNumber(body.searchVolume, "keyword.searchVolume") : undefined,
      difficulty: body.difficulty ? ensureNumber(body.difficulty, "keyword.difficulty") : undefined,
      intent: String(body.intent ?? "informational") as ContentKeyword["intent"],
      relatedKeywords: ensureArray<string>(body.relatedKeywords, "keyword.relatedKeywords", []),
      contentCount: 0,
      ranking: body.ranking ? ensureNumber(body.ranking, "keyword.ranking") : undefined,
      status: String(body.status ?? "active") as ContentKeyword["status"]
    };
    this.store.getState().keywords.push(keyword);
    this.store.save();
    this.store.audit(actor, "keyword.create", "keyword", keyword.id, undefined, keyword);
    return clone(keyword);
  }

  checkContentQuality(input: unknown, actor: RequestActor): { score: number; issues: string[]; recommendations: string[] } {
    const body = ensureObject(input, "quality");
    const title = ensureString(body.title, "quality.title");
    const content = ensureString(body.content, "quality.content");
    const platform = body.platform ? String(body.platform) : "general";

    const issues: string[] = [];
    const recommendations: string[] = [];

    if (title.length < 10) {
      issues.push("Title is too short");
      recommendations.push("Make title at least 10 characters");
    }

    if (title.length > 60) {
      issues.push("Title is too long for SEO");
      recommendations.push("Keep title under 60 characters");
    }

    if (content.length < 50) {
      issues.push("Content is too short");
      recommendations.push("Add more substance to your content");
    }

    if (!content.includes("?")) {
      recommendations.push("Consider adding questions to increase engagement");
    }

    if (platform === "linkedin") {
      if (content.length > 3000) {
        issues.push("LinkedIn posts perform better when shorter");
        recommendations.push("Consider shortening to under 3000 characters");
      }
    }

    const score = Math.max(0, 100 - (issues.length * 15) - (recommendations.length * 5));

    return { score, issues, recommendations };
  }

  listApprovals(actor: RequestActor): ContentApproval[] {
    return clone(this.store.getState().approvals.filter(item => item.tenantId === actor.tenantId));
  }

  createApproval(input: unknown, actor: RequestActor): ContentApproval {
    const body = ensureObject(input, "approval");
    const approval: ContentApproval = {
      id: newId("approval"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      contentId: ensureString(body.contentId, "approval.contentId"),
      contentType: ensureString(body.contentType, "approval.contentType"),
      status: "pending",
      reviewerId: body.reviewerId ? String(body.reviewerId) : undefined,
      comments: body.comments ? String(body.comments) : undefined,
      requestedAt: nowIso(),
      reviewedAt: undefined
    };
    this.store.getState().approvals.push(approval);
    this.store.save();
    this.store.audit(actor, "approval.create", "approval", approval.id, undefined, approval);
    return clone(approval);
  }

  updateApproval(id: string, input: unknown, actor: RequestActor): ContentApproval {
    const body = ensureObject(input, "approval");
    const state = this.store.getState();
    const approval = state.approvals.find(item => item.id === id && item.tenantId === actor.tenantId);
    if (!approval) notFound("Approval not found");

    if (body.status) {
      approval.status = String(body.status) as ContentApproval["status"];
      if (["approved", "rejected", "changes_requested"].includes(approval.status)) {
        approval.reviewedAt = nowIso();
        approval.reviewerId = actor.userId;
      }
    }
    if (body.comments !== undefined) approval.comments = body.comments ? String(body.comments) : undefined;
    approval.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "approval.update", "approval", approval.id, undefined, approval);
    return clone(approval);
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter(item => item.tenantId === actor.tenantId));
  }

  generatePostIdeas(input: unknown, actor: RequestActor): { ideas: string[] } {
    const body = ensureObject(input, "ideas");
    const topic = ensureString(body.topic, "ideas.topic");
    const platform = body.platform ? String(body.platform) : "linkedin";
    const count = ensureNumber(body.count, "ideas.count", 5);

    const hooks = [
      `${topic} is misunderstood.`,
      `Stop doing ${topic} wrong.`,
      `The truth about ${topic}`,
      `${topic} isn't what you think.`,
      `Here's why ${topic} matters.`
    ];

    const templates = [
      `${topic} is the future.\n\nBut most get it wrong.\n\nHere's what actually works:`,
      `I used to think ${topic} was simple.\n\nThen I learned this:\n\n- First lesson\n- Second lesson\n- Third lesson\n\nWhich one resonates most?`,
      `${topic}: A thread\n\n1. Start here\n2. Then this\n3. Finally\n\nSave this for later.`
    ];

    const ideas: string[] = [];
    for (let i = 0; i < count; i++) {
      const hook = hooks[i % hooks.length];
      const template = templates[i % templates.length];
      ideas.push(`${hook}\n\n${template}`);
    }

    return { ideas };
  }

  repurposeContent(input: unknown, actor: RequestActor): { repurposed: { platform: string; content: string }[] } {
    const body = ensureObject(input, "repurpose");
    const content = ensureString(body.content, "repurpose.content");
    const sourcePlatform = body.sourcePlatform ? String(body.sourcePlatform) : "blog";
    const targetPlatforms = ensureArray<string>(body.targetPlatforms, "repurpose.targetPlatforms", ["linkedin", "twitter"]);

    const repurposed: { platform: string; content: string }[] = [];

    for (const platform of targetPlatforms) {
      let output = content;

      if (platform === "linkedin") {
        if (output.length > 3000) {
          output = output.substring(0, 2800) + "...\n\n(Repurposed from " + sourcePlatform + ")";
        }
        output = output.replace(/\n/g, "\n\n");
      }

      if (platform === "twitter") {
        if (output.length > 280) {
          output = output.substring(0, 240) + "...\n\n(More on " + sourcePlatform + ")";
        }
      }

      repurposed.push({ platform, content: output });
    }

    return { repurposed };
  }
}

function ensureObject(value: unknown, name: string): Record<string, any> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, any>;
  badRequest(`${name} must be an object`);
}
