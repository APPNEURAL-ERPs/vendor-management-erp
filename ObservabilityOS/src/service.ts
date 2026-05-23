import { DataStore } from "./core/datastore";
import {
  RequestActor,
  ObservabilityOverview,
  LogEvent,
  MetricDefinition,
  MetricPoint,
  Trace,
  TraceSpan,
  ErrorEvent,
  AlertRule,
  AlertEvent,
  HealthCheck,
  SLO,
  ErrorBudget,
  ServiceMetrics,
  IncidentSignal,
  Incident,
  Dashboard,
  DashboardWidget,
  CostMetric,
  Report,
  ObservabilityEvent,
  LogLevel,
  AlertSeverity,
  AlertStatus,
  TraceStatus
} from "./core/domain";
import { badRequest, conflict, notFound } from "./core/errors";
import { newId, nowIso } from "./core/id";
import { clone, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, optionalObject, pickQuery } from "./core/utils";

export class ObservabilityService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "ObservabilityOS service is ready - logs, metrics, traces, alerts, health, incidents, SLOs, dashboards, and cost tracking";
  }

  overview(actor: RequestActor): ObservabilityOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;

    const services = state.serviceMetrics.filter((item) => item.tenantId === tenant);
    const alerts = state.alertEvents.filter((item) => item.tenantId === tenant);
    const incidents = state.incidents.filter((item) => item.tenantId === tenant);
    const logs = state.logs.filter((item) => item.tenantId === tenant);
    const slos = state.slos.filter((item) => item.tenantId === tenant);
    const costs = state.costMetrics.filter((item) => item.tenantId === tenant);

    const today = new Date().toISOString().split("T")[0];
    const todayCosts = costs.filter((c) => c.timestamp.startsWith(today));
    const monthCosts = costs.filter((c) => c.timestamp.startsWith(today.substring(0, 7)));

    return {
      services: {
        total: services.length,
        healthy: services.filter((s) => s.errorRate < 0.1).length,
        degraded: services.filter((s) => s.errorRate >= 0.1 && s.errorRate < 1).length,
        unhealthy: services.filter((s) => s.errorRate >= 1).length
      },
      alerts: {
        total: alerts.length,
        firing: alerts.filter((a) => a.status === "firing").length,
        acknowledged: alerts.filter((a) => a.status === "acknowledged").length,
        resolved: alerts.filter((a) => a.status === "resolved").length
      },
      incidents: {
        total: incidents.length,
        open: incidents.filter((i) => ["open", "investigating", "identified", "mitigating"].includes(i.status)).length,
        investigating: incidents.filter((i) => i.status === "investigating").length,
        resolved: incidents.filter((i) => ["resolved", "closed"].includes(i.status)).length
      },
      logs: {
        total: logs.length,
        errors: logs.filter((l) => l.level === "ERROR" || l.level === "FATAL").length,
        warnings: logs.filter((l) => l.level === "WARN").length
      },
      metrics: {
        total: state.metricPoints.length,
        definitions: state.metricDefinitions.filter((m) => m.tenantId === tenant).length
      },
      traces: {
        total: state.traces.filter((t) => t.tenantId === tenant).length,
        errors: state.traces.filter((t) => t.tenantId === tenant && t.status === "error").length
      },
      slos: {
        total: slos.length,
        atTarget: slos.filter((s) => s.errorBudgetRemaining !== undefined && s.errorBudgetRemaining > 10).length
      },
      costs: {
        today: todayCosts.reduce((sum, c) => sum + c.amount, 0),
        month: monthCosts.reduce((sum, c) => sum + c.amount, 0),
        trend: todayCosts.length > 1 ? (todayCosts[0].amount - todayCosts[1]?.amount) / (todayCosts[1]?.amount || 1) * 100 : 0
      }
    };
  }

  listLogs(actor: RequestActor, query?: URLSearchParams): LogEvent[] {
    const level = pickQuery(query, "level");
    const service = pickQuery(query, "service");
    const search = pickQuery(query, "search");
    const limit = Number(pickQuery(query, "limit") ?? 100);

    return clone(this.store.getState().logs.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (level && item.level !== level) return false;
      if (service && item.service !== service) return false;
      if (search && !item.message.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).slice(0, limit));
  }

  createLog(input: unknown, actor: RequestActor): LogEvent {
    const body = ensureObject(input, "log");
    const log: LogEvent = {
      id: newId("log"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      level: ensureString(body.level, "log.level", "INFO") as LogLevel,
      service: ensureString(body.service, "log.service"),
      environment: ensureString(body.environment, "log.environment", "production"),
      requestId: body.requestId ? String(body.requestId) : undefined,
      traceId: body.traceId ? String(body.traceId) : undefined,
      workflowRunId: body.workflowRunId ? String(body.workflowRunId) : undefined,
      userId: body.userId ? String(body.userId) : undefined,
      message: ensureString(body.message, "log.message"),
      errorCode: body.errorCode ? String(body.errorCode) : undefined,
      duration: body.duration ? ensureNumber(body.duration, "log.duration") : undefined,
      metadata: optionalObject(body.metadata)
    };
    this.store.getState().logs.unshift(log);
    this.store.save();
    this.store.audit(actor, "log.create", "log", log.id, undefined, log);
    return clone(log);
  }

  listMetricDefinitions(actor: RequestActor): MetricDefinition[] {
    return clone(this.store.getState().metricDefinitions.filter((item) => item.tenantId === actor.tenantId));
  }

  createMetricDefinition(input: unknown, actor: RequestActor): MetricDefinition {
    const body = ensureObject(input, "metric");
    const state = this.store.getState();
    const key = ensureString(body.key, "metric.key");
    if (state.metricDefinitions.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Metric key '${key}' already exists`);
    }
    const metric: MetricDefinition = {
      id: newId("metric"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "metric.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "gauge") as MetricDefinition["type"],
      unit: body.unit ? String(body.unit) : undefined,
      service: body.service ? String(body.service) : undefined,
      status: String(body.status ?? "active") as MetricDefinition["status"],
      tags: ensureArray<string>(body.tags, "metric.tags", [])
    };
    state.metricDefinitions.push(metric);
    this.store.save();
    this.store.audit(actor, "metric.create", "metric", metric.id, undefined, metric);
    return clone(metric);
  }

  recordMetricPoint(input: unknown, actor: RequestActor): MetricPoint {
    const body = ensureObject(input, "metricPoint");
    const metric = this.store.getState().metricDefinitions.find(
      (item) => item.tenantId === actor.tenantId && (item.id === body.metricId || item.key === body.metricId)
    );
    if (!metric) notFound("Metric definition not found");

    const point: MetricPoint = {
      id: newId("mp"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      metricId: metric.id,
      value: ensureNumber(body.value, "metricPoint.value"),
      timestamp: body.timestamp ? String(body.timestamp) : nowIso(),
      labels: optionalObject(body.labels)
    };
    this.store.getState().metricPoints.unshift(point);
    this.store.save();
    return clone(point);
  }

  listTraces(actor: RequestActor, query?: URLSearchParams): Trace[] {
    const service = pickQuery(query, "service");
    const status = pickQuery(query, "status");
    const limit = Number(pickQuery(query, "limit") ?? 100);

    return clone(this.store.getState().traces.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (service && item.service !== service) return false;
      if (status && item.status !== status) return false;
      return true;
    }).slice(0, limit));
  }

  getTrace(traceId: string, actor: RequestActor): { trace: Trace; spans: TraceSpan[] } {
    const trace = this.store.getState().traces.find((item) => item.id === traceId && item.tenantId === actor.tenantId);
    if (!trace) notFound("Trace not found");
    const spans = this.store.getState().traceSpans.filter((item) => item.traceId === trace.traceId && item.tenantId === actor.tenantId);
    return { trace: clone(trace), spans: clone(spans) };
  }

  createTrace(input: unknown, actor: RequestActor): Trace {
    const body = ensureObject(input, "trace");
    const traceId = body.traceId ? String(body.traceId) : newId("trc");
    const startTime = body.startTime ? String(body.startTime) : nowIso();
    const endTime = body.endTime ? String(body.endTime) : undefined;
    const durationMs = endTime ? new Date(endTime).getTime() - new Date(startTime).getTime() : undefined;

    const trace: Trace = {
      id: newId("trace"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      traceId,
      service: ensureString(body.service, "trace.service"),
      operation: ensureString(body.operation, "trace.operation"),
      status: String(body.status ?? "ok") as TraceStatus,
      startTime,
      endTime,
      durationMs,
      userId: body.userId ? String(body.userId) : undefined,
      requestId: body.requestId ? String(body.requestId) : undefined,
      tags: ensureArray<string>(body.tags, "trace.tags", []),
      metadata: optionalObject(body.metadata)
    };
    this.store.getState().traces.unshift(trace);
    this.store.save();
    return clone(trace);
  }

  listAlertRules(actor: RequestActor): AlertRule[] {
    return clone(this.store.getState().alertRules.filter((item) => item.tenantId === actor.tenantId));
  }

  createAlertRule(input: unknown, actor: RequestActor): AlertRule {
    const body = ensureObject(input, "alertRule");
    const state = this.store.getState();
    const key = ensureString(body.key, "alertRule.key");
    if (state.alertRules.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Alert rule key '${key}' already exists`);
    }
    const rule: AlertRule = {
      id: newId("alertrule"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "alertRule.name"),
      description: body.description ? String(body.description) : undefined,
      metricId: body.metricId ? String(body.metricId) : undefined,
      condition: ensureString(body.condition, "alertRule.condition"),
      threshold: ensureNumber(body.threshold, "alertRule.threshold"),
      duration: ensureNumber(body.duration, "alertRule.duration", 300),
      severity: String(body.severity ?? "warning") as AlertSeverity,
      status: String(body.status ?? "active") as AlertRule["status"],
      service: body.service ? String(body.service) : undefined,
      notifications: ensureArray<string>(body.notifications, "alertRule.notifications", [])
    };
    state.alertRules.push(rule);
    this.store.save();
    this.store.audit(actor, "alertrule.create", "alertRule", rule.id, undefined, rule);
    return clone(rule);
  }

  listAlertEvents(actor: RequestActor, query?: URLSearchParams): AlertEvent[] {
    const status = pickQuery(query, "status");
    const severity = pickQuery(query, "severity");
    const service = pickQuery(query, "service");

    return clone(this.store.getState().alertEvents.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (status && item.status !== status) return false;
      if (severity && item.severity !== severity) return false;
      if (service && item.service !== service) return false;
      return true;
    }));
  }

  createAlertEvent(input: unknown, actor: RequestActor): AlertEvent {
    const body = ensureObject(input, "alertEvent");
    const event: AlertEvent = {
      id: newId("alertevent"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ruleId: body.ruleId ? String(body.ruleId) : undefined,
      severity: String(body.severity ?? "warning") as AlertSeverity,
      status: String(body.status ?? "firing") as AlertStatus,
      message: ensureString(body.message, "alertEvent.message"),
      value: body.value ? ensureNumber(body.value, "alertEvent.value") : undefined,
      threshold: body.threshold ? ensureNumber(body.threshold, "alertEvent.threshold") : undefined,
      service: body.service ? String(body.service) : undefined,
      firedAt: body.firedAt ? String(body.firedAt) : nowIso(),
      metadata: optionalObject(body.metadata)
    };
    this.store.getState().alertEvents.unshift(event);
    this.store.save();
    this.store.audit(actor, "alertevent.create", "alertEvent", event.id, undefined, event);
    return clone(event);
  }

  acknowledgeAlert(id: string, actor: RequestActor): AlertEvent {
    const event = this.store.getState().alertEvents.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!event) notFound("Alert event not found");
    event.status = "acknowledged";
    event.acknowledgedBy = actor.userId;
    event.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "alert.acknowledge", "alertEvent", event.id, undefined, event);
    return clone(event);
  }

  resolveAlert(id: string, actor: RequestActor): AlertEvent {
    const event = this.store.getState().alertEvents.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!event) notFound("Alert event not found");
    event.status = "resolved";
    event.resolvedAt = nowIso();
    event.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "alert.resolve", "alertEvent", event.id, undefined, event);
    return clone(event);
  }

  listHealthChecks(actor: RequestActor): HealthCheck[] {
    return clone(this.store.getState().healthChecks.filter((item) => item.tenantId === actor.tenantId));
  }

  createHealthCheck(input: unknown, actor: RequestActor): HealthCheck {
    const body = ensureObject(input, "healthCheck");
    const check: HealthCheck = {
      id: newId("healthcheck"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "healthCheck.name"),
      service: ensureString(body.service, "healthCheck.service"),
      endpoint: body.endpoint ? String(body.endpoint) : undefined,
      type: String(body.type ?? "http") as HealthCheck["type"],
      status: "unknown",
      interval: ensureNumber(body.interval, "healthCheck.interval", 60),
      timeout: ensureNumber(body.timeout, "healthCheck.timeout", 5),
      lastCheck: nowIso(),
      metadata: optionalObject(body.metadata)
    };
    this.store.getState().healthChecks.push(check);
    this.store.save();
    return clone(check);
  }

  listServiceMetrics(actor: RequestActor, query?: URLSearchParams): ServiceMetrics[] {
    const service = pickQuery(query, "service");
    return clone(this.store.getState().serviceMetrics.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (service && item.service !== service) return false;
      return true;
    }));
  }

  createServiceMetrics(input: unknown, actor: RequestActor): ServiceMetrics {
    const body = ensureObject(input, "serviceMetrics");
    const state = this.store.getState();
    const existing = state.serviceMetrics.find(
      (item) => item.tenantId === actor.tenantId && item.service === body.service
    );
    if (existing) {
      Object.assign(existing, {
        uptime: body.uptime !== undefined ? ensureNumber(body.uptime, "serviceMetrics.uptime") : existing.uptime,
        latencyP50: body.latencyP50 !== undefined ? ensureNumber(body.latencyP50, "serviceMetrics.latencyP50") : existing.latencyP50,
        latencyP95: body.latencyP95 !== undefined ? ensureNumber(body.latencyP95, "serviceMetrics.latencyP95") : existing.latencyP95,
        latencyP99: body.latencyP99 !== undefined ? ensureNumber(body.latencyP99, "serviceMetrics.latencyP99") : existing.latencyP99,
        errorRate: body.errorRate !== undefined ? ensureNumber(body.errorRate, "serviceMetrics.errorRate") : existing.errorRate,
        requestsPerMinute: body.requestsPerMinute !== undefined ? ensureNumber(body.requestsPerMinute, "serviceMetrics.requestsPerMinute") : existing.requestsPerMinute,
        cpuUsage: body.cpuUsage !== undefined ? ensureNumber(body.cpuUsage, "serviceMetrics.cpuUsage") : existing.cpuUsage,
        memoryUsage: body.memoryUsage !== undefined ? ensureNumber(body.memoryUsage, "serviceMetrics.memoryUsage") : existing.memoryUsage,
        databaseLatency: body.databaseLatency !== undefined ? ensureNumber(body.databaseLatency, "serviceMetrics.databaseLatency") : existing.databaseLatency,
        queueBacklog: body.queueBacklog !== undefined ? ensureNumber(body.queueBacklog, "serviceMetrics.queueBacklog") : existing.queueBacklog,
        lastUpdated: nowIso(),
        metadata: { ...existing.metadata, ...optionalObject(body.metadata) }
      });
      existing.updatedAt = nowIso();
      this.store.save();
      return clone(existing);
    }

    const metrics: ServiceMetrics = {
      id: newId("servicemetrics"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      service: ensureString(body.service, "serviceMetrics.service"),
      uptime: ensureNumber(body.uptime, "serviceMetrics.uptime", 100),
      latencyP50: body.latencyP50 !== undefined ? ensureNumber(body.latencyP50, "serviceMetrics.latencyP50") : undefined,
      latencyP95: body.latencyP95 !== undefined ? ensureNumber(body.latencyP95, "serviceMetrics.latencyP95") : undefined,
      latencyP99: body.latencyP99 !== undefined ? ensureNumber(body.latencyP99, "serviceMetrics.latencyP99") : undefined,
      errorRate: ensureNumber(body.errorRate, "serviceMetrics.errorRate", 0),
      requestsPerMinute: body.requestsPerMinute !== undefined ? ensureNumber(body.requestsPerMinute, "serviceMetrics.requestsPerMinute") : undefined,
      cpuUsage: body.cpuUsage !== undefined ? ensureNumber(body.cpuUsage, "serviceMetrics.cpuUsage") : undefined,
      memoryUsage: body.memoryUsage !== undefined ? ensureNumber(body.memoryUsage, "serviceMetrics.memoryUsage") : undefined,
      databaseLatency: body.databaseLatency !== undefined ? ensureNumber(body.databaseLatency, "serviceMetrics.databaseLatency") : undefined,
      queueBacklog: body.queueBacklog !== undefined ? ensureNumber(body.queueBacklog, "serviceMetrics.queueBacklog") : undefined,
      lastUpdated: nowIso(),
      metadata: optionalObject(body.metadata)
    };
    state.serviceMetrics.push(metrics);
    this.store.save();
    return clone(metrics);
  }

  listSLOs(actor: RequestActor): SLO[] {
    return clone(this.store.getState().slos.filter((item) => item.tenantId === actor.tenantId));
  }

  createSLO(input: unknown, actor: RequestActor): SLO {
    const body = ensureObject(input, "slo");
    const state = this.store.getState();
    const key = ensureString(body.key, "slo.key");
    if (state.slos.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`SLO key '${key}' already exists`);
    }
    const slo: SLO = {
      id: newId("slo"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "slo.name"),
      description: body.description ? String(body.description) : undefined,
      target: ensureNumber(body.target, "slo.target"),
      window: String(body.window ?? "monthly") as SLO["window"],
      status: String(body.status ?? "active") as SLO["status"],
      service: body.service ? String(body.service) : undefined,
      metricKey: body.metricKey ? String(body.metricKey) : undefined,
      errorBudgetRemaining: body.errorBudgetRemaining !== undefined ? ensureNumber(body.errorBudgetRemaining, "slo.errorBudgetRemaining") : undefined,
      lastCalculated: nowIso()
    };
    state.slos.push(slo);
    this.store.save();
    this.store.audit(actor, "slo.create", "slo", slo.id, undefined, slo);
    return clone(slo);
  }

  listIncidents(actor: RequestActor, query?: URLSearchParams): Incident[] {
    const status = pickQuery(query, "status");
    const severity = pickQuery(query, "severity");

    return clone(this.store.getState().incidents.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (status && item.status !== status) return false;
      if (severity && item.severity !== severity) return false;
      return true;
    }));
  }

  createIncident(input: unknown, actor: RequestActor): Incident {
    const body = ensureObject(input, "incident");
    const incident: Incident = {
      id: newId("incident"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      title: ensureString(body.title, "incident.title"),
      description: body.description ? String(body.description) : undefined,
      status: "open",
      severity: String(body.severity ?? "high") as AlertSeverity,
      services: ensureArray<string>(body.services, "incident.services", []),
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      startedAt: body.startedAt ? String(body.startedAt) : nowIso(),
      detectedAt: nowIso(),
      impactedTenants: ensureArray<string>(body.impactedTenants, "incident.impactedTenants", []),
      signals: [],
      timeline: [{ timestamp: nowIso(), action: "incident_created", actor: actor.userId, notes: "Incident created" }],
      metadata: optionalObject(body.metadata)
    };
    this.store.getState().incidents.unshift(incident);
    this.store.save();
    this.store.audit(actor, "incident.create", "incident", incident.id, undefined, incident);
    return clone(incident);
  }

  updateIncidentStatus(id: string, input: unknown, actor: RequestActor): Incident {
    const body = ensureObject(input, "update");
    const incident = this.store.getState().incidents.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!incident) notFound("Incident not found");

    const oldStatus = incident.status;
    if (body.status) incident.status = String(body.status) as Incident["status"];
    if (body.severity) incident.severity = String(body.severity) as AlertSeverity;
    if (body.ownerId) incident.ownerId = String(body.ownerId);
    if (body.resolvedAt) incident.resolvedAt = String(body.resolvedAt);

    incident.timeline.push({
      timestamp: nowIso(),
      action: "status_changed",
      actor: actor.userId,
      notes: body.notes ? String(body.notes) : `Status changed from ${oldStatus} to ${incident.status}`
    });
    incident.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "incident.update", "incident", incident.id, { status: oldStatus }, { status: incident.status });
    return clone(incident);
  }

  listDashboards(actor: RequestActor): Dashboard[] {
    return clone(this.store.getState().dashboards.filter((item) => item.tenantId === actor.tenantId && (item.isPublic || item.ownerId === actor.userId)));
  }

  createDashboard(input: unknown, actor: RequestActor): Dashboard {
    const body = ensureObject(input, "dashboard");
    const state = this.store.getState();
    const key = ensureString(body.key, "dashboard.key");
    if (state.dashboards.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Dashboard key '${key}' already exists`);
    }
    const dashboard: Dashboard = {
      id: newId("dashboard"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "dashboard.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as Dashboard["status"],
      ownerId: actor.userId,
      isPublic: ensureBoolean(body.isPublic, false),
      widgets: [],
      filters: optionalObject(body.filters)
    };
    state.dashboards.push(dashboard);
    this.store.save();
    this.store.audit(actor, "dashboard.create", "dashboard", dashboard.id, undefined, dashboard);
    return clone(dashboard);
  }

  listCostMetrics(actor: RequestActor, query?: URLSearchParams): CostMetric[] {
    const category = pickQuery(query, "category");
    const service = pickQuery(query, "service");
    const period = pickQuery(query, "period");

    return clone(this.store.getState().costMetrics.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (category && item.category !== category) return false;
      if (service && item.service !== service) return false;
      if (period && item.period !== period) return false;
      return true;
    }));
  }

  recordCostMetric(input: unknown, actor: RequestActor): CostMetric {
    const body = ensureObject(input, "costMetric");
    const metric: CostMetric = {
      id: newId("costmetric"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      service: body.service ? String(body.service) : undefined,
      category: String(body.category ?? "other") as CostMetric["category"],
      amount: ensureNumber(body.amount, "costMetric.amount"),
      currency: String(body.currency ?? "INR"),
      period: String(body.period ?? "daily") as CostMetric["period"],
      timestamp: body.timestamp ? String(body.timestamp) : nowIso(),
      tags: optionalObject(body.tags),
      metadata: optionalObject(body.metadata)
    };
    this.store.getState().costMetrics.unshift(metric);
    this.store.save();
    return clone(metric);
  }

  listErrorEvents(actor: RequestActor, query?: URLSearchParams): ErrorEvent[] {
    const status = pickQuery(query, "status");
    const service = pickQuery(query, "service");

    return clone(this.store.getState().errorEvents.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (status && item.status !== status) return false;
      if (service && item.service !== service) return false;
      return true;
    }));
  }

  createErrorEvent(input: unknown, actor: RequestActor): ErrorEvent {
    const body = ensureObject(input, "errorEvent");
    const event: ErrorEvent = {
      id: newId("errorevent"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      errorCode: ensureString(body.errorCode, "errorEvent.errorCode"),
      message: ensureString(body.message, "errorEvent.message"),
      stackTrace: body.stackTrace ? String(body.stackTrace) : undefined,
      service: ensureString(body.service, "errorEvent.service"),
      version: body.version ? String(body.version) : undefined,
      environment: String(body.environment ?? "production"),
      userId: body.userId ? String(body.userId) : undefined,
      requestId: body.requestId ? String(body.requestId) : undefined,
      traceId: body.traceId ? String(body.traceId) : undefined,
      frequency: 1,
      firstSeen: nowIso(),
      lastSeen: nowIso(),
      status: "new",
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      impact: body.impact !== undefined ? ensureNumber(body.impact, "errorEvent.impact") : 1,
      metadata: optionalObject(body.metadata)
    };
    this.store.getState().errorEvents.unshift(event);
    this.store.save();
    this.store.audit(actor, "errorevent.create", "errorEvent", event.id, undefined, event);
    return clone(event);
  }

  listAuditLogs(actor: RequestActor): any[] {
    return clone(this.store.getState().auditLogs.filter((item) => item.tenantId === actor.tenantId));
  }

  listEvents(actor: RequestActor): ObservabilityEvent[] {
    return clone(this.store.getState().events.filter((item) => item.tenantId === actor.tenantId));
  }
}
