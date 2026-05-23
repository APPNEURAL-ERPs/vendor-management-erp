import {
  Assignment,
  AssignmentSubmission,
  AttendanceMark,
  AttendanceSession,
  BaseEntity,
  Classroom,
  DayOfWeek,
  Enrollment,
  EntityStatus,
  Exam,
  ExamScore,
  Guardian,
  LearningState,
  ReportCard,
  RequestActor,
  Student,
  Subject,
  Teacher,
  TimetableEntry
} from "../core/domain";
import { DataStore } from "../core/datastore";
import { EventBus } from "../core/event-bus";
import { badRequest, notFound } from "../core/errors";
import { humanNumber, newId, nowIso } from "../core/id";
import { asArray, assertPositiveAmount, assertRequired, clone, includesText, normalizeEmail, numberOr, round, unique } from "../core/utils";
import { attendanceRate, attendanceSummary } from "../engines/attendance-engine";
import { gradeFromPercent, percent, resultFromPercent } from "../engines/grading-engine";
import { findTimetableConflict } from "../engines/timetable-engine";

function body(input: unknown): Record<string, any> { return (input && typeof input === "object") ? input as Record<string, any> : {}; }
function statusOr(value: unknown, fallback: EntityStatus): EntityStatus { return ["active", "inactive", "archived"].includes(String(value)) ? value as EntityStatus : fallback; }
function studentStatusOr(value: unknown, fallback: Student["status"]): Student["status"] { return ["active", "inactive", "graduated", "withdrawn"].includes(String(value)) ? value as Student["status"] : fallback; }
function assignmentStatusOr(value: unknown, fallback: Assignment["status"]): Assignment["status"] { return ["draft", "published", "closed", "archived"].includes(String(value)) ? value as Assignment["status"] : fallback; }
function dayOfWeekOr(value: unknown): DayOfWeek {
  const day = String(value ?? "").toLowerCase();
  if (["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].includes(day)) return day as DayOfWeek;
  badRequest("dayOfWeek must be monday, tuesday, wednesday, thursday, friday, saturday, or sunday");
}

export class LearningService {
  constructor(private readonly store: DataStore, private readonly events: EventBus) {}

  private state(): LearningState { return this.store.getState(); }
  private tenant<T extends BaseEntity>(actor: RequestActor, items: T[]): T[] { return items.filter((item) => item.tenantId === actor.tenantId); }
  private now(): string { return nowIso(); }

  private findStudent(actor: RequestActor, id: string): Student { return this.tenant(actor, this.state().students).find((item) => item.id === id) ?? notFound(`Student ${id} not found`); }
  private findGuardian(actor: RequestActor, id: string): Guardian { return this.tenant(actor, this.state().guardians).find((item) => item.id === id) ?? notFound(`Guardian ${id} not found`); }
  private findTeacher(actor: RequestActor, id: string): Teacher { return this.tenant(actor, this.state().teachers).find((item) => item.id === id) ?? notFound(`Teacher ${id} not found`); }
  private findClass(actor: RequestActor, id: string): Classroom { return this.tenant(actor, this.state().classes).find((item) => item.id === id) ?? notFound(`Class ${id} not found`); }
  private findSubject(actor: RequestActor, id: string): Subject { return this.tenant(actor, this.state().subjects).find((item) => item.id === id) ?? notFound(`Subject ${id} not found`); }
  private findEnrollment(actor: RequestActor, id: string): Enrollment { return this.tenant(actor, this.state().enrollments).find((item) => item.id === id) ?? notFound(`Enrollment ${id} not found`); }
  private findAttendanceSession(actor: RequestActor, id: string): AttendanceSession { return this.tenant(actor, this.state().attendanceSessions).find((item) => item.id === id) ?? notFound(`Attendance session ${id} not found`); }
  private findExam(actor: RequestActor, id: string): Exam { return this.tenant(actor, this.state().exams).find((item) => item.id === id) ?? notFound(`Exam ${id} not found`); }
  private findAssignment(actor: RequestActor, id: string): Assignment { return this.tenant(actor, this.state().assignments).find((item) => item.id === id) ?? notFound(`Assignment ${id} not found`); }
  private findSubmission(actor: RequestActor, id: string): AssignmentSubmission { return this.tenant(actor, this.state().submissions).find((item) => item.id === id) ?? notFound(`Submission ${id} not found`); }
  private findReportCard(actor: RequestActor, id: string): ReportCard { return this.tenant(actor, this.state().reportCards).find((item) => item.id === id) ?? notFound(`Report card ${id} not found`); }

  private saveAuditEvent(actor: RequestActor, action: string, entityType: string, entityId: string, before: unknown, after: unknown, eventType: string, data: Record<string, unknown>): void {
    this.store.save();
    this.store.audit(actor, action, entityType, entityId, before, after);
    this.events.emit(actor, eventType, data);
  }

  overview(actor: RequestActor): Record<string, unknown> {
    const analytics = this.analytics(actor);
    return {
      service: "LearningOS",
      tenantId: actor.tenantId,
      analytics,
      counts: {
        students: this.tenant(actor, this.state().students).length,
        teachers: this.tenant(actor, this.state().teachers).length,
        classes: this.tenant(actor, this.state().classes).length,
        subjects: this.tenant(actor, this.state().subjects).length,
        activeEnrollments: this.tenant(actor, this.state().enrollments).filter((item) => item.status === "active").length,
        assignments: this.tenant(actor, this.state().assignments).length,
        exams: this.tenant(actor, this.state().exams).length
      },
      recentEvents: this.listEvents(actor).slice(0, 10)
    };
  }

  analytics(actor: RequestActor): Record<string, unknown> {
    const students = this.tenant(actor, this.state().students);
    const activeStudents = students.filter((student) => student.status === "active");
    const marks = this.tenant(actor, this.state().attendanceMarks);
    const scores = this.tenant(actor, this.state().examScores);
    const exams = this.tenant(actor, this.state().exams);
    const assignments = this.tenant(actor, this.state().assignments);
    const submissions = this.tenant(actor, this.state().submissions);
    const activeEnrollments = this.tenant(actor, this.state().enrollments).filter((item) => item.status === "active");

    const scorePercents = scores.map((score) => {
      const exam = exams.find((item) => item.id === score.examId);
      return exam ? percent(score.marksObtained, exam.maxMarks) : 0;
    });
    const averageExamPercent = scorePercents.length ? round(scorePercents.reduce((a, b) => a + b, 0) / scorePercents.length, 2) : 0;
    const gradedOrSubmitted = submissions.filter((item) => ["submitted", "late", "graded"].includes(item.status)).length;
    const atRiskStudents = activeStudents.filter((student) => {
      const studentMarks = marks.filter((mark) => mark.studentId === student.id);
      const studentScores = scores.filter((score) => score.studentId === student.id);
      const studentPercents = studentScores.map((score) => {
        const exam = exams.find((item) => item.id === score.examId);
        return exam ? percent(score.marksObtained, exam.maxMarks) : 0;
      });
      const avg = studentPercents.length ? studentPercents.reduce((a, b) => a + b, 0) / studentPercents.length : 100;
      const attendance = studentMarks.length ? attendanceRate(studentMarks) : 100;
      return attendance < 75 || avg < 40;
    });

    const classAnalytics = this.tenant(actor, this.state().classes).map((classroom) => {
      const enrollmentCount = activeEnrollments.filter((enrollment) => enrollment.classId === classroom.id).length;
      const sessionIds = this.tenant(actor, this.state().attendanceSessions).filter((session) => session.classId === classroom.id).map((session) => session.id);
      const classMarks = marks.filter((mark) => sessionIds.includes(mark.sessionId));
      const classExams = exams.filter((exam) => exam.classId === classroom.id);
      const classScores = scores.filter((score) => classExams.some((exam) => exam.id === score.examId));
      const classScorePercents = classScores.map((score) => percent(score.marksObtained, classExams.find((exam) => exam.id === score.examId)?.maxMarks ?? 0));
      return {
        id: classroom.id,
        name: classroom.name,
        enrollmentCount,
        attendanceRate: attendanceRate(classMarks),
        averageExamPercent: classScorePercents.length ? round(classScorePercents.reduce((a, b) => a + b, 0) / classScorePercents.length, 2) : 0
      };
    });

    return {
      totalStudents: students.length,
      activeStudents: activeStudents.length,
      totalTeachers: this.tenant(actor, this.state().teachers).length,
      activeClasses: this.tenant(actor, this.state().classes).filter((item) => item.status === "active").length,
      totalSubjects: this.tenant(actor, this.state().subjects).length,
      activeEnrollments: activeEnrollments.length,
      attendanceRate: attendanceRate(marks),
      attendanceSummary: attendanceSummary(marks),
      averageExamPercent,
      passRate: scores.length ? round((scores.filter((score) => score.result === "pass").length / scores.length) * 100, 2) : 0,
      assignmentCompletionRate: submissions.length ? round((gradedOrSubmitted / submissions.length) * 100, 2) : 0,
      pendingSubmissions: submissions.filter((item) => item.status === "assigned" || item.status === "missing").length,
      scheduledExams: exams.filter((exam) => exam.status === "scheduled").length,
      openAssignments: assignments.filter((assignment) => assignment.status === "published").length,
      atRiskStudents: atRiskStudents.map((student) => ({ id: student.id, name: `${student.firstName} ${student.lastName}`, admissionNo: student.admissionNo })),
      classAnalytics
    };
  }

  listStudents(actor: RequestActor, query: Record<string, string | undefined> = {}): Student[] {
    let students = this.tenant(actor, this.state().students);
    if (query.status) students = students.filter((student) => student.status === query.status);
    if (query.classId) {
      const studentIds = this.tenant(actor, this.state().enrollments).filter((item) => item.classId === query.classId && item.status === "active").map((item) => item.studentId);
      students = students.filter((student) => studentIds.includes(student.id));
    }
    if (query.q) students = students.filter((student) => includesText(student.firstName, query.q!) || includesText(student.lastName, query.q!) || includesText(student.admissionNo, query.q!) || includesText(student.email, query.q!));
    return students;
  }

  createStudent(actor: RequestActor, input: unknown): Student {
    const data = body(input);
    assertRequired(data.firstName, "firstName");
    assertRequired(data.lastName, "lastName");
    assertRequired(data.gradeLevel, "gradeLevel");
    const admissionNo = String(data.admissionNo ?? humanNumber("STU"));
    const duplicate = this.tenant(actor, this.state().students).find((student) => student.admissionNo === admissionNo);
    if (duplicate) badRequest(`Student admissionNo ${admissionNo} already exists`);
    const now = this.now();
    const guardianIds = unique(asArray<string>(data.guardianIds));
    guardianIds.forEach((id) => this.findGuardian(actor, id));
    const student: Student = {
      id: data.id ?? newId("stu"), tenantId: actor.tenantId, createdAt: now, updatedAt: now,
      admissionNo, firstName: String(data.firstName), lastName: String(data.lastName), email: data.email ? normalizeEmail(String(data.email)) : undefined, phone: data.phone ? String(data.phone) : undefined, dateOfBirth: data.dateOfBirth ? String(data.dateOfBirth) : undefined, gradeLevel: String(data.gradeLevel), section: data.section ? String(data.section) : undefined, status: studentStatusOr(data.status, "active"), guardianIds, tags: unique(asArray<string>(data.tags).map(String)), customFields: body(data.customFields), createdBy: actor.userId
    };
    this.state().students.push(student);
    for (const id of guardianIds) {
      const guardian = this.findGuardian(actor, id);
      guardian.studentIds = unique([...guardian.studentIds, student.id]);
      guardian.updatedAt = now;
    }
    this.saveAuditEvent(actor, "student.create", "Student", student.id, undefined, student, "student.created", { studentId: student.id, admissionNo: student.admissionNo });
    return student;
  }

  updateStudent(actor: RequestActor, id: string, input: unknown): Student {
    const student = this.findStudent(actor, id);
    const before = clone(student);
    const data = body(input);
    if (data.firstName !== undefined) student.firstName = String(data.firstName);
    if (data.lastName !== undefined) student.lastName = String(data.lastName);
    if (data.email !== undefined) student.email = data.email ? normalizeEmail(String(data.email)) : undefined;
    if (data.phone !== undefined) student.phone = data.phone ? String(data.phone) : undefined;
    if (data.gradeLevel !== undefined) student.gradeLevel = String(data.gradeLevel);
    if (data.section !== undefined) student.section = data.section ? String(data.section) : undefined;
    if (data.status !== undefined) student.status = studentStatusOr(data.status, student.status);
    if (data.tags !== undefined) student.tags = unique(asArray<string>(data.tags).map(String));
    if (data.customFields !== undefined) student.customFields = body(data.customFields);
    student.updatedAt = this.now();
    this.saveAuditEvent(actor, "student.update", "Student", student.id, before, student, "student.updated", { studentId: student.id });
    return student;
  }

  listGuardians(actor: RequestActor): Guardian[] { return this.tenant(actor, this.state().guardians); }
  createGuardian(actor: RequestActor, input: unknown): Guardian {
    const data = body(input);
    assertRequired(data.firstName, "firstName");
    assertRequired(data.lastName, "lastName");
    assertRequired(data.relation, "relation");
    const now = this.now();
    const studentIds = unique(asArray<string>(data.studentIds));
    studentIds.forEach((id) => this.findStudent(actor, id));
    const guardian: Guardian = { id: data.id ?? newId("guard"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, firstName: String(data.firstName), lastName: String(data.lastName), relation: String(data.relation), email: data.email ? normalizeEmail(String(data.email)) : undefined, phone: data.phone ? String(data.phone) : undefined, studentIds, status: statusOr(data.status, "active"), createdBy: actor.userId };
    this.state().guardians.push(guardian);
    for (const id of studentIds) {
      const student = this.findStudent(actor, id);
      student.guardianIds = unique([...student.guardianIds, guardian.id]);
      student.updatedAt = now;
    }
    this.saveAuditEvent(actor, "guardian.create", "Guardian", guardian.id, undefined, guardian, "guardian.created", { guardianId: guardian.id });
    return guardian;
  }

  listTeachers(actor: RequestActor): Teacher[] { return this.tenant(actor, this.state().teachers); }
  createTeacher(actor: RequestActor, input: unknown): Teacher {
    const data = body(input);
    assertRequired(data.firstName, "firstName");
    assertRequired(data.lastName, "lastName");
    const employeeNo = String(data.employeeNo ?? humanNumber("EMP"));
    const duplicate = this.tenant(actor, this.state().teachers).find((teacher) => teacher.employeeNo === employeeNo);
    if (duplicate) badRequest(`Teacher employeeNo ${employeeNo} already exists`);
    const now = this.now();
    const subjectIds = unique(asArray<string>(data.subjectIds));
    subjectIds.forEach((id) => this.findSubject(actor, id));
    const teacher: Teacher = { id: data.id ?? newId("teacher"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, employeeNo, firstName: String(data.firstName), lastName: String(data.lastName), email: data.email ? normalizeEmail(String(data.email)) : undefined, phone: data.phone ? String(data.phone) : undefined, subjectIds, status: statusOr(data.status, "active"), createdBy: actor.userId };
    this.state().teachers.push(teacher);
    for (const id of subjectIds) {
      const subject = this.findSubject(actor, id);
      subject.teacherIds = unique([...subject.teacherIds, teacher.id]);
      subject.updatedAt = now;
    }
    this.saveAuditEvent(actor, "teacher.create", "Teacher", teacher.id, undefined, teacher, "teacher.created", { teacherId: teacher.id, employeeNo: teacher.employeeNo });
    return teacher;
  }

  listClasses(actor: RequestActor): Classroom[] { return this.tenant(actor, this.state().classes); }
  createClassroom(actor: RequestActor, input: unknown): Classroom {
    const data = body(input);
    assertRequired(data.name, "name");
    assertRequired(data.gradeLevel, "gradeLevel");
    assertRequired(data.section, "section");
    assertRequired(data.academicYear, "academicYear");
    if (data.classTeacherId) this.findTeacher(actor, String(data.classTeacherId));
    const now = this.now();
    const classroom: Classroom = { id: data.id ?? newId("class"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, name: String(data.name), gradeLevel: String(data.gradeLevel), section: String(data.section), academicYear: String(data.academicYear), classTeacherId: data.classTeacherId ? String(data.classTeacherId) : undefined, capacity: Math.max(1, Math.floor(numberOr(data.capacity, 40))), status: statusOr(data.status, "active"), createdBy: actor.userId };
    this.state().classes.push(classroom);
    this.saveAuditEvent(actor, "class.create", "Classroom", classroom.id, undefined, classroom, "class.created", { classId: classroom.id, name: classroom.name });
    return classroom;
  }

  listSubjects(actor: RequestActor): Subject[] { return this.tenant(actor, this.state().subjects); }
  createSubject(actor: RequestActor, input: unknown): Subject {
    const data = body(input);
    assertRequired(data.name, "name");
    assertRequired(data.gradeLevel, "gradeLevel");
    const code = String(data.code ?? String(data.name).slice(0, 4).toUpperCase());
    const duplicate = this.tenant(actor, this.state().subjects).find((subject) => subject.code === code && subject.gradeLevel === String(data.gradeLevel));
    if (duplicate) badRequest(`Subject code ${code} already exists for grade ${data.gradeLevel}`);
    const now = this.now();
    const teacherIds = unique(asArray<string>(data.teacherIds));
    teacherIds.forEach((id) => this.findTeacher(actor, id));
    const subject: Subject = { id: data.id ?? newId("subj"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, code, name: String(data.name), gradeLevel: String(data.gradeLevel), credits: Math.max(0, numberOr(data.credits, 1)), teacherIds, status: statusOr(data.status, "active"), createdBy: actor.userId };
    this.state().subjects.push(subject);
    for (const id of teacherIds) {
      const teacher = this.findTeacher(actor, id);
      teacher.subjectIds = unique([...teacher.subjectIds, subject.id]);
      teacher.updatedAt = now;
    }
    this.saveAuditEvent(actor, "subject.create", "Subject", subject.id, undefined, subject, "subject.created", { subjectId: subject.id, code: subject.code });
    return subject;
  }

  listEnrollments(actor: RequestActor): Enrollment[] { return this.tenant(actor, this.state().enrollments); }
  enrollStudent(actor: RequestActor, input: unknown): Enrollment {
    const data = body(input);
    assertRequired(data.studentId, "studentId");
    assertRequired(data.classId, "classId");
    const student = this.findStudent(actor, String(data.studentId));
    const classroom = this.findClass(actor, String(data.classId));
    const duplicate = this.tenant(actor, this.state().enrollments).find((enrollment) => enrollment.studentId === student.id && enrollment.classId === classroom.id && enrollment.status === "active");
    if (duplicate) badRequest(`Student ${student.id} is already actively enrolled in class ${classroom.id}`);
    const activeCount = this.tenant(actor, this.state().enrollments).filter((enrollment) => enrollment.classId === classroom.id && enrollment.status === "active").length;
    if (activeCount >= classroom.capacity) badRequest(`Class ${classroom.name} is at capacity`);
    const now = this.now();
    const enrollment: Enrollment = { id: data.id ?? newId("enroll"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, studentId: student.id, classId: classroom.id, academicYear: String(data.academicYear ?? classroom.academicYear), status: "active", enrolledAt: now, createdBy: actor.userId };
    student.gradeLevel = classroom.gradeLevel;
    student.section = classroom.section;
    student.updatedAt = now;
    this.state().enrollments.push(enrollment);
    this.saveAuditEvent(actor, "enrollment.create", "Enrollment", enrollment.id, undefined, enrollment, "student.enrolled", { studentId: student.id, classId: classroom.id });
    return enrollment;
  }

  listAttendanceSessions(actor: RequestActor): AttendanceSession[] { return this.tenant(actor, this.state().attendanceSessions); }
  createAttendanceSession(actor: RequestActor, input: unknown): AttendanceSession {
    const data = body(input);
    assertRequired(data.classId, "classId");
    assertRequired(data.teacherId, "teacherId");
    assertRequired(data.date, "date");
    const classroom = this.findClass(actor, String(data.classId));
    const teacher = this.findTeacher(actor, String(data.teacherId));
    if (data.subjectId) this.findSubject(actor, String(data.subjectId));
    const now = this.now();
    const session: AttendanceSession = { id: data.id ?? newId("attn_sess"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, classId: classroom.id, subjectId: data.subjectId ? String(data.subjectId) : undefined, teacherId: teacher.id, date: String(data.date), period: data.period ? String(data.period) : undefined, topic: data.topic ? String(data.topic) : undefined, status: "open", createdBy: actor.userId };
    this.state().attendanceSessions.push(session);
    this.saveAuditEvent(actor, "attendance_session.create", "AttendanceSession", session.id, undefined, session, "attendance.session.created", { sessionId: session.id, classId: classroom.id });
    return session;
  }

  markAttendance(actor: RequestActor, sessionId: string, input: unknown): AttendanceMark {
    const session = this.findAttendanceSession(actor, sessionId);
    if (session.status === "closed") badRequest("Attendance session is closed");
    const data = body(input);
    assertRequired(data.studentId, "studentId");
    assertRequired(data.status, "status");
    const status = String(data.status) as AttendanceMark["status"];
    if (!["present", "absent", "late", "excused"].includes(status)) badRequest("status must be present, absent, late, or excused");
    const student = this.findStudent(actor, String(data.studentId));
    const enrollment = this.tenant(actor, this.state().enrollments).find((item) => item.studentId === student.id && item.classId === session.classId && item.status === "active");
    if (!enrollment) badRequest(`Student ${student.id} is not actively enrolled in class ${session.classId}`);
    const existing = this.tenant(actor, this.state().attendanceMarks).find((mark) => mark.sessionId === session.id && mark.studentId === student.id);
    const now = this.now();
    if (existing) {
      const before = clone(existing);
      existing.status = status;
      existing.remarks = data.remarks ? String(data.remarks) : undefined;
      existing.markedBy = actor.userId;
      existing.updatedAt = now;
      this.saveAuditEvent(actor, "attendance_mark.update", "AttendanceMark", existing.id, before, existing, "attendance.mark.updated", { sessionId: session.id, studentId: student.id, status });
      return existing;
    }
    const mark: AttendanceMark = { id: data.id ?? newId("attn"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, sessionId: session.id, studentId: student.id, status, remarks: data.remarks ? String(data.remarks) : undefined, markedBy: actor.userId };
    this.state().attendanceMarks.push(mark);
    this.saveAuditEvent(actor, "attendance_mark.create", "AttendanceMark", mark.id, undefined, mark, "attendance.mark.created", { sessionId: session.id, studentId: student.id, status });
    return mark;
  }

  bulkMarkAttendance(actor: RequestActor, sessionId: string, input: unknown): AttendanceMark[] {
    const data = body(input);
    const marks = asArray<Record<string, unknown>>(data.marks);
    if (!marks.length) badRequest("marks array is required");
    return marks.map((mark) => this.markAttendance(actor, sessionId, mark));
  }

  closeAttendanceSession(actor: RequestActor, sessionId: string): AttendanceSession {
    const session = this.findAttendanceSession(actor, sessionId);
    const before = clone(session);
    session.status = "closed";
    session.updatedAt = this.now();
    this.saveAuditEvent(actor, "attendance_session.close", "AttendanceSession", session.id, before, session, "attendance.session.closed", { sessionId: session.id });
    return session;
  }

  listExams(actor: RequestActor): Exam[] { return this.tenant(actor, this.state().exams); }
  createExam(actor: RequestActor, input: unknown): Exam {
    const data = body(input);
    assertRequired(data.name, "name");
    assertRequired(data.classId, "classId");
    assertRequired(data.subjectId, "subjectId");
    assertRequired(data.term, "term");
    assertRequired(data.examDate, "examDate");
    const classroom = this.findClass(actor, String(data.classId));
    const subject = this.findSubject(actor, String(data.subjectId));
    const maxMarks = assertPositiveAmount(data.maxMarks ?? 100, "maxMarks");
    const now = this.now();
    const exam: Exam = { id: data.id ?? newId("exam"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, name: String(data.name), classId: classroom.id, subjectId: subject.id, term: String(data.term), examDate: String(data.examDate), maxMarks, weightage: Math.max(0, numberOr(data.weightage, 100)), status: "scheduled", createdBy: actor.userId };
    this.state().exams.push(exam);
    this.saveAuditEvent(actor, "exam.create", "Exam", exam.id, undefined, exam, "exam.created", { examId: exam.id, classId: classroom.id, subjectId: subject.id });
    return exam;
  }

  recordExamScore(actor: RequestActor, examId: string, input: unknown): ExamScore {
    const exam = this.findExam(actor, examId);
    const data = body(input);
    assertRequired(data.studentId, "studentId");
    const student = this.findStudent(actor, String(data.studentId));
    const enrollment = this.tenant(actor, this.state().enrollments).find((item) => item.studentId === student.id && item.classId === exam.classId && item.status === "active");
    if (!enrollment) badRequest(`Student ${student.id} is not actively enrolled in exam class ${exam.classId}`);
    const marksObtained = Number(data.marksObtained);
    if (!Number.isFinite(marksObtained) || marksObtained < 0 || marksObtained > exam.maxMarks) badRequest(`marksObtained must be between 0 and ${exam.maxMarks}`);
    const scorePercent = percent(marksObtained, exam.maxMarks);
    const grade = gradeFromPercent(scorePercent);
    const result = resultFromPercent(scorePercent);
    const existing = this.tenant(actor, this.state().examScores).find((score) => score.examId === exam.id && score.studentId === student.id);
    const now = this.now();
    if (existing) {
      const before = clone(existing);
      existing.marksObtained = marksObtained;
      existing.grade = grade;
      existing.result = result;
      existing.remarks = data.remarks ? String(data.remarks) : undefined;
      existing.evaluatedBy = actor.userId;
      existing.updatedAt = now;
      exam.status = exam.status === "scheduled" ? "completed" : exam.status;
      exam.updatedAt = now;
      this.saveAuditEvent(actor, "exam_score.update", "ExamScore", existing.id, before, existing, "exam.score.updated", { examId: exam.id, studentId: student.id, marksObtained });
      return existing;
    }
    const score: ExamScore = { id: data.id ?? newId("score"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, examId: exam.id, studentId: student.id, marksObtained, grade, result, remarks: data.remarks ? String(data.remarks) : undefined, evaluatedBy: actor.userId };
    exam.status = exam.status === "scheduled" ? "completed" : exam.status;
    exam.updatedAt = now;
    this.state().examScores.push(score);
    this.saveAuditEvent(actor, "exam_score.create", "ExamScore", score.id, undefined, score, "exam.score.created", { examId: exam.id, studentId: student.id, marksObtained });
    return score;
  }

  publishExam(actor: RequestActor, examId: string): Exam {
    const exam = this.findExam(actor, examId);
    const before = clone(exam);
    exam.status = "published";
    exam.updatedAt = this.now();
    this.saveAuditEvent(actor, "exam.publish", "Exam", exam.id, before, exam, "exam.published", { examId: exam.id });
    return exam;
  }

  listAssignments(actor: RequestActor): Assignment[] { return this.tenant(actor, this.state().assignments); }
  createAssignment(actor: RequestActor, input: unknown): Assignment {
    const data = body(input);
    assertRequired(data.title, "title");
    assertRequired(data.classId, "classId");
    assertRequired(data.subjectId, "subjectId");
    assertRequired(data.teacherId, "teacherId");
    assertRequired(data.dueDate, "dueDate");
    const classroom = this.findClass(actor, String(data.classId));
    const subject = this.findSubject(actor, String(data.subjectId));
    const teacher = this.findTeacher(actor, String(data.teacherId));
    const maxMarks = assertPositiveAmount(data.maxMarks ?? 100, "maxMarks");
    const now = this.now();
    const assignment: Assignment = { id: data.id ?? newId("asgn"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, title: String(data.title), description: data.description ? String(data.description) : undefined, classId: classroom.id, subjectId: subject.id, teacherId: teacher.id, dueDate: String(data.dueDate), maxMarks, status: assignmentStatusOr(data.status, "published"), createdBy: actor.userId };
    this.state().assignments.push(assignment);
    const enrollments = this.tenant(actor, this.state().enrollments).filter((enrollment) => enrollment.classId === classroom.id && enrollment.status === "active");
    for (const enrollment of enrollments) {
      const submission: AssignmentSubmission = { id: newId("subm"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, assignmentId: assignment.id, studentId: enrollment.studentId, status: "assigned", attachmentUrls: [] };
      this.state().submissions.push(submission);
    }
    this.saveAuditEvent(actor, "assignment.create", "Assignment", assignment.id, undefined, assignment, "assignment.created", { assignmentId: assignment.id, classId: classroom.id, submissionsCreated: enrollments.length });
    return assignment;
  }

  listSubmissions(actor: RequestActor): AssignmentSubmission[] { return this.tenant(actor, this.state().submissions); }
  submitAssignment(actor: RequestActor, assignmentId: string, input: unknown): AssignmentSubmission {
    const assignment = this.findAssignment(actor, assignmentId);
    if (assignment.status !== "published") badRequest("Assignment is not open for submissions");
    const data = body(input);
    assertRequired(data.studentId, "studentId");
    const student = this.findStudent(actor, String(data.studentId));
    const now = this.now();
    const isLate = new Date(now).getTime() > new Date(assignment.dueDate).getTime();
    let submission = this.tenant(actor, this.state().submissions).find((item) => item.assignmentId === assignment.id && item.studentId === student.id);
    if (!submission) {
      submission = { id: data.id ?? newId("subm"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, assignmentId: assignment.id, studentId: student.id, status: "assigned", attachmentUrls: [] };
      this.state().submissions.push(submission);
    }
    const before = clone(submission);
    submission.status = isLate ? "late" : "submitted";
    submission.submittedAt = now;
    submission.content = data.content ? String(data.content) : submission.content;
    submission.attachmentUrls = unique(asArray<string>(data.attachmentUrls).map(String));
    submission.updatedAt = now;
    this.saveAuditEvent(actor, "assignment.submit", "AssignmentSubmission", submission.id, before, submission, "assignment.submitted", { assignmentId: assignment.id, studentId: student.id, status: submission.status });
    return submission;
  }

  gradeSubmission(actor: RequestActor, submissionId: string, input: unknown): AssignmentSubmission {
    const submission = this.findSubmission(actor, submissionId);
    const assignment = this.findAssignment(actor, submission.assignmentId);
    const data = body(input);
    const marks = Number(data.marks);
    if (!Number.isFinite(marks) || marks < 0 || marks > assignment.maxMarks) badRequest(`marks must be between 0 and ${assignment.maxMarks}`);
    const before = clone(submission);
    submission.marks = marks;
    const scorePercent = percent(marks, assignment.maxMarks);
    submission.grade = gradeFromPercent(scorePercent);
    submission.feedback = data.feedback ? String(data.feedback) : undefined;
    submission.status = "graded";
    submission.gradedBy = actor.userId;
    submission.updatedAt = this.now();
    this.saveAuditEvent(actor, "submission.grade", "AssignmentSubmission", submission.id, before, submission, "assignment.graded", { submissionId: submission.id, assignmentId: assignment.id, marks });
    return submission;
  }

  listTimetable(actor: RequestActor): TimetableEntry[] { return this.tenant(actor, this.state().timetableEntries); }
  addTimetableEntry(actor: RequestActor, input: unknown): TimetableEntry {
    const data = body(input);
    assertRequired(data.classId, "classId");
    assertRequired(data.subjectId, "subjectId");
    assertRequired(data.teacherId, "teacherId");
    assertRequired(data.dayOfWeek, "dayOfWeek");
    assertRequired(data.startTime, "startTime");
    assertRequired(data.endTime, "endTime");
    const classroom = this.findClass(actor, String(data.classId));
    const subject = this.findSubject(actor, String(data.subjectId));
    const teacher = this.findTeacher(actor, String(data.teacherId));
    const now = this.now();
    const entry: TimetableEntry = { id: data.id ?? newId("tt"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, classId: classroom.id, subjectId: subject.id, teacherId: teacher.id, dayOfWeek: dayOfWeekOr(data.dayOfWeek), startTime: String(data.startTime), endTime: String(data.endTime), room: data.room ? String(data.room) : undefined, status: statusOr(data.status, "active"), createdBy: actor.userId };
    if (entry.startTime >= entry.endTime) badRequest("startTime must be before endTime");
    const conflict = findTimetableConflict(this.tenant(actor, this.state().timetableEntries), entry);
    if (conflict) badRequest(`Timetable conflict with entry ${conflict.id}`);
    this.state().timetableEntries.push(entry);
    this.saveAuditEvent(actor, "timetable.create", "TimetableEntry", entry.id, undefined, entry, "timetable.entry.created", { timetableEntryId: entry.id, classId: classroom.id, teacherId: teacher.id });
    return entry;
  }

  listReportCards(actor: RequestActor): ReportCard[] { return this.tenant(actor, this.state().reportCards); }
  generateReportCard(actor: RequestActor, studentId: string, input: unknown): ReportCard {
    const student = this.findStudent(actor, studentId);
    const data = body(input);
    assertRequired(data.classId, "classId");
    assertRequired(data.term, "term");
    const classroom = this.findClass(actor, String(data.classId));
    const academicYear = String(data.academicYear ?? classroom.academicYear);
    const term = String(data.term);
    const enrollment = this.tenant(actor, this.state().enrollments).find((item) => item.studentId === student.id && item.classId === classroom.id && item.academicYear === academicYear);
    if (!enrollment) badRequest(`Student ${student.id} is not enrolled in class ${classroom.id} for ${academicYear}`);

    const exams = this.tenant(actor, this.state().exams).filter((exam) => exam.classId === classroom.id && exam.term === term && exam.status !== "cancelled");
    const subjectIds = unique(exams.map((exam) => exam.subjectId));
    const subjectResults = subjectIds.map((subjectId) => {
      const subject = this.findSubject(actor, subjectId);
      const subjectExams = exams.filter((exam) => exam.subjectId === subjectId);
      const subjectScores = this.tenant(actor, this.state().examScores).filter((score) => score.studentId === student.id && subjectExams.some((exam) => exam.id === score.examId));
      const totalMarks = round(subjectScores.reduce((sum, score) => sum + score.marksObtained, 0));
      const maxMarks = round(subjectScores.reduce((sum, score) => sum + (subjectExams.find((exam) => exam.id === score.examId)?.maxMarks ?? 0), 0));
      const averagePercent = percent(totalMarks, maxMarks);
      return { subjectId, subjectName: subject.name, averagePercent, totalMarks, maxMarks, grade: gradeFromPercent(averagePercent), result: resultFromPercent(averagePercent) };
    });
    const totalMarks = round(subjectResults.reduce((sum, result) => sum + result.totalMarks, 0));
    const maxMarks = round(subjectResults.reduce((sum, result) => sum + result.maxMarks, 0));
    const overallPercent = percent(totalMarks, maxMarks);
    const sessionIds = this.tenant(actor, this.state().attendanceSessions).filter((session) => session.classId === classroom.id).map((session) => session.id);
    const marks = this.tenant(actor, this.state().attendanceMarks).filter((mark) => mark.studentId === student.id && sessionIds.includes(mark.sessionId));
    const now = this.now();
    const existing = this.tenant(actor, this.state().reportCards).find((card) => card.studentId === student.id && card.classId === classroom.id && card.term === term && card.academicYear === academicYear);
    const next: ReportCard = { id: existing?.id ?? newId("rc"), tenantId: actor.tenantId, createdAt: existing?.createdAt ?? now, updatedAt: now, studentId: student.id, classId: classroom.id, term, academicYear, attendancePercent: attendanceRate(marks), subjectResults, totalMarks, maxMarks, overallPercent, overallGrade: gradeFromPercent(overallPercent), result: subjectResults.some((result) => result.result === "fail") ? "fail" : resultFromPercent(overallPercent), status: existing?.status === "published" ? "published" : "draft", generatedBy: actor.userId, publishedAt: existing?.publishedAt };
    if (existing) {
      const before = clone(existing);
      Object.assign(existing, next);
      this.saveAuditEvent(actor, "report_card.generate", "ReportCard", existing.id, before, existing, "reportcard.generated", { reportCardId: existing.id, studentId: student.id });
      return existing;
    }
    this.state().reportCards.push(next);
    this.saveAuditEvent(actor, "report_card.generate", "ReportCard", next.id, undefined, next, "reportcard.generated", { reportCardId: next.id, studentId: student.id });
    return next;
  }

  publishReportCard(actor: RequestActor, reportCardId: string): ReportCard {
    const card = this.findReportCard(actor, reportCardId);
    const before = clone(card);
    card.status = "published";
    card.publishedAt = this.now();
    card.updatedAt = card.publishedAt;
    this.saveAuditEvent(actor, "report_card.publish", "ReportCard", card.id, before, card, "reportcard.published", { reportCardId: card.id, studentId: card.studentId });
    return card;
  }

  listEvents(actor: RequestActor) { return this.tenant(actor, this.state().events); }
  listAuditLogs(actor: RequestActor) { return this.tenant(actor, this.state().auditLogs); }
}
