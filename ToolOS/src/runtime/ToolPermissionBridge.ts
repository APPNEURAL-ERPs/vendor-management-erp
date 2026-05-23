import { ToolExecutionContext, ToolManifest } from "./types";

export class ToolPermissionBridge {
  check(manifest: ToolManifest, context: ToolExecutionContext): void {
    for (const permission of manifest.permissions) {
      if (!context.permissions.includes(permission) && !context.permissions.includes("*")) {
        throw new Error(`Permission denied: ${permission}`);
      }
    }
  }
}
