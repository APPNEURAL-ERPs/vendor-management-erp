import { PartnerItem, PartnerOverview, PartnerPolicy, PartnerWorkflow, PartnerWorkRun, EntityStatus, Priority, RequestActor, WorkStatus } from "../core/domain";
import { badRequest, conflict, notFound } from "../core/errors";
import { newId, nowIso } from "../core/id";
import { clone, ensureObject, ensureString, normalizeStringArray, optionalString, pickQuery, parseNumberQuery } from "../core/utils";
import { DataStore } from "../core/datastore";
import { EventBus } from "../core/event-bus";

export class PartnerService {
  constructor(private readonly store: DataStore, private readonly events: EventBus) {}

  overview(actor: RequestActor): PartnerOverview {
    const state = this.store.getState();
    const tenantId = actor.tenantId;
    return clone({
      counts: {
        items: state.items.filter((item) => item.tenantId === tenantId && item.status !== "archived").length,
        activeItems: state.items.filter((item) => item.tenantId === tenantId && item.status === "active").length,
        workflows: state.workflows.filter((item) => item.tenantId === tenantId && item.status !== "archived").length,
        activeWorkflows: state.workflows.filter((item) => item.tenantId === tenantId && item.status === "active").length,
        workRuns: state.workRuns.filter((item) => item.tenantId === tenantId).length,
        openRuns: state.workRuns.filter((item) => item.tenantId === tenantId && ["todo", "in_progress", "blocked"].includes(item.status)).length,
        policies: state.policies.filter((item) => item.tenantId === tenantId && item.status !== "archived").length
      },
      recentItems: state.items.filter((item) => item.tenantId === tenantId).slice(0, 10),
      recentRuns: state.workRuns.filter((item) => item.tenantId === tenantId).slice(0, 10),
      recentEvents: state.events.filter((item) => item.tenantId === tenantId).slice(0, 10)
    });
  }

