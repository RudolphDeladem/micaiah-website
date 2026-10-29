import Ionicons from '@expo/vector-icons/Ionicons';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton, PrimaryButton, SecondaryButton, T, tapFeedback } from '@/components/ui';
import { Colors, Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';

type Status = 'idle' | 'listening' | 'paused' | 'denied' | 'unavailable';

const BAR_COUNT = 11;
const BAR_SHAPE = [0.25, 0.4, 0.55, 0.75, 0.9, 1, 0.9, 0.75, 0.55, 0.4, 0.25];

function deviceLocale(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || 'en-US';
  } catch {
    return 'en-US';
  }
}

function formatElapsed(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function join(a: string, b: string): string {
  return [a.trim(), b.trim()].filter(Boolean).join(' ');
}

export default function Listen() {
  const params = useLocalSearchParams<{ mode?: string; text?: string }>();
  const [status, setStatus] = useState<Status>('idle');
  const [committed, setCommitted] = useState(params.text ?? '');
  const [interim, setInterim] = useState('');
  const [volume, setVolume] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useSpeechRecognitionEvent('start', () => setStatus('listening'));
  useSpeechRecognitionEvent('end', () => {
    setVolume(0);
    setStatus((s) => (s === 'listening' ? 'paused' : s));
  });
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript ?? '';
    if (event.isFinal) {
      setCommitted((c) => join(c, transcript));
      setInterim('');
    } else {
      setInterim(transcript);
    }
  });
  useSpeechRecognitionEvent('volumechange', (event) => setVolume(Math.max(0, Math.min(1, event.value / 10))));
  useSpeechRecognitionEvent('error', (event) => {
    if (event.error === 'not-allowed') setStatus('denied');
    else if (event.error === 'service-not-allowed' || event.error === 'language-not-supported') setStatus('unavailable');
    else if (event.error !== 'aborted' && event.error !== 'no-speech') setStatus('paused');
    else setStatus((s) => (s === 'listening' ? 'paused' : s));
  });

  const start = useCallback(async () => {
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      setStatus('unavailable');
      return;
    }
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setStatus('denied');
      return;
    }
    ExpoSpeechRecognitionModule.start({
      lang: deviceLocale(),
      interimResults: true,
      continuous: true,
      addsPunctuation: true,
      // Keep audio on the device whenever the OS supports it.
      requiresOnDeviceRecognition:
        Platform.OS === 'ios' && ExpoSpeechRecognitionModule.supportsOnDeviceRecognition(),
      iosTaskHint: 'dictation',
      volumeChangeEventOptions: { enabled: true, intervalMillis: 120 },
    });
  }, []);

  useEffect(() => {
    // Start after the first frame so the screen is visible before the permission prompt.
    const timer = setTimeout(start, 250);
    return () => {
      clearTimeout(timer);
      ExpoSpeechRecognitionModule.abort();
    };
  }, [start]);

  useEffect(() => {
    if (status !== 'listening') return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  const fullText = join(committed, interim);
  const mode = params.mode ?? 'daily';

  const goToReview = (text: string) =>
    mode === 'dream' || mode === 'prophetic'
      ? router.replace({ pathname: '/interpret/[kind]', params: { kind: mode, text } })
      : router.replace({ pathname: '/reflect', params: { mode, text, voice: text.trim() ? '1' : '0' } });

  const stop = () => {
    tapFeedback();
    ExpoSpeechRecognitionModule.stop();
    // Give the recognizer a moment to deliver its final result, then review.
    setTimeout(() => setStatus('paused'), 400);
  };

  const close = () => {
    ExpoSpeechRecognitionModule.abort();
    router.back();
  };

  if (status === 'denied' || status === 'unavailable') {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.inner}>
          <IconButton icon="close" label="Close" onPress={close} style={{ alignSelf: 'flex-end' }} />
          <View style={styles.center}>
            <Ionicons name="mic-off-outline" size={48} color={Colors.indigoLight} />
            <T variant="title" style={{ textAlign: 'center' }}>
              {status === 'denied' ? 'Microphone access is off' : 'Voice input isn’t available'}
            </T>
            <T style={{ textAlign: 'center' }}>
              {status === 'denied'
                ? 'To speak instead of typing, allow microphone and speech recognition access for Micaiah in Settings. You can always type instead.'
                : 'Speech recognition isn’t available on this device right now. You can type instead.'}
            </T>
          </View>
          <View style={{ gap: Spacing.sm }}>
            {status === 'denied' ? (
              <SecondaryButton label="Open Settings" icon="settings-outline" onPress={() => Linking.openSettings()} />
            ) : null}
            <PrimaryButton label="Type instead" icon="create-outline" onPress={() => goToReview(committed)} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const listening = status === 'listening';

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.inner}>
        <IconButton icon="close" label="Close" onPress={close} style={{ alignSelf: 'flex-end' }} />

        <View style={styles.center}>
          <T variant="label" style={{ color: Colors.inkSoft, letterSpacing: 2 }}>
            {listening ? 'Listening closely…' : status === 'paused' ? 'Paused' : 'Getting ready…'}
          </T>
          <T style={styles.timer} accessibilityLabel={`${elapsed} seconds recorded`}>
            {formatElapsed(elapsed)}
          </T>
          <View style={styles.bars} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {BAR_SHAPE.slice(0, BAR_COUNT).map((shape, i) => (
              <View
                key={i}
                style={[
                  styles.bar,
                  {
                    height: 10 + shape * (listening ? 18 + volume * 90 : 10),
                    opacity: 0.35 + shape * 0.65,
                  },
                ]}
              />
            ))}
          </View>
          <ScrollView style={styles.transcript} contentContainerStyle={{ padding: Spacing.md }}>
            <T style={{ textAlign: 'center', color: fullText ? Colors.inkMid : Colors.inkSoft }}>
              {fullText || 'Start speaking — your words will appear here.'}
            </T>
          </ScrollView>
        </View>

        {listening ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Stop recording"
            onPress={stop}
            style={({ pressed }) => [styles.stopButton, { opacity: pressed ? 0.85 : 1 }]}>
            <View style={styles.stopSquare} />
          </Pressable>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            <PrimaryButton
              label="Review & Generate"
              icon="sparkles"
              disabled={!fullText.trim()}
              onPress={() => goToReview(fullText)}
            />
            <SecondaryButton label="Keep speaking" icon="mic-outline" onPress={start} />
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            ExpoSpeechRecognitionModule.abort();
            goToReview(fullText);
          }}
          style={styles.typeInstead}>
          <Ionicons name="keypad-outline" size={18} color={Colors.inkMid} />
          <T style={{ fontFamily: Fonts.sansMedium }}>Type instead</T>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.indigoGhost },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  timer: { fontFamily: Fonts.sans, fontSize: 64, lineHeight: 72, color: Colors.indigoMid },
  bars: { flexDirection: 'row', alignItems: 'center', gap: 7, height: 120 },
  bar: { width: 9, borderRadius: 5, backgroundColor: Colors.indigoMid },
  transcript: {
    maxHeight: 160,
    alignSelf: 'stretch',
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  stopButton: {
    alignSelf: 'center',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.indigoMid,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.indigo,
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  stopSquare: { width: 26, height: 26, borderRadius: 4, borderWidth: 3, borderColor: Colors.white },
  typeInstead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 44,
  },
});
