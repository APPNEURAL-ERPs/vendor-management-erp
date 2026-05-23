import {
  ApiRole, AuditLog, BaseEntity, DataStore, EntityStatus, EventBus, RequestActor, ROLE_PERMISSIONS,
  SeoMeta, WebsiteAnalyticsEvent, WebsiteDomain, WebsiteForm, WebsiteFormAction, WebsiteFormField, WebsiteFormSubmission,
  WebsiteMediaAsset, WebsiteMenu, WebsiteMenuItem, WebsitePage, WebsitePageBlock, WebsitePost,
  WebsitePublishSnapshot, WebsiteRedirect, WebsiteSeoAudit, WebsiteSite, WebsiteTheme,
  asArray, asNumber, badRequest, clone, conflict, ensureHostname, includesText, newId, normalizePathValue,
  notFound, nowIso, optionalString, requireString, slugify, unique
} from "./core";

type Query = Record<string, string>;
type AnyBody = Record<string, unknown>;

export class WebsiteService {
  constructor(private readonly store: DataStore, private readonly bus: EventBus) {}

  permissions(role: ApiRole): string[] { return ROLE_PERMISSIONS[role] ?? []; }

  overview(actor: RequestActor): Record<string, unknown> {
    const state = this.store.getState();
    const sites = state.sites.filter((x) => x.tenantId === actor.tenantId);
    const siteIds = sites.map((x) => x.id);
    const pages = state.pages.filter((x) => siteIds.includes(x.siteId));
    const posts = state.posts.filter((x) => siteIds.includes(x.siteId));
    const submissions = state.submissions.filter((x) => siteIds.includes(x.siteId));
    const domains = state.domains.filter((x) => siteIds.includes(x.siteId));
    const views = state.analyticsEvents.filter((x) => siteIds.includes(x.siteId) && x.event === "page.view");
    return {
      sites: sites.length,
      activeSites: sites.filter((x) => x.status === "active").length,
      pages: pages.length,
      publishedPages: pages.filter((x) => x.status === "published").length,
      posts: posts.length,
      publishedPosts: posts.filter((x) => x.status === "published").length,
      domains: domains.length,
      verifiedDomains: domains.filter((x) => ["verified", "active"].includes(x.status)).length,
      forms: state.forms.filter((x) => siteIds.includes(x.siteId)).length,
      newSubmissions: submissions.filter((x) => x.status === "new").length,
      redirects: state.redirects.filter((x) => siteIds.includes(x.siteId) && x.status === "active").length,
      pageViews: views.length,
      latestEvents: state.events.filter((x) => x.tenantId === actor.tenantId).slice(0, 10)
    };
  }

  analytics(actor: RequestActor, query: Query = {}): Record<string, unknown> {
    const state = this.store.getState();
    const siteId = optionalString(query.siteId);
    const events = state.analyticsEvents.filter((event) => event.tenantId === actor.tenantId && (!siteId || event.siteId === siteId));
    const views = events.filter((x) => x.event === "page.view");
    const submissions = events.filter((x) => x.event === "form.submit");
    const topPages = [...views.reduce((map, event) => {
      const path = event.path ?? "/";
      map.set(path, (map.get(path) ?? 0) + 1);
      return map;
    }, new Map<string, number>()).entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([path, count]) => ({ path, views: count }));
    const visitors = new Set(events.map((x) => x.visitorId).filter(Boolean));
    return { pageViews: views.length, formSubmits: submissions.length, uniqueVisitors: visitors.size, topPages, events: events.length };
  }

  // Sites
  listSites(actor: RequestActor, query: Query = {}): WebsiteSite[] {
    const q = optionalString(query.q);
    return this.store.getState().sites.filter((site) => site.tenantId === actor.tenantId && (!q || includesText(site.name, q) || includesText(site.slug, q))).map(clone);
  }

  createSite(actor: RequestActor, body: unknown): WebsiteSite {
    const input = asBody(body);
    const now = nowIso();
    const name = requireString(input.name, "name");
    const slug = slugify(optionalString(input.slug) ?? name);
    const state = this.store.getState();
    if (state.sites.some((site) => site.tenantId === actor.tenantId && site.slug === slug)) conflict("site slug already exists", { slug });
    const site: WebsiteSite = {
      id: newId("site"), tenantId: actor.tenantId, name, slug,
      status: (optionalString(input.status) as WebsiteSite["status"]) ?? "draft",
      primaryDomain: optionalString(input.primaryDomain), locale: optionalString(input.locale) ?? "en-IN", timezone: optionalString(input.timezone) ?? "Asia/Kolkata",
      settings: objectValue(input.settings), createdBy: actor.userId, createdAt: now, updatedAt: now
    };
    state.sites.push(site);
    this.audit(actor, "site.create", "site", site.id, undefined, site);
    this.bus.emit(actor, "website.site.created", { siteId: site.id, slug: site.slug });
    this.store.save();
    return clone(site);
  }

  getSite(actor: RequestActor, id: string): WebsiteSite {
    return clone(this.findSite(actor, id));
  }

  updateSite(actor: RequestActor, id: string, body: unknown): WebsiteSite {
    const input = asBody(body);
    const site = this.findSite(actor, id);
    const before = clone(site);
    if (input.name !== undefined) site.name = requireString(input.name, "name");
    if (input.slug !== undefined) site.slug = slugify(requireString(input.slug, "slug"));
    if (input.status !== undefined) site.status = requireString(input.status, "status") as WebsiteSite["status"];
    if (input.primaryDomain !== undefined) site.primaryDomain = optionalString(input.primaryDomain);
    if (input.locale !== undefined) site.locale = requireString(input.locale, "locale");
    if (input.timezone !== undefined) site.timezone = requireString(input.timezone, "timezone");
    if (input.settings !== undefined) site.settings = objectValue(input.settings);
    site.updatedAt = nowIso();
    this.audit(actor, "site.update", "site", site.id, before, site);
    this.bus.emit(actor, "website.site.updated", { siteId: site.id });
    this.store.save();
    return clone(site);
  }

