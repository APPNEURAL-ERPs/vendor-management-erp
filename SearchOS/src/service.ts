import {
  SearchState,
  SearchIndex,
  SearchableDocument,
  SearchQuery,
  SearchResult,
  SearchFilter,
  SearchMode,
  SavedSearch,
  SearchAlert,
  SearchSynonym,
  SearchAnalytics,
  SearchFacet,
  SearchOverview,
  SearchHealth,
  SearchEmbedding,
  VectorIndex,
  SearchField,
  RankingRule,
  FilterDefinition,
  RequestActor,
  UUID
} from "./domain";
import { DataStore } from "./core/datastore";
import { newId, nowIso } from "./core/id";
import {
  tokenize,
  includesText,
  calculateScore,
  extractSnippet,
  highlightMatches,
  calculateSimilarity,
  extractKeywords
} from "./core/utils";
import { badRequest, notFound } from "./core/http";

export class SearchService {
  constructor(private readonly store: DataStore) {}

  getOverview(tenantId: string): SearchOverview {
    const state = this.store.getState();
    const indexes = state.indexes.filter(i => i.tenantId === tenantId);
    const documents = state.documents.filter(d => d.tenantId === tenantId);
    const savedSearches = state.savedSearches.filter(s => s.tenantId === tenantId);
    const alerts = state.alerts.filter(a => a.tenantId === tenantId);
    const queries = state.queries.filter(q => q.tenantId === tenantId);
    
    const analytics = state.analytics.filter(a => a.tenantId === tenantId);
    const totalSearches = analytics.reduce((sum, a) => sum + a.totalSearches, 0);
    const avgLatencyMs = analytics.length > 0 
      ? Math.round(analytics.reduce((sum, a) => sum + a.avgLatencyMs, 0) / analytics.length)
      : 0;
    const noResultSearches = analytics.reduce((sum, a) => sum + a.noResultSearches, 0);
    const clickThroughRate = analytics.length > 0
      ? Math.round((analytics.reduce((sum, a) => sum + a.clickThroughRate, 0) / analytics.length) * 100) / 100
      : 0;
    
    const allTopQueries = analytics.flatMap(a => a.topQueries);
    const topQueriesMap = new Map<string, number>();
    for (const q of allTopQueries) {
      topQueriesMap.set(q.query, (topQueriesMap.get(q.query) || 0) + q.count);
    }
    const topQueries = Array.from(topQueriesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));
    
    const indexedDocs = documents.filter(d => d.status === "indexed").length;
    const pendingDocs = documents.filter(d => d.status === "pending").length;
    
    const activeIndexes = indexes.filter(i => i.status === "ready").length;
    const buildingIndexes = indexes.filter(i => i.status === "building").length;
    
    const activeSaved = savedSearches.filter(s => s.status === "active").length;
    const activeAlerts = alerts.filter(a => a.status === "active").length;
    
