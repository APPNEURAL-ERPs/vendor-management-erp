import { DataStore } from "./core/datastore";
import {
  Website,
  WebsitePage,
  LandingPage,
  Form,
  FormSubmission,
  CTA,
  Domain,
  Deployment,
  Analytics,
  WebsiteEvent,
  Sitemap,
  WebsiteAudit,
  CROCheck,
  WebsiteState,
  SEOSettings,
  FormField,
  RequestActor,
} from "./core/domain";
import {
  newId,
  nowIso,
  requireString,
  optionalString,
  asNumber,
  asBoolean,
  notFound,
  conflict,
  calculateSEOscore,
  calculateConversionRate,
  slugify,
} from "./core/utils";

export class WebsiteService {
  constructor(private readonly store: DataStore) {}

  private get state(): WebsiteState {
    return this.store.getState();
  }

  createWebsite(actor: RequestActor, data: Partial<Website>): Website {
    requireString(data.name, "name");
    requireString(data.domain, "domain");

    const website: Website = {
      id: newId("website"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name: data.name,
      description: data.description,
      domain: data.domain,
      status: "draft",
      analyticsEnabled: data.analyticsEnabled ?? true,
      settings: data.settings ?? {
        title: data.name,
        description: data.description ?? "",
        language: "en",
        timezone: "UTC",
      },
      metadata: data.metadata ?? {},
      createdBy: actor.userId,
    };

    this.state.websites.push(website);
    this.store.audit(actor, "website.created", "Website", website.id, undefined, website);
    this.store.save();
    return website;
  }

  getWebsite(actor: RequestActor, id: string): Website {
    const website = this.state.websites.find((w) => w.id === id && w.tenantId === actor.tenantId);
    if (!website) notFound(`Website ${id} not found`);
    return website;
  }

  listWebsites(actor: RequestActor): Website[] {
    return this.state.websites.filter((w) => w.tenantId === actor.tenantId);
  }

  updateWebsite(actor: RequestActor, id: string, data: Partial<Website>): Website {
    const website = this.getWebsite(actor, id);
    const before = { ...website };

    Object.assign(website, {
      ...data,
      id: website.id,
      tenantId: website.tenantId,
      createdAt: website.createdAt,
      updatedAt: nowIso(),
    });

    if (data.settings?.title) {
      website.settings.title = data.settings.title;
    }

    this.store.audit(actor, "website.updated", "Website", id, before, website);
    this.store.save();
    return website;
  }

  deleteWebsite(actor: RequestActor, id: string): void {
    const website = this.getWebsite(actor, id);
    const idx = this.state.websites.indexOf(website);
    if (idx > -1) {
      this.state.websites.splice(idx, 1);
      this.state.pages = this.state.pages.filter((p) => p.websiteId !== id);
      this.state.forms = this.state.forms.filter((f) => f.websiteId !== id);
      this.store.audit(actor, "website.deleted", "Website", id, website, undefined);
      this.store.save();
    }
  }

  createPage(actor: RequestActor, websiteId: string, data: Partial<WebsitePage>): WebsitePage {
    requireString(data.title, "title");

    const website = this.getWebsite(actor, websiteId);
    const slug = data.slug ?? slugify(data.title);

    const existing = this.state.pages.find(
      (p) => p.websiteId === websiteId && p.slug === slug && p.tenantId === actor.tenantId
    );
    if (existing) conflict(`Page with slug ${slug} already exists`);

    const page: WebsitePage = {
      id: newId("page"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      websiteId,
      title: data.title,
      slug,
      status: data.status ?? "draft",
      pageType: data.pageType ?? "custom",
      content: data.content,
      sections: data.sections ?? [],
      seo: data.seo ?? this.generateDefaultSEO(data.title, slug),
      publishedAt: undefined,
      authorId: actor.userId,
      lastPublishedAt: undefined,
      version: 1,
      parentId: data.parentId,
      order: data.order ?? 0,
      template: data.template,
      metadata: data.metadata ?? {},
    };

    this.state.pages.push(page);
    this.store.audit(actor, "page.created", "WebsitePage", page.id, undefined, page);
    this.store.save();
    return page;
  }

  private generateDefaultSEO(title: string, slug: string): SEOSettings {
    return {
      metaTitle: title,
      metaDescription: `${title} - Professional services by APPNEURAL`,
      keywords: [],
      ogTitle: title,
      ogDescription: `${title} - Professional services by APPNEURAL`,
      noIndex: false,
      noFollow: false,
      schemaMarkup: [],
      breadcrumbs: [],
      internalLinks: [],
      externalLinks: [],
    };
  }

  getPage(actor: RequestActor, id: string): WebsitePage {
    const page = this.state.pages.find((p) => p.id === id && p.tenantId === actor.tenantId);
    if (!page) notFound(`Page ${id} not found`);
    return page;
  }

  listPages(actor: RequestActor, websiteId?: string): WebsitePage[] {
    let pages = this.state.pages.filter((p) => p.tenantId === actor.tenantId);
    if (websiteId) {
      pages = pages.filter((p) => p.websiteId === websiteId);
    }
    return pages.sort((a, b) => a.order - b.order);
  }

  updatePage(actor: RequestActor, id: string, data: Partial<WebsitePage>): WebsitePage {
    const page = this.getPage(actor, id);
    const before = { ...page };

    if (data.seo) {
      data.seo = { ...page.seo, ...data.seo };
    }

    Object.assign(page, {
      ...data,
      id: page.id,
      tenantId: page.tenantId,
      createdAt: page.createdAt,
      updatedAt: nowIso(),
    });

    this.store.audit(actor, "page.updated", "WebsitePage", id, before, page);
    this.store.save();
    return page;
  }

  publishPage(actor: RequestActor, id: string): WebsitePage {
    const page = this.getPage(actor, id);
    const now = nowIso();

    page.status = "published";
    page.publishedAt = now;
    page.lastPublishedAt = now;
    page.version += 1;
    page.updatedAt = now;

    const website = this.state.websites.find((w) => w.id === page.websiteId);
    if (website && website.status === "draft") {
      website.status = "active";
      website.publishedAt = now;
    }

    this.store.audit(actor, "page.published", "WebsitePage", id, undefined, page);
    this.store.save();
    return page;
  }

  deletePage(actor: RequestActor, id: string): void {
    const page = this.getPage(actor, id);
    const idx = this.state.pages.indexOf(page);
    if (idx > -1) {
      this.state.pages.splice(idx, 1);
      this.store.audit(actor, "page.deleted", "WebsitePage", id, page, undefined);
      this.store.save();
    }
  }

  createLandingPage(actor: RequestActor, websiteId: string, data: Partial<LandingPage>): LandingPage {
    requireString(data.name, "name");
    requireString(data.headline, "headline");
    requireString(data.offer, "offer");

    const website = this.getWebsite(actor, websiteId);
    const slug = data.slug ?? slugify(data.name);

    const landing: LandingPage = {
      id: newId("landing"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      websiteId,
      name: data.name,
      slug,
      offer: data.offer,
      headline: data.headline,
      subheadline: data.subheadline,
      status: data.status ?? "draft",
      formId: data.formId,
      ctaId: data.ctaId,
      content: data.content ?? "",
      seo: data.seo ?? this.generateDefaultSEO(data.headline, slug),
      publishedAt: undefined,
      conversions: 0,
      views: 0,
      conversionRate: 0,
      metadata: data.metadata ?? {},
    };

    this.state.landingPages.push(landing);
    this.store.audit(actor, "landing.created", "LandingPage", landing.id, undefined, landing);
    this.store.save();
    return landing;
  }

  getLandingPage(actor: RequestActor, id: string): LandingPage {
    const landing = this.state.landingPages.find((l) => l.id === id && l.tenantId === actor.tenantId);
    if (!landing) notFound(`Landing page ${id} not found`);
    return landing;
  }

  listLandingPages(actor: RequestActor, websiteId?: string): LandingPage[] {
    let pages = this.state.landingPages.filter((l) => l.tenantId === actor.tenantId);
    if (websiteId) {
      pages = pages.filter((l) => l.websiteId === websiteId);
    }
    return pages;
  }

  updateLandingPage(actor: RequestActor, id: string, data: Partial<LandingPage>): LandingPage {
    const landing = this.getLandingPage(actor, id);
    const before = { ...landing };

    Object.assign(landing, {
      ...data,
      id: landing.id,
      tenantId: landing.tenantId,
      createdAt: landing.createdAt,
      updatedAt: nowIso(),
    });

    if (landing.views > 0) {
      landing.conversionRate = calculateConversionRate(landing.conversions, landing.views);
    }

    this.store.audit(actor, "landing.updated", "LandingPage", id, before, landing);
    this.store.save();
    return landing;
  }

  createForm(actor: RequestActor, websiteId: string, data: Partial<Form>): Form {
    requireString(data.name, "name");

    const website = this.getWebsite(actor, websiteId);

    const form: Form = {
      id: newId("form"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      websiteId,
      pageId: data.pageId,
      name: data.name,
      type: data.type ?? "contact",
      fields: data.fields ?? this.getDefaultFields(data.type ?? "contact"),
      settings: data.settings ?? this.getDefaultSettings(),
      status: data.status ?? "active",
      submissionsCount: 0,
      lastSubmissionAt: undefined,
      webhookUrl: data.webhookUrl,
      createdBy: actor.userId,
    };

    this.state.forms.push(form);
    this.store.audit(actor, "form.created", "Form", form.id, undefined, form);
    this.store.save();
    return form;
  }

  private getDefaultFields(type: string): FormField[] {
    const baseFields: FormField[] = [
      { id: newId("field"), name: "name", label: "Name", type: "text", required: true, order: 1 },
      { id: newId("field"), name: "email", label: "Email", type: "email", required: true, order: 2 },
    ];

    if (type === "contact") {
      return [
        ...baseFields,
        { id: newId("field"), name: "phone", label: "Phone", type: "phone", required: false, order: 3 },
        { id: newId("field"), name: "message", label: "Message", type: "textarea", required: true, order: 4 },
      ];
    }

    if (type === "lead") {
      return [
        ...baseFields,
        { id: newId("field"), name: "company", label: "Company", type: "text", required: true, order: 3 },
        { id: newId("field"), name: "service", label: "Service Interest", type: "select", required: true, order: 4, options: [
          { value: "product-development", label: "Product Development" },
          { value: "ai-automation", label: "AI Automation" },
          { value: "team-outsourcing", label: "Team Outsourcing" },
          { value: "training", label: "Training" },
        ]},
        { id: newId("field"), name: "message", label: "Message", type: "textarea", required: false, order: 5 },
      ];
    }

    if (type === "newsletter") {
      return [baseFields[1]]; 
    }

    return baseFields;
  }

  private getDefaultSettings() {
    return {
      submitButtonText: "Submit",
      successMessage: "Thank you! We'll be in touch soon.",
      spamProtection: true,
    };
  }

  getForm(actor: RequestActor, id: string): Form {
    const form = this.state.forms.find((f) => f.id === id && f.tenantId === actor.tenantId);
    if (!form) notFound(`Form ${id} not found`);
    return form;
  }

  listForms(actor: RequestActor, websiteId?: string): Form[] {
    let forms = this.state.forms.filter((f) => f.tenantId === actor.tenantId);
    if (websiteId) {
      forms = forms.filter((f) => f.websiteId === websiteId);
    }
    return forms;
  }

  updateForm(actor: RequestActor, id: string, data: Partial<Form>): Form {
    const form = this.getForm(actor, id);
    const before = { ...form };

    Object.assign(form, {
      ...data,
      id: form.id,
      tenantId: form.tenantId,
      createdAt: form.createdAt,
      updatedAt: nowIso(),
    });

    this.store.audit(actor, "form.updated", "Form", id, before, form);
    this.store.save();
    return form;
  }

  submitForm(actor: RequestActor, formId: string, fields: Record<string, unknown>, metadata: Record<string, unknown> = {}): FormSubmission {
    const form = this.getForm(actor, formId);
    const now = nowIso();

    const submission: FormSubmission = {
      id: newId("submission"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      formId,
      websiteId: form.websiteId,
      pageId: form.pageId,
      fields,
      status: "new",
      ipAddress: metadata.ipAddress as string,
      userAgent: metadata.userAgent as string,
      referrer: metadata.referrer as string,
      utmSource: metadata.utmSource as string,
      utmMedium: metadata.utmMedium as string,
      utmCampaign: metadata.utmCampaign as string,
      metadata: {},
    };

    this.state.formSubmissions.push(submission);

    form.submissionsCount += 1;
    form.lastSubmissionAt = now;
    form.updatedAt = now;

    if (form.pageId) {
      const landing = this.state.landingPages.find((l) => l.formId === formId);
      if (landing) {
        landing.conversions += 1;
        landing.conversionRate = calculateConversionRate(landing.conversions, landing.views);
      }
    }

    this.store.audit(actor, "form.submitted", "FormSubmission", submission.id, undefined, submission);
    this.store.save();
    return submission;
  }

  listFormSubmissions(actor: RequestActor, formId?: string): FormSubmission[] {
    let submissions = this.state.formSubmissions.filter((s) => s.tenantId === actor.tenantId);
    if (formId) {
      submissions = submissions.filter((s) => s.formId === formId);
    }
    return submissions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createCTA(actor: RequestActor, websiteId: string, data: Partial<CTA>): CTA {
    requireString(data.text, "text");
    requireString(data.url, "url");

    const cta: CTA = {
      id: newId("cta"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      websiteId,
      pageId: data.pageId,
      text: data.text,
      type: data.type ?? "primary",
      url: data.url,
      position: data.position ?? "content",
      style: data.style,
      status: data.status ?? "active",
      clicks: 0,
      conversions: 0,
      createdBy: actor.userId,
    };

    this.state.ctas.push(cta);
    this.store.audit(actor, "cta.created", "CTA", cta.id, undefined, cta);
    this.store.save();
    return cta;
  }

  listCTAs(actor: RequestActor, websiteId?: string): CTA[] {
    let ctas = this.state.ctas.filter((c) => c.tenantId === actor.tenantId);
    if (websiteId) {
      ctas = ctas.filter((c) => c.websiteId === websiteId);
    }
    return ctas;
  }

  createDomain(actor: RequestActor, websiteId: string, domain: string): Domain {
    requireString(domain, "domain");

    const website = this.getWebsite(actor, websiteId);

    const domainRecord: Domain = {
      id: newId("domain"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      websiteId,
      domain,
      type: "primary",
      sslEnabled: true,
      sslCertificate: {
        issuer: "Let's Encrypt",
        validFrom: nowIso(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        autoRenew: true,
      },
      dnsStatus: {
        verified: false,
      },
      status: "pending",
      createdBy: actor.userId,
    };

    this.state.domains.push(domainRecord);
    this.store.audit(actor, "domain.created", "Domain", domainRecord.id, undefined, domainRecord);
    this.store.save();
    return domainRecord;
  }

  listDomains(actor: RequestActor, websiteId?: string): Domain[] {
    let domains = this.state.domains.filter((d) => d.tenantId === actor.tenantId);
    if (websiteId) {
      domains = domains.filter((d) => d.websiteId === websiteId);
    }
    return domains;
  }

  createDeployment(actor: RequestActor, websiteId: string, environment: "development" | "staging" | "production"): Deployment {
    const website = this.getWebsite(actor, websiteId);

    const deployment: Deployment = {
      id: newId("deploy"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      websiteId,
      version: `v${Date.now().toString(36)}`,
      environment,
      status: "pending",
      deployedBy: actor.userId,
      deployedAt: nowIso(),
    };

    this.state.deployments.push(deployment);
    this.store.audit(actor, "deployment.created", "Deployment", deployment.id, undefined, deployment);
    this.store.save();
    return deployment;
  }

  listDeployments(actor: RequestActor, websiteId?: string): Deployment[] {
    let deployments = this.state.deployments.filter((d) => d.tenantId === actor.tenantId);
    if (websiteId) {
      deployments = deployments.filter((d) => d.websiteId === websiteId);
    }
    return deployments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createAnalytics(actor: RequestActor, websiteId: string, data: Partial<Analytics>): Analytics {
    const website = this.getWebsite(actor, websiteId);

    const analytics: Analytics = {
      id: newId("analytics"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      websiteId,
      pageId: data.pageId,
      date: data.date ?? new Date().toISOString().split("T")[0],
      visitors: data.visitors ?? 0,
      pageViews: data.pageViews ?? 0,
      uniquePageViews: data.uniquePageViews ?? 0,
      bounceRate: data.bounceRate ?? 0,
      avgSessionDuration: data.avgSessionDuration ?? 0,
      topPages: data.topPages ?? [],
      trafficSources: data.trafficSources ?? [],
      conversions: data.conversions ?? 0,
      formSubmissions: data.formSubmissions ?? 0,
      ctaClicks: data.ctaClicks ?? 0,
    };

    this.state.analytics.push(analytics);
    this.store.save();
    return analytics;
  }

  getAnalytics(actor: RequestActor, websiteId: string): Record<string, unknown> {
    const website = this.getWebsite(actor, websiteId);
    const analytics = this.state.analytics.filter((a) => a.websiteId === websiteId);

    const totalVisitors = analytics.reduce((sum, a) => sum + a.visitors, 0);
    const totalPageViews = analytics.reduce((sum, a) => sum + a.pageViews, 0);
    const totalConversions = analytics.reduce((sum, a) => sum + a.conversions, 0);
    const totalFormSubmissions = analytics.reduce((sum, a) => sum + a.formSubmissions, 0);

    return {
      websiteId,
      websiteName: website.name,
      totalVisitors,
      totalPageViews,
      totalConversions,
      totalFormSubmissions,
      conversionRate: totalVisitors > 0 ? calculateConversionRate(totalConversions, totalVisitors) : 0,
      avgBounceRate: analytics.length > 0 ? analytics.reduce((sum, a) => sum + a.bounceRate, 0) / analytics.length : 0,
      recentAnalytics: analytics.slice(-30),
    };
  }

  trackEvent(actor: RequestActor, websiteId: string, event: string, category: string, data: Record<string, unknown> = {}): WebsiteEvent {
    const website = this.getWebsite(actor, websiteId);

    const websiteEvent: WebsiteEvent = {
      id: newId("event"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      websiteId,
      event,
      category: category as any,
      data,
    };

    this.state.events.push(websiteEvent);
    this.store.save();
    return websiteEvent;
  }

  createSitemap(actor: RequestActor, websiteId: string): Sitemap {
    const website = this.getWebsite(actor, websiteId);
    const pages = this.state.pages.filter((p) => p.websiteId === websiteId && p.status === "published");

    const sitemap: Sitemap = {
      id: newId("sitemap"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      websiteId,
      pages: pages.map((p) => ({
        pageId: p.id,
        slug: p.slug,
        priority: p.pageType === "home" ? 1.0 : p.pageType === "about" || p.pageType === "contact" ? 0.8 : 0.6,
        changeFrequency: "weekly" as const,
        lastModified: p.lastPublishedAt,
      })),
      lastGeneratedAt: nowIso(),
      status: "published",
      version: 1,
    };

    this.state.sitemaps.push(sitemap);
    this.store.audit(actor, "sitemap.created", "Sitemap", sitemap.id, undefined, sitemap);
    this.store.save();
    return sitemap;
  }

  runSEOAudit(actor: RequestActor, websiteId: string): WebsiteAudit {
    const website = this.getWebsite(actor, websiteId);
    const pages = this.state.pages.filter((p) => p.websiteId === websiteId);
    const now = nowIso();

    let totalScore = 0;
    const issues: any[] = [];
    const recommendations: string[] = [];

    for (const page of pages) {
      const score = calculateSEOscore(page.seo);
      totalScore += score;

      if (score < 60) {
        issues.push({
          id: newId("issue"),
          severity: score < 40 ? "high" : "medium",
          category: "SEO",
          title: `Page "${page.title}" needs SEO improvement`,
          description: `SEO score is ${score}/100`,
          affectedPages: [page.id],
          recommendation: "Add meta title, meta description, and keywords",
          effort: "low",
        });
      }

      if (!page.seo.metaTitle) {
        recommendations.push(`Add meta title to "${page.title}"`);
      }
      if (!page.seo.metaDescription) {
        recommendations.push(`Add meta description to "${page.title}"`);
      }
    }

    const avgScore = pages.length > 0 ? Math.round(totalScore / pages.length) : 0;

    const audit: WebsiteAudit = {
      id: newId("audit"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      websiteId,
      type: "seo",
      score: avgScore,
      issues,
      recommendations: [...new Set(recommendations)],
      status: "completed",
      startedAt: now,
      completedAt: now,
    };

    this.state.audits.push(audit);
    website.seoScore = avgScore;
    this.store.audit(actor, "seo.audit.completed", "WebsiteAudit", audit.id, undefined, audit);
    this.store.save();
    return audit;
  }

  runCROCheck(actor: RequestActor, websiteId: string, pageId?: string): CROCheck {
    const website = this.getWebsite(actor, websiteId);
    const pages = pageId
      ? [this.getPage(actor, pageId)]
      : this.state.pages.filter((p) => p.websiteId === websiteId);
    const now = nowIso();

    let score = 0;
    const findings: string[] = [];
    const recommendations: string[] = [];

    for (const page of pages) {
      if (page.status !== "published") {
        findings.push(`Page "${page.title}" is not published`);
      } else {
        score += 20;
      }

      if (page.sections.some((s) => s.type === "cta")) {
        score += 20;
      } else {
        recommendations.push(`Add CTA section to "${page.title}"`);
      }

      if (page.sections.some((s) => s.type === "trust" || s.type === "testimonials")) {
        score += 15;
      } else {
        recommendations.push(`Add trust signals or testimonials to "${page.title}"`);
      }

      if (page.sections.some((s) => s.type === "features" || s.type === "benefits")) {
        score += 15;
      } else {
        recommendations.push(`Add features or benefits section to "${page.title}"`);
      }

      if (page.seo.metaTitle && page.seo.metaDescription) {
        score += 30;
      } else {
        recommendations.push(`Complete SEO for "${page.title}"`);
      }
    }

    const finalScore = pages.length > 0 ? Math.min(100, Math.round(score / pages.length)) : 0;

    const check: CROCheck = {
      id: newId("cro"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      websiteId,
      pageId: pageId,
      type: "full",
      score: finalScore,
      findings: [...new Set(findings)],
      recommendations: [...new Set(recommendations)],
      status: "completed",
    };

    this.state.croChecks.push(check);
    this.store.audit(actor, "cro.check.completed", "CROCheck", check.id, undefined, check);
    this.store.save();
    return check;
  }

  getDashboard(actor: RequestActor, websiteId?: string): Record<string, unknown> {
    let websites = this.state.websites.filter((w) => w.tenantId === actor.tenantId);
    if (websiteId) {
      websites = websites.filter((w) => w.id === websiteId);
    }

    const pages = this.state.pages.filter((p) => p.tenantId === actor.tenantId && (!websiteId || p.websiteId === websiteId));
    const forms = this.state.forms.filter((f) => f.tenantId === actor.tenantId && (!websiteId || f.websiteId === websiteId));
    const submissions = this.state.formSubmissions.filter((s) => s.tenantId === actor.tenantId && (!websiteId || s.websiteId === websiteId));

    const publishedPages = pages.filter((p) => p.status === "published");
    const draftPages = pages.filter((p) => p.status === "draft");

    return {
      totalWebsites: websites.length,
      totalPages: pages.length,
      publishedPages: publishedPages.length,
      draftPages: draftPages.length,
      totalForms: forms.length,
      totalSubmissions: submissions.length,
      avgSEOScore: websites.length > 0
        ? Math.round(websites.reduce((sum, w) => sum + (w.seoScore ?? 0), 0) / websites.length)
        : 0,
      websites: websites.map((w) => ({
        id: w.id,
        name: w.name,
        status: w.status,
        seoScore: w.seoScore,
        pageCount: pages.filter((p) => p.websiteId === w.id).length,
      })),
    };
  }
}
