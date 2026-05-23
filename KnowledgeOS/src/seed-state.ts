import { KnowledgeState } from "./core/domain";
import { emptyState } from "./core/datastore";
import { nowIso, newId, estimateTokens } from "./core/id";
import { tokenize, chunkText } from "./core/utils";

export function createSeedState(tenantId = "demo-tenant"): KnowledgeState {
  const state = emptyState();
  const createdAt = nowIso();

  state.spaces.push(
    {
      id: "space_engineering",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "engineering",
      name: "Engineering Knowledge",
      description: "Technical documentation, architecture decisions, and development guides",
      status: "active",
      visibility: "internal",
      ownerId: "user_admin",
      tags: ["engineering", "technical", "development"],
      metadata: {}
    },
    {
      id: "space_operations",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "operations",
      name: "Operations Knowledge",
      description: "Standard operating procedures, runbooks, and operational guidelines",
      status: "active",
      visibility: "internal",
      ownerId: "user_admin",
      tags: ["operations", "sops", "processes"],
      metadata: {}
    },
    {
      id: "space_products",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "products",
      name: "Product Knowledge",
      description: "Product documentation, feature guides, and release notes",
      status: "active",
      visibility: "public",
      ownerId: "user_admin",
      tags: ["products", "features", "guides"],
      metadata: {}
    }
  );

  state.articles.push(
    {
      id: "article_api_guidelines",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      spaceId: "space_engineering",
      title: "API Design Guidelines",
      slug: "api-design-guidelines",
      content: "REST API Design Best Practices: Use nouns for resources, proper HTTP methods (GET, POST, PUT, DELETE), consistent naming with kebab-case, versioned endpoints, proper status codes, and JSON request/response formats. Include pagination for list endpoints, rate limiting headers, and proper error responses with codes and messages.",
      sourceType: "text",
      status: "published",
      authorId: "user_admin",
      tags: ["api", "guidelines", "rest"],
      categories: [],
      metadata: { author: "Engineering Team", version: "1.0" },
      version: 1,
      publishedAt: createdAt
    },
    {
      id: "article_database_schema",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      spaceId: "space_engineering",
      title: "Database Schema Standards",
      slug: "database-schema-standards",
      content: "Database Design Standards: Use snake_case for table and column names, include created_at and updated_at timestamps on all tables, use UUIDs for primary keys, add indexes for foreign keys and frequently queried columns, document all tables with comments, and use appropriate data types (VARCHAR for strings, INT for numbers, TIMESTAMP for dates).",
      sourceType: "text",
      status: "published",
      authorId: "user_admin",
      tags: ["database", "schema", "standards"],
      categories: [],
      metadata: { author: "Engineering Team" },
      version: 1,
      publishedAt: createdAt
    },
    {
      id: "article_product_overview",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      spaceId: "space_products",
      title: "APPNEURAL Platform Overview",
      slug: "platform-overview",
      content: "APPNEURAL is an operating system for AI agents and business workflows. The platform includes multiple specialized operating systems: AIOS for AI intelligence and agents, KnowledgeOS for organizational memory, SecurityOS for IAM and secrets, AnalyticsOS for metrics, and AutomationOS for workflows. These OS layers compose together to power intelligent business applications.",
      sourceType: "text",
      status: "published",
      authorId: "user_admin",
      tags: ["platform", "overview", "architecture"],
      categories: [],
      metadata: { version: "2.0" },
      version: 1,
      publishedAt: createdAt
    }
  );

  state.sops.push(
    {
      id: "sop_client_onboarding",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      spaceId: "space_operations",
      key: "client-onboarding",
      name: "Client Onboarding SOP",
      description: "Standard procedure for onboarding new clients to the platform",
      content: "This SOP outlines the complete client onboarding process from initial contact to successful platform adoption.",
      status: "active",
      ownerId: "user_admin",
      department: "operations",
      steps: [
        { order: 1, title: "Send welcome email", description: "Send welcome email within 24 hours of contract signing with onboarding guide and contact information", required: true },
        { order: 2, title: "Schedule kickoff call", description: "Schedule and conduct kickoff call within 48 hours to understand client requirements and timeline", required: true },
        { order: 3, title: "Create client account", description: "Create client account in the platform with appropriate permissions and settings", required: true },
        { order: 4, title: "Configure integrations", description: "Set up any required integrations with client systems (CRM, email, etc.)", required: false },
        { order: 5, title: "Conduct training session", description: "Schedule and conduct platform training session for client team", required: true },
        { order: 6, title: "Send follow-up survey", description: "Send onboarding satisfaction survey one week after training", required: false }
      ],
      tags: ["onboarding", "client", "operations"],
      version: 2,
      approvedAt: createdAt,
      approvedBy: "user_admin"
    },
    {
      id: "sop_incident_response",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      spaceId: "space_operations",
      key: "incident-response",
      name: "Incident Response SOP",
      description: "Procedure for responding to production incidents",
      content: "Standard incident response procedure for identifying, escalating, and resolving production issues.",
      status: "active",
      ownerId: "user_admin",
      department: "engineering",
      steps: [
        { order: 1, title: "Identify incident", description: "Monitor alerts, user reports, or system metrics indicate an incident", required: true },
        { order: 2, title: "Assess severity", description: "Determine severity level (Critical, High, Medium, Low) based on impact", required: true },
        { order: 3, title: "Create incident ticket", description: "Create incident ticket with description, severity, and initial assessment", required: true },
        { order: 4, title: "Notify stakeholders", description: "Notify relevant stakeholders based on severity level", required: true },
        { order: 5, title: "Investigate root cause", description: "Analyze logs, metrics, and code to identify root cause", required: true },
        { order: 6, title: "Implement fix", description: "Deploy fix or workaround to resolve the incident", required: true },
        { order: 7, title: "Post-mortem review", description: "Conduct post-mortem and document lessons learned", required: true }
      ],
      tags: ["incident", "response", "security", "operations"],
      version: 1,
      approvedAt: createdAt,
      approvedBy: "user_admin"
    }
  );

  state.playbooks.push(
    {
      id: "playbook_sales_discovery",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      spaceId: "space_operations",
      key: "sales-discovery",
      name: "Sales Discovery Playbook",
      description: "Framework for conducting effective sales discovery calls",
      content: "Sales discovery playbook with pre-call preparation, opening, discovery questions, solution presentation, and next steps sections.",
      playbookType: "sales",
      status: "active",
      ownerId: "user_admin",
      sections: [
        {
          order: 1,
          title: "Pre-call Preparation",
          content: "Research the prospect company, review their website, check LinkedIn for key contacts, and prepare relevant case studies.",
          checklist: ["Research company background", "Identify decision makers", "Prepare relevant questions", "Set clear call objectives"]
        },
        {
          order: 2,
          title: "Opening",
          content: "Introduce yourself and APPNEURAL briefly. Confirm the prospect's availability and set agenda for the call.",
          checklist: ["Introduce yourself", "Confirm agenda", "Set expectations"]
        },
        {
          order: 3,
          title: "Discovery Questions",
          content: "Ask open-ended questions to understand their current situation, challenges, goals, and timeline. Focus on understanding pain points.",
          checklist: ["Current situation", "Challenges and pain points", "Goals and objectives", "Timeline and budget", "Decision-making process"]
        },
        {
          order: 4,
          title: "Present Solution",
          content: "Connect their challenges to APPNEURAL solutions. Present relevant case studies and demonstrate value proposition.",
          checklist: ["Match solutions to challenges", "Share relevant case studies", "Highlight unique value"]
        },
        {
          order: 5,
          title: "Next Steps",
          content: "Summarize key takeaways, agree on next steps, and set follow-up meeting or demo.",
          checklist: ["Summarize conversation", "Agree on next steps", "Schedule follow-up"]
        }
      ],
      tags: ["sales", "discovery", "playbook"],
      version: 1
    }
  );

  state.faqs.push(
    {
      id: "faq_how_to_reset_password",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      spaceId: "space_products",
      question: "How do I reset my password?",
      answer: "To reset your password, click on the 'Forgot Password' link on the login page. Enter your email address and we'll send you a password reset link. Click the link in the email and enter your new password. The link expires after 24 hours.",
      category: "Account",
      tags: ["password", "account", "login"],
      status: "active",
      authorId: "user_admin",
      helpfulCount: 45,
      viewCount: 230,
      relatedArticleIds: []
    },
    {
      id: "faq_how_to_export_data",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      spaceId: "space_products",
      question: "How can I export my data?",
      answer: "You can export your data by going to Settings > Data Management > Export. Select the data types you want to export (articles, reports, etc.), choose the format (CSV, JSON, or Excel), and click Export. Large exports may take a few minutes and you'll receive an email when ready.",
      category: "Data",
      tags: ["export", "data", "download"],
      status: "active",
      authorId: "user_admin",
      helpfulCount: 32,
      viewCount: 156,
      relatedArticleIds: []
    },
    {
      id: "faq_api_rate_limits",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      spaceId: "space_engineering",
      question: "What are the API rate limits?",
      answer: "Our API has rate limits based on your plan: Free tier: 100 requests/minute, Pro tier: 1000 requests/minute, Enterprise: Custom limits. Rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset) are included in all responses.",
      category: "API",
      tags: ["api", "rate-limits", "limits"],
      status: "active",
      authorId: "user_admin",
      helpfulCount: 67,
      viewCount: 412,
      relatedArticleIds: ["article_api_guidelines"]
    }
  );

  state.decisions.push(
    {
      id: "decision_use_cloudflare",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      spaceId: "space_engineering",
      key: "adr-001-cloudflare-workers",
      title: "Use Cloudflare Workers for Edge APIs",
      decision: "Use Cloudflare Workers for lightweight edge APIs and serverless functions",
      context: "We need low-latency API endpoints that can serve requests from edge locations globally. Traditional cloud functions have higher latency for distant users.",
      optionsConsidered: ["AWS Lambda", "Vercel Functions", "Google Cloud Functions", "Cloudflare Workers"],
      reason: "Cloudflare Workers provide the lowest latency with global edge network, simpler deployment, and cost-effective pricing for our usage pattern. Workers run in 200+ cities worldwide.",
      tradeoffs: "Workers have limited runtime capabilities compared to full Node.js. Heavy computational tasks should still use traditional cloud functions.",
      risks: "Vendor lock-in with Cloudflare ecosystem. Mitigation: Keep API contracts standard and document dependencies.",
      ownerId: "user_admin",
      status: "accepted",
      impact: "Reduced API latency by 60% for global users",
      reviewDate: "2025-01-01T00:00:00Z",
      relatedDecisionIds: []
    },
    {
      id: "decision_knowledge_graph",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      spaceId: "space_engineering",
      key: "adr-002-knowledge-graph",
      title: "Implement Knowledge Graph for Internal Knowledge",
      decision: "Build a knowledge graph to connect concepts, services, and teams across APPNEURAL",
      context: "Teams are creating siloed documentation and it's difficult to find related knowledge across different OS layers.",
      optionsConsidered: ["Flat categorization", "Hierarchical folders", "Tag-based system", "Knowledge graph with relationships"],
      reason: "A knowledge graph allows flexible relationships between entities, enables advanced queries, and supports discovery of related knowledge that folders or tags miss.",
      tradeoffs: "Requires more upfront modeling work and graph database expertise. Simple searches may be slower than full-text indexes.",
      risks: "Graph complexity may overwhelm users. Mitigation: Provide simple search alongside graph navigation.",
      ownerId: "user_admin",
      status: "accepted",
      impact: "Improved knowledge discovery and cross-team collaboration",
      relatedDecisionIds: []
    }
  );

  state.nodes.push(
    {
      id: "node_appneural",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "appneural",
      name: "APPNEURAL",
      nodeType: "entity",
      description: "APPNEURAL - AI Operating System for Business",
      metadata: { website: "https://appneural.com" },
      tags: ["company", "platform"]
    },
    {
      id: "node_aios",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "aios",
      name: "AIOS",
      nodeType: "product",
      description: "Artificial Intelligence Operating System layer for agents, prompts, RAG, and AI workflows",
      metadata: { status: "active", version: "1.0" },
      tags: ["ai", "agents", "rag"]
    },
    {
      id: "node_knowledgeos",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "knowledgeos",
      name: "KnowledgeOS",
      nodeType: "product",
      description: "Knowledge base, documentation, SOP, wiki, and organizational memory engine",
      metadata: { status: "active", version: "1.0" },
      tags: ["knowledge", "docs", "sops"]
    },
    {
      id: "node_cloudflare",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "cloudflare-workers",
      name: "Cloudflare Workers",
      nodeType: "technology",
      description: "Edge computing platform for serverless functions at global edge locations",
      metadata: { provider: "Cloudflare" },
      tags: ["infrastructure", "edge", "serverless"]
    }
  );

  state.graphEdges.push(
    {
      id: "edge_aios_uses_knowledgeos",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      sourceNodeId: "node_aios",
      targetNodeId: "node_knowledgeos",
      relationship: "uses",
      weight: 0.9,
      metadata: {}
    },
    {
      id: "edge_appneural_contains_aios",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      sourceNodeId: "node_appneural",
      targetNodeId: "node_aios",
      relationship: "contains",
      weight: 1.0,
      metadata: {}
    },
    {
      id: "edge_appneural_contains_knowledgeos",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      sourceNodeId: "node_appneural",
      targetNodeId: "node_knowledgeos",
      relationship: "contains",
      weight: 1.0,
      metadata: {}
    },
    {
      id: "edge_aios_uses_cloudflare",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      sourceNodeId: "node_aios",
      targetNodeId: "node_cloudflare",
      relationship: "deploys_on",
      weight: 0.8,
      metadata: {}
    }
  );

  const entitiesToIndex = [
    { entityType: "article", entityId: "article_api_guidelines", title: "API Design Guidelines", content: state.articles[0].content, spaceId: "space_engineering" },
    { entityType: "article", entityId: "article_database_schema", title: "Database Schema Standards", content: state.articles[1].content, spaceId: "space_engineering" },
    { entityType: "article", entityId: "article_product_overview", title: "APPNEURAL Platform Overview", content: state.articles[2].content, spaceId: "space_products" },
    { entityType: "sop", entityId: "sop_client_onboarding", title: "Client Onboarding SOP", content: state.sops[0].content, spaceId: "space_operations" },
    { entityType: "sop", entityId: "sop_incident_response", title: "Incident Response SOP", content: state.sops[1].content, spaceId: "space_operations" },
    { entityType: "playbook", entityId: "playbook_sales_discovery", title: "Sales Discovery Playbook", content: "Sales discovery framework with pre-call, opening, questions, solution, and next steps sections.", spaceId: "space_operations" },
    { entityType: "faq", entityId: "faq_how_to_reset_password", title: "How do I reset my password?", content: "To reset your password, click on the Forgot Password link on the login page.", spaceId: "space_products" },
    { entityType: "faq", entityId: "faq_how_to_export_data", title: "How can I export my data?", content: "You can export your data by going to Settings > Data Management > Export.", spaceId: "space_products" },
    { entityType: "faq", entityId: "faq_api_rate_limits", title: "What are the API rate limits?", content: "Our API has rate limits based on your plan: Free tier 100 requests/minute, Pro tier 1000 requests/minute.", spaceId: "space_engineering" },
    { entityType: "decision", entityId: "decision_use_cloudflare", title: "Use Cloudflare Workers for Edge APIs", content: "Use Cloudflare Workers for lightweight edge APIs and serverless functions at global edge locations.", spaceId: "space_engineering" },
    { entityType: "decision", entityId: "decision_knowledge_graph", title: "Implement Knowledge Graph for Internal Knowledge", content: "Build a knowledge graph to connect concepts, services, and teams across APPNEURAL.", spaceId: "space_engineering" }
  ];

  for (const entity of entitiesToIndex) {
    state.searchIndex.push({
      id: newId("idx"),
      tenantId,
      createdAt,
      updatedAt: createdAt,
      entityType: entity.entityType as any,
      entityId: entity.entityId,
      spaceId: entity.spaceId,
      title: entity.title,
      content: entity.content,
      keywords: tokenize(`${entity.title} ${entity.content}`).slice(0, 50),
      metadata: {}
    });

    const chunks = chunkText(entity.content, 700, 100);
    chunks.forEach((text, chunkIndex) => {
      state.chunks.push({
        id: newId("chunk"),
        tenantId,
        createdAt,
        updatedAt: createdAt,
        entityType: entity.entityType as any,
        entityId: entity.entityId,
        chunkIndex,
        text,
        tokenEstimate: estimateTokens(text),
        keywords: tokenize(text).slice(0, 30),
        metadata: {}
      });
    });
  }

  state.reviews.push({
    id: "review_demo_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    entityType: "article",
    entityId: "article_database_schema",
    reviewerId: "user_reviewer",
    status: "pending",
    dueAt: "2025-02-01T00:00:00Z"
  });

  state.feedback.push(
    {
      id: "feedback_demo_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      entityType: "faq",
      entityId: "faq_how_to_reset_password",
      userId: "user_demo",
      helpful: true
    },
    {
      id: "feedback_demo_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      entityType: "article",
      entityId: "article_api_guidelines",
      userId: "user_demo",
      helpful: true,
      comment: "Very helpful guidelines, clear and comprehensive."
    }
  );

  return state;
}
