import { PeopleState } from "./core/domain";
import { emptyState } from "./core/datastore";
import { nowIso } from "./core/id";

export function createSeedState(tenantId = "demo-tenant"): PeopleState {
  const state = emptyState();
  const createdAt = nowIso();

  state.departments.push(
    {
      id: "dept_eng",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Engineering",
      description: "Software engineering and development",
      status: "active"
    },
    {
      id: "dept_hr",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "HR",
      description: "Human resources and people operations",
      status: "active"
    },
    {
      id: "dept_sales",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Sales",
      description: "Sales and business development",
      status: "active"
    },
    {
      id: "dept_design",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Design",
      description: "Product and UI/UX design",
      status: "active"
    }
  );

  state.roles.push(
    {
      id: "role_dev",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Software Developer",
      description: "Full stack software development",
      departmentId: "dept_eng",
      level: "mid",
      status: "active",
      responsibilities: ["Write clean code", "Review PRs", "Ship features"],
      requirements: ["3+ years experience", "TypeScript", "React"]
    },
    {
      id: "role_hr_exec",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "HR Executive",
      description: "HR operations and recruitment",
      departmentId: "dept_hr",
      level: "mid",
      status: "active",
      responsibilities: ["Manage hiring", "Onboarding", "Employee relations"],
      requirements: ["2+ years HR experience", "Good communication"]
    },
    {
      id: "role_sales_exec",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      name: "Sales Executive",
      description: "Business development and sales",
      departmentId: "dept_sales",
      level: "mid",
      status: "active",
      responsibilities: ["Generate leads", "Close deals", "Client relationships"],
      requirements: ["2+ years sales experience", "Communication skills"]
    }
  );

  state.teams.push({
    id: "team_platform",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    name: "Platform Team",
    description: "Core platform development",
    departmentId: "dept_eng",
    leadId: "emp_1",
    memberIds: ["emp_1", "emp_2"],
    status: "active"
  });

  state.employees.push(
    {
      id: "emp_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      email: "john.doe@company.com",
      displayName: "John Doe",
      phone: "+1234567890",
      status: "active",
      employmentType: "full_time",
      departmentId: "dept_eng",
      teamId: "team_platform",
      roleId: "role_dev",
      joiningDate: "2023-01-15",
      skills: ["TypeScript", "React", "Node.js", "PostgreSQL"],
      workLocation: "Bangalore",
      metadata: {}
    },
    {
      id: "emp_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      email: "jane.smith@company.com",
      displayName: "Jane Smith",
      phone: "+1234567891",
      status: "active",
      employmentType: "full_time",
      departmentId: "dept_eng",
      teamId: "team_platform",
      roleId: "role_dev",
      managerId: "emp_1",
      joiningDate: "2023-03-01",
      skills: ["Python", "Django", "AWS", "Docker"],
      workLocation: "Bangalore",
      metadata: {}
    },
    {
      id: "emp_3",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      email: "sarah.hr@company.com",
      displayName: "Sarah Johnson",
      phone: "+1234567892",
      status: "active",
      employmentType: "full_time",
      departmentId: "dept_hr",
      roleId: "role_hr_exec",
      joiningDate: "2022-06-10",
      skills: ["Recruitment", "Employee relations", "HRIS", "Communication"],
      workLocation: "Bangalore",
      metadata: {}
    },
    {
      id: "emp_4",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      email: "mike.sales@company.com",
      displayName: "Mike Johnson",
      phone: "+1234567893",
      status: "active",
      employmentType: "full_time",
      departmentId: "dept_sales",
      roleId: "role_sales_exec",
      joiningDate: "2023-02-20",
      skills: ["Sales", "CRM", "Negotiation", "Client management"],
      workLocation: "Mumbai",
      metadata: {}
    },
    {
      id: "emp_5",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      email: "lisa.design@company.com",
      displayName: "Lisa Chen",
      phone: "+1234567894",
      status: "on_leave",
      employmentType: "full_time",
      departmentId: "dept_design",
      joiningDate: "2023-05-15",
      skills: ["Figma", "UI Design", "UX Research", "Prototyping"],
      workLocation: "Bangalore",
      metadata: {}
    }
  );

  state.pipelines.push(
    {
      id: "pipe_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "Senior Software Developer",
      description: "Hiring senior developer for platform team",
      departmentId: "dept_eng",
      roleId: "role_dev",
      status: "active",
      openDate: "2024-01-01",
      targetHires: 2,
      salaryRange: { min: 1500000, max: 2500000, currency: "INR" }
    },
    {
      id: "pipe_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      title: "Sales Manager",
      description: "Hiring sales manager for north region",
      departmentId: "dept_sales",
      status: "active",
      openDate: "2024-01-15",
      targetHires: 1,
      salaryRange: { min: 1200000, max: 2000000, currency: "INR" }
    }
  );

  state.candidates.push(
    {
      id: "cand_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      pipelineId: "pipe_1",
      name: "Alice Brown",
      email: "alice.brown@email.com",
      phone: "+1987654321",
      stage: "technical_round",
      skills: ["TypeScript", "React", "Node.js", "MongoDB"],
      experience: "5 years",
      education: "B.Tech Computer Science",
      expectedSalary: 2000000,
      noticePeriod: "30 days",
      currentLocation: "Bangalore",
      source: "LinkedIn",
      interviewFeedback: [
        {
          round: "Screening",
          interviewer: "emp_1",
          rating: 4,
          notes: "Good communication, strong technical foundation",
          date: createdAt
        }
      ],
      metadata: {}
    },
    {
      id: "cand_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      pipelineId: "pipe_1",
      name: "Bob Wilson",
      email: "bob.wilson@email.com",
      phone: "+1987654322",
      stage: "interview_scheduled",
      skills: ["Python", "Django", "PostgreSQL"],
      experience: "4 years",
      education: "B.E. Information Technology",
      expectedSalary: 1800000,
      noticePeriod: "45 days",
      currentLocation: "Pune",
      source: "Referral",
      interviewFeedback: [],
      metadata: {}
    },
    {
      id: "cand_3",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      pipelineId: "pipe_2",
      name: "Carol Davis",
      email: "carol.davis@email.com",
      phone: "+1987654323",
      stage: "shortlisted",
      skills: ["Sales", "B2B", "Enterprise sales"],
      experience: "6 years",
      education: "MBA Marketing",
      expectedSalary: 1500000,
      noticePeriod: "60 days",
      currentLocation: "Delhi",
      source: "Naukri",
      interviewFeedback: [],
      metadata: {}
    }
  );

  state.onboardingChecklists.push({
    id: "onboard_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    employeeId: "emp_5",
    items: [
      { task: "Send offer letter", status: "completed", completedAt: createdAt },
      { task: "Collect ID documents", status: "completed", completedAt: createdAt },
      { task: "Create email account", status: "completed", completedAt: createdAt },
      { task: "Assign tools and access", status: "pending" },
      { task: "Introduce team", status: "pending" },
      { task: "Start training", status: "pending" }
    ],
    startDate: "2023-05-15",
    status: "in_progress"
  });

  state.leaveRequests.push(
    {
      id: "leave_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      employeeId: "emp_5",
      leaveType: "sick",
      startDate: "2024-01-20",
      endDate: "2024-01-25",
      days: 4,
      reason: "Medical treatment",
      status: "approved",
      approvedBy: "emp_3",
      approvedAt: createdAt
    },
    {
      id: "leave_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      employeeId: "emp_2",
      leaveType: "casual",
      startDate: "2024-02-01",
      endDate: "2024-02-03",
      days: 2,
      reason: "Personal work",
      status: "pending"
    }
  );

  state.leaveBalances.push(
    {
      id: "balance_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      employeeId: "emp_1",
      leaveType: "casual",
      total: 12,
      used: 3,
      pending: 0,
      year: 2024
    },
    {
      id: "balance_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      employeeId: "emp_1",
      leaveType: "sick",
      total: 10,
      used: 1,
      pending: 0,
      year: 2024
    }
  );

  state.performanceReviews.push({
    id: "review_1",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    employeeId: "emp_1",
    reviewerId: "emp_1",
    cycle: "quarterly",
    status: "completed",
    scheduledDate: "2024-01-15",
    completedDate: createdAt,
    rating: 4.5,
    goals: [
      {
        description: "Ship new authentication feature",
        target: "Q1",
        achievement: "Completed ahead of schedule",
        rating: 5
      },
      {
        description: "Reduce API latency by 30%",
        target: "Q1",
        achievement: "Achieved 25% reduction",
        rating: 4
      }
    ],
    strengths: "Strong technical skills, good code quality, excellent collaboration",
    areasForImprovement: "Could improve documentation, more knowledge sharing sessions",
    comments: "Outstanding performance this quarter",
    selfAssessment: "Met all goals and delivered quality work"
  });

  state.goals.push(
    {
      id: "goal_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      employeeId: "emp_1",
      title: "Implement CI/CD pipeline",
      description: "Set up automated testing and deployment",
      category: "Technical",
      startDate: "2024-01-01",
      dueDate: "2024-03-31",
      status: "active",
      progress: 60,
      weight: 20
    },
    {
      id: "goal_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      employeeId: "emp_1",
      title: "Mentor junior developers",
      description: "Provide technical guidance to 2 junior devs",
      category: "Leadership",
      startDate: "2024-01-01",
      dueDate: "2024-06-30",
      status: "active",
      progress: 40,
      weight: 15
    }
  );

  state.engagementRecords.push(
    {
      id: "eng_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      employeeId: "emp_1",
      type: "recognition",
      title: "Best Team Player Award",
      description: "Recognized for excellent collaboration",
      date: createdAt,
      sentiment: "positive",
      score: 5,
      createdBy: "emp_3",
      metadata: {}
    },
    {
      id: "eng_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      employeeId: "emp_4",
      type: "anniversary",
      title: "Work Anniversary",
      description: "1 year at company",
      date: createdAt,
      sentiment: "positive",
      score: 5,
      createdBy: "emp_3",
      metadata: {}
    },
    {
      id: "eng_3",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      type: "survey",
      title: "Q4 Employee Satisfaction Survey",
      description: "Quarterly pulse check",
      date: createdAt,
      sentiment: "neutral",
      score: 3.8,
      participants: ["emp_1", "emp_2", "emp_3", "emp_4"],
      metadata: { responseRate: 80 }
    }
  );

  state.employeeDocuments.push(
    {
      id: "doc_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      employeeId: "emp_1",
      type: "employment_agreement",
      title: "Employment Agreement",
      url: "/documents/emp_1/agreement.pdf",
      verified: true,
      uploadedBy: "emp_3"
    },
    {
      id: "doc_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      employeeId: "emp_1",
      type: "id_proof",
      title: "Aadhaar Card",
      url: "/documents/emp_1/aadhaar.pdf",
      verified: true,
      uploadedBy: "emp_1"
    }
  );

  state.assets.push(
    {
      id: "asset_1",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      employeeId: "emp_1",
      name: "MacBook Pro 16",
      type: "Laptop",
      serialNumber: "C02X1234ABCD",
      status: "assigned",
      assignedDate: "2023-01-15",
      condition: "Good"
    },
    {
      id: "asset_2",
      tenantId,
      createdAt,
      updatedAt: createdAt,
      employeeId: "emp_2",
      name: "MacBook Pro 14",
      type: "Laptop",
      serialNumber: "C02X5678EFGH",
      status: "assigned",
      assignedDate: "2023-03-01",
      condition: "Excellent"
    }
  );

  state.events.push({
    id: "event_seed",
    tenantId,
    createdAt,
    updatedAt: createdAt,
    type: "peopleos.seeded",
    source: "PeopleOS",
    data: { message: "PeopleOS demo data seeded", employeeCount: 5 }
  });

  return state;
}
