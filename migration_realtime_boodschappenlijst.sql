-- ── B-05: Real-time synchronisatie boodschappenlijst ─────────────────────────
-- Zet Supabase Realtime aan voor boodschappenlijst_items, zodat gezinsleden
-- elkaars wijzigingen (toevoegen, afvinken, verwijderen) direct zien zonder
-- de pagina te verversen.
--
-- REPLICA IDENTITY FULL is nodig zodat DELETE-events óók de huishouden_id
-- meesturen. Zonder dit bevat het 'old' record bij een delete alleen de
-- primaire sleutel, waardoor de client-side filter (huishouden_id=eq.X) de
-- delete-events niet ontvangt.
--
-- Voer uit in de Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

alter table boodschappenlijst_items replica identity full;

alter publication supabase_realtime add table boodschappenlijst_items;
