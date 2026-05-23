import { SecretOSState } from "./domain";
import { emptyState } from "./core/datastore";
import { nowIso, plusDays } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): SecretOSState {
  const state = emptyState();
  const createdAt = nowIso();

  state.rotationPolicies.push(
    {
      id: "policy_30d",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "rotate_30d",
      name: "Rotate every 30 days",
      description: "Standard rotation policy for sensitive secrets",
      intervalDays: 30,
      autoRotate: false,
      approvalRequired: false,
      notifyBeforeDays: 7,
      status: "active",
      createdBy: "seed"
    },
    {
      id: "policy_90d",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "rotate_90d",
      name: "Rotate every 90 days",
      description: "Standard rotation policy for API keys",
      intervalDays: 90,
      autoRotate: true,
      approvalRequired: true,
      notifyBeforeDays: 14,
      status: "active",
      createdBy: "seed"
    },
    {
      id: "policy_365d",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "rotate_365d",
      name: "Rotate yearly",
      description: "Annual rotation for low-sensitivity secrets",
      intervalDays: 365,
      autoRotate: false,
      approvalRequired: false,
      notifyBeforeDays: 30,
      status: "active",
      createdBy: "seed"
    }
  );

  state.secrets.push(
    {
      id: "secret_openai",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "OPENAI_API_KEY",
      name: "OpenAI API Key",
      description: "API key for OpenAI services",
      type: "api_key",
      environment: "production",
      status: "active",
      maskedValue: "sk-****************************9xA",
      tags: ["ai", "openai", "llm"],
      ownerId: "user_admin",
      rotationPolicyId: "policy_90d",
      expiresAt: plusDays(90),
      lastRotatedAt: createdAt,
      usageCount: 1247,
      dependencies: [
        {
          id: "dep_openai_aios",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          secretId: "secret_openai",
          dependencyType: "module",
          dependencyName: "AIOS",
          status: "active",
          lastVerifiedAt: createdAt
        }
      ],
      metadata: { provider: "openai", model: "gpt-4" },
      createdBy: "seed"
    },
    {
      id: "secret_razorpay",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "RAZORPAY_SECRET_KEY",
      name: "Razorpay Secret Key",
      description: "Payment gateway secret key",
      type: "payment_key",
      environment: "production",
      status: "active",
      maskedValue: "rzp_live_***************Q2",
      tags: ["payment", "razorpay", "finance"],
      ownerId: "user_finance",
      rotationPolicyId: "policy_30d",
      expiresAt: plusDays(30),
      lastRotatedAt: createdAt,
      usageCount: 892,
      dependencies: [
        {
          id: "dep_razorpay_billing",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          secretId: "secret_razorpay",
          dependencyType: "module",
          dependencyName: "BillingOS",
          status: "active",
          lastVerifiedAt: createdAt
        }
      ],
      metadata: { mode: "live", webhookEvents: ["payment.captured", "payment.failed"] },
      createdBy: "seed"
    },
    {
      id: "secret_db_primary",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "DATABASE_URL",
      name: "Primary Database URL",
      description: "Production PostgreSQL connection string",
      type: "database_credential",
      environment: "production",
      status: "active",
      maskedValue: "postgres://****:****@db.example.com:5432/app",
      tags: ["database", "postgresql", "production"],
      ownerId: "user_admin",
      rotationPolicyId: "policy_30d",
      expiresAt: plusDays(30),
      lastRotatedAt: createdAt,
      usageCount: 3847,
      dependencies: [
        {
          id: "dep_db_api",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          secretId: "secret_db_primary",
          dependencyType: "service",
          dependencyName: "API Service",
          status: "active",
          lastVerifiedAt: createdAt
        }
      ],
      metadata: { host: "db.example.com", port: 5432, database: "app" },
      createdBy: "seed"
    },
    {
      id: "secret_aws_access",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "AWS_ACCESS_KEY_ID",
      name: "AWS Access Key",
      description: "AWS IAM access key for infrastructure",
      type: "cloud_credential",
      environment: "production",
      status: "active",
      maskedValue: "AKIA****************************ABCD",
      tags: ["aws", "cloud", "infrastructure"],
      ownerId: "user_devops",
      rotationPolicyId: "policy_90d",
      expiresAt: plusDays(90),
      lastRotatedAt: createdAt,
      usageCount: 2103,
      dependencies: [
        {
          id: "dep_aws_infra",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          secretId: "secret_aws_access",
          dependencyType: "service",
          dependencyName: "InfrastructureOS",
          status: "active",
          lastVerifiedAt: createdAt
        }
      ],
      metadata: { provider: "aws", region: "us-east-1", iamUser: "app-deploy" },
      createdBy: "seed"
    },
    {
      id: "secret_github_token",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "GITHUB_TOKEN",
      name: "GitHub Personal Access Token",
      description: "GitHub PAT for CI/CD and integrations",
      type: "api_key",
      environment: "development",
      status: "active",
      maskedValue: "ghp_****************************xyz",
      tags: ["github", "cicd", "development"],
      ownerId: "user_developer",
      rotationPolicyId: "policy_365d",
      expiresAt: plusDays(365),
      lastRotatedAt: createdAt,
      usageCount: 456,
      dependencies: [
        {
          id: "dep_github_cicd",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          secretId: "secret_github_token",
          dependencyType: "ci_cd",
          dependencyName: "GitHub Actions",
          status: "active",
          lastVerifiedAt: createdAt
        }
      ],
      metadata: { scopes: ["repo", "workflow", "packages"] },
      createdBy: "seed"
    },
    {
      id: "secret_jwt_signing",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "JWT_SECRET_KEY",
      name: "JWT Signing Secret",
      description: "Secret key for signing JWT tokens",
      type: "jwt_secret",
      environment: "production",
      status: "active",
      maskedValue: "jwt_****************************xyz",
      tags: ["jwt", "auth", "security"],
      ownerId: "user_admin",
      rotationPolicyId: "policy_90d",
      expiresAt: plusDays(90),
      lastRotatedAt: createdAt,
      usageCount: 8934,
      dependencies: [
        {
          id: "dep_jwt_auth",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          secretId: "secret_jwt_signing",
          dependencyType: "module",
          dependencyName: "IdentityOS",
          status: "active",
          lastVerifiedAt: createdAt
        }
      ],
      metadata: { algorithm: "HS256", tokenExpiry: "24h" },
      createdBy: "seed"
    },
    {
      id: "secret_webhook_slack",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "SLACK_WEBHOOK_SECRET",
      name: "Slack Webhook Secret",
      description: "Webhook signing secret for Slack integrations",
      type: "webhook_secret",
      environment: "production",
      status: "active",
      maskedValue: "whsec_****************************abc",
      tags: ["slack", "webhook", "notifications"],
      ownerId: "user_developer",
      rotationPolicyId: "policy_90d",
      expiresAt: plusDays(90),
      lastRotatedAt: createdAt,
      usageCount: 156,
      dependencies: [
        {
          id: "dep_slack_integration",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          secretId: "secret_webhook_slack",
          dependencyType: "integration",
          dependencyName: "Slack Integration",
          status: "active",
          lastVerifiedAt: createdAt
        }
      ],
      metadata: { channel: "#alerts" },
      createdBy: "seed"
    },
    {
      id: "secret_oauth_google",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "GOOGLE_OAUTH_CLIENT_SECRET",
      name: "Google OAuth Client Secret",
      description: "OAuth client secret for Google Sign-In",
      type: "oauth_token",
      environment: "production",
      status: "active",
      maskedValue: "GOCSPX-****************************Def",
      tags: ["oauth", "google", "auth"],
      ownerId: "user_admin",
      rotationPolicyId: "policy_365d",
      expiresAt: plusDays(365),
      lastRotatedAt: createdAt,
      usageCount: 723,
      dependencies: [
        {
          id: "dep_google_auth",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          secretId: "secret_oauth_google",
          dependencyType: "module",
          dependencyName: "IntegrationOS",
          status: "active",
          lastVerifiedAt: createdAt
        }
      ],
      metadata: { provider: "google", scopes: ["email", "profile"] },
      createdBy: "seed"
    },
    {
      id: "secret_encryption_master",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "MASTER_ENCRYPTION_KEY",
      name: "Master Data Encryption Key",
      description: "Master key for encrypting sensitive data",
      type: "encryption_key",
      environment: "production",
      status: "active",
      maskedValue: "mek_****************************123",
      tags: ["encryption", "security", "critical"],
      ownerId: "user_admin",
      rotationPolicyId: "policy_365d",
      expiresAt: plusDays(365),
      lastRotatedAt: createdAt,
      usageCount: 12,
      dependencies: [],
      metadata: { algorithm: "AES-256-GCM", keyType: "master" },
      createdBy: "seed"
    }
  );

  for (const secret of state.secrets) {
    state.secretVersions.push({
      id: `${secret.id}_v1`,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      secretId: secret.id,
      version: 1,
      maskedValue: secret.maskedValue,
      status: "active",
      rotatedAt: createdAt,
      rotatedBy: "seed",
      expiresAt: secret.expiresAt
    });
  }

  state.apiKeys.push(
    {
      id: "apikey_billing_service",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "Billing Service API Key",
      name: "Billing Service API Key",
      description: "API key for BillingOS service account",
      ownerId: "svc_billing",
      ownerType: "service_account",
      keyPrefix: "sk_live_billing",
      keyHash: "hash_billing_123",
      type: "service",
      scopes: ["billing.read", "billing.write", "invoices.read", "invoices.write"],
      environment: "production",
      status: "active",
      usageCount: 3421,
      createdBy: "seed"
    },
    {
      id: "apikey_webhook_processor",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "Webhook Processor API Key",
      name: "Webhook Processor API Key",
      description: "API key for webhook processing service",
      ownerId: "svc_webhooks",
      ownerType: "service_account",
      keyPrefix: "sk_live_webhook",
      keyHash: "hash_webhook_456",
      type: "webhook",
      scopes: ["webhooks.process", "events.read"],
      environment: "production",
      status: "active",
      usageCount: 1876,
      createdBy: "seed"
    }
  );

  state.credentials.push(
    {
      id: "cred_redis_cache",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "REDIS_PASSWORD",
      name: "Redis Cache Password",
      description: "Password for Redis cache cluster",
      type: "database",
      provider: "redis",
      environment: "production",
      status: "active",
      maskedValue: "redis_****************************xyz",
      username: "app_cache",
      rotationPolicyId: "policy_90d",
      expiresAt: plusDays(90),
      lastRotatedAt: createdAt,
      metadata: { host: "redis.example.com", port: 6379 },
      createdBy: "seed"
    }
  );

  state.namespaces.push(
    {
      id: "ns_production",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "production",
      name: "Production Environment",
      description: "Production environment secrets namespace",
      namespaceType: "environment",
      secretCount: 6,
      status: "active",
      createdBy: "seed"
    },
    {
      id: "ns_development",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "development",
      name: "Development Environment",
      description: "Development environment secrets namespace",
      namespaceType: "environment",
      secretCount: 3,
      status: "active",
      createdBy: "seed"
    }
  );

  state.accessRequests.push({
    id: "access_req_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    secretId: "secret_openai",
    requesterId: "user_developer",
    requestedLevel: "reveal",
    reason: "Need to debug AI model configuration",
    status: "pending"
  });

  state.secretRisks.push(
    {
      id: "risk_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      secretId: "secret_razorpay",
      riskType: "no_owner",
      severity: "high",
      score: 75,
      description: "Secret has no assigned owner",
      recommendations: ["Assign an owner to this secret", "Set up rotation policy"],
      status: "open"
    },
    {
      id: "risk_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      secretId: "secret_db_primary",
      riskType: "unused",
      severity: "low",
      score: 25,
      description: "Secret has not been accessed in 60 days",
      recommendations: ["Verify if secret is still needed", "Clean up if unused"],
      status: "open"
    }
  );

  state.auditLogs.push(
    {
      id: "audit_seed_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      secretId: "secret_openai",
      actorId: "seed",
      actorRole: "owner",
      action: "created",
      success: true
    },
    {
      id: "audit_seed_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      secretId: "secret_openai",
      actorId: "user_admin",
      actorRole: "admin",
      action: "accessed",
      accessLevel: "read",
      success: true
    }
  );

  return state;
}
