# Micaiah AI — mobile app (iOS & Android)

Expo SDK 58 / React Native app for the Micaiah AI spiritual companion:
speak or write a reflection → receive KJV Scripture, a gentle interpretation,
three next steps, and a prayer → saved in a private on-device journal.

## Features

- **Reflect** by typing or by voice (on-device speech recognition when supported)
- **Insights** generated on-device from a curated Scripture library (18 themes, KJV),
  or — optionally, with explicit consent — written by Claude through `../server`
- **Journal** with search, theme filters, favorites, streaks, and export
- **Bible Insight** browser by theme, verse of the day, daily local reminder
- **Safety**: crisis-language detection puts crisis resources first; always-available "Get help now"
- **Privacy**: no account, no analytics, no ads; "Delete all data" in Settings

## Develop

```bash
npm install
npm run check          # typecheck + lint + jest
npx eas-cli@latest build --profile development --platform android   # one-time: dev client (needed for voice)
npx expo start         # then open the project in the dev client
```

Set `EXPO_PUBLIC_INSIGHT_API_URL` (e.g. in `.env.local`) to point at a running insight
server to try cloud insights.

## Project layout

| Path | What |
|---|---|
| `src/app/` | Screens (Expo Router): onboarding, tabs (Today, Journal, Scripture, Settings), reflect, listen, entry, theme, crisis, legal |
| `src/lib/insight-engine.ts` | On-device theme detection and insight composition |
| `src/lib/cloud-insight.ts` | Optional cloud client; validates responses and maps verse refs to bundled KJV text |
| `src/lib/crisis.ts` | Crisis-language detection and resources |
| `src/data/scripture.json` | Curated KJV library — shared with the server |
| `src/lib/legal.ts` | Privacy Policy & Terms (rendered in-app and into the website pages) |
| `app.json` / `app.config.js` | Store configuration, permissions, privacy manifest |
| `eas.json` | Cloud build & submit profiles |
| `store/` | Listing copy, privacy answers, review notes, graphics |
| `scripts/` | Icon and legal-page generators |

## Release

See [RELEASE.md](RELEASE.md) and [store/STORE_LISTING.md](store/STORE_LISTING.md).
