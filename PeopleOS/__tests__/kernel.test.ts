import { describe, it, expect } from "vitest";
import { PeopleOS, peopleManifest } from "../src/index.js";

describe("PeopleOS Kernel", () => {
  it("boots successfully", async () => {
    const os = new PeopleOS();
    await os.boot();
    expect(os.state).toBe("ready");
  });

  it("shuts down successfully", async () => {
    const os = new PeopleOS();
    await os.boot();
    await os.shutdown();
    expect(os.state).toBe("stopped");
  });

  it("has correct OS identity from manifest", () => {
    expect(PeopleOS.manifest.id).toBe("peopleos");
    expect(PeopleOS.manifest.name).toBe("PeopleOS");
    expect(PeopleOS.manifest.namespace).toBe("people");
  });

  it("exposes peopleManifest with correct data", () => {
    expect(peopleManifest.id).toBe("peopleos");
    expect(peopleManifest.models).toHaveLength(6);
    expect(peopleManifest.commands).toHaveLength(7);
  });

  it("provides CommandRegistry after boot", async () => {
    const os = new PeopleOS();
    await os.boot();
    const registry = os.getCommandRegistry();
    expect(registry).toBeDefined();
    expect(registry.size).toBe(7);
  });

  it("provides CommandExecutor after boot", async () => {
    const os = new PeopleOS();
    await os.boot();
    const executor = os.getCommandExecutor();
    expect(executor).toBeDefined();
  });

  it("provides APIRegistry after boot", async () => {
    const os = new PeopleOS();
    await os.boot();
    const apiRegistry = os.getAPIRegistry();
    expect(apiRegistry).toBeDefined();
    expect(apiRegistry.size).toBeGreaterThan(0);
  });

  it("provides OpenAPIGenerator after boot", async () => {
    const os = new PeopleOS();
    await os.boot();
    const generator = os.getOpenAPIGenerator();
    expect(generator).toBeDefined();
  });

  it("can generate OpenAPI document", async () => {
    const os = new PeopleOS();
    await os.boot();
    const doc = os.generateOpenAPI();
    expect(doc).toBeDefined();
    expect(doc.openapi).toBe("3.0.3");
    expect(doc.info.title).toContain("PeopleOS");
  });
});
