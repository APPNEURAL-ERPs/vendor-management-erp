export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role =
  | "viewer"
  | "teacher"
  | "coordinator"
  | "academic_admin"
  | "principal"
  | "learning_admin"
  | "admin"
  | "owner"
  | "auditor";

export interface RequestActor {
  tenantId: TenantId;
  userId: UUID;
  role: Role;
}

export interface BaseEntity {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type EntityStatus = "active" | "inactive" | "archived";
export type StudentStatus = "active" | "inactive" | "graduated" | "withdrawn";
export type EnrollmentStatus = "active" | "completed" | "transferred" | "withdrawn";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type SessionStatus = "open" | "closed";
export type ExamStatus = "scheduled" | "completed" | "published" | "cancelled";
export type AssignmentStatus = "draft" | "published" | "closed" | "archived";
export type SubmissionStatus = "assigned" | "submitted" | "late" | "graded" | "missing";
export type ReportCardStatus = "draft" | "published" | "archived";
export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface Student extends BaseEntity {
  admissionNo: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gradeLevel: string;
  section?: string;
  status: StudentStatus;
  guardianIds: UUID[];
  tags: string[];
  customFields: Record<string, unknown>;
  createdBy: UUID;
}

export interface Guardian extends BaseEntity {
  firstName: string;
  lastName: string;
  relation: string;
  email?: string;
  phone?: string;
  studentIds: UUID[];
  status: EntityStatus;
  createdBy: UUID;
}

export interface Teacher extends BaseEntity {
  employeeNo: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  subjectIds: UUID[];
  status: EntityStatus;
  createdBy: UUID;
}

export interface Classroom extends BaseEntity {
  name: string;
  gradeLevel: string;
  section: string;
  academicYear: string;
  classTeacherId?: UUID;
  capacity: number;
  status: EntityStatus;
  createdBy: UUID;
}

export interface Subject extends BaseEntity {
  code: string;
  name: string;
  gradeLevel: string;
  credits: number;
  teacherIds: UUID[];
  status: EntityStatus;
  createdBy: UUID;
}

export interface Enrollment extends BaseEntity {
  studentId: UUID;
  classId: UUID;
  academicYear: string;
  status: EnrollmentStatus;
  enrolledAt: ISODate;
  completedAt?: ISODate;
  createdBy: UUID;
}

export interface AttendanceSession extends BaseEntity {
  classId: UUID;
  subjectId?: UUID;
  teacherId: UUID;
  date: string;
  period?: string;
  topic?: string;
  status: SessionStatus;
  createdBy: UUID;
}

export interface AttendanceMark extends BaseEntity {
  sessionId: UUID;
  studentId: UUID;
  status: AttendanceStatus;
  remarks?: string;
  markedBy: UUID;
}

export interface Exam extends BaseEntity {
  name: string;
  classId: UUID;
  subjectId: UUID;
  term: string;
  examDate: string;
  maxMarks: number;
  weightage: number;
  status: ExamStatus;
  createdBy: UUID;
}

export interface ExamScore extends BaseEntity {
  examId: UUID;
  studentId: UUID;
  marksObtained: number;
  grade: string;
  result: "pass" | "fail";
  remarks?: string;
  evaluatedBy: UUID;
}

export interface Assignment extends BaseEntity {
  title: string;
  description?: string;
  classId: UUID;
  subjectId: UUID;
  teacherId: UUID;
  dueDate: string;
  maxMarks: number;
  status: AssignmentStatus;
  createdBy: UUID;
}

export interface AssignmentSubmission extends BaseEntity {
  assignmentId: UUID;
  studentId: UUID;
  status: SubmissionStatus;
  submittedAt?: ISODate;
  content?: string;
  attachmentUrls: string[];
  marks?: number;
  grade?: string;
  feedback?: string;
  gradedBy?: UUID;
}

export interface TimetableEntry extends BaseEntity {
  classId: UUID;
  subjectId: UUID;
  teacherId: UUID;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room?: string;
  status: EntityStatus;
  createdBy: UUID;
}

export interface SubjectResult {
  subjectId: UUID;
  subjectName: string;
  averagePercent: number;
  totalMarks: number;
  maxMarks: number;
  grade: string;
  result: "pass" | "fail";
  remarks?: string;
}

export interface ReportCard extends BaseEntity {
  studentId: UUID;
  classId: UUID;
  term: string;
  academicYear: string;
  attendancePercent: number;
  subjectResults: SubjectResult[];
  totalMarks: number;
  maxMarks: number;
  overallPercent: number;
  overallGrade: string;
  result: "pass" | "fail";
  status: ReportCardStatus;
  generatedBy: UUID;
  publishedAt?: ISODate;
}

export interface LearningEvent extends BaseEntity {
  type: string;
  source: "LearningOS";
  actorId: UUID;
  data: Record<string, unknown>;
}

export interface AuditLog extends BaseEntity {
  actorId: UUID;
  role: Role;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
}

export interface LearningState {
  students: Student[];
  guardians: Guardian[];
  teachers: Teacher[];
  classes: Classroom[];
  subjects: Subject[];
  enrollments: Enrollment[];
  attendanceSessions: AttendanceSession[];
  attendanceMarks: AttendanceMark[];
  exams: Exam[];
  examScores: ExamScore[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  timetableEntries: TimetableEntry[];
  reportCards: ReportCard[];
  events: LearningEvent[];
  auditLogs: AuditLog[];
}
