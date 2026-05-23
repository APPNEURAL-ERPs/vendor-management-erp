import { DataStore } from "./core/datastore";
import { newId, nowIso, slugify } from "./core/id";
import { badRequest, notFound } from "./core/utils";
import {
  RequestActor,
  Dashboard,
  Widget,
  KPI,
  Metric,
  Report,
  AnalyticsEvent,
  Funnel,
  Cohort,
  Segment,
  AlertRule,
  Forecast,
  AttributionModel,
  DataSource,
  Insight,
  ExportJob,
  FunnelResult,
  FunnelStepResult,
  CohortResult,
  CohortData,
  AnalyticsOverview,
} from "./domain";

export class AnalyticsService {
  constructor(private readonly store: DataStore) {}

  getOverview(tenantId: string): AnalyticsOverview {
    const state = this.store.getState();

    return {
      dashboards: {
        total: state.dashboards.filter((d) => d.tenantId === tenantId).length,
        active: state.dashboards.filter(
          (d) => d.tenantId === tenantId && d.status === "active"
        ).length,
      },
      kpis: {
        total: state.kpis.filter((k) => k.tenantId === tenantId).length,
        onTrack: state.kpis.filter((k) => k.tenantId === tenantId && k.status === "active").length,
      },
      reports: {
        total: state.reports.filter((r) => r.tenantId === tenantId).length,
        scheduled: state.reports.filter(
          (r) => r.tenantId === tenantId && r.schedule?.enabled
        ).length,
      },
      events: {
        total: state.events.filter((e) => e.tenantId === tenantId).length,
        last24h: this.countEventsLast24Hours(tenantId),
      },
      funnels: {
        total: state.funnels.filter((f) => f.tenantId === tenantId).length,
      },
      cohorts: {
        total: state.cohorts.filter((c) => c.tenantId === tenantId).length,
      },
      segments: {
        total: state.segments.filter((s) => s.tenantId === tenantId).length,
      },
      alerts: {
        total: state.alerts.filter((a) => a.tenantId === tenantId).length,
        triggered: state.alerts.filter(
          (a) => a.tenantId === tenantId && a.status === "triggered"
        ).length,
      },
      forecasts: {
        total: state.forecasts.filter((f) => f.tenantId === tenantId).length,
      },
      attributionModels: {
        total: state.attributionModels.filter((a) => a.tenantId === tenantId).length,
      },
      dataSources: {
        total: state.dataSources.filter((d) => d.tenantId === tenantId).length,
        connected: state.dataSources.filter(
          (d) => d.tenantId === tenantId && d.status === "active"
        ).length,
      },
      insights: {
        total: state.insights.filter((i) => i.tenantId === tenantId).length,
        unresolved: state.insights.filter(
          (i) => i.tenantId === tenantId && !i.resolvedAt
        ).length,
      },
    };
  }

  private countEventsLast24Hours(tenantId: string): number {
    const state = this.store.getState();
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return state.events.filter(
      (e) =>
        e.tenantId === tenantId &&
        new Date(e.createdAt).getTime() > yesterday.getTime()
    ).length;
  }

  listDashboards(tenantId: string): Dashboard[] {
    return this.store.dashboards.findAll(tenantId);
  }

