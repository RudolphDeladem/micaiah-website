import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

import { LogoMark, T } from './ui';

const STAGES = ['Understanding your reflection', 'Finding relevant Scripture', 'Preparing your insight'];

export function SeekingWisdom({
  onCancel,
  subtitle = 'Searching the Scriptures for insight into your reflection',
  stages = STAGES,
  stageMs = [800, 1700],
}: {
  onCancel: () => void;
  subtitle?: string;
  stages?: string[];
  /** When each later stage lights up (ms after start). */
  stageMs?: number[];
}) {
  const [stage, setStage] = useState(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true);
    const timers = stageMs.map((ms, i) => setTimeout(() => setStage(i + 1), ms));
    return () => timers.forEach(clearTimeout);
    // Stage timings are fixed for the life of the screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulse]);

  const ring = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.15 }],
    opacity: 0.8 - pulse.value * 0.5,
  }));

  return (
    <SafeAreaView style={styles.screen} accessibilityLiveRegion="polite">
      <View style={styles.center}>
        <View style={styles.orb}>
          <Animated.View style={[styles.ring, ring]} />
          <LogoMark size={84} />
        </View>
        <T variant="title" style={{ textAlign: 'center' }}>
          Seeking wisdom…
        </T>
        <T style={{ textAlign: 'center' }}>{subtitle}</T>
        <View style={{ gap: Spacing.md, marginTop: Spacing.lg }}>
          {stages.map((label, i) => {
            const done = i < stage;
            const active = i === stage;
            return (
              <View key={label} style={styles.stage}>
                <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
                  {done ? <Ionicons name="checkmark" size={14} color={Colors.indigo} /> : null}
                </View>
                <T style={{ color: done || active ? Colors.indigoMid : Colors.inkSoft }}>{label}</T>
              </View>
            );
          })}
        </View>
      </View>
      <Pressable accessibilityRole="button" onPress={onCancel} style={styles.cancel} hitSlop={12}>
        <T variant="label" style={{ color: Colors.inkSoft }}>
          Cancel
        </T>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.indigoGhost, paddingHorizontal: Spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  orb: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  ring: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: Colors.indigoLight,
  },
  stage: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: Colors.indigoPale },
  dotActive: { borderWidth: 6, borderColor: Colors.indigoMid },
  cancel: { alignSelf: 'center', padding: Spacing.lg, minHeight: 44 },
});
