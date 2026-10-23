import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Card, LogoMark, PrimaryButton, Screen, T, type IconName } from '@/components/ui';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useStore } from '@/lib/store';

const PILLARS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'mic-outline',
    title: 'Speak or write your heart',
    body: 'Type or speak a prayer, fear, or moment of gratitude. No perfect words needed.',
  },
  {
    icon: 'book-outline',
    title: 'Receive Scripture-based insight',
    body: 'Get relevant Bible verses, a gentle interpretation, simple next steps, and a prayer.',
  },
  {
    icon: 'journal-outline',
    title: 'Build your private journal',
    body: 'Every reflection is saved on your device only. No account, no ads, no tracking.',
  },
];

export default function Onboarding() {
  const { updateSettings } = useStore();
  const [step, setStep] = useState<0 | 1>(0);
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);

  const finish = async () => {
    await updateSettings({
      name: name.trim().slice(0, 40),
      onboarded: true,
      acceptedTermsAt: new Date().toISOString(),
    });
    router.replace('/');
  };

  if (step === 0) {
    return (
      <Screen edges={['top', 'bottom']} contentStyle={styles.welcome}>
        <View style={{ flex: 1, justifyContent: 'flex-end', gap: Spacing.lg }}>
          <LogoMark size={64} />
          <T variant="display">
            Welcome to{'\n'}
            <T variant="display" style={{ color: Colors.indigoMid }}>
              Micaiah
            </T>
          </T>
          <T style={{ fontSize: 18, lineHeight: 27 }}>Speak. Reflect. Receive Scripture-based insight.</T>
          <View style={{ gap: Spacing.md, marginTop: Spacing.md }}>
            {PILLARS.map((p) => (
              <View key={p.title} style={styles.pillar}>
                <View style={styles.pillarIcon}>
                  <Ionicons name={p.icon} size={20} color={Colors.indigoMid} />
                </View>
                <View style={{ flex: 1 }}>
                  <T variant="heading" style={{ fontSize: 15 }}>
                    {p.title}
                  </T>
                  <T variant="small">{p.body}</T>
                </View>
              </View>
            ))}
          </View>
        </View>
        <PrimaryButton label="Get Started" icon="arrow-forward" onPress={() => setStep(1)} style={{ marginTop: Spacing.xl }} />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen edges={['top', 'bottom']} contentStyle={{ gap: Spacing.lg }}>
        <T variant="label" style={{ marginTop: Spacing.xl }}>
          Before we begin
        </T>
        <T variant="title">What should we call you?</T>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your first name (optional)"
          placeholderTextColor={Colors.inkSoft}
          autoComplete="given-name"
          textContentType="givenName"
          maxLength={40}
          returnKeyType="done"
          accessibilityLabel="Your first name, optional"
          style={styles.input}
        />

        <Card tone="gold" style={{ gap: Spacing.sm }}>
          <T variant="heading">A gentle note</T>
          <T variant="small" style={{ color: Colors.inkMid }}>
            Micaiah offers Scripture-based devotional encouragement. It is not a substitute for pastoral care, professional
            counseling, or medical advice, and insights are generated automatically, so they may be imperfect.
          </T>
          <T variant="small" style={{ color: Colors.inkMid }}>
            If you are ever in crisis or thinking about harming yourself, please contact local emergency services or a
            crisis line. Help is always available under Settings → Get help now.
          </T>
        </Card>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          accessibilityLabel="I understand and agree to the Terms of Use and Privacy Policy"
          onPress={() => setAgreed((a) => !a)}
          style={styles.agreeRow}>
          <Ionicons
            name={agreed ? 'checkbox' : 'square-outline'}
            size={24}
            color={agreed ? Colors.indigoMid : Colors.inkSoft}
          />
          <T variant="small" style={{ flex: 1, color: Colors.inkMid }}>
            I understand and agree to the{' '}
            <T variant="small" style={styles.link} onPress={() => router.push('/legal/terms')}>
              Terms of Use
            </T>{' '}
            and{' '}
            <T variant="small" style={styles.link} onPress={() => router.push('/legal/privacy')}>
              Privacy Policy
            </T>
            .
          </T>
        </Pressable>

        <View style={{ flex: 1 }} />
        <PrimaryButton label="Enter your sanctuary" icon="sparkles" disabled={!agreed} onPress={finish} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  welcome: { flexGrow: 1, paddingTop: Spacing.xxl },
  pillar: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  pillarIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.indigoGhost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minHeight: 54,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    fontFamily: Fonts.sans,
    fontSize: 17,
    color: Colors.ink,
  },
  agreeRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', minHeight: 44 },
  link: { color: Colors.indigoMid, textDecorationLine: 'underline' },
});
