import {
  Config,
  ConfigOverview,
  ConfigRollback,
  ConfigVersion,
  EnvironmentConfig,
  FeatureFlag,
  RequestActor,
  RuntimeOverride,
  TenantSetting
} from "./domain";
import { DataStore } from "./core/datastore";
import { newId, nowIso } from "./core/id";
import { badRequest, clone, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, getPathValue, notFound, pickQuery, setPathValue } from "./core/utils";

export class ConfigService {
  constructor(private readonly store: DataStore) {}

  getOverview(actor: RequestActor): ConfigOverview {
    const state = this.store.getState();
    const configs = state.configs.filter(c => c.tenantId === actor.tenantId);
    const featureFlags = state.featureFlags.filter(f => f.tenantId === actor.tenantId);
    const tenantSettings = state.tenantSettings.filter(t => t.tenantId === actor.tenantId || t.tenantId === "global");
    const recentChanges = state.auditLogs
      .filter(l => l.tenantId === actor.tenantId && l.action !== "seed")
      .slice(0, 50).length;
    const rollbackCount = state.configRollbacks
      .filter(r => r.tenantId === actor.tenantId && r.status === "success").length;

    return {
      configs: {
        total: configs.length,
        active: configs.filter(c => c.status === "published").length,
        draft: configs.filter(c => c.status === "draft").length,
        pendingApproval: configs.filter(c => c.status === "pending_approval").length
      },
      featureFlags: {
        total: featureFlags.length,
        enabled: featureFlags.filter(f => f.enabled).length,
        disabled: featureFlags.filter(f => !f.enabled).length
      },
      environments: {
        total: state.environmentConfigs.length,
        active: state.environmentConfigs.filter(e => e.status === "active").length
      },
      tenants: {
        total: new Set(tenantSettings.map(t => t.tenantId)).size,
        withOverrides: new Set(tenantSettings.filter(t => t.overrideGlobal).map(t => t.tenantId)).size
      },
      recentChanges,
      rollbackCount
    };
  }

  listConfigs(actor: RequestActor, query?: {
    environment?: string;
    scope?: string;
    moduleId?: string;
    status?: string;
    search?: string;
  }): Config[] {
    let configs = this.store.getState().configs.filter(c => c.tenantId === actor.tenantId);

    if (query?.environment) {
      configs = configs.filter(c => c.environment === query.environment);
    }
    if (query?.scope) {
      configs = configs.filter(c => c.scope === query.scope);
    }
    if (query?.moduleId) {
      configs = configs.filter(c => c.moduleId === query.moduleId);
    }
    if (query?.status) {
      configs = configs.filter(c => c.status === query.status);
    }
    if (query?.search) {
      const search = query.search.toLowerCase();
      configs = configs.filter(c =>
        c.key.toLowerCase().includes(search) ||
        c.name.toLowerCase().includes(search) ||
        c.description?.toLowerCase().includes(search)
      );
    }

    return configs;
  }

  getConfig(actor: RequestActor, configId: string): Config {
    const config = this.store.getState().configs.find(c => c.id === configId && c.tenantId === actor.tenantId);
    if (!config) notFound(`Config ${configId} not found`);
    return config;
  }

