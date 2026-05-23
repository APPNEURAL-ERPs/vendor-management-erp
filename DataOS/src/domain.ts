export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "data_engineer" | "data_analyst" | "data_governance" | "data_steward" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";

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

export interface DataField extends BaseEntity {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "datetime" | "json" | "array" | "uuid" | "email" | "phone" | "text";
  description?: string;
  required: boolean;
  defaultValue?: string;
  validationRules?: ValidationRule[];
  sensitivity: "public" | "internal" | "confidential" | "restricted";
  metadata: Record<string, unknown>;
}

export interface ValidationRule {
  type: "required" | "unique" | "format" | "range" | "custom";
  config: Record<string, unknown>;
  message?: string;
}

export interface DataModel extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  tags: string[];
  fields: DataField[];
  relationships: DataRelationship[];
  version: number;
  metadata: Record<string, unknown>;
}

export interface DataRelationship extends BaseEntity {
  name: string;
  sourceModelId: UUID;
  targetModelId: UUID;
  type: "one-to-one" | "one-to-many" | "many-to-many";
  sourceFieldId: UUID;
  targetFieldId: UUID;
  description?: string;
}

export interface Schema extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  targetDatabase: "postgresql" | "mysql" | "mongodb" | "sqlite" | "dynamodb" | "json_schema";
  tables: SchemaTable[];
  version: number;
  status: EntityStatus;
}

export interface SchemaTable extends BaseEntity {
  schemaId: UUID;
  name: string;
  description?: string;
  fields: SchemaField[];
  indexes: SchemaIndex[];
}

export interface SchemaField extends BaseEntity {
  tableId: UUID;
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue?: string;
  primaryKey: boolean;
  foreignKey?: {
    table: string;
    field: string;
  };
}

export interface SchemaIndex extends BaseEntity {
  tableId: UUID;
  name: string;
  fields: string[];
  unique: boolean;
}

export interface DataSource extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "database" | "api" | "file" | "stream";
  connectionConfig: Record<string, unknown>;
  status: "connected" | "disconnected" | "error";
  lastSyncAt?: ISODate;
}

export interface Dataset extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  schemaId: UUID;
  dataSourceId?: UUID;
  storagePath?: string;
  format: "csv" | "json" | "parquet" | "delta" | "iceberg";
  status: EntityStatus;
  ownerId?: UUID;
  tags: string[];
  rowCount?: number;
  lastRefreshAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface DataContract extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  producerDatasetId: UUID;
  consumerDatasetIds: UUID[];
  schemaId: UUID;
  version: number;
  status: "proposed" | "accepted" | "deprecated";
  qualityThreshold: number;
}

export interface DataPipeline extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "etl" | "elt" | "streaming" | "batch";
  status: EntityStatus;
  schedule?: string;
  steps: PipelineStep[];
  sourceDatasetIds: UUID[];
  targetDatasetIds: UUID[];
  lastRunAt?: ISODate;
  nextRunAt?: ISODate;
}

export interface PipelineStep extends BaseEntity {
  pipelineId: UUID;
  name: string;
  type: "extract" | "transform" | "load" | "validate" | "aggregate";
  order: number;
  config: Record<string, unknown>;
  status?: "pending" | "running" | "completed" | "failed";
}

export interface PipelineRun extends BaseEntity {
  pipelineId: UUID;
  status: "started" | "completed" | "failed" | "cancelled";
  startedAt: ISODate;
  completedAt?: ISODate;
  steps: PipelineStepRun[];
  recordsProcessed?: number;
  recordsFailed?: number;
  errorMessage?: string;
}

export interface PipelineStepRun extends BaseEntity {
  runId: UUID;
  stepId: UUID;
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: ISODate;
  completedAt?: ISODate;
  output?: Record<string, unknown>;
  errorMessage?: string;
}

export interface DataLineage extends BaseEntity {
  sourceType: "dataset" | "pipeline" | "model" | "api";
  sourceId: UUID;
  targetType: "dataset" | "pipeline" | "model" | "api";
  targetId: UUID;
  fieldMappings?: FieldMapping[];
  description?: string;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
}

export interface DataQualityCheck extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  datasetId: UUID;
  type: "completeness" | "uniqueness" | "validity" | "consistency" | "timeliness";
  fieldId?: UUID;
  config: Record<string, unknown>;
  threshold: number;
  status: EntityStatus;
  lastCheckAt?: ISODate;
}

