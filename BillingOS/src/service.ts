import {
  DataStore,
} from "./core/datastore";
import {
  BillingAccount,
  BillingAccountStatus,
  PricingPlan,
  Subscription,
  SubscriptionStatus,
  Invoice,
  InvoiceStatus,
  Payment,
  PaymentStatus,
  UsageRecord,
  CreditWallet,
  CreditTransaction,
  Refund,
  Coupon,
  TaxRule,
  DunningAttempt,
  RevenueRecord,
  BillingOverview,
  BillingAddress,
  PlanFeature,
  PlanLimit,
  RequestActor,
  BillingEvent,
} from "./domain";
import {
  newId,
  nowIso,
  plusDays,
  plusMonths,
} from "./core/id";
import {
  requireString,
  optionalString,
  asNumber,
  asBoolean,
  isExpired,
  notFound,
  badRequest,
  roundCurrency,
  calculateTax,
  calculateDiscount,
} from "./core/utils";

export class BillingService {
  constructor(private readonly store: DataStore) {}

  getOverview(actor: RequestActor): BillingOverview {
    const state = this.store.getState();
    const accounts = state.billingAccounts.filter((a) => a.tenantId === actor.tenantId);
    const subscriptions = state.subscriptions.filter((s) => s.tenantId === actor.tenantId);
    const invoices = state.invoices.filter((i) => i.tenantId === actor.tenantId);
    const payments = state.payments.filter((p) => p.tenantId === actor.tenantId);
    const usageRecords = state.usageRecords.filter((u) => u.tenantId === actor.tenantId);
    const wallets = state.creditWallets.filter((w) => w.tenantId === actor.tenantId);
    const refunds = state.refunds.filter((r) => r.tenantId === actor.tenantId);

    const mrr = this.calculateMRR(subscriptions);
    const arr = mrr * 12;

    return {
      accounts: {
        total: accounts.length,
        active: accounts.filter((a) => a.status === "active").length,
        trial: accounts.filter((a) => a.status === "trial").length,
        suspended: accounts.filter((a) => a.status === "suspended").length,
      },
      subscriptions: {
        total: subscriptions.length,
        active: subscriptions.filter((s) => s.status === "active").length,
        trial: subscriptions.filter((s) => s.status === "trial").length,
        pastDue: subscriptions.filter((s) => s.status === "past_due").length,
        cancelled: subscriptions.filter((s) => s.status === "cancelled").length,
      },
      invoices: {
        total: invoices.length,
        pending: invoices.filter((i) => i.status === "pending").length,
        paid: invoices.filter((i) => i.status === "paid").length,
        overdue: invoices.filter((i) => i.status === "overdue").length,
      },
      payments: {
        total: payments.length,
        successful: payments.filter((p) => p.status === "paid").length,
        failed: payments.filter((p) => p.status === "failed").length,
        pending: payments.filter((p) => p.status === "pending").length,
      },
      revenue: {
        mrr,
        arr,
        mtd: this.calculateMTD(payments),
        ytd: this.calculateYTD(payments),
      },
      usage: {
        total: usageRecords.reduce((sum, u) => sum + u.quantity, 0),
        billable: usageRecords.filter((u) => u.totalAmount > 0).reduce((sum, u) => sum + u.totalAmount, 0),
      },
      credits: {
        total: wallets.reduce((sum, w) => sum + w.balance, 0),
        issued: wallets.reduce((sum, w) => sum + w.totalPurchased, 0),
        used: wallets.reduce((sum, w) => sum + w.totalUsed, 0),
      },
      refunds: {
        total: refunds.length,
        requested: refunds.filter((r) => r.status === "requested" || r.status === "under_review").length,
        processed: refunds.filter((r) => r.status === "processed" || r.status === "approved").length,
      },
    };
  }

  private calculateMRR(subscriptions: Subscription[]): number {
    return subscriptions
      .filter((s) => s.status === "active" || s.status === "trial")
      .reduce((sum, s) => {
        const plan = this.store.getState().pricingPlans.find((p) => p.id === s.planId);
        if (!plan) return sum;
        let price = plan.price;
        if (s.billingCycle === "yearly") price = price / 12;
        if (s.billingCycle === "quarterly") price = price / 3;
        return sum + price * s.seatCount;
      }, 0);
  }

