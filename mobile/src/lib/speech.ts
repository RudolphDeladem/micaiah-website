/** Preferred regional variant when the device's exact region is not supported, e.g. en-GH → en-US. */
const PREFERRED_VARIANT: Record<string, string[]> = {
  en: ['en-us', 'en-gb'],
  fr: ['fr-fr'],
  es: ['es-es', 'es-us', 'es-mx'],
  pt: ['pt-br', 'pt-pt'],
  de: ['de-de'],
  zh: ['zh-cn'],
};

const normalize = (locale: string) => locale.replace('_', '-').toLowerCase();

/**
 * Picks the speech-recognition locale closest to the device language from those the recognizer
 * supports. The iOS recognizer only starts with an exact supported identifier, so a regional
 * locale such as "en-GH" must be mapped to a supported one ("en-US"). With no list, uses `wanted`.
 */
export function pickSpeechLocale(wanted: string, supported: string[]): string {
  if (supported.length === 0) return wanted;
  const target = normalize(wanted);
  const exact = supported.find((l) => normalize(l) === target);
  if (exact) return exact;

  const language = target.split('-')[0];
  const sameLanguage = supported.filter((l) => normalize(l).split('-')[0] === language);
  for (const variant of PREFERRED_VARIANT[language] ?? []) {
    const match = sameLanguage.find((l) => normalize(l) === variant);
    if (match) return match;
  }
  if (sameLanguage.length > 0) return sameLanguage[0];
  return supported.find((l) => normalize(l) === 'en-us') ?? supported[0];
}

export type SpeechProblem = 'no-speech' | 'network' | 'microphone' | 'other';

/** Maps a recognizer error code to the kind of problem to explain; null when it needs no message. */
export function speechProblem(error: string): SpeechProblem | null {
  switch (error) {
    case 'aborted':
      return null;
    case 'no-speech':
      return 'no-speech';
    case 'network':
      return 'network';
    case 'audio-capture':
    case 'busy':
    case 'interrupted':
      return 'microphone';
    default:
      return 'other';
  }
}

export const SPEECH_PROBLEM_TEXT: Record<SpeechProblem, string> = {
  'no-speech': 'We didn’t catch anything. Tap “Keep speaking” and try again, a little closer to the phone.',
  network: 'Voice input needs an internet connection on this phone right now. Check your connection, or type instead.',
  microphone: 'The microphone is busy — close any call or recording app, then tap “Keep speaking”.',
  other: 'Voice input stopped unexpectedly. Tap “Keep speaking” to try again, or type instead.',
};
