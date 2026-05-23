import { describe, it, expect } from "vitest";
import { OSManifestSchema } from "@appneurox/schemas";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadManifest() {
  const manifestPath = join(__dirname, "..", "manifest.json");
  return JSON.parse(readFileSync(manifestPath, "utf-8"));
}

describe("PeopleOS Manifest Validation", () => {
  it("validates manifest.json against OSManifestSchema", () => {
    const manifest = loadManifest();
    const result = OSManifestSchema.safeParse(manifest);
    expect(result.success).toBe(true);
    if (!result.success) {
      console.error("Validation errors:", JSON.stringify(result.error.issues, null, 2));
    }
  });

  it("has correct OS identity", () => {
    const manifest = loadManifest();
    expect(manifest.id).toBe("peopleos");
    expect(manifest.name).toBe("PeopleOS");
    expect(manifest.packageName).toBe("@appneurox/peopleos");
    expect(manifest.namespace).toBe("people");
  });

  it("defines 6 models", () => {
    const manifest = loadManifest();
    expect(manifest.models).toHaveLength(6);
    const modelNames = manifest.models.map((m: { name: string }) => m.name);
    expect(modelNames).toEqual(["Employee", "Team", "RoleProfile", "Attendance", "LeaveRequest", "Shift"]);
  });

  it("defines 7 commands", () => {
    const manifest = loadManifest();
    expect(manifest.commands).toHaveLength(7);
    const commandNames = manifest.commands.map((c: { name: string }) => c.name);
    expect(commandNames).toContain("people.employee.create");
    expect(commandNames).toContain("people.employee.invite");
    expect(commandNames).toContain("people.team.create");
    expect(commandNames).toContain("people.attendance.record");
    expect(commandNames).toContain("people.leave.request");
    expect(commandNames).toContain("people.leave.approve");
    expect(commandNames).toContain("people.shift.assign");
  });

  it("defines 4 events", () => {
    const manifest = loadManifest();
    expect(manifest.events.publishes).toHaveLength(4);
    const eventNames = manifest.events.publishes.map((e: { name: string }) => e.name);
    expect(eventNames).toContain("people.employee.created");
    expect(eventNames).toContain("people.leave.requested");
    expect(eventNames).toContain("people.leave.approved");
    expect(eventNames).toContain("people.attendance.recorded");
  });

  it("defines 5 permissions", () => {
    const manifest = loadManifest();
    expect(manifest.permissions).toHaveLength(5);
    const permNames = manifest.permissions.map((p: { name: string }) => p.name);
    expect(permNames).toContain("people.employees.read");
    expect(permNames).toContain("people.employees.create");
    expect(permNames).toContain("people.teams.manage");
    expect(permNames).toContain("people.attendance.record");
    expect(permNames).toContain("people.leave.approve");
  });

  it("defines 3 roles", () => {
    const manifest = loadManifest();
    expect(manifest.roles).toHaveLength(3);
    const roleNames = manifest.roles.map((r: { name: string }) => r.name);
    expect(roleNames).toContain("people.admin");
    expect(roleNames).toContain("people.manager");
    expect(roleNames).toContain("people.employee");
  });

  it("commands reference correct events", () => {
    const manifest = loadManifest();
    for (const cmd of manifest.commands) {
      if (cmd.event) {
        const eventExists = manifest.events.publishes.some(
          (e: { name: string }) => e.name === cmd.event,
        );
        expect(eventExists).toBe(true);
      }
    }
  });

  it("Employee model has required fields", () => {
    const manifest = loadManifest();
    const employee = manifest.models.find((m: { name: string }) => m.name === "Employee");
    expect(employee).toBeDefined();
    expect(employee.fields.id).toBeDefined();
    expect(employee.fields.firstName).toBeDefined();
    expect(employee.fields.lastName).toBeDefined();
    expect(employee.fields.email).toBeDefined();
    expect(employee.fields.status).toBeDefined();
  });

  it("LeaveRequest model has required fields", () => {
    const manifest = loadManifest();
    const leave = manifest.models.find((m: { name: string }) => m.name === "LeaveRequest");
    expect(leave).toBeDefined();
    expect(leave.fields.id).toBeDefined();
    expect(leave.fields.employeeId).toBeDefined();
    expect(leave.fields.type).toBeDefined();
    expect(leave.fields.status).toBeDefined();
    expect(leave.fields.startDate).toBeDefined();
    expect(leave.fields.endDate).toBeDefined();
  });

  it("defines leave-approval workflow", () => {
    const manifest = loadManifest();
    expect(manifest.workflows).toHaveLength(1);
    const workflow = manifest.workflows[0];
    expect(workflow.name).toBe("leave-approval");
    expect(workflow.trigger.source).toBe("people.leave.requested");
    expect(workflow.steps).toHaveLength(1);
    expect(workflow.steps[0].command).toBe("people.leave.approve");
  });
});
