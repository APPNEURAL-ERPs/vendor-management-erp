export class HttpError extends Error {
  constructor(public readonly statusCode: number, message: string, public readonly details?: unknown) {
    super(message);
    this.name = "HttpError";
  }
}
export function badRequest(message: string, details?: unknown): never { throw new HttpError(400, message, details); }
export function notFound(message: string): never { throw new HttpError(404, message); }
export function forbidden(message = "Forbidden"): never { throw new HttpError(403, message); }
