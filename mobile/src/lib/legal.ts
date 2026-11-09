/**
 * Legal documents shown inside the app. The same text is published on the
 * website (privacy.html / terms.html) so store listings can link to it.
 */
export const SUPPORT_EMAIL = 'siastesfinance@gmail.com';
export const WEBSITE_URL = 'https://micaiah-website.netlify.app';
export const PRIVACY_URL = `${WEBSITE_URL}/privacy.html`;
export const TERMS_URL = `${WEBSITE_URL}/terms.html`;
export const SUPPORT_URL = `${WEBSITE_URL}/support.html`;
export const LEGAL_EFFECTIVE_DATE = 'November 9, 2026';

export type LegalSection = { heading: string; body: string };
export type LegalDoc = { title: string; sections: LegalSection[] };

export const PRIVACY_POLICY: LegalDoc = {
  title: 'Privacy Policy',
  sections: [
    {
      heading: 'Summary',
      body: 'Micaiah AI is designed so that your reflections stay yours. There is no account, no advertising, no analytics, and no tracking. Insights, dream interpretations and prophetic-word reflections are all created on your device, and your journal is stored only on your device. We do not collect any of your data.',
    },
    {
      heading: 'Information stored on your device',
      body: 'The reflections you write or speak, the insights generated for them, the dreams and prophetic words you write and their interpretations, your optional first name, and your app preferences (such as reminder time and Bible translation) are stored locally on your device. We do not have access to this data, and the app does not upload it anywhere.',
    },
    {
      heading: 'How insights and interpretations are created',
      body: 'Micaiah AI uses a Scripture library built into the app to prepare insights, dream interpretations and prophetic-word reflections entirely on your device. The text you write is never sent to us or to any AI service, and it is never used to train AI models.',
    },
    {
      heading: 'Voice input',
      body: 'If you choose to speak a reflection, the app uses your device\'s built-in speech recognition service (Apple Speech on iOS, the system speech service on Android) to convert your voice to text. Where your device supports it, recognition runs on-device. If it does not, your operating system provider may process the audio according to its own privacy policy. Micaiah AI does not record, store, or upload your audio. Microphone and speech recognition permissions are only requested when you tap the microphone, and you can revoke them at any time in your device settings.',
    },
    {
      heading: 'Purchases',
      body: 'This version of Micaiah AI is free and has no in-app purchases. If we add optional online features or subscriptions in a future version, the app will explain them and ask before any text leaves your device, and we will update this policy before that version is released.',
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
      body: 'Your data remains on your device until you delete it. You can delete individual entries in the Journal or the Interpret tab, or erase everything using Settings → Delete all data. Uninstalling the app also removes all of its data from your device. Because we never receive your data, there is nothing for us to delete on our side.',
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
      heading: 'Dreams and prophetic words',
      body: 'Dream Interpretation and Prophetic Word give automatically generated reflections that connect what you share with Scripture. They are not prophecy, divine revelation, or a word from God, and they do not predict the future. Scripture teaches believers to test every word (1 Thessalonians 5:21). Do not make important decisions on the basis of an interpretation alone; pray, read the Scripture yourself, and seek counsel from your pastor or mature believers.',
    },
    {
      heading: 'Price',
      body: 'Micaiah AI is free to download and use, and this version has no in-app purchases. If paid features are added in the future, their price and terms will be shown clearly in the app before you buy.',
    },
    {
      heading: 'Scripture',
      body: 'Bible text is from the King James Version, the World English Bible, the American Standard Version, and the Bible in Basic English, all of which are in the public domain.',
    },
    {
      heading: 'Your content',
      body: 'You own your reflections, dreams and prophetic words, and their interpretations. They are stored on your device. You are responsible for keeping backups if you want them; use Settings → Export journal to save a copy.',
    },
    {
      heading: 'Acceptable use',
      body: 'Do not use the app to break the law or to harass others. If an insight or interpretation seems inappropriate, please report it using the "Report" option or by email so we can improve.',
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
