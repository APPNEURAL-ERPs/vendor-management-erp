import {
  AlertIncident,
  AlertIncidentStatus,
  AlertRule,
  AnalyticsRecord,
  Dashboard,
  DashboardWidget,
  DataSource,
  DataSourceType,
  EntityStatus,
  ExportFormat,
  ExportJob,
  FilterCondition,
  KpiDefinition,
  KpiSnapshot,
  MetricCalculationResult,
  MetricDefinition,
  ReportDefinition,
  RequestActor
} from "../core/domain";
import { badRequest, conflict, notFound } from "../core/errors";
import { newId, nowIso } from "../core/id";
import { clone, compareAlert, ensureNumber, ensureString, toCsv } from "../core/utils";
import { DataStore } from "../core/datastore";
import { EventBus } from "../core/event-bus";
import { AggregationEngine, MetricCalculateOptions, RecordQuery } from "../engines/aggregation-engine";
import { KpiEngine } from "../engines/kpi-engine";
import { ExportEngine } from "../engines/export-engine";

export class AnalyticsService {
  private readonly aggregation = new AggregationEngine();
  private readonly kpiEngine = new KpiEngine();
  private readonly exportEngine = new ExportEngine();

  constructor(private readonly store: DataStore, private readonly events: EventBus) {}

  overview(actor: RequestActor): unknown {
    const state = this.store.getState();
    const tenantId = actor.tenantId;
    const kpis = state.kpis.filter((item) => item.tenantId === tenantId && item.status === "active").slice(0, 8);
    const snapshots = kpis.map((kpi) => this.calculateKpi(actor, kpi.id));
    return {
      counts: {
        dataSources: state.dataSources.filter((item) => item.tenantId === tenantId && item.status !== "archived").length,
        records: state.records.filter((item) => item.tenantId === tenantId).length,
        metrics: state.metrics.filter((item) => item.tenantId === tenantId && item.status !== "archived").length,
        kpis: state.kpis.filter((item) => item.tenantId === tenantId && item.status !== "archived").length,
        dashboards: state.dashboards.filter((item) => item.tenantId === tenantId && item.status !== "archived").length,
        reports: state.reports.filter((item) => item.tenantId === tenantId && item.status !== "archived").length,
        openIncidents: state.alertIncidents.filter((item) => item.tenantId === tenantId && item.status === "open").length
      },
      kpis: snapshots,
      recentIncidents: state.alertIncidents.filter((item) => item.tenantId === tenantId).slice(0, 5),
      recentEvents: state.events.filter((item) => item.tenantId === tenantId).slice(0, 10)
    };
  }

