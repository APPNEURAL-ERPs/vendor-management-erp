export function docs() {
  return {
    name: "LearningOS",
    version: "1.0.0",
    description: "LearningOS: Operating layer for courses, lessons, assessments, certifications, learning paths, and training management.",
    auth: {
      headers: {
        "x-role": "viewer | instructor | learner | admin | owner",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      course: "A structured learning program with lessons, assessments, and learning outcomes.",
      lesson: "Individual learning content within a course, supporting multiple content types.",
      assessment: "Evaluations including quizzes, tests, coding challenges, and projects.",
      certificate: "Proof of completion for courses, workshops, or training programs.",
      learningPath: "Structured progression through multiple courses for role-based or career learning.",
      enrollment: "A learner's registration in a course, tracking progress and completion.",
      batch: "Cohort-based learning with scheduled sessions, trainers, and group management.",
      learner: "A participant in the learning system with progress tracking and achievements.",
      trainer: "An instructor who delivers courses, manages batches, and provides support.",
      assignment: "Practical tasks with rubrics, submissions, and grading workflows."
    },
    examples: {
      createCourse: {
        method: "POST",
        path: "/learning/courses",
        body: {
          key: "fsd-interview-prep",
          name: "Full Stack Developer Interview Preparation",
          description: "Complete interview preparation for full stack developer roles",
          type: "bootcamp",
          difficulty: "intermediate",
          objectives: ["JavaScript mastery", "React patterns", "System design basics", "Coding practice"],
          tags: ["interview", "full-stack", "coding"]
        }
      },
      createLesson: {
        method: "POST",
        path: "/learning/lessons",
        body: {
          courseId: "course_xxx",
          key: "js-fundamentals",
          name: "JavaScript Fundamentals",
          content: "Variables, functions, and control flow in JavaScript",
          contentType: "text",
          order: 1
        }
      },
      enrollLearner: {
        method: "POST",
        path: "/learning/enrollments",
        body: {
          learnerId: "learner_xxx",
          courseId: "course_xxx"
        }
      },
      generateCertificate: {
        method: "POST",
        path: "/learning/certificates/generate",
        body: {
          learnerId: "learner_xxx",
          courseId: "course_xxx",
          name: "Full Stack Developer Certificate"
        }
      }
    }
  };
}
