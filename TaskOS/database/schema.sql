-- TaskOS starter schema
create table if not exists task_items (
  id text primary key,
  tenant_id text not null,
  key text not null,
  name text not null,
  type text not null,
  status text not null,
  attributes json,
  metadata json,
  created_at text not null,
  updated_at text not null
);

create unique index if not exists idx_task_items_tenant_key on task_items(tenant_id, key);
