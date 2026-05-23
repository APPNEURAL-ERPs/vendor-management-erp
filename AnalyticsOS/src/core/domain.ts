export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "analytics_admin" | "analyst" | "dashboard_viewer" | "viewer";
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

export interface DashboardWidget extends BaseEntity {
  dashboardId: UUID;
  type: "kpi_card" | "chart" | "table" | "funnel" | "gauge" | "metric" | "text" | "filter";
  title: string;
  config: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
  dataSource?: {
    type: "metric" | "event" | "funnel" | "kpi" | "custom";
    metricId?: UUID;
    eventName?: string;
    formula?: string;
  };
  refreshInterval?: number;
  visibility: "public" | "restricted";
}

export interface Dashboard extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  ownerId: UUID;
  tags: string[];
  layout: {
    columns: number;
    rowHeight: number;
    theme: "light" | "dark" | "auto";
  };
  filters: Array<{
    field: string;
    operator: "eq" | "contains" | "gte" | "lte" | "between" | "in";
    value?: unknown;
  }>;
  widgets: DashboardWidget[];
  isDefault: boolean;
  refreshInterval?: number;
}

export interface KPI extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  category: "business" | "product" | "sales" | "marketing" | "finance" | "support" | "ai" | "system" | "custom";
  formula: string;
  unit?: string;
  format: "number" | "currency" | "percent" | "duration" | "bytes";
  currentValue?: number;
  previousValue?: number;
  targetValue?: number;
  threshold?: {
    warning?: number;
    critical?: number;
  };
  ownerId?: UUID;
  refreshInterval?: number;
  metadata: Record<string, unknown>;
}

export interface MetricDefinition extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  category: "business" | "product" | "sales" | "marketing" | "finance" | "support" | "ai" | "system" | "user_behavior" | "operational" | "custom";
  type: "counter" | "gauge" | "histogram" | "summary" | "ratio" | "derived";
  unit?: string;
  formula?: string;
  dataSource?: {
    type: "event" | "database" | "api" | "formula";
    source?: string;
  };
  tags: string[];
  ownerId?: UUID;
  metadata: Record<string, unknown>;
}

export interface ReportSection {
  id: UUID;
  type: "chart" | "table" | "text" | "kpi" | "metric" | "funnel";
  title: string;
  config: Record<string, unknown>;
  order: number;
}

export interface ReportSchedule {
  id: UUID;
  frequency: "hourly" | "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "custom";
  cronExpression?: string;
  recipients: string[];
  formats: Array<"pdf" | "csv" | "excel" | "html">;
  isActive: boolean;
  lastRunAt?: ISODate;
  nextRunAt?: ISODate;
}

export interface Report extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  type: "executive" | "operational" | "financial" | "marketing" | "sales" | "support" | "ai" | "custom";
  ownerId: UUID;
  sections: ReportSection[];
  filters: Array<{
    field: string;
    operator: "eq" | "contains" | "gte" | "lte" | "between";
    value?: unknown;
  }>;
  schedule?: ReportSchedule;
  template?: string;
  isPublic: boolean;
  tags: string[];
}

export interface DataSource extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "database" | "api" | "spreadsheet" | "crm" | "erp" | "analytics" | "internal" | "custom";
  connectionConfig: {
    host?: string;
    port?: number;
    database?: string;
    apiUrl?: string;
    apiKey?: string;
    credentials?: Record<string, unknown>;
  };
  status: "connected" | "disconnected" | "error" | "syncing";
  lastSyncAt?: ISODate;
  syncFrequency?: string;
  metadata: Record<string, unknown>;
}

export interface EventSchema extends BaseEntity {
  name: string;
  description?: string;
  schema: {
    fields: Array<{
      name: string;
      type: "string" | "number" | "boolean" | "date" | "array" | "object";
      required: boolean;
      description?: string;
    }>;
  };
  version: number;
  isActive: boolean;
}

export interface AnalyticsEvent extends BaseEntity {
  name: string;
  userId?: UUID;
  sessionId?: string;
  source: string;
  properties: Record<string, unknown>;
  timestamp: ISODate;
}

export interface FunnelStep extends BaseEntity {
  name: string;
  description?: string;
  eventName: string;
  order: number;
  conditions?: Array<{
    field: string;
    operator: "eq" | "contains" | "gte" | "lte";
    value?: unknown;
  }>;
}

export interface Funnel extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  steps: FunnelStep[];
  dateRange: {
    start: ISODate;
    end: ISODate;
  };
  conversionWindow?: number;
  segmentation?: Array<{
    field: string;
    value?: unknown;
  }>;
  results?: {
    totalUsers: number;
    conversionRate: number;
    stepResults: Array<{
      stepId: UUID;
      users: number;
      dropoffRate: number;
      conversionRate: number;
    }>;
  };
  ownerId?: UUID;
}

