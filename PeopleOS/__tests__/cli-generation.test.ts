import { describe, it, expect } from "vitest";
import { CLIGenerator } from "@appneurox/generator";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadManifest() {
  const manifestPath = join(__dirname, "..", "manifest.json");
  return JSON.parse(readFileSync(manifestPath, "utf-8"));
}

describe("PeopleOS CLI Generation", () => {
  it("generates CLI files from PeopleOS manifest", () => {
    const manifest = loadManifest();
    const generator = new CLIGenerator();
    const files = generator.generate({ manifest });

    expect(files.length).toBeGreaterThan(0);
    const filePaths = files.map((f) => f.path);
    expect(filePaths).toContain("index.ts");
  });

  it("generated CLI files contain Commander.js imports", () => {
    const manifest = loadManifest();
    const generator = new CLIGenerator();
    const files = generator.generate({ manifest });

    for (const file of files) {
      if (file.path !== "index.ts") {
        expect(file.content).toContain("Command");
      }
    }
  });

  it("generated CLI files reference @appneurox/sdk", () => {
    const manifest = loadManifest();
    const generator = new CLIGenerator();
    const files = generator.generate({ manifest });

    for (const file of files) {
      if (file.path !== "index.ts") {
        expect(file.content).toContain("@appneurox/sdk");
      }
    }
  });

  it("generates employee commands", () => {
    const manifest = loadManifest();
    const generator = new CLIGenerator();
    const files = generator.generate({ manifest });

    const employeeFile = files.find((f) => f.path.includes("employee"));
    expect(employeeFile).toBeDefined();
    expect(employeeFile!.content).toContain("people.employee.create");
  });

  it("generates leave commands", () => {
    const manifest = loadManifest();
    const generator = new CLIGenerator();
    const files = generator.generate({ manifest });

    const leaveFile = files.find((f) => f.path.includes("leave") || f.path.includes("Leave"));
    expect(leaveFile).toBeDefined();
    expect(leaveFile!.content).toContain("people.leave");
  });

  it("generates attendance commands", () => {
    const manifest = loadManifest();
    const generator = new CLIGenerator();
    const files = generator.generate({ manifest });

    const attendanceFile = files.find((f) => f.path.includes("attendance") || f.path.includes("Attendance"));
    expect(attendanceFile).toBeDefined();
    expect(attendanceFile!.content).toContain("people.attendance.record");
  });
});
