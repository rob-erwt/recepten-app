# User Stories – Recept App (Gezinsversie)

> **Formaat:** Als [gebruiker] wil ik [functie], zodat [waarde].
> Elke story bevat acceptatiecriteria (AC) die bepalen wanneer de story als "done" beschouwd wordt.
>
> **Implementatiestatus:**
> ✅ = Volledig geïmplementeerd | ⚠️ = Deels geïmplementeerd | ❌ = Niet geïmplementeerd

---

## 1. Gebruikers & Toegang

---

### US-U-01 · Registreren van een huishouden `Must have` ✅
**Als** nieuwe gebruiker **wil ik** een account aanmaken voor mijn huishouden, **zodat** mijn gezin samen recepten en planningen kan beheren.

**Acceptatiecriteria:**
- [x] Gebruiker kan een account aanmaken met e-mailadres en wachtwoord.
- [x] Na registratie wordt een huishouden automatisch aangemaakt.
- [ ] Gebruiker ontvangt een bevestigingsmail. *(Open: US-U-01-3)*
- [x] Bij een al bestaand e-mailadres krijgt de gebruiker een duidelijke foutmelding.

**Implementatie:** `app/(auth)/register/page.tsx`, `handle_new_user()` trigger
**Commit:** `4e8942b`, `638591`

---

### US-U-02 · Inloggen `Must have` ✅
**Als** bestaande gebruiker **wil ik** kunnen inloggen, **zodat** ik toegang krijg tot de recepten en planning van mijn huishouden.

**Acceptatiecriteria:**
- [x] Gebruiker kan inloggen met e-mailadres en wachtwoord.
- [x] Bij onjuiste gegevens verschijnt een foutmelding (zonder aan te geven welk veld onjuist is).
- [ ] Gebruiker kan een wachtwoord-resetmail aanvragen. *(Open: US-U-02-3)*
- [x] Na inloggen wordt de gebruiker doorgestuurd naar de receptenlijst.

**Implementatie:** `app/(auth)/login/page.tsx`
**Commit:** `4e8942b`

---

### US-U-03 · Uitloggen `Must have` ✅
**Als** ingelogde gebruiker **wil ik** kunnen uitloggen, **zodat** anderen op mijn apparaat geen toegang hebben tot mijn gegevens.

**Acceptatiecriteria:**
- [x] Uitlogknop is altijd bereikbaar via het hoofdmenu.
- [x] Na uitloggen wordt de gebruiker teruggestuurd naar de inlogpagina.
- [x] Na uitloggen zijn geen gegevens meer zichtbaar zonder opnieuw in te loggen.

**Implementatie:** `components/Nav.tsx`
**Commit:** `4e8942b`

---

### US-U-04 · Gezinslid uitnodigen `Should have` ✅
**Als** beheerder van het huishouden **wil ik** gezinsleden kunnen uitnodigen, **zodat** zij toegang krijgen tot dezelfde recepten en planning.

**Acceptatiecriteria:**
- [x] Beheerder kan een uitnodiging versturen via e-mailadres.
- [x] Ontvanger krijgt een e-mail met een uitnodigingslink (geldig voor 7 dagen).
- [x] Via de link kan de ontvanger een account aanmaken dat gekoppeld is aan het bestaande huishouden.
- [x] De beheerder kan uitstaande uitnodigingen intrekken.
- [x] Maximaal 10 gezinsleden per huishouden.

**Implementatie:** `components/UitnodigingenBeheer.tsx`, `app/api/uitnodiging/registreer/route.ts`
**Commit:** `ef68fd4`, `638591`

---

## 2. Recepten – Opslaan & Bewerken

---

### US-R-01 · Recept handmatig invoeren `Must have` ✅
**Als** gebruiker **wil ik** een recept handmatig kunnen invoeren, **zodat** ik mijn eigen recepten kan opslaan in de app.

