import { randomToken } from "../core/id";
import { hashSecret, maskSecret } from "../core/utils";

export interface GeneratedApiKey {
  plainTextKey: string;
  keyPrefix: string;
  keyHash: string;
  maskedKey: string;
}

export class ApiKeyEngine {
  generate(environmentSlug = "dev"): GeneratedApiKey {
    const plainTextKey = `developeros_${environmentSlug}_${randomToken(32)}`;
    const keyPrefix = plainTextKey.slice(0, 18);
    return { plainTextKey, keyPrefix, keyHash: hashSecret(plainTextKey), maskedKey: maskSecret(plainTextKey) };
  }
  verify(plainTextKey: string, expectedHash: string): boolean { return hashSecret(plainTextKey) === expectedHash; }
}
