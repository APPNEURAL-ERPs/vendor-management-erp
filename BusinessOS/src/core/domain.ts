export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "business_admin" | "strategy_manager" | "goal_manager" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";
export type Priority = "low" | "medium" | "high" | "critical";
export type ProgressStatus = "not_started" | "in_progress" | "completed" | "blocked" | "at_risk";

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
  status: EntityStatus;
}

export interface Strategy extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  vision?: string;
  mission?: string;
  values: string[];
  strategicThemes: string[];
  timeHorizon: "short_term" | "medium_term" | "long_term";
  ownerId?: UUID;
  tags: string[];
}

export interface Goal extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  strategyId?: UUID;
  category: "revenue" | "growth" | "operations" | "customer" | "team" | "product" | "market" | "financial" | "other";
  priority: Priority;
  progress: number;
  ownerId?: UUID;
  dueDate?: ISODate;
  completedAt?: ISODate;
  tags: string[];
}

export interface KeyResult {
  id: UUID;
  name: string;
  target: number;
  current: number;
  unit: string;
  confidence: number;
  status: ProgressStatus;
}

export interface OKR {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
  key: string;
  name: string;
  description?: string;
  objective: string;
  keyResults: KeyResult[];
  goalId?: UUID;
  period: "weekly" | "monthly" | "quarterly" | "yearly";
  startDate: ISODate;
  endDate: ISODate;
  ownerId?: UUID;
  progress: number;
  status: ProgressStatus;
}

export interface Initiative {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
  key: string;
  name: string;
  description?: string;
  strategyId?: UUID;
  goalId?: UUID;
  okrId?: UUID;
  ownerId?: UUID;
  priority: Priority;
  progress: number;
  status: ProgressStatus;
  startDate?: ISODate;
  endDate?: ISODate;
  budget?: number;
  tags: string[];
}

export interface BusinessPlan extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "startup" | "growth" | "turnaround" | "expansion" | "internal";
  executiveSummary?: string;
  problem?: string;
  solution?: string;
  targetMarket?: string;
  businessModel?: string;
  revenueStreams: string[];
  competitors?: string;
  goToMarket?: string;
  operations?: string;
  team?: string;
  financialProjections?: string;
  risks?: string;
  roadmap?: string;
  ownerId?: UUID;
  approved: boolean;
}

export interface MetricDefinition {
  id: UUID;
  name: string;
  description?: string;
  target: number;
  current: number;
  unit: string;
  trend: "up" | "down" | "stable";
}

export interface Scorecard extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  perspective: "financial" | "customer" | "internal_process" | "learning_growth";
  metrics: MetricDefinition[];
  ownerId?: UUID;
  period: "weekly" | "monthly" | "quarterly" | "yearly";
}

export interface DecisionOption {
  id: UUID;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  estimatedImpact: number;
  estimatedCost?: number;
  risks: string[];
}

export interface Decision {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
  key: string;
  title: string;
  description: string;
  category: "strategic" | "operational" | "financial" | "technical" | "hr" | "marketing" | "sales" | "product" | "other";
  status: "pending" | "decided" | "implemented" | "rejected" | "deferred";
  priority: Priority;
  decisionMaker?: UUID;
  options: DecisionOption[];
  selectedOptionId?: UUID;
  rationale?: string;
  implementationDate?: ISODate;
  reviewDate?: ISODate;
  outcome?: string;
  relatedGoals: UUID[];
  relatedInitiatives: UUID[];
}

export interface SWOTItem {
  id: UUID;
  category: "strength" | "weakness" | "opportunity" | "threat";
  title: string;
  description: string;
  impact: Priority;
  mitigation?: string;
}

export interface SWOTAnalysis extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  strategyId?: UUID;
  items: SWOTItem[];
  summary?: string;
  ownerId?: UUID;
}

export interface Competitor extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  website?: string;
  marketPosition?: string;
  strengths: string[];
  weaknesses: string[];
  offerings: string[];
  pricing: string;
  marketShare?: number;
  threatLevel: Priority;
  opportunities: string[];
  threats: string[];
}

