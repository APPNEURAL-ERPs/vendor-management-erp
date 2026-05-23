import { DataStore } from "./core/datastore";
import {
  Container,
  Database,
  Deployment,
  DeploymentRun,
  Environment,
  InfrastructureEvent,
  InfrastructureOverview,
  Network,
  RequestActor,
  Server
} from "./types";
import { clone, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, optionalObject, pickQuery } from "./core/utils";
import { newId, nowIso } from "./core/id";

export class InfrastructureService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "InfrastructureOS service is ready";
  }

  overview(actor: RequestActor): InfrastructureOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    const deployments = state.deployments.filter((item) => item.tenantId === tenant);
    const incidents = state.incidents.filter((item) => item.tenantId === tenant);
    const costRecords = state.costRecords.filter((item) => item.tenantId === tenant);

    const totalCost = costRecords.reduce((sum, record) => sum + record.amount, 0);

    return {
      environments: {
        total: state.environments.filter((item) => item.tenantId === tenant).length,
        active: state.environments.filter((item) => item.tenantId === tenant && item.status === "active").length
      },
      servers: {
        total: state.servers.filter((item) => item.tenantId === tenant).length,
        active: state.servers.filter((item) => item.tenantId === tenant && item.status === "active").length
      },
      databases: {
        total: state.databases.filter((item) => item.tenantId === tenant).length,
        active: state.databases.filter((item) => item.tenantId === tenant && item.status === "active").length
      },
      networks: {
        total: state.networks.filter((item) => item.tenantId === tenant).length,
        active: state.networks.filter((item) => item.tenantId === tenant && item.status === "active").length
      },
      containers: {
        total: state.containers.filter((item) => item.tenantId === tenant).length,
        active: state.containers.filter((item) => item.tenantId === tenant && item.status === "active").length
      },
      deployments: {
        total: deployments.length,
        active: deployments.filter((item) => ["pending", "running"].includes(item.status)).length,
        completed: deployments.filter((item) => item.status === "completed").length,
        failed: deployments.filter((item) => item.status === "failed").length
      },
      incidents: {
        open: incidents.filter((item) => ["open", "investigating"].includes(item.status)).length,
        resolved: incidents.filter((item) => ["resolved", "closed"].includes(item.status)).length
      },
      cost: {
        total: totalCost,
        currency: "USD",
        period: "monthly"
      }
    };
  }

  listEnvironments(actor: RequestActor): Environment[] {
    return clone(this.store.getState().environments.filter((item) => item.tenantId === actor.tenantId));
  }

  createEnvironment(input: unknown, actor: RequestActor): Environment {
    const body = ensureObject(input, "environment");
    const state = this.store.getState();
    const key = ensureString(body.key, "environment.key");
    if (state.environments.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      throw new Error(`Environment key '${key}' already exists`);
    }
    const environment: Environment = {
      id: newId("env"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "environment.name"),
      key,
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "development") as Environment["type"],
      status: String(body.status ?? "active") as Environment["status"],
      variables: optionalObject(body.variables),
      serverIds: ensureArray(body.serverIds, "environment.serverIds"),
      databaseIds: ensureArray(body.databaseIds, "environment.databaseIds"),
      networkIds: ensureArray(body.networkIds, "environment.networkIds"),
      containerIds: ensureArray(body.containerIds, "environment.containerIds"),
      metadata: optionalObject(body.metadata)
    };
    state.environments.push(environment);
    this.store.save();
    this.store.audit(actor, "environment.create", "environment", environment.id, undefined, environment);
    return clone(environment);
  }

  listServers(actor: RequestActor): Server[] {
    return clone(this.store.getState().servers.filter((item) => item.tenantId === actor.tenantId));
  }

  createServer(input: unknown, actor: RequestActor): Server {
    const body = ensureObject(input, "server");
    const state = this.store.getState();
    const server: Server = {
      id: newId("server"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "server.name"),
      hostname: ensureString(body.hostname, "server.hostname"),
      ipAddress: ensureString(body.ipAddress, "server.ipAddress"),
      port: body.port ? ensureNumber(body.port, "server.port") : undefined,
      provider: String(body.provider ?? "self-hosted") as Server["provider"],
      region: body.region ? String(body.region) : undefined,
      instanceType: body.instanceType ? String(body.instanceType) : undefined,
      status: String(body.status ?? "active") as Server["status"],
      environmentIds: ensureArray(body.environmentIds, "server.environmentIds"),
      metadata: optionalObject(body.metadata)
    };
    state.servers.push(server);
    this.store.save();
    this.store.audit(actor, "server.create", "server", server.id, undefined, server);
    return clone(server);
  }

  listDatabases(actor: RequestActor): Database[] {
    return clone(this.store.getState().databases.filter((item) => item.tenantId === actor.tenantId));
  }

  createDatabase(input: unknown, actor: RequestActor): Database {
    const body = ensureObject(input, "database");
    const state = this.store.getState();
    const database: Database = {
      id: newId("db"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "database.name"),
      type: String(body.type ?? "postgresql") as Database["type"],
      status: String(body.status ?? "active") as Database["status"],
      provider: String(body.provider ?? "self-hosted") as Database["provider"],
      connectionString: body.connectionString ? String(body.connectionString) : undefined,
      host: body.host ? String(body.host) : undefined,
      port: body.port ? ensureNumber(body.port, "database.port") : undefined,
      databaseName: body.databaseName ? String(body.databaseName) : undefined,
      version: body.version ? String(body.version) : undefined,
      maxConnections: body.maxConnections ? ensureNumber(body.maxConnections, "database.maxConnections") : undefined,
      environmentIds: ensureArray(body.environmentIds, "database.environmentIds"),
      metadata: optionalObject(body.metadata)
    };
    state.databases.push(database);
    this.store.save();
    this.store.audit(actor, "database.create", "database", database.id, undefined, database);
    return clone(database);
  }

  listNetworks(actor: RequestActor): Network[] {
    return clone(this.store.getState().networks.filter((item) => item.tenantId === actor.tenantId));
  }

  createNetwork(input: unknown, actor: RequestActor): Network {
    const body = ensureObject(input, "network");
    const state = this.store.getState();
    const network: Network = {
      id: newId("net"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "network.name"),
      type: String(body.type ?? "network") as Network["type"],
      status: String(body.status ?? "active") as Network["status"],
      provider: String(body.provider ?? "self-hosted") as Network["provider"],
      cidr: body.cidr ? String(body.cidr) : undefined,
      region: body.region ? String(body.region) : undefined,
      environmentIds: ensureArray(body.environmentIds, "network.environmentIds"),
      metadata: optionalObject(body.metadata)
    };
    state.networks.push(network);
    this.store.save();
    this.store.audit(actor, "network.create", "network", network.id, undefined, network);
    return clone(network);
  }

  listContainers(actor: RequestActor): Container[] {
    return clone(this.store.getState().containers.filter((item) => item.tenantId === actor.tenantId));
  }

  createContainer(input: unknown, actor: RequestActor): Container {
    const body = ensureObject(input, "container");
    const state = this.store.getState();
    const container: Container = {
      id: newId("container"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "container.name"),
      image: ensureString(body.image, "container.image"),
      tag: String(body.tag ?? "latest"),
      status: String(body.status ?? "active") as Container["status"],
      provider: String(body.provider ?? "docker") as Container["provider"],
      replicas: ensureNumber(body.replicas, "container.replicas", 1),
      port: body.port ? ensureNumber(body.port, "container.port") : undefined,
      environmentIds: ensureArray(body.environmentIds, "container.environmentIds"),
      environment: optionalObject(body.environment),
      metadata: optionalObject(body.metadata)
    };
    state.containers.push(container);
    this.store.save();
    this.store.audit(actor, "container.create", "container", container.id, undefined, container);
    return clone(container);
  }

  listDeployments(actor: RequestActor): Deployment[] {
    return clone(this.store.getState().deployments.filter((item) => item.tenantId === actor.tenantId));
  }

  createDeployment(input: unknown, actor: RequestActor): Deployment {
    const body = ensureObject(input, "deployment");
    const state = this.store.getState();
    this.requireEnvironment(String(body.environmentId), actor.tenantId);
    const deployment: Deployment = {
      id: newId("deployment"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "deployment.name"),
      version: ensureString(body.version, "deployment.version"),
      status: "pending",
      environmentId: String(body.environmentId),
      containerId: body.containerId ? String(body.containerId) : undefined,
      serverId: body.serverId ? String(body.serverId) : undefined,
      strategy: String(body.strategy ?? "direct") as Deployment["strategy"],
      previousVersion: body.previousVersion ? String(body.previousVersion) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      metadata: optionalObject(body.metadata)
    };
    state.deployments.push(deployment);
    this.store.save();
    this.store.audit(actor, "deployment.create", "deployment", deployment.id, undefined, deployment);
    return clone(deployment);
  }

  runDeployment(id: string, input: unknown, actor: RequestActor): DeploymentRun {
    const body = ensureObject(input, "deploymentRun");
    const state = this.store.getState();
    const deployment = state.deployments.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!deployment) throw new Error("Deployment not found");

    const before = clone(deployment);
    deployment.status = "running";
    deployment.rolloutId = newId("rollout");
    deployment.updatedAt = nowIso();

    const run: DeploymentRun = {
      id: newId("deploymentrun"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      deploymentId: deployment.id,
      status: "running",
      startedAt: nowIso(),
      logs: [`Deployment ${deployment.name} v${deployment.version} started`],
      metadata: optionalObject(body.metadata)
    };

    setTimeout(() => {
      const currentDeployment = state.deployments.find((d) => d.id === id);
      if (currentDeployment && currentDeployment.status === "running") {
        currentDeployment.status = "completed";
        currentDeployment.updatedAt = nowIso();
        const currentRun = state.deploymentRuns.find((r) => r.deploymentId === id && r.status === "running");
        if (currentRun) {
          currentRun.status = "completed";
          currentRun.completedAt = nowIso();
          currentRun.durationMs = new Date(currentRun.completedAt).getTime() - new Date(currentRun.startedAt!).getTime();
          currentRun.logs.push(`Deployment ${currentDeployment.name} v${currentDeployment.version} completed successfully`);
        }
        this.store.save();
      }
    }, 2000);

    state.deploymentRuns.push(run);
    this.store.save();
    this.store.audit(actor, "deployment.run", "deployment", deployment.id, before, deployment);
    return clone(run);
  }

  listDeploymentRuns(actor: RequestActor): DeploymentRun[] {
    return clone(this.store.getState().deploymentRuns.filter((item) => item.tenantId === actor.tenantId));
  }

  rollbackDeployment(id: string, actor: RequestActor): Deployment {
    const state = this.store.getState();
    const deployment = state.deployments.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!deployment) throw new Error("Deployment not found");

    const before = clone(deployment);
    deployment.status = "rolled_back";
    deployment.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "deployment.rollback", "deployment", deployment.id, before, deployment);
    return clone(deployment);
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((item) => item.tenantId === actor.tenantId));
  }

  listEvents(actor: RequestActor): InfrastructureEvent[] {
    return clone(this.store.getState().events.filter((item) => item.tenantId === actor.tenantId));
  }

  emitEvent(type: string, source: string, data: Record<string, unknown>, actor: RequestActor): InfrastructureEvent {
    const state = this.store.getState();
    const event: InfrastructureEvent = {
      id: newId("event"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type,
      source,
      data
    };
    state.events.unshift(event);
    this.store.save();
    return clone(event);
  }

  private requireEnvironment(id: string, tenantId: string): Environment {
    const item = this.store.getState().environments.find(
      (env) => env.tenantId === tenantId && (env.id === id || env.key === id)
    );
    if (!item) throw new Error("Environment not found");
    return item;
  }
}
