export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "analytics_admin" | "analyst" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";
export type AlertStatus = "active" | "triggered" | "resolved" | "disabled";
export type ChartType = "line" | "bar" | "pie" | "area" | "funnel" | "gauge" | "table" | "number";
export type ExportFormat = "csv" | "pdf" | "excel" | "json";
export type AttributionType = "first_touch" | "last_touch" | "linear" | "time_decay" | "position_based" | "data_driven";

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

export interface Dashboard extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  tags: string[];
  layout: DashboardLayout;
  ownerId: UUID;
  sharedWith: UUID[];
  refreshInterval?: number;
  filters?: DashboardFilter[];
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  widgets: WidgetPosition[];
}

export interface WidgetPosition {
  widgetId: UUID;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardFilter {
  field: string;
  operator: "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "contains";
  value: unknown;
}

export interface Widget extends BaseEntity {
  dashboardId: UUID;
  key: string;
  name: string;
  description?: string;
  type: "chart" | "kpi" | "table" | "funnel" | "cohort" | "metric";
  chartType?: ChartType;
  metricId?: UUID;
  kpiId?: UUID;
  funnelId?: UUID;
  cohortId?: UUID;
  config: WidgetConfig;
  position: WidgetPosition;
}

export interface WidgetConfig {
  title?: string;
  dataSource?: UUID;
  metric?: string;
  formula?: string;
  aggregation?: "sum" | "avg" | "count" | "min" | "max";
  dateRange?: "today" | "7d" | "30d" | "90d" | "custom";
  filters?: Record<string, unknown>;
  colors?: string[];
  showLegend?: boolean;
  showTrend?: boolean;
  thresholds?: number[];
  format?: "number" | "currency" | "percent" | "duration";
}

export interface KPI extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  metricId: UUID;
  target: number;
  current: number;
  unit: string;
  aggregation: "sum" | "avg" | "count" | "min" | "max" | "last";
  direction: "higher_is_better" | "lower_is_better";
  ownerId?: UUID;
  category: string;
  tags: string[];
  thresholds?: KPIThreshold[];
  history?: KPIHistoryPoint[];
}

export interface KPIThreshold {
  label: string;
  min?: number;
  max?: number;
  color: string;
}

export interface KPIHistoryPoint {
  timestamp: ISODate;
  value: number;
}

export interface Metric extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  formula: string;
  aggregation: "sum" | "avg" | "count" | "min" | "max" | "last";
  unit: string;
  dataSourceId?: UUID;
  category: string;
  tags: string[];
  format?: "number" | "currency" | "percent" | "duration";
  freshness?: "realtime" | "hourly" | "daily" | "weekly";
}

export interface Report extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  type: "executive" | "operational" | "financial" | "marketing" | "sales" | "support" | "custom";
  dashboardIds: UUID[];
  kpiIds: UUID[];
  sections: ReportSection[];
  schedule?: ReportSchedule;
  format: ExportFormat;
  ownerId: UUID;
  tags: string[];
  lastGeneratedAt?: ISODate;
}

export interface ReportSection {
  title: string;
  type: "summary" | "chart" | "table" | "kpi" | "text";
  content: string;
  widgetId?: UUID;
  kpiIds?: UUID[];
}

export interface ReportSchedule {
  frequency: "daily" | "weekly" | "monthly" | "quarterly";
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  recipients: string[];
  enabled: boolean;
}

export interface AnalyticsEvent extends BaseEntity {
  type: string;
  source: string;
  userId?: UUID;
  data: Record<string, unknown>;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface Funnel extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  steps: FunnelStep[];
  conversionWindow?: number;
  ownerId?: UUID;
  tags: string[];
}

export interface FunnelStep {
  name: string;
  event: string;
  filters?: Record<string, unknown>;
  order: number;
}

export interface FunnelResult {
  funnelId: UUID;
  steps: FunnelStepResult[];
  overallConversion: number;
  dateRange: { start: ISODate; end: ISODate };
  segment?: string;
}

export interface FunnelStepResult {
  step: FunnelStep;
  users: number;
  conversionRate: number;
  dropoffRate: number;
}

export interface Cohort extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  type: "retention" | "revenue" | "behavior" | "signup";
  definition: CohortDefinition;
  dateRange: { start: ISODate; end: ISODate };
  ownerId?: UUID;
  tags: string[];
}

export interface CohortDefinition {
  cohortBy: "signup_date" | "first_purchase" | "first_action";
  actions: CohortAction[];
  grouping: "day" | "week" | "month";
}

export interface CohortAction {
  event: string;
  filters?: Record<string, unknown>;
  window?: number;
}

export interface CohortResult {
  cohortId: UUID;
  cohorts: CohortData[];
  dateRange: { start: ISODate; end: ISODate };
}

