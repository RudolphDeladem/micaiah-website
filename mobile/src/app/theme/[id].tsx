import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Share, View } from 'react-native';

import { VerseCard } from '@/components/insight-view';
import { Card, PrimaryButton, Screen, SecondaryButton, T } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { TRANSLATION, getTheme } from '@/lib/scripture';

export default function ThemeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = getTheme(id);

  if (!theme) {
    return (
      <Screen edges={[]}>
        <T>This theme could not be found.</T>
      </Screen>
    );
  }

  const share = () =>
    Share.share({
      message: `${theme.label}\n\n${theme.verses.map((v) => `“${v.text}” — ${v.ref} (${TRANSLATION})`).join('\n\n')}\n\nShared from Micaiah AI`,
    }).catch(() => {});

  return (
    <Screen edges={[]} contentStyle={{ gap: Spacing.md }}>
      <Stack.Screen options={{ title: theme.label }} />
      <Card style={{ gap: Spacing.sm }}>
        <T variant="label">✦ Reflection</T>
        <T>{theme.interpretations[0]}</T>
      </Card>
      {theme.verses.map((verse, i) => (
        <VerseCard key={verse.ref} verse={verse} tone={i % 2 === 0 ? 'indigo' : 'gold'} />
      ))}
      <Card tone="gold" style={{ gap: Spacing.sm }}>
        <T variant="label" style={{ color: Colors.gold }}>
          ✦ Pray
        </T>
        <T variant="verse" style={{ fontSize: 19, lineHeight: 27 }}>
          {theme.prayers[0]}
        </T>
      </Card>
      <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
        <PrimaryButton
          label="Reflect on this"
          icon="create-outline"
          onPress={() => router.push({ pathname: '/reflect', params: { mode: 'daily', prompt: theme.label } })}
        />
        <SecondaryButton label="Share these verses" icon="share-outline" onPress={share} />
      </View>
    </Screen>
  );
}
