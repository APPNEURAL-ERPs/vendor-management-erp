import { DataStore } from "./core/datastore";
import {
  Document,
  DocumentTemplate,
  DocumentVersion,
  DocumentType,
  DocumentStatus,
  DocumentSection,
  DocumentField,
  DocumentVariable,
  PDFRender,
  DOCXExport,
  HTMLExport,
  SignatureRequest,
  DocumentApproval,
  DocumentWorkflow,
  DocumentShareLink,
  DocumentValidation,
  DocumentAuditLog,
  DocumentOverview,
  DocumentHealthScore,
  RequestActor,
  DocumentMetadata
} from "./types";
import {
  newId,
  newToken,
  nowIso,
  generateDocumentKey,
  generateInvoiceNumber,
  generateCertificateId,
  plusDays
} from "./core/id";
import { countBy, groupBy } from "./core/utils";
import { notFound, conflict, badRequest } from "./core/errors";

export class DocumentService {
  constructor(private readonly store: DataStore) {}

  getOverview(tenantId: string): DocumentOverview {
    const state = this.store.getState();
    const documents = state.documents.filter((d) => d.tenantId === tenantId);
    const templates = state.templates.filter((t) => t.tenantId === tenantId);
    const pdfRenders = state.pdfRenders.filter((r) => r.tenantId === tenantId);
    const docxExports = state.docxExports.filter((e) => e.tenantId === tenantId);
    const approvals = state.approvals.filter((a) => a.tenantId === tenantId);
    const signatures = state.signatureRequests.filter((s) => s.tenantId === tenantId);
    const workflows = state.workflows.filter((w) => w.tenantId === tenantId);
    const storageObjects = state.storageObjects.filter((s) => s.tenantId === tenantId);

    const healthScore = this.calculateHealthScore(documents);

    return {
      documents: {
        total: documents.length,
        byType: countBy(documents, "type") as any,
        byStatus: countBy(documents, "status") as any
      },
      templates: {
        total: templates.length,
        active: templates.filter((t) => t.status === "active").length,
        byType: groupBy(templates, "type") as any
      },
      exports: {
        pdf: pdfRenders.filter((r) => r.status === "completed").length,
        docx: docxExports.filter((e) => e.status === "completed").length,
        html: 0,
        failed: pdfRenders.filter((r) => r.status === "failed").length + docxExports.filter((e) => e.status === "failed").length
      },
      approvals: {
        pending: approvals.filter((a) => a.status === "pending").length,
        approved: approvals.filter((a) => a.status === "approved").length,
        rejected: approvals.filter((a) => a.status === "rejected").length
      },
      signatures: {
        pending: signatures.filter((s) => s.status === "sent").length,
        completed: signatures.filter((s) => s.status === "completed").length,
        declined: signatures.filter((s) => s.status === "declined").length
      },
      workflows: {
        active: workflows.filter((w) => w.status === "active").length,
        completed: workflows.filter((w) => w.status === "completed").length
      },
      storage: {
        usedMB: Math.round(storageObjects.reduce((sum, s) => sum + s.fileSize, 0) / (1024 * 1024) * 100) / 100,
        documentCount: documents.length
      },
      healthScore
    };
  }

