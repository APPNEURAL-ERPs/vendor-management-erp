export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "document_admin" | "document_editor" | "document_approver" | "document_viewer" | "viewer";
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

export type DocumentType = 
  | "invoice" 
  | "quotation" 
  | "proposal" 
  | "contract" 
  | "agreement" 
  | "certificate" 
  | "resume" 
  | "report" 
  | "policy" 
  | "sop" 
  | "offer_letter" 
  | "receipt" 
  | "badge" 
  | "id_card" 
  | "custom";

export type DocumentStatus = 
  | "draft" 
  | "review" 
  | "approved" 
  | "published" 
  | "signed" 
  | "archived" 
  | "deprecated" 
  | "rolled_back";

export type SignatureStatus = 
  | "draft" 
  | "sent" 
  | "viewed" 
  | "signed" 
  | "partially_signed" 
  | "declined" 
  | "expired" 
  | "cancelled" 
  | "completed";

export type ApprovalStatus = 
  | "pending" 
  | "approved" 
  | "rejected" 
  | "cancelled";

export type ExportFormat = "pdf" | "docx" | "html" | "json" | "csv" | "xml";

export interface DocumentSection {
  id: UUID;
  title: string;
  content: string;
  order: number;
  variables: Record<string, string>;
  metadata: Record<string, unknown>;
}

export interface DocumentField {
  key: string;
  value: string;
  type: "text" | "number" | "date" | "currency" | "boolean" | "array" | "object";
  required: boolean;
  metadata: Record<string, unknown>;
}

export interface DocumentVariable {
  key: string;
  value: unknown;
  type: "text" | "number" | "date" | "currency" | "boolean" | "array" | "object";
  source: "template" | "user" | "system" | "calculated";
}

export interface DocumentMetadata extends BaseEntity {
  title: string;
  description?: string;
  tags: string[];
  category?: string;
  language?: string;
  version?: number;
  customFields: Record<string, unknown>;
}

export interface Document extends BaseEntity {
  key: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  templateId?: UUID;
  folderId?: UUID;
  ownerId?: UUID;
  title: string;
  content: string;
  sections: DocumentSection[];
  fields: DocumentField[];
  variables: DocumentVariable[];
  metadata: DocumentMetadata;
  exportedFormats: ExportFormat[];
  currentVersionId?: UUID;
  accessLevel: "private" | "tenant" | "shared" | "public";
  watermark?: string;
  qrCode?: string;
  verificationUrl?: string;
  brandConfig?: Record<string, unknown>;
  createdBy: UUID;
  updatedBy?: UUID;
}

export interface DocumentTemplate extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: DocumentType;
  status: EntityStatus;
  category?: string;
  tags: string[];
  content: string;
  sections: DocumentSection[];
  variables: DocumentVariable[];
  metadata: Record<string, unknown>;
  version: number;
  parentTemplateId?: UUID;
  usageCount: number;
  lastUsedAt?: ISODate;
  createdBy: UUID;
}

export interface DocumentVersion extends BaseEntity {
  documentId: UUID;
  version: number;
  name: string;
  content: string;
  sections: DocumentSection[];
  fields: Record<string, unknown>;
  status: DocumentStatus;
  createdBy: UUID;
  notes?: string;
  changeDescription?: string;
}

export interface PDFRender extends BaseEntity {
  documentId: UUID;
  versionId?: UUID;
  templateId?: UUID;
  status: "pending" | "rendering" | "completed" | "failed";
  format: "pdf";
  filePath?: string;
  fileSize?: number;
  pageCount?: number;
  renderedAt?: ISODate;
  errorMessage?: string;
  config: {
    pageSize?: string;
    orientation?: "portrait" | "landscape";
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    header?: { text?: string; image?: string };
    footer?: { text?: string; pageNumbers?: boolean };
    watermark?: { text?: string; opacity?: number; position?: string };
    branding?: Record<string, unknown>;
  };
  createdBy: UUID;
}

