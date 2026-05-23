export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "media_admin" | "media_manager" | "content_creator" | "viewer";
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

export type MediaType = "image" | "video" | "audio" | "document" | "other";
export type MediaFormat = "png" | "jpg" | "jpeg" | "webp" | "gif" | "svg" | "mp4" | "mov" | "webm" | "mp3" | "wav" | "m4a" | "pdf" | "other";
export type UploadStatus = "pending" | "uploading" | "uploaded" | "validating" | "processing" | "ready" | "failed" | "rejected";
export type ProcessingStatus = "queued" | "processing" | "completed" | "failed" | "retrying" | "cancelled" | "manual_review";
export type ProcessingJobType = "thumbnail" | "transcode" | "compress" | "caption" | "watermark" | "optimize" | "resize" | "extract_metadata";

export interface MediaAsset extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: MediaType;
  format: MediaFormat;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  url: string;
  thumbnailUrl?: string;
  status: UploadStatus;
  category: string;
  tags: string[];
  folderId?: UUID;
  ownerId?: UUID;
  libraryId?: UUID;
  metadata: MediaMetadata;
  usageCount: number;
  viewCount: number;
  downloadCount: number;
}

export interface MediaMetadata {
  fileName: string;
  originalFileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  duration?: number;
  bitrate?: number;
  frameRate?: number;
  codec?: string;
  hasAudio?: boolean;
  hasVideo?: boolean;
  colorSpace?: string;
  orientation?: string;
  exif?: Record<string, unknown>;
  customFields?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface MediaFolder extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  parentId?: UUID;
  libraryId?: UUID;
  path: string;
  assetCount: number;
  status: EntityStatus;
}

export interface MediaCollection extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  libraryId?: UUID;
  assetIds: UUID[];
  tags: string[];
  status: EntityStatus;
}

export interface MediaVersion extends BaseEntity {
  assetId: UUID;
  version: number;
  url: string;
  thumbnailUrl?: string;
  size: number;
  changes?: string;
  createdBy: UUID;
}

export interface MediaThumbnail extends BaseEntity {
  assetId: UUID;
  width: number;
  height: number;
  url: string;
  type: "auto" | "manual" | "frame";
  timestamp?: number;
}

export interface MediaRendition extends BaseEntity {
  assetId: UUID;
  name: string;
  width: number;
  height: number;
  format: MediaFormat;
  url: string;
  size: number;
  purpose: string;
}

export interface MediaProcessingJob extends BaseEntity {
  assetId?: UUID;
  type: ProcessingJobType;
  status: ProcessingStatus;
  progress: number;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt?: ISODate;
  completedAt?: ISODate;
  retryCount: number;
  maxRetries: number;
}

export interface MediaCaption extends BaseEntity {
  assetId: UUID;
  language: string;
  content: string;
  format: "srt" | "vtt" | "txt";
  isDefault: boolean;
}

export interface MediaTranscript extends BaseEntity {
  assetId: UUID;
  language: string;
  content: string;
  duration: number;
  segments?: Array<{ start: number; end: number; text: string }>;
}

export interface MediaPublishTarget extends BaseEntity {
  assetId: UUID;
  target: "website" | "social" | "course" | "email" | "cdn" | "custom";
  targetId?: string;
  url?: string;
  status: "pending" | "published" | "failed" | "unpublished";
  publishedAt?: ISODate;
}

export interface MediaSchedule extends BaseEntity {
  assetId: UUID;
  publishAt: ISODate;
  target: string;
  status: "scheduled" | "published" | "cancelled" | "failed";
}

export interface MediaLicense extends BaseEntity {
  assetId: UUID;
  type: "owned" | "licensed" | "creative_commons" | "stock" | "client_provided" | "partner_provided" | "internal_only" | "public";
  licenseKey?: string;
  restrictions?: string[];
  expiresAt?: ISODate;
  attribution?: string;
  notes?: string;
}

export interface MediaAccessRule extends BaseEntity {
  assetId?: UUID;
  folderId?: UUID;
  libraryId?: UUID;
  effect: "allow" | "deny";
  roles: string[];
  conditions?: Record<string, unknown>;
}

export interface MediaAnalyticsEvent extends BaseEntity {
  assetId: UUID;
  event: "view" | "download" | "share" | "embed" | "play";
  userId?: UUID;
  metadata: Record<string, unknown>;
  sessionId?: string;
}

export interface MediaAuditLog extends BaseEntity {
  actorId: UUID;
  role: Role;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
}

export interface MediaEvent extends BaseEntity {
  type: string;
  source: string;
  actorId?: UUID;
  data: Record<string, unknown>;
  correlationId?: UUID;
}

export interface MediaCDNRecord extends BaseEntity {
  assetId: UUID;
  cdnProvider: string;
  url: string;
  cachePolicy: string;
  expiresAt?: ISODate;
  hitCount: number;
  bandwidthBytes: number;
}

export interface MediaLibrary extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "brand" | "course" | "social" | "product" | "general";
  assetCount: number;
  storageBytes: number;
  status: EntityStatus;
}

export interface MediaOSState {
  libraries: MediaLibrary[];
  assets: MediaAsset[];
  folders: MediaFolder[];
  collections: MediaCollection[];
  versions: MediaVersion[];
  thumbnails: MediaThumbnail[];
  renditions: MediaRendition[];
  processingJobs: MediaProcessingJob[];
  captions: MediaCaption[];
  transcripts: MediaTranscript[];
  publishTargets: MediaPublishTarget[];
  schedules: MediaSchedule[];
  licenses: MediaLicense[];
  accessRules: MediaAccessRule[];
  analyticsEvents: MediaAnalyticsEvent[];
  auditLogs: MediaAuditLog[];
  events: MediaEvent[];
  cdnRecords: MediaCDNRecord[];
}

export interface MediaOverview {
  libraries: number;
  assets: { total: number; byType: Record<MediaType, number> };
  storage: { totalBytes: number; usedBytes: number };
  processing: { queued: number; active: number; completed: number; failed: number };
  analytics: { views: number; downloads: number; shares: number };
}