**Acceptatiecriteria:**
- [x] Formulier bevat velden voor: naam, categorie, aantal personen, bereidingstijd, ingrediënten (naam, hoeveelheid, eenheid) en bereidingsstappen.
- [x] Ingrediënten en stappen kunnen dynamisch worden toegevoegd en verwijderd.
- [x] Een foto is optioneel toe te voegen via upload.
- [x] Naam is een verplicht veld; overige velden zijn optioneel.
- [x] Opgeslagen recept is direct zichtbaar in de receptenlijst.

**Implementatie:** `components/ReceptFormulier.tsx`
**Commit:** `4e8942b`

---

### US-R-02 · Recept bewerken `Must have` ✅
**Als** gebruiker **wil ik** een bestaand recept kunnen bewerken, **zodat** ik fouten kan corrigeren of het recept kan verbeteren.

**Acceptatiecriteria:**
- [x] Alle velden van een recept zijn bewerkbaar.
- [x] Wijzigingen worden pas opgeslagen na bevestiging via een "Opslaan"-knop.
- [x] Gebruiker kan bewerkingen annuleren zonder dat wijzigingen worden opgeslagen.
- [x] Bewerkingen zijn direct zichtbaar voor alle gezinsleden.

**Implementatie:** `components/ReceptFormulier.tsx` (bewerk-modus)
**Commit:** `4e8942b`

---

### US-R-03 · Recept verwijderen `Must have` ✅
**Als** gebruiker **wil ik** een recept kunnen verwijderen, **zodat** mijn receptenlijst overzichtelijk blijft.

**Acceptatiecriteria:**
- [x] Verwijderknop is beschikbaar op de detailpagina van een recept.
- [x] Vóór verwijdering verschijnt een bevestigingsdialoog.
- [x] Na verwijdering verdwijnt het recept uit de lijst en uit eventuele weekplanningen.
- [x] Verwijdering is voor alle gezinsleden direct zichtbaar.

**Implementatie:** `components/VerwijderKnop.tsx`
**Commit:** `4e8942b`

---

### US-R-04 · Recept importeren via URL `Should have` ✅
**Als** gebruiker **wil ik** een recept kunnen importeren via een URL, **zodat** ik recepten van websites snel kan opslaan zonder alles over te typen.

**Acceptatiecriteria:**
- [x] Gebruiker kan een URL plakken in een importveld.
- [x] De app extraheert automatisch: naam, ingrediënten en bereidingsstappen (indien beschikbaar op de pagina).
- [x] Het geïmporteerde recept wordt geopend in het bewerkformulier vóór opslag.
- [x] Als de URL niet herkend wordt of extractie mislukt, krijgt de gebruiker een duidelijke foutmelding.
- [x] Gebruiker kan het recept alsnog handmatig aanvullen na een mislukte import.

**Implementatie:** `app/(app)/recepten/importeren/page.tsx`, `app/api/import-recept/route.ts`
**Commit:** `744ce2b`

---

### US-R-05 · Recept importeren via foto `Could have` ❌
**Als** gebruiker **wil ik** een foto van een recept kunnen uploaden, **zodat** ik een recept uit een kookboek of tijdschrift snel kan digitaliseren.

**Acceptatiecriteria:**
- [ ] Gebruiker kan een foto uploaden (JPG, PNG; max. 10 MB).
- [ ] De app extraheert automatisch zoveel mogelijk receptinformatie via OCR/AI.
- [ ] Het geëxtraheerde recept wordt geopend in het bewerkformulier vóór opslag.
- [ ] De gebruiker ziet een duidelijke melding dat het resultaat gecontroleerd moet worden.
- [ ] Bij een onleesbare of irrelevante foto verschijnt een foutmelding.

**Status:** Niet geïmplementeerd - vereist externe OCR/AI service
**Issue:** #US-R-05

---

### US-R-06 · Recept indelen in categorie `Should have` ✅
**Als** gebruiker **wil ik** een recept kunnen indelen in een categorie, **zodat** ik mijn recepten overzichtelijk kan organiseren.

**Acceptatiecriteria:**
- [x] Bij het aanmaken of bewerken van een recept kan een categorie worden geselecteerd.
- [x] Standaardcategorieën zijn beschikbaar: ontbijt, lunch, diner, snack, dessert.
- [x] Een recept kan aan meerdere categorieën worden gekoppeld.
- [x] Recepten zonder categorie zijn zichtbaar onder "Overig".