  createDataSource(actor: RequestActor, input: Partial<DataSource>): DataSource {
    const state = this.store.getState();
    const name = ensureString(input.name, "name");
    const type = this.ensureDataSourceType(input.type);
    const exists = state.dataSources.some((item) => item.tenantId === actor.tenantId && item.name.toLowerCase() === name.toLowerCase() && item.status !== "archived");
    if (exists) conflict(`Data source '${name}' already exists`);
    const now = nowIso();
    const dataSource: DataSource = {
      id: newId("src"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name,
      type,
      platform: input.platform,
      ownerTeam: input.ownerTeam,
      status: input.status ?? "active",
      config: input.config ?? {},
      lastSyncAt: input.lastSyncAt
    };
    state.dataSources.unshift(dataSource);
    this.store.save();
    this.store.audit(actor, "analytics.datasource.create", "dataSource", dataSource.id, undefined, dataSource);
    this.events.publish(actor, "analytics.datasource.created", { dataSourceId: dataSource.id, name: dataSource.name });
    return clone(dataSource);
  }

  listDataSources(actor: RequestActor): DataSource[] {
    return clone(this.store.getState().dataSources.filter((item) => item.tenantId === actor.tenantId && item.status !== "archived"));
  }

  getDataSource(actor: RequestActor, id: string): DataSource {
    const item = this.store.getState().dataSources.find((source) => source.tenantId === actor.tenantId && source.id === id && source.status !== "archived");
    if (!item) notFound("Data source not found");
    return clone(item);
  }

  updateDataSource(actor: RequestActor, id: string, input: Partial<DataSource>): DataSource {
    const state = this.store.getState();
    const item = state.dataSources.find((source) => source.tenantId === actor.tenantId && source.id === id && source.status !== "archived");
    if (!item) notFound("Data source not found");
    const before = clone(item);
    if (input.name !== undefined) item.name = ensureString(input.name, "name");
    if (input.type !== undefined) item.type = this.ensureDataSourceType(input.type);
    if (input.platform !== undefined) item.platform = input.platform;
    if (input.ownerTeam !== undefined) item.ownerTeam = input.ownerTeam;
    if (input.status !== undefined) item.status = this.ensureEntityStatus(input.status);
    if (input.config !== undefined) item.config = input.config;
    if (input.lastSyncAt !== undefined) item.lastSyncAt = input.lastSyncAt;
    item.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "analytics.datasource.update", "dataSource", item.id, before, item);
    this.events.publish(actor, "analytics.datasource.updated", { dataSourceId: item.id, name: item.name });
    return clone(item);
  }

  archiveDataSource(actor: RequestActor, id: string): DataSource {
    return this.updateDataSource(actor, id, { status: "archived" });
  }

