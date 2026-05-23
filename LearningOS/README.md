# LearningOS

LearningOS is a reusable TypeScript operating layer for education platforms, schools, coaching institutes, academies, and education ERPs.

It manages students, guardians, teachers, classes, subjects, enrollments, attendance, exams, scores, assignments, submissions, timetable, report cards, academic analytics, events, audit logs, and role-based permissions.

This starter is built with **Node.js + TypeScript**, has **no external runtime dependencies**, uses a JSON file store for local development, and includes a PostgreSQL schema for production migration.

## What LearningOS includes

- Student profile management
- Guardian/contact management
- Teacher management
- Class and section management
- Subject management
- Student enrollment
- Attendance sessions and attendance marks
- Exam creation and score recording
- Assignment creation, submission, and grading
- Timetable scheduling with conflict detection
- Report card generation and publishing
- Academic analytics
- Event log
- Audit log
- Role-based permission checks
- Seed demo data
- PostgreSQL schema example
- Automated tests

## Architecture

```txt
LearningOS
├── Students
├── Guardians
├── Teachers
├── Classes
├── Subjects
├── Enrollments
├── Attendance
├── Exams
├── Assignments
├── Timetable
├── Report Cards
├── Analytics
├── Events
└── Audit Logs
```

## Development stack

```txt
Language: TypeScript
Runtime: Node.js 20+
Storage: JSON file store for local dev
Production DB: PostgreSQL schema included
Testing: node:test
```

## Run locally

```bash
npm run build
npm start
```

Default server:

```txt
http://localhost:5100
```

Health endpoint:

```txt
GET /health
```

Docs endpoint:

```txt
GET /docs
```

## Environment variables

```bash
PORT=5100
DEFAULT_TENANT_ID=demo-tenant
LEARNINGOS_DB_FILE=data/learningos.db.json
```

## Demo tenant

```txt
demo-tenant
```

## Main demo IDs

```txt
stu_asha
stu_rahul
stu_neha
guard_asha_parent
teacher_math
teacher_science
class_grade10a
sub_math_10
sub_science_10
sub_english_10
atts_math_001
atts_science_001
exam_math_midterm
exam_science_midterm
asg_math_homework
tt_math_mon
tt_science_mon
rc_asha_term1
```

## Auth and permissions

Use request headers:

```txt
x-tenant-id: demo-tenant
x-user-id: admin-user
x-role: learning_admin
```

Roles:

```txt
viewer
teacher
coordinator
academic_admin
principal
learning_admin
admin
owner
auditor
```

## API examples

### Overview

```http
GET /learningos/overview
x-role: learning_admin
```

### Create student

```http
POST /learningos/students
x-role: learning_admin
Content-Type: application/json
```

```json
{
  "firstName": "Maya",
  "lastName": "Rao",
  "admissionNo": "STU-2001",
  "gradeLevel": "Grade 10",
  "section": "A",
  "email": "maya@example.com"
}
```

### Create subject

```http
POST /learningos/subjects
x-role: learning_admin
Content-Type: application/json
```

```json
{
  "name": "AI Literacy",
  "code": "AI-10",
  "gradeLevel": "Grade 10",
  "credits": 2
}
```

### Create class

```http
POST /learningos/classes
x-role: learning_admin
Content-Type: application/json
```

```json
{
  "name": "Grade 10 B",
  "gradeLevel": "Grade 10",
  "section": "B",
  "academicYear": "2026-2027",
  "capacity": 40
}
```

### Enroll student

```http
POST /learningos/enrollments
x-role: learning_admin
Content-Type: application/json
```

```json
{
  "studentId": "stu_asha",
  "classId": "class_grade10a",
  "academicYear": "2026-2027"
}
```

### Create attendance session

```http
POST /learningos/attendance-sessions
x-role: teacher
Content-Type: application/json
```

```json
{
  "classId": "class_grade10a",
  "subjectId": "sub_math_10",
  "teacherId": "teacher_math",
  "date": "2026-05-20",
  "period": "P1",
  "topic": "Quadratic equations"
}
```

### Mark attendance

```http
POST /learningos/attendance-sessions/{sessionId}/marks
x-role: teacher
Content-Type: application/json
```

```json
{
  "studentId": "stu_asha",
  "status": "present",
  "remarks": "On time"
}
```

### Bulk mark attendance

```http
POST /learningos/attendance-sessions/{sessionId}/bulk-marks
x-role: teacher
Content-Type: application/json
```

```json
{
  "marks": [
    { "studentId": "stu_asha", "status": "present" },
    { "studentId": "stu_rahul", "status": "absent" },
    { "studentId": "stu_neha", "status": "late", "remarks": "8 minutes late" }
  ]
}
```

### Create exam

```http
POST /learningos/exams
x-role: academic_admin
Content-Type: application/json
```

```json
{
  "name": "English Quiz",
  "classId": "class_grade10a",
  "subjectId": "sub_english_10",
  "term": "Term 1",
  "examDate": "2026-07-01",
  "maxMarks": 50
}
```

### Record exam score

```http
POST /learningos/exams/{examId}/scores
x-role: teacher
Content-Type: application/json
```

```json
{
  "studentId": "stu_asha",
  "marksObtained": 44,
  "remarks": "Good performance"
}
```

### Create assignment

```http
POST /learningos/assignments
x-role: teacher
Content-Type: application/json
```

```json
{
  "title": "Science Lab Notes",
  "classId": "class_grade10a",
  "subjectId": "sub_science_10",
  "teacherId": "teacher_science",
  "dueDate": "2099-01-01T00:00:00.000Z",
  "maxMarks": 25
}
```

### Submit assignment

```http
POST /learningos/assignments/{assignmentId}/submit
x-role: teacher
Content-Type: application/json
```

```json
{
  "studentId": "stu_neha",
  "content": "Lab notes uploaded",
  "attachmentUrls": ["lab-notes.pdf"]
}
```

### Grade submission

```http
POST /learningos/submissions/{submissionId}/grade
x-role: teacher
Content-Type: application/json
```

```json
{
  "marks": 22,
  "feedback": "Good observations"
}
```

### Add timetable entry

```http
POST /learningos/timetable
x-role: academic_admin
Content-Type: application/json
```

```json
{
  "classId": "class_grade10a",
  "subjectId": "sub_math_10",
  "teacherId": "teacher_math",
  "dayOfWeek": "wednesday",
  "startTime": "09:00",
  "endTime": "10:00",
  "room": "Room 301"
}
```

### Generate report card

```http
POST /learningos/students/stu_asha/report-card
x-role: learning_admin
Content-Type: application/json
```

```json
{
  "classId": "class_grade10a",
  "term": "Term 1",
  "academicYear": "2026-2027"
}
```

## Tests

```bash
npm test
```

## Production notes

For production, replace the JSON file store with PostgreSQL using `database/schema.sql`. Keep LearningOS as a reusable service/package and connect it with:

```txt
SecurityOS   → roles, permissions, audit policy
FinanceOS    → student fees, invoices, payments
AnalyticsOS  → advanced dashboards and reports
AutomationOS → reminders, parent notifications, workflows
ExperienceOS → student/parent feedback and support journeys
AIOS         → learning assistant, recommendations, academic insights
```

## Planning Alignment

- Official package: `@appneurox/learningos`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/learning`
- Modes: standalone and PlatformOS integrated
- Related systems: KnowledgeOS, AIOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