    const latestIndex = indexes.sort((a, b) => 
      new Date(b.lastIndexedAt || 0).getTime() - new Date(a.lastIndexedAt || 0).getTime()
    )[0];
    const indexFreshnessPercent = latestIndex 
      ? Math.max(0, 100 - Math.floor((Date.now() - new Date(latestIndex.lastIndexedAt || 0).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
    
    return {
      totalSearches,
      avgLatencyMs,
      noResultRate: totalSearches > 0 ? Math.round((noResultSearches / totalSearches) * 100) / 100 : 0,
      clickThroughRate,
      indexes: {
        total: indexes.length,
        active: activeIndexes,
        building: buildingIndexes
      },
      documents: {
        total: documents.length,
        indexed: indexedDocs,
        pending: pendingDocs
      },
      savedSearches: {
        total: savedSearches.length,
        personal: savedSearches.filter(s => s.scope === "personal").length,
        shared: savedSearches.filter(s => s.scope !== "personal").length
      },
      alerts: {
        total: alerts.length,
        active: activeAlerts
      },
      topQueries,
      indexFreshnessPercent
    };
  }

  search(
    tenantId: string,
    queryText: string,
    mode: SearchMode = "fulltext",
    filters: SearchFilter[] = [],
    page = 1,
    pageSize = 20,
    sortBy?: string,
    sortOrder: "asc" | "desc" = "desc"
  ): { results: SearchResult[]; total: number; facets: SearchFacet[]; queryId: string } {
    const startTime = Date.now();
    const queryId = newId("query");
    const state = this.store.getState();
    
    let documents = state.documents.filter(
      d => d.tenantId === tenantId && d.status === "indexed"
    );
    
    if (filters.length > 0) {
      documents = this.applyFilters(documents, filters);
    }
    
    const scoredDocs = documents.map(doc => ({
      doc,
      score: calculateScore(doc, queryText),
      similarity: calculateSimilarity(doc.title + " " + doc.content, queryText)
    }));
    
    let results = scoredDocs
      .filter(sd => mode === "semantic" || mode === "vector" ? sd.similarity > 0.1 : sd.score > 0)
      .sort((a, b) => {
        if (mode === "semantic" || mode === "vector") {
          return sortOrder === "asc" ? a.similarity - b.similarity : b.similarity - a.similarity;
        }
        if (sortBy === "indexedAt" || sortBy === "lastModifiedAt") {
          const aTime = new Date(a.doc.lastModifiedAt || a.doc.indexedAt || 0).getTime();
          const bTime = new Date(b.doc.lastModifiedAt || b.doc.indexedAt || 0).getTime();
          return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
        }
        return sortOrder === "asc" ? a.score - b.score : b.score - a.score;
      })
      .slice((page - 1) * pageSize, page * pageSize)
      .map((sd, index) => {
        const query = state.queries.find(q => q.tenantId === tenantId);
        const searchResult: SearchResult = {
          id: newId("result"),
          tenantId,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          queryId,
          documentId: sd.doc.id,
          externalId: sd.doc.externalId,
          entityType: sd.doc.entityType,
          title: sd.doc.title,
          snippet: mode === "semantic" || mode === "vector" 
            ? extractSnippet(sd.doc.content, queryText, 200)
            : extractSnippet(sd.doc.content, queryText, 150),
          url: sd.doc.url,
          sourceModule: sd.doc.sourceModule,
          score: mode === "semantic" || mode === "vector" ? sd.similarity : sd.score,
          rank: (page - 1) * pageSize + index + 1,
          highlights: mode !== "semantic" && mode !== "vector" 
            ? highlightMatches(sd.doc.content, queryText)
            : [],
          metadata: sd.doc.metadata,
          facets: sd.doc.facets,
          permissions: sd.doc.permissions,
          actions: [
            { type: "open", label: "Open", url: sd.doc.url, confirmationRequired: false },
            { type: "share", label: "Share", confirmationRequired: false }
          ]
        };
        return searchResult;
      });
    
    const facets = this.computeFacets(documents);
    
    const latencyMs = Date.now() - startTime;
    
    const queryRecord: SearchQuery = {
      id: queryId,
      tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      queryId,
      queryText,
      mode,
      filters,
      page,
      pageSize,
      sortBy,
      sortOrder,
      totalResults: results.length,
      latencyMs,
      status: results.length === 0 ? "no_results" : "completed"
    };
    
    state.queries.push(queryRecord);
    state.results.push(...results);
    this.store.save();
    
    return {
      results,
      total: results.length,
      facets,
      queryId
    };
  }

  private applyFilters(documents: SearchableDocument[], filters: SearchFilter[]): SearchableDocument[] {
    return documents.filter(doc => {
      return filters.every(filter => {
        const value = this.getFieldValue(doc, filter.field);
        
        switch (filter.operator) {
          case "eq":
            return value === filter.value;
          case "ne":
            return value !== filter.value;
          case "contains":
            return includesText(value, String(filter.value));
          case "in":
            return Array.isArray(filter.value) && filter.value.includes(value);
          case "exists":
            return value !== undefined && value !== null;
          case "gt":
            return Number(value) > Number(filter.value);
          case "gte":
            return Number(value) >= Number(filter.value);
          case "lt":
            return Number(value) < Number(filter.value);
          case "lte":
            return Number(value) <= Number(filter.value);
          default:
            return true;
        }
      });
    });
  }

  private getFieldValue(doc: SearchableDocument, field: string): unknown {
    if (field in doc) {
      return (doc as any)[field];
    }
    if (doc.facets && field in doc.facets) {
      return doc.facets[field];
    }
    if (doc.metadata && field in doc.metadata) {
      return doc.metadata[field];
    }
    return undefined;
  }

  private computeFacets(documents: SearchableDocument[]): SearchFacet[] {
    const facets: SearchFacet[] = [];
    const moduleCounts = new Map<string, number>();
    const entityCounts = new Map<string, number>();
    const statusCounts = new Map<string, number>();
    
    for (const doc of documents) {
      moduleCounts.set(doc.sourceModule, (moduleCounts.get(doc.sourceModule) || 0) + 1);
      entityCounts.set(doc.entityType, (entityCounts.get(doc.entityType) || 0) + 1);
      statusCounts.set(doc.status, (statusCounts.get(doc.status) || 0) + 1);
    }
    
    if (moduleCounts.size > 0) {
      facets.push({
        field: "sourceModule",
        label: "Module",
        type: "terms",
        buckets: Array.from(moduleCounts.entries())
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => b.count - a.count)
      });
    }
    
    if (entityCounts.size > 0) {
      facets.push({
        field: "entityType",
        label: "Entity Type",
        type: "terms",
        buckets: Array.from(entityCounts.entries())
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => b.count - a.count)
      });
    }
    
    if (statusCounts.size > 0) {
      facets.push({
        field: "status",
        label: "Status",
        type: "terms",
        buckets: Array.from(statusCounts.entries())
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => b.count - a.count)
      });
    }
    
