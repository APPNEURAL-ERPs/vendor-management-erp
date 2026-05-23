export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "brand_admin" | "brand_manager" | "brand_auditor" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";

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

export interface Brand extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  purpose?: string;
  mission?: string;
  vision?: string;
  values: string[];
  positioning?: string;
  differentiation?: string;
  promise?: string;
  story?: string;
  archetype?: string;
  targetAudience: string[];
  industry?: string;
  tags: string[];
}

export interface ColorPalette extends BaseEntity {
  brandId: UUID;
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  colors: BrandColor[];
  usage?: string;
}

export interface BrandColor {
  key: string;
  name: string;
  hex: string;
  rgb?: { r: number; g: number; b: number };
  cmyk?: { c: number; m: number; y: number; k: number };
  pantone?: string;
  usage: string;
}

export interface Typography extends BaseEntity {
  brandId: UUID;
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  fontFamilies: FontFamily[];
  headingStyle?: TypographyStyle;
  bodyStyle?: TypographyStyle;
  usage?: string;
}

export interface FontFamily {
  name: string;
  role: "primary" | "secondary" | "accent" | "monospace";
  weights: number[];
  googleFont?: string;
  customFont?: string;
}

export interface TypographyStyle {
  fontFamily: string;
  fontSize?: string;
  fontWeight?: number;
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
}

export interface BrandVoice extends BaseEntity {
  brandId: UUID;
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  tone: string[];
  vocabulary: BrandVocabulary;
  writingRules: WritingRule[];
  forbiddenTerms: string[];
  audienceTone: AudienceTone[];
  usage?: string;
}

export interface BrandVocabulary {
  preferredTerms: string[];
  alternativeTerms: Record<string, string[]>;
}

export interface WritingRule {
  rule: string;
  example?: string;
  context?: string;
}

export interface AudienceTone {
  audience: string;
  tone: string[];
  examples?: string[];
}

export interface BrandElement extends BaseEntity {
  brandId: UUID;
  key: string;
  name: string;
  type: "logo" | "icon" | "pattern" | "illustration" | "image" | "shape";
  status: EntityStatus;
  variants: BrandElementVariant[];
  usage?: string;
  rules?: string[];
}

export interface BrandElementVariant {
  name: string;
  format: "svg" | "png" | "jpg" | "pdf" | "eps";
  url?: string;
  data?: string;
  background?: "light" | "dark" | "colored" | "transparent";
  size?: string;
}

export type AssetType = "logo" | "icon" | "font" | "image" | "video" | "document" | "template" | "social" | "presentation" | "other";
export type AssetStatus = "active" | "archived" | "processing" | "draft";

export interface Asset extends BaseEntity {
  brandId: UUID;
  key: string;
  name: string;
  type: AssetType;
  status: AssetStatus;
  url?: string;
  data?: string;
  format: string;
  size?: number;
  tags: string[];
  category?: string;
  metadata: Record<string, unknown>;
  approvalStatus?: "pending" | "approved" | "rejected";
  approvedBy?: UUID;
  approvedAt?: ISODate;
}

export interface Guideline extends BaseEntity {
  brandId: UUID;
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  type: GuidelineType;
  sections: GuidelineSection[];
  version: number;
  createdBy: UUID;
  approvedBy?: UUID;
  approvedAt?: ISODate;
}

export type GuidelineType = "full" | "logo" | "color" | "typography" | "voice" | "social" | "document" | "presentation" | "email" | "website";

export interface GuidelineSection {
  title: string;
  content: string;
  rules?: string[];
  examples?: string[];
  dos?: string[];
  donts?: string[];
}

export interface BrandKit extends BaseEntity {
  brandId: UUID;
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  colorPaletteId?: UUID;
  typographyId?: UUID;
  voiceId?: UUID;
  assets: UUID[];
  generatedAt?: ISODate;
  generatedBy?: UUID;
}

