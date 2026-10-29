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

## 3. Enable the AI features (cloud insights, Dream Interpretation, Prophetic Word)

Dream Interpretation and Prophetic Word always need the AI service. **Without its URL, the
Interpret tab and Micaiah Plus appear as "Coming soon"** — handy for TestFlight previews.
App Store review rejects placeholder features, so for a store build without the service add
`EXPO_PUBLIC_HIDE_COMING_SOON` = `1` on expo.dev (production) to hide them instead.

1. Deploy `../server` (see its README): set `ANTHROPIC_API_KEY`, mount a volume at `/data`,
   and serve it over HTTPS. Check `https://your-service/health` returns `{"ok":true}`.
2. On expo.dev open the project → **Environment variables** → add
   `EXPO_PUBLIC_INSIGHT_API_URL` = `https://your-service` for the **production** (and
   **preview**) environment (visibility: plain text — it is not a secret).

When this variable is set, the app shows the AI consent dialogs, the Settings toggles, the
Interpret tab, and the iOS privacy manifest declares user content and the install ID. Use
the matching privacy answers in `store/STORE_LISTING.md`.

## 3b. Enable Micaiah Plus (subscription)

Micaiah Plus unlocks Dream Interpretation and Prophetic Word beyond the free allowance
(defaults: 1 free of each per month; 20 of each with Plus — change them on the server with
`FREE_INTERPRETATIONS_PER_MONTH` / `PLUS_INTERPRETATIONS_PER_MONTH`, no app update needed).
Everything else stays free. Purchases go through the App Store / Google Play, managed by
[RevenueCat](https://www.revenuecat.com) (free until $2.5k/month revenue).

1. **App Store Connect**: Business → accept the **Paid Apps** agreement and fill in banking
   and tax. Then your app → Monetization → **Subscriptions** → create group `Micaiah Plus` →
   add `micaiah_plus_monthly` (1 month, $4.99). Optionally add `micaiah_plus_yearly` and a free
   trial (introductory offer). Fill in the localization and review screenshot
   (see `store/STORE_LISTING.md`). Generate an **In-App Purchase key** (Users and Access →
   Integrations → In-App Purchase) for RevenueCat.
2. **Google Play** (when you ship Android): Monetize → Subscriptions → `micaiah_plus_monthly`
   with a monthly base plan.
3. **RevenueCat**: create a project, add the iOS app (bundle ID `com.micaiahai.app`, upload the
   In-App Purchase key) and the Android app. Create the entitlement **`plus`**, attach the
   products, and add them as packages to the **default (current) offering** — the paywall shows
   whatever that offering contains, with prices from the store.
4. **Keys**:
   - expo.dev → Environment variables (production + preview, plain text):
     `EXPO_PUBLIC_REVENUECAT_IOS_KEY` = the `appl_…` public key,
     `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` = the `goog_…` public key.
   - On the server: `REVENUECAT_SECRET_KEY` = a RevenueCat **secret** API key (v1) — keep it
     secret; it is how the server confirms someone has paid.
5. Build a new version (step 4). Test with a **Sandbox** Apple ID (Settings → App Store →
   Sandbox Account on the iPhone): subscribe, check the Interpret tab shows "Plus", delete and
   reinstall, then **Restore purchases**.

The subscription is offered only when both the AI service URL and a RevenueCat key are
set; otherwise its screens are hidden.

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

## Deploy to TestFlight from GitHub (one click)

`.github/workflows/testflight.yml` builds the iOS app on EAS and submits it to
TestFlight. It runs `npm run check` first. One-time setup:

1. **Apple**: enroll in the Apple Developer Program and accept all agreements in
   App Store Connect → Business.
2. **App Store Connect app**: My Apps → + → New App → iOS, name "Micaiah AI",
   bundle ID `com.micaiahai.app` (register it under Certificates, Identifiers & Profiles
   first if it's not listed), SKU `micaiah-ai`. Copy the numeric **Apple ID** shown under
   App Information.
3. **App Store Connect API key**: Users and Access → Integrations → App Store Connect API →
   generate a key with **App Manager** access. Download the `.p8` (you can only download it once)
   and note the **Key ID** and **Issuer ID**.
4. **Expo**: create an account at expo.dev → Account settings → Access tokens → create a token.
5. **GitHub** (repo Settings → Secrets and variables → Actions):

   | Kind | Name | Value |
   |---|---|---|
   | Secret | `EXPO_TOKEN` | Expo access token |
   | Secret | `ASC_API_KEY_P8` | Full contents of the `.p8` file |
   | Secret | `ASC_KEY_ID` | Key ID |
   | Secret | `ASC_ISSUER_ID` | Issuer ID |
   | Secret | `APPLE_TEAM_ID` | 10-character Team ID (developer.apple.com → Membership) |
   | Variable | `ASC_APP_ID` | Numeric Apple ID of the app from step 2 |
   | Variable (optional) | `APPLE_TEAM_TYPE` | `COMPANY_OR_ORGANIZATION` if you enrolled as an organization (default `INDIVIDUAL`) |

6. Actions → **Deploy to TestFlight** → Run workflow. The job starts the build and exits;
   follow progress on expo.dev. About 15–30 minutes later the build appears in
   App Store Connect → TestFlight, ready for internal testers once Apple finishes processing.

If the first run cannot create signing credentials non-interactively, run
`npx eas-cli@latest credentials --platform ios` once on your computer (signed in to the
same Expo account), then re-run the workflow.

## 6. Shipping updates

Bump `version` in `app.json` for user-visible releases (build numbers auto-increment via
`appVersionSource: remote`), run `npm run check`, then build and submit again.

### Over-the-air (OTA) updates

Builds include `expo-updates`, so JavaScript-only changes (screens, text, logic, styling)
can reach installed builds without a new TestFlight build or App Review:
Actions → **Publish OTA update** → Run workflow (message + channel). The update reaches
builds with the same app `version` on that channel; the app downloads it in the background
and uses it on the next launch.

Still needs a new build: adding or upgrading native modules, permissions, icons/splash,
anything in `app.json` / `app.config.js`, a new `version`, or new `EXPO_PUBLIC_*` values
(those are fixed into each build and update at build time — publish an update after changing
them). Builds made before OTA support was added can't receive updates. Apple allows OTA
updates that fix bugs or improve existing features; new features should still go through
review.

## Review checklist (what the stores look for)

- [ ] App is complete: no placeholders, no "coming soon" features, and every button works
      (set `EXPO_PUBLIC_INSIGHT_API_URL`, or `EXPO_PUBLIC_HIDE_COMING_SOON=1`, for the store build)
- [x] No login wall; nothing to delete server-side (no accounts)
- [x] Permission prompts appear only when needed, with clear purpose strings
- [x] Privacy policy available in-app (Settings → Legal) and at a public URL
- [x] In-app "Delete all data"
- [x] Crisis resources for self-harm language; disclaimer that it is not professional care
- [x] AI processing is opt-in, discloses the provider (Anthropic Claude), and has in-app reporting
- [x] iOS privacy manifest, `ITSAppUsesNonExemptEncryption=false`, no push entitlement
- [x] Android target SDK 36, no unnecessary permissions (location, camera, storage and AD_ID are blocked)
- [x] Scripture text is public domain (KJV, WEB, ASV, BBE)
- [x] Subscription screen shows price, period, auto-renew terms, Restore purchases, and Terms/Privacy links
- [x] Dream / prophetic interpretations are labelled as AI reflections, not prophecy or predictions
- [ ] Privacy/support URLs are live (step 2)
- [ ] Screenshots captured from simulator/device
- [ ] Store answers match the build (cloud AI on or off, Plus on or off)
- [ ] Subscription product submitted with the app version (Plus build)
