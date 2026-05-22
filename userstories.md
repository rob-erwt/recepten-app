# User Stories – Recept App (Gezinsversie)

> **Formaat:** Als [gebruiker] wil ik [functie], zodat [waarde].
> Elke story bevat acceptatiecriteria (AC) die bepalen wanneer de story als "done" beschouwd wordt.

---

## 1. Gebruikers & Toegang

---

### US-U-01 · Registreren van een huishouden `Must have`
**Als** nieuwe gebruiker **wil ik** een account aanmaken voor mijn huishouden, **zodat** mijn gezin samen recepten en planningen kan beheren.

**Acceptatiecriteria:**
- [ ] Gebruiker kan een account aanmaken met e-mailadres en wachtwoord.
- [ ] Na registratie wordt een huishouden automatisch aangemaakt.
- [ ] Gebruiker ontvangt een bevestigingsmail.
- [ ] Bij een al bestaand e-mailadres krijgt de gebruiker een duidelijke foutmelding.

---

### US-U-02 · Inloggen `Must have`
**Als** bestaande gebruiker **wil ik** kunnen inloggen, **zodat** ik toegang krijg tot de recepten en planning van mijn huishouden.

**Acceptatiecriteria:**
- [ ] Gebruiker kan inloggen met e-mailadres en wachtwoord.
- [ ] Bij onjuiste gegevens verschijnt een foutmelding (zonder aan te geven welk veld onjuist is).
- [ ] Gebruiker kan een wachtwoord-resetmail aanvragen.
- [ ] Na inloggen wordt de gebruiker doorgestuurd naar de receptenlijst.

---

### US-U-03 · Uitloggen `Must have`
**Als** ingelogde gebruiker **wil ik** kunnen uitloggen, **zodat** anderen op mijn apparaat geen toegang hebben tot mijn gegevens.

**Acceptatiecriteria:**
- [ ] Uitlogknop is altijd bereikbaar via het hoofdmenu.
- [ ] Na uitloggen wordt de gebruiker teruggestuurd naar de inlogpagina.
- [ ] Na uitloggen zijn geen gegevens meer zichtbaar zonder opnieuw in te loggen.

---

### US-U-04 · Gezinslid uitnodigen `Should have`
**Als** beheerder van het huishouden **wil ik** gezinsleden kunnen uitnodigen, **zodat** zij toegang krijgen tot dezelfde recepten en planning.

**Acceptatiecriteria:**
- [ ] Beheerder kan een uitnodiging versturen via e-mailadres.
- [ ] Ontvanger krijgt een e-mail met een uitnodigingslink (geldig voor 7 dagen).
- [ ] Via de link kan de ontvanger een account aanmaken dat gekoppeld is aan het bestaande huishouden.
- [ ] De beheerder kan uitstaande uitnodigingen intrekken.
- [ ] Maximaal 10 gezinsleden per huishouden.

---

## 2. Recepten – Opslaan & Bewerken

---

### US-R-01 · Recept handmatig invoeren `Must have`
**Als** gebruiker **wil ik** een recept handmatig kunnen invoeren, **zodat** ik mijn eigen recepten kan opslaan in de app.

**Acceptatiecriteria:**
- [ ] Formulier bevat velden voor: naam, categorie, aantal personen, bereidingstijd, ingrediënten (naam, hoeveelheid, eenheid) en bereidingsstappen.
- [ ] Ingrediënten en stappen kunnen dynamisch worden toegevoegd en verwijderd.
- [ ] Een foto is optioneel toe te voegen via upload.
- [ ] Naam is een verplicht veld; overige velden zijn optioneel.
- [ ] Opgeslagen recept is direct zichtbaar in de receptenlijst.

---

### US-R-02 · Recept bewerken `Must have`
**Als** gebruiker **wil ik** een bestaand recept kunnen bewerken, **zodat** ik fouten kan corrigeren of het recept kan verbeteren.

