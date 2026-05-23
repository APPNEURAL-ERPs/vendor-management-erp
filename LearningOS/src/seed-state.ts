import { emptyState } from "./core/datastore";
import { nowIso } from "./core/id";
import { LearningState } from "./domain";

export function createSeedState(tenantId = "demo-tenant"): LearningState {
  const state = emptyState();
  const createdAt = nowIso();

  state.trainers.push({
    id: "trainer_demo_ajay",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "ajay",
    name: "Ajay Prajapat",
    email: "ajay@appneural.com",
    phone: "+91-9876543210",
    expertise: ["JavaScript", "TypeScript", "React", "Node.js", "System Design"],
    bio: "Full Stack Developer and Technical Educator with 8+ years of experience",
    status: "active",
    totalSessions: 45,
    totalLearners: 250,
    rating: 4.8,
    createdBy: "system"
  });

  state.trainers.push({
    id: "trainer_demo_sarah",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "sarah",
    name: "Sarah Chen",
    email: "sarah@appneural.com",
    expertise: ["Python", "Machine Learning", "AI", "Data Science"],
    bio: "AI/ML Engineer and Educator passionate about democratizing AI",
    status: "active",
    totalSessions: 32,
    totalLearners: 180,
    rating: 4.9,
    createdBy: "system"
  });

  state.courses.push({
    id: "course_fsd_interview",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "fsd-interview-prep",
    name: "Full Stack Developer Interview Preparation",
    description: "Complete interview preparation program covering JavaScript, React, Node.js, databases, and system design",
    type: "bootcamp",
    difficulty: "intermediate",
    status: "published",
    trainerId: "trainer_demo_ajay",
    objectives: [
      "Master JavaScript fundamentals and advanced concepts",
      "Build production-ready React applications",
      "Design scalable backend systems with Node.js",
      "Ace technical interviews with confidence"
    ],
    prerequisites: ["Basic programming knowledge", "HTML/CSS fundamentals"],
    tags: ["interview", "full-stack", "JavaScript", "React", "Node.js"],
    version: 1,
    publishedAt: createdAt,
    createdBy: "trainer_demo_ajay"
  });

  state.courses.push({
    id: "course_ai_developer",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "ai-developer-path",
    name: "AI Developer Career Path",
    description: "From Python basics to building production LLM applications with RAG, agents, and fine-tuning",
    type: "certification",
    difficulty: "advanced",
    status: "published",
    trainerId: "trainer_demo_sarah",
    objectives: [
      "Master Python for AI development",
      "Build LLM-powered applications",
      "Implement RAG systems",
      "Deploy and scale AI solutions"
    ],
    prerequisites: ["Programming experience", "Basic math"],
    tags: ["AI", "LLM", "Python", "RAG", "Agents"],
    version: 1,
    publishedAt: createdAt,
    createdBy: "trainer_demo_sarah"
  });

  state.courses.push({
    id: "course_react_mastery",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "react-mastery",
    name: "React Mastery Bootcamp",
    description: "Advanced React patterns, performance optimization, testing, and modern best practices",
    type: "workshop",
    difficulty: "advanced",
    status: "published",
    trainerId: "trainer_demo_ajay",
    objectives: [
      "Master advanced React patterns",
      "Optimize React application performance",
      "Write testable React code",
      "Build reusable component libraries"
    ],
    prerequisites: ["React basics", "JavaScript proficiency"],
    tags: ["React", "JavaScript", "Frontend", "Performance"],
    version: 1,
    publishedAt: createdAt,
    createdBy: "trainer_demo_ajay"
  });

  const fsdLessons = [
    { key: "js-fundamentals", name: "JavaScript Fundamentals", content: "Variables, data types, operators, control flow, and functions", contentType: "text", order: 1 },
    { key: "js-advanced", name: "Advanced JavaScript", content: "Closures, prototypes, async/await, promises, and design patterns", contentType: "text", order: 2 },
    { key: "react-basics", name: "React Basics", content: "Components, props, state, and JSX", contentType: "text", order: 3 },
    { key: "react-hooks", name: "React Hooks Deep Dive", content: "useState, useEffect, useContext, and custom hooks", contentType: "text", order: 4 },
    { key: "node-basics", name: "Node.js Fundamentals", content: "Express, REST APIs, middleware, and error handling", contentType: "text", order: 5 },
    { key: "database-design", name: "Database Design", content: "SQL vs NoSQL, indexing, normalization, and query optimization", contentType: "text", order: 6 }
  ];

  fsdLessons.forEach((lesson) => {
    state.lessons.push({
      id: `lesson_fsd_${lesson.key}`,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      courseId: "course_fsd_interview",
      key: lesson.key,
      name: lesson.name,
      description: lesson.name,
      content: lesson.content,
      contentType: lesson.contentType as any,
      duration: 60,
      order: lesson.order,
      status: "published",
      resources: [],
      createdBy: "trainer_demo_ajay"
    });
  });

  const aiLessons = [
    { key: "python-basics", name: "Python for AI", content: "Python fundamentals, NumPy, Pandas for AI development", contentType: "text", order: 1 },
    { key: "llm-intro", name: "Introduction to LLMs", content: "Understanding large language models, transformers, and GPT architecture", contentType: "text", order: 2 },
    { key: "prompt-engineering", name: "Prompt Engineering", content: "Crafting effective prompts, few-shot learning, and chain-of-thought", contentType: "text", order: 3 },
    { key: "rag-systems", name: "RAG Systems", content: "Building retrieval-augmented generation systems with vector databases", contentType: "text", order: 4 },
    { key: "ai-agents", name: "AI Agents", content: "Building autonomous AI agents with tool use and memory", contentType: "text", order: 5 }
  ];

  aiLessons.forEach((lesson) => {
    state.lessons.push({
      id: `lesson_ai_${lesson.key}`,
      tenantId,
      createdAt,
      updatedAt: createdAt,
      courseId: "course_ai_developer",
      key: lesson.key,
      name: lesson.name,
      description: lesson.name,
      content: lesson.content,
      contentType: lesson.contentType as any,
      duration: 90,
      order: lesson.order,
      status: "published",
      resources: [],
      createdBy: "trainer_demo_sarah"
    });
  });

  state.learners.push({
    id: "learner_demo_ram",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "ram_kumar",
    name: "Ram Kumar",
    email: "ram@example.com",
    phone: "+91-9876543001",
    status: "active",
    tags: ["frontend", "react"],
    groups: [],
    enrolledCourses: [],
    totalLearningHours: 24,
    createdBy: "trainer_demo_ajay"
  });

  state.learners.push({
    id: "learner_demo_priya",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "priya_sharma",
    name: "Priya Sharma",
    email: "priya@example.com",
    phone: "+91-9876543002",
    status: "active",
    tags: ["ai", "python", "ml"],
    groups: [],
    enrolledCourses: [],
    totalLearningHours: 36,
    createdBy: "trainer_demo_sarah"
  });

  state.learners.push({
    id: "learner_demo_aman",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "aman_verma",
    name: "Aman Verma",
    email: "aman@example.com",
    phone: "+91-9876543003",
    status: "enrolled",
    tags: ["full-stack", "node"],
    groups: [],
    enrolledCourses: [],
    totalLearningHours: 8,
    createdBy: "trainer_demo_ajay"
  });

  state.enrollments.push({
    id: "enrollment_ram_fsd",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    learnerId: "learner_demo_ram",
    courseId: "course_fsd_interview",
    status: "in-progress",
    progress: 65,
    enrolledAt: createdAt,
    lastAccessedAt: createdAt,
    createdBy: "learner_demo_ram"
  });

  state.enrollments.push({
    id: "enrollment_priya_ai",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    learnerId: "learner_demo_priya",
    courseId: "course_ai_developer",
    status: "completed",
    progress: 100,
    enrolledAt: createdAt,
    completedAt: createdAt,
    lastAccessedAt: createdAt,
    createdBy: "learner_demo_priya"
  });

  state.enrollments.push({
    id: "enrollment_aman_fsd",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    learnerId: "learner_demo_aman",
    courseId: "course_fsd_interview",
    status: "enrolled",
    progress: 15,
    enrolledAt: createdAt,
    lastAccessedAt: createdAt,
    createdBy: "learner_demo_aman"
  });

  state.assessments.push({
    id: "assessment_js_quiz",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    lessonId: "lesson_fsd_js-fundamentals",
    key: "js-fundamentals-quiz",
    name: "JavaScript Fundamentals Quiz",
    description: "Test your understanding of JavaScript basics",
    type: "quiz",
    passingScore: 70,
    timeLimit: 30,
    questions: [
      { id: "q1", text: "What is the output of typeof null in JavaScript?", type: "mcq", options: ["null", "undefined", "object", "error"], correctAnswer: 2, points: 10, difficulty: "beginner", tags: ["javascript", "basics"] },
      { id: "q2", text: "Explain closures in JavaScript", type: "short-answer", points: 20, difficulty: "intermediate", tags: ["javascript", "advanced"] },
      { id: "q3", text: "Write a function to deep clone an object", type: "coding", points: 30, difficulty: "advanced", tags: ["javascript", "coding"] }
    ],
    status: "published",
    createdBy: "trainer_demo_ajay"
  });

  state.assessments.push({
    id: "assessment_react_project",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    courseId: "course_fsd_interview",
    key: "react-project-assessment",
    name: "React Application Project",
    description: "Build a full-featured React application demonstrating mastery of concepts",
    type: "project",
    passingScore: 80,
    questions: [
      { id: "q1", text: "Component Architecture - Design a reusable component library", type: "practical", points: 30, difficulty: "intermediate", tags: ["react", "architecture"] },
      { id: "q2", text: "State Management - Implement global state with Context API", type: "practical", points: 25, difficulty: "intermediate", tags: ["react", "state"] },
      { id: "q3", text: "Performance - Optimize rendering with memoization", type: "practical", points: 25, difficulty: "advanced", tags: ["react", "performance"] }
    ],
    status: "published",
    createdBy: "trainer_demo_ajay"
  });

  state.certificates.push({
    id: "cert_priya_ai",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    learnerId: "learner_demo_priya",
    courseId: "course_ai_developer",
    name: "AI Developer Certificate",
    recipientName: "Priya Sharma",
    issuedAt: createdAt,
    certificateNumber: "CERT-AI-2026-001",
    qrCode: "https://verify.appneural.com/cert/AIC-2026-001",
    verificationUrl: "https://appneural.com/verify/AIC-2026-001",
    status: "issued",
    issuedBy: "trainer_demo_sarah"
  });

  state.badges.push({
    id: "badge_js_basics",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "js-fundamentals",
    name: "JavaScript Basics",
    description: "Completed JavaScript fundamentals",
    criteria: "Complete JS basics quiz with 70% score",
    icon: "📜",
    category: "skill",
    status: "active",
    createdBy: "trainer_demo_ajay"
  });

  state.badges.push({
    id: "badge_react_hero",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "react-hero",
    name: "React Hero",
    description: "Mastered React development",
    criteria: "Complete React Mastery bootcamp",
    icon: "⚛️",
    category: "completion",
    status: "active",
    createdBy: "trainer_demo_ajay"
  });

  state.badges.push({
    id: "badge_ai_pioneer",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "ai-pioneer",
    name: "AI Pioneer",
    description: "Completed AI Developer path",
    criteria: "Complete AI Developer certification",
    icon: "🤖",
    category: "certification",
    status: "active",
    createdBy: "trainer_demo_sarah"
  });

  state.skills.push({
    id: "skill_javascript",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "javascript",
    name: "JavaScript",
    description: "Modern JavaScript development including ES6+ features",
    category: "Programming",
    level: "intermediate",
    relatedCourses: ["course_fsd_interview"],
    status: "active",
    createdBy: "trainer_demo_ajay"
  });

  state.skills.push({
    id: "skill_react",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "react",
    name: "React",
    description: "Building modern web applications with React",
    category: "Frontend",
    level: "intermediate",
    relatedCourses: ["course_fsd_interview", "course_react_mastery"],
    status: "active",
    createdBy: "trainer_demo_ajay"
  });

  state.skills.push({
    id: "skill_llm",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "llm-development",
    name: "LLM Development",
    description: "Building applications with Large Language Models",
    category: "AI/ML",
    level: "advanced",
    relatedCourses: ["course_ai_developer"],
    status: "active",
    createdBy: "trainer_demo_sarah"
  });

  state.learningPaths.push({
    id: "lp_fullstack_developer",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "fullstack-developer",
    name: "Full Stack Developer Path",
    description: "Complete learning path to become a full stack developer",
    type: "role-based",
    targetAudience: "Aspiring full stack developers",
    courses: ["course_fsd_interview", "course_react_mastery"],
    milestones: [
      { id: "m1", name: "JavaScript Mastery", description: "Master JavaScript fundamentals and advanced concepts", targetCourseIds: ["course_fsd_interview"], requiredForCompletion: true },
      { id: "m2", name: "React Development", description: "Build modern React applications", targetCourseIds: ["course_fsd_interview", "course_react_mastery"], requiredForCompletion: true },
      { id: "m3", name: "Backend Development", description: "Master Node.js and backend systems", targetCourseIds: ["course_fsd_interview"], requiredForCompletion: true }
    ],
    estimatedDuration: 90,
    status: "published",
    createdBy: "trainer_demo_ajay"
  });

  state.learningPaths.push({
    id: "lp_ai_engineer",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "ai-engineer",
    name: "AI Engineer Path",
    description: "From Python basics to production LLM applications",
    type: "career",
    targetAudience: "Software engineers transitioning to AI/ML",
    courses: ["course_ai_developer"],
    milestones: [
      { id: "m1", name: "Python Proficiency", description: "Python for AI development", targetCourseIds: ["course_ai_developer"], requiredForCompletion: true },
      { id: "m2", name: "LLM Fundamentals", description: "Understanding and using LLMs", targetCourseIds: ["course_ai_developer"], requiredForCompletion: true },
      { id: "m3", name: "RAG & Agents", description: "Building RAG systems and AI agents", targetCourseIds: ["course_ai_developer"], requiredForCompletion: true }
    ],
    estimatedDuration: 60,
    status: "published",
    createdBy: "trainer_demo_sarah"
  });

  state.batches.push({
    id: "batch_fsd_may_2026",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    key: "fsd-may-2026",
    name: "FSD Interview Prep - May 2026",
    description: "Full Stack Developer Interview Preparation batch",
    courseId: "course_fsd_interview",
    trainerId: "trainer_demo_ajay",
    schedule: [
      { dayOfWeek: 1, startTime: "18:00", endTime: "20:00", location: "Online", sessionType: "live" },
      { dayOfWeek: 3, startTime: "18:00", endTime: "20:00", location: "Online", sessionType: "live" },
      { dayOfWeek: 5, startTime: "18:00", endTime: "20:00", location: "Online", sessionType: "live" }
    ],
    maxLearners: 30,
    currentLearners: 15,
    status: "ongoing",
    startDate: "2026-05-01T00:00:00.000Z",
    endDate: "2026-06-30T00:00:00.000Z",
    createdBy: "trainer_demo_ajay"
  });

  state.assignments.push({
    id: "assignment_react_todo",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    lessonId: "lesson_fsd_react-basics",
    key: "react-todo-app",
    name: "Build a Todo Application",
    description: "Create a fully functional Todo application using React",
    instructions: "Build a todo application with add, edit, delete, and filter functionality. Use local state management.",
    dueDate: "2026-06-15T00:00:00.000Z",
    maxScore: 100,
    status: "published",
    rubric: [
      { criteria: "Functionality", maxPoints: 40, description: "All CRUD operations work correctly" },
      { criteria: "Code Quality", maxPoints: 30, description: "Clean, readable, well-structured code" },
      { criteria: "UI/UX", maxPoints: 20, description: "Professional appearance and user experience" },
      { criteria: "Best Practices", maxPoints: 10, description: "Follows React best practices" }
    ],
    createdBy: "trainer_demo_ajay"
  });

  state.resources.push({
    id: "resource_js_cheatsheet",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    lessonId: "lesson_fsd_js-fundamentals",
    key: "js-cheatsheet",
    name: "JavaScript Cheat Sheet",
    type: "pdf",
    url: "https://resources.appneural.com/js-cheatsheet.pdf",
    description: "Quick reference guide for JavaScript concepts",
    tags: ["javascript", "reference", "cheatsheet"],
    downloadCount: 156,
    createdBy: "trainer_demo_ajay"
  });

  state.resources.push({
    id: "resource_react_patterns",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    lessonId: "lesson_fsd_react-hooks",
    key: "react-patterns-guide",
    name: "React Patterns Guide",
    type: "pdf",
    url: "https://resources.appneural.com/react-patterns.pdf",
    description: "Advanced React patterns and best practices",
    tags: ["react", "patterns", "advanced"],
    downloadCount: 89,
    createdBy: "trainer_demo_ajay"
  });

  return state;
}