  private calculateMTD(payments: Payment[]): number {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return payments
      .filter((p) => p.status === "paid" && new Date(p.paymentDate) >= startOfMonth)
      .reduce((sum, p) => sum + p.amount, 0);
  }

  private calculateYTD(payments: Payment[]): number {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return payments
      .filter((p) => p.status === "paid" && new Date(p.paymentDate) >= startOfYear)
      .reduce((sum, p) => sum + p.amount, 0);
  }

  createAccount(
    actor: RequestActor,
    data: {
      customerId: string;
      customerName: string;
      email: string;
      phone?: string;
      companyName?: string;
      billingAddress?: BillingAddress;
      gstin?: string;
      pan?: string;
      currency?: string;
      taxExempt?: boolean;
      notes?: string;
    }
  ): BillingAccount {
    const now = nowIso();
    const account: BillingAccount = {
      id: newId("acc"),
      tenantId: actor.tenantId,
      customerId: requireString(data, "customerId"),
      customerName: requireString(data, "customerName"),
      email: requireString(data, "email"),
      phone: optionalString(data.phone),
      companyName: optionalString(data.companyName),
      billingAddress: data.billingAddress,
      gstin: optionalString(data.gstin),
      pan: optionalString(data.pan),
      currency: (data.currency as any) || "INR",
      status: "active",
      taxExempt: asBoolean(data.taxExempt, false),
      notes: optionalString(data.notes),
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };
    this.store.getState().billingAccounts.push(account);
    this.store.save();
    this.store.audit(actor, "billing.account.create", "BillingAccount", account.id, undefined, account);
    return account;
  }

  getAccounts(actor: RequestActor, filters?: { status?: string; search?: string }): BillingAccount[] {
    let accounts = this.store.getState().billingAccounts.filter((a) => a.tenantId === actor.tenantId);
    if (filters?.status) {
      accounts = accounts.filter((a) => a.status === filters.status);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      accounts = accounts.filter(
        (a) =>
          a.customerName.toLowerCase().includes(search) ||
          a.email.toLowerCase().includes(search) ||
          (a.companyName && a.companyName.toLowerCase().includes(search))
      );
    }
    return accounts;
  }

  getAccount(actor: RequestActor, id: string): BillingAccount {
    const account = this.store
      .getState()
      .billingAccounts.find((a) => a.id === id && a.tenantId === actor.tenantId);
    if (!account) notFound("Billing account not found");
    return account;
  }

