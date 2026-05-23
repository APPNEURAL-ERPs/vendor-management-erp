#!/usr/bin/env node
import { ToolPackageGenerator } from "./tool-package-generator";
import { AILevel, GeneratedToolType, ToolPackageGeneratorInput } from "./types";

const args = process.argv.slice(2);

if (args[0] !== "tool" || args[1] !== "create" || !args[2]) {
  console.error("Usage: appneurox tool create <tool-id> --type <deterministic|hybrid|ai|connector> [--ai optional|required|none]");
  process.exit(1);
}

const toolId = args[2];
const type = readFlag("--type", "deterministic") as GeneratedToolType;
const aiLevel = readFlag("--ai", type === "ai" || type === "hybrid" ? "optional" : "none") as AILevel;
const category = readFlag("--category", "utility");
const name = readFlag("--name", titleFromId(toolId));
const commandName = readFlag("--command", `tool.${normalizeToolId(toolId)}.run`);
const permissionName = readFlag("--permission", `tools.${normalizeToolId(toolId)}.run`);
const sdkNamespace = readFlag("--sdk", normalizeToolId(toolId).replace(/-/g, "."));
const cliNamespace = readFlag("--cli", normalizeToolId(toolId));
const outputRoot = readFlag("--output", "packages/tools");

const input: ToolPackageGeneratorInput = {
  toolId,
  name,
  category,
  type,
  aiLevel,
  commandName,
  permissionName,
  inputSchema: defaultInputSchema(toolId),
  outputSchema: defaultOutputSchema(toolId),
  sdkNamespace,
  cliNamespace,
  outputRoot
};

const generated = new ToolPackageGenerator().generate(input);
console.log(JSON.stringify({ ok: true, rootDir: generated.rootDir, files: generated.files.length }, null, 2));

function readFlag(name: string, fallback: string): string {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  return args[index + 1] ?? fallback;
}

function normalizeToolId(value: string): string {
  return value.toLowerCase().replace(/^tool[.-]/, "").replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
}

function titleFromId(value: string): string {
  return normalizeToolId(value).split("-").map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`).join(" ");
}

function defaultInputSchema(value: string): Record<string, string> {
  const id = normalizeToolId(value);
  if (id.includes("qr")) return { text: "string", format: "string?" };
  if (id.includes("brand")) return { text: "string", channel: "string?" };
  return { value: "string" };
}

function defaultOutputSchema(value: string): Record<string, string> {
  const id = normalizeToolId(value);
  if (id.includes("qr")) return { fileUrl: "string", format: "string" };
  if (id.includes("brand")) return { compliant: "boolean", score: "number" };
  return { ok: "boolean" };
}
