import { DataStore } from "./core/datastore";
import {
  Invoice,
  InvoiceItem,
  Quotation,
  QuotationItem,
  Payment,
  Receipt,
  Expense,
  Budget,
  BudgetCategory,
  VendorPayment,
  CashFlowEntry,
  RevenueStream,
  Forecast,
  Refund,
  FinancialReport,
  AccountReceivable,
  AccountPayable,
  TaxRecord,
  PayrollDocument,
  FinancialHealthScore,
  FinanceOverview,
  RequestActor,
  InvoiceStatus,
  QuotationStatus,
  PaymentStatus,
  ExpenseStatus,
  PaymentMethod
} from "./domain";
import {
  newId,
  nowIso,
  plusDays,
  calculateTax,
  calculateTotal,
  calculateAge,
  getAgingBucket,
  generateInvoiceNumber,
  generateQuotationNumber,
  generatePaymentNumber,
  generateReceiptNumber,
  generateExpenseNumber,
  generateBudgetNumber,
  calculateProfitMargin,
  calculateHealthScore
} from "./core/id";
import {
  clone,
  ensureString,
  ensureNumber,
  ensureBoolean,
  ensureObject,
  optionalObject,
  ensureArray,
  pickQuery,
  filterByDateRange,
  filterByStatus,
  filterBySearch,
  groupBy,
  sumBy,
  sortBy
} from "./core/utils";

export class FinanceService {
  constructor(private readonly store: DataStore) {}

  overview(actor: RequestActor): FinanceOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;

    const invoices = state.invoices.filter((i) => i.tenantId === tenant);
    const payments = state.payments.filter((p) => p.tenantId === tenant);
    const expenses = state.expenses.filter((e) => e.tenantId === tenant);

    const totalRevenue = sumBy(payments.filter((p) => p.status === "completed"), (p) => p.amount);
    const totalExpenses = sumBy(expenses.filter((e) => e.status === "approved"), (e) => e.amount);
    const netProfit = totalRevenue - totalExpenses;

    const cashInflows = sumBy(state.cashFlowEntries.filter((c) => c.tenantId === tenant && c.type === "inflow"), (c) => c.amount);
    const cashOutflows = sumBy(state.cashFlowEntries.filter((c) => c.tenantId === tenant && c.type === "outflow"), (c) => c.amount);
    const cashBalance = cashInflows - cashOutflows;

    const pendingInvoices = sumBy(
      invoices.filter((i) => ["sent", "viewed", "partial"].includes(i.status)),
      (i) => i.total - i.paidAmount
    );

    const overdueInvoices = sumBy(
      invoices.filter((i) => i.status === "overdue"),
      (i) => i.total - i.paidAmount
    );

    const receivables = state.accountReceivables.filter((r) => r.tenantId === tenant);
    const totalReceivables = sumBy(receivables, (r) => r.outstandingAmount);

    const payables = state.accountPayables.filter((p) => p.tenantId === tenant);
    const totalPayables = sumBy(payables, (p) => p.outstandingAmount);

    const revenueStreams = state.revenueStreams.filter((r) => r.tenantId === tenant && r.status === "active");
    const monthlyRecurringRevenue = sumBy(
      revenueStreams.filter((r) => r.frequency === "monthly"),
      (r) => r.amount
    );

    const taxRecords = state.taxRecords.filter((t) => t.tenantId === tenant && t.status === "pending");
    const taxLiability = sumBy(taxRecords, (t) => t.netTax);

