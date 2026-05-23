export function docs() {
  return {
    name: "SearchOS",
    version: "1.0.0",
    description: "Global, semantic, vector, and filtered search across OS data, files, knowledge, and records",
    auth: {
      headers: {
        "x-role": "owner | admin | search_admin | search_analyst | search_user | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      searchIndex: "A configured index for searching specific entity types from an OS module",
      searchableDocument: "A document indexed for search, with title, content, metadata, and facets",
      searchQuery: "A search request with query text, filters, and pagination",
      searchResult: "A matching document with relevance score, highlights, and actions",
      savedSearch: "A saved query for reuse and alerts",
      searchSynonym: "Synonyms for better query matching across terms",
      searchAlert: "Automated alert when saved search finds new results",
      vectorIndex: "Index for semantic/vector similarity search",
      searchAnalytics: "Usage metrics and search performance data"
    },
    searchModes: {
      fulltext: "Traditional keyword search with scoring",
      semantic: "Meaning-based search using similarity",
      vector: "AI-powered embedding similarity search",
      hybrid: "Combined fulltext and semantic search",
      filtered: "Search with applied filters and facets"
    },
    endpoints: {
      overview: {
        method: "GET",
        path: "/search/overview",
        description: "Get search overview with metrics, indexes, and top queries"
      },
      search: {
        method: "POST",
        path: "/search",
        description: "Execute a search query",
        body: {
          query: "string (required) - search query text",
          mode: "fulltext | semantic | vector | hybrid | filtered (default: fulltext)",
          filters: "array of SearchFilter objects",
          page: "number (default: 1)",
          pageSize: "number (default: 20, max: 100)",
          sortBy: "string (optional) - field to sort by",
          sortOrder: "asc | desc (default: desc)"
        }
      },
      suggestions: {
        method: "GET",
        path: "/search/suggestions",
        description: "Get autocomplete suggestions for query prefix",
        query: { prefix: "string", limit: "number (default: 10)" }
      },
      savedSearches: {
        method: "GET",
        path: "/search/saved",
        description: "List saved searches for current user/tenant"
      },
      createSavedSearch: {
        method: "POST",
        path: "/search/saved",
        description: "Create a new saved search",
        body: {
          key: "string (required) - unique key",
          name: "string (required) - display name",
          queryText: "string (required) - query to save",
          mode: "search mode",
          filters: "array of filters",
          scope: "personal | team | tenant | global",
          tags: "array of tags"
        }
      },
      createAlert: {
        method: "POST",
        path: "/search/alerts",
        description: "Create an alert for saved search",
        body: {
          name: "string (required)",
          queryText: "string (required)",
          filters: "array of filters",
          conditions: "array of alert conditions",
          actions: "array of alert actions",
          frequency: "immediate | hourly | daily | weekly"
        }
      },
      indexes: {
        method: "GET",
        path: "/search/indexes",
        description: "List all search indexes"
      },
      createIndex: {
        method: "POST",
        path: "/search/indexes",
        description: "Create a new search index",
        body: {
          key: "string (required)",
          name: "string (required)",
          entityType: "string (required)",
          sourceModule: "string (required)",
          fields: "array of SearchField objects",
          rankingRules: "array of RankingRule objects",
          filters: "array of FilterDefinition objects"
        }
      },
      documents: {
        method: "GET",
        path: "/search/documents",
        description: "List indexed documents",
        query: { indexId: "string (optional)", page: "number", pageSize: "number" }
      },
      indexDocument: {
        method: "POST",
        path: "/search/documents",
        description: "Add a document to search index",
        body: {
          indexId: "string (required)",
          externalId: "string (required)",
          entityType: "string (required)",
          title: "string (required)",
          content: "string (required)",
          url: "string (optional)",
          sourceModule: "string (required)",
          metadata: "object",
          tags: "array of strings",
          facets: "object"
        }
      },
      synonyms: {
        method: "GET",
        path: "/search/synonyms",
        description: "List search synonyms",
        query: { scope: "global | module | entity (optional)" }
      },
      createSynonym: {
        method: "POST",
        path: "/search/synonyms",
        description: "Create a new synonym mapping",
        body: {
          term: "string (required)",
          synonyms: "array of strings (required)",
          scope: "global | module | entity",
          module: "string (if scope is module)",
          entityType: "string (if scope is entity)"
        }
      },
      analytics: {
        method: "GET",
        path: "/search/analytics",
        description: "Get search analytics for tenant",
        query: { days: "number (default: 30)" }
      },
      health: {
        method: "GET",
        path: "/search/health",
        description: "Get search health score and metrics"
      },
      recordClick: {
        method: "POST",
        path: "/search/clicks",
        description: "Record a search result click",
        body: {
          queryId: "string (required)",
          resultId: "string (required)",
          position: "number (required)",
          sessionId: "string (optional)"
        }
      }
    },
    examples: {
      basicSearch: {
        method: "POST",
        path: "/search",
        headers: { "x-role": "search_user" },
        body: { query: "invoice overdue", mode: "fulltext", pageSize: 10 }
      },
      semanticSearch: {
        method: "POST",
        path: "/search",
        headers: { "x-role": "search_user" },
        body: { query: "customers who may leave soon", mode: "semantic" }
      },
      filteredSearch: {
        method: "POST",
        path: "/search",
        headers: { "x-role": "search_user" },
        body: {
          query: "invoice",
          mode: "filtered",
          filters: [
            { field: "status", operator: "eq", value: "overdue" },
            { field: "sourceModule", operator: "eq", value: "FinanceOS" }
          ]
        }
      },
      saveSearch: {
        method: "POST",
        path: "/search/saved",
        headers: { "x-role": "search_user" },
        body: {
          key: "overdue-invoices",
          name: "Overdue Invoices",
          queryText: "invoice",
          mode: "filtered",
          filters: [{ field: "status", operator: "eq", value: "overdue" }],
          scope: "personal"
        }
      },
      createAlert: {
        method: "POST",
        path: "/search/alerts",
        headers: { "x-role": "search_user" },
        body: {
          name: "High-value overdue invoices",
          queryText: "invoice",
          filters: [{ field: "amount", operator: "gt", value: 50000 }],
          frequency: "daily"
        }
      },
      indexDocument: {
        method: "POST",
        path: "/search/documents",
        headers: { "x-role": "search_admin" },
        body: {
          indexId: "idx_knowledge",
          externalId: "KB-NEW-001",
          entityType: "article",
          title: "New Integration Guide",
          content: "Step-by-step guide for integrating with third-party services...",
          sourceModule: "KnowledgeOS",
          tags: ["integration", "guide", "api"],
          facets: { category: "guide" }
        }
      }
    },
    filterOperators: {
      eq: "Equals",
      ne: "Not equals",
      gt: "Greater than",
      gte: "Greater than or equal",
      lt: "Less than",
      lte: "Less than or equal",
      contains: "Contains text",
      in: "In array",
      exists: "Field exists",
      range: "In range"
    },
    permissions: {
      viewer: ["search.read"],
      search_user: ["search.read", "search.query", "search.saved.read", "search.suggestions.read"],
      search_analyst: ["search.read", "search.query", "search.analytics.read", "search.saved.read", "search.suggestions.read"],
      search_admin: ["search.read", "search.write", "search.query", "search.index.manage", "search.analytics.read", "search.saved.write", "search.synonyms.manage"],
      admin: ["*"],
      owner: ["*"]
    }
  };
}