  // Domains
  listDomains(actor: RequestActor, query: Query = {}): WebsiteDomain[] {
    const siteId = optionalString(query.siteId);
    return this.store.getState().domains.filter((d) => d.tenantId === actor.tenantId && (!siteId || d.siteId === siteId)).map(clone);
  }

  addDomain(actor: RequestActor, body: unknown): WebsiteDomain {
    const input = asBody(body);
    const site = this.findSite(actor, requireString(input.siteId, "siteId"));
    const hostname = ensureHostname(requireString(input.hostname, "hostname"));
    const state = this.store.getState();
    if (state.domains.some((d) => d.tenantId === actor.tenantId && d.hostname === hostname)) conflict("domain already exists", { hostname });
    const now = nowIso();
    const domain: WebsiteDomain = { id: newId("dom"), tenantId: actor.tenantId, siteId: site.id, hostname, status: "pending", isPrimary: false, sslStatus: "not_requested", verificationToken: `verify-${newId("tok")}`, createdBy: actor.userId, createdAt: now, updatedAt: now };
    state.domains.push(domain);
    this.audit(actor, "domain.add", "domain", domain.id, undefined, domain);
    this.bus.emit(actor, "website.domain.added", { siteId: site.id, domainId: domain.id, hostname });
    this.store.save();
    return clone(domain);
  }

  verifyDomain(actor: RequestActor, id: string): WebsiteDomain {
    const domain = this.findDomain(actor, id);
    const before = clone(domain);
    domain.status = "verified";
    domain.sslStatus = "issued";
    domain.updatedAt = nowIso();
    this.audit(actor, "domain.verify", "domain", domain.id, before, domain);
    this.bus.emit(actor, "website.domain.verified", { siteId: domain.siteId, domainId: domain.id, hostname: domain.hostname });
    this.store.save();
    return clone(domain);
  }

  setPrimaryDomain(actor: RequestActor, id: string): WebsiteDomain {
    const domain = this.findDomain(actor, id);
    const site = this.findSite(actor, domain.siteId);
    const before = clone(domain);
    for (const other of this.store.getState().domains.filter((d) => d.siteId === domain.siteId)) other.isPrimary = false;
    domain.isPrimary = true;
    domain.status = "active";
    domain.sslStatus = "issued";
    domain.updatedAt = nowIso();
    site.primaryDomain = domain.hostname;
    site.updatedAt = nowIso();
    this.audit(actor, "domain.primary", "domain", domain.id, before, domain);
    this.bus.emit(actor, "website.domain.primary_set", { siteId: domain.siteId, hostname: domain.hostname });
    this.store.save();
    return clone(domain);
  }

  // Themes
  listThemes(actor: RequestActor, query: Query = {}): WebsiteTheme[] {
    const siteId = optionalString(query.siteId);
    return this.store.getState().themes.filter((t) => t.tenantId === actor.tenantId && (!siteId || t.siteId === siteId)).map(clone);
  }

  createTheme(actor: RequestActor, body: unknown): WebsiteTheme {
    const input = asBody(body);
    const site = this.findSite(actor, requireString(input.siteId, "siteId"));
    const now = nowIso();
    const theme: WebsiteTheme = {
      id: newId("theme"), tenantId: actor.tenantId, siteId: site.id, name: requireString(input.name, "name"),
      status: (optionalString(input.status) as WebsiteTheme["status"]) ?? "draft",
      tokens: themeTokens(input.tokens), components: objectValue(input.components), createdBy: actor.userId, createdAt: now, updatedAt: now
    };
    this.store.getState().themes.push(theme);
    this.audit(actor, "theme.create", "theme", theme.id, undefined, theme);
    this.bus.emit(actor, "website.theme.created", { siteId: site.id, themeId: theme.id });
    this.store.save();
    return clone(theme);
  }

  updateTheme(actor: RequestActor, id: string, body: unknown): WebsiteTheme {
    const input = asBody(body);
    const theme = this.findTheme(actor, id);
    const before = clone(theme);
    if (input.name !== undefined) theme.name = requireString(input.name, "name");
    if (input.tokens !== undefined) theme.tokens = themeTokens(input.tokens);
    if (input.components !== undefined) theme.components = objectValue(input.components);
    if (input.status !== undefined) theme.status = requireString(input.status, "status") as WebsiteTheme["status"];
    theme.updatedAt = nowIso();
    this.audit(actor, "theme.update", "theme", theme.id, before, theme);
    this.store.save();
    return clone(theme);
  }

  activateTheme(actor: RequestActor, id: string): WebsiteTheme {
    const theme = this.findTheme(actor, id);
    const before = clone(theme);
    for (const item of this.store.getState().themes.filter((t) => t.siteId === theme.siteId)) item.status = item.id === theme.id ? "active" : item.status === "active" ? "draft" : item.status;
    theme.status = "active";
    theme.updatedAt = nowIso();
    this.audit(actor, "theme.activate", "theme", theme.id, before, theme);
    this.bus.emit(actor, "website.theme.activated", { siteId: theme.siteId, themeId: theme.id });
    this.store.save();
    return clone(theme);
  }

  // Pages and blocks
  listPages(actor: RequestActor, query: Query = {}): WebsitePage[] {
    const siteId = optionalString(query.siteId);
    const status = optionalString(query.status);
    const q = optionalString(query.q);
    return this.store.getState().pages.filter((p) => p.tenantId === actor.tenantId && (!siteId || p.siteId === siteId) && (!status || p.status === status) && (!q || includesText(p.title, q) || includesText(p.path, q))).map(clone);
  }