export interface MarketResearch extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  marketSize?: number;
  marketSizeUnit?: string;
  targetSegments: string[];
  trends: string[];
  customerNeeds: string[];
  marketGaps: string[];
  entryBarriers: string[];
  regulations?: string[];
  competitors: string[];
  opportunities: string[];
  risks: string[];
}

export interface RevenueModel extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "subscription" | "one_time" | "freemium" | "marketplace" | "service" | "usage_based" | "hybrid";
  streams: Array<{
    id: UUID;
    name: string;
    type: string;
    amount: number;
    frequency: "monthly" | "quarterly" | "yearly" | "one_time";
    percentage: number;
  }>;
  pricing: string;
  projections?: string;
}

export interface PricingTier {
  id: UUID;
  name: string;
  price: number;
  billingCycle: "monthly" | "yearly";
  features: string[];
  limitations: string[];
  popular: boolean;
}

export interface PricingPlan extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  tiers: PricingTier[];
  currency: string;
  effectiveDate: ISODate;
  competitors?: string[];
}

export interface OfferComponent {
  id: UUID;
  name: string;
  description: string;
  included: boolean;
  value: number;
}

export interface Offer extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "product" | "service" | "productized_service" | "bundle" | "package";
  components: OfferComponent[];
  price: number;
  currency: string;
  targetSegment?: string;
  painPoints: string[];
  benefits: string[];
  guarantee?: string;
}

export interface BusinessProcess extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "lead_to_client" | "onboarding" | "delivery" | "support" | "billing" | "hiring" | "other";
  ownerId?: UUID;
  steps: Array<{
    id: UUID;
    order: number;
    name: string;
    description: string;
    ownerId?: UUID;
    duration?: number;
    dependencies: UUID[];
  }>;
  kpis: string[];
  automation: string[];
}

export interface SOPStep {
  id: UUID;
  order: number;
  title: string;
  description: string;
  checklist: string[];
  ownerRole?: string;
  expectedDuration?: string;
}

export interface SOP extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  processId?: UUID;
  ownerId?: UUID;
  version: number;
  steps: SOPStep[];
  approvalRequired: boolean;
  approvedBy?: UUID;
  effectiveDate: ISODate;
  reviewCycle?: string;
}

export interface RoadmapPhase {
  id: UUID;
  name: string;
  description?: string;
  startDate: ISODate;
  endDate: ISODate;
  objectives: string[];
  deliverables: string[];
  milestones: Array<{
    id: UUID;
    name: string;
    date: ISODate;
    completed: boolean;
  }>;
}

export interface Roadmap extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  strategyId?: UUID;
  phases: RoadmapPhase[];
  ownerId?: UUID;
}

export interface Risk {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
  key: string;
  name: string;
  description?: string;
  category: "financial" | "market" | "operational" | "legal" | "technology" | "security" | "team" | "delivery" | "reputation" | "customer";
  severity: Priority;
  likelihood: Priority;
  impact: Priority;
  status: "identified" | "mitigated" | "accepted" | "transferred" | "avoided";
  mitigation?: string;
  contingency?: string;
  ownerId?: UUID;
  identifiedDate?: ISODate;
  reviewDate?: ISODate;
  relatedGoals: UUID[];
}

export interface CustomerPersona extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "buyer" | "influencer" | "decision_maker" | "end_user";
  demographics?: string;
  goals: string[];
  painPoints: string[];
  motivations: string[];
  objections: string[];
  preferredChannels: string[];
  buyingBehavior?: string;
}

export interface JourneyStage {
  id: UUID;
  name: string;
  order: number;
  touchpoints: string[];
  painPoints: string[];
  opportunities: string[];
  emotions: string[];
  duration?: string;
}

export interface CustomerJourney extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  personaId?: UUID;
  stages: JourneyStage[];
  totalDuration?: string;
  ownerId?: UUID;
}

export interface BusinessModelCanvas {
  key: string;
  name: string;
  description?: string;
  customerSegments: string[];
  valuePropositions: string[];
  channels: string[];
  customerRelationships: string[];
  revenueStreams: string[];
  keyResources: string[];
  keyActivities: string[];
  keyPartners: string[];
  costStructure: string[];
}

