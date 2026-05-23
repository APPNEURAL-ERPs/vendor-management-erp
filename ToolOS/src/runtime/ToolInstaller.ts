import { ToolRegistry } from "./ToolRegistry";
import { ToolManifest } from "./types";

export class ToolInstaller {
  constructor(private readonly registry: ToolRegistry) {}

  install(manifest: ToolManifest): ToolManifest {
    return this.registry.register(manifest);
  }

  uninstall(toolId: string): void {
    this.registry.unregister(toolId);
  }
}
