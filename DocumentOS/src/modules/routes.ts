import { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import { Router } from "../core/http";
import { DocumentService } from "../service";
import { ensureString, ensureNumber, ensureBoolean, ensureEnum, optionalEnum, pickQuery } from "../core/utils";
import { docs } from "../docs";
import { DocumentType, DocumentStatus } from "../types";

export function registerRoutes(router: Router, service: DocumentService): Router {
  router.get("/health", async (ctx) => {
    return {
      status: "ok",
      service: "DocumentOS",
      version: "1.0.0",
      timestamp: new Date().toISOString()
    };
  });

  router.get("/docs", async (ctx) => {
    return docs();
  });

  router.get("/overview", async (ctx) => {
    return service.getOverview(ctx.actor.tenantId);
  });

  router.get("/documents", async (ctx) => {
    const filters = {
      type: optionalEnum(ctx.query.get("type"), ["invoice", "quotation", "proposal", "contract", "agreement", "certificate", "resume", "report", "policy", "sop", "offer_letter", "custom"] as DocumentType[], "type"),
      status: optionalEnum(ctx.query.get("status"), ["draft", "review", "approved", "published", "signed", "archived", "deprecated", "rolled_back"] as DocumentStatus[], "status"),
      search: pickQuery(ctx.query, "q"),
      tags: ctx.query.get("tags")?.split(",").filter(Boolean),
      folderId: pickQuery(ctx.query, "folderId")
    };
    return service.listDocuments(ctx.actor.tenantId, filters);
  });

  router.post("/documents", async (ctx) => {
    const data = ctx.body || {};
    return service.createDocument(ctx.actor, {
      name: data.name,
      type: data.type,
      title: data.title,
      content: data.content,
      templateId: data.templateId,
      folderId: data.folderId,
      sections: data.sections,
      fields: data.fields,
      variables: data.variables,
      metadata: data.metadata,
      accessLevel: data.accessLevel,
      watermark: data.watermark,
      brandConfig: data.brandConfig
    });
  });

  router.get("/documents/search", async (ctx) => {
    const query = ensureString(ctx.query.get("q"), "query parameter 'q'");
    const filters = {
      type: optionalEnum(ctx.query.get("type"), ["invoice", "quotation", "proposal", "contract", "agreement", "certificate", "resume", "report", "policy", "sop", "offer_letter", "custom"] as DocumentType[], "type"),
      status: optionalEnum(ctx.query.get("status"), ["draft", "review", "approved", "published", "signed", "archived", "deprecated", "rolled_back"] as DocumentStatus[], "status"),
      limit: ensureNumber(ctx.query.get("limit"), "limit", 20)
    };
    return service.searchDocuments(ctx.actor.tenantId, query, filters);
  });

  router.get("/documents/:id", async (ctx) => {
    const doc = service.getDocument(ctx.actor.tenantId, ctx.params.id);
    service.logAccess(ctx.actor, doc.id, "view");
    return doc;
  });

  router.patch("/documents/:id", async (ctx) => {
    const data = ctx.body || {};
    return service.updateDocument(ctx.actor, ctx.params.id, data);
  });

  router.delete("/documents/:id", async (ctx) => {
    service.deleteDocument(ctx.actor, ctx.params.id);
    return { deleted: true };
  });

  router.post("/documents/:id/versions", async (ctx) => {
    const data = ctx.body || {};
    return service.createVersion(ctx.actor, ctx.params.id, {
      name: data.name,
      content: data.content,
      sections: data.sections,
      fields: data.fields,
      notes: data.notes,
      changeDescription: data.changeDescription
    });
  });

  router.get("/documents/:id/versions", async (ctx) => {
    return service.listVersions(ctx.actor.tenantId, ctx.params.id);
  });

  router.post("/documents/:id/merge", async (ctx) => {
    const data = ctx.body || {};
    ensureString(data.templateId, "templateId");
    ensureString(data.variables, "variables");
    return service.mergeTemplate(ctx.actor, ctx.params.id, data.templateId, data.variables);
  });

  router.post("/documents/:id/export/pdf", async (ctx) => {
    const data = ctx.body || {};
    return service.createPDFRender(ctx.actor, ctx.params.id, data.config);
  });

  router.post("/documents/:id/export/docx", async (ctx) => {
    const data = ctx.body || {};
    return service.createDOCXExport(ctx.actor, ctx.params.id, data.config);
  });

  router.post("/documents/:id/validate", async (ctx) => {
    return service.validateDocument(ctx.actor, ctx.params.id);
  });

  router.post("/documents/:id/approvals", async (ctx) => {
    const data = ctx.body || {};
    ensureString(data.approvers, "approvers");
    return service.createApproval(ctx.actor, ctx.params.id, data.approvers);
  });

  router.get("/documents/:id/approvals", async (ctx) => {
    const state = service["store"].getState();
    return state.approvals.filter(
      (a) => a.tenantId === ctx.actor.tenantId && a.documentId === ctx.params.id
    );
  });

  router.post("/documents/:id/signatures", async (ctx) => {
    const data = ctx.body || {};
    ensureString(data.signers, "signers");
    return service.createSignatureRequest(ctx.actor, ctx.params.id, data.signers, data.config);
  });

  router.get("/documents/:id/signatures", async (ctx) => {
    const state = service["store"].getState();
    return state.signatureRequests.filter(
      (s) => s.tenantId === ctx.actor.tenantId && s.documentId === ctx.params.id
    );
  });

  router.post("/documents/:id/share", async (ctx) => {
    const data = ctx.body || {};
    return service.createShareLink(ctx.actor, ctx.params.id, {
      name: data.name,
      accessLevel: data.accessLevel,
      password: data.password,
      expiresAt: data.expiresAt,
      maxViews: data.maxViews,
      allowPrint: data.allowPrint,
      allowCopy: data.allowCopy,
      watermarkEnabled: data.watermarkEnabled
    });
  });

  router.get("/documents/:id/share-links", async (ctx) => {
    const state = service["store"].getState();
    return state.shareLinks.filter(
      (l) => l.tenantId === ctx.actor.tenantId && l.documentId === ctx.params.id
    );
  });

  router.get("/documents/:id/access-logs", async (ctx) => {
    const state = service["store"].getState();
    return state.accessLogs.filter(
      (l) => l.tenantId === ctx.actor.tenantId && l.documentId === ctx.params.id
    );
  });

  router.get("/templates", async (ctx) => {
    const filters = {
      type: optionalEnum(ctx.query.get("type"), ["invoice", "quotation", "proposal", "contract", "agreement", "certificate", "resume", "report", "policy", "sop", "offer_letter", "custom"] as DocumentType[], "type"),
      status: ctx.query.get("status"),
      search: pickQuery(ctx.query, "q")
    };
    return service.listTemplates(ctx.actor.tenantId, filters);
  });

  router.post("/templates", async (ctx) => {
    const data = ctx.body || {};
    return service.createTemplate(ctx.actor, {
      key: data.key,
      name: data.name,
      description: data.description,
      type: data.type,
      status: data.status,
      category: data.category,
      tags: data.tags,
      content: data.content,
      sections: data.sections,
      variables: data.variables,
      metadata: data.metadata,
      parentTemplateId: data.parentTemplateId
    });
  });

  router.get("/templates/:id", async (ctx) => {
    const state = service["store"].getState();
    const template = state.templates.find(
      (t) => t.id === ctx.params.id && t.tenantId === ctx.actor.tenantId
    );
    if (!template) {
      const error = new Error(`Template ${ctx.params.id} not found`);
      (error as any).statusCode = 404;
      throw error;
    }
    return template;
  });

  router.get("/approvals/:id", async (ctx) => {
    const state = service["store"].getState();
    const approval = state.approvals.find(
      (a) => a.id === ctx.params.id && a.tenantId === ctx.actor.tenantId
    );
    if (!approval) {
      const error = new Error(`Approval ${ctx.params.id} not found`);
      (error as any).statusCode = 404;
      throw error;
    }
    return approval;
  });

  router.post("/approvals/:id/process", async (ctx) => {
    const data = ctx.body || {};
    ensureString(data.approverId, "approverId");
    ensureEnum(data.decision, ["approved", "rejected"] as const, "decision");
    return service.processApproval(ctx.actor, ctx.params.id, data.approverId, data.decision, data.notes);
  });

  router.get("/signatures/:id", async (ctx) => {
    const state = service["store"].getState();
    const signature = state.signatureRequests.find(
      (s) => s.id === ctx.params.id && s.tenantId === ctx.actor.tenantId
    );
    if (!signature) {
      const error = new Error(`Signature request ${ctx.params.id} not found`);
      (error as any).statusCode = 404;
      throw error;
    }
    return signature;
  });

  router.post("/signatures/:id/sign", async (ctx) => {
    const data = ctx.body || {};
    ensureString(data.signerId, "signerId");
    return service.processSignature(ctx.actor, ctx.params.id, data.signerId, {
      type: data.type || "signed",
      signatureImage: data.signatureImage,
      reason: data.reason
    });
  });

  return router;
}
