create extension if not exists unaccent with schema extensions;

create or replace function public.fold(value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(value, '')));
$$;

create table public.applications (
  id              uuid primary key,
  owner_id        uuid not null references auth.users on delete cascade,
  company         text not null check (char_length(company) between 1 and 120),
  position        text not null check (char_length(position) between 1 and 120),
  job_url         text check (char_length(job_url) <= 2048),
  source          text not null check (
    source in ('linkedin', 'infojobs', 'tecnoempleo', 'company_site', 'referral', 'recruiter', 'other')
  ),
  location        text check (char_length(location) <= 120),
  work_mode       text not null check (work_mode in ('remote', 'hybrid', 'onsite')),
  salary_min      integer check (salary_min > 0),
  salary_max      integer check (salary_max > 0),
  salary_currency text check (salary_currency in ('EUR', 'GBP', 'USD')),
  status          text not null check (
    status in (
      'wishlist', 'applied', 'screening', 'interviewing', 'offer',
      'accepted', 'rejected', 'withdrawn', 'no_response'
    )
  ),
  applied_at      date,
  tags            text[] not null default '{}' check (cardinality(tags) <= 10),
  notes           text check (char_length(notes) <= 5000),
  archived        boolean not null default false,
  created_at      timestamptz not null,
  updated_at      timestamptz not null,
  check (salary_min is null or salary_max is null or salary_min <= salary_max),
  check ((salary_min is null and salary_max is null) or salary_currency is not null)
);

create index applications_owner_updated_idx on public.applications (owner_id, updated_at desc);

create table public.status_changes (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications on delete cascade,
  owner_id       uuid not null references auth.users on delete cascade,
  seq            integer not null check (seq >= 0),
  from_status    text check (
    from_status in (
      'wishlist', 'applied', 'screening', 'interviewing', 'offer',
      'accepted', 'rejected', 'withdrawn', 'no_response'
    )
  ),
  to_status      text not null check (
    to_status in (
      'wishlist', 'applied', 'screening', 'interviewing', 'offer',
      'accepted', 'rejected', 'withdrawn', 'no_response'
    )
  ),
  changed_at     timestamptz not null,
  note           text check (char_length(note) <= 500),
  unique (application_id, seq)
);

create index status_changes_owner_idx on public.status_changes (owner_id);

create table public.profiles (
  user_id    uuid primary key references auth.users on delete cascade,
  locale     text check (locale in ('es', 'en')),
  theme      text check (theme in ('light', 'dark', 'system')),
  updated_at timestamptz not null default now()
);

alter table public.applications enable row level security;
alter table public.status_changes enable row level security;
alter table public.profiles enable row level security;

create policy "applications_select_own" on public.applications
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "applications_insert_own" on public.applications
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "applications_update_own" on public.applications
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy "applications_delete_own" on public.applications
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "status_changes_select_own" on public.status_changes
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "status_changes_insert_own" on public.status_changes
  for insert to authenticated with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.applications a
      where a.id = application_id and a.owner_id = (select auth.uid())
    )
  );
