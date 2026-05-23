export function docs() {
  return {
    name: "AgenticOS",
    version: "1.0.0",
    description: "AI agent operating system for building, managing, securing, monitoring, and scaling safe tool-connected agents.",
    auth: {
      headers: {
        "x-role": "owner | admin | agentic_admin | agent_operator | agent_developer | approval_manager | auditor | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      agent: "An AI agent with capabilities, tools, guardrails, memory, and workflow support.",
      template: "Reusable agent templates for common use cases like support, sales, research.",
      workflow: "Multi-step agent workflows with conditions, approvals, and error handling.",
      tool: "Tools in the registry that agents can call with approval gates.",
      guardrail: "Safety rules for input, output, and tool call validation.",
      memory: "Short-term, long-term, and preference memory for agents.",
      approval: "Human-in-the-loop approval gates for risky operations.",
      evaluation: "Test suites and runs to measure agent quality."
    },
    examples: {
      createAgent: {
        method: "POST",
        path: "/agentic/agents",
        headers: { "x-role": "agent_developer" },
        body: {
          key: "my_agent",
          name: "My AI Agent",
          agentType: "assistant",
          promptTemplate: "You are a helpful assistant.",
          capabilities: ["search", "summarize"],
          toolIds: ["tool_calculator"],
          guardrailIds: ["guard_safe_content"],
          memoryEnabled: true
        }
      },
      runAgent: {
        method: "POST",
        path: "/agentic/agents/agent_support/run",
        headers: { "x-role": "agent_operator" },
        body: { input: { query: "Help me with my order" } }
      },
      pauseRun: {
        method: "POST",
        path: "/agentic/runs/:id/pause",
        headers: { "x-role": "agent_operator" }
      },
      approveAction: {
        method: "POST",
        path: "/agentic/approvals/:id/respond",
        headers: { "x-role": "approval_manager" },
        body: { decision: "approve", comments: "Approved by manager" }
      },
      createEvaluation: {
        method: "POST",
        path: "/agentic/evaluations",
        headers: { "x-role": "agent_developer" },
        body: {
          key: "my_agent_eval",
          name: "My Agent Evaluation",
          agentId: "agent_support",
          cases: [
            { name: "Test greeting", input: { query: "Hello" }, expectedContains: ["hello", "help"] }
          ]
        }
      }
    }
  };
}
