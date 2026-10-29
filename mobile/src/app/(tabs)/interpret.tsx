import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { KIND_COPY } from '@/components/interpretation-view';
import { Card, Screen, T, tapFeedback } from '@/components/ui';
import { Colors, Gradients, Radius, Spacing } from '@/constants/theme';
import { interpretComingSoon, remaining, type Usage } from '@/lib/interpret';
import { useStore } from '@/lib/store';
import { purchasesAvailable, useSubscription } from '@/lib/subscription';
import type { InterpretationKind } from '@/lib/types';

const KINDS: InterpretationKind[] = ['dream', 'prophetic'];

function allowanceLabel(usage: Usage | null, kind: InterpretationKind): string | null {
  const left = remaining(usage, kind);
  if (left === null || !usage) return null;
  if (usage.plan === 'plus') return `Plus · ${left} of ${usage[kind].limit} left this month`;
  if (usage[kind].limit === 0) return 'Included with Micaiah Plus';
  return left > 0 ? `${left} free this month` : 'Free use for this month is used';
}

export default function Interpret() {
  const { interpretations, settings } = useStore();
  const { usage, isPlus, refreshUsage } = useSubscription();

  // Counts change after purchases and at the start of each month — refresh whenever the tab is shown.
  useFocusEffect(
    useCallback(() => {
      if (settings.interpretConsent) refreshUsage();
    }, [refreshUsage, settings.interpretConsent]),
  );

  const start = (kind: InterpretationKind) => {
    tapFeedback();
    if (interpretComingSoon) {
      Alert.alert(
        `${KIND_COPY[kind].title} — coming soon`,
        kind === 'dream'
          ? 'Soon you’ll be able to describe a dream and receive a Scripture-based reflection: what it may mean, the images in it, passages to read, gentle cautions, next steps, and a prayer.'
          : 'Soon you’ll be able to share a prophetic word you received and weigh it with Scripture: what it is saying, the themes it echoes, anything to be careful about, next steps, and a prayer.',
      );
      return;
    }
    router.push({ pathname: '/interpret/[kind]', params: { kind } });
  };

  const showUpsell = (purchasesAvailable && !isPlus && usage?.plan !== 'plus') || interpretComingSoon;

  return (
    <Screen contentStyle={{ gap: Spacing.lg }}>
      <View style={{ gap: Spacing.xs }}>
        <T variant="title">Interpret</T>
        <T variant="small">
          Bring your dreams and the words you receive to Scripture. “Test all things; hold fast that which is good.” —
          1 Thessalonians 5:21
        </T>
      </View>

      {KINDS.map((kind) => {
        const copy = KIND_COPY[kind];
        const allowance = interpretComingSoon ? 'Coming soon' : allowanceLabel(usage, kind);
        return (
          <Pressable
            key={kind}
            accessibilityRole="button"
            accessibilityLabel={`${copy.title}. ${copy.blurb}${allowance ? `. ${allowance}` : ''}`}
            onPress={() => start(kind)}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <LinearGradient colors={kind === 'dream' ? Gradients.night : Gradients.primary} style={styles.kind}>
              <View style={styles.kindIcon}>
                <Ionicons name={copy.icon} size={26} color={Colors.white} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <T variant="heading" style={{ color: Colors.white, fontSize: 18 }}>
                  {copy.title}
                </T>
                <T style={{ color: Colors.indigoPale, fontSize: 14, lineHeight: 20 }}>{copy.blurb}</T>
                {allowance ? (
                  <T variant="label" style={{ color: Colors.goldLight, marginTop: 4 }}>
                    {allowance}
                  </T>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.white} />
            </LinearGradient>
          </Pressable>
        );
      })}

      {showUpsell ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/plus')}>
          <Card tone="gold" style={styles.upsell}>
            <Ionicons name="sparkles" size={22} color={Colors.gold} />
            <View style={{ flex: 1 }}>
              <T variant="heading" style={{ fontSize: 15 }}>
                Micaiah Plus{interpretComingSoon ? ' · coming soon' : ''}
              </T>
              <T variant="small">
                Up to {usage?.limits.plus ?? 20} dream and {usage?.limits.plus ?? 20} prophetic interpretations every
                month. Everything else stays free.
              </T>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.gold} />
          </Card>
        </Pressable>
      ) : null}

      {interpretations.length > 0 ? (
        <View style={{ gap: Spacing.sm }}>
          <T variant="label">✦ Your interpretations</T>
          {interpretations.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/interpretation/[id]', params: { id: item.id } })}
              style={({ pressed }) => [styles.item, { opacity: pressed ? 0.7 : 1 }]}>
              <Ionicons name={KIND_COPY[item.kind].icon} size={20} color={Colors.indigoMid} />
              <View style={{ flex: 1 }}>
                <T variant="heading" style={{ fontSize: 15 }} numberOfLines={1}>
                  {item.title}
                </T>
                <T variant="small" numberOfLines={1}>
                  {KIND_COPY[item.kind].short} ·{' '}
                  {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </T>
              </View>
              {item.favorite ? <Ionicons name="star" size={16} color={Colors.gold} /> : null}
              <Ionicons name="chevron-forward" size={18} color={Colors.inkSoft} />
            </Pressable>
          ))}
        </View>
      ) : (
        <T variant="small" style={{ textAlign: 'center' }}>
          Your dream and prophetic interpretations are saved privately on this device.
        </T>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kind: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  kindIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  upsell: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
