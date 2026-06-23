# Ethos Studio — Vervolgplan

> Pauzepunt: juni 2026

## Project

- **Lokaal:** `Cursor projecten\ethos-studio`
- **Live:** https://rvodde-cyber.github.io/ethos-studio/
- **GitHub:** https://github.com/rvodde-cyber/ethos-studio

Open `ethos-studio` als workspace in Cursor.

## Structuur (juni 2026)

| Bestand | Doel |
|---|---|
| `index.html` | **Startpagina** — sector, situatie (2–3 zinnen), optioneel dilemma, API-key → door naar studio |
| `studio.html` | **Volledige generator** — batch, voorbeelden, PDF, afbeeldingen |
| `ethos_studio_handleiding.html` | Handleiding NL/EN |

## Laatste wijziging

Opsplitsing startpagina + studio. Toegangscode en dubbele landing verwijderd uit studio. Startpagina stuurt topic/context door via sessionStorage.

## Volgende sessie

1. Live site controleren na deploy (hard refresh)
2. Prompt v4 + transfer-markdown toevoegen → `buildPrompt()` uitbreiden (waarden, begeleiderstip)
3. Voorbeeldcasussen per sector
4. Handleiding bijwerken (verwijs naar index.html / studio.html)

## Context voor Cursor

```
We werken aan Ethos Studio in Cursor projecten\ethos-studio.
Lees VOLGENDE_SESSIE.md. Start via index.html, studio via studio.html.
```
