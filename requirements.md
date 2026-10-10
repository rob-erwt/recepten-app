# Requirements – Recept App (Gezinsversie)

---

## Implementatiestatus
✅ = Volledig geïmplementeerd | ⚠️ = Deels geïmplementeerd | ❌ = Niet geïmplementeerd

---

## 1. Gebruikers & Toegang

| ID | Requirement | MoSCoW | Status | Commit | Opmerkingen |
|----|-------------|--------|--------|--------|-------------|
| U-01 | De app is toegankelijk via een webbrowser (geen installatie vereist). | Must have | ✅ | `4e8942b` | Next.js app |
| U-02 | De app ondersteunt meerdere gezinsleden binnen één gedeeld account (huishouden). | Must have | ✅ | `4e8942b` | Gebruikers tabel met huishouden_id |
| U-03 | Inloggen is vereist om recepten en planningen te bekijken of te bewerken. | Must have | ✅ | `4e8942b` | Middleware auth check |
| U-05 | Gebruikers kunnen een wachtwoord-resetmail aanvragen. | Must have | ✅ | Nieuwe implementatie | `app/(auth)/reset/*` |
| U-06 | Gebruikers ontvangen een bevestigingsmail na registratie. | Must have | ✅ | Nieuwe implementatie | US-U-01-3 in `app/api/uitnodiging/registreer/route.ts` |
| U-04 | Er is een uitnodigingsfunctie waarmee gezinsleden toegang kunnen krijgen tot het gedeelde account. | Should have | ✅ | `ef68fd4` | Uitnodigingen tabel + deellinks |

---

## 2. Responsive Design & Platform

| ID | Requirement | MoSCoW | Status | Commit | Opmerkingen |
|----|-------------|--------|--------|--------|-------------|
| P-01 | De interface is volledig responsief en geoptimaliseerd voor smartphones (≥ 375px). | Must have | ✅ | `4e8942b` | Tailwind CSS |
| P-02 | De interface is volledig responsief en geoptimaliseerd voor tablets (≥ 768px). | Must have | ✅ | `4e8942b` | Tailwind CSS |
| P-03 | De app werkt correct in de meest recente versies van Chrome, Safari en Firefox. | Must have | ✅ | `4e8942b` | Getest |
| P-04 | Knoppen en invoervelden zijn touch-vriendelijk (minimaal 44×44px aanraakoppervlak). | Must have | ✅ | `4e8942b` | Tailwind classes |

---

## 3. Recepten – Opslaan & Bewerken

| ID | Requirement | MoSCoW | Status | Commit | Opmerkingen |
|----|-------------|--------|--------|--------|-------------|
| R-01 | Een recept bevat minimaal: naam, ingrediënten (met hoeveelheid en eenheid), bereidingsstappen, aantal personen, bereidingstijd en een optionele foto. | Must have | ✅ | `4e8942b` | Database schema |
| R-02 | Gebruikers kunnen recepten handmatig invoeren via een gestructureerd formulier. | Must have | ✅ | `4e8942b` | `ReceptFormulier.tsx` |
| R-03 | Gebruikers kunnen een recept importeren door een URL te plakken; de app haalt automatisch de receptgegevens op. | Should have | ✅ | `744ce2b` | `app/api/import-recept/route.ts` |
| R-04 | Gebruikers kunnen een foto uploaden van een recept; de app extraheert de receptinformatie automatisch via AI/OCR. | Could have | ❌ | - | **Niet geïmplementeerd** |
| R-05 | Geïmporteerde of geëxtraheerde recepten zijn bewerkbaar vóór definitieve opslag. | Must have | ✅ | `4e8942b` | Import opent bewerkformulier |
| R-06 | Gebruikers kunnen een bestaand recept op elk moment bewerken. | Must have | ✅ | `4e8942b` | `ReceptFormulier.tsx` |
| R-07 | Gebruikers kunnen een recept verwijderen, met een bevestigingsstap ter voorkoming van ongewenste verwijdering. | Must have | ✅ | `4e8942b` | `VerwijderKnop.tsx` |
| R-08 | Recepten kunnen worden ingedeeld in categorieën (bijv. ontbijt, lunch, diner, snack, dessert). | Should have | ✅ | `4e8942b` | `CategorieenBeheer.tsx` |
| R-09 | Gebruikers kunnen eigen categorieën aanmaken en beheren. | Could have | ⚠️ | - | **Hernoemen/verwijderen ontbreekt** |
| R-10 | Een recept kan aan meerdere categorieën worden gekoppeld. | Could have | ✅ | `4e8942b` | recept_categorieen tabel |

---

## 4. Zoeken & Filteren

