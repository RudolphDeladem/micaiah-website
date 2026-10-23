/**
 * Legal documents shown inside the app. The same text is published on the
 * website (privacy.html / terms.html) so store listings can link to it.
 */
export const SUPPORT_EMAIL = 'siastesfinance@gmail.com';
export const WEBSITE_URL = 'https://rudolphdeladem.github.io/micaiah-website';
export const PRIVACY_URL = `${WEBSITE_URL}/privacy.html`;
export const TERMS_URL = `${WEBSITE_URL}/terms.html`;
export const SUPPORT_URL = `${WEBSITE_URL}/support.html`;
export const LEGAL_EFFECTIVE_DATE = 'October 23, 2026';

export type LegalSection = { heading: string; body: string };
export type LegalDoc = { title: string; sections: LegalSection[] };

export const PRIVACY_POLICY: LegalDoc = {
  title: 'Privacy Policy',
  sections: [
    {
      heading: 'Summary',
      body: 'Micaiah AI is designed so that your reflections stay yours. There is no account, no advertising, no analytics, and no tracking. Your journal is stored only on your device.',
    },
    {
      heading: 'Information stored on your device',
      body: 'The reflections you write or speak, the insights generated for them, your optional first name, and your app preferences (such as reminder time) are stored locally on your device. We do not have access to this data and it is not uploaded to our servers.',
    },
    {
      heading: 'Voice input',
      body: 'If you choose to speak a reflection, the app uses your device\'s built-in speech recognition service (Apple Speech on iOS, the system speech service on Android) to convert your voice to text. Where your device supports it, recognition runs on-device. If it does not, your operating system provider may process the audio according to its own privacy policy. Micaiah AI does not record, store, or upload your audio. Microphone and speech recognition permissions are only requested when you tap the microphone, and you can revoke them at any time in your device settings.',
    },
    {
      heading: 'Optional cloud insights',
      body: 'By default, insights are generated entirely on your device. In some versions of the app you may choose to turn on "Cloud insights" in Settings. Only if you explicitly opt in, the text of each reflection you submit is sent over an encrypted connection to the Micaiah AI insight service, which uses Anthropic\'s Claude AI model to write a personalised reflection. The text is used only to generate that response: Micaiah AI does not store it after the response is returned, does not sell it, and does not use it to train AI models. Anthropic processes the text as our service provider under its commercial terms, which do not permit training on it; Anthropic may retain it for a limited period for safety and abuse monitoring. You can turn cloud insights off at any time, and the app will return to on-device insights.',
    },
    {
      heading: 'Notifications',
      body: 'Daily reminders are scheduled locally on your device. We do not use push notification servers and do not collect a device token.',
    },
    {
      heading: 'Sharing',
      body: 'If you use the Share button, the content you choose is passed to the app you select (for example, Messages). Nothing is shared without your action.',
    },
    {
      heading: 'Data retention and deletion',
      body: 'Your data remains on your device until you delete it. You can delete individual entries in the Journal, or erase everything using Settings → Delete all data. Uninstalling the app also removes all of its data from your device.',
    },
    {
      heading: 'Children',
      body: 'Micaiah AI is not directed to children under 13, and we do not knowingly collect personal information from children.',
    },
    {
      heading: 'Changes',
      body: 'If we change this policy, we will update the effective date and, for material changes, notify you in the app before the change takes effect.',
    },
    {
      heading: 'Contact',
      body: `Questions about privacy? Email ${SUPPORT_EMAIL}.`,
    },
  ],
};

export const TERMS_OF_USE: LegalDoc = {
  title: 'Terms of Use',
  sections: [
    {
      heading: 'Welcome',
      body: 'By using Micaiah AI you agree to these terms. If you do not agree, please do not use the app.',
    },
    {
      heading: 'A devotional companion, not professional advice',
      body: 'Micaiah AI offers Scripture-based devotional encouragement for personal reflection. It is not a substitute for pastoral care, professional counseling, therapy, or medical, legal, or financial advice. Insights are generated automatically and may be imperfect. Always test what you read against Scripture and seek wise counsel for important decisions.',
    },
    {
      heading: 'If you are in crisis',
      body: 'Micaiah AI is not an emergency service. If you are thinking about harming yourself or others, or you are in danger, contact your local emergency number or a crisis line immediately. Crisis resources are always available in the app under Settings → Get help now.',
    },
    {
      heading: 'Scripture',
      body: 'Bible verses are quoted from the King James Version, which is in the public domain.',
    },
    {
      heading: 'Your content',
      body: 'You own your reflections. They are stored on your device. You are responsible for keeping backups if you want them; use Settings → Export journal to save a copy.',
    },
    {
      heading: 'Acceptable use',
      body: 'Do not use the app to break the law, to harass others, or to attempt to disrupt or reverse engineer the optional insight service. If an insight seems inappropriate, please report it using the "Report" option so we can improve.',
    },
    {
      heading: 'Availability',
      body: 'The app is provided "as is". We work hard to keep it reliable but cannot guarantee it will always be available or error-free. To the fullest extent permitted by law, Micaiah AI is not liable for indirect or consequential damages arising from your use of the app.',
    },
    {
      heading: 'Changes',
      body: 'We may update these terms. Continued use after an update means you accept the revised terms.',
    },
    {
      heading: 'Contact',
      body: `Email ${SUPPORT_EMAIL} with any questions.`,
    },
  ],
};
