import type { Request } from "express";
import { BadRequestError } from "../shared/errors";

export function getTenantId(req: Request): string {
  const tenantId = req.header("x-tenant-id") || req.query.tenantId || req.body?.tenantId;
  if (!tenantId || typeof tenantId !== "string") {
    throw new BadRequestError("tenantId is required. Provide x-tenant-id header, tenantId query, or tenantId body.");
  }
  return tenantId;
}

export function getOptionalQueryString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return String(value);
}
