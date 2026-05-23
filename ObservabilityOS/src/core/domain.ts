export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "ops_admin" | "sre_engineer" | "developer" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";

export interface RequestActor {
  tenantId: TenantId;
  userId: UUID;
  role: Role;
}

export interface BaseEntity {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL" | "AUDIT" | "SECURITY";
export type MetricType = "counter" | "gauge" | "histogram" | "summary" | "rate" | "percentile";
export type AlertSeverity = "info" | "warning" | "high" | "critical" | "emergency";
export type AlertStatus = "firing" | "acknowledged" | "resolved" | "snoozed";
export type ServiceHealthStatus = "healthy" | "degraded" | "unhealthy" | "down" | "maintenance" | "unknown";
export type IncidentStatus = "open" | "investigating" | "identified" | "mitigating" | "resolved" | "closed";
export type TraceStatus = "ok" | "error" | "timeout" | "cancelled";
export type DashboardWidgetType = "metric" | "log" | "trace" | "alert" | "chart" | "table" | "status";

export interface LogEvent extends BaseEntity {
  level: LogLevel;
  service: string;
  environment: string;
  requestId?: UUID;
  traceId?: UUID;
  workflowRunId?: UUID;
  userId?: UUID;
  message: string;
  errorCode?: string;
  duration?: number;
  metadata: Record<string, unknown>;
}

export interface MetricDefinition extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: MetricType;
  unit?: string;
  service?: string;
  status: EntityStatus;
  tags: string[];
}

export interface MetricPoint extends BaseEntity {
  metricId: UUID;
  value: number;
  timestamp: ISODate;
  labels: Record<string, string>;
}

export interface Trace extends BaseEntity {
  traceId: UUID;
  service: string;
  operation: string;
  status: TraceStatus;
  startTime: ISODate;
  endTime?: ISODate;
  durationMs?: number;
  userId?: UUID;
  requestId?: UUID;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface TraceSpan extends BaseEntity {
  traceId: UUID;
  parentSpanId?: UUID;
  spanId: UUID;
  service: string;
  operation: string;
  status: TraceStatus;
  startTime: ISODate;
  endTime?: ISODate;
  durationMs?: number;
  metadata: Record<string, unknown>;
}

export interface ErrorEvent extends BaseEntity {
  errorCode: string;
  message: string;
  stackTrace?: string;
  service: string;
  version?: string;
  environment: string;
  userId?: UUID;
  requestId?: UUID;
  traceId?: UUID;
  frequency: number;
  firstSeen: ISODate;
  lastSeen: ISODate;
  status: "new" | "triaged" | "investigating" | "fixed" | "resolved" | "ignored" | "reopened";
  ownerId?: UUID;
  impact: number;
  metadata: Record<string, unknown>;
}

export interface AlertRule extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  metricId?: UUID;
  condition: string;
  threshold: number;
  duration: number;
  severity: AlertSeverity;
  status: EntityStatus;
  service?: string;
  notifications: string[];
}

export interface AlertEvent extends BaseEntity {
  ruleId?: UUID;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  value?: number;
  threshold?: number;
  service?: string;
  firedAt: ISODate;
  resolvedAt?: ISODate;
  acknowledgedBy?: UUID;
  metadata: Record<string, unknown>;
}

export interface HealthCheck extends BaseEntity {
  name: string;
  service: string;
  endpoint?: string;
  type: "http" | "tcp" | "database" | "queue" | "cron" | "webhook";
  status: "healthy" | "unhealthy" | "unknown";
  interval: number;
  timeout: number;
  lastCheck: ISODate;
  responseTime?: number;
  metadata: Record<string, unknown>;
}

export interface SLO extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  target: number;
  window: "daily" | "weekly" | "monthly" | "quarterly";
  status: EntityStatus;
  service?: string;
  metricKey?: string;
  errorBudgetRemaining?: number;
  lastCalculated: ISODate;
}

export interface ErrorBudget extends BaseEntity {
  sloId: UUID;
  total: number;
  used: number;
  remaining: number;
  window: "daily" | "weekly" | "monthly" | "quarterly";
  calculatedAt: ISODate;
}

