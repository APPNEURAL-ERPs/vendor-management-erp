import { ToolManifest, ToolManifestInput, ValidationResult } from "./types";
import { ToolManifestValidator } from "./ToolManifestValidator";

export class ToolRegistry {
  private readonly tools = new Map<string, ToolManifest>();
  private readonly validator = new ToolManifestValidator();

  validateManifest(manifest: unknown): ValidationResult {
    return this.validator.validate(manifest);
  }

  registerTool(manifestInput: ToolManifestInput): ToolManifest {
    const validation = this.validator.validate(manifestInput);
    if (!validation.valid || !validation.manifest) throw new Error(`Invalid tool manifest: ${validation.errors.join("; ")}`);
    if (this.tools.has(validation.manifest.id)) throw new Error(`Duplicate tool id: ${validation.manifest.id}`);
    this.tools.set(validation.manifest.id, clone(validation.manifest));
    return this.getTool(validation.manifest.id);
  }

  unregisterTool(toolId: string): void {
    if (!this.tools.delete(toolId)) throw new Error(`Unknown tool: ${toolId}`);
  }

  listTools(): ToolManifest[] {
    return Array.from(this.tools.values()).map(clone);
  }

  getTool(toolId: string): ToolManifest {
    const tool = this.tools.get(toolId);
    if (!tool) throw new Error(`Unknown tool: ${toolId}`);
    return clone(tool);
  }

  getToolsByCategory(category: string): ToolManifest[] {
    return this.listTools().filter((tool) => tool.category === category);
  }

  enableTool(toolId: string): ToolManifest {
    return this.setEnabled(toolId, true);
  }

  disableTool(toolId: string): ToolManifest {
    return this.setEnabled(toolId, false);
  }

  findByCommand(commandName: string): ToolManifest {
    const tool = this.listTools().find((candidate) => candidate.commands.includes(commandName));
    if (!tool) throw new Error(`Unknown tool command: ${commandName}`);
    return tool;
  }

  private setEnabled(toolId: string, enabled: boolean): ToolManifest {
    const tool = this.tools.get(toolId);
    if (!tool) throw new Error(`Unknown tool: ${toolId}`);
    tool.enabled = enabled;
    this.tools.set(toolId, tool);
    return clone(tool);
  }
}

function clone<T>(value: T): T {
  return structuredClone(value);
}
