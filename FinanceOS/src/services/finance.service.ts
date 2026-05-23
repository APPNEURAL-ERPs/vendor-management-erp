import { DataStore } from "../core/datastore";
import { EventBus } from "../core/event-bus";
import { badRequest, notFound } from "../core/errors";
import { Budget, Counterparty, CurrencyCode, Expense, FinanceAccount, FinanceState, Invoice, Payment, Refund, RequestActor, Role, Subscription, SubscriptionPlan, TaxRule } from "../core/domain";
import { humanNumber, newId, nowIso } from "../core/id";
import { addDays, addMonths, assertPositiveAmount, assertRequired, asArray, clone, inDateRange, normalizeEmail, numberOr, round, sum } from "../core/utils";
import { listPermissions } from "../core/security";
import { TaxEngine } from "../engines/tax-engine";
import { LedgerEngine } from "../engines/ledger-engine";

export class FinanceService {
  private readonly taxEngine = new TaxEngine();
  private readonly ledger: LedgerEngine;

  constructor(private readonly store: DataStore, private readonly events: EventBus) {
    this.ledger = new LedgerEngine(store);
  }

  health(): Record<string, unknown> { return { status: "ok", service: "FinanceOS", time: nowIso() }; }
  permissions(role: Role): string[] { return listPermissions(role); }

  overview(actor: RequestActor): Record<string, unknown> {
    return {
      analytics: this.analytics(actor),
      customers: this.listCounterparties(actor, "customer").slice(0, 5),
      vendors: this.listCounterparties(actor, "vendor").slice(0, 5),
      invoices: this.listInvoices(actor).slice(0, 5),
      expenses: this.listExpenses(actor).slice(0, 5),
      budgets: this.listBudgets(actor).slice(0, 5),
      recentEvents: this.listEvents(actor).slice(0, 10)
    };
  }

  listCounterparties(actor: RequestActor, type?: "customer" | "vendor" | "both"): Counterparty[] {
    return this.byTenant(actor, this.state().counterparties).filter((item) => !type || item.type === type || item.type === "both");
  }

  createCustomer(actor: RequestActor, input: any): Counterparty { return this.createCounterparty(actor, { ...input, type: "customer" }); }
  createVendor(actor: RequestActor, input: any): Counterparty { return this.createCounterparty(actor, { ...input, type: "vendor" }); }

  createCounterparty(actor: RequestActor, input: any): Counterparty {
    assertRequired(input.displayName, "displayName");
    const now = nowIso();
    const counterparty: Counterparty = {
      id: newId("party"), tenantId: actor.tenantId, createdAt: now, updatedAt: now,
      type: input.type === "vendor" ? "vendor" : input.type === "both" ? "both" : "customer",
      displayName: String(input.displayName), legalName: input.legalName, email: input.email ? normalizeEmail(input.email) : undefined,
      phone: input.phone, taxId: input.taxId, billingAddress: input.billingAddress, paymentTermsDays: numberOr(input.paymentTermsDays, 15),
      status: input.status ?? "active", tags: asArray<string>(input.tags), metadata: input.metadata ?? {}, createdBy: actor.userId
    };
    this.state().counterparties.unshift(counterparty);
    this.store.save();
    this.store.audit(actor, "counterparty.created", "counterparty", counterparty.id, undefined, counterparty);
    this.events.emit(actor, "finance.counterparty.created", { counterpartyId: counterparty.id, type: counterparty.type, displayName: counterparty.displayName });
    return clone(counterparty);
  }

  listAccounts(actor: RequestActor): FinanceAccount[] { return this.byTenant(actor, this.state().accounts); }

