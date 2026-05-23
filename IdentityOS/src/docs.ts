export function getDocs() {
  return {
    name: "IdentityOS API Documentation",
    version: "1.0.0",
    description: "Identity, authentication, authorization, user profile, account, role, permission, session, SSO, MFA, tenant identity, and identity governance",
    basePath: "/v1/identity",
    authentication: {
      description: "Most endpoints require authentication via headers",
      headers: {
        "x-tenant-id": "Tenant identifier (default: demo-tenant)",
        "x-user-id": "User identifier",
        "x-role": "User role (owner, admin, identity_admin, user_manager, security_admin, viewer, auditor)"
      }
    },
    endpoints: {
      overview: {
        method: "GET",
        path: "/v1/identity/overview",
        description: "Get identity system overview and statistics",
        permission: "identity.user.read",
        response: {
          users: {
            total: "Total number of users",
            active: "Number of active users",
            invited: "Number of invited users",
            locked: "Number of locked users",
            byStatus: "User count by status"
          },
          sessions: {
            active: "Number of active sessions",
            expired: "Number of expired sessions"
          },
          mfa: {
            enabled: "Number of users with MFA enabled",
            coveragePercent: "Percentage of active users with MFA"
          },
          roles: {
            total: "Total number of roles",
            active: "Number of active roles"
          },
          permissions: {
            total: "Total number of permissions"
          },
          invitations: {
            pending: "Number of pending invitations",
            accepted: "Number of accepted invitations",
            expired: "Number of expired invitations"
          },
          accessReviews: {
            active: "Number of active access reviews",
            completed: "Number of completed access reviews"
          },
          riskEvents: {
            open: "Number of open risk events",
            bySeverity: "Risk events by severity"
          },
          apiKeys: {
            active: "Number of active API keys",
            expired: "Number of expired API keys"
          },
          serviceAccounts: {
            active: "Number of active service accounts"
          }
        }
      },
      users: {
        list: {
          method: "GET",
          path: "/v1/identity/users",
          description: "List all users",
          permission: "identity.user.read",
          query: {
            page: "Page number (default: 1)",
            pageSize: "Page size (default: 20)",
            status: "Filter by status (invited, active, inactive, suspended, locked, deleted)",
            search: "Search by email, displayName, or username"
          },
          response: {
            items: "Array of user objects",
            total: "Total number of users",
            page: "Current page",
            pageSize: "Page size",
            totalPages: "Total number of pages"
          }
        },
        create: {
          method: "POST",
          path: "/v1/identity/users",
          description: "Create a new user",
          permission: "identity.user.write",
          body: {
            email: "User email (required)",
            displayName: "Display name (required)",
            username: "Username (optional)",
            phone: "Phone number (optional)",
            password: "Initial password (optional)",
            roleId: "Primary role ID (optional)",
            metadata: "Additional metadata (optional)"
          },
          response: "Created user object"
        },
        get: {
          method: "GET",
          path: "/v1/identity/users/:id",
          description: "Get user by ID",
          permission: "identity.user.read",
          params: {
            id: "User ID"
          },
          response: "User object"
        },
        update: {
          method: "PATCH",
          path: "/v1/identity/users/:id",
          description: "Update user",
          permission: "identity.user.write",
          params: {
            id: "User ID"
          },
          body: {
            displayName: "New display name (optional)",
            username: "New username (optional)",
            phone: "New phone number (optional)",
            status: "New status (optional)",
            metadata: "Additional metadata (optional)"
          },
          response: "Updated user object"
        },
        delete: {
          method: "DELETE",
          path: "/v1/identity/users/:id",
          description: "Delete user (soft delete)",
          permission: "identity.user.delete",
          params: {
            id: "User ID"
          },
          response: "Success message"
        }
      },
      auth: {
        login: {
          method: "POST",
          path: "/v1/identity/auth/login",
          description: "Authenticate user and create session",
          permission: "none",
          body: {
            email: "User email (required)",
            password: "Password (required)",
            mfaCode: "MFA code (required if MFA enabled)"
          },
          response: {
            user: "User object (password hash removed)",
            session: "Session object",
            token: "Session token"
          }
        },
        logout: {
          method: "POST",
          path: "/v1/identity/auth/logout",
          description: "Logout and revoke session",
          permission: "none",
          body: {
            sessionId: "Session ID to revoke (optional, revokes all if not provided)"
          },
          response: "Success message"
        }
      },
      sessions: {
        list: {
          method: "GET",
          path: "/v1/identity/sessions",
          description: "List user sessions",
          permission: "identity.session.read",
          response: "Array of session objects"
        },
        revoke: {
          method: "POST",
          path: "/v1/identity/sessions/:sessionId/revoke",
          description: "Revoke a session",
          permission: "identity.session.write",
          params: {
            sessionId: "Session ID"
          },
          response: "Success message"
        }
      },
      password: {
        change: {
          method: "POST",
          path: "/v1/identity/password/change",
          description: "Change user password",
          permission: "none",
          body: {
            currentPassword: "Current password (required)",
            newPassword: "New password (required)"
          },
          response: "Success message",
          notes: "Revokes all existing sessions after successful password change"
        }
      },
      roles: {
        list: {
          method: "GET",
          path: "/v1/identity/roles",
          description: "List all roles",
          permission: "identity.role.read",
          query: {
            status: "Filter by status (active, inactive, archived)",
            system: "Show only system roles (true/false)"
          },
          response: "Array of role objects"
        },
        create: {
          method: "POST",
          path: "/v1/identity/roles",
          description: "Create a new role",
          permission: "identity.role.write",
          body: {
            key: "Role key (required)",
            name: "Role name (required)",
            description: "Role description (optional)",
            permissions: "Array of permission keys (optional)",
            isDefault: "Is default role for new users (optional)"
          },
          response: "Created role object"
        },
        assign: {
          method: "POST",
          path: "/v1/identity/roles/assign",
          description: "Assign role to user or group",
          permission: "identity.role.write",
          body: {
            subjectId: "User or group ID (required)",
            roleId: "Role ID (required)",
            subjectType: "Subject type: 'user' or 'group' (optional, default: user)"
          },
          response: "Success message"
        },
        revoke: {
          method: "POST",
          path: "/v1/identity/roles/revoke",
          description: "Revoke role assignment",
          permission: "identity.role.write",
          body: {
            assignmentId: "Role assignment ID (required)"
          },
          response: "Success message"
        }
      },
      permissions: {
        list: {
          method: "GET",
          path: "/v1/identity/permissions",
          description: "List all permissions",
          permission: "identity.permission.read",
          query: {
            category: "Filter by category",
            status: "Filter by status"
          },
          response: "Array of permission objects"
        },
        create: {
          method: "POST",
          path: "/v1/identity/permissions",
          description: "Create a new permission",
          permission: "identity.permission.write",
          body: {
            key: "Permission key (required)",
            name: "Permission name (required)",
            description: "Permission description (optional)",
            category: "Category (optional)",
            resource: "Resource (optional)",
            action: "Action (optional)"
          },
          response: "Created permission object"
        }
      },
      mfa: {
        setup: {
          method: "POST",
          path: "/v1/identity/mfa/setup",
          description: "Setup MFA factor",
          permission: "identity.mfa.write",
          body: {
            type: "MFA type: 'totp', 'sms', or 'email' (required)",
            phone: "Phone number (required for sms)",
            email: "Email address (required for email)"
          },
          response: {
            factor: "MFA factor object",
            secret: "TOTP secret (only for totp type)",
            backupCodes: "Array of backup codes (only for totp type)"
          }
        },
        verify: {
          method: "POST",
          path: "/v1/identity/mfa/verify",
          description: "Verify MFA code",
          permission: "identity.mfa.write",
          body: {
            factorId: "MFA factor ID (required)",
            code: "Verification code (required)"
          },
          response: "Success message"
        }
      },
      invitations: {
        list: {
          method: "GET",
          path: "/v1/identity/invitations",
          description: "List invitations",
          permission: "identity.invitation.read",
          response: "Array of invitation objects"
        },
        create: {
          method: "POST",
          path: "/v1/identity/invitations",
          description: "Create invitation",
          permission: "identity.invitation.write",
          body: {
            email: "Email address (required)",
            roleId: "Role ID to assign (optional)",
            expiresInDays: "Days until expiration (optional, default: 7)"
          },
          response: "Created invitation object"
        },
        accept: {
          method: "POST",
          path: "/v1/identity/invitations/:invitationId/accept",
          description: "Accept invitation and create user",
          permission: "none",
          params: {
            invitationId: "Invitation ID"
          },
          body: {
            displayName: "Display name (required)",
            password: "Password (required)"
          },
          response: "Created user object"
        }
      },
      groups: {
        list: {
          method: "GET",
          path: "/v1/identity/groups",
          description: "List groups",
          permission: "identity.role.read",
          response: "Array of group objects"
        },
        create: {
          method: "POST",
          path: "/v1/identity/groups",
          description: "Create group",
          permission: "identity.role.write",
          body: {
            key: "Group key (required)",
            name: "Group name (required)",
            description: "Group description (optional)",
            members: "Initial member IDs (optional)",
            roleIds: "Initial role IDs (optional)"
          },
          response: "Created group object"
        },
        addMember: {
          method: "POST",
          path: "/v1/identity/groups/:groupId/members",
          description: "Add user to group",
          permission: "identity.role.write",
          params: {
            groupId: "Group ID"
          },
          body: {
            userId: "User ID (required)"
          },
          response: "Success message"
        },
        removeMember: {
          method: "DELETE",
          path: "/v1/identity/groups/:groupId/members/:userId",
          description: "Remove user from group",
          permission: "identity.role.write",
          params: {
            groupId: "Group ID",
            userId: "User ID"
          },
          response: "Success message"
        }
      },
      apiKeys: {
        list: {
          method: "GET",
          path: "/v1/identity/api-keys",
          description: "List API keys",
          permission: "identity.api_key.read",
          response: "Array of API key objects (key hash redacted)"
        },
        create: {
          method: "POST",
          path: "/v1/identity/api-keys",
          description: "Create API key",
          permission: "identity.api_key.write",
          body: {
            name: "API key name (required)",
            scopes: "Permission scopes (optional)",
            expiresInDays: "Days until expiration (optional)"
          },
          response: {
            apiKey: "API key object",
            key: "Full API key (only shown once)"
          }
        },
        revoke: {
          method: "POST",
          path: "/v1/identity/api-keys/:id/revoke",
          description: "Revoke API key",
          permission: "identity.api_key.write",
          params: {
            id: "API key ID"
          },
          response: "Success message"
        }
      },
      devices: {
        list: {
          method: "GET",
          path: "/v1/identity/devices",
          description: "List trusted devices",
          permission: "identity.session.read",
          response: "Array of trusted device objects"
        },
        add: {
          method: "POST",
          path: "/v1/identity/devices",
          description: "Add trusted device",
          permission: "identity.session.write",
          body: {
            deviceFingerprint: "Device fingerprint (required)",
            deviceName: "Device name (optional)",
            deviceType: "Device type (optional)"
          },
          response: "Created trusted device object"
        },
        revoke: {
          method: "POST",
          path: "/v1/identity/devices/:id/revoke",
          description: "Revoke trusted device",
          permission: "identity.session.write",
          params: {
            id: "Device ID"
          },
          response: "Success message"
        }
      },
      accessReviews: {
        list: {
          method: "GET",
          path: "/v1/identity/access-reviews",
          description: "List access reviews",
          permission: "identity.access_review.read",
          response: "Array of access review objects"
        },
        create: {
          method: "POST",
          path: "/v1/identity/access-reviews",
          description: "Create access review",
          permission: "identity.access_review.write",
          body: {
            name: "Review name (required)",
            description: "Review description (optional)",
            reviewerId: "Reviewer user ID (optional, defaults to current user)",
            dueInDays: "Days until due (optional)",
            items: "Array of items to review (optional)"
          },
          response: "Created access review object"
        },
        decide: {
          method: "POST",
          path: "/v1/identity/access-reviews/decide",
          description: "Decide on access review item",
          permission: "identity.access_review.write",
          body: {
            reviewId: "Access review ID (required)",
            itemId: "Item ID (required)",
            decision: "Decision: 'approved', 'revoked', or 'needs_change' (required)",
            notes: "Decision notes (optional)"
          },
          response: "Success message"
        }
      },
      riskEvents: {
        list: {
          method: "GET",
          path: "/v1/identity/risk-events",
          description: "List risk events",
          permission: "identity.user.read",
          query: {
            userId: "Filter by user ID",
            severity: "Filter by severity (low, medium, high, critical)",
            resolved: "Show resolved events (true/false, default: false)"
          },
          response: "Array of risk event objects"
        },
        resolve: {
          method: "POST",
          path: "/v1/identity/risk-events/:eventId/resolve",
          description: "Resolve risk event",
          permission: "identity.user.write",
          params: {
            eventId: "Risk event ID"
          },
          body: {
            resolution: "Resolution notes (optional)"
          },
          response: "Success message"
        }
      },
      auditLogs: {
        list: {
          method: "GET",
          path: "/v1/identity/audit-logs",
          description: "List audit logs",
          permission: "identity.audit.read",
          query: {
            page: "Page number (default: 1)",
            pageSize: "Page size (default: 50)",
            entityType: "Filter by entity type",
            action: "Filter by action prefix",
            actorId: "Filter by actor ID"
          },
          response: {
            items: "Array of audit log objects",
            total: "Total number of logs",
            page: "Current page",
            pageSize: "Page size",
            totalPages: "Total number of pages"
          }
        }
      }
    },
    entities: {
      User: {
        id: "Unique user ID",
        tenantId: "Tenant identifier",
        email: "User email address",
        username: "Username (optional)",
        displayName: "Display name",
        phone: "Phone number (optional)",
        avatar: "Avatar URL (optional)",
        status: "User status (invited, active, inactive, suspended, locked, deleted)",
        primaryRoleId: "Primary role ID",
        mfaEnabled: "Whether MFA is enabled",
        mfaVerified: "Whether MFA is verified",
        lastLoginAt: "Last login timestamp",
        lastLoginIp: "Last login IP address",
        failedLoginAttempts: "Number of failed login attempts",
        riskScore: "Risk score (0-100)",
        riskLevel: "Risk level (low, medium, high, critical)",
        createdAt: "Creation timestamp",
        updatedAt: "Last update timestamp"
      },
      Role: {
        id: "Unique role ID",
        key: "Role key (unique within tenant)",
        name: "Role name",
        description: "Role description",
        status: "Role status (active, inactive, archived)",
        permissions: "Array of permission keys",
        system: "Whether this is a system role",
        isDefault: "Whether this is default role for new users"
      },
      Permission: {
        id: "Unique permission ID",
        key: "Permission key (e.g., 'identity.user.read')",
        name: "Permission name",
        description: "Permission description",
        category: "Permission category",
        resource: "Resource type",
        action: "Action type"
      },
      LoginSession: {
        id: "Unique session ID",
        userId: "User ID",
        status: "Session status (active, revoked, expired)",
        ipAddress: "IP address",
        userAgent: "User agent string",
        deviceFingerprint: "Device fingerprint",
        mfaVerified: "Whether MFA was verified",
        expiresAt: "Session expiration timestamp",
        revokedAt: "Revocation timestamp (if revoked)"
      },
      MFAFactor: {
        id: "Unique factor ID",
        userId: "User ID",
        type: "MFA type (totp, sms, email, backup_code, security_key, passkey)",
        name: "Factor name",
        status: "Factor status (active, inactive, revoked)",
        lastUsedAt: "Last used timestamp"
      },
      Invitation: {
        id: "Unique invitation ID",
        email: "Invitee email",
        roleId: "Role to assign on acceptance",
        status: "Invitation status (draft, sent, accepted, expired, revoked)",
        invitedBy: "User ID of inviter",
        expiresAt: "Expiration timestamp",
        acceptedAt: "Acceptance timestamp (if accepted)",
        acceptedUserId: "Accepted user ID (if accepted)"
      },
      Group: {
        id: "Unique group ID",
        key: "Group key",
        name: "Group name",
        description: "Group description",
        members: "Array of user IDs",
        roleIds: "Array of role IDs",
        isDefault: "Whether this is a default group"
      },
      APIKey: {
        id: "Unique key ID",
        ownerId: "Owner user ID",
        name: "Key name",
        keyPrefix: "Key prefix (for identification)",
        scopes: "Permission scopes",
        status: "Key status (active, revoked, expired)",
        expiresAt: "Expiration timestamp",
        lastUsedAt: "Last used timestamp"
      },
      AccessReview: {
        id: "Unique review ID",
        name: "Review name",
        description: "Review description",
        status: "Review status (draft, active, completed)",
        reviewerId: "Reviewer user ID",
        dueAt: "Due date",
        completedAt: "Completion timestamp",
        items: "Array of access review items"
      },
      IdentityRiskEvent: {
        id: "Unique event ID",
        userId: "User ID",
        eventType: "Event type",
        severity: "Severity (low, medium, high, critical)",
        description: "Event description",
        ipAddress: "Related IP address",
        resolvedAt: "Resolution timestamp",
        resolvedBy: "Resolver user ID"
      }
    },
    examples: {
      login: {
        request: {
          method: "POST",
          path: "/v1/identity/auth/login",
          headers: {},
          body: {
            email: "admin@appneural.com",
            password: "admin123"
          }
        },
        response: {
          ok: true,
          data: {
            user: {
              id: "user_abc123",
              email: "admin@appneural.com",
              displayName: "Platform Admin",
              status: "active",
              mfaEnabled: true
            },
            session: {
              id: "session_xyz789",
              status: "active",
              expiresAt: "2025-06-01T00:00:00.000Z"
            },
            token: "sess_abc123xyz789"
          }
        }
      },
      createUser: {
        request: {
          method: "POST",
          path: "/v1/identity/users",
          headers: {
            "x-tenant-id": "demo-tenant",
            "x-user-id": "admin_001",
            "x-role": "admin"
          },
          body: {
            email: "newuser@example.com",
            displayName: "New User",
            password: "SecurePass123!"
          }
        },
        response: {
          ok: true,
          data: {
            id: "user_new123",
            email: "newuser@example.com",
            displayName: "New User",
            status: "active",
            tenantId: "demo-tenant"
          }
        }
      },
      setupMFA: {
        request: {
          method: "POST",
          path: "/v1/identity/mfa/setup",
          headers: {
            "x-tenant-id": "demo-tenant",
            "x-user-id": "user_abc123",
            "x-role": "admin"
          },
          body: {
            type: "totp"
          }
        },
        response: {
          ok: true,
          data: {
            factor: {
              id: "mfa_xyz789",
              type: "totp",
              status: "active"
            },
            secret: "JBSWY3DPEHPK3PXP",
            backupCodes: ["A1B2C3D4", "E5F6G7H8", "I9J0K1L2", "M3N4O5P6", "Q7R8S9T0", "U1V2W3X4", "Y5Z6A7B8", "C9D0E1F2"]
          }
        }
      }
    }
  };
}