  private calculateHealthScore(documents: Document[]): DocumentHealthScore {
    const issues: any[] = [];
    let completeness = 100;
    let validation = 100;
    let versioning = 100;
    let security = 100;
    let accessibility = 100;

    if (documents.length === 0) {
      return {
        score: 100,
        factors: { completeness: 100, validation: 100, versioning: 100, security: 100, accessibility: 100 },
        issues: []
      };
    }

    const noTitle = documents.filter((d) => !d.title || d.title.trim() === "");
    if (noTitle.length > 0) {
      completeness -= (noTitle.length / documents.length) * 30;
      issues.push({ category: "completeness", severity: "high", message: `${noTitle.length} documents missing titles`, field: "title" });
    }

    const noMetadata = documents.filter((d) => !d.metadata || Object.keys(d.metadata).length === 0);
    if (noMetadata.length > 0) {
      completeness -= (noMetadata.length / documents.length) * 20;
      issues.push({ category: "completeness", severity: "medium", message: `${noMetadata.length} documents missing metadata`, field: "metadata" });
    }

    const draftDocs = documents.filter((d) => d.status === "draft");
    if (draftDocs.length > documents.length * 0.3) {
      issues.push({ category: "validation", severity: "medium", message: "High number of draft documents", field: "status" });
    }

    const unversioned = documents.filter((d) => !d.currentVersionId);
    if (unversioned.length > 0) {
      versioning -= (unversioned.length / documents.length) * 25;
      issues.push({ category: "versioning", severity: "high", message: `${unversioned.length} documents not versioned`, field: "version" });
    }

    const publicDocs = documents.filter((d) => d.accessLevel === "public" && d.type !== "certificate");
    if (publicDocs.length > 0) {
      security -= (publicDocs.length / documents.length) * 20;
      issues.push({ category: "security", severity: "high", message: `${publicDocs.length} sensitive documents are public`, field: "accessLevel" });
    }

    const noWatermark = documents.filter((d) => d.status === "draft" && !d.watermark);
    if (noWatermark.length > 0) {
      security -= (noWatermark.length / documents.length) * 10;
      issues.push({ category: "security", severity: "low", message: `${noWatermark.length} draft documents without watermark`, field: "watermark" });
    }

    const score = Math.round((completeness + validation + versioning + security + accessibility) / 5);

    return {
      score,
      factors: {
        completeness: Math.round(completeness),
        validation: Math.round(validation),
        versioning: Math.round(versioning),
        security: Math.round(security),
        accessibility: Math.round(accessibility)
      },
      issues: issues.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      })
    };
  }

  listDocuments(tenantId: string, filters?: {
    type?: DocumentType;
    status?: DocumentStatus;
    search?: string;
    tags?: string[];
    folderId?: string;
  }): Document[] {
    let docs = this.store.getState().documents.filter((d) => d.tenantId === tenantId);

    if (filters?.type) {
      docs = docs.filter((d) => d.type === filters.type);
    }
    if (filters?.status) {
      docs = docs.filter((d) => d.status === filters.status);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      docs = docs.filter((d) =>
        d.name.toLowerCase().includes(search) ||
        d.title.toLowerCase().includes(search) ||
        d.content.toLowerCase().includes(search)
      );
    }
    if (filters?.tags && filters.tags.length > 0) {
      docs = docs.filter((d) => filters.tags!.some((tag) => d.metadata.tags?.includes(tag)));
    }
    if (filters?.folderId) {
      docs = docs.filter((d) => d.folderId === filters.folderId);
    }

    return docs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getDocument(tenantId: string, id: string): Document {
    const doc = this.store.getState().documents.find((d) => d.id === id && d.tenantId === tenantId);
    if (!doc) notFound(`Document ${id} not found`);
    return doc;
  }

  createDocument(actor: RequestActor, data: Partial<Document>): Document {
    const now = nowIso();
    const key = generateDocumentKey(data.type || "doc");
    const id = newId("doc");

    if (data.templateId) {
      const template = this.store.getState().templates.find((t) => t.id === data.templateId);
      if (!template) notFound(`Template ${data.templateId} not found`);
    }

    const doc: Document = {
      id,
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key,
      name: data.name || `${data.type || "Document"} ${id}`,
      type: data.type || "custom",
      status: "draft",
      templateId: data.templateId,
      folderId: data.folderId,
      ownerId: actor.userId,
      title: data.title || "",
      content: data.content || "",
      sections: data.sections || [],
      fields: data.fields || [],
      variables: data.variables || [],
      metadata: {
        id: newId("meta"),
        tenantId: actor.tenantId,
        createdAt: now,
        updatedAt: now,
        title: data.title || "",
        tags: data.metadata?.tags || [],
        category: data.metadata?.category,
        language: data.metadata?.language || "en",
        customFields: data.metadata?.customFields || {}
      } as DocumentMetadata,
      exportedFormats: [],
      accessLevel: data.accessLevel || "private",
      watermark: data.watermark,
      brandConfig: data.brandConfig,
      createdBy: actor.userId
    };

    if (data.type === "invoice") {
      doc.fields.push({
        key: "invoice_number",
        value: generateInvoiceNumber(),
        type: "text",
        required: true,
        metadata: {}
      });
    }

    if (data.type === "certificate") {
      doc.fields.push({
        key: "certificate_id",
        value: generateCertificateId(),
        type: "text",
        required: true,
        metadata: {}
      });
    }

    this.store.getState().documents.push(doc);
    this.store.audit(actor, "create", "document", id, undefined, doc);

    return doc;
  }

  updateDocument(actor: RequestActor, id: string, data: Partial<Document>): Document {
    const state = this.store.getState();
    const index = state.documents.findIndex((d) => d.id === id && d.tenantId === actor.tenantId);
    if (index === -1) notFound(`Document ${id} not found`);

    const before = { ...state.documents[index] };
    const updated: Document = {
      ...state.documents[index],
      ...data,
      id: state.documents[index].id,
      tenantId: state.documents[index].tenantId,
      createdAt: state.documents[index].createdAt,
      updatedAt: nowIso(),
      updatedBy: actor.userId
    };

    if (data.fields || data.sections || data.variables) {
      updated.fields = data.fields || updated.fields;
      updated.sections = data.sections || updated.sections;
      updated.variables = data.variables || updated.variables;
    }

    if (data.metadata) {
      updated.metadata = {
        ...updated.metadata,
        ...data.metadata,
        id: updated.metadata.id,
        tenantId: updated.metadata.tenantId,
        createdAt: updated.metadata.createdAt,
        updatedAt: nowIso()
      } as DocumentMetadata;
    }

    state.documents[index] = updated;
    this.store.audit(actor, "update", "document", id, before, updated);

    return updated;
  }

  deleteDocument(actor: RequestActor, id: string): void {
    const state = this.store.getState();
    const index = state.documents.findIndex((d) => d.id === id && d.tenantId === actor.tenantId);
    if (index === -1) notFound(`Document ${id} not found`);

    const before = state.documents[index];
    state.documents.splice(index, 1);

    state.versions = state.versions.filter((v) => v.documentId !== id);
    state.pdfRenders = state.pdfRenders.filter((r) => r.documentId !== id);
    state.docxExports = state.docxExports.filter((e) => e.documentId !== id);
    state.signatureRequests = state.signatureRequests.filter((s) => s.documentId !== id);
    state.approvals = state.approvals.filter((a) => a.documentId !== id);
    state.shareLinks = state.shareLinks.filter((l) => l.documentId !== id);
    state.accessLogs = state.accessLogs.filter((l) => l.documentId !== id);

    this.store.audit(actor, "delete", "document", id, before, undefined);
  }

  createVersion(actor: RequestActor, documentId: string, data: Partial<DocumentVersion>): DocumentVersion {
    const doc = this.getDocument(actor.tenantId, documentId);
    const state = this.store.getState();
    const existingVersions = state.versions.filter((v) => v.documentId === documentId);
    const versionNumber = existingVersions.length + 1;
    const now = nowIso();

    const version: DocumentVersion = {
      id: newId("ver"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      documentId,
      version: versionNumber,
      name: data.name || `Version ${versionNumber}`,
      content: data.content || doc.content,
      sections: data.sections || doc.sections,
      fields: data.fields || doc.fields.reduce((acc, f) => ({ ...acc, [f.key]: f.value }), {}),
      status: doc.status,
      createdBy: actor.userId,
      notes: data.notes,
      changeDescription: data.changeDescription
    };

    state.versions.push(version);
    this.updateDocument(actor, documentId, { currentVersionId: version.id });

    return version;
  }

  listVersions(tenantId: string, documentId: string): DocumentVersion[] {
    return this.store.getState().versions
      .filter((v) => v.tenantId === tenantId && v.documentId === documentId)
      .sort((a, b) => b.version - a.version);
  }

  mergeTemplate(actor: RequestActor, documentId: string, templateId: string, variables: Record<string, unknown>): Document {
    const doc = this.getDocument(actor.tenantId, documentId);
    const template = this.store.getState().templates.find((t) => t.id === templateId && t.tenantId === actor.tenantId);
    if (!template) notFound(`Template ${templateId} not found`);

    let content = template.content;
    let sections = template.sections.map((s) => ({ ...s, id: newId("sec") }));

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, "g"), String(value));
      sections = sections.map((s) => ({
        ...s,
        content: s.content.replace(new RegExp(placeholder, "g"), String(value)),
        variables: { ...s.variables, [key]: String(value) }
      }));
    }

    const mergedDoc = this.updateDocument(actor, documentId, {
      content,
      sections,
      templateId,
      variables: [
        ...doc.variables,
        ...Object.entries(variables).map(([key, value]) => ({
          key,
          value,
          type: typeof value as any,
          source: "user" as const
        }))
      ]
    });

    return mergedDoc;
  }

  createPDFRender(actor: RequestActor, documentId: string, config?: Partial<PDFRender["config"]>): PDFRender {
    const doc = this.getDocument(actor.tenantId, documentId);
    const now = nowIso();

    const render: PDFRender = {
      id: newId("pdf"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      documentId,
      versionId: doc.currentVersionId,
      templateId: doc.templateId,
      status: "pending",
      format: "pdf",
      config: {
        pageSize: config?.pageSize || "A4",
        orientation: config?.orientation || "portrait",
        margin: config?.margin || { top: 20, right: 20, bottom: 20, left: 20 },
        header: config?.header,
        footer: config?.footer || { pageNumbers: true },
        watermark: config?.watermark || (doc.watermark ? { text: doc.watermark, opacity: 0.3 } : undefined),
        branding: config?.branding || doc.brandConfig
      },
      createdBy: actor.userId
    };

    this.store.getState().pdfRenders.push(render);

    setTimeout(() => {
      const state = this.store.getState();
      const renderIndex = state.pdfRenders.findIndex((r) => r.id === render.id);
      if (renderIndex !== -1) {
        state.pdfRenders[renderIndex].status = "completed";
        state.pdfRenders[renderIndex].renderedAt = nowIso();
        state.pdfRenders[renderIndex].filePath = `documents/${documentId}/${render.id}.pdf`;
        state.pdfRenders[renderIndex].fileSize = Math.floor(Math.random() * 100000) + 50000;
        state.pdfRenders[renderIndex].pageCount = Math.floor(Math.random() * 10) + 1;
        this.store.save();

        const docIndex = state.documents.findIndex((d) => d.id === documentId);
        if (docIndex !== -1 && !state.documents[docIndex].exportedFormats.includes("pdf")) {
          state.documents[docIndex].exportedFormats.push("pdf");
          this.store.save();
        }
      }
    }, 100);

    return render;
  }

  createDOCXExport(actor: RequestActor, documentId: string, config?: Partial<DOCXExport["config"]>): DOCXExport {
    const doc = this.getDocument(actor.tenantId, documentId);
    const now = nowIso();

    const exportJob: DOCXExport = {
      id: newId("docx"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      documentId,
      versionId: doc.currentVersionId,
      templateId: doc.templateId,
      status: "pending",
      format: "docx",
      config: config || {},
      createdBy: actor.userId
    };

    this.store.getState().docxExports.push(exportJob);

    setTimeout(() => {
      const state = this.store.getState();
      const exportIndex = state.docxExports.findIndex((e) => e.id === exportJob.id);
      if (exportIndex !== -1) {
        state.docxExports[exportIndex].status = "completed";
        state.docxExports[exportIndex].exportedAt = nowIso();
        state.docxExports[exportIndex].filePath = `documents/${documentId}/${exportJob.id}.docx`;
        state.docxExports[exportIndex].fileSize = Math.floor(Math.random() * 50000) + 20000;
        this.store.save();

        const docIndex = state.documents.findIndex((d) => d.id === documentId);
        if (docIndex !== -1 && !state.documents[docIndex].exportedFormats.includes("docx")) {
          state.documents[docIndex].exportedFormats.push("docx");
          this.store.save();
        }
      }
    }, 100);

    return exportJob;
  }

  createApproval(actor: RequestActor, documentId: string, approvers: DocumentApproval["approvers"]): DocumentApproval {
    const doc = this.getDocument(actor.tenantId, documentId);
    if (!doc.currentVersionId) {
      conflict("Document must have at least one version before approval");
    }

    const now = nowIso();
    const approval: DocumentApproval = {
      id: newId("apr"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      documentId,
      versionId: doc.currentVersionId,
      approvers: approvers.map((a, i) => ({ ...a, order: a.order || i + 1, status: "pending" as const })),
      status: "pending",
      currentStep: 1,
      approvalType: "sequential",
      createdBy: actor.userId
    };

    this.store.getState().approvals.push(approval);
    this.updateDocument(actor, documentId, { status: "review" });

    return approval;
  }

  processApproval(actor: RequestActor, approvalId: string, approverId: string, decision: "approved" | "rejected", notes?: string): DocumentApproval {
    const state = this.store.getState();
    const index = state.approvals.findIndex((a) => a.id === approvalId && a.tenantId === actor.tenantId);
    if (index === -1) notFound(`Approval ${approvalId} not found`);

    const approval = state.approvals[index];
    const approver = approval.approvers.find((a) => a.id === approverId);
    if (!approver) notFound(`Approver ${approverId} not found`);

    if (approver.status !== "pending") {
      conflict(`Approver ${approverId} has already submitted a decision`);
    }

    approver.status = decision;
    if (decision === "approved") {
      approver.approvedAt = nowIso();
    } else {
      approver.rejectedAt = nowIso();
    }
    approver.notes = notes;

    if (decision === "rejected") {
      approval.status = "rejected";
      approval.completedAt = nowIso();
      this.updateDocument(actor, approval.documentId, { status: "draft" });
    } else {
      const allApproved = approval.approvers.every((a) => a.status === "approved");
      if (allApproved) {
        approval.status = "approved";
        approval.completedAt = nowIso();
        this.updateDocument(actor, approval.documentId, { status: "approved" });
      } else {
        approval.currentStep++;
      }
    }

    state.approvals[index] = approval;
    this.store.save();

    return approval;
  }

  createSignatureRequest(actor: RequestActor, documentId: string, signers: SignatureRequest["signers"], config?: {
    orderedSigning?: boolean;
    message?: string;
    expirationDays?: number;
  }): SignatureRequest {
    const doc = this.getDocument(actor.tenantId, documentId);
    if (doc.status !== "approved") {
      conflict("Document must be approved before signature");
    }

    const now = nowIso();
    const request: SignatureRequest = {
      id: newId("sig"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      documentId,
      versionId: doc.currentVersionId,
      signers: signers.map((s, i) => ({
        ...s,
        order: s.order || i + 1,
        status: "draft" as const
      })),
      signatureFields: signers.flatMap((signer) => [
        {
          id: newId("sf"),
          signerId: signer.id,
          type: "signature" as const,
          page: 1,
          x: 100,
          y: 600,
          width: 200,
          height: 50,
          required: true,
          status: "draft" as const
        },
        {
          id: newId("sf"),
          signerId: signer.id,
          type: "date" as const,
          page: 1,
          x: 320,
          y: 620,
          width: 100,
          height: 20,
          required: true,
          status: "draft" as const
        }
      ]),
      status: "sent",
      orderedSigning: config?.orderedSigning ?? true,
      message: config?.message,
      expirationDays: config?.expirationDays || 30,
      expiresAt: plusDays(config?.expirationDays || 30),
      accessLogs: signers.map((s) => ({
        signerId: s.id,
        action: "sent" as const,
        timestamp: now,
        ipAddress: undefined
      })),
      createdBy: actor.userId
    };

    this.store.getState().signatureRequests.push(request);
    this.updateDocument(actor, documentId, { status: "signed" });

    return request;
  }

  processSignature(actor: RequestActor, signatureRequestId: string, signerId: string, signatureData: {
    type: "signed" | "declined";
    signatureImage?: string;
    reason?: string;
  }): SignatureRequest {
    const state = this.store.getState();
    const index = state.signatureRequests.findIndex((s) => r.id === signatureRequestId && s.tenantId === actor.tenantId);
    if (index === -1) notFound(`Signature request ${signatureRequestId} not found`);

    const request = state.signatureRequests[index];
    const signer = request.signers.find((s) => s.id === signerId);
    if (!signer) notFound(`Signer ${signerId} not found`);

    if (signatureData.type === "signed") {
      signer.status = "signed";
      signer.signedAt = nowIso();

      request.signatureFields
        .filter((f) => f.signerId === signerId)
        .forEach((f) => {
          f.status = "signed";
          f.signedAt = nowIso();
        });

      request.accessLogs.push({
        signerId,
        action: "signed",
        timestamp: nowIso()
      });

      const allSigned = request.signers.every((s) => s.status === "signed");
      if (allSigned) {
        request.status = "completed";
        request.completedAt = nowIso();
        request.signedDocumentPath = `documents/${request.documentId}/signed/${signatureRequestId}.pdf`;
      } else {
        request.status = "partially_signed";
      }
    } else {
      signer.status = "declined";
      signer.declinedReason = signatureData.reason;
      request.status = "declined";
      request.accessLogs.push({
        signerId,
        action: "declined",
        timestamp: nowIso()
      });
    }

    state.signatureRequests[index] = request;
    this.store.save();

    return request;
  }

  createShareLink(actor: RequestActor, documentId: string, config?: {
    name?: string;
    accessLevel?: "view" | "download" | "edit";
    password?: string;
    expiresAt?: string;
    maxViews?: number;
    allowPrint?: boolean;
    allowCopy?: boolean;
    watermarkEnabled?: boolean;
  }): DocumentShareLink {
    this.getDocument(actor.tenantId, documentId);

    const now = nowIso();
    const link: DocumentShareLink = {
      id: newId("shr"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      documentId,
      token: newToken("doc"),
      name: config?.name,
      accessLevel: config?.accessLevel || "view",
      password: config?.password,
      expiresAt: config?.expiresAt,
      maxViews: config?.maxViews,
      viewCount: 0,
      allowPrint: config?.allowPrint ?? true,
      allowCopy: config?.allowCopy ?? false,
      watermarkEnabled: config?.watermarkEnabled ?? true,
      createdBy: actor.userId
    };

    this.store.getState().shareLinks.push(link);
    this.store.audit(actor, "share", "document", documentId);

    return link;
  }

  validateDocument(actor: RequestActor, documentId: string): DocumentValidation {
    const doc = this.getDocument(actor.tenantId, documentId);
    const checks: DocumentValidation["checks"] = [];

    checks.push({
      name: "title",
      status: doc.title && doc.title.trim() !== "" ? "passed" : "failed",
      message: doc.title ? "Title is present" : "Document title is required",
      field: "title"
    });

    checks.push({
      name: "content",
      status: doc.content && doc.content.trim() !== "" ? "passed" : "failed",
      message: doc.content ? "Content is present" : "Document content is required",
      field: "content"
    });

    const requiredFields = doc.fields.filter((f) => f.required);
    const missingRequiredFields = requiredFields.filter((f) => !f.value || f.value === "");
    checks.push({
      name: "required_fields",
      status: missingRequiredFields.length === 0 ? "passed" : "failed",
      message: missingRequiredFields.length === 0 ? "All required fields are filled" : `Missing required fields: ${missingRequiredFields.map((f) => f.key).join(", ")}`,
      field: "fields"
    });

    const brokenPlaceholders = doc.content.match(/\{\{[^}]+\}\}/g) || [];
    checks.push({
      name: "placeholders",
      status: brokenPlaceholders.length === 0 ? "passed" : "warning",
      message: brokenPlaceholders.length === 0 ? "No unresolved placeholders" : `Found ${brokenPlaceholders.length} unresolved placeholders`,
      field: "content"
    });

    checks.push({
      name: "versioning",
      status: doc.currentVersionId ? "passed" : "warning",
      message: doc.currentVersionId ? "Document is versioned" : "Document should be versioned",
      field: "version"
    });

    const allPassed = checks.every((c) => c.status === "passed");
    const anyFailed = checks.some((c) => c.status === "failed");

    const validation: DocumentValidation = {
      id: newId("val"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      documentId,
      status: anyFailed ? "failed" : allPassed ? "passed" : "warnings",
      checks,
      report: JSON.stringify(checks, null, 2),
      validatedBy: actor.userId
    };

    this.store.getState().validations.push(validation);
    return validation;
  }

  listTemplates(tenantId: string, filters?: { type?: DocumentType; status?: string; search?: string }): DocumentTemplate[] {
    let templates = this.store.getState().templates.filter((t) => t.tenantId === tenantId);

    if (filters?.type) {
      templates = templates.filter((t) => t.type === filters.type);
    }
    if (filters?.status) {
      templates = templates.filter((t) => t.status === filters.status);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      templates = templates.filter((t) =>
        t.name.toLowerCase().includes(search) ||
        t.description?.toLowerCase().includes(search)
      );
    }

    return templates.sort((a, b) => b.usageCount - a.usageCount);
  }

  createTemplate(actor: RequestActor, data: Partial<DocumentTemplate>): DocumentTemplate {
    const now = nowIso();
    const template: DocumentTemplate = {
      id: newId("tpl"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key: data.key || `tpl_${Date.now().toString(36)}`,
      name: data.name || "Untitled Template",
      description: data.description,
      type: data.type || "custom",
      status: data.status || "active",
      category: data.category,
      tags: data.tags || [],
      content: data.content || "",
      sections: data.sections || [],
      variables: data.variables || [],
      metadata: data.metadata || {},
      version: 1,
      parentTemplateId: data.parentTemplateId,
      usageCount: 0,
      createdBy: actor.userId
    };

    this.store.getState().templates.push(template);
    return template;
  }

  searchDocuments(tenantId: string, query: string, filters?: {
    type?: DocumentType;
    status?: DocumentStatus;
    limit?: number;
  }): any[] {
    const searchLower = query.toLowerCase();
    let results = this.store.getState().documents.filter((d) =>
      d.tenantId === tenantId &&
      (d.name.toLowerCase().includes(searchLower) ||
       d.title.toLowerCase().includes(searchLower) ||
       d.content.toLowerCase().includes(searchLower) ||
       d.metadata.tags?.some((tag) => tag.toLowerCase().includes(searchLower)))
    );

    if (filters?.type) {
      results = results.filter((d) => d.type === filters.type);
    }
    if (filters?.status) {
      results = results.filter((d) => d.status === filters.status);
    }

    const limit = filters?.limit || 20;
    return results.slice(0, limit).map((doc) => ({
      documentId: doc.id,
      title: doc.title,
      type: doc.type,
      status: doc.status,
      score: 1.0,
      highlights: [doc.title, doc.content.slice(0, 200)],
      metadata: { createdAt: doc.createdAt, updatedAt: doc.updatedAt }
    }));
  }

  logAccess(actor: RequestActor, documentId: string, action: DocumentAccessLog["action"], metadata?: Record<string, unknown>): void {
    this.getDocument(actor.tenantId, documentId);

    const log: DocumentAccessLog = {
      id: newId("log"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      documentId,
      action,
      userId: actor.userId,
      metadata: metadata || {}
    };

    this.store.getState().accessLogs.push(log);
  }
}