  createPage(actor: RequestActor, body: unknown): WebsitePage {
    const input = asBody(body);
    const site = this.findSite(actor, requireString(input.siteId, "siteId"));
    const title = requireString(input.title, "title");
    const slug = slugify(optionalString(input.slug) ?? title);
    const path = normalizePathValue(optionalString(input.path) ?? slug);
    const state = this.store.getState();
    if (state.pages.some((p) => p.siteId === site.id && p.path === path && p.status !== "archived")) conflict("page path already exists", { path });
    const now = nowIso();
    const page: WebsitePage = { id: newId("page"), tenantId: actor.tenantId, siteId: site.id, title, slug, path, pageType: (optionalString(input.pageType) as WebsitePage["pageType"]) ?? "cms", status: (optionalString(input.status) as EntityStatus) ?? "draft", seo: seoMeta(input.seo, title), createdBy: actor.userId, createdAt: now, updatedAt: now };
    state.pages.push(page);
    this.audit(actor, "page.create", "page", page.id, undefined, page);
    this.bus.emit(actor, "website.page.created", { siteId: site.id, pageId: page.id, path: page.path });
    this.store.save();
    return clone(page);
  }

  getPage(actor: RequestActor, id: string): Record<string, unknown> {
    const page = this.findPage(actor, id);
    const blocks = this.store.getState().blocks.filter((b) => b.pageId === id && b.status !== "archived").sort((a, b) => a.order - b.order);
    return { ...clone(page), blocks: clone(blocks) };
  }

  updatePage(actor: RequestActor, id: string, body: unknown): WebsitePage {
    const input = asBody(body);
    const page = this.findPage(actor, id);
    const before = clone(page);
    if (input.title !== undefined) page.title = requireString(input.title, "title");
    if (input.slug !== undefined) page.slug = slugify(requireString(input.slug, "slug"));
    if (input.path !== undefined) page.path = normalizePathValue(requireString(input.path, "path"));
    if (input.pageType !== undefined) page.pageType = requireString(input.pageType, "pageType") as WebsitePage["pageType"];
    if (input.status !== undefined) page.status = requireString(input.status, "status") as EntityStatus;
    if (input.seo !== undefined) page.seo = seoMeta(input.seo, page.title);
    page.updatedAt = nowIso();
    this.audit(actor, "page.update", "page", page.id, before, page);
    this.bus.emit(actor, "website.page.updated", { siteId: page.siteId, pageId: page.id });
    this.store.save();
    return clone(page);
  }

  publishPage(actor: RequestActor, id: string): WebsitePage {
    const page = this.findPage(actor, id);
    const before = clone(page);
    page.status = "published";
    page.publishedAt = nowIso();
    page.updatedAt = nowIso();
    this.audit(actor, "page.publish", "page", page.id, before, page);
    this.bus.emit(actor, "website.page.published", { siteId: page.siteId, pageId: page.id, path: page.path });
    this.store.save();
    return clone(page);
  }

  clonePage(actor: RequestActor, id: string, body: unknown = {}): WebsitePage {
    const page = this.findPage(actor, id);
    const input = asBody(body);
    const title = optionalString(input.title) ?? `${page.title} Copy`;
    const slug = slugify(optionalString(input.slug) ?? title);
    const path = normalizePathValue(optionalString(input.path) ?? slug);
    const now = nowIso();
    const copy: WebsitePage = { ...clone(page), id: newId("page"), title, slug, path, status: "draft", publishedAt: undefined, createdAt: now, updatedAt: now, createdBy: actor.userId };
    this.store.getState().pages.push(copy);
    const pageBlocks = this.store.getState().blocks.filter((b) => b.pageId === page.id && b.status !== "archived");
    pageBlocks.forEach((block, index) => this.store.getState().blocks.push({ ...clone(block), id: newId("block"), pageId: copy.id, order: index + 1, createdAt: now, updatedAt: now, createdBy: actor.userId }));
    this.audit(actor, "page.clone", "page", copy.id, page, copy);
    this.bus.emit(actor, "website.page.cloned", { sourcePageId: page.id, pageId: copy.id });
    this.store.save();
    return clone(copy);
  }

  addBlock(actor: RequestActor, pageId: string, body: unknown): WebsitePageBlock {
    const page = this.findPage(actor, pageId);
    const input = asBody(body);
    const now = nowIso();
    const existing = this.store.getState().blocks.filter((b) => b.pageId === pageId && b.status !== "archived");
    const block: WebsitePageBlock = { id: newId("block"), tenantId: actor.tenantId, siteId: page.siteId, pageId, type: (optionalString(input.type) as WebsitePageBlock["type"]) ?? "text", order: asNumber(input.order, existing.length + 1), content: objectValue(input.content), settings: objectValue(input.settings), status: "active", createdBy: actor.userId, createdAt: now, updatedAt: now };
    this.store.getState().blocks.push(block);
    this.audit(actor, "block.add", "block", block.id, undefined, block);
    this.store.save();
    return clone(block);
  }

  updateBlock(actor: RequestActor, id: string, body: unknown): WebsitePageBlock {
    const input = asBody(body);
    const block = this.findBlock(actor, id);
    const before = clone(block);
    if (input.type !== undefined) block.type = requireString(input.type, "type") as WebsitePageBlock["type"];
    if (input.order !== undefined) block.order = asNumber(input.order, block.order);
    if (input.content !== undefined) block.content = objectValue(input.content);
    if (input.settings !== undefined) block.settings = objectValue(input.settings);
    if (input.status !== undefined) block.status = requireString(input.status, "status") as WebsitePageBlock["status"];
    block.updatedAt = nowIso();
    this.audit(actor, "block.update", "block", block.id, before, block);
    this.store.save();
    return clone(block);
  }