  listItems(actor: RequestActor, query?: URLSearchParams): PartnerItem[] {
    const search = query ? pickQuery(query, "search") : undefined;
    const category = query ? pickQuery(query, "category") : undefined;
    const limit = query ? parseNumberQuery(query, "limit", 100) : 100;
    return clone(this.store.getState().items.filter((item) => {
      if (item.tenantId !== actor.tenantId || item.status === "archived") return false;
      if (category && item.category !== category) return false;
      if (search) {
        const haystack = [item.key, item.title, item.description, item.category, item.ownerTeam, item.tags.join(" ")].join(" ").toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    }).slice(0, limit));
  }

  createItem(actor: RequestActor, input: Partial<PartnerItem>): PartnerItem {
    const state = this.store.getState();
    const key = normalizeKey(input.key ?? input.title);
    this.ensureUnique(state.items, actor.tenantId, key, "Item");
    const now = nowIso();
    const item: PartnerItem = {
      id: newId("item"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key,
      title: ensureString(input.title, "title"),
      description: optionalString(input.description),
      category: ensureString(input.category ?? "agency", "category"),
      ownerTeam: ensureString(input.ownerTeam ?? "Partner", "ownerTeam"),
      status: this.ensureStatus(input.status ?? "active"),
      priority: this.ensurePriority(input.priority ?? "normal"),
      tags: normalizeStringArray(input.tags, "tags"),
      metadata: ensureObject(input.metadata, "metadata"),
      updatedBy: actor.userId
    };
    state.items.unshift(item);
    this.store.save();
    this.store.audit(actor, "partneros.item.create", "item", item.id, undefined, item);
    this.events.publish(actor, "partneros.item.created", { itemKey: item.key });
    return clone(item);
  }

  updateItem(actor: RequestActor, key: string, input: Partial<PartnerItem>): PartnerItem {
    const item = this.findItem(actor, key);
    const before = clone(item);
    if (input.title !== undefined) item.title = ensureString(input.title, "title");
    if (input.description !== undefined) item.description = optionalString(input.description);
    if (input.category !== undefined) item.category = ensureString(input.category, "category");
    if (input.ownerTeam !== undefined) item.ownerTeam = ensureString(input.ownerTeam, "ownerTeam");
    if (input.status !== undefined) item.status = this.ensureStatus(input.status);
    if (input.priority !== undefined) item.priority = this.ensurePriority(input.priority);
    if (input.tags !== undefined) item.tags = normalizeStringArray(input.tags, "tags");
    if (input.metadata !== undefined) item.metadata = ensureObject(input.metadata, "metadata");
    item.updatedAt = nowIso();
    item.updatedBy = actor.userId;
    this.store.save();
    this.store.audit(actor, "partneros.item.update", "item", item.id, before, item);
    this.events.publish(actor, "partneros.item.updated", { itemKey: item.key });
    return clone(item);
  }

  archiveItem(actor: RequestActor, key: string): PartnerItem {
    return this.updateItem(actor, key, { status: "archived" });
  }

  listWorkflows(actor: RequestActor): PartnerWorkflow[] {
    return clone(this.store.getState().workflows.filter((item) => item.tenantId === actor.tenantId && item.status !== "archived"));
  }

  createWorkflow(actor: RequestActor, input: Partial<PartnerWorkflow>): PartnerWorkflow {
    const state = this.store.getState();
    const key = normalizeKey(input.key ?? input.name);
    this.ensureUnique(state.workflows, actor.tenantId, key, "Workflow");
    const now = nowIso();
    const workflow: PartnerWorkflow = {
      id: newId("flow"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key,
      name: ensureString(input.name, "name"),
      description: optionalString(input.description),
      category: ensureString(input.category ?? "reseller", "category"),
      status: this.ensureStatus(input.status ?? "active"),
      itemKeys: normalizeStringArray(input.itemKeys, "itemKeys"),
      steps: normalizeStringArray(input.steps, "steps"),
      ownerTeam: ensureString(input.ownerTeam ?? "Partner", "ownerTeam"),
      updatedBy: actor.userId
    };
    state.workflows.unshift(workflow);
    this.store.save();
    this.store.audit(actor, "partneros.workflow.create", "workflow", workflow.id, undefined, workflow);
    this.events.publish(actor, "partneros.workflow.created", { workflowKey: workflow.key });
    return clone(workflow);
  }

  startWorkflow(actor: RequestActor, key: string, input: Record<string, unknown> = {}): PartnerWorkRun {
    const workflow = this.findWorkflow(actor, key);
    if (workflow.status !== "active") badRequest("Only active workflows can be started");
    const now = nowIso();
    const run: PartnerWorkRun = {
      id: newId("run"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      workflowKey: workflow.key,
      status: "in_progress",
      requestedBy: actor.userId,
      currentStep: workflow.steps[0],
      context: ensureObject(input.context ?? input, "context")
    };
    this.store.getState().workRuns.unshift(run);
    this.store.save();
    this.store.audit(actor, "partneros.run.create", "work_run", run.id, undefined, run);
    this.events.publish(actor, "partneros.workflow.started", { runId: run.id, workflowKey: run.workflowKey });
    return clone(run);
  }

  updateRun(actor: RequestActor, id: string, input: Partial<PartnerWorkRun>): PartnerWorkRun {
    const run = this.findRun(actor, id);
    const before = clone(run);
    run.status = this.ensureWorkStatus(input.status);
    if (input.currentStep !== undefined) run.currentStep = optionalString(input.currentStep);
    if (input.context !== undefined) run.context = ensureObject(input.context, "context");
    run.updatedAt = nowIso();
    if (["done", "cancelled"].includes(run.status)) run.completedAt = run.updatedAt;
    this.store.save();
    this.store.audit(actor, "partneros.run.update", "work_run", run.id, before, run);
    this.events.publish(actor, "partneros.run.updated", { runId: run.id, status: run.status });
    return clone(run);
  }

  listRuns(actor: RequestActor): PartnerWorkRun[] {
    return clone(this.store.getState().workRuns.filter((item) => item.tenantId === actor.tenantId));
  }

  createPolicy(actor: RequestActor, input: Partial<PartnerPolicy>): PartnerPolicy {
    const state = this.store.getState();
    const key = normalizeKey(input.key ?? input.title);
    this.ensureUnique(state.policies, actor.tenantId, key, "Policy");
    const now = nowIso();
    const policy: PartnerPolicy = {
      id: newId("pol"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key,
      title: ensureString(input.title, "title"),
      body: ensureString(input.body, "body"),
      status: this.ensureStatus(input.status ?? "active"),
      ownerTeam: ensureString(input.ownerTeam ?? "Partner", "ownerTeam"),
      updatedBy: actor.userId
    };
    state.policies.unshift(policy);
    this.store.save();
    this.store.audit(actor, "partneros.policy.create", "policy", policy.id, undefined, policy);
    this.events.publish(actor, "partneros.policy.created", { policyKey: policy.key });
    return clone(policy);
  }

  listPolicies(actor: RequestActor): PartnerPolicy[] {
    return clone(this.store.getState().policies.filter((item) => item.tenantId === actor.tenantId && item.status !== "archived"));
  }

  listEvents(actor: RequestActor) {
    return clone(this.store.getState().events.filter((item) => item.tenantId === actor.tenantId));
  }

  auditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((item) => item.tenantId === actor.tenantId));
  }

  private findItem(actor: RequestActor, key: string): PartnerItem {
    const item = this.store.getState().items.find((entry) => entry.tenantId === actor.tenantId && entry.status !== "archived" && (entry.key === key || entry.id === key));
    if (!item) notFound("Item not found");
    return item;
  }

  private findWorkflow(actor: RequestActor, key: string): PartnerWorkflow {
    const workflow = this.store.getState().workflows.find((entry) => entry.tenantId === actor.tenantId && entry.status !== "archived" && (entry.key === key || entry.id === key));
    if (!workflow) notFound("Workflow not found");
    return workflow;
  }

  private findRun(actor: RequestActor, id: string): PartnerWorkRun {
    const run = this.store.getState().workRuns.find((entry) => entry.tenantId === actor.tenantId && entry.id === id);
    if (!run) notFound("Run not found");
    return run;
  }

  private ensureUnique(items: Array<{ tenantId: string; key: string }>, tenantId: string, key: string, label: string): void {
    if (items.some((item) => item.tenantId === tenantId && item.key === key)) conflict(`${label} key already exists`);
  }

  private ensureStatus(value: unknown): EntityStatus {
    const status = String(value) as EntityStatus;
    if (!["draft", "active", "paused", "archived"].includes(status)) badRequest("Invalid status");
    return status;
  }

  private ensurePriority(value: unknown): Priority {
    const priority = String(value) as Priority;
    if (!["low", "normal", "high", "critical"].includes(priority)) badRequest("Invalid priority");
    return priority;
  }

  private ensureWorkStatus(value: unknown): WorkStatus {
    const status = String(value) as WorkStatus;
    if (!["todo", "in_progress", "blocked", "done", "cancelled"].includes(status)) badRequest("Invalid work status");
    return status;
  }
}

function normalizeKey(value: unknown): string {
  return ensureString(value, "key").toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/-+/g, "-");
}
