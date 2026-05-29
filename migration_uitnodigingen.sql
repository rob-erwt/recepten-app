-- ══════════════════════════════════════════════════════════════════════════════
-- U-04: Gezinslid uitnodigen
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Uitnodigingen-tabel ────────────────────────────────────────────────────

create table uitnodigingen (
  id            uuid        primary key default gen_random_uuid(),
  huishouden_id uuid        not null references huishoudens(id) on delete cascade,
  token         uuid        not null unique default gen_random_uuid(),
  email         text,                        -- optioneel: voor eigen administratie
  aangemaakt_door uuid      not null references auth.users(id) on delete cascade,
  aangemaakt_op timestamptz default now(),
  verloopt_op   timestamptz not null default (now() + interval '7 days'),
  gebruikt_op   timestamptz              -- null = nog geldig
);

alter table uitnodigingen enable row level security;

-- Huishoudenleden: eigen uitnodigingen inzien, aanmaken en intrekken
create policy "uitnodigingen_select"
  on uitnodigingen for select
  using (huishouden_id = get_huishouden_id());

create policy "uitnodigingen_insert"
  on uitnodigingen for insert
  with check (
    huishouden_id = get_huishouden_id()
    and aangemaakt_door = auth.uid()
  );

create policy "uitnodigingen_delete"
  on uitnodigingen for delete
  using (huishouden_id = get_huishouden_id());

-- ── 2. RLS op huishoudens (ontbrak) ──────────────────────────────────────────

alter table huishoudens enable row level security;

create policy "huishoudens_select_eigen"
  on huishoudens for select
  using (id = get_huishouden_id());

-- ── 3. Gezinsleden van hetzelfde huishouden zien elkáars profiel ──────────────

create policy "gebruikers_select_huishouden"
  on gebruikers for select
  using (huishouden_id = get_huishouden_id());

-- ── 4. Openbare tokenvaliatie (security definer — bypast RLS) ─────────────────
--    Wordt aangeroepen door de uitnodigingspagina zonder ingelogde gebruiker.

create or replace function valideer_uitnodiging(p_token uuid)
returns table (
  geldig          boolean,
  huishouden_naam text,
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

-- Anonieme gebruikers (niet ingelogd) mogen de functie aanroepen
grant execute on function valideer_uitnodiging(uuid) to anon;

-- ── 5. Trigger: nieuwe gebruiker via uitnodiging koppelen aan bestaand huishouden

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
    -- Zoek een geldige, ongebruikte en niet-verlopen uitnodiging
    select * into uitnodiging_rec
    from uitnodigingen
    where token     = uitnodiging_token
      and gebruikt_op is null
      and verloopt_op > now();

    if found then
      nieuw_huishouden_id := uitnodiging_rec.huishouden_id;
      -- Markeer de uitnodiging als gebruikt
      update uitnodigingen
      set gebruikt_op = now()
      where id = uitnodiging_rec.id;
    end if;
  end if;

  -- Geen geldige uitnodiging: maak een nieuw huishouden aan
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
