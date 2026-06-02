-- ── T-02: Atomische opslag recepten ──────────────────────────────────────────
-- Één RPC-functie die recept + ingrediënten + stappen + categorieën in één
-- PostgreSQL-transactie opslaat. Vervangt de losse delete+insert calls in
-- ReceptFormulier.tsx.
--
-- Voer uit in de Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function sla_recept_op(
  p_recept_id        uuid,     -- null = nieuw recept, anders bewerken
  p_huishouden_id    uuid,
  p_naam             text,
  p_beschrijving     text,
  p_aantal_personen  int,
  p_bereidingstijd   int,
  p_foto_url         text,
  p_ingredienten     jsonb,    -- [{naam, hoeveelheid, eenheid, volgorde}]
  p_stappen          jsonb,    -- [{stap_nummer, omschrijving}]
  p_categorie_ids    uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_recept_id is not null then
    update recepten set
      naam               = p_naam,
      beschrijving       = p_beschrijving,
      aantal_personen    = p_aantal_personen,
      bereidingstijd_min = p_bereidingstijd,
      foto_url           = p_foto_url,
      bijgewerkt_op      = now()
    where id = p_recept_id
      and huishouden_id = p_huishouden_id;

    if not found then
      raise exception 'Recept niet gevonden of geen toegang';
    end if;

    v_id := p_recept_id;
  else
    insert into recepten (naam, beschrijving, aantal_personen, bereidingstijd_min, foto_url, huishouden_id, aangemaakt_door)
    values (p_naam, p_beschrijving, p_aantal_personen, p_bereidingstijd, p_foto_url, p_huishouden_id, auth.uid())
    returning id into v_id;
  end if;

  -- Ingrediënten vervangen
  delete from ingredienten where recept_id = v_id;
  insert into ingredienten (recept_id, naam, hoeveelheid, eenheid, volgorde)
  select
    v_id,
    item->>'naam',
    nullif(item->>'hoeveelheid', '')::numeric,
    nullif(item->>'eenheid', ''),
    (item->>'volgorde')::int
  from jsonb_array_elements(p_ingredienten) as item
  where nullif(trim(item->>'naam'), '') is not null;

  -- Stappen vervangen
  delete from stappen where recept_id = v_id;
  insert into stappen (recept_id, stap_nummer, omschrijving)
  select
    v_id,
    (item->>'stap_nummer')::int,
    item->>'omschrijving'
  from jsonb_array_elements(p_stappen) as item
  where nullif(trim(item->>'omschrijving'), '') is not null;

  -- Categorieën vervangen
  delete from recept_categorieen where recept_id = v_id;
  if array_length(p_categorie_ids, 1) > 0 then
    insert into recept_categorieen (recept_id, categorie_id)
    select v_id, unnest(p_categorie_ids);
  end if;

  return v_id;
end;
$$;