export interface DataQualityResult extends BaseEntity {
  checkId: UUID;
  datasetId: UUID;
  status: "passed" | "failed" | "warning";
  score: number;
  passedRules: number;
  failedRules: number;
  details: QualityCheckDetail[];
  checkedAt: ISODate;
}

export interface QualityCheckDetail {
  rule: string;
  passed: boolean;
  value: unknown;
  threshold?: number;
  message?: string;
}

export interface DataProduct extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  version: string;
  status: EntityStatus;
  ownerId?: UUID;
  datasetIds: UUID[];
  schemaId: UUID;
  documentation?: string;
  tags: string[];
  metrics: DataProductMetrics;
}

export interface DataProductMetrics {
  usageCount: number;
  avgLatencyMs: number;
  uptimePercent: number;
  lastUpdatedAt?: ISODate;
}

export interface DataCatalogItem extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "dataset" | "model" | "pipeline" | "api" | "table";
  entityId: UUID;
  ownerId?: UUID;
  tags: string[];
  documentation?: string;
  sensitivity: "public" | "internal" | "confidential" | "restricted";
  status: EntityStatus;
  searchText?: string;
}

export interface DataAccessPolicy extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  effect: "allow" | "deny";
  principals: string[];
  resources: string[];
  actions: string[];
  conditions?: Record<string, unknown>;
  priority: number;
  status: EntityStatus;
}

export interface DataRetentionPolicy extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  targetType: "dataset" | "table" | "model";
  targetId: UUID;
  retentionDays: number;
  archiveAfterDays?: number;
  deleteAfterDays?: number;
  status: EntityStatus;
}

export interface DataImportJob extends BaseEntity {
  key: string;
  name: string;
  sourceType: "csv" | "excel" | "json" | "api" | "database";
  sourceConfig: Record<string, unknown>;
  targetDatasetId: UUID;
  status: "pending" | "running" | "completed" | "failed";
  recordsTotal?: number;
  recordsImported?: number;
  recordsFailed?: number;
  startedAt?: ISODate;
  completedAt?: ISODate;
  errorMessage?: string;
}

export interface DataExportJob extends BaseEntity {
  key: string;
  name: string;
  sourceDatasetId: UUID;
  format: "csv" | "excel" | "json" | "parquet";
  destinationType: "file" | "api" | "email";
  destinationConfig: Record<string, unknown>;
  status: "pending" | "running" | "completed" | "failed";
  recordsTotal?: number;
  recordsExported?: number;
  startedAt?: ISODate;
  completedAt?: ISODate;
  errorMessage?: string;
}

export interface DataSyncJob extends BaseEntity {
  key: string;
  name: string;
  sourceId: UUID;
  targetId: UUID;
  direction: "one-way" | "two-way";
  status: "idle" | "syncing" | "error";
  lastSyncAt?: ISODate;
  nextSyncAt?: ISODate;
  conflictResolution?: "source-wins" | "target-wins" | "manual";
}

export interface DataBackup extends BaseEntity {
  key: string;
  name: string;
  targetType: "dataset" | "table" | "full";
  targetId?: UUID;
  storageLocation: string;
  sizeBytes?: number;
  status: "in_progress" | "completed" | "failed";
  completedAt?: ISODate;
}

export interface DataEvent extends BaseEntity {
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

export interface DataosState {
  models: DataModel[];
  relationships: DataRelationship[];
  schemas: Schema[];
  sources: DataSource[];
  datasets: Dataset[];
  contracts: DataContract[];
  pipelines: DataPipeline[];
  pipelineRuns: PipelineRun[];
  lineages: DataLineage[];
  qualityChecks: DataQualityCheck[];
  qualityResults: DataQualityResult[];
  products: DataProduct[];
  catalog: DataCatalogItem[];
  accessPolicies: DataAccessPolicy[];
  retentionPolicies: DataRetentionPolicy[];
  importJobs: DataImportJob[];
  exportJobs: DataExportJob[];
  syncJobs: DataSyncJob[];
  backups: DataBackup[];
  events: DataEvent[];
  auditLogs: AuditLog[];
}

export interface DataosOverview {
  models: { total: number; active: number };
  schemas: { total: number };
  datasets: { total: number; active: number };
  pipelines: { total: number; active: number; runs: number };
  quality: { checks: number; passed: number; failed: number };
  products: { total: number };
  catalog: { total: number };
  imports: { total: number; completed: number; failed: number };
  exports: { total: number; completed: number; failed: number };
}