  reorderBlocks(actor: RequestActor, pageId: string, body: unknown): WebsitePageBlock[] {
    this.findPage(actor, pageId);
    const input = asBody(body);
    const ids = asArray<string>(input.blockIds);
    if (ids.length === 0) badRequest("blockIds array is required");
    const blocks = this.store.getState().blocks.filter((b) => b.pageId === pageId && b.status !== "archived");
    ids.forEach((id, index) => {
      const block = blocks.find((b) => b.id === id);
      if (!block) badRequest("unknown block id", { id });
      block.order = index + 1;
      block.updatedAt = nowIso();
    });
    this.audit(actor, "blocks.reorder", "page", pageId, undefined, { blockIds: ids });
    this.store.save();
    return clone(blocks.sort((a, b) => a.order - b.order));
  }

  // Menus
  listMenus(actor: RequestActor, query: Query = {}): WebsiteMenu[] {
    const siteId = optionalString(query.siteId);
    return this.store.getState().menus.filter((m) => m.tenantId === actor.tenantId && (!siteId || m.siteId === siteId)).map(clone);
  }

  createMenu(actor: RequestActor, body: unknown): WebsiteMenu {
    const input = asBody(body);
    const site = this.findSite(actor, requireString(input.siteId, "siteId"));
    const now = nowIso();
    const menu: WebsiteMenu = { id: newId("menu"), tenantId: actor.tenantId, siteId: site.id, name: requireString(input.name, "name"), location: (optionalString(input.location) as WebsiteMenu["location"]) ?? "header", items: menuItems(input.items), status: (optionalString(input.status) as WebsiteMenu["status"]) ?? "active", createdBy: actor.userId, createdAt: now, updatedAt: now };
    this.store.getState().menus.push(menu);
    this.audit(actor, "menu.create", "menu", menu.id, undefined, menu);
    this.store.save();
    return clone(menu);
  }

  updateMenu(actor: RequestActor, id: string, body: unknown): WebsiteMenu {
    const input = asBody(body);
    const menu = this.findMenu(actor, id);
    const before = clone(menu);
    if (input.name !== undefined) menu.name = requireString(input.name, "name");
    if (input.location !== undefined) menu.location = requireString(input.location, "location") as WebsiteMenu["location"];
    if (input.items !== undefined) menu.items = menuItems(input.items);
    if (input.status !== undefined) menu.status = requireString(input.status, "status") as WebsiteMenu["status"];
    menu.updatedAt = nowIso();
    this.audit(actor, "menu.update", "menu", menu.id, before, menu);
    this.store.save();
    return clone(menu);
  }

  addMenuItem(actor: RequestActor, id: string, body: unknown): WebsiteMenu {
    const menu = this.findMenu(actor, id);
    const before = clone(menu);
    const input = asBody(body);
    menu.items.push({ id: newId("mi"), label: requireString(input.label, "label"), url: requireString(input.url, "url"), target: (optionalString(input.target) as "self" | "blank") ?? "self", children: menuItems(input.children) });
    menu.updatedAt = nowIso();
    this.audit(actor, "menu.item.add", "menu", menu.id, before, menu);
    this.store.save();
    return clone(menu);
  }

  removeMenuItem(actor: RequestActor, id: string, itemId: string): WebsiteMenu {
    const menu = this.findMenu(actor, id);
    const before = clone(menu);
    menu.items = removeMenuItemRecursive(menu.items, itemId);
    menu.updatedAt = nowIso();
    this.audit(actor, "menu.item.remove", "menu", menu.id, before, menu);
    this.store.save();
    return clone(menu);
  }

  // Media
  listMedia(actor: RequestActor, query: Query = {}): WebsiteMediaAsset[] {
    const siteId = optionalString(query.siteId);
    const q = optionalString(query.q);
    return this.store.getState().media.filter((m) => m.tenantId === actor.tenantId && m.status !== "deleted" && (!siteId || m.siteId === siteId) && (!q || includesText(m.fileName, q) || m.tags.some((t) => includesText(t, q)))).map(clone);
  }

  createMedia(actor: RequestActor, body: unknown): WebsiteMediaAsset {
    const input = asBody(body);
    const site = this.findSite(actor, requireString(input.siteId, "siteId"));
    const now = nowIso();
    const media: WebsiteMediaAsset = { id: newId("media"), tenantId: actor.tenantId, siteId: site.id, fileName: requireString(input.fileName, "fileName"), url: requireString(input.url, "url"), mimeType: optionalString(input.mimeType) ?? "application/octet-stream", sizeBytes: asNumber(input.sizeBytes, 0), altText: optionalString(input.altText), folder: optionalString(input.folder), tags: unique(asArray<string>(input.tags)), status: "active", createdBy: actor.userId, createdAt: now, updatedAt: now };
    this.store.getState().media.push(media);
    this.audit(actor, "media.create", "media", media.id, undefined, media);
    this.bus.emit(actor, "website.media.created", { siteId: site.id, mediaId: media.id });
    this.store.save();
    return clone(media);
  }

  updateMedia(actor: RequestActor, id: string, body: unknown): WebsiteMediaAsset {
    const input = asBody(body);
    const media = this.findMedia(actor, id);
    const before = clone(media);
    if (input.fileName !== undefined) media.fileName = requireString(input.fileName, "fileName");
    if (input.url !== undefined) media.url = requireString(input.url, "url");
    if (input.mimeType !== undefined) media.mimeType = requireString(input.mimeType, "mimeType");
    if (input.sizeBytes !== undefined) media.sizeBytes = asNumber(input.sizeBytes, media.sizeBytes);
    if (input.altText !== undefined) media.altText = optionalString(input.altText);
    if (input.folder !== undefined) media.folder = optionalString(input.folder);
    if (input.tags !== undefined) media.tags = unique(asArray<string>(input.tags));
    if (input.status !== undefined) media.status = requireString(input.status, "status") as WebsiteMediaAsset["status"];
    media.updatedAt = nowIso();
    this.audit(actor, "media.update", "media", media.id, before, media);
    this.store.save();
    return clone(media);
  }

