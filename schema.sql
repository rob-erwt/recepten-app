-- ============================================================
-- Recepten App – Database Schema
--
-- STAP 1: Plak ALLES hieronder in de Supabase SQL Editor → Run
-- STAP 2: Zie onderaan voor de auth-trigger instructie
-- ============================================================

-- Huishoudens
create table huishoudens (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  aangemaakt_op timestamptz default now()
);

-- Gebruikersprofielen (verlengt Supabase auth.users)
create table gebruikers (
  id uuid primary key references auth.users(id) on delete cascade,
  huishouden_id uuid references huishoudens(id) on delete set null,
  naam text,
  aangemaakt_op timestamptz default now()
);

-- Helper: huishouden_id van de ingelogde gebruiker (in public-schema, niet auth)
create or replace function get_huishouden_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select huishouden_id from gebruikers where id = auth.uid()
$$;

-- Recepten
create table recepten (
  id uuid primary key default gen_random_uuid(),
  huishouden_id uuid not null references huishoudens(id) on delete cascade,
  naam text not null,
  beschrijving text,
  aantal_personen int,
  bereidingstijd_min int,
  foto_url text,
  aangemaakt_door uuid references auth.users(id),
  aangemaakt_op timestamptz default now(),
  bijgewerkt_op timestamptz default now()
);

-- Ingrediënten
create table ingredienten (
  id uuid primary key default gen_random_uuid(),
  recept_id uuid not null references recepten(id) on delete cascade,
  naam text not null,
  hoeveelheid numeric,
  eenheid text,
  volgorde int default 0
);

-- Bereidingsstappen
create table stappen (
  id uuid primary key default gen_random_uuid(),
  recept_id uuid not null references recepten(id) on delete cascade,
  stap_nummer int not null,
  omschrijving text not null
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table huishoudens enable row level security;
alter table gebruikers enable row level security;
alter table recepten enable row level security;
alter table ingredienten enable row level security;
alter table stappen enable row level security;

-- Gebruikers: eigen profiel lezen en bijwerken
create policy "gebruikers_select_eigen"
  on gebruikers for select
  using (id = auth.uid());

create policy "gebruikers_update_eigen"
  on gebruikers for update
  using (id = auth.uid());

-- Recepten: alleen eigen huishouden
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

-- Ingrediënten: via recept
create policy "ingredienten_select"
  on ingredienten for select
  using (exists (
    select 1 from recepten r
    where r.id = recept_id and r.huishouden_id = get_huishouden_id()
  ));

create policy "ingredienten_insert"
  on ingredienten for insert
  with check (exists (
    select 1 from recepten r
    where r.id = recept_id and r.huishouden_id = get_huishouden_id()
  ));

create policy "ingredienten_update"
  on ingredienten for update
  using (exists (
    select 1 from recepten r
    where r.id = recept_id and r.huishouden_id = get_huishouden_id()
  ));

create policy "ingredienten_delete"
  on ingredienten for delete
  using (exists (
    select 1 from recepten r
    where r.id = recept_id and r.huishouden_id = get_huishouden_id()
  ));

-- Stappen: via recept
create policy "stappen_select"
  on stappen for select
  using (exists (
    select 1 from recepten r
    where r.id = recept_id and r.huishouden_id = get_huishouden_id()
  ));

create policy "stappen_insert"
  on stappen for insert
  with check (exists (
    select 1 from recepten r
    where r.id = recept_id and r.huishouden_id = get_huishouden_id()
  ));

create policy "stappen_update"
  on stappen for update
  using (exists (
    select 1 from recepten r
    where r.id = recept_id and r.huishouden_id = get_huishouden_id()
  ));

create policy "stappen_delete"
  on stappen for delete
  using (exists (
    select 1 from recepten r
    where r.id = recept_id and r.huishouden_id = get_huishouden_id()
  ));

-- ============================================================
-- Triggers
-- ============================================================

-- bijgewerkt_op automatisch updaten
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

-- Nieuw huishouden + gebruikersprofiel aanmaken bij registratie
create or replace function handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare
  nieuw_huishouden_id uuid;
  gebruiker_naam text;
begin
  gebruiker_naam := coalesce(new.raw_user_meta_data->>'naam', split_part(new.email, '@', 1));

  insert into huishoudens (naam)
  values (gebruiker_naam || '''s huishouden')
  returning id into nieuw_huishouden_id;

  insert into gebruikers (id, huishouden_id, naam)
  values (new.id, nieuw_huishouden_id, gebruiker_naam);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- KLAAR! De trigger op auth.users is aangemaakt.
--
-- Als je tóch een "permission denied for schema auth" krijgt
-- op de trigger-regel hierboven, doe dan het volgende:
--
--   1. Verwijder de twee trigger-regels hierboven
--   2. Run de rest van dit script
--   3. Ga in Supabase naar:
--      Authentication → Hooks → "Run a function after user creation"
--      en selecteer daar de functie "handle_new_user"
-- ============================================================
