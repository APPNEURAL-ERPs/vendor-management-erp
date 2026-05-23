import { Pipeline, PipelineRun, PipelineStageResult, RequestActor } from "../core/domain";
import { newId, nowIso } from "../core/id";
import { badRequest } from "../core/errors";

export class PipelineEngine {
  createRun(actor: RequestActor, pipeline: Pipeline, commitSha?: string): PipelineRun {
    if (pipeline.status !== "active") badRequest("Pipeline must be active to run");
    const now = nowIso();
    const stageResults: PipelineStageResult[] = pipeline.stages.map((stage, index) => ({
      name: stage.name,
      type: stage.type,
      status: index === 0 ? (stage.type === "approval" ? "waiting_approval" : "running") : "pending",
      startedAt: index === 0 ? now : undefined,
      logs: index === 0 ? [`Stage ${stage.name} started`] : []
    }));
    const first = stageResults[0];
    return {
      id: newId("run"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      pipelineId: pipeline.id,
      status: first?.status === "waiting_approval" ? "waiting_approval" : "running",
      commitSha,
      triggeredBy: actor.userId,
      stageResults,
      startedAt: now,
      approval: first?.status === "waiting_approval" ? { requiredByStage: first.name } : undefined
    };
  }

  completeCurrentStage(run: PipelineRun, success: boolean, log?: string): PipelineRun {
    if (!["running", "waiting_approval"].includes(run.status)) badRequest("Only running pipeline runs can advance");
    const now = nowIso();
    const current = run.stageResults.find((stage) => stage.status === "running");
    if (!current) badRequest("No running stage found");
    current.status = success ? "passed" : "failed";
    current.completedAt = now;
    current.logs.push(log ?? (success ? "Stage completed successfully" : "Stage failed"));
    if (!success) { run.status = "failed"; run.completedAt = now; run.updatedAt = now; return run; }
    const next = run.stageResults.find((stage) => stage.status === "pending");
    if (!next) { run.status = "passed"; run.completedAt = now; run.updatedAt = now; return run; }
    next.startedAt = now;
    if (next.type === "approval") {
      next.status = "waiting_approval";
      next.logs.push("Waiting for release approval");
      run.status = "waiting_approval";
      run.approval = { requiredByStage: next.name };
    } else {
      next.status = "running";
      next.logs.push(`Stage ${next.name} started`);
      run.status = "running";
    }
    run.updatedAt = now;
    return run;
  }

  approve(run: PipelineRun, actor: RequestActor, approved: boolean, comment?: string): PipelineRun {
    if (run.status !== "waiting_approval") badRequest("Pipeline run is not waiting for approval");
    const now = nowIso();
    const current = run.stageResults.find((stage) => stage.status === "waiting_approval");
    if (!current) badRequest("No approval stage found");
    current.status = approved ? "passed" : "failed";
    current.completedAt = now;
    current.logs.push(approved ? `Approved by ${actor.userId}` : `Rejected by ${actor.userId}`);
    run.approval = { requiredByStage: current.name, approvedBy: actor.userId, approvedAt: now, decision: approved ? "approved" : "rejected", comment };
    if (!approved) { run.status = "failed"; run.completedAt = now; run.updatedAt = now; return run; }
    const next = run.stageResults.find((stage) => stage.status === "pending");
    if (!next) { run.status = "passed"; run.completedAt = now; run.updatedAt = now; return run; }
    next.status = "running";
    next.startedAt = now;
    next.logs.push(`Stage ${next.name} started`);
    run.status = "running";
    run.updatedAt = now;
    return run;
  }
}
