import { Lead, SegmentRule } from "../core/domain";
import { valueAtPath } from "../core/utils";

export class SegmentEngine {
  static matches(lead: Lead, rules: SegmentRule[]): boolean {
    if (!rules || rules.length === 0) return true;
    const leadObject = lead as unknown as Record<string, unknown>;
    return rules.every((rule) => {
      const raw = rule.field.startsWith("custom.") ? valueAtPath(lead.customFields, rule.field.replace(/^custom\./, "")) : valueAtPath(leadObject, rule.field);
      switch (rule.operator) {
        case "eq": return raw === rule.value;
        case "neq": return raw !== rule.value;
        case "contains": return String(raw ?? "").toLowerCase().includes(String(rule.value ?? "").toLowerCase());
        case "gte": return Number(raw) >= Number(rule.value);
        case "lte": return Number(raw) <= Number(rule.value);
        case "in": return Array.isArray(rule.value) ? rule.value.includes(raw) : false;
        case "exists": return raw !== undefined && raw !== null && raw !== "";
        default: return false;
      }
    });
  }
}
