# Ethos Studio — App-beschrijving (Moreel Vakmanschap)

> Gebruik dit document als context in Claude wanneer je werkt aan Ethos Studio of het ecosysteem Moreel Vakmanschap.

---

## Wat is Ethos Studio?

**Ethos Studio** is een browsergebaseerde tool voor het genereren van **gesprekskaarten** — korte, narratief geschreven casusbeschrijvingen die uitnodigen tot moreel beraad en ethische reflectie. De app is ontwikkeld binnen het **Lectoraat Ethisch Werken** (Fontys HRM en TP) als onderdeel van het **Comenius-innovatieproject Moreel Vakmanschap**.

Ethos Studio hoort bij het ecosysteem van tools rond **moreel vakmanschap**: het ondersteunt docenten, begeleiders en professionals bij het bespreekbaar maken van ethische dilemma's uit de dagelijkse praktijk.

---

## Kernfunctie

De gebruiker beschrijft een situatie in **2–3 zinnen** (eventueel met een dilemma-focus). De app (via Claude/Anthropic API) schrijft daar een volledige **gesprekskaart** van conform **Stamkaart v2.0**:

| Onderdeel | Beschrijving |
|---|---|
| **Titel** | Max. 8 woorden, prikkelend |
| **Verhaal** | Max. 150 woorden, herkenbare situatie → moreel dilemma |
| **Afsluitvraag** | Eén open, krachtige vraag |
| **Waarden** | 2–4 relevante waarden (tags) |
| **Begeleiderstip** | Korte tip voor degene die het gesprek faciliteert |
| **Reflectievragen** | Vast: *Wat zou jij doen en waarom?* · *Welke waarden zijn hier in het spel?* |
| **Afbeeldingsprompt** | Engels, cinematic — bedoeld voor Adobe Firefly |

Output blijft **lokaal**: PDF-download en print gebeuren in de browser; er is geen server die casussen opslaat.

---

## Technische structuur (juni 2026)

| Bestand | URL / pad | Functie |
|---|---|---|
| `index.html` | `/` (startpagina) | Minimale invoer: sector, situatie, optioneel dilemma, API-key → doorsturen naar studio |
| `studio.html` | `/studio.html` | Volledige generator: enkel/batch, Firefly-workflow, PDF, print, voorbeelden |
| `ethos_studio_handleiding.html` | `/ethos_studio_handleiding.html` | Tweetalige gebruikershandleiding NL/EN |

**Live:** https://rvodde-cyber.github.io/ethos-studio/  
**Repo:** https://github.com/rvodde-cyber/ethos-studio  
**Stack:** Pure HTML/CSS/JS (geen framework), jsPDF, Anthropic Messages API, optioneel Pollinations.ai voor gratis preview

---

## Gebruikersflow

1. **Startpagina** — sector kiezen, situatie typen, API-key invoeren (sessie)
2. **Studio** — kaart genereren; resultaat verschijnt met waarden, begeleiderstip, Firefly-panel
3. **Afbeelding (Firefly-workflow)** — prompt kopiëren → Adobe Firefly openen → afbeelding uploaden → mee in PDF
4. **Export** — PDF downloaden of direct printen (lokaal, geen upload naar server)

**Batch-modus:** tot 15 onderwerpen tegelijk, meerpagina-PDF.

**Sectoren:** Ziekenhuis · Zorg · Onderwijs · Defensie · Bedrijf · Welzijn · Overheid · Algemeen.

**Talen:** NL/EN (interface én gegenereerde kaarten).

---

## Relatie tot Moreel Vakmanschap

Ethos Studio is een **praktische werkvorm** binnen het bredere kader van moreel vakmanschap:

- Sluit aan bij **gesprekskaarten** als didactisch middel voor moreel beraad
- Ondersteunt docenten die zelf casussen willen maken zonder uren schrijfwerk
- Complementair aan andere MV-tools (bijv. cirkelmodel, worksheets, community-platform)
- Waarden en begeleiderstip maken kaarten direct inzetbaar in onderwijs en professionele settings

---

## Privacy & kosten

- **API-key:** persoonlijk Anthropic-account; key alleen in `sessionStorage` (niet op server)
- **Kosten:** ca. €0,01–0,02 per kaart (Claude Sonnet)
- **Afbeelding:** Firefly vereist Adobe-account; gratis preview via Pollinations optioneel
- **Geen backend:** volledig client-side, geschikt voor GDPR-bewuste omgevingen

---

## Ontwikkelaar-context voor Claude

```
Project: Ethos Studio (ethos-studio repo)
Doel: Gesprekskaarten genereren voor moreel beraad
Start: index.html → studio.html?auto=1
Prompt: buildPrompt() in studio.html (v4: waarden + facilitator_tip + image_prompt)
Design: Fontys groen (#0F6E56), Playfair Display + Source Sans 3, Apple-stijl witruimte
Volgende stappen: voorbeeldcasussen per sector, handleiding bijwerken, eventueel eigen domein
```
