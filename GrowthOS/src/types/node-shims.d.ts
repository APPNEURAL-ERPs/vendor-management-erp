declare const process: any;
declare const console: any;
declare const Buffer: any;

declare module "fs" {
  export const existsSync: any;
  export const mkdirSync: any;
  export const readFileSync: any;
  export const writeFileSync: any;
  export const unlinkSync: any;
}

declare module "path" {
  export const dirname: any;
  export const resolve: any;
  export const join: any;
}

declare module "http" {
  export type IncomingMessage = any;
  export type ServerResponse = any;
  export const createServer: any;
}

declare module "url" {
  export class URLSearchParams {
    get(name: string): string | null;
    entries(): IterableIterator<[string, string]>;
  }
  export class URL {
    constructor(input: string, base?: string);
    pathname: string;
    searchParams: any;
  }
}
