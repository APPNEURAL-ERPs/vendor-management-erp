# SecurityOS

SecurityOS is a reusable security operating layer for Appneural platforms. It manages IAM, RBAC, policies, audit logs, sessions, API keys, secrets, compliance controls, access reviews, findings, events, and security analytics.

This starter uses TypeScript, Node.js built-ins, and a JSON-file datastore for local development. For production, replace the datastore with PostgreSQL using `database/schema.sql` and replace demo secret sealing with KMS/HSM-backed encryption.

## Features

- Identity management
- Role and permission management
- Group management
- Role assignments
- Access check engine
- Allow/deny security policies
- Sessions and revocation
- API key hashing, verification, and revocation
- Secret vault with masking, reveal, rotation, and version history
- Compliance controls and evidence
- Access reviews and decisions
- Security findings and resolution
- Audit logs with sensitive field redaction
- Event logs
- Security analytics
- Seed demo data
- PostgreSQL schema example
- Automated tests

## Run

```bash
npm run build
npm start
```

Open:

```txt
http://localhost:5400/health
http://localhost:5400/docs
```

Default tenant:

```txt
demo-tenant
```

## Demo auth headers

```txt
x-tenant-id: demo-tenant
x-user-id: admin-user
x-role: security_admin
```

Supported API roles:

```txt
viewer
security_analyst
iam_admin
secret_manager
compliance_manager
security_admin
admin
owner
auditor
```

## Main demo IDs

```txt
ident_demo_maya
ident_demo_rahul
ident_demo_asha
ident_demo_service_commerce
role_security_admin
role_iam_operator
role_security_auditor
role_commerce_operator
role_secret_operator
group_security
group_engineering
group_compliance
assign_maya_admin
assign_asha_auditor
assign_eng_commerce
policy_deny_secret_reveal_commerce
policy_allow_auditor_read
secret_demo_stripe
ctrl_soc2_cc6_1
ctrl_iso_a_5_15
review_q2_access
finding_rahul_mfa
finding_expired_session
```

## Example API calls

Check access:

```bash
curl -X POST http://localhost:5400/securityos/access/check \
  -H "Content-Type: application/json" \
  -H "x-role: security_analyst" \
  -d '{"subjectId":"ident_demo_rahul","action":"commerce.orders.write","resource":"commerce.orders"}'
```

Create identity:

```bash
curl -X POST http://localhost:5400/securityos/identities \
  -H "Content-Type: application/json" \
  -H "x-role: iam_admin" \
  -d '{"email":"dev@appneural.com","displayName":"Dev Engineer","mfaEnabled":true}'
```

Create secret:

```bash
curl -X POST http://localhost:5400/securityos/secrets \
  -H "Content-Type: application/json" \
  -H "x-role: secret_manager" \
  -d '{"name":"OPENAI_API_KEY","environment":"prod","value":"sk-demo-secret","tags":["aios","prod"]}'
```

## Production notes

The included secret engine is demo-only. Replace it with a proper KMS/HSM provider before production. Replace header-based demo auth with SSO/OIDC, and persist audit logs in an append-only datastore.

## Planning Alignment

- Official package: `@appneurox/securityos`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/security`
- Modes: standalone and PlatformOS integrated
- Related systems: PlatformOS, ComplianceOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
