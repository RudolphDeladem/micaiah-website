import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen, T, tapFeedback } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { BIBLE_VERSIONS, type BibleVersionId } from '@/lib/bible';
import { useStore } from '@/lib/store';

export default function BibleVersion() {
  const { settings, updateSettings } = useStore();

  const choose = async (id: BibleVersionId) => {
    tapFeedback();
    await updateSettings({ bibleVersion: id });
    router.back();
  };

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: Spacing.sm }}>
      <T variant="small">
        Used in the Bible reader and for the Scripture in dream and prophetic interpretations.
      </T>
      {BIBLE_VERSIONS.map((v) => {
        const active = settings.bibleVersion === v.id;
        return (
          <Pressable
            key={v.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            accessibilityLabel={`${v.name}. ${v.about}`}
            onPress={() => choose(v.id)}
            style={({ pressed }) => [styles.option, active && styles.active, { opacity: pressed ? 0.7 : 1 }]}>
            <View style={styles.abbr}>
              <T variant="heading" style={{ color: Colors.indigo, fontSize: 13 }}>
                {v.abbr}
              </T>
            </View>
            <View style={{ flex: 1 }}>
              <T variant="heading" style={{ fontSize: 16 }}>
                {v.name}
              </T>
              <T variant="small">{v.about}</T>
            </View>
            {active ? <Ionicons name="checkmark-circle" size={22} color={Colors.indigoMid} /> : null}
          </Pressable>
        );
      })}
      <T variant="small" style={{ textAlign: 'center', marginTop: Spacing.md }}>
        All translations are in the public domain and work offline.
      </T>
    </Screen>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  active: { borderColor: Colors.indigoMid, borderWidth: 1.5 },
  abbr: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.indigoGhost,
  },
});
