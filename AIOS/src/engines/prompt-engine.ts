import { getPathValue } from "../core/utils";

export class PromptEngine {
  render(template: string, variables: Record<string, unknown>): string {
    return template.replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (_match, key) => {
      const value = getPathValue(variables, key);
      if (value === undefined || value === null) return "";
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    });
  }

  extractVariables(template: string): string[] {
    const variables = new Set<string>();
    const regex = /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(template))) variables.add(match[1]);
    return [...variables];
  }
}