  createDashboard(actor: RequestActor, body: Partial<Dashboard>): Dashboard {
    const key = slugify(body.name ?? "dashboard");
    const dashboard: Dashboard = {
      id: newId("dash"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: body.name ?? "New Dashboard",
      description: body.description,
      status: body.status ?? "active",
      tags: body.tags ?? [],
      layout: body.layout ?? { columns: 12, rows: 6, widgets: [] },
      ownerId: actor.userId,
      sharedWith: body.sharedWith ?? [],
      refreshInterval: body.refreshInterval,
      filters: body.filters,
    };

    this.store.dashboards.create(dashboard);
    this.store.audit(actor, "create", "dashboard", dashboard.id);
    return dashboard;
  }

  getDashboard(actor: RequestActor, id: string): Dashboard {
    const dashboard = this.store.dashboards.findById(id);
    if (!dashboard || dashboard.tenantId !== actor.tenantId) {
      notFound(`Dashboard ${id} not found`);
    }
    return dashboard;
  }

  updateDashboard(
    actor: RequestActor,
    id: string,
    updates: Partial<Dashboard>
  ): Dashboard {
    const existing = this.getDashboard(actor, id);
    const updated = this.store.dashboards.update(id, updates);
    this.store.audit(actor, "update", "dashboard", id, existing, updated);
    return updated!;
  }

  deleteDashboard(actor: RequestActor, id: string): boolean {
    const existing = this.getDashboard(actor, id);
    const result = this.store.dashboards.delete(id);
    this.store.audit(actor, "delete", "dashboard", id, existing);
    return result;
  }

  listWidgets(dashboardId: string): Widget[] {
    return this.store.widgets.findAll(dashboardId);
  }

  createWidget(actor: RequestActor, body: Partial<Widget>): Widget {
    const widget: Widget = {
      id: newId("widget"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      dashboardId: body.dashboardId!,
      key: slugify(body.name ?? "widget"),
      name: body.name ?? "New Widget",
      description: body.description,
      type: body.type ?? "chart",
      chartType: body.chartType,
      metricId: body.metricId,
      kpiId: body.kpiId,
      funnelId: body.funnelId,
      cohortId: body.cohortId,
      config: body.config ?? {},
      position: body.position ?? { widgetId: newId("widget"), x: 0, y: 0, w: 4, h: 3 },
    };

    this.store.widgets.create(widget);
    this.store.audit(actor, "create", "widget", widget.id);
    return widget;
  }

  updateWidget(
    actor: RequestActor,
    id: string,
    updates: Partial<Widget>
  ): Widget {
    const existing = this.store.widgets.findById(id);
    if (!existing) {
      notFound(`Widget ${id} not found`);
    }
    const updated = this.store.widgets.update(id, updates);
    this.store.audit(actor, "update", "widget", id, existing, updated);
    return updated!;
  }

  deleteWidget(actor: RequestActor, id: string): boolean {
    const existing = this.store.widgets.findById(id);
    if (!existing) {
      notFound(`Widget ${id} not found`);
    }
    const result = this.store.widgets.delete(id);
    this.store.audit(actor, "delete", "widget", id, existing);
    return result;
  }

  listKPIs(tenantId: string): KPI[] {
    return this.store.kpis.findAll(tenantId);
  }

  createKPI(actor: RequestActor, body: Partial<KPI>): KPI {
    const kpi: KPI = {
      id: newId("kpi"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: slugify(body.name ?? "kpi"),
      name: body.name ?? "New KPI",
      description: body.description,
      status: body.status ?? "active",
      metricId: body.metricId!,
      target: body.target ?? 0,
      current: body.current ?? 0,
      unit: body.unit ?? "%",
      aggregation: body.aggregation ?? "sum",
      direction: body.direction ?? "higher_is_better",
      ownerId: body.ownerId,
      category: body.category ?? "general",
      tags: body.tags ?? [],
      thresholds: body.thresholds,
      history: body.history,
    };

    this.store.kpis.create(kpi);
    this.store.audit(actor, "create", "kpi", kpi.id);
    return kpi;
  }

  getKPI(actor: RequestActor, id: string): KPI {
    const kpi = this.store.kpis.findById(id);
    if (!kpi || kpi.tenantId !== actor.tenantId) {
      notFound(`KPI ${id} not found`);
    }
    return kpi;
  }

  updateKPI(actor: RequestActor, id: string, updates: Partial<KPI>): KPI {
    const existing = this.getKPI(actor, id);
    const updated = this.store.kpis.update(id, updates);
    this.store.audit(actor, "update", "kpi", id, existing, updated);
    return updated!;
  }

  deleteKPI(actor: RequestActor, id: string): boolean {
    const existing = this.getKPI(actor, id);
    const result = this.store.kpis.delete(id);
    this.store.audit(actor, "delete", "kpi", id, existing);
    return result;
  }

  listMetrics(tenantId: string): Metric[] {
    return this.store.metrics.findAll(tenantId);
  }

  createMetric(actor: RequestActor, body: Partial<Metric>): Metric {
    const metric: Metric = {
      id: newId("metric"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: slugify(body.name ?? "metric"),
      name: body.name ?? "New Metric",
      description: body.description,
      status: body.status ?? "active",
      formula: body.formula ?? "",
      aggregation: body.aggregation ?? "sum",
      unit: body.unit ?? "",
      dataSourceId: body.dataSourceId,
      category: body.category ?? "general",
      tags: body.tags ?? [],
      format: body.format ?? "number",
      freshness: body.freshness ?? "daily",
    };

    this.store.metrics.create(metric);
    this.store.audit(actor, "create", "metric", metric.id);
    return metric;
  }

  getMetric(actor: RequestActor, id: string): Metric {
    const metric = this.store.metrics.findById(id);
    if (!metric || metric.tenantId !== actor.tenantId) {
      notFound(`Metric ${id} not found`);
    }
    return metric;
  }

  updateMetric(actor: RequestActor, id: string, updates: Partial<Metric>): Metric {
    const existing = this.getMetric(actor, id);
    const updated = this.store.metrics.update(id, updates);
    this.store.audit(actor, "update", "metric", id, existing, updated);
    return updated!;
  }

  deleteMetric(actor: RequestActor, id: string): boolean {
    const existing = this.getMetric(actor, id);
    const result = this.store.metrics.delete(id);
    this.store.audit(actor, "delete", "metric", id, existing);
    return result;
  }

  listReports(tenantId: string): Report[] {
    return this.store.reports.findAll(tenantId);
  }

  createReport(actor: RequestActor, body: Partial<Report>): Report {
    const report: Report = {
      id: newId("report"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: slugify(body.name ?? "report"),
      name: body.name ?? "New Report",
      description: body.description,
      status: body.status ?? "active",
      type: body.type ?? "custom",
      dashboardIds: body.dashboardIds ?? [],
      kpiIds: body.kpiIds ?? [],
      sections: body.sections ?? [],
      schedule: body.schedule,
      format: body.format ?? "pdf",
      ownerId: actor.userId,
      tags: body.tags ?? [],
      lastGeneratedAt: body.lastGeneratedAt,
    };

    this.store.reports.create(report);
    this.store.audit(actor, "create", "report", report.id);
    return report;
  }

  getReport(actor: RequestActor, id: string): Report {
    const report = this.store.reports.findById(id);
    if (!report || report.tenantId !== actor.tenantId) {
      notFound(`Report ${id} not found`);
    }
    return report;
  }

  updateReport(actor: RequestActor, id: string, updates: Partial<Report>): Report {
    const existing = this.getReport(actor, id);
    const updated = this.store.reports.update(id, updates);
    this.store.audit(actor, "update", "report", id, existing, updated);
    return updated!;
  }

  deleteReport(actor: RequestActor, id: string): boolean {
    const existing = this.getReport(actor, id);
    const result = this.store.reports.delete(id);
    this.store.audit(actor, "delete", "report", id, existing);
    return result;
  }

  trackEvent(actor: RequestActor, body: Partial<AnalyticsEvent>): AnalyticsEvent {
    const event: AnalyticsEvent = {
      id: newId("evt"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type: body.type ?? "unknown",
      source: body.source ?? "AnalyticsOS",
      userId: body.userId,
      data: body.data ?? {},
      sessionId: body.sessionId,
      ipAddress: body.ipAddress,
      userAgent: body.userAgent,
    };

    this.store.events.create(event);
    this.evaluateAlerts(event);
    return event;
  }

  private evaluateAlerts(event: AnalyticsEvent): void {
    const state = this.store.getState();
    const activeAlerts = state.alerts.filter((a) => a.status === "active");

    for (const alert of activeAlerts) {
      if (this.shouldTriggerAlert(alert, event)) {
        this.store.alerts.update(alert.id, {
          status: "triggered",
          triggeredAt: nowIso(),
        });

        const insight: Insight = {
          id: newId("insight"),
          tenantId: alert.tenantId,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          type: "anomaly",
          title: `Alert: ${alert.name}`,
          description: alert.description ?? `Alert triggered for ${alert.condition.metric}`,
          severity: "warning",
          metricId: alert.metricId,
          kpiId: alert.kpiId,
          data: {
            alertId: alert.id,
            metric: alert.condition.metric,
            threshold: alert.condition.threshold,
          },
        };

        this.store.insights.create(insight);
      }
    }
  }

  private shouldTriggerAlert(alert: AlertRule, event: AnalyticsEvent): boolean {
    return true;
  }

  listEvents(tenantId: string, limit: number): AnalyticsEvent[] {
    return this.store.events.findAll(tenantId, limit);
  }

  listFunnels(tenantId: string): Funnel[] {
    return this.store.funnels.findAll(tenantId);
  }

  createFunnel(actor: RequestActor, body: Partial<Funnel>): Funnel {
    const funnel: Funnel = {
      id: newId("funnel"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: slugify(body.name ?? "funnel"),
      name: body.name ?? "New Funnel",
      description: body.description,
      status: body.status ?? "active",
      steps: body.steps ?? [],
      conversionWindow: body.conversionWindow ?? 30,
      ownerId: body.ownerId,
      tags: body.tags ?? [],
    };

    this.store.funnels.create(funnel);
    this.store.audit(actor, "create", "funnel", funnel.id);
    return funnel;
  }

  getFunnel(actor: RequestActor, id: string): Funnel {
    const funnel = this.store.funnels.findById(id);
    if (!funnel || funnel.tenantId !== actor.tenantId) {
      notFound(`Funnel ${id} not found`);
    }
    return funnel;
  }

  analyzeFunnel(id: string, body: any): FunnelResult {
    const funnel = this.store.funnels.findById(id);
    if (!funnel) {
      notFound(`Funnel ${id} not found`);
    }

    const steps: FunnelStepResult[] = funnel.steps.map((step, index) => {
      const users = Math.floor(Math.random() * 1000) + 500;
      const conversionRate = index === 0 ? 100 : Math.random() * 60 + 40;
      const dropoffRate = 100 - conversionRate;

      return {
        step,
        users,
        conversionRate: Math.round(conversionRate * 100) / 100,
        dropoffRate: Math.round(dropoffRate * 100) / 100,
      };
    });

    const overallConversion =
      steps.length > 0
        ? steps[steps.length - 1].conversionRate
        : 0;

    return {
      funnelId: id,
      steps,
      overallConversion: Math.round(overallConversion * 100) / 100,
      dateRange: {
        start: body.startDate ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: body.endDate ?? new Date().toISOString(),
      },
      segment: body.segment,
    };
  }

  updateFunnel(actor: RequestActor, id: string, updates: Partial<Funnel>): Funnel {
    const existing = this.getFunnel(actor, id);
    const updated = this.store.funnels.update(id, updates);
    this.store.audit(actor, "update", "funnel", id, existing, updated);
    return updated!;
  }

  deleteFunnel(actor: RequestActor, id: string): boolean {
    const existing = this.getFunnel(actor, id);
    const result = this.store.funnels.delete(id);
    this.store.audit(actor, "delete", "funnel", id, existing);
    return result;
  }

  listCohorts(tenantId: string): Cohort[] {
    return this.store.cohorts.findAll(tenantId);
  }

  createCohort(actor: RequestActor, body: Partial<Cohort>): Cohort {
    const cohort: Cohort = {
      id: newId("cohort"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: slugify(body.name ?? "cohort"),
      name: body.name ?? "New Cohort",
      description: body.description,
      status: body.status ?? "active",
      type: body.type ?? "retention",
      definition: body.definition ?? {
        cohortBy: "signup_date",
        actions: [],
        grouping: "month",
      },
      dateRange: body.dateRange ?? {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
      ownerId: body.ownerId,
      tags: body.tags ?? [],
    };

    this.store.cohorts.create(cohort);
    this.store.audit(actor, "create", "cohort", cohort.id);
    return cohort;
  }

  getCohort(actor: RequestActor, id: string): Cohort {
    const cohort = this.store.cohorts.findById(id);
    if (!cohort || cohort.tenantId !== actor.tenantId) {
      notFound(`Cohort ${id} not found`);
    }
    return cohort;
  }

  analyzeCohort(id: string, body: any): CohortResult {
    const cohort = this.store.cohorts.findById(id);
    if (!cohort) {
      notFound(`Cohort ${id} not found`);
    }

    const cohorts: CohortData[] = [];
    const months = 6;
    for (let i = 0; i < months; i++) {
      const retention = [];
      for (let j = 0; j <= i; j++) {
        retention.push(Math.random() * 40 + 60);
      }
      cohorts.push({
        cohortDate: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString(),
        size: Math.floor(Math.random() * 500) + 100,
        retention: retention.map((r) => Math.round(r * 100) / 100),
      });
    }

    return {
      cohortId: id,
      cohorts,
      dateRange: cohort.dateRange,
    };
  }

  updateCohort(actor: RequestActor, id: string, updates: Partial<Cohort>): Cohort {
    const existing = this.getCohort(actor, id);
    const updated = this.store.cohorts.update(id, updates);
    this.store.audit(actor, "update", "cohort", id, existing, updated);
    return updated!;
  }

  deleteCohort(actor: RequestActor, id: string): boolean {
    const existing = this.getCohort(actor, id);
    const result = this.store.cohorts.delete(id);
    this.store.audit(actor, "delete", "cohort", id, existing);
    return result;
  }

  listSegments(tenantId: string): Segment[] {
    return this.store.segments.findAll(tenantId);
  }

  createSegment(actor: RequestActor, body: Partial<Segment>): Segment {
    const segment: Segment = {
      id: newId("segment"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: slugify(body.name ?? "segment"),
      name: body.name ?? "New Segment",
      description: body.description,
      status: body.status ?? "active",
      type: body.type ?? "user",
      rules: body.rules ?? [],
      ownerId: body.ownerId,
      tags: body.tags ?? [],
    };

    this.store.segments.create(segment);
    this.store.audit(actor, "create", "segment", segment.id);
    return segment;
  }

  getSegment(actor: RequestActor, id: string): Segment {
    const segment = this.store.segments.findById(id);
    if (!segment || segment.tenantId !== actor.tenantId) {
      notFound(`Segment ${id} not found`);
    }
    return segment;
  }

  updateSegment(actor: RequestActor, id: string, updates: Partial<Segment>): Segment {
    const existing = this.getSegment(actor, id);
    const updated = this.store.segments.update(id, updates);
    this.store.audit(actor, "update", "segment", id, existing, updated);
    return updated!;
  }

  deleteSegment(actor: RequestActor, id: string): boolean {
    const existing = this.getSegment(actor, id);
    const result = this.store.segments.delete(id);
    this.store.audit(actor, "delete", "segment", id, existing);
    return result;
  }

  listAlerts(tenantId: string): AlertRule[] {
    return this.store.alerts.findAll(tenantId);
  }

  createAlert(actor: RequestActor, body: Partial<AlertRule>): AlertRule {
    const alert: AlertRule = {
      id: newId("alert"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: slugify(body.name ?? "alert"),
      name: body.name ?? "New Alert",
      description: body.description,
      status: body.status ?? "active",
      metricId: body.metricId,
      kpiId: body.kpiId,
      condition: body.condition ?? {
        metric: "",
        operator: "gt",
        threshold: 0,
      },
      notificationChannels: body.notificationChannels ?? ["email"],
      ownerId: body.ownerId,
      triggeredAt: body.triggeredAt,
      resolvedAt: body.resolvedAt,
    };

    this.store.alerts.create(alert);
    this.store.audit(actor, "create", "alert", alert.id);
    return alert;
  }

  getAlert(actor: RequestActor, id: string): AlertRule {
    const alert = this.store.alerts.findById(id);
    if (!alert || alert.tenantId !== actor.tenantId) {
      notFound(`Alert ${id} not found`);
    }
    return alert;
  }

  updateAlert(actor: RequestActor, id: string, updates: Partial<AlertRule>): AlertRule {
    const existing = this.getAlert(actor, id);
    const updated = this.store.alerts.update(id, updates);
    this.store.audit(actor, "update", "alert", id, existing, updated);
    return updated!;
  }

  deleteAlert(actor: RequestActor, id: string): boolean {
    const existing = this.getAlert(actor, id);
    const result = this.store.alerts.delete(id);
    this.store.audit(actor, "delete", "alert", id, existing);
    return result;
  }

  listForecasts(tenantId: string): Forecast[] {
    return this.store.forecasts.findAll(tenantId);
  }

  createForecast(actor: RequestActor, body: Partial<Forecast>): Forecast {
    const forecast: Forecast = {
      id: newId("forecast"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: slugify(body.name ?? "forecast"),
      name: body.name ?? "New Forecast",
      description: body.description,
      status: body.status ?? "active",
      metricId: body.metricId!,
      model: body.model ?? "linear",
      horizon: body.horizon ?? 30,
      confidence: body.confidence ?? 0.95,
      data: body.data ?? [],
      predictions: body.predictions ?? [],
      ownerId: body.ownerId,
      tags: body.tags ?? [],
    };

    this.store.forecasts.create(forecast);
    this.store.audit(actor, "create", "forecast", forecast.id);
    return forecast;
  }

  getForecast(actor: RequestActor, id: string): Forecast {
    const forecast = this.store.forecasts.findById(id);
    if (!forecast || forecast.tenantId !== actor.tenantId) {
      notFound(`Forecast ${id} not found`);
    }
    return forecast;
  }

  listAttributionModels(tenantId: string): AttributionModel[] {
    return this.store.attributionModels.findAll(tenantId);
  }

  createAttributionModel(actor: RequestActor, body: Partial<AttributionModel>): AttributionModel {
    const model: AttributionModel = {
      id: newId("attr"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: slugify(body.name ?? "attribution"),
      name: body.name ?? "New Attribution Model",
      description: body.description,
      type: body.type ?? "last_touch",
      status: body.status ?? "active",
      config: body.config ?? {},
      touchpoints: body.touchpoints ?? [],
      ownerId: body.ownerId,
    };

    this.store.attributionModels.create(model);
    this.store.audit(actor, "create", "attribution", model.id);
    return model;
  }

  listDataSources(tenantId: string): DataSource[] {
    return this.store.dataSources.findAll(tenantId);
  }

  createDataSource(actor: RequestActor, body: Partial<DataSource>): DataSource {
    const dataSource: DataSource = {
      id: newId("ds"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: slugify(body.name ?? "datasource"),
      name: body.name ?? "New Data Source",
      description: body.description,
      type: body.type ?? "api",
      status: body.status ?? "active",
      config: body.config ?? {},
      maskedCredentials: body.maskedCredentials,
      lastSyncAt: body.lastSyncAt,
      syncStatus: body.syncStatus ?? "idle",
      ownerId: body.ownerId,
      tags: body.tags ?? [],
    };

    this.store.dataSources.create(dataSource);
    this.store.audit(actor, "create", "data_source", dataSource.id);
    return dataSource;
  }

  listInsights(tenantId: string): Insight[] {
    return this.store.insights.findAll(tenantId);
  }

  listAuditLogs(tenantId: string, limit: number): any[] {
    const state = this.store.getState();
    return state.auditLogs
      .filter((log) => log.tenantId === tenantId)
      .slice(0, limit);
  }

  query(body: any): any {
    return {
      query: body.query,
      results: [],
      metadata: {
        executedAt: nowIso(),
        duration: 0,
      },
    };
  }

  exportData(actor: RequestActor, body: any): ExportJob {
    const job: ExportJob = {
      id: newId("export"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type: body.type ?? "data",
      format: body.format ?? "csv",
      status: "pending",
      resourceId: body.resourceId ?? "",
      resourceType: body.resourceType ?? "unknown",
      requestedBy: actor.userId,
    };

    this.store.exportJobs.create(job);
    this.store.audit(actor, "export", "data", job.id);

    setTimeout(() => {
      this.store.exportJobs.update(job.id, {
        status: "completed",
        fileUrl: `/exports/${job.id}.${body.format ?? "csv"}`,
      });
    }, 1000);

    return job;
  }
}
