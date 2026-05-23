export function docs() {
  return {
    name: "DataOS",
    version: "1.0.0",
    description: "Data models, schemas, datasets, catalogs, lineage, quality, access, and data products for APPNEURAL platforms.",
    auth: {
      headers: {
        "x-role": "owner | admin | data_engineer | data_analyst | data_governance | data_steward | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      dataModel: "A structured data model defining entities, fields, relationships, and validation rules.",
      schema: "Database schema definition for PostgreSQL, MySQL, MongoDB, or other supported databases.",
      dataset: "A versioned collection of data with storage, format, and metadata.",
      pipeline: "ETL/ELT pipeline with steps for extract, transform, and load operations.",
      dataCatalog: "Centralized catalog for discovering and documenting data assets.",
      dataQuality: "Automated checks for completeness, uniqueness, validity, and consistency.",
      dataLineage: "Tracking of data flow between sources, pipelines, and targets.",
      dataProduct: "A curated, documented, and governed dataset for consumption by other systems."
    },
    endpoints: {
      overview: {
        method: "GET",
        path: "/dataos/overview",
        description: "Get DataOS overview with counts and statistics"
      },
      models: {
        list: { method: "GET", path: "/dataos/models" },
        get: { method: "GET", path: "/dataos/models/:id" },
        create: { method: "POST", path: "/dataos/models" },
        update: { method: "PATCH", path: "/dataos/models/:id" },
        delete: { method: "DELETE", path: "/dataos/models/:id" }
      },
      schemas: {
        list: { method: "GET", path: "/dataos/schemas" },
        get: { method: "GET", path: "/dataos/schemas/:id" },
        create: { method: "POST", path: "/dataos/schemas" }
      },
      datasets: {
        list: { method: "GET", path: "/dataos/datasets" },
        get: { method: "GET", path: "/dataos/datasets/:id" },
        create: { method: "POST", path: "/dataos/datasets" }
      },
      sources: {
        list: { method: "GET", path: "/dataos/sources" },
        get: { method: "GET", path: "/dataos/sources/:id" },
        create: { method: "POST", path: "/dataos/sources" }
      },
      pipelines: {
        list: { method: "GET", path: "/dataos/pipelines" },
        get: { method: "GET", path: "/dataos/pipelines/:id" },
        create: { method: "POST", path: "/dataos/pipelines" }
      },
      catalog: {
        list: { method: "GET", path: "/dataos/catalog" },
        get: { method: "GET", path: "/dataos/catalog/:id" },
        create: { method: "POST", path: "/dataos/catalog" }
      },
      quality: {
        list: { method: "GET", path: "/dataos/quality/checks" },
        create: { method: "POST", path: "/dataos/quality/checks" }
      },
      lineage: {
        list: { method: "GET", path: "/dataos/lineage" },
        create: { method: "POST", path: "/dataos/lineage" }
      },
      products: {
        list: { method: "GET", path: "/dataos/products" },
        get: { method: "GET", path: "/dataos/products/:id" },
        create: { method: "POST", path: "/dataos/products" }
      },
      events: {
        list: { method: "GET", path: "/dataos/events" },
        emit: { method: "POST", path: "/dataos/events" }
      },
      audit: {
        list: { method: "GET", path: "/dataos/audit" }
      }
    },
    examples: {
      createModel: {
        method: "POST",
        path: "/dataos/models",
        headers: { "x-role": "data_engineer" },
        body: {
          key: "customer_model",
          name: "Customer Model",
          description: "Core customer data model",
          fields: [
            { name: "id", type: "uuid", required: true, sensitivity: "confidential" },
            { name: "name", type: "string", required: true, sensitivity: "internal" },
            { name: "email", type: "email", required: true, sensitivity: "restricted" }
          ]
        }
      },
      createPipeline: {
        method: "POST",
        path: "/dataos/pipelines",
        headers: { "x-role": "data_engineer" },
        body: {
          key: "etl_customers",
          name: "ETL Customers Pipeline",
          type: "etl",
          steps: [
            { name: "Extract", type: "extract", order: 1 },
            { name: "Transform", type: "transform", order: 2 },
            { name: "Load", type: "load", order: 3 }
          ]
        }
      },
      checkQuality: {
        method: "POST",
        path: "/dataos/quality/checks",
        headers: { "x-role": "data_governance" },
        body: {
          key: "customer_email_quality",
          name: "Customer Email Quality",
          datasetId: "dataset_customers",
          type: "completeness",
          threshold: 99
        }
      }
    }
  };
}
