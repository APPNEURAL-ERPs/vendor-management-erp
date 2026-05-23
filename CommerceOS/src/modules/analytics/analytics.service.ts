import type { OrderStatus } from "../../domain/types";
import type { OrderService } from "../orders/order.service";

export class AnalyticsService {
  constructor(private orders: OrderService) {}

  summary(tenantId: string) {
    const orders = this.orders.listOrders({ tenantId });
    const completedOrPaid = orders.filter((order) => order.paymentStatus === "paid" || order.paymentStatus === "refunded");
    const revenueOrders = completedOrPaid.filter((order) => order.paymentStatus === "paid");
    const totalRevenueMinor = revenueOrders.reduce((sum, order) => sum + order.totalMinor, 0);

    const statusCounts = orders.reduce<Record<OrderStatus, number>>((acc, order) => {
      acc[order.orderStatus] = (acc[order.orderStatus] ?? 0) + 1;
      return acc;
    }, {} as Record<OrderStatus, number>);

    const productMap = new Map<string, { productId: string; name: string; quantity: number; revenueMinor: number }>();
    for (const order of revenueOrders) {
      for (const item of order.items) {
        const existing = productMap.get(item.productId) ?? {
          productId: item.productId,
          name: item.name,
          quantity: 0,
          revenueMinor: 0
        };
        existing.quantity += item.quantity;
        existing.revenueMinor += item.totalMinor;
        productMap.set(item.productId, existing);
      }
    }

    const topProducts = Array.from(productMap.values()).sort((a, b) => b.revenueMinor - a.revenueMinor).slice(0, 10);

    return {
      tenantId,
      totalOrders: orders.length,
      paidOrders: revenueOrders.length,
      totalRevenueMinor,
      averageOrderValueMinor: revenueOrders.length ? Math.round(totalRevenueMinor / revenueOrders.length) : 0,
      statusCounts,
      topProducts
    };
  }
}