  createConfig(actor: RequestActor, input: {
    key: string;
    name: string;
    description?: string;
    value: unknown;
    environment?: string;
    scope?: string;
    moduleId?: string;
    tags?: string[];
    sensitive?: boolean;
    approvalRequired?: boolean;
  }): Config {
    const now = nowIso();
    const valueType = this.detectValueType(input.value);

    const config: Config = {
      id: newId("config"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key: ensureString(input.key, "key"),
      name: ensureString(input.name, "name"),
      description: input.description,
      value: input.value,
      valueType,
      environment: (input.environment || "global") as any,
      scope: (input.scope || "global") as any,
      moduleId: input.moduleId,
      status: input.approvalRequired ? "pending_approval" : "published",
      tags: ensureArray(input.tags, "tags", []),
      sensitive: ensureBoolean(input.sensitive, false),
      approvalRequired: ensureBoolean(input.approvalRequired, false),
      version: 1,
      createdBy: actor.userId
    };

    this.store.getState().configs.push(config);
    this.store.audit(actor, "create", "Config", config.id, undefined, config);
    this.store.save();

    return config;
  }

  updateConfig(actor: RequestActor, configId: string, input: {
    value?: unknown;
    name?: string;
    description?: string;
    tags?: string[];
  }): Config {
    const config = this.getConfig(actor, configId);
    const before = clone(config);

    if (input.name !== undefined) config.name = ensureString(input.name, "name");
    if (input.description !== undefined) config.description = input.description;
    if (input.value !== undefined) {
      config.value = input.value;
      config.valueType = this.detectValueType(input.value);
      config.version += 1;
    }
    if (input.tags !== undefined) config.tags = ensureArray(input.tags, "tags", []);

    config.updatedAt = nowIso();
    config.updatedBy = actor.userId;

    this.store.audit(actor, "update", "Config", config.id, before, config);
    this.store.save();

    return config;
  }

  deleteConfig(actor: RequestActor, configId: string): void {
    const config = this.getConfig(actor, configId);
    const before = clone(config);

    this.store.getState().configs = this.store.getState().configs.filter(c => c.id !== configId);
    this.store.audit(actor, "delete", "Config", configId, before, undefined);
    this.store.save();
  }

  resolveConfigValue(actor: RequestActor, key: string, environment?: string, tenantId?: string): unknown {
    const state = this.store.getState();

    const runtimeOverride = state.runtimeOverrides.find(r =>
      r.key === key &&
      r.status === "active" &&
      (!environment || r.environment === environment) &&
      (!tenantId || r.tenantId === tenantId)
    );
    if (runtimeOverride) return runtimeOverride.value;

    const tenantSetting = state.tenantSettings.find(t =>
      t.key === key &&
      t.status === "active" &&
      (t.tenantId === tenantId || t.tenantId === "global")
    );
    if (tenantSetting && tenantSetting.overrideGlobal) return tenantSetting.value;

    const envConfig = state.environmentConfigs.find(e =>
      e.values[key] !== undefined &&
      e.status === "active" &&
      (!environment || e.environment === environment)
    );
    if (envConfig) return envConfig.values[key];

    const config = state.configs.find(c =>
      c.key === key &&
      c.status === "published" &&
      c.tenantId === actor.tenantId
    );
    if (config) return config.value;

    return undefined;
  }

  listFeatureFlags(actor: RequestActor, query?: {
    environment?: string;
    enabled?: boolean;
    status?: string;
    search?: string;
  }): FeatureFlag[] {
    let flags = this.store.getState().featureFlags.filter(f => f.tenantId === actor.tenantId);

    if (query?.environment) {
      flags = flags.filter(f => f.environment === query.environment);
    }
    if (query?.enabled !== undefined) {
      flags = flags.filter(f => f.enabled === query.enabled);
    }
    if (query?.status) {
      flags = flags.filter(f => f.status === query.status);
    }
    if (query?.search) {
      const search = query.search.toLowerCase();
      flags = flags.filter(f =>
        f.key.toLowerCase().includes(search) ||
        f.name.toLowerCase().includes(search)
      );
    }

    return flags;
  }

  getFeatureFlag(actor: RequestActor, flagId: string): FeatureFlag {
    const flag = this.store.getState().featureFlags.find(f => f.id === flagId && f.tenantId === actor.tenantId);
    if (!flag) notFound(`Feature flag ${flagId} not found`);
    return flag;
  }

  createFeatureFlag(actor: RequestActor, input: {
    key: string;
    name: string;
    description?: string;
    enabled?: boolean;
    environment?: string;
    rolloutPercentage?: number;
    targetTenants?: string[];
    targetRoles?: string[];
    targetPlans?: string[];
    killSwitch?: boolean;
    tags?: string[];
  }): FeatureFlag {
    const now = nowIso();
    const flag: FeatureFlag = {
      id: newId("ff"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key: ensureString(input.key, "key"),
      name: ensureString(input.name, "name"),
      description: input.description,
      enabled: ensureBoolean(input.enabled, false),
      environment: (input.environment || "production") as any,
      rolloutPercentage: input.rolloutPercentage,
      targetTenants: input.targetTenants,
      targetRoles: input.targetRoles,
      targetPlans: input.targetPlans,
      status: "draft",
      killSwitch: ensureBoolean(input.killSwitch, false),
      tags: ensureArray(input.tags, "tags", []),
      createdBy: actor.userId
    };

    this.store.getState().featureFlags.push(flag);
    this.store.audit(actor, "create", "FeatureFlag", flag.id, undefined, flag);
    this.store.save();

    return flag;
  }

  updateFeatureFlag(actor: RequestActor, flagId: string, input: {
    enabled?: boolean;
    rolloutPercentage?: number;
    targetTenants?: string[];
    targetRoles?: string[];
    targetPlans?: string[];
    status?: string;
  }): FeatureFlag {
    const flag = this.getFeatureFlag(actor, flagId);
    const before = clone(flag);

    if (input.enabled !== undefined) flag.enabled = ensureBoolean(input.enabled, false);
    if (input.rolloutPercentage !== undefined) flag.rolloutPercentage = ensureNumber(input.rolloutPercentage, "rolloutPercentage");
    if (input.targetTenants !== undefined) flag.targetTenants = input.targetTenants;
    if (input.targetRoles !== undefined) flag.targetRoles = input.targetRoles;
    if (input.targetPlans !== undefined) flag.targetPlans = input.targetPlans;
    if (input.status !== undefined) flag.status = input.status as any;

    flag.updatedAt = nowIso();

    this.store.audit(actor, "update", "FeatureFlag", flag.id, before, flag);
    this.store.save();

    return flag;
  }

  toggleFeatureFlag(actor: RequestActor, flagId: string): FeatureFlag {
    const flag = this.getFeatureFlag(actor, flagId);
    const before = clone(flag);

    if (flag.killSwitch) {
      flag.enabled = false;
      flag.status = "archived";
    } else {
      flag.enabled = !flag.enabled;
      flag.status = flag.enabled ? "active" : "inactive";
    }

    flag.updatedAt = nowIso();

    this.store.audit(actor, "toggle", "FeatureFlag", flag.id, before, flag);
    this.store.save();

    return flag;
  }

  isFeatureEnabled(actor: RequestActor, flagKey: string, tenantId?: string, userRole?: string): boolean {
    const flag = this.store.getState().featureFlags.find(f =>
      f.key === flagKey &&
      f.tenantId === actor.tenantId &&
      f.status === "active"
    );

    if (!flag || !flag.enabled) return false;

    if (flag.targetTenants?.length && tenantId && !flag.targetTenants.includes(tenantId)) {
      return false;
    }

    if (flag.targetRoles?.length && userRole && !flag.targetRoles.includes(userRole)) {
      return false;
    }

    return true;
  }

  listEnvironmentConfigs(actor: RequestActor, query?: {
    environment?: string;
    status?: string;
  }): EnvironmentConfig[] {
    let configs = this.store.getState().environmentConfigs;

    if (query?.environment) {
      configs = configs.filter(c => c.environment === query.environment);
    }
    if (query?.status) {
      configs = configs.filter(c => c.status === query.status);
    }

    return configs;
  }

  getEnvironmentConfig(actor: RequestActor, configId: string): EnvironmentConfig {
    const config = this.store.getState().environmentConfigs.find(c => c.id === configId);
    if (!config) notFound(`Environment config ${configId} not found`);
    return config;
  }

  createEnvironmentConfig(actor: RequestActor, input: {
    key: string;
    name: string;
    environment: string;
    values: Record<string, unknown>;
    tags?: string[];
  }): EnvironmentConfig {
    const now = nowIso();
    const config: EnvironmentConfig = {
      id: newId("envcfg"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key: ensureString(input.key, "key"),
      name: ensureString(input.name, "name"),
      environment: input.environment as any,
      values: ensureObject(input.values, "values"),
      status: "active",
      tags: ensureArray(input.tags, "tags", []),
      createdBy: actor.userId
    };

    this.store.getState().environmentConfigs.push(config);
    this.store.audit(actor, "create", "EnvironmentConfig", config.id, undefined, config);
    this.store.save();

    return config;
  }

  updateEnvironmentConfig(actor: RequestActor, configId: string, input: {
    values?: Record<string, unknown>;
    status?: string;
  }): EnvironmentConfig {
    const config = this.getEnvironmentConfig(actor, configId);
    const before = clone(config);

    if (input.values !== undefined) config.values = { ...config.values, ...input.values };
    if (input.status !== undefined) config.status = input.status as any;

    config.updatedAt = nowIso();
    config.updatedBy = actor.userId;

    this.store.audit(actor, "update", "EnvironmentConfig", config.id, before, config);
    this.store.save();

    return config;
  }

  listTenantSettings(actor: RequestActor, query?: {
    tenantId?: string;
    category?: string;
    status?: string;
  }): TenantSetting[] {
    let settings = this.store.getState().tenantSettings;

    if (query?.tenantId) {
      settings = settings.filter(s => s.tenantId === query.tenantId);
    }
    if (query?.category) {
      settings = settings.filter(s => s.category === query.category);
    }
    if (query?.status) {
      settings = settings.filter(s => s.status === query.status);
    }

    return settings;
  }

  getTenantSetting(actor: RequestActor, settingId: string): TenantSetting {
    const setting = this.store.getState().tenantSettings.find(s => s.id === settingId);
    if (!setting) notFound(`Tenant setting ${settingId} not found`);
    return setting;
  }

  createTenantSetting(actor: RequestActor, input: {
    tenantId: string;
    key: string;
    name: string;
    value: unknown;
    category?: string;
    tags?: string[];
  }): TenantSetting {
    const now = nowIso();
    const valueType = this.detectValueType(input.value);

    const setting: TenantSetting = {
      id: newId("tenantcfg"),
      tenantId: ensureString(input.tenantId, "tenantId"),
      createdAt: now,
      updatedAt: now,
      key: ensureString(input.key, "key"),
      name: ensureString(input.name, "name"),
      value: input.value,
      valueType,
      category: (input.category || "custom") as any,
      status: "active",
      inherited: false,
      overrideGlobal: true,
      tags: ensureArray(input.tags, "tags", []),
      createdBy: actor.userId
    };

    this.store.getState().tenantSettings.push(setting);
    this.store.audit(actor, "create", "TenantSetting", setting.id, undefined, setting);
    this.store.save();

    return setting;
  }

  updateTenantSetting(actor: RequestActor, settingId: string, input: {
    value?: unknown;
    status?: string;
  }): TenantSetting {
    const setting = this.getTenantSetting(actor, settingId);
    const before = clone(setting);

    if (input.value !== undefined) {
      setting.value = input.value;
      setting.valueType = this.detectValueType(input.value);
    }
    if (input.status !== undefined) setting.status = input.status as any;

    setting.updatedAt = nowIso();
    setting.updatedBy = actor.userId;

    this.store.audit(actor, "update", "TenantSetting", setting.id, before, setting);
    this.store.save();

    return setting;
  }

  listRuntimeOverrides(actor: RequestActor, query?: {
    environment?: string;
    moduleId?: string;
    status?: string;
  }): RuntimeOverride[] {
    let overrides = this.store.getState().runtimeOverrides;

    if (query?.environment) {
      overrides = overrides.filter(o => o.environment === query.environment);
    }
    if (query?.moduleId) {
      overrides = overrides.filter(o => o.moduleId === query.moduleId);
    }
    if (query?.status) {
      overrides = overrides.filter(o => o.status === query.status);
    }

    return overrides;
  }

  getRuntimeOverride(actor: RequestActor, overrideId: string): RuntimeOverride {
    const override = this.store.getState().runtimeOverrides.find(o => o.id === overrideId);
    if (!override) notFound(`Runtime override ${overrideId} not found`);
    return override;
  }

  createRuntimeOverride(actor: RequestActor, input: {
    key: string;
    name: string;
    description?: string;
    moduleId?: string;
    target: string;
    value: unknown;
    environment: string;
    tenantId?: string;
    priority?: number;
    expiresAt?: string;
  }): RuntimeOverride {
    const now = nowIso();
    const valueType = this.detectValueType(input.value);

    const override: RuntimeOverride = {
      id: newId("rtvoverride"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key: ensureString(input.key, "key"),
      name: ensureString(input.name, "name"),
      description: input.description,
      moduleId: input.moduleId,
      target: ensureString(input.target, "target"),
      value: input.value,
      valueType,
      environment: input.environment as any,
      priority: ensureNumber(input.priority, "priority", 0),
      status: "active",
      expiresAt: input.expiresAt,
      createdBy: actor.userId
    };

    this.store.getState().runtimeOverrides.push(override);
    this.store.audit(actor, "create", "RuntimeOverride", override.id, undefined, override);
    this.store.save();

    return override;
  }

  updateRuntimeOverride(actor: RequestActor, overrideId: string, input: {
    value?: unknown;
    priority?: number;
    status?: string;
    expiresAt?: string;
  }): RuntimeOverride {
    const override = this.getRuntimeOverride(actor, overrideId);
    const before = clone(override);

    if (input.value !== undefined) {
      override.value = input.value;
      override.valueType = this.detectValueType(input.value);
    }
    if (input.priority !== undefined) override.priority = input.priority;
    if (input.status !== undefined) override.status = input.status as any;
    if (input.expiresAt !== undefined) override.expiresAt = input.expiresAt;

    override.updatedAt = nowIso();

    this.store.audit(actor, "update", "RuntimeOverride", override.id, before, override);
    this.store.save();

    return override;
  }

  rollbackConfig(actor: RequestActor, configId: string, toVersion: number): Config {
    const config = this.getConfig(actor, configId);
    const state = this.store.getState();

    const targetVersion = state.configVersions.find(v =>
      v.configId === configId && v.version === toVersion
    );

    if (!targetVersion) notFound(`Version ${toVersion} not found for config ${configId}`);

    const before = clone(config);

    config.value = targetVersion.value;
    config.version = targetVersion.version + 1;
    config.updatedAt = nowIso();
    config.updatedBy = actor.userId;

    const rollback: ConfigRollback = {
      id: newId("rollback"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      configId,
      fromVersion: before.version,
      toVersion: targetVersion.version,
      reason: targetVersion.changeReason || "Manual rollback",
      performedBy: actor.userId,
      status: "success"
    };

    state.configRollbacks.push(rollback);
    this.store.audit(actor, "rollback", "Config", configId, before, config);
    this.store.save();

    return config;
  }

  private detectValueType(value: unknown): "string" | "number" | "boolean" | "object" | "array" {
    if (value === null) return "string";
    if (Array.isArray(value)) return "array";
    return typeof value as any;
  }
}
