import { ToolRegistry } from "./ToolRegistry";
import { ToolManifest } from "./types";

export class ToolAIRegistry {
  constructor(private readonly registry: ToolRegistry) {}

  getAIEnabledTools(): ToolManifest[] {
    return this.registry.listTools().filter((tool) => tool.ai.enabled);
  }
}
