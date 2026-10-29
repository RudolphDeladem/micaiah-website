import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Alert, Linking, Share, View } from 'react-native';

import { InterpretationView, KIND_COPY } from '@/components/interpretation-view';
import { Card, IconButton, Screen, SecondaryButton, T } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { formatRef } from '@/lib/bible';
import { SUPPORT_EMAIL } from '@/lib/legal';
import { reportInterpretation } from '@/lib/report';
import { useStore } from '@/lib/store';

const REPORT_REASONS = ['Unhelpful or inaccurate', 'Theologically concerning', 'Offensive or harmful'];

export default function InterpretationDetail() {
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const { interpretations, updateInterpretation, deleteInterpretation } = useStore();
  const item = interpretations.find((i) => i.id === id);

  if (!item) {
    return (
      <Screen edges={[]}>
        <Stack.Screen options={{ title: 'Interpretation' }} />
        <T>This interpretation could not be found.</T>
      </Screen>
    );
  }

  const copy = KIND_COPY[item.kind];

  const share = () => {
    const refs = item.refs.map(formatRef).join(' · ');
    Share.share({
      message: `${item.title}\n\n${item.summary}${refs ? `\n\nRead: ${refs}` : ''}\n\n${item.prayer}\n\nShared from Micaiah AI`,
    }).catch(() => {});
  };

  const sendReport = async (reason: string) => {
    if (await reportInterpretation(item, reason)) {
      Alert.alert('Thank you', 'Your report was sent. It helps us keep Micaiah safe and faithful.');
      return;
    }
    const body = encodeURIComponent(`Reason: ${reason}\nType: ${copy.title}\n\n${item.title}\n${item.summary}`);
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Micaiah interpretation report')}&body=${body}`).catch(
      () => Alert.alert('Could not open email', `Please email ${SUPPORT_EMAIL} to report this interpretation.`),
    );
  };

  const report = () =>
    Alert.alert(
      'Report this interpretation',
      `What is wrong with this response? ${item.kind === 'dream' ? 'Your dream' : 'The word you shared'} is not included.`,
      [...REPORT_REASONS.map((reason) => ({ text: reason, onPress: () => sendReport(reason) })), { text: 'Cancel', style: 'cancel' as const }],
    );

  const remove = () =>
    Alert.alert('Delete this interpretation?', 'It will be permanently removed from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteInterpretation(item.id);
          router.back();
        },
      },
    ]);

  return (
    <Screen edges={[]} contentStyle={{ gap: Spacing.md }}>
      <Stack.Screen
        options={{
          title: fresh === '1' ? copy.title : new Date(item.createdAt).toLocaleDateString(),
          headerLeft:
            fresh === '1'
              ? () => (
                  <IconButton icon="close" label="Done" color={Colors.indigo} onPress={() => router.dismissTo('/interpret')} />
                )
              : undefined,
          headerRight: () => (
            <View style={{ flexDirection: 'row' }}>
              <IconButton
                icon={item.favorite ? 'star' : 'star-outline'}
                label={item.favorite ? 'Remove from saved' : 'Save to favorites'}
                color={Colors.gold}
                onPress={() => updateInterpretation(item.id, { favorite: !item.favorite })}
              />
              <IconButton icon="share-outline" label="Share" color={Colors.indigo} onPress={share} />
            </View>
          ),
        }}
      />

      <Card style={{ gap: Spacing.xs }}>
        <T variant="label">✦ {copy.yours}</T>
        <T selectable style={{ fontStyle: 'italic' }}>
          “{item.text}”
        </T>
      </Card>

      <InterpretationView item={item} />

      <View style={{ gap: Spacing.sm, marginTop: Spacing.md }}>
        <SecondaryButton label="Share" icon="share-outline" onPress={share} />
        <SecondaryButton label="Report this interpretation" icon="flag-outline" onPress={report} />
        <SecondaryButton label="Delete" icon="trash-outline" tone="danger" onPress={remove} />
      </View>
    </Screen>
  );
}
