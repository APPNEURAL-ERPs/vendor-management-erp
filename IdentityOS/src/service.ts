import {
  DataStore
} from "./core/datastore";
import {
  User,
  Role,
  Permission,
  LoginSession,
  MFAFactor,
  Invitation,
  APIKey,
  Group,
  AccessReview,
  IdentityOverview,
  RequestActor,
  Account,
  Organization,
  ServiceAccount,
  SSOProvider,
  TrustedDevice,
  IdentityRiskEvent
} from "./domain";
import {
  HttpContext,
  HttpError
} from "./core/http";
import {
  newId,
  nowIso,
  plusDays,
  plusHours,
  isExpired,
  hashPassword,
  verifyPassword,
  generateToken,
  generateApiKey,
  maskApiKey,
  generateBackupCodes,
  generateDeviceFingerprint
} from "./core/id";
import {
  clone,
  requireString,
  optionalString,
  asNumber,
  asBoolean,
  filterByQuery,
  sortBy,
  paginate,
  countBy,
  redact
} from "./core/utils";

export class IdentityService {
  constructor(private readonly store: DataStore) {}

  getOverview(tenantId: string): IdentityOverview {
    const state = this.store.getState();
    const users = state.users.filter((u) => u.tenantId === tenantId);
    const activeUsers = users.filter((u) => u.status === "active");
    const invitedUsers = users.filter((u) => u.status === "invited");
    const lockedUsers = users.filter((u) => u.status === "locked");
    const mfaEnabled = state.mfaFactors.filter((m) => m.status === "active");
    const mfaUsers = new Set(mfaEnabled.map((m) => m.userId));
    const sessions = state.sessions.filter((s) => s.tenantId === tenantId);
    const activeSessions = sessions.filter((s) => s.status === "active");
    const expiredSessions = sessions.filter((s) => s.status === "expired");
    const roles = state.roles.filter((r) => r.tenantId === tenantId);
    const invitations = state.invitations.filter((i) => i.tenantId === tenantId);
    const accessReviews = state.accessReviews.filter((a) => a.tenantId === tenantId);
    const riskEvents = state.riskEvents.filter((r) => r.tenantId === tenantId && !r.resolvedAt);
    const apiKeys = state.apiKeys.filter((k) => k.tenantId === tenantId);
    const serviceAccounts = state.serviceAccounts.filter((s) => s.tenantId === tenantId);

    return {
      users: {
        total: users.length,
        active: activeUsers.length,
        invited: invitedUsers.length,
        locked: lockedUsers.length,
        byStatus: countBy(users, "status")
      },
      sessions: {
        active: activeSessions.length,
        expired: expiredSessions.length
      },
      mfa: {
        enabled: mfaUsers.size,
        coveragePercent: activeUsers.length ? Math.round((mfaUsers.size / activeUsers.length) * 100) : 0
      },
      roles: {
        total: roles.length,
        active: roles.filter((r) => r.status === "active").length
      },
      permissions: {
        total: state.permissions.length
      },
      invitations: {
        pending: invitations.filter((i) => i.status === "sent").length,
        accepted: invitations.filter((i) => i.status === "accepted").length,
        expired: invitations.filter((i) => i.status === "expired").length
      },
      accessReviews: {
        active: accessReviews.filter((a) => a.status === "active").length,
        completed: accessReviews.filter((a) => a.status === "completed").length
      },
      riskEvents: {
        open: riskEvents.length,
        bySeverity: countBy(riskEvents, "severity")
      },
      apiKeys: {
        active: apiKeys.filter((k) => k.status === "active").length,
        expired: apiKeys.filter((k) => k.status === "expired").length
      },
      serviceAccounts: {
        active: serviceAccounts.filter((s) => s.status === "active").length
      }
    };
  }

  listUsers(ctx: HttpContext): { items: User[]; total: number; page: number; pageSize: number; totalPages: number } {
    const { actor } = ctx;
    let users = this.store.getState().users.filter((u) => u.tenantId === actor.tenantId);

    if (ctx.query.get("status")) {
      users = users.filter((u) => u.status === ctx.query.get("status"));
    }

    if (ctx.query.get("search")) {
      const search = ctx.query.get("search")!;
      users = filterByQuery(users, search, ["email", "displayName", "username"]);
    }

    users = sortBy(users, "createdAt", "desc");

    const page = asNumber(ctx.query.get("page"), 1);
    const pageSize = asNumber(ctx.query.get("pageSize"), 20);
    const result = paginate(users, page, pageSize);

    return result;
  }

