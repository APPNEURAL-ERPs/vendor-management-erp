export type UUID = string;
export type TenantId = string;
export type ISODate = string;
export type CurrencyCode = "INR" | "USD" | "EUR" | string;
export type Role = "viewer" | "sales_rep" | "sales_manager" | "sales_ops" | "quote_manager" | "sales_admin" | "admin" | "owner" | "auditor";
export interface RequestActor { tenantId: TenantId; userId: UUID; role: Role; }
export interface BaseEntity { id: UUID; tenantId: TenantId; createdAt: ISODate; updatedAt: ISODate; }
export type EntityStatus = "active" | "inactive" | "archived";

export type LeadSource = "web" | "referral" | "email" | "event" | "partner" | "outbound" | "import" | "other";
export type LeadStatus = "new" | "contacted" | "qualified" | "unqualified" | "converted" | "lost";
export interface Lead extends BaseEntity { leadNumber: string; firstName: string; lastName: string; email: string; phone?: string; company?: string; source: LeadSource; status: LeadStatus; score: number; expectedValue: number; currency: CurrencyCode; ownerId?: UUID; tags: string[]; notes?: string; convertedDealId?: UUID; convertedAt?: ISODate; customFields: Record<string, unknown>; createdBy: UUID; }

export interface Pipeline extends BaseEntity { code: string; name: string; description?: string; isDefault: boolean; status: EntityStatus; createdBy: UUID; }
export type ForecastCategory = "pipeline" | "best_case" | "commit" | "closed" | "omitted";
export interface PipelineStage extends BaseEntity { pipelineId: UUID; code: string; name: string; order: number; probability: number; forecastCategory: ForecastCategory; status: EntityStatus; createdBy: UUID; }

export type DealStatus = "open" | "won" | "lost" | "cancelled";
export interface Deal extends BaseEntity { dealNumber: string; title: string; accountName: string; contactName?: string; contactEmail?: string; leadId?: UUID; pipelineId: UUID; stageId: UUID; ownerId: UUID; value: number; currency: CurrencyCode; probability: number; forecastCategory: ForecastCategory; closeDate: string; status: DealStatus; lossReason?: string; tags: string[]; customFields: Record<string, unknown>; createdBy: UUID; wonAt?: ISODate; lostAt?: ISODate; }

export interface SalesProduct extends BaseEntity { sku: string; name: string; description?: string; unitPrice: number; currency: CurrencyCode; taxRate: number; status: EntityStatus; createdBy: UUID; }

export type QuoteStatus = "draft" | "approved" | "sent" | "accepted" | "rejected" | "expired" | "cancelled";
export interface QuoteLineInput { productId?: UUID; name?: string; quantity: number; unitPrice?: number; discountPct?: number; taxRate?: number; }
export interface QuoteLine { productId?: UUID; sku?: string; name: string; quantity: number; unitPrice: number; discountPct: number; taxRate: number; subtotal: number; discountAmount: number; taxAmount: number; total: number; }
export interface Quote extends BaseEntity { quoteNumber: string; dealId: UUID; accountName: string; contactEmail?: string; status: QuoteStatus; currency: CurrencyCode; validUntil: string; lineItems: QuoteLine[]; subtotal: number; discountTotal: number; taxTotal: number; total: number; terms?: string; createdBy: UUID; approvedBy?: UUID; approvedAt?: ISODate; sentAt?: ISODate; acceptedAt?: ISODate; rejectedAt?: ISODate; }

export type ProposalStatus = "draft" | "sent" | "accepted" | "rejected" | "archived";
export interface Proposal extends BaseEntity { proposalNumber: string; dealId: UUID; quoteId?: UUID; title: string; summary: string; content: string; status: ProposalStatus; createdBy: UUID; sentAt?: ISODate; acceptedAt?: ISODate; rejectedAt?: ISODate; }

export type ActivityType = "call" | "email" | "meeting" | "task" | "note";
export type ActivityStatus = "planned" | "done" | "cancelled" | "overdue";
export type RelatedType = "lead" | "deal" | "quote" | "proposal" | "account" | "contact";
export interface SalesActivity extends BaseEntity { type: ActivityType; subject: string; relatedType: RelatedType; relatedId: UUID; ownerId: UUID; dueAt?: ISODate; completedAt?: ISODate; status: ActivityStatus; notes?: string; outcome?: string; createdBy: UUID; }

export interface ForecastSummary { openDealCount: number; openPipelineValue: number; weightedPipelineValue: number; commitValue: number; bestCaseValue: number; closedWonValue: number; expectedRevenue: number; currency: CurrencyCode; }
export interface Forecast extends BaseEntity { periodStart: string; periodEnd: string; currency: CurrencyCode; ownerId?: UUID; generatedBy: UUID; summary: ForecastSummary; }
export interface SalesAnalytics { leadCount: number; qualifiedLeads: number; convertedLeads: number; conversionRate: number; openDeals: number; wonDeals: number; lostDeals: number; openPipelineValue: number; weightedPipelineValue: number; wonRevenue: number; averageWonDealValue: number; winRate: number; quoteAcceptanceRate: number; overdueActivities: number; currency: CurrencyCode; }
export interface SalesEvent extends BaseEntity { event: string; source: "SalesOS" | string; actorId: UUID; data: Record<string, unknown>; }
export interface AuditLog extends BaseEntity { actorId: UUID; role: Role; action: string; entityType: string; entityId?: UUID; before?: unknown; after?: unknown; }
export interface SalesState { leads: Lead[]; pipelines: Pipeline[]; pipelineStages: PipelineStage[]; deals: Deal[]; products: SalesProduct[]; quotes: Quote[]; proposals: Proposal[]; activities: SalesActivity[]; forecasts: Forecast[]; events: SalesEvent[]; auditLogs: AuditLog[]; }
