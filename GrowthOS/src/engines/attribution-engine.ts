import { Conversion, Touchpoint } from "../core/domain";
import { round } from "../core/utils";

export interface SourceAttributionMetric {
  source: string;
  touchpoints: number;
  conversions: number;
  revenue: number;
}

export class AttributionEngine {
  static sourceBreakdown(touchpoints: Touchpoint[], conversions: Conversion[]): SourceAttributionMetric[] {
    const sources = new Map<string, SourceAttributionMetric>();
    for (const touchpoint of touchpoints) {
      const source = touchpoint.source || "unknown";
      const current = sources.get(source) ?? { source, touchpoints: 0, conversions: 0, revenue: 0 };
      current.touchpoints += 1;
      sources.set(source, current);
    }
    for (const conversion of conversions) {
      const source = conversion.source || "unknown";
      const current = sources.get(source) ?? { source, touchpoints: 0, conversions: 0, revenue: 0 };
      current.conversions += 1;
      current.revenue = round(current.revenue + Number(conversion.amount || 0));
      sources.set(source, current);
    }
    return Array.from(sources.values()).sort((a, b) => b.revenue - a.revenue || b.conversions - a.conversions || b.touchpoints - a.touchpoints);
  }

  static campaignRoi(cost: number, revenue: number): number {
    if (!cost) return revenue > 0 ? 100 : 0;
    return round(((revenue - cost) / cost) * 100);
  }
}
