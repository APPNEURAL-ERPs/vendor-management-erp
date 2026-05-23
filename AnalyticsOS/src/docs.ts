export function docs() {
  return {
    name: "AnalyticsOS",
    version: "1.0.0",
    description:
      "Analytics dashboards, KPIs, metrics, funnels, cohorts, attribution, and business intelligence for the APPNEURAL ecosystem.",
    auth: {
      headers: {
        "x-role":
          "owner | admin | analytics_admin | analyst | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id",
      },
    },
    coreConcepts: {
      dashboard: "A collection of widgets that visualize metrics and KPIs on a single page.",
      widget: "A visual component on a dashboard that displays data using charts, tables, KPIs, or other visualizations.",
      kpi: "A key performance indicator with a target, current value, and direction.",
      metric: "A measurable unit of data with formulas and aggregations.",
      report: "A formatted export of dashboards, KPIs, and other analytics data.",
      event: "A tracked user or system event for analytics purposes.",
      funnel: "A conversion path with multiple steps to analyze drop-off rates.",
      cohort: "A group of users or entities analyzed over time for retention or behavior.",
      segment: "A filtered subset of users or entities based on rules.",
      alert: "A rule that triggers notifications when conditions are met.",
      forecast: "Predictive analytics using historical data and statistical models.",
      attributionModel: "Rules for attributing conversions to touchpoints in the customer journey.",
      dataSource: "An external system or database connected for analytics data.",
      insight: "An automatically generated observation, anomaly detection, or recommendation.",
    },
    examples: {
      createDashboard: {
        method: "POST",
        path: "/analyticsos/dashboards",
        headers: { "x-role": "analytics_admin" },
        body: {
          name: "Sales Dashboard",
          description: "Revenue and pipeline metrics",
          tags: ["sales", "revenue"],
          layout: { columns: 12, rows: 6, widgets: [] },
        },
      },
      trackEvent: {
        method: "POST",
        path: "/analyticsos/events",
        headers: { "x-role": "analyst" },
        body: {
          type: "page_view",
          source: "WebsiteOS",
          userId: "user_123",
          data: { page: "/dashboard", duration: 120 },
        },
      },
      createFunnel: {
        method: "POST",
        path: "/analyticsos/funnels",
        headers: { "x-role": "analyst" },
        body: {
          name: "Lead Conversion Funnel",
          steps: [
            { name: "Visitor", event: "page_view", order: 1 },
            { name: "Lead Form", event: "lead_form_submit", order: 2 },
            { name: "Sales Call", event: "sales_call_completed", order: 3 },
            { name: "Deal Won", event: "deal_closed_won", order: 4 },
          ],
        },
      },
      createKPI: {
        method: "POST",
        path: "/analyticsos/kpis",
        headers: { "x-role": "analytics_admin" },
        body: {
          name: "Monthly Revenue",
          metricId: "metric_revenue",
          target: 1000000,
          current: 850000,
          unit: "USD",
          direction: "higher_is_better",
        },
      },
      analyzeFunnel: {
        method: "POST",
        path: "/analyticsos/funnels/:id/analyze",
        headers: { "x-role": "analyst" },
        body: {
          startDate: "2026-04-01T00:00:00Z",
          endDate: "2026-04-30T23:59:59Z",
        },
      },
    },
  };
}
