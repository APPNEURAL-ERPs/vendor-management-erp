import { BusinessSetting, BusinessState, ConfigValidationIssue, RequestActor, SettingDataType, SettingValue } from "../core/domain";
import { canViewSecrets } from "../core/security";
import { clone } from "../core/utils";

export class ConfigEngine {
  inferDataType(value: unknown): SettingDataType {
    if (Array.isArray(value)) return "array";
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "number") return "number";
    if (typeof value === "string") return "string";
    return "json";
  }

  normalizeValue(value: unknown, dataType: SettingDataType): SettingValue {
    if (dataType === "string") return String(value ?? "");
    if (dataType === "number") return Number(value ?? 0);
    if (dataType === "boolean") return Boolean(value);
    if (dataType === "array") return Array.isArray(value) ? value : [];
    if (typeof value === "object" && value !== null && !Array.isArray(value)) return value as Record<string, unknown>;
    return { value };
  }

  maskSettings(actor: RequestActor, settings: BusinessSetting[]): BusinessSetting[] {
    const mayViewSecrets = canViewSecrets(actor.role);
    return settings.map((setting) => {
      if (!setting.isSecret || mayViewSecrets) return clone(setting);
      return { ...clone(setting), value: "********" };
    });
  }

  validateState(state: BusinessState, tenantId: string): ConfigValidationIssue[] {
    const issues: ConfigValidationIssue[] = [];
    const organization = state.organizations.find((item) => item.tenantId === tenantId && item.status !== "archived");
    if (!organization) {
      issues.push({ severity: "error", code: "organization.missing", message: "Organization profile is missing." });
    } else {
      if (!organization.timezone) issues.push({ severity: "error", code: "organization.timezone.missing", message: "Organization timezone is missing.", entityType: "organization", entityId: organization.id });
      if (!organization.currency) issues.push({ severity: "error", code: "organization.currency.missing", message: "Organization currency is missing.", entityType: "organization", entityId: organization.id });
      if (!organization.contactEmail) issues.push({ severity: "warning", code: "organization.email.missing", message: "Organization contact email is missing.", entityType: "organization", entityId: organization.id });
    }

    const branches = state.branches.filter((item) => item.tenantId === tenantId && item.status !== "archived");
    if (branches.length === 0) issues.push({ severity: "warning", code: "branch.none", message: "No active branches exist." });

    const departments = state.departments.filter((item) => item.tenantId === tenantId && item.status !== "archived");
    const branchIds = new Set(branches.map((item) => item.id));
    for (const department of departments) {
      for (const branchId of department.branchIds) {
        if (!branchIds.has(branchId)) {
          issues.push({ severity: "error", code: "department.branch.invalid", message: `Department '${department.name}' references a missing branch.`, entityType: "department", entityId: department.id });
        }
      }
    }

    const settings = state.settings.filter((item) => item.tenantId === tenantId && item.status !== "archived");
    for (const setting of settings) {
      if (setting.validation.required && (setting.value === undefined || setting.value === null || setting.value === "")) {
        issues.push({ severity: "error", code: "setting.required.empty", message: `Setting '${setting.key}' is required but empty.`, entityType: "setting", entityId: setting.id });
      }
      if (setting.validation.allowedValues && setting.validation.allowedValues.length > 0) {
        const stringValue = String(setting.value);
        if (!setting.validation.allowedValues.includes(stringValue)) {
          issues.push({ severity: "warning", code: "setting.allowed_values", message: `Setting '${setting.key}' is outside allowed values.`, entityType: "setting", entityId: setting.id });
        }
      }
    }

    return issues;
  }
}
