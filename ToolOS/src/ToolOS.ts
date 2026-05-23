import { ToolAIRegistry } from "./ToolAIRegistry";
import { ToolAnalyticsBridge } from "./ToolAnalyticsBridge";
import { ToolExecutor } from "./ToolExecutor";
import { ToolInstaller } from "./ToolInstaller";
import { ToolPermissionBridge } from "./ToolPermissionBridge";
import { ToolRegistry } from "./ToolRegistry";
import { ToolExecutionContext, ToolExecutionResult, ToolManifest, ToolManifestInput, ToolOSOptions } from "./types";

export class ToolOS {
  readonly registry: ToolRegistry;
  readonly installer: ToolInstaller;
  readonly permissions: ToolPermissionBridge;
  readonly analytics: ToolAnalyticsBridge;
  readonly aiRegistry: ToolAIRegistry;
  readonly executor: ToolExecutor;

  constructor(options: ToolOSOptions = {}) {
    this.registry = new ToolRegistry();
    this.permissions = options.security instanceof ToolPermissionBridge ? options.security : new ToolPermissionBridge();
    this.analytics = options.analytics instanceof ToolAnalyticsBridge ? options.analytics : new ToolAnalyticsBridge();
    this.installer = new ToolInstaller(this.registry, options.marketplace);
    this.aiRegistry = new ToolAIRegistry(this.registry);
    this.executor = new ToolExecutor(this.registry, options.security ?? this.permissions, this.analytics, options.handlers ?? {});
  }

  registerTool(manifest: ToolManifestInput): ToolManifest {
    return this.registry.registerTool(manifest);
  }

  unregisterTool(toolId: string): void {
    this.registry.unregisterTool(toolId);
  }

  listTools(): ToolManifest[] {
    return this.registry.listTools();
  }

  getTool(toolId: string): ToolManifest {
    return this.registry.getTool(toolId);
  }

  getToolsByCategory(category: string): ToolManifest[] {
    return this.registry.getToolsByCategory(category);
  }

  getAIEnabledTools(): ToolManifest[] {
    return this.aiRegistry.getAIEnabledTools();
  }

  executeTool(commandName: string, input: Record<string, unknown>, context: ToolExecutionContext): ToolExecutionResult {
    return this.executor.executeTool(commandName, input, context);
  }

  installTool(packageName: string | ToolManifestInput): ToolManifest {
    return this.installer.installTool(packageName);
  }

  enableTool(toolId: string): ToolManifest {
    return this.registry.enableTool(toolId);
  }

  disableTool(toolId: string): ToolManifest {
    return this.registry.disableTool(toolId);
  }

  validateToolManifest(manifest: unknown) {
    return this.registry.validateManifest(manifest);
  }

  getDeveloperMetadata() {
    return this.listTools().map((tool) => ({
      id: tool.id,
      name: tool.name,
      packageName: tool.packageName,
      version: tool.version,
      category: tool.category,
      apiRoute: tool.api.route,
      sdkNamespace: tool.sdk.namespace,
      cliNamespace: tool.cli.namespace,
      commands: tool.commands,
      permissions: tool.permissions,
      aiEnabled: tool.ai.enabled,
      enabled: tool.enabled,
      marketplace: tool.marketplace
    }));
  }
}