  // Posts
  listPosts(actor: RequestActor, query: Query = {}): WebsitePost[] {
    const siteId = optionalString(query.siteId);
    const status = optionalString(query.status);
    const tag = optionalString(query.tag);
    return this.store.getState().posts.filter((p) => p.tenantId === actor.tenantId && (!siteId || p.siteId === siteId) && (!status || p.status === status) && (!tag || p.tags.includes(tag))).map(clone);
  }

  createPost(actor: RequestActor, body: unknown): WebsitePost {
    const input = asBody(body);
    const site = this.findSite(actor, requireString(input.siteId, "siteId"));
    const title = requireString(input.title, "title");
    const now = nowIso();
    const post: WebsitePost = { id: newId("post"), tenantId: actor.tenantId, siteId: site.id, title, slug: slugify(optionalString(input.slug) ?? title), excerpt: optionalString(input.excerpt), body: optionalString(input.body) ?? "", category: optionalString(input.category), tags: unique(asArray<string>(input.tags)), status: (optionalString(input.status) as EntityStatus) ?? "draft", authorId: optionalString(input.authorId) ?? actor.userId, seo: seoMeta(input.seo, title), createdAt: now, updatedAt: now };
    this.store.getState().posts.push(post);
    this.audit(actor, "post.create", "post", post.id, undefined, post);
    this.store.save();
    return clone(post);
  }

  updatePost(actor: RequestActor, id: string, body: unknown): WebsitePost {
    const input = asBody(body);
    const post = this.findPost(actor, id);
    const before = clone(post);
    if (input.title !== undefined) post.title = requireString(input.title, "title");
    if (input.slug !== undefined) post.slug = slugify(requireString(input.slug, "slug"));
    if (input.excerpt !== undefined) post.excerpt = optionalString(input.excerpt);
    if (input.body !== undefined) post.body = String(input.body);
    if (input.category !== undefined) post.category = optionalString(input.category);
    if (input.tags !== undefined) post.tags = unique(asArray<string>(input.tags));
    if (input.status !== undefined) post.status = requireString(input.status, "status") as EntityStatus;
    if (input.seo !== undefined) post.seo = seoMeta(input.seo, post.title);
    post.updatedAt = nowIso();
    this.audit(actor, "post.update", "post", post.id, before, post);
    this.store.save();
    return clone(post);
  }

  publishPost(actor: RequestActor, id: string): WebsitePost {
    const post = this.findPost(actor, id);
    const before = clone(post);
    post.status = "published";
    post.publishedAt = nowIso();
    post.updatedAt = nowIso();
    this.audit(actor, "post.publish", "post", post.id, before, post);
    this.bus.emit(actor, "website.post.published", { siteId: post.siteId, postId: post.id, slug: post.slug });
    this.store.save();
    return clone(post);
  }

  // Forms and submissions
  listForms(actor: RequestActor, query: Query = {}): WebsiteForm[] {
    const siteId = optionalString(query.siteId);
    return this.store.getState().forms.filter((f) => f.tenantId === actor.tenantId && (!siteId || f.siteId === siteId)).map(clone);
  }

  createForm(actor: RequestActor, body: unknown): WebsiteForm {
    const input = asBody(body);
    const site = this.findSite(actor, requireString(input.siteId, "siteId"));
    const now = nowIso();
    const name = requireString(input.name, "name");
    const form: WebsiteForm = { id: newId("form"), tenantId: actor.tenantId, siteId: site.id, name, slug: slugify(optionalString(input.slug) ?? name), fields: formFields(input.fields), actions: formActions(input.actions), status: (optionalString(input.status) as WebsiteForm["status"]) ?? "draft", createdBy: actor.userId, createdAt: now, updatedAt: now };
    this.store.getState().forms.push(form);
    this.audit(actor, "form.create", "form", form.id, undefined, form);
    this.store.save();
    return clone(form);
  }

  updateForm(actor: RequestActor, id: string, body: unknown): WebsiteForm {
    const input = asBody(body);
    const form = this.findForm(actor, id);
    const before = clone(form);
    if (input.name !== undefined) form.name = requireString(input.name, "name");
    if (input.slug !== undefined) form.slug = slugify(requireString(input.slug, "slug"));
    if (input.fields !== undefined) form.fields = formFields(input.fields);
    if (input.actions !== undefined) form.actions = formActions(input.actions);
    if (input.status !== undefined) form.status = requireString(input.status, "status") as WebsiteForm["status"];
    form.updatedAt = nowIso();
    this.audit(actor, "form.update", "form", form.id, before, form);
    this.store.save();
    return clone(form);
  }

  submitForm(actor: RequestActor, formId: string, body: unknown): WebsiteFormSubmission {
    const input = asBody(body);
    const form = this.findForm(actor, formId);
    if (form.status !== "active") badRequest("form is not active", { formId, status: form.status });
    const data = objectValue(input.data);
    for (const field of form.fields.filter((f) => f.required)) {
      if (data[field.name] === undefined || data[field.name] === null || data[field.name] === "") badRequest(`missing required field: ${field.name}`);
    }
    const now = nowIso();
    const submission: WebsiteFormSubmission = { id: newId("sub"), tenantId: actor.tenantId, siteId: form.siteId, formId: form.id, sourceUrl: optionalString(input.sourceUrl), data, status: "new", assignedTo: optionalString(input.assignedTo), submittedAt: now, createdAt: now, updatedAt: now };
    this.store.getState().submissions.unshift(submission);
    this.addAnalytics(actor, form.siteId, "form.submit", { path: submission.sourceUrl, data: { formId: form.id } });
    this.audit(actor, "form.submit", "submission", submission.id, undefined, submission);
    this.bus.emit(actor, "website.form.submitted", { siteId: form.siteId, formId: form.id, submissionId: submission.id });
    this.store.save();
    return clone(submission);
  }

