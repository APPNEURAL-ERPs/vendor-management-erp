import { DataStore } from "./core/datastore";
import {
  Course,
  Lesson,
  Assessment,
  Certificate,
  LearningPath,
  Enrollment,
  Learner,
  Trainer,
  Batch,
  Assignment,
  Submission,
  Resource,
  Badge,
  Skill,
  SkillProgress,
  LearningProgress,
  Attendance,
  Doubt,
  RequestActor,
  LearningOverview
} from "./domain";
import { newId, nowIso, plusDays } from "./core/id";
import { badRequest, conflict, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, notFound, optionalObject, pickQuery, clone, countBy } from "./core/utils";

export class LearningService {
  constructor(private readonly store: DataStore) {}

  getOverview(actor: RequestActor): LearningOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    const learners = state.learners.filter((l) => l.tenantId === tenant);
    const activeLearners = learners.filter((l) => l.status === "active");
    const courses = state.courses.filter((c) => c.tenantId === tenant);
    const publishedCourses = courses.filter((c) => c.status === "published");
    const enrollments = state.enrollments.filter((e) => e.tenantId === tenant);
    const completedEnrollments = enrollments.filter((e) => e.status === "completed");
    const certificates = state.certificates.filter((c) => c.tenantId === tenant);
    const batches = state.batches.filter((b) => b.tenantId === tenant);
    const activeBatches = batches.filter((b) => b.status === "ongoing");
    const submissions = state.submissions.filter((s) => s.tenantId === tenant && s.status === "graded");
    const avgScore = submissions.length > 0 ? submissions.reduce((sum, s) => sum + (s.score ?? 0), 0) / submissions.length : 0;

