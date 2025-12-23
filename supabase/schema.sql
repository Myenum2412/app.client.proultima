-- Supabase schema for Proultima app (Projects master–detail)
-- Run this in Supabase SQL editor (or convert to migrations).

-- Enable UUID generation helpers (usually already enabled in Supabase)
create extension if not exists "pgcrypto";

-- PROJECTS (master)
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  job_number text not null,
  name text not null,
  fabricator_name text,
  contractor_name text,
  location text,
  estimated_tons numeric,
  detailing_status text,
  revision_status text,
  release_status text,
  created_at timestamptz not null default now()
);

create unique index if not exists projects_owner_job_number_uq
  on public.projects (owner_id, job_number);

alter table public.projects enable row level security;
drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own"
  on public.projects for select
  using (owner_id = auth.uid());
drop policy if exists "projects_write_own" on public.projects;
create policy "projects_write_own"
  on public.projects for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- DRAWINGS (detail)
create table if not exists public.drawings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  section text not null, -- drawings_yet_to_return | drawings_yet_to_release | drawing_log
  dwg_no text not null,
  status text,
  description text,
  total_weight_tons numeric,
  latest_submitted_date date,
  release_status text,
  created_at timestamptz not null default now()
);

create index if not exists drawings_project_idx on public.drawings(project_id);
create index if not exists drawings_project_section_idx on public.drawings(project_id, section);

alter table public.drawings enable row level security;
drop policy if exists "drawings_select_by_project_owner" on public.drawings;
create policy "drawings_select_by_project_owner"
  on public.drawings for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = drawings.project_id and p.owner_id = auth.uid()
    )
  );
drop policy if exists "drawings_write_by_project_owner" on public.drawings;
create policy "drawings_write_by_project_owner"
  on public.drawings for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = drawings.project_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = drawings.project_id and p.owner_id = auth.uid()
    )
  );

-- SUBMISSIONS (detail)
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  proultima_pm text,
  submission_type text,
  work_description text,
  drawing_no text,
  submission_date date,
  created_at timestamptz not null default now()
);

create index if not exists submissions_project_idx on public.submissions(project_id);
alter table public.submissions enable row level security;
drop policy if exists "submissions_select_by_project_owner" on public.submissions;
create policy "submissions_select_by_project_owner"
  on public.submissions for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = submissions.project_id and p.owner_id = auth.uid()
    )
  );
drop policy if exists "submissions_write_by_project_owner" on public.submissions;
create policy "submissions_write_by_project_owner"
  on public.submissions for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = submissions.project_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = submissions.project_id and p.owner_id = auth.uid()
    )
  );

-- INVOICES (detail)
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  invoice_no text not null,
  billed_tonnage numeric,
  unit_price_or_lump_sum text,
  tons_billed_amount numeric,
  billed_hours_co numeric,
  co_price numeric,
  co_billed_amount numeric,
  total_amount_billed numeric,
  created_at timestamptz not null default now()
);

create index if not exists invoices_project_idx on public.invoices(project_id);
alter table public.invoices enable row level security;
drop policy if exists "invoices_select_by_project_owner" on public.invoices;
create policy "invoices_select_by_project_owner"
  on public.invoices for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = invoices.project_id and p.owner_id = auth.uid()
    )
  );
drop policy if exists "invoices_write_by_project_owner" on public.invoices;
create policy "invoices_write_by_project_owner"
  on public.invoices for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = invoices.project_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = invoices.project_id and p.owner_id = auth.uid()
    )
  );

-- CHANGE ORDERS (detail)
create table if not exists public.change_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  change_order_id text not null,
  description text,
  hours numeric,
  date date,
  status text,
  created_at timestamptz not null default now()
);

create index if not exists change_orders_project_idx on public.change_orders(project_id);
alter table public.change_orders enable row level security;
drop policy if exists "change_orders_select_by_project_owner" on public.change_orders;
create policy "change_orders_select_by_project_owner"
  on public.change_orders for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = change_orders.project_id and p.owner_id = auth.uid()
    )
  );
drop policy if exists "change_orders_write_by_project_owner" on public.change_orders;
create policy "change_orders_write_by_project_owner"
  on public.change_orders for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = change_orders.project_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = change_orders.project_id and p.owner_id = auth.uid()
    )
  );

-- MATERIAL LISTS (detail)
create table if not exists public.material_lists (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  heading text not null,
  status text not null, -- released | under_review
  priority text not null, -- High | Medium | Low ...
  note text,
  created_at timestamptz not null default now()
);

