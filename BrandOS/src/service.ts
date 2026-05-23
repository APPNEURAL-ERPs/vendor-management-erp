import { DataStore } from "./core/datastore";
import {
  Brand,
  BrandOverview,
  ColorPalette,
  Typography,
  BrandVoice,
  BrandElement,
  Asset,
  Guideline,
  BrandKit,
  BrandCampaign,
  BrandMessage,
  BrandAudit,
  BrandConsistencyCheck,
  BrandTemplate,
  BrandPersona,
  RequestActor,
  BrandColor,
  FontFamily,
  BrandVocabulary,
  WritingRule,
  AudienceTone,
  BrandElementVariant,
  GuidelineSection,
  CampaignMessage,
  BrandAuditResult,
  ConsistencyCheckResult,
  PersonaDemographics,
  PersonaPsychographics
} from "./core/domain";
import { conflict, notFound } from "./core/errors";
import { newId, nowIso } from "./core/id";
import { clone, ensureArray, ensureObject, ensureString, pickQuery } from "./core/utils";

export class BrandService {
  constructor(private readonly store: DataStore) {}

  overview(actor: RequestActor): BrandOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    return {
      brands: {
        total: state.brands.filter((item) => item.tenantId === tenant).length,
        active: state.brands.filter((item) => item.tenantId === tenant && item.status === "active").length
      },
      guidelines: {
        total: state.guidelines.filter((item) => item.tenantId === tenant).length,
        active: state.guidelines.filter((item) => item.tenantId === tenant && item.status === "active").length
      },
      assets: {
        total: state.assets.filter((item) => item.tenantId === tenant).length,
        approved: state.assets.filter((item) => item.tenantId === tenant && item.approvalStatus === "approved").length
      },
      kits: {
        total: state.brandKits.filter((item) => item.tenantId === tenant).length,
        active: state.brandKits.filter((item) => item.tenantId === tenant && item.status === "active").length
      },
      campaigns: {
        total: state.campaigns.filter((item) => item.tenantId === tenant).length,
        active: state.campaigns.filter((item) => item.tenantId === tenant && item.status === "active").length
      },
      audits: {
        total: state.audits.filter((item) => item.tenantId === tenant).length,
        completed: state.audits.filter((item) => item.tenantId === tenant && item.status === "completed").length
      },
      templates: {
        total: state.templates.filter((item) => item.tenantId === tenant).length,
        active: state.templates.filter((item) => item.tenantId === tenant && item.status === "active").length
      }
    };
  }

  listBrands(actor: RequestActor, query?: URLSearchParams): Brand[] {
    const search = pickQuery(query, "search");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().brands.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (status && item.status !== status) return false;
      if (search) {
        const lower = search.toLowerCase();
        if (!item.key?.toLowerCase().includes(lower) &&
            !item.name?.toLowerCase().includes(lower) &&
            !item.description?.toLowerCase().includes(lower)) {
          return false;
        }
      }
      return true;
    }));
  }

  getBrand(id: string, actor: RequestActor): Brand {
    const brand = this.store.getState().brands.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!brand) notFound("Brand not found");
    return clone(brand);
  }

  createBrand(input: unknown, actor: RequestActor): Brand {
    const body = ensureObject(input, "brand");
    const state = this.store.getState();
    const key = ensureString(body.key, "brand.key");
    if (state.brands.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Brand key '${key}' already exists`);
    }
    const brand: Brand = {
      id: newId("brand"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "brand.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as Brand["status"],
      purpose: body.purpose ? String(body.purpose) : undefined,
      mission: body.mission ? String(body.mission) : undefined,
      vision: body.vision ? String(body.vision) : undefined,
      values: ensureArray(body.values, "brand.values", []),
      positioning: body.positioning ? String(body.positioning) : undefined,
      differentiation: body.differentiation ? String(body.differentiation) : undefined,
      promise: body.promise ? String(body.promise) : undefined,
      story: body.story ? String(body.story) : undefined,
      archetype: body.archetype ? String(body.archetype) : undefined,
      targetAudience: ensureArray(body.targetAudience, "brand.targetAudience", []),
      industry: body.industry ? String(body.industry) : undefined,
      tags: ensureArray(body.tags, "brand.tags", [])
    };
    state.brands.push(brand);
    this.store.save();
    this.store.audit(actor, "brand.create", "brand", brand.id, undefined, brand);
    return clone(brand);
  }

  updateBrand(id: string, input: unknown, actor: RequestActor): Brand {
    const body = ensureObject(input, "brand");
    const state = this.store.getState();
    const brand = state.brands.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!brand) notFound("Brand not found");
    const before = clone(brand);
    if (body.name) brand.name = String(body.name);
    if (body.description !== undefined) brand.description = body.description ? String(body.description) : undefined;
    if (body.status) brand.status = String(body.status) as Brand["status"];
    if (body.purpose !== undefined) brand.purpose = body.purpose ? String(body.purpose) : undefined;
    if (body.mission !== undefined) brand.mission = body.mission ? String(body.mission) : undefined;
    if (body.vision !== undefined) brand.vision = body.vision ? String(body.vision) : undefined;
    if (body.values !== undefined) brand.values = ensureArray(body.values, "brand.values", []);
    if (body.positioning !== undefined) brand.positioning = body.positioning ? String(body.positioning) : undefined;
    if (body.differentiation !== undefined) brand.differentiation = body.differentiation ? String(body.differentiation) : undefined;
    if (body.promise !== undefined) brand.promise = body.promise ? String(body.promise) : undefined;
    if (body.story !== undefined) brand.story = body.story ? String(body.story) : undefined;
    if (body.archetype !== undefined) brand.archetype = body.archetype ? String(body.archetype) : undefined;
    if (body.targetAudience !== undefined) brand.targetAudience = ensureArray(body.targetAudience, "brand.targetAudience", []);
    if (body.industry !== undefined) brand.industry = body.industry ? String(body.industry) : undefined;
    if (body.tags !== undefined) brand.tags = ensureArray(body.tags, "brand.tags", []);
    brand.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "brand.update", "brand", brand.id, before, brand);
    return clone(brand);
  }

  listColorPalettes(actor: RequestActor, query?: URLSearchParams): ColorPalette[] {
    const brandId = pickQuery(query, "brandId");
    return clone(this.store.getState().colorPalettes.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (brandId && item.brandId !== brandId) return false;
      return true;
    }));
  }

  createColorPalette(input: unknown, actor: RequestActor): ColorPalette {
    const body = ensureObject(input, "colorPalette");
    const state = this.store.getState();
    this.requireBrand(String(body.brandId), actor.tenantId);
    const key = ensureString(body.key, "colorPalette.key");
    if (state.colorPalettes.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Color palette key '${key}' already exists`);
    }
    const palette: ColorPalette = {
      id: newId("palette"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      brandId: String(body.brandId),
      key,
      name: ensureString(body.name, "colorPalette.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as ColorPalette["status"],
      colors: ensureArray<BrandColor>(body.colors, "colorPalette.colors", []),
      usage: body.usage ? String(body.usage) : undefined
    };
    state.colorPalettes.push(palette);
    this.store.save();
    this.store.audit(actor, "palette.create", "colorPalette", palette.id, undefined, palette);
    return clone(palette);
  }

  listTypographies(actor: RequestActor, query?: URLSearchParams): Typography[] {
    const brandId = pickQuery(query, "brandId");
    return clone(this.store.getState().typographies.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (brandId && item.brandId !== brandId) return false;
      return true;
    }));
  }

  createTypography(input: unknown, actor: RequestActor): Typography {
    const body = ensureObject(input, "typography");
    const state = this.store.getState();
    this.requireBrand(String(body.brandId), actor.tenantId);
    const key = ensureString(body.key, "typography.key");
    if (state.typographies.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Typography key '${key}' already exists`);
    }
    const typography: Typography = {
      id: newId("typography"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      brandId: String(body.brandId),
      key,
      name: ensureString(body.name, "typography.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as Typography["status"],
      fontFamilies: ensureArray<FontFamily>(body.fontFamilies, "typography.fontFamilies", []),
      headingStyle: body.headingStyle as Typography["headingStyle"],
      bodyStyle: body.bodyStyle as Typography["bodyStyle"],
      usage: body.usage ? String(body.usage) : undefined
    };
    state.typographies.push(typography);
    this.store.save();
    this.store.audit(actor, "typography.create", "typography", typography.id, undefined, typography);
    return clone(typography);
  }

  listBrandVoices(actor: RequestActor, query?: URLSearchParams): BrandVoice[] {
    const brandId = pickQuery(query, "brandId");
    return clone(this.store.getState().brandVoices.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (brandId && item.brandId !== brandId) return false;
      return true;
    }));
  }

  createBrandVoice(input: unknown, actor: RequestActor): BrandVoice {
    const body = ensureObject(input, "brandVoice");
    const state = this.store.getState();
    this.requireBrand(String(body.brandId), actor.tenantId);
    const key = ensureString(body.key, "brandVoice.key");
    if (state.brandVoices.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Brand voice key '${key}' already exists`);
    }
    const voice: BrandVoice = {
      id: newId("voice"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      brandId: String(body.brandId),
      key,
      name: ensureString(body.name, "brandVoice.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as BrandVoice["status"],
      tone: ensureArray(body.tone, "brandVoice.tone", []),
      vocabulary: (body.vocabulary && typeof body.vocabulary === "object") 
        ? body.vocabulary as BrandVocabulary
        : { preferredTerms: [], alternativeTerms: {} },
      writingRules: ensureArray<WritingRule>(body.writingRules, "brandVoice.writingRules", []),
      forbiddenTerms: ensureArray(body.forbiddenTerms, "brandVoice.forbiddenTerms", []),
      audienceTone: ensureArray<AudienceTone>(body.audienceTone, "brandVoice.audienceTone", []),
      usage: body.usage ? String(body.usage) : undefined
    };
    state.brandVoices.push(voice);
    this.store.save();
    this.store.audit(actor, "voice.create", "brandVoice", voice.id, undefined, voice);
    return clone(voice);
  }

  listBrandElements(actor: RequestActor, query?: URLSearchParams): BrandElement[] {
    const brandId = pickQuery(query, "brandId");
    const type = pickQuery(query, "type");
    return clone(this.store.getState().brandElements.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (brandId && item.brandId !== brandId) return false;
      if (type && item.type !== type) return false;
      return true;
    }));
  }

  createBrandElement(input: unknown, actor: RequestActor): BrandElement {
    const body = ensureObject(input, "brandElement");
    const state = this.store.getState();
    this.requireBrand(String(body.brandId), actor.tenantId);
    const key = ensureString(body.key, "brandElement.key");
    if (state.brandElements.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Brand element key '${key}' already exists`);
    }
    const element: BrandElement = {
      id: newId("element"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      brandId: String(body.brandId),
      key,
      name: ensureString(body.name, "brandElement.name"),
      type: String(body.type ?? "logo") as BrandElement["type"],
      status: String(body.status ?? "active") as BrandElement["status"],
      variants: ensureArray<BrandElementVariant>(body.variants, "brandElement.variants", []),
      usage: body.usage ? String(body.usage) : undefined,
      rules: body.rules ? ensureArray(body.rules, "brandElement.rules", []) : undefined
    };
    state.brandElements.push(element);
    this.store.save();
    this.store.audit(actor, "element.create", "brandElement", element.id, undefined, element);
    return clone(element);
  }

  listAssets(actor: RequestActor, query?: URLSearchParams): Asset[] {
    const brandId = pickQuery(query, "brandId");
    const type = pickQuery(query, "type");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().assets.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (brandId && item.brandId !== brandId) return false;
      if (type && item.type !== type) return false;
      if (status && item.status !== status) return false;
      return true;
    }));
  }

  createAsset(input: unknown, actor: RequestActor): Asset {
    const body = ensureObject(input, "asset");
    const state = this.store.getState();
    this.requireBrand(String(body.brandId), actor.tenantId);
    const key = ensureString(body.key, "asset.key");
    if (state.assets.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Asset key '${key}' already exists`);
    }
    const asset: Asset = {
      id: newId("asset"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      brandId: String(body.brandId),
      key,
      name: ensureString(body.name, "asset.name"),
      type: String(body.type ?? "other") as Asset["type"],
      status: String(body.status ?? "active") as Asset["status"],
      url: body.url ? String(body.url) : undefined,
      data: body.data ? String(body.data) : undefined,
      format: String(body.format ?? "unknown"),
      size: body.size ? Number(body.size) : undefined,
      tags: ensureArray(body.tags, "asset.tags", []),
      category: body.category ? String(body.category) : undefined,
      metadata: (body.metadata && typeof body.metadata === "object") ? body.metadata as Record<string, unknown> : {},
      approvalStatus: body.approvalStatus ? String(body.approvalStatus) as Asset["approvalStatus"] : "pending"
    };
    state.assets.push(asset);
    this.store.save();
    this.store.audit(actor, "asset.create", "asset", asset.id, undefined, asset);
    return clone(asset);
  }

  approveAsset(id: string, actor: RequestActor): Asset {
    const state = this.store.getState();
    const asset = state.assets.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!asset) notFound("Asset not found");
    asset.approvalStatus = "approved";
    asset.approvedBy = actor.userId;
    asset.approvedAt = nowIso();
    asset.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "asset.approve", "asset", asset.id);
    return clone(asset);
  }

  listGuidelines(actor: RequestActor, query?: URLSearchParams): Guideline[] {
    const brandId = pickQuery(query, "brandId");
    const type = pickQuery(query, "type");
    return clone(this.store.getState().guidelines.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (brandId && item.brandId !== brandId) return false;
      if (type && item.type !== type) return false;
      return true;
    }));
  }

  createGuideline(input: unknown, actor: RequestActor): Guideline {
    const body = ensureObject(input, "guideline");
    const state = this.store.getState();
    this.requireBrand(String(body.brandId), actor.tenantId);
    const key = ensureString(body.key, "guideline.key");
    if (state.guidelines.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Guideline key '${key}' already exists`);
    }
    const guideline: Guideline = {
      id: newId("guideline"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      brandId: String(body.brandId),
      key,
      name: ensureString(body.name, "guideline.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as Guideline["status"],
      type: String(body.type ?? "full") as Guideline["type"],
      sections: ensureArray<GuidelineSection>(body.sections, "guideline.sections", []),
      version: Number(body.version ?? 1),
      createdBy: actor.userId,
      approvedBy: body.approvedBy ? String(body.approvedBy) : undefined,
      approvedAt: body.approvedAt ? String(body.approvedAt) : undefined
    };
    state.guidelines.push(guideline);
    this.store.save();
    this.store.audit(actor, "guideline.create", "guideline", guideline.id, undefined, guideline);
    return clone(guideline);
  }

  generateGuideline(brandId: string, input: unknown, actor: RequestActor): Guideline {
    const body = ensureObject(input, "generateGuideline");
    const state = this.store.getState();
    const brand = this.requireBrand(brandId, actor.tenantId);
    const type = String(body.type ?? "full") as Guideline["type"];
    const name = ensureString(body.name, "guideline.name");
    const key = `guideline_${type}_${Date.now().toString(36)}`;
    const sections = this.generateGuidelineSections(brand, type);
    const guideline: Guideline = {
      id: newId("guideline"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      brandId: brand.id,
      key,
      name,
      description: `Auto-generated ${type} guidelines for ${brand.name}`,
      status: "active",
      type,
      sections,
      version: 1,
      createdBy: actor.userId
    };
    state.guidelines.push(guideline);
    this.store.save();
    this.store.audit(actor, "guideline.generate", "guideline", guideline.id, undefined, guideline);
    return clone(guideline);
  }

  private generateGuidelineSections(brand: Brand, type: string): GuidelineSection[] {
    const sections: GuidelineSection[] = [
      {
        title: "Brand Overview",
        content: brand.description || brand.purpose || `${brand.name} brand guidelines`
      }
    ];

    if (type === "full" || type === "logo") {
      sections.push({
        title: "Logo Usage",
        content: `Official logo usage guidelines for ${brand.name}`,
        rules: ["Always use approved logo files", "Maintain clear space on all sides", "Use correct colors from brand palette"],
        dos: ["Use logo on approved backgrounds", "Use minimum size requirements"],
        donts: ["Do not stretch or distort the logo", "Do not add shadows or effects", "Do not change colors"]
      });
    }

    if (type === "full" || type === "color") {
      sections.push({
        title: "Color Palette",
        content: `Official colors for ${brand.name}`,
        rules: ["Use primary color as dominant", "Follow contrast guidelines", "Apply colors consistently"]
      });
    }

    if (type === "full" || type === "typography") {
      sections.push({
        title: "Typography",
        content: `Typography guidelines for ${brand.name}`,
        rules: ["Use approved font families", "Follow sizing hierarchy", "Maintain proper line height"]
      });
    }

    if (type === "full" || type === "voice") {
      sections.push({
        title: "Voice & Tone",
        content: `How ${brand.name} speaks`,
        rules: ["Be clear and concise", "Use active voice", "Avoid jargon"],
        dos: ["Be practical", "Show transformation"],
        donts: ["Avoid buzzwords", "Do not be vague"]
      });
    }

    if (type === "full" || type === "social") {
      sections.push({
        title: "Social Media",
        content: `Social media guidelines for ${brand.name}`,
        rules: ["Use brand colors", "Follow voice guidelines", "Use approved logo placement"]
      });
    }

    return sections;
  }

  listBrandKits(actor: RequestActor, query?: URLSearchParams): BrandKit[] {
    const brandId = pickQuery(query, "brandId");
    return clone(this.store.getState().brandKits.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (brandId && item.brandId !== brandId) return false;
      return true;
    }));
  }

  createBrandKit(input: unknown, actor: RequestActor): BrandKit {
    const body = ensureObject(input, "brandKit");
    const state = this.store.getState();
    this.requireBrand(String(body.brandId), actor.tenantId);
    const key = ensureString(body.key, "brandKit.key");
    if (state.brandKits.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Brand kit key '${key}' already exists`);
    }
    const kit: BrandKit = {
      id: newId("kit"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      brandId: String(body.brandId),
      key,
      name: ensureString(body.name, "brandKit.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as BrandKit["status"],
      colorPaletteId: body.colorPaletteId ? String(body.colorPaletteId) : undefined,
      typographyId: body.typographyId ? String(body.typographyId) : undefined,
      voiceId: body.voiceId ? String(body.voiceId) : undefined,
      assets: ensureArray(body.assets, "brandKit.assets", []),
      generatedAt: nowIso(),
      generatedBy: actor.userId
    };
    state.brandKits.push(kit);
    this.store.save();
    this.store.audit(actor, "kit.create", "brandKit", kit.id, undefined, kit);
    return clone(kit);
  }

  listBrandMessages(actor: RequestActor, query?: URLSearchParams): BrandMessage[] {
    const brandId = pickQuery(query, "brandId");
    const type = pickQuery(query, "type");
    return clone(this.store.getState().brandMessages.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (brandId && item.brandId !== brandId) return false;
      if (type && item.type !== type) return false;
      return true;
    }));
  }

  createBrandMessage(input: unknown, actor: RequestActor): BrandMessage {
    const body = ensureObject(input, "brandMessage");
    const state = this.store.getState();
    this.requireBrand(String(body.brandId), actor.tenantId);
    const key = ensureString(body.key, "brandMessage.key");
    if (state.brandMessages.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Brand message key '${key}' already exists`);
    }
    const message: BrandMessage = {
      id: newId("msg"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      brandId: String(body.brandId),
      key,
      name: ensureString(body.name, "brandMessage.name"),
      type: String(body.type ?? "other") as BrandMessage["type"],
      status: String(body.status ?? "active") as BrandMessage["status"],
      content: ensureString(body.content, "brandMessage.content"),
      context: body.context ? String(body.context) : undefined,
      usage: body.usage ? String(body.usage) : undefined,
      variants: body.variants ? ensureArray(body.variants, "brandMessage.variants", []) : undefined
    };
    state.brandMessages.push(message);
    this.store.save();
    this.store.audit(actor, "message.create", "brandMessage", message.id, undefined, message);
    return clone(message);
  }

  listCampaigns(actor: RequestActor, query?: URLSearchParams): BrandCampaign[] {
    const brandId = pickQuery(query, "brandId");
    return clone(this.store.getState().campaigns.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (brandId && item.brandId !== brandId) return false;
      return true;
    }));
  }

  createCampaign(input: unknown, actor: RequestActor): BrandCampaign {
    const body = ensureObject(input, "campaign");
    const state = this.store.getState();
    this.requireBrand(String(body.brandId), actor.tenantId);
    const key = ensureString(body.key, "campaign.key");
    if (state.campaigns.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Campaign key '${key}' already exists`);
    }
    const campaign: BrandCampaign = {
      id: newId("campaign"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      brandId: String(body.brandId),
      key,
      name: ensureString(body.name, "campaign.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as BrandCampaign["status"],
      type: String(body.type ?? "general"),
      startDate: body.startDate ? String(body.startDate) : undefined,
      endDate: body.endDate ? String(body.endDate) : undefined,
      messaging: ensureArray<CampaignMessage>(body.messaging, "campaign.messaging", []),
      assets: ensureArray(body.assets, "campaign.assets", []),
      channels: ensureArray(body.channels, "campaign.channels", []),
      targetAudience: body.targetAudience ? String(body.targetAudience) : undefined
    };
    state.campaigns.push(campaign);
    this.store.save();
    this.store.audit(actor, "campaign.create", "campaign", campaign.id, undefined, campaign);
    return clone(campaign);
  }

  listAudits(actor: RequestActor, query?: URLSearchParams): BrandAudit[] {
    const brandId = pickQuery(query, "brandId");
    return clone(this.store.getState().audits.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (brandId && item.brandId !== brandId) return false;
      return true;
    }));
  }

  createAudit(input: unknown, actor: RequestActor): BrandAudit {
    const body = ensureObject(input, "audit");
    const state = this.store.getState();
    this.requireBrand(String(body.brandId), actor.tenantId);
    const audit: BrandAudit = {
      id: newId("audit"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      brandId: String(body.brandId),
      name: ensureString(body.name, "audit.name"),
      description: body.description ? String(body.description) : undefined,
      status: "draft",
      type: String(body.type ?? "full") as BrandAudit["type"],
      scope: body.scope ? ensureArray(body.scope, "audit.scope", []) : undefined,
      createdBy: actor.userId
    };
    state.audits.push(audit);
    this.store.save();
    this.store.audit(actor, "audit.create", "audit", audit.id, undefined, audit);
    return clone(audit);
  }

  runAudit(id: string, actor: RequestActor): BrandAudit {
    const state = this.store.getState();
    const audit = state.audits.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!audit) notFound("Audit not found");
    const brand = this.requireBrand(audit.brandId, actor.tenantId);
    audit.status = "completed";
    audit.completedAt = nowIso();
    audit.results = this.generateAuditResults(brand, audit.type);
    this.store.save();
    this.store.audit(actor, "audit.run", "audit", audit.id, undefined, audit.results);
    return clone(audit);
  }

  private generateAuditResults(brand: Brand, type: string): BrandAuditResult {
    return {
      overallScore: 85,
      clarityScore: 90,
      consistencyScore: 85,
      messagingScore: 88,
      visualScore: 82,
      trustScore: 85,
      differentiationScore: 80,
      findings: [
        { category: "Visual", severity: "low", title: "Logo consistency", description: "Ensure logo is used consistently across all platforms", suggestion: "Create a logo usage checklist" },
        { category: "Messaging", severity: "medium", title: "Tagline usage", description: "Not all pages use the official tagline", suggestion: "Update hero sections" }
      ],
      recommendations: [
        "Review all social media profiles for consistency",
        "Update email templates with brand colors",
        "Create a brand voice quick reference guide"
      ],
      priorityFixes: [
        "Fix color usage on landing page",
        "Update CTAs to brand blue"
      ]
    };
  }

  listConsistencyChecks(actor: RequestActor): BrandConsistencyCheck[] {
    return clone(this.store.getState().consistencyChecks.filter((item) => item.tenantId === actor.tenantId));
  }

  runConsistencyCheck(input: unknown, actor: RequestActor): BrandConsistencyCheck {
    const body = ensureObject(input, "consistencyCheck");
    const state = this.store.getState();
    const brand = this.requireBrand(String(body.brandId), actor.tenantId);
    const targetType = String(body.targetType ?? "content");
    const targetContent = body.targetContent ? String(body.targetContent) : undefined;
    const checks = this.performConsistencyChecks(brand, targetType, targetContent);
    const passedChecks = checks.filter((c) => c.passed).length;
    const check: BrandConsistencyCheck = {
      id: newId("check"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      brandId: brand.id,
      targetType: targetType as BrandConsistencyCheck["targetType"],
      targetUrl: body.targetUrl ? String(body.targetUrl) : undefined,
      targetContent,
      checks,
      overallPass: passedChecks === checks.length,
      score: Math.round((passedChecks / checks.length) * 100),
      checkedBy: actor.userId
    };
    state.consistencyChecks.push(check);
    this.store.save();
    this.store.audit(actor, "consistency.check", "consistencyCheck", check.id, undefined, check);
    return clone(check);
  }

  private performConsistencyChecks(brand: Brand, targetType: string, targetContent?: string): ConsistencyCheckResult[] {
    const checks: ConsistencyCheckResult[] = [];

    if (targetContent) {
      const voice = this.store.getState().brandVoices.find((v) => v.brandId === brand.id);
      if (voice) {
        const hasForbidden = voice.forbiddenTerms.some((term) => targetContent.toLowerCase().includes(term.toLowerCase()));
        checks.push({
          checkType: "tone",
          passed: !hasForbidden,
          details: hasForbidden ? "Content contains forbidden terms" : "Content follows brand voice guidelines",
          suggestions: hasForbidden ? ["Remove forbidden terms from content"] : undefined
        });
      }

      checks.push({
        checkType: "messaging",
        passed: targetContent.length > 10 && targetContent.length < 500,
        details: targetContent.length > 10 ? "Content length is appropriate" : "Content may be too short"
      });
    }

    return checks;
  }

  listTemplates(actor: RequestActor, query?: URLSearchParams): BrandTemplate[] {
    const brandId = pickQuery(query, "brandId");
    const type = pickQuery(query, "type");
    return clone(this.store.getState().templates.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (brandId && item.brandId !== brandId) return false;
      if (type && item.type !== type) return false;
      return true;
    }));
  }

  createTemplate(input: unknown, actor: RequestActor): BrandTemplate {
    const body = ensureObject(input, "template");
    const state = this.store.getState();
    this.requireBrand(String(body.brandId), actor.tenantId);
    const key = ensureString(body.key, "template.key");
    if (state.templates.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Template key '${key}' already exists`);
    }
    const template: BrandTemplate = {
      id: newId("template"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      brandId: String(body.brandId),
      key,
      name: ensureString(body.name, "template.name"),
      type: String(body.type ?? "other") as BrandTemplate["type"],
      status: String(body.status ?? "active") as BrandTemplate["status"],
      content: ensureString(body.content, "template.content"),
      format: String(body.format ?? "text"),
      usage: body.usage ? String(body.usage) : undefined,
      tags: ensureArray(body.tags, "template.tags", [])
    };
    state.templates.push(template);
    this.store.save();
    this.store.audit(actor, "template.create", "template", template.id, undefined, template);
    return clone(template);
  }

  listPersonas(actor: RequestActor, query?: URLSearchParams): BrandPersona[] {
    const brandId = pickQuery(query, "brandId");
    return clone(this.store.getState().personas.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (brandId && item.brandId !== brandId) return false;
      return true;
    }));
  }

  createPersona(input: unknown, actor: RequestActor): BrandPersona {
    const body = ensureObject(input, "persona");
    const state = this.store.getState();
    this.requireBrand(String(body.brandId), actor.tenantId);
    const key = ensureString(body.key, "persona.key");
    if (state.personas.some((item) => item.tenantId === actor.tenantId && item.key === key)) {
      conflict(`Persona key '${key}' already exists`);
    }
    const persona: BrandPersona = {
      id: newId("persona"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      brandId: String(body.brandId),
      key,
      name: ensureString(body.name, "persona.name"),
      description: body.description ? String(body.description) : undefined,
      status: String(body.status ?? "active") as BrandPersona["status"],
      demographics: (body.demographics && typeof body.demographics === "object") 
        ? body.demographics as PersonaDemographics
        : {},
      psychographics: (body.psychographics && typeof body.psychographics === "object")
        ? body.psychographics as PersonaPsychographics
        : { values: [], interests: [], goals: [], challenges: [] },
      painPoints: ensureArray(body.painPoints, "persona.painPoints", []),
      motivations: ensureArray(body.motivations, "persona.motivations", []),
      preferredChannels: ensureArray(body.preferredChannels, "persona.preferredChannels", []),
      messagingTone: body.messagingTone ? String(body.messagingTone) : undefined
    };
    state.personas.push(persona);
    this.store.save();
    this.store.audit(actor, "persona.create", "persona", persona.id, undefined, persona);
    return clone(persona);
  }

  listAuditLogs(actor: RequestActor): any[] {
    return clone(this.store.getState().auditLogs.filter((item) => item.tenantId === actor.tenantId));
  }

  private requireBrand(idOrKey: string, tenantId: string): Brand {
    const item = this.store.getState().brands.find((brand) => brand.tenantId === tenantId && (brand.id === idOrKey || brand.key === idOrKey));
    if (!item) notFound("Brand not found");
    return item;
  }
}
