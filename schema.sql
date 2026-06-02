-- ══════════════════════════════════════════════════════════════════════════════
-- ReceptenApp – Volledig databaseschema
--
-- Voer dit éénmalig uit in de Supabase SQL Editor voor een verse installatie.
-- Voor een bestaande database: alleen de losse migration_*.sql-bestanden
-- uitvoeren die nog niet zijn toegepast.
--
-- Volgorde: functies → tabellen → RLS → triggers → seed
-- ══════════════════════════════════════════════════════════════════════════════


-- ── 1. Helper-functie ─────────────────────────────────────────────────────────
-- Moet vóór de RLS-policies worden aangemaakt.

create or replace function get_huishouden_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select huishouden_id from gebruikers where id = auth.uid()
$$;


-- ── 2. Tabellen ───────────────────────────────────────────────────────────────

create table huishoudens (
  id            uuid        primary key default gen_random_uuid(),
  naam          text        not null,
  aangemaakt_op timestamptz default now()
);

-- Gebruikersprofielen (verlengt Supabase auth.users)
create table gebruikers (
  id            uuid        primary key references auth.users(id) on delete cascade,
  huishouden_id uuid        references huishoudens(id) on delete set null,
  naam          text,
  aangemaakt_op timestamptz default now()
);

create table recepten (
  id                  uuid        primary key default gen_random_uuid(),
  huishouden_id       uuid        not null references huishoudens(id) on delete cascade,
  naam                text        not null,
  beschrijving        text,
  aantal_personen     int,
  bereidingstijd_min  int,
  foto_url            text,
  aangemaakt_door     uuid        references auth.users(id),
  aangemaakt_op       timestamptz default now(),
  bijgewerkt_op       timestamptz default now()
);

create table ingredienten (
  id         uuid    primary key default gen_random_uuid(),
  recept_id  uuid    not null references recepten(id) on delete cascade,
  naam       text    not null,
  hoeveelheid numeric,
  eenheid    text,
  volgorde   int     default 0
);

create table stappen (
  id          uuid primary key default gen_random_uuid(),
  recept_id   uuid not null references recepten(id) on delete cascade,
  stap_nummer int  not null,
  omschrijving text not null
);

-- Categorieën: huishouden_id = null → standaard (voor iedereen), anders eigen
create table categorieen (
  id            uuid primary key default gen_random_uuid(),
  naam          text not null,
  huishouden_id uuid references huishoudens(id) on delete cascade,
  volgorde      int  default 99
);

-- Recept ↔ Categorie (many-to-many)
create table recept_categorieen (
  recept_id    uuid not null references recepten(id)   on delete cascade,
  categorie_id uuid not null references categorieen(id) on delete cascade,
  primary key (recept_id, categorie_id)
);

create table weekmenu (
  id            uuid        primary key default gen_random_uuid(),
  huishouden_id uuid        not null references huishoudens(id) on delete cascade,
  datum         date        not null,
  recept_id     uuid        references recepten(id) on delete set null,
  aangemaakt_op timestamptz default now(),
  unique (huishouden_id, datum)
);

create table uitnodigingen (
  id              uuid        primary key default gen_random_uuid(),
  huishouden_id   uuid        not null references huishoudens(id) on delete cascade,
  token           uuid        not null unique default gen_random_uuid(),
  email           text,                        -- optioneel: voor eigen administratie
  aangemaakt_door uuid        not null references auth.users(id) on delete cascade,
  aangemaakt_op   timestamptz default now(),
  verloopt_op     timestamptz not null default (now() + interval '7 days'),
  gebruikt_op     timestamptz              -- null = nog geldig
);

create table boodschappenlijst_items (
  id            uuid        primary key default gen_random_uuid(),
  huishouden_id uuid        not null references huishoudens(id) on delete cascade,
  naam          text        not null,
  hoeveelheid   text,                    -- tekst zodat "½" ook werkt
  eenheid       text,
  afgevinkt     boolean     not null default false,
  bron          text        not null default 'handmatig', -- 'weekmenu' | 'handmatig'
  recept_naam   text,                    -- informatief: uit welk recept
  aangemaakt_op timestamptz default now()
);


-- ── 3. Row Level Security ─────────────────────────────────────────────────────

