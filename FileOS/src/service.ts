import { DataStore } from "./core/datastore";
import {
  FileObject,
  FileFolder,
  FileVersion,
  FileMetadata,
  FileUpload,
  FileDownload,
  FilePermission,
  FilePermissionType,
  FileShareLink,
  FilePreview,
  StorageBucket,
  FileScanResult,
  FileProcessingJob,
  FileRetentionRule,
  FileAuditLog,
  FileEvent,
  FileAnalytics,
  FileOSOverview,
  FileStatus,
  ScanStatus,
  UploadStatus,
  ShareStatus,
  VersionStatus,
  ProcessingStatus,
  StorageProvider,
  RequestActor
} from "./domain";
import {
  badRequest,
  conflict,
  notFound,
  ensureObject,
  ensureString,
  ensureNumber,
  ensureBoolean,
  ensureArray,
  ensureEnum,
  optionalString,
  optionalObject,
  pickQuery,
  clone,
  countBy,
  sanitizeFilename,
  buildFolderPath
} from "./core/utils";
import {
  newId,
  newToken,
  nowIso,
  getFileExtension,
  getMimeType,
  generateChecksum,
  isExpired,
  plusDays,
  formatBytes
} from "./core/id";

export class FileService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "FileOS service is ready";
  }

  overview(actor: RequestActor): FileOSOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    const files = state.files.filter(f => f.tenantId === tenant);
    const folders = state.folders.filter(f => f.tenantId === tenant);
    const uploads = state.uploads.filter(u => u.tenantId === tenant);
    const downloads = state.downloads.filter(d => d.tenantId === tenant);
    const shareLinks = state.shareLinks.filter(s => s.tenantId === tenant);
    const scans = state.scanResults.filter(s => s.tenantId === tenant);

    const today = new Date().toISOString().split("T")[0];
    
    const storageByProvider: Record<StorageProvider, number> = {
      local: 0, s3: 0, r2: 0, azure: 0, gcs: 0, minio: 0
    };
    for (const file of files) {
      storageByProvider[file.storageProvider] = (storageByProvider[file.storageProvider] || 0) + file.size;
    }

    return {
      totalFiles: files.length,
      totalFolders: folders.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
      filesByStatus: countBy(files, "status") as Record<FileStatus, number>,
      filesByType: countBy(files.filter(f => f.mimeType), "mimeType"),
      uploads: {
        total: uploads.length,
        pending: uploads.filter(u => ["pending", "uploading", "processing"].includes(u.status)).length,
        failed: uploads.filter(u => u.status === "failed").length
      },
      downloads: {
        total: downloads.length,
        today: downloads.filter(d => d.lastDownloadedAt.startsWith(today)).length
      },
      shares: {
        total: shareLinks.length,
        active: shareLinks.filter(s => s.status === "active").length,
        expired: shareLinks.filter(s => s.status === "expired").length
      },
      scans: {
        total: scans.length,
        clean: scans.filter(s => s.status === "clean").length,
        threats: scans.filter(s => ["suspicious", "infected", "quarantined"].includes(s.status)).length
      },
      storage: {
        total: files.reduce((sum, f) => sum + f.size, 0),
        byProvider: storageByProvider
      }
    };
  }

  listBuckets(actor: RequestActor): StorageBucket[] {
    return clone(this.store.getState().buckets.filter(b => b.tenantId === actor.tenantId));
  }

  createBucket(input: unknown, actor: RequestActor): StorageBucket {
    const body = ensureObject(input, "bucket");
    const state = this.store.getState();
    const key = ensureString(body.key, "bucket.key");
    if (state.buckets.some(b => b.tenantId === actor.tenantId && b.key === key)) {
      conflict(`Bucket key '${key}' already exists`);
    }
    const bucket: StorageBucket = {
      id: newId("bucket"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "bucket.name"),
      key,
      provider: ensureEnum(body.provider, "bucket.provider", ["local", "s3", "r2", "azure", "gcs", "minio"], "local"),
      region: optionalString(body.region),
      endpoint: optionalString(body.endpoint),
      bucketName: ensureString(body.bucketName, "bucket.bucketName"),
      accessKeyId: optionalString(body.accessKeyId),
      status: ensureEnum(body.status, "bucket.status", ["active", "inactive", "archived", "draft"], "active"),
      totalSize: 0,
      maxSize: body.maxSize ? ensureNumber(body.maxSize, "bucket.maxSize") : undefined,
      fileCount: 0,
      isDefault: ensureBoolean(body.isDefault, false),
      config: optionalObject(body.config)
    };
    state.buckets.push(bucket);
    this.store.save();
    this.store.audit(actor, "bucket.create", "bucket", bucket.id, undefined, bucket);
    return clone(bucket);
  }

  listFolders(actor: RequestActor, query?: URLSearchParams): FileFolder[] {
    const parentId = pickQuery(query, "parentId");
    const search = pickQuery(query, "search")?.toLowerCase();
    return clone(this.store.getState().folders.filter(f => {
      if (f.tenantId !== actor.tenantId) return false;
      if (f.status === "archived") return false;
      if (parentId && f.parentId !== parentId) return false;
      if (search && !f.name.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  getFolder(id: string, actor: RequestActor): FileFolder {
    const folder = this.store.getState().folders.find(f => f.id === id && f.tenantId === actor.tenantId);
    if (!folder) notFound("Folder not found");
    return clone(folder);
  }

  createFolder(input: unknown, actor: RequestActor): FileFolder {
    const body = ensureObject(input, "folder");
    const state = this.store.getState();
    const name = ensureString(body.name, "folder.name");
    const parentId = optionalString(body.parentId);
    
    if (parentId) {
      const parent = state.folders.find(f => f.id === parentId && f.tenantId === actor.tenantId);
      if (!parent) notFound("Parent folder not found");
    }

    const path = buildFolderPath(
      parentId ? state.folders.find(f => f.id === parentId)?.path : undefined,
      name
    );

    const folder: FileFolder = {
      id: newId("folder"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name,
      key: sanitizeFilename(name),
      parentId,
      ownerId: actor.userId,
      status: "active",
      permissions: [],
      path,
      fileCount: 0,
      folderCount: 0,
      totalSize: 0,
      isPublic: ensureBoolean(body.isPublic, false)
    };

    state.folders.push(folder);
    if (parentId) {
      const parent = state.folders.find(f => f.id === parentId);
      if (parent) {
        parent.folderCount++;
        parent.updatedAt = nowIso();
      }
    }

    this.store.save();
    this.store.audit(actor, "folder.create", "folder", folder.id, undefined, folder);
    return clone(folder);
  }

  updateFolder(id: string, input: unknown, actor: RequestActor): FileFolder {
    const body = ensureObject(input, "folder");
    const state = this.store.getState();
    const folder = state.folders.find(f => f.id === id && f.tenantId === actor.tenantId);
    if (!folder) notFound("Folder not found");

    const before = clone(folder);
    
    if (body.name) folder.name = ensureString(body.name, "folder.name");
    if (body.parentId !== undefined) {
      folder.parentId = optionalString(body.parentId);
      folder.path = buildFolderPath(
        folder.parentId ? state.folders.find(f => f.id === folder.parentId)?.path : undefined,
        folder.name
      );
    }
    if (body.isPublic !== undefined) folder.isPublic = ensureBoolean(body.isPublic);
    if (body.status) folder.status = ensureEnum(body.status, "folder.status", ["active", "inactive", "archived", "draft"]);
    
    folder.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "folder.update", "folder", folder.id, before, folder);
    return clone(folder);
  }

  deleteFolder(id: string, actor: RequestActor): void {
    const state = this.store.getState();
    const folder = state.folders.find(f => f.id === id && f.tenantId === actor.tenantId);
    if (!folder) notFound("Folder not found");

    const files = state.files.filter(f => f.folderId === id);
    if (files.length > 0) badRequest("Cannot delete folder with files. Move or delete files first.");

    const subfolders = state.folders.filter(f => f.parentId === id);
    if (subfolders.length > 0) badRequest("Cannot delete folder with subfolders. Delete subfolders first.");

    const before = clone(folder);
    folder.status = "archived";
    folder.updatedAt = nowIso();

    if (folder.parentId) {
      const parent = state.folders.find(f => f.id === folder.parentId);
      if (parent) {
        parent.folderCount = Math.max(0, parent.folderCount - 1);
        parent.updatedAt = nowIso();
      }
    }

    this.store.save();
    this.store.audit(actor, "folder.delete", "folder", folder.id, before, folder);
  }

  listFiles(actor: RequestActor, query?: URLSearchParams): FileObject[] {
    const folderId = pickQuery(query, "folderId");
    const search = pickQuery(query, "search")?.toLowerCase();
    const type = pickQuery(query, "type");
    const status = pickQuery(query, "status");
    const ownerId = pickQuery(query, "ownerId");

    return clone(this.store.getState().files.filter(f => {
      if (f.tenantId !== actor.tenantId) return false;
      if (f.status === "deleted") return false;
      if (folderId && f.folderId !== folderId) return false;
      if (type && !f.mimeType.startsWith(type)) return false;
      if (status && f.status !== status) return false;
      if (ownerId && f.ownerId !== ownerId) return false;
      if (search) {
        const searchable = `${f.name} ${f.tags.join(" ")}`.toLowerCase();
        if (!searchable.includes(search)) return false;
      }
      return true;
    }));
  }

  getFile(id: string, actor: RequestActor): FileObject {
    const file = this.store.getState().files.find(f => f.id === id && f.tenantId === actor.tenantId);
    if (!file) notFound("File not found");
    this.store.audit(actor, "file.view", "file", file.id, undefined, { name: file.name });
    return clone(file);
  }

  createFile(input: unknown, actor: RequestActor): FileObject {
    const body = ensureObject(input, "file");
    const state = this.store.getState();

    const fileName = ensureString(body.name || body.fileName, "file.name");
    const extension = getFileExtension(fileName);
    const mimeType = body.mimeType || getMimeType(fileName, extension);

    if (body.folderId) {
      const folder = state.folders.find(f => f.id === body.folderId && f.tenantId === actor.tenantId);
      if (!folder) notFound("Folder not found");
    }

    const storageBucket = state.buckets.find(b => b.tenantId === actor.tenantId && b.isDefault) || 
                         state.buckets.find(b => b.tenantId === actor.tenantId) ||
                         { id: "local", provider: "local" as StorageProvider };

    const file: FileObject = {
      id: newId("file"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: fileName,
      key: `${newId("fk")}_${sanitizeFilename(fileName)}`,
      folderId: optionalString(body.folderId),
      mimeType,
      size: ensureNumber(body.size, "file.size", 0),
      extension,
      status: ensureEnum(body.status, "file.status", ["pending", "uploading", "uploaded", "processing", "active", "archived", "deleted"], "uploaded"),
      ownerId: actor.userId,
      storageProvider: (storageBucket as StorageBucket).provider || "local",
      storagePath: `${actor.tenantId}/${body.folderId || "root"}/${sanitizeFilename(fileName)}`,
      tags: ensureArray(body.tags, "file.tags"),
      metadata: optionalObject(body.metadata),
      scanStatus: "pending",
      uploadedBy: actor.userId,
      uploadedAt: nowIso(),
      lastModifiedAt: nowIso(),
      isPublic: ensureBoolean(body.isPublic, false),
      isProtected: ensureBoolean(body.isProtected, false),
      module: optionalString(body.module)
    };

    if (body.checksum) {
      file.checksum = String(body.checksum);
    }

    state.files.push(file);

    const bucket = state.buckets.find(b => b.id === (storageBucket as StorageBucket).id);
    if (bucket) {
      bucket.totalSize += file.size;
      bucket.fileCount++;
      bucket.updatedAt = nowIso();
    }

    if (file.folderId) {
      const folder = state.folders.find(f => f.id === file.folderId);
      if (folder) {
        folder.fileCount++;
        folder.totalSize += file.size;
        folder.updatedAt = nowIso();
      }
    }

    this.store.save();
    this.store.audit(actor, "file.upload", "file", file.id, undefined, { name: file.name, size: file.size, mimeType });
    return clone(file);
  }

  updateFile(id: string, input: unknown, actor: RequestActor): FileObject {
    const body = ensureObject(input, "file");
    const state = this.store.getState();
    const file = state.files.find(f => f.id === id && f.tenantId === actor.tenantId);
    if (!file) notFound("File not found");

    const before = clone(file);

    if (body.name) {
      file.name = ensureString(body.name, "file.name");
      file.extension = getFileExtension(file.name);
    }
    if (body.folderId !== undefined) {
      const oldFolderId = file.folderId;
      file.folderId = optionalString(body.folderId);
      if (oldFolderId) {
        const oldFolder = state.folders.find(f => f.id === oldFolderId);
        if (oldFolder) {
          oldFolder.fileCount = Math.max(0, oldFolder.fileCount - 1);
          oldFolder.totalSize = Math.max(0, oldFolder.totalSize - file.size);
          oldFolder.updatedAt = nowIso();
        }
      }
      if (file.folderId) {
        const newFolder = state.folders.find(f => f.id === file.folderId);
        if (newFolder) {
          newFolder.fileCount++;
          newFolder.totalSize += file.size;
          newFolder.updatedAt = nowIso();
        }
      }
      file.storagePath = `${actor.tenantId}/${file.folderId || "root"}/${sanitizeFilename(file.name)}`;
    }
    if (body.tags) file.tags = ensureArray(body.tags, "file.tags");
    if (body.metadata) file.metadata = { ...file.metadata, ...optionalObject(body.metadata) };
    if (body.status) file.status = ensureEnum(body.status, "file.status", ["pending", "uploading", "uploaded", "processing", "active", "archived", "deleted"]);
    if (body.isPublic !== undefined) file.isPublic = ensureBoolean(body.isPublic);
    if (body.isProtected !== undefined) file.isProtected = ensureBoolean(body.isProtected);
    if (body.expiresAt) file.expiresAt = ensureString(body.expiresAt, "file.expiresAt");
    if (body.retentionDays) file.retentionDays = ensureNumber(body.retentionDays, "file.retentionDays");

    file.updatedAt = nowIso();
    file.lastModifiedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "file.update", "file", file.id, before, file);
    return clone(file);
  }

  deleteFile(id: string, actor: RequestActor): void {
    const state = this.store.getState();
    const file = state.files.find(f => f.id === id && f.tenantId === actor.tenantId);
    if (!file) notFound("File not found");

    const before = clone(file);
    file.status = "deleted";
    file.updatedAt = nowIso();

    const bucket = state.buckets.find(b => b.tenantId === actor.tenantId && b.provider === file.storageProvider);
    if (bucket) {
      bucket.totalSize = Math.max(0, bucket.totalSize - file.size);
      bucket.fileCount = Math.max(0, bucket.fileCount - 1);
      bucket.updatedAt = nowIso();
    }

    if (file.folderId) {
      const folder = state.folders.find(f => f.id === file.folderId);
      if (folder) {
        folder.fileCount = Math.max(0, folder.fileCount - 1);
        folder.totalSize = Math.max(0, folder.totalSize - file.size);
        folder.updatedAt = nowIso();
      }
    }

    this.store.save();
    this.store.audit(actor, "file.delete", "file", file.id, before, file);
  }

  createVersion(fileId: string, input: unknown, actor: RequestActor): FileVersion {
    const body = ensureObject(input, "version");
    const state = this.store.getState();
    const file = state.files.find(f => f.id === fileId && f.tenantId === actor.tenantId);
    if (!file) notFound("File not found");

    const existingVersions = state.versions.filter(v => v.fileId === fileId);
    const maxVersion = Math.max(0, ...existingVersions.map(v => v.versionNumber));

    const previousVersion = existingVersions.find(v => v.status === "current");
    if (previousVersion) {
      previousVersion.status = "previous";
      previousVersion.updatedAt = nowIso();
    }

    const version: FileVersion = {
      id: newId("ver"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      fileId,
      versionNumber: maxVersion + 1,
      status: "current",
      size: ensureNumber(body.size, "version.size", file.size),
      checksum: optionalString(body.checksum) || file.checksum,
      storagePath: `${file.storagePath}/versions/v${maxVersion + 1}`,
      storageProvider: file.storageProvider,
      notes: optionalString(body.notes),
      previousVersionId: previousVersion?.id,
      createdBy: actor.userId,
      isLocked: false
    };

    state.versions.push(version);

    file.currentVersionId = version.id;
    file.size = version.size;
    file.checksum = version.checksum;
    file.updatedAt = nowIso();
    file.lastModifiedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "file.version.create", "file", fileId, undefined, { versionNumber: version.versionNumber });
    return clone(version);
  }

  listVersions(fileId: string, actor: RequestActor): FileVersion[] {
    const file = this.store.getState().files.find(f => f.id === fileId && f.tenantId === actor.tenantId);
    if (!file) notFound("File not found");
    return clone(this.store.getState().versions.filter(v => v.fileId === fileId).sort((a, b) => b.versionNumber - a.versionNumber));
  }

  restoreVersion(fileId: string, versionId: string, actor: RequestActor): FileVersion {
    const state = this.store.getState();
    const file = state.files.find(f => f.id === fileId && f.tenantId === actor.tenantId);
    if (!file) notFound("File not found");

    const version = state.versions.find(v => v.id === versionId && v.fileId === fileId);
    if (!version) notFound("Version not found");

    const currentVersion = state.versions.find(v => v.fileId === fileId && v.status === "current");
    if (currentVersion) {
      currentVersion.status = "previous";
      currentVersion.updatedAt = nowIso();
    }

    version.status = "current";
    version.updatedAt = nowIso();

    file.currentVersionId = version.id;
    file.size = version.size;
    file.checksum = version.checksum;
    file.updatedAt = nowIso();
    file.lastModifiedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "file.version.restore", "file", fileId, undefined, { versionId, versionNumber: version.versionNumber });
    return clone(version);
  }

  createShareLink(fileId: string, input: unknown, actor: RequestActor): FileShareLink {
    const body = ensureObject(input, "shareLink");
    const state = this.store.getState();
    const file = state.files.find(f => f.id === fileId && f.tenantId === actor.tenantId);
    if (!file) notFound("File not found");

    const token = newToken("share");
    const shareLink: FileShareLink = {
      id: newId("share"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      fileId,
      versionId: optionalString(body.versionId),
      token,
      url: `/fileos/share/${token}`,
      status: "active",
      createdBy: actor.userId,
      permissions: ensureArray(body.permissions, "shareLink.permissions", ["file.download", "file.preview"]),
      expiresAt: body.expiresAt ? ensureString(body.expiresAt, "shareLink.expiresAt") : plusDays(7),
      maxDownloads: body.maxDownloads ? ensureNumber(body.maxDownloads, "shareLink.maxDownloads") : undefined,
      downloadCount: 0,
      passwordHash: optionalString(body.password),
      requireLogin: ensureBoolean(body.requireLogin, false),
      allowPreview: ensureBoolean(body.allowPreview, true),
      allowDownload: ensureBoolean(body.allowDownload, true),
      watermarkEnabled: ensureBoolean(body.watermarkEnabled, false),
      metadata: optionalObject(body.metadata)
    };

    state.shareLinks.push(shareLink);
    this.store.save();
    this.store.audit(actor, "file.share", "file", fileId, undefined, { shareLinkId: shareLink.id });
    return clone(shareLink);
  }

  getShareLink(token: string, actor: RequestActor): FileShareLink & { file: FileObject } {
    const state = this.store.getState();
    const shareLink = state.shareLinks.find(s => s.token === token);
    if (!shareLink) notFound("Share link not found");

    if (shareLink.status === "expired" || (shareLink.expiresAt && isExpired(shareLink.expiresAt))) {
      shareLink.status = "expired";
      this.store.save();
      notFound("Share link has expired");
    }

    if (shareLink.maxDownloads && shareLink.downloadCount >= shareLink.maxDownloads) {
      notFound("Share link download limit reached");
    }

    const file = state.files.find(f => f.id === shareLink.fileId && f.tenantId === shareLink.tenantId);
    if (!file) notFound("File not found");

    return { ...clone(shareLink), file: clone(file) };
  }

  recordDownload(fileId: string, actor: RequestActor): void {
    const state = this.store.getState();
    const file = state.files.find(f => f.id === fileId && f.tenantId === actor.tenantId);
    if (!file) notFound("File not found");

    let analytics = state.analytics.find(a => a.fileId === fileId && a.tenantId === actor.tenantId);
    if (!analytics) {
      analytics = {
        id: newId("analytics"),
        tenantId: actor.tenantId,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        fileId,
        viewCount: 0,
        downloadCount: 0,
        shareCount: 0,
        uniqueViewers: [],
        uniqueDownloaders: [],
        storageCost: 0
      };
      state.analytics.push(analytics);
    }

    analytics.downloadCount++;
    analytics.lastDownloadedAt = nowIso();
    if (!analytics.uniqueDownloaders.includes(actor.userId)) {
      analytics.uniqueDownloaders.push(actor.userId);
    }
    analytics.updatedAt = nowIso();

    const existingDownload = state.downloads.find(d => d.fileId === fileId && d.downloadedBy === actor.userId);
    if (existingDownload) {
      existingDownload.downloadCount++;
      existingDownload.lastDownloadedAt = nowIso();
      existingDownload.updatedAt = nowIso();
    } else {
      state.downloads.push({
        id: newId("dl"),
        tenantId: actor.tenantId,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        fileId,
        downloadedBy: actor.userId,
        downloadCount: 1,
        lastDownloadedAt: nowIso(),
        requireAuth: true
      });
    }

    this.store.save();
    this.store.audit(actor, "file.download", "file", fileId, undefined, { analytics: true });
  }

  listPermissions(fileId: string, actor: RequestActor): FilePermission[] {
    const file = this.store.getState().files.find(f => f.id === fileId && f.tenantId === actor.tenantId);
    if (!file) notFound("File not found");
    return clone(this.store.getState().permissions.filter(p => p.fileId === fileId && p.tenantId === actor.tenantId));
  }

  grantPermission(fileId: string, input: unknown, actor: RequestActor): FilePermission {
    const body = ensureObject(input, "permission");
    const state = this.store.getState();
    const file = state.files.find(f => f.id === fileId && f.tenantId === actor.tenantId);
    if (!file) notFound("File not found");

    const permission: FilePermission = {
      id: newId("perm"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      fileId,
      subjectType: ensureEnum(body.subjectType, "permission.subjectType", ["user", "group", "role", "tenant"]),
      subjectId: ensureString(body.subjectId, "permission.subjectId"),
      permissions: ensureArray(body.permissions, "permission.permissions"),
      grantedBy: actor.userId,
      expiresAt: body.expiresAt ? ensureString(body.expiresAt, "permission.expiresAt") : undefined,
      isInherited: false
    };

    state.permissions.push(permission);
    this.store.save();
    this.store.audit(actor, "file.permission.grant", "file", fileId, undefined, { permissionId: permission.id });
    return clone(permission);
  }

  revokePermission(permissionId: string, actor: RequestActor): void {
    const state = this.store.getState();
    const permission = state.permissions.find(p => p.id === permissionId && p.tenantId === actor.tenantId);
    if (!permission) notFound("Permission not found");

    const before = clone(permission);
    state.permissions = state.permissions.filter(p => p.id !== permissionId);
    this.store.save();
    this.store.audit(actor, "file.permission.revoke", "file", permission.fileId, before, undefined);
  }

  scanFile(fileId: string, actor: RequestActor): FileScanResult {
    const state = this.store.getState();
    const file = state.files.find(f => f.id === fileId && f.tenantId === actor.tenantId);
    if (!file) notFound("File not found");

    const result: FileScanResult = {
      id: newId("scan"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      fileId,
      status: "clean",
      scanEngine: "FileOS-Demo-Scanner",
      scannedAt: nowIso(),
      threats: [],
      quarantined: false
    };

    const dangerousExtensions = ["exe", "dmg", "bat", "sh", "cmd", "msi", "app"];
    if (dangerousExtensions.includes(file.extension)) {
      result.status = "suspicious";
      result.threats.push({
        type: "suspicious_extension",
        name: `Potentially dangerous extension: .${file.extension}`,
        severity: "medium"
      });
    }

    file.scanStatus = result.status;
    file.updatedAt = nowIso();

    state.scanResults.push(result);
    this.store.save();
    this.store.audit(actor, "file.scan", "file", fileId, undefined, { scanId: result.id, status: result.status });
    return clone(result);
  }

  listUploads(actor: RequestActor, query?: URLSearchParams): FileUpload[] {
    const status = pickQuery(query, "status");
    const uploadedBy = pickQuery(query, "uploadedBy");
    return clone(this.store.getState().uploads.filter(u => {
      if (u.tenantId !== actor.tenantId) return false;
      if (status && u.status !== status) return false;
      if (uploadedBy && u.uploadedBy !== uploadedBy) return false;
      return true;
    }));
  }

  createUpload(input: unknown, actor: RequestActor): FileUpload {
    const body = ensureObject(input, "upload");
    const upload: FileUpload = {
      id: newId("upload"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      fileName: ensureString(body.fileName, "upload.fileName"),
      folderId: optionalString(body.folderId),
      mimeType: body.mimeType || "application/octet-stream",
      size: ensureNumber(body.size, "upload.size", 0),
      status: "pending",
      uploadedBy: actor.userId,
      storageProvider: ensureEnum(body.storageProvider, "upload.storageProvider", ["local", "s3", "r2", "azure", "gcs", "minio"], "local"),
      progress: 0,
      module: optionalString(body.module)
    };

    this.store.getState().uploads.push(upload);
    this.store.save();
    return clone(upload);
  }

  updateUpload(id: string, input: unknown, actor: RequestActor): FileUpload {
    const body = ensureObject(input, "upload");
    const state = this.store.getState();
    const upload = state.uploads.find(u => u.id === id && u.tenantId === actor.tenantId);
    if (!upload) notFound("Upload not found");

    if (body.status) upload.status = ensureEnum(body.status, "upload.status", ["pending", "uploading", "uploaded", "processing", "failed", "rejected", "completed"]);
    if (body.progress !== undefined) upload.progress = ensureNumber(body.progress, "upload.progress");
    if (body.storagePath) upload.storagePath = ensureString(body.storagePath, "upload.storagePath");
    if (body.errorMessage) upload.errorMessage = ensureString(body.errorMessage, "upload.errorMessage");
    upload.updatedAt = nowIso();

    this.store.save();
    return clone(upload);
  }

  searchFiles(input: unknown, actor: RequestActor): FileObject[] {
    const body = ensureObject(input, "search");
    const query = ensureString(body.query, "search.query").toLowerCase();
    const limit = ensureNumber(body.limit, "search.limit", 20);

    const state = this.store.getState();
    const results = state.files.filter(f => {
      if (f.tenantId !== actor.tenantId) return false;
      if (f.status === "deleted") return false;
      const searchable = `${f.name} ${f.tags.join(" ")} ${f.mimeType}`.toLowerCase();
      return searchable.includes(query);
    }).slice(0, limit);

    this.store.audit(actor, "file.search", "file", undefined, undefined, { query, results: results.length });
    return clone(results);
  }

  getFileAnalytics(fileId: string, actor: RequestActor): FileAnalytics {
    const file = this.store.getState().files.find(f => f.id === fileId && f.tenantId === actor.tenantId);
    if (!file) notFound("File not found");

    let analytics = this.store.getState().analytics.find(a => a.fileId === fileId && a.tenantId === actor.tenantId);
    if (!analytics) {
      analytics = {
        id: newId("analytics"),
        tenantId: actor.tenantId,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        fileId,
        viewCount: 0,
        downloadCount: 0,
        shareCount: 0,
        uniqueViewers: [],
        uniqueDownloaders: [],
        storageCost: 0
      };
      this.store.getState().analytics.push(analytics);
      this.store.save();
    }

    return clone(analytics);
  }

  listAuditLogs(actor: RequestActor, query?: URLSearchParams): FileAuditLog[] {
    const fileId = pickQuery(query, "fileId");
    const folderId = pickQuery(query, "folderId");
    const action = pickQuery(query, "action");
    const actorId = pickQuery(query, "actorId");

    return clone(this.store.getState().auditLogs.filter(log => {
      if (log.tenantId !== actor.tenantId) return false;
      if (fileId && log.fileId !== fileId) return false;
      if (folderId && log.folderId !== folderId) return false;
      if (action && log.action !== action) return false;
      if (actorId && log.actorId !== actorId) return false;
      return true;
    }).slice(0, 100));
  }

  listShareLinks(actor: RequestActor, query?: URLSearchParams): FileShareLink[] {
    const fileId = pickQuery(query, "fileId");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().shareLinks.filter(s => {
      if (s.tenantId !== actor.tenantId) return false;
      if (fileId && s.fileId !== fileId) return false;
      if (status && s.status !== status) return false;
      return true;
    }));
  }

  revokeShareLink(shareLinkId: string, actor: RequestActor): FileShareLink {
    const state = this.store.getState();
    const shareLink = state.shareLinks.find(s => s.id === shareLinkId && s.tenantId === actor.tenantId);
    if (!shareLink) notFound("Share link not found");

    shareLink.status = "revoked";
    shareLink.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "file.unshare", "file", shareLink.fileId, undefined, { shareLinkId });
    return clone(shareLink);
  }

  createRetentionRule(input: unknown, actor: RequestActor): FileRetentionRule {
    const body = ensureObject(input, "retentionRule");
    const state = this.store.getState();
    const key = ensureString(body.key, "retentionRule.key");
    if (state.retentionRules.some(r => r.tenantId === actor.tenantId && r.key === key)) {
      conflict(`Retention rule key '${key}' already exists`);
    }

    const rule: FileRetentionRule = {
      id: newId("rule"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: ensureString(body.name, "retentionRule.name"),
      key,
      filePattern: optionalString(body.filePattern),
      folderId: optionalString(body.folderId),
      retentionDays: body.retentionDays ? ensureNumber(body.retentionDays, "retentionRule.retentionDays") : undefined,
      archiveAfterDays: body.archiveAfterDays ? ensureNumber(body.archiveAfterDays, "retentionRule.archiveAfterDays") : undefined,
      deleteAfterDays: body.deleteAfterDays ? ensureNumber(body.deleteAfterDays, "retentionRule.deleteAfterDays") : undefined,
      status: ensureEnum(body.status, "retentionRule.status", ["active", "inactive", "archived", "draft"], "active"),
      createdBy: actor.userId
    };

    state.retentionRules.push(rule);
    this.store.save();
    this.store.audit(actor, "retention_rule.create", "retentionRule", rule.id, undefined, rule);
    return clone(rule);
  }

  listRetentionRules(actor: RequestActor): FileRetentionRule[] {
    return clone(this.store.getState().retentionRules.filter(r => r.tenantId === actor.tenantId));
  }

  emitFileEvent(type: string, fileId: string | undefined, data: Record<string, unknown>, actor: RequestActor): FileEvent {
    const event: FileEvent = {
      id: newId("evt"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type,
      source: "FileOS",
      fileId,
      actorId: actor.userId,
      data
    };
    this.store.getState().events.unshift(event);
    this.store.save();
    return event;
  }

  listEvents(actor: RequestActor): FileEvent[] {
    return clone(this.store.getState().events.filter(e => e.tenantId === actor.tenantId));
  }
}
