declare const process: { env: Record<string, string | undefined>; cwd(): string; exit(code?: number): never; argv: string[]; };
declare const __dirname: string;
declare module "http" { export type IncomingMessage = any; export type ServerResponse = any; export function createServer(handler: (req: IncomingMessage, res: ServerResponse) => void): any; }
declare module "fs" { export function existsSync(path: string): boolean; export function mkdirSync(path: string, options?: any): void; export function readFileSync(path: string, encoding?: string): string; export function writeFileSync(path: string, data: string): void; export function unlinkSync(path: string): void; }
declare module "path" { export function join(...paths: string[]): string; export function dirname(path: string): string; export function resolve(...paths: string[]): string; }
declare module "url" { export class URL { constructor(input: string, base?: string); pathname: string; searchParams: URLSearchParams; } }
declare const require: { main?: unknown; };
declare const module: unknown;
