import { TimetableEntry } from "../core/domain";

function minutes(value: string): number {
  const [hour, minute] = String(value).split(":").map(Number);
  return (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0);
}

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return minutes(aStart) < minutes(bEnd) && minutes(bStart) < minutes(aEnd);
}

export function findTimetableConflict(entries: TimetableEntry[], candidate: Pick<TimetableEntry, "id" | "classId" | "teacherId" | "dayOfWeek" | "startTime" | "endTime">): TimetableEntry | undefined {
  return entries.find((entry) => entry.status === "active" && entry.id !== candidate.id && entry.dayOfWeek === candidate.dayOfWeek && overlaps(entry.startTime, entry.endTime, candidate.startTime, candidate.endTime) && (entry.classId === candidate.classId || entry.teacherId === candidate.teacherId));
}
