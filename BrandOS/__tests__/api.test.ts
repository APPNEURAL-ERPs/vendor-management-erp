import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { DataStore } from "../src/core/datastore";
import { EventBus } from "../src/core/event-bus";
import { createSeedState } from "../src/seed-state";
import { buildServer } from "../src/api/server";
import { getOpenApiDocument } from "../src/api/openapi";

function freshStore() {
  const file = `/tmp/brandos-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
  const store = new DataStore(file);
  store.reset(createSeedState("demo-tenant"));
  return store;
}

async function setup(): Promise<{ server: FastifyInstance; store: DataStore }> {
  const store = freshStore();
  const server = await buildServer({ store, seedIfEmpty: false });
  return { server, store };
}

async function teardown(server: FastifyInstance) {
  await server.close();
}

function headers(role: string) {
  return {
    "x-tenant-id": "demo-tenant",
    "x-user-id": `${role}-user`,
    "x-role": role,
  };
}

describe("BrandOS API", () => {
  describe("Health & Meta", () => {
    it("GET /health returns ok", async () => {
      const { server } = await setup();
      const res = await server.inject({ method: "GET", url: "/health" });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.status).toBe("ok");
      expect(body.service).toBe("BrandOS");
      await teardown(server);
    });

    it("GET /brandos/permissions returns role permissions", async () => {
      const { server } = await setup();
      const res = await server.inject({ method: "GET", url: "/brandos/permissions", headers: headers("viewer") });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.role).toBe("viewer");
      expect(Array.isArray(body.permissions)).toBe(true);
      await teardown(server);
    });
  });

  describe("OpenAPI", () => {
    it("generates OpenAPI document", async () => {
      const { server } = await setup();
      const doc = await getOpenApiDocument(server);
      expect(doc).toBeDefined();
      expect((doc as Record<string, unknown>).openapi).toBeDefined();
      const info = (doc as Record<string, unknown>).info as Record<string, unknown>;
      expect(info.title).toBe("BrandOS API");
      expect(info.version).toBe("1.0.0");
      await teardown(server);
    });
  });

  describe("Permission checks", () => {
    it("viewer cannot create brand kit (403)", async () => {
      const { server } = await setup();
      const res = await server.inject({
        method: "POST",
        url: "/brandos/brand-kits",
        headers: headers("viewer"),
        payload: { name: "Test Kit" },
      });
      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe("FORBIDDEN");
      await teardown(server);
    });

    it("unauthenticated request defaults to viewer role", async () => {
      const { server } = await setup();
      const res = await server.inject({
        method: "POST",
        url: "/brandos/brand-kits",
        payload: { name: "Test Kit" },
      });
      expect(res.statusCode).toBe(403);
      await teardown(server);
    });

    it("brand_manager can create brand kit", async () => {
      const { server } = await setup();
      const res = await server.inject({
        method: "POST",
        url: "/brandos/brand-kits",
        headers: headers("brand_manager"),
        payload: { name: "Test Kit", description: "A test brand kit" },
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.data.name).toBe("Test Kit");
      await teardown(server);
    });
  });

  describe("Zod validation", () => {
    it("returns 422 for invalid create asset body", async () => {
      const { server } = await setup();
      const res = await server.inject({
        method: "POST",
        url: "/brandos/assets",
        headers: headers("designer"),
        payload: { name: "Asset" },
      });
      expect(res.statusCode).toBe(422);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe("VALIDATION_ERROR");
      await teardown(server);
    });

    it("returns 422 for invalid asset type", async () => {
      const { server } = await setup();
      const res = await server.inject({
        method: "POST",
        url: "/brandos/assets",
        headers: headers("designer"),
        payload: { name: "Asset", type: "invalid_type", url: "https://example.com/a.png" },
      });
      expect(res.statusCode).toBe(422);
      await teardown(server);
    });
  });

  describe("BrandKits CRUD", () => {
    it("lists, creates, gets, updates, and archives brand kits", async () => {
      const { server } = await setup();

      const list1 = await server.inject({ method: "GET", url: "/brandos/brand-kits", headers: headers("viewer") });
      expect(list1.statusCode).toBe(200);
      const initial = JSON.parse(list1.payload);
      expect(Array.isArray(initial)).toBe(true);

      const create = await server.inject({
        method: "POST",
        url: "/brandos/brand-kits",
        headers: headers("brand_manager"),
        payload: { name: "New Kit", status: "active" },
      });
      expect(create.statusCode).toBe(201);
      const kit = JSON.parse(create.payload).data;
      expect(kit.name).toBe("New Kit");

      const get = await server.inject({ method: "GET", url: `/brandos/brand-kits/${kit.id}`, headers: headers("viewer") });
      expect(get.statusCode).toBe(200);
      expect(JSON.parse(get.payload).name).toBe("New Kit");

      const update = await server.inject({
        method: "PUT",
        url: `/brandos/brand-kits/${kit.id}`,
        headers: headers("brand_manager"),
        payload: { name: "Updated Kit" },
      });
      expect(update.statusCode).toBe(200);
      expect(JSON.parse(update.payload).name).toBe("Updated Kit");

      const archive = await server.inject({
        method: "DELETE",
        url: `/brandos/brand-kits/${kit.id}`,
        headers: headers("brand_manager"),
      });
      expect(archive.statusCode).toBe(200);

      const getAfter = await server.inject({ method: "GET", url: `/brandos/brand-kits/${kit.id}`, headers: headers("viewer") });
      expect(getAfter.statusCode).toBe(404);

      await teardown(server);
    });
  });

  describe("Assets workflow", () => {
    it("designer creates asset, submits, approver approves", async () => {
      const { server } = await setup();

      const create = await server.inject({
        method: "POST",
        url: "/brandos/assets",
        headers: headers("designer"),
        payload: {
          brandKitId: "kit_appneural_master",
          name: "Banner",
          type: "image",
          url: "https://assets.example/banner.png",
          tags: ["banner"],
        },
      });
      expect(create.statusCode).toBe(201);
      const asset = JSON.parse(create.payload).data;
      expect(asset.status).toBe("draft");

      const submit = await server.inject({
        method: "POST",
        url: `/brandos/assets/${asset.id}/submit`,
        headers: headers("designer"),
      });
      expect(submit.statusCode).toBe(200);
      const approval = JSON.parse(submit.payload);
      expect(approval.status).toBe("pending");

      const decide = await server.inject({
        method: "POST",
        url: `/brandos/approvals/${approval.id}/decision`,
        headers: headers("approver"),
        payload: { decision: "approved", note: "Looks good" },
      });
      expect(decide.statusCode).toBe(200);

      const get = await server.inject({ method: "GET", url: `/brandos/assets/${asset.id}`, headers: headers("viewer") });
      expect(JSON.parse(get.payload).status).toBe("approved");

      await teardown(server);
    });
  });

  describe("Content workflow", () => {
    it("content_creator creates content, submits, approver approves, marketer schedules and publishes", async () => {
      const { server } = await setup();

      const create = await server.inject({
        method: "POST",
        url: "/brandos/content",
        headers: headers("content_creator"),
        payload: {
          brandKitId: "kit_appneural_master",
          title: "Launch Post",
          type: "social_post",
          channel: "linkedin",
          body: "Exciting news! #Appneural",
          assetIds: ["asset_logo_primary"],
          tags: ["launch"],
        },
      });
      expect(create.statusCode).toBe(201);
      const content = JSON.parse(create.payload).data;
      expect(content.compliancePassed).toBe(true);

      const submit = await server.inject({
        method: "POST",
        url: `/brandos/content/${content.id}/submit`,
        headers: headers("content_creator"),
      });
      expect(submit.statusCode).toBe(200);

      const approvals = await server.inject({ method: "GET", url: "/brandos/approvals", headers: headers("approver") });
      const approval = JSON.parse(approvals.payload).find((a: { entityId: string }) => a.entityId === content.id);
      expect(approval).toBeDefined();

      const decide = await server.inject({
        method: "POST",
        url: `/brandos/approvals/${approval.id}/decision`,
        headers: headers("approver"),
        payload: { decision: "approved" },
      });
      expect(decide.statusCode).toBe(200);

      const schedule = await server.inject({
        method: "POST",
        url: `/brandos/content/${content.id}/schedule`,
        headers: headers("marketer"),
        payload: { scheduledAt: "2026-05-20T10:00:00.000Z" },
      });
      expect(schedule.statusCode).toBe(200);
      expect(JSON.parse(schedule.payload).status).toBe("queued");

      const publish = await server.inject({
        method: "POST",
        url: `/brandos/content/${content.id}/publish`,
        headers: headers("marketer"),
        payload: { result: { provider: "test" } },
      });
      expect(publish.statusCode).toBe(200);
      expect(JSON.parse(publish.payload).status).toBe("published");

      await teardown(server);
    });
  });

  describe("Campaigns", () => {
    it("marketer creates campaign and attaches content and asset", async () => {
      const { server } = await setup();

      const create = await server.inject({
        method: "POST",
        url: "/brandos/campaigns",
        headers: headers("marketer"),
        payload: {
          brandKitId: "kit_appneural_master",
          name: "Summer Sale",
          objective: "Drive summer sales",
          channels: ["email", "linkedin"],
        },
      });
      expect(create.statusCode).toBe(201);
      const campaign = JSON.parse(create.payload).data;

      const attachContent = await server.inject({
        method: "POST",
        url: `/brandos/campaigns/${campaign.id}/content`,
        headers: headers("marketer"),
        payload: { contentId: "cnt_appneural_001" },
      });
      expect(attachContent.statusCode).toBe(200);

      const attachAsset = await server.inject({
        method: "POST",
        url: `/brandos/campaigns/${campaign.id}/assets`,
        headers: headers("marketer"),
        payload: { assetId: "asset_logo_primary" },
      });
      expect(attachAsset.statusCode).toBe(200);

      const rollup = await server.inject({ method: "GET", url: `/brandos/campaigns/${campaign.id}/rollup`, headers: headers("viewer") });
      expect(rollup.statusCode).toBe(200);

      await teardown(server);
    });
  });

  describe("Compliance", () => {
    it("checks compliance and returns violations", async () => {
      const { server } = await setup();
      const res = await server.inject({
        method: "POST",
        url: "/brandos/compliance/check",
        headers: headers("content_creator"),
        payload: {
          brandKitId: "kit_appneural_master",
          title: "Guaranteed success",
          body: "This guarantees results for everyone.",
          tags: ["launch"],
        },
      });
      expect(res.statusCode).toBe(200);
      const result = JSON.parse(res.payload);
      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      await teardown(server);
    });
  });

  describe("Guidelines", () => {
    it("creates and archives guideline rules", async () => {
      const { server } = await setup();

      const create = await server.inject({
        method: "POST",
        url: "/brandos/guidelines",
        headers: headers("brand_manager"),
        payload: {
          name: "No Guarantees",
          type: "banned_term",
          field: "body",
          value: "guarantee",
          severity: "high",
        },
      });
      expect(create.statusCode).toBe(201);
      const rule = JSON.parse(create.payload).data;

      const archive = await server.inject({
        method: "DELETE",
        url: `/brandos/guidelines/${rule.id}`,
        headers: headers("brand_manager"),
      });
      expect(archive.statusCode).toBe(200);

      await teardown(server);
    });
  });

  describe("Audit & Events", () => {
    it("returns audit logs for admin", async () => {
      const { server } = await setup();
      const res = await server.inject({ method: "GET", url: "/brandos/audit", headers: headers("admin") });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(Array.isArray(body)).toBe(true);
      await teardown(server);
    });

    it("returns events for viewer", async () => {
      const { server } = await setup();
      const res = await server.inject({ method: "GET", url: "/brandos/events", headers: headers("viewer") });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(Array.isArray(body)).toBe(true);
      await teardown(server);
    });
  });

  describe("Collections", () => {
    it("creates and updates a collection", async () => {
      const { server } = await setup();

      const create = await server.inject({
        method: "POST",
        url: "/brandos/collections",
        headers: headers("designer"),
        payload: { name: "Logos", assetIds: ["asset_logo_primary"] },
      });
      expect(create.statusCode).toBe(201);
      const collection = JSON.parse(create.payload).data;

      const update = await server.inject({
        method: "PUT",
        url: `/brandos/collections/${collection.id}`,
        headers: headers("designer"),
        payload: { name: "Updated Logos" },
      });
      expect(update.statusCode).toBe(200);
      expect(JSON.parse(update.payload).name).toBe("Updated Logos");

      await teardown(server);
    });
  });

  describe("Publish Jobs", () => {
    it("lists publish jobs", async () => {
      const { server } = await setup();
      const res = await server.inject({ method: "GET", url: "/brandos/publish-jobs", headers: headers("viewer") });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(JSON.parse(res.payload))).toBe(true);
      await teardown(server);
    });
  });
});
