export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "hr_admin" | "hr_manager" | "team_lead" | "employee" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";

export type EmployeeStatus = 
  | "candidate" 
  | "offer_sent" 
  | "joining_pending" 
  | "active" 
  | "on_probation" 
  | "on_leave" 
  | "notice_period" 
  | "exited" 
  | "archived";

export type HiringStage = 
  | "applied" 
  | "screening" 
  | "shortlisted" 
  | "interview_scheduled" 
  | "technical_round" 
  | "hr_round" 
  | "selected" 
  | "offer_sent" 
  | "joined" 
  | "rejected" 
  | "on_hold";

export type OfferStatus = "draft" | "pending_approval" | "sent" | "accepted" | "rejected" | "expired" | "renegotiation" | "joined";
export type LeaveType = "casual" | "sick" | "paid" | "unpaid" | "maternity" | "paternity" | "comp_off" | "emergency" | "work_from_home";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export type AttendanceStatus = "present" | "absent" | "half_day" | "late" | "work_from_home" | "on_leave" | "holiday" | "weekly_off";
export type ReviewCycle = "monthly" | "quarterly" | "half_yearly" | "annual" | "probation" | "project_based";
export type ReviewStatus = "draft" | "scheduled" | "in_progress" | "completed";
export type EngagementType = "survey" | "pulse" | "feedback" | "recognition" | "appreciation" | "anniversary" | "birthday";
export type EmploymentType = "full_time" | "part_time" | "contract" | "freelance" | "intern" | "trainee";

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

export interface Employee extends BaseEntity {
  email: string;
  displayName: string;
  phone?: string;
  status: EmployeeStatus;
  employmentType: EmploymentType;
  departmentId?: UUID;
  teamId?: UUID;
  roleId?: UUID;
  managerId?: UUID;
  joiningDate?: ISODate;
  probationEndDate?: ISODate;
  skills: string[];
  workLocation?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relation?: string;
  };
  metadata: Record<string, unknown>;
}

export interface Department extends BaseEntity {
  name: string;
  description?: string;
  headId?: UUID;
  status: EntityStatus;
}

export interface Team extends BaseEntity {
  name: string;
  description?: string;
  departmentId?: UUID;
  leadId?: UUID;
  memberIds: UUID[];
  status: EntityStatus;
}

export interface JobRole extends BaseEntity {
  name: string;
  description?: string;
  departmentId?: UUID;
  level?: string;
  status: EntityStatus;
  responsibilities: string[];
  requirements: string[];
}

export interface HiringPipeline extends BaseEntity {
  title: string;
  description?: string;
  departmentId?: UUID;
  roleId?: UUID;
  status: EntityStatus;
  openDate?: ISODate;
  closeDate?: ISODate;
  targetHires?: number;
  salaryRange?: { min?: number; max?: number; currency?: string };
}

export interface Candidate extends BaseEntity {
  pipelineId?: UUID;
  name: string;
  email: string;
  phone?: string;
  stage: HiringStage;
  resumeUrl?: string;
  skills: string[];
  experience?: string;
  education?: string;
  expectedSalary?: number;
  noticePeriod?: string;
  currentLocation?: string;
  source?: string;
  interviewFeedback: Array<{
    round: string;
    interviewer?: string;
    rating?: number;
    notes?: string;
    date: ISODate;
  }>;
  metadata: Record<string, unknown>;
}

export interface Interview extends BaseEntity {
  candidateId: UUID;
  pipelineId?: UUID;
  round: string;
  scheduledAt?: ISODate;
  interviewerIds: UUID[];
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  feedback?: string;
  rating?: number;
}

export interface Offer extends BaseEntity {
  candidateId: UUID;
  pipelineId?: UUID;
  status: OfferStatus;
  salary?: number;
  currency?: string;
  benefits?: string;
  startDate?: ISODate;
  expiryDate?: ISODate;
  approvedBy?: UUID;
  sentAt?: ISODate;
  acceptedAt?: ISODate;
  rejectedAt?: ISODate;
  notes?: string;
}

