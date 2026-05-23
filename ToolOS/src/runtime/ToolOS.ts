import { ToolAnalyticsBridge } from "./ToolAnalyticsBridge";
import { ToolExecutor } from "./ToolExecutor";
import { ToolInstaller } from "./ToolInstaller";
import { ToolPermissionBridge } from "./ToolPermissionBridge";
import { ToolRegistry } from "./ToolRegistry";
import { ToolExecutionContext, ToolExecutionRecord, ToolManifest, ToolOSOptions } from "./types";

export class ToolOS {
  readonly registry: ToolRegistry;
  readonly installer: ToolInstaller;
  readonly permissions: ToolPermissionBridge;
  readonly analytics: ToolAnalyticsBridge;
  readonly executor: ToolExecutor;

  constructor(options: ToolOSOptions = {}) {
    this.registry = new ToolRegistry();
    this.installer = new ToolInstaller(this.registry);
    this.permissions = new ToolPermissionBridge();
    this.analytics = new ToolAnalyticsBridge();
    this.executor = new ToolExecutor(this.registry, this.permissions, this.analytics, options.handlers ?? {});
  }

  registerTool(manifest: ToolManifest): ToolManifest {
    return this.registry.register(manifest);
  }

  unregisterTool(toolId: string): void {
    this.registry.unregister(toolId);
  }

  installTool(manifest: ToolManifest): ToolManifest {
    return this.installer.install(manifest);
  }

  listTools(): ToolManifest[] {
    return this.registry.list();
  }

  getTool(toolId: string): ToolManifest {
    return this.registry.get(toolId);
  }

  getToolsByCategory(category: string): ToolManifest[] {
    return this.registry.byCategory(category);
  }

  getAIEnabledTools(): ToolManifest[] {
    return this.registry.aiEnabled();
  }

  validateToolManifest(manifest: unknown) {
    return this.registry.validateManifest(manifest);
  }

  executeTool(commandName: string, input: Record<string, unknown>, context: ToolExecutionContext): ToolExecutionRecord {
    return this.executor.execute(commandName, input, context);
  }

  getDeveloperMetadata() {
    return this.listTools().map((tool) => ({
      id: tool.id,
      name: tool.name,
      packageName: tool.packageName,
      version: tool.version,
      apiRoute: tool.api.route,
      sdkNamespace: tool.sdk.namespace,
      cliNamespace: tool.cli.namespace,
      commands: tool.commands,
      permissions: tool.permissions,
      aiEnabled: tool.aiSupport.enabled
    }));
  }
}
