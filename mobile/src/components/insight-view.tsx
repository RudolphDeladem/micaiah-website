import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { CRISIS_RESOURCES } from '@/lib/crisis';
import { TRANSLATION } from '@/lib/scripture';
import type { Insight, Verse } from '@/lib/types';

import { Card, T } from './ui';

export function VerseCard({ verse, tone = 'indigo' }: { verse: Verse; tone?: 'indigo' | 'gold' }) {
  const onIndigo = tone === 'indigo';
  return (
    <Card tone={tone} style={{ gap: Spacing.sm }}>
      <T variant="verse" style={onIndigo && { color: Colors.white }} selectable>
        “{verse.text}”
      </T>
      <T variant="label" style={{ color: onIndigo ? Colors.goldLight : Colors.gold }}>
        — {verse.ref} ({TRANSLATION})
      </T>
    </Card>
  );
}

export function CrisisCard() {
  return (
    <Card style={styles.crisis}>
      <View style={styles.crisisHeader}>
        <Ionicons name="heart" size={20} color={Colors.danger} />
        <T variant="heading" style={{ color: Colors.danger, flex: 1 }}>
          You don’t have to carry this alone
        </T>
      </View>
      <T>
        It sounds like you may be going through something really painful. Please reach out to someone who can help
        right now — you matter, and support is available.
      </T>
      {CRISIS_RESOURCES.slice(0, 3).map((r) => (
        <Pressable
          key={r.name}
          accessibilityRole={r.url ? 'link' : 'text'}
          disabled={!r.url}
          onPress={() => r.url && Linking.openURL(r.url).catch(() => {})}
          style={styles.crisisRow}>
          <T variant="heading" style={{ fontSize: 15 }}>
            {r.name}
          </T>
          <T variant="small">{r.detail}</T>
        </Pressable>
      ))}
      <Pressable accessibilityRole="button" onPress={() => router.push('/crisis')}>
        <T variant="heading" style={{ color: Colors.indigoMid, fontSize: 15 }}>
          More crisis resources →
        </T>
      </Pressable>
    </Card>
  );
}

export function InsightView({ insight }: { insight: Insight }) {
  return (
    <View style={{ gap: Spacing.md }}>
      {insight.crisis ? <CrisisCard /> : null}

      <Card style={{ gap: Spacing.sm }}>
        <T variant="label">✦ Interpretation · {insight.themeLabel}</T>
        <T selectable>{insight.interpretation}</T>
      </Card>

      <T variant="label" style={{ marginTop: Spacing.sm }}>
        ✦ Scripture
      </T>
      {insight.verses.map((verse, i) => (
        <VerseCard key={verse.ref} verse={verse} tone={i === 0 ? 'indigo' : 'gold'} />
      ))}

      <Card style={{ gap: Spacing.md }}>
        <T variant="label">✦ Gentle steps</T>
        {insight.steps.map((step, i) => (
          <View key={step} style={styles.step}>
            <View style={styles.stepNum}>
              <T variant="small" style={{ color: Colors.indigo, fontFamily: 'DMSans_600SemiBold' }}>
                {i + 1}
              </T>
            </View>
            <T style={{ flex: 1 }}>{step}</T>
          </View>
        ))}
      </Card>

      <Card tone="gold" style={{ gap: Spacing.sm }}>
        <T variant="label" style={{ color: Colors.gold }}>
          ✦ A prayer for today
        </T>
        <T variant="verse" style={{ fontSize: 19, lineHeight: 27 }} selectable>
          {insight.prayer}
        </T>
      </Card>

      <T variant="small" style={{ textAlign: 'center', marginTop: Spacing.sm }}>
        {insight.source === 'cloud'
          ? 'Reflection written by AI (Claude) · Scripture from the KJV library'
          : 'Generated privately on your device'}
        {'\n'}Devotional encouragement — not a substitute for pastoral or professional care.
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  crisis: { gap: Spacing.md, borderColor: 'rgba(179,38,30,0.25)', backgroundColor: Colors.dangerPale },
  crisisHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  crisisRow: { gap: 2 },
  step: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.indigoGhost,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
  },
});
