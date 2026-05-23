export type UUID = string;
export type TenantId = string;
export type ISODate = string;
export type ApiRole = "viewer" | "content_editor" | "website_admin" | "seo_manager" | "form_manager" | "analytics_viewer" | "admin" | "owner" | "publisher";

export interface RequestActor { tenantId: TenantId; userId: UUID; role: ApiRole; }
export interface BaseEntity { id: UUID; tenantId: TenantId; createdAt: ISODate; updatedAt: ISODate; }

export interface Website extends BaseEntity {
  name: string;
  description?: string;
  domain: string;
  status: "draft" | "active" | "archived";
  publishedAt?: ISODate;
  analyticsEnabled: boolean;
  seoScore?: number;
  settings: WebsiteSettings;
  metadata: Record<string, unknown>;
  createdBy: UUID;
}

export interface WebsiteSettings {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  favicon?: string;
  language: string;
  timezone: string;
  googleAnalyticsId?: string;
  socialLinks?: SocialLinks;
}

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  github?: string;
}

export interface WebsitePage extends BaseEntity {
  websiteId: UUID;
  title: string;
  slug: string;
  status: "draft" | "published" | "archived";
  pageType: PageType;
  content?: string;
  sections: PageSection[];
  seo: SEOSettings;
  publishedAt?: ISODate;
  authorId?: UUID;
  lastPublishedAt?: ISODate;
  version: number;
  parentId?: UUID;
  order: number;
  template?: string;
  metadata: Record<string, unknown>;
}

export type PageType = "home" | "about" | "service" | "product" | "landing" | "blog" | "contact" | "pricing" | "case-study" | "faq" | "comparison" | "industry" | "resource" | "custom";

export interface PageSection {
  id: UUID;
  type: SectionType;
  order: number;
  content: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

export type SectionType = "hero" | "features" | "pricing" | "faq" | "testimonials" | "cta" | "about" | "services" | "process" | "benefits" | "trust" | "contact" | "newsletter" | "footer" | "header" | "testimonial" | "case-study" | "comparison" | "custom";

export interface SEOSettings {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  schemaMarkup?: SchemaMarkup[];
  breadcrumbs?: Breadcrumb[];
  internalLinks?: InternalLink[];
  externalLinks?: ExternalLink[];
}

export interface SchemaMarkup {
  type: "organization" | "website" | "service" | "product" | "article" | "faq" | "breadcrumb" | "local_business" | "course" | "review" | "software";
  data: Record<string, unknown>;
}

export interface Breadcrumb {
  label: string;
  url: string;
}

export interface InternalLink {
  text: string;
  targetPageId: UUID;
  anchor?: string;
}

export interface ExternalLink {
  text: string;
  url: string;
  anchor?: string;
}

export interface LandingPage extends BaseEntity {
  websiteId: UUID;
  pageId?: UUID;
  name: string;
  slug: string;
  offer: string;
  headline: string;
  subheadline?: string;
  status: "draft" | "published" | "archived";
  formId?: UUID;
  ctaId?: UUID;
  content: string;
  seo: SEOSettings;
  publishedAt?: ISODate;
  conversions: number;
  views: number;
  conversionRate: number;
  metadata: Record<string, unknown>;
}

export interface Component extends BaseEntity {
  websiteId: UUID;
  name: string;
  type: SectionType;
  content: Record<string, unknown>;
  settings?: Record<string, unknown>;
  isGlobal: boolean;
  usageCount: number;
  createdBy: UUID;
}

export interface Form extends BaseEntity {
  websiteId: UUID;
  pageId?: UUID;
  name: string;
  type: FormType;
  fields: FormField[];
  settings: FormSettings;
  status: "active" | "inactive" | "archived";
  submissionsCount: number;
  lastSubmissionAt?: ISODate;
  webhookUrl?: string;
  createdBy: UUID;
}

export type FormType = "contact" | "lead" | "quote" | "newsletter" | "demo" | "application" | "feedback" | "multi-step" | "custom";

export interface FormField {
  id: UUID;
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required: boolean;
  validation?: FieldValidation;
  options?: FieldOption[];
  order: number;
}

export type FieldType = "text" | "email" | "phone" | "textarea" | "select" | "checkbox" | "radio" | "file" | "date" | "number" | "url";

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  message?: string;
}

export interface FieldOption {
  value: string;
  label: string;
}

export interface FormSettings {
  submitButtonText: string;
  successMessage: string;
  redirectUrl?: string;
  spamProtection: boolean;
  autoReply?: AutoReply;
}

export interface AutoReply {
  enabled: boolean;
  subject?: string;
  body?: string;
}

