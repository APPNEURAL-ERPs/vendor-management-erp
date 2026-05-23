export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "moderator" | "mentor" | "volunteer" | "member" | "student" | "trainer" | "alumni" | "partner" | "guest";
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

export interface Community extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "student" | "developer" | "founder" | "career" | "brand" | "customer" | "training" | "alumni" | "partner" | "product";
  status: EntityStatus;
  category?: string;
  visibility: "public" | "private" | "restricted";
  memberCount: number;
  ownerId: UUID;
  metadata: Record<string, unknown>;
}

export interface Member extends BaseEntity {
  communityId: UUID;
  userId: UUID;
  displayName: string;
  email?: string;
  avatar?: string;
  status: "invited" | "pending" | "active" | "inactive" | "suspended" | "banned" | "alumni" | "vip";
  role: Role;
  joinedAt: ISODate;
  lastActiveAt?: ISODate;
  engagementScore: number;
  points: number;
  level: number;
  badges: UUID[];
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface CommunityRole extends BaseEntity {
  communityId: UUID;
  name: string;
  description?: string;
  permissions: string[];
  status: EntityStatus;
  createdBy: UUID;
}

export interface Group extends BaseEntity {
  communityId: UUID;
  name: string;
  description?: string;
  type: "private" | "public" | "topic" | "batch" | "project" | "interest";
  status: EntityStatus;
  memberCount: number;
  ownerId: UUID;
  metadata: Record<string, unknown>;
}

export interface GroupMember extends BaseEntity {
  groupId: UUID;
  memberId: UUID;
  role: "owner" | "admin" | "member";
  joinedAt: ISODate;
}

export interface Post extends BaseEntity {
  communityId: UUID;
  groupId?: UUID;
  authorId: UUID;
  type: "text" | "image" | "poll" | "question" | "announcement" | "resource" | "job" | "event" | "achievement" | "project";
  title?: string;
  content: string;
  status: EntityStatus;
  likes: number;
  comments: number;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface Comment extends BaseEntity {
  postId: UUID;
  authorId: UUID;
  content: string;
  parentId?: UUID;
  likes: number;
  status: EntityStatus;
  metadata: Record<string, unknown>;
}

export interface Discussion extends BaseEntity {
  communityId: UUID;
  groupId?: UUID;
  authorId: UUID;
  title: string;
  content: string;
  category: "questions" | "announcements" | "learning" | "projects" | "career" | "jobs" | "events" | "resources" | "feedback" | "support";
  status: EntityStatus;
  replies: number;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  isSolved: boolean;
  acceptedReplyId?: UUID;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface DiscussionReply extends BaseEntity {
  discussionId: UUID;
  authorId: UUID;
  content: string;
  likes: number;
  isAccepted: boolean;
  status: EntityStatus;
  metadata: Record<string, unknown>;
}

export interface Event extends BaseEntity {
  communityId: UUID;
  organizerId: UUID;
  title: string;
  description?: string;
  type: "workshop" | "webinar" | "meetup" | "bootcamp" | "ama" | "class" | "hackathon" | "career" | "launch" | "community_call";
  status: EntityStatus;
  startDate: ISODate;
  endDate?: ISODate;
  timezone?: string;
  location?: string;
  isOnline: boolean;
  maxAttendees?: number;
  registeredCount: number;
  attendedCount: number;
  registrationRequired: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface EventRegistration extends BaseEntity {
  eventId: UUID;
  memberId: UUID;
  status: "registered" | "attended" | "cancelled" | "no_show";
  registeredAt: ISODate;
  checkedInAt?: ISODate;
  feedbackSubmitted: boolean;
}

export interface Resource extends BaseEntity {
  communityId: UUID;
  uploadedBy: UUID;
  title: string;
  description?: string;
  type: "pdf" | "docx" | "ppt" | "video" | "template" | "checklist" | "code" | "project" | "link" | "guide" | "prompt";
  url?: string;
  fileSize?: number;
  downloads: number;
  status: EntityStatus;
  tags: string[];
  accessLevel: "public" | "member" | "premium";
  metadata: Record<string, unknown>;
}

export interface Badge extends BaseEntity {
  communityId: UUID;
  key: string;
  name: string;
  description?: string;
  icon?: string;
  type: "achievement" | "contribution" | "mentor" | "certificate" | "streak" | "milestone";
  points: number;
  criteria: string;
  status: EntityStatus;
  awardedCount: number;
  metadata: Record<string, unknown>;
}

export interface MemberBadge extends BaseEntity {
  badgeId: UUID;
  memberId: UUID;
  awardedAt: ISODate;
  awardedBy?: UUID;
  metadata: Record<string, unknown>;
}

export interface Challenge extends BaseEntity {
  communityId: UUID;
  title: string;
  description?: string;
  type: "daily" | "weekly" | "monthly" | "one_time";
  points: number;
  startDate: ISODate;
  endDate: ISODate;
  status: EntityStatus;
  participantCount: number;
  completions: number;
  metadata: Record<string, unknown>;
}

export interface ChallengeCompletion extends BaseEntity {
  challengeId: UUID;
  memberId: UUID;
  completedAt: ISODate;
  pointsEarned: number;
}

export interface MembershipPlan extends BaseEntity {
  communityId: UUID;
  name: string;
  description?: string;
  type: "free" | "premium" | "workshop" | "mentorship" | "student" | "founder" | "enterprise";
  price: number;
  currency?: string;
  billingPeriod?: "monthly" | "yearly" | "one_time";
  status: EntityStatus;
  features: string[];
  metadata: Record<string, unknown>;
}

export interface MemberMembership extends BaseEntity {
  memberId: UUID;
  planId: UUID;
  status: "active" | "cancelled" | "expired" | "pending";
  startDate: ISODate;
  endDate?: ISODate;
  autoRenew: boolean;
}

export interface MentorProfile extends BaseEntity {
  memberId: UUID;
  title: string;
  expertise: string[];
  availability?: string;
  status: EntityStatus;
  rating: number;
  sessionsCount: number;
  bio?: string;
  metadata: Record<string, unknown>;
}

export interface MentorshipSession extends BaseEntity {
  mentorId: UUID;
  menteeId: UUID;
  title: string;
  scheduledAt: ISODate;
  duration?: number;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  feedback?: string;
  rating?: number;
  metadata: Record<string, unknown>;
}

export interface VolunteerProfile extends BaseEntity {
  memberId: UUID;
  role: "event_helper" | "content_reviewer" | "moderator" | "technical_mentor" | "design_volunteer" | "social_media" | "workshop_assistant";
  availability?: string;
  status: EntityStatus;
  contributions: number;
  metadata: Record<string, unknown>;
}

export interface CommunityJob extends BaseEntity {
  communityId: UUID;
  postedBy: UUID;
  title: string;
  company?: string;
  location?: string;
  type: "internship" | "fresher" | "full_time" | "part_time" | "freelance" | "remote" | "volunteer" | "mentorship";
  description: string;
  requirements?: string;
  salary?: string;
  status: EntityStatus;
  applications: number;
  isFeatured: boolean;
  expiresAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface JobApplication extends BaseEntity {
  jobId: UUID;
  applicantId: UUID;
  status: "submitted" | "reviewed" | "interview" | "rejected" | "accepted";
  appliedAt: ISODate;
  resumeUrl?: string;
  coverLetter?: string;
  notes?: string;
}

export interface CommunityProject extends BaseEntity {
  communityId: UUID;
  ownerId: UUID;
  title: string;
  description?: string;
  status: EntityStatus;
  tags: string[];
  teamSize: number;
  members: UUID[];
  submissions: number;
  rating?: number;
  isFeatured: boolean;
  metadata: Record<string, unknown>;
}

export interface ProjectSubmission extends BaseEntity {
  projectId: UUID;
  submittedBy: UUID;
  title: string;
  description?: string;
  url?: string;
  status: "submitted" | "reviewed" | "accepted" | "rejected";
  submittedAt: ISODate;
  rating?: number;
  feedback?: string;
}

export interface Feedback extends BaseEntity {
  communityId: UUID;
  type: "event" | "platform" | "content" | "mentor" | "course" | "community" | "feature";
  submittedBy: UUID;
  rating?: number;
  content: string;
  status: EntityStatus;
  response?: string;
  metadata: Record<string, unknown>;
}

export interface ModerationReport extends BaseEntity {
  reportedBy: UUID;
  reportedContentType: "post" | "comment" | "discussion" | "member" | "resource";
  reportedContentId: UUID;
  reason: string;
  status: "pending" | "reviewed" | "actioned" | "dismissed";
  action?: string;
  resolvedBy?: UUID;
  resolvedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface CommunityMetric extends BaseEntity {
  communityId: UUID;
  metricType: "members" | "posts" | "comments" | "events" | "resources" | "engagement" | "retention" | "contribution";
  value: number;
  period: "daily" | "weekly" | "monthly";
  recordedAt: ISODate;
  metadata: Record<string, unknown>;
}

export interface CommunityEvent extends BaseEntity {
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

export interface CommunityOverview {
  communities: number;
  members: { total: number; active: number; newThisMonth: number };
  groups: { total: number; active: number };
  posts: { total: number; thisWeek: number };
  discussions: { total: number; open: number; solved: number };
  events: { upcoming: number; completed: number };
  resources: { total: number; downloads: number };
  badges: { total: number; awarded: number };
  engagement: { score: number; trend: "up" | "down" | "stable" };
  healthScore: number;
}

export interface CommunityState {
  communities: Community[];
  members: Member[];
  roles: CommunityRole[];
  groups: Group[];
  groupMembers: GroupMember[];
  posts: Post[];
  comments: Comment[];
  discussions: Discussion[];
  discussionReplies: DiscussionReply[];
  events: Event[];
  eventRegistrations: EventRegistration[];
  resources: Resource[];
  badges: Badge[];
  memberBadges: MemberBadge[];
  challenges: Challenge[];
  challengeCompletions: ChallengeCompletion[];
  membershipPlans: MembershipPlan[];
  memberMemberships: MemberMembership[];
  mentorProfiles: MentorProfile[];
  mentorshipSessions: MentorshipSession[];
  volunteerProfiles: VolunteerProfile[];
  jobs: CommunityJob[];
  jobApplications: JobApplication[];
  projects: CommunityProject[];
  projectSubmissions: ProjectSubmission[];
  feedback: Feedback[];
  moderationReports: ModerationReport[];
  metrics: CommunityMetric[];
  events: CommunityEvent[];
  auditLogs: AuditLog[];
}