  ingestRecord(actor: RequestActor, input: Partial<AnalyticsRecord>): AnalyticsRecord {
    const sourceId = ensureString(input.sourceId, "sourceId");
    const source = this.store.getState().dataSources.find((item) => item.tenantId === actor.tenantId && item.id === sourceId && item.status !== "archived");
    if (!source) notFound("Data source not found");
    const entity = ensureString(input.entity, "entity");
    const metrics = this.normalizeMetrics(input.metrics);
    if (Object.keys(metrics).length === 0) badRequest("At least one numeric metric is required");
    const now = nowIso();
    const record: AnalyticsRecord = {
      id: newId("rec"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      sourceId,
      entity,
      timestamp: input.timestamp ?? now,
      dimensions: input.dimensions ?? {},
      metrics,
      payload: input.payload ?? {}
    };
    this.store.getState().records.unshift(record);
    source.lastSyncAt = now;
    source.updatedAt = now;
    this.store.save();
    this.store.audit(actor, "analytics.record.ingest", "record", record.id, undefined, record);
    this.events.publish(actor, "analytics.record.ingested", { recordId: record.id, entity: record.entity, sourceId: record.sourceId });
    return clone(record);
  }

  bulkIngest(actor: RequestActor, input: { records?: Partial<AnalyticsRecord>[] }): AnalyticsRecord[] {
    const records = Array.isArray(input.records) ? input.records : [];
    if (records.length === 0) badRequest("records array is required");
    return records.map((record) => this.ingestRecord(actor, record));
  }

  queryRecords(actor: RequestActor, input: Partial<RecordQuery>): AnalyticsRecord[] {
    return clone(this.aggregation.filterRecords(this.store.getState().records, {
      tenantId: actor.tenantId,
      entity: input.entity,
      sourceId: input.sourceId,
      from: input.from,
      to: input.to,
      filters: input.filters ?? [],
      limit: input.limit ?? 100
    }));
  }

  createMetric(actor: RequestActor, input: Partial<MetricDefinition>): MetricDefinition {
    const state = this.store.getState();
    const key = ensureString(input.key, "key");
    const exists = state.metrics.some((metric) => metric.tenantId === actor.tenantId && metric.key === key && metric.status !== "archived");
    if (exists) conflict(`Metric key '${key}' already exists`);
    const aggregation = this.ensureAggregation(input.aggregation);
    const entity = ensureString(input.entity, "entity");
    if (aggregation !== "count" && !input.field) badRequest("field is required for non-count metrics");
    const now = nowIso();
    const metric: MetricDefinition = {
      id: newId("met"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key,
      name: ensureString(input.name ?? key, "name"),
      description: input.description,
      entity,
      aggregation,
      field: input.field,
      filters: input.filters ?? [],
      defaultGroupBy: input.defaultGroupBy ?? [],
      format: input.format ?? "number",
      status: input.status ?? "active"
    };
    state.metrics.unshift(metric);
    this.store.save();
    this.store.audit(actor, "analytics.metric.create", "metric", metric.id, undefined, metric);
    this.events.publish(actor, "analytics.metric.created", { metricId: metric.id, key: metric.key });
    return clone(metric);
  }

  listMetrics(actor: RequestActor): MetricDefinition[] {
    return clone(this.store.getState().metrics.filter((metric) => metric.tenantId === actor.tenantId && metric.status !== "archived"));
  }

  getMetric(actor: RequestActor, id: string): MetricDefinition {
    const metric = this.store.getState().metrics.find((item) => item.tenantId === actor.tenantId && item.id === id && item.status !== "archived");
    if (!metric) notFound("Metric not found");
    return clone(metric);
  }

  updateMetric(actor: RequestActor, id: string, input: Partial<MetricDefinition>): MetricDefinition {
    const state = this.store.getState();
    const metric = state.metrics.find((item) => item.tenantId === actor.tenantId && item.id === id && item.status !== "archived");
    if (!metric) notFound("Metric not found");
    const before = clone(metric);
    if (input.key !== undefined) metric.key = ensureString(input.key, "key");
    if (input.name !== undefined) metric.name = ensureString(input.name, "name");
    if (input.description !== undefined) metric.description = input.description;
    if (input.entity !== undefined) metric.entity = ensureString(input.entity, "entity");
    if (input.aggregation !== undefined) metric.aggregation = this.ensureAggregation(input.aggregation);
    if (input.field !== undefined) metric.field = input.field;
    if (input.filters !== undefined) metric.filters = input.filters;
    if (input.defaultGroupBy !== undefined) metric.defaultGroupBy = input.defaultGroupBy;
    if (input.format !== undefined) metric.format = input.format;
    if (input.status !== undefined) metric.status = this.ensureEntityStatus(input.status);
    metric.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "analytics.metric.update", "metric", metric.id, before, metric);
    this.events.publish(actor, "analytics.metric.updated", { metricId: metric.id, key: metric.key });
    return clone(metric);
  }

  calculateMetric(actor: RequestActor, id: string, options: MetricCalculateOptions = {}): MetricCalculationResult {
    const metric = this.getMetric(actor, id);
    const result = this.aggregation.calculateMetric(metric, this.store.getState().records, options);
    return clone(result);
  }

  adHocQuery(actor: RequestActor, input: { metric?: Partial<MetricDefinition>; entity?: string; aggregation?: string; field?: string; from?: string; to?: string; filters?: FilterCondition[]; groupBy?: string[] }): MetricCalculationResult {
    const aggregation = this.ensureAggregation(input.metric?.aggregation ?? input.aggregation);
    const metric: MetricDefinition = {
      id: "adhoc",
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: "adhoc",
      name: "Ad hoc query",
      entity: ensureString(input.metric?.entity ?? input.entity, "entity"),
      aggregation,
      field: input.metric?.field ?? input.field,
      filters: input.metric?.filters ?? input.filters ?? [],
      defaultGroupBy: input.metric?.defaultGroupBy ?? input.groupBy ?? [],
      format: input.metric?.format ?? "number",
      status: "active"
    };
    if (metric.aggregation !== "count" && !metric.field) badRequest("field is required for non-count queries");
    return this.aggregation.calculateMetric(metric, this.store.getState().records, { from: input.from, to: input.to, groupBy: input.groupBy });
  }

  createKpi(actor: RequestActor, input: Partial<KpiDefinition>): KpiDefinition {
    const metricId = ensureString(input.metricId, "metricId");
    this.getMetric(actor, metricId);
    const now = nowIso();
    const kpi: KpiDefinition = {
      id: newId("kpi"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name: ensureString(input.name, "name"),
      description: input.description,
      metricId,
      target: ensureNumber(input.target, "target"),
      comparison: input.comparison ?? "gte",
      warningThresholdPercent: input.warningThresholdPercent ?? 80,
      period: input.period ?? "monthly",
      owner: input.owner,
      status: input.status ?? "active"
    };
    this.store.getState().kpis.unshift(kpi);
    this.store.save();
    this.store.audit(actor, "analytics.kpi.create", "kpi", kpi.id, undefined, kpi);
    this.events.publish(actor, "analytics.kpi.created", { kpiId: kpi.id, name: kpi.name });
    return clone(kpi);
  }

  listKpis(actor: RequestActor): KpiDefinition[] {
    return clone(this.store.getState().kpis.filter((kpi) => kpi.tenantId === actor.tenantId && kpi.status !== "archived"));
  }

  getKpi(actor: RequestActor, id: string): KpiDefinition {
    const kpi = this.store.getState().kpis.find((item) => item.tenantId === actor.tenantId && item.id === id && item.status !== "archived");
    if (!kpi) notFound("KPI not found");
    return clone(kpi);
  }

  calculateKpi(actor: RequestActor, id: string, options: MetricCalculateOptions = {}): KpiSnapshot {
    const kpi = this.getKpi(actor, id);
    const metricResult = this.calculateMetric(actor, kpi.metricId, options);
    return this.kpiEngine.snapshot(kpi, metricResult);
  }

  createDashboard(actor: RequestActor, input: Partial<Dashboard>): Dashboard {
    const widgets = (input.widgets ?? []).map((widget) => this.normalizeWidget(widget));
    const now = nowIso();
    const dashboard: Dashboard = {
      id: newId("dash"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name: ensureString(input.name, "name"),
      description: input.description,
      owner: input.owner,
      tags: input.tags ?? [],
      widgets,
      status: input.status ?? "active"
    };
    this.store.getState().dashboards.unshift(dashboard);
    this.store.save();
    this.store.audit(actor, "analytics.dashboard.create", "dashboard", dashboard.id, undefined, dashboard);
    this.events.publish(actor, "analytics.dashboard.created", { dashboardId: dashboard.id, name: dashboard.name });
    return clone(dashboard);
  }

  listDashboards(actor: RequestActor): Dashboard[] {
    return clone(this.store.getState().dashboards.filter((dashboard) => dashboard.tenantId === actor.tenantId && dashboard.status !== "archived"));
  }

  getDashboard(actor: RequestActor, id: string): Dashboard {
    const dashboard = this.store.getState().dashboards.find((item) => item.tenantId === actor.tenantId && item.id === id && item.status !== "archived");
    if (!dashboard) notFound("Dashboard not found");
    return clone(dashboard);
  }

  updateDashboard(actor: RequestActor, id: string, input: Partial<Dashboard>): Dashboard {
    const dashboard = this.store.getState().dashboards.find((item) => item.tenantId === actor.tenantId && item.id === id && item.status !== "archived");
    if (!dashboard) notFound("Dashboard not found");
    const before = clone(dashboard);
    if (input.name !== undefined) dashboard.name = ensureString(input.name, "name");
    if (input.description !== undefined) dashboard.description = input.description;
    if (input.owner !== undefined) dashboard.owner = input.owner;
    if (input.tags !== undefined) dashboard.tags = input.tags;
    if (input.widgets !== undefined) dashboard.widgets = input.widgets.map((widget) => this.normalizeWidget(widget));
    if (input.status !== undefined) dashboard.status = this.ensureEntityStatus(input.status);
    dashboard.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "analytics.dashboard.update", "dashboard", dashboard.id, before, dashboard);
    this.events.publish(actor, "analytics.dashboard.updated", { dashboardId: dashboard.id, name: dashboard.name });
    return clone(dashboard);
  }

  renderDashboard(actor: RequestActor, id: string, options: MetricCalculateOptions = {}): unknown {
    const dashboard = this.getDashboard(actor, id);
    const widgets = dashboard.widgets.map((widget) => {
      if (widget.type === "text") return { ...widget, data: { text: widget.text ?? "" } };
      const metrics = widget.metricIds.map((metricId) => this.calculateMetric(actor, metricId, { ...options, groupBy: widget.groupBy ?? options.groupBy, filters: [...(options.filters ?? []), ...(widget.filters ?? [])] }));
      const kpis = widget.kpiIds.map((kpiId) => this.calculateKpi(actor, kpiId, options));
      return { ...widget, data: { metrics, kpis } };
    });
    return {
      dashboardId: dashboard.id,
      name: dashboard.name,
      renderedAt: nowIso(),
      widgets
    };
  }

  createReport(actor: RequestActor, input: Partial<ReportDefinition>): ReportDefinition {
    const metricIds = input.metricIds ?? [];
    if (metricIds.length === 0) badRequest("metricIds is required");
    metricIds.forEach((id) => this.getMetric(actor, id));
    const now = nowIso();
    const report: ReportDefinition = {
      id: newId("rpt"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name: ensureString(input.name, "name"),
      description: input.description,
      metricIds,
      dimensions: input.dimensions ?? [],
      filters: input.filters ?? [],
      schedule: input.schedule ?? "manual",
      recipients: input.recipients ?? [],
      status: input.status ?? "active"
    };
    this.store.getState().reports.unshift(report);
    this.store.save();
    this.store.audit(actor, "analytics.report.create", "report", report.id, undefined, report);
    this.events.publish(actor, "analytics.report.created", { reportId: report.id, name: report.name });
    return clone(report);
  }

  listReports(actor: RequestActor): ReportDefinition[] {
    return clone(this.store.getState().reports.filter((report) => report.tenantId === actor.tenantId && report.status !== "archived"));
  }

  getReport(actor: RequestActor, id: string): ReportDefinition {
    const report = this.store.getState().reports.find((item) => item.tenantId === actor.tenantId && item.id === id && item.status !== "archived");
    if (!report) notFound("Report not found");
    return clone(report);
  }

  generateReport(actor: RequestActor, id: string, options: MetricCalculateOptions = {}): unknown {
    const report = this.getReport(actor, id);
    const metrics = report.metricIds.map((metricId) => this.calculateMetric(actor, metricId, { ...options, filters: [...(options.filters ?? []), ...report.filters], groupBy: report.dimensions.length ? report.dimensions : options.groupBy }));
    const tableRows = metrics.flatMap((metric) => {
      if (!metric.groups.length) return [{ metricKey: metric.metricKey, metricName: metric.metricName, value: metric.value, count: metric.count }];
      return metric.groups.map((group) => ({ metricKey: metric.metricKey, metricName: metric.metricName, ...group.dimensions, value: group.value, count: group.count }));
    });
    return {
      reportId: report.id,
      name: report.name,
      generatedAt: nowIso(),
      metrics,
      rows: tableRows,
      summary: {
        metricCount: metrics.length,
        rowCount: tableRows.length
      }
    };
  }

  createAlertRule(actor: RequestActor, input: Partial<AlertRule>): AlertRule {
    const metricId = ensureString(input.metricId, "metricId");
    this.getMetric(actor, metricId);
    const now = nowIso();
    const rule: AlertRule = {
      id: newId("alert"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name: ensureString(input.name, "name"),
      metricId,
      operator: input.operator ?? "gt",
      threshold: ensureNumber(input.threshold, "threshold"),
      severity: input.severity ?? "warning",
      enabled: input.enabled ?? true,
      cooldownMinutes: input.cooldownMinutes ?? 30,
      filters: input.filters ?? [],
      lastTriggeredAt: input.lastTriggeredAt
    };
    this.store.getState().alertRules.unshift(rule);
    this.store.save();
    this.store.audit(actor, "analytics.alert.create", "alertRule", rule.id, undefined, rule);
    this.events.publish(actor, "analytics.alert.rule_created", { ruleId: rule.id, name: rule.name });
    return clone(rule);
  }

  listAlertRules(actor: RequestActor): AlertRule[] {
    return clone(this.store.getState().alertRules.filter((rule) => rule.tenantId === actor.tenantId));
  }

  evaluateAlerts(actor: RequestActor, options: MetricCalculateOptions = {}): AlertIncident[] {
    const state = this.store.getState();
    const now = nowIso();
    const incidents: AlertIncident[] = [];
    for (const rule of state.alertRules.filter((item) => item.tenantId === actor.tenantId && item.enabled)) {
      const metricResult = this.calculateMetric(actor, rule.metricId, { ...options, filters: [...(options.filters ?? []), ...rule.filters] });
      if (!compareAlert(metricResult.value, rule.operator, rule.threshold)) continue;
      if (rule.lastTriggeredAt && !this.cooldownExpired(rule.lastTriggeredAt, rule.cooldownMinutes)) continue;
      const incident: AlertIncident = {
        id: newId("inc"),
        tenantId: actor.tenantId,
        createdAt: now,
        updatedAt: now,
        ruleId: rule.id,
        metricId: rule.metricId,
        metricValue: metricResult.value,
        threshold: rule.threshold,
        operator: rule.operator,
        severity: rule.severity,
        status: "open",
        triggeredAt: now
      };
      state.alertIncidents.unshift(incident);
      rule.lastTriggeredAt = now;
      rule.updatedAt = now;
      incidents.push(incident);
      this.store.audit(actor, "analytics.alert.trigger", "alertIncident", incident.id, undefined, incident);
      this.events.publish(actor, "analytics.alert.triggered", { incidentId: incident.id, ruleId: rule.id, metricValue: incident.metricValue, severity: incident.severity });
    }
    this.store.save();
    return clone(incidents);
  }

  listAlertIncidents(actor: RequestActor): AlertIncident[] {
    return clone(this.store.getState().alertIncidents.filter((incident) => incident.tenantId === actor.tenantId));
  }

  updateAlertIncident(actor: RequestActor, id: string, input: { status?: AlertIncidentStatus; note?: string }): AlertIncident {
    const incident = this.store.getState().alertIncidents.find((item) => item.tenantId === actor.tenantId && item.id === id);
    if (!incident) notFound("Alert incident not found");
    const before = clone(incident);
    if (input.status) {
      incident.status = input.status;
      if (input.status === "acknowledged") incident.acknowledgedAt = nowIso();
      if (input.status === "resolved") incident.resolvedAt = nowIso();
    }
    if (input.note !== undefined) incident.note = input.note;
    incident.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "analytics.alert.incident_update", "alertIncident", incident.id, before, incident);
    this.events.publish(actor, "analytics.alert.incident_updated", { incidentId: incident.id, status: incident.status });
    return clone(incident);
  }

  createExport(actor: RequestActor, input: { targetType?: string; targetId?: string; format?: ExportFormat; options?: MetricCalculateOptions }): ExportJob {
    const targetType = input.targetType;
    const targetId = ensureString(input.targetId, "targetId");
    const format = input.format ?? "json";
    if (!["json", "csv"].includes(format)) badRequest("format must be json or csv");
    let payload: unknown;
    if (targetType === "report") payload = this.generateReport(actor, targetId, input.options ?? {});
    else if (targetType === "dashboard") payload = this.renderDashboard(actor, targetId, input.options ?? {});
    else if (targetType === "metric") payload = this.calculateMetric(actor, targetId, input.options ?? {});
    else badRequest("targetType must be report, dashboard, or metric");

    let content: string;
    let contentType: string;
    if (format === "json") {
      content = this.exportEngine.json(payload);
      contentType = "application/json";
    } else {
      const rows = payload && typeof payload === "object" && Array.isArray((payload as any).rows) ? (payload as any).rows : [payload as Record<string, unknown>];
      content = Array.isArray(rows) ? toCsv(rows as Array<Record<string, unknown>>) : this.exportEngine.csvFromPayload(payload);
      contentType = "text/csv";
    }

    const now = nowIso();
    const job: ExportJob = {
      id: newId("exp"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      targetType: targetType as any,
      targetId,
      format,
      status: "completed",
      content,
      contentType
    };
    this.store.getState().exportJobs.unshift(job);
    this.store.save();
    this.store.audit(actor, "analytics.export.create", "exportJob", job.id, undefined, { ...job, content: `[${job.content.length} chars]` });
    this.events.publish(actor, "analytics.export.created", { exportId: job.id, targetType, targetId, format });
    return clone(job);
  }

  getExport(actor: RequestActor, id: string): ExportJob {
    const job = this.store.getState().exportJobs.find((item) => item.tenantId === actor.tenantId && item.id === id);
    if (!job) notFound("Export job not found");
    return clone(job);
  }

  listEvents(actor: RequestActor): unknown[] {
    return clone(this.store.getState().events.filter((event) => event.tenantId === actor.tenantId));
  }

  listAuditLogs(actor: RequestActor): unknown[] {
    return clone(this.store.getState().auditLogs.filter((audit) => audit.tenantId === actor.tenantId));
  }

  private normalizeMetrics(metrics: unknown): Record<string, number> {
    if (!metrics || typeof metrics !== "object" || Array.isArray(metrics)) badRequest("metrics object is required");
    const output: Record<string, number> = {};
    for (const [key, value] of Object.entries(metrics as Record<string, unknown>)) {
      output[key] = ensureNumber(value, `metrics.${key}`);
    }
    return output;
  }

  private normalizeWidget(widget: DashboardWidget): DashboardWidget {
    return {
      id: widget.id ?? newId("wid"),
      type: widget.type ?? "chart",
      title: ensureString(widget.title, "widget.title"),
      metricIds: widget.metricIds ?? [],
      kpiIds: widget.kpiIds ?? [],
      chartType: widget.chartType,
      groupBy: widget.groupBy ?? [],
      filters: widget.filters ?? [],
      text: widget.text,
      position: widget.position,
      config: widget.config ?? {}
    };
  }

  private ensureDataSourceType(value: unknown): DataSourceType {
    const allowed = ["platform", "erp", "database", "api", "manual", "warehouse"];
    if (!allowed.includes(String(value))) badRequest(`type must be one of: ${allowed.join(", ")}`);
    return value as DataSourceType;
  }

  private ensureEntityStatus(value: unknown): EntityStatus {
    const allowed = ["active", "inactive", "archived"];
    if (!allowed.includes(String(value))) badRequest(`status must be one of: ${allowed.join(", ")}`);
    return value as EntityStatus;
  }

  private ensureAggregation(value: unknown): "sum" | "avg" | "count" | "min" | "max" {
    const allowed = ["sum", "avg", "count", "min", "max"];
    if (!allowed.includes(String(value))) badRequest(`aggregation must be one of: ${allowed.join(", ")}`);
    return value as "sum" | "avg" | "count" | "min" | "max";
  }

  private cooldownExpired(lastTriggeredAt: string, cooldownMinutes: number): boolean {
    const nextAllowed = new Date(lastTriggeredAt).getTime() + cooldownMinutes * 60 * 1000;
    return Date.now() >= nextAllowed;
  }
}
