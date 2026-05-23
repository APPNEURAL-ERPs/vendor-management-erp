const assert = require('node:assert/strict');
const test = require('node:test');
const { unlinkSync } = require('node:fs');
const { join } = require('node:path');
const { DataStore } = require('../dist/core/datastore.js');
const { EventBus } = require('../dist/core/event-bus.js');
const { LearningService } = require('../dist/services/learning.service.js');
const { createSeedState } = require('../dist/seed-state.js');
const { hasPermission } = require('../dist/core/security.js');

function makeService() {
  const file = join(process.cwd(), 'data', `learningos-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  const store = new DataStore(file);
  store.reset(createSeedState('test-tenant'));
  const service = new LearningService(store, new EventBus(store));
  const actor = { tenantId: 'test-tenant', userId: 'tester', role: 'learning_admin' };
  return { service, actor, file };
}
function cleanup(file) { try { unlinkSync(file); } catch {} }

test('LearningOS seed overview returns learning analytics', () => {
  const { service, actor, file } = makeService();
  const overview = service.overview(actor);
  assert.equal(overview.analytics.totalStudents, 3);
  assert.equal(overview.analytics.totalTeachers, 2);
  assert.equal(overview.analytics.activeClasses, 1);
  assert.equal(overview.analytics.totalSubjects, 3);
  assert.ok(overview.analytics.attendanceRate > 0);
  assert.ok(overview.analytics.averageExamPercent > 0);
  assert.ok(Array.isArray(overview.analytics.classAnalytics));
  cleanup(file);
});

test('LearningOS creates subject, teacher, class, student, guardian, and enrollment', () => {
  const { service, actor, file } = makeService();
  const subject = service.createSubject(actor, { name: 'AI Literacy', code: 'AI-10', gradeLevel: 'Grade 10', credits: 2 });
  const teacher = service.createTeacher(actor, { firstName: 'Maya', lastName: 'Shah', employeeNo: 'TCH-NEW-1', subjectIds: [subject.id] });
  const classroom = service.createClassroom(actor, { name: 'AI Cohort A', gradeLevel: 'Grade 10', section: 'AI', academicYear: '2026-2027', classTeacherId: teacher.id, capacity: 5 });
  const student = service.createStudent(actor, { firstName: 'Karan', lastName: 'Patel', admissionNo: 'ADM-NEW-1', gradeLevel: 'Grade 10', email: 'karan.student@example.com' });
  const guardian = service.createGuardian(actor, { firstName: 'Ravi', lastName: 'Patel', relation: 'father', studentIds: [student.id] });
  const enrollment = service.enrollStudent(actor, { studentId: student.id, classId: classroom.id, academicYear: '2026-2027' });
  assert.equal(enrollment.status, 'active');
  const refreshedStudent = service.listStudents(actor).find((item) => item.id === student.id);
  assert.equal(refreshedStudent.section, 'AI');
  assert.ok(refreshedStudent.guardianIds.includes(guardian.id));
  cleanup(file);
});

test('LearningOS validates timetable conflicts and records attendance', () => {
  const { service, actor, file } = makeService();
  const teacher = service.createTeacher(actor, { firstName: 'Elena', lastName: 'Das', employeeNo: 'TCH-TT-1' });
  const slot = service.addTimetableEntry(actor, { classId: 'class_grade10a', subjectId: 'sub_english_10', teacherId: teacher.id, dayOfWeek: 'tuesday', startTime: '09:00', endTime: '10:00', room: 'Room 302' });
  assert.equal(slot.dayOfWeek, 'tuesday');
  assert.throws(() => service.addTimetableEntry(actor, { classId: 'class_grade10a', subjectId: 'sub_english_10', teacherId: teacher.id, dayOfWeek: 'tuesday', startTime: '09:30', endTime: '10:30', room: 'Room 302' }), /Timetable conflict/);
  const session = service.createAttendanceSession(actor, { classId: 'class_grade10a', subjectId: 'sub_english_10', teacherId: teacher.id, date: '2026-05-10', period: 'P3' });
  service.bulkMarkAttendance(actor, session.id, { marks: [
    { studentId: 'stu_asha', status: 'present' },
    { studentId: 'stu_rahul', status: 'present' },
    { studentId: 'stu_neha', status: 'absent' }
  ] });
  const closed = service.closeAttendanceSession(actor, session.id);
  assert.equal(closed.status, 'closed');
  const analytics = service.analytics(actor);
  assert.ok(analytics.attendanceSummary.absent >= 1);
  cleanup(file);
});

test('LearningOS handles assignments, submissions, grading, exams, scores, and report cards', () => {
  const { service, actor, file } = makeService();
  const assignment = service.createAssignment(actor, { classId: 'class_grade10a', subjectId: 'sub_math_10', teacherId: 'teacher_math', title: 'Linear Equations Worksheet', dueDate: '2099-01-01T00:00:00.000Z', maxMarks: 50 });
  const submission = service.submitAssignment(actor, assignment.id, { studentId: 'stu_neha', content: 'All answers completed.', attachmentUrls: ['answers.pdf'] });
  const graded = service.gradeSubmission(actor, submission.id, { marks: 45, feedback: 'Good work' });
  assert.equal(graded.status, 'graded');
  assert.equal(graded.marks, 45);

  const exam = service.createExam(actor, { classId: 'class_grade10a', subjectId: 'sub_english_10', term: 'Term 1', examDate: '2026-05-20', name: 'English Quiz', maxMarks: 40 });
  const score = service.recordExamScore(actor, exam.id, { studentId: 'stu_neha', marksObtained: 35 });
  assert.equal(score.grade, 'A');
  service.publishExam(actor, exam.id);
  const report = service.generateReportCard(actor, 'stu_neha', { classId: 'class_grade10a', term: 'Term 1', academicYear: '2026-2027' });
  assert.ok(report.overallPercent > 0);
  const published = service.publishReportCard(actor, report.id);
  assert.equal(published.status, 'published');
  cleanup(file);
});

test('LearningOS permissions protect learning operations by role', () => {
  assert.equal(hasPermission('viewer', 'learning.students.write'), false);
  assert.equal(hasPermission('teacher', 'learning.attendance.write'), true);
  assert.equal(hasPermission('teacher', 'learning.reportcards.write'), false);
  assert.equal(hasPermission('coordinator', 'learning.enrollments.write'), true);
  assert.equal(hasPermission('academic_admin', 'learning.audit.read'), true);
  assert.equal(hasPermission('principal', 'learning.reportcards.write'), true);
  assert.equal(hasPermission('learning_admin', 'learning.timetable.write'), true);
});
