import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadManifest() {
  const manifestPath = join(__dirname, "..", "manifest.json");
  return JSON.parse(readFileSync(manifestPath, "utf-8"));
}

// ============================================================================
// Manager Approval Workflow (Acceptance Criteria)
// ============================================================================

describe("Manager Approval Workflow", () => {
  it("defines a leave-approval workflow triggered by people.leave.requested", () => {
    const manifest = loadManifest();
    const workflow = manifest.workflows.find((w: { name: string }) => w.name === "leave-approval");
    expect(workflow).toBeDefined();
    expect(workflow.trigger.type).toBe("event");
    expect(workflow.trigger.source).toBe("people.leave.requested");
  });

  it("workflow steps include people.leave.approve command", () => {
    const manifest = loadManifest();
    const workflow = manifest.workflows.find((w: { name: string }) => w.name === "leave-approval");
    const approveStep = workflow.steps.find((s: { name: string }) => s.name === "notify-manager");
    expect(approveStep).toBeDefined();
    expect(approveStep.type).toBe("action");
    expect(approveStep.command).toBe("people.leave.approve");
  });

  it("people.leave.approve command requires people.leave.approve permission", () => {
    const manifest = loadManifest();
    const approveCmd = manifest.commands.find((c: { name: string }) => c.name === "people.leave.approve");
    expect(approveCmd).toBeDefined();
    expect(approveCmd.auth.required).toBe(true);
    expect(approveCmd.auth.permissions).toContain("people.leave.approve");
  });

  it("people.manager role has leave approve permission", () => {
    const manifest = loadManifest();
    const managerRole = manifest.roles.find((r: { name: string }) => r.name === "people.manager");
    expect(managerRole).toBeDefined();
    expect(managerRole.permissions).toContain("people.leave.approve");
  });

  it("people.leave.requested event exists with pending status", () => {
    const manifest = loadManifest();
    const event = manifest.events.publishes.find((e: { name: string }) => e.name === "people.leave.requested");
    expect(event).toBeDefined();
    expect(event.payload.status).toBeDefined();
    expect(event.payload.status.enumValues).toContain("pending");
  });

  it("people.leave.approved event exists with approved status", () => {
    const manifest = loadManifest();
    const event = manifest.events.publishes.find((e: { name: string }) => e.name === "people.leave.approved");
    expect(event).toBeDefined();
    expect(event.payload.status.enumValues).toContain("approved");
    expect(event.payload.approverId).toBeDefined();
  });
});

// ============================================================================
// Employee Self-Service Mobile Schema (Acceptance Criteria)
// ============================================================================

describe("Employee Self-Service Mobile Schema", () => {
  it("defines self-service-dashboard mobile screen", () => {
    const manifest = loadManifest();
    const dashboard = manifest.mobile.find((s: { name: string }) => s.name === "self-service-dashboard");
    expect(dashboard).toBeDefined();
    expect(dashboard.title).toBe("My Dashboard");
    expect(dashboard.type).toBe("detail");
    expect(dashboard.model).toBe("Employee");
  });

  it("self-service dashboard has navigation buttons for key actions", () => {
    const manifest = loadManifest();
    const dashboard = manifest.mobile.find((s: { name: string }) => s.name === "self-service-dashboard");
    const buttons = dashboard.components.filter((c: { type: string }) => c.type === "button");
    expect(buttons.length).toBeGreaterThanOrEqual(3);

    const targets = buttons.map((b: { action: { target: string } }) => b.action.target);
    expect(targets).toContain("attendance-record");
    expect(targets).toContain("leave-request-form");
    expect(targets).toContain("my-shifts");
  });

  it("defines attendance-record mobile form", () => {
    const manifest = loadManifest();
    const attendance = manifest.mobile.find((s: { name: string }) => s.name === "attendance-record");
    expect(attendance).toBeDefined();
    expect(attendance.type).toBe("form");
    expect(attendance.model).toBe("Attendance");
  });

  it("attendance form has submit action", () => {
    const manifest = loadManifest();
    const attendance = manifest.mobile.find((s: { name: string }) => s.name === "attendance-record");
    const submitBtn = attendance.components.find(
      (c: { type: string; action?: { type: string } }) => c.type === "button" && c.action?.type === "submit",
    );
    expect(submitBtn).toBeDefined();
  });

  it("defines leave-request-form mobile form", () => {
    const manifest = loadManifest();
    const leaveForm = manifest.mobile.find((s: { name: string }) => s.name === "leave-request-form");
    expect(leaveForm).toBeDefined();
    expect(leaveForm.type).toBe("form");
    expect(leaveForm.model).toBe("LeaveRequest");
  });

  it("leave request form has leave type selector", () => {
    const manifest = loadManifest();
    const leaveForm = manifest.mobile.find((s: { name: string }) => s.name === "leave-request-form");
    const typeSelect = leaveForm.components.find(
      (c: { type: string; dataBinding: string }) => c.type === "select" && c.dataBinding === "type",
    );
    expect(typeSelect).toBeDefined();
  });

  it("defines my-shifts mobile screen", () => {
    const manifest = loadManifest();
    const shifts = manifest.mobile.find((s: { name: string }) => s.name === "my-shifts");
    expect(shifts).toBeDefined();
    expect(shifts.type).toBe("list");
    expect(shifts.model).toBe("Shift");
  });

  it("has 4 mobile screens total for self-service", () => {
    const manifest = loadManifest();
    expect(manifest.mobile).toHaveLength(4);
    const screenNames = manifest.mobile.map((s: { name: string }) => s.name);
    expect(screenNames).toContain("self-service-dashboard");
    expect(screenNames).toContain("attendance-record");
    expect(screenNames).toContain("leave-request-form");
    expect(screenNames).toContain("my-shifts");
  });
});
