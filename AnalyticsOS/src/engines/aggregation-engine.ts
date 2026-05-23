import { AnalyticsRecord, FilterCondition, MetricCalculationResult, MetricDefinition } from "../core/domain";
import { matchesFilters, readField, toNumber } from "../core/utils";
import { nowIso } from "../core/id";

export interface RecordQuery {
  tenantId: string;
  entity?: string;
  sourceId?: string;
  from?: string;
  to?: string;
  filters?: FilterCondition[];
  limit?: number;
}

export interface MetricCalculateOptions {
  from?: string;
  to?: string;
  filters?: FilterCondition[];
  groupBy?: string[];
}

export class AggregationEngine {
  filterRecords(records: AnalyticsRecord[], query: RecordQuery): AnalyticsRecord[] {
    let result = records.filter((record) => record.tenantId === query.tenantId);
    if (query.entity) result = result.filter((record) => record.entity === query.entity);
    if (query.sourceId) result = result.filter((record) => record.sourceId === query.sourceId);
    if (query.from) result = result.filter((record) => record.timestamp >= String(query.from));
    if (query.to) result = result.filter((record) => record.timestamp <= String(query.to));
    if (query.filters?.length) result = result.filter((record) => matchesFilters(record, query.filters ?? []));
    result = result.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    if (query.limit && query.limit > 0) result = result.slice(0, query.limit);
    return result;
  }

  calculateMetric(metric: MetricDefinition, records: AnalyticsRecord[], options: MetricCalculateOptions = {}): MetricCalculationResult {
    const filters = [...(metric.filters ?? []), ...(options.filters ?? [])];
    const filtered = this.filterRecords(records, {
      tenantId: metric.tenantId,
      entity: metric.entity,
      from: options.from,
      to: options.to,
      filters
    });

    const groupBy = options.groupBy?.length ? options.groupBy : metric.defaultGroupBy;
    const value = this.aggregate(metric, filtered);
    const groups = groupBy.length ? this.calculateGroups(metric, filtered, groupBy) : [];

    return {
      metricId: metric.id,
      metricKey: metric.key,
      metricName: metric.name,
      entity: metric.entity,
      aggregation: metric.aggregation,
      field: metric.field,
      value,
      count: filtered.length,
      groups,
      from: options.from,
      to: options.to,
      calculatedAt: nowIso()
    };
  }

  private calculateGroups(metric: MetricDefinition, records: AnalyticsRecord[], groupBy: string[]): Array<{ key: string; value: number; count: number; dimensions: Record<string, unknown> }> {
    const buckets = new Map<string, AnalyticsRecord[]>();
    const dimensionsByKey = new Map<string, Record<string, unknown>>();

    for (const record of records) {
      const dimensions: Record<string, unknown> = {};
      for (const dimensionField of groupBy) {
        dimensions[dimensionField] = readField(record, dimensionField);
      }
      const key = groupBy.map((field) => `${field}:${String(dimensions[field] ?? "unknown")}`).join("|");
      buckets.set(key, [...(buckets.get(key) ?? []), record]);
      dimensionsByKey.set(key, dimensions);
    }

    return Array.from(buckets.entries())
      .map(([key, bucketRecords]) => ({
        key,
        value: this.aggregate(metric, bucketRecords),
        count: bucketRecords.length,
        dimensions: dimensionsByKey.get(key) ?? {}
      }))
      .sort((a, b) => b.value - a.value);
  }

  private aggregate(metric: MetricDefinition, records: AnalyticsRecord[]): number {
    if (metric.aggregation === "count") return records.length;
    const values = records
      .map((record) => toNumber(readField(record, metric.field ?? "")))
      .filter((value): value is number => value !== undefined);

    if (values.length === 0) return 0;

    switch (metric.aggregation) {
      case "sum":
        return round(values.reduce((total, value) => total + value, 0));
      case "avg":
        return round(values.reduce((total, value) => total + value, 0) / values.length);
      case "min":
        return round(Math.min(...values));
      case "max":
        return round(Math.max(...values));
      default:
        return 0;
    }
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
