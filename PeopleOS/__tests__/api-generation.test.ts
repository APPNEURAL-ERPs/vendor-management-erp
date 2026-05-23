import { describe, it, expect } from "vitest";
import { PeopleOS } from "../src/index.js";

describe("PeopleOS API Generation", () => {
  it("registers model routes from manifest", async () => {
    const os = new PeopleOS();
    await os.boot();

    const registry = os.getAPIRegistry();
    const routes = registry.getAllRoutes();

    expect(routes.length).toBeGreaterThan(0);
  });

  it("has employee routes registered", async () => {
    const os = new PeopleOS();
    await os.boot();

    const registry = os.getAPIRegistry();
    const routes = registry.getAllRoutes();
    const employeeRoutes = routes.filter((r) =>
      r.tags.some((t) => t.includes("employee") || t.includes("Employee")),
    );

    expect(employeeRoutes.length).toBeGreaterThan(0);
  });

  it("has leave request routes registered", async () => {
    const os = new PeopleOS();
    await os.boot();

    const registry = os.getAPIRegistry();
    const routes = registry.getAllRoutes();
    const leaveRoutes = routes.filter((r) =>
      r.tags.some((t) => t.includes("leave") || t.includes("Leave")),
    );

    expect(leaveRoutes.length).toBeGreaterThan(0);
  });

  it("generates valid OpenAPI document", async () => {
    const os = new PeopleOS();
    await os.boot();

    const doc = os.generateOpenAPI();

    expect(doc.openapi).toBe("3.0.3");
    expect(doc.info.title).toContain("PeopleOS");
    expect(doc.info.version).toBe("1.0.0");
    expect(doc.paths).toBeDefined();
    expect(Object.keys(doc.paths!).length).toBeGreaterThan(0);
  });

  it("OpenAPI document has people paths", async () => {
    const os = new PeopleOS();
    await os.boot();

    const doc = os.generateOpenAPI();
    const paths = Object.keys(doc.paths!);

    const hasEmployeePath = paths.some((p) => p.includes("employee"));
    const hasLeavePath = paths.some((p) => p.includes("leave"));
    expect(hasEmployeePath).toBe(true);
    expect(hasLeavePath).toBe(true);
  });
});