**Implementatie:** `components/ReceptFormulier.tsx`, `components/CategorieenBeheer.tsx`
**Commit:** `4e8942b`

---

### US-R-07 · Eigen categorieën beheren `Could have` ⚠️
**Als** gebruiker **wil ik** eigen categorieën kunnen aanmaken en verwijderen, **zodat** ik de indeling kan afstemmen op onze gezinsgewoonten.

**Acceptatiecriteria:**
- [x] Gebruiker kan een nieuwe categorie aanmaken met een zelfgekozen naam.
- [ ] Gebruiker kan een categorie hernoemen. *(Open: US-R-07-2)*
- [ ] Gebruiker kan een lege categorie verwijderen. *(Open: US-R-07-3)*
- [ ] Bij verwijdering van een categorie met recepten krijgt de gebruiker de keuze: recepten verplaatsen naar "Overig" of verwijdering annuleren. *(Open: US-R-07-4)*
- [x] Eigen categorieën zijn zichtbaar voor alle gezinsleden.

**Implementatie:** `components/CategorieenBeheer.tsx` (deels)
**Commit:** `4e8942b`
**Issue:** #US-R-07

---

## 3. Zoeken & Filteren

---

### US-Z-01 · Zoeken op naam `Must have` ✅
**Als** gebruiker **wil ik** kunnen zoeken op de naam van een recept, **zodat** ik snel een specifiek recept kan terugvinden.

**Acceptatiecriteria:**
- [x] Er is een zoekveld zichtbaar op de receptenlijstpagina.
- [x] Zoekresultaten worden gefilterd terwijl de gebruiker typt (live search).
- [x] Zoeken is niet hoofdlettergevoelig.
- [x] Als er geen resultaten zijn, verschijnt een melding "Geen recepten gevonden".

**Implementatie:** `components/ReceptenLijst.tsx` (server-side)
**Commit:** `a161d4c`, `c722fac` (T-01)

---

### US-Z-02 · Filteren op categorie `Should have` ✅
**Als** gebruiker **wil ik** kunnen filteren op categorie, **zodat** ik alleen recepten zie die passen bij het maaltijdmoment dat ik zoek.

**Acceptatiecriteria:**
- [x] Gebruiker kan één of meerdere categorieën selecteren als filter.
- [x] Filteren en zoeken op naam zijn combineerbaar.
- [x] Actieve filters zijn duidelijk zichtbaar en individueel te verwijderen.
- [x] Een "Alles wissen"-knop verwijdert alle actieve filters tegelijk.

**Implementatie:** `components/ReceptenLijst.tsx`
**Commit:** `a161d4c`

---

### US-Z-03 · Zoeken op ingrediënten `Should have` ✅
**Als** gebruiker **wil ik** kunnen zoeken op ingrediënten, **zodat** ik recepten kan vinden op basis van wat ik in huis heb.

**Acceptatiecriteria:**
- [x] Gebruiker kan één of meerdere ingrediënten invoeren als zoekterm.
- [x] De app toont recepten die álle opgegeven ingrediënten bevatten.
- [x] Ingrediëntzoeken is combineerbaar met naamzoeken en categoriefilter.
- [x] Resultaten tonen welke van de gezochte ingrediënten aanwezig zijn in het recept.

**Implementatie:** `components/ReceptenLijst.tsx`
**Commit:** `96cdb78`, `c722fac` (T-01)

---

### US-Z-04 · Filteren op bereidingstijd `Could have` ✅
**Als** gebruiker **wil ik** kunnen filteren op bereidingstijd, **zodat** ik snel een recept vind dat past binnen de tijd die ik beschikbaar heb.

**Acceptatiecriteria:**
- [x] Gebruiker kan een maximale bereidingstijd instellen (bijv. via een slider of vaste opties: 15, 30, 45, 60+ minuten).
- [x] Alleen recepten met een ingevulde bereidingstijd worden meegenomen in dit filter.
- [x] Filter is combineerbaar met overige zoek- en filterfuncties.

