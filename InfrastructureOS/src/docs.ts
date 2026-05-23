export function docs() {
  return {
    name: "InfrastructureOS",
    version: "1.0.0",
    description:
      "InfrastructureOS: Cloud infrastructure, servers, databases, networks, containers, deployments, and infrastructure lifecycle management",
    auth: {
      headers: {
        "x-role":
          "owner | admin | infra_admin | devops_engineer | developer | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      environment:
        "A deployment environment (development, staging, production, preview, sandbox, local).",
      server: "A compute server or instance in the cloud or on-premises.",
      database: "A database resource (PostgreSQL, MySQL, MongoDB, Redis, etc.).",
      network: "A virtual network or VPC for isolating resources.",
      container: "A containerized workload (Docker, Kubernetes, Cloudflare Workers, etc.).",
      deployment: "A deployment of an application to an environment.",
      deploymentRun: "An execution of a deployment with logs and status."
    },
    examples: {
      createEnvironment: {
        method: "POST",
        path: "/infraos/environments",
        headers: { "x-role": "admin" },
        body: {
          name: "Production",
          key: "production",
          type: "production",
          description: "Production environment"
        }
      },
      createServer: {
        method: "POST",
        path: "/infraos/servers",
        headers: { "x-role": "infra_admin" },
        body: {
          name: "api-server-1",
          hostname: "api-server-1.example.com",
          ipAddress: "10.0.1.100",
          provider: "aws",
          region: "us-east-1",
          instanceType: "t3.medium",
          environmentIds: []
        }
      },
      createDatabase: {
        method: "POST",
        path: "/infraos/databases",
        headers: { "x-role": "infra_admin" },
        body: {
          name: "main-postgres",
          type: "postgresql",
          provider: "aws",
          version: "14.5",
          maxConnections: 100,
          environmentIds: []
        }
      },
      createDeployment: {
        method: "POST",
        path: "/infraos/deployments",
        headers: { "x-role": "devops_engineer" },
        body: {
          name: "api-v2.1.0",
          version: "2.1.0",
          environmentId: "env_production",
          strategy: "rolling"
        }
      },
      runDeployment: {
        method: "POST",
        path: "/infraos/deployments/:id/run",
        headers: { "x-role": "devops_engineer" },
        body: {
          notes: "Deploying version 2.1.0 to production"
        }
      }
    }
  };
}