  listSubmissions(actor: RequestActor, query: Query = {}): WebsiteFormSubmission[] {
    const formId = optionalString(query.formId);
    const status = optionalString(query.status);
    return this.store.getState().submissions.filter((s) => s.tenantId === actor.tenantId && (!formId || s.formId === formId) && (!status || s.status === status)).map(clone);
  }

  triageSubmission(actor: RequestActor, id: string, body: unknown): WebsiteFormSubmission {
    const input = asBody(body);
    const submission = this.findSubmission(actor, id);
    const before = clone(submission);
    if (input.status !== undefined) submission.status = requireString(input.status, "status") as WebsiteFormSubmission["status"];
    if (input.assignedTo !== undefined) submission.assignedTo = optionalString(input.assignedTo);
    submission.updatedAt = nowIso();
    this.audit(actor, "submission.triage", "submission", submission.id, before, submission);
    this.store.save();
    return clone(submission);
  }

  // Redirects
  listRedirects(actor: RequestActor, query: Query = {}): WebsiteRedirect[] {
    const siteId = optionalString(query.siteId);
    return this.store.getState().redirects.filter((r) => r.tenantId === actor.tenantId && (!siteId || r.siteId === siteId)).map(clone);
  }

  createRedirect(actor: RequestActor, body: unknown): WebsiteRedirect {
    const input = asBody(body);
    const site = this.findSite(actor, requireString(input.siteId, "siteId"));
    const fromPath = normalizePathValue(requireString(input.fromPath, "fromPath"));
    if (this.store.getState().redirects.some((r) => r.siteId === site.id && r.fromPath === fromPath && r.status === "active")) conflict("active redirect already exists", { fromPath });
    const now = nowIso();
    const redirect: WebsiteRedirect = { id: newId("redir"), tenantId: actor.tenantId, siteId: site.id, fromPath, toUrl: requireString(input.toUrl, "toUrl"), code: (asNumber(input.code, 301) as WebsiteRedirect["code"]), status: (optionalString(input.status) as WebsiteRedirect["status"]) ?? "active", createdBy: actor.userId, createdAt: now, updatedAt: now };
    this.store.getState().redirects.push(redirect);
    this.audit(actor, "redirect.create", "redirect", redirect.id, undefined, redirect);
    this.store.save();
    return clone(redirect);
  }

  updateRedirect(actor: RequestActor, id: string, body: unknown): WebsiteRedirect {
    const input = asBody(body);
    const redirect = this.findRedirect(actor, id);
    const before = clone(redirect);
    if (input.fromPath !== undefined) redirect.fromPath = normalizePathValue(requireString(input.fromPath, "fromPath"));
    if (input.toUrl !== undefined) redirect.toUrl = requireString(input.toUrl, "toUrl");
    if (input.code !== undefined) redirect.code = asNumber(input.code, redirect.code) as WebsiteRedirect["code"];
    if (input.status !== undefined) redirect.status = requireString(input.status, "status") as WebsiteRedirect["status"];
    redirect.updatedAt = nowIso();
    this.audit(actor, "redirect.update", "redirect", redirect.id, before, redirect);
    this.store.save();
    return clone(redirect);
  }

  // SEO, publishing, sitemap
  auditPageSeo(actor: RequestActor, pageId: string): WebsiteSeoAudit {
    const page = this.findPage(actor, pageId);
    const issues: string[] = [];
    const recommendations: string[] = [];
    if (!page.seo.title) issues.push("Missing SEO title");
    if ((page.seo.title ?? "").length > 60) recommendations.push("Shorten SEO title to around 50-60 characters");
    if (!page.seo.description) issues.push("Missing meta description");
    if ((page.seo.description ?? "").length > 160) recommendations.push("Shorten meta description to around 150-160 characters");
    if (!page.seo.ogImage) recommendations.push("Add an Open Graph image for richer social sharing");
    if (!page.seo.canonicalUrl) recommendations.push("Add canonical URL if the page can be accessed through multiple URLs");
    const blocks = this.store.getState().blocks.filter((b) => b.pageId === page.id && b.status === "active");
    if (blocks.length === 0) issues.push("Page has no active content blocks");
    const score = Math.max(0, 100 - issues.length * 20 - recommendations.length * 5);
    const now = nowIso();
    const audit: WebsiteSeoAudit = { id: newId("seo"), tenantId: actor.tenantId, siteId: page.siteId, pageId: page.id, score, issues, recommendations, auditedAt: now, createdBy: actor.userId, createdAt: now, updatedAt: now };
    this.store.getState().seoAudits.unshift(audit);
    this.addAnalytics(actor, page.siteId, "seo.audit", { path: page.path, data: { pageId: page.id, score } });
    this.audit(actor, "seo.audit", "page", page.id, undefined, audit);
    this.bus.emit(actor, "website.seo.audit_created", { siteId: page.siteId, pageId: page.id, score });
    this.store.save();
    return clone(audit);
  }

  listSeoAudits(actor: RequestActor, query: Query = {}): WebsiteSeoAudit[] {
    const siteId = optionalString(query.siteId);
    const pageId = optionalString(query.pageId);
    return this.store.getState().seoAudits.filter((a) => a.tenantId === actor.tenantId && (!siteId || a.siteId === siteId) && (!pageId || a.pageId === pageId)).map(clone);
  }

