# Deployen naar Vercel

De app is invite-only: alleen wie een uitnodigingslink krijgt van een bestaand
huishoudenlid kan een account aanmaken. Dat wordt op twee plekken afgedwongen —
in Supabase (zelfregistratie uit) en in de app (`/api/uitnodiging/registreer`).
Stap 3 hieronder is dus geen optie maar een vereiste.

## 1. Project importeren in Vercel

1. Ga naar [vercel.com/new](https://vercel.com/new) en log in met je GitHub-account.
2. Kies **Import Git Repository** → `rob-erwt/recepten-app`.
3. Framework Preset: **Next.js** (wordt automatisch gedetecteerd). Build command,
   output directory en install command hoef je niet aan te passen.
4. Deploy nog **niet** starten — zet eerst de omgevingsvariabelen (stap 2).

## 2. Omgevingsvariabelen

Onder **Environment Variables** deze drie toevoegen, met de waarden uit je
lokale `.env.local`. Zet ze voor alle drie de omgevingen (Production, Preview,
Development):

| Naam | Zichtbaarheid |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | publiek (staat in de browser-bundle) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publiek (staat in de browser-bundle) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server-only — nooit een `NEXT_PUBLIC_`-prefix** |

De service-role-key omzeilt Row Level Security volledig. Met een
`NEXT_PUBLIC_`-prefix zou hij in de JavaScript-bundle belanden en kan iedere
bezoeker alle huishoudens uitlezen en aanpassen.

Klik daarna op **Deploy**. Je krijgt een URL als `recepten-app.vercel.app`.

## 3. Supabase: zelfregistratie uitzetten

Dit is wat invite-only écht afdwingt. De anon-key staat publiek in de
browser-bundle, dus zolang zelfregistratie aan staat kan iemand rechtstreeks een
account aanmaken bij Supabase — buiten de app om.

Supabase Dashboard → **Authentication** → **Sign In / Providers** → **Email**:

- **Allow new users to sign up** → **uit**
- **Confirm email** → mag aan blijven (raakt uitnodigingen niet, zie hieronder)

Uitnodigingen blijven werken omdat `/api/uitnodiging/registreer` het account
server-side aanmaakt met de service-role-key, pas nadat het token gevalideerd is.
Dat account wordt direct als bevestigd aangemaakt, dus de uitgenodigde kan
meteen inloggen zonder bevestigingsmail.

## 4. Supabase: URL-configuratie

Supabase Dashboard → **Authentication** → **URL Configuration**:

- **Site URL**: `https://jouw-domein.nl`
- **Redirect URLs**: voeg toe
  - `https://jouw-domein.nl/**`
  - `https://recepten-app.vercel.app/**` (de Vercel-URL blijft ook werken)

Zonder dit wijzen wachtwoord-herstelmails nog naar `http://localhost:3000`.

## 5. Eigen domein koppelen

Vercel → project → **Settings** → **Domains** → domein toevoegen. Vercel toont
daarna de exacte DNS-records die je bij je registrar moet zetten. Meestal:

**Subdomein** (bijv. `recepten.jouw-domein.nl`):

| Type | Naam | Waarde |
| --- | --- | --- |
| CNAME | `recepten` | `cname.vercel-dns.com` |

**Apex-domein** (bijv. `jouw-domein.nl`):

| Type | Naam | Waarde |
| --- | --- | --- |
| A | `@` | `76.76.21.21` |

Neem de waarden over die Vercel zelf laat zien — die zijn leidend. DNS-propagatie
duurt meestal minuten, soms tot een uur. Het TLS-certificaat regelt Vercel
automatisch zodra de records kloppen.

Werkt het domein? Ga terug naar stap 4 en zet de Site URL op het definitieve
domein.

## 6. Controleren na de deploy

- [ ] `https://<domein>/login` laadt en inloggen met je bestaande account werkt
- [ ] `https://<domein>/register` toont "Registreren gaat op uitnodiging"
- [ ] Recepten, weekmenu en boodschappenlijst laden met je eigen data
- [ ] Instellingen → uitnodiging aanmaken geeft een link op het nieuwe domein
      (niet op `localhost`)
- [ ] Die uitnodigingslink in een privé-venster openen → account aanmaken →
      je komt direct ingelogd in het huishouden
- [ ] Een recept importeren via URL → de foto komt in Supabase Storage terecht
      (dit test of `SUPABASE_SERVICE_ROLE_KEY` goed staat)

## Doorlopend

Elke push naar `main` triggert automatisch een productie-deploy. Pushes naar
andere branches krijgen een preview-URL. Die preview-URL's zijn publiek
raadbaar maar tonen niks zonder inlog, en dankzij stap 4 werken auth-redirects
er niet — bewust.

Het gratis Hobby-plan van Vercel is bedoeld voor niet-commercieel gebruik.
