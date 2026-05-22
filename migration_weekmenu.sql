-- ============================================================
-- Weekmenu
-- Plak dit in de Supabase SQL Editor → Run
-- ============================================================

create table weekmenu (
  id             uuid primary key default gen_random_uuid(),
  huishouden_id  uuid not null references huishoudens(id) on delete cascade,
  datum          date not null,
  recept_id      uuid references recepten(id) on delete set null,
  aangemaakt_op  timestamptz default now(),
  unique (huishouden_id, datum)
);

alter table weekmenu enable row level security;

create policy "weekmenu_select"
  on weekmenu for select
  using (huishouden_id = get_huishouden_id());

create policy "weekmenu_insert"
  on weekmenu for insert
  with check (huishouden_id = get_huishouden_id());

create policy "weekmenu_update"
  on weekmenu for update
  using (huishouden_id = get_huishouden_id());

create policy "weekmenu_delete"
  on weekmenu for delete
  using (huishouden_id = get_huishouden_id());
