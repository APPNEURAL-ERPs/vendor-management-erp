import { MediaOSState, MediaLibrary, MediaAsset, MediaFolder, MediaThumbnail, MediaRendition, MediaProcessingJob } from "./types";
import { emptyState } from "./core/datastore";
import { nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): MediaOSState {
  const state = emptyState();
  const createdAt = nowIso();

  state.libraries.push(
    {
      id: "lib_brand",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "brand_assets",
      name: "Brand Assets",
      description: "Official logos, icons, and brand imagery",
      type: "brand",
      assetCount: 3,
      storageBytes: 5242880,
      status: "active"
    },
    {
      id: "lib_course",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "course_media",
      name: "Course Media",
      description: "Lesson videos, workshop recordings, course thumbnails",
      type: "course",
      assetCount: 5,
      storageBytes: 1073741824,
      status: "active"
    },
    {
      id: "lib_social",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "social_media",
      name: "Social Media Assets",
      description: "LinkedIn, Instagram, and Twitter/X creatives",
      type: "social",
      assetCount: 8,
      storageBytes: 15728640,
      status: "active"
    }
  );

  state.folders.push(
    {
      id: "folder_logos",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "logos",
      name: "Logos",
      description: "Company and product logos",
      libraryId: "lib_brand",
      path: "/brand/logos",
      assetCount: 2,
      status: "active"
    },
    {
      id: "folder_workshops",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "workshops",
      name: "Workshop Recordings",
      description: "Recorded workshop sessions",
      libraryId: "lib_course",
      path: "/course/workshops",
      assetCount: 3,
      status: "active"
    }
  );

  state.assets.push(
    {
      id: "asset_logo_primary",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "appneural_logo_primary",
      name: "APPNEURAL Primary Logo",
      description: "Official primary logo for APPNEURAL",
      type: "image",
      format: "png",
      mimeType: "image/png",
      size: 102400,
      width: 800,
      height: 200,
      url: "https://cdn.appneural.com/brand/logos/primary.png",
      thumbnailUrl: "https://cdn.appneural.com/brand/logos/primary-thumb.png",
      status: "ready",
      category: "brand",
      tags: ["logo", "brand", "primary"],
      folderId: "folder_logos",
      libraryId: "lib_brand",
      metadata: {
        fileName: "appneural-logo-primary.png",
        originalFileName: "logo-v3-final.png",
        fileSize: 102400,
        width: 800,
        height: 200
      },
      usageCount: 15,
      viewCount: 245,
      downloadCount: 42
    },
    {
      id: "asset_logo_icon",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "appneural_logo_icon",
      name: "APPNEURAL Icon Logo",
      description: "Small icon version for app icons and favicons",
      type: "image",
      format: "svg",
      mimeType: "image/svg+xml",
      size: 8192,
      width: 64,
      height: 64,
      url: "https://cdn.appneural.com/brand/logos/icon.svg",
      thumbnailUrl: "https://cdn.appneural.com/brand/logos/icon-thumb.png",
      status: "ready",
      category: "brand",
      tags: ["logo", "brand", "icon"],
      folderId: "folder_logos",
      libraryId: "lib_brand",
      metadata: {
        fileName: "appneural-logo-icon.svg",
        originalFileName: "icon-final.svg",
        fileSize: 8192,
        width: 64,
        height: 64
      },
      usageCount: 8,
      viewCount: 156,
      downloadCount: 23
    },
    {
      id: "asset_workshop_ai",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "workshop_ai_intro",
      name: "AI Introduction Workshop Recording",
      description: "Full recording of the AI fundamentals workshop",
      type: "video",
      format: "mp4",
      mimeType: "video/mp4",
      size: 536870912,
      width: 1920,
      height: 1080,
      duration: 7200,
      url: "https://cdn.appneural.com/course/workshops/ai-intro.mp4",
      thumbnailUrl: "https://cdn.appneural.com/course/workshops/ai-intro-thumb.jpg",
      status: "ready",
      category: "course",
      tags: ["workshop", "ai", "recording", "course"],
      folderId: "folder_workshops",
      libraryId: "lib_course",
      metadata: {
        fileName: "ai-intro-workshop.mp4",
        originalFileName: "recording_2024_01_15.mp4",
        fileSize: 536870912,
        width: 1920,
        height: 1080,
        duration: 7200,
        codec: "h264",
        bitrate: 6000000,
        frameRate: 30
      },
      usageCount: 3,
      viewCount: 89,
      downloadCount: 12
    },
    {
      id: "asset_social_linkedin",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "social_linkedin_ai",
      name: "LinkedIn Post - AI Education",
      description: "LinkedIn social media post about AI education",
      type: "image",
      format: "png",
      mimeType: "image/png",
      size: 204800,
      width: 1200,
      height: 627,
      url: "https://cdn.appneural.com/social/linkedin/ai-education.png",
      thumbnailUrl: "https://cdn.appneural.com/social/linkedin/ai-education-thumb.png",
      status: "ready",
      category: "social",
      tags: ["social", "linkedin", "ai", "education"],
      libraryId: "lib_social",
      metadata: {
        fileName: "linkedin-ai-education.png",
        originalFileName: "social-post-v2.png",
        fileSize: 204800,
        width: 1200,
        height: 627
      },
      usageCount: 2,
      viewCount: 1247,
      downloadCount: 5
    },
    {
      id: "asset_thumbnail_demo",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      key: "demo_thumbnail",
      name: "Product Demo Thumbnail",
      description: "Thumbnail for product demo videos",
      type: "image",
      format: "jpg",
      mimeType: "image/jpeg",
      size: 51200,
      width: 320,
      height: 180,
      url: "https://cdn.appneural.com/product/demos/thumbnail.jpg",
      thumbnailUrl: "https://cdn.appneural.com/product/demos/thumbnail.jpg",
      status: "ready",
      category: "product",
      tags: ["thumbnail", "demo", "product"],
      libraryId: "lib_course",
      metadata: {
        fileName: "demo-thumbnail.jpg",
        originalFileName: "thumb-final.jpg",
        fileSize: 51200,
        width: 320,
        height: 180
      },
      usageCount: 5,
      viewCount: 334,
      downloadCount: 8
    }
  );

  state.thumbnails.push(
    {
      id: "thumb_workshop_ai",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      assetId: "asset_workshop_ai",
      width: 320,
      height: 180,
      url: "https://cdn.appneural.com/course/workshops/ai-intro-thumb.jpg",
      type: "auto"
    },
    {
      id: "thumb_social_linkedin",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      assetId: "asset_social_linkedin",
      width: 640,
      height: 335,
      url: "https://cdn.appneural.com/social/linkedin/ai-education-thumb.png",
      type: "manual"
    }
  );

  state.renditions.push(
    {
      id: "rendition_logo_webp",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      assetId: "asset_logo_primary",
      name: "WebP Conversion",
      width: 800,
      height: 200,
      format: "webp",
      url: "https://cdn.appneural.com/brand/logos/primary.webp",
      size: 81920,
      purpose: "web_optimized"
    },
    {
      id: "rendition_workshop_mobile",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      assetId: "asset_workshop_ai",
      name: "Mobile Rendition",
      width: 720,
      height: 480,
      format: "mp4",
      url: "https://cdn.appneural.com/course/workshops/ai-intro-mobile.mp4",
      size: 268435456,
      purpose: "mobile_viewing"
    }
  );

  state.processingJobs.push(
    {
      id: "job_thumbnail_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      assetId: "asset_workshop_ai",
      type: "thumbnail",
      status: "completed",
      progress: 100,
      input: { width: 320, height: 180 },
      output: { thumbnailUrl: "https://cdn.appneural.com/course/workshops/ai-intro-thumb.jpg" },
      startedAt: createdAt,
      completedAt: createdAt,
      retryCount: 0,
      maxRetries: 3
    },
    {
      id: "job_transcode_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      assetId: "asset_workshop_ai",
      type: "transcode",
      status: "completed",
      progress: 100,
      input: { format: "webm", quality: "medium" },
      output: { renditionId: "rendition_workshop_mobile" },
      startedAt: createdAt,
      completedAt: createdAt,
      retryCount: 0,
      maxRetries: 3
    },
    {
      id: "job_caption_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      assetId: "asset_workshop_ai",
      type: "caption",
      status: "queued",
      progress: 0,
      input: { language: "en" },
      retryCount: 0,
      maxRetries: 3
    }
  );

  state.events.push({
    id: "event_demo_bootstrap",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "mediaos.seeded",
    source: "MediaOS",
    data: { message: "MediaOS demo data seeded" }
  });

  return state;
}