create index if not exists material_lists_project_idx on public.material_lists(project_id);
alter table public.material_lists enable row level security;
drop policy if exists "material_lists_select_by_project_owner" on public.material_lists;
create policy "material_lists_select_by_project_owner"
  on public.material_lists for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = material_lists.project_id and p.owner_id = auth.uid()
    )
  );
drop policy if exists "material_lists_write_by_project_owner" on public.material_lists;
create policy "material_lists_write_by_project_owner"
  on public.material_lists for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = material_lists.project_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = material_lists.project_id and p.owner_id = auth.uid()
    )
  );

create table if not exists public.material_list_bar_items (
  id uuid primary key default gen_random_uuid(),
  material_list_id uuid not null references public.material_lists(id) on delete cascade,
  dwg_no text,
  release_description text,
  ctrl_code text,
  rel_no text,
  weight_lbs numeric,
  date date,
  varying_bars text,
  remarks text,
  created_at timestamptz not null default now()
);

create index if not exists material_list_bar_items_list_idx on public.material_list_bar_items(material_list_id);
alter table public.material_list_bar_items enable row level security;
drop policy if exists "ml_bar_items_select_by_owner" on public.material_list_bar_items;
create policy "ml_bar_items_select_by_owner"
  on public.material_list_bar_items for select
  using (
    exists (
      select 1
      from public.material_lists ml
      join public.projects p on p.id = ml.project_id
      where ml.id = material_list_bar_items.material_list_id
        and p.owner_id = auth.uid()
    )
  );
drop policy if exists "ml_bar_items_write_by_owner" on public.material_list_bar_items;
create policy "ml_bar_items_write_by_owner"
  on public.material_list_bar_items for all
  using (
    exists (
      select 1
      from public.material_lists ml
      join public.projects p on p.id = ml.project_id
      where ml.id = material_list_bar_items.material_list_id
        and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.material_lists ml
      join public.projects p on p.id = ml.project_id
      where ml.id = material_list_bar_items.material_list_id
        and p.owner_id = auth.uid()
    )
  );

create table if not exists public.material_list_fields (
  id uuid primary key default gen_random_uuid(),
  material_list_id uuid not null references public.material_lists(id) on delete cascade,
  label text not null,
  value text,
  created_at timestamptz not null default now()
);

create index if not exists material_list_fields_list_idx on public.material_list_fields(material_list_id);
alter table public.material_list_fields enable row level security;
drop policy if exists "ml_fields_select_by_owner" on public.material_list_fields;
create policy "ml_fields_select_by_owner"
  on public.material_list_fields for select
  using (
    exists (
      select 1
      from public.material_lists ml
      join public.projects p on p.id = ml.project_id
      where ml.id = material_list_fields.material_list_id
        and p.owner_id = auth.uid()
    )
  );
drop policy if exists "ml_fields_write_by_owner" on public.material_list_fields;
create policy "ml_fields_write_by_owner"
  on public.material_list_fields for all
  using (
    exists (
      select 1
      from public.material_lists ml
      join public.projects p on p.id = ml.project_id
      where ml.id = material_list_fields.material_list_id
        and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.material_lists ml
      join public.projects p on p.id = ml.project_id
      where ml.id = material_list_fields.material_list_id
        and p.owner_id = auth.uid()
    )
  );

-- PAYMENTS (dashboard)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null,
  status text not null, -- success | processing | failed
  email text,
  created_at timestamptz not null default now()
);

create index if not exists payments_user_idx on public.payments(user_id);
alter table public.payments enable row level security;
drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own"
  on public.payments for select
  using (user_id = auth.uid());
drop policy if exists "payments_write_own" on public.payments;
create policy "payments_write_own"
  on public.payments for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- CHAT MESSAGES (optional)
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  role text not null, -- me | system
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_user_idx on public.chat_messages(user_id);
create index if not exists chat_messages_project_idx on public.chat_messages(project_id);
alter table public.chat_messages enable row level security;
drop policy if exists "chat_messages_select_own" on public.chat_messages;
create policy "chat_messages_select_own"
  on public.chat_messages for select
  using (
    user_id = auth.uid()
    and (
      project_id is null
      or exists (select 1 from public.projects p where p.id = chat_messages.project_id and p.owner_id = auth.uid())
    )
  );
drop policy if exists "chat_messages_write_own" on public.chat_messages;
create policy "chat_messages_write_own"
  on public.chat_messages for all
  using (
    user_id = auth.uid()
    and (
      project_id is null
      or exists (select 1 from public.projects p where p.id = chat_messages.project_id and p.owner_id = auth.uid())
    )
  )
  with check (
    user_id = auth.uid()
    and (
      project_id is null
      or exists (select 1 from public.projects p where p.id = chat_messages.project_id and p.owner_id = auth.uid())
    )
  );


