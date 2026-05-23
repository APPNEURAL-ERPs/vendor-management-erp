import { DataStore } from "../core/datastore";
import { EventBus } from "../core/event-bus";
import { badRequest, notFound } from "../core/errors";
import { newId, nowIso } from "../core/id";
import { ApiEndpoint, ApiProduct, ChangelogEntry, Deployment, DeveloperApp, DocsPage, Environment, HttpMethodName, Pipeline, RequestActor, SdkPackage, SdkVersion, UsageEvent, WebhookSubscription } from "../core/domain";
import { asArray, assertRequired, boolOr, clone, ensureUrl, hashSecret, includesText, numberOr, redactVariables, slugify, unique } from "../core/utils";
import { ApiKeyEngine } from "../engines/api-key-engine";
import { DeveloperAnalyticsEngine } from "../engines/developer-analytics-engine";
import { PipelineEngine } from "../engines/pipeline-engine";
import { SdkGeneratorEngine } from "../engines/sdk-generator-engine";
import { WebhookEngine } from "../engines/webhook-engine";

export class DevService {
  private readonly keyEngine = new ApiKeyEngine();
  private readonly analyticsEngine = new DeveloperAnalyticsEngine();
  private readonly pipelineEngine = new PipelineEngine();
  private readonly sdkEngine = new SdkGeneratorEngine();
  private readonly webhookEngine = new WebhookEngine();
  constructor(private readonly store: DataStore, private readonly events: EventBus) {}

  health(): Record<string, unknown> {
    return { status: "ok", service: "DeveloperOS", version: "1.0.0", now: nowIso() };
  }

  overview(actor: RequestActor): Record<string, unknown> {
    const state = this.store.snapshot();
    return {
      analytics: this.analyticsEngine.summarize(state, actor.tenantId),
      recentEvents: state.events.filter((item) => item.tenantId === actor.tenantId).slice(0, 10),
      recentDeployments: state.deployments.filter((item) => item.tenantId === actor.tenantId).slice(0, 5),
      activeApps: state.developerApps.filter((item) => item.tenantId === actor.tenantId && item.status === "active").slice(0, 10),
      publishedDocs: state.docsPages.filter((item) => item.tenantId === actor.tenantId && item.status === "published").slice(0, 10)
    };
  }

  listApps(actor: RequestActor, query?: string): DeveloperApp[] {
    return this.store.snapshot().developerApps
      .filter((item) => item.tenantId === actor.tenantId && item.status !== "archived")
      .filter((item) => !query || includesText(item.name, query) || item.scopes.some((scope) => includesText(scope, query)));
  }

  getApp(actor: RequestActor, id: string): DeveloperApp {
    return this.findApp(actor, id);
  }

  createApp(actor: RequestActor, input: any): DeveloperApp {
    assertRequired(input?.name, "name");
    assertRequired(input?.ownerUserId, "ownerUserId");
    const now = nowIso();
    const app: DeveloperApp = {
      id: input?.id ?? newId("app"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name: String(input.name),
      ownerUserId: String(input.ownerUserId),
      status: input?.status ?? "active",
      environmentIds: unique(asArray<string>(input?.environmentIds)),
      callbackUrls: unique(asArray<string>(input?.callbackUrls)),
      allowedOrigins: unique(asArray<string>(input?.allowedOrigins)),
      scopes: unique(asArray<string>(input?.scopes)),
      metadata: input?.metadata ?? {},
      createdBy: actor.userId
    };
    for (const url of app.callbackUrls) ensureUrl(url, "callbackUrls");
    const state = this.store.getState();
    state.developerApps.push(app);
    this.store.save();
    this.store.audit(actor, "developer_app.created", "DeveloperApp", app.id, undefined, app);
    this.events.emit(actor, "developer_app.created", { appId: app.id, name: app.name });
    return clone(app);
  }

  updateApp(actor: RequestActor, id: string, input: any): DeveloperApp {
    const app = this.findApp(actor, id);
    const before = clone(app);
    if (input?.name !== undefined) app.name = String(input.name);
    if (input?.ownerUserId !== undefined) app.ownerUserId = String(input.ownerUserId);
    if (input?.status !== undefined) app.status = input.status;
    if (input?.environmentIds !== undefined) app.environmentIds = unique(asArray<string>(input.environmentIds));
    if (input?.callbackUrls !== undefined) app.callbackUrls = unique(asArray<string>(input.callbackUrls));
    if (input?.allowedOrigins !== undefined) app.allowedOrigins = unique(asArray<string>(input.allowedOrigins));
    if (input?.scopes !== undefined) app.scopes = unique(asArray<string>(input.scopes));
    if (input?.metadata !== undefined) app.metadata = input.metadata;
    for (const url of app.callbackUrls) ensureUrl(url, "callbackUrls");
    app.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "developer_app.updated", "DeveloperApp", app.id, before, app);
    this.events.emit(actor, "developer_app.updated", { appId: app.id });
    return clone(app);
  }

