import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { bookIndex, formatRef, refText, versionInfo, type BibleText, type ScriptureRef } from '@/lib/bible';
import { useBible } from '@/lib/bible-loader';
import { useStore } from '@/lib/store';
import type { Interpretation, InterpretationKind } from '@/lib/types';

import { CrisisCard } from './insight-view';
import { Card, T, type IconName } from './ui';

export const KIND_COPY: Record<
  InterpretationKind,
  { title: string; short: string; icon: IconName; blurb: string; prompt: string; placeholder: string; yours: string }
> = {
  dream: {
    title: 'Dream Interpretation',
    short: 'Dream',
    icon: 'moon-outline',
    blurb: 'Describe a dream and see what Scripture may say about it.',
    prompt: 'Write down everything you remember — people, places, colours, feelings, and how it ended.',
    placeholder: 'Last night I dreamt…',
    yours: 'Your dream',
  },
  prophetic: {
    title: 'Prophetic Word',
    short: 'Prophetic word',
    icon: 'megaphone-outline',
    blurb: 'Share a word you received and weigh it with Scripture.',
    prompt: 'Write the word as you received it, and how it came — in prayer, a sermon, or from someone.',
    placeholder: 'The word I received was…',
    yours: 'The word you shared',
  },
};

export function openRef(ref: ScriptureRef) {
  const book = bookIndex(ref.book);
  if (book < 0) return;
  router.push({ pathname: '/read/[book]/[chapter]', params: { book: String(book), chapter: String(ref.chapter) } });
}

/** A verse card for a reference, in the reader's chosen translation. Tap to read the chapter. */
export function RefCard({ refItem, text, tone }: { refItem: ScriptureRef; text: BibleText | null; tone: 'indigo' | 'gold' }) {
  const { settings } = useStore();
  const onIndigo = tone === 'indigo';
  const verse = text ? refText(text, refItem) : '';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Opens this chapter in the Bible"
      onPress={() => openRef(refItem)}>
      <Card tone={tone} style={{ gap: Spacing.sm }}>
        {verse ? (
          <T variant="verse" style={onIndigo && { color: Colors.white }}>
            “{verse}”
          </T>
        ) : null}
        <View style={styles.refRow}>
          <T variant="label" style={{ color: onIndigo ? Colors.goldLight : Colors.gold, flex: 1 }}>
            — {formatRef(refItem)} ({versionInfo(settings.bibleVersion).abbr})
          </T>
          <Ionicons name="book-outline" size={16} color={onIndigo ? Colors.goldLight : Colors.gold} />
        </View>
      </Card>
    </Pressable>
  );
}

function RefChips({ refs }: { refs: ScriptureRef[] }) {
  if (refs.length === 0) return null;
  return (
    <View style={styles.chips}>
      {refs.map((r) => (
        <Pressable
          key={formatRef(r)}
          accessibilityRole="button"
          accessibilityLabel={`Read ${formatRef(r)}`}
          onPress={() => openRef(r)}
          style={styles.chip}>
          <Ionicons name="book-outline" size={13} color={Colors.indigoMid} />
          <T variant="small" style={{ color: Colors.indigoMid }}>
            {formatRef(r)}
          </T>
        </Pressable>
      ))}
    </View>
  );
}

export function InterpretationView({ item }: { item: Interpretation }) {
  const { settings } = useStore();
  const { text } = useBible(settings.bibleVersion);
  const copy = KIND_COPY[item.kind];

  return (
    <View style={{ gap: Spacing.md }}>
      {item.crisis ? <CrisisCard /> : null}

      <Card style={{ gap: Spacing.sm }}>
        <T variant="label">✦ {item.kind === 'dream' ? 'What this dream may mean' : 'What this word is saying'}</T>
        <T variant="title" style={{ fontSize: 26, lineHeight: 32 }}>
          {item.title}
        </T>
        <T selectable>{item.summary}</T>
      </Card>

      {item.points.length > 0 ? (
        <Card style={{ gap: Spacing.md }}>
          <T variant="label">✦ {item.kind === 'dream' ? 'Images in your dream' : 'Themes in this word'}</T>
          {item.points.map((p) => (
            <View key={p.heading} style={{ gap: 4 }}>
              <T variant="heading" style={{ fontSize: 16 }}>
                {p.heading}
              </T>
              <T selectable>{p.body}</T>
              <RefChips refs={p.refs} />
            </View>
          ))}
        </Card>
      ) : null}

      {item.refs.length > 0 ? (
        <>
          <T variant="label" style={{ marginTop: Spacing.sm }}>
            ✦ Scripture to read
          </T>
          {item.refs.map((r, i) => (
            <RefCard key={formatRef(r)} refItem={r} text={text} tone={i === 0 ? 'indigo' : 'gold'} />
          ))}
        </>
      ) : null}

      {item.cautions.length > 0 ? (
        <Card style={styles.cautions}>
          <View style={styles.refRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color={Colors.gold} />
            <T variant="label" style={{ color: Colors.gold }}>
              Weigh this carefully
            </T>
          </View>
          {item.cautions.map((c) => (
            <T key={c}>• {c}</T>
          ))}
        </Card>
      ) : null}

      <Card style={{ gap: Spacing.md }}>
        <T variant="label">✦ Next steps</T>
        {item.steps.map((step, i) => (
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
          ✦ A prayer
        </T>
        <T variant="verse" style={{ fontSize: 19, lineHeight: 27 }} selectable>
          {item.prayer}
        </T>
      </Card>

      <T variant="small" style={{ textAlign: 'center', marginTop: Spacing.sm }}>
        {copy.title} written by AI (Claude) as a biblical reflection — it is not a prophecy or a word from God.
        {'\n'}Test everything against Scripture and seek wise counsel (1 Thessalonians 5:21).
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  refRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    minHeight: 32,
    borderRadius: 999,
    backgroundColor: Colors.indigoGhost,
  },
  cautions: { gap: Spacing.sm, backgroundColor: Colors.goldPale, borderColor: 'rgba(184,150,90,0.25)' },
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
