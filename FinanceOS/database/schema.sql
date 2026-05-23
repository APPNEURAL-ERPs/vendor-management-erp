-- FinanceOS PostgreSQL schema starter
-- Replace the JSON DataStore with repositories backed by these tables for production use.

create table if not exists finance_counterparties (
  id text primary key,
  tenant_id text not null,
  type text not null check (type in ('customer','vendor','both')),
  display_name text not null,
  legal_name text,
  email text,
  phone text,
  tax_id text,
  billing_address jsonb default '{}'::jsonb,
  payment_terms_days integer not null default 15,
  status text not null default 'active',
  tags jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists finance_accounts (
  id text primary key,
  tenant_id text not null,
  code text not null,
  name text not null,
  type text not null check (type in ('asset','liability','equity','revenue','expense')),
  currency text not null default 'INR',
  parent_account_id text references finance_accounts(id),
  status text not null default 'active',
  created_by text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (tenant_id, code)
);

create table if not exists finance_tax_rules (
  id text primary key,
  tenant_id text not null,
  name text not null,
  type text not null,
  jurisdiction text not null,
  rate numeric(12,4) not null default 0,
  inclusive boolean not null default false,
  recoverable boolean not null default true,
  status text not null default 'active',
  created_by text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists finance_invoices (
  id text primary key,
  tenant_id text not null,
  invoice_number text not null,
  customer_id text not null references finance_counterparties(id),
  issue_date timestamptz not null,
  due_date timestamptz not null,
  currency text not null default 'INR',
  status text not null,
  payment_terms_days integer not null default 15,
  line_items jsonb not null default '[]'::jsonb,
  subtotal_amount numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  taxable_amount numeric(14,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  paid_amount numeric(14,2) not null default 0,
  refunded_amount numeric(14,2) not null default 0,
  balance_due numeric(14,2) not null default 0,
  notes text,
  sent_at timestamptz,
  voided_at timestamptz,
  created_by text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (tenant_id, invoice_number)
);

create table if not exists finance_payments (
  id text primary key,
  tenant_id text not null,
  payment_number text not null,
  customer_id text references finance_counterparties(id),
  vendor_id text references finance_counterparties(id),
  invoice_id text references finance_invoices(id),
  expense_id text,
  amount numeric(14,2) not null,
  refunded_amount numeric(14,2) not null default 0,
  currency text not null default 'INR',
  method text not null,
  status text not null,
  processor_ref text,
  received_at timestamptz not null,
  memo text,
  created_by text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (tenant_id, payment_number)
);

create table if not exists finance_refunds (
  id text primary key,
  tenant_id text not null,
  refund_number text not null,
  payment_id text not null references finance_payments(id),
  invoice_id text references finance_invoices(id),
  customer_id text references finance_counterparties(id),
  amount numeric(14,2) not null,
  currency text not null default 'INR',
  reason text not null,
  status text not null,
  processed_at timestamptz,
  created_by text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (tenant_id, refund_number)
);

create table if not exists finance_expenses (
  id text primary key,
  tenant_id text not null,
  expense_number text not null,
  vendor_id text references finance_counterparties(id),
  employee_id text,
  category text not null,
  description text not null,
  amount numeric(14,2) not null,
  tax_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null,
  currency text not null default 'INR',
  status text not null,
  receipt_url text,
  due_date timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by text,
  paid_at timestamptz,
  payment_id text references finance_payments(id),
  created_by text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (tenant_id, expense_number)
);

create table if not exists finance_subscription_plans (
  id text primary key,
  tenant_id text not null,
  name text not null,
  code text not null,
  amount numeric(14,2) not null,
  currency text not null default 'INR',
  interval text not null check (interval in ('monthly','quarterly','yearly')),
  tax_rule_id text references finance_tax_rules(id),
  status text not null default 'active',
  created_by text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (tenant_id, code)
);

create table if not exists finance_subscriptions (
  id text primary key,
  tenant_id text not null,
  customer_id text not null references finance_counterparties(id),
  plan_id text not null references finance_subscription_plans(id),
  status text not null,
  start_date timestamptz not null,
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  next_billing_at timestamptz not null,
  latest_invoice_id text references finance_invoices(id),
  cancelled_at timestamptz,
  created_by text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists finance_budgets (
  id text primary key,
  tenant_id text not null,
  name text not null,
  category text not null,
  amount numeric(14,2) not null,
  currency text not null default 'INR',
  period_start timestamptz not null,
  period_end timestamptz not null,
  owner_team text,
  status text not null default 'active',
  created_by text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists finance_ledger_entries (
  id text primary key,
  tenant_id text not null,
  journal_id text not null,
  account_code text not null,
  account_name text not null,
  account_type text not null,
  side text not null check (side in ('debit','credit')),
  amount numeric(14,2) not null,
  currency text not null default 'INR',
  source_type text not null,
  source_id text not null,
  description text not null,
  posted_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists finance_events (
  id text primary key,
  tenant_id text not null,
  type text not null,
  source text not null default 'FinanceOS',
  actor_id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists finance_audit_logs (
  id text primary key,
  tenant_id text not null,
  actor_id text not null,
  role text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists idx_finance_invoices_tenant_status on finance_invoices (tenant_id, status);
create index if not exists idx_finance_payments_invoice on finance_payments (tenant_id, invoice_id);
create index if not exists idx_finance_expenses_tenant_status on finance_expenses (tenant_id, status);
create index if not exists idx_finance_ledger_source on finance_ledger_entries (tenant_id, source_type, source_id);
create index if not exists idx_finance_events_tenant_type on finance_events (tenant_id, type);
