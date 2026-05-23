import { Feature, Priority } from "../core/domain";
import { roundMoney } from "../core/utils";
const priorityWeight: Record<Priority, number> = { low: 1, medium: 2, high: 3, critical: 4 };
export interface FeatureScore { featureId: string; title: string; priority: Priority; valueScore: number; effortPoints: number; riskScore: number; priorityScore: number; }
export class PrioritizationEngine {
  static rank(features: Feature[]): FeatureScore[] {
    return features.map((feature) => {
      const effort = Math.max(feature.effortPoints, 1);
      const priorityBoost = priorityWeight[feature.priority] * 10;
      const value = feature.valueScore + priorityBoost;
      const riskPenalty = feature.riskScore * 0.5;
      return { featureId: feature.id, title: feature.title, priority: feature.priority, valueScore: feature.valueScore, effortPoints: feature.effortPoints, riskScore: feature.riskScore, priorityScore: roundMoney((value - riskPenalty) / effort) };
    }).sort((a, b) => b.priorityScore - a.priorityScore);
  }
}
