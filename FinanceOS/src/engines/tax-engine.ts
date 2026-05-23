import { InvoiceLineItem, TaxRule } from "../core/domain";
import { newId } from "../core/id";
import { round, sum } from "../core/utils";

export interface InvoiceLineInput {
  description: string;
  quantity: number;
  unitPrice: number;
  accountId?: string;
  taxRuleId?: string;
}

export interface InvoiceTotals {
  lineItems: InvoiceLineItem[];
  subtotalAmount: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export class TaxEngine {
  calculateInvoice(lines: InvoiceLineInput[], discountAmount: number, taxRules: TaxRule[]): InvoiceTotals {
    const rawSubtotal = sum(lines.map((line) => Number(line.quantity) * Number(line.unitPrice)));
    const safeDiscount = Math.min(round(Math.max(0, Number(discountAmount || 0))), rawSubtotal);
    const resultLines: InvoiceLineItem[] = lines.map((line) => {
      const quantity = Number(line.quantity);
      const unitPrice = Number(line.unitPrice);
      const lineSubtotal = round(quantity * unitPrice);
      const discountShare = rawSubtotal > 0 ? round((lineSubtotal / rawSubtotal) * safeDiscount) : 0;
      const taxableAmount = round(lineSubtotal - discountShare);
      const taxRule = line.taxRuleId ? taxRules.find((rule) => rule.id === line.taxRuleId) : undefined;
      const taxRate = taxRule?.rate ?? 0;
      const taxAmount = round(taxableAmount * (taxRate / 100));
      return {
        id: newId("line"),
        description: String(line.description ?? "Line item"),
        quantity,
        unitPrice,
        accountId: line.accountId,
        taxRuleId: line.taxRuleId,
        taxRate,
        lineSubtotal,
        discountAmount: discountShare,
        taxableAmount,
        taxAmount,
        totalAmount: round(taxableAmount + taxAmount)
      };
    });
    return {
      lineItems: resultLines,
      subtotalAmount: rawSubtotal,
      discountAmount: safeDiscount,
      taxableAmount: sum(resultLines.map((line) => line.taxableAmount)),
      taxAmount: sum(resultLines.map((line) => line.taxAmount)),
      totalAmount: sum(resultLines.map((line) => line.totalAmount))
    };
  }
}
