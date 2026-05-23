export type UUID = string;
export type TenantId = string;
export type ISODate = string;
export type Role = "viewer" | "instructor" | "learner" | "admin" | "owner";

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

export interface Course extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "self-paced" | "live" | "hybrid" | "workshop" | "bootcamp" | "certification" | "corporate" | "college";
  difficulty: "beginner" | "intermediate" | "advanced";
  status: "draft" | "published" | "archived";
  trainerId?: UUID;
  objectives: string[];
  prerequisites: string[];
  tags: string[];
  version: number;
  publishedAt?: ISODate;
  createdBy: UUID;
}

export interface Lesson extends BaseEntity {
  courseId: UUID;
  key: string;
  name: string;
  description?: string;
  content: string;
  contentType: "text" | "video" | "audio" | "pdf" | "slides" | "code" | "interactive" | "quiz" | "assignment";
  duration?: number;
  order: number;
  status: "draft" | "published" | "archived";
  resources: UUID[];
  quizId?: UUID;
  assignmentId?: UUID;
  createdBy: UUID;
}

export interface Assessment extends BaseEntity {
  lessonId?: UUID;
  key: string;
  name: string;
  description?: string;
  type: "quiz" | "test" | "coding" | "assignment" | "project" | "interview" | "skill" | "final";
  passingScore: number;
  timeLimit?: number;
  questions: AssessmentQuestion[];
  status: "draft" | "published" | "archived";
  createdBy: UUID;
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  type: "mcq" | "coding" | "short-answer" | "long-answer" | "practical";
  options?: string[];
  correctAnswer?: string | number | string[];
  points: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
}

export interface Assignment extends BaseEntity {
  lessonId?: UUID;
  key: string;
  name: string;
  description?: string;
  instructions: string;
  dueDate?: ISODate;
  maxScore: number;
  status: "draft" | "published" | "archived";
  rubric?: AssignmentRubric[];
  createdBy: UUID;
}

export interface AssignmentRubric {
  criteria: string;
  maxPoints: number;
  description: string;
}

export interface Submission extends BaseEntity {
  assignmentId: UUID;
  learnerId: UUID;
  content: string;
  fileUrls?: string[];
  score?: number;
  feedback?: string;
  status: "submitted" | "graded" | "returned" | "resubmitted";
  submittedAt: ISODate;
  gradedAt?: ISODate;
}

export interface Certificate extends BaseEntity {
  learnerId: UUID;
  courseId?: UUID;
  batchId?: UUID;
  name: string;
  recipientName: string;
  issuedAt: ISODate;
  certificateNumber: string;
  qrCode?: string;
  verificationUrl?: string;
  status: "issued" | "revoked" | "expired";
  issuedBy: UUID;
}

export interface LearningPath extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "role-based" | "skill-based" | "career" | "personalized";
  targetAudience?: string;
  courses: UUID[];
  milestones: LearningMilestone[];
  estimatedDuration?: number;
  status: "draft" | "published" | "archived";
  createdBy: UUID;
}

export interface LearningMilestone {
  id: string;
  name: string;
  description: string;
  targetCourseIds: UUID[];
  requiredForCompletion: boolean;
}

export interface Learner extends BaseEntity {
  key: string;
  name: string;
  email: string;
  phone?: string;
  status: "invited" | "enrolled" | "active" | "inactive" | "completed" | "dropped" | "suspended" | "alumni";
  tags: string[];
  groups: UUID[];
  enrolledCourses: UUID[];
  totalLearningHours?: number;
  createdBy: UUID;
}

export interface Trainer extends BaseEntity {
  key: string;
  name: string;
  email: string;
  phone?: string;
  expertise: string[];
  bio?: string;
  status: "active" | "inactive";
  totalSessions?: number;
  totalLearners?: number;
  rating?: number;
  createdBy: UUID;
}

