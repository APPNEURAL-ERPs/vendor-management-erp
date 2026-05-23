import type { OSManifest } from "@appneurox/schemas";

// ============================================================================
// DI Container
// ============================================================================

export class InjectionToken<T> {
  constructor(public readonly name: string) {}
}

export interface DIContainer {
  bind<T>(token: InjectionToken<T>): { toValue(value: T): void };
  get<T>(token: InjectionToken<T>): T;
}

class DIContainerImpl implements DIContainer {
  private readonly bindings = new Map<InjectionToken<unknown>, unknown>();

  bind<T>(token: InjectionToken<T>): { toValue(value: T): void } {
    return {
      toValue: (value: T) => {
        this.bindings.set(token, value);
      },
    };
  }

  get<T>(token: InjectionToken<T>): T {
    const value = this.bindings.get(token);
    if (value === undefined) {
      throw new Error(`No binding found for token: ${token.name}`);
    }
    return value as T;
  }
}

// ============================================================================
// OS Module & Plugin
// ============================================================================

export interface OSModule {
  readonly name: string;
  register(container: DIContainer): void;
  boot?(): Promise<void>;
  shutdown?(): Promise<void>;
}

export interface OSPlugin {
  readonly name: string;
  register(container: DIContainer): void;
  boot?(): Promise<void>;
  shutdown?(): Promise<void>;
}

// ============================================================================
// OS Kernel Config
// ============================================================================

export interface OSKernelConfig {
  id: string;
  name: string;
  version: string;
  config?: Record<string, unknown>;
  hooks?: Record<string, unknown>;
}

// ============================================================================
// OS Kernel
// ============================================================================

export type OSKernelState = "created" | "initializing" | "ready" | "stopping" | "stopped";

export class OSKernel {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  protected readonly container: DIContainer;
  state: OSKernelState = "created";

  private readonly _config: Record<string, unknown>;
  private readonly _hooks: Record<string, unknown>;
  private modules: OSModule[] = [];
  private plugins: OSPlugin[] = [];

  constructor(config: OSKernelConfig) {
    this.id = config.id;
    this.name = config.name;
    this.version = config.version;
    this._config = config.config ?? {};
    this._hooks = config.hooks ?? {};
    this.container = new DIContainerImpl();
  }

  protected configureModules(): OSModule[] {
    return [];
  }

  protected configurePlugins(): OSPlugin[] {
    return [];
  }

  async boot(): Promise<void> {
    this.state = "initializing";

    this.modules = this.configureModules();
    this.plugins = this.configurePlugins();

    for (const module of this.modules) {
      module.register(this.container);
    }

    for (const plugin of this.plugins) {
      plugin.register(this.container);
    }

    for (const module of this.modules) {
      await module.boot?.();
    }

    for (const plugin of this.plugins) {
      await plugin.boot?.();
    }

    this.state = "ready";
  }

  async shutdown(): Promise<void> {
    this.state = "stopping";

    for (const module of this.modules) {
      await module.shutdown?.();
    }

    for (const plugin of this.plugins) {
      await plugin.shutdown?.();
    }

    this.state = "stopped";
  }

  async getHealth() {
    return { overall: "healthy" as const, state: this.state };
  }
}

// ============================================================================
// Command Bus
// ============================================================================

export interface Command<T = unknown> {
  readonly name: string;
  readonly payload: T;
  readonly subjectId?: string;
  readonly tenantId?: string;
  readonly correlationId?: string;
}

export interface CommandResult<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
}

export interface CommandHandler<TInput = unknown, TOutput = unknown> {
  (command: Command<TInput>): CommandResult<TOutput>;
}

export interface CommandContext {
  subjectId?: string;
  tenantId?: string;
  correlationId?: string;
}

export interface RegisteredCommand {
  readonly name: string;
  readonly description?: string;
  readonly input?: Record<string, unknown>;
  readonly output?: Record<string, unknown>;
  readonly auth?: { readonly required: boolean; readonly permissions?: readonly string[] };
  readonly audit: boolean;
  readonly idempotent: boolean;
  readonly async: boolean;
  readonly event?: string;
}

export class CommandRegistry {
  private readonly commands = new Map<string, RegisteredCommand>();
  private readonly handlers = new Map<string, CommandHandler>();

  registerBulk(commands: RegisteredCommand[]): void {
    for (const cmd of commands) {
      this.commands.set(cmd.name, cmd);
    }
  }

