/// <reference types="jest" />
import { SPEECH_PROBLEM_TEXT, pickSpeechLocale, speechProblem } from '../speech';

// A subset of SFSpeechRecognizer.supportedLocales() on iOS.
const IOS = ['de-DE', 'en-AU', 'en-GB', 'en-IN', 'en-NG', 'en-US', 'en-ZA', 'es-ES', 'es-MX', 'fr-FR', 'fr-CA', 'pt-BR'];

describe('pickSpeechLocale', () => {
  it('keeps an exactly supported locale, whatever the separator or case', () => {
    expect(pickSpeechLocale('en-GB', IOS)).toBe('en-GB');
    expect(pickSpeechLocale('en_ng', IOS)).toBe('en-NG');
    expect(pickSpeechLocale('fr-CA', IOS)).toBe('fr-CA');
  });

  it('maps an unsupported region to the preferred variant of the same language', () => {
    expect(pickSpeechLocale('en-GH', IOS)).toBe('en-US');
    expect(pickSpeechLocale('fr-CI', IOS)).toBe('fr-FR');
    expect(pickSpeechLocale('pt-AO', IOS)).toBe('pt-BR');
    expect(pickSpeechLocale('en', IOS)).toBe('en-US');
  });

  it('falls back to English when the language is not supported at all', () => {
    expect(pickSpeechLocale('tw-GH', IOS)).toBe('en-US');
    expect(pickSpeechLocale('tw-GH', ['fr-FR'])).toBe('fr-FR');
  });

  it('uses the device locale when the recognizer gives no list (older Android)', () => {
    expect(pickSpeechLocale('en-GH', [])).toBe('en-GH');
  });
});

describe('speechProblem', () => {
  it('explains each kind of failure, and stays quiet when the user stopped it', () => {
    expect(speechProblem('aborted')).toBeNull();
    expect(speechProblem('no-speech')).toBe('no-speech');
    expect(speechProblem('network')).toBe('network');
    expect(speechProblem('audio-capture')).toBe('microphone');
    expect(speechProblem('interrupted')).toBe('microphone');
    expect(speechProblem('client')).toBe('other');
    for (const text of Object.values(SPEECH_PROBLEM_TEXT)) expect(text.length).toBeGreaterThan(20);
  });
});
