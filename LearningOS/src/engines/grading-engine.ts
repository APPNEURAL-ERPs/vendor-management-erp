import { round } from "../core/utils";

export function percent(marks: number, maxMarks: number): number {
  if (!Number.isFinite(maxMarks) || maxMarks <= 0) return 0;
  return round((Number(marks || 0) / maxMarks) * 100, 2);
}

export function gradeFromPercent(value: number): string {
  if (value >= 90) return "A+";
  if (value >= 80) return "A";
  if (value >= 70) return "B+";
  if (value >= 60) return "B";
  if (value >= 50) return "C";
  if (value >= 40) return "D";
  return "F";
}

export function resultFromPercent(value: number): "pass" | "fail" {
  return value >= 40 ? "pass" : "fail";
}