    return facets;
  }

  getSuggestions(tenantId: string, prefix: string, limit = 10): SearchSynonym[] {
    const state = this.store.getState();
    const synonyms = state.synonyms.filter(
      s => s.tenantId === tenantId && s.status === "active"
    );
    
    const normalizedPrefix = prefix.toLowerCase();
    
    return synonyms
      .filter(s => s.term.toLowerCase().startsWith(normalizedPrefix))
      .slice(0, limit);
  }

  createSavedSearch(
    tenantId: string,
    actor: RequestActor,
    data: {
      key: string;
      name: string;
      queryText: string;
      mode: SearchMode;
      filters: SearchFilter[];
      scope: "personal" | "team" | "tenant" | "global";
      tags?: string[];
    }
  ): SavedSearch {
    const state = this.store.getState();
    const savedSearch: SavedSearch = {
      id: newId("saved"),
      tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: data.key,
      name: data.name,
      queryText: data.queryText,
      mode: data.mode,
      filters: data.filters,
      scope: data.scope,
      ownerId: actor.userId,
      tags: data.tags || [],
      useCount: 0,
      status: "active"
    };
    
    state.savedSearches.push(savedSearch);
    this.store.save();
    
    this.store.audit(actor, "create", "SavedSearch", savedSearch.id, data.queryText, data.filters);
    
    return savedSearch;
  }

  getSavedSearches(tenantId: string, actor: RequestActor): SavedSearch[] {
    const state = this.store.getState();
    return state.savedSearches.filter(
      s => s.tenantId === tenantId && 
           (s.scope === "global" || s.scope === "tenant" || s.ownerId === actor.userId)
    );
  }

  createSearchAlert(
    tenantId: string,
    actor: RequestActor,
    data: {
      name: string;
      queryText: string;
      filters: SearchFilter[];
      conditions: { field: string; operator: "eq" | "gt" | "lt" | "contains"; value: unknown }[];
      actions: { type: "email" | "webhook" | "notification"; target: string; template?: string }[];
      frequency: "immediate" | "hourly" | "daily" | "weekly";
    }
  ): SearchAlert {
    const state = this.store.getState();
    const alert: SearchAlert = {
      id: newId("alert"),
      tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: data.name,
      queryText: data.queryText,
      filters: data.filters,
      conditions: data.conditions,
      actions: data.actions,
      frequency: data.frequency,
      ownerId: actor.userId,
      status: "active"
    };
    
    state.alerts.push(alert);
    this.store.save();
    
    this.store.audit(actor, "create", "SearchAlert", alert.id, data.queryText, data.filters);
    
    return alert;
  }

  getAnalytics(tenantId: string, days = 30): SearchAnalytics[] {
    const state = this.store.getState();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return state.analytics
      .filter(a => a.tenantId === tenantId && new Date(a.date) >= cutoffDate)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  recordClick(tenantId: string, queryId: string, resultId: UUID, position: number, sessionId?: string): void {
    const state = this.store.getState();
    state.clicks.push({
      id: newId("click"),
      tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      queryId,
      resultId,
      documentId: resultId,
      position,
      sessionId
    });
    this.store.save();
  }

  createIndex(
    tenantId: string,
    actor: RequestActor,
    data: {
      key: string;
      name: string;
      entityType: string;
      sourceModule: string;
      fields: SearchField[];
      rankingRules?: RankingRule[];
      filters?: FilterDefinition[];
    }
  ): SearchIndex {
    const state = this.store.getState();
    const index: SearchIndex = {
      id: newId("idx"),
      tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: data.key,
      name: data.name,
      entityType: data.entityType,
      sourceModule: data.sourceModule,
      status: "building",
      fields: data.fields,
      rankingRules: data.rankingRules || [],
      filters: data.filters || [],
      documentCount: 0,
      indexingFailures: 0
    };
    
    state.indexes.push(index);
    this.store.save();
    
    this.store.audit(actor, "create", "SearchIndex", index.id);
    
    return index;
  }

  getIndexes(tenantId: string): SearchIndex[] {
    const state = this.store.getState();
    return state.indexes.filter(i => i.tenantId === tenantId);
  }

  indexDocument(
    tenantId: string,
    actor: RequestActor,
    indexId: string,
    data: {
      externalId: string;
      entityType: string;
      title: string;
      content: string;
      url?: string;
      sourceModule: string;
      metadata?: Record<string, unknown>;
      tags?: string[];
      facets?: Record<string, string | number | boolean | string[]>;
    }
  ): SearchableDocument {
    const state = this.store.getState();
    const index = state.indexes.find(i => i.id === indexId && i.tenantId === tenantId);
    if (!index) {
      notFound(`Index ${indexId} not found`);
    }
    
    const document: SearchableDocument = {
      id: newId("doc"),
      tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      indexId,
      externalId: data.externalId,
      entityType: data.entityType,
      title: data.title,
      content: data.content,
      url: data.url,
      sourceModule: data.sourceModule,
      metadata: data.metadata || {},
      tags: data.tags || [],
      status: "indexed",
      indexedAt: nowIso(),
      lastModifiedAt: nowIso(),
      permissions: [],
      facets: (data.facets || {}) as Record<string, string | number | boolean | string[]>
    };
    
    state.documents.push(document);
    index.documentCount = state.documents.filter(d => d.indexId === indexId).length;
    index.lastIndexedAt = nowIso();
    index.status = "ready";
    this.store.save();
    
    this.store.audit(actor, "index", "SearchableDocument", document.id);
    
    return document;
  }

  getDocuments(tenantId: string, indexId?: string, page = 1, pageSize = 50): SearchableDocument[] {
    const state = this.store.getState();
    let documents = state.documents.filter(d => d.tenantId === tenantId);
    
    if (indexId) {
      documents = documents.filter(d => d.indexId === indexId);
    }
    
    return documents
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice((page - 1) * pageSize, page * pageSize);
  }

  createSynonym(
    tenantId: string,
    actor: RequestActor,
    data: {
      term: string;
      synonyms: string[];
      scope?: "global" | "module" | "entity";
      module?: string;
      entityType?: string;
    }
  ): SearchSynonym {
    const state = this.store.getState();
    const synonym: SearchSynonym = {
      id: newId("syn"),
      tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      term: data.term,
      synonyms: data.synonyms,
      scope: data.scope || "global",
      module: data.module,
      entityType: data.entityType,
      status: "active"
    };
    
    state.synonyms.push(synonym);
    this.store.save();
    
    this.store.audit(actor, "create", "SearchSynonym", synonym.id);
    
    return synonym;
  }

  getSynonyms(tenantId: string, scope?: string): SearchSynonym[] {
    const state = this.store.getState();
    let synonyms = state.synonyms.filter(s => s.tenantId === tenantId);
    
    if (scope) {
      synonyms = synonyms.filter(s => s.scope === scope);
    }
    
    return synonyms;
  }

  getHealth(tenantId: string): SearchHealth {
    const state = this.store.getState();
    const indexes = state.indexes.filter(i => i.tenantId === tenantId);
    const analytics = this.getAnalytics(tenantId, 1);
    const latestAnalytics = analytics[0];
    
    const indexHealth: Record<string, number> = {};
    for (const index of indexes) {
      if (index.status === "ready") {
        const ageHours = index.lastIndexedAt
          ? (Date.now() - new Date(index.lastIndexedAt).getTime()) / (1000 * 60 * 60)
          : 999;
        indexHealth[index.key] = ageHours < 24 ? 100 : Math.max(0, 100 - Math.floor(ageHours / 24) * 10);
      } else {
        indexHealth[index.key] = 0;
      }
    }
    
    const avgLatencyMs = latestAnalytics?.avgLatencyMs || 0;
    const successRate = latestAnalytics?.totalSearches
      ? (latestAnalytics.successfulSearches / latestAnalytics.totalSearches) * 100
      : 100;
    const noResultRate = latestAnalytics?.totalSearches
      ? (latestAnalytics.noResultSearches / latestAnalytics.totalSearches) * 100
      : 0;
    
    const overallScore = Math.min(100, Math.max(0, 
      successRate * 0.4 +
      (100 - noResultRate) * 0.3 +
      (100 - Math.min(avgLatencyMs / 10, 100)) * 0.2 +
      Object.values(indexHealth).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(indexHealth).length) * 0.1
    ));
    
    return {
      id: newId("health"),
      tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      overallScore: Math.round(overallScore),
      indexHealth,
      avgLatencyMs,
      successRate: Math.round(successRate * 100) / 100,
      noResultRate: Math.round(noResultRate * 100) / 100,
      indexFreshnessPercent: indexes.length > 0
        ? Math.round((indexes.filter(i => {
            const ageHours = i.lastIndexedAt 
              ? (Date.now() - new Date(i.lastIndexedAt).getTime()) / (1000 * 60 * 60)
              : 999;
            return ageHours < 24;
          }).length / indexes.length) * 100)
        : 0,
      lastHealthCheckAt: nowIso()
    };
  }

  recordSearchAnalytics(tenantId: string): void {
    const state = this.store.getState();
    const today = new Date().toISOString().split("T")[0];
    
    let analytics = state.analytics.find(a => a.tenantId === tenantId && a.date === today);
    
    if (!analytics) {
      analytics = {
        id: newId("analytics"),
        tenantId,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        date: today,
        totalSearches: 0,
        successfulSearches: 0,
        noResultSearches: 0,
        failedSearches: 0,
        avgLatencyMs: 0,
        topQueries: [],
        topModules: [],
        topEntities: [],
        noResultQueries: [],
        clickThroughRate: 0
      };
      state.analytics.push(analytics);
    }
    
    const todayQueries = state.queries.filter(q => 
      q.tenantId === tenantId && 
      q.createdAt.startsWith(today)
    );
    
    analytics.totalSearches += todayQueries.length;
    analytics.successfulSearches += todayQueries.filter(q => q.status === "completed").length;
    analytics.noResultSearches += todayQueries.filter(q => q.status === "no_results").length;
    analytics.failedSearches += todayQueries.filter(q => q.status === "failed").length;
    
    if (todayQueries.length > 0) {
      analytics.avgLatencyMs = Math.round(
        todayQueries.reduce((sum, q) => sum + (q.latencyMs || 0), 0) / todayQueries.length
      );
    }
    
    const queryCounts = new Map<string, number>();
    const moduleCounts = new Map<string, number>();
    const entityCounts = new Map<string, number>();
    
    for (const query of todayQueries) {
      queryCounts.set(query.queryText, (queryCounts.get(query.queryText) || 0) + 1);
    }
    
    analytics.topQueries = Array.from(queryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([query, count]) => ({ query, count }));
    
    analytics.noResultQueries = todayQueries
      .filter(q => q.status === "no_results")
      .map(q => q.queryText)
      .filter((q, i, arr) => arr.indexOf(q) === i)
      .slice(0, 10);
    
    const todayClicks = state.clicks.filter(c => 
      c.tenantId === tenantId && c.createdAt.startsWith(today)
    );
    analytics.clickThroughRate = todayQueries.length > 0
      ? todayClicks.length / todayQueries.length
      : 0;
    
    this.store.save();
  }
}
