export function newId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function plusDays(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export function plusMonths(months: number): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString();
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function calculateTax(amount: number, taxRate: number): number {
  return Number((amount * (taxRate / 100)).toFixed(2));
}

export function calculateTotal(subtotal: number, taxTotal: number, discountTotal: number): number {
  return Number((subtotal + taxTotal - discountTotal).toFixed(2));
}

export function calculateAge(dueDate: string): number {
  const due = new Date(dueDate).getTime();
  const now = Date.now();
  const diff = now - due;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getAgingBucket(daysOverdue: number): "0-7" | "8-15" | "16-30" | "31-60" | "60+" {
  if (daysOverdue <= 7) return "0-7";
  if (daysOverdue <= 15) return "8-15";
  if (daysOverdue <= 30) return "16-30";
  if (daysOverdue <= 60) return "31-60";
  return "60+";
}

export function generateInvoiceNumber(prefix = "INV"): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `${prefix}/${year}/${month}/${random}`;
}

export function generateQuotationNumber(prefix = "QT"): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `${prefix}/${year}/${month}/${random}`;
}

export function generatePaymentNumber(prefix = "PAY"): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `${prefix}/${year}/${month}/${random}`;
}

export function generateReceiptNumber(prefix = "RCP"): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `${prefix}/${year}/${month}/${random}`;
}

export function generateExpenseNumber(prefix = "EXP"): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `${prefix}/${year}/${month}/${random}`;
}

export function generateBudgetNumber(prefix = "BDG"): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `${prefix}/${year}/${month}/${random}`;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function isOverdue(dueDate: string): boolean {
  return new Date(dueDate).getTime() < Date.now();
}

export function getMonthKey(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function calculateProfitMargin(revenue: number, expenses: number): number {
  if (revenue === 0) return 0;
  return Number(((revenue - expenses) / revenue * 100).toFixed(2));
}

export function calculateHealthScore(metrics: {
  revenueGrowth: number;
  profitMargin: number;
  cashRatio: number;
  overdueRatio: number;
  expenseGrowth: number;
}): number {
  const weights = {
    revenueGrowth: 0.2,
    profitMargin: 0.25,
    cashRatio: 0.2,
    overdueRatio: 0.2,
    expenseGrowth: 0.15
  };

  const revenueScore = Math.min(100, Math.max(0, 50 + metrics.revenueGrowth));
  const profitScore = Math.min(100, Math.max(0, metrics.profitMargin * 2));
  const cashScore = Math.min(100, metrics.cashRatio * 100);
  const overdueScore = Math.min(100, 100 - metrics.overdueRatio * 100);
  const expenseScore = Math.min(100, Math.max(0, 100 - metrics.expenseGrowth));

  const score = 
    revenueScore * weights.revenueGrowth +
    profitScore * weights.profitMargin +
    cashScore * weights.cashRatio +
    overdueScore * weights.overdueRatio +
    expenseScore * weights.expenseGrowth;

  return Math.round(score);
}