export interface Cohort extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  definition: {
    type: "signup" | "first_action" | "behavior" | "revenue" | "custom";
    dateRange: {
      start: ISODate;
      end: ISODate;
    };
    conditions?: Array<{
      field: string;
      operator: "eq" | "contains" | "gte" | "lte";
      value?: unknown;
    }>;
  };
  analysis?: {
    retentionRates: Array<{
      period: number;
      rate: number;
      count: number;
    }>;
    revenueMetrics?: {
      ltv: number;
      arpu: number;
    };
  };
  ownerId?: UUID;
}

export interface Segment extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  conditions: Array<{
    field: string;
    operator: "eq" | "contains" | "gte" | "lte" | "in" | "exists";
    value?: unknown;
    logical?: "AND" | "OR";
  }>;
  userCount?: number;
  ownerId?: UUID;
}

export interface AlertRule extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  metricId?: UUID;
  kpiId?: UUID;
  eventName?: string;
  condition: {
    type: "threshold" | "anomaly" | "change" | "trend";
    operator: "gt" | "lt" | "eq" | "gte" | "lte" | "change_pct";
    value: number;
    window?: number;
  };
  notificationChannels: Array<{
    type: "email" | "webhook" | "slack" | "dashboard";
    target: string;
  }>;
  cooldownMinutes?: number;
  lastTriggeredAt?: ISODate;
  triggerCount?: number;
  ownerId?: UUID;
}

export interface Alert extends BaseEntity {
  alertRuleId: UUID;
  status: "fired" | "acknowledged" | "resolved";
  firedAt: ISODate;
  resolvedAt?: ISODate;
  currentValue?: number;
  thresholdValue?: number;
  message?: string;
  acknowledgedBy?: UUID;
  acknowledgedAt?: ISODate;
}

export interface Forecast extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  targetMetricId?: UUID;
  targetKpiId?: UUID;
  method: "linear" | "moving_average" | "exponential" | "seasonal" | "ml";
  horizon: number;
  horizonUnit: "day" | "week" | "month" | "quarter" | "year";
  dateRange: {
    start: ISODate;
    end: ISODate;
  };
  predictions?: Array<{
    date: ISODate;
    value: number;
    confidence: number;
    lower: number;
    upper: number;
  }>;
  accuracy?: {
    mape?: number;
    mae?: number;
    rmse?: number;
  };
  ownerId?: UUID;
}

export interface Goal extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: "active" | "achieved" | "missed" | "archived";
  type: "kpi" | "okr" | "target" | "milestone";
  targetValue: number;
  currentValue?: number;
  unit?: string;
  startDate: ISODate;
  endDate: ISODate;
  ownerId?: UUID;
  assigneeId?: UUID;
  linkedKpiId?: UUID;
  metadata: Record<string, unknown>;
}

export interface Insight extends BaseEntity {
  type: "anomaly" | "trend" | "opportunity" | "risk" | "recommendation" | "summary";
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  data: Record<string, unknown>;
  recommendation?: string;
  relatedEntities?: Array<{
    type: "metric" | "kpi" | "event" | "dashboard" | "report";
    id: UUID;
    name: string;
  }>;
  generatedBy: "system" | "ai" | "manual";
}

export interface AttributionModel extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "first_touch" | "last_touch" | "linear" | "time_decay" | "position_based" | "data_driven" | "custom";
  config: Record<string, unknown>;
  isDefault: boolean;
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

export interface AnalyticsOverview {
  dashboards: { total: number; active: number };
  kpis: { total: number; active: number; breached: number };
  reports: { total: number; scheduled: number };
  events: { total: number; today: number };
  funnels: { total: number };
  cohorts: { total: number };
  segments: { total: number };
  alerts: { total: number; fired: number };
  forecasts: { total: number };
  goals: { total: number; achieved: number };
  insights: { total: number; critical: number };
}

export interface AnalyticsState {
  dashboards: Dashboard[];
  metrics: MetricDefinition[];
  kpis: KPI[];
  reports: Report[];
  dataSources: DataSource[];
  eventSchemas: EventSchema[];
  events: AnalyticsEvent[];
  funnels: Funnel[];
  cohorts: Cohort[];
  segments: Segment[];
  alertRules: AlertRule[];
  alerts: Alert[];
  forecasts: Forecast[];
  goals: Goal[];
  insights: Insight[];
  attributionModels: AttributionModel[];
  auditLogs: AuditLog[];
}
