import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { GeneratedToolPackage, ToolPackageGeneratorInput } from "./types";
import { ToolManifest } from "../core/domain";
import { assertValidToolManifest } from "../manifest/tool-manifest";

export class ToolPackageGenerator {
  generate(input: ToolPackageGeneratorInput | unknown, outputRoot?: string): GeneratedToolPackage {
    const normalized = normalizeInput(isToolPackageGeneratorInput(input) ? input : fromManifest(assertValidToolManifest(input), outputRoot));
    const rootDir = join(normalized.outputRoot ?? join(process.cwd(), "packages", "tools"), normalized.toolId);
    const files: string[] = [];
    const manifest = createManifest(normalized);

    const write = (relativePath: string, content: string) => {
      const target = join(rootDir, relativePath);
      mkdirSync(join(target, ".."), { recursive: true });
      writeFileSync(target, content);
      files.push(relativePath);
    };

    write("manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
    write("package.json", packageJson(normalized));
    write("tsconfig.json", tsconfig());
    write("README.md", readme(normalized));
    write("src/index.ts", indexSource(normalized));
    write("src/core/index.ts", coreSource(normalized));
    write(`src/core/${normalized.toolId}.ts`, coreSource(normalized));
    write("src/schemas/index.ts", schemasSource(normalized));
    write("src/schemas/input.schema.ts", inputSchemaSource(normalized));
    write("src/schemas/output.schema.ts", outputSchemaSource(normalized));
    write("src/api/index.ts", apiSource(normalized));
    write("src/api/routes.ts", apiSource(normalized));
    write("src/sdk/index.ts", sdkSource(normalized));
    write("src/sdk/client.ts", sdkSource(normalized));
    write("src/cli/index.ts", cliSource(normalized));
    write("src/cli/command.ts", cliSource(normalized));
    write("src/commands/index.ts", commandsSource(normalized));
    write("src/commands/command.definition.ts", commandsSource(normalized));
    write("src/events/index.ts", eventsSource(normalized));
    write("src/events/events.ts", eventsSource(normalized));
    write("src/permissions/index.ts", permissionsSource(normalized));
    write("src/permissions/permissions.ts", permissionsSource(normalized));
    write("src/adapters/index.ts", adaptersSource(normalized));
    write("src/adapters/adapters.ts", adaptersSource(normalized));
    if (isValidatorTool(normalized)) {
      write("src/rules/index.ts", rulesSource(normalized));
      write("src/rules/rules.ts", rulesSource(normalized));
    }
    if (isGeneratorTool(normalized)) {
      write("src/templates/index.ts", templatesSource(normalized));
      write("src/templates/templates.ts", templatesSource(normalized));
    }
    if (isExternalApi(normalized)) {
      write("src/providers/index.ts", providersSource(normalized));
      write("src/providers/providers.ts", providersSource(normalized));
    }
    if (normalized.aiLevel !== "none") {
      write("src/ai/index.ts", aiSource(normalized));
      write("src/ai/optional-ai-layer.ts", aiSource(normalized));
    }
    write("tests/unit.test.cjs", unitTestSource(normalized));
    if (isDeterministic(normalized)) {
      write("tests/snapshot.test.cjs", snapshotTestSource(normalized));
      write("tests/error.test.cjs", errorTestSource(normalized));
      write("tests/no-ai.test.cjs", noAITestSource(normalized));
    }
    if (isHybrid(normalized)) write("tests/ai.test.cjs", aiTestSource(normalized));
    if (isExternalApi(normalized)) write("tests/provider.test.cjs", providerTestSource(normalized));
    if (isGeneratorTool(normalized)) write("tests/generator.test.cjs", generatorToolTestSource(normalized));
    if (isValidatorTool(normalized)) write("tests/validator.test.cjs", validatorToolTestSource(normalized));
    write("tests/contract.test.cjs", contractTestSource(normalized));
    write("tests/schema.test.cjs", schemaTestSource(normalized));
    write("tests/manifest.test.cjs", manifestTestSource(normalized));
    write("tests/api.test.cjs", apiTestSource(normalized));
    write("tests/sdk.test.cjs", sdkTestSource(normalized));
    write("tests/cli.test.cjs", cliTestSource(normalized));
    write("tests/permission.test.cjs", permissionTestSource(normalized));
    write("tests/e2e.test.cjs", e2eTestSource(normalized));
    write("tests/docs.test.cjs", docsTestSource(normalized));
    write("docs/usage.md", docsSource(normalized));
    write("docs/api.md", apiDocsSource(normalized));
    write("docs/sdk.md", sdkDocsSource(normalized));
    write("docs/cli.md", cliDocsSource(normalized));

    return { rootDir, files, manifest };
  }
}

function isToolPackageGeneratorInput(input: unknown): input is ToolPackageGeneratorInput {
  return typeof input === "object" && input !== null && "toolId" in input;
}

function fromManifest(manifest: ToolManifest, outputRoot?: string): ToolPackageGeneratorInput {
  return {
    toolId: manifest.id,
    name: manifest.name,
    category: manifest.category,
    type: mapManifestType(manifest.type),
    aiLevel: manifest.aiSupport.enabled ? "optional" : "none",
    commandName: manifest.commands[0],
    permissionName: manifest.permissions[0],
    inputSchema: manifest.inputSchema as Record<string, string>,
    outputSchema: manifest.outputSchema as Record<string, string>,
    sdkNamespace: stripAppToolsPrefix(stripToolsPrefix(manifest.sdk.namespace)),
    cliNamespace: manifest.cli.namespace,
    usedBy: manifest.usedBy,
    outputRoot
  };
}

function mapManifestType(type: string): ToolPackageGeneratorInput["type"] {
  if (type === "worker" || type === "ui" || type === "api" || type === "sdk" || type === "cli" || type === "core") return "deterministic";
  if (type === "connector") return "connector";
  if (type === "validator") return "validator";
  if (type === "generator") return "generator";
  if (type === "hybrid") return "hybrid";
  return "deterministic";
}

function stripToolsPrefix(value: string): string {
  return value.startsWith("tools.") ? value.slice("tools.".length) : value;
}

function stripAppToolsPrefix(value: string): string {
  return value.startsWith("app.tools.") ? value.slice("app.tools.".length) : value;
}

function normalizeInput(input: ToolPackageGeneratorInput): ToolPackageGeneratorInput {
  const toolId = normalizeToolId(input.toolId);
  const type = input.type || "deterministic";
  return {
    ...input,
    toolId,
    name: input.name || titleFromId(toolId),
    category: input.category || "utility",
    type,
    aiLevel: input.aiLevel || "none",
    commandName: input.commandName || `tool.${toolId}.run`,
    permissionName: input.permissionName || `tools.${toolId}.run`,
    inputSchema: input.inputSchema ?? (type === "generator" ? { outputDir: "string", blueprint: "object?", manifest: "object?", schema: "object?", dryRun: "boolean?", force: "boolean?" } : type === "validator" ? { payload: "object", rules: "array?", mode: "string?" } : { value: "string" }),
    outputSchema: input.outputSchema ?? (type === "generator" ? { dryRun: "boolean", generatedFiles: "array", skippedFiles: "array", outputDir: "string" } : type === "validator" ? { valid: "boolean", score: "number?", issues: "array", warnings: "array", suggestions: "array?" } : { ok: "boolean" }),
    sdkNamespace: input.sdkNamespace || toolId.replace(/-/g, "."),
    cliNamespace: input.cliNamespace || toolId,
    usedBy: input.usedBy ?? (input.aiLevel === "none" ? ["ToolOS", "CommandOS", "DeveloperOS"] : ["ToolOS", "CommandOS", "DeveloperOS", "AIOS", "AgenticOS"])
  };
}

function createManifest(input: ToolPackageGeneratorInput) {
  const aiEnabled = input.aiLevel !== "none";
  const aiRequired = input.aiLevel === "required";
  return {
    id: input.toolId,
    name: input.name,
    packageName: `@appneurox/tool-${input.toolId}`,
    version: "1.0.0",
    description: `${input.name} APPNEUROX tool package.`,
    category: input.category,
    type: manifestToolType(input),
    ai: {
      enabled: aiEnabled,
      required: aiRequired,
      level: aiRequired ? 2 : aiEnabled ? 1 : 0,
      provider: aiEnabled ? "AIOS" : undefined
    },
    aiSupport: {
      enabled: aiEnabled,
      level: input.aiLevel,
      required: aiRequired,
      mode: input.type === "hybrid" ? "hybrid" : input.aiLevel === "none" ? "none" : "ai",
      toolName: input.toolId,
      description: input.aiLevel === "none" ? undefined : `${input.name} can be exposed to AIOS and AgenticOS.`
    },
    modes: aiEnabled ? ["standalone", "platform", "agent-tool"] : ["standalone", "platform"],
    inputSchema: input.inputSchema,
    outputSchema: input.outputSchema,
    inputs: schemaFields(input.inputSchema),
    outputs: schemaFields(input.outputSchema),
    commands: [input.commandName],
    permissions: [input.permissionName],
    events: {
      publishes: [`tool.${input.toolId}.completed`, `tool.${input.toolId}.failed`],
      subscribes: []
    },
    api: {
      basePath: `/v1/tools/${input.toolId}`,
      route: `/v1/tools/${input.toolId}/execute`
    },
    sdk: {
      namespace: `app.tools.${input.sdkNamespace}`
    },
    cli: {
      namespace: `appneurox tools ${input.cliNamespace}`
    },
    dependencies: {
      required: ["@appneurox/toolos"],
      optional: input.aiLevel === "none" ? [] : ["@appneurox/aios", "@appneurox/agenticos"],
      external: isExternalApi(input) ? ["mock-provider"] : []
    },
    provider: isExternalApi(input) ? {
      configurable: true,
      hardcodedProvider: false,
      timeoutMs: 5000,
      retry: {
        attempts: 2,
        backoffMs: 100
      },
      rateLimit: {
        enabled: false,
        placeholder: true
      },
      cache: {
        optional: true
      }
    } : undefined,
    safety: {
      riskLevel: input.type === "connector" || input.aiLevel === "required" ? "medium" : "low",
      requiresApproval: false,
      sensitiveData: false,
      allowedForAgents: input.aiLevel !== "required",
      rateLimit: {
        enabled: true,
        maxRequests: 120,
        windowSeconds: 60
      },
      rules: ["validate_input_schema", "validate_output_schema", "track_usage"]
    },
    usedBy: input.usedBy
  };
}

function manifestToolType(input: ToolPackageGeneratorInput) {
  if (input.type === "connector") return "external-api";
  return input.type;
}

function schemaFields(schema: Record<string, string>) {
  return Object.entries(schema).map(([name, rawType]) => {
    const type = rawType.replace(/\?$/, "");
    return {
      name,
      type: type === "array" || type === "object" || type === "number" || type === "boolean" || type === "string" ? type : "json",
      required: !rawType.endsWith("?")
    };
  });
}

function packageJson(input: ToolPackageGeneratorInput): string {
  return `${JSON.stringify({
    name: `@appneurox/tool-${input.toolId}`,
    version: "1.0.0",
    description: `${input.name} APPNEUROX tool package.`,
    type: "module",
    main: "dist/index.js",
    types: "dist/index.d.ts",
    bin: {
      [input.cliNamespace.replace(/\s+/g, "-")]: "./dist/cli/command.js"
    },
    scripts: {
      build: "tsc -p tsconfig.json",
      test: "npm run build && node --experimental-strip-types --test tests/*.test.ts",
      cli: "node dist/cli/command.js"
    },
    license: "MIT",
    engines: { node: ">=22" },
    dependencies: {
      zod: "^3.25.76",
      hono: "^4.7.0"
    },
    devDependencies: {
      "@types/node": "^22.7.5",
      typescript: "^5.6.3"
    },
    appneurox: {
      tool: input.toolId,
      manifest: "./manifest.json",
      modes: ["standalone", "platform"]
    }
  }, null, 2)}\n`;
}

function tsconfig(): string {
  return `${JSON.stringify({
    compilerOptions: {
      target: "ES2022",
      module: "CommonJS",
      moduleResolution: "node",
      rootDir: "src",
      outDir: "dist",
      strict: true,
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
      skipLibCheck: true
    },
    include: ["src/**/*.ts"]
  }, null, 2)}\n`;
}

function readme(input: ToolPackageGeneratorInput): string {
  return `# ${input.name}\n\nPackage: \`@appneurox/tool-${input.toolId}\`\n\nGenerated APPNEUROX tool package for standalone usage and PlatformOS / ToolOS integration.\n\n## Contract\n\n- Tool ID: \`${input.toolId}\`\n- Category: \`${input.category}\`\n- Type: \`${input.type}\`\n- Command: \`${input.commandName}\`\n- Permission: \`${input.permissionName}\`\n- SDK namespace: \`app.tools.${input.sdkNamespace}\`\n- CLI namespace: \`appneurox tools ${input.cliNamespace}\`\n- AI level: \`${input.aiLevel}\`\n- Used by: \`${input.usedBy?.join(", ")}\`\n\n## Test\n\n\`\`\`bash\npnpm build\npnpm test\n\`\`\`\n\nThis package also works with \`npm run build\` and \`npm test\`.\n`;
}

function indexSource(input: ToolPackageGeneratorInput): string {
  return `export * from "./core";\nexport * from "./schemas/input.schema.js";\nexport * from "./schemas/output.schema.js";\nexport * from "./api";\nexport * from "./sdk";\nexport * from "./commands";\nexport * from "./events";\nexport * from "./permissions";\nexport * from "./adapters";\n${isValidatorTool(input) ? 'export * from "./rules";\n' : ""}${isGeneratorTool(input) ? 'export * from "./templates";\n' : ""}${isExternalApi(input) ? 'export * from "./providers";\n' : ""}${input.aiLevel !== "none" ? 'export * from "./ai";\n' : ""}`;
}

function coreSource(input: ToolPackageGeneratorInput): string {
  if (isValidatorTool(input)) return validatorCoreSource(input);
  if (isGeneratorTool(input)) return generatorCoreSource(input);
  if (isExternalApi(input)) return externalApiCoreSource(input);
  return `import { emitToolEvent, toolEvents } from "../events";\nimport { assertPermission, ToolRuntimeContext } from "../permissions";\nimport { inputSchema } from "../schemas";\nimport { outputSchema } from "../schemas";\n\nexport class ${className(input)}Tool {\n  readonly id = "${input.toolId}";\n  readonly commandName = "${input.commandName}";\n\n  execute(input: Record<string, unknown>, context: ToolRuntimeContext = {}) {\n    const startedAt = Date.now();\n    assertPermission(context);\n    const parsedInput = inputSchema.parse(input);\n    const deterministicOutput = outputSchema.parse(this.run(parsedInput));\n    const output = outputSchema.parse(context.useAI ? this.enhanceWithAI(parsedInput, deterministicOutput, context) : deterministicOutput);\n    emitToolEvent(context, toolEvents.completed, {\n      toolId: this.id,\n      commandName: this.commandName,\n      mode: context.useAI ? "ai" : "deterministic",\n      input: parsedInput,\n      output\n    });\n    context.trackAnalytics?.({\n      toolId: this.id,\n      commandName: this.commandName,\n      status: "succeeded",\n      durationMs: Date.now() - startedAt\n    });\n    return output;\n  }\n\n  private run(input: Record<string, unknown>) {\n    void input;\n    return {\n${Object.entries(input.outputSchema).map(([key, type]) => `      ${JSON.stringify(key)}: ${JSON.stringify(sampleValue(type, input))},`).join("\n")}\n    };\n  }\n\n  private enhanceWithAI(input: Record<string, unknown>, deterministicOutput: Record<string, unknown>, context: ToolRuntimeContext) {\n    if (!context.aiProvider) throw new Error("AI mode requested but no AIOS provider was supplied");\n    return context.aiProvider.enhanceToolOutput({\n      toolId: this.id,\n      commandName: this.commandName,\n      input,\n      deterministicOutput\n    });\n  }\n}\n\nexport function execute(input: Record<string, unknown>, context: ToolRuntimeContext = {}) {\n  return new ${className(input)}Tool().execute(input, context);\n}\n`;
}

function validatorCoreSource(input: ToolPackageGeneratorInput): string {
  return `import { emitToolEvent, toolEvents } from "../events";\nimport { assertPermission, ToolRuntimeContext } from "../permissions";\nimport { runRules } from "../rules";\nimport { inputSchema, outputSchema } from "../schemas";\n\nexport class ${className(input)}Tool {\n  readonly id = "${input.toolId}";\n  readonly commandName = "${input.commandName}";\n\n  execute(input: Record<string, unknown>, context: ToolRuntimeContext = {}) {\n    const startedAt = Date.now();\n    assertPermission(context);\n    const parsedInput = inputSchema.parse(input);\n    const result = outputSchema.parse(runRules(parsedInput));\n    emitToolEvent(context, toolEvents.completed, {\n      toolId: this.id,\n      commandName: this.commandName,\n      valid: result.valid,\n      issueCount: result.issues.length,\n      warningCount: result.warnings.length\n    });\n    context.trackAnalytics?.({\n      toolId: this.id,\n      commandName: this.commandName,\n      status: "succeeded",\n      durationMs: Date.now() - startedAt\n    });\n    return result;\n  }\n}\n\nexport function execute(input: Record<string, unknown>, context: ToolRuntimeContext = {}) {\n  return new ${className(input)}Tool().execute(input, context);\n}\n`;
}

function generatorCoreSource(input: ToolPackageGeneratorInput): string {
  return `import { existsSync, mkdirSync, writeFileSync } from "fs";\nimport { dirname, join, normalize, relative } from "path";\nimport { emitToolEvent, toolEvents } from "../events";\nimport { assertPermission, ToolRuntimeContext } from "../permissions";\nimport { inputSchema, outputSchema } from "../schemas";\nimport { renderDefaultFiles } from "../templates";\n\nexport class ${className(input)}Tool {\n  readonly id = "${input.toolId}";\n  readonly commandName = "${input.commandName}";\n\n  execute(input: Record<string, unknown>, context: ToolRuntimeContext = {}) {\n    const startedAt = Date.now();\n    assertPermission(context);\n    const parsedInput = inputSchema.parse(input);\n    const files = this.planFiles(parsedInput);\n    const generatedFiles: string[] = [];\n    const skippedFiles: string[] = [];\n\n    for (const file of files) {\n      const target = safeJoin(parsedInput.outputDir, file.path);\n      generatedFiles.push(file.path);\n      if (parsedInput.dryRun) continue;\n      if (existsSync(target) && !parsedInput.force) {\n        throw new Error(\`Refusing to overwrite existing file: \${file.path}\`);\n      }\n      mkdirSync(dirname(target), { recursive: true });\n      writeFileSync(target, file.content);\n    }\n\n    const output = outputSchema.parse({\n      dryRun: parsedInput.dryRun,\n      generatedFiles,\n      skippedFiles,\n      outputDir: parsedInput.outputDir\n    });\n    emitToolEvent(context, toolEvents.completed, {\n      toolId: this.id,\n      commandName: this.commandName,\n      dryRun: output.dryRun,\n      generatedFiles: output.generatedFiles\n    });\n    context.trackAnalytics?.({\n      toolId: this.id,\n      commandName: this.commandName,\n      status: "succeeded",\n      durationMs: Date.now() - startedAt\n    });\n    return output;\n  }\n\n  private planFiles(input: ReturnType<typeof inputSchema.parse>) {\n    const blueprintFiles = input.blueprint?.files;\n    const files = blueprintFiles ?? renderDefaultFiles({\n      manifest: input.manifest,\n      schema: input.schema,\n      blueprint: input.blueprint\n    });\n    return Object.entries(files)\n      .sort(([left], [right]) => left.localeCompare(right))\n      .map(([path, content]) => ({ path, content: String(content) }));\n  }\n}\n\nexport function execute(input: Record<string, unknown>, context: ToolRuntimeContext = {}) {\n  return new ${className(input)}Tool().execute(input, context);\n}\n\nfunction safeJoin(rootDir: string, relativePath: string) {\n  const target = normalize(join(rootDir, relativePath));\n  const escaped = relative(rootDir, target).startsWith("..");\n  if (escaped) throw new Error(\`Unsafe output path: \${relativePath}\`);\n  return target;\n}\n`;
}

function externalApiCoreSource(input: ToolPackageGeneratorInput): string {
  return `import { emitToolEvent, toolEvents } from "../events";\nimport { assertPermission, ToolRuntimeContext } from "../permissions";\nimport { executeWithRetry, mockExternalProvider, normalizeExternalError, validateProviderConfig, withTimeout } from "../providers";\nimport { inputSchema, outputSchema } from "../schemas";\n\nexport class ${className(input)}Tool {\n  readonly id = "${input.toolId}";\n  readonly commandName = "${input.commandName}";\n\n  async execute(input: Record<string, unknown>, context: ToolRuntimeContext = {}) {\n    const startedAt = Date.now();\n    assertPermission(context);\n    const parsedInput = inputSchema.parse(input);\n    const provider = context.externalProvider ?? mockExternalProvider;\n    const providerConfig = validateProviderConfig(context.providerConfig ?? {});\n    const cacheKey = \`\${this.id}:\${JSON.stringify(parsedInput)}\`;\n    const cached = await context.cache?.get(cacheKey);\n    if (cached) return outputSchema.parse(cached);\n\n    try {\n      const rawOutput = await executeWithRetry(\n        () => withTimeout(provider.execute(parsedInput, providerConfig), providerConfig.timeoutMs),\n        providerConfig.retry\n      );\n      const output = outputSchema.parse(rawOutput);\n      await context.cache?.set(cacheKey, output, providerConfig.cacheTtlMs);\n      emitToolEvent(context, toolEvents.completed, {\n        toolId: this.id,\n        commandName: this.commandName,\n        provider: provider.name,\n        input: parsedInput,\n        output\n      });\n      context.trackAnalytics?.({\n        toolId: this.id,\n        commandName: this.commandName,\n        status: "succeeded",\n        durationMs: Date.now() - startedAt\n      });\n      return output;\n    } catch (error) {\n      const normalized = normalizeExternalError(error);\n      emitToolEvent(context, toolEvents.failed, {\n        toolId: this.id,\n        commandName: this.commandName,\n        error: normalized\n      });\n      context.trackAnalytics?.({\n        toolId: this.id,\n        commandName: this.commandName,\n        status: "failed",\n        durationMs: Date.now() - startedAt\n      });\n      throw normalized;\n    }\n  }\n}\n\nexport async function execute(input: Record<string, unknown>, context: ToolRuntimeContext = {}) {\n  return new ${className(input)}Tool().execute(input, context);\n}\n`;
}

function schemasSource(_input: ToolPackageGeneratorInput): string {
  return `export * from "./input.schema";\nexport * from "./output.schema";\n`;
}

function inputSchemaSource(input: ToolPackageGeneratorInput): string {
  if (isValidatorTool(input)) {
    return `import { z } from "zod";\n\nexport const inputSchemaDefinition = {\n  payload: "object",\n  rules: "array?",\n  mode: "string?"\n} as const;\n\nexport const validationRuleSchema = z.object({\n  field: z.string().min(1),\n  required: z.boolean().optional(),\n  type: z.enum(["string", "number", "boolean", "object", "array"]).optional(),\n  minLength: z.number().int().min(0).optional(),\n  message: z.string().optional(),\n  severity: z.enum(["issue", "warning"]).default("issue")\n}).strict();\n\nexport const inputSchema = z.object({\n  payload: z.record(z.unknown()),\n  rules: z.array(validationRuleSchema).default([]),\n  mode: z.enum(["strict", "soft"]).default("soft")\n}).strict();\n\nexport type ${className(input)}Input = z.infer<typeof inputSchema>;\n`;
  }
  if (isGeneratorTool(input)) {
    return `import { z } from "zod";\n\nexport const inputSchemaDefinition = {\n  manifest: "object?",\n  schema: "object?",\n  blueprint: "object?",\n  outputDir: "string",\n  dryRun: "boolean?",\n  force: "boolean?"\n} as const;\n\nexport const fileMapSchema = z.record(z.string().min(1), z.string());\n\nexport const inputSchema = z.object({\n  manifest: z.record(z.unknown()).optional(),\n  schema: z.record(z.unknown()).optional(),\n  blueprint: z.object({\n    name: z.string().min(1),\n    files: fileMapSchema.optional()\n  }).strict().optional(),\n  outputDir: z.string().min(1),\n  dryRun: z.boolean().default(false),\n  force: z.boolean().default(false)\n}).strict();\n\nexport type ${className(input)}Input = z.infer<typeof inputSchema>;\n`;
  }
  return `import { z } from "zod";\n\nexport const inputSchemaDefinition = ${JSON.stringify(input.inputSchema, null, 2)} as const;\n\nexport const inputSchema = z.object({\n${zodObjectSource(input.inputSchema)}\n});\n${isExternalApi(input) ? '\nexport const providerConfigSchema = z.object({\n  baseUrl: z.string().url().optional(),\n  apiKey: z.string().optional(),\n  timeoutMs: z.number().int().positive().default(5000),\n  retry: z.object({\n    attempts: z.number().int().min(0).max(5).default(2),\n    backoffMs: z.number().int().min(0).default(100)\n  }).default({ attempts: 2, backoffMs: 100 }),\n  rateLimitKey: z.string().optional(),\n  cacheTtlMs: z.number().int().min(0).optional()\n});\n' : ""}\nexport type ${className(input)}Input = z.infer<typeof inputSchema>;\n`;
}

function outputSchemaSource(input: ToolPackageGeneratorInput): string {
  if (isValidatorTool(input)) {
    return `import { z } from "zod";\n\nexport const outputSchemaDefinition = {\n  valid: "boolean",\n  score: "number?",\n  issues: "array",\n  warnings: "array",\n  suggestions: "array?"\n} as const;\n\nexport const validationMessageSchema = z.object({\n  path: z.string(),\n  code: z.string(),\n  message: z.string()\n}).strict();\n\nexport const outputSchema = z.object({\n  valid: z.boolean(),\n  score: z.number().min(0).max(1).optional(),\n  issues: z.array(validationMessageSchema),\n  warnings: z.array(validationMessageSchema),\n  suggestions: z.array(z.string()).optional()\n}).strict();\n\nexport type ${className(input)}Output = z.infer<typeof outputSchema>;\n`;
  }
  if (isGeneratorTool(input)) {
    return `import { z } from "zod";\n\nexport const outputSchemaDefinition = {\n  dryRun: "boolean",\n  generatedFiles: "array",\n  skippedFiles: "array",\n  outputDir: "string"\n} as const;\n\nexport const outputSchema = z.object({\n  dryRun: z.boolean(),\n  generatedFiles: z.array(z.string()),\n  skippedFiles: z.array(z.string()),\n  outputDir: z.string()\n}).strict();\n\nexport type ${className(input)}Output = z.infer<typeof outputSchema>;\n`;
  }
  return `import { z } from "zod";\n\nexport const outputSchemaDefinition = ${JSON.stringify(input.outputSchema, null, 2)} as const;\n\nexport const outputSchema = z.object({\n${zodObjectSource(input.outputSchema)}\n});\n\nexport type ${className(input)}Output = z.infer<typeof outputSchema>;\n`;
}

function apiSource(input: ToolPackageGeneratorInput): string {
  return `import { Hono } from "hono";\nimport { execute } from "../core";\nimport { ToolRuntimeContext } from "../permissions";\n\nexport const route = "/v1/tools/${input.toolId}/execute";\n\nexport function handleRequest(body: Record<string, unknown>, context: ToolRuntimeContext = {}) {\n  return execute(body, { ...context, enforcePermissions: true });\n}\n\nexport function createApp(): Hono {\n  const app = new Hono();\n  app.get("/health", (c) => c.json({ status: "ok", toolId: "${input.toolId}" }));\n  app.post("/execute", async (c) => {\n    const body = await c.req.json();\n    const output = handleRequest(body, { enforcePermissions: true });\n    return c.json(output);\n  });\n  return app;\n}\n`;
}

function sdkSource(input: ToolPackageGeneratorInput): string {
  return `import { execute } from "../core";\nimport { ToolRuntimeContext } from "../permissions";\n\nexport const namespace = "app.tools.${input.sdkNamespace}";\n\nexport class ${className(input)}Client {\n  constructor(private readonly context: ToolRuntimeContext = {}) {}\n\n  execute(input: Record<string, unknown>) {\n    return execute(input, this.context);\n  }\n}\n`;
}

function cliSource(input: ToolPackageGeneratorInput): string {
  if (isGeneratorTool(input)) {
    return `#!/usr/bin/env node\nimport { execute } from "../core";\n\nconst args = process.argv.slice(2);\nif (args.includes("--help")) {\n  console.log("Usage: appneurox tools ${input.cliNamespace} '<json>' [--json]");\n  process.exit(0);\n}\ntry {\n  const raw = args.find((arg) => !arg.startsWith("--")) ?? "{}";\n  const input = JSON.parse(raw);\n  const output = execute(input, {\n    enforcePermissions: false\n  });\n  console.log(JSON.stringify({ namespace: "appneurox tools ${input.cliNamespace}", mode: "generator", output }, null, 2));\n} catch (error) {\n  console.error(error instanceof Error ? error.message : String(error));\n  process.exit(1);\n}\n`;
  }
  if (isExternalApi(input)) {
    return `#!/usr/bin/env node\nimport { execute } from "../core";\nimport { mockExternalProvider } from "../providers";\n\nasync function main() {\n  const args = process.argv.slice(2);\n  if (args.includes("--help")) {\n    console.log("Usage: appneurox tools ${input.cliNamespace} '<json>' [--json]");\n    return;\n  }\n  const raw = args.find((arg) => !arg.startsWith("--")) ?? "{}";\n  const input = JSON.parse(raw);\n  const output = await execute(input, { externalProvider: mockExternalProvider });\n  console.log(JSON.stringify({ namespace: "appneurox tools ${input.cliNamespace}", mode: "external-api", output }, null, 2));\n}\n\nmain().catch((error) => {\n  console.error(error instanceof Error ? error.message : JSON.stringify(error));\n  process.exit(1);\n});\n`;
  }
  return `#!/usr/bin/env node\nimport { execute } from "../core";\n${input.aiLevel !== "none" ? 'import { mockAIOSProvider } from "../ai";\n' : ""}\nconst args = process.argv.slice(2);\nif (args.includes("--help")) {\n  console.log("Usage: appneurox tools ${input.cliNamespace} '<json>'${input.aiLevel !== "none" ? " [--ai]" : ""} [--json]");\n  process.exit(0);\n}\ntry {\n  const useAI = ${input.aiLevel !== "none" ? 'args.includes("--ai")' : "false"};\n  const raw = args.find((arg) => !arg.startsWith("--")) ?? "{}";\n  const input = JSON.parse(raw);\n  const context = ${input.aiLevel !== "none" ? 'useAI ? { useAI: true, aiProvider: mockAIOSProvider } : {}' : "{}"};\n  console.log(JSON.stringify({ namespace: "appneurox tools ${input.cliNamespace}", mode: useAI ? "ai" : "deterministic", output: execute(input, context) }, null, 2));\n} catch (error) {\n  console.error(error instanceof Error ? error.message : String(error));\n  process.exit(1);\n}\n`;
}

function commandsSource(input: ToolPackageGeneratorInput): string {
  return `import { execute } from "../core";\nimport { ToolRuntimeContext } from "../permissions";\n\nexport const command = {\n  name: "${input.commandName}",\n  toolId: "${input.toolId}",\n  permission: "${input.permissionName}",\n  handler(input: Record<string, unknown>, context: ToolRuntimeContext = {}) {\n    return execute(input, { ...context, enforcePermissions: true });\n  }\n};\n`;
}

function eventsSource(input: ToolPackageGeneratorInput): string {
  return `import { ToolRuntimeContext } from "../permissions";\n\nexport const toolEvents = {\n  completed: "tool.${input.toolId}.completed",\n  failed: "tool.${input.toolId}.failed"\n};\n\nexport const events = toolEvents;\n\nexport function emitToolEvent(context: ToolRuntimeContext, type: string, data: Record<string, unknown>) {\n  context.emitEvent?.({ type, data });\n}\n`;
}

function permissionsSource(input: ToolPackageGeneratorInput): string {
  return `export interface ToolRuntimeContext {\n  tenantId?: string;\n  actorId?: string;\n  permissions?: string[];\n  enforcePermissions?: boolean;\n  useAI?: boolean;\n  aiProvider?: {\n    enhanceToolOutput(request: {\n      toolId: string;\n      commandName: string;\n      input: Record<string, unknown>;\n      deterministicOutput: Record<string, unknown>;\n    }): Record<string, unknown>;\n  };\n  externalProvider?: {\n    name: string;\n    execute(input: Record<string, unknown>, config: any): Promise<Record<string, unknown>>;\n  };\n  providerConfig?: Record<string, unknown>;\n  cache?: {\n    get(key: string): Promise<Record<string, unknown> | undefined>;\n    set(key: string, value: Record<string, unknown>, ttlMs?: number): Promise<void>;\n  };\n  emitEvent?: (event: { type: string; data: Record<string, unknown> }) => void;\n  trackAnalytics?: (metric: { toolId: string; commandName: string; status: "succeeded" | "failed"; durationMs: number }) => void;\n}\n\nexport const requiredPermission = "${input.permissionName}";\nexport const permissions = [requiredPermission];\n\nexport function assertPermission(context: ToolRuntimeContext = {}) {\n  if (!context.enforcePermissions) return;\n  if (!context.permissions?.includes(requiredPermission)) {\n    throw new Error(\`Missing permission: \${requiredPermission}\`);\n  }\n}\n`;
}

function adaptersSource(input: ToolPackageGeneratorInput): string {
  return `import { execute } from "../core";\nimport { ToolRuntimeContext } from "../permissions";\n\nexport const manifest = ${JSON.stringify(createManifest(input), null, 2)} as const;\n\nexport function commandOSAdapter(input: Record<string, unknown>, context: ToolRuntimeContext = {}) {\n  return execute(input, { ...context, enforcePermissions: true });\n}\n\nexport function toolOSAdapter(input: Record<string, unknown>, context: ToolRuntimeContext = {}) {\n  return execute(input, { ...context, enforcePermissions: true });\n}\n\nexport function registerWithToolOS(toolOS: { registerTool(manifest: unknown): unknown }) {\n  return toolOS.registerTool(manifest);\n}\n`;
}

function aiSource(input: ToolPackageGeneratorInput): string {
  return `import { execute } from "../core";\nimport { ToolRuntimeContext } from "../permissions";\n\nexport interface AIOSLike {\n  registerTool?: (definition: unknown) => unknown;\n}\n\nexport const mockAIOSProvider: NonNullable<ToolRuntimeContext["aiProvider"]> = {\n  enhanceToolOutput(request) {\n    return request.deterministicOutput;\n  }\n};\n\nexport function executeWithAI(input: Record<string, unknown>, aiProvider: NonNullable<ToolRuntimeContext["aiProvider"]> = mockAIOSProvider) {\n  return execute(input, { useAI: true, aiProvider });\n}\n\nexport const aiTool = {\n  name: "${input.toolId}",\n  level: "${input.aiLevel}",\n  required: ${input.aiLevel === "required"},\n  mode: "${input.type === "hybrid" ? "hybrid" : "ai"}",\n  description: "${input.name} AIOS tool definition",\n  inputSchema: ${JSON.stringify(input.inputSchema, null, 2)},\n  outputSchema: ${JSON.stringify(input.outputSchema, null, 2)},\n  execute: executeWithAI\n};\n\nexport function registerWithAIOS(aios: AIOSLike) {\n  return aios.registerTool?.(aiTool);\n}\n`;
}

function providersSource(input: ToolPackageGeneratorInput): string {
  return `import { providerConfigSchema } from "../schemas";\n\nexport interface ExternalProviderConfig {\n  baseUrl?: string;\n  apiKey?: string;\n  timeoutMs: number;\n  retry: {\n    attempts: number;\n    backoffMs: number;\n  };\n  rateLimitKey?: string;\n  cacheTtlMs?: number;\n}\n\nexport interface ExternalProviderAdapter {\n  name: string;\n  execute(input: Record<string, unknown>, config: ExternalProviderConfig): Promise<Record<string, unknown>>;\n}\n\nexport class ExternalProviderError extends Error {\n  readonly code: string;\n  readonly status?: number;\n  readonly retryable: boolean;\n\n  constructor(message: string, options: { code: string; status?: number; retryable?: boolean }) {\n    super(message);\n    this.name = "ExternalProviderError";\n    this.code = options.code;\n    this.status = options.status;\n    this.retryable = options.retryable ?? false;\n  }\n}\n\nexport const mockExternalProvider: ExternalProviderAdapter = {\n  name: "mock",\n  async execute() {\n    return ${JSON.stringify(sampleOutput(input), null, 4)};\n  }\n};\n\nexport function validateProviderConfig(config: Record<string, unknown>): ExternalProviderConfig {\n  return providerConfigSchema.parse(config);\n}\n\nexport function normalizeExternalError(error: unknown): ExternalProviderError {\n  if (error instanceof ExternalProviderError) return error;\n  if (error instanceof Error && error.name === "TimeoutError") {\n    return new ExternalProviderError(error.message, { code: "provider_timeout", retryable: true });\n  }\n  if (error instanceof Error) {\n    return new ExternalProviderError(error.message, { code: "provider_error", retryable: false });\n  }\n  return new ExternalProviderError("Unknown external provider error", { code: "provider_unknown", retryable: false });\n}\n\nexport async function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {\n  let timeout: ReturnType<typeof setTimeout> | undefined;\n  const timeoutPromise = new Promise<never>((_, reject) => {\n    timeout = setTimeout(() => {\n      const error = new Error(\`Provider timed out after \${timeoutMs}ms\`);\n      error.name = "TimeoutError";\n      reject(error);\n    }, timeoutMs);\n  });\n\n  try {\n    return await Promise.race([operation, timeoutPromise]);\n  } finally {\n    if (timeout) clearTimeout(timeout);\n  }\n}\n\nexport async function executeWithRetry<T>(operation: () => Promise<T>, retry: ExternalProviderConfig["retry"]): Promise<T> {\n  let lastError: unknown;\n  for (let attempt = 0; attempt <= retry.attempts; attempt += 1) {\n    try {\n      return await operation();\n    } catch (error) {\n      lastError = error;\n      const normalized = normalizeExternalError(error);\n      if (!normalized.retryable || attempt === retry.attempts) break;\n      await delay(retry.backoffMs);\n    }\n  }\n  throw lastError;\n}\n\nexport function assertRateLimitPlaceholder(config: ExternalProviderConfig) {\n  return { enabled: false, key: config.rateLimitKey };\n}\n\nfunction delay(ms: number) {\n  return new Promise((resolve) => setTimeout(resolve, ms));\n}\n`;
}

function templatesSource(input: ToolPackageGeneratorInput): string {
  return `export interface TemplateInput {\n  manifest?: Record<string, unknown>;\n  schema?: Record<string, unknown>;\n  blueprint?: {\n    name: string;\n    files?: Record<string, string>;\n  };\n}\n\nexport function renderDefaultFiles(input: TemplateInput): Record<string, string> {\n  const name = input.blueprint?.name ?? String(input.manifest?.name ?? "${input.name} Output");\n  return {\n    "README.md": \`# \${name}\\n\\nGenerated by ${input.name}.\\n\`,\n    "package.json": JSON.stringify({\n      name: slug(name),\n      version: "1.0.0",\n      scripts: {\n        build: "tsc -p tsconfig.json"\n      },\n      devDependencies: {\n        typescript: "^5.6.3"\n      }\n    }, null, 2) + "\\n",\n    "tsconfig.json": JSON.stringify({\n      compilerOptions: {\n        target: "ES2022",\n        module: "CommonJS",\n        rootDir: "src",\n        outDir: "dist",\n        strict: true,\n        skipLibCheck: true\n      },\n      include: ["src/**/*.ts"]\n    }, null, 2) + "\\n",\n    "src/index.ts": \`export const manifest = \${JSON.stringify(input.manifest ?? {}, null, 2)} as const;\\nexport const schema = \${JSON.stringify(input.schema ?? {}, null, 2)} as const;\\n\`\n  };\n}\n\nfunction slug(value: string) {\n  return value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "generated-package";\n}\n`;
}

function rulesSource(input: ToolPackageGeneratorInput): string {
  return `import { ${className(input)}Input } from "../schemas";\nimport { ${className(input)}Output } from "../schemas";\n\nexport interface ValidationMessage {\n  path: string;\n  code: string;\n  message: string;\n}\n\nexport function runRules(input: ${className(input)}Input): ${className(input)}Output {\n  const payload = clone(input.payload);\n  const issues: ValidationMessage[] = [];\n  const warnings: ValidationMessage[] = [];\n\n  for (const rule of input.rules) {\n    const value = payload[rule.field];\n    const missing = value === undefined || value === null || value === "";\n    const target = input.mode === "soft" || rule.severity === "warning" ? warnings : issues;\n\n    if (rule.required && missing) {\n      target.push(message(rule.field, "required", rule.message ?? \`\${rule.field} is required\`));\n      continue;\n    }\n\n    if (!missing && rule.type && !matchesType(value, rule.type)) {\n      target.push(message(rule.field, "type", rule.message ?? \`\${rule.field} must be \${rule.type}\`));\n    }\n\n    if (!missing && typeof value === "string" && rule.minLength !== undefined && value.length < rule.minLength) {\n      target.push(message(rule.field, "min_length", rule.message ?? \`\${rule.field} must be at least \${rule.minLength} characters\`));\n    }\n  }\n\n  const totalFindings = issues.length + warnings.length;\n  return {\n    valid: issues.length === 0,\n    score: totalFindings === 0 ? 1 : Math.max(0, 1 - totalFindings / Math.max(1, input.rules.length)),\n    issues,\n    warnings,\n    suggestions: totalFindings === 0 ? [] : ["Review validation findings and update the payload or rules."]\n  };\n}\n\nfunction message(path: string, code: string, message: string): ValidationMessage {\n  return { path, code, message };\n}\n\nfunction matchesType(value: unknown, type: string) {\n  if (type === "array") return Array.isArray(value);\n  if (type === "object") return typeof value === "object" && value !== null && !Array.isArray(value);\n  return typeof value === type;\n}\n\nfunction clone<T>(value: T): T {\n  return JSON.parse(JSON.stringify(value));\n}\n`;
}

function unitTestSource(input: ToolPackageGeneratorInput): string {
  if (isValidatorTool(input)) {
    return `import { test } from "node:test";\nimport assert from "node:assert/strict";\nimport { execute, ${className(input)}Tool } from "../dist/core/${input.toolId}.js";\n\ntest("unit: validator core returns structured results and does not mutate input", () => {\n  const payload = { name: "APPNEUROX" };\n  const original = JSON.stringify(payload);\n  const tool = new ${className(input)}Tool();\n  const output = tool.execute({ payload, rules: [{ field: "name", required: true, type: "string" }], mode: "strict" });\n  assert.deepEqual(output, execute({ payload, rules: [{ field: "name", required: true, type: "string" }], mode: "strict" }));\n  assert.equal(output.valid, true);\n  assert.equal(JSON.stringify(payload), original);\n});\n`;
  }
  if (isGeneratorTool(input)) {
    return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nimport { mkdtempSync, rmSync } from "node:fs";\nimport { join } from "node:path";\nimport { tmpdir } from "node:os";\nconst { execute, ${className(input)}Tool } = require("../dist/core/index.js");\n\ntest("unit: generator core executes deterministically", () => {\n  const outputDir = mkdtempSync(join(tmpdir(), "${input.toolId}-unit-"));\n  try {\n    const tool = new ${className(input)}Tool();\n    const input = ${JSON.stringify(generatorSampleInput("__OUTPUT_DIR__"), null, 2)};\n    input.outputDir = outputDir;\n    const output = tool.execute(input);\n    assert.deepEqual(output.generatedFiles, ["README.md", "src/index.ts"]);\n    assert.deepEqual(execute({ ...input, dryRun: true }).generatedFiles, ["README.md", "src/index.ts"]);\n  } finally {\n    rmSync(outputDir, { recursive: true, force: true });\n  }\n});\n`;
  }
  if (isExternalApi(input)) {
    return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nconst { execute, ${className(input)}Tool } = require("../dist/core/index.js");\nimport { mockExternalProvider } from "../dist/providers/providers.js";\n\ntest("unit: core class executes with mock provider", async () => {\n  const tool = new ${className(input)}Tool();\n  const context = { externalProvider: mockExternalProvider };\n  const output = await tool.execute(${JSON.stringify(sampleInput(input))}, context);\n  assert.deepEqual(output, await execute(${JSON.stringify(sampleInput(input))}, context));\n});\n`;
  }
  return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nconst { execute, ${className(input)}Tool } = require("../dist/core/index.js");\n\ntest("unit: core class executes standalone", () => {\n  const tool = new ${className(input)}Tool();\n  const output = tool.execute(${JSON.stringify(sampleInput(input))});\n  assert.deepEqual(output, execute(${JSON.stringify(sampleInput(input))}));\n});\n`;
}

function snapshotTestSource(input: ToolPackageGeneratorInput): string {
  return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nimport { execute } from "../dist/core/${input.toolId}.js";\n\nconst input = ${JSON.stringify(sampleInput(input), null, 2)};\nconst snapshot = ${JSON.stringify(sampleOutput(input), null, 2)};\n\ntest("snapshot: deterministic output is stable", () => {\n  assert.deepEqual(execute(input), snapshot);\n  assert.deepEqual(execute(input), snapshot);\n});\n`;
}

function errorTestSource(input: ToolPackageGeneratorInput): string {
  return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nconst { execute } = require("../dist/core/index.js");\nimport * as api from "../dist/api/routes.js";\n\ntest("error: invalid input fails clearly", () => {\n  assert.throws(() => execute({}), /Required|Invalid/);\n  assert.throws(() => api.handleRequest({}, { permissions: ["${input.permissionName}"] }), /Required|Invalid/);\n});\n`;
}

function noAITestSource(input: ToolPackageGeneratorInput): string {
  return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nimport { existsSync, readdirSync, readFileSync } from "node:fs";\nconst { join } = require("node:path");\nimport manifest from "../manifest.json" assert { type: "json" };\n\nfunction files(dir) {\n  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {\n    const full = join(dir, entry.name);\n    return entry.isDirectory() ? files(full) : [full];\n  });\n}\n\ntest("no-ai: deterministic package has no AIOS import or AI layer", () => {\n  assert.equal(manifest.aiSupport.enabled, false);\n  assert.deepEqual(manifest.dependencies.optional, []);\n  assert.equal(existsSync(join(__dirname, "..", "src", "ai")), false);\n  for (const file of files(join(__dirname, "..", "src"))) {\n    const text = readFileSync(file, "utf8");\n    assert.equal(text.includes("@appneurox/aios"), false, file);\n    assert.equal(text.includes("AIOS"), false, file);\n  }\n});\n`;
}

function aiTestSource(input: ToolPackageGeneratorInput): string {
  return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nconst { execute } = require("../dist/core/index.js");\nimport { executeWithAI, mockAIOSProvider, aiTool } from "../dist/ai/optional-ai-layer.js";\n\nconst sampleInput = ${JSON.stringify(sampleInput(input), null, 2)};\nconst sampleOutput = ${JSON.stringify(sampleOutput(input), null, 2)};\n\ntest("ai: deterministic mode works without AIOS", () => {\n  assert.deepEqual(execute(sampleInput), sampleOutput);\n});\n\ntest("ai: hybrid mode works with mock AIOS provider", () => {\n  assert.deepEqual(executeWithAI(sampleInput, mockAIOSProvider), sampleOutput);\n  assert.equal(aiTool.required, false);\n  assert.equal(aiTool.mode, "hybrid");\n});\n\ntest("ai: invalid AI output is rejected", () => {\n  const invalidProvider = {\n    enhanceToolOutput() {\n      return { invalid: true };\n    }\n  };\n  assert.throws(() => executeWithAI(sampleInput, invalidProvider), /Required|Invalid/);\n});\n\ntest("ai: requesting AI without provider fails clearly", () => {\n  assert.throws(() => execute(sampleInput, { useAI: true }), /no AIOS provider/);\n});\n`;
}

function providerTestSource(input: ToolPackageGeneratorInput): string {
  return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nconst { execute } = require("../dist/core/index.js");\nimport { ExternalProviderError, assertRateLimitPlaceholder, normalizeExternalError, validateProviderConfig } from "../dist/providers/providers.js";\n\nconst sampleInput = ${JSON.stringify(sampleInput(input), null, 2)};\nconst sampleOutput = ${JSON.stringify(sampleOutput(input), null, 2)};\n\ntest("provider: tests use mock adapter and no network", async () => {\n  let called = 0;\n  const provider = {\n    name: "mock-test",\n    async execute() {\n      called += 1;\n      return sampleOutput;\n    }\n  };\n  assert.deepEqual(await execute(sampleInput, { externalProvider: provider }), sampleOutput);\n  assert.equal(called, 1);\n});\n\ntest("provider: permission is checked before external call", async () => {\n  let called = 0;\n  const provider = {\n    name: "must-not-call",\n    async execute() {\n      called += 1;\n      return sampleOutput;\n    }\n  };\n  await assert.rejects(() => execute(sampleInput, { enforcePermissions: true, permissions: [], externalProvider: provider }), /Missing permission/);\n  assert.equal(called, 0);\n});\n\ntest("provider: failures return normalized errors", async () => {\n  const provider = {\n    name: "failing",\n    async execute() {\n      throw new Error("upstream exploded");\n    }\n  };\n  await assert.rejects(() => execute(sampleInput, { externalProvider: provider }), (error) => {\n    assert.equal(error.name, "ExternalProviderError");\n    assert.equal(error.code, "provider_error");\n    return true;\n  });\n  assert.equal(normalizeExternalError(new Error("x")).code, "provider_error");\n});\n\ntest("provider: timeout and retry policy are applied", async () => {\n  let attempts = 0;\n  const provider = {\n    name: "retry-timeout",\n    async execute() {\n      attempts += 1;\n      if (attempts === 1) throw new ExternalProviderError("temporary", { code: "temporary", retryable: true });\n      return sampleOutput;\n    }\n  };\n  const output = await execute(sampleInput, {\n    externalProvider: provider,\n    providerConfig: { timeoutMs: 100, retry: { attempts: 1, backoffMs: 0 } }\n  });\n  assert.deepEqual(output, sampleOutput);\n  assert.equal(attempts, 2);\n});\n\ntest("provider: config validation, rate limit placeholder, and cache work", async () => {\n  const config = validateProviderConfig({ baseUrl: "https://api.example.com", rateLimitKey: "tenant_1" });\n  assert.deepEqual(assertRateLimitPlaceholder(config), { enabled: false, key: "tenant_1" });\n  const cacheStore = new Map();\n  let called = 0;\n  const provider = {\n    name: "cacheable",\n    async execute() {\n      called += 1;\n      return sampleOutput;\n    }\n  };\n  const cache = {\n    async get(key) {\n      return cacheStore.get(key);\n    },\n    async set(key, value) {\n      cacheStore.set(key, value);\n    }\n  };\n  await execute(sampleInput, { externalProvider: provider, cache });\n  await execute(sampleInput, { externalProvider: provider, cache });\n  assert.equal(called, 1);\n});\n`;
}

function generatorToolTestSource(input: ToolPackageGeneratorInput): string {
  return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nimport { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";\nconst { join } = require("node:path");\nconst { tmpdir } = require("node:os");\nimport { spawnSync } from "node:child_process";\nconst { execute } = require("../dist/core/index.js");\n\nfunction tempDir(prefix) {\n  return mkdtempSync(join(tmpdir(), prefix));\n}\n\nfunction input(outputDir, extra = {}) {\n  return {\n    outputDir,\n    blueprint: {\n      name: "Generated Example",\n      files: {\n        "README.md": "# Generated Example\n",\n        "src/index.ts": "export const value: string = \\"ok\\";\n",\n        "tsconfig.json": JSON.stringify({ compilerOptions: { target: "ES2022", module: "CommonJS", strict: true }, include: ["src/**/*.ts"] }, null, 2) + "\n"\n      }\n    },\n    ...extra\n  };\n}\n\ntest("generator: dry run returns file list without writing", () => {\n  const outputDir = tempDir("${input.toolId}-dry-");\n  try {\n    const result = execute(input(outputDir, { dryRun: true }));\n    assert.equal(result.dryRun, true);\n    assert.deepEqual(result.generatedFiles, ["README.md", "src/index.ts", "tsconfig.json"]);\n    assert.equal(existsSync(join(outputDir, "README.md")), false);\n  } finally {\n    rmSync(outputDir, { recursive: true, force: true });\n  }\n});\n\ntest("generator: generates files and snapshot is stable", () => {\n  const outputDir = tempDir("${input.toolId}-write-");\n  try {\n    const result = execute(input(outputDir));\n    assert.deepEqual(result.generatedFiles, ["README.md", "src/index.ts", "tsconfig.json"]);\n    const snapshot = {\n      readme: readFileSync(join(outputDir, "README.md"), "utf8"),\n      index: readFileSync(join(outputDir, "src/index.ts"), "utf8")\n    };\n    assert.deepEqual(snapshot, {\n      readme: "# Generated Example\n",\n      index: "export const value: string = \\"ok\\";\n"\n    });\n  } finally {\n    rmSync(outputDir, { recursive: true, force: true });\n  }\n});\n\ntest("generator: invalid input fails clearly", () => {\n  assert.throws(() => execute({ blueprint: { name: "" }, outputDir: "" }), /String must contain|too_small|Required/);\n});\n\ntest("generator: does not overwrite by default", () => {\n  const outputDir = tempDir("${input.toolId}-no-overwrite-");\n  try {\n    execute(input(outputDir));\n    assert.throws(() => execute(input(outputDir)), /Refusing to overwrite/);\n  } finally {\n    rmSync(outputDir, { recursive: true, force: true });\n  }\n});\n\ntest("generator: force overwrite works", () => {\n  const outputDir = tempDir("${input.toolId}-force-");\n  try {\n    execute(input(outputDir));\n    writeFileSync(join(outputDir, "README.md"), "user edit");\n    execute(input(outputDir, { force: true }));\n    assert.equal(readFileSync(join(outputDir, "README.md"), "utf8"), "# Generated Example\n");\n  } finally {\n    rmSync(outputDir, { recursive: true, force: true });\n  }\n});\n\ntest("generator: generated TypeScript output compiles", () => {\n  const outputDir = tempDir("${input.toolId}-compile-");\n  try {\n    execute(input(outputDir));\n    const result = spawnSync(process.execPath, [require.resolve("typescript/bin/tsc"), "-p", "tsconfig.json"], { cwd: outputDir, encoding: "utf8" });\n    assert.equal(result.status, 0, result.stderr || result.stdout);\n  } finally {\n    rmSync(outputDir, { recursive: true, force: true });\n  }\n});\n`;
}

function validatorToolTestSource(input: ToolPackageGeneratorInput): string {
  return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nconst { execute } = require("../dist/core/index.js");\n\nconst rules = [\n  { field: "name", required: true, type: "string", minLength: 3 },\n  { field: "email", required: true, type: "string", message: "email is required" }\n];\n\ntest("validator: valid case returns structured success", () => {\n  const result = execute({ payload: { name: "Ajay", email: "a@appneurox.com" }, rules, mode: "strict" });\n  assert.equal(result.valid, true);\n  assert.deepEqual(result.issues, []);\n  assert.deepEqual(result.warnings, []);\n  assert.equal(result.score, 1);\n});\n\ntest("validator: strict mode produces helpful issues", () => {\n  const result = execute({ payload: { name: "AJ" }, rules, mode: "strict" });\n  assert.equal(result.valid, false);\n  assert.equal(result.issues.length, 2);\n  assert.deepEqual(result.issues.map((issue) => issue.code), ["min_length", "required"]);\n  assert.equal(result.issues[1].message, "email is required");\n  assert.ok(result.suggestions[0].includes("Review validation findings"));\n});\n\ntest("validator: soft mode returns warnings instead of hard issues", () => {\n  const result = execute({ payload: { name: "AJ" }, rules, mode: "soft" });\n  assert.equal(result.valid, true);\n  assert.equal(result.issues.length, 0);\n  assert.equal(result.warnings.length, 2);\n});\n\ntest("validator: rule severity warning stays warning in strict mode", () => {\n  const result = execute({ payload: {}, rules: [{ field: "tagline", required: true, severity: "warning" }], mode: "strict" });\n  assert.equal(result.valid, true);\n  assert.equal(result.warnings[0].path, "tagline");\n});\n`;
}

function schemaTestSource(input: ToolPackageGeneratorInput): string {
  if (isValidatorTool(input)) {
    return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nimport * as schemas from "../dist/schemas/input.schema.js";\n\ntest("schema: validates validator input and output", () => {\n  assert.doesNotThrow(() => schemas.inputSchema.parse(${JSON.stringify(validatorSampleInput("strict"), null, 2)}));\n  assert.doesNotThrow(() => schemas.outputSchema.parse(${JSON.stringify(validatorSampleOutput(true), null, 2)}));\n  assert.throws(() => schemas.inputSchema.parse({ payload: [] }), /Expected object|invalid_type/);\n});\n`;
  }
  return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nconst schemas = require("../dist/schemas/index.js");\n\ntest("schema: validates input and output with Zod", () => {\n  assert.doesNotThrow(() => schemas.inputSchema.parse(${JSON.stringify(sampleInput(input))}));\n  assert.doesNotThrow(() => schemas.outputSchema.parse(${JSON.stringify(sampleOutput(input))}));\n  assert.throws(() => schemas.inputSchema.parse({}), /Required|Invalid/);\n});\n${isExternalApi(input) ? `\ntest("schema: validates provider config", () => {\n  const config = schemas.providerConfigSchema.parse({ baseUrl: "https://api.example.com", timeoutMs: 1000 });\n  assert.equal(config.baseUrl, "https://api.example.com");\n  assert.equal(config.retry.attempts, 2);\n  assert.throws(() => schemas.providerConfigSchema.parse({ baseUrl: "not-a-url" }), /url/i);\n});\n` : ""}`;
}

function manifestTestSource(input: ToolPackageGeneratorInput): string {
  return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nconst manifest = require("../manifest.json");\n\ntest("manifest: valid APPNEUROX tool manifest", () => {\n  assert.equal(manifest.id, "${input.toolId}");\n  assert.equal(manifest.packageName, "@appneurox/tool-${input.toolId}");\n  assert.equal(manifest.commands[0], "${input.commandName}");\n  assert.equal(manifest.permissions[0], "${input.permissionName}");\n  assert.equal(manifest.sdk.namespace, "app.tools.${input.sdkNamespace}");\n  assert.equal(manifest.cli.namespace, "appneurox tools ${input.cliNamespace}");\n  assert.ok(Array.isArray(manifest.usedBy));\n${isHybrid(input) ? '  assert.equal(manifest.aiSupport.enabled, true);\n  assert.equal(manifest.aiSupport.required, false);\n  assert.equal(manifest.aiSupport.mode, "hybrid");\n' : ""}${isExternalApi(input) ? '  assert.equal(manifest.provider.configurable, true);\n  assert.equal(manifest.provider.hardcodedProvider, false);\n' : ""}});\n`;
}

function apiTestSource(input: ToolPackageGeneratorInput): string {
  if (isExternalApi(input)) {
    return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nconst api = require("../dist/api/index.js");\nconst { mockExternalProvider } = require("../dist/providers/index.js");\n\ntest("api: route validates input and requires permission", async () => {\n  assert.equal(api.route, "/v1/tools/${input.toolId}/execute");\n  await assert.rejects(() => api.handleRequest(${JSON.stringify(sampleInput(input))}, { permissions: [], externalProvider: mockExternalProvider }), /Missing permission/);\n  await assert.doesNotReject(() => api.handleRequest(${JSON.stringify(sampleInput(input))}, { permissions: ["${input.permissionName}"], externalProvider: mockExternalProvider }));\n  await assert.rejects(() => api.handleRequest({}, { permissions: ["${input.permissionName}"], externalProvider: mockExternalProvider }), /Required|Invalid/);\n});\n`;
  }
  return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nconst api = require("../dist/api/index.js");\n\ntest("api: route validates input and requires permission", () => {\n  assert.equal(api.route, "/v1/tools/${input.toolId}/execute");\n  assert.throws(() => api.handleRequest(${JSON.stringify(sampleInput(input))}, { permissions: [] }), /Missing permission/);\n  assert.doesNotThrow(() => api.handleRequest(${JSON.stringify(sampleInput(input))}, { permissions: ["${input.permissionName}"] }));\n  assert.throws(() => api.handleRequest({}, { permissions: ["${input.permissionName}"] }), /Required|Invalid/);\n});\n`;
}

function sdkTestSource(input: ToolPackageGeneratorInput): string {
  if (isExternalApi(input)) {
    return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nimport * as sdk from "../dist/sdk/client.js";\nconst { mockExternalProvider } = require("../dist/providers/index.js");\n\ntest("sdk: namespace and client work", async () => {\n  assert.equal(sdk.namespace, "app.tools.${input.sdkNamespace}");\n  const client = new sdk.${className(input)}Client({ externalProvider: mockExternalProvider });\n  assert.deepEqual(await client.execute(${JSON.stringify(sampleInput(input))}), ${JSON.stringify(sampleOutput(input))});\n});\n`;
  }
  return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nconst sdk = require("../dist/sdk/index.js");\n\ntest("sdk: namespace and client work", () => {\n  assert.equal(sdk.namespace, "app.tools.${input.sdkNamespace}");\n  const client = new sdk.${className(input)}Client();\n  assert.deepEqual(client.execute(${JSON.stringify(sampleInput(input))}), ${JSON.stringify(sampleOutput(input))});\n});\n`;
}

function cliTestSource(input: ToolPackageGeneratorInput): string {
  if (isValidatorTool(input)) {
    return cliTestBody(input, JSON.stringify(validatorSampleInput("strict")), "deterministic", "parsed.output.valid === true");
  }
  if (isGeneratorTool(input)) {
    return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nconst { mkdtempSync, rmSync } = require("node:fs");\nconst { join } = require("node:path");\nconst { tmpdir } = require("node:os");\nconst { spawnSync } = require("node:child_process");\n\ntest("cli: --help works", () => {\n  const result = spawnSync(process.execPath, ["dist/cli/command.js", "--help"], { encoding: "utf8" });\n  assert.equal(result.status, 0, result.stderr || result.stdout);\n  assert.match(result.stdout, /appneurox tools ${input.cliNamespace}/);\n});\n\ntest("cli: generator command supports dry-run and json output", () => {\n  const outputDir = mkdtempSync(join(tmpdir(), "${input.toolId}-cli-"));\n  try {\n    const payload = ${JSON.stringify(generatorSampleInput("__OUTPUT_DIR__"), null, 4)};\n    payload.outputDir = outputDir;\n    payload.dryRun = true;\n    const result = spawnSync(process.execPath, ["dist/cli/index.js", JSON.stringify(payload), "--json"], { encoding: "utf8" });\n    assert.equal(result.status, 0, result.stderr || result.stdout);\n    const parsed = JSON.parse(result.stdout);\n    assert.equal(parsed.namespace, "appneurox tools ${input.cliNamespace}");\n    assert.equal(parsed.mode, "generator");\n    assert.equal(parsed.output.dryRun, true);\n  } finally {\n    rmSync(outputDir, { recursive: true, force: true });\n  }\n});\n\ntest("cli: invalid input fails", () => {\n  const result = spawnSync(process.execPath, ["dist/cli/index.js", "{}"], { encoding: "utf8" });\n  assert.notEqual(result.status, 0);\n});\n`;
  }
  if (isExternalApi(input)) {
    return cliTestBody(input, JSON.stringify(sampleInput(input)), "external-api", "true");
  }
  return `${cliTestBody(input, JSON.stringify(sampleInput(input)), "deterministic", "true")}${input.aiLevel !== "none" ? `\ntest("cli: command supports AI mode with mock provider", () => {\n  const result = spawnSync(process.execPath, ["dist/cli/index.js", JSON.stringify(${JSON.stringify(sampleInput(input))}), "--ai", "--json"], { encoding: "utf8" });\n  assert.equal(result.status, 0, result.stderr || result.stdout);\n  const parsed = JSON.parse(result.stdout);\n  assert.equal(parsed.mode, "ai");\n});\n` : ""}`;
}

function cliTestBody(input: ToolPackageGeneratorInput, payloadSource: string, expectedMode: string, extraAssertion: string): string {
  return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nconst { spawnSync } = require("node:child_process");\n\ntest("cli: --help works", () => {\n  const result = spawnSync(process.execPath, ["dist/cli/index.js", "--help"], { encoding: "utf8" });\n  assert.equal(result.status, 0, result.stderr || result.stdout);\n  assert.match(result.stdout, /appneurox tools ${input.cliNamespace}/);\n});\n\ntest("cli: valid command works with json output", () => {\n  const result = spawnSync(process.execPath, ["dist/cli/index.js", JSON.stringify(${payloadSource}), "--json"], { encoding: "utf8" });\n  assert.equal(result.status, 0, result.stderr || result.stdout);\n  const parsed = JSON.parse(result.stdout);\n  assert.equal(parsed.namespace, "appneurox tools ${input.cliNamespace}");\n  assert.equal(parsed.mode, "${expectedMode}");\n  assert.ok(${extraAssertion});\n});\n\ntest("cli: invalid input fails", () => {\n  const result = spawnSync(process.execPath, ["dist/cli/index.js", "{}"], { encoding: "utf8" });\n  assert.notEqual(result.status, 0);\n});\n`;
}

function contractTestSource(input: ToolPackageGeneratorInput): string {
  return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nconst { inputSchema, outputSchema } = require("../dist/schemas/index.js");\nconst manifest = require("../manifest.json");\n\ntest("contract: manifest matches package name and schemas accept samples", () => {\n  assert.equal(manifest.id, "${input.toolId}");\n  assert.equal(manifest.packageName, "@appneurox/tool-${input.toolId}");\n  assert.doesNotThrow(() => inputSchema.parse(${JSON.stringify(sampleInput(input))}));\n  assert.doesNotThrow(() => outputSchema.parse(${JSON.stringify(sampleOutput(input))}));\n});\n`;
}

function permissionTestSource(input: ToolPackageGeneratorInput): string {
  return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nimport { assertPermission, requiredPermission } from "../dist/permissions/permissions.js";\n\ntest("permission: required permission is enforced when requested", () => {\n  assert.equal(requiredPermission, "${input.permissionName}");\n  assert.doesNotThrow(() => assertPermission({ enforcePermissions: false }));\n  assert.throws(() => assertPermission({ enforcePermissions: true, permissions: [] }), /Missing permission/);\n  assert.doesNotThrow(() => assertPermission({ enforcePermissions: true, permissions: ["${input.permissionName}"] }));\n});\n`;
}

function e2eTestSource(input: ToolPackageGeneratorInput): string {
  if (isValidatorTool(input)) {
    return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nimport { command } from "../dist/commands/command.definition.js";\nimport { registerWithToolOS, manifest, toolOSAdapter } from "../dist/adapters/adapters.js";\n\nclass ToolOSHarness {\n  constructor() {\n    this.registry = new Map();\n    this.handlers = new Map();\n  }\n\n  registerTool(toolManifest) {\n    this.registry.set(toolManifest.id, toolManifest);\n    this.handlers.set(toolManifest.commands[0], toolOSAdapter);\n    return toolManifest;\n  }\n\n  executeTool(commandName, input, context) {\n    const handler = this.handlers.get(commandName);\n    if (!handler) throw new Error(\`Unknown command: \${commandName}\`);\n    return handler(input, context);\n  }\n}\n\ntest("e2e: ToolOS validator path works", () => {\n  const emitted = [];\n  const analytics = [];\n  const context = {\n    permissions: ["${input.permissionName}"],\n    emitEvent: (event) => emitted.push(event),\n    trackAnalytics: (metric) => analytics.push(metric)\n  };\n  const toolOS = new ToolOSHarness();\n  registerWithToolOS(toolOS);\n  assert.equal(toolOS.registry.get("${input.toolId}").id, manifest.id);\n  const output = toolOS.executeTool("${input.commandName}", ${JSON.stringify(validatorSampleInput("strict"))}, context);\n  assert.equal(output.valid, true);\n  assert.equal(emitted[0].type, "tool.${input.toolId}.completed");\n  assert.equal(analytics[0].status, "succeeded");\n  assert.equal(command.handler(${JSON.stringify(validatorSampleInput("strict"))}, context).valid, true);\n});\n`;
  }
  if (isGeneratorTool(input)) {
    return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nconst { mkdtempSync, rmSync } = require("node:fs");\nconst { join } = require("node:path");\nconst { tmpdir } = require("node:os");\nconst { command } = require("../dist/commands/index.js");\nconst { registerWithToolOS, manifest, toolOSAdapter } = require("../dist/adapters/index.js");\n\nclass ToolOSHarness {\n  constructor() {\n    this.registry = new Map();\n    this.handlers = new Map();\n  }\n\n  registerTool(toolManifest) {\n    this.registry.set(toolManifest.id, toolManifest);\n    this.handlers.set(toolManifest.commands[0], toolOSAdapter);\n    return toolManifest;\n  }\n\n  executeTool(commandName, input, context) {\n    const handler = this.handlers.get(commandName);\n    if (!handler) throw new Error(\`Unknown command: \${commandName}\`);\n    return handler(input, context);\n  }\n}\n\ntest("e2e: ToolOS generator path works in dry-run mode", () => {\n  const outputDir = mkdtempSync(join(tmpdir(), "${input.toolId}-e2e-"));\n  try {\n    const emitted = [];\n    const analytics = [];\n    const context = {\n      permissions: ["${input.permissionName}"],\n      emitEvent: (event) => emitted.push(event),\n      trackAnalytics: (metric) => analytics.push(metric)\n    };\n    const payload = ${JSON.stringify(generatorSampleInput("__OUTPUT_DIR__"), null, 4)};\n    payload.outputDir = outputDir;\n    payload.dryRun = true;\n    const toolOS = new ToolOSHarness();\n    registerWithToolOS(toolOS);\n    assert.equal(toolOS.registry.get("${input.toolId}").id, manifest.id);\n    const output = toolOS.executeTool("${input.commandName}", payload, context);\n    assert.equal(output.dryRun, true);\n    assert.equal(emitted[0].type, "tool.${input.toolId}.completed");\n    assert.equal(analytics[0].status, "succeeded");\n    assert.equal(command.handler(payload, context).dryRun, true);\n  } finally {\n    rmSync(outputDir, { recursive: true, force: true });\n  }\n});\n`;
  }
  if (isExternalApi(input)) {
    return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nconst { command } = require("../dist/commands/index.js");\nconst { registerWithToolOS, manifest, toolOSAdapter } = require("../dist/adapters/index.js");\nconst { mockExternalProvider } = require("../dist/providers/index.js");\n\nclass ToolOSHarness {\n  constructor() {\n    this.registry = new Map();\n    this.handlers = new Map();\n  }\n\n  registerTool(toolManifest) {\n    this.registry.set(toolManifest.id, toolManifest);\n    this.handlers.set(toolManifest.commands[0], toolOSAdapter);\n    return toolManifest;\n  }\n\n  executeTool(commandName, input, context) {\n    const handler = this.handlers.get(commandName);\n    if (!handler) throw new Error(\`Unknown command: \${commandName}\`);\n    return handler(input, context);\n  }\n}\n\ntest("e2e: ToolOS external API path uses mock provider", async () => {\n  const emitted = [];\n  const analytics = [];\n  const context = {\n    permissions: ["${input.permissionName}"],\n    externalProvider: mockExternalProvider,\n    emitEvent: (event) => emitted.push(event),\n    trackAnalytics: (metric) => analytics.push(metric)\n  };\n  const toolOS = new ToolOSHarness();\n  registerWithToolOS(toolOS);\n  assert.equal(toolOS.registry.get("${input.toolId}").id, manifest.id);\n  assert.deepEqual(await toolOS.executeTool("${input.commandName}", ${JSON.stringify(sampleInput(input))}, context), ${JSON.stringify(sampleOutput(input))});\n  assert.equal(emitted[0].type, "tool.${input.toolId}.completed");\n  assert.equal(analytics[0].status, "succeeded");\n  assert.deepEqual(await command.handler(${JSON.stringify(sampleInput(input))}, context), ${JSON.stringify(sampleOutput(input))});\n});\n`;
  }
  return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nconst { command } = require("../dist/commands/index.js");\nconst { registerWithToolOS, manifest, toolOSAdapter } = require("../dist/adapters/index.js");\n\nclass ToolOSHarness {\n  constructor() {\n    this.registry = new Map();\n    this.handlers = new Map();\n  }\n\n  registerTool(toolManifest) {\n    this.registry.set(toolManifest.id, toolManifest);\n    this.handlers.set(toolManifest.commands[0], toolOSAdapter);\n    return toolManifest;\n  }\n\n  executeTool(commandName, input, context) {\n    const handler = this.handlers.get(commandName);\n    if (!handler) throw new Error(\`Unknown command: \${commandName}\`);\n    return handler(input, context);\n  }\n}\n\ntest("e2e: ToolOS registration and execution path works", () => {\n  const emitted = [];\n  const analytics = [];\n  const context = {\n    permissions: ["${input.permissionName}"],\n    emitEvent: (event) => emitted.push(event),\n    trackAnalytics: (metric) => analytics.push(metric)\n  };\n  const toolOS = new ToolOSHarness();\n  registerWithToolOS(toolOS);\n  assert.equal(toolOS.registry.get("${input.toolId}").id, manifest.id);\n  assert.deepEqual(toolOS.executeTool("${input.commandName}", ${JSON.stringify(sampleInput(input))}, context), ${JSON.stringify(sampleOutput(input))});\n  assert.equal(emitted[0].type, "tool.${input.toolId}.completed");\n  assert.equal(analytics[0].status, "succeeded");\n  assert.deepEqual(command.handler(${JSON.stringify(sampleInput(input))}, context), ${JSON.stringify(sampleOutput(input))});\n});\n`;
}

function docsTestSource(input: ToolPackageGeneratorInput): string {
  return `const test = require("node:test");\nconst assert = require("node:assert/strict");\nconst { existsSync, readFileSync } = require("node:fs");\nconst { join } = require("node:path");\n\ntest("docs: README and API/SDK/CLI docs exist with examples", () => {\n  const root = join(__dirname, "..");\n  for (const file of ["README.md", "docs/usage.md", "docs/api.md", "docs/sdk.md", "docs/cli.md"]) {\n    const path = join(root, file);\n    assert.equal(existsSync(path), true, file);\n    assert.ok(readFileSync(path, "utf8").length > 20, file);\n  }\n  assert.match(readFileSync(join(root, "README.md"), "utf8"), /${input.commandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/);\n  assert.match(readFileSync(join(root, "docs/cli.md"), "utf8"), /${input.cliNamespace.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/);\n});\n`;
}

function docsSource(input: ToolPackageGeneratorInput): string {
  return `# ${input.name} Usage\n\n## Core\n\n\`\`\`ts\nimport { execute${isExternalApi(input) ? ', mockExternalProvider' : ""} } from "@appneurox/tool-${input.toolId}";\n\n${isExternalApi(input) ? `await execute(${JSON.stringify(sampleInput(input), null, 2)}, { externalProvider: mockExternalProvider });` : `execute(${JSON.stringify(sampleInput(input), null, 2)});`}\n\`\`\`\n${isExternalApi(input) ? `\n## Provider Adapter\n\nProvide your own adapter by implementing \`ExternalProviderAdapter\`. Tests use \`mockExternalProvider\`, so no real network is required.\n\n\`\`\`ts\nconst provider = {\n  name: "my-provider",\n  async execute(input, config) {\n    return ${JSON.stringify(sampleOutput(input), null, 4)};\n  }\n};\n\`\`\`\n` : ""}${input.aiLevel !== "none" ? `\n## Optional AI Enhancement\n\n\`\`\`ts\nimport { executeWithAI, mockAIOSProvider } from "@appneurox/tool-${input.toolId}";\n\nexecuteWithAI(${JSON.stringify(sampleInput(input), null, 2)}, mockAIOSProvider);\n\`\`\`\n` : ""}\n## ToolOS Registration\n\n\`\`\`ts\nimport { registerWithToolOS } from "@appneurox/tool-${input.toolId}";\n\nregisterWithToolOS(toolOS);\n\`\`\`\n`;
}

function apiDocsSource(input: ToolPackageGeneratorInput): string {
  return `# ${input.name} API\n\nRoute: \`${`/v1/tools/${input.toolId}/execute`}\`\n\nThe API adapter enforces \`${input.permissionName}\` and validates input with Zod.\n`;
}

function sdkDocsSource(input: ToolPackageGeneratorInput): string {
  return `# ${input.name} SDK\n\nNamespace: \`app.tools.${input.sdkNamespace}\`\n\n\`\`\`ts\nimport { ${className(input)}Client } from "@appneurox/tool-${input.toolId}";\n\nconst client = new ${className(input)}Client();\nconst output = client.execute(${JSON.stringify(sampleInput(input), null, 2)});\n\`\`\`\n`;
}

function cliDocsSource(input: ToolPackageGeneratorInput): string {
  return `# ${input.name} CLI\n\nNamespace: \`appneurox tools ${input.cliNamespace}\`\n\n\`\`\`bash\n${input.cliNamespace} '${JSON.stringify(sampleInput(input))}'\n${input.aiLevel !== "none" ? `${input.cliNamespace} '${JSON.stringify(sampleInput(input))}' --ai\n` : ""}\`\`\`\n`;
}

function isDeterministic(input: ToolPackageGeneratorInput): boolean {
  return input.type === "deterministic" && input.aiLevel === "none";
}

function isHybrid(input: ToolPackageGeneratorInput): boolean {
  return input.type === "hybrid" && input.aiLevel !== "none";
}

function isExternalApi(input: ToolPackageGeneratorInput): boolean {
  return input.type === "connector";
}

function isGeneratorTool(input: ToolPackageGeneratorInput): boolean {
  return input.type === "generator";
}

function isValidatorTool(input: ToolPackageGeneratorInput): boolean {
  return input.type === "validator";
}

function normalizeToolId(value: string): string {
  return value.toLowerCase().replace(/^tool[.-]/, "").replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
}

function titleFromId(value: string): string {
  return value.split("-").map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`).join(" ");
}

function className(input: ToolPackageGeneratorInput): string {
  return input.toolId.split("-").map((part) => `${part[0].toUpperCase()}${part.slice(1)}`).join("");
}

function sampleInput(input: ToolPackageGeneratorInput): Record<string, unknown> {
  if (isValidatorTool(input)) return validatorSampleInput("strict");
  if (isGeneratorTool(input)) return generatorSampleInput("/tmp/appneurox-generator-output");
  return Object.fromEntries(Object.entries(input.inputSchema).map(([key, type]) => [key, sampleValue(type, input)]));
}

function sampleOutput(input: ToolPackageGeneratorInput): Record<string, unknown> {
  if (isValidatorTool(input)) return validatorSampleOutput(true);
  if (isGeneratorTool(input)) {
    return {
      dryRun: true,
      generatedFiles: ["README.md", "src/index.ts"],
      skippedFiles: [],
      outputDir: "/tmp/appneurox-generator-output"
    };
  }
  return Object.fromEntries(Object.entries(input.outputSchema).map(([key, type]) => [key, sampleValue(type, input)]));
}

function validatorSampleInput(mode: "strict" | "soft"): Record<string, unknown> {
  return {
    payload: {
      name: "APPNEUROX"
    },
    rules: [
      {
        field: "name",
        required: true,
        type: "string",
        minLength: 3
      }
    ],
    mode
  };
}

function validatorSampleOutput(valid: boolean): Record<string, unknown> {
  return {
    valid,
    score: valid ? 1 : 0,
    issues: [],
    warnings: [],
    suggestions: []
  };
}

function generatorSampleInput(outputDir: string): Record<string, unknown> {
  return {
    outputDir,
    dryRun: true,
    blueprint: {
      name: "Generated Example",
      files: {
        "README.md": "# Generated Example\n",
        "src/index.ts": "export const value = \"ok\";\n"
      }
    }
  };
}

function sampleValue(type: string, input: ToolPackageGeneratorInput): unknown {
  const normalized = type.replace("?", "");
  if (normalized === "string") return input.toolId === "qr-generator" ? "https://appneurox.com" : "demo";
  if (normalized === "number") return 1;
  if (normalized === "boolean") return true;
  if (normalized === "array") return [];
  if (normalized === "object") return {};
  return null;
}

function zodObjectSource(schema: Record<string, string>): string {
  return Object.entries(schema).map(([key, type]) => `  ${JSON.stringify(key)}: ${zodTypeSource(type)},`).join("\n");
}

function zodTypeSource(type: string): string {
  const optional = type.endsWith("?");
  const normalized = optional ? type.slice(0, -1) : type;
  const base = normalized === "number"
    ? "z.number()"
    : normalized === "boolean"
      ? "z.boolean()"
      : normalized === "array"
        ? "z.array(z.unknown())"
        : normalized === "object"
          ? "z.record(z.unknown())"
          : "z.string()";
  return optional ? `${base}.optional()` : base;
}
