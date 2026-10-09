# Tech Debt – ReceptenApp

> **Laatst bijgewerkt:** 2026-10-09
> **Gerelateerd:** [linear-tech-debt.mjs](../linear-tech-debt.mjs) | [GitHub Issues](https://github.com/rob-erwt/recepten-app/issues?q=label%3Aenhancement)

---

## 📊 Overzicht

| ID | Titel | Prioriteit | Status | Impact | Inspanning | Gerelateerd |
|----|-------|------------|--------|--------|------------|------------|
| T-01 | Server-side filteren en pagineren | ⭐⭐⭐ | ✅ **Opgelost** | ⭐⭐⭐⭐ | ⭐⭐ | [c722fac](https://github.com/rob-erwt/recepten-app/commit/c722fac) |
| T-02 | Atomische opslag via transactie | ⭐⭐⭐ | ✅ **Opgelost** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | [0d68e07](https://github.com/rob-erwt/recepten-app/commit/0d68e07) |
| T-03 | Type-veilige Supabase-queries | ⭐⭐ | ❌ Open | ⭐⭐⭐ | ⭐⭐ | [#8](https://github.com/rob-erwt/recepten-app/issues/8) |
| T-04 | Consolidatie migratiebestanden | ⭐ | ⚠️ Voorgesteld | ⭐ | ⭐ | - |

---

## ✅ Opgeloste Issues

### T-01: Server-side filteren en pagineren in receptenoverzicht

**Commit:** [c722fac](https://github.com/rob-erwt/recepten-app/commit/c722fac)

**Wat is opgelost:**
- Alle filterlogica (naam, categorie, ingrediënten, bereidingstijd) verplaatst naar server-side
- Paginering wordt server-side uitgevoerd (max. 25 recepten per request)
- Count query voor accurate teller
- Debounce (300ms) op zoekveld om DB-calls te beperken

**Implementatie:**
- `components/ReceptenLijstServer.tsx` — Server Action `haalRecepten()`
- `components/ReceptenLijst.tsx` — Client component (alleen UI)
- `app/(app)/recepten/page.tsx` — Haalt huishoudenId op

**Impact:**
- Dataverkeer: **N recepten → max. 25 per request**
- Schaalt lineair met grootte van receptenlijst
- Betere performance bij 250+ recepten

---

### T-02: Atomische opslag van recepten via database-transactie

**Commit:** [0d68e07](https://github.com/rob-erwt/recepten-app/commit/0d68e07)

**Wat is opgelost:**
- RPC functie `sla_recept_op()` voert alle operaties uit in **één PostgreSQL-transactie**
- Geen risico meer op corrupte recepten (lege ingrediënten/stappen)
- Update/insert van recept + delete+insert van ingrediënten + stappen + categorieën

**Implementatie:**
- `migration_atomisch_recept.sql` — RPC functie
- `components/ReceptFormulier.tsx` — Gebruikt `supabase.rpc('sla_recept_op', {...})`

**Impact:**
- **Dataintegriteit** gegarandeerd
- Geen gedeeltelijke updates bij fouten

---

## ❌ Open Issues

### T-03: Type-veilige Supabase-queries via CLI-codegeneratie

**Prioriteit:** ⭐⭐ (Should have)
**GitHub Issue:** [#8](https://github.com/rob-erwt/recepten-app/issues/8)

**Probleem:**
Op meerdere plekken worden `as unknown as`-casts gebruikt voor geneste Supabase-joins:

```typescript
// Voorbeelden in ReceptenLijst.tsx
((r.recept_categorieen ?? []) as unknown as { categorieen: ... }[])
entry.recepten as unknown as ReceptKaart | null
```

Dit verbergt typefouten en maakt schema-wijzigingen onzichtbaar voor de compiler.

**Oplossing:**
1. Genereer typedefinities automatisch met Supabase CLI:
   ```bash
   npx supabase gen types typescript --project-id <id> > lib/database.types.ts
   ```
2. Vervang alle `as unknown as`-casts door de gegenereerde types
3. Gebruik de types in queries voor betere typeveiligheid

**Impact:**
- Schema-wijzigingen direct zichtbaar als compile-fout
- Minder runtime-fouten door verkeerde aannames
- Betere onderhoudbaarheid

**Acceptatiecriteria:**
- [ ] `lib/database.types.ts` is gegenereerd via Supabase CLI
- [ ] Alle `as unknown as`-casts zijn verwijderd
- [ ] Build en tests slagen

---

## ⚠️ Voorgestelde Issues

### T-04: Consolidatie migratiebestanden in schema.sql

**Prioriteit:** ⭐ (Should have)

**Probleem:**
Database schema staat verspreid over meerdere bestanden:
- `schema.sql` (hoofdschema)
- `migration_atomisch_recept.sql` (T-02 RPC functie)
- `migration_realtime_boodschappenlijst.sql` (B-05 realtime)

Dit maakt het lastig om een verse database op te zetten.

**Oplossing:**
Consolideer alle migraties in `schema.sql` in de juiste volgorde:
1. Helper-functies (`get_huishouden_id`)
2. Tabellen
3. RLS policies
4. **Triggers & functies** (inclusief `sla_recept_op` uit `migration_atomisch_recept.sql`)
5. Seed data

**Impact:**
- Één bestand voor complete database setup
- Makkelijker voor nieuwe developers
- Minder kans op gemiste migraties

**Gerelateerd:**
- Commit [d9a2147](https://github.com/rob-erwt/recepten-app/commit/d9a2147) — Deels geconsolideerd
- T-02 RPC functie moet nog toegevoegd worden aan `schema.sql`

---

## 📈 Prioritering

### 🔥 Hoog (Direct oplossen)
1. **T-03** — Type-veiligheid verbeteren (blokkeert betere developer experience)

### 🟡 Medium (Volgende sprint)
2. **T-04** — Consolidatie migratiebestanden (vermindert complexiteit)

### 🟢 Laag (Backlog)
- Geen verdere tech debt bekend

---

## 🔧 Hoe bij te dragen

1. **Kies een issue** uit de openstaande lijst
2. **Maak een branch** aan: `git checkout -b fix/T-03-typeveiligheid`
3. **Implementeer** de oplossing
4. **Test** lokaal met `npm run dev` en `npm test`
5. **Commit** met duidelijke message: `Fix T-03: Type-veilige Supabase queries`
6. **Push** en open een Pull Request

---

## 📚 Gerelateerde Documentatie

- [User Stories](../userstories.md) — Functionele eisen
- [Requirements](../requirements.md) — Technische eisen
- [README](../README.md) — Project overzicht
