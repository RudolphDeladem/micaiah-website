# Micaiah insight server (optional)

A small Node service that lets the app offer **cloud insights** written by Claude
(`claude-opus-5-5`). The app works without it; when the app is built with
`EXPO_PUBLIC_INSIGHT_API_URL` pointing here, users can opt in to cloud insights.

Design choices:

- **Scripture is never generated.** Claude may only pick verse references from the
  app's KJV library (`mobile/src/data/scripture.json`) via a structured-output enum;
  the app displays the bundled text.
- **No reflection text is stored or logged.** Only error metadata is logged.
- Safety: the system prompt asks Claude to flag crisis language; the app also
  detects it on-device and always shows crisis resources.
- Server-side refusal fallbacks are enabled (`fallbacks: "default"`), structured
  output is validated with Zod, the large system prompt is prompt-cached, and
  per-IP rate limiting caps cost.

## Endpoints

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/health` | — | `{ ok: true }` |
| POST | `/v1/insight` | `{ text: string (3–5000), mode: "daily" \| "prayer" \| "gratitude" }` | `{ themeId, interpretation, verseRefs[], steps[], prayer, crisis }` |
| POST | `/v1/report` | `{ reason, themeId, interpretation, steps, prayer, verseRefs }` | `202` — written to the log as an `insight_report` JSON line |

## Run

Requires Node 22.18+ (runs TypeScript directly) and an Anthropic API key.

```bash
npm install
ANTHROPIC_API_KEY=sk-ant-... npm start      # http://localhost:8787
npm test && npm run typecheck
```

Environment: `ANTHROPIC_API_KEY` (required), `PORT` (8787), `RATE_LIMIT_PER_HOUR` (30 per IP),
`CATALOG_PATH` (defaults to the app's `scripture.json`).

## Deploy

Any container host works (Fly.io, Render, Railway, Cloud Run). Build from the
repository root so the Scripture library is included:

```bash
docker build -f server/Dockerfile -t micaiah-insight .
docker run -p 8787:8787 -e ANTHROPIC_API_KEY=sk-ant-... micaiah-insight
```

Serve it over HTTPS, set `ANTHROPIC_API_KEY` as a secret, and review `insight_report`
log lines regularly; Google Play expects reports of AI content to be acted on.
