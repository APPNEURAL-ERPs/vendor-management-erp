import type { CommerceOS } from "./commerceos";

export function seedDemoData(os: CommerceOS) {
  const tenantId = "demo-tenant";
  const categories = os.products.listCategories(tenantId);
  if (categories.length > 0) {
    return;
  }

  const pizza = os.products.createCategory({ tenantId, name: "Pizza" });
  const beverages = os.products.createCategory({ tenantId, name: "Beverages" });

  os.products.createProduct({
    tenantId,
    sku: "PANEER-PIZZA-MEDIUM",
    name: "Paneer Pizza",
    description: "Medium paneer pizza",
    categoryId: pizza.id,
    priceMinor: 29900,
    currency: "INR",
    taxRate: 5,
    stockTracked: true,
    stockQuantity: 100,
    status: "active"
  });

  os.products.createProduct({
    tenantId,
    sku: "COLD-COFFEE",
    name: "Cold Coffee",
    description: "Chilled coffee drink",
    categoryId: beverages.id,
    priceMinor: 14900,
    currency: "INR",
    taxRate: 5,
    stockTracked: true,
    stockQuantity: 200,
    status: "active"
  });

  os.discounts.createDiscount({
    tenantId,
    code: "WELCOME10",
    type: "percentage",
    value: 10,
    maxDiscountMinor: 10000,
    minSubtotalMinor: 10000,
    active: true
  });

  os.tax.createTaxRule({
    tenantId,
    name: "GST 5%",
    rate: 5,
    active: true
  });
}
