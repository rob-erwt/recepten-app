# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server op http://localhost:3000
npm run build        # productie build
npm run lint         # ESLint (Next.js config)
npm test             # Vitest (eenmalig)
npm run test:watch   # Vitest in watch-modus
```

Tests uitvoeren voor één bestand:
```bash
npx vitest run lib/duplicaten.test.ts
```

## Omgevingsvariabelen

Vereist in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # vereist — registratie op uitnodiging + foto-upload bij import
```

Deployen naar Vercel: zie [DEPLOY.md](DEPLOY.md).

## Architectuur

### Next.js App Router structuur

```
app/
  (auth)/          ← publieke routes: /login, /register
  (app)/           ← beschermde routes (auth guard via middleware.ts)
    recepten/      ← overzicht, detail, nieuw, bewerken, importeren
    recepten/categorieen/
    weekmenu/
  api/import-recept/route.ts          ← server-side URL-import endpoint
  api/uitnodiging/registreer/route.ts ← server-side account aanmaken op uitnodiging
```

`middleware.ts` bewaakt alle routes: `/recepten/*` en `/weekmenu` vereisen een ingelogde gebruiker.

### Registratie is invite-only

Zelfregistratie staat uit in Supabase Auth ("Allow new users to sign up"), dus
`supabase.auth.signUp()` werkt niet vanuit de browser. `/register` is een statische
pagina die naar de uitnodigingsflow verwijst.

Accounts worden aangemaakt door `POST /api/uitnodiging/registreer`: die valideert het
token via de `valideer_uitnodiging` RPC en maakt de gebruiker aan met
`auth.admin.createUser` (service-role-key, `email_confirm: true`). De DB-trigger
`handle_new_user` leest `uitnodiging_token` uit de metadata en koppelt de gebruiker aan
het bestaande huishouden in plaats van een nieuw huishouden te maken. Daarna logt de
client in met `signInWithPassword`.

### Supabase-clients

Twee aparte clients — gebruik de juiste voor de context:
- [lib/supabase/client.ts](lib/supabase/client.ts) — browser (`'use client'` componenten)
- [lib/supabase/server.ts](lib/supabase/server.ts) — Server Components en Route Handlers

Voor admin-operaties (Storage upload zonder RLS) gebruikt `api/import-recept/route.ts` een directe `createClient` met `SUPABASE_SERVICE_ROLE_KEY`.

### Data-architectuur

Alle data is afgeschermd per huishouden via Supabase Row Level Security. De `huishouden_id` zit op recepten, categorieën en weekmenu-entries.

Twee recepttypen in [lib/types.ts](lib/types.ts):
- `ReceptKaart` — lichtgewicht (voor lijstweergave), inclusief geneste `categorieen[]`
- `Recept` — volledig, inclusief `ingredienten[]`, `stappen[]` en `categorie_ids[]`

Categorieën met `huishouden_id = null` zijn systeemcategorieën (standaard vijf). Eigen categorieën hebben een `huishouden_id`.

### Clientside filtering en paginering

`ReceptenLijst` haalt alle recepten in één keer op en filtert/pagineert in de browser. Paginering-logica zit in [lib/paginering.ts](lib/paginering.ts) (25 per pagina).

### URL-import flow

`POST /api/import-recept` → fetch HTML → zoek `schema.org/Recipe` JSON-LD blokken → parseer via helpers in [lib/recept-import.ts](lib/recept-import.ts) → sla foto op in Storage bucket `recepten-fotos` (valt terug op externe URL als service-role-key ontbreekt).

### Dubbele-recepten detectie

[lib/duplicaten.ts](lib/duplicaten.ts) berekent een gecombineerde score (70% naamgelijkenis, 30% ingrediëntenoverlap). Score boven `DREMPELWAARDE` (0.72) toont een waarschuwing bij nieuw/bewerken.

### Tests

Vitest draait alleen op `lib/**/*.test.ts` (pure utility-functies). Componenten en routes zijn niet getest. Geen mocks — functies zijn puur.