alter table huishoudens            enable row level security;
alter table gebruikers             enable row level security;
alter table recepten               enable row level security;
alter table ingredienten           enable row level security;
alter table stappen                enable row level security;
alter table categorieen            enable row level security;
alter table recept_categorieen     enable row level security;
alter table weekmenu               enable row level security;
alter table uitnodigingen          enable row level security;
alter table boodschappenlijst_items enable row level security;

-- Huishoudens
create policy "huishoudens_select_eigen"
  on huishoudens for select
  using (id = get_huishouden_id());

-- Gebruikers: eigen profiel + huishoudenleden
create policy "gebruikers_select_eigen"
  on gebruikers for select
  using (id = auth.uid());

create policy "gebruikers_select_huishouden"
  on gebruikers for select
  using (huishouden_id = get_huishouden_id());

create policy "gebruikers_update_eigen"
  on gebruikers for update
  using (id = auth.uid());

-- Recepten
create policy "recepten_select"
  on recepten for select
  using (huishouden_id = get_huishouden_id());

create policy "recepten_insert"
  on recepten for insert
  with check (huishouden_id = get_huishouden_id());

create policy "recepten_update"
  on recepten for update
  using (huishouden_id = get_huishouden_id());

create policy "recepten_delete"
  on recepten for delete
  using (huishouden_id = get_huishouden_id());

-- Ingrediënten (via recept)
create policy "ingredienten_select"
  on ingredienten for select
  using (exists (select 1 from recepten r where r.id = recept_id and r.huishouden_id = get_huishouden_id()));

create policy "ingredienten_insert"
  on ingredienten for insert
  with check (exists (select 1 from recepten r where r.id = recept_id and r.huishouden_id = get_huishouden_id()));

create policy "ingredienten_update"
  on ingredienten for update
  using (exists (select 1 from recepten r where r.id = recept_id and r.huishouden_id = get_huishouden_id()));

create policy "ingredienten_delete"
  on ingredienten for delete
  using (exists (select 1 from recepten r where r.id = recept_id and r.huishouden_id = get_huishouden_id()));

-- Stappen (via recept)
create policy "stappen_select"
  on stappen for select
  using (exists (select 1 from recepten r where r.id = recept_id and r.huishouden_id = get_huishouden_id()));

create policy "stappen_insert"
  on stappen for insert
  with check (exists (select 1 from recepten r where r.id = recept_id and r.huishouden_id = get_huishouden_id()));

create policy "stappen_update"
  on stappen for update
  using (exists (select 1 from recepten r where r.id = recept_id and r.huishouden_id = get_huishouden_id()));

create policy "stappen_delete"
  on stappen for delete
  using (exists (select 1 from recepten r where r.id = recept_id and r.huishouden_id = get_huishouden_id()));

-- Categorieën
create policy "categorieen_select"
  on categorieen for select
  using (huishouden_id is null or huishouden_id = get_huishouden_id());

create policy "categorieen_insert"
  on categorieen for insert
  with check (huishouden_id = get_huishouden_id());

create policy "categorieen_update"
  on categorieen for update
  using (huishouden_id = get_huishouden_id());

create policy "categorieen_delete"
  on categorieen for delete
  using (huishouden_id = get_huishouden_id());

-- Recept-categoriekoppelingen (via recept)
create policy "recept_categorieen_select"
  on recept_categorieen for select
  using (exists (select 1 from recepten r where r.id = recept_id and r.huishouden_id = get_huishouden_id()));

create policy "recept_categorieen_insert"
  on recept_categorieen for insert
  with check (exists (select 1 from recepten r where r.id = recept_id and r.huishouden_id = get_huishouden_id()));

create policy "recept_categorieen_delete"
  on recept_categorieen for delete
  using (exists (select 1 from recepten r where r.id = recept_id and r.huishouden_id = get_huishouden_id()));

-- Weekmenu
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

-- Uitnodigingen
create policy "uitnodigingen_select"
  on uitnodigingen for select
  using (huishouden_id = get_huishouden_id());

create policy "uitnodigingen_insert"
  on uitnodigingen for insert
  with check (huishouden_id = get_huishouden_id() and aangemaakt_door = auth.uid());

