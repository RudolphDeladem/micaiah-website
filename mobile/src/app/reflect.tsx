import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SeekingWisdom } from '@/components/seeking-wisdom';
import { IconButton, PrimaryButton, T } from '@/components/ui';
import { Colors, Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { cloudInsightAvailable, generateInsight } from '@/lib/cloud-insight';
import { MAX_REFLECTION_LENGTH, MIN_REFLECTION_LENGTH } from '@/lib/insight-engine';
import { newEntryId, useStore } from '@/lib/store';
import type { ReflectionMode } from '@/lib/types';

const DRAFT_KEY = 'micaiah.draft.v1';
const MIN_SEEKING_MS = 2400;

const MODE_COPY: Record<ReflectionMode, { title: string; prompt: string; placeholder: string }> = {
  daily: {
    title: 'Daily Reflection',
    prompt: 'Take a deep breath. What is present for you right now?',
    placeholder: 'Type your heart out…',
  },
  prayer: {
    title: 'Prayer Journal',
    prompt: 'Speak to God honestly. What do you want to bring before Him?',
    placeholder: 'Dear Lord…',
  },
  gratitude: {
    title: 'Gratitude',
    prompt: 'What are you thankful for today, big or small?',
    placeholder: 'Today I am grateful for…',
  },
};

function asMode(value: unknown): ReflectionMode {
  return value === 'prayer' || value === 'gratitude' ? value : 'daily';
}

export default function Reflect() {
  const params = useLocalSearchParams<{ mode?: string; text?: string; voice?: string; prompt?: string }>();
  const mode = asMode(params.mode);
  const copy = MODE_COPY[mode];
  const { settings, addEntry, updateSettings } = useStore();

  const [text, setText] = useState(params.text ?? '');
  const [usedVoice] = useState(params.voice === '1');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [seeking, setSeeking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Restore an unsent draft (unless we arrived with a voice transcript).
  useEffect(() => {
    if (params.text) return;
    AsyncStorage.getItem(DRAFT_KEY)
      .then((draft) => {
        if (draft) setText((current) => current || draft);
      })
      .catch(() => {});
  }, [params.text]);

  // Autosave the draft so nothing is lost if the app closes.
  useEffect(() => {
    const handle = setTimeout(() => {
      const write = text.trim() ? AsyncStorage.setItem(DRAFT_KEY, text) : AsyncStorage.removeItem(DRAFT_KEY);
      write.then(() => text.trim() && setSavedAt(new Date())).catch(() => {});
    }, 600);
    return () => clearTimeout(handle);
  }, [text]);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const canSubmit = text.trim().length >= MIN_REFLECTION_LENGTH && !seeking;

  const close = () => {
    if (text.trim()) {
      Alert.alert('Leave this reflection?', 'Your draft is saved and will be here when you come back.', [
        { text: 'Keep writing', style: 'cancel' },
        { text: 'Leave', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  const run = async (cloudConsent: boolean | null) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setSeeking(true);
    const started = Date.now();
    try {
      const { insight, usedFallback } = await generateInsight(text.trim(), mode, {
        cloudConsent,
        signal: controller.signal,
      });
      const remaining = MIN_SEEKING_MS - (Date.now() - started);
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
      if (controller.signal.aborted) return;

      const id = newEntryId();
      await addEntry({
        id,
        createdAt: new Date().toISOString(),
        mode,
        text: text.trim(),
        inputMethod: usedVoice ? 'voice' : 'text',
        insight,
      });
      await AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
      router.replace({ pathname: '/entry/[id]', params: { id, fresh: '1', offline: usedFallback ? '1' : '0' } });
    } catch {
      if (!controller.signal.aborted) {
        Alert.alert('Something went wrong', 'We could not create your insight. Please try again.');
      }
    } finally {
      setSeeking(false);
    }
  };

  const submit = () => {
    if (!canSubmit) return;
    if (cloudInsightAvailable && settings.cloudConsent === null) {
      Alert.alert(
        'Use cloud AI for richer insights?',
        'Micaiah can send the text of this reflection securely to our insight service, where Anthropic’s Claude AI writes a personal reflection. Micaiah does not store your words, and they are never used to train AI. Or keep everything on your device. You can change this anytime in Settings.',
        [
          {
            text: 'Keep on device',
            onPress: () => updateSettings({ cloudConsent: false }).then(() => run(false)),
          },
          {
            text: 'Use cloud AI',
            onPress: () => updateSettings({ cloudConsent: true }).then(() => run(true)),
          },
        ],
      );
      return;
    }
    run(settings.cloudConsent);
  };

  const cancel = () => {
    abortRef.current?.abort();
    setSeeking(false);
  };

  if (seeking) return <SeekingWisdom onCancel={cancel} />;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inner}>
          <View style={styles.topBar}>
            <IconButton icon="close" label="Close" onPress={close} />
            <View style={{ alignItems: 'center' }}>
              <T variant="heading" style={{ fontSize: 15 }}>
                Today,
              </T>
              <T variant="small">{new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</T>
            </View>
            <IconButton
              icon="mic-outline"
              label="Speak instead"
              color={Colors.indigoMid}
              onPress={() => router.replace({ pathname: '/listen', params: { mode, text } })}
            />
          </View>

          <View style={styles.titleBlock}>
            <T variant="title" style={{ color: Colors.indigoMid }}>
              {copy.title}
            </T>
            <T>{params.prompt ? `What is on your heart about ${params.prompt.toLowerCase()}?` : copy.prompt}</T>
          </View>

          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={copy.placeholder}
            placeholderTextColor={Colors.inkSoft}
            multiline
            autoFocus={!params.text}
            maxLength={MAX_REFLECTION_LENGTH}
            textAlignVertical="top"
            accessibilityLabel={`${copy.title}. ${copy.prompt}`}
            style={styles.editor}
          />

          <View style={styles.meta}>
            <Ionicons name="text-outline" size={14} color={Colors.inkSoft} />
            <T variant="small">
              {words} {words === 1 ? 'word' : 'words'}
            </T>
            {savedAt ? (
              <>
                <T variant="small">·</T>
                <Ionicons name="time-outline" size={14} color={Colors.inkSoft} />
                <T variant="small">Draft saved</T>
              </>
            ) : null}
          </View>

          <PrimaryButton
            label="Generate Insight"
            icon="sparkles"
            disabled={!canSubmit}
            onPress={submit}
            accessibilityHint="Finds Scripture and guidance for your reflection"
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
  titleBlock: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.indigoPale,
    paddingLeft: Spacing.md,
    gap: Spacing.xs,
  },
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
