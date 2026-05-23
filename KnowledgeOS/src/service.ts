import { DataStore } from "./core/datastore";
import {
  KnowledgeArticle,
  KnowledgeSpace,
  SOP,
  Playbook,
  FAQ,
  DecisionRecord,
  KnowledgeNode,
  KnowledgeGraphEdge,
  KnowledgeSearchHit,
  KnowledgeFeedback,
  KnowledgeReview,
  RequestActor,
  KnowledgeOverview
} from "./core/domain";
import { badRequest, conflict, notFound } from "./core/errors";
import { newId, nowIso, estimateTokens, generateSlug } from "./core/id";
import { clone, ensureArray, ensureBoolean, ensureObject, ensureString, ensureNumber, optionalObject, pickQuery, tokenize, chunkText, uniq } from "./core/utils";

export class KnowledgeService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "KnowledgeOS service is ready";
  }

  overview(actor: RequestActor): KnowledgeOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    const spaces = state.spaces.filter((item) => item.tenantId === tenant);
    const articles = state.articles.filter((item) => item.tenantId === tenant);
    const sops = state.sops.filter((item) => item.tenantId === tenant);
    const playbooks = state.playbooks.filter((item) => item.tenantId === tenant);
    const faqs = state.faqs.filter((item) => item.tenantId === tenant);
    const decisions = state.decisions.filter((item) => item.tenantId === tenant);
    const feedback = state.feedback.filter((item) => item.tenantId === tenant);
    const reviews = state.reviews.filter((item) => item.tenantId === tenant);

    return {
      spaces: {
        total: spaces.length,
        active: spaces.filter((s) => s.status === "active").length
      },
      articles: {
        total: articles.length,
        published: articles.filter((a) => a.status === "published").length,
        drafts: articles.filter((a) => a.status === "draft").length,
        outdated: articles.filter((a) => a.status === "outdated").length
      },
      sops: {
        total: sops.length,
        active: sops.filter((s) => s.status === "active").length
      },
      playbooks: {
        total: playbooks.length,
        active: playbooks.filter((p) => p.status === "active").length
      },
      faqs: {
        total: faqs.length,
        active: faqs.filter((f) => f.status === "active").length
      },
      decisions: {
        total: decisions.length,
        accepted: decisions.filter((d) => d.status === "accepted").length
      },
      searchIndex: {
        total: state.searchIndex.filter((item) => item.tenantId === tenant).length
      },
      chunks: {
        total: state.chunks.filter((item) => item.tenantId === tenant).length
      },
      feedback: {
        helpful: feedback.filter((f) => f.helpful).length,
        notHelpful: feedback.filter((f) => !f.helpful).length
      },
      reviews: {
        pending: reviews.filter((r) => r.status === "pending").length
      }
    };
  }

  listSpaces(actor: RequestActor): KnowledgeSpace[] {
    return clone(this.store.getState().spaces.filter((item) => item.tenantId === actor.tenantId));
  }

  createSpace(input: unknown, actor: RequestActor): KnowledgeSpace {
    const body = ensureObject(input, "space");
    const state = this.store.getState();
    const key = ensureString(body.key, "space.key");
    if (state.spaces.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Space key '${key}' already exists`);
    }
    const space: KnowledgeSpace = {
      id: newId("space"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "space.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as KnowledgeSpace["status"],
      visibility: String(body.visibility ?? "internal") as KnowledgeSpace["visibility"],
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      tags: ensureArray<string>(body.tags, "space.tags"),
      metadata: optionalObject(body.metadata)
    };
    state.spaces.push(space);
    this.store.save();
    this.store.audit(actor, "space.create", "space", space.id, undefined, space);
    return clone(space);
  }

  getSpace(id: string, actor: RequestActor): KnowledgeSpace {
    const space = this.store.getState().spaces.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!space) notFound("Space not found");
    return clone(space);
  }

  listArticles(actor: RequestActor, query?: URLSearchParams): KnowledgeArticle[] {
    const spaceId = pickQuery(query, "spaceId");
    const status = pickQuery(query, "status");
    const search = pickQuery(query, "search")?.toLowerCase();
    return clone(this.store.getState().articles.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (spaceId && item.spaceId !== spaceId) return false;
      if (status && item.status !== status) return false;
      if (search && !`${item.title} ${item.content}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  createArticle(input: unknown, actor: RequestActor): KnowledgeArticle {
    const body = ensureObject(input, "article");
    const state = this.store.getState();
    if (body.spaceId) this.requireSpace(String(body.spaceId), actor.tenantId);
    const title = ensureString(body.title, "article.title");
    const article: KnowledgeArticle = {
      id: newId("article"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      spaceId: body.spaceId ? String(body.spaceId) : "",
      title,
      slug: body.slug ? String(body.slug) : generateSlug(title),
      content: ensureString(body.content, "article.content"),
      sourceType: String(body.sourceType ?? "text") as KnowledgeArticle["sourceType"],
      sourceUri: body.sourceUri ? String(body.sourceUri) : undefined,
      status: String(body.status ?? "draft") as KnowledgeArticle["status"],
      authorId: body.authorId ? String(body.authorId) : undefined,
      reviewerId: body.reviewerId ? String(body.reviewerId) : undefined,
      tags: ensureArray<string>(body.tags, "article.tags"),
      categories: ensureArray<string>(body.categories, "article.categories"),
      metadata: optionalObject(body.metadata),
      version: 1,
      publishedAt: body.status === "published" ? nowIso() : undefined,
      reviewDueAt: body.reviewDueAt ? String(body.reviewDueAt) : undefined
    };
    state.articles.push(article);
    this.indexEntity("article", article.id, article.title, article.content, article.spaceId, article.metadata);
    this.createChunks("article", article.id, article.content, article.metadata);
    this.store.save();
    this.store.audit(actor, "article.create", "article", article.id, undefined, article);
    return clone(article);
  }

  getArticle(id: string, actor: RequestActor): KnowledgeArticle {
    const article = this.store.getState().articles.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!article) notFound("Article not found");
    return clone(article);
  }

  updateArticle(id: string, input: unknown, actor: RequestActor): KnowledgeArticle {
    const body = ensureObject(input, "article");
    const state = this.store.getState();
    const article = state.articles.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!article) notFound("Article not found");
    const before = clone(article);
    if (body.title) article.title = String(body.title);
    if (body.content) article.content = String(body.content);
    if (body.slug) article.slug = String(body.slug);
    if (body.status) article.status = String(body.status) as KnowledgeArticle["status"];
    if (body.tags) article.tags = ensureArray<string>(body.tags, "article.tags");
    if (body.spaceId) article.spaceId = String(body.spaceId);
    article.version += 1;
    article.updatedAt = nowIso();
    if (article.status === "published" && !article.publishedAt) {
      article.publishedAt = nowIso();
    }
    this.reindexEntity("article", article.id, article.title, article.content, article.spaceId, article.metadata);
    this.store.save();
    this.store.audit(actor, "article.update", "article", article.id, before, article);
    return clone(article);
  }

  listSOPs(actor: RequestActor, query?: URLSearchParams): SOP[] {
    const spaceId = pickQuery(query, "spaceId");
    const search = pickQuery(query, "search")?.toLowerCase();
    return clone(this.store.getState().sops.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (spaceId && item.spaceId !== spaceId) return false;
      if (search && !`${item.name} ${item.description ?? ""}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  createSOP(input: unknown, actor: RequestActor): SOP {
    const body = ensureObject(input, "sop");
    const state = this.store.getState();
    const key = ensureString(body.key, "sop.key");
    if (state.sops.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`SOP key '${key}' already exists`);
    }
    if (body.spaceId) this.requireSpace(String(body.spaceId), actor.tenantId);
    const sop: SOP = {
      id: newId("sop"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      spaceId: body.spaceId ? String(body.spaceId) : "",
      key,
      name: ensureString(body.name, "sop.name"),
      description: body.description ? String(body.description) : undefined,
      content: ensureString(body.content, "sop.content"),
      status: String(body.status ?? "active") as SOP["status"],
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      department: body.department ? String(body.department) : undefined,
      steps: ensureArray(body.steps, "sop.steps").map((step: any, idx: number) => ({
        order: step.order ?? idx + 1,
        title: ensureString(step.title, "step.title"),
        description: ensureString(step.description, "step.description"),
        notes: step.notes ? String(step.notes) : undefined,
        required: ensureBoolean(step.required, true)
      })),
      tags: ensureArray<string>(body.tags, "sop.tags"),
      version: 1
    };
    state.sops.push(sop);
    this.indexEntity("sop", sop.id, sop.name, sop.content, sop.spaceId, { department: sop.department });
    this.createChunks("sop", sop.id, sop.content, { department: sop.department });
    this.store.save();
    this.store.audit(actor, "sop.create", "sop", sop.id, undefined, sop);
    return clone(sop);
  }

  getSOP(id: string, actor: RequestActor): SOP {
    const sop = this.store.getState().sops.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!sop) notFound("SOP not found");
    return clone(sop);
  }

  listPlaybooks(actor: RequestActor, query?: URLSearchParams): Playbook[] {
    const spaceId = pickQuery(query, "spaceId");
    const playbookType = pickQuery(query, "type");
    const search = pickQuery(query, "search")?.toLowerCase();
    return clone(this.store.getState().playbooks.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (spaceId && item.spaceId !== spaceId) return false;
      if (playbookType && item.playbookType !== playbookType) return false;
      if (search && !`${item.name} ${item.description ?? ""}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  createPlaybook(input: unknown, actor: RequestActor): Playbook {
    const body = ensureObject(input, "playbook");
    const state = this.store.getState();
    const key = ensureString(body.key, "playbook.key");
    if (state.playbooks.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Playbook key '${key}' already exists`);
    }
    if (body.spaceId) this.requireSpace(String(body.spaceId), actor.tenantId);
    const playbook: Playbook = {
      id: newId("playbook"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      spaceId: body.spaceId ? String(body.spaceId) : "",
      key,
      name: ensureString(body.name, "playbook.name"),
      description: body.description ? String(body.description) : undefined,
      content: ensureString(body.content, "playbook.content"),
      playbookType: String(body.playbookType ?? "general") as Playbook["playbookType"],
      status: String(body.status ?? "active") as Playbook["status"],
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      sections: ensureArray(body.sections, "playbook.sections").map((section: any, idx: number) => ({
        order: section.order ?? idx + 1,
        title: ensureString(section.title, "section.title"),
        content: ensureString(section.content, "section.content"),
        checklist: section.checklist ? ensureArray<string>(section.checklist, "section.checklist") : undefined
      })),
      tags: ensureArray<string>(body.tags, "playbook.tags"),
      version: 1
    };
    state.playbooks.push(playbook);
    this.indexEntity("playbook", playbook.id, playbook.name, playbook.content, playbook.spaceId, { type: playbook.playbookType });
    this.createChunks("playbook", playbook.id, playbook.content, { type: playbook.playbookType });
    this.store.save();
    this.store.audit(actor, "playbook.create", "playbook", playbook.id, undefined, playbook);
    return clone(playbook);
  }

  listFAQs(actor: RequestActor, query?: URLSearchParams): FAQ[] {
    const spaceId = pickQuery(query, "spaceId");
    const category = pickQuery(query, "category");
    return clone(this.store.getState().faqs.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (spaceId && item.spaceId !== spaceId) return false;
      if (category && item.category !== category) return false;
      return true;
    }));
  }

  createFAQ(input: unknown, actor: RequestActor): FAQ {
    const body = ensureObject(input, "faq");
    const state = this.store.getState();
    if (body.spaceId) this.requireSpace(String(body.spaceId), actor.tenantId);
    const faq: FAQ = {
      id: newId("faq"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      spaceId: body.spaceId ? String(body.spaceId) : "",
      question: ensureString(body.question, "faq.question"),
      answer: ensureString(body.answer, "faq.answer"),
      category: body.category ? String(body.category) : undefined,
      tags: ensureArray<string>(body.tags, "faq.tags"),
      status: String(body.status ?? "active") as FAQ["status"],
      authorId: body.authorId ? String(body.authorId) : undefined,
      helpfulCount: 0,
      viewCount: 0,
      relatedArticleIds: ensureArray<string>(body.relatedArticleIds, "faq.relatedArticleIds")
    };
    state.faqs.push(faq);
    const content = `${faq.question} ${faq.answer}`;
    this.indexEntity("faq", faq.id, faq.question, content, faq.spaceId, { category: faq.category });
    this.createChunks("faq", faq.id, content, { category: faq.category });
    this.store.save();
    this.store.audit(actor, "faq.create", "faq", faq.id, undefined, faq);
    return clone(faq);
  }

  listDecisions(actor: RequestActor, query?: URLSearchParams): DecisionRecord[] {
    const spaceId = pickQuery(query, "spaceId");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().decisions.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (spaceId && item.spaceId !== spaceId) return false;
      if (status && item.status !== status) return false;
      return true;
    }));
  }

  createDecision(input: unknown, actor: RequestActor): DecisionRecord {
    const body = ensureObject(input, "decision");
    const state = this.store.getState();
    const key = ensureString(body.key, "decision.key");
    if (state.decisions.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Decision key '${key}' already exists`);
    }
    if (body.spaceId) this.requireSpace(String(body.spaceId), actor.tenantId);
    const decision: DecisionRecord = {
      id: newId("decision"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      spaceId: body.spaceId ? String(body.spaceId) : "",
      key,
      title: ensureString(body.title, "decision.title"),
      decision: ensureString(body.decision, "decision.decision"),
      context: ensureString(body.context, "decision.context"),
      optionsConsidered: ensureArray<string>(body.optionsConsidered, "decision.optionsConsidered"),
      reason: ensureString(body.reason, "decision.reason"),
      tradeoffs: body.tradeoffs ? String(body.tradeoffs) : undefined,
      risks: body.risks ? String(body.risks) : undefined,
      ownerId: body.ownerId ? String(body.ownerId) : undefined,
      status: String(body.status ?? "proposed") as DecisionRecord["status"],
      impact: body.impact ? String(body.impact) : undefined,
      reviewDate: body.reviewDate ? String(body.reviewDate) : undefined,
      relatedDecisionIds: ensureArray<string>(body.relatedDecisionIds, "decision.relatedDecisionIds")
    };
    state.decisions.push(decision);
    const content = `${decision.title} ${decision.decision} ${decision.context} ${decision.reason}`;
    this.indexEntity("decision", decision.id, decision.title, content, decision.spaceId, { status: decision.status });
    this.createChunks("decision", decision.id, content, { status: decision.status });
    this.store.save();
    this.store.audit(actor, "decision.create", "decision", decision.id, undefined, decision);
    return clone(decision);
  }

  listNodes(actor: RequestActor): KnowledgeNode[] {
    return clone(this.store.getState().nodes.filter((item) => item.tenantId === actor.tenantId));
  }

  createNode(input: unknown, actor: RequestActor): KnowledgeNode {
    const body = ensureObject(input, "node");
    const state = this.store.getState();
    const key = ensureString(body.key, "node.key");
    if (state.nodes.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Node key '${key}' already exists`);
    }
    const node: KnowledgeNode = {
      id: newId("node"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      spaceId: body.spaceId ? String(body.spaceId) : undefined,
      key,
      name: ensureString(body.name, "node.name"),
      nodeType: String(body.nodeType ?? "concept") as KnowledgeNode["nodeType"],
      description: body.description ? String(body.description) : undefined,
      metadata: optionalObject(body.metadata),
      tags: ensureArray<string>(body.tags, "node.tags")
    };
    state.nodes.push(node);
    this.store.save();
    this.store.audit(actor, "node.create", "node", node.id, undefined, node);
    return clone(node);
  }

  createGraphEdge(input: unknown, actor: RequestActor): KnowledgeGraphEdge {
    const body = ensureObject(input, "edge");
    const state = this.store.getState();
    const edge: KnowledgeGraphEdge = {
      id: newId("edge"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      sourceNodeId: ensureString(body.sourceNodeId, "edge.sourceNodeId"),
      targetNodeId: ensureString(body.targetNodeId, "edge.targetNodeId"),
      relationship: ensureString(body.relationship, "edge.relationship"),
      weight: body.weight ? ensureNumber(body.weight, "edge.weight") : undefined,
      metadata: optionalObject(body.metadata)
    };
    state.graphEdges.push(edge);
    this.store.save();
    this.store.audit(actor, "edge.create", "edge", edge.id, undefined, edge);
    return clone(edge);
  }

  search(input: unknown, actor: RequestActor): KnowledgeSearchHit[] {
    const body = ensureObject(input, "search");
    const query = ensureString(body.query, "search.query");
    const entityTypes = ensureArray<string>(body.entityTypes, "search.entityTypes", ["article", "sop", "playbook", "faq", "decision"]);
    const limit = ensureNumber(body.limit, "search.limit", 10);

    const state = this.store.getState();
    const queryTokens = tokenize(query);
    const hits: KnowledgeSearchHit[] = [];

    for (const index of state.searchIndex) {
      if (index.tenantId !== actor.tenantId) continue;
      if (!entityTypes.includes(index.entityType)) continue;

      let score = 0;
      const titleLower = index.title.toLowerCase();
      const contentLower = index.content.toLowerCase();
      const queryLower = query.toLowerCase();

      if (titleLower.includes(queryLower)) score += 10;
      if (contentLower.includes(queryLower)) score += 5;

      for (const token of queryTokens) {
        if (titleLower.includes(token)) score += 3;
        if (contentLower.includes(token)) score += 1;
        if (index.keywords.some((kw) => kw.includes(token))) score += 2;
      }

      if (score > 0) {
        const snippetStart = Math.max(0, contentLower.indexOf(queryLower) - 50);
        const snippetEnd = Math.min(index.content.length, snippetStart + 200);
        const snippet = (snippetStart > 0 ? "..." : "") + index.content.slice(snippetStart, snippetEnd) + (snippetEnd < index.content.length ? "..." : "");

        hits.push({
          chunkId: undefined,
          entityType: index.entityType,
          entityId: index.entityId,
          title: index.title,
          snippet,
          score,
          keywords: index.keywords,
          citation: `[${index.entityType}:${index.title}]`
        });
      }
    }

    return clone(hits.sort((a, b) => b.score - a.score).slice(0, limit));
  }

  addFeedback(input: unknown, actor: RequestActor): KnowledgeFeedback {
    const body = ensureObject(input, "feedback");
    const state = this.store.getState();
    const feedback: KnowledgeFeedback = {
      id: newId("feedback"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      entityType: ensureString(body.entityType, "feedback.entityType") as KnowledgeFeedback["entityType"],
      entityId: ensureString(body.entityId, "feedback.entityId"),
      userId: actor.userId,
      helpful: ensureBoolean(body.helpful, true),
      comment: body.comment ? String(body.comment) : undefined
    };
    state.feedback.push(feedback);
    this.store.save();
    this.store.audit(actor, "feedback.create", "feedback", feedback.id, undefined, feedback);
    return clone(feedback);
  }

  createReview(input: unknown, actor: RequestActor): KnowledgeReview {
    const body = ensureObject(input, "review");
    const review: KnowledgeReview = {
      id: newId("review"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      entityType: ensureString(body.entityType, "review.entityType") as KnowledgeReview["entityType"],
      entityId: ensureString(body.entityId, "review.entityId"),
      reviewerId: actor.userId,
      status: "pending",
      notes: body.notes ? String(body.notes) : undefined,
      dueAt: body.dueAt ? String(body.dueAt) : undefined
    };
    this.store.getState().reviews.push(review);
    this.store.save();
    this.store.audit(actor, "review.create", "review", review.id, undefined, review);
    return clone(review);
  }

  listAuditLogs(actor: RequestActor): any[] {
    return clone(this.store.getState().auditLogs.filter((item) => item.tenantId === actor.tenantId));
  }

  private requireSpace(idOrKey: string, tenantId: string): any {
    const item = this.store.getState().spaces.find((space) => space.tenantId === tenantId && (space.id === idOrKey || space.key === idOrKey));
    if (!item) notFound("Space not found");
    return item;
  }

  private indexEntity(entityType: string, entityId: string, title: string, content: string, spaceId: string, metadata: Record<string, unknown>): void {
    const state = this.store.getState();
    state.searchIndex = state.searchIndex.filter((item) => !(item.entityType === entityType && item.entityId === entityId));
    state.searchIndex.push({
      id: newId("idx"),
      tenantId: this.store.getState().spaces.find(() => true)?.tenantId ?? "demo-tenant",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      entityType: entityType as any,
      entityId,
      spaceId: spaceId || undefined,
      title,
      content,
      keywords: tokenize(`${title} ${content}`).slice(0, 50),
      metadata
    });
  }

  private reindexEntity(entityType: string, entityId: string, title: string, content: string, spaceId: string, metadata: Record<string, unknown>): void {
    this.indexEntity(entityType, entityId, title, content, spaceId, metadata);
    const state = this.store.getState();
    state.chunks = state.chunks.filter((chunk) => !(chunk.entityType === entityType && chunk.entityId === entityId));
    this.createChunks(entityType, entityId, content, metadata);
  }

  private createChunks(entityType: string, entityId: string, content: string, metadata: Record<string, unknown>): void {
    const state = this.store.getState();
    const chunks = chunkText(content, 700, 100);
    chunks.forEach((text, chunkIndex) => {
      state.chunks.push({
        id: newId("chunk"),
        tenantId: state.spaces[0]?.tenantId ?? "demo-tenant",
        createdAt: nowIso(),
        updatedAt: nowIso(),
        entityType: entityType as any,
        entityId,
        chunkIndex,
        text,
        tokenEstimate: estimateTokens(text),
        keywords: tokenize(text).slice(0, 30),
        metadata
      });
    });
  }
}
