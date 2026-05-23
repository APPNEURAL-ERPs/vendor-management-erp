import { DeveloperOSState } from "./core/domain";
import { emptyState } from "./core/datastore";
import { nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): DeveloperOSState {
  const state = emptyState();
  const createdAt = nowIso();

  state.apis.push({
    id: "api_resume",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "resume-api",
    name: "Resume API",
    description: "API for resume parsing, JD matching, and ATS scoring",
    version: "1.0.0",
    status: "active",
    endpoints: [],
    schemas: [],
    authentication: "api_key",
    rateLimit: 1000,
    tags: ["resume", "career", "ats"],
    metadata: { owner: "DeveloperOS Team", tier: "pro" }
  });

  state.endpoints.push({
    id: "endpoint_resume_create",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    apiId: "api_resume",
    method: "POST",
    path: "/resumes",
    name: "Create Resume",
    description: "Upload and parse a resume",
    authentication: "api_key",
    tags: ["resume", "upload"],
    status: "active",
    examples: [{ input: { name: "John Doe", email: "john@example.com" }, output: { id: "resume_123", score: 85 } }]
  });

  state.endpoints.push({
    id: "endpoint_resume_match",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    apiId: "api_resume",
    method: "POST",
    path: "/resumes/:id/match",
    name: "Match Resume to JD",
    description: "Calculate match score between resume and job description",
    authentication: "api_key",
    tags: ["resume", "match", "jd"],
    status: "active",
    examples: [{ input: { jobDescription: "Need Python developer" }, output: { score: 92, missing: ["AWS"] } }]
  });

  state.sdks.push({
    id: "sdk_resume_ts",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "resume-sdk-typescript",
    name: "Resume SDK TypeScript",
    description: "Official TypeScript SDK for Resume API",
    version: "1.0.0",
    language: "typescript",
    framework: "Node.js",
    status: "active",
    apiId: "api_resume",
    tags: ["typescript", "resume", "sdk"],
    metadata: { downloads: 1250, stars: 45 },
    examples: []
  });

  state.cliCommands.push({
    id: "cli_resume",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "resume-cli",
    name: "Resume CLI",
    description: "Command-line tool for resume operations",
    version: "1.0.0",
    status: "active",
    sdkId: "sdk_resume_ts",
    tags: ["resume", "cli"],
    metadata: { downloads: 890 },
    commands: [
      {
        name: "upload",
        description: "Upload a resume",
        options: [
          { name: "file", type: "string", description: "Resume file path", required: true },
          { name: "format", type: "string", description: "Resume format (pdf, docx, txt)", required: false, default: "pdf" }
        ]
      },
      {
        name: "match",
        description: "Match resume to job description",
        options: [
          { name: "resume-id", short: "r", type: "string", description: "Resume ID", required: true },
          { name: "jd", type: "string", description: "Job description text or file", required: true }
        ]
      }
    ],
    options: [
      { name: "api-key", short: "k", type: "string", description: "API key for authentication", required: true },
      { name: "verbose", short: "v", type: "boolean", description: "Verbose output", required: false, default: false }
    ],
    examples: [
      { command: "resume-cli upload --file ./resume.pdf", description: "Upload a resume" },
      { command: "resume-cli match --resume-id abc123 --jd 'Python developer'", description: "Match resume to JD" }
    ]
  });

  state.serviceAccounts.push({
    id: "sa_career_service",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Career Service Account",
    description: "Service account for career microservice",
    status: "active",
    ownerId: "user_system",
    scopes: ["resume.read", "resume.write", "match.execute"],
    apiKeys: [],
    metadata: { service: "career-service", cluster: "production" }
  });

  state.webhooks.push({
    id: "webhook_resume_created",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Resume Created Webhook",
    description: "Triggered when a new resume is created",
    url: "https://career-service.example.com/webhooks/resume-created",
    events: ["resume.created", "resume.updated"],
    status: "active",
    apiId: "api_resume",
    createdBy: "user_admin",
    retryPolicy: {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2
    },
    headers: { "X-Webhook-Secret": "demo-secret" },
    metadata: {}
  });

  state.sandboxes.push({
    id: "sandbox_dev_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Developer Sandbox 1",
    description: "Development sandbox for testing APIs",
    environment: "development",
    status: "active",
    ownerId: "user_developer",
    createdBy: "user_admin",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    resources: {
      cpu: 2,
      memory: 4,
      disk: 20,
      network: true
    },
    services: ["resume-api", "career-service", "notification-service"],
    variables: {
      API_URL: "https://api.example.com",
      ENV: "development",
      LOG_LEVEL: "debug"
    },
    metadata: { region: "us-east-1" }
  });

  state.developerApps.push({
    id: "devapp_career_portal",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Career Portal App",
    description: "External career portal application",
    status: "active",
    ownerId: "user_external",
    websiteUrl: "https://career.example.com",
    redirectUrls: ["https://career.example.com/callback"],
    scopes: ["resume.read", "match.execute"],
    apiKeys: [],
    webhooks: [],
    metadata: { developer: "Acme Corp", tier: "enterprise" }
  });

  state.events.push({
    id: "event_devos_seeded",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "developeros.seeded",
    source: "DeveloperOS",
    data: { message: "DeveloperOS demo data seeded" }
  });

  return state;
}
