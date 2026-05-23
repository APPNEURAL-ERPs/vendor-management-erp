import { Router } from "../core/http";
import { Role } from "../core/domain";
import { FinanceService } from "../services/finance.service";
import { docs } from "../docs";

export function registerRoutes(router: Router, service: FinanceService): Router {
  router.get("/health", () => service.health());
  router.get("/docs", () => docs(router.listRoutes()));

  router.get("/financeos/overview", ({ actor }) => service.overview(actor), "finance.read");
  router.get("/financeos/analytics", ({ actor }) => service.analytics(actor), "finance.analytics.read");
  router.get("/financeos/reports/profit-loss", ({ actor, query }) => service.profitLoss(actor, query.get("start") ?? undefined, query.get("end") ?? undefined), "finance.reports.read");
  router.get("/financeos/reports/aging", ({ actor }) => service.agingReport(actor), "finance.reports.read");

  router.get("/financeos/customers", ({ actor }) => service.listCounterparties(actor, "customer"), "finance.counterparties.read");
  router.post("/financeos/customers", ({ actor, body }) => service.createCustomer(actor, body), "finance.counterparties.write");
  router.get("/financeos/vendors", ({ actor }) => service.listCounterparties(actor, "vendor"), "finance.counterparties.read");
  router.post("/financeos/vendors", ({ actor, body }) => service.createVendor(actor, body), "finance.counterparties.write");

  router.get("/financeos/accounts", ({ actor }) => service.listAccounts(actor), "finance.accounts.read");
  router.post("/financeos/accounts", ({ actor, body }) => service.createAccount(actor, body), "finance.accounts.write");

  router.get("/financeos/tax-rules", ({ actor }) => service.listTaxRules(actor), "finance.tax.read");
  router.post("/financeos/tax-rules", ({ actor, body }) => service.createTaxRule(actor, body), "finance.tax.write");

  router.get("/financeos/invoices", ({ actor }) => service.listInvoices(actor), "finance.invoices.read");
  router.post("/financeos/invoices", ({ actor, body }) => service.createInvoice(actor, body), "finance.invoices.write");
  router.get("/financeos/invoices/:id", ({ actor, params }) => service.getInvoice(actor, params.id), "finance.invoices.read");
  router.post("/financeos/invoices/:id/send", ({ actor, params }) => service.sendInvoice(actor, params.id), "finance.invoices.write");
  router.post("/financeos/invoices/:id/void", ({ actor, params }) => service.voidInvoice(actor, params.id), "finance.invoices.write");

  router.get("/financeos/payments", ({ actor }) => service.listPayments(actor), "finance.payments.read");
  router.post("/financeos/payments", ({ actor, body }) => service.recordPayment(actor, body), "finance.payments.write");
  router.post("/financeos/refunds", ({ actor, body }) => service.createRefund(actor, body), "finance.refunds.write");

  router.get("/financeos/expenses", ({ actor }) => service.listExpenses(actor), "finance.expenses.read");
  router.post("/financeos/expenses", ({ actor, body }) => service.createExpense(actor, body), "finance.expenses.write");
  router.post("/financeos/expenses/:id/submit", ({ actor, params }) => service.submitExpense(actor, params.id), "finance.expenses.write");
  router.post("/financeos/expenses/:id/approve", ({ actor, params }) => service.approveExpense(actor, params.id), "finance.expenses.approve");
  router.post("/financeos/expenses/:id/pay", ({ actor, params, body }) => service.payExpense(actor, params.id, body), "finance.payments.write");

  router.get("/financeos/budgets", ({ actor }) => service.listBudgets(actor), "finance.budgets.read");
  router.post("/financeos/budgets", ({ actor, body }) => service.createBudget(actor, body), "finance.budgets.write");

  router.get("/financeos/subscription-plans", ({ actor }) => service.listPlans(actor), "finance.subscriptions.read");
  router.post("/financeos/subscription-plans", ({ actor, body }) => service.createPlan(actor, body), "finance.subscriptions.write");
  router.get("/financeos/subscriptions", ({ actor }) => service.listSubscriptions(actor), "finance.subscriptions.read");
  router.post("/financeos/subscriptions", ({ actor, body }) => service.createSubscription(actor, body), "finance.subscriptions.write");
  router.post("/financeos/subscriptions/:id/generate-invoice", ({ actor, params }) => service.generateSubscriptionInvoice(actor, params.id), "finance.subscriptions.write");

  router.get("/financeos/ledger", ({ actor }) => service.listLedger(actor), "finance.ledger.read");
  router.get("/financeos/events", ({ actor }) => service.listEvents(actor), "finance.read");
  router.get("/financeos/audit-logs", ({ actor }) => service.listAuditLogs(actor), "finance.audit.read");
  router.get("/financeos/permissions/:role", ({ params }) => service.permissions(params.role as Role));

  return router;
}