**Acceptatiecriteria:**
- [ ] Alle velden van een recept zijn bewerkbaar.
- [ ] Wijzigingen worden pas opgeslagen na bevestiging via een "Opslaan"-knop.
- [ ] Gebruiker kan bewerkingen annuleren zonder dat wijzigingen worden opgeslagen.
- [ ] Bewerkingen zijn direct zichtbaar voor alle gezinsleden.

---

### US-R-03 · Recept verwijderen `Must have`
**Als** gebruiker **wil ik** een recept kunnen verwijderen, **zodat** mijn receptenlijst overzichtelijk blijft.

**Acceptatiecriteria:**
- [ ] Verwijderknop is beschikbaar op de detailpagina van een recept.
- [ ] Vóór verwijdering verschijnt een bevestigingsdialoog.
- [ ] Na verwijdering verdwijnt het recept uit de lijst en uit eventuele weekplanningen.
- [ ] Verwijdering is voor alle gezinsleden direct zichtbaar.

---

### US-R-04 · Recept importeren via URL `Should have`
**Als** gebruiker **wil ik** een recept kunnen importeren via een URL, **zodat** ik recepten van websites snel kan opslaan zonder alles over te typen.

**Acceptatiecriteria:**
- [ ] Gebruiker kan een URL plakken in een importveld.
- [ ] De app extraheert automatisch: naam, ingrediënten en bereidingsstappen (indien beschikbaar op de pagina).
- [ ] Het geïmporteerde recept wordt geopend in het bewerkformulier vóór opslag.
- [ ] Als de URL niet herkend wordt of extractie mislukt, krijgt de gebruiker een duidelijke foutmelding.
- [ ] Gebruiker kan het recept alsnog handmatig aanvullen na een mislukte import.

---

### US-R-05 · Recept importeren via foto `Could have`
**Als** gebruiker **wil ik** een foto van een recept kunnen uploaden, **zodat** ik een recept uit een kookboek of tijdschrift snel kan digitaliseren.

**Acceptatiecriteria:**
- [ ] Gebruiker kan een foto uploaden (JPG, PNG; max. 10 MB).
- [ ] De app extraheert automatisch zoveel mogelijk receptinformatie via OCR/AI.
- [ ] Het geëxtraheerde recept wordt geopend in het bewerkformulier vóór opslag.
- [ ] De gebruiker ziet een duidelijke melding dat het resultaat gecontroleerd moet worden.
- [ ] Bij een onleesbare of irrelevante foto verschijnt een foutmelding.

---

### US-R-06 · Recept indelen in categorie `Should have`
**Als** gebruiker **wil ik** een recept kunnen indelen in een categorie, **zodat** ik mijn recepten overzichtelijk kan organiseren.

**Acceptatiecriteria:**
- [ ] Bij het aanmaken of bewerken van een recept kan een categorie worden geselecteerd.
- [ ] Standaardcategorieën zijn beschikbaar: ontbijt, lunch, diner, snack, dessert.
- [ ] Een recept kan aan meerdere categorieën worden gekoppeld.
- [ ] Recepten zonder categorie zijn zichtbaar onder "Overig".

---

### US-R-07 · Eigen categorieën beheren `Could have`
**Als** gebruiker **wil ik** eigen categorieën kunnen aanmaken en verwijderen, **zodat** ik de indeling kan afstemmen op onze gezinsgewoonten.

**Acceptatiecriteria:**
- [ ] Gebruiker kan een nieuwe categorie aanmaken met een zelfgekozen naam.
- [ ] Gebruiker kan een categorie hernoemen.
- [ ] Gebruiker kan een lege categorie verwijderen.
- [ ] Bij verwijdering van een categorie met recepten krijgt de gebruiker de keuze: recepten verplaatsen naar "Overig" of verwijdering annuleren.
- [ ] Eigen categorieën zijn zichtbaar voor alle gezinsleden.

---

## 3. Zoeken & Filteren

---

### US-Z-01 · Zoeken op naam `Must have`
**Als** gebruiker **wil ik** kunnen zoeken op de naam van een recept, **zodat** ik snel een specifiek recept kan terugvinden.

