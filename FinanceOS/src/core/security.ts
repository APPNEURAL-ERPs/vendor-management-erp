import { Role } from "./domain";
import { forbidden } from "./errors";

export const roles: Role[] = ["viewer", "finance_clerk", "billing_agent", "accountant", "finance_manager", "tax_manager", "finance_admin", "admin", "owner", "auditor"];

const permissionsByRole: Record<Role, string[]> = {
  viewer: ["finance.read", "finance.analytics.read", "finance.invoices.read", "finance.expenses.read"],
  finance_clerk: ["finance.read", "finance.counterparties.read", "finance.counterparties.write", "finance.invoices.read", "finance.invoices.write", "finance.payments.read", "finance.expenses.read", "finance.expenses.write", "finance.analytics.read"],
  billing_agent: ["finance.read", "finance.counterparties.read", "finance.counterparties.write", "finance.invoices.read", "finance.invoices.write", "finance.payments.read", "finance.payments.write", "finance.subscriptions.read", "finance.subscriptions.write", "finance.analytics.read"],
  accountant: ["finance.read", "finance.counterparties.read", "finance.accounts.read", "finance.accounts.write", "finance.tax.read", "finance.invoices.read", "finance.invoices.write", "finance.payments.read", "finance.payments.write", "finance.refunds.write", "finance.expenses.read", "finance.expenses.write", "finance.ledger.read", "finance.analytics.read", "finance.reports.read"],
  finance_manager: ["finance.read", "finance.counterparties.read", "finance.counterparties.write", "finance.accounts.read", "finance.tax.read", "finance.tax.write", "finance.invoices.read", "finance.invoices.write", "finance.payments.read", "finance.payments.write", "finance.refunds.write", "finance.expenses.read", "finance.expenses.write", "finance.expenses.approve", "finance.budgets.read", "finance.budgets.write", "finance.subscriptions.read", "finance.subscriptions.write", "finance.ledger.read", "finance.analytics.read", "finance.reports.read"],
  tax_manager: ["finance.read", "finance.tax.read", "finance.tax.write", "finance.invoices.read", "finance.expenses.read", "finance.analytics.read", "finance.reports.read"],
  finance_admin: ["*"],
  admin: ["*"],
  owner: ["*"],
  auditor: ["finance.read", "finance.counterparties.read", "finance.accounts.read", "finance.tax.read", "finance.invoices.read", "finance.payments.read", "finance.expenses.read", "finance.budgets.read", "finance.subscriptions.read", "finance.ledger.read", "finance.analytics.read", "finance.reports.read", "finance.audit.read"]
};

export function isRole(value: string): value is Role { return roles.includes(value as Role); }
export function hasPermission(role: Role, permission?: string): boolean { if (!permission) return true; const granted = permissionsByRole[role] ?? []; return granted.includes("*") || granted.includes(permission); }
export function requirePermission(role: Role, permission?: string): void { if (!hasPermission(role, permission)) forbidden(`Role ${role} does not have permission ${permission}`); }
export function listPermissions(role: Role): string[] { return permissionsByRole[role] ?? []; }
