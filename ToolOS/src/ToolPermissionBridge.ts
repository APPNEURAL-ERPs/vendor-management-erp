import { SecurityBridge, ToolExecutionContext, ToolManifest } from "./types";

export class ToolPermissionBridge implements SecurityBridge {
  checkPermission(manifest: ToolManifest, context: ToolExecutionContext): boolean {
    const granted = context.permissions ?? [];
    return manifest.permissions.every((permission) => granted.includes(permission) || granted.includes("*"));
  }

  check(manifest: ToolManifest, context: ToolExecutionContext): void {
    if (!this.checkPermission(manifest, context)) {
      const missing = manifest.permissions.find((permission) => !(context.permissions ?? []).includes(permission) && !(context.permissions ?? []).includes("*"));
      throw new Error(`Permission denied: ${missing ?? manifest.id}`);
    }
  }
}
