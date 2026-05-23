import { AgentApproval, AgentDefinition, AgentStep, ApprovalStatus, RequestActor } from "../core/domain";
import { badRequest, notFound } from "../core/errors";
import { newId, nowIso } from "../core/id";
import { clone, optionalString } from "../core/utils";
import { DataStore } from "../core/datastore";

export class ApprovalEngine {
  constructor(private readonly store: DataStore) {}

  requiresApproval(agent: AgentDefinition, step: AgentStep): boolean {
    const action = step.command ?? step.tool ?? step.name;
    return agent.humanApproval.requiredFor.includes(action);
  }

  request(actor: RequestActor, agent: AgentDefinition, runId: string, step: AgentStep, reason = "Action requires human approval"): AgentApproval {
    const now = nowIso();
    const approval: AgentApproval = {
      id: newId("approval"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      runId,
      agentId: agent.id,
      stepId: step.id,
      action: step.command ?? step.tool ?? step.name,
      reason,
      status: "pending",
      requestedBy: `agent:${agent.id}`
    };
    this.store.getState().approvals.unshift(approval);
    step.status = "waiting_approval";
    step.approvalId = approval.id;
    this.store.save();
    return clone(approval);
  }

  decide(actor: RequestActor, id: string, status: ApprovalStatus, note?: string): AgentApproval {
    if (!["approved", "rejected", "cancelled"].includes(status)) badRequest("Approval decision must be approved, rejected, or cancelled");
    const approval = this.store.getState().approvals.find((item) => item.tenantId === actor.tenantId && item.id === id);
    if (!approval) notFound("Approval not found");
    approval.status = status;
    approval.updatedAt = nowIso();
    approval.decidedAt = approval.updatedAt;
    approval.decidedBy = actor.userId;
    approval.decisionNote = optionalString(note);
    this.store.save();
    return clone(approval);
  }

  pending(actor: RequestActor): AgentApproval[] {
    return clone(this.store.getState().approvals.filter((item) => item.tenantId === actor.tenantId && item.status === "pending"));
  }
}
