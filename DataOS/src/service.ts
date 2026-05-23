import { DataStore } from "./core/datastore";
import {
  DataosState,
  DataosOverview,
  DataModel,
  DataSource,
  Dataset,
  Schema,
  DataPipeline,
  DataProduct,
  DataCatalogItem,
  DataQualityCheck,
  DataQualityResult,
  DataLineage,
  DataAccessPolicy,
  DataImportJob,
  DataExportJob,
  RequestActor,
  DataEvent
} from "./domain";
import { newId, nowIso } from "./core/id";
import { notFound, conflict, countBy } from "./core/utils";

export class DataosService {
  constructor(private readonly store: DataStore) {}

  getOverview(tenantId: string): DataosOverview {
    const state = this.store.getState();
    const models = state.models.filter((m) => m.tenantId === tenantId);
    const datasets = state.datasets.filter((d) => d.tenantId === tenantId);
    const pipelines = state.pipelines.filter((p) => p.tenantId === tenantId);
    const qualityChecks = state.qualityChecks.filter((q) => q.tenantId === tenantId);
    const products = state.products.filter((p) => p.tenantId === tenantId);
    const catalog = state.catalog.filter((c) => c.tenantId === tenantId);
    const imports = state.importJobs.filter((i) => i.tenantId === tenantId);
    const exports = state.exportJobs.filter((e) => e.tenantId === tenantId);

    const qualityResults = state.qualityResults.filter((r) => r.tenantId === tenantId);
    const passedChecks = qualityResults.filter((r) => r.status === "passed").length;
    const failedChecks = qualityResults.filter((r) => r.status === "failed").length;

    return {
      models: {
        total: models.length,
        active: models.filter((m) => m.status === "active").length
      },
      schemas: {
        total: state.schemas.filter((s) => s.tenantId === tenantId).length
      },
      datasets: {
        total: datasets.length,
        active: datasets.filter((d) => d.status === "active").length
      },
      pipelines: {
        total: pipelines.length,
        active: pipelines.filter((p) => p.status === "active").length,
        runs: state.pipelineRuns.filter((r) => r.tenantId === tenantId).length
      },
      quality: {
        checks: qualityChecks.length,
        passed: passedChecks,
        failed: failedChecks
      },
      products: {
        total: products.length
      },
      catalog: {
        total: catalog.length
      },
      imports: {
        total: imports.length,
        completed: imports.filter((i) => i.status === "completed").length,
        failed: imports.filter((i) => i.status === "failed").length
      },
      exports: {
        total: exports.length,
        completed: exports.filter((e) => e.status === "completed").length,
        failed: exports.filter((e) => e.status === "failed").length
      }
    };
  }

  listModels(tenantId: string) {
    return this.store.getState().models.filter((m) => m.tenantId === tenantId);
  }

  getModel(tenantId: string, id: string): DataModel {
    const model = this.store.getState().models.find((m) => m.id === id && m.tenantId === tenantId);
    if (!model) notFound(`Model ${id} not found`);
    return model;
  }