  listApiKeys(actor: RequestActor, appId?: string): any[] {
    return this.store.snapshot().apiKeys
      .filter((item) => item.tenantId === actor.tenantId && (!appId || item.appId === appId))
      .map(({ keyHash, ...safe }) => safe);
  }

  createApiKey(actor: RequestActor, appId: string, input: any): any {
    const app = this.findApp(actor, appId);
    assertRequired(input?.name, "name");
    const env = input?.environmentId ? this.findEnvironment(actor, input.environmentId) : undefined;
    const generated = this.keyEngine.generate(env?.slug ?? "dev");
    const now = nowIso();
    const apiKey = {
      id: input?.id ?? newId("key"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      appId: app.id,
      name: String(input.name),
      keyPrefix: generated.keyPrefix,
      keyHash: generated.keyHash,
      maskedKey: generated.maskedKey,
      scopes: unique(asArray<string>(input?.scopes)).length ? unique(asArray<string>(input?.scopes)) : app.scopes,
      environmentId: input?.environmentId,
      status: "active" as const,
      expiresAt: input?.expiresAt,
      createdBy: actor.userId
    };
    this.store.getState().apiKeys.push(apiKey);
    this.store.save();
    this.store.audit(actor, "api_key.created", "ApiKey", apiKey.id, undefined, { ...apiKey, keyHash: "[redacted]" });
    this.events.emit(actor, "api_key.created", { appId: app.id, apiKeyId: apiKey.id, keyPrefix: apiKey.keyPrefix });
    const { keyHash, ...safe } = apiKey;
    return { ...safe, plainTextKey: generated.plainTextKey };
  }

  revokeApiKey(actor: RequestActor, id: string): any {
    const key = this.store.getState().apiKeys.find((item) => item.tenantId === actor.tenantId && item.id === id);
    if (!key) notFound("API key not found");
    const before = clone(key);
    key.status = "revoked";
    key.revokedAt = nowIso();
    key.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "api_key.revoked", "ApiKey", key.id, { ...before, keyHash: "[redacted]" }, { ...key, keyHash: "[redacted]" });
    this.events.emit(actor, "api_key.revoked", { apiKeyId: key.id, appId: key.appId });
    const { keyHash, ...safe } = key;
    return safe;
  }

  listApiProducts(actor: RequestActor): ApiProduct[] {
    return this.store.snapshot().apiProducts.filter((item) => item.tenantId === actor.tenantId && item.status !== "archived");
  }