  registerHandler(name: string, handler: CommandHandler): void {
    this.handlers.set(name, handler);
  }

  get(name: string): RegisteredCommand | undefined {
    return this.commands.get(name);
  }

  getHandler(name: string): CommandHandler | undefined {
    return this.handlers.get(name);
  }

  get size(): number {
    return this.commands.size;
  }

  getAll(): RegisteredCommand[] {
    return Array.from(this.commands.values());
  }
}

export class CommandExecutor {
  constructor(private readonly registry: CommandRegistry) {}

  async run<TInput = unknown, TOutput = unknown>(
    name: string,
    payload: TInput,
    context?: CommandContext,
  ): Promise<CommandResult<TOutput>> {
    const handler = this.registry.getHandler(name) as CommandHandler<TInput, TOutput> | undefined;
    if (!handler) {
      throw new Error(`No handler registered for command: ${name}`);
    }

    const command: Command<TInput> = {
      name,
      payload,
      subjectId: context?.subjectId,
      tenantId: context?.tenantId,
      correlationId: context?.correlationId,
    };

    return handler(command);
  }
}

// ============================================================================
// API Registry
// ============================================================================

export interface RouteAuth {
  required: boolean;
  permissions?: readonly string[];
}

export interface ModelAction {
  type: "custom";
  name: string;
  method: HttpMethod;
  description?: string;
}

export interface CustomAction {
  name: string;
  method: HttpMethod;
  description?: string;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ModelRoutesConfig {
  osName: string;
  modelName: string;
  pluralName: string;
  actions: (string | CustomAction)[];
  basePath: string;
  fields?: Record<string, import("@appneurox/schemas").FieldDefinition>;
  auth: RouteAuth;
}

export interface APIRoute {
  path: string;
  method: string;
  description?: string;
  auth: RouteAuth;
  tags: string[];
  osName: string;
  modelName: string;
}

export class APIRegistry {
  private readonly routes: APIRoute[] = [];

  registerModelRoutes(config: ModelRoutesConfig): void {
    for (const action of config.actions) {
      const actionName = typeof action === "string" ? action : action.name;
      const method = typeof action === "string"
        ? getDefaultMethod(action)
        : action.method;
      const path = buildRoutePath(config.pluralName, actionName);

      this.routes.push({
        path: `${config.basePath}${path}`,
        method,
        description: typeof action === "string" ? undefined : action.description,
        auth: config.auth,
        tags: [`${config.osName}.${config.modelName}`],
        osName: config.osName,
        modelName: config.modelName,
      });
    }
  }

  getAllRoutes(): APIRoute[] {
    return [...this.routes];
  }

  get size(): number {
    return this.routes.length;
  }
}

function getDefaultMethod(action: string): string {
  switch (action) {
    case "create": return "POST";
    case "list": return "GET";
    case "read": return "GET";
    case "update": return "PATCH";
    case "delete": return "DELETE";
    default: return "POST";
  }
}

function buildRoutePath(pluralName: string, action: string): string {
  switch (action) {
    case "create": return `/${pluralName}`;
    case "list": return `/${pluralName}`;
    case "read": return `/${pluralName}/{id}`;
    case "update": return `/${pluralName}/{id}`;
    case "delete": return `/${pluralName}/{id}`;
    default: return `/${pluralName}/{id}/${action}`;
  }
}

// ============================================================================
// OpenAPI Generator
// ============================================================================

export interface OpenAPIGeneratorConfig {
  title: string;
  version: string;
  description?: string;
  servers?: { url: string }[];
}

export interface OpenAPIDocument {
  openapi: string;
  info: { title: string; version: string; description?: string };
  servers?: { url: string }[];
  paths: Record<string, Record<string, unknown>>;
}

export class OpenAPIGenerator {
  constructor(private readonly config: OpenAPIGeneratorConfig) {}

  generate(registry: APIRegistry): OpenAPIDocument {
    const paths: Record<string, Record<string, unknown>> = {};

    for (const route of registry.getAllRoutes()) {
      const method = route.method.toLowerCase();
      if (!paths[route.path]) {
        paths[route.path] = {};
      }
      paths[route.path][method] = {
        summary: route.description ?? `${route.method} ${route.path}`,
        tags: route.tags,
        responses: { "200": { description: "Success" } },
      };
    }

    return {
      openapi: "3.0.3",
      info: {
        title: this.config.title,
        version: this.config.version,
        description: this.config.description,
      },
      servers: this.config.servers,
      paths,
    };
  }
}