export interface DOCXExport extends BaseEntity {
  documentId: UUID;
  versionId?: UUID;
  templateId?: UUID;
  status: "pending" | "rendering" | "completed" | "failed";
  format: "docx";
  filePath?: string;
  fileSize?: number;
  exportedAt?: ISODate;
  errorMessage?: string;
  config: Record<string, unknown>;
  createdBy: UUID;
}

export interface HTMLExport extends BaseEntity {
  documentId: UUID;
  status: "pending" | "rendering" | "completed" | "failed";
  format: "html";
  htmlContent?: string;
  filePath?: string;
  liveUrl?: string;
  exportedAt?: ISODate;
  errorMessage?: string;
  config: {
    responsive?: boolean;
    branding?: Record<string, unknown>;
  };
  createdBy: UUID;
}

export interface SignatureField {
  id: UUID;
  signerId: UUID;
  type: "signature" | "initial" | "date" | "text" | "checkbox";
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  required: boolean;
  status: SignatureStatus;
  signedAt?: ISODate;
}

export interface SignerInfo {
  id: UUID;
  name: string;
  email: string;
  order: number;
  status: SignatureStatus;
  signedAt?: ISODate;
  declinedReason?: string;
}

export interface SignatureRequest extends BaseEntity {
  documentId: UUID;
  versionId?: UUID;
  signers: SignerInfo[];
  signatureFields: SignatureField[];
  status: SignatureStatus;
  orderedSigning: boolean;
  message?: string;
  expirationDays?: number;
  expiresAt?: ISODate;
  completedAt?: ISODate;
  signedDocumentPath?: string;
  certificatePath?: string;
  accessLogs: Array<{
    signerId: UUID;
    action: "sent" | "viewed" | "signed" | "declined" | "reminded";
    timestamp: ISODate;
    ipAddress?: string;
  }>;
  createdBy: UUID;
  completedBy?: UUID;
}

export interface DocumentApproval extends BaseEntity {
  documentId: UUID;
  versionId?: UUID;
  approvers: Array<{
    id: UUID;
    name: string;
    email: string;
    role: string;
    order: number;
    status: ApprovalStatus;
    approvedAt?: ISODate;
    rejectedAt?: ISODate;
    notes?: string;
  }>;
  status: ApprovalStatus;
  currentStep: number;
  approvalType: "sequential" | "parallel" | "any";
  completedAt?: ISODate;
  notes?: string;
  createdBy: UUID;
}

export interface DocumentWorkflow extends BaseEntity {
  documentId?: UUID;
  name: string;
  description?: string;
  type: "draft_to_approval" | "approval_to_signature" | "signature_to_archive" | "custom";
  status: EntityStatus;
  steps: Array<{
    id: UUID;
    name: string;
    type: "create" | "edit" | "review" | "approve" | "sign" | "publish" | "share" | "archive" | "notify";
    order: number;
    assigneeId?: UUID;
    assigneeRole?: string;
    config: Record<string, unknown>;
    status: "pending" | "in_progress" | "completed" | "skipped" | "failed";
    completedAt?: ISODate;
  }>;
  currentStepIndex: number;
  startedAt?: ISODate;
  completedAt?: ISODate;
  createdBy: UUID;
}

export interface DocumentShareLink extends BaseEntity {
  documentId: UUID;
  token: string;
  name?: string;
  accessLevel: "view" | "download" | "edit";
  password?: string;
  expiresAt?: ISODate;
  maxViews?: number;
  viewCount: number;
  lastAccessedAt?: ISODate;
  allowPrint: boolean;
  allowCopy: boolean;
  watermarkEnabled: boolean;
  createdBy: UUID;
}

export interface DocumentAccessLog extends BaseEntity {
  documentId: UUID;
  action: "view" | "download" | "edit" | "share" | "print" | "sign" | "approve";
  userId?: UUID;
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, unknown>;
}

