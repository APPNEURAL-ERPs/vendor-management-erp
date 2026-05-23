import type { PaymentMethod } from "../../domain/types";
import { BadRequestError } from "../../shared/errors";
import type { EventBus } from "../../shared/events";
import type { DiscountService } from "../discounts/discount.service";
import type { InventoryService } from "../inventory/inventory.service";
import type { OrderService } from "../orders/order.service";
import type { PricingEngine, RawLineItem } from "../pricing/pricing.engine";

export interface POSSaleInput {
  tenantId: string;
  cashierId: string;
  customerId?: string;
  items: RawLineItem[];
  paymentMethod: PaymentMethod;
  discountCode?: string;
  notes?: string;
}

export class POSService {
  constructor(
    private pricing: PricingEngine,
    private discounts: DiscountService,
    private inventory: InventoryService,
    private orders: OrderService,
    private eventBus: EventBus
  ) {}

  sale(input: POSSaleInput) {
    if (input.items.length === 0) {
      throw new BadRequestError("POS sale must contain at least one item");
    }

    const priced = this.pricing.priceLineItems(input.tenantId, input.items, input.discountCode);
    const decreased: Array<{ productId: string; quantity: number }> = [];

    try {
      for (const item of priced.items) {
        this.inventory.decreaseStock({
          tenantId: input.tenantId,
          productId: item.productId,
          quantity: item.quantity,
          reason: "pos_sale",
          referenceId: input.cashierId
        });
        decreased.push({ productId: item.productId, quantity: item.quantity });
      }

      this.discounts.markUsed(input.tenantId, priced.discount.code);

      const order = this.orders.createOrder({
        tenantId: input.tenantId,
        customerId: input.customerId,
        source: "pos",
        orderType: "pos",
        items: priced.items,
        subtotalMinor: priced.subtotalMinor,
        discountMinor: priced.discount.amountMinor,
        taxMinor: priced.taxMinor,
        totalMinor: priced.totalMinor,
        currency: priced.currency,
        paymentStatus: "paid",
        orderStatus: "completed",
        paymentMethod: input.paymentMethod,
        discountCode: priced.discount.code,
        notes: input.notes,
        metadata: { cashierId: input.cashierId }
      });

      this.eventBus.publish("pos.sale.completed", "CommerceOS", input.tenantId, {
        orderId: order.id,
        cashierId: input.cashierId,
        totalMinor: order.totalMinor
      });

      this.eventBus.publish("payment.completed", "CommerceOS", input.tenantId, {
        orderId: order.id,
        amountMinor: order.totalMinor,
        paymentMethod: input.paymentMethod
      });

      return order;
    } catch (error) {
      for (const item of decreased) {
        this.inventory.increaseStock({
          tenantId: input.tenantId,
          productId: item.productId,
          quantity: item.quantity,
          reason: "pos_rollback",
          referenceId: input.cashierId
        });
      }
      throw error;
    }
  }
}
