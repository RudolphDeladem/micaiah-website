import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KIND_COPY } from '@/components/interpretation-view';
import { SeekingWisdom } from '@/components/seeking-wisdom';
import { IconButton, PrimaryButton, T } from '@/components/ui';
import { Colors, Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import {
  LimitReachedError,
  MAX_INTERPRET_LENGTH,
  MIN_INTERPRET_LENGTH,
  remaining,
  requestInterpretation,
  type Usage,
} from '@/lib/interpret';
import { newEntryId, useStore } from '@/lib/store';
import { purchasesAvailable, useSubscription } from '@/lib/subscription';
import type { InterpretationKind } from '@/lib/types';

const MIN_SEEKING_MS = 2400;

const STAGES: Record<InterpretationKind, string[]> = {
  dream: ['Reading your dream', 'Searching the Scriptures', 'Preparing your interpretation'],
  prophetic: ['Reading the word you received', 'Weighing it with Scripture', 'Preparing your explanation'],
};

function asKind(value: unknown): InterpretationKind {
  return value === 'prophetic' ? 'prophetic' : 'dream';
}

export default function NewInterpretation() {
  const params = useLocalSearchParams<{ kind?: string; text?: string }>();
  const kind = asKind(params.kind);
  const copy = KIND_COPY[kind];
  const draftKey = `micaiah.draft.${kind}.v1`;
  const { settings, updateSettings, addInterpretation } = useStore();
  const { usage, setUsage, refreshUsage } = useSubscription();

  const [text, setText] = useState(params.text ?? '');
  const [seeking, setSeeking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (params.text) return;
    AsyncStorage.getItem(draftKey)
      .then((draft) => {
        if (draft) setText((current) => current || draft);
      })
      .catch(() => {});
  }, [params.text, draftKey]);

  useEffect(() => {
    const handle = setTimeout(() => {
      (text.trim() ? AsyncStorage.setItem(draftKey, text) : AsyncStorage.removeItem(draftKey)).catch(() => {});
    }, 600);
    return () => clearTimeout(handle);
  }, [text, draftKey]);

  const canSubmit = text.trim().length >= MIN_INTERPRET_LENGTH && !seeking;
  const left = remaining(usage, kind);

  const close = () => router.back();

  const limitReached = (latest: Usage | null) => {
    const onPlus = latest?.plan === 'plus';
    if (!onPlus && purchasesAvailable) {
      router.push('/plus');
      return;
    }
    const resets = latest?.resetsAt ? new Date(latest.resetsAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric' }) : null;
    Alert.alert(
      'Monthly limit reached',
      `You have used this month’s ${copy.title.toLowerCase()} allowance.${resets ? ` It renews on ${resets}.` : ''} Your draft is saved.`,
    );
  };

  const run = async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setSeeking(true);
    const started = Date.now();
    try {
      const result = await requestInterpretation(kind, text.trim(), controller.signal);
      const wait = MIN_SEEKING_MS - (Date.now() - started);
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      if (controller.signal.aborted) return;
      if (result.usage) setUsage(result.usage);
      const id = newEntryId();
      await addInterpretation({ id, createdAt: new Date().toISOString(), ...result.interpretation });
      await AsyncStorage.removeItem(draftKey).catch(() => {});
      router.replace({ pathname: '/interpretation/[id]', params: { id, fresh: '1' } });
    } catch (error) {
      if (controller.signal.aborted) return;
      if (error instanceof LimitReachedError) {
        if (error.usage) setUsage(error.usage);
        limitReached(error.usage);
        return;
      }
      Alert.alert(
        'Something went wrong',
        'We could not prepare your interpretation. Check your connection and try again — this did not count toward your monthly allowance.',
      );
    } finally {
      setSeeking(false);
    }
  };

  const submit = async () => {
    if (!canSubmit) return;
    if (left === 0) {
      // Usage may be stale (new month, or a purchase on another screen) — re-check once.
      const latest = await refreshUsage({ recheckPlan: true });
      if (remaining(latest, kind) === 0) return limitReached(latest);
    }
    if (!settings.interpretConsent) {
      Alert.alert(
        'Send this to our AI service?',
        `To interpret it, Micaiah sends the text you write here securely to our service, where Anthropic’s Claude AI writes a biblical reflection. Micaiah does not store your words, and they are never used to train AI. Your interpretations are saved only on this device.`,
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Agree and continue', onPress: () => updateSettings({ interpretConsent: true }).then(run) },
        ],
      );
      return;
    }
    run();
  };

  const cancel = () => {
    abortRef.current?.abort();
    setSeeking(false);
  };

  if (seeking) {
    return (
      <SeekingWisdom
        onCancel={cancel}
        subtitle={kind === 'dream' ? 'Bringing your dream to the Scriptures' : 'Weighing the word with Scripture'}
        stages={STAGES[kind]}
        stageMs={[1500, 4000]}
      />
    );
  }

  const allowance =
    usage && left !== null
      ? usage.plan === 'plus'
        ? `Micaiah Plus · ${left} left this month`
        : left > 0
          ? `${left} free ${left === 1 ? 'interpretation' : 'interpretations'} left this month`
          : purchasesAvailable
            ? 'Included with Micaiah Plus'
            : 'This month’s allowance is used'
      : null;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inner}>
          <View style={styles.topBar}>
            <IconButton icon="close" label="Close" onPress={close} />
            <T variant="heading" style={{ fontSize: 15 }}>
              {copy.title}
            </T>
            <IconButton
              icon="mic-outline"
              label="Speak instead"
              color={Colors.indigoMid}
              onPress={() => router.replace({ pathname: '/listen', params: { mode: kind, text } })}
            />
          </View>

          <View style={styles.titleBlock}>
            <T variant="title" style={{ color: Colors.indigoMid }}>
              {kind === 'dream' ? 'Describe your dream' : 'Share the word'}
            </T>
            <T>{copy.prompt}</T>
          </View>

          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={copy.placeholder}
            placeholderTextColor={Colors.inkSoft}
            multiline
            autoFocus={!params.text}
            maxLength={MAX_INTERPRET_LENGTH}
            textAlignVertical="top"
            accessibilityLabel={`${copy.title}. ${copy.prompt}`}
            style={styles.editor}
          />

          {allowance ? (
            <View style={styles.meta}>
              <Ionicons name="sparkles-outline" size={14} color={Colors.inkSoft} />
              <T variant="small">{allowance}</T>
            </View>
          ) : null}

          <PrimaryButton
            label={kind === 'dream' ? 'Interpret my dream' : 'Explain this word'}
            icon="sparkles"
            disabled={!canSubmit}
            onPress={submit}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.cream },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleBlock: { borderLeftWidth: 3, borderLeftColor: Colors.indigoPale, paddingLeft: Spacing.md, gap: Spacing.xs },
  editor: {
    flex: 1,
    minHeight: 160,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    fontFamily: Fonts.sans,
    fontSize: 18,
    lineHeight: 27,
    color: Colors.ink,
  },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
