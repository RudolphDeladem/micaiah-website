import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import { useEffect } from 'react';
import { Alert, Linking, Share, View } from 'react-native';

import { InsightView } from '@/components/insight-view';
import { Card, IconButton, Screen, SecondaryButton, T } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { reportInsight } from '@/lib/report';
import { SUPPORT_EMAIL } from '@/lib/legal';
import { TRANSLATION } from '@/lib/scripture';
import { useStore } from '@/lib/store';

const REPORT_REASONS = ['Unhelpful or inaccurate', 'Theologically concerning', 'Offensive or harmful'];

export default function EntryDetail() {
  const { id, fresh, offline } = useLocalSearchParams<{ id: string; fresh?: string; offline?: string }>();
  const { entries, updateEntry, deleteEntry } = useStore();
  const entry = entries.find((e) => e.id === id);

  // Politely ask for a rating only after a few meaningful moments, never on first use.
  useEffect(() => {
    if (fresh === '1' && (entries.length === 5 || entries.length === 20)) {
      StoreReview.hasAction()
        .then((ok) => {
          if (ok) return StoreReview.requestReview();
        })
        .catch(() => {});
    }
    // Only on first render of a freshly created entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!entry) {
    return (
      <Screen edges={[]}>
        <Stack.Screen options={{ title: 'Reflection' }} />
        <T>This reflection could not be found.</T>
      </Screen>
    );
  }

  const share = () => {
    const verses = entry.insight.verses.map((v) => `“${v.text}” — ${v.ref} (${TRANSLATION})`).join('\n\n');
    Share.share({ message: `${verses}\n\n${entry.insight.prayer}\n\nShared from Micaiah AI` }).catch(() => {});
  };

  const sendReport = async (reason: string) => {
    const sent = await reportInsight(entry.insight, reason);
    if (sent) {
      Alert.alert('Thank you', 'Your report was sent. It helps us keep Micaiah safe and faithful.');
      return;
    }
    const body = encodeURIComponent(
      `Reason: ${reason}\nTheme: ${entry.insight.themeLabel}\nSource: ${entry.insight.source}\n\nInsight:\n${entry.insight.interpretation}`,
    );
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Micaiah insight report')}&body=${body}`).catch(
      () => Alert.alert('Could not open email', `Please email ${SUPPORT_EMAIL} to report this insight.`),
    );
  };

  const report = () =>
    Alert.alert('Report this insight', 'What is wrong with this response? Your reflection text is not included.', [
      ...REPORT_REASONS.map((reason) => ({ text: reason, onPress: () => sendReport(reason) })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);

  const remove = () =>
    Alert.alert('Delete this reflection?', 'It will be permanently removed from your journal.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteEntry(entry.id);
          router.back();
        },
      },
    ]);

  return (
    <Screen edges={[]} contentStyle={{ gap: Spacing.md }}>
      <Stack.Screen
        options={{
          title: fresh === '1' ? 'Your insight' : new Date(entry.createdAt).toLocaleDateString(),
          headerLeft:
            fresh === '1'
              ? () => <IconButton icon="close" label="Done" color={Colors.indigo} onPress={() => router.dismissTo('/')} />
              : undefined,
          headerRight: () => (
            <View style={{ flexDirection: 'row' }}>
              <IconButton
                icon={entry.favorite ? 'star' : 'star-outline'}
                label={entry.favorite ? 'Remove from saved' : 'Save to favorites'}
                color={Colors.gold}
                onPress={() => updateEntry(entry.id, { favorite: !entry.favorite })}
              />
              <IconButton icon="share-outline" label="Share" color={Colors.indigo} onPress={share} />
            </View>
          ),
        }}
      />

      {offline === '1' ? (
        <T variant="small" style={{ textAlign: 'center' }}>
          The cloud insight service was unreachable, so this insight was prepared on your device.
        </T>
      ) : null}

      <Card style={{ gap: Spacing.xs }}>
        <T variant="label">✦ Your reflection</T>
        <T selectable style={{ fontStyle: 'italic' }}>
          “{entry.text}”
        </T>
      </Card>

      <InsightView insight={entry.insight} />

      <View style={{ gap: Spacing.sm, marginTop: Spacing.md }}>
        <SecondaryButton label="Share Scripture & prayer" icon="share-outline" onPress={share} />
        <SecondaryButton label="Report this insight" icon="flag-outline" onPress={report} />
        <SecondaryButton label="Delete reflection" icon="trash-outline" tone="danger" onPress={remove} />
      </View>
    </Screen>
  );
}
