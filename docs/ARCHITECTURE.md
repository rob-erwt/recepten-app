# Architectuur – ReceptenApp

> **Laatst bijgewerkt:** 2026-10-09
> **Versie:** 1.1

---

## 🏗️ Overzicht

ReceptenApp is een **full-stack webapplicatie** gebouwd met **Next.js 14** (App Router) en **Supabase** (PostgreSQL + Auth + Storage + Realtime). De applicatie volgt een **server-client architectuur** met duidelijke scheiding van verantwoordelijkheden.

---

## 📦 Technologie Stack

| Laag | Technologie | Versie | Verantwoordelijkheid |
|------|-------------|-------|---------------------|
| **Frontend** | Next.js 14 | 14.2.35 | UI, Routing, Client-side Logic |
| **Styling** | Tailwind CSS | v3 | Stijlen, Responsive Design |
| **Backend** | Supabase | - | Database, Auth, Storage, Realtime |
| **Database** | PostgreSQL | 15+ | Data opslag, Queries |
| **Taal** | TypeScript | 5.x | Typeveiligheid |
| **Testen** | Vitest | - | Unit Tests |
| **Linten** | ESLint | - | Code Kwaliteit |

---

## 🗺️ Architectuur Diagram

```mermaid
flowchart TB
    A[Client Browser] -->|Renders UI| B[Next.js Client Components]
    B -->|State Management| C[React Hooks]
    B -->|Data Fetching| D[Server Actions]
    
    D -->|Calls| E[Next.js Server Components]
    E -->|Direct Queries| F[Supabase Server Client]
    
    F -->|SQL Queries| G[PostgreSQL]
    
    A -->|Auth| R[Supabase Auth]
    R -->|JWT Tokens| C
    
    F -->|Subscribe| W[Supabase Realtime]
    W -->|Live Updates| B
    
    B -->|Upload| U[Supabase Storage]
    U -->|Images| V[recepten-fotos bucket]
```

---

## 🔄 Data Flow

### 1. Recepten Data Flow

```mermaid
flowchart TB
    A[ReceptenLijst.tsx] -->|Filter params| B[haalRecepten Server Action]
    B -->|Query| C[Supabase]
    C -->|Recepten Data| B
    B -->|Result| A
    A -->|Render| D[UI]
    
    D -->|User Action| E[Filter/Page Change]
    E -->|Update State| A
```

**Details:**
1. `ReceptenLijst.tsx` (Client Component) beheert UI state (filters, pagination)
2. Roept `haalRecepten()` Server Action aan met filters
3. Server Action voert Supabase query uit met:
   - `.eq('huishouden_id', ...)` - RLS filter
   - `.ilike('naam', '%term%')` - Naam filter
   - `.in('id', [...])` - Categoriefilter
   - `.range(from, to)` - Paginering
4. Resultaat (max. 25 recepten) wordt teruggegeven
5. Client component rendert de data

---

### 2. Recept Opslaan Flow (Atomisch)

```mermaid
flowchart TB
    A[ReceptFormulier.tsx] -->|Submit| B[sla_recept_op RPC]
    B -->|Start Transaction| C[PostgreSQL]
    C -->|Update recepten| D[recepten table]
    C -->|Delete ingredienten| E[ingredienten table]
    C -->|Insert ingredienten| E
    C -->|Delete stappen| F[stappen table]
    C -->|Insert stappen| F
    C -->|Delete recept_categorieen| G[recept_categorieen table]
    C -->|Insert recept_categorieen| G
    C -->|Commit Transaction| B
    B -->|Return recept_id| A
    A -->|Redirect| H[recepten/id page]
```

**Details:**
- Alle operaties in **eén PostgreSQL transactie** (T-02)
- Bij fout: **geen** gedeeltelijke updates
- Gebruikt `jsonb_array_elements()` voor dynamische arrays

---

### 3. Realtime Boodschappenlijst Flow

```mermaid
flowchart TB
    A[Boodschappenlijst.tsx] -->|Subscribe| B[Supabase Realtime]
    B -->|Changes| C[boodschappenlijst_items table]
    C -->|Broadcast| B
    B -->|Update| A
    A -->|Re-render| D[UI]
    
    E[User] -->|Add/Check/Delete| A
    A -->|Mutate| C
```

**Details:**
- Gebruikt Supabase Realtime voor live updates
- Wijzigingen zichtbaar binnen **3 seconden** voor alle gezinsleden
- Conflicten worden automatisch opgelost

---

## 🗃️ Database Schema

### Core Tabellen (Relaties)

