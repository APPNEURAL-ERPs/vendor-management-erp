export function docs() {
  return {
    name: "CareerOS",
    version: "1.0.0",
    description: "CareerOS: Jobs, hiring pipeline, applications, interviews, offers, onboarding, and career paths",
    auth: {
      headers: {
        "x-role": "viewer | recruiter | hiring_manager | hr_admin | admin",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      job: "An open position in the organization with requirements, skills, and hiring team",
      application: "A candidate's submission for a job with status tracking through the pipeline",
      interview: "Scheduled interviews with feedback, ratings, and hiring decisions",
      offer: "Extended offers to candidates with compensation details",
      careerPath: "Defined progression paths with skill gaps and milestones",
      skillProfile: "Comprehensive candidate profile with skills, certifications, and experience"
    },
    roles: {
      viewer: "Read-only access to jobs, applications, interviews, and offers",
      recruiter: "Manage jobs, applications, and schedule interviews",
      hiring_manager: "Full hiring workflow including offers and career paths",
      hr_admin: "Complete HR access including skill profiles and analytics",
      admin: "Full system access"
    },
    examples: {
      createJob: {
        method: "POST",
        path: "/career/jobs",
        headers: { "x-role": "recruiter" },
        body: {
          title: "Senior Full Stack Developer",
          department: "Engineering",
          location: "Remote",
          employmentType: "full_time",
          seniority: "senior",
          description: "Build and scale our platform...",
          requirements: ["5+ years experience", "TypeScript", "Node.js"],
          skills: ["TypeScript", "Node.js", "React", "PostgreSQL"],
          status: "open"
        }
      },
      submitApplication: {
        method: "POST",
        path: "/career/applications",
        headers: { "x-role": "recruiter" },
        body: {
          jobId: "job_xxx",
          candidateName: "Jane Smith",
          candidateEmail: "jane@example.com",
          resumeUrl: "https://example.com/resume.pdf",
          source: "linkedin"
        }
      },
      scheduleInterview: {
        method: "POST",
        path: "/career/interviews",
        headers: { "x-role": "recruiter" },
        body: {
          applicationId: "app_xxx",
          jobId: "job_xxx",
          interviewerId: "user_xxx",
          interviewerName: "John Doe",
          scheduledAt: "2024-12-15T10:00:00Z",
          duration: 60,
          type: "technical"
        }
      },
      createOffer: {
        method: "POST",
        path: "/career/offers",
        headers: { "x-role": "hiring_manager" },
        body: {
          applicationId: "app_xxx",
          jobId: "job_xxx",
          candidateName: "Jane Smith",
          candidateEmail: "jane@example.com",
          salary: 150000,
          currency: "USD",
          startDate: "2025-01-15"
        }
      }
    }
  };
}
