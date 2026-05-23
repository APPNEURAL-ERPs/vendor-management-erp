import type { CommandHandler, Command, CommandResult } from "./kernel.js";
import { randomUUID } from "node:crypto";

// ============================================================================
// Employee Create
// ============================================================================

export interface EmployeeCreateInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department?: string;
  jobTitle?: string;
  teamId?: string;
  managerId?: string;
  hireDate?: string;
}

export interface EmployeeCreateOutput {
  id: string;
  status: "active";
}

export const employeeCreateHandler: CommandHandler<EmployeeCreateInput, EmployeeCreateOutput> = (
  command: Command<EmployeeCreateInput>,
): CommandResult<EmployeeCreateOutput> => {
  const { firstName, lastName, email } = command.payload;

  if (!firstName || !lastName || !email) {
    return { success: false, error: "Missing required fields: firstName, lastName, email" };
  }

  return {
    success: true,
    data: { id: randomUUID(), status: "active" },
  };
};

// ============================================================================
// Employee Invite
// ============================================================================

export interface EmployeeInviteInput {
  email: string;
  firstName: string;
  lastName: string;
  teamId?: string;
  jobTitle?: string;
}

export interface EmployeeInviteOutput {
  id: string;
  status: "active";
  invitationSent: true;
}

export const employeeInviteHandler: CommandHandler<EmployeeInviteInput, EmployeeInviteOutput> = (
  command: Command<EmployeeInviteInput>,
): CommandResult<EmployeeInviteOutput> => {
  const { email, firstName, lastName } = command.payload;

  if (!email || !firstName || !lastName) {
    return { success: false, error: "Missing required fields: email, firstName, lastName" };
  }

  return {
    success: true,
    data: { id: randomUUID(), status: "active", invitationSent: true },
  };
};

// ============================================================================
// Team Create
// ============================================================================

export interface TeamCreateInput {
  name: string;
  description?: string;
  leadId?: string;
  department?: string;
}

export interface TeamCreateOutput {
  id: string;
  status: "active";
}

export const teamCreateHandler: CommandHandler<TeamCreateInput, TeamCreateOutput> = (
  command: Command<TeamCreateInput>,
): CommandResult<TeamCreateOutput> => {
  const { name } = command.payload;

  if (!name) {
    return { success: false, error: "Missing required field: name" };
  }

  return {
    success: true,
    data: { id: randomUUID(), status: "active" },
  };
};

// ============================================================================
// Attendance Record
// ============================================================================

export interface AttendanceRecordInput {
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: "present" | "absent" | "late" | "half_day" | "on_leave" | "holiday";
  notes?: string;
}

export interface AttendanceRecordOutput {
  id: string;
  status: "present" | "absent" | "late" | "half_day" | "on_leave" | "holiday";
}

export const attendanceRecordHandler: CommandHandler<AttendanceRecordInput, AttendanceRecordOutput> = (
  command: Command<AttendanceRecordInput>,
): CommandResult<AttendanceRecordOutput> => {
  const { employeeId, date, status } = command.payload;

  if (!employeeId || !date || !status) {
    return { success: false, error: "Missing required fields: employeeId, date, status" };
  }

  return {
    success: true,
    data: { id: randomUUID(), status },
  };
};

// ============================================================================
// Leave Request
// ============================================================================

export interface LeaveRequestInput {
  employeeId: string;
  type: "vacation" | "sick" | "personal" | "maternity" | "paternity" | "bereavement" | "unpaid";
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface LeaveRequestOutput {
  id: string;
  status: "pending";
}

export const leaveRequestHandler: CommandHandler<LeaveRequestInput, LeaveRequestOutput> = (
  command: Command<LeaveRequestInput>,
): CommandResult<LeaveRequestOutput> => {
  const { employeeId, type, startDate, endDate } = command.payload;

  if (!employeeId || !type || !startDate || !endDate) {
    return { success: false, error: "Missing required fields: employeeId, type, startDate, endDate" };
  }

  return {
    success: true,
    data: { id: randomUUID(), status: "pending" },
  };
};

// ============================================================================
// Leave Approve
// ============================================================================

export interface LeaveApproveInput {
  id: string;
  approverId: string;
}

export interface LeaveApproveOutput {
  id: string;
  status: "approved";
}

export const leaveApproveHandler: CommandHandler<LeaveApproveInput, LeaveApproveOutput> = (
  command: Command<LeaveApproveInput>,
): CommandResult<LeaveApproveOutput> => {
  const { id, approverId } = command.payload;

  if (!id || !approverId) {
    return { success: false, error: "Missing required fields: id, approverId" };
  }

  return {
    success: true,
    data: { id, status: "approved" },
  };
};

// ============================================================================
// Shift Assign
// ============================================================================

export interface ShiftAssignInput {
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  type?: "morning" | "afternoon" | "night" | "split" | "on_call";
  location?: string;
  notes?: string;
}

export interface ShiftAssignOutput {
  id: string;
}

export const shiftAssignHandler: CommandHandler<ShiftAssignInput, ShiftAssignOutput> = (
  command: Command<ShiftAssignInput>,
): CommandResult<ShiftAssignOutput> => {
  const { employeeId, date, startTime, endTime } = command.payload;

  if (!employeeId || !date || !startTime || !endTime) {
    return { success: false, error: "Missing required fields: employeeId, date, startTime, endTime" };
  }

  return {
    success: true,
    data: { id: randomUUID() },
  };
};

// ============================================================================
// Handler Registry
// ============================================================================

export const peopleCommandHandlers: ReadonlyMap<string, CommandHandler> = new Map([
  ["people.employee.create", employeeCreateHandler as CommandHandler],
  ["people.employee.invite", employeeInviteHandler as CommandHandler],
  ["people.team.create", teamCreateHandler as CommandHandler],
  ["people.attendance.record", attendanceRecordHandler as CommandHandler],
  ["people.leave.request", leaveRequestHandler as CommandHandler],
  ["people.leave.approve", leaveApproveHandler as CommandHandler],
  ["people.shift.assign", shiftAssignHandler as CommandHandler],
]);