**Implementatie:** `components/ReceptenLijst.tsx`
**Commit:** `72644d6`

---

## 4. Maaltijdplanning (Weekmenu)

---

### US-M-01 · Weekoverzicht bekijken `Should have` ✅
**Als** gebruiker **wil ik** een weekoverzicht zien van zaterdag t/m vrijdag, **zodat** ik in één oogopslag kan zien wat er elke avond gegeten wordt.

**Acceptatiecriteria:**
- [x] Het weekoverzicht toont 7 dagen van zaterdag t/m vrijdag.
- [x] Per dag is het gekoppelde dinerrecept zichtbaar (naam en optioneel foto).
- [x] Dagen zonder recept worden duidelijk als "leeg" weergegeven.
- [x] Gebruiker kan navigeren tussen weken (vorige/volgende week).
- [x] Het huidige weekoverzicht wordt standaard getoond bij het openen van de planning.

**Implementatie:** `components/WeekMenuOverzicht.tsx`
**Commit:** `744ce2b`

---

### US-M-02 · Recept koppelen aan een dag `Should have` ✅
**Als** gebruiker **wil ik** een recept kunnen koppelen aan een dag in het weekmenu, **zodat** de dinerinvulling voor die dag vastgelegd wordt.

**Acceptatiecriteria:**
- [x] Gebruiker kan vanuit het weekoverzicht een dag selecteren om een recept te koppelen.
- [x] Gebruiker kan zoeken en filteren binnen de receptenlijst bij het koppelen.
- [x] Per dag kan één recept worden gekoppeld als diner.
- [x] Een gekoppeld recept kan worden vervangen of verwijderd.
- [x] Wijzigingen zijn direct zichtbaar voor alle gezinsleden.

**Implementatie:** `components/WeekMenuOverzicht.tsx`, `components/ReceptWeekMenuKiezer.tsx`
**Commit:** `744ce2b`

---

### US-M-03 · Weekmenu kopiëren `Could have` ✅
**Als** gebruiker **wil ik** het weekmenu kunnen kopiëren naar de volgende week, **zodat** ik niet elk recept opnieuw hoef te koppelen als we een soortgelijk menu herhalen.

**Acceptatiecriteria:**
- [x] Gebruiker kan het huidige weekmenu kopiëren naar de volgende week via een knop.
- [x] Vóór het kopiëren verschijnt een bevestigingsdialoog.
- [x] Bestaande koppelingen in de doelweek worden overschreven na bevestiging.
- [x] Na kopiëren wordt de gebruiker naar de doelweek genavigeerd.

**Implementatie:** `components/WeekMenuOverzicht.tsx`
**Commit:** `44f51a6`

---

## 5. Boodschappenlijst

---

### US-B-01 · Boodschappenlijst genereren vanuit weekmenu `Should have` ✅
**Als** gebruiker **wil ik** automatisch een boodschappenlijst kunnen genereren vanuit het weekmenu, **zodat** ik niet zelf alle ingrediënten hoef over te schrijven.

**Acceptatiecriteria:**
- [x] Gebruiker kan de boodschappenlijst genereren via een knop in het weekoverzicht.
- [x] Alle ingrediënten van de gekoppelde recepten worden samengevoegd in de lijst.
- [x] Gebruiker kan kiezen voor welke dagen de lijst gegenereerd wordt (heel week of selectie).
- [x] Bestaande handmatige items op de boodschappenlijst blijven behouden bij het genereren.

**Implementatie:** `components/Boodschappenlijst.tsx`
**Commit:** `a5d7d98`

---

### US-B-02 · Ingrediënten samenvoegen `Could have` ✅
**Als** gebruiker **wil ik** dat gelijke ingrediënten automatisch worden samengevoegd, **zodat** ik geen dubbele items op mijn boodschappenlijst heb.

