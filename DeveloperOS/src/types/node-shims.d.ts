declare const process: any;
declare const console: any;

declare module "fs" {
  export const existsSync: any;
  export const mkdirSync: any;
  export const readFileSync: any;
  export const writeFileSync: any;
}

declare module "path" {
  export const dirname: any;
  export const resolve: any;
}

declare module "http" {
  export type IncomingMessage = any;
  export type ServerResponse = any;
  export const createServer: any;
}

declare module "url" {
  export class URL {
    constructor(input: string, base?: string);
    pathname: string;
    searchParams: any;
  }
}

declare module "crypto" {
  export const randomBytes: any;
  export const randomUUID: any;
  export const createHash: any;
  export const createHmac: any;
}
