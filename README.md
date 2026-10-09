# ReceptenApp

Een minimalistische recepten-app voor gezinnen, gebouwd met Next.js 14 en Supabase. Bewaar, importeer en beheer je favoriete recepten — per huishouden afgeschermd.

---

## 📊 Project Status

| Categorie | Afgerond | Open | % Compleet |
|-----------|----------|------|-------------|
| **User Stories** | 26/32 | 6 | **81%** |
| **Tech Debt** | 2/3 | 1 | **67%** |
| **Tests** | 81/81 | 0 | **100%** |

🔗 **[Open Issues →](https://github.com/rob-erwt/recepten-app/issues)** | 📋 **[Project Board →](https://github.com/rob-erwt/recepten-app/projects)**

---

## 🎯 Openstaande Prioriteiten

### 🔴 Must Have (Kritiek)
- **#3** – [US-U-01-3] Bevestigingsmail bij registratie
- **#4** – [US-U-02-3] Wachtwoord-resetmail implementeren

### 🟡 Should Have
- **#8** – [T-03] Type-veilige Supabase-queries via CLI-codegeneratie

### 🟢 Could Have
- **#5** – [US-R-07] Eigen categorieën beheren (hernoemen/verwijderen)
- **#6** – [US-B-06-3] Deellink tijdslimiet van 24 uur
- **#7** – [US-R-05] Recept importeren via foto (OCR/AI)

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
- Eigen categorieën toevoegen
- Recepten aan meerdere categorieën koppelen
- Filteren op categorie via chips in het receptenoverzicht

### Zoeken & Filteren
- Zoeken op receptnaam (live, met debounce)
- Filteren op categorie
- Zoeken op ingrediënten (AND-logica)
- Filteren op bereidingstijd (≤ 15/30/60 min)
- Server-side filteren en pagineren (25 recepten per pagina)

### Maaltijdplanning (Weekmenu)
- Weekoverzicht van zaterdag t/m vrijdag
- Recepten koppelen aan dagen
- Weekmenu kopiëren naar volgende week
- Real-time synchronisatie tussen gezinsleden

### Boodschappenlijst
- Automatisch genereren vanuit weekmenu
- Ingrediënten samenvoegen (200g + 300g = 500g)
- Handmatig items toevoegen
- Items afvinken
- Real-time synchronisatie tussen gezinsleden
- Exporteren als platte tekst
- Deellink genereren (read-only)

---

## Technische stack

| Onderdeel | Technologie |
|---|---|
| Framework | Next.js 14 (App Router) |
| Backend / database | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Styling | Tailwind CSS v3 |
| Taal | TypeScript |
| Testen | Vitest |
| Linten | ESLint |

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

```sql
schema.sql   → alle tabellen, RLS-beleid, triggers, functies en seed-data
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
  (auth)/             → login & registratie pagina's
  (app)/
    recepten/         → overzicht, detail, nieuw, bewerken, importeren
    recepten/categorieen/  → categoriebeheer
    weekmenu/          → weekplanning
    boodschappenlijst/  → boodschappenlijst
  api/
    import-recept/    → server-side URL-import endpoint
components/           → herbruikbare React-componenten
  ReceptenLijst.tsx         → receptenoverzicht (client-side UI)
  ReceptenLijstServer.tsx  → server-side data fetching (T-01)
  ReceptFormulier.tsx      → recept toevoegen/bewerken
  Boodschappenlijst.tsx    → boodschappenlijst met real-time sync
  WeekMenuOverzicht.tsx    → weekmenu
lib/
  supabase/           → Supabase client (browser + server)
  types.ts            → gedeelde TypeScript-types
  database.types.ts   → Supabase type definities (gegenereerd)
  duplicaten.ts       → ingrediënten samenvoegen logica
  paginering.ts       → pagineringsutilities
middleware.ts         → routebescherming (auth guard)
schema.sql            → volledig databaseschema
migration_*.sql       → losse migraties (worden geconsolideerd in schema.sql)
docs/                 → projectdocumentatie
  TECH-DEBT.md        → tech debt overzicht
```

---

## Scripts

| Script | Beschrijving |
|--------|--------------|
| `npm run dev` | Start development server |
| `npm run build` | Build voor productie |
| `npm run start` | Start productie server |
| `npm run lint` | ESLint controleren |
| `npm test` | Vitest tests uitvoeren |
| `npm run gen-types` | Supabase types genereren |

---

## Omgevingsvariabelen overzicht

Zie `.env.example` voor een compleet overzicht met uitleg.

---

## Documentatie

- [User Stories](userstories.md) — Functionele eisen en status
- [Requirements](requirements.md) — Technische en niet-functionele eisen
- [Tech Debt](docs/TECH-DEBT.md) — Technische verbeterpunten
- [Deploy Handleiding](DEPLOY.md) — Productie deployment

---

## Licentie

Privéproject — geen licentie van toepassing.
