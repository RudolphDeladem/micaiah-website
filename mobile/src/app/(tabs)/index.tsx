import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { VerseCard } from '@/components/insight-view';
import { KIND_COPY } from '@/components/interpretation-view';
import { Card, PrimaryButton, Screen, T, tapFeedback, type IconName } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { interpretAvailable, interpretComingSoon } from '@/lib/interpret';
import { verseOfTheDay } from '@/lib/scripture';
import { useStore } from '@/lib/store';
import { currentStreak, dayKey } from '@/lib/streak';
import type { InterpretationKind, ReflectionMode } from '@/lib/types';

function greeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const MODES: { mode: ReflectionMode; icon: IconName; title: string; body: string }[] = [
  { mode: 'daily', icon: 'partly-sunny-outline', title: 'Daily Reflection', body: 'Process your thoughts and find clarity.' },
  { mode: 'prayer', icon: 'flame-outline', title: 'Prayer Journal', body: 'Write a prayer and receive Scripture.' },
  { mode: 'gratitude', icon: 'gift-outline', title: 'Gratitude', body: 'Count your blessings, big and small.' },
];

export default function Today() {
  const { entries, settings } = useStore();
  const now = new Date();
  const verse = useMemo(() => verseOfTheDay(), []);
  const streak = currentStreak(entries);
  const reflectedToday = entries.some((e) => dayKey(new Date(e.createdAt)) === dayKey(now));
  const latest = entries[0];

  const startReflection = (mode: ReflectionMode) => {
    tapFeedback();
    router.push({ pathname: '/reflect', params: { mode } });
  };

  return (
    <Screen contentStyle={{ gap: Spacing.lg }}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <T variant="small">
            {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </T>
          <T variant="title">
            {greeting(now)}
            {settings.name ? `, ${settings.name}` : ''}
          </T>
        </View>
        <View
          style={styles.streak}
          accessible
          accessibilityLabel={`${streak} day reflection streak`}>
          <Ionicons name="flame" size={18} color={Colors.gold} />
          <T variant="heading" style={{ color: Colors.gold }}>
            {streak}
          </T>
        </View>
      </View>

      <View style={{ gap: Spacing.sm }}>
        <T variant="label">✦ Verse of the day</T>
        <VerseCard verse={verse} />
      </View>

      <Card style={{ gap: Spacing.md }}>
        <T variant="heading">{reflectedToday ? 'Come back anytime today' : 'What is on your heart today?'}</T>
        <T variant="small">Speak or write freely — your words stay private on this device.</T>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <PrimaryButton
            label="Speak"
            icon="mic"
            onPress={() => router.push({ pathname: '/listen', params: { mode: 'daily' } })}
            style={{ flex: 1 }}
          />
          <PrimaryButton label="Write" icon="create-outline" onPress={() => startReflection('daily')} style={{ flex: 1 }} />
        </View>
      </Card>

      <View style={{ gap: Spacing.sm }}>
        <T variant="label">✦ Choose your path</T>
        {MODES.map((m) => (
          <Pressable
            key={m.mode}
            accessibilityRole="button"
            accessibilityLabel={`${m.title}. ${m.body}`}
            onPress={() => startReflection(m.mode)}
            style={({ pressed }) => [styles.mode, { opacity: pressed ? 0.75 : 1 }]}>
            <View style={styles.modeIcon}>
              <Ionicons name={m.icon} size={22} color={Colors.indigoMid} />
            </View>
            <View style={{ flex: 1 }}>
              <T variant="heading" style={{ fontSize: 16 }}>
                {m.title}
              </T>
              <T variant="small">{m.body}</T>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.inkSoft} />
          </Pressable>
        ))}
        {interpretAvailable || interpretComingSoon
          ? (['dream', 'prophetic'] as InterpretationKind[]).map((kind) => (
              <Pressable
                key={kind}
                accessibilityRole="button"
                accessibilityLabel={`${KIND_COPY[kind].title}. ${KIND_COPY[kind].blurb}`}
                onPress={() => {
                  tapFeedback();
                  if (interpretComingSoon) router.push('/interpret');
                  else router.push({ pathname: '/interpret/[kind]', params: { kind } });
                }}
                style={({ pressed }) => [styles.mode, { opacity: pressed ? 0.75 : 1 }]}>
                <View style={styles.modeIcon}>
                  <Ionicons name={KIND_COPY[kind].icon} size={22} color={Colors.indigoMid} />
                </View>
                <View style={{ flex: 1 }}>
                  <T variant="heading" style={{ fontSize: 16 }}>
                    {KIND_COPY[kind].title}
                  </T>
                  <T variant="small">{interpretComingSoon ? 'Coming soon' : KIND_COPY[kind].blurb}</T>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.inkSoft} />
              </Pressable>
            ))
          : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Read the Bible. Choose a book and chapter."
          onPress={() => router.push('/bible')}
          style={({ pressed }) => [styles.mode, { opacity: pressed ? 0.75 : 1 }]}>
          <View style={styles.modeIcon}>
            <Ionicons name="library-outline" size={22} color={Colors.indigoMid} />
          </View>
          <View style={{ flex: 1 }}>
            <T variant="heading" style={{ fontSize: 16 }}>
              Read the Bible
            </T>
            <T variant="small">The whole Bible in four translations, offline.</T>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.inkSoft} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bible Insight. Explore Scripture by theme."
          onPress={() => router.push('/topics')}
          style={({ pressed }) => [styles.mode, { opacity: pressed ? 0.75 : 1 }]}>
          <View style={styles.modeIcon}>
            <Ionicons name="book-outline" size={22} color={Colors.indigoMid} />
          </View>
          <View style={{ flex: 1 }}>
            <T variant="heading" style={{ fontSize: 16 }}>
              Bible Insight
            </T>
            <T variant="small">Explore Scripture by theme, verse by verse.</T>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.inkSoft} />
        </Pressable>
      </View>

      {latest ? (
        <View style={{ gap: Spacing.sm }}>
          <T variant="label">✦ Your latest reflection</T>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/entry/[id]', params: { id: latest.id } })}>
            <Card style={{ gap: Spacing.xs }}>
              <T variant="small">
                {new Date(latest.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ·{' '}
                {latest.insight.themeLabel}
              </T>
              <T numberOfLines={2}>“{latest.text}”</T>
              <T variant="small" style={{ color: Colors.indigoMid }}>
                — {latest.insight.verses[0]?.ref}
              </T>
            </Card>
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.goldPale,
  },
  mode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.indigoGhost,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
