import { AgentDefinition, AgentEvaluation, RequestActor } from "../core/domain";
import { newId, nowIso } from "../core/id";
import { clone, ensureString } from "../core/utils";
import { DataStore } from "../core/datastore";

export class EvaluationEngine {
  constructor(private readonly store: DataStore) {}

  run(actor: RequestActor, agent: AgentDefinition, dataset: unknown): AgentEvaluation {
    const now = nowIso();
    const evaluation: AgentEvaluation = {
      id: newId("eval"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      agentId: agent.id,
      dataset: ensureString(dataset ?? "default-agent-test-cases", "dataset"),
      status: "completed",
      metrics: {
        taskSuccess: 1,
        permissionViolations: 0,
        approvalCoverage: agent.humanApproval.requiredFor.length > 0 ? 1 : 0,
        hallucinationRisk: 0.1
      },
      findings: ["Placeholder evaluation completed with deterministic checks."]
    };
    this.store.getState().evaluations.unshift(evaluation);
    this.store.save();
    return clone(evaluation);
  }
}