  createApiProduct(actor: RequestActor, input: any): ApiProduct {
    assertRequired(input?.name, "name");
    assertRequired(input?.description, "description");
    const now = nowIso();
    const api: ApiProduct = {
      id: input?.id ?? newId("api"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name: String(input.name),
      slug: input?.slug ? slugify(input.slug) : slugify(input.name),
      description: String(input.description),
      version: String(input?.version ?? "v1"),
      basePath: String(input?.basePath ?? `/api/${slugify(input.name)}`),
      visibility: input?.visibility ?? "internal",
      status: input?.status ?? "draft",
      ownerTeam: input?.ownerTeam,
      tags: unique(asArray<string>(input?.tags)),
      createdBy: actor.userId
    };
    const duplicate = this.store.getState().apiProducts.some((item) => item.tenantId === actor.tenantId && item.slug === api.slug);
    if (duplicate) badRequest("API product slug already exists");
    this.store.getState().apiProducts.push(api);
    this.store.save();
    this.store.audit(actor, "api_product.created", "ApiProduct", api.id, undefined, api);
    this.events.emit(actor, "api_product.created", { apiProductId: api.id, slug: api.slug });
    return clone(api);
  }

  createEndpoint(actor: RequestActor, apiProductId: string, input: any): ApiEndpoint {
    const api = this.findApiProduct(actor, apiProductId);
    assertRequired(input?.method, "method");
    assertRequired(input?.path, "path");
    const now = nowIso();
    const endpoint: ApiEndpoint = {
      id: input?.id ?? newId("ep"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      apiProductId: api.id,
      method: String(input.method).toUpperCase() as HttpMethodName,
      path: String(input.path),
      summary: String(input?.summary ?? ""),
      scopesRequired: unique(asArray<string>(input?.scopesRequired)),
      rateLimitPerMinute: numberOr(input?.rateLimitPerMinute, 60),
      status: input?.status ?? "draft",
      createdBy: actor.userId
    };
    if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(endpoint.method)) badRequest("Unsupported endpoint method");
    this.store.getState().apiEndpoints.push(endpoint);
    this.store.save();
    this.store.audit(actor, "api_endpoint.created", "ApiEndpoint", endpoint.id, undefined, endpoint);
    this.events.emit(actor, "api_endpoint.created", { apiProductId: api.id, endpointId: endpoint.id });
    return clone(endpoint);
  }

  updateEndpoint(actor: RequestActor, id: string, input: any): ApiEndpoint {
    const endpoint = this.findEndpoint(actor, id);
    const before = clone(endpoint);
    if (input?.summary !== undefined) endpoint.summary = String(input.summary);
    if (input?.scopesRequired !== undefined) endpoint.scopesRequired = unique(asArray<string>(input.scopesRequired));
    if (input?.rateLimitPerMinute !== undefined) endpoint.rateLimitPerMinute = numberOr(input.rateLimitPerMinute, endpoint.rateLimitPerMinute);
    if (input?.status !== undefined) endpoint.status = input.status;
    endpoint.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "api_endpoint.updated", "ApiEndpoint", endpoint.id, before, endpoint);
    this.events.emit(actor, "api_endpoint.updated", { endpointId: endpoint.id });
    return clone(endpoint);
  }

  listSdkPackages(actor: RequestActor): SdkPackage[] {
    return this.store.snapshot().sdkPackages.filter((item) => item.tenantId === actor.tenantId && item.status !== "archived");
  }