create policy "uitnodigingen_delete"
  on uitnodigingen for delete
  using (huishouden_id = get_huishouden_id());

-- Boodschappenlijst
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


-- ── 4. Triggers & functies ────────────────────────────────────────────────────

-- bijgewerkt_op automatisch updaten bij recepten
create or replace function update_bijgewerkt_op()
returns trigger language plpgsql as $$
begin
  new.bijgewerkt_op = now();
  return new;
end;
$$;

create trigger recepten_bijgewerkt_op
  before update on recepten
  for each row execute function update_bijgewerkt_op();

-- Nieuwe gebruiker: koppelen aan bestaand huishouden (via uitnodigingstoken)
-- of een nieuw huishouden aanmaken.
create or replace function handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare
  nieuw_huishouden_id uuid;
  gebruiker_naam      text;
  uitnodiging_token   uuid;
  uitnodiging_rec     record;
begin
  gebruiker_naam := coalesce(
    new.raw_user_meta_data->>'naam',
    split_part(new.email, '@', 1)
  );

  -- Controleer of er een uitnodigingstoken in de metadata zit
  begin
    uitnodiging_token := (new.raw_user_meta_data->>'uitnodiging_token')::uuid;
  exception when others then
    uitnodiging_token := null;
  end;

  if uitnodiging_token is not null then
    select * into uitnodiging_rec
    from uitnodigingen
    where token       = uitnodiging_token
      and gebruikt_op is null
      and verloopt_op > now();

    if found then
      nieuw_huishouden_id := uitnodiging_rec.huishouden_id;
      update uitnodigingen set gebruikt_op = now() where id = uitnodiging_rec.id;
    end if;
  end if;

  -- Geen geldige uitnodiging → nieuw huishouden aanmaken
  if nieuw_huishouden_id is null then
    insert into huishoudens (naam)
    values (gebruiker_naam || '''s huishouden')
    returning id into nieuw_huishouden_id;
  end if;

  insert into gebruikers (id, huishouden_id, naam)
  values (new.id, nieuw_huishouden_id, gebruiker_naam);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Openbare tokenvaliatie voor de uitnodigingspagina (geen inlog vereist)
create or replace function valideer_uitnodiging(p_token uuid)
returns table (
  geldig             boolean,
  huishouden_naam    text,
  uitgenodigde_email text
)
language plpgsql security definer
set search_path = public
as $$
begin
  return query
    select
      (u.gebruikt_op is null and u.verloopt_op > now()) as geldig,
      h.naam                                            as huishouden_naam,
      u.email                                           as uitgenodigde_email
    from uitnodigingen u
    join huishoudens   h on h.id = u.huishouden_id
    where u.token = p_token;

  if not found then
    return query select false::boolean, null::text, null::text;
  end if;
end;
$$;

grant execute on function valideer_uitnodiging(uuid) to anon;


-- ── 5. Storage ────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('recepten-fotos', 'recepten-fotos', true)
on conflict (id) do nothing;

create policy "fotos_select"
  on storage.objects for select
  using (bucket_id = 'recepten-fotos');

create policy "fotos_insert"
  on storage.objects for insert
  with check (bucket_id = 'recepten-fotos' and auth.role() = 'authenticated');

create policy "fotos_delete"
  on storage.objects for delete
  using (bucket_id = 'recepten-fotos' and auth.role() = 'authenticated');


-- ── 6. Seed: standaardcategorieën ────────────────────────────────────────────

insert into categorieen (naam, huishouden_id, volgorde) values
  ('Ontbijt', null, 0),
  ('Lunch',   null, 1),
  ('Diner',   null, 2),
  ('Snack',   null, 3),
  ('Dessert', null, 4);


-- ══════════════════════════════════════════════════════════════════════════════
-- KLAAR
--
-- Let op: als je een "permission denied for schema auth" melding krijgt
-- op de trigger-aanmaakrege (create trigger on_auth_user_created ...),
-- doe dan het volgende:
--   1. Verwijder de twee trigger-regels en voer de rest opnieuw uit
--   2. Ga naar Supabase → Authentication → Hooks
--      → "Run a function after user creation" → selecteer handle_new_user
-- ══════════════════════════════════════════════════════════════════════════════
