import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { Screen, SecondaryButton, T, tapFeedback } from '@/components/ui';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { BOOKS, adjacentChapter, versionInfo } from '@/lib/bible';
import { useBible } from '@/lib/bible-loader';
import { useStore } from '@/lib/store';

function clampInt(value: string | undefined, min: number, max: number): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : min;
}

export default function Reader() {
  const params = useLocalSearchParams<{ book: string; chapter: string }>();
  const book = clampInt(params.book, 0, BOOKS.length - 1);
  const chapter = clampInt(params.chapter, 1, BOOKS[book].chapters);
  const { settings, updateSettings } = useStore();
  const version = versionInfo(settings.bibleVersion);
  const { text, error } = useBible(settings.bibleVersion);
  const verses = text?.[book]?.[chapter - 1] ?? [];
  const title = `${BOOKS[book].name} ${chapter}`;
  const prev = adjacentChapter(book, chapter, -1);
  const next = adjacentChapter(book, chapter, 1);

  // Remember the place, so the Bible tab can offer "Continue reading".
  useEffect(() => {
    if (settings.lastRead?.book !== book || settings.lastRead?.chapter !== chapter) {
      updateSettings({ lastRead: { book, chapter } }).catch(() => {});
    }
    // Only when the chapter changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, chapter]);

  const go = (to: { book: number; chapter: number } | null) => {
    if (!to) return;
    tapFeedback();
    router.setParams({ book: String(to.book), chapter: String(to.chapter) });
  };

  const shareVerse = (n: number, verse: string) =>
    Share.share({ message: `“${verse}” — ${BOOKS[book].name} ${chapter}:${n} (${version.abbr})\n\nShared from Micaiah AI` }).catch(
      () => {},
    );

  return (
    <Screen key={`${book}-${chapter}`} edges={[]} contentStyle={{ gap: Spacing.lg }}>
      <Stack.Screen
        options={{
          title,
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Translation: ${version.name}. Change translation`}
              hitSlop={8}
              onPress={() => router.push('/bible-version')}
              style={styles.chip}>
              <T variant="heading" style={{ color: Colors.indigo, fontSize: 13 }}>
                {version.abbr}
              </T>
              <Ionicons name="chevron-down" size={12} color={Colors.indigo} />
            </Pressable>
          ),
        }}
      />

      <View style={{ gap: 2 }}>
        <T variant="label">{version.name}</T>
        <T variant="display">{title}</T>
      </View>

      {error ? (
        <T>This translation could not be opened. Please try again or choose another translation.</T>
      ) : !text ? (
        <ActivityIndicator color={Colors.indigoMid} style={{ marginTop: Spacing.xl }} />
      ) : (
        <View style={{ gap: Spacing.sm }}>
          {verses.map((verse, i) =>
            verse ? (
              <Text
                key={i}
                selectable
                maxFontSizeMultiplier={1.8}
                onLongPress={() => shareVerse(i + 1, verse)}
                accessibilityHint="Long press to share this verse"
                style={styles.verse}>
                <Text style={styles.verseNumber}>{i + 1} </Text>
                {verse}
              </Text>
            ) : null,
          )}
          <T variant="small" style={{ textAlign: 'center', marginTop: Spacing.sm }}>
            Long-press a verse to share it.
          </T>
        </View>
      )}

      <View style={styles.nav}>
        {prev ? (
          <SecondaryButton
            label={`${BOOKS[prev.book].name} ${prev.chapter}`}
            icon="chevron-back"
            onPress={() => go(prev)}
            style={{ flex: 1 }}
          />
        ) : (
          <View style={{ flex: 1 }} />
        )}
        {next ? (
          <SecondaryButton
            label={`${BOOKS[next.book].name} ${next.chapter}`}
            icon="chevron-forward"
            onPress={() => go(next)}
            style={{ flex: 1 }}
          />
        ) : (
          <View style={{ flex: 1 }} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 12,
    minHeight: 34,
    borderRadius: Radius.pill,
    backgroundColor: Colors.indigoGhost,
  },
  verse: { fontFamily: Fonts.serif, fontSize: 21, lineHeight: 31, color: Colors.ink },
  verseNumber: { fontFamily: Fonts.sansBold, fontSize: 12, color: Colors.gold },
  nav: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
});