export interface FormSubmission extends BaseEntity {
  formId: UUID;
  websiteId: UUID;
  pageId?: UUID;
  fields: Record<string, unknown>;
  status: "new" | "read" | "responded" | "converted" | "archived";
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  metadata: Record<string, unknown>;
}

export interface CTA extends BaseEntity {
  websiteId: UUID;
  pageId?: UUID;
  text: string;
  type: CTAType;
  url: string;
  position: CTAPosition;
  style?: string;
  status: "active" | "inactive";
  clicks: number;
  conversions: number;
  createdBy: UUID;
}

export type CTAType = "primary" | "secondary" | "ghost" | "sticky" | "exit-intent" | "inline";
export type CTAPosition = "hero" | "content" | "sidebar" | "footer" | "sticky" | "popup";

export interface Domain extends BaseEntity {
  websiteId: UUID;
  domain: string;
  type: "primary" | "alias" | "redirect";
  sslEnabled: boolean;
  sslCertificate?: SSLCertificate;
  dnsStatus: DNSStatus;
  redirectTo?: string;
  status: "pending" | "active" | "disabled" | "error";
  verifiedAt?: ISODate;
  createdBy: UUID;
}

export interface SSLCertificate {
  issuer: string;
  validFrom: ISODate;
  validUntil: ISODate;
  autoRenew: boolean;
  wildcard?: boolean;
}

export interface DNSStatus {
  a?: string[];
  cname?: string[];
  txt?: string[];
  mx?: string[];
  verified: boolean;
}

export interface Deployment extends BaseEntity {
  websiteId: UUID;
  version: string;
  environment: "development" | "staging" | "production";
  status: DeploymentStatus;
  buildLog?: string;
  errorLog?: string;
  deployedBy: UUID;
  deployedAt: ISODate;
  url?: string;
  previousVersion?: string;
  rollbackFrom?: UUID;
}

export type DeploymentStatus = "pending" | "building" | "deploying" | "success" | "failed" | "rollback";

export interface Analytics extends BaseEntity {
  websiteId: UUID;
  pageId?: UUID;
  date: string;
  visitors: number;
  pageViews: number;
  uniquePageViews: number;
  bounceRate: number;
  avgSessionDuration: number;
  topPages: TopPage[];
  trafficSources: TrafficSource[];
  conversions: number;
  formSubmissions: number;
  ctaClicks: number;
}

export interface TopPage {
  pageId: UUID;
  slug: string;
  views: number;
  uniqueViews: number;
  avgTimeOnPage: number;
  bounceRate: number;
}

export interface TrafficSource {
  source: string;
  medium?: string;
  visitors: number;
  percentage: number;
}

export interface WebsiteEvent extends BaseEntity {
  websiteId: UUID;
  pageId?: UUID;
  event: string;
  category: "page_view" | "cta_click" | "form_submit" | "download" | "video_play" | "scroll" | "search" | "custom";
  data: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  device?: string;
  browser?: string;
  os?: string;
}

export interface Sitemap extends BaseEntity {
  websiteId: UUID;
  pages: SitemapPage[];
  lastGeneratedAt?: ISODate;
  status: "draft" | "published";
  version: number;
}

export interface SitemapPage {
  pageId: UUID;
  slug: string;
  priority: number;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  lastModified?: ISODate;
}

export interface WebsiteAudit extends BaseEntity {
  websiteId: UUID;
  type: "seo" | "performance" | "accessibility" | "security" | "cro" | "full";
  score: number;
  issues: AuditIssue[];
  recommendations: string[];
  status: "in_progress" | "completed" | "failed";
  startedAt: ISODate;
  completedAt?: ISODate;
  report?: string;
}

export interface AuditIssue {
  id: UUID;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  title: string;
  description: string;
  affectedPages?: UUID[];
  recommendation: string;
  effort: "low" | "medium" | "high";
}

export interface CROCheck extends BaseEntity {
  websiteId: UUID;
  pageId?: UUID;
  type: "message" | "cta" | "proof" | "form" | "navigation" | "trust" | "speed" | "mobile";
  score: number;
  findings: string[];
  recommendations: string[];
  status: "pending" | "completed";
}

export interface WebsiteState {
  websites: Website[];
  pages: WebsitePage[];
  landingPages: LandingPage[];
  components: Component[];
  forms: Form[];
  formSubmissions: FormSubmission[];
  ctas: CTA[];
  domains: Domain[];
  deployments: Deployment[];
  analytics: Analytics[];
  events: WebsiteEvent[];
  sitemaps: Sitemap[];
  audits: WebsiteAudit[];
  croChecks: CROCheck[];
}
