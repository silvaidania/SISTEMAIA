create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'coordinator', 'reviewer', 'student');
create type public.document_status as enum ('submitted', 'in_review', 'observed', 'corrected', 'approved', 'rejected');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role public.app_role not null default 'student',
  is_active boolean not null default true,
  password_hash text,
  reviewer_capacity integer not null default 12 check (reviewer_capacity >= 0),
  current_workload integer not null default 0 check (current_workload >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.academic_periods (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references public.universities(id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete cascade,
  student_code text not null unique,
  university_id uuid references public.universities(id),
  career text,
  semester integer,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  academic_period_id uuid references public.academic_periods(id),
  title text not null,
  document_type text not null,
  storage_path text,
  status public.document_status not null default 'submitted',
  submitted_at timestamptz not null default now(),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_assignments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  reviewer_id uuid references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id),
  assigned_at timestamptz not null default now(),
  status text not null default 'pending',
  notes text,
  unique(document_id, reviewer_id)
);

create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  reviewer_id uuid references public.profiles(id),
  observation text not null,
  severity text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  version_number integer not null,
  storage_path text not null,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(document_id, version_number)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_documents_status on public.documents(status);
create index if not exists idx_document_assignments_reviewer on public.document_assignments(reviewer_id);
create index if not exists idx_observations_document on public.observations(document_id);

create or replace view public.v_reviewer_load_balance as
select
  p.id,
  p.full_name,
  p.reviewer_capacity,
  p.current_workload,
  count(da.id) filter (where da.status in ('pending', 'in_review')) as pending_documents,
  greatest(p.reviewer_capacity - count(da.id) filter (where da.status in ('pending', 'in_review')), 0) as available_capacity
from public.profiles p
left join public.document_assignments da on da.reviewer_id = p.id
group by p.id, p.full_name, p.reviewer_capacity, p.current_workload;

alter table public.profiles enable row level security;
alter table public.universities enable row level security;
alter table public.academic_periods enable row level security;
alter table public.students enable row level security;
alter table public.documents enable row level security;
alter table public.document_assignments enable row level security;
alter table public.observations enable row level security;
alter table public.document_versions enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.current_user_role() in ('admin', 'coordinator'));

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id or public.current_user_role() in ('admin', 'coordinator'));

create policy "documents_select_related" on public.documents
  for select using (
    public.current_user_role() in ('admin', 'coordinator')
    or exists (
      select 1 from public.students s
      join public.profiles p on p.id = s.profile_id
      where s.id = documents.student_id and p.id = auth.uid()
    )
    or exists (
      select 1 from public.document_assignments da
      where da.document_id = documents.id and da.reviewer_id = auth.uid()
    )
  );

create policy "documents_insert_student" on public.documents
  for insert with check (
    public.current_user_role() = 'student'
    and exists (
      select 1 from public.students s
      join public.profiles p on p.id = s.profile_id
      where s.id = student_id and p.id = auth.uid()
    )
  );

create policy "assignments_select_related" on public.document_assignments
  for select using (
    public.current_user_role() in ('admin', 'coordinator')
    or reviewer_id = auth.uid()
  );

create policy "assignments_insert_admin" on public.document_assignments
  for insert with check (public.current_user_role() in ('admin', 'coordinator'));

create policy "observations_select_related" on public.observations
  for select using (
    public.current_user_role() in ('admin', 'coordinator', 'reviewer')
    or exists (
      select 1 from public.document_assignments da
      join public.documents d on d.id = da.document_id
      join public.students s on s.id = d.student_id
      join public.profiles p on p.id = s.profile_id
      where da.document_id = document_id and p.id = auth.uid()
    )
  );

create policy "audit_select_admin" on public.audit_logs
  for select using (public.current_user_role() in ('admin', 'coordinator'));
