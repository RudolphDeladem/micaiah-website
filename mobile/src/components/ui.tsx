import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { Colors, Fonts, Gradients, MaxContentWidth, Radius, Spacing } from '@/constants/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function tapFeedback() {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
}

type Variant = 'display' | 'title' | 'heading' | 'body' | 'small' | 'label' | 'verse';

export function T({
  variant = 'body',
  style,
  ...props
}: TextProps & { variant?: Variant; style?: StyleProp<TextStyle> }) {
  return <Text maxFontSizeMultiplier={1.6} {...props} style={[text[variant], style]} />;
}

const text = StyleSheet.create({
  display: { fontFamily: Fonts.serif, fontSize: 40, lineHeight: 44, color: Colors.ink },
  title: { fontFamily: Fonts.serif, fontSize: 30, lineHeight: 36, color: Colors.ink },
  heading: { fontFamily: Fonts.sansBold, fontSize: 17, lineHeight: 24, color: Colors.ink },
  body: { fontFamily: Fonts.sans, fontSize: 16, lineHeight: 24, color: Colors.inkMid },
  small: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19, color: Colors.inkSoft },
  label: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: Colors.indigoMid,
  },
  verse: { fontFamily: Fonts.serifItalic, fontSize: 21, lineHeight: 29, color: Colors.ink },
});

export function Screen({
  children,
  scroll = true,
  edges = ['top'],
  contentStyle,
  background = Colors.cream,
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  background?: string;
}) {
  const inner = <View style={[styles.content, contentStyle]}>{children}</View>;
  return (
    <SafeAreaView edges={edges} style={[styles.screen, { backgroundColor: background }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
  loading,
  style,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      style={({ pressed }) => [styles.primaryWrap, { opacity: inactive ? 0.5 : pressed ? 0.85 : 1 }, style]}>
      <LinearGradient
        colors={Gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.primary}>
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <>
            {icon ? <Ionicons name={icon} size={20} color={Colors.white} /> : null}
            <Text style={styles.primaryLabel} maxFontSizeMultiplier={1.4}>
              {label}
            </Text>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  icon,
  tone = 'default',
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  tone?: 'default' | 'danger';
  style?: StyleProp<ViewStyle>;
}) {
  const color = tone === 'danger' ? Colors.danger : Colors.indigo;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      style={({ pressed }) => [styles.secondary, { borderColor: color, opacity: pressed ? 0.7 : 1 }, style]}>
      {icon ? <Ionicons name={icon} size={18} color={color} /> : null}
      <Text style={[styles.secondaryLabel, { color }]} maxFontSizeMultiplier={1.4}>
        {label}
      </Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  color = Colors.inkMid,
  style,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.6 : 1 }, style]}>
      <Ionicons name={icon} size={22} color={color} />
    </Pressable>
  );
}

export function Card({
  children,
  style,
  tone = 'light',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'light' | 'indigo' | 'gold';
}) {
  return <View style={[styles.card, cardTones[tone], style]}>{children}</View>;
}

const cardTones = StyleSheet.create({
  light: { backgroundColor: Colors.white },
  indigo: { backgroundColor: Colors.indigo, borderColor: Colors.indigo },
  gold: { backgroundColor: Colors.goldPale, borderColor: 'rgba(184,150,90,0.25)' },
});

export function Row({
  icon,
  label,
  detail,
  onPress,
  tone = 'default',
  right,
}: {
  icon: IconName;
  label: string;
  detail?: string;
  onPress?: () => void;
  tone?: 'default' | 'danger';
  right?: ReactNode;
}) {
  const color = tone === 'danger' ? Colors.danger : Colors.ink;
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
      <Ionicons name={icon} size={20} color={tone === 'danger' ? Colors.danger : Colors.indigoMid} />
      <View style={{ flex: 1 }}>
        <T variant="heading" style={{ color, fontSize: 15 }}>
          {label}
        </T>
        {detail ? <T variant="small">{detail}</T> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={Colors.inkSoft} /> : null)}
    </Pressable>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function LogoMark({ size = 56 }: { size?: number }) {
  return (
    <LinearGradient
      colors={Gradients.primary}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Ionicons name="flame" size={size * 0.48} color={Colors.white} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  primaryWrap: {
    borderRadius: Radius.pill,
    shadowColor: Colors.indigo,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  primary: {
    minHeight: 56,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  primaryLabel: { fontFamily: Fonts.sansBold, fontSize: 17, color: Colors.white },
  secondary: {
    minHeight: 48,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  secondaryLabel: { fontFamily: Fonts.sansMedium, fontSize: 15 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
});