export interface OnboardingChecklist extends BaseEntity {
  employeeId: UUID;
  items: Array<{
    task: string;
    status: "pending" | "completed" | "skipped";
    completedAt?: ISODate;
    assignee?: UUID;
  }>;
  startDate?: ISODate;
  completionDate?: ISODate;
  status: EntityStatus;
}

export interface AttendanceRecord extends BaseEntity {
  employeeId: UUID;
  date: ISODate;
  status: AttendanceStatus;
  checkIn?: ISODate;
  checkOut?: ISODate;
  hoursWorked?: number;
  notes?: string;
}

export interface LeaveRequest extends BaseEntity {
  employeeId: UUID;
  leaveType: LeaveType;
  startDate: ISODate;
  endDate: ISODate;
  days: number;
  reason?: string;
  status: LeaveStatus;
  approvedBy?: UUID;
  approvedAt?: ISODate;
  rejectionReason?: string;
  balance?: number;
}

export interface LeaveBalance extends BaseEntity {
  employeeId: UUID;
  leaveType: LeaveType;
  total: number;
  used: number;
  pending: number;
  year: number;
}

export interface PerformanceReview extends BaseEntity {
  employeeId: UUID;
  reviewerId?: UUID;
  cycle: ReviewCycle;
  status: ReviewStatus;
  scheduledDate?: ISODate;
  completedDate?: ISODate;
  rating?: number;
  goals: Array<{
    description: string;
    target?: string;
    achievement?: string;
    rating?: number;
  }>;
  strengths?: string;
  areasForImprovement?: string;
  comments?: string;
  selfAssessment?: string;
}

export interface Goal extends BaseEntity {
  employeeId: UUID;
  title: string;
  description?: string;
  category?: string;
  startDate?: ISODate;
  dueDate?: ISODate;
  status: "active" | "completed" | "cancelled" | "at_risk";
  progress: number;
  weight?: number;
  linkedReviews?: UUID[];
}

export interface EngagementRecord extends BaseEntity {
  employeeId?: UUID;
  type: EngagementType;
  title: string;
  description?: string;
  date: ISODate;
  sentiment?: "positive" | "neutral" | "negative";
  score?: number;
  participants?: UUID[];
  createdBy?: UUID;
  metadata: Record<string, unknown>;
}

export interface EmployeeDocument extends BaseEntity {
  employeeId: UUID;
  type: string;
  title: string;
  url?: string;
  expiryDate?: ISODate;
  verified: boolean;
  uploadedBy?: UUID;
}

export interface Asset extends BaseEntity {
  employeeId?: UUID;
  name: string;
  type: string;
  serialNumber?: string;
  status: "assigned" | "available" | "maintenance" | "retired";
  assignedDate?: ISODate;
  returnDate?: ISODate;
  condition?: string;
}

export interface PeopleEvent extends BaseEntity {
  type: string;
  source: string;
  data: Record<string, unknown>;
  correlationId?: UUID;
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

export interface PeopleOverview {
  employees: { total: number; active: number; byStatus: Record<string, number> };
  teams: { total: number; active: number };
  roles: { total: number; active: number };
  pipelines: { total: number; active: number; openPositions: number };
  candidates: { total: number; byStage: Record<string, number> };
  reviews: { total: number; pending: number; completed: number };
  engagements: { total: number; recent: number };
  leaves: { pending: number; approved: number };
}

export interface PeopleState {
  employees: Employee[];
  departments: Department[];
  teams: Team[];
  roles: JobRole[];
  pipelines: HiringPipeline[];
  candidates: Candidate[];
  interviews: Interview[];
  offers: Offer[];
  onboardingChecklists: OnboardingChecklist[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  leaveBalances: LeaveBalance[];
  performanceReviews: PerformanceReview[];
  goals: Goal[];
  engagementRecords: EngagementRecord[];
  employeeDocuments: EmployeeDocument[];
  assets: Asset[];
  events: PeopleEvent[];
  auditLogs: AuditLog[];
}
