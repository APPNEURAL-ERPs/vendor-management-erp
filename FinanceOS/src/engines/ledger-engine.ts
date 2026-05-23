import { DataStore } from "../core/datastore";
import { CurrencyCode, Expense, Invoice, LedgerEntry, Payment, Refund, RequestActor } from "../core/domain";
import { newId, nowIso } from "../core/id";
import { round } from "../core/utils";

interface EntryInput {
  accountCode: string;
  accountName: string;
  accountType: LedgerEntry["accountType"];
  side: LedgerEntry["side"];
  amount: number;
  description: string;
}

export class LedgerEngine {
  constructor(private readonly store: DataStore) {}

  postInvoice(actor: RequestActor, invoice: Invoice): LedgerEntry[] {
    if (this.hasJournal("invoice", invoice.id)) return [];
    const entries: EntryInput[] = [
      { accountCode: "1100", accountName: "Accounts Receivable", accountType: "asset", side: "debit", amount: invoice.totalAmount, description: `Invoice ${invoice.invoiceNumber}` },
      { accountCode: "4000", accountName: "Revenue", accountType: "revenue", side: "credit", amount: invoice.taxableAmount, description: `Revenue for ${invoice.invoiceNumber}` }
    ];
    if (invoice.taxAmount > 0) entries.push({ accountCode: "2100", accountName: "Tax Payable", accountType: "liability", side: "credit", amount: invoice.taxAmount, description: `Tax for ${invoice.invoiceNumber}` });
    return this.post(actor, "invoice", invoice.id, invoice.currency, entries);
  }

  postPayment(actor: RequestActor, payment: Payment): LedgerEntry[] {
    if (this.hasJournal("payment", payment.id)) return [];
    const entries: EntryInput[] = [
      { accountCode: "1000", accountName: "Cash / Bank", accountType: "asset", side: "debit", amount: payment.amount, description: `Payment ${payment.paymentNumber}` },
      { accountCode: payment.invoiceId ? "1100" : "2200", accountName: payment.invoiceId ? "Accounts Receivable" : "Accounts Payable", accountType: payment.invoiceId ? "asset" : "liability", side: "credit", amount: payment.amount, description: `Payment settlement ${payment.paymentNumber}` }
    ];
    return this.post(actor, "payment", payment.id, payment.currency, entries);
  }

  postExpensePayment(actor: RequestActor, payment: Payment): LedgerEntry[] {
    if (this.hasJournal("payment", payment.id)) return [];
    const entries: EntryInput[] = [
      { accountCode: "2200", accountName: "Accounts Payable", accountType: "liability", side: "debit", amount: payment.amount, description: `Expense payment ${payment.paymentNumber}` },
      { accountCode: "1000", accountName: "Cash / Bank", accountType: "asset", side: "credit", amount: payment.amount, description: `Cash paid ${payment.paymentNumber}` }
    ];
    return this.post(actor, "payment", payment.id, payment.currency, entries);
  }

  postRefund(actor: RequestActor, refund: Refund): LedgerEntry[] {
    if (this.hasJournal("refund", refund.id)) return [];
    const entries: EntryInput[] = [
      { accountCode: "1100", accountName: "Accounts Receivable", accountType: "asset", side: "debit", amount: refund.amount, description: `Refund ${refund.refundNumber}` },
      { accountCode: "1000", accountName: "Cash / Bank", accountType: "asset", side: "credit", amount: refund.amount, description: `Cash refund ${refund.refundNumber}` }
    ];
    return this.post(actor, "refund", refund.id, refund.currency, entries);
  }

  postExpenseAccrual(actor: RequestActor, expense: Expense): LedgerEntry[] {
    if (this.hasJournal("expense", expense.id)) return [];
    const entries: EntryInput[] = [
      { accountCode: "5000", accountName: `${expense.category} Expense`, accountType: "expense", side: "debit", amount: expense.amount, description: expense.description },
      { accountCode: "2200", accountName: "Accounts Payable", accountType: "liability", side: "credit", amount: expense.totalAmount, description: `Payable ${expense.expenseNumber}` }
    ];
    if (expense.taxAmount > 0) entries.splice(1, 0, { accountCode: "1300", accountName: "Input Tax Credit", accountType: "asset", side: "debit", amount: expense.taxAmount, description: `Recoverable tax ${expense.expenseNumber}` });
    return this.post(actor, "expense", expense.id, expense.currency, entries);
  }

  private hasJournal(sourceType: LedgerEntry["sourceType"], sourceId: string): boolean {
    return this.store.getState().ledgerEntries.some((entry) => entry.sourceType === sourceType && entry.sourceId === sourceId);
  }

  private post(actor: RequestActor, sourceType: LedgerEntry["sourceType"], sourceId: string, currency: CurrencyCode, entries: EntryInput[]): LedgerEntry[] {
    const debit = round(entries.filter((e) => e.side === "debit").reduce((total, e) => total + e.amount, 0));
    const credit = round(entries.filter((e) => e.side === "credit").reduce((total, e) => total + e.amount, 0));
    if (Math.abs(debit - credit) > 0.01) throw new Error(`Ledger journal is not balanced. Debit=${debit} Credit=${credit}`);
    const now = nowIso();
    const journalId = newId("jrnl");
    const ledgerEntries = entries.map((entry) => ({
      id: newId("ledger"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, journalId,
      accountCode: entry.accountCode, accountName: entry.accountName, accountType: entry.accountType, side: entry.side,
      amount: round(entry.amount), currency, sourceType, sourceId, description: entry.description, postedAt: now
    }));
    this.store.getState().ledgerEntries.unshift(...ledgerEntries);
    this.store.save();
    return ledgerEntries;
  }
}
