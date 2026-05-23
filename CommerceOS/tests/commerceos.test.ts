import { describe, expect, it } from "vitest";
import { createCommerceOS } from "../src/commerceos";

function createSeededOS() {
  const os = createCommerceOS();
  const tenantId = "test-tenant";
  const category = os.products.createCategory({ tenantId, name: "Food" });
  const product = os.products.createProduct({
    tenantId,
    name: "Paneer Pizza",
    categoryId: category.id,
    priceMinor: 29900,
    currency: "INR",
    taxRate: 5,
    stockTracked: true,
    stockQuantity: 10,
    status: "active"
  });
  os.discounts.createDiscount({ tenantId, code: "WELCOME10", type: "percentage", value: 10, active: true });
  return { os, tenantId, product };
}

describe("CommerceOS", () => {
  it("creates a cart, prices it, checks out, and decreases inventory", () => {
    const { os, tenantId, product } = createSeededOS();

    const cartView = os.carts.createCart({ tenantId, customerId: "CUS-1" });
    const cartWithItem = os.carts.addItem({ tenantId, cartId: cartView.cart.id, productId: product.id, quantity: 2 });
    expect(cartWithItem.pricing.subtotalMinor).toBe(59800);

    const discounted = os.carts.applyDiscount({ tenantId, cartId: cartView.cart.id, code: "WELCOME10" });
    expect(discounted.pricing.discount.amountMinor).toBe(5980);

    const result = os.checkout.checkout({
      tenantId,
      cartId: cartView.cart.id,
      customerId: "CUS-1",
      orderType: "delivery",
      paymentMethod: "upi"
    });

    expect(result.order.paymentStatus).toBe("paid");
    expect(result.order.orderStatus).toBe("confirmed");
    expect(os.products.getProduct(tenantId, product.id).stockQuantity).toBe(8);
  });

  it("restores stock when order is cancelled", () => {
    const { os, tenantId, product } = createSeededOS();

    const cartView = os.carts.createCart({ tenantId, customerId: "CUS-2" });
    os.carts.addItem({ tenantId, cartId: cartView.cart.id, productId: product.id, quantity: 1 });
    const result = os.checkout.checkout({
      tenantId,
      cartId: cartView.cart.id,
      customerId: "CUS-2",
      orderType: "pickup",
      paymentMethod: "upi"
    });

    expect(os.products.getProduct(tenantId, product.id).stockQuantity).toBe(9);
    os.orders.cancel({ tenantId, orderId: result.order.id, note: "Customer requested cancellation" });
    expect(os.products.getProduct(tenantId, product.id).stockQuantity).toBe(10);
  });

  it("creates a POS order", () => {
    const { os, tenantId, product } = createSeededOS();

    const order = os.pos.sale({
      tenantId,
      cashierId: "EMP-1",
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: "cash"
    });

    expect(order.source).toBe("pos");
    expect(order.orderStatus).toBe("completed");
    expect(os.products.getProduct(tenantId, product.id).stockQuantity).toBe(9);
  });
});
