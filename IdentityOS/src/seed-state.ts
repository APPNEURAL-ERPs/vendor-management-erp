import { IdentityState } from "./domain";
import { nowIso, newId, hashPassword, plusDays } from "./core/id";

export function createSeedState(tenantId: string): IdentityState {
  const now = nowIso();

  const roles = [
    {
      id: newId("role"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      key: "platform_owner",
      name: "Platform Owner",
      description: "Full platform access",
      status: "active" as const,
      permissions: ["*"],
      system: true,
      isDefault: false,
      metadata: {},
      createdBy: "system"
    },
    {
      id: newId("role"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      key: "admin",
      name: "Admin",
      description: "Administrator access",
      status: "active" as const,
      permissions: ["identity.*", "security.*", "admin.*"],
      system: true,
      isDefault: false,
      metadata: {},
      createdBy: "system"
    },
    {
      id: newId("role"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      key: "identity_admin",
      name: "Identity Admin",
      description: "Identity and access management",
      status: "active" as const,
      permissions: [
        "identity.user.read",
        "identity.user.write",
        "identity.role.read",
        "identity.role.write",
        "identity.permission.read",
        "identity.permission.write",
        "identity.session.read",
        "identity.mfa.read",
        "identity.mfa.write",
        "identity.sso.read",
        "identity.sso.write",
        "identity.audit.read"
      ],
      system: true,
      isDefault: false,
      metadata: {},
      createdBy: "system"
    },
    {
      id: newId("role"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      key: "user_manager",
      name: "User Manager",
      description: "Manage users and invitations",
      status: "active" as const,
      permissions: [
        "identity.user.read",
        "identity.user.write",
        "identity.role.read",
        "identity.invitation.read",
        "identity.invitation.write"
      ],
      system: true,
      isDefault: false,
      metadata: {},
      createdBy: "system"
    },
    {
      id: newId("role"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      key: "viewer",
      name: "Viewer",
      description: "Read-only access",
      status: "active" as const,
      permissions: [
        "identity.user.read",
        "identity.role.read",
        "identity.permission.read",
        "identity.session.read",
        "identity.mfa.read",
        "identity.audit.read"
      ],
      system: true,
      isDefault: true,
      metadata: {},
      createdBy: "system"
    }
  ];

  const permissions = [
    { id: newId("perm"), tenantId, createdAt: now, updatedAt: now, key: "identity.user.read", name: "Read Users", description: "View user information", status: "active" as const, category: "user", resource: "user", action: "read", createdBy: "system" },
    { id: newId("perm"), tenantId, createdAt: now, updatedAt: now, key: "identity.user.write", name: "Write Users", description: "Create and update users", status: "active" as const, category: "user", resource: "user", action: "write", createdBy: "system" },
    { id: newId("perm"), tenantId, createdAt: now, updatedAt: now, key: "identity.user.delete", name: "Delete Users", description: "Delete users", status: "active" as const, category: "user", resource: "user", action: "delete", createdBy: "system" },
    { id: newId("perm"), tenantId, createdAt: now, updatedAt: now, key: "identity.role.read", name: "Read Roles", description: "View roles", status: "active" as const, category: "role", resource: "role", action: "read", createdBy: "system" },
    { id: newId("perm"), tenantId, createdAt: now, updatedAt: now, key: "identity.role.write", name: "Write Roles", description: "Create and update roles", status: "active" as const, category: "role", resource: "role", action: "write", createdBy: "system" },
    { id: newId("perm"), tenantId, createdAt: now, updatedAt: now, key: "identity.permission.read", name: "Read Permissions", description: "View permissions", status: "active" as const, category: "permission", resource: "permission", action: "read", createdBy: "system" },
    { id: newId("perm"), tenantId, createdAt: now, updatedAt: now, key: "identity.permission.write", name: "Write Permissions", description: "Manage permissions", status: "active" as const, category: "permission", resource: "permission", action: "write", createdBy: "system" },
    { id: newId("perm"), tenantId, createdAt: now, updatedAt: now, key: "identity.session.read", name: "Read Sessions", description: "View sessions", status: "active" as const, category: "session", resource: "session", action: "read", createdBy: "system" },
    { id: newId("perm"), tenantId, createdAt: now, updatedAt: now, key: "identity.session.write", name: "Write Sessions", description: "Manage sessions", status: "active" as const, category: "session", resource: "session", action: "write", createdBy: "system" },
    { id: newId("perm"), tenantId, createdAt: now, updatedAt: now, key: "identity.mfa.read", name: "Read MFA", description: "View MFA factors", status: "active" as const, category: "mfa", resource: "mfa", action: "read", createdBy: "system" },
    { id: newId("perm"), tenantId, createdAt: now, updatedAt: now, key: "identity.mfa.write", name: "Write MFA", description: "Manage MFA factors", status: "active" as const, category: "mfa", resource: "mfa", action: "write", createdBy: "system" },
    { id: newId("perm"), tenantId, createdAt: now, updatedAt: now, key: "identity.sso.read", name: "Read SSO", description: "View SSO providers", status: "active" as const, category: "sso", resource: "sso", action: "read", createdBy: "system" },
    { id: newId("perm"), tenantId, createdAt: now, updatedAt: now, key: "identity.sso.write", name: "Write SSO", description: "Manage SSO providers", status: "active" as const, category: "sso", resource: "sso", action: "write", createdBy: "system" },
    { id: newId("perm"), tenantId, createdAt: now, updatedAt: now, key: "identity.audit.read", name: "Read Audit Logs", description: "View audit logs", status: "active" as const, category: "audit", resource: "audit", action: "read", createdBy: "system" },
    { id: newId("perm"), tenantId, createdAt: now, updatedAt: now, key: "identity.access.review.read", name: "Read Access Reviews", description: "View access reviews", status: "active" as const, category: "access_review", resource: "access_review", action: "read", createdBy: "system" },
    { id: newId("perm"), tenantId, createdAt: now, updatedAt: now, key: "identity.access.review.write", name: "Write Access Reviews", description: "Manage access reviews", status: "active" as const, category: "access_review", resource: "access_review", action: "write", createdBy: "system" },
    { id: newId("perm"), tenantId, createdAt: now, updatedAt: now, key: "identity.api_key.read", name: "Read API Keys", description: "View API keys", status: "active" as const, category: "api_key", resource: "api_key", action: "read", createdBy: "system" },
    { id: newId("perm"), tenantId, createdAt: now, updatedAt: now, key: "identity.api_key.write", name: "Write API Keys", description: "Manage API keys", status: "active" as const, category: "api_key", resource: "api_key", action: "write", createdBy: "system" }
  ];

  const adminRole = roles.find((r) => r.key === "admin")!;
  const viewerRole = roles.find((r) => r.key === "viewer")!;
  const identityAdminRole = roles.find((r) => r.key === "identity_admin")!;

  const users = [
    {
      id: newId("user"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      email: "admin@appneural.com",
      username: "admin",
      displayName: "Platform Admin",
      phone: "+1234567890",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
      status: "active" as const,
      primaryRoleId: adminRole.id,
      mfaEnabled: true,
      mfaVerified: true,
      passwordHash: hashPassword("admin123"),
      passwordChangedAt: now,
      passwordExpiresAt: plusDays(90),
      lastLoginAt: now,
      lastLoginIp: "192.168.1.1",
      failedLoginAttempts: 0,
      riskScore: 0,
      riskLevel: "low" as const,
      verifiedAt: now,
      metadata: {},
      createdBy: "system"
    },
    {
      id: newId("user"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      email: "rahul@abc.com",
      username: "rahul",
      displayName: "Rahul Sharma",
      phone: "+1234567891",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=rahul",
      status: "active" as const,
      primaryRoleId: identityAdminRole.id,
      mfaEnabled: true,
      mfaVerified: true,
      passwordHash: hashPassword("rahul123"),
      passwordChangedAt: now,
      lastLoginAt: now,
      failedLoginAttempts: 0,
      riskScore: 0,
      riskLevel: "low" as const,
      verifiedAt: now,
      metadata: {},
      createdBy: "system"
    },
    {
      id: newId("user"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      email: "priya@xyz.com",
      username: "priya",
      displayName: "Priya Patel",
      phone: "+1234567892",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
      status: "active" as const,
      primaryRoleId: viewerRole.id,
      mfaEnabled: false,
      mfaVerified: false,
      passwordHash: hashPassword("priya123"),
      passwordChangedAt: now,
      lastLoginAt: now,
      failedLoginAttempts: 0,
      riskScore: 10,
      riskLevel: "low" as const,
      verifiedAt: now,
      metadata: {},
      createdBy: "system"
    },
    {
      id: newId("user"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      email: "amit@company.com",
      username: "amit",
      displayName: "Amit Kumar",
      phone: "+1234567893",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=amit",
      status: "invited" as const,
      primaryRoleId: viewerRole.id,
      mfaEnabled: false,
      mfaVerified: false,
      failedLoginAttempts: 0,
      riskScore: 0,
      riskLevel: "low" as const,
      metadata: {},
      createdBy: "system"
    },
    {
      id: newId("user"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      email: "suspicious@example.com",
      username: "suspicious",
      displayName: "Suspicious User",
      status: "active" as const,
      primaryRoleId: viewerRole.id,
      mfaEnabled: false,
      mfaVerified: false,
      passwordHash: hashPassword("wrongpass"),
      lastLoginAt: now,
      lastLoginIp: "185.220.101.42",
      failedLoginAttempts: 5,
      lockedAt: now,
      riskScore: 85,
      riskLevel: "high" as const,
      metadata: {},
      createdBy: "system"
    }
  ];

  const adminUser = users[0];
  const rahulUser = users[1];

  const sessions = [
    {
      id: newId("session"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      userId: adminUser.id,
      status: "active" as const,
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      mfaVerified: true,
      expiresAt: plusDays(7),
      lastActivityAt: now
    },
    {
      id: newId("session"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      userId: rahulUser.id,
      status: "active" as const,
      ipAddress: "192.168.1.2",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      mfaVerified: true,
      expiresAt: plusDays(7),
      lastActivityAt: now
    }
  ];

  const trustedDevices = [
    {
      id: newId("device"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      userId: adminUser.id,
      deviceFingerprint: "fp_abc123",
      deviceName: "MacBook Pro",
      deviceType: "laptop",
      status: "trusted" as const,
      lastUsedAt: now,
      lastIp: "192.168.1.1",
      riskScore: 0,
      createdBy: adminUser.id
    }
  ];

  const mfaFactors = [
    {
      id: newId("mfa"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      userId: adminUser.id,
      type: "totp" as const,
      name: "Authenticator App",
      status: "active" as const,
      lastUsedAt: now,
      createdBy: adminUser.id
    },
    {
      id: newId("mfa"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      userId: rahulUser.id,
      type: "totp" as const,
      name: "Authenticator App",
      status: "active" as const,
      lastUsedAt: now,
      createdBy: rahulUser.id
    }
  ];

  const invitations = [
    {
      id: newId("inv"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      email: "newuser@example.com",
      roleId: viewerRole.id,
      status: "sent" as const,
      invitedBy: adminUser.id,
      expiresAt: plusDays(7),
      metadata: {}
    }
  ];

  const apiKeys = [
    {
      id: newId("apikey"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      ownerId: adminUser.id,
      name: "Production API Key",
      keyPrefix: "sk_prod",
      keyHash: hashPassword("sk_prod_abc123xyz789"),
      scopes: ["identity.user.read", "identity.user.write"],
      status: "active" as const,
      expiresAt: plusDays(365),
      lastUsedAt: now,
      createdBy: adminUser.id
    }
  ];

  const groups = [
    {
      id: newId("group"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      key: "all-users",
      name: "All Users",
      description: "Default group for all users",
      status: "active" as const,
      members: users.filter((u) => u.status === "active").map((u) => u.id),
      roleIds: [viewerRole.id],
      isDefault: true,
      createdBy: "system"
    },
    {
      id: newId("group"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      key: "admins",
      name: "Administrators",
      description: "System administrators",
      status: "active" as const,
      members: [adminUser.id, rahulUser.id],
      roleIds: [adminRole.id, identityAdminRole.id],
      isDefault: false,
      createdBy: "system"
    }
  ];

  const accessReviews = [
    {
      id: newId("access_review"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      name: "Q1 2025 Access Review",
      description: "Quarterly access certification",
      status: "active" as const,
      reviewerId: adminUser.id,
      dueAt: plusDays(30),
      items: [
        {
          id: newId("ari"),
          subjectId: rahulUser.id,
          subjectType: "user" as const,
          roleId: identityAdminRole.id,
          roleName: "Identity Admin",
          status: "pending" as const,
          riskLevel: "low" as const
        },
        {
          id: newId("ari"),
          subjectId: users[4].id,
          subjectType: "user" as const,
          roleId: viewerRole.id,
          roleName: "Viewer",
          status: "pending" as const,
          riskLevel: "high" as const
        }
      ],
      createdBy: adminUser.id
    }
  ];

  const riskEvents = [
    {
      id: newId("risk"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      userId: users[4].id,
      eventType: "failed_login_spike",
      severity: "high" as const,
      description: "Multiple failed login attempts",
      ipAddress: "185.220.101.42",
      userAgent: "Mozilla/5.0",
      metadata: { attemptCount: 5, timeWindow: "10 minutes" }
    }
  ];

  const policies = [
    {
      id: newId("policy"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      name: "Strong Password Policy",
      description: "Require strong passwords",
      type: "password" as const,
      rules: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: true,
        maxAge: 90
      },
      status: "active" as const,
      createdBy: "system"
    },
    {
      id: newId("policy"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      name: "Session Timeout Policy",
      description: "Sessions expire after inactivity",
      type: "session" as const,
      rules: {
        maxSessionAge: 7,
        inactivityTimeout: 30
      },
      status: "active" as const,
      createdBy: "system"
    },
    {
      id: newId("policy"),
      tenantId,
      createdAt: now,
      updatedAt: now,
      name: "MFA Enforcement Policy",
      description: "Require MFA for sensitive operations",
      type: "mfa" as const,
      rules: {
        requireForAdmins: true,
        requireForFinance: true,
        requireForProduction: true
      },
      status: "active" as const,
      createdBy: "system"
    }
  ];

  return {
    users,
    accounts: [],
    tenantIdentities: [],
    organizationIdentities: [],
    organizations: [],
    sessions,
    trustedDevices,
    mfaFactors,
    roles,
    permissions,
    roleAssignments: [],
    groups,
    invitations,
    ssoProviders: [],
    apiKeys,
    serviceAccounts: [],
    auditLogs: [],
    accessReviews,
    riskEvents,
    events: [],
    policies
  };
}
