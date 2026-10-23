import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, PrimaryButton, T } from '@/components/ui';
import { Colors, Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useStore } from '@/lib/store';
import { currentStreak, longestStreak } from '@/lib/streak';
import type { Entry } from '@/lib/types';

const MODE_LABEL = { daily: 'Reflection', prayer: 'Prayer', gratitude: 'Gratitude' } as const;

export default function Journal() {
  const { entries } = useStore();
  const [query, setQuery] = useState('');
  const [themeFilter, setThemeFilter] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const themesUsed = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of entries) seen.set(e.insight.themeId, e.insight.themeLabel);
    return [...seen.entries()];
  }, [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(
      (e) =>
        (!themeFilter || e.insight.themeId === themeFilter) &&
        (!favoritesOnly || e.favorite) &&
        (!q || e.text.toLowerCase().includes(q) || e.insight.verses.some((v) => v.ref.toLowerCase().includes(q))),
    );
  }, [entries, query, themeFilter, favoritesOnly]);

  const header = (
    <View style={{ gap: Spacing.md, marginBottom: Spacing.md }}>
      <T variant="title">My Journal</T>
      <View style={styles.stats}>
        <Stat value={entries.length} label="Reflections" />
        <Stat value={currentStreak(entries)} label="Day streak" />
        <Stat value={longestStreak(entries)} label="Best streak" />
      </View>
      {entries.length > 0 ? (
        <>
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={Colors.inkSoft} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search reflections or verses"
              placeholderTextColor={Colors.inkSoft}
              accessibilityLabel="Search reflections or verses"
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
            <Chip label="All" active={!themeFilter && !favoritesOnly} onPress={() => { setThemeFilter(null); setFavoritesOnly(false); }} />
            <Chip label="★ Saved" active={favoritesOnly} onPress={() => setFavoritesOnly((f) => !f)} />
            {themesUsed.map(([id, label]) => (
              <Chip key={id} label={label} active={themeFilter === id} onPress={() => setThemeFilter(themeFilter === id ? null : id)} />
            ))}
          </ScrollView>
        </>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Colors.cream }}>
      <FlatList
        data={filtered}
        keyExtractor={(e) => e.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <EntryRow entry={item} />}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={
          entries.length === 0 ? (
            <Card style={{ alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl }}>
              <Ionicons name="journal-outline" size={36} color={Colors.indigoLight} />
              <T variant="heading">Your journal is waiting</T>
              <T variant="small" style={{ textAlign: 'center' }}>
                Every reflection you make is saved here, privately on your device.
              </T>
              <PrimaryButton label="Write your first reflection" icon="create-outline" onPress={() => router.push('/reflect')} />
            </Card>
          ) : (
            <T variant="small" style={{ textAlign: 'center', marginTop: Spacing.lg }}>
              No reflections match your search.
            </T>
          )
        }
      />
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${value} ${label}`}>
      <T style={styles.statValue}>{value}</T>
      <T variant="small">{label}</T>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active && { backgroundColor: Colors.indigo, borderColor: Colors.indigo }]}>
      <T variant="small" style={{ color: active ? Colors.white : Colors.inkMid }}>
        {label}
      </T>
    </Pressable>
  );
}

function EntryRow({ entry }: { entry: Entry }) {
  const date = new Date(entry.createdAt);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${MODE_LABEL[entry.mode]} from ${date.toLocaleDateString()}, ${entry.insight.themeLabel}`}
      onPress={() => router.push({ pathname: '/entry/[id]', params: { id: entry.id } })}
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
      <Card style={{ gap: 6, padding: Spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <T variant="label" style={{ flex: 1 }}>
            {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} ·{' '}
            {entry.insight.themeLabel}
          </T>
          {entry.favorite ? <Ionicons name="star" size={14} color={Colors.gold} /> : null}
          {entry.inputMethod === 'voice' ? <Ionicons name="mic" size={14} color={Colors.inkSoft} /> : null}
        </View>
        <T numberOfLines={3}>“{entry.text}”</T>
        <T variant="small" style={{ color: Colors.indigoMid }}>
          — {entry.insight.verses.map((v) => v.ref).join(' · ')}
        </T>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  stats: { flexDirection: 'row', gap: Spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  statValue: { fontFamily: Fonts.serifBold, fontSize: 30, lineHeight: 34, color: Colors.indigo },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    minHeight: 46,
  },
  searchInput: { flex: 1, fontFamily: Fonts.sans, fontSize: 15, color: Colors.ink, paddingVertical: 10 },
  chip: {
    paddingHorizontal: 14,
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
});