create policy "status_changes_delete_own" on public.status_changes
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.applications, public.status_changes, public.profiles from anon, authenticated;
grant select, insert, update, delete on public.applications to authenticated;
grant select, insert, delete on public.status_changes to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant all on public.applications, public.status_changes, public.profiles to service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.save_application(payload jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  app public.applications;
  next_seq integer;
begin
  app := jsonb_populate_record(null::public.applications, payload -> 'application');

  insert into public.applications values (app.*)
  on conflict (id) do update set
    company = excluded.company,
    position = excluded.position,
    job_url = excluded.job_url,
    source = excluded.source,
    location = excluded.location,
    work_mode = excluded.work_mode,
    salary_min = excluded.salary_min,
    salary_max = excluded.salary_max,
    salary_currency = excluded.salary_currency,
    status = excluded.status,
    applied_at = excluded.applied_at,
    tags = excluded.tags,
    notes = excluded.notes,
    archived = excluded.archived,
    updated_at = excluded.updated_at
  where public.applications.owner_id = excluded.owner_id;

  if not found then
    raise exception 'application % belongs to another owner', app.id using errcode = '42501';
  end if;

  select coalesce(max(s.seq) + 1, 0) into next_seq
  from public.status_changes s
  where s.application_id = app.id;

  insert into public.status_changes (application_id, owner_id, seq, from_status, to_status, changed_at, note)
  select app.id, app.owner_id, h.seq, h.from_status, h.to_status, h.changed_at, h.note
  from jsonb_populate_recordset(null::public.status_changes, payload -> 'history') h
  where h.seq >= next_seq
  order by h.seq;
end;
$$;

create or replace function public.application_document(app public.applications)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select to_jsonb(app) || jsonb_build_object(
    'status_changes',
    coalesce(
      (
        select jsonb_agg(to_jsonb(s) order by s.seq)
        from public.status_changes s
        where s.application_id = app.id
      ),
      '[]'::jsonb
    )
  );
$$;

create or replace function public.search_applications(query jsonb)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with params as (
    select
      (query ->> 'owner_id')::uuid as owner_id,
      coalesce(query ->> 'archived', 'exclude') as archived,
      array(select jsonb_array_elements_text(coalesce(query -> 'statuses', '[]'))) as statuses,
      array(select jsonb_array_elements_text(coalesce(query -> 'work_modes', '[]'))) as work_modes,
      array(select jsonb_array_elements_text(coalesce(query -> 'sources', '[]'))) as sources,
      array(
        select public.fold(t) from jsonb_array_elements_text(coalesce(query -> 'tags', '[]')) t
      ) as tags,
      array(
        select w from regexp_split_to_table(public.fold(query ->> 'text'), '\s+') w where w <> ''
      ) as words,
      coalesce(query ->> 'sort_field', 'updatedAt') as sort_field,
      coalesce(query ->> 'sort_direction', 'desc') as sort_direction,
      coalesce((query ->> 'offset')::integer, 0) as page_offset,
      coalesce((query ->> 'limit')::integer, 50) as page_limit
  ),
  owned as (
    select
      a,
      public.fold(a.company) as folded_company,
      public.fold(a.position) as folded_position,
      array(select public.fold(t) from unnest(a.tags) t) as folded_tags
    from public.applications a, params p
    where a.owner_id = p.owner_id
      and (p.archived = 'include' or (p.archived = 'only') = a.archived)
      and (cardinality(p.statuses) = 0 or a.status = any (p.statuses))
      and (cardinality(p.work_modes) = 0 or a.work_mode = any (p.work_modes))
      and (cardinality(p.sources) = 0 or a.source = any (p.sources))
  ),
  matching as (
    select o.*
    from owned o, params p
    where (cardinality(p.tags) = 0 or o.folded_tags && p.tags)
      and not exists (
        select 1 from unnest(p.words) w
        where strpos(o.folded_company, w) = 0
          and strpos(o.folded_position, w) = 0
          and not exists (select 1 from unnest(o.folded_tags) ft where strpos(ft, w) > 0)
      )
  ),
  ordered as (
    select
      m.a,
      count(*) over () as total,
      row_number() over (
        order by
          case when p.sort_field = 'appliedAt' then (m.a).applied_at is null end asc,
          case when p.sort_field = 'appliedAt' and p.sort_direction = 'asc' then (m.a).applied_at end asc,
          case when p.sort_field = 'appliedAt' and p.sort_direction = 'desc' then (m.a).applied_at end desc,
          case when p.sort_field = 'company' and p.sort_direction = 'asc' then m.folded_company end collate "C" asc,
          case when p.sort_field = 'company' and p.sort_direction = 'desc' then m.folded_company end collate "C" desc,
          case when p.sort_field = 'updatedAt' and p.sort_direction = 'asc' then (m.a).updated_at end asc,
          case when p.sort_field = 'updatedAt' and p.sort_direction = 'desc' then (m.a).updated_at end desc,
          (m.a).id::text collate "C" asc
      ) as rank_in_query
    from matching m, params p
  )
  select jsonb_build_object(
    'total', coalesce((select max(o.total) from ordered o), 0),
    'items', coalesce(
      (
        select jsonb_agg(public.application_document(o.a) order by o.rank_in_query)
        from ordered o, params p
        where o.rank_in_query > p.page_offset and o.rank_in_query <= p.page_offset + p.page_limit
      ),
      '[]'::jsonb
    )
  );
$$;

revoke all on function public.save_application(jsonb) from public, anon;
revoke all on function public.search_applications(jsonb) from public, anon;
revoke all on function public.application_document(public.applications) from public, anon;
grant execute on function public.save_application(jsonb) to authenticated, service_role;
grant execute on function public.search_applications(jsonb) to authenticated, service_role;
grant execute on function public.application_document(public.applications) to authenticated, service_role;
grant execute on function public.fold(text) to authenticated, service_role;
