import { KpiDefinition, KpiSnapshot, MetricCalculationResult } from "../core/domain";
import { nowIso } from "../core/id";

export class KpiEngine {
  snapshot(kpi: KpiDefinition, metricResult: MetricCalculationResult): KpiSnapshot {
    const value = metricResult.value;
    const variance = kpi.comparison === "gte" ? value - kpi.target : kpi.target - value;
    const variancePercent = kpi.target === 0 ? 0 : Math.round((variance / kpi.target) * 10000) / 100;
    const status = this.status(kpi, value);

    return {
      kpiId: kpi.id,
      kpiName: kpi.name,
      metricId: kpi.metricId,
      value,
      target: kpi.target,
      comparison: kpi.comparison,
      variance: Math.round(variance * 100) / 100,
      variancePercent,
      status,
      calculatedAt: nowIso()
    };
  }

  private status(kpi: KpiDefinition, value: number): "on_track" | "at_risk" | "off_track" {
    const warningRatio = Math.max(0, Math.min(100, kpi.warningThresholdPercent)) / 100;
    if (kpi.comparison === "gte") {
      if (value >= kpi.target) return "on_track";
      if (value >= kpi.target * warningRatio) return "at_risk";
      return "off_track";
    }
    if (value <= kpi.target) return "on_track";
    if (value <= kpi.target / Math.max(warningRatio, 0.01)) return "at_risk";
    return "off_track";
  }
}
