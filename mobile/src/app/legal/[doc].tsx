import { Stack, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { View } from 'react-native';

import { Screen, SecondaryButton, T } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { LEGAL_EFFECTIVE_DATE, PRIVACY_POLICY, PRIVACY_URL, TERMS_OF_USE, TERMS_URL } from '@/lib/legal';

export default function LegalDocument() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const isTerms = doc === 'terms';
  const content = isTerms ? TERMS_OF_USE : PRIVACY_POLICY;
  const url = isTerms ? TERMS_URL : PRIVACY_URL;

  return (
    <Screen edges={[]} contentStyle={{ gap: Spacing.lg }}>
      <Stack.Screen options={{ title: content.title }} />
      <T variant="small">Effective {LEGAL_EFFECTIVE_DATE}</T>
      {content.sections.map((section) => (
        <View key={section.heading} style={{ gap: Spacing.xs }}>
          <T variant="heading">{section.heading}</T>
          <T selectable>{section.body}</T>
        </View>
      ))}
      <SecondaryButton
        label="View on the web"
        icon="open-outline"
        onPress={() => WebBrowser.openBrowserAsync(url).catch(() => {})}
      />
    </Screen>
  );
}
