export class HttpError extends Error { constructor(public statusCode: number, message: string, public details?: unknown) { super(message); } }
export function badRequest(message: string, details?: unknown): never { throw new HttpError(400, message, details); }
export function notFound(message: string, details?: unknown): never { throw new HttpError(404, message, details); }
export function forbidden(message: string, details?: unknown): never { throw new HttpError(403, message, details); }
export function conflict(message: string, details?: unknown): never { throw new HttpError(409, message, details); }
