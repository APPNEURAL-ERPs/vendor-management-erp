export function docs() {
  return {
    name: "DeveloperOS",
    version: "1.0.0",
    description: "DeveloperOS: software development, code generation, API registry, SDK generation, CLI generation, documentation, webhooks, API keys, service accounts, sandbox, and developer portal",
    auth: {
      headers: {
        "x-role": "owner | admin | developer_admin | sdk_engineer | api_developer | portal_manager | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      api: "API registry with endpoints, schemas, and versioning for developer integration.",
      sdk: "Software Development Kit generator supporting TypeScript, Python, Go, Java, and other languages.",
      cli: "Command-line interface command generator for developer tooling.",
      apiKey: "API key management for authentication and authorization.",
      serviceAccount: "Service account for machine-to-machine authentication.",
      webhook: "Webhook configuration for event-driven integrations.",
      sandbox: "Developer sandbox environment for testing and experimentation.",
      developerApp: "Third-party developer application registration and management."
    },
    examples: {
      createApi: {
        method: "POST",
        path: "/developeros/apis",
        headers: { "x-role": "api_developer" },
        body: { key: "resume-api", name: "Resume API", version: "1.0.0", authentication: "api_key" }
      },
      generateSdk: {
        method: "POST",
        path: "/developeros/sdks/generate",
        headers: { "x-role": "sdk_engineer" },
        body: { apiId: "api_resume_api", language: "typescript", name: "Resume SDK" }
      },
      createWebhook: {
        method: "POST",
        path: "/developeros/webhooks",
        headers: { "x-role": "api_developer" },
        body: { name: "Resume Update Webhook", url: "https://example.com/webhook", events: ["resume.created", "resume.updated"] }
      },
      createSandbox: {
        method: "POST",
        path: "/developeros/sandboxes",
        headers: { "x-role": "portal_manager" },
        body: { name: "Test Sandbox", environment: "development", resources: { cpu: 2, memory: 4 } }
      }
    }
  };
}
