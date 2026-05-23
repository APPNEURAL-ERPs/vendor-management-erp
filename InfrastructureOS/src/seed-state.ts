import { InfrastructureState } from "./types";
import { emptyState } from "./core/datastore";
import { nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): InfrastructureState {
  const state = emptyState();
  const createdAt = nowIso();

  state.environments.push(
    {
      id: "env_development",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Development",
      key: "development",
      description: "Local development environment",
      type: "development",
      status: "active",
      variables: { NODE_ENV: "development", LOG_LEVEL: "debug" },
      serverIds: [],
      databaseIds: [],
      networkIds: [],
      containerIds: [],
      metadata: {}
    },
    {
      id: "env_staging",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Staging",
      key: "staging",
      description: "Pre-production testing environment",
      type: "staging",
      status: "active",
      variables: { NODE_ENV: "staging", LOG_LEVEL: "info" },
      serverIds: [],
      databaseIds: [],
      networkIds: [],
      containerIds: [],
      metadata: {}
    },
    {
      id: "env_production",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Production",
      key: "production",
      description: "Live production environment",
      type: "production",
      status: "active",
      variables: { NODE_ENV: "production", LOG_LEVEL: "warn" },
      serverIds: [],
      databaseIds: [],
      networkIds: [],
      containerIds: [],
      metadata: {}
    }
  );

  state.cloudProviders.push(
    {
      id: "provider_aws",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "AWS",
      key: "aws",
      type: "aws",
      status: "active",
      region: "us-east-1",
      metadata: {}
    },
    {
      id: "provider_cloudflare",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Cloudflare",
      key: "cloudflare",
      type: "cloudflare",
      status: "active",
      metadata: {}
    }
  );

  state.servers.push(
    {
      id: "server_api_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "API Server 1",
      hostname: "api-1.example.com",
      ipAddress: "10.0.1.10",
      provider: "aws",
      region: "us-east-1",
      instanceType: "t3.medium",
      status: "active",
      environmentIds: ["env_production"],
      metadata: { cpu: "2 vCPU", memory: "4 GB", os: "Ubuntu 22.04" }
    },
    {
      id: "server_worker_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Worker Server 1",
      hostname: "worker-1.example.com",
      ipAddress: "10.0.1.20",
      provider: "aws",
      region: "us-east-1",
      instanceType: "t3.small",
      status: "active",
      environmentIds: ["env_production"],
      metadata: { cpu: "2 vCPU", memory: "2 GB", os: "Ubuntu 22.04" }
    }
  );

  state.databases.push(
    {
      id: "db_postgres_main",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "PostgreSQL Main",
      type: "postgresql",
      status: "active",
      provider: "aws",
      host: "postgres.example.com",
      port: 5432,
      databaseName: "appneural_main",
      version: "14.5",
      maxConnections: 100,
      environmentIds: ["env_production"],
      metadata: { storage: "100 GB", encrypted: true }
    },
    {
      id: "db_redis_cache",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Redis Cache",
      type: "redis",
      status: "active",
      provider: "aws",
      host: "redis.example.com",
      port: 6379,
      version: "7.0",
      maxConnections: 50,
      environmentIds: ["env_production"],
      metadata: { memory: "2 GB" }
    }
  );

  state.networks.push(
    {
      id: "network_vpc_main",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Main VPC",
      type: "vpc",
      status: "active",
      provider: "aws",
      cidr: "10.0.0.0/16",
      region: "us-east-1",
      environmentIds: ["env_production"],
      metadata: {}
    },
    {
      id: "network_private",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Private Network",
      type: "private_network",
      status: "active",
      provider: "self-hosted",
      environmentIds: ["env_production"],
      metadata: {}
    }
  );

  state.containers.push(
    {
      id: "container_api",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "API Container",
      image: "appneural/api",
      tag: "v2.1.0",
      status: "active",
      provider: "kubernetes",
      replicas: 3,
      port: 3000,
      environmentIds: ["env_production"],
      environment: { NODE_ENV: "production", LOG_LEVEL: "info" },
      metadata: { cpu: "500m", memory: "512Mi" }
    },
    {
      id: "container_worker",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Worker Container",
      image: "appneural/worker",
      tag: "v1.5.2",
      status: "active",
      provider: "kubernetes",
      replicas: 2,
      port: 8080,
      environmentIds: ["env_production"],
      environment: { NODE_ENV: "production", WORKER_CONCURRENCY: "4" },
      metadata: { cpu: "250m", memory: "256Mi" }
    }
  );

  state.deployments.push(
    {
      id: "deployment_api_v2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "API v2.1.0",
      version: "2.1.0",
      status: "completed",
      environmentId: "env_production",
      containerId: "container_api",
      strategy: "rolling",
      notes: "Production API deployment",
      metadata: { previousVersion: "2.0.0" }
    },
    {
      id: "deployment_worker_v1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Worker v1.5.2",
      version: "1.5.2",
      status: "completed",
      environmentId: "env_production",
      containerId: "container_worker",
      strategy: "rolling",
      notes: "Production worker deployment",
      metadata: {}
    }
  );

  state.storageBuckets.push({
    id: "storage_uploads",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Uploads Bucket",
    provider: "cloudflare",
    region: "us-east",
    status: "active",
    environmentIds: ["env_production"],
    metadata: { sizeLimit: "10 GB" }
  });

  state.queueResources.push({
    id: "queue_jobs",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Jobs Queue",
    provider: "cloudflare",
    status: "active",
    environmentIds: ["env_production"],
    metadata: { maxRetries: 3 }
  });

  state.configVariables.push(
    {
      id: "config_api_url",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "API_BASE_URL",
      value: "https://api.example.com",
      environmentId: "env_production",
      isSecret: false,
      status: "active",
      tags: ["api", "url"],
      metadata: {}
    },
    {
      id: "config_db_url",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "DATABASE_URL",
      value: "***redacted***",
      environmentId: "env_production",
      isSecret: true,
      status: "active",
      tags: ["database", "credentials"],
      metadata: {}
    }
  );

  state.incidents.push({
    id: "incident_demo_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    title: "High CPU on API Server",
    description: "API server CPU usage exceeded 90% threshold",
    severity: "sev2",
    status: "resolved",
    resourceType: "server",
    resourceId: "server_api_1",
    createdBy: "system",
    resolvedAt: nowIso(),
    metadata: {}
  });

  state.events.push({
    id: "event_seed_bootstrap",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "infra.seeded",
    source: "InfrastructureOS",
    data: { message: "InfrastructureOS demo data seeded" }
  });

  return state;
}
