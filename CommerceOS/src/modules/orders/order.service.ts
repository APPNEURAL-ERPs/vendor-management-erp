import type {
  Address,
  CurrencyCode,
  Order,
  OrderItem,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  PricedLineItem
} from "../../domain/types";
import { BadRequestError, ConflictError, NotFoundError } from "../../shared/errors";
import type { EventBus } from "../../shared/events";
import { createId, nowIso } from "../../shared/id";
import { InMemoryRepository } from "../../shared/store";
import type { InventoryService } from "../inventory/inventory.service";

export interface CreateOrderInput {
  tenantId: string;
  customerId?: string;
  source: "checkout" | "pos" | "admin";
  orderType: OrderType;
  items: PricedLineItem[];
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  currency: CurrencyCode;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  discountCode?: string;
  deliveryAddress?: Address;
  notes?: string;
  metadata?: Record<string, unknown>;
}

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  confirmed: ["preparing", "ready_for_pickup", "out_for_delivery", "completed", "cancelled"],
  preparing: ["ready_for_pickup", "out_for_delivery", "completed", "cancelled"],
  ready_for_pickup: ["completed", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: ["completed", "refund_requested"],
  completed: ["refund_requested"],
  cancelled: ["refund_requested"],
  refund_requested: ["refunded"],
  refunded: []
};

export class OrderService {
  private orders = new InMemoryRepository<Order>();

  constructor(private eventBus: EventBus, private inventory: InventoryService) {}

  createOrder(input: CreateOrderInput): Order {
    if (input.items.length === 0) {
      throw new BadRequestError("Order must contain at least one item");
    }

    const now = nowIso();
    const orderItems: OrderItem[] = input.items.map((item) => ({
      ...item,
      id: createId("OITEM")
    }));

    const order: Order = {
      id: createId("ORD"),
      tenantId: input.tenantId,
      customerId: input.customerId,
      source: input.source,
      orderType: input.orderType,
      items: orderItems,
      subtotalMinor: input.subtotalMinor,
      discountMinor: input.discountMinor,
      taxMinor: input.taxMinor,
      totalMinor: input.totalMinor,
      currency: input.currency,
      paymentStatus: input.paymentStatus,
      orderStatus: input.orderStatus,
      paymentMethod: input.paymentMethod,
      discountCode: input.discountCode,
      deliveryAddress: input.deliveryAddress,
      notes: input.notes,
      metadata: input.metadata ?? {},
      history: [
        {
          status: input.orderStatus,
          changedAt: now,
          note: "Order created"
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    const created = this.orders.create(order);
    this.eventBus.publish("order.created", "CommerceOS", input.tenantId, created);
    return created;
  }

  listOrders(input: { tenantId: string; customerId?: string; status?: OrderStatus }): Order[] {
    return this.orders
      .listByTenant(input.tenantId)
      .filter((order) => (input.customerId ? order.customerId === input.customerId : true))
      .filter((order) => (input.status ? order.orderStatus === input.status : true));
  }

  getOrder(tenantId: string, orderId: string): Order {
    const order = this.orders.get(orderId);
    if (order.tenantId !== tenantId) {
      throw new NotFoundError(`Order not found: ${orderId}`);
    }
    return order;
  }

  updateStatus(input: { tenantId: string; orderId: string; status: OrderStatus; note?: string }): Order {
    const order = this.getOrder(input.tenantId, input.orderId);
    if (!allowedTransitions[order.orderStatus].includes(input.status)) {
      throw new ConflictError(`Invalid order transition ${order.orderStatus} -> ${input.status}`);
    }

    const updated = this.orders.update(order.id, (current) => ({
      ...current,
      orderStatus: input.status,
      history: [
        ...current.history,
        {
          status: input.status,
          changedAt: nowIso(),
          note: input.note
        }
      ],
      updatedAt: nowIso()
    }));

    this.eventBus.publish("order.status.updated", "CommerceOS", input.tenantId, {
      orderId: updated.id,
      from: order.orderStatus,
      to: input.status,
      note: input.note
    });

    return updated;
  }

  cancel(input: { tenantId: string; orderId: string; note?: string }): Order {
    const order = this.getOrder(input.tenantId, input.orderId);

    if (["delivered", "completed", "refunded"].includes(order.orderStatus)) {
      throw new ConflictError(`Cannot cancel order in status ${order.orderStatus}`);
    }

    if (order.orderStatus === "cancelled") {
      return order;
    }

    for (const item of order.items) {
      this.inventory.increaseStock({
        tenantId: order.tenantId,
        productId: item.productId,
        quantity: item.quantity,
        reason: "order_cancelled",
        referenceId: order.id
      });
    }

    const updated = this.orders.update(order.id, (current) => ({
      ...current,
      orderStatus: "cancelled",
      history: [
        ...current.history,
        {
          status: "cancelled",
          changedAt: nowIso(),
          note: input.note ?? "Order cancelled"
        }
      ],
      updatedAt: nowIso()
    }));

    this.eventBus.publish("order.cancelled", "CommerceOS", input.tenantId, {
      orderId: updated.id,
      note: input.note
    });

    return updated;
  }

  refund(input: { tenantId: string; orderId: string; note?: string }): Order {
    const order = this.getOrder(input.tenantId, input.orderId);

    if (order.paymentStatus !== "paid" && order.paymentStatus !== "partially_refunded") {
      throw new ConflictError(`Cannot refund order with payment status ${order.paymentStatus}`);
    }

    const updated = this.orders.update(order.id, (current) => ({
      ...current,
      paymentStatus: "refunded",
      orderStatus: "refunded",
      history: [
        ...current.history,
        {
          status: "refunded",
          changedAt: nowIso(),
          note: input.note ?? "Order refunded"
        }
      ],
      updatedAt: nowIso()
    }));

    this.eventBus.publish("order.refunded", "CommerceOS", input.tenantId, {
      orderId: updated.id,
      amountMinor: updated.totalMinor,
      note: input.note
    });

    return updated;
  }
}
