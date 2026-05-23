export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "knowledge_admin" | "knowledge_manager" | "knowledge_contributor" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";
export type WorkStatus = "todo" | "in_progress" | "blocked" | "done" | "cancelled";
export type Priority = "low" | "normal" | "high" | "critical";

export interface BaseEntity {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface RequestActor {
  tenantId: TenantId;
  userId: UUID;
  role: Role;
}

export interface KnowledgeSpace extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  visibility: "public" | "internal" | "private";
  ownerId?: UUID;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface KnowledgeArticle extends BaseEntity {
  spaceId: UUID;
  title: string;
  slug: string;
  content: string;
  sourceType: "text" | "url" | "file" | "api";
  sourceUri?: string;
  status: "published" | "draft" | "review" | "archived" | "outdated" | "needs_update" | "deprecated";
  authorId?: UUID;
  reviewerId?: UUID;
  tags: string[];
  categories: UUID[];
  metadata: Record<string, unknown>;
  version: number;
  publishedAt?: ISODate;
  reviewDueAt?: ISODate;
}

export interface ArticleVersion extends BaseEntity {
  articleId: UUID;
  version: number;
  title: string;
  content: string;
  authorId?: UUID;
  changeNotes?: string;
}

export interface SOP extends BaseEntity {
  spaceId: UUID;
  key: string;
  name: string;
  description?: string;
  content: string;
  status: EntityStatus;
  ownerId?: UUID;
  department?: string;
  steps: SOPStep[];
  tags: string[];
  version: number;
  approvedAt?: ISODate;
  approvedBy?: UUID;
}

export interface SOPStep {
  order: number;
  title: string;
  description: string;
  notes?: string;
  required: boolean;
}

export interface Playbook extends BaseEntity {
  spaceId: UUID;
  key: string;
  name: string;
  description?: string;
  content: string;
  playbookType: "sales" | "support" | "delivery" | "marketing" | "hiring" | "incident" | "onboarding" | "general";
  status: EntityStatus;
  ownerId?: UUID;
  sections: PlaybookSection[];
  tags: string[];
  version: number;
}

export interface PlaybookSection {
  order: number;
  title: string;
  content: string;
  checklist?: string[];
}

export interface FAQ extends BaseEntity {
  spaceId: UUID;
  question: string;
  answer: string;
  category?: string;
  tags: string[];
  status: EntityStatus;
  authorId?: UUID;
  helpfulCount: number;
  viewCount: number;
  relatedArticleIds: UUID[];
}

export interface HelpArticle extends BaseEntity {
  spaceId: UUID;
  title: string;
  slug: string;
  content: string;
  articleType: "how-to" | "troubleshooting" | "reference" | "guide" | "faq";
  status: EntityStatus;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface DecisionRecord extends BaseEntity {
  spaceId: UUID;
  key: string;
  title: string;
  decision: string;
  context: string;
  optionsConsidered: string[];
  reason: string;
  tradeoffs?: string;
  risks?: string;
  ownerId?: UUID;
  status: "proposed" | "accepted" | "deprecated" | "superseded";
  impact?: string;
  reviewDate?: ISODate;
  relatedDecisionIds: UUID[];
}

export interface KnowledgeNode extends BaseEntity {
  spaceId?: UUID;
  key: string;
  name: string;
  nodeType: "concept" | "entity" | "process" | "document" | "person" | "technology" | "product" | "service" | "custom";
  description?: string;
  metadata: Record<string, unknown>;
  tags: string[];
}

export interface KnowledgeGraphEdge extends BaseEntity {
  sourceNodeId: UUID;
  targetNodeId: UUID;
  relationship: string;
  weight?: number;
  metadata: Record<string, unknown>;
}

export interface SearchIndex extends BaseEntity {
  entityType: "article" | "sop" | "playbook" | "faq" | "decision" | "help";
  entityId: UUID;
  spaceId?: UUID;
  title: string;
  content: string;
  keywords: string[];
  metadata: Record<string, unknown>;
}

export interface Reference extends BaseEntity {
  sourceType: "article" | "sop" | "playbook" | "faq" | "decision";
  sourceId: UUID;
  targetType: "article" | "sop" | "playbook" | "faq" | "decision" | "url" | "file";
  targetId?: UUID;
  targetUri?: string;
  label?: string;
}

export interface KnowledgeChunk extends BaseEntity {
  entityType: "article" | "sop" | "playbook" | "faq" | "decision";
  entityId: UUID;
  chunkIndex: number;
  text: string;
  tokenEstimate: number;
  keywords: string[];
  metadata: Record<string, unknown>;
}

export interface KnowledgeSearchHit {
  chunkId?: UUID;
  entityType: string;
  entityId: UUID;
  title: string;
  snippet: string;
  score: number;
  keywords: string[];
  citation: string;
}

export interface KnowledgeFeedback extends BaseEntity {
  entityType: "article" | "sop" | "playbook" | "faq" | "help";
  entityId: UUID;
  userId: UUID;
  helpful: boolean;
  comment?: string;
}

export interface KnowledgeReview extends BaseEntity {
  entityType: "article" | "sop" | "playbook" | "faq" | "decision";
  entityId: UUID;
  reviewerId: UUID;
  status: "pending" | "approved" | "rejected" | "needs_changes";
  notes?: string;
  dueAt?: ISODate;
  completedAt?: ISODate;
}

export interface KnowledgeAuditLog extends BaseEntity {
  actorId: UUID;
  role: Role;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
}

export interface KnowledgeOverview {
  spaces: { total: number; active: number };
  articles: { total: number; published: number; drafts: number; outdated: number };
  sops: { total: number; active: number };
  playbooks: { total: number; active: number };
  faqs: { total: number; active: number };
  decisions: { total: number; accepted: number };
  searchIndex: { total: number };
  chunks: { total: number };
  feedback: { helpful: number; notHelpful: number };
  reviews: { pending: number };
}

export interface KnowledgeState {
  spaces: KnowledgeSpace[];
  articles: KnowledgeArticle[];
  articleVersions: ArticleVersion[];
  sops: SOP[];
  playbooks: Playbook[];
  faqs: FAQ[];
  helpArticles: HelpArticle[];
  decisions: DecisionRecord[];
  nodes: KnowledgeNode[];
  graphEdges: KnowledgeGraphEdge[];
  searchIndex: SearchIndex[];
  references: Reference[];
  chunks: KnowledgeChunk[];
  feedback: KnowledgeFeedback[];
  reviews: KnowledgeReview[];
  auditLogs: KnowledgeAuditLog[];
}
