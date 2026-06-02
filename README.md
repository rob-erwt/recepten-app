# ReceptenApp

Een minimalistische recepten-app voor gezinnen, gebouwd met Next.js 14 en Supabase. Bewaar, importeer en beheer je favoriete recepten — per huishouden afgeschermd.

---

## Functionaliteiten

### Authenticatie
- Registreren met naam, e-mailadres en wachtwoord
- Inloggen en uitloggen
- Bij registratie wordt automatisch een eigen huishouden aangemaakt
- Alle recepten zijn strikt afgeschermd per huishouden (Row Level Security)

### Recepten
- **Overzicht** met zoekbalk (live filteren op naam) en categorie-filterchips
- **Detailpagina** met foto, ingrediënten, bereidingsstappen, bereidingstijd en aantal personen
- **Handmatig toevoegen** via een formulier met dynamische ingrediënten- en stappenlijst
- **Importeren via URL** — plak een receptpagina-URL (Albert Heijn, Allerhande, Jumbo, 15gram, etc.) en de app haalt automatisch naam, ingrediënten, stappen en foto op via schema.org/Recipe JSON-LD
- **Bewerken** van bestaande recepten
- **Verwijderen** met bevestigingsdialoog
- **Foto's**: automatisch meegeïmporteerd bij URL-import, of handmatig uploaden (JPG, PNG, WebP, max 10 MB)
- **Foto lightbox**: klik op een receptfoto om hem vergroot te bekijken
- **Dubbele recepten detectie**: waarschuwing als een nieuw recept sterk lijkt op een bestaand recept (op basis van naam en ingrediënten)

### Categorieën
- Vijf standaardcategorieën: Ontbijt, Lunch, Diner, Snack, Dessert
- Eigen categorieën toevoegen, hernoemen en verwijderen
- Recepten aan meerdere categorieën koppelen
- Filteren op categorie via chips in het receptenoverzicht

---

## Technische stack

| Onderdeel | Technologie |
|---|---|
| Framework | Next.js 14 (App Router) |
| Backend / database | Supabase (PostgreSQL + Auth + Storage) |
| Styling | Tailwind CSS v3 |
| Taal | TypeScript |

---

## Installatie

### Vereisten
- Node.js 18 of hoger
- Een [Supabase](https://supabase.com)-account (gratis tier volstaat)

### 1. Repository klonen

```bash
git clone git@github.com:rob-erwt/recepten-app.git
cd recepten-app
npm install
```

### 2. Supabase project aanmaken

1. Maak een nieuw project aan op [supabase.com](https://supabase.com)
2. Ga naar **SQL Editor** en voer het volgende script uit:

```
schema.sql   ← alle tabellen, RLS-beleid, triggers, functies en seed-data
```

> **Let op:** Als `schema.sql` een fout geeft op de trigger-regel (`permission denied for schema auth`), verwijder dan de twee `create trigger`-regels onderaan het script, run het opnieuw en stel de trigger daarna in via **Supabase Dashboard → Authentication → Hooks → "Run a function after user creation" → `handle_new_user`**.

### 3. Omgevingsvariabelen instellen

Maak een bestand `.env.local` aan in de root van het project (nooit committen — staat al in `.gitignore`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://jouw-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=jouw-anon-key
SUPABASE_SERVICE_ROLE_KEY=jouw-service-role-key
```

Je vindt deze waarden in je Supabase project onder **Settings → API**.

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — `anon` / `public` key
- `SUPABASE_SERVICE_ROLE_KEY` — `service_role` key (alleen voor server-side foto-upload bij URL-import; optioneel maar aanbevolen)

### 4. App starten

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser. Registreer een account en begin met recepten toevoegen.

---

## Projectstructuur

```
app/
  (auth)/             ← login & registratie pagina's
  (app)/
    recepten/         ← overzicht, detail, nieuw, bewerken, importeren
    recepten/categorieen/  ← categoriebeheer
  api/
    import-recept/    ← server-side URL-import endpoint
components/           ← herbruikbare React-componenten
lib/
  supabase/           ← Supabase client (browser + server)
  types.ts            ← gedeelde TypeScript-types
middleware.ts         ← routebescherming (auth guard)
schema.sql            ← volledig databaseschema (tabellen, RLS, triggers, seed)
```

---

## Omgevingsvariabelen overzicht

Zie `.env.example` voor een compleet overzicht met uitleg.

---

## Licentie

Privéproject — geen licentie van toepassing.
