import { SearchState, SearchIndex, SearchableDocument, SearchSynonym } from "./domain";
import { nowIso, newId, estimateTokens } from "./core/id";
import { tokenize, extractKeywords } from "./core/utils";
import { emptyState } from "./core/datastore";

export function createSeedState(tenantId = "demo-tenant"): SearchState {
  const state = emptyState();
  const createdAt = nowIso();

  const indexes: SearchIndex[] = [
    {
      id: "idx_clients",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "clients",
      name: "Client Index",
      description: "Client profiles and records",
      entityType: "client",
      sourceModule: "ClientOS",
      status: "ready",
      fields: [
        { name: "name", type: "text", searchable: true, filterable: true, sortable: true, boosted: true, weight: 10 },
        { name: "email", type: "keyword", searchable: true, filterable: true, sortable: false, boosted: false, weight: 1 },
        { name: "phone", type: "keyword", searchable: true, filterable: true, sortable: false, boosted: false, weight: 1 },
        { name: "status", type: "keyword", searchable: false, filterable: true, sortable: true, boosted: false, weight: 1 },
        { name: "createdAt", type: "date", searchable: false, filterable: true, sortable: true, boosted: false, weight: 1 }
      ],
      rankingRules: [
        { field: "relevance", direction: "desc", weight: 10, type: "relevance" },
        { field: "createdAt", direction: "desc", weight: 1, type: "freshness" }
      ],
      filters: [
        { field: "status", label: "Status", type: "select", options: ["active", "inactive", "prospect"] }
      ],
      documentCount: 0,
      lastIndexedAt: createdAt,
      indexingFailures: 0
    },
    {
      id: "idx_invoices",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "invoices",
      name: "Invoice Index",
      description: "Invoice records and billing",
      entityType: "invoice",
      sourceModule: "FinanceOS",
      status: "ready",
      fields: [
        { name: "invoiceNumber", type: "keyword", searchable: true, filterable: true, sortable: true, boosted: true, weight: 10 },
        { name: "clientName", type: "text", searchable: true, filterable: true, sortable: false, boosted: true, weight: 5 },
        { name: "amount", type: "number", searchable: false, filterable: true, sortable: true, boosted: false, weight: 1 },
        { name: "status", type: "keyword", searchable: false, filterable: true, sortable: true, boosted: false, weight: 1 },
        { name: "dueDate", type: "date", searchable: false, filterable: true, sortable: true, boosted: false, weight: 1 }
      ],
      rankingRules: [
        { field: "relevance", direction: "desc", weight: 10, type: "relevance" },
        { field: "dueDate", direction: "asc", weight: 5, type: "freshness" }
      ],
      filters: [
        { field: "status", label: "Status", type: "select", options: ["paid", "pending", "overdue", "cancelled"] }
      ],
      documentCount: 0,
      lastIndexedAt: createdAt,
      indexingFailures: 0
    },
    {
      id: "idx_tickets",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "tickets",
      name: "Support Ticket Index",
      description: "Support tickets and issues",
      entityType: "ticket",
      sourceModule: "SupportOS",
      status: "ready",
      fields: [
        { name: "title", type: "text", searchable: true, filterable: true, sortable: true, boosted: true, weight: 10 },
        { name: "description", type: "text", searchable: true, filterable: false, sortable: false, boosted: true, weight: 3 },
        { name: "priority", type: "keyword", searchable: false, filterable: true, sortable: true, boosted: false, weight: 1 },
        { name: "status", type: "keyword", searchable: false, filterable: true, sortable: true, boosted: false, weight: 1 },
        { name: "createdAt", type: "date", searchable: false, filterable: true, sortable: true, boosted: false, weight: 1 }
      ],
      rankingRules: [
        { field: "relevance", direction: "desc", weight: 10, type: "relevance" },
        { field: "priority", direction: "asc", weight: 5, type: "custom" },
        { field: "createdAt", direction: "desc", weight: 2, type: "freshness" }
      ],
      filters: [
        { field: "priority", label: "Priority", type: "select", options: ["low", "medium", "high", "critical"] },
        { field: "status", label: "Status", type: "select", options: ["open", "in_progress", "resolved", "closed"] }
      ],
      documentCount: 0,
      lastIndexedAt: createdAt,
      indexingFailures: 0
    },
    {
      id: "idx_knowledge",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "knowledge",
      name: "Knowledge Base Index",
      description: "Articles, SOPs, and help docs",
      entityType: "article",
      sourceModule: "KnowledgeOS",
      status: "ready",
      fields: [
        { name: "title", type: "text", searchable: true, filterable: true, sortable: true, boosted: true, weight: 10 },
        { name: "content", type: "text", searchable: true, filterable: false, sortable: false, boosted: true, weight: 5 },
        { name: "category", type: "keyword", searchable: true, filterable: true, sortable: true, boosted: false, weight: 1 },
        { name: "tags", type: "array", searchable: true, filterable: true, sortable: false, boosted: false, weight: 2 }
      ],
      rankingRules: [
        { field: "relevance", direction: "desc", weight: 10, type: "relevance" }
      ],
      filters: [
        { field: "category", label: "Category", type: "select", options: ["faq", "sop", "runbook", "guide", "policy"] }
      ],
      documentCount: 0,
      lastIndexedAt: createdAt,
      indexingFailures: 0
    },
    {
      id: "idx_workflows",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "workflows",
      name: "Workflow Index",
      description: "Automation workflows",
      entityType: "workflow",
      sourceModule: "AutomationOS",
      status: "ready",
      fields: [
        { name: "name", type: "text", searchable: true, filterable: true, sortable: true, boosted: true, weight: 10 },
        { name: "description", type: "text", searchable: true, filterable: false, sortable: false, boosted: true, weight: 3 },
        { name: "trigger", type: "keyword", searchable: true, filterable: true, sortable: false, boosted: false, weight: 2 },
        { name: "status", type: "keyword", searchable: false, filterable: true, sortable: true, boosted: false, weight: 1 }
      ],
      rankingRules: [
        { field: "relevance", direction: "desc", weight: 10, type: "relevance" }
      ],
      filters: [
        { field: "status", label: "Status", type: "select", options: ["active", "inactive", "draft"] }
      ],
      documentCount: 0,
      lastIndexedAt: createdAt,
      indexingFailures: 0
    }
  ];

  state.indexes.push(...indexes);

  const documents: SearchableDocument[] = [
    {
      id: "doc_client_abc",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      indexId: "idx_clients",
      externalId: "client_abc_tech",
      entityType: "client",
      title: "ABC Technologies",
      content: "ABC Technologies is a leading software development company specializing in enterprise solutions, cloud infrastructure, and digital transformation services. They have been a valued client since 2019.",
      summary: "Software development company specializing in enterprise solutions",
      sourceModule: "ClientOS",
      metadata: { industry: "Technology", employees: 500, revenue: "$50M" },
      tags: ["enterprise", "software", "cloud", "transformation"],
      status: "indexed",
      indexedAt: createdAt,
      lastModifiedAt: createdAt,
      permissions: [],
      facets: { status: "active", industry: "Technology" }
    },
    {
      id: "doc_client_xyz",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      indexId: "idx_clients",
      externalId: "client_xyz_institute",
      entityType: "client",
      title: "XYZ Institute",
      content: "XYZ Institute is an educational technology company offering online learning platforms, course management systems, and student engagement tools for universities and schools.",
      summary: "EdTech company offering online learning platforms",
      sourceModule: "ClientOS",
      metadata: { industry: "Education", employees: 150, revenue: "$15M" },
      tags: ["education", "elearning", "platform", "students"],
      status: "indexed",
      indexedAt: createdAt,
      lastModifiedAt: createdAt,
      permissions: [],
      facets: { status: "active", industry: "Education" }
    },
    {
      id: "doc_invoice_1001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      indexId: "idx_invoices",
      externalId: "INV-1001",
      entityType: "invoice",
      title: "Invoice INV-1001 - ABC Technologies",
      content: "Monthly service subscription for cloud infrastructure and support services. Includes 24/7 monitoring, security updates, and technical support for the enterprise platform.",
      summary: "Monthly cloud infrastructure subscription",
      sourceModule: "FinanceOS",
      metadata: { invoiceNumber: "INV-1001", amount: 15000, currency: "USD" },
      tags: ["cloud", "subscription", "infrastructure", "support"],
      status: "indexed",
      indexedAt: createdAt,
      lastModifiedAt: createdAt,
      permissions: [],
      facets: { status: "pending", amount: 15000, currency: "USD" }
    },
    {
      id: "doc_invoice_1002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      indexId: "idx_invoices",
      externalId: "INV-1002",
      entityType: "invoice",
      title: "Invoice INV-1002 - XYZ Institute",
      content: "Annual license fee for the learning management system platform. Includes unlimited user seats, premium support, and access to all future updates and features.",
      summary: "Annual LMS platform license",
      sourceModule: "FinanceOS",
      metadata: { invoiceNumber: "INV-1002", amount: 25000, currency: "USD" },
      tags: ["lms", "license", "annual", "education"],
      status: "indexed",
      indexedAt: createdAt,
      lastModifiedAt: createdAt,
      permissions: [],
      facets: { status: "overdue", amount: 25000, currency: "USD" }
    },
    {
      id: "doc_ticket_5001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      indexId: "idx_tickets",
      externalId: "TKT-5001",
      entityType: "ticket",
      title: "Payment gateway integration failing",
      content: "The payment gateway integration is returning errors when processing credit card transactions. Error codes: PG-403, PG-500. Affects checkout flow for all customers.",
      summary: "Payment gateway integration errors",
      sourceModule: "SupportOS",
      metadata: { priority: "high", customerId: "client_abc_tech" },
      tags: ["payment", "integration", "error", "checkout"],
      status: "indexed",
      indexedAt: createdAt,
      lastModifiedAt: createdAt,
      permissions: [],
      facets: { priority: "high", status: "open" }
    },
    {
      id: "doc_ticket_5002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      indexId: "idx_tickets",
      externalId: "TKT-5002",
      entityType: "ticket",
      title: "Request for API documentation",
      content: "The customer is requesting comprehensive API documentation for the integration with their learning management system. Need to provide Swagger specs, authentication details, and sample code.",
      summary: "API documentation request",
      sourceModule: "SupportOS",
      metadata: { priority: "medium", customerId: "client_xyz_institute" },
      tags: ["api", "documentation", "integration", "lms"],
      status: "indexed",
      indexedAt: createdAt,
      lastModifiedAt: createdAt,
      permissions: [],
      facets: { priority: "medium", status: "in_progress" }
    },
    {
      id: "doc_kb_article_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      indexId: "idx_knowledge",
      externalId: "KB-001",
      entityType: "article",
      title: "How to integrate payment gateway",
      content: "This guide covers the complete process of integrating payment gateways with our platform. Includes setup steps, API configuration, webhook handling, and error handling best practices.",
      summary: "Payment gateway integration guide",
      sourceModule: "KnowledgeOS",
      metadata: { category: "guide", views: 1250, rating: 4.5 },
      tags: ["payment", "integration", "api", "webhook", "setup"],
      status: "indexed",
      indexedAt: createdAt,
      lastModifiedAt: createdAt,
      permissions: [],
      facets: { category: "guide" }
    },
    {
      id: "doc_kb_article_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      indexId: "idx_knowledge",
      externalId: "KB-002",
      entityType: "article",
      title: "API rate limiting and best practices",
      content: "Understand API rate limits, request quotas, and best practices for optimizing API usage. Learn about exponential backoff, request batching, and efficient data retrieval patterns.",
      summary: "API rate limiting guide",
      sourceModule: "KnowledgeOS",
      metadata: { category: "guide", views: 890, rating: 4.8 },
      tags: ["api", "rate-limiting", "optimization", "best-practices"],
      status: "indexed",
      indexedAt: createdAt,
      lastModifiedAt: createdAt,
      permissions: [],
      facets: { category: "guide" }
    },
    {
      id: "doc_kb_sop_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      indexId: "idx_knowledge",
      externalId: "SOP-001",
      entityType: "article",
      title: "Customer onboarding SOP",
      content: "Standard operating procedure for onboarding new customers. Includes account setup, team configuration, integration assistance, and training schedule. Expected timeline: 2-3 weeks.",
      summary: "Customer onboarding procedure",
      sourceModule: "KnowledgeOS",
      metadata: { category: "sop", department: "Customer Success" },
      tags: ["onboarding", "customer", "setup", "training"],
      status: "indexed",
      indexedAt: createdAt,
      lastModifiedAt: createdAt,
      permissions: [],
      facets: { category: "sop" }
    },
    {
      id: "doc_kb_faq_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      indexId: "idx_knowledge",
      externalId: "FAQ-001",
      entityType: "article",
      title: "Password reset FAQ",
      content: "Frequently asked questions about password reset and account recovery. Covers self-service reset, admin-initiated reset, MFA bypass procedures, and account lockout resolution.",
      summary: "Password reset frequently asked questions",
      sourceModule: "KnowledgeOS",
      metadata: { category: "faq", views: 2100 },
      tags: ["password", "security", "mfa", "account", "recovery"],
      status: "indexed",
      indexedAt: createdAt,
      lastModifiedAt: createdAt,
      permissions: [],
      facets: { category: "faq" }
    },
    {
      id: "doc_workflow_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      indexId: "idx_workflows",
      externalId: "WF-001",
      entityType: "workflow",
      title: "Invoice reminder workflow",
      content: "Automated workflow that sends reminder emails to customers when invoices are overdue. Triggers 3 days, 7 days, and 14 days after due date. Includes escalation to account manager.",
      summary: "Automated overdue invoice reminders",
      sourceModule: "AutomationOS",
      metadata: { trigger: "invoice.overdue", steps: 5, avgRuntime: "2min" },
      tags: ["invoice", "reminder", "automation", "email"],
      status: "indexed",
      indexedAt: createdAt,
      lastModifiedAt: createdAt,
      permissions: [],
      facets: { status: "active", trigger: "invoice.overdue" }
    },
    {
      id: "doc_workflow_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      indexId: "idx_workflows",
      externalId: "WF-002",
      entityType: "workflow",
      title: "New customer welcome sequence",
      content: "Automated email sequence for new customer onboarding. Includes welcome email, setup instructions, training webinar invites, and 30-day check-in. Total duration: 30 days.",
      summary: "New customer welcome email sequence",
      sourceModule: "AutomationOS",
      metadata: { trigger: "customer.created", steps: 8, avgRuntime: "30days" },
      tags: ["welcome", "onboarding", "email", "automation", "customer"],
      status: "indexed",
      indexedAt: createdAt,
      lastModifiedAt: createdAt,
      permissions: [],
      facets: { status: "active", trigger: "customer.created" }
    },
    {
      id: "doc_client_def",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      indexId: "idx_clients",
      externalId: "client_def_corp",
      entityType: "client",
      title: "DEF Corporation",
      content: "DEF Corporation is a financial services company providing investment banking, wealth management, and insurance solutions. They require SOC 2 compliance and high-security standards.",
      summary: "Financial services company with compliance requirements",
      sourceModule: "ClientOS",
      metadata: { industry: "Finance", employees: 2000, revenue: "$500M" },
      tags: ["finance", "banking", "compliance", "insurance"],
      status: "indexed",
      indexedAt: createdAt,
      lastModifiedAt: createdAt,
      permissions: [],
      facets: { status: "active", industry: "Finance" }
    },
    {
      id: "doc_kb_policy_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      indexId: "idx_knowledge",
      externalId: "POL-001",
      entityType: "article",
      title: "Data retention policy",
      content: "Corporate data retention policy covering customer data, financial records, logs, and communications. Defines retention periods, deletion procedures, and compliance requirements for GDPR and CCPA.",
      summary: "Data retention and compliance policy",
      sourceModule: "KnowledgeOS",
      metadata: { category: "policy", compliance: ["GDPR", "CCPA"], owner: "Legal" },
      tags: ["policy", "data", "retention", "compliance", "gdpr", "ccpa"],
      status: "indexed",
      indexedAt: createdAt,
      lastModifiedAt: createdAt,
      permissions: [],
      facets: { category: "policy" }
    },
    {
      id: "doc_ticket_5003",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      indexId: "idx_tickets",
      externalId: "TKT-5003",
      entityType: "ticket",
      title: "Report export not working",
      content: "Users are unable to export reports to PDF or Excel format. The export button is greyed out for some users and returns errors for others. Affects executive dashboard and analytics reports.",
      summary: "Report export functionality broken",
      sourceModule: "SupportOS",
      metadata: { priority: "medium", affectedUsers: 45 },
      tags: ["report", "export", "pdf", "excel", "dashboard"],
      status: "indexed",
      indexedAt: createdAt,
      lastModifiedAt: createdAt,
      permissions: [],
      facets: { priority: "medium", status: "open" }
    }
  ];

  state.documents.push(...documents);

  for (const index of indexes) {
    const indexDocs = documents.filter(d => d.indexId === index.id);
    const docIndex = state.indexes.find(i => i.id === index.id);
    if (docIndex) {
      docIndex.documentCount = indexDocs.length;
    }
  }

  const synonyms: SearchSynonym[] = [
    {
      id: "syn_cvv",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      term: "customer",
      synonyms: ["client", "account holder", "end user"],
      scope: "global",
      status: "active"
    },
    {
      id: "syn_invoice",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      term: "invoice",
      synonyms: ["bill", "statement", "receipt", "billing"],
      scope: "global",
      status: "active"
    },
    {
      id: "syn_ticket",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      term: "ticket",
      synonyms: ["issue", "request", "support case", "incident"],
      scope: "global",
      status: "active"
    },
    {
      id: "syn_payment",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      term: "payment",
      synonyms: ["transaction", "settlement", "remittance"],
      scope: "global",
      status: "active"
    },
    {
      id: "syn_api",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      term: "API",
      synonyms: ["application programming interface", "integration", "connector"],
      scope: "global",
      status: "active"
    },
    {
      id: "syn_cloud",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      term: "cloud",
      synonyms: ["cloud computing", "aws", "azure", "gcp", "hosted"],
      scope: "module",
      module: "FinanceOS",
      status: "active"
    },
    {
      id: "syn_lms",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      term: "LMS",
      synonyms: ["learning management system", "e-learning", "online learning platform", "course platform"],
      scope: "module",
      module: "KnowledgeOS",
      status: "active"
    }
  ];

  state.synonyms.push(...synonyms);

  const today = new Date().toISOString().split("T")[0];
  state.analytics.push({
    id: "analytics_demo",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    date: today,
    totalSearches: 48,
    successfulSearches: 42,
    noResultSearches: 3,
    failedSearches: 1,
    avgLatencyMs: 85,
    topQueries: [
      { query: "invoice", count: 12 },
      { query: "payment failed", count: 8 },
      { query: "API documentation", count: 6 },
      { query: "customer onboarding", count: 5 },
      { query: "cloud integration", count: 4 }
    ],
    topModules: [
      { module: "FinanceOS", count: 18 },
      { module: "SupportOS", count: 12 },
      { module: "KnowledgeOS", count: 10 },
      { module: "ClientOS", count: 5 },
      { module: "AutomationOS", count: 3 }
    ],
    topEntities: [
      { entity: "invoice", count: 15 },
      { entity: "ticket", count: 10 },
      { entity: "client", count: 8 },
      { entity: "workflow", count: 7 },
      { entity: "article", count: 8 }
    ],
    noResultQueries: ["refund policy", "GDPR compliance"],
    clickThroughRate: 0.68
  });

  state.events.push({
    id: "event_searchos_bootstrap",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "searchos.seeded",
    source: "SearchOS",
    actorId: "seed",
    data: { message: "SearchOS demo data seeded", indexes: indexes.length, documents: documents.length }
  });

  return state;
}
