-- ============================================================
-- Migratie: schrijfrechten voor eigen categorieën
-- Plak dit in de Supabase SQL Editor en klik op "Run"
-- ============================================================

-- Eigen categorieën toevoegen
create policy "categorieen_insert"
  on categorieen for insert
  with check (huishouden_id = get_huishouden_id());

-- Eigen categorieën hernoemen (alleen eigen, niet standaard)
create policy "categorieen_update"
  on categorieen for update
  using (huishouden_id = get_huishouden_id());

-- Eigen categorieën verwijderen (cascade verwijdert ook recept_categorieen)
create policy "categorieen_delete"
  on categorieen for delete
  using (huishouden_id = get_huishouden_id());
