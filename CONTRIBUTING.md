# Contributing – ReceptenApp

Dank je wel voor je interesse in het bijdragen aan ReceptenApp! 🎉

Dit document beschrijft hoe je kunt bijdragen aan het project, of je nu een bug wilt fixen, een nieuwe feature wilt toevoegen, of de documentatie wilt verbeteren.

---

## 📋 Inhoudsopgave

1. [Snelle Start](#-snelle-start)
2. [Project Opzetten](#-project-opzetten)
3. [Bijdragen](#-bijdragen)
4. [Code Stijl](#-code-stijl)
5. [Testen](#-testen)
6. [Pull Requests](#-pull-requests)
7. [Deployment](#-deployment)
8. [Hulp en Ondersteuning](#-hulp-en-ondersteuning)

---

## 🚀 Snelle Start

### Vereisten

- [Node.js](https://nodejs.org/) 18 of hoger
- [Git](https://git-scm.com/)
- Een [Supabase](https://supabase.com/) account (gratis tier volstaat)
- Een code editor (bijv. [VS Code](https://code.visualstudio.com/))

### Repository Clonen

```bash
 git clone git@github.com:rob-erwt/recepten-app.git
 cd recepten-app
 npm install
```

---

## 🛠️ Project Opzetten

### 1. Supabase Project Aanzetten

1. Maak een nieuw project aan op [supabase.com](https://supabase.com)
2. Voer het database schema uit:
   ```bash
   # In Supabase SQL Editor:
   # Voer het volgende uit:
   -- Run schema.sql
   ```
3. Noteer je Supabase credentials (zie hieronder)

### 2. Omgevingsvariabelen Instellen

Maak een `.env.local` bestand in de root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://jouw-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=jouw-anon-key
SUPABASE_SERVICE_ROLE_KEY=jouw-service-role-key

# Optioneel: voor lokale ontwikkeling
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Je vindt de Supabase keys in: **Settings → API**

### 3. Database Initialiseren

```bash
# Als je een verse database hebt, voer dan uit:
# In Supabase SQL Editor:
# 1. schema.sql
# 2. migration_atomisch_recept.sql (als niet in schema.sql)
# 3. migration_realtime_boodschappenlijst.sql (als niet in schema.sql)
```

> **Tip:** Controleer of de `sla_recept_op` functie bestaat in je database.

### 4. Applicatie Starten

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

---

## 🤝 Bijdragen

### 1. Een Issue Vinden

Bekijk de [open issues](https://github.com/rob-erwt/recepten-app/issues) en kies er een die je wilt oplossen. Issues zijn gelabeld met:

- `user-story` — Functionele eisen uit userstories.md
- `enhancement` — Nieuwe features
- `bug` — Bug fixes

**Prioriteiten:**
- 🔴 **Must Have** — Kritieke issues (bv. #3, #4)
- 🟡 **Should Have** — Belangrijke verbeteringen
- 🟢 **Could Have** — Nice-to-have features

### 2. Branch Aanmaken

Gebruik een duidelijke branch naam:

```bash
# Voor user stories
git checkout -b feature/US-U-01-bevestigingsmail

# Voor tech debt
git checkout -b fix/T-03-typeveiligheid

# Voor bug fixes
git checkout -b fix/bug-description
```

### 3. Code Schrijven

Volg de bestaande code stijl en architectuur. Zie [Code Stijl](#-code-stijl) hieronder.

### 4. Testen

Zorg ervoor dat alle tests slagen:

```bash
npm test    # Vitest tests
npm run lint # ESLint
npm run build # Build check
```

### 5. Committen

Gebruik duidelijke commit messages:

```bash
# Goed:
git commit -m "Fix US-U-01-3: Voeg bevestigingsmail toe aan registratie"
git commit -m "Fix T-03: Vervang as unknown as casts door gegenereerde types"

# Slecht:
git commit -m "fix stuff"
git commit -m "wip"
```

Volg de [Conventional Commits](https://www.conventionalcommits.org/) standaard:
- `feat:` — Nieuwe feature
- `fix:` — Bug fix
- `docs:` — Documentatie updates
- `refactor:` — Code refactoring
- `chore:` — Overige wijzigingen

---

## 💻 Code Stijl

### TypeScript

- Gebruik **strict mode** (al in tsconfig.json)
- Voeg **types** toe aan alle functies en variabelen
- Gebruik **interfaces** of **types** voor complexe objecten
- Vermijd `any` en `as unknown as` (zie T-03)

### React

- **Client Components**: Gebruik `'use client'` directive voor componenten met state/effects
- **Server Components**: Default (geen directive nodig)
- **Server Actions**: Gebruik `'use server'` voor data fetching/mutaties
- **Hooks**: Gebruik `useState`, `useEffect`, `useCallback` waar nodig

### Naming Conventions

| Type | Convention | Voorbeeld |
|------|-------------|-----------|
| Components | PascalCase | `ReceptFormulier.tsx` |
| Functions | camelCase | `haalRecepten()` |
| Variables | camelCase | `receptenLijst` |
| Constants | UPPER_SNAKE_CASE | `PAGINA_GROOTTE` |
| Files | kebab-case | `recept-import.ts` |
| CSS Classes | Tailwind utility classes | `bg-primary-500` |

### Best Practices

✅ **Do:**
- Gebruik **Server Actions** voor data mutaties
- Gebruik **Server Components** voor data fetching
- **Debounce** zoekvelden (300ms)
- **Valideer** input aan server-side
- **Gebruik** RLS voor alle database queries

❌ **Don't:**
- Laad alle data client-side (zie T-01)
- Gebruik losse delete+insert zonder transactie (zie T-02)
- Hardcode huishouden_id of user_id
- Gebruik `as unknown as` (zie T-03)

---

## 🧪 Testen

### Vitest

Alle tests staan in de `lib/*.test.ts` bestanden.

```bash
# Alle tests uitvoeren
npm test

# Specifieke test uitvoeren
npm test duplicaten.test.ts

# Watch mode
npm test --watch
```

### Test Structuur

```typescript
// Voorbeeld: lib/paginering.test.ts
import { assert, describe, expect, it } from 'vitest'
import { paginaNummers } from './paginering'

describe('paginaNummers', () => {
  it('toont alle pagina nummers als <= 7', () => {
    expect(paginaNummers(5, 3)).toEqual([1, 2, 3, 4, 5])
  })
  
  it('toont ellipsis voor grote aantallen', () => {
    expect(paginaNummers(10, 1)).toEqual([1, '…', 10])
  })
})
```

### Test Coverage

Streef naar **>80% coverage**. Voeg tests toe voor nieuwe functionaliteit.

---

## 📤 Pull Requests

### Voor het Openen van een PR

1. **Zorg dat alle tests slagen**
   ```bash
   npm test
   npm run lint
   npm run build
   ```

2. **Rebase op main**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

3. **Push je branch**
   ```bash
   git push origin feature/US-U-01-bevestigingsmail
   ```

4. **Open een Pull Request** op GitHub:
   - Gebruik een duidelijke **titel**
   - Voeg een **beschrijving** toe met:
     - Wat is gewijzigd
     - Waarom is het gewijzigd
     - Hoe is het getest
     - Screenshots (indien van toepassing)
   - Link naar het **gerelateerde issue** (bv. `Closes #3`)

### PR Template

```markdown
## Beschrijving

[Beschrijf kort wat deze PR doet]

## Gerelateerde Issues

Closes #3

## Wijzigingen

- [ ] Nieuwe feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentatie
- [ ] Tests

## Testen

- [ ] Alle tests slagen (`npm test`)
- [ ] Linting slaagt (`npm run lint`)
- [ ] Build slaagt (`npm run build`)
- [ ] Handmatig getest in browser

## Screenshots

[Voeg screenshots toe indien van toepassing]
```

### Review Proces

1. **Minimaal 1 approval** vereist voor merge
2. **Alle CI checks** moeten slagen
3. **Code owner** (rob-erwt) moet approven voor merge naar main

---

## 🚀 Deployment

### Staging Deployment

De app wordt automatisch deployed naar staging bij push naar de `main` branch.

### Productie Deployment

Zie [DEPLOY.md](DEPLOY.md) voor gedetailleerde instructies.

### Omgevingsvariabelen voor Productie

Zorg voor de volgende variabelen:

```env
NEXT_PUBLIC_SUPABASE_URL=https://productie-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=productie-anon-key
SUPABASE_SERVICE_ROLE_KEY=productie-service-key
NEXT_PUBLIC_APP_URL=https://kook-boek.nl
```

---

## 🆘 Hulp en Ondersteuning

### Vragen?

- **GitHub Discussions**: [New Discussion](https://github.com/rob-erwt/recepten-app/discussions)
- **Issues**: [New Issue](https://github.com/rob-erwt/recepten-app/issues/new)

### Debuggen

#### Supabase Debuggen

```typescript
// Log Supabase errors
const { data, error } = await supabase.from('recepten').select('*')
if (error) {
  console.error('Supabase error:', error)
}
```

#### Next.js Debuggen

```bash
# Debug mode
npm run dev -- --debug

# Inspect network requests
# Open Chrome DevTools → Network tab
```

### Handige Commands

| Command | Beschrijving |
|---------|--------------|
| `npm run dev` | Start development server |
| `npm run build` | Build voor productie |
| `npm run start` | Start productie server |
| `npm run lint` | ESLint controleren |
| `npm test` | Tests uitvoeren |
| `npm run gen-types` | Supabase types genereren |

---

## 📚 Gerelateerde Documenten

- [README.md](README.md) — Project overzicht
- [User Stories](userstories.md) — Functionele eisen
- [Requirements](requirements.md) — Technische eisen
- [Architectuur](docs/ARCHITECTURE.md) — Technische architectuur
- [Acceptatiecriteria](docs/ACCEPTATIECRITERIA.md) — AC tracking
- [Tech Debt](docs/TECH-DEBT.md) — Technische verbeterpunten
- [Deploy Handleiding](DEPLOY.md) — Productie deployment

---

## 🙏 Bedankt!

Bedankt voor je bijdrage aan ReceptenApp! 🎉

Elke bijdrage, hoe klein ook, wordt gewaardeerd. Door bij te dragen help je het project beter te maken voor iedereen.
