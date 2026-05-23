export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role =
  | "owner"
  | "admin"
  | "career_admin"
  | "recruiter"
  | "hiring_manager"
  | "interviewer"
  | "hr_manager"
  | "offer_manager"
  | "auditor"
  | "viewer";

export type CareerRole = "viewer" | "recruiter" | "hiring_manager" | "hr_admin" | "admin";

export type EntityStatus = "active" | "inactive" | "archived" | "draft";
export type ApplicationStatus = "submitted" | "applied" | "screening" | "assessment" | "interview" | "interviewing" | "offer" | "offer_extended" | "accepted" | "rejected" | "withdrawn" | "hired" | "archived";
export type InterviewStatus = "scheduled" | "completed" | "cancelled" | "no_show" | "rescheduled";
export type InterviewType = "phone_screen" | "phone" | "technical" | "behavioral" | "system_design" | "coding" | "final" | "panel" | "video" | "onsite" | "hr";
export type OfferStatus = "draft" | "extended" | "accepted" | "declined" | "expired" | "withdrawn" | "pending_approval" | "approved" | "sent" | "revoked";
export type JobStatus = "draft" | "open" | "on_hold" | "closed" | "filled" | "paused" | "archived";
export type EmploymentType = "full_time" | "part_time" | "contract" | "internship" | "remote" | "temporary";
export type WorkplaceType = "onsite" | "remote" | "hybrid";
export type CandidateStatus = "active" | "do_not_contact" | "blacklisted" | "archived";
export type CandidateSource = "career_site" | "referral" | "linkedin" | "agency" | "job_board" | "manual" | "import" | "direct" | "indeed" | "other";
export type ConsentStatus = "unknown" | "granted" | "revoked";
export type PipelineStageType = "applied" | "screening" | "assessment" | "interview" | "offer" | "hired" | "rejected";
export type ScoreRecommendation = "strong_yes" | "yes" | "maybe" | "no" | "strong_no";

export interface BaseEntity {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface RequestActor {
  tenantId: TenantId;
  userId: UUID;
  role: CareerRole;
}

export interface SalaryRange {
  currency: string;
  min?: number;
  max?: number;
  period?: "hour" | "month" | "year";
  public?: boolean;
}

export interface ScreeningQuestion {
  id: UUID;
  question: string;
  required: boolean;
  type: "text" | "number" | "boolean" | "select";
  options: string[];
}

export interface JobRequisition extends BaseEntity {
  code: string;
  title: string;
  department: string;
  location: string;
  employmentType: EmploymentType;
  workplaceType: WorkplaceType;
  openings: number;
  status: JobStatus;
  priority: "low" | "medium" | "high" | "critical";
  description: string;
  responsibilities: string[];
  requirements: string[];
  requiredSkills: string[];
  niceToHaveSkills: string[];
  experienceMinYears: number;
  experienceMaxYears?: number;
  salaryRange?: SalaryRange;
  recruiterId?: UUID;
  hiringManagerId?: UUID;
  pipelineTemplateId?: UUID;
  screeningQuestions: ScreeningQuestion[];
  tags: string[];
  metadata: Record<string, unknown>;
  createdBy: UUID;
  publishedAt?: ISODate;
  closedAt?: ISODate;
}

export interface Candidate extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  currentCompany?: string;
  currentTitle?: string;
  source: CandidateSource;
  status: CandidateStatus;
  consentStatus: ConsentStatus;
  tags: string[];
  skills: string[];
  experienceYears: number;
  linkedInUrl?: string;
  portfolioUrl?: string;
  notes?: string;
  metadata: Record<string, unknown>;
  createdBy: UUID;
}

export interface CandidateResume extends BaseEntity {
  candidateId: UUID;
  fileName: string;
  mimeType: string;
  text: string;
  parsedSkills: string[];
  experienceYears?: number;
  education: string[];
  certifications: string[];
  uploadedBy: UUID;
}

export interface PipelineStage extends BaseEntity {
  jobId?: UUID;
  templateId?: UUID;
  name: string;
  type: PipelineStageType;
  order: number;
  required: boolean;
  slaDays?: number;
  interviewRequired: boolean;
  scorecardTemplate?: string;
  metadata: Record<string, unknown>;
}

export interface ScreeningAnswer {
  questionId: UUID;
  answer: string | number | boolean;
}

export interface Application extends BaseEntity {
  jobId: UUID;
  candidateId?: UUID;
  candidateName?: string;
  candidateEmail?: string;
  source: CandidateSource;
  status: ApplicationStatus;
  currentStageId?: UUID;
  stageEnteredAt: ISODate;
  matchScore?: number;
  screeningAnswers: ScreeningAnswer[];
  rating?: number;
  rejectionReason?: string;
  hiredAt?: ISODate;
  withdrawnAt?: ISODate;
  tags: string[];
  metadata: Record<string, unknown>;
  createdBy: UUID;
  resumeUrl?: string;
  coverLetter?: string;
  screeningScore?: number;
}

export interface Interview extends BaseEntity {
  applicationId: UUID;
  jobId: UUID;
  candidateId?: UUID;
  stageId?: UUID;
  interviewerId?: UUID;
  interviewerName?: string;
  title?: string;
  interviewType: InterviewType;
  scheduledAt: ISODate;
  durationMinutes?: number;
  duration?: number;
  timezone?: string;
  interviewerUserIds?: UUID[];
  status: InterviewStatus;
  meetingLink?: string;
  location?: string;
  notes?: string;
  createdBy?: UUID;
  completedAt?: ISODate;
  feedback?: string;
  rating?: number;
  strengths?: string[];
  concerns?: string[];
  decision?: "proceed" | "reject" | "hold";
}

export interface Scorecard extends BaseEntity {
  interviewId: UUID;
  applicationId: UUID;
  interviewerUserId: UUID;
  criteriaScores: Record<string, number>;
  overallRating: number;
  recommendation: ScoreRecommendation;
  strengths: string[];
  concerns: string[];
  notes?: string;
  submittedAt: ISODate;
}

export interface OfferApproval {
  approverUserId: UUID;
  status: "pending" | "approved" | "rejected";
  decidedAt?: ISODate;
  comment?: string;
}

export interface CompensationPackage {
  currency: string;
  baseSalary: number;
  bonus?: number;
  equity?: string;
  benefits: string[];
}

export interface Offer extends BaseEntity {
  applicationId: UUID;
  jobId: UUID;
  candidateId?: UUID;
  candidateName?: string;
  candidateEmail?: string;
  status: OfferStatus;
  title?: string;
  compensation?: CompensationPackage;
  salary?: number;
  currency?: string;
  startDate?: ISODate;
  expiresAt?: ISODate;
  approvals: OfferApproval[];
  terms: string[];
  sentAt?: ISODate;
  acceptedAt?: ISODate;
  declinedAt?: ISODate;
  createdBy?: UUID;
  metadata: Record<string, unknown>;
  benefits?: string[];
  extendedAt?: ISODate;
  respondedAt?: ISODate;
  notes?: string;
}

export interface TalentPool extends BaseEntity {
  name: string;
  description?: string;
  ownerUserId?: UUID;
  tags: string[];
  candidateIds: UUID[];
  status: EntityStatus;
  metadata: Record<string, unknown>;
}

export interface CareerPath extends BaseEntity {
  title: string;
  description: string;
  currentLevel: string;
  targetLevel: string;
  requiredSkills: string[];
  currentSkills: string[];
  skillGaps: SkillGap[];
  milestones: CareerMilestone[];
  estimatedDuration?: string;
  status: EntityStatus;
}

export interface SkillGap {
  skill: string;
  importance: "required" | "preferred" | "nice_to_have";
  currentLevel: number;
  targetLevel: number;
  resources?: string[];
}

export interface CareerMilestone {
  id: UUID;
  title: string;
  description: string;
  order: number;
  completedAt?: ISODate;
  targetDate?: ISODate;
}

export interface SkillProfile extends BaseEntity {
  candidateId: UUID;
  candidateName: string;
  skills: Skill[];
  certifications: Certification[];
  experience: WorkExperience[];
  education: Education[];
  projects: Project[];
  overallScore?: number;
}

export interface Skill {
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  yearsOfExperience: number;
  endorsements?: number;
}

export interface Certification {
  name: string;
  issuer: string;
  issuedAt: ISODate;
  expiresAt?: ISODate;
  credentialUrl?: string;
}

export interface WorkExperience {
  company: string;
  title: string;
  startDate: ISODate;
  endDate?: ISODate;
  current: boolean;
  description: string;
  achievements?: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  graduationDate?: ISODate;
  gpa?: number;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  startDate?: ISODate;
  endDate?: ISODate;
}

export interface CareerEvent extends BaseEntity {
  type: string;
  entityType?: string;
  entityId?: UUID;
  source?: string;
  actorId?: UUID;
  role?: string;
  correlationId?: string;
  data: Record<string, unknown>;
}

export interface AuditLog extends BaseEntity {
  actorId: UUID;
  actorName?: string;
  role: CareerRole;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
}

export interface CareerOverview {
  jobs: { total: number; open: number; closed: number };
  applications: { total: number; byStatus: Record<string, number> };
  interviews: { total: number; upcoming: number; completed: number };
  offers: { total: number; extended: number; accepted: number };
  careerPaths: { total: number; active: number };
  skillProfiles: { total: number };
  counts?: {
    jobs: number;
    openJobs: number;
    candidates: number;
    applications: number;
    activeApplications: number;
    interviewsScheduled: number;
    offersOpen: number;
    hired: number;
    talentPools: number;
  };
  pipelineSummary?: Array<{ stage: string; status: ApplicationStatus; count: number }>;
  recentJobs: JobRequisition[];
  recentCandidates: Candidate[];
  recentEvents: CareerEvent[];
}

export interface CareerAnalytics {
  totals?: {
    jobs: number;
    openJobs: number;
    candidates: number;
    applications: number;
    activeApplications: number;
    interviewsScheduled: number;
    offersOpen: number;
    hired: number;
    talentPools: number;
  };
  applicationsByStatus: Record<ApplicationStatus, number>;
  applicationsBySource: Record<CandidateSource, number>;
  jobsByStatus: Record<JobStatus, number>;
  averageMatchScore: number;
  offerAcceptanceRate: number;
  interviewCompletionRate: number;
  recentHires: Application[];
}

export interface CandidateMatch {
  candidate: Candidate;
  resume?: CandidateResume;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];
}

export interface CareerState {
  jobs: JobRequisition[];
  candidates: Candidate[];
  resumes: CandidateResume[];
  pipelineStages: PipelineStage[];
  applications: Application[];
  interviews: Interview[];
  scorecards: Scorecard[];
  offers: Offer[];
  talentPools: TalentPool[];
  careerPaths: CareerPath[];
  skillProfiles: SkillProfile[];
  events: CareerEvent[];
  auditLogs: AuditLog[];
}
