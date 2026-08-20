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

- **Site URL**: `https://kook-boek.nl`
- **Redirect URLs**: voeg toe
  - `https://kook-boek.nl/**`
  - `https://recepten-app.vercel.app/**` (de Vercel-URL blijft ook werken)

Zolang het domein nog niet werkt (zie stap 5) kun je de Vercel-URL tijdelijk als
Site URL gebruiken en dat later omzetten.

Zonder dit wijzen wachtwoord-herstelmails nog naar `http://localhost:3000`.

## 5. Domein koppelen: kook-boek.nl

Het domein staat bij **TransIP** (nameservers `ns0.transip.net`, `ns1.transip.nl`,
`ns2.transip.eu`), met DNSSEC aan.

### 5a. Domein toevoegen in Vercel

Vercel → project → **Settings** → **Domains** → voeg beide toe:

- `kook-boek.nl`
- `www.kook-boek.nl`

Kies `kook-boek.nl` als primair domein; Vercel zet dan automatisch een redirect
van `www` naar het apex-domein.

### 5b. DNS-records bij TransIP

TransIP-controlepaneel → **Domeinen** → `kook-boek.nl` → **DNS**. Verwijder de
standaard-parkeerrecords voor `@` en `www` en zet neer:

| Type | Naam | TTL | Waarde |
| --- | --- | --- | --- |
| A | `@` | 300 | *het IP-adres dat Vercel toont* |
| CNAME | `www` | 300 | `cname.vercel-dns.com.` |

Het apex-IP moet je **overnemen uit het Vercel-dashboard** en niet uit een
tutorial: Vercel heeft meerdere apex-IP's in gebruik en toont per project het
juiste. Let bij TransIP op de afsluitende punt achter de CNAME-waarde.

Een apex-domein kan geen CNAME hebben (DNS-standaard), vandaar het A-record voor
`@` en een CNAME alleen voor `www`.

### 5c. DNSSEC en nameservers

**Laat de nameservers op TransIP staan.** Records aanpassen binnen TransIP is
veilig: TransIP hertekent de zone zelf. Zou je de nameservers naar Vercel
verzetten zonder eerst DNSSEC uit te schakelen bij TransIP, dan wordt het domein
onbereikbaar met een validatiefout — en dat is een storing die je niet met een
snelle wijziging terugdraait, omdat de oude DS-sleutel nog in de caches van
resolvers zit.

### 5d. Mail

Er staan nu geen MX-records op het domein, dus je breekt niets. Wil je later
e-mail op `kook-boek.nl`, dan kun je MX-records naast de Vercel-records zetten:
die bijten elkaar niet.

### 5e. Wachten en controleren

Het domein is pas op 2026-08-20 geregistreerd en de delegatie was op dat moment
nog niet zichtbaar bij SIDN. Zolang dat zo is, kan geen enkel record werken —
dat is normaal en lost zichzelf op, meestal binnen enkele uren.

Controleren of de delegatie live is:

```bash
dig +short NS kook-boek.nl
```

Zodra daar de TransIP-nameservers verschijnen, controleer je de records zelf:

```bash
dig +short A kook-boek.nl && dig +short CNAME www.kook-boek.nl
```

Vercel vraagt het TLS-certificaat automatisch aan zodra de records kloppen. Ga
daarna terug naar stap 4 en zet de Site URL op `https://kook-boek.nl`.

## 6. Controleren na de deploy

- [ ] `https://kook-boek.nl` laadt (en `https://www.kook-boek.nl` stuurt door)
- [ ] `https://kook-boek.nl/login` werkt met je bestaande account
- [ ] `https://kook-boek.nl/register` toont "Registreren gaat op uitnodiging"
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
