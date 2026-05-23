export function docs() {
  return {
    name: "FileOS",
    version: "1.0.0",
    description: "File storage, upload, download, folder management, permissions, versioning, sharing, and S3/R2-backed object management for APPNEURAL.",
    auth: {
      headers: {
        "x-role": "viewer | file_user | file_admin | admin | owner",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      file: "A stored file with metadata, versions, permissions, and scan status.",
      folder: "A container for organizing files with hierarchical structure.",
      version: "A point-in-time snapshot of a file that enables versioning and restore.",
      permission: "Access control rule granting specific actions to users, groups, or roles.",
      shareLink: "A temporary or permanent URL for sharing files with external users.",
      storageBucket: "Backend storage configuration for different providers (local, S3, R2, Azure, GCS).",
      retentionRule: "Lifecycle policy for file retention, archival, and deletion."
    },
    permissions: {
      viewer: ["file.read", "file.preview"],
      file_user: ["file.read", "file.preview", "file.upload", "file.download", "file.share", "file.update", "file.scan"],
      file_admin: ["file.read", "file.preview", "file.upload", "file.download", "file.share", "file.update", "file.delete", "file.archive", "file.restore", "file.scan", "file.manage_permissions", "file.audit.read"],
      admin: ["*"],
      owner: ["*"]
    },
    examples: {
      uploadFile: {
        method: "POST",
        path: "/fileos/files",
        headers: { "x-role": "file_user" },
        body: {
          name: "resume.pdf",
          size: 842000,
          mimeType: "application/pdf",
          tags: ["resume", "pdf", "career"],
          module: "CareerOS"
        }
      },
      createFolder: {
        method: "POST",
        path: "/fileos/folders",
        headers: { "x-role": "file_user" },
        body: { name: "Documents", parentId: null }
      },
      shareFile: {
        method: "POST",
        path: "/fileos/files/{fileId}/share-links",
        headers: { "x-role": "file_user" },
        body: {
          expiresAt: "2024-12-31T23:59:59Z",
          maxDownloads: 5,
          allowPreview: true,
          allowDownload: true
        }
      },
      scanFile: {
        method: "POST",
        path: "/fileos/files/{fileId}/scan",
        headers: { "x-role": "file_user" },
        body: {}
      },
      createVersion: {
        method: "POST",
        path: "/fileos/files/{fileId}/versions",
        headers: { "x-role": "file_user" },
        body: {
          size: 850000,
          notes: "Updated resume with new skills"
        }
      },
      searchFiles: {
        method: "POST",
        path: "/fileos/search",
        headers: { "x-role": "file_user" },
        body: {
          query: "resume pdf",
          limit: 20
        }
      }
    },
    storageProviders: {
      local: "Local filesystem storage",
      s3: "Amazon Web Services S3",
      r2: "Cloudflare R2",
      azure: "Microsoft Azure Blob Storage",
      gcs: "Google Cloud Storage",
      minio: "MinIO compatible storage"
    },
    fileStatuses: {
      pending: "File upload pending",
      uploading: "File currently uploading",
      uploaded: "File upload completed",
      processing: "File being processed",
      active: "File is active and accessible",
      archived: "File has been archived",
      deleted: "File has been deleted"
    },
    scanStatuses: {
      pending: "Scan not yet performed",
      scanning: "Scan in progress",
      clean: "No threats detected",
      suspicious: "Potentially suspicious file",
      infected: "Malware detected",
      quarantined: "File has been quarantined",
      rejected: "File was rejected during upload"
    },
    apiEndpoints: {
      overview: "GET /fileos/overview - Get storage overview and statistics",
      buckets: "GET/POST /fileos/buckets - List or create storage buckets",
      folders: "GET/POST /fileos/folders - List or create folders",
      folderDetail: "GET/PATCH/DELETE /fileos/folders/:id - Folder operations",
      files: "GET/POST /fileos/files - List or upload files",
      fileDetail: "GET/PATCH/DELETE /fileos/files/:id - File operations",
      versions: "GET/POST /fileos/files/:id/versions - File versions",
      shareLinks: "GET/POST /fileos/files/:id/share-links - Share links",
      permissions: "GET/POST /fileos/files/:id/permissions - Permissions",
      uploads: "GET/POST /fileos/uploads - Upload sessions",
      search: "POST /fileos/search - Search files",
      audit: "GET /fileos/audit - Audit logs"
    }
  };
}
