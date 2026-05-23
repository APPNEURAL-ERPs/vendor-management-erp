import { Conversion, Lead, Touchpoint } from "../core/domain";
import { clamp, round } from "../core/utils";

const eventWeights: Record<string, number> = {
  visit: 3,
  email_open: 5,
  email_click: 12,
  ad_click: 8,
  form_submit: 25,
  webinar_attended: 20,
  call: 15,
  demo_request: 30,
  signup: 25,
  purchase: 40,
  custom: 4
};

export interface ScoreBreakdown {
  identity: number;
  engagement: number;
  conversions: number;
  tags: number;
  total: number;
}

export class ScoringEngine {
  static scoreLead(lead: Lead, touchpoints: Touchpoint[], conversions: Conversion[]): ScoreBreakdown {
    const identity =
      (lead.email ? 10 : 0) +
      (lead.phone ? 5 : 0) +
      (lead.company ? 8 : 0) +
      (lead.jobTitle ? 5 : 0) +
      (lead.consent === "opted_in" ? 5 : 0);
    const tagScore = Math.min(10, (lead.tags ?? []).length * 2);
    const engagement = Math.min(45, touchpoints.reduce((score, touchpoint) => score + (eventWeights[touchpoint.eventType] ?? 2), 0));
    const conversionScore = Math.min(30, conversions.reduce((score, conversion) => {
      if (conversion.type === "customer" || conversion.type === "revenue") return score + 30;
      if (conversion.type === "sql") return score + 22;
      if (conversion.type === "mql") return score + 14;
      return score + 10;
    }, 0));
    const total = clamp(round(identity + tagScore + engagement + conversionScore), 0, 100);
    return { identity: round(identity), engagement: round(engagement), conversions: round(conversionScore), tags: round(tagScore), total };
  }
}