  createAccount(actor: RequestActor, input: any): FinanceAccount {
    assertRequired(input.code, "code");
    assertRequired(input.name, "name");
    assertRequired(input.type, "type");
    if (!["asset", "liability", "equity", "revenue", "expense"].includes(String(input.type))) badRequest("type must be asset, liability, equity, revenue, or expense");
    if (this.listAccounts(actor).some((account) => account.code === String(input.code))) badRequest(`Account code ${input.code} already exists`);
    const now = nowIso();
    const account: FinanceAccount = { id: newId("acct"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, code: String(input.code), name: String(input.name), type: input.type, currency: input.currency ?? "INR", parentAccountId: input.parentAccountId, status: input.status ?? "active", createdBy: actor.userId };
    this.state().accounts.unshift(account);
    this.store.save();
    this.store.audit(actor, "account.created", "account", account.id, undefined, account);
    this.events.emit(actor, "finance.account.created", { accountId: account.id, code: account.code, type: account.type });
    return clone(account);
  }

  listTaxRules(actor: RequestActor): TaxRule[] { return this.byTenant(actor, this.state().taxRules); }

  createTaxRule(actor: RequestActor, input: any): TaxRule {
    assertRequired(input.name, "name");
    const rate = numberOr(input.rate, 0);
    if (rate < 0 || rate > 100) badRequest("rate must be between 0 and 100");
    const now = nowIso();
    const rule: TaxRule = { id: newId("tax"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, name: String(input.name), type: input.type ?? "gst", jurisdiction: input.jurisdiction ?? "IN", rate, inclusive: Boolean(input.inclusive ?? false), recoverable: Boolean(input.recoverable ?? true), status: input.status ?? "active", createdBy: actor.userId };
    this.state().taxRules.unshift(rule);
    this.store.save();
    this.store.audit(actor, "tax_rule.created", "taxRule", rule.id, undefined, rule);
    this.events.emit(actor, "finance.tax_rule.created", { taxRuleId: rule.id, name: rule.name, rate: rule.rate });
    return clone(rule);
  }

  listInvoices(actor: RequestActor): Invoice[] { return this.byTenant(actor, this.state().invoices); }
  getInvoice(actor: RequestActor, id: string): Invoice { return clone(this.requireInvoice(actor, id)); }

  createInvoice(actor: RequestActor, input: any): Invoice {
    assertRequired(input.customerId, "customerId");
    const customer = this.requireCounterparty(actor, input.customerId);
    if (customer.type === "vendor") badRequest("Invoice customerId must reference a customer or both counterparty");
    const rawLines = asArray<any>(input.lineItems);
    if (rawLines.length === 0) badRequest("lineItems must contain at least one item");
    const taxRules = this.listTaxRules(actor);
    const lines = rawLines.map((line, index) => {
      assertRequired(line.description, `lineItems[${index}].description`);
      const quantity = assertPositiveAmount(line.quantity, `lineItems[${index}].quantity`);
      const unitPrice = assertPositiveAmount(line.unitPrice, `lineItems[${index}].unitPrice`);
      if (line.taxRuleId && !taxRules.some((rule) => rule.id === line.taxRuleId)) notFound(`Tax rule ${line.taxRuleId} not found`);
      return { description: String(line.description), quantity, unitPrice, accountId: line.accountId, taxRuleId: line.taxRuleId };
    });
    const now = nowIso();
    const issueDate = input.issueDate ?? now;
    const paymentTermsDays = numberOr(input.paymentTermsDays, customer.paymentTermsDays);
    const dueDate = input.dueDate ?? addDays(issueDate, paymentTermsDays);
    const totals = this.taxEngine.calculateInvoice(lines, numberOr(input.discountAmount, 0), taxRules);
    const invoice: Invoice = {
      id: newId("inv"), tenantId: actor.tenantId, createdAt: now, updatedAt: now,
      invoiceNumber: input.invoiceNumber ?? humanNumber("INV"), customerId: customer.id, issueDate, dueDate,
      currency: input.currency ?? "INR", status: input.status ?? "draft", paymentTermsDays,
      lineItems: totals.lineItems, subtotalAmount: totals.subtotalAmount, discountAmount: totals.discountAmount,
      taxableAmount: totals.taxableAmount, taxAmount: totals.taxAmount, totalAmount: totals.totalAmount,
      paidAmount: 0, refundedAmount: 0, balanceDue: totals.totalAmount, notes: input.notes, createdBy: actor.userId
    };
    this.state().invoices.unshift(invoice);
    this.store.save();
    this.store.audit(actor, "invoice.created", "invoice", invoice.id, undefined, invoice);
    this.events.emit(actor, "finance.invoice.created", { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, customerId: invoice.customerId, totalAmount: invoice.totalAmount });
    if (invoice.status !== "draft") this.ledger.postInvoice(actor, invoice);
    return clone(invoice);
  }

  sendInvoice(actor: RequestActor, id: string): Invoice {
    const invoice = this.requireInvoice(actor, id);
    if (invoice.status === "void") badRequest("Cannot send a void invoice");
    const before = clone(invoice);
    invoice.status = invoice.balanceDue <= 0 ? "paid" : "sent";
    invoice.sentAt = invoice.sentAt ?? nowIso();
    invoice.updatedAt = nowIso();
    this.ledger.postInvoice(actor, invoice);
    this.store.save();
    this.store.audit(actor, "invoice.sent", "invoice", invoice.id, before, invoice);
    this.events.emit(actor, "finance.invoice.sent", { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, customerId: invoice.customerId, totalAmount: invoice.totalAmount });
    return clone(invoice);
  }

  voidInvoice(actor: RequestActor, id: string): Invoice {
    const invoice = this.requireInvoice(actor, id);
    if (invoice.paidAmount > 0) badRequest("Cannot void an invoice that has payments. Refund or reverse payment first.");
    const before = clone(invoice);
    invoice.status = "void";
    invoice.voidedAt = nowIso();
    invoice.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "invoice.voided", "invoice", invoice.id, before, invoice);
    this.events.emit(actor, "finance.invoice.voided", { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber });
    return clone(invoice);
  }

  listPayments(actor: RequestActor): Payment[] { return this.byTenant(actor, this.state().payments); }

  recordPayment(actor: RequestActor, input: any): Payment {
    const amount = assertPositiveAmount(input.amount, "amount");
    const now = nowIso();
    let invoice: Invoice | undefined;
    if (input.invoiceId) {
      invoice = this.requireInvoice(actor, input.invoiceId);
      if (["draft", "void"].includes(invoice.status)) badRequest("Payments can only be recorded against sent, overdue, or partially paid invoices");
      if (amount > invoice.balanceDue + 0.01) badRequest(`Payment amount cannot exceed balance due ${invoice.balanceDue}`);
    }
    const payment: Payment = {
      id: newId("pay"), tenantId: actor.tenantId, createdAt: now, updatedAt: now,
      paymentNumber: input.paymentNumber ?? humanNumber("PAY"), customerId: input.customerId ?? invoice?.customerId,
      vendorId: input.vendorId, invoiceId: invoice?.id, expenseId: input.expenseId, amount, refundedAmount: 0,
      currency: input.currency ?? invoice?.currency ?? "INR", method: input.method ?? "bank_transfer", status: input.status ?? "succeeded",
      processorRef: input.processorRef, receivedAt: input.receivedAt ?? now, memo: input.memo, createdBy: actor.userId
    };
    this.state().payments.unshift(payment);
    if (invoice && payment.status === "succeeded") {
      invoice.paidAmount = round(invoice.paidAmount + amount);
      invoice.balanceDue = round(invoice.totalAmount - invoice.paidAmount);
      invoice.status = invoice.balanceDue <= 0.01 ? "paid" : "partially_paid";
      invoice.updatedAt = now;
    }
    this.store.save();
    if (payment.status === "succeeded") this.ledger.postPayment(actor, payment);
    this.store.audit(actor, "payment.recorded", "payment", payment.id, undefined, payment);
    this.events.emit(actor, "finance.payment.recorded", { paymentId: payment.id, paymentNumber: payment.paymentNumber, invoiceId: payment.invoiceId, amount: payment.amount });
    return clone(payment);
  }

  createRefund(actor: RequestActor, input: any): Refund {
    assertRequired(input.paymentId, "paymentId");
    const payment = this.requirePayment(actor, input.paymentId);
    const amount = assertPositiveAmount(input.amount, "amount");
    const available = round(payment.amount - payment.refundedAmount);
    if (amount > available + 0.01) badRequest(`Refund amount cannot exceed refundable amount ${available}`);
    const now = nowIso();
    const invoice = payment.invoiceId ? this.requireInvoice(actor, payment.invoiceId) : undefined;
    const refund: Refund = {
      id: newId("refund"), tenantId: actor.tenantId, createdAt: now, updatedAt: now,
      refundNumber: input.refundNumber ?? humanNumber("RFND"), paymentId: payment.id, invoiceId: payment.invoiceId,
      customerId: payment.customerId, amount, currency: payment.currency, reason: input.reason ?? "Refund", status: input.status ?? "processed",
      processedAt: input.status === "processed" || input.status === undefined ? now : undefined, createdBy: actor.userId
    };
    this.state().refunds.unshift(refund);
    if (refund.status === "processed") {
      payment.refundedAmount = round(payment.refundedAmount + amount);
      payment.status = payment.refundedAmount >= payment.amount - 0.01 ? "refunded" : "partially_refunded";
      payment.updatedAt = now;
      if (invoice) {
        invoice.refundedAmount = round(invoice.refundedAmount + amount);
        invoice.paidAmount = round(Math.max(0, invoice.paidAmount - amount));
        invoice.balanceDue = round(invoice.totalAmount - invoice.paidAmount);
        invoice.status = invoice.balanceDue <= 0.01 ? "paid" : invoice.paidAmount > 0 ? "partially_paid" : "sent";
        invoice.updatedAt = now;
      }
    }
    this.store.save();
    if (refund.status === "processed") this.ledger.postRefund(actor, refund);
    this.store.audit(actor, "refund.created", "refund", refund.id, undefined, refund);
    this.events.emit(actor, "finance.refund.created", { refundId: refund.id, paymentId: payment.id, amount: refund.amount, status: refund.status });
    return clone(refund);
  }

  listExpenses(actor: RequestActor): Expense[] { return this.byTenant(actor, this.state().expenses); }

  createExpense(actor: RequestActor, input: any): Expense {
    assertRequired(input.description, "description");
    const amount = assertPositiveAmount(input.amount, "amount");
    const taxAmount = round(Math.max(0, numberOr(input.taxAmount, 0)));
    if (input.vendorId) {
      const vendor = this.requireCounterparty(actor, input.vendorId);
      if (vendor.type === "customer") badRequest("vendorId must reference a vendor or both counterparty");
    }
    const now = nowIso();
    const expense: Expense = {
      id: newId("exp"), tenantId: actor.tenantId, createdAt: now, updatedAt: now,
      expenseNumber: input.expenseNumber ?? humanNumber("EXP"), vendorId: input.vendorId, employeeId: input.employeeId,
      category: input.category ?? "General", description: String(input.description), amount, taxAmount, totalAmount: round(amount + taxAmount),
      currency: input.currency ?? "INR", status: input.status ?? "draft", receiptUrl: input.receiptUrl, dueDate: input.dueDate,
      submittedAt: input.status === "submitted" ? now : undefined, createdBy: actor.userId
    };
    this.state().expenses.unshift(expense);
    this.store.save();
    this.store.audit(actor, "expense.created", "expense", expense.id, undefined, expense);
    this.events.emit(actor, "finance.expense.created", { expenseId: expense.id, expenseNumber: expense.expenseNumber, totalAmount: expense.totalAmount, category: expense.category });
    return clone(expense);
  }

  submitExpense(actor: RequestActor, id: string): Expense {
    const expense = this.requireExpense(actor, id);
    if (!["draft", "rejected"].includes(expense.status)) badRequest("Only draft or rejected expenses can be submitted");
    const before = clone(expense);
    expense.status = "submitted";
    expense.submittedAt = nowIso();
    expense.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "expense.submitted", "expense", expense.id, before, expense);
    this.events.emit(actor, "finance.expense.submitted", { expenseId: expense.id, amount: expense.totalAmount, category: expense.category });
    return clone(expense);
  }

