-- ============================================================
-- Migratie: Categorieën & recept-koppeling
-- Plak dit in de Supabase SQL Editor en klik op "Run"
-- ============================================================

-- Categorieën-tabel
-- huishouden_id = NULL  →  standaardcategorie (voor iedereen zichtbaar)
-- huishouden_id = <id>  →  eigen categorie van dat huishouden
create table categorieen (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  huishouden_id uuid references huishoudens(id) on delete cascade,
  volgorde int default 99
);

-- Recept ↔ Categorie (many-to-many)
create table recept_categorieen (
  recept_id uuid not null references recepten(id) on delete cascade,
  categorie_id uuid not null references categorieen(id) on delete cascade,
  primary key (recept_id, categorie_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table categorieen enable row level security;
alter table recept_categorieen enable row level security;

-- Categorieën: standaard (null) of eigen huishouden zichtbaar
create policy "categorieen_select"
  on categorieen for select
  using (huishouden_id is null or huishouden_id = get_huishouden_id());

-- Recept-categoriekoppelingen: via recept van eigen huishouden
create policy "recept_categorieen_select"
  on recept_categorieen for select
  using (exists (
    select 1 from recepten r
    where r.id = recept_id and r.huishouden_id = get_huishouden_id()
  ));

create policy "recept_categorieen_insert"
  on recept_categorieen for insert
  with check (exists (
    select 1 from recepten r
    where r.id = recept_id and r.huishouden_id = get_huishouden_id()
  ));

create policy "recept_categorieen_delete"
  on recept_categorieen for delete
  using (exists (
    select 1 from recepten r
    where r.id = recept_id and r.huishouden_id = get_huishouden_id()
  ));

-- ============================================================
-- Standaardcategorieën
-- ============================================================

insert into categorieen (naam, huishouden_id, volgorde) values
  ('Ontbijt',  null, 0),
  ('Lunch',    null, 1),
  ('Diner',    null, 2),
  ('Snack',    null, 3),
  ('Dessert',  null, 4);
