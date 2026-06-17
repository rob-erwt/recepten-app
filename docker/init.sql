-- ============================================================
-- Recepten App – gecombineerd database schema
-- Automatisch uitgevoerd bij eerste start van de db-container
-- ============================================================

-- Huishoudens
create table if not exists huishoudens (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  aangemaakt_op timestamptz default now()
);

-- Gebruikersprofielen
create table if not exists gebruikers (
  id uuid primary key references auth.users(id) on delete cascade,
  huishouden_id uuid references huishoudens(id) on delete set null,
  naam text,
  aangemaakt_op timestamptz default now()
);

create or replace function get_huishouden_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select huishouden_id from gebruikers where id = auth.uid()
$$;

-- Recepten
create table if not exists recepten (
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
create table if not exists ingredienten (
  id uuid primary key default gen_random_uuid(),
  recept_id uuid not null references recepten(id) on delete cascade,
  naam text not null,
  hoeveelheid numeric,
  eenheid text,
  volgorde int default 0
);

-- Bereidingsstappen
create table if not exists stappen (
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

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'gebruikers_select_eigen' and tablename = 'gebruikers') then
    create policy "gebruikers_select_eigen" on gebruikers for select using (id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'gebruikers_update_eigen' and tablename = 'gebruikers') then
    create policy "gebruikers_update_eigen" on gebruikers for update using (id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'recepten_select' and tablename = 'recepten') then
    create policy "recepten_select" on recepten for select using (huishouden_id = get_huishouden_id());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'recepten_insert' and tablename = 'recepten') then
    create policy "recepten_insert" on recepten for insert with check (huishouden_id = get_huishouden_id());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'recepten_update' and tablename = 'recepten') then
    create policy "recepten_update" on recepten for update using (huishouden_id = get_huishouden_id());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'recepten_delete' and tablename = 'recepten') then
    create policy "recepten_delete" on recepten for delete using (huishouden_id = get_huishouden_id());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'ingredienten_select' and tablename = 'ingredienten') then
    create policy "ingredienten_select" on ingredienten for select
      using (exists (select 1 from recepten r where r.id = recept_id and r.huishouden_id = get_huishouden_id()));
  end if;
  if not exists (select 1 from pg_policies where policyname = 'ingredienten_insert' and tablename = 'ingredienten') then
    create policy "ingredienten_insert" on ingredienten for insert
      with check (exists (select 1 from recepten r where r.id = recept_id and r.huishouden_id = get_huishouden_id()));
  end if;
  if not exists (select 1 from pg_policies where policyname = 'ingredienten_update' and tablename = 'ingredienten') then
    create policy "ingredienten_update" on ingredienten for update
      using (exists (select 1 from recepten r where r.id = recept_id and r.huishouden_id = get_huishouden_id()));
  end if;
  if not exists (select 1 from pg_policies where policyname = 'ingredienten_delete' and tablename = 'ingredienten') then
    create policy "ingredienten_delete" on ingredienten for delete
      using (exists (select 1 from recepten r where r.id = recept_id and r.huishouden_id = get_huishouden_id()));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'stappen_select' and tablename = 'stappen') then
    create policy "stappen_select" on stappen for select
      using (exists (select 1 from recepten r where r.id = recept_id and r.huishouden_id = get_huishouden_id()));
  end if;
  if not exists (select 1 from pg_policies where policyname = 'stappen_insert' and tablename = 'stappen') then
    create policy "stappen_insert" on stappen for insert
      with check (exists (select 1 from recepten r where r.id = recept_id and r.huishouden_id = get_huishouden_id()));
  end if;
  if not exists (select 1 from pg_policies where policyname = 'stappen_update' and tablename = 'stappen') then
    create policy "stappen_update" on stappen for update
      using (exists (select 1 from recepten r where r.id = recept_id and r.huishouden_id = get_huishouden_id()));
  end if;
  if not exists (select 1 from pg_policies where policyname = 'stappen_delete' and tablename = 'stappen') then
    create policy "stappen_delete" on stappen for delete
      using (exists (select 1 from recepten r where r.id = recept_id and r.huishouden_id = get_huishouden_id()));
  end if;
end $$;

-- ============================================================
-- Triggers
-- ============================================================

create or replace function update_bijgewerkt_op()
returns trigger language plpgsql as $$
begin
  new.bijgewerkt_op = now();
  return new;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'recepten_bijgewerkt_op') then
    create trigger recepten_bijgewerkt_op
      before update on recepten
      for each row execute function update_bijgewerkt_op();
  end if;
end $$;

create or replace function handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare
  nieuw_huishouden_id uuid;
  gebruiker_naam text;
