import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Screen, T, tapFeedback } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { BOOKS, OLD_TESTAMENT_BOOKS, versionInfo } from '@/lib/bible';
import { useStore } from '@/lib/store';

type Testament = 'old' | 'new';

function openChapter(book: number, chapter: number) {
  tapFeedback();
  router.push({ pathname: '/read/[book]/[chapter]', params: { book: String(book), chapter: String(chapter) } });
}

export default function Bible() {
  const { settings } = useStore();
  const version = versionInfo(settings.bibleVersion);
  const [testament, setTestament] = useState<Testament>(
    settings.lastRead && settings.lastRead.book >= OLD_TESTAMENT_BOOKS ? 'new' : 'old',
  );
  const [openBook, setOpenBook] = useState<number | null>(null);
  const range = testament === 'old' ? [0, OLD_TESTAMENT_BOOKS] : [OLD_TESTAMENT_BOOKS, BOOKS.length];
  const lastRead = settings.lastRead;

  return (
    <Screen contentStyle={{ gap: Spacing.md }}>
      <View style={styles.header}>
        <T variant="title" style={{ flex: 1 }}>
          Holy Bible
        </T>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Translation: ${version.name}. Change translation`}
          onPress={() => router.push('/bible-version')}
          style={({ pressed }) => [styles.chip, { opacity: pressed ? 0.7 : 1 }]}>
          <T variant="heading" style={{ color: Colors.indigo, fontSize: 14 }}>
            {version.abbr}
          </T>
          <Ionicons name="chevron-down" size={14} color={Colors.indigo} />
        </Pressable>
      </View>

      {lastRead ? (
        <Pressable accessibilityRole="button" onPress={() => openChapter(lastRead.book, lastRead.chapter)}>
          <Card tone="indigo" style={styles.continue}>
            <Ionicons name="book" size={22} color={Colors.goldLight} />
            <View style={{ flex: 1 }}>
              <T variant="label" style={{ color: Colors.goldLight }}>
                Continue reading
              </T>
              <T variant="heading" style={{ color: Colors.white }}>
                {BOOKS[lastRead.book]?.name} {lastRead.chapter}
              </T>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.white} />
          </Card>
        </Pressable>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Bible Insight topics. Verses for the seasons of life."
        onPress={() => router.push('/topics')}
        style={({ pressed }) => [styles.topics, { opacity: pressed ? 0.75 : 1 }]}>
        <Ionicons name="sparkles-outline" size={20} color={Colors.indigoMid} />
        <View style={{ flex: 1 }}>
          <T variant="heading" style={{ fontSize: 15 }}>
            Bible Insight topics
          </T>
          <T variant="small">Verses for the seasons of life — peace, fear, grief, hope…</T>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.inkSoft} />
      </Pressable>

      <View style={styles.segment} accessibilityRole="tablist">
        {(['old', 'new'] as const).map((t) => {
          const active = testament === t;
          return (
            <Pressable
              key={t}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => {
                setTestament(t);
                setOpenBook(null);
              }}
              style={[styles.segmentItem, active && styles.segmentActive]}>
              <T variant="heading" style={{ fontSize: 14, color: active ? Colors.white : Colors.inkMid }}>
                {t === 'old' ? 'Old Testament' : 'New Testament'}
              </T>
            </Pressable>
          );
        })}
      </View>

      <Card style={{ paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md }}>
        {BOOKS.slice(range[0], range[1]).map((book, offset) => {
          const index = range[0] + offset;
          const expanded = openBook === index;
          return (
            <View key={book.name} style={offset > 0 && styles.bookDivider}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                accessibilityLabel={`${book.name}, ${book.chapters} ${book.chapters === 1 ? 'chapter' : 'chapters'}`}
                onPress={() => (book.chapters === 1 ? openChapter(index, 1) : setOpenBook(expanded ? null : index))}
                style={({ pressed }) => [styles.book, { opacity: pressed ? 0.6 : 1 }]}>
                <T variant="heading" style={{ flex: 1, fontSize: 16 }}>
                  {book.name}
                </T>
                <T variant="small">{book.chapters}</T>
                <Ionicons
                  name={book.chapters === 1 ? 'chevron-forward' : expanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={Colors.inkSoft}
                />
              </Pressable>
              {expanded ? (
                <View style={styles.chapters}>
                  {Array.from({ length: book.chapters }, (_, i) => i + 1).map((chapter) => (
                    <Pressable
                      key={chapter}
                      accessibilityRole="button"
                      accessibilityLabel={`${book.name} chapter ${chapter}`}
                      onPress={() => openChapter(index, chapter)}
                      style={({ pressed }) => [styles.chapter, { opacity: pressed ? 0.6 : 1 }]}>
                      <T style={{ color: Colors.indigo }}>{chapter}</T>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
      </Card>

      <T variant="small" style={{ textAlign: 'center' }}>
        {version.name} · public domain
      </T>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    minHeight: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.indigoGhost,
  },
  continue: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  topics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.indigoGhost,
  },
  segmentItem: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.pill },
  segmentActive: { backgroundColor: Colors.indigo },
  bookDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  book: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  chapters: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingBottom: Spacing.md },
  chapter: {
    width: 48,
    height: 44,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.indigoGhost,
  },
});
