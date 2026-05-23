import { CareerState } from "./core/domain";
import { emptyState } from "./core/datastore";
import { nowIso, newId } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): CareerState {
  const state = emptyState();
  const createdAt = nowIso();

  state.jobs.push({
    id: "job_senior_fullstack",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    code: "SFD-001",
    title: "Senior Full Stack Developer",
    department: "Engineering",
    location: "Remote",
    employmentType: "full_time",
    workplaceType: "remote",
    openings: 2,
    status: "open",
    priority: "high",
    description: "We are looking for a Senior Full Stack Developer to build and scale our platform. You will work on challenging problems and mentor junior developers.",
    requirements: [
      "5+ years of software development experience",
      "Strong proficiency in TypeScript and Node.js",
      "Experience with React or Angular",
      "Database design and optimization skills",
      "Excellent communication skills"
    ],
    responsibilities: [
      "Design and implement scalable web applications",
      "Collaborate with cross-functional teams",
      "Mentor junior developers and conduct code reviews",
      "Participate in architectural decisions"
    ],
    requiredSkills: ["TypeScript", "Node.js", "React", "PostgreSQL", "AWS", "Docker"],
    niceToHaveSkills: ["Kubernetes", "GraphQL", "Redis"],
    experienceMinYears: 5,
    experienceMaxYears: 10,
    salaryRange: { currency: "USD", min: 120000, max: 180000, period: "year", public: true },
    recruiterId: "user_recruiter",
    hiringManagerId: "user_hiring_manager",
    screeningQuestions: [],
    tags: ["engineering", "fullstack", "remote"],
    metadata: {},
    createdBy: "user_admin"
  });

  state.jobs.push({
    id: "job_platform_engineer",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    code: "PE-001",
    title: "Platform Engineer",
    department: "Infrastructure",
    location: "San Francisco, CA",
    employmentType: "full_time",
    workplaceType: "hybrid",
    openings: 1,
    status: "open",
    priority: "medium",
    description: "Join our platform team to build and maintain cloud infrastructure that powers our services.",
    requirements: [
      "4+ years in platform or infrastructure engineering",
      "Strong experience with Kubernetes and Docker",
      "Proficiency in Python or Go",
      "Experience with CI/CD pipelines",
      "Knowledge of observability tools"
    ],
    responsibilities: [
      "Build and maintain CI/CD pipelines",
      "Manage Kubernetes clusters and deployments",
      "Implement monitoring and alerting solutions",
      "Automate infrastructure provisioning"
    ],
    requiredSkills: ["Kubernetes", "Docker", "Python", "Go", "Terraform", "AWS"],
    niceToHaveSkills: ["Azure", "GCP", "Ansible"],
    experienceMinYears: 4,
    experienceMaxYears: 8,
    salaryRange: { currency: "USD", min: 140000, max: 200000, period: "year", public: true },
    recruiterId: "user_recruiter",
    hiringManagerId: "user_hiring_manager",
    screeningQuestions: [],
    tags: ["infrastructure", "platform", "cloud"],
    metadata: {},
    createdBy: "user_admin"
  });

  state.candidates.push({
    id: "cand_jane_smith",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@email.com",
    phone: "+1-555-0123",
    location: "San Francisco, CA",
    currentCompany: "TechCorp Inc.",
    currentTitle: "Senior Software Engineer",
    source: "linkedin",
    status: "active",
    consentStatus: "granted",
    tags: ["engineering", "senior"],
    skills: ["TypeScript", "Node.js", "React", "PostgreSQL", "AWS", "Docker"],
    experienceYears: 7,
    linkedInUrl: "https://linkedin.com/in/janesmith",
    notes: "Strong technical background",
    metadata: {},
    createdBy: "user_recruiter"
  });

  state.applications.push({
    id: "app_jane_smith",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    jobId: "job_senior_fullstack",
    candidateId: "cand_jane_smith",
    source: "linkedin",
    status: "interview",
    currentStageId: "stage_interview",
    stageEnteredAt: createdAt,
    matchScore: 85,
    screeningAnswers: [],
    tags: ["engineering"],
    metadata: {},
    createdBy: "user_recruiter"
  });

  state.interviews.push({
    id: "int_jane_technical",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    applicationId: "app_jane_smith",
    jobId: "job_senior_fullstack",
    candidateId: "cand_jane_smith",
    title: "Technical Interview - Jane Smith",
    interviewType: "technical",
    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 60,
    timezone: "America/Los_Angeles",
    interviewerUserIds: ["user_hiring_manager"],
    status: "scheduled",
    createdBy: "user_recruiter"
  });

  state.offers.push({
    id: "offer_bob_johnson",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    applicationId: "app_bob_johnson",
    jobId: "job_product_manager",
    candidateId: "cand_bob_johnson",
    status: "sent",
    title: "Product Manager Offer - Bob Johnson",
    compensation: {
      currency: "USD",
      baseSalary: 135000,
      bonus: 15000,
      equity: "0.05%",
      benefits: ["Health Insurance", "Stock Options", "Signing Bonus"]
    },
    startDate: "2025-02-01",
    expiresAt: "2025-01-15T00:00:00Z",
    approvals: [],
    terms: ["Standard 90-day probation", "Non-compete clause"],
    sentAt: createdAt,
    metadata: {},
    createdBy: "user_hiring_manager"
  });

  state.careerPaths.push({
    id: "path_senior_engineer",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    title: "Senior Engineer Career Path",
    description: "Progression from Mid-Level to Senior Engineer with leadership responsibilities",
    currentLevel: "mid",
    targetLevel: "senior",
    requiredSkills: ["System Design", "Technical Leadership", "Mentoring", "Architecture"],
    currentSkills: ["System Design", "Technical Leadership"],
    skillGaps: [
      {
        skill: "Mentoring",
        importance: "required",
        currentLevel: 2,
        targetLevel: 4,
        resources: ["Mentorship training", "Pair programming sessions"]
      },
      {
        skill: "Architecture",
        importance: "required",
        currentLevel: 3,
        targetLevel: 5,
        resources: ["Architecture books", "System design courses"]
      }
    ],
    milestones: [
      {
        id: "milestone_1",
        title: "Complete architecture training",
        description: "Finish the internal architecture bootcamp",
        order: 1,
        targetDate: "2025-03-01"
      },
      {
        id: "milestone_2",
        title: "Lead a major project",
        description: "Lead the design and implementation of a platform feature",
        order: 2,
        targetDate: "2025-06-01"
      },
      {
        id: "milestone_3",
        title: "Mentor two junior engineers",
        description: "Provide regular mentorship to junior team members",
        order: 3,
        targetDate: "2025-09-01"
      }
    ],
    estimatedDuration: "12 months",
    status: "active"
  });

  state.skillProfiles.push({
    id: "profile_jane_smith",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    candidateId: "cand_jane_smith",
    candidateName: "Jane Smith",
    skills: [
      { name: "TypeScript", level: "expert", yearsOfExperience: 6, endorsements: 15 },
      { name: "Node.js", level: "expert", yearsOfExperience: 6, endorsements: 12 },
      { name: "React", level: "advanced", yearsOfExperience: 5, endorsements: 8 },
      { name: "PostgreSQL", level: "advanced", yearsOfExperience: 4, endorsements: 5 },
      { name: "AWS", level: "advanced", yearsOfExperience: 3, endorsements: 6 },
      { name: "Docker", level: "intermediate", yearsOfExperience: 2, endorsements: 3 }
    ],
    certifications: [
      {
        name: "AWS Solutions Architect",
        issuer: "Amazon Web Services",
        issuedAt: "2023-06-15",
        credentialUrl: "https://aws.amazon.com/verification/xxx"
      },
      {
        name: "Kubernetes Administrator",
        issuer: "CNCF",
        issuedAt: "2023-09-20"
      }
    ],
    experience: [
      {
        company: "TechCorp Inc.",
        title: "Senior Software Engineer",
        startDate: "2021-03-01",
        current: true,
        description: "Leading full-stack development of customer-facing applications",
        achievements: [
          "Reduced API response time by 40% through optimization",
          "Led migration to microservices architecture",
          "Mentored 3 junior developers"
        ]
      }
    ],
    education: [
      {
        institution: "MIT",
        degree: "Bachelor of Science",
        field: "Computer Science",
        graduationDate: "2018-05-15",
        gpa: 3.8
      }
    ],
    projects: [
      {
        name: "E-commerce Platform",
        description: "Built a scalable e-commerce platform handling 10k+ daily transactions",
        technologies: ["Node.js", "React", "PostgreSQL", "Redis"],
        url: "https://github.com/janesmith/ecommerce"
      }
    ],
    overallScore: 85
  });

  state.events.push({
    id: "evt_seed_bootstrap",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "careeros.seeded",
    entityType: "job",
    entityId: "job_senior_fullstack",
    data: { message: "CareerOS demo data seeded" }
  });

  return state;
}
