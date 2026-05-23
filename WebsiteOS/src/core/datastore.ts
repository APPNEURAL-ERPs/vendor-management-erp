import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { WebsiteState } from "./domain";
import { nowIso } from "./utils";

export class DataStore {
  private state: WebsiteState = emptyState();
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = resolve(filePath);
    this.load();
  }

  load(): void {
    if (!existsSync(this.filePath)) {
      mkdirSync(dirname(this.filePath), { recursive: true });
      this.save();
      return;
    }
    const raw = readFileSync(this.filePath, "utf-8");
    this.state = raw.trim() ? { ...emptyState(), ...JSON.parse(raw) } : emptyState();
  }

  save(): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(this.state, null, 2));
  }

  getState(): WebsiteState {
    return this.state;
  }

  snapshot(): WebsiteState {
    return clone(this.state);
  }

  reset(nextState = emptyState()): void {
    this.state = nextState;
    this.save();
  }

  audit(
    actor: { tenantId: string; userId: string; role: string },
    action: string,
    entityType: string,
    entityId?: string,
    before?: unknown,
    after?: unknown
  ): void {
    const now = nowIso();
    const entry = {
      id: `audit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`,
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      actorId: actor.userId,
      role: actor.role,
      action,
      entityType,
      entityId,
      before,
      after,
    };
    console.log(`[AUDIT] ${now} | ${actor.role} | ${actor.userId} | ${action} | ${entityType}${entityId ? ` | ${entityId}` : ""}`);
  }
}

function emptyState(): WebsiteState {
  return {
    websites: [],
    pages: [],
    landingPages: [],
    components: [],
    forms: [],
    formSubmissions: [],
    ctas: [],
    domains: [],
    deployments: [],
    analytics: [],
    events: [],
    sitemaps: [],
    audits: [],
    croChecks: [],
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
