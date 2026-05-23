import { flattenObject, toCsv } from "../core/utils";

export class ExportEngine {
  json(payload: unknown): string {
    return JSON.stringify(payload, null, 2);
  }

  csvFromRows(rows: Array<Record<string, unknown>>): string {
    return toCsv(rows.map((row) => flattenObject(row)));
  }

  csvFromPayload(payload: unknown): string {
    if (Array.isArray(payload)) return this.csvFromRows(payload as Array<Record<string, unknown>>);
    if (payload && typeof payload === "object") return this.csvFromRows([payload as Record<string, unknown>]);
    return toCsv([{ value: payload }]);
  }
}
