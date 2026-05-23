import { Branch, BusinessHierarchy, Department, HierarchyDepartment, Organization, Team } from "../core/domain";
import { clone } from "../core/utils";

export class HierarchyEngine {
  build(organization: Organization | undefined, branches: Branch[], departments: Department[], teams: Team[]): BusinessHierarchy {
    const departmentMap = new Map<string, HierarchyDepartment>();
    for (const department of departments) {
      departmentMap.set(department.id, { ...clone(department), teams: [], childDepartments: [] });
    }

    const rootDepartments: HierarchyDepartment[] = [];
    for (const department of departmentMap.values()) {
      if (department.parentDepartmentId && departmentMap.has(department.parentDepartmentId)) {
        departmentMap.get(department.parentDepartmentId)?.childDepartments.push(department);
      } else {
        rootDepartments.push(department);
      }
    }

    const unassignedTeams: Team[] = [];
    for (const team of teams) {
      if (team.departmentId && departmentMap.has(team.departmentId)) {
        departmentMap.get(team.departmentId)?.teams.push(clone(team));
      } else {
        unassignedTeams.push(clone(team));
      }
    }

    const branchNodes = branches.map((branch) => {
      const branchDepartments = rootDepartments.filter((department) => department.branchIds.includes(branch.id));
      const branchTeams = teams.filter((team) => team.branchId === branch.id && !team.departmentId).map(clone);
      return { ...clone(branch), departments: branchDepartments, teams: branchTeams };
    });

    const assignedDepartmentIds = new Set<string>();
    for (const branch of branchNodes) {
      for (const department of branch.departments) assignedDepartmentIds.add(department.id);
    }

    return {
      organization: organization ? clone(organization) : undefined,
      branches: branchNodes,
      departments: departments.map(d => clone(d)),
      teams: teams.map(t => clone(t)),
      unassignedDepartments: rootDepartments.filter((department) => department.branchIds.length === 0 || !assignedDepartmentIds.has(department.id)),
      unassignedTeams,
      employeeCount: 0,
      departmentCount: departments.length
    };
  }
}
