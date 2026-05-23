import { Funnel, FunnelMembership } from "../core/domain";
import { round } from "../core/utils";

export interface FunnelStageMetric {
  stageId: string;
  name: string;
  order: number;
  count: number;
  probability: number;
}

export interface FunnelMetric {
  funnelId: string;
  name: string;
  totalActive: number;
  converted: number;
  lost: number;
  conversionRate: number;
  stages: FunnelStageMetric[];
}

export class FunnelEngine {
  static metrics(funnel: Funnel, memberships: FunnelMembership[]): FunnelMetric {
    const scoped = memberships.filter((membership) => membership.funnelId === funnel.id);
    const converted = scoped.filter((membership) => membership.status === "converted").length;
    const lost = scoped.filter((membership) => membership.status === "lost").length;
    const active = scoped.filter((membership) => membership.status === "active").length;
    const totalClosedOrActive = scoped.length || 1;
    return {
      funnelId: funnel.id,
      name: funnel.name,
      totalActive: active,
      converted,
      lost,
      conversionRate: round((converted / totalClosedOrActive) * 100),
      stages: funnel.stages.map((stage) => ({ stageId: stage.id, name: stage.name, order: stage.order, probability: stage.probability, count: scoped.filter((membership) => membership.stageId === stage.id && membership.status === "active").length }))
    };
  }
}
