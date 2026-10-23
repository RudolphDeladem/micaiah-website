# Micaiah AI — Store listing & review answers

Copy-paste material for App Store Connect and Google Play Console. Everything here
matches what the app actually does; keep it that way when the app changes, because
inaccurate metadata or privacy answers are the most common reason for rejection.

> **Decide first: will v1.0 ship with cloud AI?**
> The app works fully offline with curated, on-device insights. The "AI" in
> "Micaiah AI" is only accurate when the optional cloud insight service (Claude) is
> deployed and the build has `EXPO_PUBLIC_INSIGHT_API_URL` set. Either ship with
> the service enabled, or use the alternative name **"Micaiah: Scripture Journal"**
> for an on-device-only release. The privacy answers below differ for each case.

---

## Common

| Field | Value |
|---|---|
| App name (≤30) | `Micaiah AI` |
| Subtitle / short description (iOS ≤30, Play ≤80) | iOS: `Speak. Reflect. Receive.` · Play: `Speak or write your heart and receive Scripture-based insight and prayer.` |
| Primary category | Lifestyle (iOS secondary: Reference) · Play: Lifestyle |
| Support URL | https://rudolphdeladem.github.io/micaiah-website/support.html |
| Marketing URL | https://rudolphdeladem.github.io/micaiah-website/ |
| Privacy Policy URL | https://rudolphdeladem.github.io/micaiah-website/privacy.html |
| Contact email | siastesfinance@gmail.com |
| Price | Free, no in-app purchases, no ads |
| Copyright | © 2026 Micaiah AI |

The URLs assume GitHub Pages is enabled for this repository
(Settings → Pages → Deploy from branch → `main` / root). Open each URL before
submitting; a broken privacy-policy link is an automatic rejection.

### Keywords (iOS, ≤100 characters, comma-separated, no spaces)

```
bible,prayer,journal,devotional,scripture,faith,christian,verse,reflection,gratitude,god,jesus,peace
```

### Promotional text (iOS, ≤170)

Speak or write what's on your heart and receive relevant Bible verses, a gentle reflection, simple next steps, and a prayer — saved in a private journal.

### Description (both stores)

```
Micaiah is a quiet, private place to bring your heart before God.

Speak or type a prayer, a worry, or a moment of gratitude — no perfect words needed. Micaiah finds the spiritual theme of what you shared and responds with:

• Relevant Bible verses (King James Version)
• A short, gentle reflection on what Scripture says
• Three simple, practical next steps
• A prayer you can make your own

SPEAK OR WRITE
Use your voice or the keyboard. Voice is converted to text by your device's built-in speech recognition, on-device whenever supported.

THREE WAYS TO REFLECT
• Daily Reflection — process your day and find clarity
• Prayer Journal — write to God and receive Scripture
• Gratitude — count your blessings, big and small

BIBLE INSIGHT
Explore what Scripture says about anxiety, fear, grief, guidance, doubt, loneliness, forgiveness, hope, healing, relationships, purpose, and more.

YOUR PRIVATE JOURNAL
Every reflection is saved on your device — searchable, filterable by theme, with daily streaks to encourage a steady rhythm. No account. No ads. No tracking. Export your journal any time.

DAILY REMINDER
An optional, gentle daily nudge at the time you choose.

CARE WHEN IT MATTERS
If a reflection suggests you may be in danger, Micaiah puts crisis resources first. Help is always one tap away under Settings → Get help now.

Micaiah offers devotional encouragement and is not a substitute for pastoral care, professional counseling, or medical advice.
```

If shipping **with** cloud AI, add this paragraph after "A prayer you can make your own":

```
OPTIONAL CLOUD AI
Turn on cloud insights to receive a reflection written personally for you by Claude, Anthropic's AI model. It's off until you choose it, your words are never used to train AI, and Scripture always comes from the built-in KJV library.
```

### What's New (v1.0)

```
Welcome to Micaiah — speak, reflect, and receive Scripture-based insight.
```

---

## Apple App Store Connect

### App Privacy ("nutrition label")

**On-device build (no `EXPO_PUBLIC_INSIGHT_API_URL`):** choose **"Data Not Collected"**.

**Cloud AI build:**
- Data type: **User Content → Other User Content**
- Used for: **App Functionality** only
- Linked to the user's identity: **No**
- Used for tracking: **No**

(The iOS privacy manifest in the build is generated to match: see `app.config.js`.)

### Age rating questionnaire

Answer **None / No** to every content category (violence, sexual content, profanity,
drugs, gambling, horror, mature themes, medical/treatment information). Unrestricted
web access: **No**. User-generated content shared with others: **No**.
Expected rating: **4+**.

### Export compliance

`ITSAppUsesNonExemptEncryption` is already `false` in the build (only standard HTTPS),
so no export-compliance documents are needed.

### App Review Information → Notes

```
Thank you for reviewing Micaiah.

• No account or sign-in is required. Tap "Get Started", optionally enter a first name, accept the Terms, and you are in.
• To test the core flow: Today → Write → type e.g. "I feel anxious about my exams" → Generate Insight. You'll receive KJV verses, a reflection, steps, and a prayer, saved to the Journal tab.
• Voice: Today → Speak. The microphone and speech-recognition permissions are requested only at that moment. "Type instead" is always available.
• Safety: reflections mentioning self-harm (e.g. "I want to end my life") show crisis resources (988, Samaritans, findahelpline.com) before any devotional content. Settings → Get help now is always available.
• Privacy: all data is stored on-device only. Settings → Delete all data erases everything. There is no account, analytics, advertising, or tracking.
• Scripture is quoted from the King James Version (public domain).
[Cloud AI build only:] Cloud insights are off until the user opts in through an explicit consent dialog that names Anthropic's Claude as the AI provider; insights can be reported in-app via "Report this insight".
```

Demo account: **not required** (leave "Sign-in required" unchecked).

### Screenshots

Required: 6.9" iPhone (1320×2868 or 1290×2796) and, because the app supports iPad,
13" iPad (2064×2752). Capture from the iOS Simulator with a few sample reflections:
Welcome · Today · Write · Seeking wisdom · Insight · Journal · Bible Insight.

---

## Google Play Console

### Data safety form

**On-device build:** "Does your app collect or share any of the required user data types?" → **No**.

**Cloud AI build:**
- Collects data: **Yes**. Shares data: **No** (Anthropic acts as a service provider, which Google does not count as sharing).
- Data type: **App activity → Other user-generated content**
  - Collected, **processed ephemerally: Yes**, **optional (user can choose): Yes**
  - Purpose: **App functionality**
- Encrypted in transit: **Yes**
- Users can request deletion: **Yes** (nothing is retained server-side; on-device data is deleted via Settings → Delete all data)

### App content declarations

| Declaration | Answer |
|---|---|
| Privacy policy | URL above |
| Ads | No ads |
| App access | All functionality available without special access |
| Content rating (IARC) | Category: Reference/Lifestyle; no violence, sexuality, language, controlled substances, gambling; no user interaction/sharing; expected **Everyone** |
| Target audience | 13+ (not designed for children) |
| News app | No |
| Health apps | "My app does not have any health features" |
| Government app | No |
| Financial features | None |
| Data safety | See above |
| AI-generated content (cloud build) | Yes — users can report offensive content in-app ("Report this insight") |

### Graphics

- App icon 512×512: `store/graphics/play-icon-512.png`
- Feature graphic 1024×500: `store/graphics/play-feature-graphic.png`
- Phone screenshots: at least 2 (recommend 4–8), 1080×1920 or larger, captured from an Android emulator or device.