```mermaid
erDiagram
    huishoudens ||--o{ gebruikers : "1:N"
    huishoudens ||--o{ recepten : "1:N"
    huishoudens ||--o{ categorieen : "1:N"
    huishoudens ||--o{ weekmenu : "1:N"
    huishoudens ||--o{ boodschappenlijst_items : "1:N"
    huishoudens ||--o{ uitnodigingen : "1:N"
    
    recepten ||--o{ ingredienten : "1:N"
    recepten ||--o{ stappen : "1:N"
    recepten }|--|| categorieen : "M:N"
    recepten ||--|| weekmenu : "1:1"
```

### Tabel Structuur

#### recepten
```
id: uuid (PK)
huishouden_id: uuid (FK)
naam: string (not null)
beschrijving: text (nullable)
aantal_personen: int (nullable)
bereidingstijd_min: int (nullable)
foto_url: text (nullable)
aangemaakt_door: uuid (FK to auth.users)
aangemaakt_op: timestamptz (default now())
bijgewerkt_op: timestamptz (default now())
```

#### ingredienten
```
id: uuid (PK)
recept_id: uuid (FK)
naam: string (not null)
hoeveelheid: numeric (nullable)
eenheid: string (nullable)
volgorde: int (default 0)
```

#### stappen
```
id: uuid (PK)
recept_id: uuid (FK)
stap_nummer: int (not null)
omschrijving: text (not null)
```

#### categorieen
```
id: uuid (PK)
naam: string (not null)
huishouden_id: uuid (FK, nullable for global categories)
volgorde: int (default 99)
```

---

## 🔐 Security Architectuur

### Authentication Flow

```mermaid
flowchart TB
    A[User] -->|Login| B[Supabase Auth]
    B -->|JWT Token| C[Next.js Middleware]
    C -->|Check| D{Valid Token?}
    D -->|Yes| E[App Pages]
    D -->|No| F[Login Page]
    
    B -->|User Data| G[auth.users table]
    G -->|Trigger| H[handle_new_user function]
    H -->|Create| I[gebruikers table]
    H -->|Create| J[huishoudens table]
```

**Details:**
- **Middleware** (`middleware.ts`) blokkeert alle `/(app)` routes zonder valid JWT
- **Row Level Security (RLS)** op alle tabellen
- **Trigger** `handle_new_user()` koppelt nieuwe gebruikers aan huishouden

---

### RLS Policies

| Tabel | Policy | Conditie |
|-------|--------|----------|
| recepten | select | `huishouden_id = get_huishouden_id()` |
| recepten | insert | `huishouden_id = get_huishouden_id()` |
| recepten | update | `huishouden_id = get_huishouden_id()` |
| recepten | delete | `huishouden_id = get_huishouden_id()` |
| ingredienten | all | `exists (select 1 from recepten where recept_id = ingredienten.recept_id and huishouden_id = get_huishouden_id())` |
| boodschappenlijst_items | all | `huishouden_id = get_huishouden_id()` |

---

## 🚀 Performance Optimalisaties

### 1. Server-Side Filteren (T-01)
- **Voor:** Alle recepten geladen in browser (N=250+)
- **Na:** Alleen gefilterde recepten (max. 25 per pagina)
- **Impact:** Dataverkeer ⬇️ **~90%**

### 2. Atomische Transacties (T-02)
- **Voor:** Losse delete+insert operaties
- **Na:** Één transactie voor alle operaties
- **Impact:** Geen corrupte recepten meer

### 3. Realtime Synchronisatie
- **Technologie:** Supabase Realtime
- **Latency:** < 3 seconden
- **Impact:** Directe updates voor alle gezinsleden

### 4. Debounced Search
- **Debounce:** 300ms
- **Impact:** Minder DB calls bij typen

---

## 📡 API Endpoints

| Endpoint | Methode | Beschrijving | Auth |
|----------|---------|--------------|------|
| `/api/import-recept` | POST | Recept importeren via URL | ✅ |
| `/api/uitnodiging/registreer` | POST | Uitnodiging registreren | ❌ (anon) |

---

## 🔧 Server Actions

| Action | Locatie | Beschrijving |
|--------|---------|--------------|
| `haalRecepten()` | `components/ReceptenLijstServer.tsx` | Gefilterde recepten ophalen |

---

## 📚 Gerelateerde Documenten

- [User Stories](../userstories.md) — Functionele eisen
- [Requirements](../requirements.md) — Technische eisen
- [Acceptatiecriteria](./ACCEPTATIECRITERIA.md) — AC tracking
- [Tech Debt](./TECH-DEBT.md) — Technische verbeterpunten
