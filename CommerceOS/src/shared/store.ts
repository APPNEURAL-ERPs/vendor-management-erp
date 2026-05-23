import { NotFoundError } from "./errors";

export class InMemoryRepository<T extends { id: string; tenantId?: string }> {
  private records = new Map<string, T>();

  create(record: T): T {
    this.records.set(record.id, structuredClone(record));
    return this.get(record.id);
  }

  get(id: string): T {
    const record = this.records.get(id);
    if (!record) {
      throw new NotFoundError(`Record not found: ${id}`);
    }
    return structuredClone(record);
  }

  find(id: string): T | undefined {
    const record = this.records.get(id);
    return record ? structuredClone(record) : undefined;
  }

  list(): T[] {
    return Array.from(this.records.values()).map((record) => structuredClone(record));
  }

  listByTenant(tenantId: string): T[] {
    return this.list().filter((record) => record.tenantId === tenantId);
  }

  update(id: string, updater: (current: T) => T): T {
    const current = this.get(id);
    const next = updater(current);
    this.records.set(id, structuredClone(next));
    return this.get(id);
  }

  delete(id: string): void {
    if (!this.records.has(id)) {
      throw new NotFoundError(`Record not found: ${id}`);
    }
    this.records.delete(id);
  }

  clear(): void {
    this.records.clear();
  }
}