  createSnapshot(actor: RequestActor, body: unknown): WebsitePublishSnapshot {
    const input = asBody(body);
    const site = this.findSite(actor, requireString(input.siteId, "siteId"));
    const state = this.store.getState();
    const now = nowIso();
    const snapshot: WebsitePublishSnapshot = {
      id: newId("snap"), tenantId: actor.tenantId, siteId: site.id,
      title: optionalString(input.title) ?? `${site.name} publish ${new Date().toISOString()}`,
      status: "created",
      entityCounts: {
        pages: state.pages.filter((x) => x.siteId === site.id && x.status === "published").length,
        posts: state.posts.filter((x) => x.siteId === site.id && x.status === "published").length,
        media: state.media.filter((x) => x.siteId === site.id && x.status === "active").length,
        redirects: state.redirects.filter((x) => x.siteId === site.id && x.status === "active").length,
        forms: state.forms.filter((x) => x.siteId === site.id && x.status === "active").length
      },
      artifactUrl: optionalString(input.artifactUrl), createdBy: actor.userId, createdAt: now, updatedAt: now
    };
    state.snapshots.unshift(snapshot);
    this.audit(actor, "publish.snapshot", "snapshot", snapshot.id, undefined, snapshot);
    this.bus.emit(actor, "website.publish.snapshot_created", { siteId: site.id, snapshotId: snapshot.id });
    this.store.save();
    return clone(snapshot);
  }

  deploySnapshot(actor: RequestActor, id: string): WebsitePublishSnapshot {
    const snapshot = this.findSnapshot(actor, id);
    const before = clone(snapshot);
    snapshot.status = "deployed";
    snapshot.deployedAt = nowIso();
    snapshot.updatedAt = nowIso();
    if (!snapshot.artifactUrl) snapshot.artifactUrl = `/published/${snapshot.siteId}/${snapshot.id}`;
    this.addAnalytics(actor, snapshot.siteId, "publish.deploy", { data: { snapshotId: snapshot.id } });
    this.audit(actor, "publish.deploy", "snapshot", snapshot.id, before, snapshot);
    this.bus.emit(actor, "website.publish.deployed", { siteId: snapshot.siteId, snapshotId: snapshot.id, artifactUrl: snapshot.artifactUrl });
    this.store.save();
    return clone(snapshot);
  }

  listSnapshots(actor: RequestActor, query: Query = {}): WebsitePublishSnapshot[] {
    const siteId = optionalString(query.siteId);
    return this.store.getState().snapshots.filter((s) => s.tenantId === actor.tenantId && (!siteId || s.siteId === siteId)).map(clone);
  }

  sitemap(actor: RequestActor, siteId: string): Record<string, unknown> {
    const site = this.findSite(actor, siteId);
    const baseUrl = site.primaryDomain ? `https://${site.primaryDomain}` : `https://${site.slug}.example.com`;
    const pages = this.store.getState().pages.filter((p) => p.siteId === site.id && p.status === "published");
    const posts = this.store.getState().posts.filter((p) => p.siteId === site.id && p.status === "published");
    const urls = [
      ...pages.map((p) => ({ loc: `${baseUrl}${p.path}`, lastmod: p.updatedAt, type: "page" })),
      ...posts.map((p) => ({ loc: `${baseUrl}/blog/${p.slug}`, lastmod: p.updatedAt, type: "post" }))
    ];
    const xml = [`<?xml version="1.0" encoding="UTF-8"?>`, `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`, ...urls.map((u) => `  <url><loc>${escapeXml(u.loc)}</loc><lastmod>${u.lastmod}</lastmod></url>`), `</urlset>`].join("\n");
    return { siteId: site.id, baseUrl, urls, xml };
  }

  robots(actor: RequestActor, siteId: string): Record<string, string> {
    const site = this.findSite(actor, siteId);
    const baseUrl = site.primaryDomain ? `https://${site.primaryDomain}` : `https://${site.slug}.example.com`;
    const content = [`User-agent: *`, `Allow: /`, `Sitemap: ${baseUrl}/sitemap.xml`].join("\n");
    return { siteId: site.id, content };
  }

  recordAnalytics(actor: RequestActor, body: unknown): WebsiteAnalyticsEvent {
    const input = asBody(body);
    const site = this.findSite(actor, requireString(input.siteId, "siteId"));
    const event = requireString(input.event, "event");
    const item = this.addAnalytics(actor, site.id, event, { path: optionalString(input.path), visitorId: optionalString(input.visitorId), sessionId: optionalString(input.sessionId), data: objectValue(input.data) });
    this.store.save();
    return clone(item);
  }

  eventsLog(actor: RequestActor): unknown[] { return clone(this.store.getState().events.filter((x) => x.tenantId === actor.tenantId).slice(0, 200)); }
  auditLogs(actor: RequestActor): unknown[] { return clone(this.store.getState().auditLogs.filter((x) => x.tenantId === actor.tenantId).slice(0, 200)); }

