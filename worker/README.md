# Ethos Studio API — Cloudflare Worker

Proxy voor `/api/generate-card`. De Anthropic API-key en toegangscode staan alleen in Cloudflare Secrets.

## Eenmalige setup

1. Installeer dependencies:

```bash
cd worker
npm install
```

2. Maak een KV-namespace voor rate limiting:

```bash
npm run kv:create
```

Kopieer de `id` en `preview_id` naar `wrangler.toml` bij `[[kv_namespaces]]`.

3. Stel secrets in:

```bash
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put ACCESS_CODE
```

4. Pas `ALLOWED_ORIGINS` in `wrangler.toml` aan (comma-separated), bijvoorbeeld:

```
ALLOWED_ORIGINS = "https://rvodde-cyber.github.io,https://moreelvakmanschap.nl"
```

Voor GitHub Pages moet de origin exact overeenkomen, inclusief pad als je een custom domain gebruikt — de origin is alleen het scheme + host (bijv. `https://rvodde-cyber.github.io`).

5. Deploy:

```bash
npm run deploy
```

6. Update `ethos-config.js` in de repo-root:

```javascript
apiUrl: 'https://ethos-studio-api.<jouw-account>.workers.dev/api/generate-card'
```

## Lokaal testen

```bash
npm run dev
```

Zet in `ethos-config.js` tijdelijk:

```javascript
apiUrl: 'http://127.0.0.1:8787/api/generate-card'
```

Voeg `http://127.0.0.1:8787` toe aan `ALLOWED_ORIGINS` of test via een origin die al in de lijst staat.

## Limieten (standaard)

| Limiet | Waarde |
|--------|--------|
| Per IP + toegangscode per uur | 10 |
| Globaal per dag | 300 |
| Tekens situatieveld | 500 |

Pas aan via `[vars]` in `wrangler.toml`.

## Endpoints

- `POST /api/generate-card` — genereer een gesprekskaart
- `GET /health` — health check
- `OPTIONS` — CORS preflight

### Request body

```json
{
  "access_code": "jouw-code",
  "lang": "nl",
  "ctx": "hospital",
  "level": "meso",
  "source": "Een verpleegkundige ziet dat..."
}
```

### Response (200)

```json
{
  "card": {
    "title": "...",
    "story": "...",
    "closing_question": "...",
    "values": ["..."],
    "facilitator_tip": "...",
    "image_prompt": "..."
  }
}
```

### Foutcodes

| code | HTTP | Betekenis |
|------|------|-----------|
| `UNAUTHORIZED` | 401 | Onjuiste toegangscode |
| `SOURCE_TOO_LONG` | 400 | Meer dan 500 tekens |
| `RATE_LIMIT_HOURLY` | 429 | 10/uur bereikt |
| `RATE_LIMIT_DAILY` | 429 | 300/dag bereikt |
| `UPSTREAM_ERROR` | 502 | Anthropic niet bereikbaar |
