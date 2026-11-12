alter table public.documents
  add column if not exists reviewer_id uuid references public.profiles(id),
  add column if not exists assigned_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists version integer not null default 1;

alter table public.document_assignments
  add column if not exists completed_at timestamptz,
  add column if not exists decision text;

create index if not exists idx_documents_reviewer on public.documents(reviewer_id);
create index if not exists idx_documents_assigned_at on public.documents(assigned_at);
create index if not exists idx_document_versions_document on public.document_versions(document_id);

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

create or replace function public.sync_reviewer_workload(target_reviewer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  active_count integer;
begin
  select count(*) into active_count
  from public.document_assignments
  where reviewer_id = target_reviewer_id
    and status in ('pending', 'in_review');

  update public.profiles
  set current_workload = active_count,
      updated_at = now()
  where id = target_reviewer_id;
end;
$$;

create or replace function public.audit_document_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    NEW.id,
    jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
  );
  return NEW;
end;
$$;

drop trigger if exists trg_documents_audit on public.documents;
create trigger trg_documents_audit
  after insert or update on public.documents
  for each row execute function public.audit_document_event();

drop trigger if exists trg_assignments_audit on public.document_assignments;
create trigger trg_assignments_audit
  after insert or update on public.document_assignments
  for each row execute function public.audit_document_event();

drop trigger if exists trg_observations_audit on public.observations;
create trigger trg_observations_audit
  after insert or update on public.observations
  for each row execute function public.audit_document_event();

create policy "documents_update_related" on public.documents
  for update using (
    public.current_user_role() in ('admin', 'coordinator')
    or reviewer_id = auth.uid()
    or exists (
      select 1 from public.students s
      join public.profiles p on p.id = s.profile_id
      where s.id = documents.student_id and p.id = auth.uid()
        and documents.status in ('observed', 'corrected')
    )
  );

create policy "assignments_update_related" on public.document_assignments
  for update using (
    public.current_user_role() in ('admin', 'coordinator')
    or reviewer_id = auth.uid()
  );

create policy "observations_insert_related" on public.observations
  for insert with check (
    public.current_user_role() in ('admin', 'coordinator', 'reviewer')
    and exists (
      select 1 from public.document_assignments da
      where da.document_id = document_id and da.reviewer_id = auth.uid()
    )
  );

create policy "observations_update_related" on public.observations
  for update using (
    public.current_user_role() in ('admin', 'coordinator', 'reviewer')
    or reviewer_id = auth.uid()
  );

create policy "versions_select_related" on public.document_versions
  for select using (
    public.current_user_role() in ('admin', 'coordinator', 'reviewer')
    or exists (
      select 1 from public.documents d
      join public.students s on s.id = d.student_id
      join public.profiles p on p.id = s.profile_id
      where d.id = document_id and p.id = auth.uid()
    )
  );

create policy "versions_insert_related" on public.document_versions
  for insert with check (
    public.current_user_role() in ('admin', 'coordinator', 'reviewer', 'student')
    and exists (
      select 1 from public.documents d
      where d.id = document_id
        and (
          public.current_user_role() in ('admin', 'coordinator', 'reviewer')
          or exists (
            select 1 from public.students s
            join public.profiles p on p.id = s.profile_id
            where s.id = d.student_id and p.id = auth.uid()
          )
        )
    )
  );