export interface BusinessModel extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "canvas" | "lean" | "traditional";
  canvas: BusinessModelCanvas;
  validationStatus: "validated" | "unvalidated" | "challenged";
  marketResearch?: string;
  competitors?: string[];
}

export interface BusinessEvent extends BaseEntity {
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

export interface BusinessOverview {
  strategies: { total: number; active: number };
  goals: { total: number; byCategory: Record<string, number>; byStatus: Record<string, number> };
  okrs: { total: number; active: number; averageProgress: number };
  initiatives: { total: number; active: number };
  businessPlans: { total: number; approved: number };
  scorecards: { total: number; active: number };
  decisions: { total: number; pending: number; decided: number };
  swotAnalyses: number;
  competitors: number;
  risks: { total: number; bySeverity: Record<string, number> };
  offers: { total: number; active: number };
  roadmaps: number;
}

export interface BusinessState {
  strategies: Strategy[];
  goals: Goal[];
  okrs: OKR[];
  initiatives: Initiative[];
  businessPlans: BusinessPlan[];
  scorecards: Scorecard[];
  decisions: Decision[];
  swotAnalyses: SWOTAnalysis[];
  competitors: Competitor[];
  marketResearch: MarketResearch[];
  revenueModels: RevenueModel[];
  pricingPlans: PricingPlan[];
  offers: Offer[];
  processes: BusinessProcess[];
  sops: SOP[];
  roadmaps: Roadmap[];
  risks: Risk[];
  personas: CustomerPersona[];
  customerJourneys: CustomerJourney[];
  businessModels: BusinessModel[];
  events: BusinessEvent[];
  auditLogs: AuditLog[];
  organizations: Organization[];
  branches: Branch[];
  departments: Department[];
  teams: Team[];
  settings: BusinessSetting[];
}

export interface Organization extends BaseEntity {
  name: string;
  description?: string;
  website?: string;
  logo?: string;
  timezone?: string;
  currency?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  fiscalYearStart?: number;
  industry?: string;
  size?: string;
  foundedYear?: number;
}

export interface Branch extends BaseEntity {
  name: string;
  description?: string;
  organizationId: UUID;
  timezone?: string;
  address?: string;
  isHeadquarters: boolean;
  contactEmail?: string;
  contactPhone?: string;
}

export interface Department extends BaseEntity {
  name: string;
  description?: string;
  organizationId?: UUID;
  branchIds: UUID[];
  parentDepartmentId?: UUID;
  managerId?: UUID;
  headCount?: number;
}

export interface Team extends BaseEntity {
  name: string;
  description?: string;
  departmentId?: UUID;
  managerId?: UUID;
  memberIds: UUID[];
  branchId?: UUID;
  teamType?: string;
}

export type SettingDataType = "string" | "number" | "boolean" | "array" | "json";
export type SettingValue = string | number | boolean | unknown[] | Record<string, unknown>;

export interface SettingValidation {
  required: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  allowedValues?: string[];
}

export interface BusinessSetting extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  value: SettingValue;
  dataType: SettingDataType;
  isSecret: boolean;
  category: string;
  validation: SettingValidation;
  defaultValue?: SettingValue;
}

export interface ConfigValidationIssue {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  entityType?: string;
  entityId?: string;
}

export interface BusinessHierarchy {
  organization?: Organization;
  branches: HierarchyBranch[];
  departments: Department[];
  teams: Team[];
  unassignedDepartments: HierarchyDepartment[];
  unassignedTeams: Team[];
  employeeCount: number;
  departmentCount: number;
}

export interface HierarchyBranch {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
  status: EntityStatus;
  name: string;
  description?: string;
  organizationId: UUID;
  timezone?: string;
  address?: string;
  isHeadquarters: boolean;
  contactEmail?: string;
  contactPhone?: string;
  departments: HierarchyDepartment[];
  teams: Team[];
}

export interface HierarchyDepartment extends Department {
  teams: Team[];
  childDepartments: HierarchyDepartment[];
}
