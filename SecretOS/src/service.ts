import { DataStore } from "./core/datastore";
import { nowIso, plusDays, newId, randomToken, randomApiKey } from "./core/id";
import { clone, ensureString, ensureNumber, ensureBoolean, ensureArray, ensureObject, optionalObject, pickQuery, maskSecret, maskApiKey, countBy } from "./core/utils";
import { badRequest, notFound, conflict } from "./core/errors";
import {
  RequestActor,
  Secret,
  SecretVersion,
  RotationPolicy,
  RotationRun,
  AccessGrant,
  AccessRequest,
  SecretAuditLog,
  LeakEvent,
  SecretRisk,
  APIKey,
  Credential,
  EncryptionKey,
  SecretIncident,
  SecretPolicy,
  SecretBackup,
  SecretUsage,
  SecretNamespace,
  SecretOverview,
  SecretDashboard,
  SecretType,
  SecretStatus,
  AccessLevel
} from "./domain";

export class SecretOSService {
  constructor(private readonly store: DataStore) {}

  getServiceInfo(): { service: string; status: string; version: string } {
    return { service: "SecretOS", status: "operational", version: "1.0.0" };
  }

  overview(actor: RequestActor): SecretOverview {
    const state = this.store.getState();
    const secrets = state.secrets.filter(s => s.tenantId === actor.tenantId);
    const active = secrets.filter(s => s.status === "active");
    const now = new Date();

    return {
      total: secrets.length,
      active: active.length,
      expired: secrets.filter(s => s.expiresAt && new Date(s.expiresAt) < now).length,
      rotated: secrets.filter(s => s.status === "rotated").length,
      compromised: secrets.filter(s => s.status === "compromised").length,
      dueForRotation: secrets.filter(s => {
        if (!s.expiresAt || !s.rotationPolicyId) return false;
        const daysUntilExpiry = Math.ceil((new Date(s.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      }).length,
      highRisk: state.secretRisks.filter(r => r.tenantId === actor.tenantId && r.severity === "critical" && r.status === "open").length,
      healthScore: this.calculateHealthScore(state, actor.tenantId),
      byType: countBy(active, "type"),
      byEnvironment: countBy(active, "environment")
    };
  }

  dashboard(actor: RequestActor): SecretDashboard {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    const now = new Date();

    return {
      overview: this.overview(actor),
      recentActivity: state.usage.filter(u => u.tenantId === tenant).slice(0, 10),
      expiringSoon: state.secrets.filter(s => {
        if (!s.expiresAt || s.tenantId !== tenant) return false;
        const daysUntilExpiry = Math.ceil((new Date(s.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 7 && daysUntilExpiry > 0 && s.status === "active";
      }),
      highRisk: state.secretRisks.filter(r => r.tenantId === tenant && r.severity === "high" && r.status === "open").slice(0, 5),
      pendingRequests: state.accessRequests.filter(r => r.tenantId === tenant && r.status === "pending").slice(0, 10),
      rotationDue: state.secrets.filter(s => {
        if (!s.expiresAt || s.tenantId !== tenant) return false;
        const daysUntilExpiry = Math.ceil((new Date(s.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 14 && daysUntilExpiry > 0;
      }),
      recentAudits: state.auditLogs.filter(a => a.tenantId === tenant).slice(0, 10)
    };
  }

  listSecrets(actor: RequestActor, query?: URLSearchParams): Secret[] {
    const state = this.store.getState();
    const search = pickQuery(query, "search")?.toLowerCase();
    const type = pickQuery(query, "type");
    const env = pickQuery(query, "environment");
    const status = pickQuery(query, "status");

    return clone(state.secrets.filter(s => {
      if (s.tenantId !== actor.tenantId) return false;
      if (search && !`${s.key} ${s.name} ${s.description ?? ""}`.toLowerCase().includes(search)) return false;
      if (type && s.type !== type) return false;
      if (env && s.environment !== env) return false;
      if (status && s.status !== status) return false;
      return true;
    }));
  }

  getSecret(id: string, actor: RequestActor): Secret {
    const secret = this.store.getState().secrets.find(s => s.id === id && s.tenantId === actor.tenantId);
    if (!secret) notFound("Secret not found");
    return clone(secret);
  }

  createSecret(input: unknown, actor: RequestActor): Secret {
    const body = ensureObject(input, "secret");
    const state = this.store.getState();
    const key = ensureString(body.key, "secret.key");

    if (state.secrets.some(s => s.tenantId === actor.tenantId && s.key === key)) {
      conflict(`Secret with key '${key}' already exists`);
    }

    const secret: Secret = {
      id: newId("secret"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "secret.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "generic") as SecretType,
      environment: String(body.environment ?? "development") as Secret["environment"],
      status: "active",
      maskedValue: body.value ? maskSecret(String(body.value)) : "****",
      tags: ensureArray<string>(body.tags, "secret.tags", []),
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      rotationPolicyId: body.rotationPolicyId ? String(body.rotationPolicyId) : undefined,
      expiresAt: body.expiresAt ? String(body.expiresAt) : undefined,
      lastRotatedAt: body.value ? nowIso() : undefined,
      usageCount: 0,
      dependencies: [],
      metadata: optionalObject(body.metadata),
      createdBy: actor.userId
    };

    state.secrets.push(secret);

    if (body.value) {
      state.secretVersions.push({
        id: newId("version"),
        tenantId: actor.tenantId,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        secretId: secret.id,
        version: 1,
        maskedValue: secret.maskedValue,
        status: "active",
        rotatedAt: nowIso(),
        rotatedBy: actor.userId,
        expiresAt: secret.expiresAt
      });
    }

    this.store.save();
    this.store.audit(actor, "created", "secret", secret.id, undefined, secret);
    return clone(secret);
  }

  updateSecret(id: string, input: unknown, actor: RequestActor): Secret {
    const body = ensureObject(input, "secret");
    const state = this.store.getState();
    const secret = state.secrets.find(s => s.id === id && s.tenantId === actor.tenantId);
    if (!secret) notFound("Secret not found");

    const before = clone(secret);

    if (body.name !== undefined) secret.name = String(body.name);
    if (body.description !== undefined) secret.description = String(body.description);
    if (body.tags !== undefined) secret.tags = ensureArray<string>(body.tags, "tags");
    if (body.ownerId !== undefined) secret.ownerId = String(body.ownerId);
    if (body.rotationPolicyId !== undefined) secret.rotationPolicyId = String(body.rotationPolicyId);
    if (body.metadata !== undefined) secret.metadata = optionalObject(body.metadata);

    secret.updatedAt = nowIso();
    secret.updatedBy = actor.userId;

    this.store.save();
    this.store.audit(actor, "updated", "secret", secret.id, before, secret);
    return clone(secret);
  }

  rotateSecret(id: string, input: unknown, actor: RequestActor): Secret {
    const body = ensureObject(input, "secret");
    const state = this.store.getState();
    const secret = state.secrets.find(s => s.id === id && s.tenantId === actor.tenantId);
    if (!secret) notFound("Secret not found");

    if (secret.status !== "active") {
      badRequest("Only active secrets can be rotated");
    }

    const before = clone(secret);
    const newVersion = state.secretVersions.filter(v => v.secretId === id).length + 1;
    const newValue = ensureString(body.value, "secret.value");
    const newMaskedValue = maskSecret(newValue);

    state.secretVersions.filter(v => v.secretId === id && v.status === "active").forEach(v => {
      v.status = "superseded";
    });

    state.secretVersions.push({
      id: newId("version"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      secretId: secret.id,
      version: newVersion,
      maskedValue: newMaskedValue,
      status: "active",
      rotatedAt: nowIso(),
      rotatedBy: actor.userId
    });

    secret.maskedValue = newMaskedValue;
    secret.status = "active";
    secret.lastRotatedAt = nowIso();
    secret.updatedAt = nowIso();
    secret.updatedBy = actor.userId;
    secret.usageCount = 0;

    const policy = secret.rotationPolicyId ? state.rotationPolicies.find(p => p.id === secret.rotationPolicyId) : null;
    if (policy) {
      secret.expiresAt = plusDays(policy.intervalDays);
    }

    this.store.save();
    this.store.audit(actor, "rotated", "secret", secret.id, before, secret);

    return clone(secret);
  }

  revokeSecret(id: string, actor: RequestActor): Secret {
    const state = this.store.getState();
    const secret = state.secrets.find(s => s.id === id && s.tenantId === actor.tenantId);
    if (!secret) notFound("Secret not found");

    const before = clone(secret);
    secret.status = "disabled";
    secret.updatedAt = nowIso();
    secret.updatedBy = actor.userId;

    this.store.save();
    this.store.audit(actor, "revoked", "secret", secret.id, before, secret);
    return clone(secret);
  }

  deleteSecret(id: string, actor: RequestActor): void {
    const state = this.store.getState();
    const index = state.secrets.findIndex(s => s.id === id && s.tenantId === actor.tenantId);
    if (index === -1) notFound("Secret not found");

    const before = clone(state.secrets[index]);
    state.secrets[index].status = "deleted";
    state.secrets[index].updatedAt = nowIso();
    state.secrets[index].updatedBy = actor.userId;

    this.store.save();
    this.store.audit(actor, "deleted", "secret", id, before, undefined);
  }

  getSecretVersions(secretId: string, actor: RequestActor): SecretVersion[] {
    const state = this.store.getState();
    const secret = state.secrets.find(s => s.id === secretId && s.tenantId === actor.tenantId);
    if (!secret) notFound("Secret not found");

    return clone(state.secretVersions.filter(v => v.secretId === secretId).sort((a, b) => b.version - a.version));
  }

  listRotationPolicies(actor: RequestActor): RotationPolicy[] {
    return clone(this.store.getState().rotationPolicies.filter(p => p.tenantId === actor.tenantId));
  }

  createRotationPolicy(input: unknown, actor: RequestActor): RotationPolicy {
    const body = ensureObject(input, "policy");
    const state = this.store.getState();
    const key = ensureString(body.key, "policy.key");

    if (state.rotationPolicies.some(p => p.tenantId === actor.tenantId && p.key === key)) {
      conflict(`Policy with key '${key}' already exists`);
    }

    const policy: RotationPolicy = {
      id: newId("policy"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "policy.name"),
      description: body.description ? String(body.description) : undefined,
      intervalDays: ensureNumber(body.intervalDays, "policy.intervalDays"),
      autoRotate: ensureBoolean(body.autoRotate, false),
      approvalRequired: ensureBoolean(body.approvalRequired, false),
      notifyBeforeDays: ensureNumber(body.notifyBeforeDays, "policy.notifyBeforeDays", 7),
      status: "active",
      createdBy: actor.userId
    };

    state.rotationPolicies.push(policy);
    this.store.save();
    this.store.audit(actor, "created", "rotationPolicy", policy.id, undefined, policy);
    return clone(policy);
  }

  listAccessRequests(actor: RequestActor, query?: URLSearchParams): AccessRequest[] {
    const secretId = pickQuery(query, "secretId");
    const status = pickQuery(query, "status");

    return clone(this.store.getState().accessRequests.filter(r => {
      if (r.tenantId !== actor.tenantId) return false;
      if (secretId && r.secretId !== secretId) return false;
      if (status && r.status !== status) return false;
      return true;
    }));
  }

  createAccessRequest(secretId: string, input: unknown, actor: RequestActor): AccessRequest {
    const body = ensureObject(input, "accessRequest");
    const state = this.store.getState();
    const secret = state.secrets.find(s => s.id === secretId && s.tenantId === actor.tenantId);
    if (!secret) notFound("Secret not found");

    const request: AccessRequest = {
      id: newId("accessreq"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      secretId,
      requesterId: actor.userId,
      requestedLevel: String(body.requestedLevel ?? "read") as AccessLevel,
      reason: ensureString(body.reason, "accessRequest.reason"),
      status: "pending"
    };

    state.accessRequests.push(request);
    this.store.save();
    this.store.audit(actor, "created", "accessRequest", request.id, undefined, request);
    return clone(request);
  }

  approveAccessRequest(id: string, actor: RequestActor): AccessRequest {
    const state = this.store.getState();
    const request = state.accessRequests.find(r => r.id === id && r.tenantId === actor.tenantId);
    if (!request) notFound("Access request not found");

    request.status = "approved";
    request.reviewedBy = actor.userId;
    request.reviewedAt = nowIso();

    state.accessGrants.push({
      id: newId("grant"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      secretId: request.secretId,
      granteeId: request.requesterId,
      granteeType: "user",
      accessLevel: request.requestedLevel,
      reason: request.reason,
      approvedBy: actor.userId,
      status: "active",
      accessCount: 0
    });

    this.store.save();
    this.store.audit(actor, "approved", "accessRequest", request.id, undefined, request);
    return clone(request);
  }

  denyAccessRequest(id: string, input: unknown, actor: RequestActor): AccessRequest {
    const body = ensureObject(input, "body");
    const state = this.store.getState();
    const request = state.accessRequests.find(r => r.id === id && r.tenantId === actor.tenantId);
    if (!request) notFound("Access request not found");

    request.status = "denied";
    request.reviewedBy = actor.userId;
    request.reviewedAt = nowIso();
    request.notes = body.notes ? String(body.notes) : undefined;

    this.store.save();
    this.store.audit(actor, "denied", "accessRequest", request.id, undefined, request);
    return clone(request);
  }

  listAPIKeys(actor: RequestActor, query?: URLSearchParams): APIKey[] {
    const state = this.store.getState();
    const type = pickQuery(query, "type");
    const status = pickQuery(query, "status");

    return clone(state.apiKeys.filter(k => {
      if (k.tenantId !== actor.tenantId) return false;
      if (type && k.type !== type) return false;
      if (status && k.status !== status) return false;
      return true;
    }));
  }

  createAPIKey(input: unknown, actor: RequestActor): APIKey {
    const body = ensureObject(input, "apiKey");
    const state = this.store.getState();
    const name = ensureString(body.name, "apiKey.name");
    const keyValue = body.value ? String(body.value) : randomApiKey();

    const apiKey: APIKey = {
      id: newId("apikey"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: name,
      name,
      description: body.description ? String(body.description) : undefined,
      ownerId: body.ownerId ? String(body.ownerId) : actor.userId,
      ownerType: String(body.ownerType ?? "user") as any,
      keyPrefix: keyValue.split("_")[0] + "_" + keyValue.slice(2, 10),
      keyHash: `hash_${keyValue.slice(-20)}`,
      type: String(body.type ?? "private") as any,
      scopes: ensureArray<string>(body.scopes, "apiKey.scopes", []),
      environment: String(body.environment ?? "development") as any,
      status: "active",
      expiresAt: body.expiresAt ? String(body.expiresAt) : undefined,
      usageCount: 0,
      createdBy: actor.userId
    };

    state.apiKeys.push(apiKey);
    this.store.save();
    this.store.audit(actor, "created", "apiKey", apiKey.id, undefined, { name: apiKey.name, type: apiKey.type });
    return clone(apiKey);
  }

  revokeAPIKey(id: string, actor: RequestActor): APIKey {
    const state = this.store.getState();
    const apiKey = state.apiKeys.find(k => k.id === id && k.tenantId === actor.tenantId);
    if (!apiKey) notFound("API key not found");

    apiKey.status = "revoked";
    apiKey.revokedAt = nowIso();
    apiKey.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "revoked", "apiKey", id, undefined, apiKey);
    return clone(apiKey);
  }

  listCredentials(actor: RequestActor, query?: URLSearchParams): Credential[] {
    const state = this.store.getState();
    const type = pickQuery(query, "type");
    const env = pickQuery(query, "environment");

    return clone(state.credentials.filter(c => {
      if (c.tenantId !== actor.tenantId) return false;
      if (type && c.type !== type) return false;
      if (env && c.environment !== env) return false;
      return true;
    }));
  }

  createCredential(input: unknown, actor: RequestActor): Credential {
    const body = ensureObject(input, "credential");
    const state = this.store.getState();
    const key = ensureString(body.key, "credential.key");

    const credential: Credential = {
      id: newId("cred"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "credential.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "generic") as any,
      provider: ensureString(body.provider, "credential.provider"),
      environment: String(body.environment ?? "development") as any,
      status: "active",
      maskedValue: body.value ? maskSecret(String(body.value)) : "****",
      username: body.username ? String(body.username) : undefined,
      rotationPolicyId: body.rotationPolicyId ? String(body.rotationPolicyId) : undefined,
      expiresAt: body.expiresAt ? String(body.expiresAt) : undefined,
      lastRotatedAt: body.value ? nowIso() : undefined,
      metadata: optionalObject(body.metadata),
      createdBy: actor.userId
    };

    state.credentials.push(credential);
    this.store.save();
    this.store.audit(actor, "created", "credential", credential.id, undefined, credential);
    return clone(credential);
  }

  listSecretRisks(actor: RequestActor, query?: URLSearchParams): SecretRisk[] {
    const state = this.store.getState();
    const secretId = pickQuery(query, "secretId");
    const status = pickQuery(query, "status");
    const severity = pickQuery(query, "severity");

    return clone(state.secretRisks.filter(r => {
      if (r.tenantId !== actor.tenantId) return false;
      if (secretId && r.secretId !== secretId) return false;
      if (status && r.status !== status) return false;
      if (severity && r.severity !== severity) return false;
      return true;
    }));
  }

  createLeakEvent(input: unknown, actor: RequestActor): LeakEvent {
    const body = ensureObject(input, "leakEvent");
    const state = this.store.getState();

    const event: LeakEvent = {
      id: newId("leak"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      secretId: ensureString(body.secretId, "leakEvent.secretId"),
      leakType: String(body.leakType ?? "log_file") as any,
      severity: String(body.severity ?? "high") as any,
      source: ensureString(body.source, "leakEvent.source"),
      detectedAt: nowIso(),
      status: "detected",
      responseActions: [],
      affectedVersions: ensureArray<number>(body.affectedVersions, "affectedVersions", [1])
    };

    state.leakEvents.push(event);

    const secret = state.secrets.find(s => s.id === event.secretId);
    if (secret) {
      secret.status = "compromised";
      secret.updatedAt = nowIso();
    }

    this.store.save();
    this.store.audit(actor, "created", "leakEvent", event.id, undefined, event);
    return clone(event);
  }

  scanForLeaks(input: unknown, actor: RequestActor): { detected: boolean; matches: Array<{ pattern: string; position: number }> } {
    const body = ensureObject(input, "scan");
    const text = ensureString(body.text, "scan.text");

    const patterns = [
      { pattern: /sk[-_][a-zA-Z0-9]{32,}/g, name: "OpenAI-style API key" },
      { pattern: /rzp_live_[a-zA-Z0-9]{14,}/g, name: "Razorpay key" },
      { pattern: /ghp_[a-zA-Z0-9]{36,}/g, name: "GitHub token" },
      { pattern: /AKIA[0-9A-Z]{16,}/g, name: "AWS access key" },
      { pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/g, name: "Private key" }
    ];

    const matches: Array<{ pattern: string; position: number }> = [];
    for (const { pattern, name } of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        matches.push({ pattern: name, position: match.index });
      }
    }

    this.store.audit(actor, "created", "leakScan", undefined, undefined, { matchCount: matches.length });

    return { detected: matches.length > 0, matches };
  }

  listAuditLogs(actor: RequestActor, query?: URLSearchParams): SecretAuditLog[] {
    const state = this.store.getState();
    const secretId = pickQuery(query, "secretId");
    const action = pickQuery(query, "action");

    return clone(state.auditLogs.filter(log => {
      if (log.tenantId !== actor.tenantId) return false;
      if (secretId && log.secretId !== secretId) return false;
      if (action && log.action !== action) return false;
      return true;
    }).slice(0, 100));
  }

  listUsage(actor: RequestActor, query?: URLSearchParams): SecretUsage[] {
    const state = this.store.getState();
    const secretId = pickQuery(query, "secretId");

    return clone(state.usage.filter(u => {
      if (u.tenantId !== actor.tenantId) return false;
      if (secretId && u.secretId !== secretId) return false;
      return true;
    }).slice(0, 100));
  }

  listNamespaces(actor: RequestActor): SecretNamespace[] {
    return clone(this.store.getState().namespaces.filter(n => n.tenantId === actor.tenantId));
  }

  private calculateHealthScore(state: any, tenantId: string): number {
    const secrets = state.secrets.filter((s: Secret) => s.tenantId === tenantId);
    if (secrets.length === 0) return 100;

    let score = 100;
    const now = new Date();

    for (const secret of secrets) {
      if (secret.status === "compromised") score -= 20;
      else if (secret.status === "disabled") score -= 5;
      else if (secret.status === "rotated") score -= 3;

      if (secret.expiresAt && new Date(secret.expiresAt) < now) score -= 10;
      else if (secret.expiresAt) {
        const daysUntilExpiry = Math.ceil((new Date(secret.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 7) score -= 5;
        else if (daysUntilExpiry <= 30) score -= 2;
      }

      if (!secret.rotationPolicyId) score -= 3;
      if (!secret.ownerId) score -= 2;
    }

    const risks = state.secretRisks.filter((r: SecretRisk) => r.tenantId === tenantId && r.status === "open");
    for (const risk of risks) {
      if (risk.severity === "critical") score -= 15;
      else if (risk.severity === "high") score -= 10;
      else if (risk.severity === "medium") score -= 5;
      else score -= 2;
    }

    return Math.max(0, Math.min(100, score));
  }
}
