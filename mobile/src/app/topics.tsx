import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen, T, type IconName } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { THEMES, TRANSLATION_NAME } from '@/lib/scripture';

export default function Topics() {
  return (
    <Screen edges={[]} contentStyle={{ gap: Spacing.md }}>
      <T variant="small">
        Explore what Scripture says about the seasons of life. Tap a theme for verses, reflection, and a prayer.
      </T>
      <View style={styles.grid}>
        {THEMES.map((theme) => (
          <Pressable
            key={theme.id}
            accessibilityRole="button"
            accessibilityLabel={`${theme.label}, ${theme.verses.length} verses`}
            onPress={() => router.push({ pathname: '/theme/[id]', params: { id: theme.id } })}
            style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.75 : 1 }]}>
            <Ionicons name={theme.icon as IconName} size={24} color={Colors.indigoMid} />
            <T variant="heading" style={{ fontSize: 15, lineHeight: 20 }}>
              {theme.label}
            </T>
            <T variant="small">{theme.verses.length} verses</T>
          </Pressable>
        ))}
      </View>
      <T variant="small" style={{ textAlign: 'center', marginTop: Spacing.md }}>
        Scripture quotations: {TRANSLATION_NAME}.
      </T>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: 6,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
