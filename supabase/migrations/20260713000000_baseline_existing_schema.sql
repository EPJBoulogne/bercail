-- Baseline migration: documents tables already created by hand in the Supabase
-- dashboard (before this migrations folder existed), so the repo reflects the
-- real state of the database. Uses IF NOT EXISTS everywhere so it is safe to
-- run against the existing project without conflicting with what's already there.
-- Column types/constraints are reconstructed from application code and from
-- the schema as described by the project owner, not dumped from the DB directly
-- — reconcile against the live schema (e.g. `supabase db diff`) before relying on it.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  email text,
  phone text,
  system_role text not null default 'member'
    check (system_role in ('admin', 'dept_manager', 'member')),
  status text not null default 'pending'
    check (status in ('pending', 'active', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default 'accent'
    check (color in ('accent', 'success', 'warning', 'danger')),
  is_worship boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.department_members (
  department_id uuid not null references public.departments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (department_id, user_id)
);

create table if not exists public.department_roles (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments (id) on delete cascade,
  title text not null,
  person_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  department_id uuid references public.departments (id) on delete set null,
  recur_group uuid,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.event_assignments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'invited'
    check (status in ('invited', 'accepted', 'declined')),
  role_id uuid references public.department_roles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.unavailability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_department_roles_department_id on public.department_roles (department_id);
create index if not exists idx_events_department_id on public.events (department_id);
create index if not exists idx_events_date on public.events (date);
create index if not exists idx_event_assignments_event_id on public.event_assignments (event_id);
create index if not exists idx_event_assignments_user_id on public.event_assignments (user_id);
create index if not exists idx_unavailability_user_id on public.unavailability (user_id);

-- RLS is already enabled with hand-written policies on these tables in the
-- live project; not reproduced here since the exact policies weren't
-- available to verify. Enabling RLS is idempotent and safe to re-run.
alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.department_members enable row level security;
alter table public.department_roles enable row level security;
alter table public.events enable row level security;
alter table public.event_assignments enable row level security;
alter table public.unavailability enable row level security;