export interface CohortData {
  cohortDate: ISODate;
  size: number;
  retention: number[];
  revenue?: number[];
}

export interface Segment extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  type: "user" | "customer" | "tenant" | "behavior";
  rules: SegmentRule[];
  ownerId?: UUID;
  tags: string[];
}

export interface SegmentRule {
  field: string;
  operator: "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "contains" | "exists" | "not_exists";
  value?: unknown;
  logical?: "and" | "or";
}

export interface AlertRule extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: AlertStatus;
  metricId?: UUID;
  kpiId?: UUID;
  condition: AlertCondition;
  notificationChannels: string[];
  ownerId?: UUID;
  triggeredAt?: ISODate;
  resolvedAt?: ISODate;
}

export interface AlertCondition {
  metric: string;
  operator: "gt" | "lt" | "gte" | "lte" | "eq" | "change_pct";
  threshold: number;
  comparisonWindow?: number;
  changePercent?: number;
}

export interface AlertEvent extends BaseEntity {
  alertId: UUID;
  status: AlertStatus;
  metricValue: number;
  threshold: number;
  message: string;
}

export interface Forecast extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  metricId: UUID;
  model: "linear" | "moving_average" | "exponential_smoothing" | "linear_regression";
  horizon: number;
  confidence: number;
  data: ForecastDataPoint[];
  predictions: ForecastDataPoint[];
  ownerId?: UUID;
  tags: string[];
}

export interface ForecastDataPoint {
  timestamp: ISODate;
  value: number;
  predicted?: boolean;
  lowerBound?: number;
  upperBound?: number;
}

export interface AttributionModel extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: AttributionType;
  status: EntityStatus;
  config: AttributionConfig;
  touchpoints: AttributionTouchpoint[];
  ownerId?: UUID;
}

export interface AttributionConfig {
  lookbackWindow?: number;
  weighting?: Record<string, number>;
}

export interface AttributionTouchpoint {
  name: string;
  event: string;
  weight?: number;
}

export interface AttributionResult {
  modelId: UUID;
  conversionId: string;
  revenue: number;
  touchpoints: AttributionTouchpointResult[];
  dateRange: { start: ISODate; end: ISODate };
}

export interface AttributionTouchpointResult {
  touchpoint: AttributionTouchpoint;
  attributedValue: number;
  percentage: number;
}

export interface DataSource extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "api" | "database" | "file" | "webhook" | "integration";
  status: EntityStatus;
  config: Record<string, unknown>;
  maskedCredentials?: string;
  lastSyncAt?: ISODate;
  syncStatus?: "idle" | "syncing" | "error";
  ownerId?: UUID;
  tags: string[];
}

export interface Insight extends BaseEntity {
  type: "anomaly" | "trend" | "correlation" | "recommendation";
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  metricId?: UUID;
  kpiId?: UUID;
  data: Record<string, unknown>;
  recommendations?: string[];
  resolvedAt?: ISODate;
}

export interface ExportJob extends BaseEntity {
  type: "report" | "dashboard" | "data";
  format: ExportFormat;
  status: "pending" | "processing" | "completed" | "failed";
  resourceId: UUID;
  resourceType: string;
  fileUrl?: string;
  error?: string;
  requestedBy: UUID;
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

export interface AnalyticsEvent extends BaseEntity {
  type: string;
  source: string;
  userId?: UUID;
  data: Record<string, unknown>;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AnalyticsOverview {
  dashboards: { total: number; active: number };
  kpis: { total: number; onTrack: number };
  reports: { total: number; scheduled: number };
  events: { total: number; last24h: number };
  funnels: { total: number };
  cohorts: { total: number };
  segments: { total: number };
  alerts: { total: number; triggered: number };
  forecasts: { total: number };
  attributionModels: { total: number };
  dataSources: { total: number; connected: number };
  insights: { total: number; unresolved: number };
}

export interface AnalyticsState {
  dashboards: Dashboard[];
  widgets: Widget[];
  kpis: KPI[];
  metrics: Metric[];
  reports: Report[];
  events: AnalyticsEvent[];
  funnels: Funnel[];
  cohorts: Cohort[];
  segments: Segment[];
  alerts: AlertRule[];
  forecasts: Forecast[];
  attributionModels: AttributionModel[];
  dataSources: DataSource[];
  insights: Insight[];
  exportJobs: ExportJob[];
  auditLogs: AuditLog[];
}

export function emptyState(): AnalyticsState {
  return {
    dashboards: [],
    widgets: [],
    kpis: [],
    metrics: [],
    reports: [],
    events: [],
    funnels: [],
    cohorts: [],
    segments: [],
    alerts: [],
    forecasts: [],
    attributionModels: [],
    dataSources: [],
    insights: [],
    exportJobs: [],
    auditLogs: [],
  };
}
