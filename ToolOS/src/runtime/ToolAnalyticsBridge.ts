import { ToolAnalyticsMetric, ToolEvent, ToolExecutionRecord } from "./types";

export class ToolAnalyticsBridge {
  readonly events: ToolEvent[] = [];
  readonly metrics: ToolAnalyticsMetric[] = [];

  publish(event: ToolEvent): void {
    this.events.push(event);
  }

  track(record: ToolExecutionRecord): void {
    this.metrics.push({
      toolId: record.toolId,
      commandName: record.commandName,
      tenantId: record.tenantId,
      actorId: record.actorId,
      status: record.status,
      durationMs: record.durationMs,
      at: record.completedAt
    });
  }
}
