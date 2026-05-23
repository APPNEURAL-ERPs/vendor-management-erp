import { ApiEndpoint, ApiProduct, SdkLanguage, SdkPackage } from "../core/domain";
import { slugify } from "../core/utils";

export interface GeneratedSdkArtifact {
  artifactPath: string;
  generatedCode: string;
}

export class SdkGeneratorEngine {
  generate(pkg: SdkPackage, products: ApiProduct[], endpoints: ApiEndpoint[], version: string): GeneratedSdkArtifact {
    const artifactPath = `artifacts/sdks/${slugify(pkg.name)}/${version}/${pkg.language}`;
    const generatedCode = pkg.language === "python"
      ? this.generatePython(pkg, products, endpoints)
      : this.generateTypeScript(pkg, products, endpoints);
    return { artifactPath, generatedCode };
  }

  private generateTypeScript(pkg: SdkPackage, products: ApiProduct[], endpoints: ApiEndpoint[]): string {
    const methods = endpoints.map((endpoint) => {
      const methodName = `${endpoint.method.toLowerCase()}${endpoint.path.replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => String(chr).toUpperCase()).replace(/[^a-zA-Z0-9]/g, "") || "Root"}`;
      return `  async ${methodName}(body?: unknown) { return this.request("${endpoint.method}", "${endpoint.path}", body); }`;
    }).join("\n");
    const productNames = products.map((item) => item.name).join(", ");
    return `// ${pkg.name} SDK for ${productNames}\nexport class ${className(pkg.name)}Client {\n  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}\n  private async request(method: string, path: string, body?: unknown) {\n    return { method, url: this.baseUrl + path, body, headers: { Authorization: \`Bearer \${this.apiKey}\` } };\n  }\n${methods}\n}\n`;
  }

  private generatePython(pkg: SdkPackage, products: ApiProduct[], endpoints: ApiEndpoint[]): string {
    const methods = endpoints.map((endpoint) => {
      const methodName = `${endpoint.method.toLowerCase()}_${endpoint.path.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "root"}`.toLowerCase();
      return `    def ${methodName}(self, body=None):\n        return self.request("${endpoint.method}", "${endpoint.path}", body)`;
    }).join("\n");
    const productNames = products.map((item) => item.name).join(", ");
    return `# ${pkg.name} SDK for ${productNames}\nclass ${className(pkg.name)}Client:\n    def __init__(self, base_url, api_key):\n        self.base_url = base_url\n        self.api_key = api_key\n\n    def request(self, method, path, body=None):\n        return {"method": method, "url": self.base_url + path, "body": body, "headers": {"Authorization": "Bearer " + self.api_key}}\n\n${methods}\n`;
  }
}

function className(value: string): string {
  return value.replace(/[^a-zA-Z0-9]+/g, " ").split(" ").filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join("") || "DeveloperOS";
}
