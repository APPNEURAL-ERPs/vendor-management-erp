import { AttendanceMark } from "../core/domain";
import { round } from "../core/utils";

export function attendanceRate(marks: AttendanceMark[]): number {
  if (marks.length === 0) return 0;
  const attended = marks.filter((mark) => mark.status === "present" || mark.status === "late").length;
  return round((attended / marks.length) * 100, 2);
}

export function attendanceSummary(marks: AttendanceMark[]): Record<string, number> {
  return marks.reduce((acc, mark) => {
    acc[mark.status] = (acc[mark.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
