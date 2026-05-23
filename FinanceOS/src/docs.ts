export function docs() {
  return {
    name: "FinanceOS",
    version: "1.0.0",
    description: "FinanceOS: invoice, quotation, expense, payment, revenue, cash flow, budgeting, tax, payroll document, and financial control layer.",
    auth: {
      headers: {
        "x-role": "owner | admin | finance_manager | accountant | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      invoice: "A bill sent to clients for goods or services provided.",
      quotation: "A price estimate sent to clients before an invoice.",
      payment: "Money received from clients for invoices.",
      receipt: "Confirmation of payment received.",
      expense: "Money spent on business operations.",
      budget: "Planned spending limits for categories or projects.",
      cashFlow: "Inflow and outflow of cash in the business.",
      revenueStream: "Sources of income for the business.",
      forecast: "Predicted financial metrics based on historical data and assumptions.",
      refund: "Money returned to clients for cancelled or disputed transactions."
    },
    examples: {
      createInvoice: {
        method: "POST",
        path: "/financeos/invoices",
        headers: { "x-role": "finance_manager" },
        body: {
          clientName: "ABC Technologies",
          clientEmail: "billing@abc.com",
          items: [{ description: "Web Development", quantity: 100, rate: 500, taxRate: 18 }],
          dueDate: "2026-06-15"
        }
      },
      recordPayment: {
        method: "POST",
        path: "/financeos/payments",
        headers: { "x-role": "finance_manager" },
        body: {
          invoiceId: "inv_123",
          amount: 59000,
          method: "bank_transfer",
          paidAt: "2026-05-20"
        }
      },
      trackExpense: {
        method: "POST",
        path: "/financeos/expenses",
        headers: { "x-role": "finance_manager" },
        body: {
          category: "cloud",
          vendorName: "AWS",
          amount: 25000,
          expenseDate: "2026-05-15"
        }
      },
      generateReport: {
        method: "GET",
        path: "/financeos/reports/profit-loss?startDate=2026-01-01&endDate=2026-05-31",
        headers: { "x-role": "admin" }
      }
    },
    routes: {
      overview: "GET /financeos - Finance dashboard overview",
      invoices: {
        list: "GET /financeos/invoices - List all invoices",
        create: "POST /financeos/invoices - Create invoice",
        get: "GET /financeos/invoices/:id - Get invoice",
        update: "PATCH /financeos/invoices/:id - Update invoice",
        delete: "DELETE /financeos/invoices/:id - Delete invoice"
      },
      quotations: {
        list: "GET /financeos/quotations - List all quotations",
        create: "POST /financeos/quotations - Create quotation",
        get: "GET /financeos/quotations/:id - Get quotation",
        convert: "POST /financeos/quotations/:id/convert-to-invoice - Convert to invoice"
      },
      payments: {
        list: "GET /financeos/payments - List all payments",
        create: "POST /financeos/payments - Record payment",
        get: "GET /financeos/payments/:id - Get payment"
      },
      expenses: {
        list: "GET /financeos/expenses - List all expenses",
        create: "POST /financeos/expenses - Track expense",
        get: "GET /financeos/expenses/:id - Get expense"
      },
      budgets: {
        list: "GET /financeos/budgets - List all budgets",
        create: "POST /financeos/budgets - Create budget",
        get: "GET /financeos/budgets/:id - Get budget"
      },
      reports: {
        revenue: "GET /financeos/reports/revenue - Revenue report",
        expenses: "GET /financeos/reports/expenses - Expense report",
        profitLoss: "GET /financeos/reports/profit-loss - Profit & Loss report",
        cashFlow: "GET /financeos/reports/cash-flow - Cash flow report"
      },
      receivables: "GET /financeos/receivables - Accounts receivable",
      payables: "GET /financeos/payables - Accounts payable",
      healthScore: "GET /financeos/health-score - Financial health score"
    }
  };
}
