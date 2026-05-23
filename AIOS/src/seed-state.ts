import { AiosState, KnowledgeDocument } from "./core/domain";
import { emptyState } from "./core/datastore";
import { estimateTokens, nowIso } from "./core/id";
import { chunkText, tokenize } from "./engines/search-engine";

export function createSeedState(tenantId = "demo-tenant"): AiosState {
  const state = emptyState();
  const createdAt = nowIso();

  state.providers.push({
    id: "provider_mock",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "mock_provider",
    name: "AIOS Mock Provider",
    type: "mock",
    status: "active",
    config: { developmentOnly: true, deterministic: true }
  });

  state.models.push(
    {
      id: "model_mock_mind",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "model_mock_mind",
      providerId: "provider_mock",
      name: "Mock Mind 1.0",
      family: "mock-chat",
      contextWindow: 128000,
      maxOutputTokens: 4096,
      temperatureDefault: 0.2,
      status: "active",
      capabilities: ["chat", "json", "tool_calling"]
    },
    {
      id: "model_mock_embed",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "model_mock_embed",
      providerId: "provider_mock",
      name: "Mock Embed 1.0",
      family: "mock-embedding",
      contextWindow: 8192,
      maxOutputTokens: 0,
      temperatureDefault: 0,
      status: "active",
      capabilities: ["embedding"]
    }
  );

  state.prompts.push(
    {
      id: "prompt_rag_answer",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "rag_answer",
      name: "RAG Answer Prompt",
      description: "Answers a user query using retrieved knowledge context and citations.",
      status: "active",
      tags: ["rag", "citation", "answer"],
      activeVersion: 1,
      versions: [
        {
          version: 1,
          template: "You are AIOS RAG Answer Engine. Use only this context to answer.\n\nContext:\n{{context}}\n\nQuestion: {{query}}\n\nGive a practical answer and include citations.",
          variables: ["context", "query"],
          createdAt,
          createdBy: "seed"
        }
      ]
    },
    {
      id: "prompt_agent_assistant",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "agent_assistant",
      name: "Business AI Agent Prompt",
      description: "General AIOS business assistant prompt with context and tools.",
      status: "active",
      tags: ["agent", "business", "assistant"],
      activeVersion: 1,
      versions: [
        {
          version: 1,
          template: "You are {{agent.name}}, an AIOS agent for Appneural.\n\nRules:\n- Be concise and operational.\n- Use retrieved context when provided.\n- Mention tool results if any.\n\nRetrieved Context:\n{{context}}\n\nTool Outputs:\n{{toolOutputs}}\n\nUser Request: {{input}}",
          variables: ["agent.name", "context", "toolOutputs", "input"],
          createdAt,
          createdBy: "seed"
        }
      ]
    },
    {
      id: "prompt_event_triage",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "event_triage",
      name: "AI Event Triage Prompt",
      description: "Summarizes incoming OS events and recommends next action.",
      status: "active",
      tags: ["automation", "event", "triage"],
      activeVersion: 1,
      versions: [
        {
          version: 1,
          template: "Triage this event for the operations team. Type: {{type}}, Source: {{source}}, Data: {{data}}. Return priority, summary, and next action.",
          variables: ["type", "source", "data"],
          createdAt,
          createdBy: "seed"
        }
      ]
    }
  );

  state.knowledgeBases.push({
    id: "kb_appneural_os",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "appneural_os",
    name: "Appneural OS Knowledge Base",
    description: "Core knowledge about Appneural OS architecture, AIOS, RAG, agents, automation, and platform composition.",
    status: "active",
    tags: ["appneural", "architecture", "os"],
    embeddingModelId: "model_mock_embed",
    chunkSize: 650,
    chunkOverlap: 90
  });

  const documents: KnowledgeDocument[] = [
    {
      id: "doc_aios_architecture",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      knowledgeBaseId: "kb_appneural_os",
      title: "AIOS Architecture Guide",
      sourceType: "text",
      status: "indexed",
      content: "AIOS is the Artificial Intelligence Operating System layer for Appneural platforms. AIOS manages LLM mind, AI agents, prompt templates, RAG knowledge retrieval, tools, guardrails, conversations, evaluations, and event-driven AI automations. AIOS can power AppneuroX, PromptlyUp, Intellistra, and other platforms. A typical AIOS request passes through guardrail input scan, prompt rendering, RAG retrieval, optional tool execution, mock or real LLM completion, output guardrail scan, conversation memory, usage analytics, event logging, and audit logging. AIOS should connect with AnalyticsOS for usage metrics, AutomationOS for workflow triggers, SecurityOS for RBAC, WebsiteOS for public AI pages, and ClientOS for customer support AI.",
      metadata: { owner: "AIOS", version: "1.0" }
    },
    {
      id: "doc_rag_playbook",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      knowledgeBaseId: "kb_appneural_os",
      title: "RAG Playbook",
      sourceType: "text",
      status: "indexed",
      content: "RAG means Retrieval Augmented Generation. In AIOS, RAG stores documents inside knowledge bases, splits them into chunks, indexes keywords or embeddings, retrieves relevant chunks for a user question, and passes the retrieved context into an LLM prompt. RAG reduces hallucination because the model answers from company documents, PDFs, APIs, policies, product docs, CRM records, or ERP data. A good RAG answer should include citations, show which source was used, and avoid answering when there is no relevant context.",
      metadata: { owner: "AIOS", topic: "RAG" }
    },
    {
      id: "doc_agent_tooling",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      knowledgeBaseId: "kb_appneural_os",
      title: "Agent and Tooling Guide",
      sourceType: "text",
      status: "indexed",
      content: "An AIOS agent combines a model, a prompt, one or more knowledge bases, optional tools, guardrails, and memory. Tools let agents calculate numbers, create tasks, emit OS events, call APIs, or connect to other OS layers. Guardrails scan requests and responses. Conversation memory stores user and assistant messages. Agent runs should record retrieved chunks, tool runs, output, status, token usage, and audit logs so product teams can debug and improve AI behavior.",
      metadata: { owner: "AIOS", topic: "agents" }
    }
  ];

  state.documents.push(...documents);
  for (const document of documents) {
    const chunks = chunkText(document.content, 650, 90);
    chunks.forEach((text, index) => {
      state.chunks.push({
        id: `chunk_${document.id}_${index + 1}`,
        tenantId,
        createdAt,
        updatedAt: createdAt,
        knowledgeBaseId: document.knowledgeBaseId,
        documentId: document.id,
        chunkIndex: index,
        text,
        tokenEstimate: estimateTokens(text),
        keywords: tokenize(text).slice(0, 50),
        metadata: { title: document.title }
      });
    });
  }

  state.tools.push(
    {
      id: "tool_calculator",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "calculator",
      name: "Calculator",
      description: "Performs simple arithmetic calculations.",
      type: "builtin",
      status: "active",
      inputSchema: { expression: "string" },
      config: {}
    },
    {
      id: "tool_summarizer",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "summarizer",
      name: "Summarizer",
      description: "Summarizes long text for agent workflows.",
      type: "builtin",
      status: "active",
      inputSchema: { text: "string", maxLength: "number" },
      config: {}
    },
    {
      id: "tool_task_creator",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "task_creator",
      name: "Task Creator",
      description: "Creates a simulated task for cross-OS automation.",
      type: "builtin",
      status: "active",
      inputSchema: { title: "string", assigneeId: "string" },
      config: { targetOS: "AutomationOS" }
    },
    {
      id: "tool_os_event_emitter",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "os_event_emitter",
      name: "OS Event Emitter",
      description: "Emits simulated events to connected OS layers.",
      type: "builtin",
      status: "active",
      inputSchema: { eventType: "string", data: "object" },
      config: { bus: "internal" }
    }
  );

  state.guardrails.push(
    {
      id: "guardrail_safe_ai",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "safe_ai",
      name: "Safe AI Guardrail",
      description: "Blocks unsafe or secret-leaking input in the AIOS demo.",
      status: "active",
      bannedTerms: ["leak secret", "exfiltrate", "malware"],
      requiredTerms: [],
      requireCitations: false,
      maxInputLength: 4000,
      maxOutputLength: 6000
    },
    {
      id: "guardrail_rag_citations",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "rag_citations",
      name: "RAG Citation Guardrail",
      description: "Requires generated RAG-style outputs to contain citations.",
      status: "active",
      bannedTerms: [],
      requiredTerms: [],
      requireCitations: true,
      maxOutputLength: 6000
    }
  );

  state.agents.push(
    {
      id: "agent_business_assistant",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "business_assistant",
      name: "Business AI Assistant",
      description: "General Appneural assistant for OS architecture, RAG, agents, and automation questions.",
      status: "active",
      modelId: "model_mock_mind",
      promptId: "prompt_agent_assistant",
      knowledgeBaseIds: ["kb_appneural_os"],
      toolIds: ["tool_calculator", "tool_summarizer", "tool_task_creator", "tool_os_event_emitter"],
      guardrailIds: ["guardrail_safe_ai", "guardrail_rag_citations"],
      memoryEnabled: true,
      variables: { company: "Appneural", tone: "clear, practical" }
    },
    {
      id: "agent_rag_researcher",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "rag_researcher",
      name: "RAG Researcher",
      description: "Focused AIOS agent for retrieval-heavy knowledge answers.",
      status: "active",
      modelId: "model_mock_mind",
      promptId: "prompt_rag_answer",
      knowledgeBaseIds: ["kb_appneural_os"],
      toolIds: ["tool_summarizer"],
      guardrailIds: ["guardrail_safe_ai", "guardrail_rag_citations"],
      memoryEnabled: false,
      variables: { style: "source-grounded" }
    }
  );

  state.conversations.push({
    id: "conv_demo_aios",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    agentId: "agent_business_assistant",
    userId: "user_demo",
    title: "Demo AIOS conversation",
    status: "open",
    summary: "Seed conversation for AIOS demo."
  });

  state.messages.push({
    id: "msg_demo_welcome",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    conversationId: "conv_demo_aios",
    role: "assistant",
    content: "Welcome to AIOS. Ask about agents, RAG, prompts, tools, guardrails, or automations.",
    metadata: {}
  });

  state.automations.push(
    {
      id: "auto_support_question",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "support_question_ai_answer",
      name: "Support Question AI Answer",
      description: "When ClientOS sends a support.question event, AIOS runs the business assistant.",
      status: "active",
      triggerEvent: "support.question",
      filters: [{ field: "data.question", operator: "exists" }],
      action: "run_agent",
      config: {
        agentId: "agent_business_assistant",
        inputTemplate: "ClientOS support question: {{data.question}}"
      }
    },
    {
      id: "auto_document_uploaded_summary",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "document_uploaded_summary",
      name: "Document Uploaded Summary Event",
      description: "Creates a summary event whenever a document.uploaded event arrives.",
      status: "active",
      triggerEvent: "document.uploaded",
      filters: [],
      action: "create_summary_event",
      config: {}
    }
  );

  state.evaluationSuites.push({
    id: "evalsuite_aios_basics",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "aios_basics",
    name: "AIOS Basics Evaluation",
    status: "active",
    agentId: "agent_business_assistant",
    cases: [
      {
        id: "evalcase_rag",
        name: "Explains RAG",
        input: "What is RAG in AIOS?",
        expectedContains: ["RAG", "Citations"],
        metadata: {}
      },
      {
        id: "evalcase_agents",
        name: "Explains agents",
        input: "What does an AIOS agent include?",
        expectedContains: ["agent", "Citations"],
        metadata: {}
      }
    ]
  });

  state.events.push({
    id: "event_demo_bootstrap",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "aios.seeded",
    source: "AIOS",
    data: { message: "AIOS demo data seeded" }
  });

  return state;
}
