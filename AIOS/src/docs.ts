export function docs() {
  return {
    name: "AIOS",
    version: "1.0.0",
    description: "Reusable AI operating layer for LLM mind, agents, RAG, prompts, tools, guardrails, automations, evaluations, conversations, and audit logs.",
    auth: {
      headers: {
        "x-role": "owner | admin | ai_admin | ai_engineer | agent_operator | knowledge_manager | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      model: "A configured LLM model for AIOS completions.",
      prompt: "A versioned template rendered with variables.",
      knowledgeBase: "A searchable RAG collection containing documents and chunks.",
      agent: "A reusable AI worker combining model + prompt + knowledge + tools + guardrails.",
      guardrail: "Rules used to scan input/output before and after AI generation.",
      automation: "Event-triggered AI action that can run an agent, query RAG, call a tool, or emit a summary event."
    },
    examples: {
      runAgent: {
        method: "POST",
        path: "/aios/agents/agent_business_assistant/run",
        headers: { "x-role": "agent_operator" },
        body: { input: "Explain AIOS architecture and cite source context" }
      },
      ragQuery: {
        method: "POST",
        path: "/aios/rag/query",
        headers: { "x-role": "agent_operator" },
        body: { query: "What does AIOS include?", knowledgeBaseIds: ["kb_appneural_os"] }
      },
      eventAutomation: {
        method: "POST",
        path: "/aios/events/ingest",
        headers: { "x-role": "agent_operator" },
        body: { type: "support.question", source: "ClientOS", data: { question: "How does RAG work?" } }
      }
    }
  };
}
