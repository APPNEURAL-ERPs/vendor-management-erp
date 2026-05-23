import { DataosState, DataModel, DataSource, Dataset, Schema, DataPipeline, DataProduct, DataCatalogItem, DataQualityCheck, DataLineage } from "./domain";
import { emptyState } from "./core/datastore";
import { nowIso, newId } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): DataosState {
  const state = emptyState();
  const createdAt = nowIso();

  state.models.push(
    {
      id: "model_client",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "client_model",
      name: "Client Model",
      description: "Core client/tenant data model",
      status: "active",
      tags: ["crm", "core", "client"],
      version: 1,
      fields: [
        {
          id: "field_client_id",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          name: "id",
          type: "uuid",
          required: true,
          sensitivity: "confidential",
          metadata: {}
        },
        {
          id: "field_client_name",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          name: "name",
          type: "string",
          description: "Client or company name",
          required: true,
          sensitivity: "internal",
          metadata: {}
        },
        {
          id: "field_client_email",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          name: "email",
          type: "email",
          description: "Primary contact email",
          required: true,
          sensitivity: "restricted",
          metadata: {}
        },
        {
          id: "field_client_status",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          name: "status",
          type: "string",
          description: "Client lifecycle status",
          required: true,
          sensitivity: "internal",
          metadata: {}
        }
      ],
      relationships: [],
      metadata: { industry: "general", useCase: "crm" }
    },
    {
      id: "model_lead",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "lead_model",
      name: "Lead Model",
      description: "Sales lead data model",
      status: "active",
      tags: ["sales", "crm", "lead"],
      version: 1,
      fields: [
        {
          id: "field_lead_id",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          name: "id",
          type: "uuid",
          required: true,
          sensitivity: "confidential",
          metadata: {}
        },
        {
          id: "field_lead_company",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          name: "company",
          type: "string",
          required: true,
          sensitivity: "internal",
          metadata: {}
        },
        {
          id: "field_lead_email",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          name: "email",
          type: "email",
          required: true,
          sensitivity: "restricted",
          metadata: {}
        },
        {
          id: "field_lead_score",
          tenantId,
          createdAt,
          updatedAt: createdAt,
          name: "score",
          type: "number",
          description: "Lead qualification score",
          required: false,
          sensitivity: "internal",
          metadata: {}
        }
      ],
      relationships: [],
      metadata: { salesStage: "top-of-funnel" }
    }
  );

  state.schemas.push({
    id: "schema_crm",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "crm_schema",
    name: "CRM Schema",
    description: "PostgreSQL schema for CRM data",
    targetDatabase: "postgresql",
    version: 1,
    status: "active",
    tables: [
      {
        id: "table_clients",
        tenantId,
        schemaId: "schema_crm",
        createdAt,
        updatedAt: createdAt,
        name: "clients",
        description: "Client master data",
        fields: [
          {
            id: "field_clients_pk",
            tenantId,
            tableId: "table_clients",
            createdAt,
            updatedAt: createdAt,
            name: "id",
            dataType: "UUID",
            nullable: false,
            primaryKey: true
          },
          {
            id: "field_clients_name",
            tenantId,
            tableId: "table_clients",
            createdAt,
            updatedAt: createdAt,
            name: "name",
            dataType: "VARCHAR(255)",
            nullable: false
          },
          {
            id: "field_clients_email",
            tenantId,
            tableId: "table_clients",
            createdAt,
            updatedAt: createdAt,
            name: "email",
            dataType: "VARCHAR(255)",
            nullable: false
          }
        ],
        indexes: [
          {
            id: "idx_clients_email",
            tenantId,
            tableId: "table_clients",
            createdAt,
            updatedAt: createdAt,
            name: "idx_clients_email",
            fields: ["email"],
            unique: true
          }
        ]
      }
    ]
  });

  state.sources.push({
    id: "source_postgres_main",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "postgres_main",
    name: "Main PostgreSQL",
    description: "Primary PostgreSQL database",
    type: "database",
    connectionConfig: {
      host: "localhost",
      port: 5432,
      database: "appneural"
    },
    status: "connected",
    lastSyncAt: createdAt
  });

  state.datasets.push(
    {
      id: "dataset_clients",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "clients_dataset",
      name: "Clients Dataset",
      description: "Master client data",
      schemaId: "schema_crm",
      dataSourceId: "source_postgres_main",
      storagePath: "s3://data/clients/",
      format: "parquet",
      status: "active",
      ownerId: "user_admin",
      tags: ["crm", "master-data", "clients"],
      rowCount: 15420,
      lastRefreshAt: createdAt,
      metadata: {}
    },
    {
      id: "dataset_leads",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "leads_dataset",
      name: "Leads Dataset",
      description: "Sales leads data",
      schemaId: "schema_crm",
      dataSourceId: "source_postgres_main",
      storagePath: "s3://data/leads/",
      format: "delta",
      status: "active",
      ownerId: "user_admin",
      tags: ["sales", "crm", "leads"],
      rowCount: 8234,
      lastRefreshAt: createdAt,
      metadata: {}
    }
  );

  state.pipelines.push({
    id: "pipeline_etl_leads",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "etl_leads_pipeline",
    name: "ETL Leads Pipeline",
    description: "Extract, transform, and load leads data",
    type: "etl",
    status: "active",
    schedule: "0 */6 * * *",
    steps: [
      {
        id: "step_extract_leads",
        tenantId,
        pipelineId: "pipeline_etl_leads",
        createdAt,
        updatedAt: createdAt,
        name: "Extract from source",
        type: "extract",
        order: 1,
        config: { sourceId: "source_postgres_main", query: "SELECT * FROM leads" }
      },
      {
        id: "step_transform_leads",
        tenantId,
        pipelineId: "pipeline_etl_leads",
        createdAt,
        updatedAt: createdAt,
        name: "Clean and validate",
        type: "transform",
        order: 2,
        config: { removeDuplicates: true, validateEmail: true }
      },
      {
        id: "step_load_leads",
        tenantId,
        pipelineId: "pipeline_etl_leads",
        createdAt,
        updatedAt: createdAt,
        name: "Load to dataset",
        type: "load",
        order: 3,
        config: { targetDatasetId: "dataset_leads", format: "delta" }
      }
    ],
    sourceDatasetIds: [],
    targetDatasetIds: ["dataset_leads"],
    lastRunAt: createdAt,
    nextRunAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
  });

  state.catalog.push(
    {
      id: "catalog_clients",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "clients_catalog",
      name: "Clients Catalog",
      description: "Master client data catalog entry",
      type: "dataset",
      entityId: "dataset_clients",
      ownerId: "user_admin",
      tags: ["crm", "master-data", "clients"],
      documentation: "Centralized client master data used across all APPNEURAL modules.",
      sensitivity: "confidential",
      status: "active",
      searchText: "clients master data CRM customer"
    },
    {
      id: "catalog_leads",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "leads_catalog",
      name: "Leads Catalog",
      description: "Sales leads catalog entry",
      type: "dataset",
      entityId: "dataset_leads",
      ownerId: "user_admin",
      tags: ["sales", "crm", "leads", "marketing"],
      documentation: "Qualified and unqualified sales leads for CRM and marketing systems.",
      sensitivity: "internal",
      status: "active",
      searchText: "leads sales marketing prospects"
    }
  );

  state.qualityChecks.push(
    {
      id: "qc_clients_completeness",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "clients_email_completeness",
      name: "Client Email Completeness",
      description: "Ensures all clients have valid email",
      datasetId: "dataset_clients",
      type: "completeness",
      config: { field: "email", minCompleteness: 0.99 },
      threshold: 99,
      status: "active",
      lastCheckAt: createdAt
    },
    {
      id: "qc_leads_uniqueness",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "leads_email_uniqueness",
      name: "Lead Email Uniqueness",
      description: "Ensures no duplicate lead emails",
      datasetId: "dataset_leads",
      type: "uniqueness",
      fieldId: "field_lead_email",
      config: { field: "email", allowNulls: false },
      threshold: 95,
      status: "active",
      lastCheckAt: createdAt
    }
  );

  state.lineages.push({
    id: "lineage_leads_etl",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    sourceType: "dataset",
    sourceId: "source_postgres_main",
    targetType: "dataset",
    targetId: "dataset_leads",
    description: "Leads ETL pipeline lineage",
    fieldMappings: [
      { sourceField: "id", targetField: "id" },
      { sourceField: "company", targetField: "company" },
      { sourceField: "email", targetField: "email" }
    ]
  });

  state.products.push({
    id: "product_client360",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "client_360_product",
    name: "Client 360 Data Product",
    description: "Unified client view combining CRM, billing, and support data",
    version: "1.0.0",
    status: "active",
    ownerId: "user_admin",
    datasetIds: ["dataset_clients"],
    schemaId: "schema_crm",
    documentation: "A comprehensive client data product providing a single view of customer data across all touchpoints.",
    tags: ["crm", "analytics", "360-view"],
    metrics: {
      usageCount: 47,
      avgLatencyMs: 120,
      uptimePercent: 99.9,
      lastUpdatedAt: createdAt
    }
  });

  state.events.push({
    id: "event_dataos_bootstrap",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "dataos.seeded",
    source: "DataOS",
    data: { message: "DataOS demo data seeded" }
  });

  return state;
}
