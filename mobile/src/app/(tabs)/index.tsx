import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { VerseCard } from '@/components/insight-view';
import { KIND_COPY } from '@/components/interpretation-view';
import { Card, NavTile, PrimaryButton, Screen, T, tapFeedback, type IconName } from '@/components/ui';
import { Accents, Colors, Gradients, Radius, Spacing } from '@/constants/theme';
import { BOOKS } from '@/lib/bible';
import { interpretAvailable, interpretComingSoon } from '@/lib/interpret';
import { TRANSLATION, verseOfTheDay } from '@/lib/scripture';
import { useStore } from '@/lib/store';
import { currentStreak, dayKey } from '@/lib/streak';
import type { ReflectionMode } from '@/lib/types';

function greeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const MODES: { mode: ReflectionMode; icon: IconName; title: string; body: string; accent: keyof typeof Accents }[] = [
  { mode: 'daily', icon: 'partly-sunny-outline', title: 'Reflect', body: 'Find clarity', accent: 'sunrise' },
  { mode: 'prayer', icon: 'flame-outline', title: 'Pray', body: 'Talk to God', accent: 'lavender' },
  { mode: 'gratitude', icon: 'leaf-outline', title: 'Thanks', body: 'Count blessings', accent: 'sage' },
];

export default function Today() {
  const { entries, settings } = useStore();
  const now = new Date();
  const verse = useMemo(() => verseOfTheDay(), []);
  const streak = currentStreak(entries);
  const reflectedToday = entries.some((e) => dayKey(new Date(e.createdAt)) === dayKey(now));
  const latest = entries[0];
  const lastRead = settings.lastRead;
  const showInterpret = interpretAvailable || interpretComingSoon;

  const startReflection = (mode: ReflectionMode) => {
    tapFeedback();
    router.push({ pathname: '/reflect', params: { mode } });
  };

  const shareVerse = () =>
    Share.share({ message: `“${verse.text}” — ${verse.ref} (${TRANSLATION})\n\nShared from Micaiah AI` }).catch(() => {});

  return (
    <Screen contentStyle={{ gap: Spacing.lg }}>
      <LinearGradient colors={Gradients.dawn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroTop}>
          <T variant="small" style={{ color: Colors.indigoPale, flex: 1 }}>
            {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </T>
          <View
            style={styles.streak}
            accessible
            accessibilityLabel={streak > 0 ? `${streak} day reflection streak` : 'No reflection streak yet'}>
            <Ionicons name="flame" size={16} color={Colors.goldLight} />
            <T variant="small" style={{ color: Colors.white, fontFamily: 'DMSans_600SemiBold' }}>
              {streak > 0 ? `${streak}-day streak` : 'Start a streak'}
            </T>
          </View>
        </View>
        <T variant="title" style={{ color: Colors.white }}>
          {greeting(now)}
          {settings.name ? `, ${settings.name}` : ''}
        </T>
        <T style={{ color: Colors.indigoPale }}>
          {reflectedToday
            ? 'You’ve spent time with God today. Come back anytime.'
            : 'A quiet moment with God is waiting for you.'}
        </T>
      </LinearGradient>

      <View style={{ gap: Spacing.sm }}>
        <T variant="label">✦ Verse of the day</T>
        <VerseCard verse={verse} tone="gold" onShare={shareVerse} />
      </View>

      <Card style={{ gap: Spacing.md }}>
        <T variant="heading">{reflectedToday ? 'Anything else on your heart?' : 'What is on your heart today?'}</T>
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
        <T variant="label">✦ Ways to reflect</T>
        <View style={styles.modes}>
          {MODES.map((m) => {
            const accent = Accents[m.accent];
            return (
              <Pressable
                key={m.mode}
                accessibilityRole="button"
                accessibilityLabel={`${m.title}. ${m.body}`}
                onPress={() => startReflection(m.mode)}
                style={({ pressed }) => [
                  styles.mode,
                  { backgroundColor: accent.tint, opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
                ]}>
                <View style={styles.modeIcon}>
                  <Ionicons name={m.icon} size={22} color={accent.icon} />
                </View>
                <T variant="heading" style={{ fontSize: 15 }} numberOfLines={1}>
                  {m.title}
                </T>
                <T variant="small" numberOfLines={2}>
                  {m.body}
                </T>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: Spacing.sm }}>
        <T variant="label">✦ Explore</T>
        {lastRead ? (
          <NavTile
            icon="book"
            title="Continue reading"
            detail={`${BOOKS[lastRead.book]?.name ?? 'Bible'} ${lastRead.chapter} · pick up where you left off`}
            onPress={() =>
              router.push({
                pathname: '/read/[book]/[chapter]',
                params: { book: String(lastRead.book), chapter: String(lastRead.chapter) },
              })
            }
          />
        ) : (
          <NavTile
            icon="library-outline"
            title="Read the Bible"
            detail="The whole Bible in four translations, offline."
            onPress={() => router.push('/bible')}
          />
        )}
        <NavTile
          icon="sparkles-outline"
          title="Bible Insight"
          detail="Verses for peace, fear, grief, hope and more."
          tint={Accents.sunrise.tint}
          iconColor={Accents.sunrise.icon}
          onPress={() => router.push('/topics')}
        />
        {showInterpret ? (
          <NavTile
            icon={KIND_COPY.dream.icon}
            title="Interpret"
            detail="Dreams and prophetic words, weighed with Scripture."
            tint={Accents.rose.tint}
            iconColor={Accents.rose.icon}
            badge={interpretComingSoon ? 'Soon' : undefined}
            onPress={() => router.push('/interpret')}
          />
        ) : null}
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
  hero: { borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.sm, marginTop: Spacing.xs },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  modes: { flexDirection: 'row', gap: Spacing.sm },
  mode: { flex: 1, borderRadius: Radius.md, padding: 12, gap: 2, minHeight: 116 },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
});
