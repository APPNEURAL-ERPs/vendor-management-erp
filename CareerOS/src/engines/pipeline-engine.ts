import { ApplicationStatus, PipelineStage, PipelineStageType } from "../core/domain";
import { newId, nowIso } from "../core/id";

export class PipelineEngine {
  defaultStages(tenantId: string, jobId: string): PipelineStage[] {
    const now = nowIso();
    const stage = (name: string, type: PipelineStageType, order: number, required = true, interviewRequired = false, slaDays?: number): PipelineStage => ({
      id: newId("stage"),
      tenantId,
      jobId,
      createdAt: now,
      updatedAt: now,
      name,
      type,
      order,
      required,
      interviewRequired,
      slaDays,
      metadata: {}
    });
    return [
      stage("Applied", "applied", 1, true, false, 2),
      stage("Recruiter Screen", "screening", 2, true, false, 3),
      stage("Assessment", "assessment", 3, false, false, 5),
      stage("Hiring Interview", "interview", 4, true, true, 7),
      stage("Offer", "offer", 5, true, false, 3),
      stage("Hired", "hired", 6, false, false),
      stage("Rejected", "rejected", 99, false, false)
    ];
  }

  statusForStage(stage?: PipelineStage): ApplicationStatus {
    if (!stage) return "applied";
    if (["applied", "screening", "assessment", "interview", "offer", "hired", "rejected"].includes(stage.type)) {
      return stage.type as ApplicationStatus;
    }
    return "screening";
  }
}
