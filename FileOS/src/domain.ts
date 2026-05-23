export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "viewer" | "file_user" | "file_admin" | "admin" | "owner";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";
export type FileStatus = "pending" | "uploading" | "uploaded" | "processing" | "active" | "archived" | "deleted";
export type UploadStatus = "pending" | "uploading" | "uploaded" | "processing" | "failed" | "rejected" | "completed";
export type ScanStatus = "pending" | "scanning" | "clean" | "suspicious" | "infected" | "quarantined" | "rejected";
export type ShareStatus = "active" | "expired" | "revoked";
export type VersionStatus = "draft" | "current" | "previous" | "approved" | "signed" | "archived" | "deprecated";
export type ProcessingStatus = "queued" | "processing" | "completed" | "failed" | "retrying" | "cancelled";
export type StorageProvider = "local" | "s3" | "r2" | "azure" | "gcs" | "minio";

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

export interface FileObject extends BaseEntity {
  name: string;
  key: string;
  folderId?: UUID;
  mimeType: string;
  size: number;
  extension: string;
  status: FileStatus;
  ownerId: UUID;
  currentVersionId?: UUID;
  storageProvider: StorageProvider;
  storagePath: string;
  checksum?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  scanStatus: ScanStatus;
  previewId?: UUID;
  thumbnailId?: UUID;
  uploadedBy: UUID;
  uploadedAt: ISODate;
  lastAccessedAt?: ISODate;
  lastModifiedAt?: ISODate;
  expiresAt?: ISODate;
  retentionDays?: number;
  isPublic: boolean;
  isProtected: boolean;
  module?: string;
}

export interface FileFolder extends BaseEntity {
  name: string;
  key: string;
  parentId?: UUID;
  ownerId: UUID;
  status: EntityStatus;
  permissions: FilePermission[];
  path: string;
  fileCount: number;
  folderCount: number;
  totalSize: number;
  isPublic: boolean;
}

export interface FileVersion extends BaseEntity {
  fileId: UUID;
  versionNumber: number;
  status: VersionStatus;
  size: number;
  checksum?: string;
  storagePath: string;
  storageProvider: StorageProvider;
  notes?: string;
  createdBy: UUID;
  previousVersionId?: UUID;
  isLocked: boolean;
  lockedBy?: UUID;
  lockedAt?: ISODate;
}

export interface FileMetadata extends BaseEntity {
  fileId: UUID;
  versionId?: UUID;
  extractedText?: string;
  extractedFields: Record<string, unknown>;
  customMetadata: Record<string, unknown>;
  encoding?: string;
  width?: number;
  height?: number;
  duration?: number;
  pageCount?: number;
  wordCount?: number;
  language?: string;
}

export interface FileUpload extends BaseEntity {
  fileName: string;
  folderId?: UUID;
  mimeType: string;
  size: number;
  status: UploadStatus;
  uploadedBy: UUID;
  storageProvider: StorageProvider;
  chunkIndex?: number;
  totalChunks?: number;
  storagePath?: string;
  errorMessage?: string;
  progress: number;
  module?: string;
  expiresAt?: ISODate;
}

export interface FileDownload extends BaseEntity {
  fileId: UUID;
  versionId?: UUID;
  downloadedBy: UUID;
  downloadCount: number;
  lastDownloadedAt: ISODate;
  ipAddress?: string;
  userAgent?: string;
  expiresAt?: ISODate;
  maxDownloads?: number;
  requireAuth: boolean;
}

export interface FilePermission extends BaseEntity {
  fileId?: UUID;
  folderId?: UUID;
  subjectType: "user" | "group" | "role" | "tenant";
  subjectId: UUID;
  permissions: FilePermissionType[];
  grantedBy: UUID;
  expiresAt?: ISODate;
  isInherited: boolean;
}

export type FilePermissionType = 
  | "file.view"
  | "file.upload"
  | "file.download"
  | "file.share"
  | "file.update"
  | "file.delete"
  | "file.archive"
  | "file.restore"
  | "file.scan"
  | "file.preview"
  | "file.manage_permissions";

export interface FileShareLink extends BaseEntity {
  fileId: UUID;
  versionId?: UUID;
  token: string;
  url: string;
  status: ShareStatus;
  createdBy: UUID;
  permissions: FilePermissionType[];
  expiresAt?: ISODate;
  maxDownloads?: number;
  downloadCount: number;
  passwordHash?: string;
  requireLogin: boolean;
  allowPreview: boolean;
  allowDownload: boolean;
  watermarkEnabled: boolean;
  metadata?: Record<string, unknown>;
}

