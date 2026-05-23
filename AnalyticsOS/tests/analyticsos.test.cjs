const test = require('node:test');
const assert = require('node:assert/strict');
const { unlinkSync } = require('node:fs');
const { createAnalyticsOsApp } = require('../dist/main.js');

function createTestApp() {
  const dbPath = `/tmp/analyticsos-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
  process.env.ANALYTICSOS_DB_PATH = dbPath;
  process.env.ANALYTICSOS_AUTO_SEED = 'false';
  process.env.DEFAULT_TENANT_ID = 'test-tenant';
  try { unlinkSync(dbPath); } catch (_) {}
  const app = createAnalyticsOsApp();
  const actor = { tenantId: 'test-tenant', userId: 'tester', role: 'admin' };
  return { ...app, actor };
}

test('AnalyticsOS calculates grouped revenue metric', () => {
  const { services, actor } = createTestApp();
  const analytics = services.analytics;

  const source = analytics.createDataSource(actor, { name: 'CommerceOS', type: 'platform', platform: 'CommerceOS' });
  analytics.ingestRecord(actor, {
    sourceId: source.id,
    entity: 'order',
    timestamp: '2026-05-15T10:00:00.000Z',
    dimensions: { channel: 'online', city: 'Bengaluru' },
    metrics: { revenue: 1000, orders: 2 }
  });
  analytics.ingestRecord(actor, {
    sourceId: source.id,
    entity: 'order',
    timestamp: '2026-05-15T11:00:00.000Z',
    dimensions: { channel: 'pos', city: 'Bengaluru' },
    metrics: { revenue: 500, orders: 1 }
  });

  const metric = analytics.createMetric(actor, {
    key: 'total_revenue',
    name: 'Total Revenue',
    entity: 'order',
    aggregation: 'sum',
    field: 'metrics.revenue',
    defaultGroupBy: ['dimensions.channel'],
    format: 'currency'
  });

  const result = analytics.calculateMetric(actor, metric.id);
  assert.equal(result.value, 1500);
  assert.equal(result.groups.length, 2);
  assert.equal(result.groups.find((group) => group.dimensions['dimensions.channel'] === 'online').value, 1000);
});

test('AnalyticsOS creates KPI, dashboard, report, alert, and export', () => {
  const { services, actor } = createTestApp();
  const analytics = services.analytics;

  const source = analytics.createDataSource(actor, { name: 'CommerceOS', type: 'platform' });
  analytics.ingestRecord(actor, {
    sourceId: source.id,
    entity: 'order',
    dimensions: { channel: 'online' },
    metrics: { revenue: 1200, orders: 2 }
  });

  const metric = analytics.createMetric(actor, {
    key: 'total_revenue',
    name: 'Total Revenue',
    entity: 'order',
    aggregation: 'sum',
    field: 'metrics.revenue',
    format: 'currency'
  });

  const kpi = analytics.createKpi(actor, {
    name: 'Revenue Target',
    metricId: metric.id,
    target: 1000,
    comparison: 'gte'
  });
  const snapshot = analytics.calculateKpi(actor, kpi.id);
  assert.equal(snapshot.status, 'on_track');

  const dashboard = analytics.createDashboard(actor, {
    name: 'Executive Dashboard',
    widgets: [{ title: 'Revenue', type: 'chart', metricIds: [metric.id], kpiIds: [], chartType: 'bar' }]
  });
  const rendered = analytics.renderDashboard(actor, dashboard.id);
  assert.equal(rendered.widgets.length, 1);

  const report = analytics.createReport(actor, {
    name: 'Sales Report',
    metricIds: [metric.id],
    dimensions: ['dimensions.channel']
  });
  const generated = analytics.generateReport(actor, report.id);
  assert.equal(generated.summary.metricCount, 1);

  analytics.createAlertRule(actor, {
    name: 'Revenue High',
    metricId: metric.id,
    operator: 'gte',
    threshold: 1000,
    severity: 'warning',
    cooldownMinutes: 0
  });
  const incidents = analytics.evaluateAlerts(actor);
  assert.equal(incidents.length, 1);
  assert.equal(incidents[0].status, 'open');

  const exportJob = analytics.createExport(actor, {
    targetType: 'report',
    targetId: report.id,
    format: 'csv'
  });
  assert.equal(exportJob.status, 'completed');
  assert.ok(exportJob.content.includes('metricKey'));
});