export interface DocumentValidation extends BaseEntity {
  documentId: UUID;
  status: "passed" | "failed" | "warnings";
  checks: Array<{
    name: string;
    status: "passed" | "failed" | "warning";
    message?: string;
    field?: string;
  }>;
  report?: string;
  validatedBy: UUID;
}

export interface DocumentRetentionRule extends BaseEntity {
  name: string;
  description?: string;
  documentType?: DocumentType;
  retentionDays: number;
  archiveAction: "archive" | "delete" | "notify";
  notificationDays?: number;
  status: EntityStatus;
  createdBy: UUID;
}

export interface DocumentAuditLog extends BaseEntity {
  documentId: UUID;
  versionId?: UUID;
  actorId: UUID;
  action: "create" | "update" | "delete" | "render" | "export" | "approve" | "reject" | "sign" | "share" | "archive" | "restore";
  before?: unknown;
  after?: unknown;
  metadata: Record<string, unknown>;
}

export interface DocumentStorageObject extends BaseEntity {
  documentId: UUID;
  versionId?: UUID;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  storageType: "local" | "s3" | "r2" | "azure";
  storagePath: string;
  checksum?: string;
  createdBy: UUID;
}

export interface DocumentAnalyticsEvent extends BaseEntity {
  documentId: UUID;
  event: "view" | "download" | "share" | "sign" | "approve" | "export" | "qr_scan";
  userId?: UUID;
  metadata: Record<string, unknown>;
}

export interface DocumentOCRResult extends BaseEntity {
  documentId: UUID;
  filePath: string;
  status: "pending" | "processing" | "completed" | "failed";
  extractedText?: string;
  extractedFields?: Record<string, unknown>;
  confidence?: number;
  processedAt?: ISODate;
  errorMessage?: string;
}

export interface DocumentParserResult extends BaseEntity {
  documentId: UUID;
  status: "pending" | "processing" | "completed" | "failed";
  title?: string;
  sections?: DocumentSection[];
  tables?: Array<{ headers: string[]; rows: string[][] }>;
  extractedFields?: Record<string, unknown>;
  entities?: Array<{ type: string; value: string; confidence: number }>;
  summary?: string;
  processedAt?: ISODate;
  errorMessage?: string;
}

export interface DocumentSearchResult {
  documentId: UUID;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  score: number;
  highlights: string[];
  metadata: Record<string, unknown>;
}

export interface DocumentHealthScore {
  score: number;
  factors: {
    completeness: number;
    validation: number;
    versioning: number;
    security: number;
    accessibility: number;
  };
  issues: Array<{
    category: string;
    severity: "low" | "medium" | "high" | "critical";
    message: string;
    field?: string;
  }>;
}

export interface DocumentState {
  documents: Document[];
  templates: DocumentTemplate[];
  versions: DocumentVersion[];
  pdfRenders: PDFRender[];
  docxExports: DOCXExport[];
  htmlExports: HTMLExport[];
  signatureRequests: SignatureRequest[];
  approvals: DocumentApproval[];
  workflows: DocumentWorkflow[];
  shareLinks: DocumentShareLink[];
  accessLogs: DocumentAccessLog[];
  validations: DocumentValidation[];
  retentionRules: DocumentRetentionRule[];
  auditLogs: DocumentAuditLog[];
  storageObjects: DocumentStorageObject[];
  analyticsEvents: DocumentAnalyticsEvent[];
  ocrResults: DocumentOCRResult[];
  parserResults: DocumentParserResult[];
}

export interface DocumentOverview {
  documents: { total: number; byType: Record<DocumentType, number>; byStatus: Record<DocumentStatus, number> };
  templates: { total: number; active: number; byType: Record<DocumentType, number> };
  exports: { pdf: number; docx: number; html: number; failed: number };
  approvals: { pending: number; approved: number; rejected: number };
  signatures: { pending: number; completed: number; declined: number };
  workflows: { active: number; completed: number };
  storage: { usedMB: number; documentCount: number };
  healthScore: DocumentHealthScore;
}