begin
  gebruiker_naam := coalesce(new.raw_user_meta_data->>'naam', split_part(new.email, '@', 1));
  insert into huishoudens (naam) values (gebruiker_naam || '''s huishouden') returning id into nieuw_huishouden_id;
  insert into gebruikers (id, huishouden_id, naam) values (new.id, nieuw_huishouden_id, gebruiker_naam);
  return new;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function handle_new_user();
  end if;
end $$;

-- ============================================================
-- Categorieën
-- ============================================================

create table if not exists categorieen (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  huishouden_id uuid references huishoudens(id) on delete cascade,
  volgorde int default 99
);

create table if not exists recept_categorieen (
  recept_id uuid not null references recepten(id) on delete cascade,
  categorie_id uuid not null references categorieen(id) on delete cascade,
  primary key (recept_id, categorie_id)
);

alter table categorieen enable row level security;
alter table recept_categorieen enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'categorieen_select' and tablename = 'categorieen') then
    create policy "categorieen_select" on categorieen for select
      using (huishouden_id is null or huishouden_id = get_huishouden_id());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'categorieen_insert' and tablename = 'categorieen') then
    create policy "categorieen_insert" on categorieen for insert with check (huishouden_id = get_huishouden_id());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'categorieen_update' and tablename = 'categorieen') then
    create policy "categorieen_update" on categorieen for update using (huishouden_id = get_huishouden_id());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'categorieen_delete' and tablename = 'categorieen') then
    create policy "categorieen_delete" on categorieen for delete using (huishouden_id = get_huishouden_id());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'recept_categorieen_select' and tablename = 'recept_categorieen') then
    create policy "recept_categorieen_select" on recept_categorieen for select
      using (exists (select 1 from recepten r where r.id = recept_id and r.huishouden_id = get_huishouden_id()));
  end if;
  if not exists (select 1 from pg_policies where policyname = 'recept_categorieen_insert' and tablename = 'recept_categorieen') then
    create policy "recept_categorieen_insert" on recept_categorieen for insert
      with check (exists (select 1 from recepten r where r.id = recept_id and r.huishouden_id = get_huishouden_id()));
  end if;
  if not exists (select 1 from pg_policies where policyname = 'recept_categorieen_delete' and tablename = 'recept_categorieen') then
    create policy "recept_categorieen_delete" on recept_categorieen for delete
      using (exists (select 1 from recepten r where r.id = recept_id and r.huishouden_id = get_huishouden_id()));
  end if;
end $$;

insert into categorieen (naam, huishouden_id, volgorde) values
  ('Ontbijt',  null, 0),
  ('Lunch',    null, 1),
  ('Diner',    null, 2),
  ('Snack',    null, 3),
  ('Dessert',  null, 4)
on conflict do nothing;

-- ============================================================
-- Weekmenu
-- ============================================================

create table if not exists weekmenu (
  id             uuid primary key default gen_random_uuid(),
  huishouden_id  uuid not null references huishoudens(id) on delete cascade,
  datum          date not null,
  recept_id      uuid references recepten(id) on delete set null,
  aangemaakt_op  timestamptz default now(),
  unique (huishouden_id, datum)
);

alter table weekmenu enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'weekmenu_select' and tablename = 'weekmenu') then
    create policy "weekmenu_select" on weekmenu for select using (huishouden_id = get_huishouden_id());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'weekmenu_insert' and tablename = 'weekmenu') then
    create policy "weekmenu_insert" on weekmenu for insert with check (huishouden_id = get_huishouden_id());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'weekmenu_update' and tablename = 'weekmenu') then
    create policy "weekmenu_update" on weekmenu for update using (huishouden_id = get_huishouden_id());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'weekmenu_delete' and tablename = 'weekmenu') then
    create policy "weekmenu_delete" on weekmenu for delete using (huishouden_id = get_huishouden_id());
  end if;
end $$;

-- ============================================================
-- Storage bucket (aangemaakt als storage schema al bestaat)
-- ============================================================

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'storage' and table_name = 'buckets'
  ) then
    insert into storage.buckets (id, name, public)
    values ('recepten-fotos', 'recepten-fotos', true)
    on conflict (id) do nothing;

    if not exists (select 1 from pg_policies where policyname = 'fotos_select' and schemaname = 'storage') then
      create policy "fotos_select" on storage.objects for select using (bucket_id = 'recepten-fotos');
    end if;
    if not exists (select 1 from pg_policies where policyname = 'fotos_insert' and schemaname = 'storage') then
      create policy "fotos_insert" on storage.objects for insert
        with check (bucket_id = 'recepten-fotos' and auth.role() = 'authenticated');
    end if;
    if not exists (select 1 from pg_policies where policyname = 'fotos_delete' and schemaname = 'storage') then
      create policy "fotos_delete" on storage.objects for delete
        using (bucket_id = 'recepten-fotos' and auth.role() = 'authenticated');
    end if;
  end if;
end $$;
