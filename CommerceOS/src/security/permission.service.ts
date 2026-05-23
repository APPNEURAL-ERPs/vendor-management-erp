export type Role = "customer" | "cashier" | "manager" | "admin" | "owner";

const ALL_COMMERCE_PERMISSIONS = [
  "commerce.product.create",
  "commerce.product.read",
  "commerce.product.update",
  "commerce.product.delete",
  "commerce.discount.manage",
  "commerce.tax.manage",
  "commerce.inventory.manage",
  "commerce.cart.manage",
  "commerce.checkout.use",
  "commerce.order.view",
  "commerce.order.update",
  "commerce.order.cancel",
  "commerce.order.refund",
  "commerce.pos.access",
  "commerce.analytics.view",
  "commerce.events.view"
] as const;

export type Permission = (typeof ALL_COMMERCE_PERMISSIONS)[number] | "*";

export class PermissionService {
  private rolePermissions: Record<Role, Permission[]> = {
    customer: ["commerce.product.read", "commerce.cart.manage", "commerce.checkout.use", "commerce.order.view"],
    cashier: ["commerce.product.read", "commerce.pos.access", "commerce.order.view"],
    manager: [
      "commerce.product.create",
      "commerce.product.read",
      "commerce.product.update",
      "commerce.discount.manage",
      "commerce.inventory.manage",
      "commerce.order.view",
      "commerce.order.update",
      "commerce.analytics.view"
    ],
    admin: ["*"],
    owner: ["*"]
  };

  has(role: Role, permission: Permission): boolean {
    const permissions = this.rolePermissions[role] ?? [];
    return permissions.includes("*") || permissions.includes(permission);
  }
}

export function parseRole(value: unknown): Role {
  const role = String(value || "customer").toLowerCase();
  if (["customer", "cashier", "manager", "admin", "owner"].includes(role)) {
    return role as Role;
  }
  return "customer";
}
