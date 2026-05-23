// Manifest
export { peopleManifest } from "./manifest.js";

// Kernel + Core Types
export {
  OSKernel,
  type OSModule,
  type OSPlugin,
  type OSKernelConfig,
  type OSKernelState,
  type DIContainer,
  InjectionToken,
  CommandRegistry,
  CommandExecutor,
  type Command,
  type CommandResult,
  type CommandHandler,
  type CommandContext,
  type RegisteredCommand,
  APIRegistry,
  OpenAPIGenerator,
  type ModelRoutesConfig,
  type APIRoute,
  type OpenAPIDocument,
} from "./kernel.js";

// PeopleOS
export { PeopleOS, COMMAND_REGISTRY_TOKEN, COMMAND_EXECUTOR_TOKEN, PEOPLE_API_REGISTRY_TOKEN, PEOPLE_OPENAPI_GENERATOR_TOKEN } from "./people-os.js";

// Command Handlers
export {
  employeeCreateHandler,
  employeeInviteHandler,
  teamCreateHandler,
  attendanceRecordHandler,
  leaveRequestHandler,
  leaveApproveHandler,
  shiftAssignHandler,
  peopleCommandHandlers,
} from "./people-handlers.js";
export type {
  EmployeeCreateInput,
  EmployeeCreateOutput,
  EmployeeInviteInput,
  EmployeeInviteOutput,
  TeamCreateInput,
  TeamCreateOutput,
  AttendanceRecordInput,
  AttendanceRecordOutput,
  LeaveRequestInput,
  LeaveRequestOutput,
  LeaveApproveInput,
  LeaveApproveOutput,
  ShiftAssignInput,
  ShiftAssignOutput,
} from "./people-handlers.js";
