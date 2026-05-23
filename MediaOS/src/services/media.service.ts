import { DataStore } from "../core/datastore";
import {
  MediaAsset,
  MediaLibrary,
  MediaFolder,
  MediaThumbnail,
  MediaRendition,
  MediaProcessingJob,
  MediaEvent,
  MediaAnalyticsEvent,
  MediaOverview,
  MediaType,
  MediaFormat,
  ProcessingJobType,
  RequestActor
} from "../types";
import { ensureString, ensureNumber, ensureBoolean, ensureArray, optionalObject, pickQuery, clone, countBy } from "../core/utils";
import { newId, nowIso } from "../core/id";

export class MediaService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "MediaOS service is ready";
  }

  overview(actor: RequestActor): MediaOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;

    const assets = state.assets.filter((item) => item.tenantId === tenant);
    const jobs = state.processingJobs.filter((item) => item.tenantId === tenant);
    const events = state.analyticsEvents.filter((item) => item.tenantId === tenant);

    return {
      libraries: state.libraries.filter((item) => item.tenantId === tenant).length,
      assets: {
        total: assets.length,
        byType: {
          image: assets.filter((a) => a.type === "image").length,
          video: assets.filter((a) => a.type === "video").length,
          audio: assets.filter((a) => a.type === "audio").length,
          document: assets.filter((a) => a.type === "document").length,
          other: assets.filter((a) => a.type === "other").length
        }
      },
      storage: {
        totalBytes: assets.reduce((acc, a) => acc + a.size, 0),
        usedBytes: assets.reduce((acc, a) => acc + a.size, 0)
      },
      processing: {
        queued: jobs.filter((j) => j.status === "queued").length,
        active: jobs.filter((j) => j.status === "processing").length,
        completed: jobs.filter((j) => j.status === "completed").length,
        failed: jobs.filter((j) => j.status === "failed").length
      },
      analytics: {
        views: events.filter((e) => e.event === "view").length,
        downloads: events.filter((e) => e.event === "download").length,
        shares: events.filter((e) => e.event === "share").length
      }
    };
  }

  listLibraries(actor: RequestActor): MediaLibrary[] {
    return clone(this.store.getState().libraries.filter((item) => item.tenantId === actor.tenantId));
  }

  createLibrary(input: unknown, actor: RequestActor): MediaLibrary {
    const body = optionalObject(input);
    const state = this.store.getState();
    const key = ensureString(body.key, "library.key");
    if (state.libraries.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      throw { statusCode: 409, message: `Library key '${key}' already exists` };
    }

    const library: MediaLibrary = {
      id: newId("lib"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "library.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "general") as MediaLibrary["type"],
      assetCount: 0,
      storageBytes: 0,
      status: "active"
    };

    state.libraries.push(library);
    this.store.save();
    this.store.audit(actor, "library.create", "library", library.id, undefined, library);
    return clone(library);
  }

  listAssets(actor: RequestActor, query?: URLSearchParams): MediaAsset[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const type = pickQuery(query, "type");
    const libraryId = pickQuery(query, "libraryId");

    return clone(
      this.store.getState().assets.filter((item) => {
        if (item.tenantId !== actor.tenantId) return false;
        if (search && !`${item.key} ${item.name} ${item.description ?? ""}`.toLowerCase().includes(search)) return false;
        if (type && item.type !== type) return false;
        if (libraryId && item.libraryId !== libraryId) return false;
        return true;
      })
    );
  }

  getAsset(id: string, actor: RequestActor): MediaAsset {
    const asset = this.store.getState().assets.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!asset) throw { statusCode: 404, message: "Asset not found" };
    return clone(asset);
  }

  createAsset(input: unknown, actor: RequestActor): MediaAsset {
    const body = optionalObject(input);
    const state = this.store.getState();
    const key = ensureString(body.key, "asset.key");
    if (state.assets.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      throw { statusCode: 409, message: `Asset key '${key}' already exists` };
    }

    const asset: MediaAsset = {
      id: newId("asset"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "asset.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "image") as MediaType,
      format: String(body.format ?? "png") as MediaFormat,
      mimeType: String(body.mimeType ?? `image/${body.format ?? "png"}`),
      size: ensureNumber(body.size, "asset.size", 0),
      width: body.width ? ensureNumber(body.width, "asset.width") : undefined,
      height: body.height ? ensureNumber(body.height, "asset.height") : undefined,
      duration: body.duration ? ensureNumber(body.duration, "asset.duration") : undefined,
      url: ensureString(body.url, "asset.url"),
      thumbnailUrl: body.thumbnailUrl ? String(body.thumbnailUrl) : undefined,
      status: "uploaded",
      category: ensureString(body.category, "asset.category", "general"),
      tags: ensureArray<string>(body.tags, "asset.tags", []),
      folderId: body.folderId ? String(body.folderId) : undefined,
      libraryId: body.libraryId ? String(body.libraryId) : undefined,
      ownerId: body.ownerId ? String(body.ownerId) : actor.userId,
      metadata: (() => {
        const meta = optionalObject(body.metadata);
        return {
          fileName: ensureString(meta?.fileName ?? body.name, "metadata.fileName"),
          ...meta
        };
      })(),
      usageCount: 0,
      viewCount: 0,
      downloadCount: 0
    };

    state.assets.push(asset);
    this.store.save();
    this.store.audit(actor, "asset.create", "asset", asset.id, undefined, asset);
    this.emitEvent(actor, "media.asset.uploaded", { assetId: asset.id, type: asset.type, format: asset.format });
    return clone(asset);
  }

  updateAsset(id: string, input: unknown, actor: RequestActor): MediaAsset {
    const body = optionalObject(input);
    const state = this.store.getState();
    const asset = state.assets.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!asset) throw { statusCode: 404, message: "Asset not found" };

    const before = clone(asset);
    if (body.name) asset.name = ensureString(body.name, "name");
    if (body.description) asset.description = String(body.description);
    if (body.tags) asset.tags = ensureArray<string>(body.tags, "tags");
    if (body.url) asset.url = ensureString(body.url, "url");
    if (body.thumbnailUrl) asset.thumbnailUrl = String(body.thumbnailUrl);
    if (body.category) asset.category = ensureString(body.category, "category");
    if (body.status) asset.status = String(body.status) as MediaAsset["status"];
    if (body.metadata) asset.metadata = { ...asset.metadata, ...optionalObject(body.metadata) };
    asset.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "asset.update", "asset", asset.id, before, asset);
    return clone(asset);
  }

  deleteAsset(id: string, actor: RequestActor): void {
    const state = this.store.getState();
    const index = state.assets.findIndex((item) => item.id === id && item.tenantId === actor.tenantId);
    if (index === -1) throw { statusCode: 404, message: "Asset not found" };

    const before = clone(state.assets[index]);
    state.assets.splice(index, 1);
    this.store.save();
    this.store.audit(actor, "asset.delete", "asset", id, before, undefined);
  }

  listFolders(actor: RequestActor): MediaFolder[] {
    return clone(this.store.getState().folders.filter((item) => item.tenantId === actor.tenantId));
  }

  createFolder(input: unknown, actor: RequestActor): MediaFolder {
    const body = optionalObject(input);
    const state = this.store.getState();
    const key = ensureString(body.key, "folder.key");
    if (state.folders.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      throw { statusCode: 409, message: `Folder key '${key}' already exists` };
    }

    const folder: MediaFolder = {
      id: newId("folder"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "folder.name"),
      description: body.description ? String(body.description) : undefined,
      parentId: body.parentId ? String(body.parentId) : undefined,
      libraryId: body.libraryId ? String(body.libraryId) : undefined,
      path: ensureString(body.path, "folder.path", `/ ${key}`),
      assetCount: 0,
      status: "active"
    };

    state.folders.push(folder);
    this.store.save();
    this.store.audit(actor, "folder.create", "folder", folder.id, undefined, folder);
    return clone(folder);
  }

  listThumbnails(actor: RequestActor, assetId?: string): MediaThumbnail[] {
    const state = this.store.getState();
    return clone(
      state.thumbnails.filter((item) => {
        if (item.tenantId !== actor.tenantId) return false;
        if (assetId && item.assetId !== assetId) return false;
        return true;
      })
    );
  }

  generateThumbnail(assetId: string, input: unknown, actor: RequestActor): MediaThumbnail {
    const body = optionalObject(input);
    const state = this.store.getState();
    const asset = state.assets.find((item) => item.id === assetId && item.tenantId === actor.tenantId);
    if (!asset) throw { statusCode: 404, message: "Asset not found" };

    const thumbnail: MediaThumbnail = {
      id: newId("thumb"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      assetId,
      width: ensureNumber(body.width, "width", 320),
      height: ensureNumber(body.height, "height", 180),
      url: body.url ? String(body.url) : `https://cdn.appneural.com/thumbnails/${assetId}-${Date.now()}.jpg`,
      type: "auto"
    };

    state.thumbnails.push(thumbnail);
    if (!asset.thumbnailUrl) {
      asset.thumbnailUrl = thumbnail.url;
      asset.updatedAt = nowIso();
    }
    this.store.save();
    this.store.audit(actor, "thumbnail.generate", "thumbnail", thumbnail.id, undefined, thumbnail);
    this.emitEvent(actor, "media.thumbnail.generated", { assetId, thumbnailId: thumbnail.id });
    return clone(thumbnail);
  }

  listRenditions(actor: RequestActor, assetId?: string): MediaRendition[] {
    const state = this.store.getState();
    return clone(
      state.renditions.filter((item) => {
        if (item.tenantId !== actor.tenantId) return false;
        if (assetId && item.assetId !== assetId) return false;
        return true;
      })
    );
  }

  createRendition(assetId: string, input: unknown, actor: RequestActor): MediaRendition {
    const body = optionalObject(input);
    const state = this.store.getState();
    const asset = state.assets.find((item) => item.id === assetId && item.tenantId === actor.tenantId);
    if (!asset) throw { statusCode: 404, message: "Asset not found" };

    const rendition: MediaRendition = {
      id: newId("rendition"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      assetId,
      name: ensureString(body.name, "rendition.name"),
      width: ensureNumber(body.width, "rendition.width"),
      height: ensureNumber(body.height, "rendition.height"),
      format: String(body.format ?? "jpg") as MediaFormat,
      url: ensureString(body.url, "rendition.url"),
      size: ensureNumber(body.size, "rendition.size"),
      purpose: ensureString(body.purpose, "rendition.purpose", "general")
    };

    state.renditions.push(rendition);
    this.store.save();
    this.store.audit(actor, "rendition.create", "rendition", rendition.id, undefined, rendition);
    return clone(rendition);
  }

  listProcessingJobs(actor: RequestActor, query?: URLSearchParams): MediaProcessingJob[] {
    const assetId = pickQuery(query, "assetId");
    const status = pickQuery(query, "status");
    const type = pickQuery(query, "type");

    return clone(
      this.store.getState().processingJobs.filter((item) => {
        if (item.tenantId !== actor.tenantId) return false;
        if (assetId && item.assetId !== assetId) return false;
        if (status && item.status !== status) return false;
        if (type && item.type !== type) return false;
        return true;
      })
    );
  }

  createProcessingJob(input: unknown, actor: RequestActor): MediaProcessingJob {
    const body = optionalObject(input);
    const state = this.store.getState();

    if (body.assetId) {
      const asset = state.assets.find((item) => item.id === body.assetId && item.tenantId === actor.tenantId);
      if (!asset) throw { statusCode: 404, message: "Asset not found" };
    }

    const job: MediaProcessingJob = {
      id: newId("job"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      assetId: body.assetId ? String(body.assetId) : undefined,
      type: String(body.type ?? "thumbnail") as ProcessingJobType,
      status: "queued",
      progress: 0,
      input: optionalObject(body.input),
      retryCount: 0,
      maxRetries: ensureNumber(body.maxRetries, "maxRetries", 3)
    };

    state.processingJobs.push(job);
    this.store.save();
    this.store.audit(actor, "job.create", "processingJob", job.id, undefined, job);
    return clone(job);
  }

  updateProcessingJob(id: string, input: unknown, actor: RequestActor): MediaProcessingJob {
    const body = optionalObject(input);
    const state = this.store.getState();
    const job = state.processingJobs.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!job) throw { statusCode: 404, message: "Processing job not found" };

    if (body.status) job.status = String(body.status) as MediaProcessingJob["status"];
    if (body.progress !== undefined) job.progress = ensureNumber(body.progress, "progress");
    if (body.output) job.output = { ...job.output, ...optionalObject(body.output) };
    if (body.error) job.error = String(body.error);
    if (body.startedAt) job.startedAt = String(body.startedAt);
    if (body.completedAt) job.completedAt = String(body.completedAt);
    job.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "job.update", "processingJob", job.id, undefined, job);

    if (job.status === "completed") {
      this.emitEvent(actor, "media.job.completed", { jobId: job.id, assetId: job.assetId, type: job.type });
    }

    return clone(job);
  }

  recordAnalytics(assetId: string, input: unknown, actor: RequestActor): MediaAnalyticsEvent {
    const body = optionalObject(input);
    const state = this.store.getState();
    const asset = state.assets.find((item) => item.id === assetId && item.tenantId === actor.tenantId);
    if (!asset) throw { statusCode: 404, message: "Asset not found" };

    const event: MediaAnalyticsEvent = {
      id: newId("analytics"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      assetId,
      event: ensureString(body.event, "event") as MediaAnalyticsEvent["event"],
      userId: body.userId ? String(body.userId) : actor.userId,
      metadata: optionalObject(body.metadata),
      sessionId: body.sessionId ? String(body.sessionId) : undefined
    };

    if (event.event === "view") asset.viewCount++;
    if (event.event === "download") asset.downloadCount++;
    asset.updatedAt = nowIso();

    state.analyticsEvents.push(event);
    this.store.save();
    return clone(event);
  }

  listEvents(actor: RequestActor): MediaEvent[] {
    return clone(this.store.getState().events.filter((item) => item.tenantId === actor.tenantId));
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((item) => item.tenantId === actor.tenantId));
  }

  private emitEvent(actor: RequestActor, type: string, data: Record<string, unknown>): MediaEvent {
    const event: MediaEvent = {
      id: newId("evt"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      type,
      source: "MediaOS",
      actorId: actor.userId,
      data
    };
    this.store.getState().events.unshift(event);
    return event;
  }
}
