export type GeneratedToolType = "deterministic" | "ai" | "hybrid" | "connector" | "validator" | "generator";
export type AILevel = "none" | "optional" | "required";

export interface ToolPackageGeneratorInput {
  toolId: string;
  name: string;
  category: string;
  type: GeneratedToolType;
  aiLevel: AILevel;
  commandName: string;
  permissionName: string;
  inputSchema: Record<string, string>;
  outputSchema: Record<string, string>;
  sdkNamespace: string;
  cliNamespace: string;
  usedBy?: string[];
  outputRoot?: string;
}

export interface GeneratedToolPackage {
  rootDir: string;
  files: string[];
  manifest: Record<string, unknown>;
}
