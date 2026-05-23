import { FilterCondition } from "../core/domain";
import { matchesFilter, matchesFilters, readField } from "../core/utils";

export interface ConditionExplanation {
  field: string;
  operator: string;
  expected: unknown;
  actual: unknown;
  matched: boolean;
}

export class ConditionEngine {
  matches(context: unknown, filters: FilterCondition[] = []): boolean {
    return matchesFilters(context, filters);
  }

  explain(context: unknown, filters: FilterCondition[] = []): ConditionExplanation[] {
    return filters.map((filter) => ({
      field: filter.field,
      operator: filter.operator,
      expected: filter.value,
      actual: readField(context, filter.field),
      matched: matchesFilter(context, filter)
    }));
  }
}
