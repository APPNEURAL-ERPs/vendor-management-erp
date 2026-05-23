export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "content_admin" | "content_editor" | "content_creator" | "content_reviewer" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";
export type ContentStatus = "idea" | "draft" | "in_review" | "changes_requested" | "approved" | "scheduled" | "published" | "archived";

export interface RequestActor {
  tenantId: TenantId;
  userId: UUID;
  role: Role;
}

export interface BaseEntity {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface ContentStrategy extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  goals: string[];
  targetAudience: string;
  pillars: string[];
  channels: string[];
  status: EntityStatus;
  metrics: Record<string, number>;
  createdBy: UUID;
}

export interface ContentPillar extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  topics: string[];
  status: EntityStatus;
  contentCount: number;
  engagementScore: number;
  createdBy: UUID;
}

export interface ContentTopic extends BaseEntity {
  key: string;
  title: string;
  description?: string;
  pillarId?: UUID;
  keywords: string[];
  status: EntityStatus;
  contentCount: number;
  priority: "low" | "medium" | "high";
  createdBy: UUID;
}

export interface ContentCalendar extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  startDate: ISODate;
  endDate: ISODate;
  status: EntityStatus;
  createdBy: UUID;
}

export interface CalendarItem extends BaseEntity {
  calendarId: UUID;
  date: ISODate;
  platform: string;
  topic: string;
  format: string;
  hook?: string;
  cta?: string;
  ownerId?: UUID;
  status: ContentStatus;
  contentId?: UUID;
  campaignId?: UUID;
  targetAudience?: string;
  createdBy: UUID;
}

export interface ContentBrief extends BaseEntity {
  key: string;
  title: string;
  topic: string;
  audience: string;
  goal: string;
  tone: string;
  keyMessage: string;
  structure?: string;
  keywords: string[];
  references?: string;
  cta?: string;
  length?: string;
  outputFormat: string;
  status: ContentStatus;
  createdBy: UUID;
  assignedTo?: UUID;
}

export interface Content extends BaseEntity {
  key: string;
  title: string;
  type: "post" | "blog" | "carousel" | "newsletter" | "email" | "video" | "social" | "other";
  status: ContentStatus;
  briefId?: UUID;
  pillarId?: UUID;
  categoryId?: UUID;
  authorId?: UUID;
  platform: string;
  content: string;
  hook?: string;
  summary?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;
  publishedAt?: ISODate;
  scheduledAt?: ISODate;
  createdBy: UUID;
  approvedBy?: UUID;
  version: number;
}

export interface ContentVersion extends BaseEntity {
  contentId: UUID;
  version: number;
  title: string;
  content: string;
  changes?: string;
  createdBy: UUID;
}

export interface ContentType extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  fields: Record<string, unknown>[];
  templates: string[];
  status: EntityStatus;
}

export interface Category extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  parentId?: UUID;
  slug: string;
  contentCount: number;
  status: EntityStatus;
}

export interface Tag extends BaseEntity {
  key: string;
  name: string;
  slug: string;
  usageCount: number;
  status: EntityStatus;
}

export interface Author extends BaseEntity {
  key: string;
  name: string;
  email?: string;
  bio?: string;
  avatar?: string;
  role: string;
  specialties: string[];
  contentCount: number;
  socialLinks?: Record<string, string>;
  status: EntityStatus;
}

export interface SEOData extends BaseEntity {
  contentId: UUID;
  primaryKeyword: string;
  secondaryKeywords: string[];
  title: string;
  metaDescription: string;
  slug: string;
  headings: string[];
  internalLinks: string[];
  externalLinks: string[];
  wordCount: number;
  readabilityScore?: number;
  keywordDensity?: number;
  score?: number;
  recommendations: string[];
}

export interface ContentPost extends BaseEntity {
  key: string;
  platform: string;
  format: "text" | "carousel" | "video" | "story" | "reel";
  hook?: string;
  body: string;
  cta?: string;
  hashtags: string[];
  status: ContentStatus;
  authorId?: UUID;
  briefId?: UUID;
  campaignId?: UUID;
  publishedAt?: ISODate;
  metrics?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
  createdBy: UUID;
}

export interface BlogPost extends BaseEntity {
  key: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  authorId?: UUID;
  categoryId?: UUID;
  tags: string[];
  status: ContentStatus;
  seoTitle?: string;
  seoDescription?: string;
  readingTime?: number;
  publishedAt?: ISODate;
  scheduledAt?: ISODate;
  views?: number;
  createdBy: UUID;
}

