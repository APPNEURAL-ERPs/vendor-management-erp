export function docs() {
  return {
    name: "ObservabilityOS",
    version: "1.0.0",
    description: "Logs, metrics, traces, alerts, service health, cost visibility, reliability dashboards, and debugging context",
    auth: {
      headers: {
        "x-role": "owner | admin | ops_admin | sre_engineer | developer | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      log: "Structured log event with level, service, message, and metadata",
      metric: "Time-series metric definition and data points for monitoring",
      trace: "Distributed trace with spans tracking request flow across services",
      alert: "Alert rule and event for threshold-based notifications",
      healthCheck: "Service health monitoring endpoint configuration",
      slo: "Service Level Objective for reliability targets",
      incident: "Incident with timeline, signals, and impact tracking",
      dashboard: "Customizable dashboard with widgets for observability views",
      costMetric: "Cost tracking by category, service, and time period",
      errorEvent: "Error tracking with frequency, impact, and ownership"
    },
    examples: {
      createLog: {
        method: "POST",
        path: "/observability/logs",
        headers: { "x-role": "developer" },
        body: {
          level: "INFO",
          service: "billing-service",
          environment: "production",
          message: "Payment processed successfully",
          metadata: { invoiceId: "inv_123", amount: 5000 }
        }
      },
      queryLogs: {
        method: "GET",
        path: "/observability/logs?level=ERROR&service=billing-service&limit=50",
        headers: { "x-role": "sre_engineer" }
      },
      recordMetric: {
        method: "POST",
        path: "/observability/metrics/points",
        headers: { "x-role": "ops_admin" },
        body: {
          metricId: "api_requests_total",
          value: 1250,
          labels: { service: "api-gateway", status: "200" }
        }
      },
      createTrace: {
        method: "POST",
        path: "/observability/traces",
        headers: { "x-role": "developer" },
        body: {
          service: "career-service",
          operation: "POST /career/resume-match",
          status: "ok",
          startTime: "2026-05-21T10:30:00Z",
          durationMs: 3500,
          tags: ["careeros", "ai"]
        }
      },
      createAlert: {
        method: "POST",
        path: "/observability/alerts/rules",
        headers: { "x-role": "ops_admin" },
        body: {
          key: "high_error_rate",
          name: "High Error Rate Alert",
          condition: "error_rate > 5",
          threshold: 5,
          duration: 300,
          severity: "high",
          notifications: ["email:ops@company.com"]
        }
      },
      createIncident: {
        method: "POST",
        path: "/observability/incidents",
        headers: { "x-role": "ops_admin" },
        body: {
          title: "Payment Gateway Latency Spike",
          severity: "high",
          services: ["billing-service", "payment-gateway"],
          impactedTenants: ["abc-institute", "xyz-college"]
        }
      },
      trackCost: {
        method: "POST",
        path: "/observability/costs",
        headers: { "x-role": "admin" },
        body: {
          service: "ai-service",
          category: "ai",
          amount: 1850,
          currency: "INR",
          period: "daily",
          tags: { operation: "resume-match", model: "gpt-4o-mini" }
        }
      }
    }
  };
}
