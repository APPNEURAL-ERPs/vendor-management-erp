export function redact<T>(value: T): T {
  if (value === undefined || value === null) return value;
  return JSON.parse(
    JSON.stringify(value, (key, val) => {
      if (/secret|password|token|keyHash|encryptedValue|value|apiKey/i.test(key)) {
        return "***redacted***";
      }
      return val;
    })
  );
}
