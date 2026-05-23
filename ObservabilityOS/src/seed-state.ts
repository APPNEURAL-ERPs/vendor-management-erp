import { ObservabilityState } from "./core/domain";
import { emptyState } from "./core/datastore";
import { nowIso, newId } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): ObservabilityState {
  const state = emptyState();
  const createdAt = nowIso();

  state.serviceMetrics.push(
    {
      id: "sm_identity_service",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      service: "identity-service",
      uptime: 99.95,
      latencyP50: 45,
      latencyP95: 120,
      latencyP99: 250,
      errorRate: 0.05,
      requestsPerMinute: 850,
      cpuUsage: 35,
      memoryUsage: 52,
      databaseLatency: 8,
      lastUpdated: createdAt,
      metadata: { version: "2.1.0", region: "us-east-1" }
    },
    {
      id: "sm_billing_service",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      service: "billing-service",
      uptime: 99.8,
      latencyP50: 180,
      latencyP95: 450,
      latencyP99: 800,
      errorRate: 0.2,
      requestsPerMinute: 120,
      cpuUsage: 42,
      memoryUsage: 58,
      databaseLatency: 15,
      lastUpdated: createdAt,
      metadata: { version: "1.4.2", region: "us-east-1" }
    },
    {
      id: "sm_workflow_service",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      service: "workflow-service",
      uptime: 99.5,
      latencyP50: 250,
      latencyP95: 600,
      latencyP99: 1200,
      errorRate: 0.5,
      requestsPerMinute: 45,
      cpuUsage: 55,
      memoryUsage: 68,
      queueBacklog: 240,
      lastUpdated: createdAt,
      metadata: { version: "3.0.1", region: "us-east-1" }
    },
    {
      id: "sm_notification_service",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      service: "notification-service",
      uptime: 99.9,
      latencyP50: 85,
      latencyP95: 200,
      latencyP99: 350,
      errorRate: 0.1,
      requestsPerMinute: 320,
      cpuUsage: 28,
      memoryUsage: 35,
      lastUpdated: createdAt,
      metadata: { version: "1.2.0", region: "us-east-1" }
    },
    {
      id: "sm_ai_service",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      service: "ai-service",
      uptime: 99.7,
      latencyP50: 1200,
      latencyP95: 3500,
      latencyP99: 6000,
      errorRate: 0.3,
      requestsPerMinute: 28,
      cpuUsage: 78,
      memoryUsage: 85,
      lastUpdated: createdAt,
      metadata: { version: "2.0.0", region: "us-east-1" }
    }
  );

  state.metricDefinitions.push(
    {
      id: "metric_api_requests",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "api_requests_total",
      name: "API Requests Total",
      description: "Total number of API requests",
      type: "counter",
      service: "api-gateway",
      status: "active",
      tags: ["api", "requests", "gateway"]
    },
    {
      id: "metric_api_latency",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "api_latency_p95",
      name: "API Latency P95",
      description: "95th percentile API latency in milliseconds",
      type: "percentile",
      unit: "ms",
      service: "api-gateway",
      status: "active",
      tags: ["api", "latency", "performance"]
    },
    {
      id: "metric_error_rate",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "error_rate",
      name: "Error Rate",
      description: "Percentage of requests resulting in errors",
      type: "gauge",
      unit: "percent",
      service: "api-gateway",
      status: "active",
      tags: ["errors", "reliability"]
    },
    {
      id: "metric_ai_cost",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "ai_cost_total",
      name: "AI Cost Total",
      description: "Total AI service cost in INR",
      type: "counter",
      unit: "INR",
      service: "ai-service",
      status: "active",
      tags: ["ai", "cost", "billing"]
    },
    {
      id: "metric_queue_backlog",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "queue_backlog_size",
      name: "Queue Backlog Size",
      description: "Number of jobs waiting in queue",
      type: "gauge",
      service: "workflow-service",
      status: "active",
      tags: ["queue", "workflow", "backlog"]
    }
  );

  state.logs.push(
    {
      id: "log_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      level: "INFO",
      service: "identity-service",
      environment: "production",
      requestId: "req_001",
      traceId: "trc_001",
      message: "User authentication successful",
      metadata: { userId: "user_123", method: "oauth2", ip: "192.168.1.1" }
    },
    {
      id: "log_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      level: "WARN",
      service: "billing-service",
      environment: "production",
      requestId: "req_002",
      traceId: "trc_002",
      message: "Payment gateway response time exceeded threshold",
      duration: 2500,
      metadata: { gateway: "razorpay", latency: 2500, threshold: 2000 }
    },
    {
      id: "log_3",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      level: "ERROR",
      service: "workflow-service",
      environment: "production",
      requestId: "req_003",
      traceId: "trc_003",
      message: "Failed to process invoice reminder workflow",
      errorCode: "WORKFLOW_EXECUTION_FAILED",
      metadata: { workflowId: "wf_invoice_reminder", step: "whatsapp_delivery", error: "provider_timeout" }
    },
    {
      id: "log_4",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      level: "INFO",
      service: "ai-service",
      environment: "production",
      requestId: "req_004",
      traceId: "trc_004",
      message: "Resume match analysis completed",
      duration: 3200,
      metadata: { resumeId: "resume_456", tokensUsed: 2850, model: "gpt-4o-mini", cost: 1.52 }
    },
    {
      id: "log_5",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      level: "AUDIT",
      service: "billing-service",
      environment: "production",
      userId: "user_admin",
      message: "Admin exported invoice report",
      metadata: { reportType: "monthly_invoices", format: "csv", recordCount: 1250 }
    }
  );

  state.traces.push(
    {
      id: "trace_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      traceId: "trc_001",
      service: "api-gateway",
      operation: "POST /career/resume-match",
      status: "ok",
      startTime: createdAt,
      endTime: new Date(new Date(createdAt).getTime() + 3500).toISOString(),
      durationMs: 3500,
      userId: "user_123",
      requestId: "req_001",
      tags: ["careeros", "ai", "resume"],
      metadata: { tenant: "abc-institute", requestSize: 245000 }
    },
    {
      id: "trace_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      traceId: "trc_003",
      service: "workflow-service",
      operation: "execute wf_invoice_reminder",
      status: "error",
      startTime: createdAt,
      endTime: new Date(new Date(createdAt).getTime() + 15000).toISOString(),
      durationMs: 15000,
      requestId: "req_003",
      tags: ["billing", "workflow", "invoice"],
      metadata: { workflowId: "wf_invoice_reminder", invoiceId: "inv_789", tenant: "xyz-college" }
    }
  );

  state.traceSpans.push(
    {
      id: "span_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      traceId: "trc_001",
      spanId: "span_001_1",
      service: "api-gateway",
      operation: "authenticate",
      status: "ok",
      startTime: createdAt,
      endTime: new Date(new Date(createdAt).getTime() + 50).toISOString(),
      durationMs: 50,
      metadata: { method: "jwt" }
    },
    {
      id: "span_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      traceId: "trc_001",
      parentSpanId: "span_001_1",
      spanId: "span_001_2",
      service: "career-service",
      operation: "parse_resume",
      status: "ok",
      startTime: createdAt,
      endTime: new Date(new Date(createdAt).getTime() + 800).toISOString(),
      durationMs: 800,
      metadata: { format: "pdf", size: 245000 }
    },
    {
      id: "span_3",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      traceId: "trc_001",
      parentSpanId: "span_001_2",
      spanId: "span_001_3",
      service: "ai-service",
      operation: "match_resume_to_jd",
      status: "ok",
      startTime: createdAt,
      endTime: new Date(new Date(createdAt).getTime() + 3200).toISOString(),
      durationMs: 3200,
      metadata: { model: "gpt-4o-mini", tokens: 2850, cost: 1.52 }
    }
  );

  state.alertRules.push(
    {
      id: "alert_error_rate",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "api_error_rate_threshold",
      name: "API Error Rate Alert",
      description: "Alert when API error rate exceeds 5%",
      condition: "error_rate > 5",
      threshold: 5,
      duration: 300,
      severity: "high",
      status: "active",
      service: "api-gateway",
      notifications: ["email:ops@company.com", "slack:#alerts"]
    },
    {
      id: "alert_latency",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "api_latency_p95_threshold",
      name: "API Latency Alert",
      description: "Alert when P95 latency exceeds 1 second",
      metricId: "metric_api_latency",
      condition: "p95_latency > 1000",
      threshold: 1000,
      duration: 300,
      severity: "warning",
      status: "active",
      service: "api-gateway",
      notifications: ["slack:#performance"]
    },
    {
      id: "alert_ai_cost",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "daily_ai_cost_threshold",
      name: "Daily AI Cost Alert",
      description: "Alert when daily AI cost exceeds budget",
      metricId: "metric_ai_cost",
      condition: "daily_cost > 5000",
      threshold: 5000,
      duration: 86400,
      severity: "critical",
      status: "active",
      service: "ai-service",
      notifications: ["email:finance@company.com", "slack:#billing"]
    },
    {
      id: "alert_queue_backlog",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "queue_backlog_threshold",
      name: "Queue Backlog Alert",
      description: "Alert when queue backlog exceeds 10000",
      metricId: "metric_queue_backlog",
      condition: "backlog > 10000",
      threshold: 10000,
      duration: 600,
      severity: "high",
      status: "active",
      service: "workflow-service",
      notifications: ["slack:#workflows"]
    }
  );

  state.alertEvents.push(
    {
      id: "alert_event_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      ruleId: "alert_error_rate",
      severity: "high",
      status: "firing",
      message: "API error rate is 6.2%, exceeds threshold of 5%",
      value: 6.2,
      threshold: 5,
      service: "api-gateway",
      firedAt: createdAt,
      metadata: { window: "5m", currentValue: 6.2 }
    },
    {
      id: "alert_event_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      ruleId: "alert_ai_cost",
      severity: "warning",
      status: "acknowledged",
      message: "Daily AI cost has reached 4000 INR, approaching threshold of 5000",
      value: 4000,
      threshold: 5000,
      service: "ai-service",
      firedAt: createdAt,
      acknowledgedBy: "user_ops",
      metadata: { window: "24h", currentValue: 4000, percentage: 80 }
    }
  );

  state.healthChecks.push(
    {
      id: "hc_api_gateway",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "API Gateway Health",
      service: "api-gateway",
      endpoint: "https://api.appneural.com/health",
      type: "http",
      status: "healthy",
      interval: 60,
      timeout: 5,
      lastCheck: createdAt,
      responseTime: 45,
      metadata: {}
    },
    {
      id: "hc_database",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "PostgreSQL Database",
      service: "database",
      type: "database",
      status: "healthy",
      interval: 30,
      timeout: 10,
      lastCheck: createdAt,
      responseTime: 8,
      metadata: { host: "db.internal:5432" }
    },
    {
      id: "hc_redis",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Redis Cache",
      service: "cache",
      type: "tcp",
      status: "healthy",
      interval: 30,
      timeout: 5,
      lastCheck: createdAt,
      responseTime: 2,
      metadata: { host: "redis.internal:6379" }
    }
  );

  state.slos.push(
    {
      id: "slo_api_availability",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "api_availability",
      name: "API Availability SLO",
      description: "API should be available 99.9% of the time",
      target: 99.9,
      window: "monthly",
      status: "active",
      service: "api-gateway",
      errorBudgetRemaining: 25.2,
      lastCalculated: createdAt
    },
    {
      id: "slo_api_latency",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "api_latency_p95",
      name: "API Latency SLO",
      description: "P95 API latency should be under 500ms for 95% of requests",
      target: 95,
      window: "monthly",
      status: "active",
      service: "api-gateway",
      metricKey: "api_latency_p95",
      errorBudgetRemaining: 18.5,
      lastCalculated: createdAt
    },
    {
      id: "slo_workflow_success",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "workflow_success_rate",
      name: "Workflow Success Rate SLO",
      description: "Workflows should succeed 98% of the time",
      target: 98,
      window: "monthly",
      status: "active",
      service: "workflow-service",
      errorBudgetRemaining: 42.0,
      lastCalculated: createdAt
    }
  );

  state.errorEvents.push(
    {
      id: "error_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      errorCode: "PAYMENT_GATEWAY_TIMEOUT",
      message: "Payment gateway Razorpay timed out after 30 seconds",
      stackTrace: "Error: Payment timeout\n    at PaymentService.verify (/app/billing/payment.ts:145)\n    at processTicksAndRejections (internal/process/task_queues:95)",
      service: "billing-service",
      version: "1.4.2",
      environment: "production",
      requestId: "req_payment_001",
      traceId: "trc_payment_001",
      frequency: 12,
      firstSeen: createdAt,
      lastSeen: createdAt,
      status: "investigating",
      ownerId: "user_billing_lead",
      impact: 8,
      metadata: { gateway: "razorpay", region: "us-east-1" }
    },
    {
      id: "error_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      errorCode: "WHATSAPP_PROVIDER_ERROR",
      message: "WhatsApp Business API returned 503 Service Unavailable",
      stackTrace: "Error: 503 Service Unavailable\n    at WhatsAppProvider.send (/app/notification/whatsapp.ts:89)",
      service: "notification-service",
      version: "1.2.0",
      environment: "production",
      frequency: 5,
      firstSeen: createdAt,
      lastSeen: createdAt,
      status: "triaged",
      impact: 3,
      metadata: { provider: "whatsapp", affectedTemplates: ["invoice_reminder"] }
    }
  );

  state.incidents.push(
    {
      id: "incident_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "Payment Gateway Latency Spike",
      description: "Razorpay payment gateway experiencing high latency affecting invoice processing",
      status: "investigating",
      severity: "high",
      services: ["billing-service", "payment-gateway"],
      ownerId: "user_billing_lead",
      startedAt: createdAt,
      detectedAt: createdAt,
      impactedTenants: ["abc-institute", "xyz-college"],
      signals: [
        {
          id: "signal_1",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          type: "alert",
          severity: "high",
          message: "Payment latency alert fired",
          service: "billing-service",
          detectedAt: createdAt,
          metadata: { alertId: "alert_payment_latency" }
        }
      ],
      timeline: [
        { timestamp: createdAt, action: "incident_created", actor: "system", notes: "Auto-created from alert" },
        { timestamp: createdAt, action: "status_changed", actor: "user_billing_lead", notes: "Investigating" }
      ],
      metadata: { gateway: "razorpay", affectedOperations: ["payment_verify", "refund_process"] }
    }
  );

  state.dashboards.push(
    {
      id: "dashboard_overview",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "platform_overview",
      name: "Platform Overview",
      description: "High-level overview of all platform services",
      status: "active",
      isPublic: true,
      widgets: [],
      filters: {}
    },
    {
      id: "dashboard_ai_cost",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "ai_cost_dashboard",
      name: "AI Cost Dashboard",
      description: "Real-time AI usage and cost monitoring",
      status: "active",
      isPublic: false,
      widgets: [],
      filters: {}
    }
  );

  state.costMetrics.push(
    {
      id: "cost_ai_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      service: "ai-service",
      category: "ai",
      amount: 1850,
      currency: "INR",
      period: "daily",
      timestamp: createdAt,
      tags: { service: "career-service", operation: "resume-match" },
      metadata: { requests: 1250, tokensUsed: 485000 }
    },
    {
      id: "cost_compute_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      service: "api-gateway",
      category: "compute",
      amount: 450,
      currency: "INR",
      period: "daily",
      timestamp: createdAt,
      tags: { region: "us-east-1", instanceType: "t3.medium" },
      metadata: { instanceHours: 24, requests: 125000 }
    },
    {
      id: "cost_notification_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      service: "notification-service",
      category: "notification",
      amount: 280,
      currency: "INR",
      period: "daily",
      timestamp: createdAt,
      tags: { channel: "whatsapp" },
      metadata: { messages: 4200, deliveryRate: 98.5 }
    }
  );

  state.reports.push(
    {
      id: "report_monthly",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "monthly_reliability",
      name: "Monthly Reliability Report",
      type: "reliability",
      period: { start: createdAt, end: createdAt },
      status: "ready",
      content: {
        uptime: 99.85,
        totalIncidents: 3,
        resolvedIncidents: 2,
        alertFiring: 5,
        topErrors: ["PAYMENT_GATEWAY_TIMEOUT", "WHATSAPP_PROVIDER_ERROR"]
      },
      generatedBy: "user_ops",
      metadata: { format: "pdf", size: 245000 }
    }
  );

  state.events.push({
    id: "event_bootstrap",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "observabilityos.seeded",
    source: "ObservabilityOS",
    data: { message: "ObservabilityOS demo data seeded", services: 5, alerts: 4, incidents: 1 }
  });

  return state;
}