export interface FilePreview extends BaseEntity {
  fileId: UUID;
  versionId?: UUID;
  type: "pdf" | "image" | "video" | "audio" | "document" | "text" | "thumbnail";
  url: string;
  width?: number;
  height?: number;
  duration?: number;
  status: ProcessingStatus;
  processedAt?: ISODate;
  metadata?: Record<string, unknown>;
}

export interface StorageBucket extends BaseEntity {
  name: string;
  key: string;
  provider: StorageProvider;
  region?: string;
  endpoint?: string;
  bucketName: string;
  accessKeyId?: string;
  status: EntityStatus;
  totalSize: number;
  maxSize?: number;
  fileCount: number;
  isDefault: boolean;
  config: Record<string, unknown>;
}

export interface FileScanResult extends BaseEntity {
  fileId: UUID;
  versionId?: UUID;
  status: ScanStatus;
  scanEngine: string;
  scannedAt: ISODate;
  threats: FileThreat[];
  quarantined: boolean;
  quarantineReason?: string;
  metadata?: Record<string, unknown>;
}

export interface FileThreat {
  type: string;
  name: string;
  severity: "low" | "medium" | "high" | "critical";
  description?: string;
  details?: Record<string, unknown>;
}

export interface FileProcessingJob extends BaseEntity {
  fileId: UUID;
  versionId?: UUID;
  type: "thumbnail" | "preview" | "conversion" | "compression" | "ocr" | "text_extraction" | "metadata_extraction";
  status: ProcessingStatus;
  progress: number;
  inputFormat?: string;
  outputFormat?: string;
  outputUrl?: string;
  errorMessage?: string;
  retryCount: number;
  startedAt?: ISODate;
  completedAt?: ISODate;
  metadata?: Record<string, unknown>;
}

export interface FileRetentionRule extends BaseEntity {
  name: string;
  key: string;
  filePattern?: string;
  folderId?: UUID;
  retentionDays?: number;
  archiveAfterDays?: number;
  deleteAfterDays?: number;
  status: EntityStatus;
  createdBy: UUID;
}

export interface FileAuditLog extends BaseEntity {
  fileId?: UUID;
  folderId?: UUID;
  actorId: UUID;
  role: Role;
  action: FileAuditAction;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export type FileAuditAction = 
  | "file.upload"
  | "file.download"
  | "file.view"
  | "file.preview"
  | "file.share"
  | "file.unshare"
  | "file.update"
  | "file.delete"
  | "file.restore"
  | "file.archive"
  | "file.scan"
  | "file.quarantine"
  | "file.release_quarantine"
  | "file.convert"
  | "file.compress"
  | "file.version.create"
  | "file.version.restore"
  | "file.permission.grant"
  | "file.permission.revoke"
  | "folder.create"
  | "folder.delete"
  | "folder.update"
  | "folder.share"
  | "bucket.create"
  | "retention_rule.create"
  | "file.search"
  | "system.init";

export interface FileEvent extends BaseEntity {
  type: string;
  source: string;
  fileId?: UUID;
  folderId?: UUID;
  actorId: UUID;
  data: Record<string, unknown>;
  correlationId?: UUID;
}

export interface FileAnalytics extends BaseEntity {
  fileId: UUID;
  viewCount: number;
  downloadCount: number;
  shareCount: number;
  lastViewedAt?: ISODate;
  lastDownloadedAt?: ISODate;
  uniqueViewers: UUID[];
  uniqueDownloaders: UUID[];
  storageCost: number;
}

export interface FileOSState {
  files: FileObject[];
  folders: FileFolder[];
  versions: FileVersion[];
  metadata: FileMetadata[];
  uploads: FileUpload[];
  downloads: FileDownload[];
  permissions: FilePermission[];
  shareLinks: FileShareLink[];
  previews: FilePreview[];
  buckets: StorageBucket[];
  scanResults: FileScanResult[];
  processingJobs: FileProcessingJob[];
  retentionRules: FileRetentionRule[];
  auditLogs: FileAuditLog[];
  events: FileEvent[];
  analytics: FileAnalytics[];
}

export interface FileOSOverview {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  filesByStatus: Record<FileStatus, number>;
  filesByType: Record<string, number>;
  uploads: { total: number; pending: number; failed: number };
  downloads: { total: number; today: number };
  shares: { total: number; active: number; expired: number };
  scans: { total: number; clean: number; threats: number };
  storage: { total: number; byProvider: Record<StorageProvider, number> };
}
