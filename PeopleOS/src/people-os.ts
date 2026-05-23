import {
  OSKernel,
  type OSModule,
  type OSPlugin,
  type OSKernelConfig,
  InjectionToken,
  CommandRegistry,
  CommandExecutor,
  APIRegistry,
  OpenAPIGenerator,
  type ModelRoutesConfig,
  type ModelAction,
  type CustomAction,
  type RouteAuth,
} from "./kernel.js";
import type { OSManifest } from "@appneurox/schemas";
import { peopleManifest } from "./manifest.js";
import { peopleCommandHandlers } from "./people-handlers.js";

// ============================================================================
// Command Module
// ============================================================================

export const COMMAND_REGISTRY_TOKEN = new InjectionToken<CommandRegistry>("PeopleCommandRegistry");
export const COMMAND_EXECUTOR_TOKEN = new InjectionToken<CommandExecutor>("PeopleCommandExecutor");

interface ManifestCommand {
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

function toRegisteredCommand(cmd: ManifestCommand) {
  return {
    name: cmd.name,
    description: cmd.description,
    input: cmd.input as Record<string, unknown> | undefined,
    output: cmd.output as Record<string, unknown> | undefined,
    auth: cmd.auth,
    audit: cmd.audit,
    idempotent: cmd.idempotent,
    async: cmd.async,
    event: cmd.event,
  };
}

class PeopleCommandModule implements OSModule {
  readonly name = "people-commands";

  register(container: import("./kernel.js").DIContainer): void {
    const registry = new CommandRegistry();
    const executor = new CommandExecutor(registry);

    const commands: ManifestCommand[] = (peopleManifest.commands ?? []) as ManifestCommand[];
    registry.registerBulk(commands.map(toRegisteredCommand));

    Array.from(peopleCommandHandlers.entries()).forEach(([name, handler]) => {
      registry.registerHandler(name, handler);
    });

    container.bind(COMMAND_REGISTRY_TOKEN).toValue(registry);
    container.bind(COMMAND_EXECUTOR_TOKEN).toValue(executor);
  }

  async boot(): Promise<void> {}
  async shutdown(): Promise<void> {}
}

// ============================================================================
// API Module
// ============================================================================

export const PEOPLE_API_REGISTRY_TOKEN = new InjectionToken<APIRegistry>("PeopleAPIRegistry");
export const PEOPLE_OPENAPI_GENERATOR_TOKEN = new InjectionToken<OpenAPIGenerator>("PeopleOpenAPIGenerator");

interface ManifestEndpoint {
  readonly path: string;
  readonly method: string;
  readonly description?: string;
  readonly auth?: { readonly required: boolean; readonly permissions?: readonly string[] };
  readonly tags?: readonly string[];
}

function buildModelRoutesFromManifest(): ModelRoutesConfig[] {
  const basePath = peopleManifest.api?.basePath ?? "/v1/people";
  const configs: ModelRoutesConfig[] = [];

  const models = peopleManifest.models ?? [];
  const endpoints: ManifestEndpoint[] = (peopleManifest.api?.endpoints ?? []) as ManifestEndpoint[];

  for (const model of models) {
    const modelName = model.name;
    const pluralName = modelName.toLowerCase() + "s";
    const defaultAuth: RouteAuth = { required: true };

    const modelEndpoints = endpoints.filter((ep) => {
      const tag = ep.tags?.[0];
      return tag === pluralName || tag === modelName.toLowerCase();
    });

    const actions: ModelAction[] = [];

    for (const endpoint of modelEndpoints) {
      const m = endpoint.method.toUpperCase();
      if (m === "POST" && endpoint.path === `/${pluralName}`) {
        actions.push("create" as ModelAction);
      } else if (m === "GET" && endpoint.path === `/${pluralName}`) {
        actions.push("list" as ModelAction);
      } else if (m === "GET" && endpoint.path.includes("{id}")) {
        actions.push("read" as ModelAction);
      } else if (m === "PATCH" && endpoint.path.includes("{id}")) {
        actions.push("update" as ModelAction);
      } else if (m === "DELETE" && endpoint.path.includes("{id}")) {
        actions.push("delete" as ModelAction);
      } else if (m === "POST" && endpoint.path.includes("{id}")) {
        const parts = endpoint.path.split("/");
        const lastPart = parts[parts.length - 1];
        if (lastPart && lastPart !== "{id}") {
          const customAction: CustomAction = {
            name: lastPart,
            method: "POST" as const,
            description: endpoint.description,
          };
          actions.push(customAction as ModelAction);
        }
      }
    }

    const seen = new Set<string>();
    const uniqueActions: ModelAction[] = [];
    for (const action of actions) {
      const key = typeof action === "string" ? action : (action as CustomAction).name;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueActions.push(action);
      }
    }

    if (uniqueActions.length > 0) {
      configs.push({
        osName: peopleManifest.namespace,
        modelName,
        pluralName,
        actions: uniqueActions as (string | CustomAction)[],
        basePath,
        fields: model.fields as Record<string, import("@appneurox/schemas").FieldDefinition> | undefined,
        auth: defaultAuth,
      });
    }
  }

  return configs;
}

class PeopleApiModule implements OSModule {
  readonly name = "people-api";

  register(container: import("./kernel.js").DIContainer): void {
    const registry = new APIRegistry();

    const modelRoutes = buildModelRoutesFromManifest();
    for (const config of modelRoutes) {
      registry.registerModelRoutes(config);
    }

    const generator = new OpenAPIGenerator({
      title: `${peopleManifest.name} API`,
      version: peopleManifest.version,
      description: peopleManifest.description,
      servers: [{ url: peopleManifest.api?.basePath ?? "/v1/people" }],
    });

    container.bind(PEOPLE_API_REGISTRY_TOKEN).toValue(registry);
    container.bind(PEOPLE_OPENAPI_GENERATOR_TOKEN).toValue(generator);
  }

  async boot(): Promise<void> {}
  async shutdown(): Promise<void> {}
}

// ============================================================================
// PeopleOS Kernel
// ============================================================================

export class PeopleOS extends OSKernel {
  static readonly manifest: OSManifest = peopleManifest;

  constructor(config?: Partial<Omit<OSKernelConfig, "name">>) {
    super({
      id: config?.id ?? peopleManifest.id,
      name: peopleManifest.name,
      version: config?.version ?? peopleManifest.version,
      config: config?.config,
      hooks: config?.hooks,
    });
  }

  protected configureModules(): OSModule[] {
    return [new PeopleCommandModule(), new PeopleApiModule()];
  }

  protected configurePlugins(): OSPlugin[] {
    return [];
  }

  getCommandRegistry(): CommandRegistry {
    return this.container.get(COMMAND_REGISTRY_TOKEN);
  }

  getCommandExecutor(): CommandExecutor {
    return this.container.get(COMMAND_EXECUTOR_TOKEN);
  }

  getAPIRegistry(): APIRegistry {
    return this.container.get(PEOPLE_API_REGISTRY_TOKEN);
  }

  getOpenAPIGenerator(): OpenAPIGenerator {
    return this.container.get(PEOPLE_OPENAPI_GENERATOR_TOKEN);
  }

  generateOpenAPI() {
    return this.getOpenAPIGenerator().generate(this.getAPIRegistry());
  }
}
