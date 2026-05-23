import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { AnalyticsState } from "../domain";
import { clone } from "./utils";
import { RequestActor, AuditLog } from "../domain";
import { newId, nowIso } from "./id";
import { redact } from "../utils-redact";

export class DataStore {
  private state: AnalyticsState = emptyState();
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = resolve(filePath);
    this.load();
  }

  load(): void {
    if (!existsSync(this.filePath)) {
      mkdirSync(dirname(this.filePath), { recursive: true });
      this.save();
      return;
    }

    const raw = readFileSync(this.filePath, "utf-8");
    this.state = raw.trim()
      ? { ...emptyState(), ...JSON.parse(raw) }
      : emptyState();
  }

  save(): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(this.state, null, 2));
  }

  getState(): AnalyticsState {
    return this.state;
  }

  snapshot(): AnalyticsState {
    return clone(this.state);
  }

  reset(nextState = emptyState()): void {
    this.state = nextState;
    this.save();
  }

  audit(
    actor: RequestActor,
    action: string,
    entityType: string,
    entityId?: string,
    before?: unknown,
    after?: unknown
  ): AuditLog {
    const now = nowIso();
    const audit: AuditLog = {
      id: newId("audit"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      actorId: actor.userId,
      role: actor.role,
      action,
      entityType,
      entityId,
      before: redact(before),
      after: redact(after),
    };
    this.state.auditLogs.unshift(audit);
    this.save();
    return audit;
  }

  dashboards = {
    findAll: (tenantId: string) =>
      this.state.dashboards.filter((d) => d.tenantId === tenantId),
    findById: (id: string) =>
      this.state.dashboards.find((d) => d.id === id),
    create: (dashboard: Dashboard) => {
      this.state.dashboards.push(dashboard);
      this.save();
      return dashboard;
    },
    update: (id: string, updates: Partial<Dashboard>) => {
      const idx = this.state.dashboards.findIndex((d) => d.id === id);
      if (idx === -1) return undefined;
      this.state.dashboards[idx] = {
        ...this.state.dashboards[idx],
        ...updates,
        updatedAt: nowIso(),
      };
      this.save();
      return this.state.dashboards[idx];
    },
    delete: (id: string) => {
      const idx = this.state.dashboards.findIndex((d) => d.id === id);
      if (idx === -1) return false;
      this.state.dashboards.splice(idx, 1);
      this.save();
      return true;
    },
  };

  widgets = {
    findAll: (dashboardId: string) =>
      this.state.widgets.filter((w) => w.dashboardId === dashboardId),
    findById: (id: string) => this.state.widgets.find((w) => w.id === id),
    create: (widget: Widget) => {
      this.state.widgets.push(widget);
      this.save();
      return widget;
    },
    update: (id: string, updates: Partial<Widget>) => {
      const idx = this.state.widgets.findIndex((w) => w.id === id);
      if (idx === -1) return undefined;
      this.state.widgets[idx] = {
        ...this.state.widgets[idx],
        ...updates,
        updatedAt: nowIso(),
      };
      this.save();
      return this.state.widgets[idx];
    },
    delete: (id: string) => {
      const idx = this.state.widgets.findIndex((w) => w.id === id);
      if (idx === -1) return false;
      this.state.widgets.splice(idx, 1);
      this.save();
      return true;
    },
  };

  kpis = {
    findAll: (tenantId: string) =>
      this.state.kpis.filter((k) => k.tenantId === tenantId),
    findById: (id: string) => this.state.kpis.find((k) => k.id === id),
    create: (kpi: KPI) => {
      this.state.kpis.push(kpi);
      this.save();
      return kpi;
    },
    update: (id: string, updates: Partial<KPI>) => {
      const idx = this.state.kpis.findIndex((k) => k.id === id);
      if (idx === -1) return undefined;
      this.state.kpis[idx] = {
        ...this.state.kpis[idx],
        ...updates,
        updatedAt: nowIso(),
      };
      this.save();
      return this.state.kpis[idx];
    },
    delete: (id: string) => {
      const idx = this.state.kpis.findIndex((k) => k.id === id);
      if (idx === -1) return false;
      this.state.kpis.splice(idx, 1);
      this.save();
      return true;
    },
  };

  metrics = {
    findAll: (tenantId: string) =>
      this.state.metrics.filter((m) => m.tenantId === tenantId),
    findById: (id: string) => this.state.metrics.find((m) => m.id === id),
    create: (metric: Metric) => {
      this.state.metrics.push(metric);
      this.save();
      return metric;
    },
    update: (id: string, updates: Partial<Metric>) => {
      const idx = this.state.metrics.findIndex((m) => m.id === id);
      if (idx === -1) return undefined;
      this.state.metrics[idx] = {
        ...this.state.metrics[idx],
        ...updates,
        updatedAt: nowIso(),
      };
      this.save();
      return this.state.metrics[idx];
    },
    delete: (id: string) => {
      const idx = this.state.metrics.findIndex((m) => m.id === id);
      if (idx === -1) return false;
      this.state.metrics.splice(idx, 1);
      this.save();
      return true;
    },
  };

  reports = {
    findAll: (tenantId: string) =>
      this.state.reports.filter((r) => r.tenantId === tenantId),
    findById: (id: string) => this.state.reports.find((r) => r.id === id),
    create: (report: Report) => {
      this.state.reports.push(report);
      this.save();
      return report;
    },
    update: (id: string, updates: Partial<Report>) => {
      const idx = this.state.reports.findIndex((r) => r.id === id);
      if (idx === -1) return undefined;
      this.state.reports[idx] = {
        ...this.state.reports[idx],
        ...updates,
        updatedAt: nowIso(),
      };
      this.save();
      return this.state.reports[idx];
    },
    delete: (id: string) => {
      const idx = this.state.reports.findIndex((r) => r.id === id);
      if (idx === -1) return false;
      this.state.reports.splice(idx, 1);
      this.save();
      return true;
    },
  };

  events = {
    findAll: (tenantId: string, limit = 100) =>
      this.state.events
        .filter((e) => e.tenantId === tenantId)
        .slice(0, limit),
    findById: (id: string) => this.state.events.find((e) => e.id === id),
    create: (event: AnalyticsEvent) => {
      this.state.events.unshift(event);
      if (this.state.events.length > 10000) {
        this.state.events = this.state.events.slice(0, 10000);
      }
      this.save();
      return event;
    },
  };

  funnels = {
    findAll: (tenantId: string) =>
      this.state.funnels.filter((f) => f.tenantId === tenantId),
    findById: (id: string) => this.state.funnels.find((f) => f.id === id),
    create: (funnel: Funnel) => {
      this.state.funnels.push(funnel);
      this.save();
      return funnel;
    },
    update: (id: string, updates: Partial<Funnel>) => {
      const idx = this.state.funnels.findIndex((f) => f.id === id);
      if (idx === -1) return undefined;
      this.state.funnels[idx] = {
        ...this.state.funnels[idx],
        ...updates,
        updatedAt: nowIso(),
      };
      this.save();
      return this.state.funnels[idx];
    },
    delete: (id: string) => {
      const idx = this.state.funnels.findIndex((f) => f.id === id);
      if (idx === -1) return false;
      this.state.funnels.splice(idx, 1);
      this.save();
      return true;
    },
  };

  cohorts = {
    findAll: (tenantId: string) =>
      this.state.cohorts.filter((c) => c.tenantId === tenantId),
    findById: (id: string) => this.state.cohorts.find((c) => c.id === id),
    create: (cohort: Cohort) => {
      this.state.cohorts.push(cohort);
      this.save();
      return cohort;
    },
    update: (id: string, updates: Partial<Cohort>) => {
      const idx = this.state.cohorts.findIndex((c) => c.id === id);
      if (idx === -1) return undefined;
      this.state.cohorts[idx] = {
        ...this.state.cohorts[idx],
        ...updates,
        updatedAt: nowIso(),
      };
      this.save();
      return this.state.cohorts[idx];
    },
    delete: (id: string) => {
      const idx = this.state.cohorts.findIndex((c) => c.id === id);
      if (idx === -1) return false;
      this.state.cohorts.splice(idx, 1);
      this.save();
      return true;
    },
  };

  segments = {
    findAll: (tenantId: string) =>
      this.state.segments.filter((s) => s.tenantId === tenantId),
    findById: (id: string) => this.state.segments.find((s) => s.id === id),
    create: (segment: Segment) => {
      this.state.segments.push(segment);
      this.save();
      return segment;
    },
    update: (id: string, updates: Partial<Segment>) => {
      const idx = this.state.segments.findIndex((s) => s.id === id);
      if (idx === -1) return undefined;
      this.state.segments[idx] = {
        ...this.state.segments[idx],
        ...updates,
        updatedAt: nowIso(),
      };
      this.save();
      return this.state.segments[idx];
    },
    delete: (id: string) => {
      const idx = this.state.segments.findIndex((s) => s.id === id);
      if (idx === -1) return false;
      this.state.segments.splice(idx, 1);
      this.save();
      return true;
    },
  };

  alerts = {
    findAll: (tenantId: string) =>
      this.state.alerts.filter((a) => a.tenantId === tenantId),
    findById: (id: string) => this.state.alerts.find((a) => a.id === id),
    create: (alert: AlertRule) => {
      this.state.alerts.push(alert);
      this.save();
      return alert;
    },
    update: (id: string, updates: Partial<AlertRule>) => {
      const idx = this.state.alerts.findIndex((a) => a.id === id);
      if (idx === -1) return undefined;
      this.state.alerts[idx] = {
        ...this.state.alerts[idx],
        ...updates,
        updatedAt: nowIso(),
      };
      this.save();
      return this.state.alerts[idx];
    },
    delete: (id: string) => {
      const idx = this.state.alerts.findIndex((a) => a.id === id);
      if (idx === -1) return false;
      this.state.alerts.splice(idx, 1);
      this.save();
      return true;
    },
  };

  forecasts = {
    findAll: (tenantId: string) =>
      this.state.forecasts.filter((f) => f.tenantId === tenantId),
    findById: (id: string) => this.state.forecasts.find((f) => f.id === id),
    create: (forecast: Forecast) => {
      this.state.forecasts.push(forecast);
      this.save();
      return forecast;
    },
  };

  attributionModels = {
    findAll: (tenantId: string) =>
      this.state.attributionModels.filter((a) => a.tenantId === tenantId),
    findById: (id: string) =>
      this.state.attributionModels.find((a) => a.id === id),
    create: (model: AttributionModel) => {
      this.state.attributionModels.push(model);
      this.save();
      return model;
    },
    update: (id: string, updates: Partial<AttributionModel>) => {
      const idx = this.state.attributionModels.findIndex((a) => a.id === id);
      if (idx === -1) return undefined;
      this.state.attributionModels[idx] = {
        ...this.state.attributionModels[idx],
        ...updates,
        updatedAt: nowIso(),
      };
      this.save();
      return this.state.attributionModels[idx];
    },
    delete: (id: string) => {
      const idx = this.state.attributionModels.findIndex((a) => a.id === id);
      if (idx === -1) return false;
      this.state.attributionModels.splice(idx, 1);
      this.save();
      return true;
    },
  };

  dataSources = {
    findAll: (tenantId: string) =>
      this.state.dataSources.filter((d) => d.tenantId === tenantId),
    findById: (id: string) => this.state.dataSources.find((d) => d.id === id),
    create: (ds: DataSource) => {
      this.state.dataSources.push(ds);
      this.save();
      return ds;
    },
    update: (id: string, updates: Partial<DataSource>) => {
      const idx = this.state.dataSources.findIndex((d) => d.id === id);
      if (idx === -1) return undefined;
      this.state.dataSources[idx] = {
        ...this.state.dataSources[idx],
        ...updates,
        updatedAt: nowIso(),
      };
      this.save();
      return this.state.dataSources[idx];
    },
    delete: (id: string) => {
      const idx = this.state.dataSources.findIndex((d) => d.id === id);
      if (idx === -1) return false;
      this.state.dataSources.splice(idx, 1);
      this.save();
      return true;
    },
  };

  insights = {
    findAll: (tenantId: string) =>
      this.state.insights.filter((i) => i.tenantId === tenantId),
    findById: (id: string) => this.state.insights.find((i) => i.id === id),
    create: (insight: Insight) => {
      this.state.insights.push(insight);
      this.save();
      return insight;
    },
  };

  exportJobs = {
    findAll: (tenantId: string) =>
      this.state.exportJobs.filter((e) => e.tenantId === tenantId),
    findById: (id: string) => this.state.exportJobs.find((e) => e.id === id),
    create: (job: ExportJob) => {
      this.state.exportJobs.push(job);
      this.save();
      return job;
    },
    update: (id: string, updates: Partial<ExportJob>) => {
      const idx = this.state.exportJobs.findIndex((e) => e.id === id);
      if (idx === -1) return undefined;
      this.state.exportJobs[idx] = {
        ...this.state.exportJobs[idx],
        ...updates,
        updatedAt: nowIso(),
      };
      this.save();
      return this.state.exportJobs[idx];
    },
  };
}

import {
  AnalyticsState,
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
} from "../domain";