export interface ServiceMetrics extends BaseEntity {
  service: string;
  uptime: number;
  latencyP50?: number;
  latencyP95?: number;
  latencyP99?: number;
  errorRate: number;
  requestsPerMinute?: number;
  cpuUsage?: number;
  memoryUsage?: number;
  databaseLatency?: number;
  queueBacklog?: number;
  lastUpdated: ISODate;
  metadata: Record<string, unknown>;
}

export interface IncidentSignal extends BaseEntity {
  incidentId?: UUID;
  alertId?: UUID;
  errorId?: UUID;
  type: "alert" | "error" | "health_degraded" | "slo_breach" | "manual";
  severity: AlertSeverity;
  message: string;
  service: string;
  detectedAt: ISODate;
  metadata: Record<string, unknown>;
}

export interface Incident extends BaseEntity {
  title: string;
  description?: string;
  status: IncidentStatus;
  severity: AlertSeverity;
  services: string[];
  ownerId?: UUID;
  startedAt: ISODate;
  detectedAt: ISODate;
  resolvedAt?: ISODate;
  impactedTenants: TenantId[];
  signals: IncidentSignal[];
  timeline: Array<{ timestamp: ISODate; action: string; actor?: UUID; notes?: string }>;
  metadata: Record<string, unknown>;
}

export interface Dashboard extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  ownerId?: UUID;
  isPublic: boolean;
  widgets: DashboardWidget[];
  filters: Record<string, string>;
}

export interface DashboardWidget extends BaseEntity {
  dashboardId: UUID;
  type: DashboardWidgetType;
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, unknown>;
  metricIds?: UUID[];
  filterKeys?: string[];
}

export interface CostMetric extends BaseEntity {
  service?: string;
  category: "ai" | "compute" | "storage" | "network" | "notification" | "workflow" | "api" | "other";
  amount: number;
  currency: string;
  period: "hourly" | "daily" | "monthly";
  timestamp: ISODate;
  tags: Record<string, string>;
  metadata: Record<string, unknown>;
}

export interface Report extends BaseEntity {
  key: string;
  name: string;
  type: "slo" | "incident" | "cost" | "performance" | "reliability" | "custom";
  period: { start: ISODate; end: ISODate };
  status: "generating" | "ready" | "failed";
  content?: Record<string, unknown>;
  generatedBy?: UUID;
  metadata: Record<string, unknown>;
}

export interface AuditLog extends BaseEntity {
  actorId: UUID;
  role: Role;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
}

export interface ObservabilityEvent extends BaseEntity {
  type: string;
  source: string;
  data: Record<string, unknown>;
  correlationId?: UUID;
}

export interface ObservabilityState {
  logs: LogEvent[];
  metricDefinitions: MetricDefinition[];
  metricPoints: MetricPoint[];
  traces: Trace[];
  traceSpans: TraceSpan[];
  errorEvents: ErrorEvent[];
  alertRules: AlertRule[];
  alertEvents: AlertEvent[];
  healthChecks: HealthCheck[];
  slos: SLO[];
  errorBudgets: ErrorBudget[];
  serviceMetrics: ServiceMetrics[];
  incidentSignals: IncidentSignal[];
  incidents: Incident[];
  dashboards: Dashboard[];
  dashboardWidgets: DashboardWidget[];
  costMetrics: CostMetric[];
  reports: Report[];
  events: ObservabilityEvent[];
  auditLogs: AuditLog[];
}

export interface ObservabilityOverview {
  services: { total: number; healthy: number; degraded: number; unhealthy: number };
  alerts: { total: number; firing: number; acknowledged: number; resolved: number };
  incidents: { total: number; open: number; investigating: number; resolved: number };
  logs: { total: number; errors: number; warnings: number };
  metrics: { total: number; definitions: number };
  traces: { total: number; errors: number };
  slos: { total: number; atTarget: number };
  costs: { today: number; month: number; trend: number };
}
