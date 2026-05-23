export function docs() {
  return {
    name: "MediaOS",
    version: "1.0.0",
    description: "MediaOS: image, video, audio, creative asset, media library, media processing, streaming, thumbnails, transcoding, and media analytics.",
    auth: {
      headers: {
        "x-role": "owner | admin | media_admin | media_manager | content_creator | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      asset: "A media file (image, video, audio) with metadata and processing state.",
      library: "A collection of media assets organized by purpose (brand, course, social, product).",
      folder: "A hierarchical organization structure for assets within a library.",
      rendition: "A processed variant of an asset (different size, format, or quality).",
      thumbnail: "A preview image generated from video or audio content.",
      processingJob: "An async task that transforms or analyzes media (transcode, compress, caption).",
      caption: "Subtitle file in SRT or VTT format for accessibility.",
      transcript: "Full text transcription of audio or video content."
    },
    examples: {
      uploadAsset: {
        method: "POST",
        path: "/mediaos/assets",
        headers: { "x-role": "media_manager" },
        body: { name: "Workshop Recording", type: "video", format: "mp4", category: "course" }
      },
      processThumbnail: {
        method: "POST",
        path: "/mediaos/assets/asset_demo/thumbnail",
        headers: { "x-role": "media_manager" },
        body: { width: 320, height: 180 }
      },
      transcodeVideo: {
        method: "POST",
        path: "/mediaos/assets/asset_demo/process",
        headers: { "x-role": "media_admin" },
        body: { type: "transcode", format: "webm", quality: "medium" }
      }
    }
  };
}
