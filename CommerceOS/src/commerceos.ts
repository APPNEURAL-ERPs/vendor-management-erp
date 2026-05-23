import { registerOSSubscribers } from "./integrations/os-subscribers";
import { CartService } from "./modules/carts/cart.service";
import { CheckoutService } from "./modules/checkout/checkout.service";
import { DiscountService } from "./modules/discounts/discount.service";
import { InventoryService } from "./modules/inventory/inventory.service";
import { OrderService } from "./modules/orders/order.service";
import { POSService } from "./modules/pos/pos.service";
import { PricingEngine } from "./modules/pricing/pricing.engine";
import { ProductService } from "./modules/products/product.service";
import { TaxService } from "./modules/tax/tax.service";
import { AnalyticsService } from "./modules/analytics/analytics.service";
import { PermissionService } from "./security/permission.service";
import { EventBus } from "./shared/events";

export function createCommerceOS() {
  const eventBus = new EventBus();
  const permissions = new PermissionService();

  const products = new ProductService(eventBus);
  const discounts = new DiscountService(eventBus);
  const tax = new TaxService(eventBus);
  const pricing = new PricingEngine(products, discounts);
  const inventory = new InventoryService(products, eventBus);
  const carts = new CartService(products, pricing, eventBus);
  const orders = new OrderService(eventBus, inventory);
  const checkout = new CheckoutService(carts, pricing, discounts, inventory, orders, eventBus);
  const pos = new POSService(pricing, discounts, inventory, orders, eventBus);
  const analytics = new AnalyticsService(orders);

  registerOSSubscribers(eventBus);

  return {
    eventBus,
    permissions,
    products,
    discounts,
    tax,
    pricing,
    inventory,
    carts,
    orders,
    checkout,
    pos,
    analytics
  };
}

export type CommerceOS = ReturnType<typeof createCommerceOS>;