export interface BrandCampaign extends BaseEntity {
  brandId: UUID;
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  type: string;
  startDate?: ISODate;
  endDate?: ISODate;
  messaging: CampaignMessage[];
  assets: UUID[];
  channels: string[];
  targetAudience?: string;
}

export interface CampaignMessage {
  type: "headline" | "tagline" | "body" | "cta";
  content: string;
  channel?: string;
}

export interface BrandMessage extends BaseEntity {
  brandId: UUID;
  key: string;
  name: string;
  type: MessageType;
  status: EntityStatus;
  content: string;
  context?: string;
  usage?: string;
  variants?: string[];
}

export type MessageType = "tagline" | "headline" | "elevator_pitch" | "social_bio" | "cta" | "about" | "manifesto" | "pitch" | "other";

export interface BrandAudit extends BaseEntity {
  brandId: UUID;
  name: string;
  description?: string;
  status: "draft" | "in_progress" | "completed";
  type: AuditType;
  scope?: string[];
  results?: BrandAuditResult;
  completedAt?: ISODate;
  createdBy: UUID;
}

export type AuditType = "full" | "website" | "social" | "document" | "visual" | "messaging" | "competitor";

export interface BrandAuditResult {
  overallScore: number;
  clarityScore?: number;
  consistencyScore?: number;
  messagingScore?: number;
  visualScore?: number;
  trustScore?: number;
  differentiationScore?: number;
  findings: AuditFinding[];
  recommendations: string[];
  priorityFixes?: string[];
}

export interface AuditFinding {
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  suggestion?: string;
}

export interface BrandConsistencyCheck extends BaseEntity {
  brandId: UUID;
  targetType: "website" | "document" | "social" | "content";
  targetUrl?: string;
  targetContent?: string;
  checks: ConsistencyCheckResult[];
  overallPass: boolean;
  score: number;
  checkedBy: UUID;
}

export interface ConsistencyCheckResult {
  checkType: "logo" | "color" | "font" | "tone" | "messaging" | "visual";
  passed: boolean;
  details: string;
  suggestions?: string[];
}

export interface BrandTemplate extends BaseEntity {
  brandId: UUID;
  key: string;
  name: string;
  type: TemplateType;
  status: EntityStatus;
  content: string;
  format: string;
  usage?: string;
  tags: string[];
}

export type TemplateType = "social" | "presentation" | "document" | "email" | "proposal" | "resume" | "certificate" | "report" | "other";

export interface BrandPersona extends BaseEntity {
  brandId: UUID;
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  demographics: PersonaDemographics;
  psychographics: PersonaPsychographics;
  painPoints: string[];
  motivations: string[];
  preferredChannels: string[];
  messagingTone?: string;
}

export interface PersonaDemographics {
  ageRange?: string;
  gender?: string;
  income?: string;
  education?: string;
  location?: string;
  occupation?: string;
  industry?: string;
}

export interface PersonaPsychographics {
  values: string[];
  interests: string[];
  goals: string[];
  challenges: string[];
  communicationStyle?: string;
}

export interface BrandEvent extends BaseEntity {
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

export interface BrandOverview {
  brands: { total: number; active: number };
  guidelines: { total: number; active: number };
  assets: { total: number; approved: number };
  kits: { total: number; active: number };
  campaigns: { total: number; active: number };
  audits: { total: number; completed: number };
  templates: { total: number; active: number };
}

export interface BrandState {
  brands: Brand[];
  colorPalettes: ColorPalette[];
  typographies: Typography[];
  brandVoices: BrandVoice[];
  brandElements: BrandElement[];
  assets: Asset[];
  guidelines: Guideline[];
  brandKits: BrandKit[];
  campaigns: BrandCampaign[];
  brandMessages: BrandMessage[];
  audits: BrandAudit[];
  consistencyChecks: BrandConsistencyCheck[];
  templates: BrandTemplate[];
  personas: BrandPersona[];
  events: BrandEvent[];
  auditLogs: AuditLog[];
}