  updateAccount(
    actor: RequestActor,
    id: string,
    data: Partial<{
      customerName: string;
      email: string;
      phone: string;
      companyName: string;
      status: BillingAccountStatus;
      defaultPaymentMethodId: string;
      taxExempt: boolean;
      notes: string;
    }>
  ): BillingAccount {
    const account = this.getAccount(actor, id);
    const before = { ...account };
    if (data.customerName !== undefined) account.customerName = data.customerName;
    if (data.email !== undefined) account.email = data.email;
    if (data.phone !== undefined) account.phone = data.phone;
    if (data.companyName !== undefined) account.companyName = data.companyName;
    if (data.status !== undefined) account.status = data.status;
    if (data.defaultPaymentMethodId !== undefined) account.defaultPaymentMethodId = data.defaultPaymentMethodId;
    if (data.taxExempt !== undefined) account.taxExempt = data.taxExempt;
    if (data.notes !== undefined) account.notes = data.notes;
    account.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "billing.account.update", "BillingAccount", id, before, account);
    return account;
  }

  createPlan(
    actor: RequestActor,
    data: {
      key: string;
      name: string;
      description?: string;
      product: string;
      price: number;
      billingCycle: string;
      trialDays?: number;
      type?: string;
      features?: PlanFeature[];
      limits?: PlanLimit[];
      modules?: string[];
      isPublic?: boolean;
    }
  ): PricingPlan {
    const now = nowIso();
    const plan: PricingPlan = {
      id: newId("plan"),
      tenantId: actor.tenantId,
      key: requireString(data, "key"),
      name: requireString(data, "name"),
      description: optionalString(data.description),
      product: requireString(data, "product"),
      status: "active",
      type: (data.type as any) || "starter",
      billingCycle: data.billingCycle as any,
      price: asNumber(data.price),
      currency: "INR",
      trialDays: asNumber(data.trialDays, 14),
      features: data.features || [],
      limits: data.limits || [],
      modules: data.modules || [],
      isPublic: asBoolean(data.isPublic, true),
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };
    this.store.getState().pricingPlans.push(plan);
    this.store.save();
    this.store.audit(actor, "billing.plan.create", "PricingPlan", plan.id, undefined, plan);
    return plan;
  }

  getPlans(actor: RequestActor, filters?: { status?: string; product?: string }): PricingPlan[] {
    let plans = this.store.getState().pricingPlans.filter((p) => p.tenantId === actor.tenantId);
    if (filters?.status) {
      plans = plans.filter((p) => p.status === filters.status);
    }
    if (filters?.product) {
      plans = plans.filter((p) => p.product === filters.product);
    }
    return plans;
  }

  getPlan(actor: RequestActor, id: string): PricingPlan {
    const plan = this.store
      .getState()
      .pricingPlans.find((p) => p.id === id && p.tenantId === actor.tenantId);
    if (!plan) notFound("Pricing plan not found");
    return plan;
  }

  createSubscription(
    actor: RequestActor,
    data: {
      billingAccountId: string;
      planId: string;
      type?: string;
      billingCycle?: string;
      seatCount?: number;
      autoRenew?: boolean;
      startDate?: string;
    }
  ): Subscription {
    const account = this.getAccount(actor, requireString(data, "billingAccountId"));
    const plan = this.getPlan(actor, requireString(data, "planId"));
    const now = nowIso();
    const startDate = data.startDate || now;
    let endDate: string;
    if (plan.billingCycle === "monthly") {
      endDate = plusMonths(1);
    } else if (plan.billingCycle === "yearly") {
      endDate = plusMonths(12);
    } else if (plan.billingCycle === "quarterly") {
      endDate = plusMonths(3);
    } else {
      endDate = plusMonths(1);
    }
    const subscription: Subscription = {
      id: newId("sub"),
      tenantId: actor.tenantId,
      billingAccountId: account.id,
      planId: plan.id,
      status: plan.trialDays > 0 ? "trial" : "active",
      type: (data.type as any) || plan.billingCycle,
      billingCycle: plan.billingCycle,
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
      trialEnd: plan.trialDays > 0 ? plusDays(plan.trialDays) : undefined,
      autoRenew: asBoolean(data.autoRenew, true),
      seatCount: asNumber(data.seatCount, 1),
      modules: plan.modules,
      addons: [],
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };
    this.store.getState().subscriptions.push(subscription);
    this.store.save();
    this.store.audit(actor, "billing.subscription.create", "Subscription", subscription.id, undefined, subscription);
    this.emitEvent(actor, "billing.subscription.created", { subscriptionId: subscription.id, planId: plan.id });
    return subscription;
  }

  getSubscriptions(actor: RequestActor, filters?: { status?: string; billingAccountId?: string }): Subscription[] {
    let subscriptions = this.store.getState().subscriptions.filter((s) => s.tenantId === actor.tenantId);
    if (filters?.status) {
      subscriptions = subscriptions.filter((s) => s.status === filters.status);
    }
    if (filters?.billingAccountId) {
      subscriptions = subscriptions.filter((s) => s.billingAccountId === filters.billingAccountId);
    }
    return subscriptions;
  }

  getSubscription(actor: RequestActor, id: string): Subscription {
    const subscription = this.store
      .getState()
      .subscriptions.find((s) => s.id === id && s.tenantId === actor.tenantId);
    if (!subscription) notFound("Subscription not found");
    return subscription;
  }

  updateSubscription(
    actor: RequestActor,
    id: string,
    data: Partial<{
      status: SubscriptionStatus;
      seatCount: number;
      autoRenew: boolean;
      modules: string[];
    }>
  ): Subscription {
    const subscription = this.getSubscription(actor, id);
    const before = { ...subscription };
    if (data.status !== undefined) subscription.status = data.status;
    if (data.seatCount !== undefined) subscription.seatCount = data.seatCount;
    if (data.autoRenew !== undefined) subscription.autoRenew = data.autoRenew;
    if (data.modules !== undefined) subscription.modules = data.modules;
    subscription.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "billing.subscription.update", "Subscription", id, before, subscription);
    return subscription;
  }

  createInvoice(
    actor: RequestActor,
    data: {
      billingAccountId: string;
      subscriptionId?: string;
      type?: string;
      items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate?: number;
        discountAmount?: number;
      }>;
      dueDate?: string;
      periodStart?: string;
      periodEnd?: string;
    }
  ): Invoice {
    const account = this.getAccount(actor, requireString(data, "billingAccountId"));
    const now = nowIso();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(this.store.getState().invoices.length + 1).padStart(3, "0")}`;
    const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const discountAmount = data.items.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    const taxableAmount = subtotal - discountAmount;
    let taxAmount = 0;
    if (!account.taxExempt) {
      const taxRule = this.store.getState().taxRules.find((t) => t.isActive);
      if (taxRule) {
        taxAmount = (taxableAmount * taxRule.rate) / 100;
      }
    }
    const totalAmount = roundCurrency(taxableAmount + taxAmount);
    const invoice: Invoice = {
      id: newId("inv"),
      tenantId: actor.tenantId,
      billingAccountId: account.id,
      subscriptionId: data.subscriptionId,
      invoiceNumber,
      status: "pending",
      type: (data.type as any) || "subscription",
      currency: account.currency,
      issueDate: now,
      dueDate: data.dueDate || plusDays(15),
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      subtotal: roundCurrency(subtotal),
      discountAmount: roundCurrency(discountAmount),
      taxAmount: roundCurrency(taxAmount),
      totalAmount,
      amountPaid: 0,
      amountDue: totalAmount,
      items: data.items.map((item) => ({
        id: newId("item"),
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalAmount: roundCurrency(item.quantity * item.unitPrice),
        taxRate: item.taxRate,
        taxAmount: item.taxRate ? roundCurrency((item.quantity * item.unitPrice * item.taxRate) / 100) : undefined,
        discountAmount: item.discountAmount ? roundCurrency(item.discountAmount) : undefined,
        metadata: {},
      })),
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };
    this.store.getState().invoices.push(invoice);
    this.store.save();
    this.store.audit(actor, "billing.invoice.create", "Invoice", invoice.id, undefined, invoice);
    this.emitEvent(actor, "billing.invoice.generated", { invoiceId: invoice.id, totalAmount });
    return invoice;
  }

  getInvoices(actor: RequestActor, filters?: { status?: string; billingAccountId?: string }): Invoice[] {
    let invoices = this.store.getState().invoices.filter((i) => i.tenantId === actor.tenantId);
    if (filters?.status) {
      invoices = invoices.filter((i) => i.status === filters.status);
    }
    if (filters?.billingAccountId) {
      invoices = invoices.filter((i) => i.billingAccountId === filters.billingAccountId);
    }
    return invoices;
  }

  getInvoice(actor: RequestActor, id: string): Invoice {
    const invoice = this.store
      .getState()
      .invoices.find((i) => i.id === id && i.tenantId === actor.tenantId);
    if (!invoice) notFound("Invoice not found");
    return invoice;
  }

  createPayment(
    actor: RequestActor,
    data: {
      invoiceId?: string;
      billingAccountId: string;
      amount: number;
      currency?: string;
      gateway: string;
      paymentMethodId?: string;
      gatewayTransactionId?: string;
      status?: string;
    }
  ): Payment {
    const account = this.getAccount(actor, requireString(data, "billingAccountId"));
    const now = nowIso();
    const payment: Payment = {
      id: newId("pay"),
      tenantId: actor.tenantId,
      invoiceId: data.invoiceId,
      billingAccountId: account.id,
      paymentMethodId: data.paymentMethodId,
      amount: asNumber(data.amount),
      currency: (data.currency as any) || account.currency,
      status: (data.status as any) || "paid",
      gateway: requireString(data, "gateway"),
      gatewayTransactionId: data.gatewayTransactionId,
      paymentDate: now,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };
    this.store.getState().payments.push(payment);
    if (data.invoiceId) {
      const invoice = this.getInvoice(actor, data.invoiceId);
      invoice.amountPaid += payment.amount;
      invoice.amountDue = roundCurrency(invoice.totalAmount - invoice.amountPaid);
      if (invoice.amountDue <= 0) {
        invoice.status = "paid";
        invoice.paidAt = now;
      } else {
        invoice.status = "partially_paid";
      }
      invoice.updatedAt = now;
    }
    this.store.save();
    this.store.audit(actor, "billing.payment.create", "Payment", payment.id, undefined, payment);
    this.emitEvent(actor, "billing.payment.received", { paymentId: payment.id, amount: payment.amount });
    return payment;
  }

  getPayments(actor: RequestActor, filters?: { status?: string; billingAccountId?: string }): Payment[] {
    let payments = this.store.getState().payments.filter((p) => p.tenantId === actor.tenantId);
    if (filters?.status) {
      payments = payments.filter((p) => p.status === filters.status);
    }
    if (filters?.billingAccountId) {
      payments = payments.filter((p) => p.billingAccountId === filters.billingAccountId);
    }
    return payments;
  }

  recordUsage(
    actor: RequestActor,
    data: {
      tenantId: string;
      subscriptionId?: string;
      billingAccountId: string;
      eventType: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      metadata?: Record<string, unknown>;
    }
  ): UsageRecord {
    const now = nowIso();
    const totalAmount = roundCurrency(data.quantity * data.unitPrice);
    const usage: UsageRecord = {
      id: newId("usage"),
      tenantId: actor.tenantId,
      subscriptionId: data.subscriptionId,
      billingAccountId: requireString(data, "billingAccountId"),
      eventType: requireString(data, "eventType"),
      unit: data.unit as any,
      quantity: asNumber(data.quantity),
      unitPrice: asNumber(data.unitPrice),
      totalAmount,
      timestamp: now,
      metadata: data.metadata || {},
      createdAt: now,
      updatedAt: now,
    };
    this.store.getState().usageRecords.push(usage);
    this.store.save();
    this.store.audit(actor, "billing.usage.record", "UsageRecord", usage.id, undefined, usage);
    this.emitEvent(actor, "billing.usage.recorded", { usageId: usage.id, eventType: usage.eventType, quantity: usage.quantity });
    return usage;
  }

  getUsageRecords(
    actor: RequestActor,
    billingAccountId: string,
    filters?: { startDate?: string; endDate?: string }
  ): UsageRecord[] {
    let records = this.store
      .getState()
      .usageRecords.filter((u) => u.billingAccountId === billingAccountId && u.tenantId === actor.tenantId);
    if (filters?.startDate) {
      records = records.filter((u) => u.timestamp >= filters.startDate!);
    }
    if (filters?.endDate) {
      records = records.filter((u) => u.timestamp <= filters.endDate!);
    }
    return records;
  }

  addCredits(
    actor: RequestActor,
    data: {
      billingAccountId: string;
      type: string;
      amount: number;
      description?: string;
      expiresAt?: string;
    }
  ): { wallet: CreditWallet; transaction: CreditTransaction } {
    const account = this.getAccount(actor, requireString(data, "billingAccountId"));
    let wallet = this.store
      .getState()
      .creditWallets.find((w) => w.billingAccountId === account.id && w.type === data.type);
    const now = nowIso();
    if (!wallet) {
      wallet = {
        id: newId("wallet"),
        tenantId: actor.tenantId,
        billingAccountId: account.id,
        type: data.type as any,
        balance: 0,
        totalPurchased: 0,
        totalUsed: 0,
        expiresAt: data.expiresAt,
        autoRecharge: false,
        lowBalanceThreshold: 500,
        metadata: {},
        createdAt: now,
        updatedAt: now,
      };
      this.store.getState().creditWallets.push(wallet);
    }
    const balanceBefore = wallet.balance;
    wallet.balance += asNumber(data.amount);
    wallet.totalPurchased += asNumber(data.amount);
    wallet.updatedAt = now;
    const transaction: CreditTransaction = {
      id: newId("credtxn"),
      tenantId: actor.tenantId,
      walletId: wallet.id,
      billingAccountId: account.id,
      type: "purchase",
      amount: asNumber(data.amount),
      balanceBefore,
      balanceAfter: wallet.balance,
      description: data.description || "Credit purchase",
      createdAt: now,
      updatedAt: now,
    };
    this.store.getState().creditTransactions.push(transaction);
    this.store.save();
    this.store.audit(actor, "billing.credits.add", "CreditWallet", wallet.id, { balance: balanceBefore }, { balance: wallet.balance });
    return { wallet, transaction };
  }

  getCreditBalance(actor: RequestActor, billingAccountId: string, type?: string): CreditWallet[] {
    let wallets = this.store
      .getState()
      .creditWallets.filter((w) => w.billingAccountId === billingAccountId && w.tenantId === actor.tenantId);
    if (type) {
      wallets = wallets.filter((w) => w.type === type);
    }
    return wallets;
  }

  deductCredits(
    actor: RequestActor,
    data: {
      billingAccountId: string;
      type: string;
      amount: number;
      description: string;
      referenceId?: string;
      referenceType?: string;
    }
  ): { wallet: CreditWallet; transaction: CreditTransaction } {
    const wallet = this.store
      .getState()
      .creditWallets.find((w) => w.billingAccountId === data.billingAccountId && w.type === data.type);
    if (!wallet) notFound("Credit wallet not found");
    const balanceBefore = wallet.balance;
    const amount = asNumber(data.amount);
    if (wallet.balance < amount) {
      badRequest("Insufficient credit balance");
    }
    wallet.balance -= amount;
    wallet.totalUsed += amount;
    const now = nowIso();
    wallet.updatedAt = now;
    const transaction: CreditTransaction = {
      id: newId("credtxn"),
      tenantId: actor.tenantId,
      walletId: wallet.id,
      billingAccountId: wallet.billingAccountId,
      type: "deduction",
      amount,
      balanceBefore,
      balanceAfter: wallet.balance,
      referenceId: data.referenceId,
      referenceType: data.referenceType,
      description: data.description,
      createdAt: now,
      updatedAt: now,
    };
    this.store.getState().creditTransactions.push(transaction);
    this.store.save();
    this.store.audit(actor, "billing.credits.deduct", "CreditWallet", wallet.id, { balance: balanceBefore }, { balance: wallet.balance });
    return { wallet, transaction };
  }

  createRefund(
    actor: RequestActor,
    data: {
      paymentId: string;
      amount: number;
      reason: string;
      description?: string;
    }
  ): Refund {
    const payment = this.store
      .getState()
      .payments.find((p) => p.id === data.paymentId && p.tenantId === actor.tenantId);
    if (!payment) notFound("Payment not found");
    const now = nowIso();
    const refund: Refund = {
      id: newId("refund"),
      tenantId: actor.tenantId,
      paymentId: payment.id,
      invoiceId: payment.invoiceId,
      billingAccountId: payment.billingAccountId,
      amount: asNumber(data.amount),
      currency: payment.currency,
      status: "requested",
      reason: data.reason as any,
      description: data.description,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };
    this.store.getState().refunds.push(refund);
    payment.refundId = refund.id;
    if (payment.invoiceId) {
      const invoice = this.store.getState().invoices.find((i) => i.id === payment.invoiceId);
      if (invoice) {
        invoice.amountPaid -= refund.amount;
        invoice.amountDue += refund.amount;
        invoice.status = invoice.amountPaid >= invoice.totalAmount ? "paid" : "partially_paid";
        invoice.updatedAt = now;
      }
    }
    this.store.save();
    this.store.audit(actor, "billing.refund.create", "Refund", refund.id, undefined, refund);
    return refund;
  }

  getRefunds(actor: RequestActor, filters?: { status?: string }): Refund[] {
    let refunds = this.store.getState().refunds.filter((r) => r.tenantId === actor.tenantId);
    if (filters?.status) {
      refunds = refunds.filter((r) => r.status === filters.status);
    }
    return refunds;
  }

  createCoupon(
    actor: RequestActor,
    data: {
      code: string;
      name: string;
      description?: string;
      type: string;
      value: number;
      maxUses?: number;
      maxUsesPerUser?: number;
      validFrom?: string;
      validUntil?: string;
      applicablePlans?: string[];
      applicableModules?: string[];
      minOrderAmount?: number;
    }
  ): Coupon {
    const now = nowIso();
    const coupon: Coupon = {
      id: newId("coupon"),
      tenantId: actor.tenantId,
      code: requireString(data, "code").toUpperCase(),
      name: requireString(data, "name"),
      description: optionalString(data.description),
      type: data.type as any,
      value: asNumber(data.value),
      maxUses: data.maxUses,
      usedCount: 0,
      maxUsesPerUser: data.maxUsesPerUser,
      validFrom: data.validFrom || now,
      validUntil: data.validUntil,
      applicablePlans: data.applicablePlans || [],
      applicableModules: data.applicableModules || [],
      minOrderAmount: data.minOrderAmount,
      status: "active",
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };
    this.store.getState().coupons.push(coupon);
    this.store.save();
    this.store.audit(actor, "billing.coupon.create", "Coupon", coupon.id, undefined, coupon);
    return coupon;
  }

  validateCoupon(actor: RequestActor, code: string, billingAccountId?: string): Coupon | null {
    const coupon = this.store
      .getState()
      .coupons.find((c) => c.code === code.toUpperCase() && c.tenantId === actor.tenantId);
    if (!coupon) return null;
    if (coupon.status !== "active") return null;
    if (coupon.validUntil && isExpired(coupon.validUntil)) return null;
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return null;
    return coupon;
  }

  startDunning(
    actor: RequestActor,
    data: {
      subscriptionId: string;
      billingAccountId: string;
    }
  ): DunningAttempt {
    const subscription = this.getSubscription(actor, requireString(data, "subscriptionId"));
    const now = nowIso();
    const dunning: DunningAttempt = {
      id: newId("dunning"),
      tenantId: actor.tenantId,
      subscriptionId: subscription.id,
      billingAccountId: requireString(data, "billingAccountId"),
      attemptNumber: 0,
      status: "pending",
      paymentFailedAt: now,
      nextRetryAt: plusDays(1),
      attempts: [],
      createdAt: now,
      updatedAt: now,
    };
    this.store.getState().dunningAttempts.push(dunning);
    subscription.status = "past_due";
    subscription.updatedAt = now;
    this.store.save();
    this.store.audit(actor, "billing.dunning.start", "DunningAttempt", dunning.id, undefined, dunning);
    return dunning;
  }

  getAnalytics(actor: RequestActor, startDate?: string, endDate?: string): Record<string, unknown> {
    const state = this.store.getState();
    const accounts = state.billingAccounts.filter((a) => a.tenantId === actor.tenantId);
    const subscriptions = state.subscriptions.filter((s) => s.tenantId === actor.tenantId);
    const invoices = state.invoices.filter((i) => i.tenantId === actor.tenantId);
    const payments = state.payments.filter((p) => p.tenantId === actor.tenantId);
    const usageRecords = state.usageRecords.filter((u) => u.tenantId === actor.tenantId);
    let filteredPayments = payments;
    if (startDate) {
      filteredPayments = filteredPayments.filter((p) => p.paymentDate >= startDate);
    }
    if (endDate) {
      filteredPayments = filteredPayments.filter((p) => p.paymentDate <= endDate);
    }
    const totalRevenue = filteredPayments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
    const failedPayments = filteredPayments.filter((p) => p.status === "failed").length;
    const overdueInvoices = invoices.filter((i) => i.status === "overdue").length;
    const revenueByProduct = this.groupByProduct(invoices, state.pricingPlans);
    const usageByType = this.groupByUsageType(usageRecords);
    return {
      totalRevenue,
      mrr: this.calculateMRR(subscriptions),
      arr: this.calculateMRR(subscriptions) * 12,
      failedPayments,
      overdueInvoices,
      revenueByProduct,
      usageByType,
      totalAccounts: accounts.length,
      totalSubscriptions: subscriptions.length,
      totalInvoices: invoices.length,
      totalPayments: payments.length,
    };
  }

  private groupByProduct(invoices: Invoice[], plans: PricingPlan[]): Record<string, number> {
    const result: Record<string, number> = {};
    invoices
      .filter((i) => i.status === "paid")
      .forEach((inv) => {
        const subscription = inv.subscriptionId;
        if (subscription) {
          const plan = plans.find((p) => p.id === subscription);
          const product = plan?.product || "Unknown";
          result[product] = (result[product] || 0) + inv.totalAmount;
        }
      });
    return result;
  }

  private groupByUsageType(records: UsageRecord[]): Record<string, number> {
    return records.reduce((acc, r) => {
      acc[r.eventType] = (acc[r.eventType] || 0) + r.totalAmount;
      return acc;
    }, {} as Record<string, number>);
  }

  private emitEvent(actor: RequestActor, eventType: string, data: Record<string, unknown>): void {
    const now = nowIso();
    const event: BillingEvent = {
      id: newId("evt"),
      tenantId: actor.tenantId,
      type: eventType,
      source: "BillingOS",
      data,
      createdAt: now,
      updatedAt: now,
    };
    this.store.getState().events.unshift(event);
    this.store.save();
  }
}
