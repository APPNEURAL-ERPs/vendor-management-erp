import { DataStore } from "./core/datastore";
import {
  API,
  APIEndpoint,
  APIKey,
  CLISubCommand,
  CLICommand,
  DataSchema,
  DeveloperApp,
  DeveloperOSEvent,
  DeveloperOSOverview,
  RequestActor,
  SDK,
  SDKExample,
  Sandbox,
  ServiceAccount,
  Webhook,
  WebhookDelivery
} from "./core/domain";
import { conflict, notFound } from "./core/errors";
import { generateApiKey, hashApiKey, newId, nowIso, plusDays } from "./core/id";
import { clone, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, optionalObject, pickQuery, uniq } from "./core/utils";

export class DeveloperOSService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "DeveloperOS service is ready";
  }

  overview(actor: RequestActor): DeveloperOSOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    return {
      apis: {
        total: state.apis.filter((item) => item.tenantId === tenant).length,
        active: state.apis.filter((item) => item.tenantId === tenant && item.status === "active").length
      },
      sdks: {
        total: state.sdks.filter((item) => item.tenantId === tenant).length,
        active: state.sdks.filter((item) => item.tenantId === tenant && item.status === "active").length
      },
      cliCommands: {
        total: state.cliCommands.filter((item) => item.tenantId === tenant).length,
        active: state.cliCommands.filter((item) => item.tenantId === tenant && item.status === "active").length
      },
      apiKeys: {
        total: state.apiKeys.filter((item) => item.tenantId === tenant).length,
        active: state.apiKeys.filter((item) => item.tenantId === tenant && item.status === "active").length
      },
      serviceAccounts: {
        total: state.serviceAccounts.filter((item) => item.tenantId === tenant).length,
        active: state.serviceAccounts.filter((item) => item.tenantId === tenant && item.status === "active").length
      },
      webhooks: {
        total: state.webhooks.filter((item) => item.tenantId === tenant).length,
        active: state.webhooks.filter((item) => item.tenantId === tenant && item.status === "active").length
      },
      sandboxes: {
        total: state.sandboxes.filter((item) => item.tenantId === tenant).length,
        active: state.sandboxes.filter((item) => item.tenantId === tenant && item.status === "active").length
      },
      developerApps: {
        total: state.developerApps.filter((item) => item.tenantId === tenant).length,
        active: state.developerApps.filter((item) => item.tenantId === tenant && item.status === "active").length
      }
    };
  }

  listApis(actor: RequestActor, query?: URLSearchParams): API[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    return clone(this.store.getState().apis.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (search && !`${item.key} ${item.name} ${item.description ?? ""}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  getApi(id: string, actor: RequestActor): API {
    const api = this.store.getState().apis.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!api) notFound("API not found");
    return clone(api);
  }

  createApi(input: unknown, actor: RequestActor): API {
    const body = ensureObject(input, "api");
    const state = this.store.getState();
    const key = ensureString(body.key, "api.key");
    if (state.apis.some((item) => item.tenantId === actor.tenantId && item.key === key)) conflict(`API key '${key}' already exists`);
    const api: API = {
      id: newId("api"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "api.name"),
      description: body.description ? String(body.description) : undefined,
      version: ensureString(body.version, "api.version", "1.0.0"),
      status: String(body.status ?? "active") as API["status"],
      endpoints: [],
      schemas: [],
      authentication: String(body.authentication ?? "api_key") as API["authentication"],
      rateLimit: body.rateLimit ? ensureNumber(body.rateLimit, "api.rateLimit") : undefined,
      tags: ensureArray<string>(body.tags, "api.tags"),
      metadata: optionalObject(body.metadata)
    };
    state.apis.push(api);
    this.store.save();
    this.store.audit(actor, "api.create", "api", api.id, undefined, api);
    return clone(api);
  }

  updateApi(id: string, input: unknown, actor: RequestActor): API {
    const body = ensureObject(input, "api");
    const state = this.store.getState();
    const api = state.apis.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!api) notFound("API not found");
    const before = clone(api);
    if (body.name) api.name = ensureString(body.name, "api.name");
    if (body.description) api.description = String(body.description);
    if (body.version) api.version = ensureString(body.version, "api.version");
    if (body.status) api.status = String(body.status) as API["status"];
    if (body.authentication) api.authentication = String(body.authentication) as API["authentication"];
    if (body.rateLimit) api.rateLimit = ensureNumber(body.rateLimit, "api.rateLimit");
    if (body.tags) api.tags = ensureArray<string>(body.tags, "api.tags");
    if (body.metadata) api.metadata = optionalObject(body.metadata);
    api.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "api.update", "api", api.id, before, api);
    return clone(api);
  }

  deleteApi(id: string, actor: RequestActor): void {
    const state = this.store.getState();
    const index = state.apis.findIndex((item) => item.id === id && item.tenantId === actor.tenantId);
    if (index === -1) notFound("API not found");
    const before = clone(state.apis[index]);
    state.apis.splice(index, 1);
    this.store.save();
    this.store.audit(actor, "api.delete", "api", id, before, undefined);
  }

  listEndpoints(actor: RequestActor, query?: URLSearchParams): APIEndpoint[] {
    const apiId = pickQuery(query, "apiId");
    return clone(this.store.getState().endpoints.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (apiId && item.apiId !== apiId) return false;
      return true;
    }));
  }

  createEndpoint(apiId: string, input: unknown, actor: RequestActor): APIEndpoint {
    const body = ensureObject(input, "endpoint");
    const state = this.store.getState();
    this.requireApi(apiId, actor.tenantId);
    const endpoint: APIEndpoint = {
      id: newId("endpoint"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      apiId,
      method: String(body.method ?? "GET").toUpperCase() as APIEndpoint["method"],
      path: ensureString(body.path, "endpoint.path"),
      name: ensureString(body.name, "endpoint.name"),
      description: body.description ? String(body.description) : undefined,
      authentication: String(body.authentication ?? "api_key") as APIEndpoint["authentication"],
      tags: ensureArray<string>(body.tags, "endpoint.tags"),
      status: String(body.status ?? "active") as APIEndpoint["status"],
      examples: ensureArray(body.examples, "endpoint.examples", [])
    };
    state.endpoints.push(endpoint);
    this.store.save();
    this.store.audit(actor, "endpoint.create", "endpoint", endpoint.id, undefined, endpoint);
    return clone(endpoint);
  }

  listSchemas(actor: RequestActor, query?: URLSearchParams): DataSchema[] {
    const apiId = pickQuery(query, "apiId");
    return clone(this.store.getState().schemas.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (apiId && item.apiId !== apiId) return false;
      return true;
    }));
  }

  createSchema(apiId: string, input: unknown, actor: RequestActor): DataSchema {
    const body = ensureObject(input, "schema");
    const state = this.store.getState();
    this.requireApi(apiId, actor.tenantId);
    const schema: DataSchema = {
      id: newId("schema"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      apiId,
      name: ensureString(body.name, "schema.name"),
      type: String(body.type ?? "object") as DataSchema["type"],
      description: body.description ? String(body.description) : undefined,
      properties: body.properties ? ensureArray(body.properties, "schema.properties") : undefined,
      required: body.required ? ensureArray<string>(body.required, "schema.required") : undefined,
      example: body.example,
      format: body.format ? String(body.format) : undefined,
      enum: body.enum ? ensureArray<string>(body.enum, "schema.enum") : undefined,
      metadata: optionalObject(body.metadata)
    };
    state.schemas.push(schema);
    this.store.save();
    this.store.audit(actor, "schema.create", "schema", schema.id, undefined, schema);
    return clone(schema);
  }

  listSDKs(actor: RequestActor, query?: URLSearchParams): SDK[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    return clone(this.store.getState().sdks.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (search && !`${item.key} ${item.name} ${item.description ?? ""}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  getSDK(id: string, actor: RequestActor): SDK {
    const sdk = this.store.getState().sdks.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!sdk) notFound("SDK not found");
    return clone(sdk);
  }

  createSDK(input: unknown, actor: RequestActor): SDK {
    const body = ensureObject(input, "sdk");
    const state = this.store.getState();
    const key = ensureString(body.key, "sdk.key");
    if (state.sdks.some((item) => item.tenantId === actor.tenantId && item.key === key)) conflict(`SDK key '${key}' already exists`);
    const sdk: SDK = {
      id: newId("sdk"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "sdk.name"),
      description: body.description ? String(body.description) : undefined,
      version: ensureString(body.version, "sdk.version", "1.0.0"),
      language: String(body.language ?? "typescript") as SDK["language"],
      framework: body.framework ? String(body.framework) : undefined,
      status: String(body.status ?? "active") as SDK["status"],
      apiId: body.apiId ? String(body.apiId) : undefined,
      tags: ensureArray<string>(body.tags, "sdk.tags"),
      metadata: optionalObject(body.metadata),
      examples: []
    };
    state.sdks.push(sdk);
    this.store.save();
    this.store.audit(actor, "sdk.create", "sdk", sdk.id, undefined, sdk);
    return clone(sdk);
  }

  generateSDK(apiId: string, input: unknown, actor: RequestActor): SDK {
    const body = ensureObject(input, "generateSdk");
    const state = this.store.getState();
    this.requireApi(apiId, actor.tenantId);
    const api = state.apis.find((item) => item.id === apiId);
    const language = String(body.language ?? "typescript");
    const name = ensureString(body.name, "sdk.name");
    const key = `${api?.key ?? "sdk"}-${language}-${newId("sdk").slice(-4)}`;
    const sdk: SDK = {
      id: newId("sdk"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name,
      description: `Generated ${language} SDK for ${api?.name ?? "API"}`,
      version: "1.0.0",
      language: language as SDK["language"],
      framework: body.framework ? String(body.framework) : undefined,
      status: "active",
      apiId,
      sourceCode: this.generateSDKCode(api, language),
      readme: this.generateSDKReadme(name, language, api?.name ?? "API"),
      tags: [language, "generated", ...(api?.tags ?? [])],
      metadata: { generated: true, generatedAt: nowIso() },
      examples: []
    };
    state.sdks.push(sdk);
    this.store.save();
    this.store.audit(actor, "sdk.generate", "sdk", sdk.id, undefined, sdk);
    return clone(sdk);
  }

  private generateSDKCode(api: API | undefined, language: string): string {
    const endpoints = api?.endpoints ?? [];
    const examples: string[] = [];
    examples.push(`// Generated ${language} SDK for ${api?.name ?? "API"}`);
    examples.push(`// Version: ${api?.version ?? "1.0.0"}`);
    examples.push("");
    examples.push("class SDKClient {");
    examples.push("  constructor(private apiKey: string, private baseUrl: string) {}");
    for (const endpoint of endpoints) {
      examples.push(`  async ${endpoint.name.toLowerCase().replace(/\s+/g, "_")}(params?: any): Promise<any> {`);
      examples.push(`    const response = await fetch(\`\${this.baseUrl}${endpoint.path}\`, {`);
      examples.push(`      method: '${endpoint.method}',`);
      examples.push(`      headers: { 'Authorization': \`Bearer \${this.apiKey}\`, 'Content-Type': 'application/json' }`);
      examples.push(`    });`);
      examples.push(`    return response.json();`);
      examples.push(`  }`);
    }
    examples.push("}");
    examples.push("");
    examples.push("export default SDKClient;");
    return examples.join("\n");
  }

  private generateSDKReadme(name: string, language: string, apiName: string): string {
    return `# ${name}

${language} SDK for ${apiName}

## Installation

\`\`\`bash
npm install ${name.toLowerCase().replace(/\s+/g, "-")}
\`\`\`

## Usage

\`\`\`${language}
import SDKClient from '${name.toLowerCase().replace(/\s+/g, "-")}';

const client = new SDKClient('your-api-key', 'https://api.example.com');
\`\`\`
`;
  }

  listCLIs(actor: RequestActor, query?: URLSearchParams): CLICommand[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    return clone(this.store.getState().cliCommands.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (search && !`${item.key} ${item.name} ${item.description ?? ""}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  getCLI(id: string, actor: RequestActor): CLICommand {
    const cli = this.store.getState().cliCommands.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!cli) notFound("CLI command not found");
    return clone(cli);
  }

  createCLI(input: unknown, actor: RequestActor): CLICommand {
    const body = ensureObject(input, "cli");
    const state = this.store.getState();
    const key = ensureString(body.key, "cli.key");
    if (state.cliCommands.some((item) => item.tenantId === actor.tenantId && item.key === key)) conflict(`CLI key '${key}' already exists`);
    const cli: CLICommand = {
      id: newId("cli"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "cli.name"),
      description: body.description ? String(body.description) : undefined,
      version: ensureString(body.version, "cli.version", "1.0.0"),
      status: String(body.status ?? "active") as CLICommand["status"],
      sdkId: body.sdkId ? String(body.sdkId) : undefined,
      tags: ensureArray<string>(body.tags, "cli.tags"),
      metadata: optionalObject(body.metadata),
      commands: ensureArray<CLISubCommand>(body.commands, "cli.commands", []),
      options: ensureArray(body.options, "cli.options", []),
      examples: ensureArray(body.examples, "cli.examples", [])
    };
    state.cliCommands.push(cli);
    this.store.save();
    this.store.audit(actor, "cli.create", "cli", cli.id, undefined, cli);
    return clone(cli);
  }

  listAPIKeys(actor: RequestActor, query?: URLSearchParams): APIKey[] {
    const ownerId = pickQuery(query, "ownerId");
    return clone(this.store.getState().apiKeys.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (ownerId && item.ownerId !== ownerId) return false;
      return true;
    }));
  }

  createAPIKey(ownerId: string, ownerType: "service_account" | "developer_app", input: unknown, actor: RequestActor): { apiKey: APIKey; rawKey: string } {
    const body = ensureObject(input, "apiKey");
    const state = this.store.getState();
    const name = ensureString(body.name, "apiKey.name");
    const rawKey = generateApiKey("dev");
    const keyPrefix = rawKey.slice(0, 8);
    const keyHash = hashApiKey(rawKey);
    const scopes = ensureArray<string>(body.scopes, "apiKey.scopes", []);
    const apiKey: APIKey = {
      id: newId("apikey"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ownerId,
      ownerType,
      name,
      keyPrefix,
      keyHash,
      scopes,
      status: "active",
      expiresAt: body.expiresInDays ? plusDays(ensureNumber(body.expiresInDays, "apiKey.expiresInDays")) : undefined,
      createdBy: actor.userId,
      metadata: optionalObject(body.metadata)
    };
    state.apiKeys.push(apiKey);
    this.store.save();
    this.store.audit(actor, "apikey.create", "apiKey", apiKey.id, undefined, { name, keyPrefix });
    return { apiKey: clone(apiKey), rawKey };
  }

  revokeAPIKey(id: string, actor: RequestActor): APIKey {
    const state = this.store.getState();
    const apiKey = state.apiKeys.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!apiKey) notFound("API key not found");
    const before = clone(apiKey);
    apiKey.status = "revoked";
    apiKey.revokedAt = nowIso();
    apiKey.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "apikey.revoke", "apiKey", apiKey.id, before, apiKey);
    return clone(apiKey);
  }

  listServiceAccounts(actor: RequestActor): ServiceAccount[] {
    return clone(this.store.getState().serviceAccounts.filter((item) => item.tenantId === actor.tenantId));
  }

  getServiceAccount(id: string, actor: RequestActor): ServiceAccount {
    const account = this.store.getState().serviceAccounts.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!account) notFound("Service account not found");
    return clone(account);
  }

  createServiceAccount(input: unknown, actor: RequestActor): ServiceAccount {
    const body = ensureObject(input, "serviceAccount");
    const state = this.store.getState();
    const account: ServiceAccount = {
      id: newId("sa"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "serviceAccount.name"),
      description: body.description ? String(body.description) : undefined,
      email: body.email ? String(body.email) : undefined,
      status: String(body.status ?? "active") as ServiceAccount["status"],
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      scopes: ensureArray<string>(body.scopes, "serviceAccount.scopes", []),
      apiKeys: [],
      metadata: optionalObject(body.metadata)
    };
    state.serviceAccounts.push(account);
    this.store.save();
    this.store.audit(actor, "serviceaccount.create", "serviceAccount", account.id, undefined, account);
    return clone(account);
  }

  listWebhooks(actor: RequestActor, query?: URLSearchParams): Webhook[] {
    const apiId = pickQuery(query, "apiId");
    return clone(this.store.getState().webhooks.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (apiId && item.apiId !== apiId) return false;
      return true;
    }));
  }

  getWebhook(id: string, actor: RequestActor): Webhook {
    const webhook = this.store.getState().webhooks.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!webhook) notFound("Webhook not found");
    return clone(webhook);
  }

  createWebhook(input: unknown, actor: RequestActor): Webhook {
    const body = ensureObject(input, "webhook");
    const state = this.store.getState();
    const webhook: Webhook = {
      id: newId("webhook"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "webhook.name"),
      description: body.description ? String(body.description) : undefined,
      url: ensureString(body.url, "webhook.url"),
      events: ensureArray<string>(body.events, "webhook.events"),
      secret: body.secret ? String(body.secret) : undefined,
      status: String(body.status ?? "active") as Webhook["status"],
      retryPolicy: {
        maxRetries: ensureNumber(body.maxRetries ?? 3, "webhook.maxRetries"),
        retryDelay: ensureNumber(body.retryDelay ?? 1000, "webhook.retryDelay"),
        backoffMultiplier: body.backoffMultiplier ? ensureNumber(body.backoffMultiplier, "webhook.backoffMultiplier") : undefined
      },
      headers: optionalObject(body.headers),
      apiId: body.apiId ? String(body.apiId) : undefined,
      createdBy: actor.userId,
      metadata: optionalObject(body.metadata)
    };
    state.webhooks.push(webhook);
    this.store.save();
    this.store.audit(actor, "webhook.create", "webhook", webhook.id, undefined, webhook);
    return clone(webhook);
  }

  updateWebhook(id: string, input: unknown, actor: RequestActor): Webhook {
    const body = ensureObject(input, "webhook");
    const state = this.store.getState();
    const webhook = state.webhooks.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!webhook) notFound("Webhook not found");
    const before = clone(webhook);
    if (body.name) webhook.name = ensureString(body.name, "webhook.name");
    if (body.url) webhook.url = ensureString(body.url, "webhook.url");
    if (body.events) webhook.events = ensureArray<string>(body.events, "webhook.events");
    if (body.status) webhook.status = String(body.status) as Webhook["status"];
    if (body.metadata) webhook.metadata = optionalObject(body.metadata);
    webhook.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "webhook.update", "webhook", webhook.id, before, webhook);
    return clone(webhook);
  }

  deleteWebhook(id: string, actor: RequestActor): void {
    const state = this.store.getState();
    const index = state.webhooks.findIndex((item) => item.id === id && item.tenantId === actor.tenantId);
    if (index === -1) notFound("Webhook not found");
    const before = clone(state.webhooks[index]);
    state.webhooks.splice(index, 1);
    this.store.save();
    this.store.audit(actor, "webhook.delete", "webhook", id, before, undefined);
  }

  listSandboxes(actor: RequestActor, query?: URLSearchParams): Sandbox[] {
    const ownerId = pickQuery(query, "ownerId");
    return clone(this.store.getState().sandboxes.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (ownerId && item.ownerId !== ownerId) return false;
      return true;
    }));
  }

  getSandbox(id: string, actor: RequestActor): Sandbox {
    const sandbox = this.store.getState().sandboxes.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!sandbox) notFound("Sandbox not found");
    return clone(sandbox);
  }

  createSandbox(input: unknown, actor: RequestActor): Sandbox {
    const body = ensureObject(input, "sandbox");
    const state = this.store.getState();
    const sandbox: Sandbox = {
      id: newId("sandbox"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "sandbox.name"),
      description: body.description ? String(body.description) : undefined,
      environment: String(body.environment ?? "development") as Sandbox["environment"],
      status: String(body.status ?? "active") as Sandbox["status"],
      ownerId: String(body.ownerId ?? actor.userId),
      createdBy: actor.userId,
      expiresAt: body.expiresInDays ? plusDays(ensureNumber(body.expiresInDays, "sandbox.expiresInDays")) : undefined,
      resources: {
        cpu: body.resources?.cpu ? ensureNumber(body.resources.cpu, "sandbox.resources.cpu") : 2,
        memory: body.resources?.memory ? ensureNumber(body.resources.memory, "sandbox.resources.memory") : 4,
        disk: body.resources?.disk ? ensureNumber(body.resources.disk, "sandbox.resources.disk") : 20,
        network: body.resources?.network !== undefined ? ensureBoolean(body.resources.network) : true
      },
      services: ensureArray<string>(body.services, "sandbox.services", []),
      variables: optionalObject(body.variables),
      metadata: optionalObject(body.metadata)
    };
    state.sandboxes.push(sandbox);
    this.store.save();
    this.store.audit(actor, "sandbox.create", "sandbox", sandbox.id, undefined, sandbox);
    return clone(sandbox);
  }

  deleteSandbox(id: string, actor: RequestActor): void {
    const state = this.store.getState();
    const index = state.sandboxes.findIndex((item) => item.id === id && item.tenantId === actor.tenantId);
    if (index === -1) notFound("Sandbox not found");
    const before = clone(state.sandboxes[index]);
    state.sandboxes.splice(index, 1);
    this.store.save();
    this.store.audit(actor, "sandbox.delete", "sandbox", id, before, undefined);
  }

  listDeveloperApps(actor: RequestActor): DeveloperApp[] {
    return clone(this.store.getState().developerApps.filter((item) => item.tenantId === actor.tenantId));
  }

  getDeveloperApp(id: string, actor: RequestActor): DeveloperApp {
    const app = this.store.getState().developerApps.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!app) notFound("Developer app not found");
    return clone(app);
  }

  createDeveloperApp(input: unknown, actor: RequestActor): DeveloperApp {
    const body = ensureObject(input, "developerApp");
    const state = this.store.getState();
    const app: DeveloperApp = {
      id: newId("devapp"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "developerApp.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as DeveloperApp["status"],
      ownerId: String(body.ownerId ?? actor.userId),
      websiteUrl: body.websiteUrl ? String(body.websiteUrl) : undefined,
      redirectUrls: body.redirectUrls ? ensureArray<string>(body.redirectUrls, "developerApp.redirectUrls") : [],
      scopes: ensureArray<string>(body.scopes, "developerApp.scopes", []),
      apiKeys: [],
      webhooks: [],
      metadata: optionalObject(body.metadata)
    };
    state.developerApps.push(app);
    this.store.save();
    this.store.audit(actor, "developerapp.create", "developerApp", app.id, undefined, app);
    return clone(app);
  }

  listEvents(actor: RequestActor): DeveloperOSEvent[] {
    return clone(this.store.getState().events.filter((item) => item.tenantId === actor.tenantId));
  }

  emitEvent(input: unknown, actor: RequestActor): DeveloperOSEvent {
    const body = ensureObject(input, "event");
    const state = this.store.getState();
    const event: DeveloperOSEvent = {
      id: newId("event"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type: ensureString(body.type, "event.type"),
      source: ensureString(body.source, "event.source", "DeveloperOS"),
      data: optionalObject(body.data),
      correlationId: body.correlationId ? String(body.correlationId) : undefined
    };
    state.events.unshift(event);
    this.store.save();
    this.store.audit(actor, "event.emit", "event", event.id, undefined, event);
    return clone(event);
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((item) => item.tenantId === actor.tenantId));
  }

  private requireApi(idOrKey: string, tenantId: string): API {
    const item = this.store.getState().apis.find((api) => api.tenantId === tenantId && (api.id === idOrKey || api.key === idOrKey));
    if (!item) notFound("API not found");
    return item;
  }
}
