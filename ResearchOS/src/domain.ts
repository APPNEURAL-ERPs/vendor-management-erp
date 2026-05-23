export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "research_admin" | "researcher" | "analyst" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";

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

export interface Study extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "market" | "competitor" | "user" | "product" | "technology" | "industry" | "pricing" | "general";
  status: "planning" | "in_progress" | "completed" | "archived";
  tags: string[];
  questionIds: UUID[];
  sourceIds: UUID[];
  insightIds: UUID[];
  ownerId?: UUID;
  dueDate?: ISODate;
  metadata: Record<string, unknown>;
}

export interface ResearchQuestion extends BaseEntity {
  studyId: UUID;
  question: string;
  type: "exploratory" | "descriptive" | "explanatory" | "evaluative";
  status: "open" | "answered" | "in_progress" | "archived";
  hypothesisIds: UUID[];
  evidenceIds: UUID[];
  priority: "low" | "medium" | "high" | "critical";
  metadata: Record<string, unknown>;
}

export interface Source extends BaseEntity {
  studyId?: UUID;
  sourceType: "website" | "report" | "blog" | "review" | "social" | "interview" | "survey" | "internal" | "api" | "document" | "other";
  title: string;
  url?: string;
  author?: string;
  publishedAt?: ISODate;
  reliability: "low" | "medium" | "high";
  content?: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface Note extends BaseEntity {
  studyId?: UUID;
  questionId?: UUID;
  title: string;
  content: string;
  authorId?: UUID;
  tags: string[];
  linkedSourceIds: UUID[];
  metadata: Record<string, unknown>;
}

export interface Hypothesis extends BaseEntity {
  questionId: UUID;
  statement: string;
  confidence: "low" | "medium" | "high";
  status: "proposed" | "testing" | "supported" | "refuted" | "archived";
  evidenceIds: UUID[];
  metadata: Record<string, unknown>;
}

export interface Evidence extends BaseEntity {
  sourceId: UUID;
  hypothesisId?: UUID;
  type: "quote" | "statistic" | "fact" | "observation" | "testimonial" | "data" | "other";
  content: string;
  relevance: "low" | "medium" | "high";
  strength: "weak" | "moderate" | "strong";
  insightIds: UUID[];
  metadata: Record<string, unknown>;
}

export interface Insight extends BaseEntity {
  studyId?: UUID;
  insightType: "observation" | "pattern" | "theme" | "opportunity" | "risk" | "recommendation";
  title: string;
  observation: string;
  evidence: string[];
  meaning: string;
  impact: "low" | "medium" | "high" | "critical";
  confidence: "low" | "medium" | "high";
  status: "draft" | "validated" | "published" | "archived";
  nextActions: string[];
  metadata: Record<string, unknown>;
}

export interface Competitor extends BaseEntity {
  studyId?: UUID;
  name: string;
  productName?: string;
  website?: string;
  targetAudience?: string;
  description?: string;
  strengths: string[];
  weaknesses: string[];
  pricing?: string;
  features: Array<{ name: string; available: boolean; quality: "low" | "medium" | "high" }>;
  reviews: Array<{ source: string; rating: number; summary: string }>;
  metadata: Record<string, unknown>;
}

export interface UserInterview extends BaseEntity {
  studyId?: UUID;
  participantName?: string;
  participantRole?: string;
  interviewType: "discovery" | "validation" | "usability" | "pricing" | "feedback" | "other";
  status: "scheduled" | "completed" | "cancelled";
  scheduledAt?: ISODate;
  completedAt?: ISODate;
  questions: Array<{ question: string; answer?: string; keyInsight?: string }>;
  painPoints: string[];
  quotes: string[];
  metadata: Record<string, unknown>;
}

export interface Survey extends BaseEntity {
  studyId?: UUID;
  name: string;
  description?: string;
  targetAudience?: string;
  status: "draft" | "active" | "closed";
  questions: Array<{ question: string; type: "multiple_choice" | "open" | "rating" | "boolean"; options?: string[] }>;
  responses: Array<{ respondentId?: string; answers: Record<string, unknown>; submittedAt: ISODate }>;
  metadata: Record<string, unknown>;
}

export interface PainPoint extends BaseEntity {
  studyId?: UUID;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  frequency: "rare" | "occasional" | "frequent" | "constant";
  currentSolution?: string;
  opportunity?: string;
  relatedSourceIds: UUID[];
  metadata: Record<string, unknown>;
}

export interface MarketSegment extends BaseEntity {
  studyId?: UUID;
  name: string;
  description?: string;
  size?: string;
  growth?: string;
  trends?: string[];
  metadata: Record<string, unknown>;
}

export interface ResearchReport extends BaseEntity {
  studyId?: UUID;
  title: string;
  type: "executive_summary" | "detailed" | "competitive_analysis" | "market_opportunity" | "product_validation";
  status: "draft" | "review" | "published" | "archived";
  sections: Array<{ title: string; content: string; type: "text" | "table" | "chart" | "list" }>;
  insights: UUID[];
  recommendations: string[];
  metadata: Record<string, unknown>;
}

export interface ResearchEvent extends BaseEntity {
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

export interface ResearchOverview {
  studies: { total: number; active: number; completed: number };
  questions: { total: number; open: number; answered: number };
  sources: { total: number; high_reliability: number };
  insights: { total: number; published: number; draft: number };
  evidence: { total: number; strong: number };
  interviews: { total: number; completed: number };
  surveys: { total: number; active: number };
  competitors: { total: number };
}

export interface ResearchState {
  studies: Study[];
  questions: ResearchQuestion[];
  sources: Source[];
  notes: Note[];
  hypotheses: Hypothesis[];
  evidence: Evidence[];
  insights: Insight[];
  competitors: Competitor[];
  interviews: UserInterview[];
  surveys: Survey[];
  painPoints: PainPoint[];
  marketSegments: MarketSegment[];
  reports: ResearchReport[];
  events: ResearchEvent[];
  auditLogs: AuditLog[];
}
