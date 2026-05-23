export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "template_admin" | "template_builder" | "template_viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";
export type TemplateStatus = "draft" | "review" | "approved" | "published" | "deprecated" | "archived";
export type VariableType = "text" | "number" | "date" | "currency" | "boolean" | "image" | "file" | "url" | "color" | "list" | "object" | "richtext";
export type RenderStatus = "success" | "error" | "partial";

export interface RequestActor {
  tenantId: TenantId;
  userId: UUID;
  role: Role;
}

export interface BaseEntity {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface TemplateVersion extends BaseEntity {
  version: number;
  content: string;
  variables: TemplateVariable[];
  notes?: string;
  createdBy: UUID;
}

export interface TemplateVariable extends BaseEntity {
  name: string;
  label: string;
  type: VariableType;
  description?: string;
  required: boolean;
  defaultValue?: string;
  options?: string[];
  validationPattern?: string;
  placeholder?: string;
  helpText?: string;
}

export interface Template extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  categoryId?: UUID;
  type: string;
  status: TemplateStatus;
  tags: string[];
  activeVersion: number;
  versions: TemplateVersion[];
  previewData?: Record<string, unknown>;
  dependencies?: string[];
  metadata: Record<string, unknown>;
  createdBy: UUID;
  publishedAt?: ISODate;
}

export interface TemplateCategory extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  parentId?: UUID;
  icon?: string;
  color?: string;
  order: number;
  status: EntityStatus;
  templateCount: number;
}

export interface TemplateRender extends BaseEntity {
  templateId: UUID;
  templateVersion: number;
  variables: Record<string, unknown>;
  renderedContent: string;
  status: RenderStatus;
  errors?: string[];
  warnings?: string[];
  durationMs: number;
  requestedBy: UUID;
}

export interface TemplateValidation extends BaseEntity {
  templateId: UUID;
  templateVersion: number;
  passed: boolean;
  errors: string[];
  warnings: string[];
  checkedBy: UUID;
}

export interface TemplateEvent extends BaseEntity {
  type: string;
  source: string;
  data: Record<string, unknown>;
  correlationId?: UUID;
}

export interface AuditLog extends BaseEntity {
  actorId: UUID;
  role: Role;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
}

export interface TemplateOverview {
  templates: { total: number; active: number; draft: number; published: number };
  categories: { total: number; active: number };
  renders: { total: number; success: number; errors: number };
  byType: Record<string, number>;
  byCategory: Record<string, number>;
}

export interface TemplateState {
  templates: Template[];
  categories: TemplateCategory[];
  variables: TemplateVariable[];
  renders: TemplateRender[];
  events: TemplateEvent[];
  auditLogs: AuditLog[];
}