**Acceptatiecriteria:**
- [ ] Er is een zoekveld zichtbaar op de receptenlijstpagina.
- [ ] Zoekresultaten worden gefilterd terwijl de gebruiker typt (live search).
- [ ] Zoeken is niet hoofdlettergevoelig.
- [ ] Als er geen resultaten zijn, verschijnt een melding "Geen recepten gevonden".

---

### US-Z-02 · Filteren op categorie `Should have`
**Als** gebruiker **wil ik** kunnen filteren op categorie, **zodat** ik alleen recepten zie die passen bij het maaltijdmoment dat ik zoek.

**Acceptatiecriteria:**
- [ ] Gebruiker kan één of meerdere categorieën selecteren als filter.
- [ ] Filteren en zoeken op naam zijn combineerbaar.
- [ ] Actieve filters zijn duidelijk zichtbaar en individueel te verwijderen.
- [ ] Een "Alles wissen"-knop verwijdert alle actieve filters tegelijk.

---

### US-Z-03 · Zoeken op ingrediënten `Should have`
**Als** gebruiker **wil ik** kunnen zoeken op ingrediënten, **zodat** ik recepten kan vinden op basis van wat ik in huis heb.

**Acceptatiecriteria:**
- [ ] Gebruiker kan één of meerdere ingrediënten invoeren als zoekterm.
- [ ] De app toont recepten die álle opgegeven ingrediënten bevatten.
- [ ] Ingrediëntzoeken is combineerbaar met naamzoeken en categoriefilter.
- [ ] Resultaten tonen welke van de gezochte ingrediënten aanwezig zijn in het recept.

---

### US-Z-04 · Filteren op bereidingstijd `Could have`
**Als** gebruiker **wil ik** kunnen filteren op bereidingstijd, **zodat** ik snel een recept vind dat past binnen de tijd die ik beschikbaar heb.

**Acceptatiecriteria:**
- [ ] Gebruiker kan een maximale bereidingstijd instellen (bijv. via een slider of vaste opties: 15, 30, 45, 60+ minuten).
- [ ] Alleen recepten met een ingevulde bereidingstijd worden meegenomen in dit filter.
- [ ] Filter is combineerbaar met overige zoek- en filterfuncties.

---

## 4. Maaltijdplanning (Weekmenu)

---

### US-M-01 · Weekoverzicht bekijken `Should have`
**Als** gebruiker **wil ik** een weekoverzicht zien van zaterdag t/m vrijdag, **zodat** ik in één oogopslag kan zien wat er elke avond gegeten wordt.

**Acceptatiecriteria:**
- [ ] Het weekoverzicht toont 7 dagen van zaterdag t/m vrijdag.
- [ ] Per dag is het gekoppelde dinerrecept zichtbaar (naam en optioneel foto).
- [ ] Dagen zonder recept worden duidelijk als "leeg" weergegeven.
- [ ] Gebruiker kan navigeren tussen weken (vorige/volgende week).
- [ ] Het huidige weekoverzicht wordt standaard getoond bij het openen van de planning.

---

### US-M-02 · Recept koppelen aan een dag `Should have`
**Als** gebruiker **wil ik** een recept kunnen koppelen aan een dag in het weekmenu, **zodat** de dinerinvulling voor die dag vastgelegd wordt.

**Acceptatiecriteria:**
- [ ] Gebruiker kan vanuit het weekoverzicht een dag selecteren om een recept te koppelen.
- [ ] Gebruiker kan zoeken en filteren binnen de receptenlijst bij het koppelen.
- [ ] Per dag kan één recept worden gekoppeld als diner.
- [ ] Een gekoppeld recept kan worden vervangen of verwijderd.
- [ ] Wijzigingen zijn direct zichtbaar voor alle gezinsleden.

---

### US-M-03 · Weekmenu kopiëren `Could have`
**Als** gebruiker **wil ik** het weekmenu kunnen kopiëren naar de volgende week, **zodat** ik niet elk recept opnieuw hoef te koppelen als we een soortgelijk menu herhalen.

