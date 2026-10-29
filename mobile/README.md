# Micaiah AI — mobile app (iOS & Android)

Expo SDK 58 / React Native app for the Micaiah AI spiritual companion:
speak or write a reflection → receive KJV Scripture, a gentle interpretation,
three next steps, and a prayer → saved in a private on-device journal.

## Features

- **Reflect** by typing or by voice (on-device speech recognition when supported)
- **Insights** generated on-device from a curated Scripture library (18 themes, KJV),
  or — optionally, with explicit consent — written by Claude through `../server`
- **Journal** with search, theme filters, favorites, streaks, and export
- **Bible** reader with the full text offline in four public-domain translations (KJV, WEB,
  ASV, BBE): continue reading, chapter navigation, share a verse
- **Bible Insight** topics, verse of the day, daily local reminder
- **Dream Interpretation** and **Prophetic Word** (needs the AI service): Scripture-based
  reflections on a dream or a word received, with passages, cautions, steps, and a prayer
- **Micaiah Plus** (optional subscription via RevenueCat) unlocks more dream and prophetic
  interpretations a month; everything else is free
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
server to try cloud insights and the Interpret tab. Add `EXPO_PUBLIC_REVENUECAT_IOS_KEY` /
`EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` to try Micaiah Plus (needs a development build).

## Project layout

| Path | What |
|---|---|
| `src/app/` | Screens (Expo Router): onboarding, tabs (Today, Bible, Interpret, Journal, Settings), reflect, listen, entry, read, interpret, interpretation, plus, topics, theme, crisis, legal |
| `src/lib/insight-engine.ts` | On-device theme detection and insight composition |
| `src/lib/cloud-insight.ts` | Optional cloud client; validates responses and maps verse refs to bundled KJV text |
| `src/lib/crisis.ts` | Crisis-language detection and resources |
| `src/data/scripture.json` | Curated KJV library — shared with the server |
| `assets/bibles/*.bible`, `src/lib/bible*.ts` | Full Bible text (built by `scripts/build-bibles.mjs`), loaded on demand |
| `src/lib/interpret.ts`, `src/lib/subscription.tsx` | Dream / prophetic client and Micaiah Plus (RevenueCat) |
| `src/lib/legal.ts` | Privacy Policy & Terms (rendered in-app and into the website pages) |
| `app.json` / `app.config.js` | Store configuration, permissions, privacy manifest |
| `eas.json` | Cloud build & submit profiles |
| `store/` | Listing copy, privacy answers, review notes, graphics |
| `scripts/` | Icon and legal-page generators |

## Release

See [RELEASE.md](RELEASE.md) and [store/STORE_LISTING.md](store/STORE_LISTING.md).