  createSdkPackage(actor: RequestActor, input: any): SdkPackage {
    assertRequired(input?.name, "name");
    assertRequired(input?.language, "language");
    const ids = unique(asArray<string>(input?.apiProductIds));
    ids.forEach((id) => this.findApiProduct(actor, id));
    const now = nowIso();
    const pkg: SdkPackage = {
      id: input?.id ?? newId("sdk"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name: String(input.name),
      language: input.language,
      apiProductIds: ids,
      status: input?.status ?? "active",
      createdBy: actor.userId
    };
    this.store.getState().sdkPackages.push(pkg);
    this.store.save();
    this.store.audit(actor, "sdk_package.created", "SdkPackage", pkg.id, undefined, pkg);
    this.events.emit(actor, "sdk_package.created", { sdkPackageId: pkg.id, language: pkg.language });
    return clone(pkg);
  }

  generateSdkVersion(actor: RequestActor, sdkPackageId: string, input: any): SdkVersion {
    const pkg = this.findSdkPackage(actor, sdkPackageId);
    const version = String(input?.version ?? "1.0.0");
    const products = this.store.getState().apiProducts.filter((api) => api.tenantId === actor.tenantId && pkg.apiProductIds.includes(api.id));
    const endpoints = this.store.getState().apiEndpoints.filter((endpoint) => endpoint.tenantId === actor.tenantId && pkg.apiProductIds.includes(endpoint.apiProductId));
    const generated = this.sdkEngine.generate(pkg, products, endpoints, version);
    const now = nowIso();
    const sdkVersion: SdkVersion = {
      id: input?.id ?? newId("sdkver"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      sdkPackageId: pkg.id,
      version,
      status: input?.status ?? "generated",
      artifactPath: generated.artifactPath,
      generatedCode: generated.generatedCode,
      changelog: input?.changelog,
      createdBy: actor.userId
    };
    this.store.getState().sdkVersions.push(sdkVersion);
    pkg.latestVersion = version;
    pkg.updatedAt = now;
    this.store.save();
    this.store.audit(actor, "sdk_version.generated", "SdkVersion", sdkVersion.id, undefined, { ...sdkVersion, generatedCode: "[generated]" });
    this.events.emit(actor, "sdk_version.generated", { sdkPackageId: pkg.id, sdkVersionId: sdkVersion.id, version });
    return clone(sdkVersion);
  }

  listWebhookSubscriptions(actor: RequestActor): WebhookSubscription[] {
    return this.store.snapshot().webhookSubscriptions.filter((item) => item.tenantId === actor.tenantId && item.status !== "archived").map((sub) => ({ ...sub, secretHash: sub.secretHash ? "[redacted]" : undefined }));
  }

  createWebhookSubscription(actor: RequestActor, input: any): any {
    const app = this.findApp(actor, input?.appId);
    assertRequired(input?.name, "name");
    assertRequired(input?.targetUrl, "targetUrl");
    ensureUrl(String(input.targetUrl), "targetUrl");
    const now = nowIso();
    const secret = input?.secret ? String(input.secret) : undefined;
    const sub: WebhookSubscription = {
      id: input?.id ?? newId("whsub"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      appId: app.id,
      name: String(input.name),
      targetUrl: String(input.targetUrl),
      eventTypes: unique(asArray<string>(input?.eventTypes)),
      secretHash: secret ? hashSecret(secret) : undefined,
      signingAlgorithm: "hmac-sha256",
      retryPolicy: { maxAttempts: numberOr(input?.retryPolicy?.maxAttempts, 3), backoffSeconds: numberOr(input?.retryPolicy?.backoffSeconds, 60) },
      status: input?.status ?? "active",
      createdBy: actor.userId
    };
    this.store.getState().webhookSubscriptions.push(sub);
    this.store.save();
    this.store.audit(actor, "webhook_subscription.created", "WebhookSubscription", sub.id, undefined, { ...sub, secretHash: sub.secretHash ? "[redacted]" : undefined });
    this.events.emit(actor, "webhook_subscription.created", { subscriptionId: sub.id, appId: app.id });
    return { ...clone(sub), secretHash: sub.secretHash ? "[redacted]" : undefined };
  }

  testWebhook(actor: RequestActor, input: any): any {
    const subscription = this.store.getState().webhookSubscriptions.find((item) => item.tenantId === actor.tenantId && item.id === input?.subscriptionId);
    if (!subscription) notFound("Webhook subscription not found");
    const eventType = String(input?.eventType ?? subscription.eventTypes[0] ?? "developeros.test");
    const payload = input?.payload ?? { test: true, sentAt: nowIso() };
    const delivery = this.webhookEngine.createDelivery(subscription, eventType, payload);
    this.store.getState().webhookDeliveries.unshift(delivery);
    this.store.save();
    this.store.audit(actor, "webhook_delivery.tested", "WebhookDelivery", delivery.id, undefined, delivery);
    this.events.emit(actor, "webhook_delivery.created", { deliveryId: delivery.id, eventType, status: delivery.status });
    return clone(delivery);
  }

  retryWebhookDelivery(actor: RequestActor, id: string): any {
    const delivery = this.store.getState().webhookDeliveries.find((item) => item.tenantId === actor.tenantId && item.id === id);
    if (!delivery) notFound("Webhook delivery not found");
    const subscription = this.store.getState().webhookSubscriptions.find((item) => item.id === delivery.subscriptionId);
    const before = clone(delivery);
    this.webhookEngine.retry(delivery, subscription);
    this.store.save();
    this.store.audit(actor, "webhook_delivery.retried", "WebhookDelivery", delivery.id, before, delivery);
    return clone(delivery);
  }

  listWebhookDeliveries(actor: RequestActor): any[] {
    return this.store.snapshot().webhookDeliveries.filter((item) => item.tenantId === actor.tenantId).slice(0, 100);
  }

  listEnvironments(actor: RequestActor): any[] {
    return this.store.snapshot().environments.filter((item) => item.tenantId === actor.tenantId && item.status !== "archived").map((item) => ({ ...item, variables: redactVariables(item.variables) }));
  }

  createEnvironment(actor: RequestActor, input: any): Environment {
    assertRequired(input?.name, "name");
    const now = nowIso();
    const env: Environment = {
      id: input?.id ?? newId("env"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name: String(input.name),
      slug: input?.slug ? slugify(input.slug) : slugify(input.name),
      type: input?.type ?? "dev",
      status: input?.status ?? "active",
      variables: input?.variables ?? {},
      locked: boolOr(input?.locked, false),
      createdBy: actor.userId
    };
    const duplicate = this.store.getState().environments.some((item) => item.tenantId === actor.tenantId && item.slug === env.slug);
    if (duplicate) badRequest("Environment slug already exists");
    this.store.getState().environments.push(env);
    this.store.save();
    this.store.audit(actor, "environment.created", "Environment", env.id, undefined, { ...env, variables: redactVariables(env.variables) });
    this.events.emit(actor, "environment.created", { environmentId: env.id, slug: env.slug });
    return { ...clone(env), variables: redactVariables(env.variables) } as Environment;
  }

  listPipelines(actor: RequestActor): Pipeline[] {
    return this.store.snapshot().pipelines.filter((item) => item.tenantId === actor.tenantId && item.status !== "archived");
  }

  createPipeline(actor: RequestActor, input: any): Pipeline {
    assertRequired(input?.name, "name");
    assertRequired(input?.repository, "repository");
    const now = nowIso();
    if (input?.environmentId) this.findEnvironment(actor, input.environmentId);
    const stages = asArray<any>(input?.stages).length ? asArray<any>(input.stages) : [
      { name: "Build", type: "build", required: true },
      { name: "Test", type: "test", required: true },
      { name: "Approval", type: "approval", required: true },
      { name: "Deploy", type: "deploy", required: true }
    ];
    const pipeline: Pipeline = {
      id: input?.id ?? newId("pipe"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name: String(input.name),
      repository: String(input.repository),
      branch: String(input?.branch ?? "main"),
      environmentId: input?.environmentId,
      stages: stages.map((stage) => ({ name: String(stage.name), type: stage.type, required: boolOr(stage.required, true), config: stage.config ?? {} })),
      status: input?.status ?? "active",
      createdBy: actor.userId
    };
    this.store.getState().pipelines.push(pipeline);
    this.store.save();
    this.store.audit(actor, "pipeline.created", "Pipeline", pipeline.id, undefined, pipeline);
    this.events.emit(actor, "pipeline.created", { pipelineId: pipeline.id, repository: pipeline.repository });
    return clone(pipeline);
  }

  runPipeline(actor: RequestActor, pipelineId: string, input: any): any {
    const pipeline = this.findPipeline(actor, pipelineId);
    const run = this.pipelineEngine.createRun(actor, pipeline, input?.commitSha);
    this.store.getState().pipelineRuns.unshift(run);
    this.store.save();
    this.store.audit(actor, "pipeline_run.started", "PipelineRun", run.id, undefined, run);
    this.events.emit(actor, "pipeline_run.started", { pipelineId: pipeline.id, runId: run.id, commitSha: run.commitSha });
    return clone(run);
  }

  completePipelineStage(actor: RequestActor, runId: string, input: any): any {
    const run = this.findPipelineRun(actor, runId);
    const before = clone(run);
    this.pipelineEngine.completeCurrentStage(run, input?.success !== false, input?.log);
    this.store.save();
    this.store.audit(actor, "pipeline_run.stage_completed", "PipelineRun", run.id, before, run);
    this.events.emit(actor, "pipeline_run.stage_completed", { runId: run.id, status: run.status });
    return clone(run);
  }

  approvePipelineRun(actor: RequestActor, runId: string, input: any): any {
    const run = this.findPipelineRun(actor, runId);
    const before = clone(run);
    this.pipelineEngine.approve(run, actor, input?.approved !== false, input?.comment);
    this.store.save();
    this.store.audit(actor, "pipeline_run.approved", "PipelineRun", run.id, before, run);
    this.events.emit(actor, "pipeline_run.approved", { runId: run.id, status: run.status, approved: input?.approved !== false });
    return clone(run);
  }

  listPipelineRuns(actor: RequestActor): any[] {
    return this.store.snapshot().pipelineRuns.filter((item) => item.tenantId === actor.tenantId).slice(0, 100);
  }

  createDeployment(actor: RequestActor, input: any): Deployment {
    assertRequired(input?.environmentId, "environmentId");
    assertRequired(input?.version, "version");
    const env = this.findEnvironment(actor, input.environmentId);
    if (input?.pipelineRunId) this.findPipelineRun(actor, input.pipelineRunId);
    const now = nowIso();
    const deployment: Deployment = {
      id: input?.id ?? newId("dep"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      pipelineRunId: input?.pipelineRunId,
      environmentId: env.id,
      version: String(input.version),
      status: input?.status ?? "deployed",
      url: input?.url,
      deployedAt: now,
      createdBy: actor.userId
    };
    this.store.getState().deployments.unshift(deployment);
    this.store.save();
    this.store.audit(actor, "deployment.created", "Deployment", deployment.id, undefined, deployment);
    this.events.emit(actor, "deployment.created", { deploymentId: deployment.id, environmentId: env.id, version: deployment.version });
    return clone(deployment);
  }

  promoteDeployment(actor: RequestActor, id: string, input: any): Deployment {
    const deployment = this.findDeployment(actor, id);
    const before = clone(deployment);
    if (input?.environmentId) this.findEnvironment(actor, input.environmentId);
    deployment.environmentId = input?.environmentId ?? deployment.environmentId;
    deployment.status = "promoted";
    deployment.updatedAt = nowIso();
    deployment.deployedAt = deployment.updatedAt;
    this.store.save();
    this.store.audit(actor, "deployment.promoted", "Deployment", deployment.id, before, deployment);
    this.events.emit(actor, "deployment.promoted", { deploymentId: deployment.id, environmentId: deployment.environmentId });
    return clone(deployment);
  }

  rollbackDeployment(actor: RequestActor, id: string): Deployment {
    const deployment = this.findDeployment(actor, id);
    const before = clone(deployment);
    deployment.status = "rolled_back";
    deployment.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "deployment.rolled_back", "Deployment", deployment.id, before, deployment);
    this.events.emit(actor, "deployment.rolled_back", { deploymentId: deployment.id });
    return clone(deployment);
  }

  createDocsPage(actor: RequestActor, input: any): DocsPage {
    assertRequired(input?.title, "title");
    assertRequired(input?.body, "body");
    const now = nowIso();
    const page: DocsPage = {
      id: input?.id ?? newId("doc"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      title: String(input.title),
      slug: input?.slug ? slugify(input.slug) : slugify(input.title),
      body: String(input.body),
      tags: unique(asArray<string>(input?.tags)),
      status: input?.status ?? "draft",
      visibility: input?.visibility ?? "internal",
      createdBy: actor.userId
    };
    this.store.getState().docsPages.push(page);
    this.store.save();
    this.store.audit(actor, "docs_page.created", "DocsPage", page.id, undefined, page);
    this.events.emit(actor, "docs_page.created", { docsPageId: page.id, slug: page.slug });
    return clone(page);
  }

  publishDocsPage(actor: RequestActor, id: string): DocsPage {
    const page = this.store.getState().docsPages.find((item) => item.tenantId === actor.tenantId && item.id === id);
    if (!page) notFound("Docs page not found");
    const before = clone(page);
    page.status = "published";
    page.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "docs_page.published", "DocsPage", page.id, before, page);
    this.events.emit(actor, "docs_page.published", { docsPageId: page.id });
    return clone(page);
  }

  listDocsPages(actor: RequestActor): DocsPage[] {
    return this.store.snapshot().docsPages.filter((item) => item.tenantId === actor.tenantId && item.status !== "archived");
  }

  createChangelogEntry(actor: RequestActor, input: any): ChangelogEntry {
    assertRequired(input?.title, "title");
    assertRequired(input?.version, "version");
    const now = nowIso();
    const entry: ChangelogEntry = {
      id: input?.id ?? newId("chg"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      title: String(input.title),
      version: String(input.version),
      body: String(input?.body ?? ""),
      type: input?.type ?? "release",
      status: input?.status ?? "published",
      publishedAt: input?.status === "draft" ? undefined : now,
      createdBy: actor.userId
    };
    this.store.getState().changelogEntries.unshift(entry);
    this.store.save();
    this.store.audit(actor, "changelog.created", "ChangelogEntry", entry.id, undefined, entry);
    this.events.emit(actor, "changelog.created", { changelogId: entry.id, version: entry.version });
    return clone(entry);
  }

  listChangelog(actor: RequestActor): ChangelogEntry[] {
    return this.store.snapshot().changelogEntries.filter((item) => item.tenantId === actor.tenantId && item.status !== "archived");
  }

  ingestUsageEvent(actor: RequestActor, input: any): UsageEvent {
    assertRequired(input?.method, "method");
    assertRequired(input?.path, "path");
    const now = nowIso();
    const event: UsageEvent = {
      id: input?.id ?? newId("use"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      appId: input?.appId,
      apiKeyId: input?.apiKeyId,
      apiProductId: input?.apiProductId,
      endpointId: input?.endpointId,
      method: String(input.method).toUpperCase() as HttpMethodName,
      path: String(input.path),
      statusCode: numberOr(input?.statusCode, 200),
      latencyMs: numberOr(input?.latencyMs, 0),
      timestamp: input?.timestamp ?? now
    };
    this.store.getState().usageEvents.unshift(event);
    const key = event.apiKeyId ? this.store.getState().apiKeys.find((item) => item.id === event.apiKeyId && item.tenantId === actor.tenantId) : undefined;
    if (key) { key.lastUsedAt = now; key.updatedAt = now; }
    this.store.save();
    this.events.emit(actor, "usage_event.ingested", { usageEventId: event.id, path: event.path, statusCode: event.statusCode });
    return clone(event);
  }

  analytics(actor: RequestActor): any { return this.analyticsEngine.summarize(this.store.snapshot(), actor.tenantId); }
  eventsList(actor: RequestActor): any[] { return this.store.snapshot().events.filter((item) => item.tenantId === actor.tenantId).slice(0, 100); }
  auditLogs(actor: RequestActor): any[] { return this.store.snapshot().auditLogs.filter((item) => item.tenantId === actor.tenantId).slice(0, 100); }

  private findApp(actor: RequestActor, id: string): DeveloperApp { const app = this.store.getState().developerApps.find((item) => item.tenantId === actor.tenantId && item.id === id); if (!app) notFound("Developer app not found"); return app; }
  private findApiProduct(actor: RequestActor, id: string): ApiProduct { const api = this.store.getState().apiProducts.find((item) => item.tenantId === actor.tenantId && item.id === id); if (!api) notFound("API product not found"); return api; }
  private findEndpoint(actor: RequestActor, id: string): ApiEndpoint { const endpoint = this.store.getState().apiEndpoints.find((item) => item.tenantId === actor.tenantId && item.id === id); if (!endpoint) notFound("API endpoint not found"); return endpoint; }
  private findSdkPackage(actor: RequestActor, id: string): SdkPackage { const pkg = this.store.getState().sdkPackages.find((item) => item.tenantId === actor.tenantId && item.id === id); if (!pkg) notFound("SDK package not found"); return pkg; }
  private findEnvironment(actor: RequestActor, id: string): Environment { const env = this.store.getState().environments.find((item) => item.tenantId === actor.tenantId && item.id === id); if (!env) notFound("Environment not found"); return env; }
  private findPipeline(actor: RequestActor, id: string): Pipeline { const pipeline = this.store.getState().pipelines.find((item) => item.tenantId === actor.tenantId && item.id === id); if (!pipeline) notFound("Pipeline not found"); return pipeline; }
  private findPipelineRun(actor: RequestActor, id: string): any { const run = this.store.getState().pipelineRuns.find((item) => item.tenantId === actor.tenantId && item.id === id); if (!run) notFound("Pipeline run not found"); return run; }
  private findDeployment(actor: RequestActor, id: string): Deployment { const deployment = this.store.getState().deployments.find((item) => item.tenantId === actor.tenantId && item.id === id); if (!deployment) notFound("Deployment not found"); return deployment; }
}