  // private helpers
  private findSite(actor: RequestActor, id: string): WebsiteSite {
    const site = this.store.getState().sites.find((x) => x.tenantId === actor.tenantId && x.id === id);
    if (!site) notFound("site not found", { id });
    return site;
  }
  private findDomain(actor: RequestActor, id: string): WebsiteDomain {
    const item = this.store.getState().domains.find((x) => x.tenantId === actor.tenantId && x.id === id);
    if (!item) notFound("domain not found", { id });
    return item;
  }
  private findTheme(actor: RequestActor, id: string): WebsiteTheme {
    const item = this.store.getState().themes.find((x) => x.tenantId === actor.tenantId && x.id === id);
    if (!item) notFound("theme not found", { id });
    return item;
  }
  private findPage(actor: RequestActor, id: string): WebsitePage {
    const item = this.store.getState().pages.find((x) => x.tenantId === actor.tenantId && x.id === id);
    if (!item) notFound("page not found", { id });
    return item;
  }
  private findBlock(actor: RequestActor, id: string): WebsitePageBlock {
    const item = this.store.getState().blocks.find((x) => x.tenantId === actor.tenantId && x.id === id);
    if (!item) notFound("block not found", { id });
    return item;
  }
  private findMenu(actor: RequestActor, id: string): WebsiteMenu {
    const item = this.store.getState().menus.find((x) => x.tenantId === actor.tenantId && x.id === id);
    if (!item) notFound("menu not found", { id });
    return item;
  }
  private findMedia(actor: RequestActor, id: string): WebsiteMediaAsset {
    const item = this.store.getState().media.find((x) => x.tenantId === actor.tenantId && x.id === id);
    if (!item) notFound("media asset not found", { id });
    return item;
  }
  private findPost(actor: RequestActor, id: string): WebsitePost {
    const item = this.store.getState().posts.find((x) => x.tenantId === actor.tenantId && x.id === id);
    if (!item) notFound("post not found", { id });
    return item;
  }
  private findForm(actor: RequestActor, id: string): WebsiteForm {
    const item = this.store.getState().forms.find((x) => x.tenantId === actor.tenantId && x.id === id);
    if (!item) notFound("form not found", { id });
    return item;
  }
  private findSubmission(actor: RequestActor, id: string): WebsiteFormSubmission {
    const item = this.store.getState().submissions.find((x) => x.tenantId === actor.tenantId && x.id === id);
    if (!item) notFound("submission not found", { id });
    return item;
  }
  private findRedirect(actor: RequestActor, id: string): WebsiteRedirect {
    const item = this.store.getState().redirects.find((x) => x.tenantId === actor.tenantId && x.id === id);
    if (!item) notFound("redirect not found", { id });
    return item;
  }
  private findSnapshot(actor: RequestActor, id: string): WebsitePublishSnapshot {
    const item = this.store.getState().snapshots.find((x) => x.tenantId === actor.tenantId && x.id === id);
    if (!item) notFound("snapshot not found", { id });
    return item;
  }

  private audit(actor: RequestActor, action: string, entityType: string, entityId?: string, before?: unknown, after?: unknown): AuditLog {
    const now = nowIso();
    const item: AuditLog = { id: newId("aud"), tenantId: actor.tenantId, actorId: actor.userId, role: actor.role, action, entityType, entityId, before: before ? clone(before) : undefined, after: after ? clone(after) : undefined, createdAt: now, updatedAt: now };
    this.store.getState().auditLogs.unshift(item);
    return item;
  }

  private addAnalytics(actor: RequestActor, siteId: string, event: string, options: { path?: string; visitorId?: string; sessionId?: string; data?: Record<string, unknown> } = {}): WebsiteAnalyticsEvent {
    const now = nowIso();
    const item: WebsiteAnalyticsEvent = { id: newId("wae"), tenantId: actor.tenantId, siteId, event, path: options.path, visitorId: options.visitorId, sessionId: options.sessionId, data: options.data ?? {}, createdAt: now, updatedAt: now };
    this.store.getState().analyticsEvents.unshift(item);
    return item;
  }
}

function asBody(body: unknown): AnyBody { return body && typeof body === "object" && !Array.isArray(body) ? body as AnyBody : {}; }
function objectValue(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? clone(value as Record<string, unknown>) : {}; }
function seoMeta(value: unknown, fallbackTitle: string): SeoMeta {
  const raw = objectValue(value);
  return {
    title: optionalString(raw.title) ?? fallbackTitle,
    description: optionalString(raw.description),
    canonicalUrl: optionalString(raw.canonicalUrl),
    robots: optionalString(raw.robots) ?? "index,follow",
    ogTitle: optionalString(raw.ogTitle) ?? optionalString(raw.title) ?? fallbackTitle,
    ogDescription: optionalString(raw.ogDescription) ?? optionalString(raw.description),
    ogImage: optionalString(raw.ogImage),
    keywords: unique(asArray<string>(raw.keywords))
  };
}
function themeTokens(value: unknown): WebsiteTheme["tokens"] {
  const raw = objectValue(value);
  const colors = objectValue(raw.colors) as Record<string, string>;
  const fonts = objectValue(raw.fonts) as Record<string, string>;
  const spacing = objectValue(raw.spacing) as Record<string, string>;
  const radii = objectValue(raw.radii) as Record<string, string>;
  return {
    colors: Object.keys(colors).length ? colors : { primary: "#111827", accent: "#2563eb", background: "#ffffff", text: "#111827" },
    fonts: Object.keys(fonts).length ? fonts : { heading: "Inter", body: "Inter" },
    spacing: Object.keys(spacing).length ? spacing : { sm: "8px", md: "16px", lg: "32px" },
    radii: Object.keys(radii).length ? radii : { md: "12px" }
  };
}
function menuItems(value: unknown): WebsiteMenuItem[] {
  return asArray<Record<string, unknown>>(value).map((item) => ({
    id: optionalString(item.id) ?? newId("mi"),
    label: requireString(item.label, "item.label"),
    url: requireString(item.url, "item.url"),
    target: (optionalString(item.target) as "self" | "blank") ?? "self",
    children: item.children ? menuItems(item.children) : []
  }));
}
function removeMenuItemRecursive(items: WebsiteMenuItem[], id: string): WebsiteMenuItem[] {
  return items.filter((item) => item.id !== id).map((item) => ({ ...item, children: item.children ? removeMenuItemRecursive(item.children, id) : [] }));
}
function formFields(value: unknown): WebsiteFormField[] {
  const fields = asArray<Record<string, unknown>>(value).map((field) => ({
    id: optionalString(field.id) ?? newId("fld"),
    name: slugify(requireString(field.name, "field.name")).replace(/-/g, "_"),
    label: requireString(field.label, "field.label"),
    type: (optionalString(field.type) as WebsiteFormField["type"]) ?? "text",
    required: field.required === undefined ? false : Boolean(field.required),
    options: unique(asArray<string>(field.options))
  }));
  if (fields.length === 0) badRequest("at least one form field is required");
  return fields;
}
function formActions(value: unknown): WebsiteFormAction[] {
  return asArray<Record<string, unknown>>(value).map((action) => ({ type: (optionalString(action.type) as WebsiteFormAction["type"]) ?? "email", config: objectValue(action.config) }));
}
function escapeXml(value: string): string { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }
