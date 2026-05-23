export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "governance_admin" | "board_secretary" | "director" | "compliance_officer" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";

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

export interface Director extends BaseEntity {
  key: string;
  name: string;
  email: string;
  title: string;
  directorType: "executive" | "non_executive" | "independent";
  status: "active" | "resigned" | "suspended";
  committeeIds: UUID[];
  metadata: Record<string, unknown>;
}

export interface Committee extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  committeeType: "audit" | "compensation" | "nomination" | "risk" | "executive" | "other";
  chairId?: UUID;
  memberIds: UUID[];
  status: "active" | "inactive" | "dissolved";
  meetingFrequency?: string;
  metadata: Record<string, unknown>;
}

export interface BoardMeeting extends BaseEntity {
  meetingNumber: string;
  title: string;
  meetingType: "annual" | "quarterly" | "special" | "committee";
  scheduledAt: ISODate;
  endedAt?: ISODate;
  location?: string;
  virtualLink?: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "postponed";
  attendeeIds: UUID[];
  absentAttendeeIds: UUID[];
  agendaItems: AgendaItem[];
  resolutions: UUID[];
  minutes?: string;
  approvedAt?: ISODate;
  approvedBy?: UUID;
  createdBy: UUID;
}

export interface AgendaItem {
  id: UUID;
  itemNumber: string;
  title: string;
  description?: string;
  presenterId?: UUID;
  discussion?: string;
  decision?: string;
  order: number;
  duration?: number;
  attachments: string[];
}

export interface Resolution extends BaseEntity {
  resolutionNumber: string;
  title: string;
  description?: string;
  resolutionType: "ordinary" | "special" | "extraordinary" | "unanimous";
  meetingId?: UUID;
  proposedBy?: UUID;
  status: "proposed" | "approved" | "rejected" | "withdrawn" | "expired";
  votingResults?: VotingResult;
  rationale?: string;
  effectiveDate?: ISODate;
  expiryDate?: ISODate;
  approvedAt?: ISODate;
  approvedBy?: UUID;
  createdBy: UUID;
  metadata: Record<string, unknown>;
}

export interface VotingResult {
  totalVotes: number;
  votesFor: number;
  votesAgainst: number;
  abstentions: number;
  voters: VoteRecord[];
}

export interface VoteRecord {
  voterId: UUID;
  voterName: string;
  vote: "for" | "against" | "abstain";
  timestamp: ISODate;
}

export interface GovernancePolicy extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  category: "code_of_conduct" | "compliance" | "security" | "finance" | "hr" | "operations" | "ethics" | "other";
  policyType: "internal" | "regulatory" | "industry";
  ownerId?: UUID;
  status: "draft" | "under_review" | "active" | "under_revision" | "retired";
  version: number;
  effectiveDate?: ISODate;
  reviewDate?: ISODate;
  content: string;
  attachments: string[];
  acknowledgments: PolicyAcknowledgment[];
  exceptions: PolicyException[];
  metadata: Record<string, unknown>;
}

export interface PolicyAcknowledgment {
  userId: UUID;
  userName: string;
  acknowledgedAt: ISODate;
}

export interface PolicyException {
  id: UUID;
  requestedBy: UUID;
  requestedByName: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "expired";
  approvedBy?: UUID;
  approvedAt?: ISODate;
  expiryDate?: ISODate;
  notes?: string;
}

export interface RACIMatrix extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  processName: string;
  items: RACIItem[];
  status: "active" | "archived";
  createdBy: UUID;
}

export interface RACIItem {
  id: UUID;
  taskName: string;
  responsible: UUID[];
  accountable: UUID[];
  consulted: UUID[];
  informed: UUID[];
}

export interface ApprovalMatrix extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  category: "expense" | "contract" | "hiring" | "vendor" | "policy" | "other";
  rules: ApprovalRule[];
  status: "active" | "archived";
  createdBy: UUID;
}

export interface ApprovalRule {
  id: UUID;
  condition: string;
  minAmount?: number;
  maxAmount?: number;
  riskLevel?: "low" | "medium" | "high" | "critical";
  approverIds: UUID[];
  escalationTimeout?: number;
  requiresMultiple: boolean;
}

export interface Decision extends BaseEntity {
  decisionNumber: string;
  title: string;
  description: string;
  category: "business" | "product" | "architecture" | "finance" | "hiring" | "vendor" | "security" | "legal" | "operational";
  status: "pending" | "decided" | "superseded" | "reversed";
  ownerId?: UUID;
  priority: "low" | "medium" | "high" | "critical";
  deadline?: ISODate;
  options: DecisionOption[];
  selectedOptionId?: UUID;
  rationale?: string;
  approvedBy?: UUID;
  decidedAt?: ISODate;
  impact?: string;
  risks?: string;
  createdBy: UUID;
}

export interface DecisionOption {
  id: UUID;
  title: string;
  description: string;
  pros?: string;
  cons?: string;
  estimatedCost?: number;
  timeline?: string;
}

export interface EscalationRule extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  triggerCondition: string;
  priority: "low" | "medium" | "high" | "critical";
  escalateToIds: UUID[];
  escalationTimeout: number;
  status: "active" | "inactive";
}

export interface GovernanceException extends BaseEntity {
  exceptionNumber: string;
  title: string;
  description: string;
  exceptionType: "policy" | "approval" | "security" | "compliance" | "other";
  relatedPolicyId?: UUID;
  relatedResolutionId?: UUID;
  requestedBy: UUID;
  requestedByName: string;
  status: "pending" | "approved" | "rejected" | "expired";
  riskAssessment?: string;
  approvedBy?: UUID;
  approvedAt?: ISODate;
  expiryDate?: ISODate;
  conditions?: string;
  metadata: Record<string, unknown>;
}

export interface RiskOwnership extends BaseEntity {
  riskId: string;
  title: string;
  description?: string;
  category: "operational" | "financial" | "compliance" | "strategic" | "reputational" | "technical";
  severity: "low" | "medium" | "high" | "critical";
  likelihood: "rare" | "unlikely" | "possible" | "likely" | "almost_certain";
  status: "identified" | "mitigated" | "accepted" | "transferred" | "escalated";
  ownerId?: UUID;
  mitigationPlan?: string;
  reviewDate?: ISODate;
  acceptanceDate?: ISODate;
  acceptedBy?: UUID;
}

export interface GovernanceReview extends BaseEntity {
  reviewType: "monthly" | "quarterly" | "annual" | "ad_hoc";
  title: string;
  description?: string;
  status: "planned" | "in_progress" | "completed" | "cancelled";
  scheduledAt: ISODate;
  completedAt?: ISODate;
  reviewerIds: UUID[];
  areas: string[];
  findings: ReviewFinding[];
  actionItems: ReviewActionItem[];
  approvedBy?: UUID;
  approvedAt?: ISODate;
}

export interface ReviewFinding {
  id: UUID;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  recommendation?: string;
  status: "open" | "in_progress" | "resolved" | "accepted_risk";
  resolvedAt?: ISODate;
  resolvedBy?: UUID;
}

export interface ReviewActionItem {
  id: UUID;
  title: string;
  description?: string;
  assigneeId?: UUID;
  assigneeName?: string;
  dueDate?: ISODate;
  status: "pending" | "in_progress" | "completed" | "overdue";
  completedAt?: ISODate;
}

export interface GovernanceEvent extends BaseEntity {
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

export interface GovernanceOverview {
  directors: { total: number; active: number; byType: Record<string, number> };
  committees: { total: number; active: number };
  meetings: { scheduled: number; completed: number; thisMonth: number };
  resolutions: { proposed: number; approved: number; pending: number };
  policies: { active: number; dueForReview: number; draft: number };
  exceptions: { pending: number; approved: number };
  risks: { open: number; bySeverity: Record<string, number> };
}

export interface GovernanceState {
  directors: Director[];
  committees: Committee[];
  meetings: BoardMeeting[];
  resolutions: Resolution[];
  policies: GovernancePolicy[];
  raciMatrices: RACIMatrix[];
  approvalMatrices: ApprovalMatrix[];
  decisions: Decision[];
  escalationRules: EscalationRule[];
  exceptions: GovernanceException[];
  riskOwnerships: RiskOwnership[];
  reviews: GovernanceReview[];
  events: GovernanceEvent[];
  auditLogs: AuditLog[];
}
