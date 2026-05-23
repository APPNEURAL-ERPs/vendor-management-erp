import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PeopleOS } from "../src/index.js";
import type { CommandContext } from "../src/index.js";

describe("PeopleOS Command Execution", () => {
  let os: PeopleOS;
  const context: CommandContext = {
    subjectId: "test-user",
    tenantId: "test-tenant",
    correlationId: "test-correlation",
  };

  beforeEach(async () => {
    os = new PeopleOS();
    await os.boot();
  });

  afterEach(async () => {
    await os.shutdown();
  });

  it("executes people.employee.create", async () => {
    const executor = os.getCommandExecutor();
    const result = await executor.run("people.employee.create", {
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
    }, context);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.status).toBe("active");
    expect(result.data!.id).toBeDefined();
  });

  it("employee.create fails with missing required fields", async () => {
    const executor = os.getCommandExecutor();
    const result = await executor.run("people.employee.create", {}, context);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("executes people.employee.invite", async () => {
    const executor = os.getCommandExecutor();
    const result = await executor.run("people.employee.invite", {
      email: "bob@example.com",
      firstName: "Bob",
      lastName: "Smith",
    }, context);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.status).toBe("active");
    expect(result.data!.invitationSent).toBe(true);
  });

  it("employee.invite fails with missing required fields", async () => {
    const executor = os.getCommandExecutor();
    const result = await executor.run("people.employee.invite", {}, context);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("executes people.team.create", async () => {
    const executor = os.getCommandExecutor();
    const result = await executor.run("people.team.create", {
      name: "Engineering",
      department: "Technology",
    }, context);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.status).toBe("active");
    expect(result.data!.id).toBeDefined();
  });

  it("team.create fails with missing required fields", async () => {
    const executor = os.getCommandExecutor();
    const result = await executor.run("people.team.create", {}, context);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("executes people.attendance.record", async () => {
    const executor = os.getCommandExecutor();
    const result = await executor.run("people.attendance.record", {
      employeeId: "emp-123",
      date: "2026-01-15",
      status: "present",
    }, context);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.status).toBe("present");
    expect(result.data!.id).toBeDefined();
  });

  it("attendance.record fails with missing required fields", async () => {
    const executor = os.getCommandExecutor();
    const result = await executor.run("people.attendance.record", {}, context);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("executes people.leave.request", async () => {
    const executor = os.getCommandExecutor();
    const result = await executor.run("people.leave.request", {
      employeeId: "emp-123",
      type: "vacation",
      startDate: "2026-02-01",
      endDate: "2026-02-05",
    }, context);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.status).toBe("pending");
    expect(result.data!.id).toBeDefined();
  });

  it("leave.request fails with missing required fields", async () => {
    const executor = os.getCommandExecutor();
    const result = await executor.run("people.leave.request", {}, context);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("executes people.leave.approve", async () => {
    const executor = os.getCommandExecutor();
    const result = await executor.run("people.leave.approve", {
      id: "leave-123",
      approverId: "mgr-456",
    }, context);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.status).toBe("approved");
    expect(result.data!.id).toBe("leave-123");
  });

  it("leave.approve fails with missing required fields", async () => {
    const executor = os.getCommandExecutor();
    const result = await executor.run("people.leave.approve", {}, context);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("executes people.shift.assign", async () => {
    const executor = os.getCommandExecutor();
    const result = await executor.run("people.shift.assign", {
      employeeId: "emp-123",
      date: "2026-01-15",
      startTime: "2026-01-15T09:00:00Z",
      endTime: "2026-01-15T17:00:00Z",
      type: "morning",
    }, context);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.id).toBeDefined();
  });

  it("shift.assign fails with missing required fields", async () => {
    const executor = os.getCommandExecutor();
    const result = await executor.run("people.shift.assign", {}, context);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("rejects unknown command", async () => {
    const executor = os.getCommandExecutor();
    await expect(
      executor.run("people.unknown.command", {}, context),
    ).rejects.toThrow();
  });
});
