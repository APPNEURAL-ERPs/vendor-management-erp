export function docs() {
  return {
    name: "KnowledgeOS",
    version: "1.0.0",
    description: "Organizational memory engine for docs, SOPs, wiki, search, RAG, FAQ, and knowledge reuse.",
    auth: {
      headers: {
        "x-role": "owner | admin | knowledge_admin | knowledge_manager | knowledge_contributor | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      space: "A knowledge space or category containing related articles, SOPs, playbooks, and FAQs.",
      article: "A knowledge article or document that can be published, archived, or need updates.",
      sop: "A standard operating procedure with ordered steps for repeatable processes.",
      playbook: "A playbook for repeatable business execution like sales, support, or incident response.",
      faq: "Frequently asked question with question, answer, and optional category.",
      decision: "An architecture or business decision record with context, options, and rationale.",
      node: "A knowledge graph node representing concepts, entities, or people.",
      search: "Full-text search across articles, SOPs, playbooks, FAQs, and decisions."
    },
    examples: {
      createSpace: {
        method: "POST",
        path: "/knowledge/spaces",
        headers: { "x-role": "knowledge_manager" },
        body: { key: "engineering", name: "Engineering Knowledge", visibility: "internal" }
      },
      createArticle: {
        method: "POST",
        path: "/knowledge/articles",
        headers: { "x-role": "knowledge_contributor" },
        body: { title: "API Design Guidelines", content: "Our REST API standards...", tags: ["api", "guidelines"] }
      },
      createSOP: {
        method: "POST",
        path: "/knowledge/sops",
        headers: { "x-role": "knowledge_manager" },
        body: {
          key: "client-onboarding",
          name: "Client Onboarding SOP",
          content: "Steps to onboard a new client...",
          department: "operations",
          steps: [
            { title: "Initial contact", description: "Send welcome email within 24 hours", required: true },
            { title: "Setup account", description: "Create client account in the platform", required: true }
          ]
        }
      },
      searchKnowledge: {
        method: "POST",
        path: "/knowledge/search",
        headers: { "x-role": "viewer" },
        body: { query: "client onboarding process", entityTypes: ["article", "sop"], limit: 5 }
      }
    }
  };
}
