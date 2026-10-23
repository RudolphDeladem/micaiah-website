# Releasing Micaiah AI to the App Store and Google Play

Builds run in the cloud with [EAS](https://docs.expo.dev/eas/), so no Mac or Android
Studio is required. Allow 1–3 days for Apple review; Google review usually takes a few
hours to a few days (up to a week for brand-new developer accounts).

## 0. Accounts you need

| Store | Account | Cost |
|---|---|---|
| Apple | [Apple Developer Program](https://developer.apple.com/programs/) | US$99/year |
| Google | [Google Play Console](https://play.google.com/console/signup) | US$25 one-time |
| Builds | [Expo account](https://expo.dev/signup) | Free tier is enough |

> **New personal Google Play accounts** must run a **closed test with at least 12
> testers opted in for 14 consecutive days** before they can apply for production
> access. Start that clock early (step 5).

## 1. One-time project setup

```bash
cd mobile
npm install
npx eas-cli@latest login
npx eas-cli@latest init          # links the project and writes extra.eas.projectId into app.json
```

Check the identifiers in `app.json` before the first build; they can never be changed
after the first store upload:

- iOS `bundleIdentifier`: `com.micaiahai.app`
- Android `package`: `com.micaiahai.app`

## 2. Publish the website pages the stores link to

The stores require a working privacy-policy URL. Enable GitHub Pages
(repo Settings → Pages → Deploy from branch → `main`, `/ (root)`), then confirm these load:

- https://rudolphdeladem.github.io/micaiah-website/privacy.html
- https://rudolphdeladem.github.io/micaiah-website/terms.html
- https://rudolphdeladem.github.io/micaiah-website/support.html

If you host the site elsewhere, update `WEBSITE_URL` in `src/lib/legal.ts`.

## 3. (Optional) Enable cloud AI insights

See `../server/README.md` to deploy the insight service, then set its URL for builds:
on expo.dev open the project → **Environment variables** → add
`EXPO_PUBLIC_INSIGHT_API_URL` = `https://your-insight-service.example` for the
**production** environment (visibility: plain text — it is not a secret).

When this variable is set, the app shows the AI consent dialog, the Settings toggle,
and the iOS privacy manifest declares user content. Use the matching privacy answers
in `store/STORE_LISTING.md`.

## 4. Build

```bash
npm run check                 # typecheck + lint + unit tests — must pass
npm run build:ios             # EAS creates certificates & provisioning for you
npm run build:android         # EAS creates and stores the upload keystore for you
```

To try a build on a real phone first: `npx eas-cli@latest build --profile preview --platform android`
(installable APK) or `--profile development` for a dev client. Voice input needs a real
build; it does not work in Expo Go.

## 5. Submit

### Google Play
1. Create the app in Play Console (name, default language, App, Free).
2. Complete **App content** and **Store listing** using `store/STORE_LISTING.md`.
3. The first upload must be manual: Testing → Internal testing → Create release → upload the `.aab` from the EAS build page.
4. New personal accounts: create a **Closed testing** track, add ≥12 testers, keep it running for 14 days, then apply for production.
5. Later releases: create a Google Cloud service account with Play Console access, save its key as `mobile/google-service-account.json` (gitignored), and run `npm run submit:android`.

### App Store
1. In App Store Connect create the app (bundle ID `com.micaiahai.app`, SKU `micaiah-ai`).
2. Put the numeric **Apple ID** of the app into `eas.json` → `submit.production.ios.ascAppId`.
3. `npm run submit:ios` uploads the build to TestFlight.
4. Fill in the listing, App Privacy, age rating and review notes from `store/STORE_LISTING.md`, attach the build, and **Submit for Review**.

## 6. Shipping updates

Bump `version` in `app.json` for user-visible releases (build numbers auto-increment via
`appVersionSource: remote`), run `npm run check`, then build and submit again.

## Review checklist (what the stores look for)

- [x] App is complete: no placeholders, no "coming soon" features, and every button works
- [x] No login wall; nothing to delete server-side (no accounts)
- [x] Permission prompts appear only when needed, with clear purpose strings
- [x] Privacy policy available in-app (Settings → Legal) and at a public URL
- [x] In-app "Delete all data"
- [x] Crisis resources for self-harm language; disclaimer that it is not professional care
- [x] AI processing is opt-in, discloses the provider (Anthropic Claude), and has in-app reporting
- [x] iOS privacy manifest, `ITSAppUsesNonExemptEncryption=false`, no push entitlement
- [x] Android target SDK 36, no unnecessary permissions (location, camera, storage and AD_ID are blocked)
- [x] Scripture text is public domain (KJV)
- [ ] Privacy/support URLs are live (step 2)
- [ ] Screenshots captured from simulator/device
- [ ] Store answers match the build (cloud AI on or off)
