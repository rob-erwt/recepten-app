-- ══════════════════════════════════════════════════════════════════════════════
-- B-01 / B-03 / B-04: Boodschappenlijst
-- ══════════════════════════════════════════════════════════════════════════════

create table boodschappenlijst_items (
  id            uuid        primary key default gen_random_uuid(),
  huishouden_id uuid        not null references huishoudens(id) on delete cascade,
  naam          text        not null,
  hoeveelheid   text,                    -- als tekst bewaard zodat "½" ook werkt
  eenheid       text,
  afgevinkt     boolean     not null default false,
  bron          text        not null default 'handmatig', -- 'weekmenu' | 'handmatig'
  recept_naam   text,                    -- informatief: uit welk recept
  aangemaakt_op timestamptz default now()
);

alter table boodschappenlijst_items enable row level security;

create policy "boodschappen_select"
  on boodschappenlijst_items for select
  using (huishouden_id = get_huishouden_id());

create policy "boodschappen_insert"
  on boodschappenlijst_items for insert
  with check (huishouden_id = get_huishouden_id());

create policy "boodschappen_update"
  on boodschappenlijst_items for update
  using (huishouden_id = get_huishouden_id());

create policy "boodschappen_delete"
  on boodschappenlijst_items for delete
  using (huishouden_id = get_huishouden_id());