  createModel(actor: RequestActor, data: Partial<DataModel>): DataModel {
    const existing = this.store.getState().models.find(
      (m) => m.key === data.key && m.tenantId === actor.tenantId
    );
    if (existing) conflict(`Model with key ${data.key} already exists`);

    const model: DataModel = {
      id: newId("model"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: data.key ?? "",
      name: data.name ?? "",
      description: data.description,
      status: data.status ?? "active",
      tags: data.tags ?? [],
      fields: data.fields ?? [],
      relationships: data.relationships ?? [],
      version: 1,
      metadata: data.metadata ?? {}
    };

    this.store.getState().models.push(model);
    this.store.save();
    this.store.audit(actor, "create", "DataModel", model.id, undefined, model);
    return model;
  }

  updateModel(actor: RequestActor, id: string, data: Partial<DataModel>): DataModel {
    const model = this.getModel(actor.tenantId, id);
    const before = { ...model };
    Object.assign(model, data, { updatedAt: nowIso(), version: model.version + 1 });
    this.store.save();
    this.store.audit(actor, "update", "DataModel", id, before, model);
    return model;
  }

  deleteModel(actor: RequestActor, id: string): void {
    const model = this.getModel(actor.tenantId, id);
    this.store.getState().models = this.store.getState().models.filter((m) => m.id !== id);
    this.store.save();
    this.store.audit(actor, "delete", "DataModel", id, model, undefined);
  }

  listSchemas(tenantId: string) {
    return this.store.getState().schemas.filter((s) => s.tenantId === tenantId);
  }

  getSchema(tenantId: string, id: string): Schema {
    const schema = this.store.getState().schemas.find((s) => s.id === id && s.tenantId === tenantId);
    if (!schema) notFound(`Schema ${id} not found`);
    return schema;
  }

  createSchema(actor: RequestActor, data: Partial<Schema>): Schema {
    const existing = this.store.getState().schemas.find(
      (s) => s.key === data.key && s.tenantId === actor.tenantId
    );
    if (existing) conflict(`Schema with key ${data.key} already exists`);

    const schema: Schema = {
      id: newId("schema"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: data.key ?? "",
      name: data.name ?? "",
      description: data.description,
      targetDatabase: data.targetDatabase ?? "postgresql",
      tables: data.tables ?? [],
      version: 1,
      status: data.status ?? "active"
    };

    this.store.getState().schemas.push(schema);
    this.store.save();
    this.store.audit(actor, "create", "Schema", schema.id, undefined, schema);
    return schema;
  }

  listDatasets(tenantId: string) {
    return this.store.getState().datasets.filter((d) => d.tenantId === tenantId);
  }

  getDataset(tenantId: string, id: string): Dataset {
    const dataset = this.store.getState().datasets.find((d) => d.id === id && d.tenantId === tenantId);
    if (!dataset) notFound(`Dataset ${id} not found`);
    return dataset;
  }

  createDataset(actor: RequestActor, data: Partial<Dataset>): Dataset {
    const existing = this.store.getState().datasets.find(
      (d) => d.key === data.key && d.tenantId === actor.tenantId
    );
    if (existing) conflict(`Dataset with key ${data.key} already exists`);

    const dataset: Dataset = {
      id: newId("dataset"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: data.key ?? "",
      name: data.name ?? "",
      description: data.description,
      schemaId: data.schemaId ?? "",
      dataSourceId: data.dataSourceId,
      storagePath: data.storagePath,
      format: data.format ?? "parquet",
      status: data.status ?? "active",
      ownerId: data.ownerId,
      tags: data.tags ?? [],
      metadata: data.metadata ?? {}
    };

    this.store.getState().datasets.push(dataset);
    this.store.save();
    this.store.audit(actor, "create", "Dataset", dataset.id, undefined, dataset);
    return dataset;
  }

  listSources(tenantId: string) {
    return this.store.getState().sources.filter((s) => s.tenantId === tenantId);
  }

  getSource(tenantId: string, id: string): DataSource {
    const source = this.store.getState().sources.find((s) => s.id === id && s.tenantId === tenantId);
    if (!source) notFound(`DataSource ${id} not found`);
    return source;
  }

  createSource(actor: RequestActor, data: Partial<DataSource>): DataSource {
    const existing = this.store.getState().sources.find(
      (s) => s.key === data.key && s.tenantId === actor.tenantId
    );
    if (existing) conflict(`DataSource with key ${data.key} already exists`);

    const source: DataSource = {
      id: newId("source"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: data.key ?? "",
      name: data.name ?? "",
      description: data.description,
      type: data.type ?? "database",
      connectionConfig: data.connectionConfig ?? {},
      status: data.status ?? "disconnected"
    };

    this.store.getState().sources.push(source);
    this.store.save();
    this.store.audit(actor, "create", "DataSource", source.id, undefined, source);
    return source;
  }

  listPipelines(tenantId: string) {
    return this.store.getState().pipelines.filter((p) => p.tenantId === tenantId);
  }

  getPipeline(tenantId: string, id: string): DataPipeline {
    const pipeline = this.store.getState().pipelines.find((p) => p.id === id && p.tenantId === tenantId);
    if (!pipeline) notFound(`Pipeline ${id} not found`);
    return pipeline;
  }

  createPipeline(actor: RequestActor, data: Partial<DataPipeline>): DataPipeline {
    const existing = this.store.getState().pipelines.find(
      (p) => p.key === data.key && p.tenantId === actor.tenantId
    );
    if (existing) conflict(`Pipeline with key ${data.key} already exists`);

    const pipeline: DataPipeline = {
      id: newId("pipeline"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: data.key ?? "",
      name: data.name ?? "",
      description: data.description,
      type: data.type ?? "etl",
      status: data.status ?? "active",
      schedule: data.schedule,
      steps: data.steps ?? [],
      sourceDatasetIds: data.sourceDatasetIds ?? [],
      targetDatasetIds: data.targetDatasetIds ?? []
    };

    this.store.getState().pipelines.push(pipeline);
    this.store.save();
    this.store.audit(actor, "create", "DataPipeline", pipeline.id, undefined, pipeline);
    return pipeline;
  }

  listCatalog(tenantId: string) {
    return this.store.getState().catalog.filter((c) => c.tenantId === tenantId);
  }

  getCatalogItem(tenantId: string, id: string): DataCatalogItem {
    const item = this.store.getState().catalog.find((c) => c.id === id && c.tenantId === tenantId);
    if (!item) notFound(`Catalog item ${id} not found`);
    return item;
  }

  createCatalogItem(actor: RequestActor, data: Partial<DataCatalogItem>): DataCatalogItem {
    const existing = this.store.getState().catalog.find(
      (c) => c.key === data.key && c.tenantId === actor.tenantId
    );
    if (existing) conflict(`Catalog item with key ${data.key} already exists`);

    const item: DataCatalogItem = {
      id: newId("catalog"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: data.key ?? "",
      name: data.name ?? "",
      description: data.description,
      type: data.type ?? "dataset",
      entityId: data.entityId ?? "",
      ownerId: data.ownerId,
      tags: data.tags ?? [],
      documentation: data.documentation,
      sensitivity: data.sensitivity ?? "internal",
      status: data.status ?? "active"
    };

    this.store.getState().catalog.push(item);
    this.store.save();
    this.store.audit(actor, "create", "DataCatalogItem", item.id, undefined, item);
    return item;
  }

  listQualityChecks(tenantId: string) {
    return this.store.getState().qualityChecks.filter((q) => q.tenantId === tenantId);
  }

  createQualityCheck(actor: RequestActor, data: Partial<DataQualityCheck>): DataQualityCheck {
    const existing = this.store.getState().qualityChecks.find(
      (q) => q.key === data.key && q.tenantId === actor.tenantId
    );
    if (existing) conflict(`Quality check with key ${data.key} already exists`);

    const check: DataQualityCheck = {
      id: newId("qc"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: data.key ?? "",
      name: data.name ?? "",
      description: data.description,
      datasetId: data.datasetId ?? "",
      type: data.type ?? "completeness",
      fieldId: data.fieldId,
      config: data.config ?? {},
      threshold: data.threshold ?? 95,
      status: data.status ?? "active"
    };

    this.store.getState().qualityChecks.push(check);
    this.store.save();
    this.store.audit(actor, "create", "DataQualityCheck", check.id, undefined, check);
    return check;
  }

  listLineages(tenantId: string) {
    return this.store.getState().lineages.filter((l) => l.tenantId === tenantId);
  }

  createLineage(actor: RequestActor, data: Partial<DataLineage>): DataLineage {
    const lineage: DataLineage = {
      id: newId("lineage"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      sourceType: data.sourceType ?? "dataset",
      sourceId: data.sourceId ?? "",
      targetType: data.targetType ?? "dataset",
      targetId: data.targetId ?? "",
      fieldMappings: data.fieldMappings,
      description: data.description
    };

    this.store.getState().lineages.push(lineage);
    this.store.save();
    this.store.audit(actor, "create", "DataLineage", lineage.id, undefined, lineage);
    return lineage;
  }

  listProducts(tenantId: string) {
    return this.store.getState().products.filter((p) => p.tenantId === tenantId);
  }

  getProduct(tenantId: string, id: string): DataProduct {
    const product = this.store.getState().products.find((p) => p.id === id && p.tenantId === tenantId);
    if (!product) notFound(`DataProduct ${id} not found`);
    return product;
  }

  createProduct(actor: RequestActor, data: Partial<DataProduct>): DataProduct {
    const existing = this.store.getState().products.find(
      (p) => p.key === data.key && p.tenantId === actor.tenantId
    );
    if (existing) conflict(`DataProduct with key ${data.key} already exists`);

    const product: DataProduct = {
      id: newId("product"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key: data.key ?? "",
      name: data.name ?? "",
      description: data.description,
      version: data.version ?? "1.0.0",
      status: data.status ?? "active",
      ownerId: data.ownerId,
      datasetIds: data.datasetIds ?? [],
      schemaId: data.schemaId ?? "",
      documentation: data.documentation,
      tags: data.tags ?? [],
      metrics: data.metrics ?? {
        usageCount: 0,
        avgLatencyMs: 0,
        uptimePercent: 100
      }
    };

    this.store.getState().products.push(product);
    this.store.save();
    this.store.audit(actor, "create", "DataProduct", product.id, undefined, product);
    return product;
  }

  emitEvent(actor: RequestActor, type: string, data: Record<string, unknown>): DataEvent {
    const event: DataEvent = {
      id: newId("evt"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type,
      source: "DataOS",
      data
    };
    this.store.getState().events.unshift(event);
    this.store.save();
    return event;
  }

  getAuditLogs(tenantId: string, limit = 100) {
    return this.store.getState().auditLogs
      .filter((a) => a.tenantId === tenantId)
      .slice(0, limit);
  }

  getEvents(tenantId: string, limit = 50) {
    return this.store.getState().events
      .filter((e) => e.tenantId === tenantId)
      .slice(0, limit);
  }
}
