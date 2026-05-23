export function docs() {
  return {
    name: "SecretOS",
    version: "1.0.0",
    description: "SecretOS: secrets, credentials, tokens, encryption keys, rotation, and secure secret access for APPNEURAL.",
    auth: {
      headers: {
        "x-role": "owner | admin | secret_admin | secret_manager | security_analyst | auditor | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      secret: "A stored credential, API key, token, password, certificate, or encryption key.",
      secretVersion: "Historical versions of secret values for rollback and audit.",
      rotationPolicy: "Rules defining how and when secrets should be rotated.",
      accessGrant: "Permission to access a secret for a specific identity.",
      accessRequest: "A pending request for secret access requiring approval.",
      apiKey: "Programmatic access keys for services and integrations.",
      credential: "Database, cloud, OAuth, or service account credentials.",
      encryptionKey: "Keys used for encrypting data at rest or in transit.",
      leakEvent: "Detected exposure of a secret in an unsafe location.",
      secretRisk: "Identified security risk associated with a secret.",
      incident: "Security incident requiring response and remediation."
    },
    secretTypes: {
      api_key: "API keys for external services",
      oauth_token: "OAuth tokens for third-party integrations",
      jwt_secret: "Secrets for signing JWTs",
      database_credential: "Database usernames and passwords",
      cloud_credential: "Cloud provider access keys",
      payment_key: "Payment gateway secrets",
      webhook_secret: "Webhook verification secrets",
      certificate: "SSL/TLS certificates and private keys",
      encryption_key: "Data encryption keys",
      environment_variable: "Environment-specific secrets",
      generic: "Other credential types"
    },
    environments: {
      local: "Local development machine",
      development: "Development environment",
      staging: "Staging/QA environment",
      preview: "Preview deployments",
      production: "Production environment",
      sandbox: "Sandbox/isolated testing",
      "enterprise-isolated": "Multi-tenant isolation"
    },
    examples: {
      createSecret: {
        method: "POST",
        path: "/secretos/secrets",
        headers: { "x-role": "secret_manager" },
        body: {
          key: "OPENAI_API_KEY",
          name: "OpenAI API Key",
          type: "api_key",
          environment: "production",
          tags: ["ai", "openai"]
        }
      },
      rotateSecret: {
        method: "POST",
        path: "/secretos/secrets/:id/rotate",
        headers: { "x-role": "secret_manager" },
        body: {
          newValue: "sk-new-secret-value"
        }
      },
      requestAccess: {
        method: "POST",
        path: "/secretos/secrets/:id/access-request",
        headers: { "x-role": "viewer" },
        body: {
          requestedLevel: "reveal",
          reason: "Need to debug AI integration"
        }
      },
      scanForLeaks: {
        method: "POST",
        path: "/secretos/secrets/scan",
        headers: { "x-role": "secret_admin" },
        body: {
          text: "Check this content for leaked secrets",
          types: ["api_key", "token"]
        }
      }
    }
  };
}
