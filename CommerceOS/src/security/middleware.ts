import type { RequestHandler } from "express";
import { ForbiddenError } from "../shared/errors";
import { parseRole, type Permission, type PermissionService } from "./permission.service";

export function requirePermission(permissionService: PermissionService, permission: Permission): RequestHandler {
  return (req, _res, next) => {
    const role = parseRole(req.header("x-role"));
    if (!permissionService.has(role, permission)) {
      throw new ForbiddenError(`Role '${role}' does not have '${permission}'`);
    }
    next();
  };
}
