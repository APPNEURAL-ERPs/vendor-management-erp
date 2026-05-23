export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

export function badRequest(message: string, details?: unknown): never {
  throw new HttpError(400, message, details);
}

export function notFound(message: string, details?: unknown): never {
  throw new HttpError(404, message, details);
}

export function forbidden(message: string, details?: unknown): never {
  throw new HttpError(403, message, details);
}

export function conflict(message: string, details?: unknown): never {
  throw new HttpError(409, message, details);
}

export function isRole(value: string): value is import("./domain").Role {
  const validRoles: string[] = ["owner", "admin", "legal_admin", "contract_manager", "legal_reviewer", "finance_approver", "viewer"];
  return validRoles.includes(value);
}

export function requirePermission(role: import("./domain").Role, permission?: string): void {
  const permissionsByRole: Record<string, string[]> = {
    owner: ["*"],
    admin: ["*"],
    legal_admin: ["contract.*", "clause.*", "template.*", "party.*", "obligation.*", "audit.read"],
    contract_manager: ["contract.read", "contract.write", "obligation.read", "obligation.write", "clause.read", "template.read", "party.read", "party.write", "audit.read"],
    legal_reviewer: ["contract.read", "contract.approve", "obligation.read", "clause.read", "template.read", "party.read", "audit.read"],
    finance_approver: ["contract.read", "contract.approve", "audit.read"],
    viewer: ["contract.read", "obligation.read", "clause.read", "template.read", "party.read", "audit.read"]
  };

  if (!permission) return;
  const granted = permissionsByRole[role] ?? [];
  if (!granted.includes("*") && !granted.includes(permission)) {
    forbidden(`Role ${role} does not have permission ${permission}`);
  }
}

export function permissionsFor(role: import("./domain").Role): string[] {
  const permissionsByRole: Record<string, string[]> = {
    owner: ["*"],
    admin: ["*"],
    legal_admin: ["contract.*", "clause.*", "template.*", "party.*", "obligation.*", "audit.read"],
    contract_manager: ["contract.read", "contract.write", "obligation.read", "obligation.write", "clause.read", "template.read", "party.read", "party.write", "audit.read"],
    legal_reviewer: ["contract.read", "contract.approve", "obligation.read", "clause.read", "template.read", "party.read", "audit.read"],
    finance_approver: ["contract.read", "contract.approve", "audit.read"],
    viewer: ["contract.read", "obligation.read", "clause.read", "template.read", "party.read", "audit.read"]
  };
  return permissionsByRole[role] ?? [];
}