    const profitMargin = calculateProfitMargin(totalRevenue, totalExpenses);

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      cashBalance,
      pendingInvoices,
      overdueInvoices,
      totalReceivables,
      totalPayables,
      monthlyRecurringRevenue,
      taxLiability,
      profitMargin
    };
  }

  listInvoices(actor: RequestActor, query?: URLSearchParams): Invoice[] {
    let invoices = this.store.getState().invoices.filter((i) => i.tenantId === actor.tenantId);
    if (query) {
      invoices = filterByDateRange(invoices, query);
      invoices = filterByStatus(invoices, query);
      invoices = filterBySearch(invoices, query, ["invoiceNumber", "clientName", "clientEmail"]);
    }
    return clone(sortBy(invoices, "createdAt", "desc"));
  }

  getInvoice(id: string, actor: RequestActor): Invoice {
    const invoice = this.store.getState().invoices.find((i) => i.id === id && i.tenantId === actor.tenantId);
    if (!invoice) throw new Error("Invoice not found");
    return clone(invoice);
  }

  createInvoice(input: unknown, actor: RequestActor): Invoice {
    const body = ensureObject(input, "invoice");
    const state = this.store.getState();
    const now = nowIso();

    const items = ensureArray(body.items, "invoice.items", []).map((item: any) => {
      const quantity = ensureNumber(item.quantity, "item.quantity");
      const rate = ensureNumber(item.rate, "item.rate");
      const taxRate = ensureNumber(item.taxRate, "item.taxRate", 0);
      const discountAmount = ensureNumber(item.discountAmount, "item.discountAmount", 0);
      const subtotal = quantity * rate;
      const taxAmount = calculateTax(subtotal - discountAmount, taxRate);
      const total = subtotal + taxAmount - discountAmount;

      return {
        id: newId("item"),
        tenantId: actor.tenantId,
        createdAt: now,
        updatedAt: now,
        invoiceId: "",
        description: ensureString(item.description, "item.description"),
        quantity,
        rate,
        taxRate,
        taxAmount,
        discountAmount,
        total,
        metadata: optionalObject(item.metadata) || {}
      };
    });

    const subtotal = sumBy(items, (i) => i.quantity * i.rate);
    const taxTotal = sumBy(items, (i) => i.taxAmount);
    const discountTotal = sumBy(items, (i) => i.discountAmount);
    const total = calculateTotal(subtotal, taxTotal, discountTotal);

    const invoice: Invoice = {
      id: newId("inv"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      invoiceNumber: generateInvoiceNumber(),
      type: String(body.type || "service") as Invoice["type"],
      status: "draft",
      clientId: body.clientId ? String(body.clientId) : undefined,
      clientName: ensureString(body.clientName, "invoice.clientName"),
      clientEmail: body.clientEmail ? String(body.clientEmail) : undefined,
      clientAddress: body.clientAddress ? String(body.clientAddress) : undefined,
      clientGstin: body.clientGstin ? String(body.clientGstin) : undefined,
      issueDate: body.issueDate ? String(body.issueDate) : now.split("T")[0],
      dueDate: body.dueDate ? String(body.dueDate) : plusDays(30).split("T")[0],
      items: [],
      subtotal,
      taxTotal,
      discountTotal,
      total,
      currency: String(body.currency || "INR"),
      notes: body.notes ? String(body.notes) : undefined,
      terms: body.terms ? String(body.terms) : undefined,
      paidAmount: 0,
      metadata: optionalObject(body.metadata) || {}
    };

    for (const item of items) {
      item.invoiceId = invoice.id;
      state.invoiceItems.push(item);
    }

    invoice.items = items.map((i) => clone(i));
    state.invoices.push(invoice);

    this.store.audit(actor, "invoice.create", "invoice", invoice.id, undefined, invoice);
    this.store.save();

    return clone(invoice);
  }

  updateInvoice(id: string, input: unknown, actor: RequestActor): Invoice {
    const body = ensureObject(input, "invoice");
    const state = this.store.getState();
    const invoice = state.invoices.find((i) => i.id === id && i.tenantId === actor.tenantId);

    if (!invoice) throw new Error("Invoice not found");
    const before = clone(invoice);

    if (body.status) invoice.status = body.status as InvoiceStatus;
    if (body.clientName) invoice.clientName = String(body.clientName);
    if (body.clientEmail) invoice.clientEmail = String(body.clientEmail);
    if (body.dueDate) invoice.dueDate = String(body.dueDate);
    if (body.notes) invoice.notes = String(body.notes);
    if (body.terms) invoice.terms = String(body.terms);

    invoice.updatedAt = nowIso();
    this.store.audit(actor, "invoice.update", "invoice", invoice.id, before, invoice);
    this.store.save();

    return clone(invoice);
  }

  deleteInvoice(id: string, actor: RequestActor): void {
    const state = this.store.getState();
    const index = state.invoices.findIndex((i) => i.id === id && i.tenantId === actor.tenantId);
    if (index === -1) throw new Error("Invoice not found");

    const invoice = state.invoices[index];
    state.invoiceItems = state.invoiceItems.filter((item) => item.invoiceId !== id);
    state.invoices.splice(index, 1);

    this.store.audit(actor, "invoice.delete", "invoice", id, invoice, undefined);
    this.store.save();
  }

  listPayments(actor: RequestActor, query?: URLSearchParams): Payment[] {
    let payments = this.store.getState().payments.filter((p) => p.tenantId === actor.tenantId);
    if (query) {
      payments = filterByDateRange(payments, query);
      payments = filterByStatus(payments, query);
      payments = filterBySearch(payments, query, ["paymentNumber", "clientName"]);
    }
    return clone(sortBy(payments, "createdAt", "desc"));
  }

  getPayment(id: string, actor: RequestActor): Payment {
    const payment = this.store.getState().payments.find((p) => p.id === id && p.tenantId === actor.tenantId);
    if (!payment) throw new Error("Payment not found");
    return clone(payment);
  }

  createPayment(input: unknown, actor: RequestActor): Payment {
    const body = ensureObject(input, "payment");
    const state = this.store.getState();
    const now = nowIso();

    const payment: Payment = {
      id: newId("pay"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      paymentNumber: generatePaymentNumber(),
      invoiceId: body.invoiceId ? String(body.invoiceId) : undefined,
      quotationId: body.quotationId ? String(body.quotationId) : undefined,
      clientId: body.clientId ? String(body.clientId) : undefined,
      clientName: ensureString(body.clientName, "payment.clientName"),
      amount: ensureNumber(body.amount, "payment.amount"),
      currency: String(body.currency || "INR"),
      status: "pending",
      method: String(body.method || "bank_transfer") as PaymentMethod,
      transactionId: body.transactionId ? String(body.transactionId) : undefined,
      reference: body.reference ? String(body.reference) : undefined,
      paidAt: body.paidAt ? String(body.paidAt) : now.split("T")[0],
      metadata: optionalObject(body.metadata) || {}
    };

    if (body.invoiceId) {
      const invoice = state.invoices.find((i) => i.id === body.invoiceId && i.tenantId === actor.tenantId);
      if (invoice) {
        invoice.paidAmount += payment.amount;
        invoice.paidAt = payment.paidAt;

        if (invoice.paidAmount >= invoice.total) {
          invoice.status = "paid";
        } else if (invoice.paidAmount > 0) {
          invoice.status = "partial";
        }

        invoice.updatedAt = nowIso();
      }
    }

    payment.status = "completed";
    state.payments.push(payment);

    this.store.audit(actor, "payment.create", "payment", payment.id, undefined, payment);
    this.store.save();

    return clone(payment);
  }

  listExpenses(actor: RequestActor, query?: URLSearchParams): Expense[] {
    let expenses = this.store.getState().expenses.filter((e) => e.tenantId === actor.tenantId);
    if (query) {
      expenses = filterByDateRange(expenses, query);
      expenses = filterByStatus(expenses, query);
      expenses = filterBySearch(expenses, query, ["expenseNumber", "vendorName", "description"]);
    }
    return clone(sortBy(expenses, "createdAt", "desc"));
  }

  getExpense(id: string, actor: RequestActor): Expense {
    const expense = this.store.getState().expenses.find((e) => e.id === id && e.tenantId === actor.tenantId);
    if (!expense) throw new Error("Expense not found");
    return clone(expense);
  }

  createExpense(input: unknown, actor: RequestActor): Expense {
    const body = ensureObject(input, "expense");
    const state = this.store.getState();
    const now = nowIso();

    const expense: Expense = {
      id: newId("exp"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      expenseNumber: generateExpenseNumber(),
      category: String(body.category || "other") as Expense["category"],
      status: "draft",
      vendorId: body.vendorId ? String(body.vendorId) : undefined,
      vendorName: ensureString(body.vendorName, "expense.vendorName"),
      description: ensureString(body.description, "expense.description"),
      amount: ensureNumber(body.amount, "expense.amount"),
      currency: String(body.currency || "INR"),
      expenseDate: body.expenseDate ? String(body.expenseDate) : now.split("T")[0],
      receiptUrl: body.receiptUrl ? String(body.receiptUrl) : undefined,
      billNumber: body.billNumber ? String(body.billNumber) : undefined,
      projectId: body.projectId ? String(body.projectId) : undefined,
      approvedBy: body.approvedBy ? String(body.approvedBy) : undefined,
      reimbursedAmount: 0,
      notes: body.notes ? String(body.notes) : undefined,
      metadata: optionalObject(body.metadata) || {}
    };

    state.expenses.push(expense);

    this.store.audit(actor, "expense.create", "expense", expense.id, undefined, expense);
    this.store.save();

    return clone(expense);
  }

  approveExpense(id: string, actor: RequestActor): Expense {
    const state = this.store.getState();
    const expense = state.expenses.find((e) => e.id === id && e.tenantId === actor.tenantId);

    if (!expense) throw new Error("Expense not found");
    const before = clone(expense);

    expense.status = "approved";
    expense.approvedBy = actor.userId;
    expense.updatedAt = nowIso();

    this.store.audit(actor, "expense.approve", "expense", expense.id, before, expense);
    this.store.save();

    return clone(expense);
  }

  listBudgets(actor: RequestActor, query?: URLSearchParams): Budget[] {
    let budgets = this.store.getState().budgets.filter((b) => b.tenantId === actor.tenantId);
    if (query) {
      budgets = filterByDateRange(budgets, query);
      budgets = filterByStatus(budgets, query);
      budgets = filterBySearch(budgets, query, ["budgetNumber", "name"]);
    }
    return clone(sortBy(budgets, "createdAt", "desc"));
  }

  getBudget(id: string, actor: RequestActor): Budget {
    const budget = this.store.getState().budgets.find((b) => b.id === id && b.tenantId === actor.tenantId);
    if (!budget) throw new Error("Budget not found");
    return clone(budget);
  }

  createBudget(input: unknown, actor: RequestActor): Budget {
    const body = ensureObject(input, "budget");
    const state = this.store.getState();
    const now = nowIso();

    const categories = ensureArray(body.categories, "budget.categories", []).map((cat: any) => ({
      id: newId("bcat"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      budgetId: "",
      category: ensureString(cat.category, "category.name"),
      allocatedAmount: ensureNumber(cat.allocatedAmount, "category.allocatedAmount"),
      spentAmount: 0,
      remainingAmount: ensureNumber(cat.allocatedAmount, "category.allocatedAmount")
    }));

    const totalAmount = sumBy(categories, (c) => c.allocatedAmount);

    const budget: Budget = {
      id: newId("bdg"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      budgetNumber: generateBudgetNumber(),
      name: ensureString(body.name, "budget.name"),
      status: "draft",
      period: String(body.period || "monthly") as Budget["period"],
      startDate: ensureString(body.startDate, "budget.startDate"),
      endDate: ensureString(body.endDate, "budget.endDate"),
      totalAmount,
      totalSpent: 0,
      totalRemaining: totalAmount,
      categories: [],
      notes: body.notes ? String(body.notes) : undefined,
      metadata: optionalObject(body.metadata) || {}
    };

    for (const cat of categories) {
      cat.budgetId = budget.id;
      state.budgetCategories.push(cat);
    }

    budget.categories = categories.map((c) => clone(c));
    state.budgets.push(budget);

    this.store.audit(actor, "budget.create", "budget", budget.id, undefined, budget);
    this.store.save();

    return clone(budget);
  }

  getReceivables(actor: RequestActor, query?: URLSearchParams): AccountReceivable[] {
    let receivables = this.store.getState().accountReceivables.filter((r) => r.tenantId === actor.tenantId);
    if (query) {
      receivables = filterByDateRange(receivables, query);
      receivables = filterByStatus(receivables, query);
    }
    return clone(sortBy(receivables, "dueDate", "asc"));
  }

  getPayables(actor: RequestActor, query?: URLSearchParams): AccountPayable[] {
    let payables = this.store.getState().accountPayables.filter((p) => p.tenantId === actor.tenantId);
    if (query) {
      payables = filterByDateRange(payables, query);
      payables = filterByStatus(payables, query);
    }
    return clone(sortBy(payables, "dueDate", "asc"));
  }

  generateReport(actor: RequestActor, type: string, startDate?: string, endDate?: string): FinancialReport {
    const state = this.store.getState();
    const now = nowIso();
    const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];
    const end = endDate || now.split("T")[0];

    const reportId = newId("rpt");
    let summary: Record<string, unknown> = {};
    let details: Record<string, unknown> = {};

    const invoices = state.invoices.filter(
      (i) => i.tenantId === actor.tenantId && i.issueDate >= start && i.issueDate <= end
    );

    const payments = state.payments.filter(
      (p) => p.tenantId === actor.tenantId && p.paidAt && p.paidAt >= start && p.paidAt <= end
    );

    const expenses = state.expenses.filter(
      (e) => e.tenantId === actor.tenantId && e.expenseDate >= start && e.expenseDate <= end
    );

    switch (type) {
      case "revenue":
        summary = {
          totalInvoiced: sumBy(invoices, (i) => i.total),
          totalCollected: sumBy(payments.filter((p) => p.status === "completed"), (p) => p.amount),
          pendingAmount: sumBy(invoices.filter((i) => ["sent", "viewed", "partial"].includes(i.status)), (i) => i.total - i.paidAmount),
          invoiceCount: invoices.length,
          paidInvoiceCount: invoices.filter((i) => i.status === "paid").length
        };
        details = {
          invoicesByStatus: groupBy(invoices, "status"),
          invoicesByClient: groupBy(invoices, "clientName")
        };
        break;

      case "expenses":
        summary = {
          totalExpenses: sumBy(expenses.filter((e) => e.status === "approved"), (e) => e.amount),
          pendingExpenses: sumBy(expenses.filter((e) => e.status === "pending"), (e) => e.amount),
          expenseCount: expenses.length,
          approvedCount: expenses.filter((e) => e.status === "approved").length
        };
        details = {
          expensesByCategory: groupBy(expenses, "category"),
          expensesByVendor: groupBy(expenses, "vendorName")
        };
        break;

      case "profit_loss":
        const revenue = sumBy(payments.filter((p) => p.status === "completed"), (p) => p.amount);
        const totalExpenses = sumBy(expenses.filter((e) => e.status === "approved"), (e) => e.amount);
        summary = {
          revenue,
          expenses: totalExpenses,
          netProfit: revenue - totalExpenses,
          profitMargin: calculateProfitMargin(revenue, totalExpenses)
        };
        break;

      case "cash_flow":
        const cashFlowEntries = state.cashFlowEntries.filter(
          (c) => c.tenantId === actor.tenantId && c.entryDate >= start && c.entryDate <= end
        );
        const inflows = sumBy(cashFlowEntries.filter((c) => c.type === "inflow"), (c) => c.amount);
        const outflows = sumBy(cashFlowEntries.filter((c) => c.type === "outflow"), (c) => c.amount);
        summary = {
          totalInflows: inflows,
          totalOutflows: outflows,
          netCashFlow: inflows - outflows,
          entryCount: cashFlowEntries.length
        };
        details = {
          inflowsByCategory: groupBy(cashFlowEntries.filter((c) => c.type === "inflow"), "category"),
          outflowsByCategory: groupBy(cashFlowEntries.filter((c) => c.type === "outflow"), "category")
        };
        break;

      default:
        throw new Error(`Unknown report type: ${type}`);
    }

    const report: FinancialReport = {
      id: reportId,
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Report (${start} to ${end})`,
      type: type as FinancialReport["type"],
      period: "custom",
      startDate: start,
      endDate: end,
      generatedAt: now,
      summary,
      details,
      currency: "INR",
      status: "published",
      metadata: {}
    };

    state.financialReports.push(report);
    this.store.audit(actor, "report.generate", "financialReport", report.id, undefined, report);
    this.store.save();

    return clone(report);
  }

  calculateHealthScore(actor: RequestActor): FinancialHealthScore {
    const state = this.store.getState();
    const now = nowIso();

    const overview = this.overview(actor);
    const invoices = state.invoices.filter((i) => i.tenantId === actor.tenantId);
    const overdueInvoices = invoices.filter((i) => i.status === "overdue");

    const revenueGrowth = 15;
    const profitMargin = overview.profitMargin || 0;
    const cashRatio = overview.cashBalance > 0 ? Math.min(1, overview.cashBalance / (overview.totalRevenue || 1)) : 0;
    const overdueRatio = invoices.length > 0 ? overdueInvoices.length / invoices.length : 0;
    const expenseGrowth = 10;

    const score = calculateHealthScore({
      revenueGrowth,
      profitMargin,
      cashRatio,
      overdueRatio,
      expenseGrowth
    });

    const healthScore: FinancialHealthScore = {
      id: newId("health"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      score,
      revenueStability: Math.round(50 + revenueGrowth),
      profitability: Math.round(profitMargin * 2),
      cashFlow: Math.round(cashRatio * 100),
      receivableRisk: Math.round(100 - overdueRatio * 100),
      expenseControl: Math.round(100 - expenseGrowth),
      debtRisk: 90,
      growth: Math.round(50 + revenueGrowth),
      factors: [
        { name: "Revenue Growth", value: Math.round(50 + revenueGrowth), weight: 0.2, description: `Month-over-month growth: ${revenueGrowth}%` },
        { name: "Profit Margin", value: Math.round(profitMargin * 2), weight: 0.25, description: `Current margin: ${profitMargin.toFixed(1)}%` },
        { name: "Cash Flow", value: Math.round(cashRatio * 100), weight: 0.2, description: `Cash balance healthy` },
        { name: "Receivable Risk", value: Math.round(100 - overdueRatio * 100), weight: 0.2, description: `${overdueInvoices.length} overdue invoices` },
        { name: "Expense Control", value: Math.round(100 - expenseGrowth), weight: 0.15, description: `Expense growth: ${expenseGrowth}%` }
      ],
      recommendations: [
        overdueInvoices.length > 0 ? "Follow up on overdue invoices to improve cash flow" : "No overdue invoices - great work!",
        profitMargin < 30 ? "Consider ways to improve profit margins" : "Profit margins are healthy",
        cashRatio < 0.5 ? "Build cash reserves for better financial stability" : "Cash position is strong"
      ],
      calculatedAt: now,
      metadata: {}
    };

    state.financialHealthScores.push(healthScore);
    this.store.audit(actor, "health.calculate", "financialHealthScore", healthScore.id, undefined, healthScore);
    this.store.save();

    return clone(healthScore);
  }

  listQuotations(actor: RequestActor, query?: URLSearchParams): Quotation[] {
    let quotations = this.store.getState().quotations.filter((q) => q.tenantId === actor.tenantId);
    if (query) {
      quotations = filterByDateRange(quotations, query);
      quotations = filterByStatus(quotations, query);
      quotations = filterBySearch(quotations, query, ["quotationNumber", "clientName"]);
    }
    return clone(sortBy(quotations, "createdAt", "desc"));
  }

  createQuotation(input: unknown, actor: RequestActor): Quotation {
    const body = ensureObject(input, "quotation");
    const state = this.store.getState();
    const now = nowIso();

    const quotation: Quotation = {
      id: newId("qt"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      quotationNumber: generateQuotationNumber(),
      status: "draft",
      clientId: body.clientId ? String(body.clientId) : undefined,
      clientName: ensureString(body.clientName, "quotation.clientName"),
      clientEmail: body.clientEmail ? String(body.clientEmail) : undefined,
      clientAddress: body.clientAddress ? String(body.clientAddress) : undefined,
      validUntil: body.validUntil ? String(body.validUntil) : plusDays(30).split("T")[0],
      items: [],
      subtotal: ensureNumber(body.subtotal, "quotation.subtotal", 0),
      taxTotal: ensureNumber(body.taxTotal, "quotation.taxTotal", 0),
      discountTotal: ensureNumber(body.discountTotal, "quotation.discountTotal", 0),
      total: ensureNumber(body.total, "quotation.total", 0),
      currency: String(body.currency || "INR"),
      notes: body.notes ? String(body.notes) : undefined,
      terms: body.terms ? String(body.terms) : undefined,
      metadata: optionalObject(body.metadata) || {}
    };

    state.quotations.push(quotation);

    this.store.audit(actor, "quotation.create", "quotation", quotation.id, undefined, quotation);
    this.store.save();

    return clone(quotation);
  }

  convertQuotationToInvoice(id: string, actor: RequestActor): Invoice {
    const state = this.store.getState();
    const quotation = state.quotations.find((q) => q.id === id && q.tenantId === actor.tenantId);

    if (!quotation) throw new Error("Quotation not found");
    if (quotation.status === "converted") throw new Error("Quotation already converted");

    const invoice = this.createInvoice(
      {
        clientName: quotation.clientName,
        clientEmail: quotation.clientEmail,
        clientAddress: quotation.clientAddress,
        subtotal: quotation.subtotal,
        taxTotal: quotation.taxTotal,
        discountTotal: quotation.discountTotal,
        total: quotation.total,
        currency: quotation.currency,
        notes: quotation.notes,
        terms: quotation.terms,
        type: "service"
      },
      actor
    );

    quotation.status = "converted";
    quotation.convertedToInvoiceId = invoice.id;
    quotation.updatedAt = nowIso();

    this.store.audit(actor, "quotation.convert", "quotation", quotation.id, quotation, invoice);
    this.store.save();

    return clone(invoice);
  }

  listRevenueStreams(actor: RequestActor): RevenueStream[] {
    return clone(sortBy(this.store.getState().revenueStreams.filter((r) => r.tenantId === actor.tenantId), "createdAt", "desc"));
  }

  listForecasts(actor: RequestActor): Forecast[] {
    return clone(sortBy(this.store.getState().forecasts.filter((f) => f.tenantId === actor.tenantId), "createdAt", "desc"));
  }

  listTaxRecords(actor: RequestActor): TaxRecord[] {
    return clone(sortBy(this.store.getState().taxRecords.filter((t) => t.tenantId === actor.tenantId), "createdAt", "desc"));
  }

  listAuditLogs(actor: RequestActor): any[] {
    return clone(this.store.getState().auditLogs.filter((log) => log.tenantId === actor.tenantId));
  }
}
