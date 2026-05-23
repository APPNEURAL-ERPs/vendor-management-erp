import type { Address, OrderType, PaymentMethod, PaymentStatus } from "../../domain/types";
import { BadRequestError } from "../../shared/errors";
import type { EventBus } from "../../shared/events";
import type { CartService } from "../carts/cart.service";
import type { DiscountService } from "../discounts/discount.service";
import type { InventoryService } from "../inventory/inventory.service";
import type { OrderService } from "../orders/order.service";
import type { PricingEngine } from "../pricing/pricing.engine";

export interface CheckoutInput {
  tenantId: string;
  cartId: string;
  customerId?: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  deliveryAddress?: Address;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export class CheckoutService {
  constructor(
    private carts: CartService,
    private pricing: PricingEngine,
    private discounts: DiscountService,
    private inventory: InventoryService,
    private orders: OrderService,
    private eventBus: EventBus
  ) {}

  checkout(input: CheckoutInput) {
    const cart = this.carts.getRawCart(input.tenantId, input.cartId);
    if (cart.items.length === 0) {
      throw new BadRequestError("Cannot checkout empty cart");
    }

    this.eventBus.publish("checkout.started", "CommerceOS", input.tenantId, {
      cartId: cart.id,
      customerId: input.customerId ?? cart.customerId
    });

    const deliveryAddress = input.deliveryAddress ?? cart.deliveryAddress;
    const priced = this.pricing.priceCart(cart);
    const decreased: Array<{ productId: string; quantity: number }> = [];

    try {
      for (const item of priced.items) {
        this.inventory.decreaseStock({
          tenantId: input.tenantId,
          productId: item.productId,
          quantity: item.quantity,
          reason: "checkout",
          referenceId: cart.id
        });
        decreased.push({ productId: item.productId, quantity: item.quantity });
      }

      this.discounts.markUsed(input.tenantId, priced.discount.code);

      const paymentStatus = this.resolvePaymentStatus(input.paymentMethod, input.paymentStatus);
      const order = this.orders.createOrder({
        tenantId: input.tenantId,
        customerId: input.customerId ?? cart.customerId,
        source: "checkout",
        orderType: input.orderType,
        items: priced.items,
        subtotalMinor: priced.subtotalMinor,
        discountMinor: priced.discount.amountMinor,
        taxMinor: priced.taxMinor,
        totalMinor: priced.totalMinor,
        currency: priced.currency,
        paymentStatus,
        orderStatus: "confirmed",
        paymentMethod: input.paymentMethod,
        discountCode: priced.discount.code,
        deliveryAddress,
        notes: input.notes,
        metadata: input.metadata
      });

      this.carts.markConverted(input.tenantId, input.cartId);

      if (paymentStatus === "paid") {
        this.eventBus.publish("payment.completed", "CommerceOS", input.tenantId, {
          orderId: order.id,
          amountMinor: order.totalMinor,
          paymentMethod: input.paymentMethod
        });
      }

      return {
        order,
        paymentRequired: paymentStatus === "pending"
      };
    } catch (error) {
      for (const item of decreased) {
        this.inventory.increaseStock({
          tenantId: input.tenantId,
          productId: item.productId,
          quantity: item.quantity,
          reason: "checkout_rollback",
          referenceId: cart.id
        });
      }
      throw error;
    }
  }

  private resolvePaymentStatus(paymentMethod: PaymentMethod, provided?: PaymentStatus): PaymentStatus {
    if (provided) {
      if (!["pending", "paid"].includes(provided)) {
        throw new BadRequestError("Checkout can only start with paymentStatus 'pending' or 'paid'");
      }
      return provided;
    }

    if (paymentMethod === "cash_on_delivery") {
      return "pending";
    }

    return "paid";
  }
}
