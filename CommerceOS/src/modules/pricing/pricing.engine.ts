import type { Cart, CurrencyCode, PricedCart, PricedLineItem } from "../../domain/types";
import { BadRequestError, ConflictError } from "../../shared/errors";
import { roundMinor } from "../../shared/id";
import type { DiscountService } from "../discounts/discount.service";
import type { ProductService } from "../products/product.service";

export interface RawLineItem {
  productId: string;
  quantity: number;
}

export class PricingEngine {
  constructor(private products: ProductService, private discounts: DiscountService) {}

  priceCart(cart: Cart): PricedCart {
    return this.priceLineItems(cart.tenantId, cart.items, cart.discountCode);
  }

  priceLineItems(tenantId: string, rawItems: RawLineItem[], discountCode?: string): PricedCart {
    if (rawItems.length === 0) {
      return {
        tenantId,
        currency: "INR",
        items: [],
        subtotalMinor: 0,
        discount: { amountMinor: 0 },
        taxMinor: 0,
        totalMinor: 0
      };
    }

    const productLines = rawItems.map((item) => {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new BadRequestError("Line item quantity must be a positive integer");
      }

      const product = this.products.getProduct(tenantId, item.productId);
      if (product.status !== "active") {
        throw new ConflictError(`Product is not active: ${product.id}`);
      }

      return { product, quantity: item.quantity };
    });

    const currency = productLines[0]?.product.currency ?? "INR";
    for (const line of productLines) {
      if (line.product.currency !== currency) {
        throw new ConflictError("All items in one cart/order must use the same currency");
      }
    }

    const subtotalMinor = productLines.reduce(
      (sum, line) => sum + line.product.priceMinor * line.quantity,
      0
    );

    const discount = this.discounts.calculate(tenantId, discountCode, subtotalMinor);

    let assignedDiscount = 0;
    const items: PricedLineItem[] = productLines.map((line, index) => {
      const lineSubtotal = line.product.priceMinor * line.quantity;
      const isLast = index === productLines.length - 1;
      const discountMinor = isLast
        ? discount.amountMinor - assignedDiscount
        : roundMinor((discount.amountMinor * lineSubtotal) / subtotalMinor);
      assignedDiscount += discountMinor;

      const taxableMinor = Math.max(lineSubtotal - discountMinor, 0);
      const taxMinor = roundMinor((taxableMinor * line.product.taxRate) / 100);
      const totalMinor = taxableMinor + taxMinor;

      return {
        productId: line.product.id,
        name: line.product.name,
        sku: line.product.sku,
        quantity: line.quantity,
        unitPriceMinor: line.product.priceMinor,
        subtotalMinor: lineSubtotal,
        discountMinor,
        taxableMinor,
        taxRate: line.product.taxRate,
        taxMinor,
        totalMinor
      };
    });

    const taxMinor = items.reduce((sum, item) => sum + item.taxMinor, 0);
    const totalMinor = Math.max(subtotalMinor - discount.amountMinor + taxMinor, 0);

    return {
      tenantId,
      currency: currency as CurrencyCode,
      items,
      subtotalMinor,
      discount,
      taxMinor,
      totalMinor
    };
  }
}