export interface CarouselContent extends BaseEntity {
  key: string;
  title: string;
  slides: CarouselSlide[];
  hook?: string;
  cta?: string;
  platform: string;
  status: ContentStatus;
  authorId?: UUID;
  briefId?: UUID;
  publishedAt?: ISODate;
  metrics?: {
    views?: number;
    saves?: number;
    shares?: number;
  };
  createdBy: UUID;
}

export interface CarouselSlide {
  slideNumber: number;
  type: "title" | "content" | "quote" | "cta";
  text: string;
  subtext?: string;
}

export interface NewsletterContent extends BaseEntity {
  key: string;
  subject: string;
  preview?: string;
  content: string;
  sections: NewsletterSection[];
  status: ContentStatus;
  authorId?: UUID;
  scheduledAt?: ISODate;
  sentAt?: ISODate;
  openRate?: number;
  clickRate?: number;
  createdBy: UUID;
}

export interface NewsletterSection {
  type: "header" | "insight" | "article" | "resource" | "cta" | "footer";
  title?: string;
  content: string;
  link?: string;
}

export interface ContentCampaign extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  startDate: ISODate;
  endDate: ISODate;
  goals: string[];
  channels: string[];
  contentIds: UUID[];
  status: EntityStatus;
  metrics?: Record<string, number>;
  createdBy: UUID;
}

export interface ContentAsset extends BaseEntity {
  key: string;
  name: string;
  type: "image" | "video" | "document" | "template" | "other";
  url?: string;
  mimeType?: string;
  size?: number;
  tags: string[];
  folderId?: UUID;
  contentId?: UUID;
  status: EntityStatus;
  createdBy: UUID;
}

export interface ContentTemplate extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "post" | "blog" | "carousel" | "newsletter" | "email" | "brief";
  content: string;
  variables: string[];
  tags: string[];
  status: EntityStatus;
  usageCount: number;
  createdBy: UUID;
}

export interface ContentKeyword extends BaseEntity {
  keyword: string;
  searchVolume?: number;
  difficulty?: number;
  intent: "informational" | "navigational" | "transactional" | "commercial";
  relatedKeywords: string[];
  contentCount: number;
  ranking?: number;
  status: EntityStatus;
}

export interface ContentApproval extends BaseEntity {
  contentId: UUID;
  contentType: string;
  status: "pending" | "approved" | "changes_requested" | "rejected";
  reviewerId?: UUID;
  comments?: string;
  requestedAt: ISODate;
  reviewedAt?: ISODate;
}

export interface ContentInsight extends BaseEntity {
  type: "performance" | "opportunity" | "trend" | "recommendation";
  title: string;
  description: string;
  data?: Record<string, unknown>;
  priority: "low" | "medium" | "high";
  source: string;
  createdBy: UUID;
}

export interface ContentEvent extends BaseEntity {
  type: string;
  source: string;
  data: Record<string, unknown>;
  correlationId?: UUID;
}

export interface AuditLog extends BaseEntity {
  actorId: UUID;
  role: Role;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
}

export interface ContentOverview {
  strategies: number;
  pillars: number;
  topics: number;
  calendars: number;
  briefs: { total: number; pending: number; approved: number };
  posts: { total: number; draft: number; published: number; archived: number };
  blogs: { total: number; draft: number; published: number };
  carousels: { total: number; draft: number; published: number };
  newsletters: { total: number; draft: number; sent: number };
  campaigns: { total: number; active: number };
  templates: number;
  keywords: number;
  approvals: { pending: number; approved: number; changesRequested: number };
}

export interface ContentState {
  strategies: ContentStrategy[];
  pillars: ContentPillar[];
  topics: ContentTopic[];
  calendars: ContentCalendar[];
  calendarItems: CalendarItem[];
  briefs: ContentBrief[];
  posts: ContentPost[];
  blogs: BlogPost[];
  carousels: CarouselContent[];
  newsletters: NewsletterContent[];
  campaigns: ContentCampaign[];
  assets: ContentAsset[];
  templates: ContentTemplate[];
  keywords: ContentKeyword[];
  seoScores: SEOData[];
  approvals: ContentApproval[];
  insights: ContentInsight[];
  events: ContentEvent[];
  auditLogs: AuditLog[];
}
