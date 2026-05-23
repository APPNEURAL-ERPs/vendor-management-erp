export function docs() {
  return {
    name: "ProjectOS",
    version: "1.0.0",
    description: "Project management OS for projects, milestones, sprints, tasks, resources, budgets, and project lifecycle",
    auth: {
      headers: {
        "x-role": "owner | admin | project_manager | project_owner | team_member | viewer",
        "x-tenant-id": "tenant id, defaults to demo-tenant",
        "x-user-id": "actor id"
      }
    },
    coreConcepts: {
      project: "A container for all project work including milestones, sprints, tasks, resources, and budgets",
      milestone: "A major checkpoint in a project, often tied to billing and client approvals",
      sprint: "A time-boxed iteration of work within a project",
      task: "A unit of work that can be assigned, tracked, and completed",
      resource: "A person, tool, or asset allocated to a project",
      budget: "Financial tracking for a project including costs and remaining budget",
      timeEntry: "Time logged against a project or task",
      phase: "A logical grouping of work within a project",
      risk: "An identified potential issue that may impact the project",
      issue: "A current problem or blocker that needs resolution"
    },
    examples: {
      createProject: {
        method: "POST",
        path: "/projectos/projects",
        headers: { "x-role": "project_manager" },
        body: {
          key: "new-website",
          name: "New Website Development",
          description: "Development of company website",
          ownerId: "user_123",
          priority: "high",
          startDate: "2024-01-15T00:00:00Z",
          endDate: "2024-03-15T00:00:00Z"
        }
      },
      createMilestone: {
        method: "POST",
        path: "/projectos/milestones",
        headers: { "x-role": "project_manager" },
        body: {
          projectId: "project_xxx",
          key: "design-complete",
          name: "Design Complete",
          description: "All design mockups approved",
          dueDate: "2024-02-01T00:00:00Z",
          billingPercentage: 30
        }
      },
      createTask: {
        method: "POST",
        path: "/projectos/tasks",
        headers: { "x-role": "project_manager" },
        body: {
          projectId: "project_xxx",
          key: "homepage-dev",
          title: "Develop Homepage",
          description: "Build the homepage with React",
          priority: "high",
          estimatedHours: 24,
          storyPoints: 8
        }
      },
      logTime: {
        method: "POST",
        path: "/projectos/time-entries",
        headers: { "x-role": "team_member" },
        body: {
          projectId: "project_xxx",
          taskId: "task_xxx",
          description: "Homepage development",
          date: "2024-01-20T00:00:00Z",
          hours: 8,
          billable: true
        }
      }
    }
  };
}