| ID | Requirement | MoSCoW | Status | Commit | Opmerkingen |
|----|-------------|--------|--------|--------|-------------|
| Z-01 | Gebruikers kunnen vrij zoeken op naam van het recept. | Must have | ✅ | `a161d4c` | Server-side filter |
| Z-02 | Gebruikers kunnen filteren op categorie. | Should have | ✅ | `a161d4c` | Server-side filter |
| Z-03 | Gebruikers kunnen zoeken op één of meerdere ingrediënten (recepten die deze ingrediënten bevatten). | Should have | ✅ | `96cdb78` | AND-logica |
| Z-04 | Gebruikers kunnen filteren op bereidingstijd (bijv. ≤ 30 minuten). | Could have | ✅ | `72644d6` | Werkt |
| Z-05 | Zoekresultaten worden direct bijgewerkt tijdens het typen (live search). | Should have | ✅ | `a161d4c` | Debounce 300ms |

---

## 5. Maaltijdplanning (Weekmenu)

| ID | Requirement | MoSCoW | Status | Commit | Opmerkingen |
|----|-------------|--------|--------|--------|-------------|
| M-01 | Gebruikers kunnen een weekoverzicht bekijken van zaterdag t/m vrijdag. | Should have | ✅ | `744ce2b` | `WeekMenuOverzicht.tsx` |
| M-02 | Gebruikers kunnen een recept uit hun collectie koppelen aan een dag als diner. | Should have | ✅ | `744ce2b` | Werkt |
| M-03 | Het weekmenu is zichtbaar en bewerkbaar voor alle gezinsleden. | Should have | ✅ | `744ce2b` | Real-time via Supabase |
| M-04 | Gebruikers kunnen het weekmenu kopiëren naar een volgende week als startpunt. | Could have | ✅ | `44f51a6` | Werkt |

---

## 6. Boodschappenlijst

| ID | Requirement | MoSCoW | Status | Commit | Opmerkingen |
|----|-------------|--------|--------|--------|-------------|
| B-01 | Gebruikers kunnen automatisch een boodschappenlijst genereren op basis van de recepten in het weekmenu. | Should have | ✅ | `a5d7d98` | Werkt |
| B-02 | Ingrediënten van hetzelfde type worden samengevoegd en opgeteld (bijv. 200g + 300g bloem = 500g bloem). | Could have | ✅ | `00169cb` | `lib/duplicaten.ts` |
| B-03 | Gebruikers kunnen handmatig items toevoegen aan de boodschappenlijst. | Should have | ✅ | `a5d7d98` | Werkt |
| B-04 | Gebruikers kunnen items op de boodschappenlijst afvinken. | Should have | ✅ | `a5d7d98` | Werkt |
| B-05 | De boodschappenlijst is gedeeld en real-time gesynchroniseerd voor alle gezinsleden. | Could have | ✅ | `552cfc0` | Supabase Realtime |
| B-06 | Gebruikers kunnen de boodschappenlijst exporteren of delen (bijv. als tekst of via een deellink). | Could have | ⚠️ | `75fe066` | **Deellink tijdslimiet ontbreekt** |

---

## 7. Niet-functionele Requirements

| ID | Requirement | MoSCoW | Status | Commit | Opmerkingen |
|----|-------------|--------|--------|--------|-------------|
| NF-01 | De app vereist een internetverbinding; offline gebruik wordt niet ondersteund. | Must have | ✅ | `4e8942b` | Next.js server-side |
| NF-02 | Paginalaadtijd is ≤ 3 seconden bij een standaard 4G-verbinding. | Must have | ✅ | `a161d4c` | Server-side filteren (T-01) |
| NF-03 | Receptdata en gebruikersgegevens worden opgeslagen in een beveiligde cloudomgeving. | Must have | ✅ | `4e8942b` | Supabase |
| NF-04 | De app voldoet aan de AVG/GDPR voor opslag en verwerking van persoonsgegevens. | Must have | ✅ | `4e8942b` | Supabase compliance |
| NF-05 | De applicatie is schaalbaar zodat toekomstige functionaliteit (bijv. meerdere huishoudens) toegevoegd kan worden. | Won't have | ❌ | - | Uit scope |

---

## 8. Buiten Scope (deze versie)

- Offline modus
- Dieet- en allergenenfilters
- Calorie- of voedingswaardentracking
- Publiek delen van recepten met andere gebruikers buiten het gezin
- Native mobiele app (iOS/Android)

---

## Openstaande Issues

### Must Have (Kritiek)
- **U-01-3**: Bevestigingsmail bij registratie (US-U-01 AC3)
- **U-02-3**: Wachtwoord-resetmail (US-U-02 AC3)

### Should Have
- **R-09**: Categorieën hernoemen en verwijderen (US-R-07 AC2-4)
- **B-06-3**: Deellink tijdslimiet van 24 uur (US-B-06 AC3)

### Could Have
- **R-04**: Recept importeren via foto met OCR/AI (US-R-05)

### Tech Debt
- **T-03**: Type-veilige Supabase-queries (verwijder `as unknown as` casts)

---

## GitHub Issues
Zie: [rob-erwt/recepten-app/issues](https://github.com/rob-erwt/recepten-app/issues) voor gedetailleerde tracking.
