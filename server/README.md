# Micaiah insight server (optional)

A small Node service that lets the app offer **cloud insights**, **Dream Interpretation**
and **Prophetic Word** explanations written by Claude (`claude-opus-5-5`). The app works
without it; when the app is built with `EXPO_PUBLIC_INSIGHT_API_URL` pointing here, users can
opt in to cloud insights and the Interpret tab appears.

Design choices:

- **Scripture is never generated.** Claude may only pick verse references from the
  app's KJV library (`mobile/src/data/scripture.json`) via a structured-output enum;
  the app displays the bundled text.
- **Dream and prophetic interpretations cite references only.** The model returns book /
  chapter / verse references (book names are a schema enum); the server drops any that don't
  exist in the KJV, and the app shows the text from its bundled Bible in the reader's chosen
  translation.
- **No reflection, dream or prophetic text is stored or logged.** Only error metadata and
  monthly usage counts (per pseudonymous install ID) are kept.
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
| POST | `/v1/interpret` | `{ kind: "dream" \| "prophetic", text: string (10–5000) }` + header `X-Micaiah-User` | `{ interpretation: { title, summary, points[], refs[], cautions[], steps[], prayer, crisis }, usage }`; `402` with `code: "limit_reached"` when the monthly limit is used up |
| GET | `/v1/usage` (`?refresh=1` after a purchase) | header `X-Micaiah-User` | `{ plan, subscriptionsEnabled, resetsAt, limits, dream: { used, limit }, prophetic: { used, limit } }` |
| POST | `/v1/report` | `{ reason, themeId, interpretation, steps, prayer, verseRefs }` | `202` — written to the log as an `insight_report` JSON line |

## Run

Requires Node 22.18+ (runs TypeScript directly) and an Anthropic API key.

```bash
npm install
ANTHROPIC_API_KEY=sk-ant-... npm start      # http://localhost:8787
npm test && npm run typecheck
```

Environment:

| Variable | Default | What |
|---|---|---|
| `ANTHROPIC_API_KEY` | — (required) | Claude API key |
| `REVENUECAT_SECRET_KEY` | unset | RevenueCat **secret** API key (v1). Unset = no subscriptions; everyone is on the free plan |
| `REVENUECAT_ENTITLEMENT` | `plus` | Entitlement identifier that Micaiah Plus unlocks |
| `FREE_INTERPRETATIONS_PER_MONTH` | `1` | Free dream and prophetic interpretations per month (each) |
| `PLUS_INTERPRETATIONS_PER_MONTH` | `20` | Micaiah Plus fair-use limit per month (each) |
| `USAGE_FILE` | unset (memory only) | JSON file for monthly counts; put it on a persistent volume |
| `PORT` | `8787` | |
| `RATE_LIMIT_PER_HOUR` / `INTERPRET_RATE_LIMIT_PER_HOUR` | `30` / `20` | Per-IP limits |
| `CATALOG_PATH`, `BIBLE_DIR` | the app's files | Scripture library and Bible locations |

### Costs and limits

With `claude-opus-5-5` ($4 / $20 per million input / output tokens), one dream or prophetic
interpretation costs roughly **$0.05–0.09**. After Apple/Google's 15–30% commission a
$4.99/month subscription brings in about $3.50–4.25, so the default Plus limit of 20 + 20 a
month keeps even the heaviest subscriber roughly break-even, while typical subscribers use far
fewer. Change the limits with the environment variables above — the app reads them from
`/v1/usage`, so no app update is needed.

## Deploy

Any container host works (Fly.io, Render, Railway, Cloud Run). Build from the
repository root so the Scripture library is included:

```bash
docker build -f server/Dockerfile -t micaiah-insight .
docker run -p 8787:8787 -v micaiah-data:/data \
  -e ANTHROPIC_API_KEY=sk-ant-... -e REVENUECAT_SECRET_KEY=sk_... micaiah-insight
```

Serve it over HTTPS, set `ANTHROPIC_API_KEY` and `REVENUECAT_SECRET_KEY` as secrets, mount a
persistent volume at `/data` (so monthly counts survive deploys), and review `insight_report`
log lines regularly; Google Play expects reports of AI content to be acted on.
