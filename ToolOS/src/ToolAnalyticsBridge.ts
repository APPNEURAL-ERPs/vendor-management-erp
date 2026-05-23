import { AnalyticsBridge, ToolAnalyticsMetric, ToolEvent } from "./types";

export class ToolAnalyticsBridge implements AnalyticsBridge {
  readonly events: ToolEvent[] = [];
  readonly metrics: ToolAnalyticsMetric[] = [];

  emit(event: ToolEvent): void {
    this.events.push(event);
  }

  publish(event: ToolEvent): void {
    this.emit(event);
  }

  track(metric: ToolAnalyticsMetric): void {
    this.metrics.push(metric);
  }
}
