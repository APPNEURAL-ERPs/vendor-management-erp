import { FinanceState } from "./domain";
import { emptyState } from "./core/datastore";
import { nowIso, plusDays, calculateTax, calculateTotal } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): FinanceState {
  const state = emptyState();
  const createdAt = nowIso();

  const invoice1Id = "inv_demo_001";
  const invoice2Id = "inv_demo_002";
  const invoice3Id = "inv_demo_003";

  state.invoices.push(
    {
      id: invoice1Id,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      invoiceNumber: "INV/2026/05/001",
      type: "service",
      status: "paid",
      clientName: "ABC Technologies",
      clientEmail: "billing@abc.com",
      clientAddress: "123 Tech Park, Bangalore",
      issueDate: "2026-05-01",
      dueDate: "2026-05-15",
      items: [],
      subtotal: 50000,
      taxTotal: 9000,
      discountTotal: 0,
      total: 59000,
      currency: "INR",
      paidAmount: 59000,
      paidAt: "2026-05-10",
      metadata: {}
    },
    {
      id: invoice2Id,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      invoiceNumber: "INV/2026/05/002",
      type: "service",
      status: "sent",
      clientName: "XYZ Solutions",
      clientEmail: "accounts@xyz.com",
      clientAddress: "456 Business Center, Mumbai",
      issueDate: "2026-05-10",
      dueDate: "2026-05-25",
      items: [],
      subtotal: 75000,
      taxTotal: 13500,
      discountTotal: 5000,
      total: 83500,
      currency: "INR",
      paidAmount: 0,
      metadata: {}
    },
    {
      id: invoice3Id,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      invoiceNumber: "INV/2026/04/003",
      type: "service",
      status: "overdue",
      clientName: "Global Services Ltd",
      clientEmail: "finance@globalservices.com",
      clientAddress: "789 Corporate Tower, Delhi",
      issueDate: "2026-04-15",
      dueDate: "2026-04-30",
      items: [],
      subtotal: 100000,
      taxTotal: 18000,
      discountTotal: 0,
      total: 118000,
      currency: "INR",
      paidAmount: 0,
      metadata: {}
    }
  );

  state.invoiceItems.push(
    {
      id: "item_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      invoiceId: invoice1Id,
      description: "Web Development Services",
      quantity: 100,
      rate: 500,
      taxRate: 18,
      taxAmount: 9000,
      discountAmount: 0,
      total: 59000,
      metadata: {}
    },
    {
      id: "item_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      invoiceId: invoice2Id,
      description: "Mobile App Development",
      quantity: 150,
      rate: 500,
      taxRate: 18,
      taxAmount: 13500,
      discountAmount: 5000,
      total: 83500,
      metadata: {}
    },
    {
      id: "item_003",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      invoiceId: invoice3Id,
      description: "Cloud Infrastructure Setup",
      quantity: 200,
      rate: 500,
      taxRate: 18,
      taxAmount: 18000,
      discountAmount: 0,
      total: 118000,
      metadata: {}
    }
  );

  state.quotations.push({
    id: "qt_demo_001",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    quotationNumber: "QT/2026/05/001",
    status: "sent",
    clientName: "Tech Innovations",
    clientEmail: "info@techinnovations.com",
    validUntil: plusDays(30),
    items: [],
    subtotal: 120000,
    taxTotal: 21600,
    discountTotal: 0,
    total: 141600,
    currency: "INR",
    metadata: {}
  });

  state.payments.push(
    {
      id: "pay_demo_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      paymentNumber: "PAY/2026/05/001",
      invoiceId: invoice1Id,
      clientName: "ABC Technologies",
      amount: 59000,
      currency: "INR",
      status: "completed",
      method: "bank_transfer",
      transactionId: "TXN123456789",
      paidAt: "2026-05-10",
      metadata: {}
    }
  );

  state.expenses.push(
    {
      id: "exp_demo_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      expenseNumber: "EXP/2026/05/001",
      category: "cloud",
      status: "approved",
      vendorName: "AWS",
      description: "Cloud hosting services - May 2026",
      amount: 25000,
      currency: "INR",
      expenseDate: "2026-05-01",
      reimbursedAmount: 0,
      metadata: {}
    },
    {
      id: "exp_demo_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      expenseNumber: "EXP/2026/05/002",
      category: "marketing",
      status: "approved",
      vendorName: "Google Ads",
      description: "Online advertising - May 2026",
      amount: 15000,
      currency: "INR",
      expenseDate: "2026-05-05",
      reimbursedAmount: 0,
      metadata: {}
    },
    {
      id: "exp_demo_003",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      expenseNumber: "EXP/2026/05/003",
      category: "office",
      status: "approved",
      vendorName: "Office Supplies Co",
      description: "Office supplies and stationery",
      amount: 5000,
      currency: "INR",
      expenseDate: "2026-05-08",
      reimbursedAmount: 0,
      metadata: {}
    }
  );

  state.budgets.push({
    id: "bdg_demo_001",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    budgetNumber: "BDG/2026/05/001",
    name: "May 2026 Operations Budget",
    status: "active",
    period: "monthly",
    startDate: "2026-05-01",
    endDate: "2026-05-31",
    totalAmount: 100000,
    totalSpent: 45000,
    totalRemaining: 55000,
    categories: [],
    metadata: {}
  });

  state.cashFlowEntries.push(
    {
      id: "cf_demo_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      type: "inflow",
      category: "invoice_payment",
      description: "Payment from ABC Technologies",
      amount: 59000,
      currency: "INR",
      entryDate: "2026-05-10",
      expectedDate: "2026-05-10",
      actualDate: "2026-05-10",
      status: "confirmed",
      referenceType: "payment",
      referenceId: "pay_demo_001",
      metadata: {}
    },
    {
      id: "cf_demo_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      type: "outflow",
      category: "cloud_services",
      description: "AWS cloud hosting",
      amount: 25000,
      currency: "INR",
      entryDate: "2026-05-01",
      expectedDate: "2026-05-01",
      actualDate: "2026-05-01",
      status: "confirmed",
      referenceType: "expense",
      referenceId: "exp_demo_001",
      metadata: {}
    }
  );

  state.revenueStreams.push(
    {
      id: "rev_demo_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Custom Development",
      category: "service",
      type: "one_time",
      amount: 50000,
      currency: "INR",
      frequency: "monthly",
      startDate: "2026-01-01",
      status: "active",
      metadata: {}
    },
    {
      id: "rev_demo_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Maintenance Contracts",
      category: "service",
      type: "recurring",
      amount: 30000,
      currency: "INR",
      frequency: "monthly",
      startDate: "2026-01-01",
      status: "active",
      metadata: {}
    }
  );

  state.accountReceivables.push(
    {
      id: "ar_demo_001",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      invoiceId: invoice2Id,
      clientName: "XYZ Solutions",
      amount: 83500,
      paidAmount: 0,
      outstandingAmount: 83500,
      dueDate: "2026-05-25",
      daysOverdue: 0,
      status: "pending",
      agingBucket: "0-7",
      metadata: {}
    },
    {
      id: "ar_demo_002",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      invoiceId: invoice3Id,
      clientName: "Global Services Ltd",
      amount: 118000,
      paidAmount: 0,
      outstandingAmount: 118000,
      dueDate: "2026-04-30",
      daysOverdue: 22,
      status: "overdue",
      agingBucket: "16-30",
      metadata: {}
    }
  );

  state.taxRecords.push({
    id: "tax_demo_001",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "gst",
    period: "2026-05",
    amount: 40500,
    rate: 18,
    taxableAmount: 225000,
    inputTaxCredit: 0,
    netTax: 40500,
    status: "pending",
    dueDate: "2026-06-20",
    metadata: {}
  });

  state.financialReports.push({
    id: "rpt_demo_001",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "May 2026 Revenue Report",
    type: "revenue",
    period: "monthly",
    startDate: "2026-05-01",
    endDate: "2026-05-31",
    generatedAt: createdAt,
    summary: {
      totalRevenue: 142500,
      paidRevenue: 59000,
      pendingRevenue: 201500,
      invoiceCount: 3,
      paidInvoiceCount: 1
    },
    details: {
      invoicesByStatus: {
        paid: 1,
        sent: 1,
        overdue: 1
      }
    },
    currency: "INR",
    status: "published",
    metadata: {}
  });

  state.financialHealthScores.push({
    id: "health_demo_001",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    score: 78,
    revenueStability: 82,
    profitability: 75,
    cashFlow: 70,
    receivableRisk: 65,
    expenseControl: 85,
    debtRisk: 90,
    growth: 80,
    factors: [
      { name: "Revenue Growth", value: 82, weight: 0.2, description: "Strong month-over-month growth" },
      { name: "Profit Margin", value: 75, weight: 0.25, description: "Healthy profit margins maintained" },
      { name: "Cash Flow", value: 70, weight: 0.2, description: "Cash flow positive but tight" },
      { name: "Receivable Risk", value: 65, weight: 0.2, description: "Some overdue invoices need attention" },
      { name: "Expense Control", value: 85, weight: 0.15, description: "Expenses well controlled" }
    ],
    recommendations: [
      "Follow up on overdue invoice from Global Services Ltd",
      "Consider early payment discounts for faster collections",
      "Review cloud hosting costs for optimization opportunities"
    ],
    calculatedAt: createdAt,
    metadata: {}
  });

  return state;
}
