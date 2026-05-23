import { DataStore } from "./core/datastore";
import {
  Template,
  TemplateCategory,
  TemplateVariable,
  TemplateVersion,
  TemplateRender,
  TemplateValidation,
  TemplateOverview,
  RequestActor,
  TemplateEvent
} from "./domain";
import { badRequest, conflict, notFound } from "./core/errors";
import { newId, nowIso } from "./core/id";
import { clone, ensureArray, ensureBoolean, ensureObject, ensureString, ensureNumber, optionalObject, pickQuery } from "./core/utils";

export class TemplateService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "TemplateOS service is ready";
  }

  overview(actor: RequestActor): TemplateOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    const templates = state.templates.filter((t) => t.tenantId === tenant);
    const renders = state.renders.filter((r) => r.tenantId === tenant);

    const byType: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    templates.forEach((t) => {
      byType[t.type] = (byType[t.type] ?? 0) + 1;
      if (t.categoryId) {
        const category = state.categories.find((c) => c.id === t.categoryId);
        if (category) byCategory[category.name] = (byCategory[category.name] ?? 0) + 1;
      }
    });

    return {
      templates: {
        total: templates.length,
        active: templates.filter((t) => t.status === "published").length,
        draft: templates.filter((t) => t.status === "draft").length,
        published: templates.filter((t) => t.status === "published").length
      },
      categories: {
        total: state.categories.filter((c) => c.tenantId === tenant).length,
        active: state.categories.filter((c) => c.tenantId === tenant && c.status === "active").length
      },
      renders: {
        total: renders.length,
        success: renders.filter((r) => r.status === "success").length,
        errors: renders.filter((r) => r.status === "error").length
      },
      byType,
      byCategory
    };
  }

  listTemplates(actor: RequestActor, query?: URLSearchParams): Template[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const categoryId = pickQuery(query, "categoryId");
    const type = pickQuery(query, "type");
    const status = pickQuery(query, "status");

    return clone(this.store.getState().templates.filter((t) => {
      if (t.tenantId !== actor.tenantId) return false;
      if (search && !`${t.key} ${t.name} ${t.description ?? ""}`.toLowerCase().includes(search)) return false;
      if (categoryId && t.categoryId !== categoryId) return false;
      if (type && t.type !== type) return false;
      if (status && t.status !== status) return false;
      return true;
    }));
  }

  getTemplate(id: string, actor: RequestActor): Template {
    const template = this.store.getState().templates.find((t) => t.id === id && t.tenantId === actor.tenantId);
    if (!template) notFound("Template not found");
    return clone(template);
  }

  getTemplateByKey(key: string, actor: RequestActor): Template {
    const template = this.store.getState().templates.find((t) => t.key === key && t.tenantId === actor.tenantId);
    if (!template) notFound("Template not found");
    return clone(template);
  }

  createTemplate(input: unknown, actor: RequestActor): Template {
    const body = ensureObject(input, "template");
    const state = this.store.getState();
    const key = ensureString(body.key, "template.key");
    if (state.templates.some((t) => t.tenantId === actor.tenantId && t.key === key)) conflict(`Template key '${key}' already exists`);

    const content = ensureString(body.content, "template.content");
    const variables = this.extractVariables(content);

    const template: Template = {
      id: newId("tpl"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "template.name"),
      description: body.description ? String(body.description) : undefined,
      categoryId: body.categoryId ? String(body.categoryId) : undefined,
      type: ensureString(body.type, "template.type", "document"),
      status: String(body.status ?? "draft") as Template["status"],
      tags: ensureArray<string>(body.tags, "template.tags"),
      activeVersion: 1,
      versions: [{
        version: 1,
        content,
        variables,
        notes: "Initial version",
        createdBy: actor.userId,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        tenantId: actor.tenantId,
        id: newId("tplv")
      }],
      metadata: optionalObject(body.metadata),
      createdBy: actor.userId
    };

    state.templates.push(template);
    this.store.save();
    this.store.audit(actor, "template.create", "template", template.id, undefined, template);
    this.emitEvent(actor, "template.created", { templateId: template.id, templateKey: template.key });

    return clone(template);
  }

  updateTemplate(id: string, input: unknown, actor: RequestActor): Template {
    const body = ensureObject(input, "template");
    const state = this.store.getState();
    const template = state.templates.find((t) => t.id === id && t.tenantId === actor.tenantId);
    if (!template) notFound("Template not found");

    const before = clone(template);

    if (body.name !== undefined) template.name = String(body.name);
    if (body.description !== undefined) template.description = String(body.description);
    if (body.categoryId !== undefined) template.categoryId = body.categoryId ? String(body.categoryId) : undefined;
    if (body.type !== undefined) template.type = String(body.type);
    if (body.status !== undefined) template.status = String(body.status) as Template["status"];
    if (body.tags !== undefined) template.tags = ensureArray<string>(body.tags, "tags");
    if (body.metadata !== undefined) template.metadata = optionalObject(body.metadata);

    if (body.publish && template.status === "draft") {
      template.status = "published";
      template.publishedAt = nowIso();
    }

    template.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "template.update", "template", template.id, before, template);

    return clone(template);
  }

  addTemplateVersion(id: string, input: unknown, actor: RequestActor): Template {
    const body = ensureObject(input, "version");
    const state = this.store.getState();
    const template = state.templates.find((t) => t.id === id && t.tenantId === actor.tenantId);
    if (!template) notFound("Template not found");

    const before = clone(template);
    const content = ensureString(body.content, "version.content");
    const version = Math.max(...template.versions.map((v) => v.version)) + 1;
    const variables = this.extractVariables(content);

    const newVersion: TemplateVersion = {
      id: newId("tplv"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      version,
      content,
      variables,
      notes: body.notes ? String(body.notes) : undefined,
      createdBy: actor.userId
    };

    template.versions.push(newVersion);
    if (ensureBoolean(body.makeActive, true)) {
      template.activeVersion = version;
    }
    template.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "template.version.add", "template", template.id, before, template);

    return clone(template);
  }

  renderTemplate(id: string, input: unknown, actor: RequestActor): TemplateRender {
    const body = optionalObject(input);
    const state = this.store.getState();
    const template = state.templates.find((t) => t.id === id && t.tenantId === actor.tenantId);
    if (!template) notFound("Template not found");

    const version = template.versions.find((v) => v.version === (body.version ?? template.activeVersion));
    if (!version) notFound("Template version not found");

    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    const variables = body.variables ?? {};
    for (const variable of version.variables) {
      if (variable.required && (variables[variable.name] === undefined || variables[variable.name] === "")) {
        errors.push(`Missing required variable: {{${variable.name}}}`);
      }
    }

    const missingPlaceholders = this.findMissingPlaceholders(version.content, variables);
    missingPlaceholders.forEach((p) => warnings.push(`Missing variable for placeholder: {{${p}}}`));

    let renderedContent = version.content;
    if (errors.length === 0) {
      renderedContent = this.replaceVariables(version.content, variables);
    }

    const render: TemplateRender = {
      id: newId("rnd"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      templateId: template.id,
      templateVersion: version.version,
      variables,
      renderedContent,
      status: errors.length > 0 ? "error" : warnings.length > 0 ? "partial" : "success",
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      durationMs: Date.now() - startTime,
      requestedBy: actor.userId
    };

    state.renders.unshift(render);
    this.store.save();
    this.store.audit(actor, "template.render", "template", template.id, undefined, { renderId: render.id, status: render.status });

    return clone(render);
  }

  validateTemplate(id: string, input: unknown, actor: RequestActor): TemplateValidation {
    const body = optionalObject(input);
    const state = this.store.getState();
    const template = state.templates.find((t) => t.id === id && t.tenantId === actor.tenantId);
    if (!template) notFound("Template not found");

    const version = template.versions.find((v) => v.version === (body.version ?? template.activeVersion));
    if (!version) notFound("Template version not found");

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!template.name || template.name.trim() === "") errors.push("Template name is required");
    if (!template.key || template.key.trim() === "") errors.push("Template key is required");
    if (!version.content || version.content.trim() === "") errors.push("Template content is required");

    const placeholderPattern = /\{\{([^}]+)\}\}/g;
    let match;
    const placeholders = new Set<string>();
    while ((match = placeholderPattern.exec(version.content)) !== null) {
      placeholders.add(match[1].trim());
    }

    const variableNames = new Set(version.variables.map((v) => v.name));
    placeholders.forEach((p) => {
      if (!variableNames.has(p)) {
        warnings.push(`Placeholder {{${p}}} has no variable definition`);
      }
    });

    version.variables.forEach((v) => {
      if (v.required && !placeholders.has(v.name)) {
        warnings.push(`Variable '${v.name}' is defined but not used in content`);
      }
    });

    const validation: TemplateValidation = {
      id: newId("val"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      templateId: template.id,
      templateVersion: version.version,
      passed: errors.length === 0,
      errors,
      warnings,
      checkedBy: actor.userId
    };

    this.store.save();
    this.store.audit(actor, "template.validate", "template", template.id, undefined, validation);

    return validation;
  }

  deleteTemplate(id: string, actor: RequestActor): void {
    const state = this.store.getState();
    const index = state.templates.findIndex((t) => t.id === id && t.tenantId === actor.tenantId);
    if (index === -1) notFound("Template not found");

    const before = state.templates[index];
    state.templates.splice(index, 1);
    this.store.save();
    this.store.audit(actor, "template.delete", "template", id, before, undefined);
  }

  listCategories(actor: RequestActor): TemplateCategory[] {
    return clone(this.store.getState().categories.filter((c) => c.tenantId === actor.tenantId));
  }

  createCategory(input: unknown, actor: RequestActor): TemplateCategory {
    const body = ensureObject(input, "category");
    const state = this.store.getState();
    const key = ensureString(body.key, "category.key");
    if (state.categories.some((c) => c.tenantId === actor.tenantId && c.key === key)) conflict(`Category key '${key}' already exists`);

    const category: TemplateCategory = {
      id: newId("cat"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "category.name"),
      description: body.description ? String(body.description) : undefined,
      parentId: body.parentId ? String(body.parentId) : undefined,
      icon: body.icon ? String(body.icon) : undefined,
      color: body.color ? String(body.color) : undefined,
      order: ensureNumber(body.order, "category.order", 0),
      status: String(body.status ?? "active") as TemplateCategory["status"],
      templateCount: 0
    };

    state.categories.push(category);
    this.store.save();
    this.store.audit(actor, "category.create", "category", category.id, undefined, category);

    return clone(category);
  }

  listVariables(actor: RequestActor, query?: URLSearchParams): TemplateVariable[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    return clone(this.store.getState().variables.filter((v) => {
      if (v.tenantId !== actor.tenantId) return false;
      if (search && !`${v.name} ${v.label}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  createVariable(input: unknown, actor: RequestActor): TemplateVariable {
    const body = ensureObject(input, "variable");
    const state = this.store.getState();
    const name = ensureString(body.name, "variable.name");

    const variable: TemplateVariable = {
      id: newId("var"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name,
      label: ensureString(body.label, "variable.label"),
      type: String(body.type ?? "text") as TemplateVariable["type"],
      description: body.description ? String(body.description) : undefined,
      required: ensureBoolean(body.required, true),
      defaultValue: body.defaultValue ? String(body.defaultValue) : undefined,
      options: body.options ? ensureArray<string>(body.options, "variable.options") : undefined,
      validationPattern: body.validationPattern ? String(body.validationPattern) : undefined,
      placeholder: body.placeholder ? String(body.placeholder) : undefined,
      helpText: body.helpText ? String(body.helpText) : undefined
    };

    state.variables.push(variable);
    this.store.save();
    this.store.audit(actor, "variable.create", "variable", variable.id, undefined, variable);

    return clone(variable);
  }

  listRenders(actor: RequestActor, query?: URLSearchParams): TemplateRender[] {
    const templateId = pickQuery(query, "templateId");
    return clone(this.store.getState().renders.filter((r) => {
      if (r.tenantId !== actor.tenantId) return false;
      if (templateId && r.templateId !== templateId) return false;
      return true;
    }));
  }

  listAuditLogs(actor: RequestActor): any[] {
    return clone(this.store.getState().auditLogs.filter((a) => a.tenantId === actor.tenantId));
  }

  private extractVariables(content: string): TemplateVariable[] {
    const placeholderPattern = /\{\{([^}]+)\}\}/g;
    const variables: TemplateVariable[] = [];
    const seen = new Set<string>();
    let match;

    while ((match = placeholderPattern.exec(content)) !== null) {
      const name = match[1].trim();
      if (!seen.has(name)) {
        seen.add(name);
        variables.push({
          id: newId("var"),
          tenantId: "",
          createdAt: nowIso(),
          updatedAt: nowIso(),
          name,
          label: this.humanizeVariableName(name),
          type: "text",
          required: true
        });
      }
    }

    return variables;
  }

  private findMissingPlaceholders(content: string, variables: Record<string, unknown>): string[] {
    const placeholderPattern = /\{\{([^}]+)\}\}/g;
    const missing: string[] = [];
    let match;

    while ((match = placeholderPattern.exec(content)) !== null) {
      const name = match[1].trim();
      if (variables[name] === undefined) {
        missing.push(name);
      }
    }

    return missing;
  }

  private replaceVariables(content: string, variables: Record<string, unknown>): string {
    return content.replace(/\{\{([^}]+)\}\}/g, (match, name) => {
      const key = name.trim();
      const value = variables[key];
      return value !== undefined ? String(value) : match;
    });
  }

  private humanizeVariableName(name: string): string {
    return name.replace(/_/g, " ").replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
  }

  private emitEvent(actor: RequestActor, type: string, data: Record<string, unknown>): void {
    const event: TemplateEvent = {
      id: newId("evt"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type,
      source: "TemplateOS",
      data
    };
    this.store.getState().events.unshift(event);
  }
}