**Acceptatiecriteria:**
- [ ] Gebruiker kan het huidige weekmenu kopiëren naar de volgende week via een knop.
- [ ] Vóór het kopiëren verschijnt een bevestigingsdialoog.
- [ ] Bestaande koppelingen in de doelweek worden overschreven na bevestiging.
- [ ] Na kopiëren wordt de gebruiker naar de doelweek genavigeerd.

---

## 5. Boodschappenlijst

---

### US-B-01 · Boodschappenlijst genereren vanuit weekmenu `Should have`
**Als** gebruiker **wil ik** automatisch een boodschappenlijst kunnen genereren vanuit het weekmenu, **zodat** ik niet zelf alle ingrediënten hoef over te schrijven.

**Acceptatiecriteria:**
- [ ] Gebruiker kan de boodschappenlijst genereren via een knop in het weekoverzicht.
- [ ] Alle ingrediënten van de gekoppelde recepten worden samengevoegd in de lijst.
- [ ] Gebruiker kan kiezen voor welke dagen de lijst gegenereerd wordt (heel week of selectie).
- [ ] Bestaande handmatige items op de boodschappenlijst blijven behouden bij het genereren.

---

### US-B-02 · Ingrediënten samenvoegen `Could have`
**Als** gebruiker **wil ik** dat gelijke ingrediënten automatisch worden samengevoegd, **zodat** ik geen dubbele items op mijn boodschappenlijst heb.

**Acceptatiecriteria:**
- [ ] Ingrediënten met dezelfde naam en eenheid worden opgeteld (bijv. 200g + 300g bloem = 500g bloem).
- [ ] Ingrediënten met verschillende eenheden worden apart weergegeven (bijv. 2 stuks ui en 100g ui).
- [ ] Samengevoegde items tonen welke recepten eraan bijdragen (inklapbaar).

---

### US-B-03 · Handmatig item toevoegen `Should have`
**Als** gebruiker **wil ik** handmatig items aan de boodschappenlijst kunnen toevoegen, **zodat** ik ook producten kan noteren die niet in een recept staan.

**Acceptatiecriteria:**
- [ ] Gebruiker kan een item toevoegen met naam en optionele hoeveelheid/eenheid.
- [ ] Handmatige items zijn visueel onderscheidbaar van gegenereerde items.
- [ ] Items kunnen worden bewerkt en verwijderd.

---

### US-B-04 · Items afvinken `Should have`
**Als** gebruiker **wil ik** items op de boodschappenlijst kunnen afvinken, **zodat** ik tijdens het winkelen kan bijhouden wat ik al in mijn mandje heb.

**Acceptatiecriteria:**
- [ ] Elk item heeft een checkbox die te togglen is.
- [ ] Afgevinkte items worden visueel onderscheiden (bijv. doorgestreept, grijs).
- [ ] Afgevinkte items blijven op de lijst staan (worden niet automatisch verwijderd).
- [ ] Er is een knop om alle vinkjes in één keer te verwijderen.

---

### US-B-05 · Real-time synchronisatie boodschappenlijst `Could have`
**Als** gebruiker **wil ik** dat de boodschappenlijst real-time gesynchroniseerd wordt tussen gezinsleden, **zodat** twee personen tegelijk kunnen winkelen zonder elkaar te dupliceren.

**Acceptatiecriteria:**
- [ ] Wijzigingen (toevoegen, afvinken, verwijderen) zijn binnen 3 seconden zichtbaar voor andere gezinsleden.
- [ ] Conflicten (twee gebruikers wijzigen hetzelfde item tegelijk) worden zonder foutmelding opgelost.
- [ ] De lijst toont een indicatie wanneer een ander gezinslid actief is op de lijst.

---

### US-B-06 · Boodschappenlijst exporteren `Could have`
**Als** gebruiker **wil ik** de boodschappenlijst kunnen exporteren of delen, **zodat** ik de lijst ook buiten de app kan gebruiken.

**Acceptatiecriteria:**
- [ ] Gebruiker kan de lijst kopiëren als platte tekst.
- [ ] Gebruiker kan een deellink genereren waarmee de lijst (read-only) te bekijken is zonder in te loggen.
- [ ] Deellink is maximaal 24 uur geldig.
