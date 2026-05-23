import {
  DeploymentStatus,
  EntityStatus,
  EnvironmentType,
  HealthCheck,
  HealthStatus,
  IntegrationStatus,
  OSService,
  PlatformDeployment,
  PlatformEnvironment,
  PlatformFeatureFlag,
  PlatformIntegration,
  PlatformOverview,
  PlatformProfile,
  PlatformRelease,
  ReleaseStatus,
  RequestActor
} from "../core/domain";
import { promises as fs } from "fs";
import path from "path";
import { badRequest, conflict, notFound } from "../core/errors";
import { newId, nowIso } from "../core/id";
import { asIso, clone, ensureBoolean, ensureNumber, ensureObject, ensureString, normalizeStringArray, optionalString, parseNumberQuery, pickQuery } from "../core/utils";
import { DataStore } from "../core/datastore";
import { EventBus } from "../core/event-bus";

export class PlatformService {
  constructor(private readonly store: DataStore, private readonly events: EventBus) {}

  async ingestManifests(actor: RequestActor, input?: { rootDir?: string; overwrite?: boolean }) {
    const rootDir = ensureString(input?.rootDir ?? process.env.OS_REPO_ROOT ?? path.resolve(process.cwd(), ".."), "rootDir");
    const overwrite = Boolean(input?.overwrite ?? true);
    const entries = await fs.readdir(rootDir, { withFileTypes: true });

    let scanned = 0;
    let created = 0;
    let updated = 0;

    const now = nowIso();
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const osDir = path.join(rootDir, entry.name);
      const manifestPath = path.join(osDir, "manifest.json");
      try {
        const raw = await fs.readFile(manifestPath, "utf8");
        const manifest = JSON.parse(raw);
        if (!manifest?.id || !manifest?.name) continue;
        scanned += 1;

        const key = normalizeKey(manifest.id);
        const existing = this.store.getState().services.find((item) => item.tenantId === actor.tenantId && item.status !== "archived" && item.key === key);
        const next: Partial<OSService> = {
          key,
          name: ensureString(manifest.name, "name"),
          description: optionalString(manifest.description),
          category: ensureString(manifest.category ?? "os", "category"),
          ownerTeam: ensureString(manifest.ownership?.domainOwner ?? manifest.ownership?.owner ?? "APPNEURAL", "ownerTeam"),
          baseUrl: optionalString(manifest.runtime?.localBaseUrl ?? manifest.runtime?.baseUrl),
          version: ensureString(manifest.version ?? "1.0.0", "version"),
          status: this.ensureEntityStatus(manifest.status ?? "active"),
          health: existing?.health ?? "unknown",
          dependencies: normalizeStringArray((manifest.dependencies?.required ?? []).map((dep) => normalizeKey(toServiceKey(dep))), "dependencies"),
          capabilities: normalizeStringArray(uniqStrings([...(manifest.permissions ?? []), ...(manifest.commands ?? [])]), "capabilities"),
          tags: normalizeStringArray(uniqStrings([...(manifest.modes ?? []), manifest.dataClassification]), "tags"),
          metadata: ensureObject(
            {
              package: manifest.package,
              api: manifest.api,
              runtime: manifest.runtime,
              relatedSystems: manifest.relatedSystems,
              entrypoints: manifest.entrypoints
            },
            "metadata"
          )
        };

        if (!existing) {
          const service: OSService = {
            id: newId("svc"),
            tenantId: actor.tenantId,
            createdAt: now,
            updatedAt: now,
            key,
            name: ensureString(next.name, "name"),
            description: optionalString(next.description),
            category: ensureString(next.category, "category"),
            ownerTeam: ensureString(next.ownerTeam, "ownerTeam"),
            baseUrl: optionalString(next.baseUrl),
            version: ensureString(next.version, "version"),
            status: this.ensureEntityStatus(next.status),
            health: this.ensureHealth(next.health),
            dependencies: normalizeStringArray(next.dependencies, "dependencies"),
            capabilities: normalizeStringArray(next.capabilities, "capabilities"),
            tags: normalizeStringArray(next.tags, "tags"),
            metadata: ensureObject(next.metadata, "metadata"),
            updatedBy: actor.userId
          };
          this.store.getState().services.unshift(service);
          this.store.audit(actor, "platform.service.ingest.create", "service", service.id, undefined, service);
          this.events.publish(actor, "platform.service.ingested", { serviceKey: service.key, mode: "create" });
          created += 1;
          continue;
        }

        if (!overwrite) continue;
        const before = clone(existing);
        if (next.name !== undefined) existing.name = ensureString(next.name, "name");
        if (next.description !== undefined) existing.description = optionalString(next.description);
        if (next.category !== undefined) existing.category = ensureString(next.category, "category");
        if (next.ownerTeam !== undefined) existing.ownerTeam = ensureString(next.ownerTeam, "ownerTeam");
        if (next.baseUrl !== undefined) existing.baseUrl = optionalString(next.baseUrl);
        if (next.version !== undefined) existing.version = ensureString(next.version, "version");
        if (next.status !== undefined) existing.status = this.ensureEntityStatus(next.status);
        if (next.dependencies !== undefined) existing.dependencies = normalizeStringArray(next.dependencies, "dependencies");
        if (next.capabilities !== undefined) existing.capabilities = normalizeStringArray(next.capabilities, "capabilities");
        if (next.tags !== undefined) existing.tags = normalizeStringArray(next.tags, "tags");
        if (next.metadata !== undefined) existing.metadata = ensureObject(next.metadata, "metadata");
        existing.updatedAt = nowIso();
        existing.updatedBy = actor.userId;
        this.store.audit(actor, "platform.service.ingest.update", "service", existing.id, before, existing);
        this.events.publish(actor, "platform.service.ingested", { serviceKey: existing.key, mode: "update" });
        updated += 1;
      } catch {}
    }