  approveExpense(actor: RequestActor, id: string): Expense {
    const expense = this.requireExpense(actor, id);
    if (!["submitted", "draft"].includes(expense.status)) badRequest("Only submitted or draft expenses can be approved");
    const before = clone(expense);
    expense.status = "approved";
    expense.approvedAt = nowIso();
    expense.approvedBy = actor.userId;
    expense.updatedAt = nowIso();
    this.store.save();
    this.ledger.postExpenseAccrual(actor, expense);
    this.store.audit(actor, "expense.approved", "expense", expense.id, before, expense);
    this.events.emit(actor, "finance.expense.approved", { expenseId: expense.id, amount: expense.totalAmount, category: expense.category });
    return clone(expense);
  }

  payExpense(actor: RequestActor, id: string, input: any = {}): Expense {
    const expense = this.requireExpense(actor, id);
    if (!["approved", "submitted"].includes(expense.status)) badRequest("Only approved or submitted expenses can be paid");
    const before = clone(expense);
    if (expense.status === "submitted") this.ledger.postExpenseAccrual(actor, expense);
    const now = nowIso();
    const payment: Payment = {
      id: newId("pay"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, paymentNumber: input.paymentNumber ?? humanNumber("PAY"),
      vendorId: expense.vendorId, expenseId: expense.id, amount: expense.totalAmount, refundedAmount: 0, currency: expense.currency,
      method: input.method ?? "bank_transfer", status: "succeeded", processorRef: input.processorRef, receivedAt: input.paidAt ?? now,
      memo: `Paid ${expense.expenseNumber}`, createdBy: actor.userId
    };
    this.state().payments.unshift(payment);
    expense.status = "paid";
    expense.paymentId = payment.id;
    expense.paidAt = payment.receivedAt;
    expense.updatedAt = now;
    this.store.save();
    this.ledger.postExpensePayment(actor, payment);
    this.store.audit(actor, "expense.paid", "expense", expense.id, before, expense);
    this.events.emit(actor, "finance.expense.paid", { expenseId: expense.id, paymentId: payment.id, amount: expense.totalAmount });
    return clone(expense);
  }

  listBudgets(actor: RequestActor): Budget[] { return this.byTenant(actor, this.state().budgets); }

  createBudget(actor: RequestActor, input: any): Budget {
    assertRequired(input.name, "name");
    assertRequired(input.category, "category");
    const amount = assertPositiveAmount(input.amount, "amount");
    assertRequired(input.periodStart, "periodStart");
    assertRequired(input.periodEnd, "periodEnd");
    const now = nowIso();
    const budget: Budget = { id: newId("budget"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, name: String(input.name), category: String(input.category), amount, currency: input.currency ?? "INR", periodStart: input.periodStart, periodEnd: input.periodEnd, ownerTeam: input.ownerTeam, status: input.status ?? "active", createdBy: actor.userId };
    this.state().budgets.unshift(budget);
    this.store.save();
    this.store.audit(actor, "budget.created", "budget", budget.id, undefined, budget);
    this.events.emit(actor, "finance.budget.created", { budgetId: budget.id, category: budget.category, amount: budget.amount });
    return clone(budget);
  }

  createPlan(actor: RequestActor, input: any): SubscriptionPlan {
    assertRequired(input.name, "name");
    const amount = assertPositiveAmount(input.amount, "amount");
    const interval = input.interval ?? "monthly";
    if (!["monthly", "quarterly", "yearly"].includes(interval)) badRequest("interval must be monthly, quarterly, or yearly");
    if (input.taxRuleId && !this.listTaxRules(actor).some((rule) => rule.id === input.taxRuleId)) notFound(`Tax rule ${input.taxRuleId} not found`);
    const now = nowIso();
    const plan: SubscriptionPlan = { id: newId("plan"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, name: String(input.name), code: input.code ?? String(input.name).toUpperCase().replace(/[^A-Z0-9]+/g, "_"), amount, currency: input.currency ?? "INR", interval, taxRuleId: input.taxRuleId, status: input.status ?? "active", createdBy: actor.userId };
    this.state().subscriptionPlans.unshift(plan);
    this.store.save();
    this.store.audit(actor, "plan.created", "subscriptionPlan", plan.id, undefined, plan);
    this.events.emit(actor, "finance.subscription_plan.created", { planId: plan.id, code: plan.code, amount: plan.amount, interval: plan.interval });
    return clone(plan);
  }

  createSubscription(actor: RequestActor, input: any): Subscription {
    assertRequired(input.customerId, "customerId");
    assertRequired(input.planId, "planId");
    this.requireCounterparty(actor, input.customerId);
    const plan = this.requirePlan(actor, input.planId);
    const now = nowIso();
    const startDate = input.startDate ?? now;
    const end = this.nextPeriodEnd(startDate, plan.interval);
    const sub: Subscription = { id: newId("sub"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, customerId: input.customerId, planId: plan.id, status: input.status ?? "active", startDate, currentPeriodStart: startDate, currentPeriodEnd: end, nextBillingAt: end, createdBy: actor.userId };
    this.state().subscriptions.unshift(sub);
    this.store.save();
    this.store.audit(actor, "subscription.created", "subscription", sub.id, undefined, sub);
    this.events.emit(actor, "finance.subscription.created", { subscriptionId: sub.id, customerId: sub.customerId, planId: plan.id });
    return clone(sub);
  }

  generateSubscriptionInvoice(actor: RequestActor, id: string): Invoice {
    const sub = this.requireSubscription(actor, id);
    if (!["active", "trialing", "past_due"].includes(sub.status)) badRequest("Only active, trialing, or past_due subscriptions can generate invoices");
    const plan = this.requirePlan(actor, sub.planId);
    const invoice = this.createInvoice(actor, {
      customerId: sub.customerId,
      issueDate: nowIso(),
      dueDate: addDays(nowIso(), 7),
      currency: plan.currency,
      lineItems: [{ description: `${plan.name} subscription (${sub.currentPeriodStart.slice(0, 10)} to ${sub.currentPeriodEnd.slice(0, 10)})`, quantity: 1, unitPrice: plan.amount, taxRuleId: plan.taxRuleId }],
      notes: `Generated from subscription ${sub.id}`
    });
    const before = clone(sub);
    sub.latestInvoiceId = invoice.id;
    sub.currentPeriodStart = sub.currentPeriodEnd;
    sub.currentPeriodEnd = this.nextPeriodEnd(sub.currentPeriodStart, plan.interval);
    sub.nextBillingAt = sub.currentPeriodEnd;
    sub.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "subscription.invoice_generated", "subscription", sub.id, before, sub);
    this.events.emit(actor, "finance.subscription.invoice_generated", { subscriptionId: sub.id, invoiceId: invoice.id, customerId: sub.customerId });
    return invoice;
  }

  listPlans(actor: RequestActor): SubscriptionPlan[] { return this.byTenant(actor, this.state().subscriptionPlans); }
  listSubscriptions(actor: RequestActor): Subscription[] { return this.byTenant(actor, this.state().subscriptions); }
  listLedger(actor: RequestActor): unknown[] { return this.byTenant(actor, this.state().ledgerEntries); }
  listEvents(actor: RequestActor): unknown[] { return this.byTenant(actor, this.state().events); }
  listAuditLogs(actor: RequestActor): unknown[] { return this.byTenant(actor, this.state().auditLogs); }

  analytics(actor: RequestActor): Record<string, unknown> {
    const invoices = this.listInvoices(actor).filter((inv) => inv.status !== "void");
    const revenueInvoices = invoices.filter((inv) => inv.status !== "draft");
    const expenses = this.listExpenses(actor).filter((exp) => exp.status !== "void" && exp.status !== "rejected");
    const paidExpenses = expenses.filter((exp) => exp.status === "paid" || exp.status === "reimbursed");
    const payments = this.listPayments(actor).filter((pay) => pay.status === "succeeded" || pay.status === "partially_refunded" || pay.status === "refunded");
    const refunds = this.byTenant(actor, this.state().refunds).filter((refund) => refund.status === "processed");
    const receivables = sum(invoices.filter((inv) => ["sent", "partially_paid", "overdue"].includes(inv.status)).map((inv) => inv.balanceDue));
    const cashCollected = round(sum(payments.map((p) => p.amount)) - sum(refunds.map((r) => r.amount)));
    const expenseTotal = sum(paidExpenses.map((exp) => exp.totalAmount));
    const recognizedRevenue = sum(revenueInvoices.map((inv) => inv.taxableAmount));
    const taxCollected = sum(revenueInvoices.map((inv) => inv.taxAmount));
    const inputTax = sum(expenses.map((exp) => exp.taxAmount));
    const overdueInvoices = invoices.filter((inv) => inv.balanceDue > 0 && inv.dueDate && new Date(inv.dueDate).getTime() < Date.now() && inv.status !== "draft");
    return {
      totalCustomers: this.listCounterparties(actor, "customer").length,
      totalVendors: this.listCounterparties(actor, "vendor").length,
      totalInvoices: invoices.length,
      openInvoices: invoices.filter((inv) => ["sent", "partially_paid", "overdue"].includes(inv.status)).length,
      overdueInvoices: overdueInvoices.length,
      totalPayments: payments.length,
      totalExpenses: expenses.length,
      receivables,
      cashCollected,
      recognizedRevenue,
      expenseTotal,
      grossProfit: round(recognizedRevenue - expenseTotal),
      taxCollected,
      inputTax,
      netTaxPayable: round(taxCollected - inputTax),
      activeSubscriptions: this.listSubscriptions(actor).filter((sub) => sub.status === "active" || sub.status === "trialing").length,
      budgetUtilization: this.budgetUtilization(actor)
    };
  }

  profitLoss(actor: RequestActor, start?: string, end?: string): Record<string, unknown> {
    const invoices = this.listInvoices(actor).filter((inv) => inv.status !== "draft" && inv.status !== "void" && inDateRange(inv.issueDate, start, end));
    const expenses = this.listExpenses(actor).filter((exp) => ["approved", "paid", "reimbursed"].includes(exp.status) && inDateRange(exp.createdAt, start, end));
    const revenue = sum(invoices.map((inv) => inv.taxableAmount));
    const taxOnSales = sum(invoices.map((inv) => inv.taxAmount));
    const expenseAmount = sum(expenses.map((exp) => exp.amount));
    const taxOnExpenses = sum(expenses.map((exp) => exp.taxAmount));
    return { start: start ?? null, end: end ?? null, revenue, taxOnSales, expenseAmount, taxOnExpenses, netOperatingIncome: round(revenue - expenseAmount), netTaxPayable: round(taxOnSales - taxOnExpenses) };
  }

  agingReport(actor: RequestActor): Record<string, number> {
    const buckets: Record<string, number> = { current: 0, days1to30: 0, days31to60: 0, days61plus: 0 };
    const now = Date.now();
    this.listInvoices(actor).filter((inv) => inv.balanceDue > 0 && inv.status !== "draft" && inv.status !== "void").forEach((invoice) => {
      const days = Math.floor((now - new Date(invoice.dueDate).getTime()) / 86_400_000);
      if (days <= 0) buckets.current = round(buckets.current + invoice.balanceDue);
      else if (days <= 30) buckets.days1to30 = round(buckets.days1to30 + invoice.balanceDue);
      else if (days <= 60) buckets.days31to60 = round(buckets.days31to60 + invoice.balanceDue);
      else buckets.days61plus = round(buckets.days61plus + invoice.balanceDue);
    });
    return buckets;
  }

  private budgetUtilization(actor: RequestActor): Array<Record<string, unknown>> {
    return this.listBudgets(actor).filter((budget) => budget.status === "active").map((budget) => {
      const spent = sum(this.listExpenses(actor).filter((expense) => expense.category === budget.category && ["approved", "paid", "reimbursed"].includes(expense.status) && inDateRange(expense.createdAt, budget.periodStart, budget.periodEnd)).map((expense) => expense.totalAmount));
      return { budgetId: budget.id, name: budget.name, category: budget.category, amount: budget.amount, spent, remaining: round(budget.amount - spent), utilizationPercent: budget.amount > 0 ? round((spent / budget.amount) * 100) : 0 };
    });
  }

  private state(): FinanceState { return this.store.getState(); }
  private byTenant<T extends { tenantId: string }>(actor: RequestActor, items: T[]): T[] { return clone(items.filter((item) => item.tenantId === actor.tenantId)); }

  private requireCounterparty(actor: RequestActor, id: string): Counterparty {
    const item = this.state().counterparties.find((entity) => entity.tenantId === actor.tenantId && entity.id === id);
    if (!item) notFound(`Counterparty ${id} not found`);
    return item;
  }

  private requireInvoice(actor: RequestActor, id: string): Invoice {
    const item = this.state().invoices.find((entity) => entity.tenantId === actor.tenantId && entity.id === id);
    if (!item) notFound(`Invoice ${id} not found`);
    return item;
  }

  private requirePayment(actor: RequestActor, id: string): Payment {
    const item = this.state().payments.find((entity) => entity.tenantId === actor.tenantId && entity.id === id);
    if (!item) notFound(`Payment ${id} not found`);
    return item;
  }

  private requireExpense(actor: RequestActor, id: string): Expense {
    const item = this.state().expenses.find((entity) => entity.tenantId === actor.tenantId && entity.id === id);
    if (!item) notFound(`Expense ${id} not found`);
    return item;
  }

  private requirePlan(actor: RequestActor, id: string): SubscriptionPlan {
    const item = this.state().subscriptionPlans.find((entity) => entity.tenantId === actor.tenantId && entity.id === id);
    if (!item) notFound(`Subscription plan ${id} not found`);
    return item;
  }

  private requireSubscription(actor: RequestActor, id: string): Subscription {
    const item = this.state().subscriptions.find((entity) => entity.tenantId === actor.tenantId && entity.id === id);
    if (!item) notFound(`Subscription ${id} not found`);
    return item;
  }

  private nextPeriodEnd(start: string, interval: string): string {
    if (interval === "yearly") return addMonths(start, 12);
    if (interval === "quarterly") return addMonths(start, 3);
    return addMonths(start, 1);
  }
}
