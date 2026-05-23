import { FileOSState, StorageBucket, FileFolder, FileObject, FileVersion, FilePermission, FileShareLink, FileRetentionRule } from "./domain";
import { emptyState } from "./core/datastore";
import { nowIso, getMimeType, getFileExtension } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): FileOSState {
  const state = emptyState();
  const createdAt = nowIso();

  state.buckets.push({
    id: "bucket_local",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Local Storage",
    key: "local_default",
    provider: "local",
    bucketName: "fileos-local",
    status: "active",
    totalSize: 0,
    fileCount: 0,
    isDefault: true,
    config: { path: "./storage" }
  });

  state.buckets.push({
    id: "bucket_r2",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Cloudflare R2",
    key: "r2_primary",
    provider: "r2",
    region: "auto",
    bucketName: "appneurox-files",
    status: "active",
    totalSize: 0,
    fileCount: 0,
    isDefault: false,
    config: { publicUrl: "https://files.appneurox.com" }
  });

  const rootFolderId = "folder_root";
  state.folders.push({
    id: rootFolderId,
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Root",
    key: "root",
    ownerId: "user_admin",
    status: "active",
    permissions: [],
    path: "/root",
    fileCount: 0,
    folderCount: 3,
    totalSize: 0,
    isPublic: false
  });

  const documentsFolderId = "folder_documents";
  state.folders.push({
    id: documentsFolderId,
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Documents",
    key: "documents",
    parentId: rootFolderId,
    ownerId: "user_admin",
    status: "active",
    permissions: [],
    path: "/root/documents",
    fileCount: 2,
    folderCount: 2,
    totalSize: 1848000,
    isPublic: false
  });

  const resumesFolderId = "folder_resumes";
  state.folders.push({
    id: resumesFolderId,
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Resumes",
    key: "resumes",
    parentId: documentsFolderId,
    ownerId: "user_admin",
    status: "active",
    permissions: [],
    path: "/root/documents/resumes",
    fileCount: 2,
    folderCount: 0,
    totalSize: 1644000,
    isPublic: false
  });

  const invoicesFolderId = "folder_invoices";
  state.folders.push({
    id: invoicesFolderId,
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Invoices",
    key: "invoices",
    parentId: documentsFolderId,
    ownerId: "user_admin",
    status: "active",
    permissions: [],
    path: "/root/documents/invoices",
    fileCount: 1,
    folderCount: 0,
    totalSize: 204000,
    isPublic: false
  });

  const mediaFolderId = "folder_media";
  state.folders.push({
    id: mediaFolderId,
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Media",
    key: "media",
    parentId: rootFolderId,
    ownerId: "user_admin",
    status: "active",
    permissions: [],
    path: "/root/media",
    fileCount: 3,
    folderCount: 2,
    totalSize: 5242880,
    isPublic: true
  });

  const imagesFolderId = "folder_images";
  state.folders.push({
    id: imagesFolderId,
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Images",
    key: "images",
    parentId: mediaFolderId,
    ownerId: "user_admin",
    status: "active",
    permissions: [],
    path: "/root/media/images",
    fileCount: 2,
    folderCount: 0,
    totalSize: 3145728,
    isPublic: true
  });

  const videosFolderId = "folder_videos";
  state.folders.push({
    id: videosFolderId,
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Videos",
    key: "videos",
    parentId: mediaFolderId,
    ownerId: "user_admin",
    status: "active",
    permissions: [],
    path: "/root/media/videos",
    fileCount: 1,
    folderCount: 0,
    totalSize: 2097152,
    isPublic: true
  });

  const projectsFolderId = "folder_projects";
  state.folders.push({
    id: projectsFolderId,
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Projects",
    key: "projects",
    parentId: rootFolderId,
    ownerId: "user_admin",
    status: "active",
    permissions: [],
    path: "/root/projects",
    fileCount: 1,
    folderCount: 1,
    totalSize: 512000,
    isPublic: false
  });

  state.files.push({
    id: "file_resume_ajay",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "ajay-resume.pdf",
    key: "fk_001_ajay-resume.pdf",
    folderId: resumesFolderId,
    mimeType: "application/pdf",
    size: 822000,
    extension: "pdf",
    status: "active",
    ownerId: "user_ajay",
    currentVersionId: "ver_resume_ajay_v1",
    storageProvider: "local",
    storagePath: `${tenantId}/documents/resumes/ajay-resume.pdf`,
    tags: ["resume", "pdf", "career", "software-engineer"],
    metadata: { author: "Ajay Prajapat", role: "Software Engineer" },
    scanStatus: "clean",
    uploadedBy: "user_ajay",
    uploadedAt: createdAt,
    lastModifiedAt: createdAt,
    isPublic: false,
    isProtected: true,
    module: "CareerOS"
  });

  state.files.push({
    id: "file_resume_rahul",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "rahul-sharma-resume.pdf",
    key: "fk_002_rahul-sharma-resume.pdf",
    folderId: resumesFolderId,
    mimeType: "application/pdf",
    size: 822000,
    extension: "pdf",
    status: "active",
    ownerId: "user_rahul",
    currentVersionId: "ver_resume_rahul_v1",
    storageProvider: "local",
    storagePath: `${tenantId}/documents/resumes/rahul-sharma-resume.pdf`,
    tags: ["resume", "pdf", "career", "data-scientist"],
    metadata: { author: "Rahul Sharma", role: "Data Scientist" },
    scanStatus: "clean",
    uploadedBy: "user_rahul",
    uploadedAt: createdAt,
    lastModifiedAt: createdAt,
    isPublic: false,
    isProtected: false,
    module: "CareerOS"
  });

  state.files.push({
    id: "file_invoice_q1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "invoice-q1-2024.pdf",
    key: "fk_003_invoice-q1-2024.pdf",
    folderId: invoicesFolderId,
    mimeType: "application/pdf",
    size: 204000,
    extension: "pdf",
    status: "active",
    ownerId: "user_admin",
    storageProvider: "r2",
    storagePath: `${tenantId}/documents/invoices/invoice-q1-2024.pdf`,
    tags: ["invoice", "q1", "2024", "finance"],
    metadata: { amount: 15000, currency: "INR", client: "ABC Corp" },
    scanStatus: "clean",
    uploadedBy: "user_admin",
    uploadedAt: createdAt,
    lastModifiedAt: createdAt,
    isPublic: false,
    isProtected: true,
    module: "FinanceOS"
  });

  state.files.push({
    id: "file_logo",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "company-logo.png",
    key: "fk_004_company-logo.png",
    folderId: imagesFolderId,
    mimeType: "image/png",
    size: 1572864,
    extension: "png",
    status: "active",
    ownerId: "user_admin",
    storageProvider: "r2",
    storagePath: `${tenantId}/media/images/company-logo.png`,
    tags: ["logo", "brand", "png", "company"],
    metadata: { width: 1024, height: 768, colorSpace: "RGB" },
    scanStatus: "clean",
    uploadedBy: "user_admin",
    uploadedAt: createdAt,
    lastModifiedAt: createdAt,
    isPublic: true,
    isProtected: false,
    module: "TemplateOS"
  });

  state.files.push({
    id: "file_banner",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "hero-banner.webp",
    key: "fk_005_hero-banner.webp",
    folderId: imagesFolderId,
    mimeType: "image/webp",
    size: 1572864,
    extension: "webp",
    status: "active",
    ownerId: "user_admin",
    storageProvider: "r2",
    storagePath: `${tenantId}/media/images/hero-banner.webp`,
    tags: ["banner", "hero", "webp", "marketing"],
    metadata: { width: 1920, height: 1080, optimized: true },
    scanStatus: "clean",
    uploadedBy: "user_admin",
    uploadedAt: createdAt,
    lastModifiedAt: createdAt,
    isPublic: true,
    isProtected: false,
    module: "WebsiteOS"
  });

  state.files.push({
    id: "file_demo_video",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "product-demo.mp4",
    key: "fk_006_product-demo.mp4",
    folderId: videosFolderId,
    mimeType: "video/mp4",
    size: 2097152,
    extension: "mp4",
    status: "active",
    ownerId: "user_admin",
    storageProvider: "r2",
    storagePath: `${tenantId}/media/videos/product-demo.mp4`,
    tags: ["video", "demo", "product", "mp4", "marketing"],
    metadata: { duration: 120, format: "mp4", resolution: "1080p" },
    scanStatus: "clean",
    uploadedBy: "user_admin",
    uploadedAt: createdAt,
    lastModifiedAt: createdAt,
    isPublic: true,
    isProtected: false,
    module: "LearningOS"
  });

  state.files.push({
    id: "file_proposal",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "client-proposal.docx",
    key: "fk_007_client-proposal.docx",
    folderId: projectsFolderId,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 512000,
    extension: "docx",
    status: "active",
    ownerId: "user_admin",
    currentVersionId: "ver_proposal_v1",
    storageProvider: "local",
    storagePath: `${tenantId}/projects/client-proposal.docx`,
    tags: ["proposal", "docx", "client", "business"],
    metadata: { client: "XYZ Inc", deadline: "2024-03-31" },
    scanStatus: "clean",
    uploadedBy: "user_admin",
    uploadedAt: createdAt,
    lastModifiedAt: createdAt,
    isPublic: false,
    isProtected: true,
    module: "SalesOS"
  });

  state.versions.push({
    id: "ver_resume_ajay_v1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    fileId: "file_resume_ajay",
    versionNumber: 1,
    status: "current",
    size: 822000,
    storagePath: `${tenantId}/documents/resumes/ajay-resume.pdf/versions/v1`,
    storageProvider: "local",
    createdBy: "user_ajay",
    isLocked: false
  });

  state.versions.push({
    id: "ver_resume_rahul_v1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    fileId: "file_resume_rahul",
    versionNumber: 1,
    status: "current",
    size: 822000,
    storagePath: `${tenantId}/documents/resumes/rahul-sharma-resume.pdf/versions/v1`,
    storageProvider: "local",
    createdBy: "user_rahul",
    isLocked: false
  });

  state.versions.push({
    id: "ver_proposal_v1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    fileId: "file_proposal",
    versionNumber: 1,
    status: "current",
    size: 512000,
    storagePath: `${tenantId}/projects/client-proposal.docx/versions/v1`,
    storageProvider: "local",
    notes: "Initial proposal draft",
    createdBy: "user_admin",
    isLocked: false
  });

  state.shareLinks.push({
    id: "share_logo_public",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    fileId: "file_logo",
    token: "tok_demo_logo_share",
    url: "/fileos/share/tok_demo_logo_share",
    status: "active",
    createdBy: "user_admin",
    permissions: ["file.preview", "file.download"],
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    downloadCount: 0,
    requireLogin: false,
    allowPreview: true,
    allowDownload: true,
    watermarkEnabled: false
  });

  state.shareLinks.push({
    id: "share_video_demo",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    fileId: "file_demo_video",
    token: "tok_demo_video_share",
    url: "/fileos/share/tok_demo_video_share",
    status: "active",
    createdBy: "user_admin",
    permissions: ["file.preview"],
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    maxDownloads: 10,
    downloadCount: 3,
    requireLogin: false,
    allowPreview: true,
    allowDownload: false,
    watermarkEnabled: true
  });

  state.permissions.push({
    id: "perm_resume_ajay_viewers",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    fileId: "file_resume_ajay",
    subjectType: "role",
    subjectId: "role_hr_manager",
    permissions: ["file.view", "file.preview", "file.download"],
    grantedBy: "user_admin",
    isInherited: false
  });

  state.permissions.push({
    id: "perm_invoice_finance",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    fileId: "file_invoice_q1",
    subjectType: "role",
    subjectId: "role_finance",
    permissions: ["file.view", "file.preview", "file.download", "file.share"],
    grantedBy: "user_admin",
    isInherited: false
  });

  state.retentionRules.push({
    id: "rule_invoice_7yr",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Invoice Retention - 7 Years",
    key: "invoice_retention_7yr",
    filePattern: "invoice-*.pdf",
    retentionDays: 2555,
    archiveAfterDays: 1825,
    deleteAfterDays: 2555,
    status: "active",
    createdBy: "user_admin"
  });

  state.retentionRules.push({
    id: "rule_temp_7day",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Temporary Files - 7 Days",
    key: "temp_files_7day",
    filePattern: "temp-*.pdf",
    retentionDays: 7,
    deleteAfterDays: 7,
    status: "active",
    createdBy: "user_admin"
  });

  state.retentionRules.push({
    id: "rule_resumes_permanent",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Resume Retention - Permanent",
    key: "resume_retention_permanent",
    folderId: resumesFolderId,
    retentionDays: -1,
    status: "active",
    createdBy: "user_admin"
  });

  state.events.push({
    id: "evt_fileos_bootstrap",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "fileos.seeded",
    source: "FileOS",
    fileId: undefined,
    actorId: "user_admin",
    data: { message: "FileOS demo data seeded", files: 7, folders: 8, buckets: 2 }
  });

  state.auditLogs.push({
    id: "audit_seeded",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    actorId: "user_admin",
    role: "owner",
    action: "system.init",
    entityType: "system",
    metadata: { message: "FileOS initialized with demo data" }
  });

  for (const file of state.files) {
    const bucket = state.buckets.find(b => b.provider === file.storageProvider);
    if (bucket) {
      bucket.totalSize += file.size;
      bucket.fileCount++;
    }
  }

  for (const folder of state.folders) {
    if (folder.parentId) {
      const parent = state.folders.find(f => f.id === folder.parentId);
      if (parent) {
        parent.folderCount++;
      }
    }
  }

  return state;
}