    return {
      totalLearners: learners.length,
      activeLearners: activeLearners.length,
      totalCourses: courses.length,
      publishedCourses: publishedCourses.length,
      totalEnrollments: enrollments.length,
      completionRate: enrollments.length > 0 ? Math.round((completedEnrollments.length / enrollments.length) * 100) : 0,
      certificatesIssued: certificates.length,
      totalBatches: batches.length,
      activeBatches: activeBatches.length,
      assessmentsCompleted: submissions.length,
      averageScore: Math.round(avgScore * 100) / 100
    };
  }

  listCourses(actor: RequestActor, query?: URLSearchParams) {
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");
    return clone(this.store.getState().courses.filter((c) => {
      if (c.tenantId !== actor.tenantId) return false;
      if (status && c.status !== status) return false;
      if (search && !`${c.key} ${c.name} ${c.description ?? ""}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  createCourse(input: unknown, actor: RequestActor): Course {
    const body = ensureObject(input, "course");
    const state = this.store.getState();
    const key = ensureString(body.key, "course.key");
    if (state.courses.some((c) => c.tenantId === actor.tenantId && c.key === key)) conflict(`Course key '${key}' already exists`);
    const course: Course = {
      id: newId("course"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "course.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "self-paced") as Course["type"],
      difficulty: String(body.difficulty ?? "beginner") as Course["difficulty"],
      status: String(body.status ?? "draft") as Course["status"],
      trainerId: body.trainerId ? String(body.trainerId) : undefined,
      objectives: ensureArray<string>(body.objectives, "course.objectives"),
      prerequisites: ensureArray<string>(body.prerequisites, "course.prerequisites"),
      tags: ensureArray<string>(body.tags, "course.tags"),
      version: 1,
      publishedAt: body.status === "published" ? nowIso() : undefined,
      createdBy: actor.userId
    };
    state.courses.push(course);
    this.store.save();
    this.store.audit(actor, "course.create", "course", course.id, undefined, course);
    return clone(course);
  }

  getCourse(id: string, actor: RequestActor): Course {
    const course = this.store.getState().courses.find((c) => c.id === id && c.tenantId === actor.tenantId);
    if (!course) notFound("Course not found");
    return clone(course);
  }

  updateCourse(id: string, input: unknown, actor: RequestActor): Course {
    const body = ensureObject(input, "course");
    const state = this.store.getState();
    const course = state.courses.find((c) => c.id === id && c.tenantId === actor.tenantId);
    if (!course) notFound("Course not found");
    const before = clone(course);
    if (body.name) course.name = String(body.name);
    if (body.description !== undefined) course.description = body.description ? String(body.description) : undefined;
    if (body.type) course.type = String(body.type) as Course["type"];
    if (body.difficulty) course.difficulty = String(body.difficulty) as Course["difficulty"];
    if (body.status) {
      course.status = String(body.status) as Course["status"];
      if (course.status === "published" && !course.publishedAt) course.publishedAt = nowIso();
    }
    if (body.trainerId !== undefined) course.trainerId = body.trainerId ? String(body.trainerId) : undefined;
    if (body.objectives) course.objectives = ensureArray<string>(body.objectives, "course.objectives");
    if (body.prerequisites) course.prerequisites = ensureArray<string>(body.prerequisites, "course.prerequisites");
    if (body.tags) course.tags = ensureArray<string>(body.tags, "course.tags");
    course.version += 1;
    course.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "course.update", "course", course.id, before, course);
    return clone(course);
  }

  listLessons(actor: RequestActor, query?: URLSearchParams) {
    const courseId = pickQuery(query, "courseId");
    return clone(this.store.getState().lessons.filter((l) => {
      if (l.tenantId !== actor.tenantId) return false;
      if (courseId && l.courseId !== courseId) return false;
      return true;
    }));
  }

  createLesson(input: unknown, actor: RequestActor): Lesson {
    const body = ensureObject(input, "lesson");
    const state = this.store.getState();
    if (body.courseId) {
      const course = state.courses.find((c) => c.id === body.courseId && c.tenantId === actor.tenantId);
      if (!course) notFound("Course not found");
    }
    const key = ensureString(body.key, "lesson.key");
    if (state.lessons.some((l) => l.tenantId === actor.tenantId && l.key === key)) conflict(`Lesson key '${key}' already exists`);
    const lessonsCount = state.lessons.filter((l) => l.courseId === body.courseId).length;
    const lesson: Lesson = {
      id: newId("lesson"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      courseId: String(body.courseId),
      key,
      name: ensureString(body.name, "lesson.name"),
      description: body.description ? String(body.description) : undefined,
      content: ensureString(body.content, "lesson.content"),
      contentType: String(body.contentType ?? "text") as Lesson["contentType"],
      duration: body.duration ? ensureNumber(body.duration, "lesson.duration") : undefined,
      order: ensureNumber(body.order, "lesson.order", lessonsCount + 1),
      status: String(body.status ?? "draft") as Lesson["status"],
      resources: ensureArray(body.resources, "lesson.resources"),
      quizId: body.quizId ? String(body.quizId) : undefined,
      assignmentId: body.assignmentId ? String(body.assignmentId) : undefined,
      createdBy: actor.userId
    };
    state.lessons.push(lesson);
    this.store.save();
    this.store.audit(actor, "lesson.create", "lesson", lesson.id, undefined, lesson);
    return clone(lesson);
  }

  listEnrollments(actor: RequestActor, query?: URLSearchParams) {
    const courseId = pickQuery(query, "courseId");
    const learnerId = pickQuery(query, "learnerId");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().enrollments.filter((e) => {
      if (e.tenantId !== actor.tenantId) return false;
      if (courseId && e.courseId !== courseId) return false;
      if (learnerId && e.learnerId !== learnerId) return false;
      if (status && e.status !== status) return false;
      return true;
    }));
  }

  createEnrollment(input: unknown, actor: RequestActor): Enrollment {
    const body = ensureObject(input, "enrollment");
    const state = this.store.getState();
    const learner = state.learners.find((l) => l.id === body.learnerId && l.tenantId === actor.tenantId);
    if (!learner) notFound("Learner not found");
    const course = state.courses.find((c) => c.id === body.courseId && c.tenantId === actor.tenantId);
    if (!course) notFound("Course not found");
    if (state.enrollments.some((e) => e.learnerId === body.learnerId && e.courseId === body.courseId)) {
      conflict("Learner already enrolled in this course");
    }
    const enrollment: Enrollment = {
      id: newId("enrollment"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      learnerId: String(body.learnerId),
      courseId: String(body.courseId),
      batchId: body.batchId ? String(body.batchId) : undefined,
      status: "enrolled",
      progress: 0,
      enrolledAt: nowIso(),
      createdBy: actor.userId
    };
    state.enrollments.push(enrollment);
    this.store.save();
    this.store.audit(actor, "enrollment.create", "enrollment", enrollment.id, undefined, enrollment);
    return clone(enrollment);
  }

  updateEnrollmentProgress(enrollmentId: string, progress: number, actor: RequestActor): Enrollment {
    const state = this.store.getState();
    const enrollment = state.enrollments.find((e) => e.id === enrollmentId && e.tenantId === actor.tenantId);
    if (!enrollment) notFound("Enrollment not found");
    const before = clone(enrollment);
    enrollment.progress = Math.min(100, Math.max(0, progress));
    enrollment.lastAccessedAt = nowIso();
    if (enrollment.progress === 100) {
      enrollment.status = "completed";
      enrollment.completedAt = nowIso();
    } else {
      enrollment.status = "in-progress";
    }
    enrollment.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "enrollment.progress.update", "enrollment", enrollment.id, before, enrollment);
    return clone(enrollment);
  }

  listLearners(actor: RequestActor, query?: URLSearchParams) {
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");
    return clone(this.store.getState().learners.filter((l) => {
      if (l.tenantId !== actor.tenantId) return false;
      if (status && l.status !== status) return false;
      if (search && !`${l.key} ${l.name} ${l.email}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  createLearner(input: unknown, actor: RequestActor): Learner {
    const body = ensureObject(input, "learner");
    const state = this.store.getState();
    const key = ensureString(body.key, "learner.key");
    if (state.learners.some((l) => l.tenantId === actor.tenantId && l.key === key)) conflict(`Learner key '${key}' already exists`);
    const email = ensureString(body.email, "learner.email");
    if (state.learners.some((l) => l.tenantId === actor.tenantId && l.email === email)) conflict("Email already exists");
    const learner: Learner = {
      id: newId("learner"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "learner.name"),
      email,
      phone: body.phone ? String(body.phone) : undefined,
      status: "invited",
      tags: ensureArray<string>(body.tags, "learner.tags"),
      groups: ensureArray(body.groups, "learner.groups"),
      enrolledCourses: [],
      createdBy: actor.userId
    };
    state.learners.push(learner);
    this.store.save();
    this.store.audit(actor, "learner.create", "learner", learner.id, undefined, learner);
    return clone(learner);
  }

  listTrainers(actor: RequestActor) {
    return clone(this.store.getState().trainers.filter((t) => t.tenantId === actor.tenantId));
  }

  createTrainer(input: unknown, actor: RequestActor): Trainer {
    const body = ensureObject(input, "trainer");
    const state = this.store.getState();
    const key = ensureString(body.key, "trainer.key");
    if (state.trainers.some((t) => t.tenantId === actor.tenantId && t.key === key)) conflict(`Trainer key '${key}' already exists`);
    const trainer: Trainer = {
      id: newId("trainer"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "trainer.name"),
      email: ensureString(body.email, "trainer.email"),
      phone: body.phone ? String(body.phone) : undefined,
      expertise: ensureArray<string>(body.expertise, "trainer.expertise"),
      bio: body.bio ? String(body.bio) : undefined,
      status: "active",
      createdBy: actor.userId
    };
    state.trainers.push(trainer);
    this.store.save();
    this.store.audit(actor, "trainer.create", "trainer", trainer.id, undefined, trainer);
    return clone(trainer);
  }

  listBatches(actor: RequestActor, query?: URLSearchParams) {
    const status = pickQuery(query, "status");
    return clone(this.store.getState().batches.filter((b) => {
      if (b.tenantId !== actor.tenantId) return false;
      if (status && b.status !== status) return false;
      return true;
    }));
  }

  createBatch(input: unknown, actor: RequestActor): Batch {
    const body = ensureObject(input, "batch");
    const state = this.store.getState();
    const key = ensureString(body.key, "batch.key");
    if (state.batches.some((b) => b.tenantId === actor.tenantId && b.key === key)) conflict(`Batch key '${key}' already exists`);
    if (body.courseId) {
      const course = state.courses.find((c) => c.id === body.courseId && c.tenantId === actor.tenantId);
      if (!course) notFound("Course not found");
    }
    if (body.trainerId) {
      const trainer = state.trainers.find((t) => t.id === body.trainerId && t.tenantId === actor.tenantId);
      if (!trainer) notFound("Trainer not found");
    }
    const batch: Batch = {
      id: newId("batch"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "batch.name"),
      description: body.description ? String(body.description) : undefined,
      courseId: body.courseId ? String(body.courseId) : undefined,
      trainerId: body.trainerId ? String(body.trainerId) : undefined,
      schedule: ensureArray(body.schedule, "batch.schedule"),
      maxLearners: ensureNumber(body.maxLearners, "batch.maxLearners"),
      currentLearners: 0,
      status: "upcoming",
      startDate: ensureString(body.startDate, "batch.startDate"),
      endDate: body.endDate ? String(body.endDate) : undefined,
      createdBy: actor.userId
    };
    state.batches.push(batch);
    this.store.save();
    this.store.audit(actor, "batch.create", "batch", batch.id, undefined, batch);
    return clone(batch);
  }

  listAssessments(actor: RequestActor, query?: URLSearchParams) {
    const lessonId = pickQuery(query, "lessonId");
    return clone(this.store.getState().assessments.filter((a) => {
      if (a.tenantId !== actor.tenantId) return false;
      if (lessonId && a.lessonId !== lessonId) return false;
      return true;
    }));
  }

  createAssessment(input: unknown, actor: RequestActor): Assessment {
    const body = ensureObject(input, "assessment");
    const state = this.store.getState();
    const key = ensureString(body.key, "assessment.key");
    if (state.assessments.some((a) => a.tenantId === actor.tenantId && a.key === key)) conflict(`Assessment key '${key}' already exists`);
    const assessment: Assessment = {
      id: newId("assessment"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      lessonId: body.lessonId ? String(body.lessonId) : undefined,
      key,
      name: ensureString(body.name, "assessment.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "quiz") as Assessment["type"],
      passingScore: ensureNumber(body.passingScore, "assessment.passingScore", 70),
      timeLimit: body.timeLimit ? ensureNumber(body.timeLimit, "assessment.timeLimit") : undefined,
      questions: ensureArray(body.questions, "assessment.questions"),
      status: String(body.status ?? "draft") as Assessment["status"],
      createdBy: actor.userId
    };
    state.assessments.push(assessment);
    this.store.save();
    this.store.audit(actor, "assessment.create", "assessment", assessment.id, undefined, assessment);
    return clone(assessment);
  }

  listCertificates(actor: RequestActor, query?: URLSearchParams) {
    const learnerId = pickQuery(query, "learnerId");
    const courseId = pickQuery(query, "courseId");
    return clone(this.store.getState().certificates.filter((c) => {
      if (c.tenantId !== actor.tenantId) return false;
      if (learnerId && c.learnerId !== learnerId) return false;
      if (courseId && c.courseId !== courseId) return false;
      return true;
    }));
  }

  generateCertificate(input: unknown, actor: RequestActor): Certificate {
    const body = ensureObject(input, "certificate");
    const state = this.store.getState();
    const learner = state.learners.find((l) => l.id === body.learnerId && l.tenantId === actor.tenantId);
    if (!learner) notFound("Learner not found");
    if (body.courseId) {
      const course = state.courses.find((c) => c.id === body.courseId && c.tenantId === actor.tenantId);
      if (!course) notFound("Course not found");
      const enrollment = state.enrollments.find((e) => e.learnerId === body.learnerId && e.courseId === body.courseId && e.status === "completed");
      if (!enrollment) badRequest("Learner has not completed this course");
    }
    const certNumber = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const certificate: Certificate = {
      id: newId("cert"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      learnerId: String(body.learnerId),
      courseId: body.courseId ? String(body.courseId) : undefined,
      batchId: body.batchId ? String(body.batchId) : undefined,
      name: ensureString(body.name, "certificate.name"),
      recipientName: learner.name,
      issuedAt: nowIso(),
      certificateNumber: certNumber,
      qrCode: body.qrCode ? String(body.qrCode) : undefined,
      verificationUrl: body.verificationUrl ? String(body.verificationUrl) : undefined,
      status: "issued",
      issuedBy: actor.userId
    };
    state.certificates.push(certificate);
    this.store.save();
    this.store.audit(actor, "certificate.generate", "certificate", certificate.id, undefined, certificate);
    return clone(certificate);
  }

  listLearningPaths(actor: RequestActor) {
    return clone(this.store.getState().learningPaths.filter((lp) => lp.tenantId === actor.tenantId));
  }

  createLearningPath(input: unknown, actor: RequestActor): LearningPath {
    const body = ensureObject(input, "learningPath");
    const state = this.store.getState();
    const key = ensureString(body.key, "learningPath.key");
    if (state.learningPaths.some((lp) => lp.tenantId === actor.tenantId && lp.key === key)) conflict(`LearningPath key '${key}' already exists`);
    const learningPath: LearningPath = {
      id: newId("lp"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "learningPath.name"),
      description: body.description ? String(body.description) : undefined,
      type: String(body.type ?? "role-based") as LearningPath["type"],
      targetAudience: body.targetAudience ? String(body.targetAudience) : undefined,
      courses: ensureArray(body.courses, "learningPath.courses"),
      milestones: ensureArray(body.milestones, "learningPath.milestones"),
      estimatedDuration: body.estimatedDuration ? ensureNumber(body.estimatedDuration, "learningPath.estimatedDuration") : undefined,
      status: String(body.status ?? "draft") as LearningPath["status"],
      createdBy: actor.userId
    };
    state.learningPaths.push(learningPath);
    this.store.save();
    this.store.audit(actor, "learningPath.create", "learningPath", learningPath.id, undefined, learningPath);
    return clone(learningPath);
  }

  listSkills(actor: RequestActor) {
    return clone(this.store.getState().skills.filter((s) => s.tenantId === actor.tenantId));
  }

  createSkill(input: unknown, actor: RequestActor): Skill {
    const body = ensureObject(input, "skill");
    const state = this.store.getState();
    const key = ensureString(body.key, "skill.key");
    if (state.skills.some((s) => s.tenantId === actor.tenantId && s.key === key)) conflict(`Skill key '${key}' already exists`);
    const skill: Skill = {
      id: newId("skill"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "skill.name"),
      description: body.description ? String(body.description) : undefined,
      category: ensureString(body.category, "skill.category"),
      level: String(body.level ?? "beginner") as Skill["level"],
      relatedCourses: ensureArray(body.relatedCourses, "skill.relatedCourses"),
      status: "active",
      createdBy: actor.userId
    };
    state.skills.push(skill);
    this.store.save();
    this.store.audit(actor, "skill.create", "skill", skill.id, undefined, skill);
    return clone(skill);
  }

  listBadges(actor: RequestActor) {
    return clone(this.store.getState().badges.filter((b) => b.tenantId === actor.tenantId));
  }

  createBadge(input: unknown, actor: RequestActor): Badge {
    const body = ensureObject(input, "badge");
    const state = this.store.getState();
    const key = ensureString(body.key, "badge.key");
    if (state.badges.some((b) => b.tenantId === actor.tenantId && b.key === key)) conflict(`Badge key '${key}' already exists`);
    const badge: Badge = {
      id: newId("badge"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "badge.name"),
      description: body.description ? String(body.description) : undefined,
      criteria: ensureString(body.criteria, "badge.criteria"),
      icon: body.icon ? String(body.icon) : undefined,
      category: String(body.category ?? "completion") as Badge["category"],
      status: "active",
      createdBy: actor.userId
    };
    state.badges.push(badge);
    this.store.save();
    this.store.audit(actor, "badge.create", "badge", badge.id, undefined, badge);
    return clone(badge);
  }

  listAssignments(actor: RequestActor, query?: URLSearchParams) {
    const lessonId = pickQuery(query, "lessonId");
    return clone(this.store.getState().assignments.filter((a) => {
      if (a.tenantId !== actor.tenantId) return false;
      if (lessonId && a.lessonId !== lessonId) return false;
      return true;
    }));
  }

  createAssignment(input: unknown, actor: RequestActor): Assignment {
    const body = ensureObject(input, "assignment");
    const state = this.store.getState();
    const key = ensureString(body.key, "assignment.key");
    if (state.assignments.some((a) => a.tenantId === actor.tenantId && a.key === key)) conflict(`Assignment key '${key}' already exists`);
    const assignment: Assignment = {
      id: newId("assignment"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      lessonId: body.lessonId ? String(body.lessonId) : undefined,
      key,
      name: ensureString(body.name, "assignment.name"),
      description: body.description ? String(body.description) : undefined,
      instructions: ensureString(body.instructions, "assignment.instructions"),
      dueDate: body.dueDate ? String(body.dueDate) : undefined,
      maxScore: ensureNumber(body.maxScore, "assignment.maxScore", 100),
      status: String(body.status ?? "draft") as Assignment["status"],
      rubric: body.rubric ? ensureArray(body.rubric, "assignment.rubric") : undefined,
      createdBy: actor.userId
    };
    state.assignments.push(assignment);
    this.store.save();
    this.store.audit(actor, "assignment.create", "assignment", assignment.id, undefined, assignment);
    return clone(assignment);
  }

  listResources(actor: RequestActor, query?: URLSearchParams) {
    const lessonId = pickQuery(query, "lessonId");
    const type = pickQuery(query, "type");
    return clone(this.store.getState().resources.filter((r) => {
      if (r.tenantId !== actor.tenantId) return false;
      if (lessonId && r.lessonId !== lessonId) return false;
      if (type && r.type !== type) return false;
      return true;
    }));
  }

  createResource(input: unknown, actor: RequestActor): Resource {
    const body = ensureObject(input, "resource");
    const state = this.store.getState();
    const key = ensureString(body.key, "resource.key");
    if (state.resources.some((r) => r.tenantId === actor.tenantId && r.key === key)) conflict(`Resource key '${key}' already exists`);
    const resource: Resource = {
      id: newId("resource"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      lessonId: body.lessonId ? String(body.lessonId) : undefined,
      key,
      name: ensureString(body.name, "resource.name"),
      type: String(body.type ?? "pdf") as Resource["type"],
      url: ensureString(body.url, "resource.url"),
      description: body.description ? String(body.description) : undefined,
      tags: ensureArray<string>(body.tags, "resource.tags"),
      createdBy: actor.userId
    };
    state.resources.push(resource);
    this.store.save();
    this.store.audit(actor, "resource.create", "resource", resource.id, undefined, resource);
    return clone(resource);
  }

  listAttendance(actor: RequestActor, query?: URLSearchParams) {
    const batchId = pickQuery(query, "batchId");
    const learnerId = pickQuery(query, "learnerId");
    return clone(this.store.getState().attendance.filter((a) => {
      if (a.tenantId !== actor.tenantId) return false;
      if (batchId && a.batchId !== batchId) return false;
      if (learnerId && a.learnerId !== learnerId) return false;
      return true;
    }));
  }

  recordAttendance(input: unknown, actor: RequestActor): Attendance {
    const body = ensureObject(input, "attendance");
    const state = this.store.getState();
    const batch = state.batches.find((b) => b.id === body.batchId && b.tenantId === actor.tenantId);
    if (!batch) notFound("Batch not found");
    const learner = state.learners.find((l) => l.id === body.learnerId && l.tenantId === actor.tenantId);
    if (!learner) notFound("Learner not found");
    const attendance: Attendance = {
      id: newId("attendance"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      batchId: String(body.batchId),
      learnerId: String(body.learnerId),
      sessionDate: ensureString(body.sessionDate, "attendance.sessionDate"),
      status: String(body.status ?? "present") as Attendance["status"],
      checkInTime: body.checkInTime ? String(body.checkInTime) : undefined,
      checkOutTime: body.checkOutTime ? String(body.checkOutTime) : undefined
    };
    state.attendance.push(attendance);
    this.store.save();
    this.store.audit(actor, "attendance.record", "attendance", attendance.id, undefined, attendance);
    return clone(attendance);
  }

  listSubmissions(actor: RequestActor, query?: URLSearchParams) {
    const assignmentId = pickQuery(query, "assignmentId");
    const learnerId = pickQuery(query, "learnerId");
    return clone(this.store.getState().submissions.filter((s) => {
      if (s.tenantId !== actor.tenantId) return false;
      if (assignmentId && s.assignmentId !== assignmentId) return false;
      if (learnerId && s.learnerId !== learnerId) return false;
      return true;
    }));
  }

  createSubmission(input: unknown, actor: RequestActor): Submission {
    const body = ensureObject(input, "submission");
    const state = this.store.getState();
    const assignment = state.assignments.find((a) => a.id === body.assignmentId && a.tenantId === actor.tenantId);
    if (!assignment) notFound("Assignment not found");
    const learner = state.learners.find((l) => l.id === body.learnerId && l.tenantId === actor.tenantId);
    if (!learner) notFound("Learner not found");
    const submission: Submission = {
      id: newId("submission"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      assignmentId: String(body.assignmentId),
      learnerId: String(body.learnerId),
      content: ensureString(body.content, "submission.content"),
      fileUrls: body.fileUrls ? ensureArray(body.fileUrls, "submission.fileUrls") : undefined,
      status: "submitted",
      submittedAt: nowIso()
    };
    state.submissions.push(submission);
    this.store.save();
    this.store.audit(actor, "submission.create", "submission", submission.id, undefined, submission);
    return clone(submission);
  }

  gradeSubmission(id: string, input: unknown, actor: RequestActor): Submission {
    const body = ensureObject(input, "grade");
    const state = this.store.getState();
    const submission = state.submissions.find((s) => s.id === id && s.tenantId === actor.tenantId);
    if (!submission) notFound("Submission not found");
    const before = clone(submission);
    submission.score = body.score !== undefined ? ensureNumber(body.score, "grade.score") : undefined;
    submission.feedback = body.feedback ? String(body.feedback) : undefined;
    submission.status = "graded";
    submission.gradedAt = nowIso();
    submission.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "submission.grade", "submission", submission.id, before, submission);
    return clone(submission);
  }

  listDoubts(actor: RequestActor, query?: URLSearchParams) {
    const status = pickQuery(query, "status");
    const learnerId = pickQuery(query, "learnerId");
    return clone(this.store.getState().doubts.filter((d) => {
      if (d.tenantId !== actor.tenantId) return false;
      if (status && d.status !== status) return false;
      if (learnerId && d.learnerId !== learnerId) return false;
      return true;
    }));
  }

  createDoubt(input: unknown, actor: RequestActor): Doubt {
    const body = ensureObject(input, "doubt");
    const state = this.store.getState();
    const learner = state.learners.find((l) => l.id === body.learnerId && l.tenantId === actor.tenantId);
    if (!learner) notFound("Learner not found");
    const doubt: Doubt = {
      id: newId("doubt"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      lessonId: body.lessonId ? String(body.lessonId) : undefined,
      learnerId: String(body.learnerId),
      trainerId: body.trainerId ? String(body.trainerId) : undefined,
      title: ensureString(body.title, "doubt.title"),
      description: ensureString(body.description, "doubt.description"),
      status: "open",
      priority: String(body.priority ?? "medium") as Doubt["priority"],
      responses: [],
      resolvedAt: undefined
    };
    state.doubts.push(doubt);
    this.store.save();
    this.store.audit(actor, "doubt.create", "doubt", doubt.id, undefined, doubt);
    return clone(doubt);
  }

  resolveDoubt(id: string, input: unknown, actor: RequestActor): Doubt {
    const body = ensureObject(input, "doubt");
    const state = this.store.getState();
    const doubt = state.doubts.find((d) => d.id === id && d.tenantId === actor.tenantId);
    if (!doubt) notFound("Doubt not found");
    const before = clone(doubt);
    if (body.response) {
      doubt.responses.push({
        id: newId("response"),
        trainerId: body.trainerId ? String(body.trainerId) : actor.userId,
        content: String(body.response),
        createdAt: nowIso(),
        isAccepted: false
      });
    }
    if (body.status) doubt.status = String(body.status) as Doubt["status"];
    if (body.status === "resolved" || body.status === "faq") {
      doubt.resolvedAt = nowIso();
    }
    doubt.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "doubt.resolve", "doubt", doubt.id, before, doubt);
    return clone(doubt);
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((log) => log.tenantId === actor.tenantId));
  }
}
