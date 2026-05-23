declare module "http" { export const createServer: any; export type IncomingMessage = any; export type ServerResponse = any; }
declare module "url" { export const URL: any; export type URLSearchParams = any; }
declare module "fs" { export const existsSync: any; export const mkdirSync: any; export const readFileSync: any; export const writeFileSync: any; export const unlinkSync: any; }
declare module "path" { export const dirname: any; export const resolve: any; export const join: any; }
declare const process: any;