**Acceptatiecriteria:**
- [x] Ingrediënten met dezelfde naam en eenheid worden opgeteld (bijv. 200g + 300g bloem = 500g bloem).
- [x] Ingrediënten met verschillende eenheden worden apart weergegeven (bijv. 2 stuks ui en 100g ui).
- [x] Samengevoegde items tonen welke recepten eraan bijdragen (inklapbaar).

**Implementatie:** `lib/duplicaten.ts`
**Commit:** `00169cb`

---

### US-B-03 · Handmatig item toevoegen `Should have` ✅
**Als** gebruiker **wil ik** handmatig items aan de boodschappenlijst kunnen toevoegen, **zodat** ik ook producten kan noteren die niet in een recept staan.

**Acceptatiecriteria:**
- [x] Gebruiker kan een item toevoegen met naam en optionele hoeveelheid/eenheid.
- [x] Handmatige items zijn visueel onderscheidbaar van gegenereerde items.
- [x] Items kunnen worden bewerkt en verwijderd.

**Implementatie:** `components/Boodschappenlijst.tsx`
**Commit:** `a5d7d98`

---

### US-B-04 · Items afvinken `Should have` ✅
**Als** gebruiker **wil ik** items op de boodschappenlijst kunnen afvinken, **zodat** ik tijdens het winkelen kan bijhouden wat ik al in mijn mandje heb.

**Acceptatiecriteria:**
- [x] Elk item heeft een checkbox die te togglen is.
- [x] Afgevinkte items worden visueel onderscheiden (bijv. doorgestreept, grijs).
- [x] Afgevinkte items blijven op de lijst staan (worden niet automatisch verwijderd).
- [x] Er is een knop om alle vinkjes in één keer te verwijderen.

**Implementatie:** `components/Boodschappenlijst.tsx`
**Commit:** `a5d7d98`

---

### US-B-05 · Real-time synchronisatie boodschappenlijst `Could have` ✅
**Als** gebruiker **wil ik** dat de boodschappenlijst real-time gesynchroniseerd wordt tussen gezinsleden, **zodat** twee personen tegelijk kunnen winkelen zonder elkaar te dupliceren.

**Acceptatiecriteria:**
- [x] Wijzigingen (toevoegen, afvinken, verwijderen) zijn binnen 3 seconden zichtbaar voor andere gezinsleden.
- [x] Conflicten (twee gebruikers wijzigen hetzelfde item tegelijk) worden zonder foutmelding opgelost.
- [x] De lijst toont een indicatie wanneer een ander gezinslid actief is op de lijst.

**Implementatie:** `components/Boodschappenlijst.tsx` (Supabase Realtime)
**Commit:** `552cfc0`

---

### US-B-06 · Boodschappenlijst exporteren `Could have` ⚠️
**Als** gebruiker **wil ik** de boodschappenlijst kunnen exporteren of delen, **zodat** ik de lijst ook buiten de app kan gebruiken.

**Acceptatiecriteria:**
- [x] Gebruiker kan de lijst kopiëren als platte tekst.
- [x] Gebruiker kan een deellink genereren waarmee de lijst (read-only) te bekijken is zonder in te loggen.
- [ ] Deellink is maximaal 24 uur geldig. *(Open: US-B-06-3)*

**Implementatie:** `components/Boodschappenlijst.tsx`
**Commit:** `75fe066`
**Issue:** #US-B-06

---

## Tech Debt Issues

### T-01 · Server-side filteren en pagineren in receptenoverzicht ✅
**Status:** Opgelost in commit `c722fac`
**Implementatie:** `components/ReceptenLijstServer.tsx` met server action `haalRecepten()`

### T-02 · Atomische opslag van recepten via database-transactie ✅
**Status:** Opgelost in commit `0d68e07`
**Implementatie:** `migration_atomisch_recept.sql` met RPC functie `sla_recept_op()`

### T-03 · Type-veilige Supabase-queries via CLI-codegeneratie ❌
**Status:** Niet opgelost
**Probleem:** Handmatige `as unknown as`-casts in queries
**Impact:** Minder typeveiligheid, schema-wijzigingen niet direct zichtbaar
**Issue:** #T-03
