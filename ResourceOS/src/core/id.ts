export function newId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function newResourceId(): string {
  return newId("res");
}

export function newAllocationId(): string {
  return newId("alloc");
}

export function newBookingId(): string {
  return newId("book");
}

export function newSkillId(): string {
  return newId("skill");
}

export function newPoolId(): string {
  return newId("pool");
}

export function newRequestId(): string {
  return newId("req");
}

export function newMaintenanceId(): string {
  return newId("maint");
}

export function newConflictId(): string {
  return newId("conflict");
}

export function newEventId(): string {
  return newId("evt");
}

export function newAuditId(): string {
  return newId("audit");
}
