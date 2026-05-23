export function docs() {
  return {
    name: "PeopleOS",
    version: "1.0.0",
    description: "People operations engine: employees, hiring, onboarding, attendance, performance, engagement, and HR workflows.",
    auth: {
      headers: {
        "x-role": "owner | admin | hr_admin | hr_manager | team_lead | employee | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      employee: "A person employed by the organization with a profile, status, and associated data.",
      team: "A group of employees working together under a team lead.",
      department: "An organizational unit that contains teams and roles.",
      role: "A job role with responsibilities and requirements.",
      pipeline: "A hiring pipeline for open positions with candidates at various stages.",
      candidate: "A job applicant in the hiring pipeline at different stages.",
      interview: "An interview scheduled for a candidate with feedback and rating.",
      offer: "A job offer extended to a selected candidate.",
      onboarding: "A checklist of tasks for new employee onboarding.",
      leave: "An employee's leave request with type, dates, and approval status.",
      review: "A performance review with goals, ratings, and feedback.",
      goal: "An employee's goal or objective with progress tracking.",
      engagement: "An engagement record like surveys, recognition, or anniversaries."
    },
    examples: {
      listEmployees: {
        method: "GET",
        path: "/people/employees",
        headers: { "x-role": "hr_admin" }
      },
      createEmployee: {
        method: "POST",
        path: "/people/employees",
        headers: { "x-role": "hr_admin" },
        body: {
          email: "new.employee@company.com",
          displayName: "New Employee",
          status: "joining_pending",
          employmentType: "full_time",
          departmentId: "dept_eng"
        }
      },
      createCandidate: {
        method: "POST",
        path: "/people/candidates",
        headers: { "x-role": "hr_manager" },
        body: {
          pipelineId: "pipe_1",
          name: "John Smith",
          email: "john.smith@email.com",
          stage: "applied",
          skills: ["JavaScript", "React", "Node.js"],
          expectedSalary: 1500000,
          noticePeriod: "30 days"
        }
      },
      createLeaveRequest: {
        method: "POST",
        path: "/people/leaves",
        headers: { "x-role": "employee" },
        body: {
          employeeId: "emp_1",
          leaveType: "casual",
          startDate: "2024-03-01",
          endDate: "2024-03-03",
          days: 2,
          reason: "Personal work"
        }
      },
      createPerformanceReview: {
        method: "POST",
        path: "/people/reviews",
        headers: { "x-role": "hr_admin" },
        body: {
          employeeId: "emp_1",
          cycle: "quarterly",
          status: "draft",
          goals: [
            { description: "Complete project milestone", target: "Q1" }
          ]
        }
      },
      createEngagement: {
        method: "POST",
        path: "/people/engagements",
        headers: { "x-role": "hr_admin" },
        body: {
          type: "survey",
          title: "Employee Satisfaction Survey Q1",
          description: "Quarterly pulse check",
          date: "2024-03-15",
          participants: ["emp_1", "emp_2", "emp_3"]
        }
      }
    }
  };
}
