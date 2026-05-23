export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "search_admin" | "search_analyst" | "search_user" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";
export type IndexStatus = "building" | "ready" | "stale" | "failed";
export type SearchMode = "fulltext" | "semantic" | "vector" | "hybrid" | "filtered";
export type ResultRanking = "relevance" | "freshness" | "popularity" | "permission" | "custom";

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

export interface SearchIndex extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  entityType: string;
  sourceModule: string;
  status: IndexStatus;
  fields: SearchField[];
  rankingRules: RankingRule[];
  filters: FilterDefinition[];
  documentCount: number;
  lastIndexedAt?: ISODate;
  indexingFailures: number;
}

export interface SearchField {
  name: string;
  type: "text" | "keyword" | "number" | "date" | "boolean" | "array";
  searchable: boolean;
  filterable: boolean;
  sortable: boolean;
  boosted: boolean;
  weight: number;
}

export interface RankingRule {
  field: string;
  direction: "asc" | "desc";
  weight: number;
  type: "relevance" | "freshness" | "field" | "custom";
}

export interface FilterDefinition {
  field: string;
  label: string;
  type: "select" | "multiselect" | "range" | "date" | "boolean";
  options?: string[];
}

export interface VectorIndex extends BaseEntity {
  indexId: UUID;
  embeddingModel: string;
  dimensions: number;
  metric: "cosine" | "euclidean" | "dotproduct";
  documentCount: number;
  status: IndexStatus;
  lastRefreshedAt?: ISODate;
}

export interface SearchableDocument extends BaseEntity {
  indexId: UUID;
  externalId: string;
  entityType: string;
  title: string;
  content: string;
  summary?: string;
  url?: string;
  sourceModule: string;
  metadata: Record<string, unknown>;
  tags: string[];
  status: "indexed" | "pending" | "failed" | "archived";
  indexedAt?: ISODate;
  lastModifiedAt?: ISODate;
  permissions: string[];
  facets: Record<string, string | number | boolean | string[]>;
}

export interface SearchQuery extends BaseEntity {
  queryId: string;
  queryText: string;
  mode: SearchMode;
  filters: SearchFilter[];
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  totalResults?: number;
  latencyMs?: number;
  status: "completed" | "no_results" | "failed" | "timeout";
}

export interface SearchFilter {
  field: string;
  operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "contains" | "in" | "exists" | "range";
  value: unknown;
  type?: "and" | "or";
}

export interface SearchResult extends BaseEntity {
  queryId: string;
  documentId: UUID;
  externalId: string;
  entityType: string;
  title: string;
  snippet: string;
  url?: string;
  sourceModule: string;
  score: number;
  rank: number;
  highlights: string[];
  metadata: Record<string, unknown>;
  facets: Record<string, string | number | boolean | string[]>;
  permissions: string[];
  actions: ResultAction[];
}

export interface ResultAction {
  type: "open" | "edit" | "share" | "download" | "assign" | "create_task";
  label: string;
  url?: string;
  confirmationRequired: boolean;
}

export interface SearchSuggestion {
  text: string;
  type: "query" | "entity" | "action" | "shortcut";
  frequency: number;
  score: number;
}

export interface SearchSynonym {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
  term: string;
  synonyms: string[];
  scope: "global" | "module" | "entity";
  module?: string;
  entityType?: string;
  status: EntityStatus;
}

export interface SavedSearch extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  queryText: string;
  mode: SearchMode;
  filters: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  scope: "personal" | "team" | "tenant" | "global";
  ownerId: UUID;
  tags: string[];
  lastUsedAt?: ISODate;
  useCount: number;
  status: EntityStatus;
}

export interface SearchAlert extends BaseEntity {
  savedSearchId?: UUID;
  name: string;
  queryText: string;
  filters: SearchFilter[];
  conditions: AlertCondition[];
  actions: AlertAction[];
  frequency: "immediate" | "hourly" | "daily" | "weekly";
  lastTriggeredAt?: ISODate;
  status: EntityStatus;
  ownerId: UUID;
}

export interface AlertCondition {
  field: string;
  operator: "eq" | "gt" | "lt" | "contains";
  value: unknown;
}

export interface AlertAction {
  type: "email" | "webhook" | "notification";
  target: string;
  template?: string;
}

export interface SearchClick extends BaseEntity {
  queryId: string;
  resultId: UUID;
  documentId: UUID;
  position: number;
  dwellTimeMs?: number;
  sessionId?: string;
}

export interface SearchFacet {
  field: string;
  label: string;
  type: "terms" | "range" | "date";
  buckets: FacetBucket[];
}

export interface FacetBucket {
  value: string | number;
  label?: string;
  count: number;
}

export interface SearchAnalytics extends BaseEntity {
  tenantId: TenantId;
  date: string;
  totalSearches: number;
  successfulSearches: number;
  noResultSearches: number;
  failedSearches: number;
  avgLatencyMs: number;
  topQueries: Array<{ query: string; count: number }>;
  topModules: Array<{ module: string; count: number }>;
  topEntities: Array<{ entity: string; count: number }>;
  noResultQueries: string[];
  clickThroughRate: number;
}

export interface SearchHealth extends BaseEntity {
  tenantId: TenantId;
  overallScore: number;
  indexHealth: Record<string, number>;
  avgLatencyMs: number;
  successRate: number;
  noResultRate: number;
  indexFreshnessPercent: number;
  lastHealthCheckAt: ISODate;
}

export interface SearchEmbedding extends BaseEntity {
  documentId: UUID;
  vectorIndexId: UUID;
  embedding: number[];
  tokenCount: number;
  status: "pending" | "indexed" | "failed";
}

export interface SearchAuditLog extends BaseEntity {
  actorId: UUID;
  role: Role;
  action: string;
  entityType: string;
  entityId?: UUID;
  queryText?: string;
  filters?: SearchFilter[];
  resultCount?: number;
  success: boolean;
  errorMessage?: string;
}

export interface SearchEvent extends BaseEntity {
  type: string;
  source: string;
  actorId: UUID;
  data: Record<string, unknown>;
}

export interface SearchOverview {
  totalSearches: number;
  avgLatencyMs: number;
  noResultRate: number;
  clickThroughRate: number;
  indexes: { total: number; active: number; building: number };
  documents: { total: number; indexed: number; pending: number };
  savedSearches: { total: number; personal: number; shared: number };
  alerts: { total: number; active: number };
  topQueries: Array<{ query: string; count: number }>;
  indexFreshnessPercent: number;
}

export interface SearchState {
  indexes: SearchIndex[];
  vectorIndexes: VectorIndex[];
  documents: SearchableDocument[];
  queries: SearchQuery[];
  results: SearchResult[];
  synonyms: SearchSynonym[];
  savedSearches: SavedSearch[];
  alerts: SearchAlert[];
  clicks: SearchClick[];
  embeddings: SearchEmbedding[];
  analytics: SearchAnalytics[];
  auditLogs: SearchAuditLog[];
  events: SearchEvent[];
}