export interface Enrollment extends BaseEntity {
  learnerId: UUID;
  courseId: UUID;
  batchId?: UUID;
  status: "enrolled" | "in-progress" | "completed" | "dropped" | "failed";
  progress: number;
  enrolledAt: ISODate;
  completedAt?: ISODate;
  lastAccessedAt?: ISODate;
  certificateId?: UUID;
  createdBy: UUID;
}

export interface Batch extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  courseId?: UUID;
  trainerId?: UUID;
  schedule: BatchSchedule[];
  maxLearners: number;
  currentLearners: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  startDate: ISODate;
  endDate?: ISODate;
  createdBy: UUID;
}

export interface BatchSchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location?: string;
  sessionType: "live" | "recorded" | "hybrid";
}

export interface Attendance extends BaseEntity {
  batchId: UUID;
  learnerId: UUID;
  sessionDate: ISODate;
  status: "present" | "absent" | "late" | "excused" | "partial";
  checkInTime?: ISODate;
  checkOutTime?: ISODate;
}

export interface Resource extends BaseEntity {
  lessonId?: UUID;
  key: string;
  name: string;
  type: "pdf" | "video" | "slides" | "code" | "template" | "checklist" | "worksheet" | "link";
  url: string;
  description?: string;
  tags: string[];
  downloadCount?: number;
  createdBy: UUID;
}

export interface Badge extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  criteria: string;
  icon?: string;
  category: "completion" | "skill" | "achievement" | "participation" | "project" | "mentor";
  status: "active" | "inactive";
  createdBy: UUID;
}

export interface Skill extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  relatedCourses: UUID[];
  status: "active" | "inactive";
  createdBy: UUID;
}

export interface SkillProgress extends BaseEntity {
  learnerId: UUID;
  skillId: UUID;
  currentLevel: "beginner" | "intermediate" | "advanced" | "expert";
  progress: number;
  proofs: SkillProof[];
  lastPracticedAt?: ISODate;
}

export interface SkillProof {
  type: "course" | "project" | "certificate" | "assessment";
  entityId: UUID;
  proofUrl?: string;
  achievedAt: ISODate;
}

export interface LearningProgress extends BaseEntity {
  learnerId: UUID;
  courseId: UUID;
  lessonProgress: LessonProgress[];
  overallProgress: number;
  timeSpent?: number;
  lastAccessedAt?: ISODate;
  completedAt?: ISODate;
}

export interface LessonProgress {
  lessonId: UUID;
  status: "not-started" | "in-progress" | "completed" | "skipped";
  completedAt?: ISODate;
  timeSpent?: number;
  quizScore?: number;
  assignmentScore?: number;
}

export interface Doubt extends BaseEntity {
  lessonId?: UUID;
  learnerId: UUID;
  trainerId?: UUID;
  title: string;
  description: string;
  status: "open" | "assigned" | "answered" | "needs-clarification" | "resolved" | "faq";
  priority: "low" | "medium" | "high";
  responses: DoubtResponse[];
  resolvedAt?: ISODate;
}

export interface DoubtResponse {
  id: string;
  trainerId?: UUID;
  content: string;
  createdAt: ISODate;
  isAccepted: boolean;
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

export interface LearningOverview {
  totalLearners: number;
  activeLearners: number;
  totalCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
  completionRate: number;
  certificatesIssued: number;
  totalBatches: number;
  activeBatches: number;
  assessmentsCompleted: number;
  averageScore: number;
}

export interface LearningState {
  courses: Course[];
  lessons: Lesson[];
  assessments: Assessment[];
  certificates: Certificate[];
  learningPaths: LearningPath[];
  enrollments: Enrollment[];
  batches: Batch[];
  trainers: Trainer[];
  learners: Learner[];
  assignments: Assignment[];
  submissions: Submission[];
  resources: Resource[];
  badges: Badge[];
  skills: Skill[];
  skillProgress: SkillProgress[];
  learningProgress: LearningProgress[];
  attendance: Attendance[];
  doubts: Doubt[];
  auditLogs: AuditLog[];
}
