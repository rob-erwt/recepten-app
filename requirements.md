# Requirements – Recept App (Gezinsversie)

---

## 1. Gebruikers & Toegang

| ID | Requirement | MoSCoW |
|----|-------------|--------|
| U-01 | De app is toegankelijk via een webbrowser (geen installatie vereist). | Must have |
| U-02 | De app ondersteunt meerdere gezinsleden binnen één gedeeld account (huishouden). | Must have |
| U-03 | Inloggen is vereist om recepten en planningen te bekijken of te bewerken. | Must have |
| U-04 | Er is een uitnodigingsfunctie waarmee gezinsleden toegang kunnen krijgen tot het gedeelde account. | Should have |

---

## 2. Responsive Design & Platform

| ID | Requirement | MoSCoW |
|----|-------------|--------|
| P-01 | De interface is volledig responsief en geoptimaliseerd voor smartphones (≥ 375px). | Must have |
| P-02 | De interface is volledig responsief en geoptimaliseerd voor tablets (≥ 768px). | Must have |
| P-03 | De app werkt correct in de meest recente versies van Chrome, Safari en Firefox. | Must have |
| P-04 | Knoppen en invoervelden zijn touch-vriendelijk (minimaal 44×44px aanraakoppervlak). | Must have |

---

## 3. Recepten – Opslaan & Bewerken

| ID | Requirement | MoSCoW |
|----|-------------|--------|
| R-01 | Een recept bevat minimaal: naam, ingrediënten (met hoeveelheid en eenheid), bereidingsstappen, aantal personen, bereidingstijd en een optionele foto. | Must have |
| R-02 | Gebruikers kunnen recepten handmatig invoeren via een gestructureerd formulier. | Must have |
| R-03 | Gebruikers kunnen een recept importeren door een URL te plakken; de app haalt automatisch de receptgegevens op. | Should have |
| R-04 | Gebruikers kunnen een foto uploaden van een recept; de app extraheert de receptinformatie automatisch via AI/OCR. | Could have |
| R-05 | Geïmporteerde of geëxtraheerde recepten zijn bewerkbaar vóór definitieve opslag. | Must have |
| R-06 | Gebruikers kunnen een bestaand recept op elk moment bewerken. | Must have |
| R-07 | Gebruikers kunnen een recept verwijderen, met een bevestigingsstap ter voorkoming van ongewenste verwijdering. | Must have |
| R-08 | Recepten kunnen worden ingedeeld in categorieën (bijv. ontbijt, lunch, diner, snack, dessert). | Should have |
| R-09 | Gebruikers kunnen eigen categorieën aanmaken en beheren. | Could have |
| R-10 | Een recept kan aan meerdere categorieën worden gekoppeld. | Could have |

---

## 4. Zoeken & Filteren

| ID | Requirement | MoSCoW |
|----|-------------|--------|
| Z-01 | Gebruikers kunnen vrij zoeken op naam van het recept. | Must have |
| Z-02 | Gebruikers kunnen filteren op categorie. | Should have |
| Z-03 | Gebruikers kunnen zoeken op één of meerdere ingrediënten (recepten die deze ingrediënten bevatten). | Should have |
| Z-04 | Gebruikers kunnen filteren op bereidingstijd (bijv. ≤ 30 minuten). | Could have |
| Z-05 | Zoekresultaten worden direct bijgewerkt tijdens het typen (live search). | Should have |

---

## 5. Maaltijdplanning (Weekmenu)

| ID | Requirement | MoSCoW |
|----|-------------|--------|
| M-01 | Gebruikers kunnen een weekoverzicht bekijken van zaterdag t/m vrijdag. | Should have |
| M-02 | Gebruikers kunnen een recept uit hun collectie koppelen aan een dag als diner. | Should have |
| M-03 | Het weekmenu is zichtbaar en bewerkbaar voor alle gezinsleden. | Should have |
| M-04 | Gebruikers kunnen het weekmenu kopiëren naar een volgende week als startpunt. | Could have |

---

## 6. Boodschappenlijst

| ID | Requirement | MoSCoW |
|----|-------------|--------|
| B-01 | Gebruikers kunnen automatisch een boodschappenlijst genereren op basis van de recepten in het weekmenu. | Should have |
| B-02 | Ingrediënten van hetzelfde type worden samengevoegd en opgeteld (bijv. 200g + 300g bloem = 500g bloem). | Could have |
| B-03 | Gebruikers kunnen handmatig items toevoegen aan de boodschappenlijst. | Should have |
| B-04 | Gebruikers kunnen items op de boodschappenlijst afvinken. | Should have |
| B-05 | De boodschappenlijst is gedeeld en real-time gesynchroniseerd voor alle gezinsleden. | Could have |
| B-06 | Gebruikers kunnen de boodschappenlijst exporteren of delen (bijv. als tekst of via een deellink). | Could have |

---

## 7. Niet-functionele Requirements

| ID | Requirement | MoSCoW |
|----|-------------|--------|
| NF-01 | De app vereist een internetverbinding; offline gebruik wordt niet ondersteund. | Must have |
| NF-02 | Paginalaadtijd is ≤ 3 seconden bij een standaard 4G-verbinding. | Must have |
| NF-03 | Receptdata en gebruikersgegevens worden opgeslagen in een beveiligde cloudomgeving. | Must have |
| NF-04 | De app voldoet aan de AVG/GDPR voor opslag en verwerking van persoonsgegevens. | Must have |
| NF-05 | De applicatie is schaalbaar zodat toekomstige functionaliteit (bijv. meerdere huishoudens) toegevoegd kan worden. | Won't have |

---

## 8. Buiten Scope (deze versie)

- Offline modus
- Dieet- en allergenenfilters
- Calorie- of voedingswaardentracking
- Publiek delen van recepten met andere gebruikers buiten het gezin
- Native mobiele app (iOS/Android)
