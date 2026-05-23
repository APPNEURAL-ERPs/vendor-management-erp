const assert = require('node:assert/strict');
const test = require('node:test');
const { unlinkSync } = require('node:fs');
const { join } = require('node:path');
const { DataStore } = require('../dist/core/datastore.js');
const { EventBus } = require('../dist/core/event-bus.js');
const { FinanceService } = require('../dist/services/finance.service.js');
const { createSeedState } = require('../dist/seed-state.js');
const { hasPermission } = require('../dist/core/security.js');

function makeService() {
  const file = join(process.cwd(), 'data', `financeos-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  const store = new DataStore(file);
  store.reset(createSeedState('test-tenant'));
  const service = new FinanceService(store, new EventBus(store));
  const actor = { tenantId: 'test-tenant', userId: 'tester', role: 'finance_admin' };
  return { service, actor, file };
}
function cleanup(file) { try { unlinkSync(file); } catch {} }

test('FinanceOS seed overview returns finance analytics', () => {
  const { service, actor, file } = makeService();
  const overview = service.overview(actor);
  assert.equal(overview.analytics.totalCustomers, 2);
  assert.equal(overview.analytics.totalVendors, 2);
  assert.equal(overview.analytics.totalInvoices, 2);
  assert.equal(overview.analytics.openInvoices, 1);
  assert.equal(overview.analytics.activeSubscriptions, 1);
  assert.ok(overview.analytics.receivables >= 4900);
  cleanup(file);
});

test('FinanceOS creates invoice, sends it, records payments, and posts ledger entries', () => {
  const { service, actor, file } = makeService();
  const invoice = service.createInvoice(actor, {
    customerId: 'cust_demo_acme',
    paymentTermsDays: 10,
    lineItems: [{ description: 'FinanceOS setup', quantity: 2, unitPrice: 1000, taxRuleId: 'tax_gst_18' }]
  });
  assert.equal(invoice.status, 'draft');
  assert.equal(invoice.subtotalAmount, 2000);
  assert.equal(invoice.taxAmount, 360);
  assert.equal(invoice.totalAmount, 2360);

  const sent = service.sendInvoice(actor, invoice.id);
  assert.equal(sent.status, 'sent');

  const firstPayment = service.recordPayment(actor, { invoiceId: invoice.id, amount: 1000, method: 'upi' });
  assert.equal(firstPayment.status, 'succeeded');
  const partial = service.getInvoice(actor, invoice.id);
  assert.equal(partial.status, 'partially_paid');
  assert.equal(partial.balanceDue, 1360);

  service.recordPayment(actor, { invoiceId: invoice.id, amount: 1360, method: 'bank_transfer' });
  const paid = service.getInvoice(actor, invoice.id);
  assert.equal(paid.status, 'paid');
  assert.equal(paid.balanceDue, 0);

  const ledger = service.listLedger(actor);
  assert.ok(ledger.filter((entry) => entry.sourceId === invoice.id).length >= 2);
  cleanup(file);
});

test('FinanceOS processes refunds and reopens invoice balance', () => {
  const { service, actor, file } = makeService();
  const invoice = service.createInvoice(actor, { customerId: 'cust_demo_acme', lineItems: [{ description: 'Refund test', quantity: 1, unitPrice: 1000, taxRuleId: 'tax_zero' }] });
  service.sendInvoice(actor, invoice.id);
  const payment = service.recordPayment(actor, { invoiceId: invoice.id, amount: 1000, method: 'card' });
  const refund = service.createRefund(actor, { paymentId: payment.id, amount: 250, reason: 'Customer credit' });
  assert.equal(refund.status, 'processed');
  const reopened = service.getInvoice(actor, invoice.id);
  assert.equal(reopened.status, 'partially_paid');
  assert.equal(reopened.balanceDue, 250);
  cleanup(file);
});

test('FinanceOS manages expenses, approvals, payment, budgets, and P&L', () => {
  const { service, actor, file } = makeService();
  const budget = service.createBudget(actor, { name: 'Travel FY26', category: 'Travel', amount: 5000, periodStart: '2026-01-01T00:00:00.000Z', periodEnd: '2026-12-31T23:59:59.999Z' });
  assert.equal(budget.amount, 5000);
  const expense = service.createExpense(actor, { vendorId: 'vend_demo_media', category: 'Travel', description: 'Client visit', amount: 1000, taxAmount: 180 });
  assert.equal(expense.status, 'draft');
  const submitted = service.submitExpense(actor, expense.id);
  assert.equal(submitted.status, 'submitted');
  const approved = service.approveExpense(actor, expense.id);
  assert.equal(approved.status, 'approved');
  const paid = service.payExpense(actor, expense.id, { method: 'bank_transfer' });
  assert.equal(paid.status, 'paid');
  assert.ok(paid.paymentId);
  const analytics = service.analytics(actor);
  const travel = analytics.budgetUtilization.find((item) => item.budgetId === budget.id);
  assert.equal(travel.spent, 1180);
  const pl = service.profitLoss(actor, '2026-01-01T00:00:00.000Z', '2026-12-31T23:59:59.999Z');
  assert.ok(pl.expenseAmount >= 1000);
  cleanup(file);
});

test('FinanceOS creates subscription plans, subscriptions, and generated invoices', () => {
  const { service, actor, file } = makeService();
  const plan = service.createPlan(actor, { name: 'AI Suite Monthly', amount: 3000, interval: 'monthly', taxRuleId: 'tax_gst_18' });
  const sub = service.createSubscription(actor, { customerId: 'cust_demo_retail', planId: plan.id, startDate: '2026-05-01T00:00:00.000Z' });
  assert.equal(sub.status, 'active');
  const invoice = service.generateSubscriptionInvoice(actor, sub.id);
  assert.equal(invoice.customerId, 'cust_demo_retail');
  assert.equal(invoice.totalAmount, 3540);
  const updated = service.listSubscriptions(actor).find((item) => item.id === sub.id);
  assert.equal(updated.latestInvoiceId, invoice.id);
  cleanup(file);
});

test('FinanceOS permissions protect finance operations by role', () => {
  assert.equal(hasPermission('viewer', 'finance.invoices.write'), false);
  assert.equal(hasPermission('billing_agent', 'finance.invoices.write'), true);
  assert.equal(hasPermission('accountant', 'finance.ledger.read'), true);
  assert.equal(hasPermission('finance_manager', 'finance.expenses.approve'), true);
  assert.equal(hasPermission('tax_manager', 'finance.tax.write'), true);
  assert.equal(hasPermission('auditor', 'finance.audit.read'), true);
  assert.equal(hasPermission('finance_admin', 'finance.budgets.write'), true);
});