  getUser(ctx: HttpContext<{ id: string }>): User {
    const { actor } = ctx;
    const user = this.store.getState().users.find((u) => u.id === ctx.params.id && u.tenantId === actor.tenantId);
    if (!user) throw new HttpError(404, "User not found");
    return user;
  }

  createUser(ctx: HttpContext<{
    email: string;
    displayName: string;
    username?: string;
    phone?: string;
    password?: string;
    roleId?: string;
    metadata?: Record<string, unknown>;
  }>): User {
    const { actor } = ctx;
    const { email, displayName, username, phone, password, roleId, metadata } = ctx.body;

    requireString(email, "email");
    requireString(displayName, "displayName");

    const existingUser = this.store.getState().users.find((u) => u.email === email.toLowerCase() && u.tenantId === actor.tenantId);
    if (existingUser) throw new HttpError(409, "User with this email already exists");

    const now = nowIso();
    const user: User = {
      id: newId("user"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      email: email.toLowerCase(),
      username: optionalString(username),
      displayName,
      phone: optionalString(phone),
      status: "invited",
      mfaEnabled: false,
      mfaVerified: false,
      passwordHash: password ? hashPassword(password) : undefined,
      passwordChangedAt: password ? now : undefined,
      passwordExpiresAt: password ? plusDays(90) : undefined,
      failedLoginAttempts: 0,
      riskScore: 0,
      riskLevel: "low",
      metadata: metadata ?? {},
      createdBy: actor.userId
    };

    this.store.getState().users.push(user);
    this.store.audit(actor, "user.create", "user", user.id, undefined, user);

    if (roleId) {
      this.assignRole(actor, user.id, roleId, "user");
    }

    return user;
  }

  updateUser(ctx: HttpContext<{
    id: string;
    displayName?: string;
    username?: string;
    phone?: string;
    status?: string;
    metadata?: Record<string, unknown>;
  }>): User {
    const { actor } = ctx;
    const user = this.getUser(ctx);

    const before = clone(user);

    if (ctx.body.displayName) user.displayName = ctx.body.displayName;
    if (ctx.body.username !== undefined) user.username = optionalString(ctx.body.username);
    if (ctx.body.phone !== undefined) user.phone = optionalString(ctx.body.phone);
    if (ctx.body.status) user.status = ctx.body.status as any;
    if (ctx.body.metadata) user.metadata = { ...user.metadata, ...ctx.body.metadata };

    user.updatedAt = nowIso();

    this.store.audit(actor, "user.update", "user", user.id, before, user);

    return user;
  }

  deleteUser(ctx: HttpContext<{ id: string }>): void {
    const { actor } = ctx;
    const user = this.getUser(ctx);

    const before = clone(user);
    user.status = "deleted";
    user.updatedAt = nowIso();

    this.store.audit(actor, "user.delete", "user", user.id, before, user);

    const sessions = this.store.getState().sessions.filter((s) => s.userId === user.id);
    sessions.forEach((s) => {
      s.status = "revoked";
      s.revokedAt = nowIso();
      s.revokedBy = actor.userId;
    });

    const mfaFactors = this.store.getState().mfaFactors.filter((m) => m.userId === user.id);
    mfaFactors.forEach((m) => {
      m.status = "inactive";
      m.updatedAt = nowIso();
    });
  }

  login(ctx: HttpContext<{
    email: string;
    password: string;
    mfaCode?: string;
  }>): { user: User; session: LoginSession; token: string } {
    const { email, password, mfaCode } = ctx.body;
    requireString(email, "email");
    requireString(password, "password");

    const user = this.store.getState().users.find((u) => u.email === email.toLowerCase());
    if (!user) throw new HttpError(401, "Invalid credentials");

    if (user.status === "locked") throw new HttpError(403, "Account is locked");
    if (user.status === "deleted") throw new HttpError(403, "Account is deleted");
    if (user.status === "invited" && !user.passwordHash) throw new HttpError(403, "Please complete registration first");

    if (!verifyPassword(password, user.passwordHash || "")) {
      user.failedLoginAttempts++;
      user.updatedAt = nowIso();

      if (user.failedLoginAttempts >= 5) {
        user.status = "locked";
        user.lockedAt = nowIso();
        this.store.audit({ ...ctx.actor, userId: "system" }, "user.locked", "user", user.id, { reason: "Too many failed login attempts" });
        throw new HttpError(403, "Account locked due to too many failed attempts");
      }

      this.store.audit(ctx.actor, "login.failed", "user", user.id, { reason: "Invalid password" });
      throw new HttpError(401, "Invalid credentials");
    }

    if (user.mfaEnabled && !mfaCode) {
      throw new HttpError(403, "MFA code required");
    }

    if (user.mfaEnabled && mfaCode) {
      const mfaFactor = this.store.getState().mfaFactors.find((m) => m.userId === user.id && m.status === "active");
      if (!mfaFactor) throw new HttpError(403, "No MFA factor configured");
    }

    user.failedLoginAttempts = 0;
    user.lastLoginAt = nowIso();
    user.lastLoginIp = ctx.req.headers["x-forwarded-for"] as string || ctx.req.socket.remoteAddress;
    user.updatedAt = nowIso();

    const deviceFingerprint = generateDeviceFingerprint(
      user.lastLoginIp,
      ctx.req.headers["user-agent"] as string
    );

    const session: LoginSession = {
      id: newId("session"),
      tenantId: user.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      userId: user.id,
      status: "active",
      ipAddress: user.lastLoginIp,
      userAgent: ctx.req.headers["user-agent"] as string,
      deviceFingerprint,
      mfaVerified: user.mfaEnabled ? true : false,
      expiresAt: plusDays(7),
      lastActivityAt: nowIso()
    };

    const token = generateToken("sess");

    this.store.getState().sessions.push(session);
    this.store.audit(ctx.actor, "login.success", "session", session.id, undefined, { userId: user.id });

    const safeUser = { ...user, passwordHash: undefined };
    return { user: safeUser as User, session, token };
  }

  logout(ctx: HttpContext<{ sessionId?: string }>): void {
    const { actor } = ctx;
    const sessionId = ctx.body.sessionId || ctx.query.get("sessionId");

    if (sessionId) {
      const session = this.store.getState().sessions.find((s) => s.id === sessionId && s.tenantId === actor.tenantId);
      if (!session) throw new HttpError(404, "Session not found");

      session.status = "revoked";
      session.revokedAt = nowIso();
      session.revokedBy = actor.userId;
      session.updatedAt = nowIso();

      this.store.audit(actor, "logout", "session", session.id);
    } else {
      const sessions = this.store.getState().sessions.filter(
        (s) => s.userId === actor.userId && s.status === "active"
      );
      sessions.forEach((s) => {
        s.status = "revoked";
        s.revokedAt = nowIso();
        s.revokedBy = actor.userId;
        s.updatedAt = nowIso();
      });

      this.store.audit(actor, "logout.all", "session", undefined, { sessionCount: sessions.length });
    }
  }

  listSessions(ctx: HttpContext): LoginSession[] {
    const { actor } = ctx;
    return this.store.getState().sessions.filter(
      (s) => s.userId === actor.userId || s.tenantId === actor.tenantId
    );
  }

  revokeSession(ctx: HttpContext<{ sessionId: string }>): void {
    const { actor } = ctx;
    const session = this.store.getState().sessions.find(
      (s) => s.id === ctx.params.sessionId && s.tenantId === actor.tenantId
    );
    if (!session) throw new HttpError(404, "Session not found");

    const before = clone(session);
    session.status = "revoked";
    session.revokedAt = nowIso();
    session.revokedBy = actor.userId;
    session.updatedAt = nowIso();

    this.store.audit(actor, "session.revoke", "session", session.id, before, session);
  }

  listRoles(ctx: HttpContext): Role[] {
    const { actor } = ctx;
    let roles = this.store.getState().roles.filter((r) => r.tenantId === actor.tenantId);

    if (ctx.query.get("status")) {
      roles = roles.filter((r) => r.status === ctx.query.get("status"));
    }

    if (ctx.query.get("system") === "true") {
      roles = roles.filter((r) => r.system);
    }

    return roles;
  }

  createRole(ctx: HttpContext<{
    key: string;
    name: string;
    description?: string;
    permissions?: string[];
    isDefault?: boolean;
  }>): Role {
    const { actor } = ctx;
    const { key, name, description, permissions, isDefault } = ctx.body;

    requireString(key, "key");
    requireString(name, "name");

    const existingRole = this.store.getState().roles.find(
      (r) => r.key === key && r.tenantId === actor.tenantId
    );
    if (existingRole) throw new HttpError(409, "Role with this key already exists");

    const now = nowIso();
    const role: Role = {
      id: newId("role"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key,
      name,
      description: optionalString(description),
      status: "active",
      permissions: permissions ?? [],
      system: false,
      isDefault: asBoolean(isDefault, false),
      metadata: {},
      createdBy: actor.userId
    };

    this.store.getState().roles.push(role);
    this.store.audit(actor, "role.create", "role", role.id, undefined, role);

    return role;
  }

  assignRole(actor: RequestActor, subjectId: string, roleId: string, subjectType: "user" | "group"): void {
    const role = this.store.getState().roles.find((r) => r.id === roleId && r.tenantId === actor.tenantId);
    if (!role) throw new HttpError(404, "Role not found");

    const existingAssignment = this.store.getState().roleAssignments.find(
      (a) => a.subjectId === subjectId && a.roleId === roleId && a.status === "active"
    );
    if (existingAssignment) throw new HttpError(409, "Role already assigned");

    const assignment = {
      id: newId("role_assignment"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      subjectType,
      subjectId,
      roleId,
      status: "active" as const,
      assignedBy: actor.userId
    };

    this.store.getState().roleAssignments.push(assignment);
    this.store.audit(actor, "role.assign", "role_assignment", assignment.id, undefined, assignment);

    if (subjectType === "user") {
      const user = this.store.getState().users.find((u) => u.id === subjectId);
      if (user) {
        user.primaryRoleId = roleId;
        user.updatedAt = nowIso();
      }
    }
  }

  revokeRoleAssignment(ctx: HttpContext<{ assignmentId: string }>): void {
    const { actor } = ctx;
    const assignment = this.store.getState().roleAssignments.find(
      (a) => a.id === ctx.params.assignmentId && a.tenantId === actor.tenantId
    );
    if (!assignment) throw new HttpError(404, "Role assignment not found");

    const before = clone(assignment);
    assignment.status = "revoked";
    assignment.revokedAt = nowIso();
    assignment.revokedBy = actor.userId;
    assignment.updatedAt = nowIso();

    this.store.audit(actor, "role.revoke", "role_assignment", assignment.id, before, assignment);
  }

  listPermissions(ctx: HttpContext): Permission[] {
    const { actor } = ctx;
    let permissions = this.store.getState().permissions.filter((p) => p.tenantId === actor.tenantId);

    if (ctx.query.get("category")) {
      permissions = permissions.filter((p) => p.category === ctx.query.get("category"));
    }

    if (ctx.query.get("status")) {
      permissions = permissions.filter((p) => p.status === ctx.query.get("status"));
    }

    return permissions;
  }

  createPermission(ctx: HttpContext<{
    key: string;
    name: string;
    description?: string;
    category?: string;
    resource?: string;
    action?: string;
  }>): Permission {
    const { actor } = ctx;
    const { key, name, description, category, resource, action } = ctx.body;

    requireString(key, "key");
    requireString(name, "name");

    const existingPermission = this.store.getState().permissions.find((p) => p.key === key);
    if (existingPermission) throw new HttpError(409, "Permission with this key already exists");

    const permission: Permission = {
      id: newId("perm"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name,
      description: optionalString(description),
      status: "active",
      category: optionalString(category),
      resource: optionalString(resource),
      action: optionalString(action),
      createdBy: actor.userId
    };

    this.store.getState().permissions.push(permission);
    this.store.audit(actor, "permission.create", "permission", permission.id, undefined, permission);

    return permission;
  }

  setupMFA(ctx: HttpContext<{
    type: "totp" | "sms" | "email";
    phone?: string;
    email?: string;
  }>): { factor: MFAFactor; secret?: string; backupCodes?: string[] } {
    const { actor } = ctx;
    const { type, phone, email } = ctx.body;

    const user = this.store.getState().users.find((u) => u.id === actor.userId);
    if (!user) throw new HttpError(404, "User not found");

    const existingFactor = this.store.getState().mfaFactors.find(
      (m) => m.userId === actor.userId && m.type === type && m.status === "active"
    );
    if (existingFactor) throw new HttpError(409, "MFA factor already exists");

    const factor: MFAFactor = {
      id: newId("mfa"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      userId: actor.userId,
      type,
      name: type.toUpperCase(),
      status: "active",
      phone: optionalString(phone),
      email: optionalString(email),
      lastUsedAt: nowIso(),
      createdBy: actor.userId
    };

    let secret: string | undefined;
    let backupCodes: string[] | undefined;

    if (type === "totp") {
      secret = require("crypto").randomBytes(20).toString("base32");
      factor.secret = hashPassword(secret);
      backupCodes = generateBackupCodes();
      factor.backupCodes = backupCodes.map((c) => hashPassword(c));
    }

    this.store.getState().mfaFactors.push(factor);

    user.mfaEnabled = true;
    user.mfaVerified = true;
    user.updatedAt = nowIso();

    this.store.audit(actor, "mfa.setup", "mfa_factor", factor.id, undefined, factor);

    return { factor, secret, backupCodes };
  }

  verifyMFA(ctx: HttpContext<{
    factorId: string;
    code: string;
  }>): void {
    const { actor } = ctx;
    const { factorId, code } = ctx.body;

    const factor = this.store.getState().mfaFactors.find(
      (m) => m.id === factorId && m.userId === actor.userId && m.status === "active"
    );
    if (!factor) throw new HttpError(404, "MFA factor not found");

    factor.lastUsedAt = nowIso();
    factor.updatedAt = nowIso();

    const user = this.store.getState().users.find((u) => u.id === actor.userId);
    if (user) {
      user.mfaVerified = true;
      user.updatedAt = nowIso();
    }

    this.store.audit(actor, "mfa.verify", "mfa_factor", factor.id);
  }

  createInvitation(ctx: HttpContext<{
    email: string;
    roleId?: string;
    expiresInDays?: number;
  }>): Invitation {
    const { actor } = ctx;
    const { email, roleId, expiresInDays } = ctx.body;

    requireString(email, "email");

    const existingUser = this.store.getState().users.find((u) => u.email === email.toLowerCase());
    if (existingUser) throw new HttpError(409, "User already exists");

    const existingInvitation = this.store.getState().invitations.find(
      (i) => i.email === email.toLowerCase() && (i.status === "sent" || i.status === "draft")
    );
    if (existingInvitation) throw new HttpError(409, "Invitation already exists");

    const invitation: Invitation = {
      id: newId("inv"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      email: email.toLowerCase(),
      roleId: optionalString(roleId),
      status: "sent",
      invitedBy: actor.userId,
      expiresAt: plusDays(expiresInDays || 7),
      metadata: {}
    };

    this.store.getState().invitations.push(invitation);
    this.store.audit(actor, "invitation.create", "invitation", invitation.id, undefined, invitation);

    return invitation;
  }

  acceptInvitation(ctx: HttpContext<{
    invitationId: string;
    displayName: string;
    password: string;
  }>): User {
    const { actor } = ctx;
    const { invitationId, displayName, password } = ctx.body;

    const invitation = this.store.getState().invitations.find(
      (i) => i.id === invitationId && i.tenantId === actor.tenantId
    );
    if (!invitation) throw new HttpError(404, "Invitation not found");
    if (invitation.status !== "sent") throw new HttpError(400, "Invitation not valid");
    if (isExpired(invitation.expiresAt)) {
      invitation.status = "expired";
      throw new HttpError(400, "Invitation expired");
    }

    const now = nowIso();
    const user: User = {
      id: newId("user"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      email: invitation.email,
      displayName,
      status: "active",
      mfaEnabled: false,
      mfaVerified: false,
      passwordHash: hashPassword(password),
      passwordChangedAt: now,
      passwordExpiresAt: plusDays(90),
      failedLoginAttempts: 0,
      riskScore: 0,
      riskLevel: "low",
      verifiedAt: now,
      metadata: {},
      createdBy: actor.userId
    };

    this.store.getState().users.push(user);

    invitation.status = "accepted";
    invitation.acceptedAt = now;
    invitation.acceptedUserId = user.id;
    invitation.updatedAt = now;

    if (invitation.roleId) {
      this.assignRole(actor, user.id, invitation.roleId, "user");
    }

    this.store.audit(actor, "invitation.accept", "invitation", invitation.id, undefined, { userId: user.id });

    return user;
  }

  createAPIKey(ctx: HttpContext<{
    name: string;
    scopes?: string[];
    expiresInDays?: number;
  }>): { apiKey: APIKey; key: string } {
    const { actor } = ctx;
    const { name, scopes, expiresInDays } = ctx.body;

    requireString(name, "name");

    const key = generateApiKey();
    const apiKey: APIKey = {
      id: newId("apikey"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ownerId: actor.userId,
      name,
      keyPrefix: key.slice(0, 8),
      keyHash: hashPassword(key),
      scopes: scopes ?? [],
      status: "active",
      expiresAt: expiresInDays ? plusDays(expiresInDays) : undefined,
      createdBy: actor.userId
    };

    this.store.getState().apiKeys.push(apiKey);
    this.store.audit(actor, "api_key.create", "api_key", apiKey.id, undefined, { ...apiKey, keyHash: undefined });

    return { apiKey, key };
  }

  revokeAPIKey(ctx: HttpContext<{ id: string }>): void {
    const { actor } = ctx;
    const apiKey = this.store.getState().apiKeys.find(
      (k) => k.id === ctx.params.id && k.tenantId === actor.tenantId
    );
    if (!apiKey) throw new HttpError(404, "API key not found");

    const before = clone(apiKey);
    apiKey.status = "revoked";
    apiKey.revokedAt = nowIso();
    apiKey.revokedBy = actor.userId;
    apiKey.updatedAt = nowIso();

    this.store.audit(actor, "api_key.revoke", "api_key", apiKey.id, before, apiKey);
  }

  listGroups(ctx: HttpContext): Group[] {
    const { actor } = ctx;
    return this.store.getState().groups.filter((g) => g.tenantId === actor.tenantId);
  }

  createGroup(ctx: HttpContext<{
    key: string;
    name: string;
    description?: string;
    members?: string[];
    roleIds?: string[];
  }>): Group {
    const { actor } = ctx;
    const { key, name, description, members, roleIds } = ctx.body;

    requireString(key, "key");
    requireString(name, "name");

    const existingGroup = this.store.getState().groups.find(
      (g) => g.key === key && g.tenantId === actor.tenantId
    );
    if (existingGroup) throw new HttpError(409, "Group with this key already exists");

    const group: Group = {
      id: newId("group"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name,
      description: optionalString(description),
      status: "active",
      members: members ?? [],
      roleIds: roleIds ?? [],
      isDefault: false,
      createdBy: actor.userId
    };

    this.store.getState().groups.push(group);
    this.store.audit(actor, "group.create", "group", group.id, undefined, group);

    return group;
  }

  addUserToGroup(ctx: HttpContext<{
    groupId: string;
    userId: string;
  }>): void {
    const { actor } = ctx;
    const { groupId, userId } = ctx.body;

    const group = this.store.getState().groups.find(
      (g) => g.id === groupId && g.tenantId === actor.tenantId
    );
    if (!group) throw new HttpError(404, "Group not found");

    if (group.members.includes(userId)) throw new HttpError(409, "User already in group");

    const before = clone(group);
    group.members.push(userId);
    group.updatedAt = nowIso();

    this.store.audit(actor, "group.member.add", "group", group.id, before, group);
  }

  removeUserFromGroup(ctx: HttpContext<{
    groupId: string;
    userId: string;
  }>): void {
    const { actor } = ctx;
    const { groupId, userId } = ctx.body;

    const group = this.store.getState().groups.find(
      (g) => g.id === groupId && g.tenantId === actor.tenantId
    );
    if (!group) throw new HttpError(404, "Group not found");

    if (!group.members.includes(userId)) throw new HttpError(404, "User not in group");

    const before = clone(group);
    group.members = group.members.filter((m) => m !== userId);
    group.updatedAt = nowIso();

    this.store.audit(actor, "group.member.remove", "group", group.id, before, group);
  }

  createAccessReview(ctx: HttpContext<{
    name: string;
    description?: string;
    reviewerId?: string;
    dueInDays?: number;
    items?: Array<{
      subjectId: string;
      subjectType: "user" | "service_account";
      roleId: string;
    }>;
  }>): AccessReview {
    const { actor } = ctx;
    const { name, description, reviewerId, dueInDays, items } = ctx.body;

    requireString(name, "name");

    const accessReview: AccessReview = {
      id: newId("access_review"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      name,
      description: optionalString(description),
      status: "active",
      reviewerId: reviewerId || actor.userId,
      dueAt: dueInDays ? plusDays(dueInDays) : undefined,
      items: (items || []).map((item) => ({
        id: newId("ari"),
        ...item,
        roleName: this.store.getState().roles.find((r) => r.id === item.roleId)?.name,
        status: "pending" as const
      })),
      createdBy: actor.userId
    };

    this.store.getState().accessReviews.push(accessReview);
    this.store.audit(actor, "access_review.create", "access_review", accessReview.id, undefined, accessReview);

    return accessReview;
  }

  decideAccessReviewItem(ctx: HttpContext<{
    reviewId: string;
    itemId: string;
    decision: "approved" | "revoked" | "needs_change";
    notes?: string;
  }>): void {
    const { actor } = ctx;
    const { reviewId, itemId, decision, notes } = ctx.body;

    const review = this.store.getState().accessReviews.find(
      (a) => a.id === reviewId && a.tenantId === actor.tenantId
    );
    if (!review) throw new HttpError(404, "Access review not found");
    if (review.status !== "active") throw new HttpError(400, "Access review not active");

    const item = review.items.find((i) => i.id === itemId);
    if (!item) throw new HttpError(404, "Access review item not found");

    const before = clone(item);
    item.status = decision;
    item.decisionBy = actor.userId;
    item.decisionAt = nowIso();
    item.notes = optionalString(notes);

    if (decision === "revoked" && item.subjectType === "user") {
      const assignments = this.store.getState().roleAssignments.filter(
        (a) => a.subjectId === item.subjectId && a.roleId === item.roleId && a.status === "active"
      );
      assignments.forEach((a) => {
        a.status = "revoked";
        a.revokedAt = nowIso();
        a.revokedBy = actor.userId;
        a.updatedAt = nowIso();
      });
    }

    review.updatedAt = nowIso();

    if (review.items.every((i) => i.status !== "pending")) {
      review.status = "completed";
      review.completedAt = nowIso();
    }

    this.store.audit(actor, "access_review.decide", "access_review", review.id, before, item);
  }

  getAuditLogs(ctx: HttpContext): { items: any[]; total: number; page: number; pageSize: number; totalPages: number } {
    const { actor } = ctx;
    let logs = this.store.getState().auditLogs.filter((l) => l.tenantId === actor.tenantId);

    if (ctx.query.get("entityType")) {
      logs = logs.filter((l) => l.entityType === ctx.query.get("entityType"));
    }

    if (ctx.query.get("action")) {
      logs = logs.filter((l) => l.action.startsWith(ctx.query.get("action")!));
    }

    if (ctx.query.get("actorId")) {
      logs = logs.filter((l) => l.actorId === ctx.query.get("actorId"));
    }

    logs = sortBy(logs, "createdAt", "desc");

    const page = asNumber(ctx.query.get("page"), 1);
    const pageSize = asNumber(ctx.query.get("pageSize"), 50);
    const result = paginate(logs, page, pageSize);

    return result;
  }

  listTrustedDevices(ctx: HttpContext): TrustedDevice[] {
    const { actor } = ctx;
    return this.store.getState().trustedDevices.filter(
      (d) => d.userId === actor.userId || d.tenantId === actor.tenantId
    );
  }

  addTrustedDevice(ctx: HttpContext<{
    deviceFingerprint: string;
    deviceName?: string;
    deviceType?: string;
  }>): TrustedDevice {
    const { actor } = ctx;
    const { deviceFingerprint, deviceName, deviceType } = ctx.body;

    requireString(deviceFingerprint, "deviceFingerprint");

    const existingDevice = this.store.getState().trustedDevices.find(
      (d) => d.deviceFingerprint === deviceFingerprint && d.userId === actor.userId
    );
    if (existingDevice) throw new HttpError(409, "Device already trusted");

    const device: TrustedDevice = {
      id: newId("device"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      userId: actor.userId,
      deviceFingerprint,
      deviceName: optionalString(deviceName),
      deviceType: optionalString(deviceType),
      status: "trusted",
      lastUsedAt: nowIso(),
      lastIp: ctx.req.headers["x-forwarded-for"] as string || ctx.req.socket.remoteAddress,
      riskScore: 0,
      createdBy: actor.userId
    };

    this.store.getState().trustedDevices.push(device);
    this.store.audit(actor, "device.trust", "trusted_device", device.id, undefined, device);

    return device;
  }

  revokeTrustedDevice(ctx: HttpContext<{ id: string }>): void {
    const { actor } = ctx;
    const device = this.store.getState().trustedDevices.find(
      (d) => d.id === ctx.params.id && d.tenantId === actor.tenantId
    );
    if (!device) throw new HttpError(404, "Trusted device not found");

    const before = clone(device);
    device.status = "revoked";
    device.updatedAt = nowIso();

    this.store.audit(actor, "device.revoke", "trusted_device", device.id, before, device);
  }

  getRiskEvents(ctx: HttpContext): IdentityRiskEvent[] {
    const { actor } = ctx;
    let events = this.store.getState().riskEvents.filter((r) => r.tenantId === actor.tenantId);

    if (ctx.query.get("userId")) {
      events = events.filter((r) => r.userId === ctx.query.get("userId"));
    }

    if (ctx.query.get("resolved") !== "true") {
      events = events.filter((r) => !r.resolvedAt);
    }

    if (ctx.query.get("severity")) {
      events = events.filter((r) => r.severity === ctx.query.get("severity"));
    }

    return sortBy(events, "createdAt", "desc");
  }

  resolveRiskEvent(ctx: HttpContext<{
    eventId: string;
    resolution?: string;
  }>): void {
    const { actor } = ctx;
    const { eventId, resolution } = ctx.body;

    const event = this.store.getState().riskEvents.find(
      (r) => r.id === eventId && r.tenantId === actor.tenantId
    );
    if (!event) throw new HttpError(404, "Risk event not found");

    const before = clone(event);
    event.resolvedAt = nowIso();
    event.resolvedBy = actor.userId;
    event.updatedAt = nowIso();
    if (resolution) {
      event.metadata = { ...event.metadata, resolution };
    }

    this.store.audit(actor, "risk.resolve", "risk_event", event.id, before, event);
  }

  changePassword(ctx: HttpContext<{
    currentPassword: string;
    newPassword: string;
  }>): void {
    const { actor } = ctx;
    const { currentPassword, newPassword } = ctx.body;

    requireString(currentPassword, "currentPassword");
    requireString(newPassword, "newPassword");

    const user = this.store.getState().users.find((u) => u.id === actor.userId);
    if (!user) throw new HttpError(404, "User not found");

    if (!verifyPassword(currentPassword, user.passwordHash || "")) {
      throw new HttpError(401, "Current password is incorrect");
    }

    const before = clone(user);
    user.passwordHash = hashPassword(newPassword);
    user.passwordChangedAt = nowIso();
    user.passwordExpiresAt = plusDays(90);
    user.updatedAt = nowIso();

    const sessions = this.store.getState().sessions.filter(
      (s) => s.userId === user.id && s.status === "active"
    );
    sessions.forEach((s) => {
      s.status = "revoked";
      s.revokedAt = nowIso();
      s.revokedBy = "system";
      s.updatedAt = nowIso();
    });

    this.store.audit(actor, "password.change", "user", user.id, before, user);
  }
}
