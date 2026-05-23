import { Router, HttpContext, badRequest } from "./core/http";
import { SearchService } from "./service";
import { SearchMode, SearchFilter } from "./domain";

export function registerRoutes(router: Router, service: SearchService): Router {
  router.get("/health", async (ctx: HttpContext) => {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "SearchOS",
      version: "1.0.0"
    };
  });

  router.get("/docs", async (ctx: HttpContext) => {
    const { docs } = await import("./docs");
    return docs();
  });

  router.get("/search/overview", async (ctx: HttpContext) => {
    return service.getOverview(ctx.actor.tenantId);
  });

  router.post("/search", async (ctx: HttpContext) => {
    const body = ctx.body as {
      query?: string;
      mode?: SearchMode;
      filters?: SearchFilter[];
      page?: number;
      pageSize?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    };

    if (!body.query) {
      badRequest("query is required");
    }

    const result = service.search(
      ctx.actor.tenantId,
      body.query,
      body.mode || "fulltext",
      body.filters || [],
      body.page || 1,
      body.pageSize || 20,
      body.sortBy,
      body.sortOrder || "desc"
    );

    return result;
  });

  router.get("/search/suggestions", async (ctx: HttpContext) => {
    const prefix = ctx.query.get("prefix") || "";
    const limit = parseInt(ctx.query.get("limit") || "10", 10);
    return service.getSuggestions(ctx.actor.tenantId, prefix, limit);
  });

  router.post("/search/clicks", async (ctx: HttpContext) => {
    const body = ctx.body as {
      queryId?: string;
      resultId?: string;
      position?: number;
      sessionId?: string;
    };

    if (!body.queryId || !body.resultId || body.position === undefined) {
      badRequest("queryId, resultId, and position are required");
    }

    service.recordClick(
      ctx.actor.tenantId,
      body.queryId,
      body.resultId,
      body.position,
      body.sessionId
    );

    return { recorded: true };
  });

  router.post("/search/saved", async (ctx: HttpContext) => {
    const body = ctx.body as {
      key?: string;
      name?: string;
      queryText?: string;
      mode?: SearchMode;
      filters?: SearchFilter[];
      scope?: "personal" | "team" | "tenant" | "global";
      tags?: string[];
    };

    if (!body.key || !body.name || !body.queryText) {
      badRequest("key, name, and queryText are required");
    }

    return service.createSavedSearch(ctx.actor.tenantId, ctx.actor, {
      key: body.key,
      name: body.name,
      queryText: body.queryText,
      mode: body.mode || "fulltext",
      filters: body.filters || [],
      scope: body.scope || "personal",
      tags: body.tags
    });
  });

  router.get("/search/saved", async (ctx: HttpContext) => {
    return service.getSavedSearches(ctx.actor.tenantId, ctx.actor);
  });

  router.post("/search/alerts", async (ctx: HttpContext) => {
    const body = ctx.body as {
      name?: string;
      queryText?: string;
      filters?: SearchFilter[];
      conditions?: { field: string; operator: string; value: unknown }[];
      actions?: { type: string; target: string; template?: string }[];
      frequency?: "immediate" | "hourly" | "daily" | "weekly";
    };

    if (!body.name || !body.queryText) {
      badRequest("name and queryText are required");
    }

    return service.createSearchAlert(ctx.actor.tenantId, ctx.actor, {
      name: body.name,
      queryText: body.queryText,
      filters: body.filters || [],
      conditions: (body.conditions || []) as { field: string; operator: "eq" | "gt" | "lt" | "contains"; value: unknown }[],
      actions: (body.actions || []) as { type: "email" | "webhook" | "notification"; target: string; template?: string }[],
      frequency: body.frequency || "daily"
    });
  });

  router.get("/search/analytics", async (ctx: HttpContext) => {
    const days = parseInt(ctx.query.get("days") || "30", 10);
    return service.getAnalytics(ctx.actor.tenantId, days);
  });

  router.post("/search/analytics/record", async (ctx: HttpContext) => {
    service.recordSearchAnalytics(ctx.actor.tenantId);
    return { recorded: true };
  });

  router.get("/search/health", async (ctx: HttpContext) => {
    return service.getHealth(ctx.actor.tenantId);
  });

  router.post("/search/indexes", async (ctx: HttpContext) => {
    const body = ctx.body as {
      key?: string;
      name?: string;
      entityType?: string;
      sourceModule?: string;
      fields?: any[];
      rankingRules?: any[];
      filters?: any[];
    };

    if (!body.key || !body.name || !body.entityType || !body.sourceModule) {
      badRequest("key, name, entityType, and sourceModule are required");
    }

    return service.createIndex(ctx.actor.tenantId, ctx.actor, {
      key: body.key,
      name: body.name,
      entityType: body.entityType,
      sourceModule: body.sourceModule,
      fields: body.fields || [],
      rankingRules: body.rankingRules,
      filters: body.filters
    });
  });

  router.get("/search/indexes", async (ctx: HttpContext) => {
    return service.getIndexes(ctx.actor.tenantId);
  });

  router.post("/search/documents", async (ctx: HttpContext) => {
    const body = ctx.body as {
      indexId?: string;
      externalId?: string;
      entityType?: string;
      title?: string;
      content?: string;
      url?: string;
      sourceModule?: string;
      metadata?: Record<string, unknown>;
      tags?: string[];
      facets?: Record<string, unknown>;
    };

    if (!body.indexId || !body.externalId || !body.title || !body.content) {
      badRequest("indexId, externalId, title, and content are required");
    }

    return service.indexDocument(ctx.actor.tenantId, ctx.actor, body.indexId, {
      externalId: body.externalId,
      entityType: body.entityType || "unknown",
      title: body.title,
      content: body.content,
      url: body.url,
      sourceModule: body.sourceModule || "unknown",
      metadata: body.metadata,
      tags: body.tags,
      facets: body.facets as Record<string, string | number | boolean | string[]> | undefined
    });
  });

  router.get("/search/documents", async (ctx: HttpContext) => {
    const indexId = ctx.query.get("indexId") || undefined;
    const page = parseInt(ctx.query.get("page") || "1", 10);
    const pageSize = parseInt(ctx.query.get("pageSize") || "50", 10);
    return service.getDocuments(ctx.actor.tenantId, indexId, page, pageSize);
  });

  router.post("/search/synonyms", async (ctx: HttpContext) => {
    const body = ctx.body as {
      term?: string;
      synonyms?: string[];
      scope?: "global" | "module" | "entity";
      module?: string;
      entityType?: string;
    };

    if (!body.term || !body.synonyms || body.synonyms.length === 0) {
      badRequest("term and synonyms are required");
    }

    return service.createSynonym(ctx.actor.tenantId, ctx.actor, {
      term: body.term,
      synonyms: body.synonyms,
      scope: body.scope,
      module: body.module,
      entityType: body.entityType
    });
  });

  router.get("/search/synonyms", async (ctx: HttpContext) => {
    const scope = ctx.query.get("scope") || undefined;
    return service.getSynonyms(ctx.actor.tenantId, scope);
  });

  router.get("/search/queries", async (ctx: HttpContext) => {
    const state = (service as any).store.getState();
    const queries = state.queries.filter((q: any) => q.tenantId === ctx.actor.tenantId);
    return queries.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 100);
  });

  router.get("/routes", async (ctx: HttpContext) => {
    return router.listRoutes();
  });

  return router;
}
