import { DevState, UsageEvent } from "../core/domain";

export interface DeveloperAnalyticsSummary {
  totalApps: number;
  activeApps: number;
  apiProducts: number;
  endpoints: number;
  sdkPackages: number;
  activeWebhookSubscriptions: number;
  deployments: number;
  pipelineRuns: number;
  pipelineSuccessRate: number;
  totalApiCalls: number;
  errorRate: number;
  averageLatencyMs: number;
  callsByStatusClass: Record<string, number>;
  topAppsByCalls: Array<{ appId: string; calls: number }>;
  topEndpoints: Array<{ path: string; method: string; calls: number }>;
}

export class DeveloperAnalyticsEngine {
  summarize(state: DevState, tenantId: string): DeveloperAnalyticsSummary {
    const apps = state.developerApps.filter((item) => item.tenantId === tenantId && item.status !== "archived");
    const apiProducts = state.apiProducts.filter((item) => item.tenantId === tenantId && item.status !== "archived");
    const endpoints = state.apiEndpoints.filter((item) => item.tenantId === tenantId && item.status !== "archived");
    const sdkPackages = state.sdkPackages.filter((item) => item.tenantId === tenantId && item.status !== "archived");
    const webhooks = state.webhookSubscriptions.filter((item) => item.tenantId === tenantId && item.status === "active");
    const runs = state.pipelineRuns.filter((item) => item.tenantId === tenantId);
    const deployments = state.deployments.filter((item) => item.tenantId === tenantId);
    const usage = state.usageEvents.filter((item) => item.tenantId === tenantId);
    const successfulRuns = runs.filter((run) => run.status === "passed").length;
    const pipelineSuccessRate = runs.length ? Math.round((successfulRuns / runs.length) * 100) : 0;
    const errorCalls = usage.filter((event) => event.statusCode >= 400).length;
    const errorRate = usage.length ? Math.round((errorCalls / usage.length) * 100) : 0;
    const averageLatencyMs = usage.length ? Math.round(usage.reduce((sum, event) => sum + event.latencyMs, 0) / usage.length) : 0;
    return {
      totalApps: apps.length,
      activeApps: apps.filter((app) => app.status === "active").length,
      apiProducts: apiProducts.length,
      endpoints: endpoints.length,
      sdkPackages: sdkPackages.length,
      activeWebhookSubscriptions: webhooks.length,
      deployments: deployments.length,
      pipelineRuns: runs.length,
      pipelineSuccessRate,
      totalApiCalls: usage.length,
      errorRate,
      averageLatencyMs,
      callsByStatusClass: countBy(usage, (event) => `${Math.floor(event.statusCode / 100)}xx`),
      topAppsByCalls: topBy(usage, (event) => event.appId ?? "unknown").map(([appId, calls]) => ({ appId, calls })),
      topEndpoints: topBy(usage, (event) => `${event.method} ${event.path}`).map(([key, calls]) => { const [method, ...path] = key.split(" "); return { method, path: path.join(" "), calls }; })
    };
  }
}

function countBy<T>(items: T[], selector: (item: T) => string): Record<string, number> {
  const output: Record<string, number> = {};
  for (const item of items) output[selector(item)] = (output[selector(item)] ?? 0) + 1;
  return output;
}
function topBy<T>(items: T[], selector: (item: T) => string): Array<[string, number]> {
  return Object.entries(countBy(items, selector)).sort((a, b) => b[1] - a[1]).slice(0, 5);
}
