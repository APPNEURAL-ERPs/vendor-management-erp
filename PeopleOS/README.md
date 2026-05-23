# PeopleOS

PeopleOS is a complete runnable TypeScript starter implementation for workforce operations.

It can power platforms that need employee management, departments, positions, staff roles, shift scheduling, attendance, leave approvals, payroll runs, payslips, performance reviews, analytics, event logs, audit logs, and role-based permissions.

## Included modules

- Department management
- Position management
- Staff role management and staff-role assignments
- Employee/staff management
- Shift templates
- Shift assignments with overlap conflict detection
- Attendance clock-in / clock-out
- Manual attendance marking
- Employee timesheets
- Leave policies
- Leave requests and approval/rejection
- Payroll components
- Payroll runs and payslip generation
- Payroll approval and paid status
- Performance reviews
- Workforce analytics
- Event logs and audit logs
- Role-based permissions
- PostgreSQL schema example
- Automated tests

## Tech stack

```txt
Language: TypeScript
Runtime: Node.js
Storage: JSON file store for starter
Production database: PostgreSQL schema included
Dependencies: none
```

## Run

```bash
npm run build
npm start
```

Open:

```txt
http://localhost:5200/health
http://localhost:5200/docs
```

## Reset seed data

```bash
npm run reset
```

## Test

```bash
npm test
```

## Headers

```txt
x-tenant-id: demo-tenant
x-user-id: admin-user
x-role: people_admin
```

Supported roles:

```txt
viewer
employee
manager
scheduler
hr_manager
payroll_manager
people_admin
admin
owner
auditor
```

## Demo IDs

```txt
emp_maya
emp_rahul
emp_neha
emp_asha

dep_people
dep_ops
dep_eng

pos_people_manager
pos_shift_supervisor
pos_backend_engineer

shift_tpl_ops_morning
shift_tpl_eng_day

shas_neha_20260516
shas_rahul_20260516

leavepol_pto
leavepol_unpaid
```

## Example API calls

### Create employee

```bash
curl -X POST http://localhost:5200/peopleos/employees \
  -H "Content-Type: application/json" \
  -H "x-role: people_admin" \
  -H "x-tenant-id: demo-tenant" \
  -d '{
    "employeeNumber": "EMP-2001",
    "firstName": "Dev",
    "lastName": "Sen",
    "email": "dev@example.com",
    "departmentId": "dep_ops",
    "positionId": "pos_shift_supervisor",
    "employmentType": "full_time",
    "employmentStatus": "active",
    "payType": "hourly",
    "hourlyRate": 300,
    "payCurrency": "INR"
  }'
```

### Assign shift

```bash
curl -X POST http://localhost:5200/peopleos/shift-assignments \
  -H "Content-Type: application/json" \
  -H "x-role: scheduler" \
  -H "x-tenant-id: demo-tenant" \
  -d '{
    "employeeId": "emp_neha",
    "shiftTemplateId": "shift_tpl_ops_morning",
    "date": "2026-05-20",
    "status": "published"
  }'
```

### Clock in and clock out

```bash
curl -X POST http://localhost:5200/peopleos/attendance/clock-in \
  -H "Content-Type: application/json" \
  -H "x-role: employee" \
  -H "x-tenant-id: demo-tenant" \
  -d '{
    "employeeId": "emp_neha",
    "shiftAssignmentId": "shas_neha_20260516",
    "at": "2026-05-16T09:05:00.000Z"
  }'
```

### Request leave

```bash
curl -X POST http://localhost:5200/peopleos/leave-requests \
  -H "Content-Type: application/json" \
  -H "x-role: employee" \
  -H "x-tenant-id: demo-tenant" \
  -d '{
    "employeeId": "emp_rahul",
    "policyId": "leavepol_pto",
    "fromDate": "2026-06-10",
    "toDate": "2026-06-12",
    "reason": "Family travel"
  }'
```

### Run payroll

```bash
curl -X POST http://localhost:5200/peopleos/payroll-runs \
  -H "Content-Type: application/json" \
  -H "x-role: payroll_manager" \
  -H "x-tenant-id: demo-tenant" \
  -d '{
    "periodStart": "2026-05-01",
    "periodEnd": "2026-05-31",
    "currency": "INR"
  }'
```

## Production note

This starter uses `data/peopleos.db.json` for local development. For production, replace `DataStore` with PostgreSQL access using `database/schema.sql`.

## Planning Alignment

- Official package: `@appneurox/peopleos`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/people`
- Modes: standalone and PlatformOS integrated
- Related systems: BusinessOS, CareerOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