    this.store.save();
    return clone({ rootDir, scanned, created, updated, total: created + updated });
  }

  catalog(actor: RequestActor) {
    return clone(
      this.store.getState().services
        .filter((item) => item.tenantId === actor.tenantId && item.status !== "archived")
        .map((item) => ({
          key: item.key,
          name: item.name,
          description: item.description,
          baseUrl: item.baseUrl,
          version: item.version,
          status: item.status,
          health: item.health,
          dependencies: item.dependencies,
          api: (item.metadata as any)?.api ?? undefined,
          runtime: (item.metadata as any)?.runtime ?? undefined,
          package: (item.metadata as any)?.package ?? undefined
        }))
    );
  }

  overview(actor: RequestActor): PlatformOverview {
    const state = this.store.getState();
    const tenantId = actor.tenantId;
    return clone({
      counts: {
        profiles: state.profiles.filter((item) => item.tenantId === tenantId && item.status !== "archived").length,
        services: state.services.filter((item) => item.tenantId === tenantId && item.status !== "archived").length,
        activeServices: state.services.filter((item) => item.tenantId === tenantId && item.status === "active").length,
        environments: state.environments.filter((item) => item.tenantId === tenantId && item.status !== "archived").length,
        deployments: state.deployments.filter((item) => item.tenantId === tenantId).length,
        integrations: state.integrations.filter((item) => item.tenantId === tenantId && item.status !== "archived").length,
        activeIntegrations: state.integrations.filter((item) => item.tenantId === tenantId && item.status === "active").length,
        enabledFlags: state.featureFlags.filter((item) => item.tenantId === tenantId && item.enabled && item.status !== "archived").length,
        releases: state.releases.filter((item) => item.tenantId === tenantId).length,
        unhealthyServices: state.services.filter((item) => item.tenantId === tenantId && ["degraded", "down"].includes(item.health)).length
      },
      profile: state.profiles.find((item) => item.tenantId === tenantId && item.status !== "archived"),
      recentDeployments: state.deployments.filter((item) => item.tenantId === tenantId).slice(0, 10),
      unhealthyServices: state.services.filter((item) => item.tenantId === tenantId && ["degraded", "down"].includes(item.health)).slice(0, 10),
      recentHealthChecks: state.healthChecks.filter((item) => item.tenantId === tenantId).slice(0, 10),
      recentEvents: state.events.filter((item) => item.tenantId === tenantId).slice(0, 10)
    });
  }

  getProfile(actor: RequestActor): PlatformProfile {
    const profile = this.store.getState().profiles.find((item) => item.tenantId === actor.tenantId && item.status !== "archived");
    if (!profile) notFound("Platform profile not found");
    return clone(profile);
  }

  updateProfile(actor: RequestActor, input: Partial<PlatformProfile>): PlatformProfile {
    const state = this.store.getState();
    let profile = state.profiles.find((item) => item.tenantId === actor.tenantId && item.status !== "archived");
    const now = nowIso();
    if (!profile) {
      profile = {
        id: newId("platform"),
        tenantId: actor.tenantId,
        createdAt: now,
        updatedAt: now,
        name: ensureString(input.name, "name"),
        slug: normalizeKey(input.slug ?? input.name),
        description: optionalString(input.description),
        region: ensureString(input.region ?? "central-india", "region"),
        primaryDomain: optionalString(input.primaryDomain),
        ownerTeam: ensureString(input.ownerTeam ?? "Platform", "ownerTeam"),
        status: this.ensureEntityStatus(input.status ?? "active"),
        metadata: ensureObject(input.metadata, "metadata"),
        updatedBy: actor.userId
      };
      state.profiles.unshift(profile);
      this.store.save();
      this.store.audit(actor, "platform.profile.create", "profile", profile.id, undefined, profile);
      this.events.publish(actor, "platform.profile.created", { profileId: profile.id, slug: profile.slug });
      return clone(profile);
    }

    const before = clone(profile);
    if (input.name !== undefined) profile.name = ensureString(input.name, "name");
    if (input.slug !== undefined) profile.slug = normalizeKey(input.slug);
    if (input.description !== undefined) profile.description = optionalString(input.description);
    if (input.region !== undefined) profile.region = ensureString(input.region, "region");
    if (input.primaryDomain !== undefined) profile.primaryDomain = optionalString(input.primaryDomain);
    if (input.ownerTeam !== undefined) profile.ownerTeam = ensureString(input.ownerTeam, "ownerTeam");
    if (input.status !== undefined) profile.status = this.ensureEntityStatus(input.status);
    if (input.metadata !== undefined) profile.metadata = ensureObject(input.metadata, "metadata");
    profile.updatedAt = now;
    profile.updatedBy = actor.userId;
    this.store.save();
    this.store.audit(actor, "platform.profile.update", "profile", profile.id, before, profile);
    this.events.publish(actor, "platform.profile.updated", { profileId: profile.id, slug: profile.slug });
    return clone(profile);
  }

  listServices(actor: RequestActor, query?: URLSearchParams): OSService[] {
    const search = query ? pickQuery(query, "search") : undefined;
    const category = query ? pickQuery(query, "category") : undefined;
    const limit = query ? parseNumberQuery(query, "limit", 100) : 100;
    return clone(this.store.getState().services.filter((service) => {
      if (service.tenantId !== actor.tenantId || service.status === "archived") return false;
      if (category && service.category !== category) return false;
      if (search) {
        const haystack = [service.key, service.name, service.description, service.category, service.ownerTeam, service.capabilities.join(" ")].join(" ").toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    }).slice(0, limit));
  }

  createService(actor: RequestActor, input: Partial<OSService>): OSService {
    const state = this.store.getState();
    const key = normalizeKey(input.key ?? input.name);
    this.ensureUnique(state.services, actor.tenantId, key, "Service");
    const now = nowIso();
    const service: OSService = {
      id: newId("svc"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key,
      name: ensureString(input.name, "name"),
      description: optionalString(input.description),
      category: ensureString(input.category ?? "core", "category"),
      ownerTeam: ensureString(input.ownerTeam ?? "Platform", "ownerTeam"),
      baseUrl: optionalString(input.baseUrl),
      version: ensureString(input.version ?? "1.0.0", "version"),
      status: this.ensureEntityStatus(input.status ?? "active"),
      health: this.ensureHealth(input.health ?? "unknown"),
      dependencies: normalizeStringArray(input.dependencies, "dependencies"),
      capabilities: normalizeStringArray(input.capabilities, "capabilities"),
      tags: normalizeStringArray(input.tags, "tags"),
      metadata: ensureObject(input.metadata, "metadata"),
      updatedBy: actor.userId
    };
    state.services.unshift(service);
    this.store.save();
    this.store.audit(actor, "platform.service.create", "service", service.id, undefined, service);
    this.events.publish(actor, "platform.service.created", { serviceKey: service.key, serviceId: service.id });
    return clone(service);
  }

  updateService(actor: RequestActor, key: string, input: Partial<OSService>): OSService {
    const service = this.findService(actor, key);
    const before = clone(service);
    if (input.name !== undefined) service.name = ensureString(input.name, "name");
    if (input.description !== undefined) service.description = optionalString(input.description);
    if (input.category !== undefined) service.category = ensureString(input.category, "category");
    if (input.ownerTeam !== undefined) service.ownerTeam = ensureString(input.ownerTeam, "ownerTeam");
    if (input.baseUrl !== undefined) service.baseUrl = optionalString(input.baseUrl);
    if (input.version !== undefined) service.version = ensureString(input.version, "version");
    if (input.status !== undefined) service.status = this.ensureEntityStatus(input.status);
    if (input.health !== undefined) service.health = this.ensureHealth(input.health);
    if (input.dependencies !== undefined) service.dependencies = normalizeStringArray(input.dependencies, "dependencies");
    if (input.capabilities !== undefined) service.capabilities = normalizeStringArray(input.capabilities, "capabilities");
    if (input.tags !== undefined) service.tags = normalizeStringArray(input.tags, "tags");
    if (input.metadata !== undefined) service.metadata = ensureObject(input.metadata, "metadata");
    service.updatedAt = nowIso();
    service.updatedBy = actor.userId;
    this.store.save();
    this.store.audit(actor, "platform.service.update", "service", service.id, before, service);
    this.events.publish(actor, "platform.service.updated", { serviceKey: service.key, health: service.health });
    return clone(service);
  }

  archiveService(actor: RequestActor, key: string): OSService {
    return this.updateService(actor, key, { status: "archived" });
  }

  createEnvironment(actor: RequestActor, input: Partial<PlatformEnvironment>): PlatformEnvironment {
    const state = this.store.getState();
    const key = normalizeKey(input.key ?? input.name);
    this.ensureUnique(state.environments, actor.tenantId, key, "Environment");
    const now = nowIso();
    const environment: PlatformEnvironment = {
      id: newId("env"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key,
      name: ensureString(input.name, "name"),
      type: this.ensureEnvironmentType(input.type ?? "dev"),
      region: ensureString(input.region ?? "central-india", "region"),
      domain: optionalString(input.domain),
      status: this.ensureEntityStatus(input.status ?? "active"),
      variables: ensureObject(input.variables, "variables"),
      updatedBy: actor.userId
    };
    state.environments.unshift(environment);
    this.store.save();
    this.store.audit(actor, "platform.environment.create", "environment", environment.id, undefined, environment);
    this.events.publish(actor, "platform.environment.created", { environmentKey: environment.key });
    return clone(environment);
  }

  listEnvironments(actor: RequestActor): PlatformEnvironment[] {
    return clone(this.store.getState().environments.filter((item) => item.tenantId === actor.tenantId && item.status !== "archived"));
  }

  createDeployment(actor: RequestActor, input: Partial<PlatformDeployment>): PlatformDeployment {
    const serviceKey = ensureString(input.serviceKey, "serviceKey");
    const environmentKey = ensureString(input.environmentKey, "environmentKey");
    this.findService(actor, serviceKey);
    this.findEnvironment(actor, environmentKey);
    const now = nowIso();
    const deployment: PlatformDeployment = {
      id: newId("dep"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      serviceKey,
      environmentKey,
      version: ensureString(input.version, "version"),
      status: this.ensureDeploymentStatus(input.status ?? "planned"),
      commitSha: optionalString(input.commitSha),
      artifactUrl: optionalString(input.artifactUrl),
      startedAt: asIso(input.startedAt, "startedAt"),
      completedAt: asIso(input.completedAt, "completedAt"),
      deployedBy: actor.userId,
      notes: optionalString(input.notes)
    };
    this.store.getState().deployments.unshift(deployment);
    this.store.save();
    this.store.audit(actor, "platform.deployment.create", "deployment", deployment.id, undefined, deployment);
    this.events.publish(actor, "platform.deployment.created", { deploymentId: deployment.id, serviceKey, environmentKey });
    return clone(deployment);
  }

  updateDeploymentStatus(actor: RequestActor, id: string, input: Partial<PlatformDeployment>): PlatformDeployment {
    const deployment = this.findDeployment(actor, id);
    const before = clone(deployment);
    const now = nowIso();
    deployment.status = this.ensureDeploymentStatus(input.status);
    deployment.updatedAt = now;
    if (deployment.status === "deploying" && !deployment.startedAt) deployment.startedAt = now;
    if (["succeeded", "failed", "rolled_back"].includes(deployment.status)) deployment.completedAt = now;
    if (input.notes !== undefined) deployment.notes = optionalString(input.notes);
    this.store.save();
    this.store.audit(actor, "platform.deployment.update", "deployment", deployment.id, before, deployment);
    this.events.publish(actor, `platform.deployment.${deployment.status}`, { deploymentId: deployment.id, serviceKey: deployment.serviceKey });
    return clone(deployment);
  }

  listDeployments(actor: RequestActor): PlatformDeployment[] {
    return clone(this.store.getState().deployments.filter((item) => item.tenantId === actor.tenantId));
  }

  createIntegration(actor: RequestActor, input: Partial<PlatformIntegration>): PlatformIntegration {
    const state = this.store.getState();
    const key = normalizeKey(input.key ?? input.name);
    this.ensureUnique(state.integrations, actor.tenantId, key, "Integration");
    const sourceServiceKey = ensureString(input.sourceServiceKey, "sourceServiceKey");
    const targetServiceKey = ensureString(input.targetServiceKey, "targetServiceKey");
    this.findService(actor, sourceServiceKey);
    this.findService(actor, targetServiceKey);
    const now = nowIso();
    const integration: PlatformIntegration = {
      id: newId("int"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key,
      name: ensureString(input.name, "name"),
      sourceServiceKey,
      targetServiceKey,
      eventTypes: normalizeStringArray(input.eventTypes, "eventTypes"),
      status: this.ensureIntegrationStatus(input.status ?? "active"),
      contractVersion: ensureString(input.contractVersion ?? "1.0.0", "contractVersion"),
      metadata: ensureObject(input.metadata, "metadata"),
      updatedBy: actor.userId
    };
    state.integrations.unshift(integration);
    this.store.save();
    this.store.audit(actor, "platform.integration.create", "integration", integration.id, undefined, integration);
    this.events.publish(actor, "platform.integration.created", { integrationKey: integration.key });
    return clone(integration);
  }

  listIntegrations(actor: RequestActor): PlatformIntegration[] {
    return clone(this.store.getState().integrations.filter((item) => item.tenantId === actor.tenantId && item.status !== "archived"));
  }

  createFeatureFlag(actor: RequestActor, input: Partial<PlatformFeatureFlag>): PlatformFeatureFlag {
    const state = this.store.getState();
    const key = normalizeKey(input.key ?? input.name);
    this.ensureUnique(state.featureFlags, actor.tenantId, key, "Feature flag");
    const now = nowIso();
    const flag: PlatformFeatureFlag = {
      id: newId("flag"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key,
      name: ensureString(input.name, "name"),
      description: optionalString(input.description),
      enabled: ensureBoolean(input.enabled, "enabled", false),
      rolloutPercentage: Math.max(0, Math.min(100, ensureNumber(input.rolloutPercentage, "rolloutPercentage", 0))),
      environmentKeys: normalizeStringArray(input.environmentKeys, "environmentKeys"),
      ownerTeam: ensureString(input.ownerTeam ?? "Platform", "ownerTeam"),
      status: this.ensureEntityStatus(input.status ?? "active"),
      updatedBy: actor.userId
    };
    state.featureFlags.unshift(flag);
    this.store.save();
    this.store.audit(actor, "platform.flag.create", "feature_flag", flag.id, undefined, flag);
    this.events.publish(actor, "platform.flag.created", { flagKey: flag.key });
    return clone(flag);
  }

  toggleFeatureFlag(actor: RequestActor, key: string, enabled: unknown): PlatformFeatureFlag {
    const flag = this.findFeatureFlag(actor, key);
    const before = clone(flag);
    flag.enabled = ensureBoolean(enabled, "enabled");
    flag.updatedAt = nowIso();
    flag.updatedBy = actor.userId;
    this.store.save();
    this.store.audit(actor, "platform.flag.toggle", "feature_flag", flag.id, before, flag);
    this.events.publish(actor, "platform.flag.toggled", { flagKey: flag.key, enabled: flag.enabled });
    return clone(flag);
  }

  listFeatureFlags(actor: RequestActor): PlatformFeatureFlag[] {
    return clone(this.store.getState().featureFlags.filter((item) => item.tenantId === actor.tenantId && item.status !== "archived"));
  }

  createRelease(actor: RequestActor, input: Partial<PlatformRelease>): PlatformRelease {
    const state = this.store.getState();
    const key = normalizeKey(input.key ?? input.title);
    this.ensureUnique(state.releases, actor.tenantId, key, "Release");
    const serviceKeys = normalizeStringArray(input.serviceKeys, "serviceKeys");
    serviceKeys.forEach((serviceKey) => this.findService(actor, serviceKey));
    const environmentKey = ensureString(input.environmentKey, "environmentKey");
    this.findEnvironment(actor, environmentKey);
    const now = nowIso();
    const release: PlatformRelease = {
      id: newId("rel"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key,
      title: ensureString(input.title, "title"),
      version: ensureString(input.version, "version"),
      status: this.ensureReleaseStatus(input.status ?? "draft"),
      serviceKeys,
      environmentKey,
      scheduledAt: asIso(input.scheduledAt, "scheduledAt"),
      releasedAt: asIso(input.releasedAt, "releasedAt"),
      notes: optionalString(input.notes),
      createdBy: actor.userId,
      updatedBy: actor.userId
    };
    state.releases.unshift(release);
    this.store.save();
    this.store.audit(actor, "platform.release.create", "release", release.id, undefined, release);
    this.events.publish(actor, "platform.release.created", { releaseKey: release.key, version: release.version });
    return clone(release);
  }

  updateReleaseStatus(actor: RequestActor, key: string, input: Partial<PlatformRelease>): PlatformRelease {
    const release = this.findRelease(actor, key);
    const before = clone(release);
    release.status = this.ensureReleaseStatus(input.status);
    release.updatedAt = nowIso();
    release.updatedBy = actor.userId;
    if (release.status === "released") release.releasedAt = release.updatedAt;
    if (input.notes !== undefined) release.notes = optionalString(input.notes);
    this.store.save();
    this.store.audit(actor, "platform.release.update", "release", release.id, before, release);
    this.events.publish(actor, `platform.release.${release.status}`, { releaseKey: release.key, version: release.version });
    return clone(release);
  }

  listReleases(actor: RequestActor): PlatformRelease[] {
    return clone(this.store.getState().releases.filter((item) => item.tenantId === actor.tenantId));
  }

  recordHealthCheck(actor: RequestActor, input: Partial<HealthCheck>): HealthCheck {
    const serviceKey = ensureString(input.serviceKey, "serviceKey");
    const environmentKey = ensureString(input.environmentKey, "environmentKey");
    const service = this.findService(actor, serviceKey);
    this.findEnvironment(actor, environmentKey);
    const now = nowIso();
    const health: HealthCheck = {
      id: newId("health"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      serviceKey,
      environmentKey,
      status: this.ensureHealth(input.status ?? "unknown"),
      latencyMs: input.latencyMs === undefined ? undefined : ensureNumber(input.latencyMs, "latencyMs"),
      message: optionalString(input.message),
      checkedAt: asIso(input.checkedAt, "checkedAt") ?? now
    };
    service.health = health.status;
    service.updatedAt = now;
    this.store.getState().healthChecks.unshift(health);
    this.store.save();
    this.store.audit(actor, "platform.health.record", "health_check", health.id, undefined, health);
    this.events.publish(actor, "platform.health.recorded", { serviceKey, environmentKey, status: health.status });
    return clone(health);
  }

  listHealthChecks(actor: RequestActor): HealthCheck[] {
    return clone(this.store.getState().healthChecks.filter((item) => item.tenantId === actor.tenantId));
  }

  listEvents(actor: RequestActor) {
    return clone(this.store.getState().events.filter((item) => item.tenantId === actor.tenantId));
  }

  auditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((item) => item.tenantId === actor.tenantId));
  }

  private findService(actor: RequestActor, key: string): OSService {
    const service = this.store.getState().services.find((item) => item.tenantId === actor.tenantId && item.status !== "archived" && (item.key === key || item.id === key));
    if (!service) notFound("Service not found");
    return service;
  }

  private findEnvironment(actor: RequestActor, key: string): PlatformEnvironment {
    const environment = this.store.getState().environments.find((item) => item.tenantId === actor.tenantId && item.status !== "archived" && (item.key === key || item.id === key));
    if (!environment) notFound("Environment not found");
    return environment;
  }

  private findDeployment(actor: RequestActor, id: string): PlatformDeployment {
    const deployment = this.store.getState().deployments.find((item) => item.tenantId === actor.tenantId && item.id === id);
    if (!deployment) notFound("Deployment not found");
    return deployment;
  }

  private findFeatureFlag(actor: RequestActor, key: string): PlatformFeatureFlag {
    const flag = this.store.getState().featureFlags.find((item) => item.tenantId === actor.tenantId && item.status !== "archived" && (item.key === key || item.id === key));
    if (!flag) notFound("Feature flag not found");
    return flag;
  }

  private findRelease(actor: RequestActor, key: string): PlatformRelease {
    const release = this.store.getState().releases.find((item) => item.tenantId === actor.tenantId && (item.key === key || item.id === key));
    if (!release) notFound("Release not found");
    return release;
  }

  private ensureUnique(items: Array<{ tenantId: string; key: string }>, tenantId: string, key: string, label: string): void {
    if (items.some((item) => item.tenantId === tenantId && item.key === key)) conflict(`${label} key already exists`);
  }

  private ensureEntityStatus(value: unknown): EntityStatus {
    const status = String(value) as EntityStatus;
    if (!["planned", "active", "maintenance", "deprecated", "archived"].includes(status)) badRequest("Invalid status");
    return status;
  }

  private ensureEnvironmentType(value: unknown): EnvironmentType {
    const type = String(value) as EnvironmentType;
    if (!["dev", "test", "staging", "prod"].includes(type)) badRequest("Invalid environment type");
    return type;
  }

  private ensureHealth(value: unknown): HealthStatus {
    const status = String(value) as HealthStatus;
    if (!["healthy", "degraded", "down", "unknown"].includes(status)) badRequest("Invalid health status");
    return status;
  }

  private ensureDeploymentStatus(value: unknown): DeploymentStatus {
    const status = String(value) as DeploymentStatus;
    if (!["planned", "deploying", "succeeded", "failed", "rolled_back"].includes(status)) badRequest("Invalid deployment status");
    return status;
  }

  private ensureIntegrationStatus(value: unknown): IntegrationStatus {
    const status = String(value) as IntegrationStatus;
    if (!["draft", "active", "paused", "error", "archived"].includes(status)) badRequest("Invalid integration status");
    return status;
  }

  private ensureReleaseStatus(value: unknown): ReleaseStatus {
    const status = String(value) as ReleaseStatus;
    if (!["draft", "scheduled", "released", "rolled_back", "cancelled"].includes(status)) badRequest("Invalid release status");
    return status;
  }
}

function normalizeKey(value: unknown): string {
  return ensureString(value, "key").toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/-+/g, "-");
}

function toServiceKey(value: unknown): string {
  const raw = ensureString(value, "dependency");
  if (raw.startsWith("@appneurox/")) return raw.slice("@appneurox/".length);
  return raw;
}

function uniqStrings(items: unknown[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (typeof item !== "string") continue;
    const next = item.trim();
    if (!next) continue;
    if (seen.has(next)) continue;
    seen.add(next);
    out.push(next);
  }
  return out;
}
