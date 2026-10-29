import type { BibleVersionId, ScriptureRef } from './bible';

export type ReflectionMode = 'daily' | 'prayer' | 'gratitude';

export type Verse = {
  ref: string;
  text: string;
};

export type Theme = {
  id: string;
  label: string;
  icon: string;
  keywords: string[];
  interpretations: string[];
  steps: string[][];
  prayers: string[];
  verses: Verse[];
};

export type InsightSource = 'on-device' | 'cloud';

export type Insight = {
  themeId: string;
  themeLabel: string;
  interpretation: string;
  verses: Verse[];
  steps: string[];
  prayer: string;
  source: InsightSource;
  /** True when the reflection contained language suggesting the person may be in danger. */
  crisis: boolean;
};

export type Entry = {
  id: string;
  createdAt: string;
  mode: ReflectionMode;
  text: string;
  inputMethod: 'text' | 'voice';
  insight: Insight;
  favorite?: boolean;
};

export type Settings = {
  name: string;
  onboarded: boolean;
  /** ISO timestamp of when the user accepted the Terms & disclaimer. */
  acceptedTermsAt: string | null;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  /** null = never asked; true/false = explicit choice. */
  cloudConsent: boolean | null;
  /** Explicit consent to send dreams / prophetic words to the AI service (asked on first use). */
  interpretConsent: boolean;
  bibleVersion: BibleVersionId;
  /** Where the Bible reader was last open: book index (0 = Genesis) and chapter number. */
  lastRead: { book: number; chapter: number } | null;
};

export type InterpretationKind = 'dream' | 'prophetic';

export type InterpretationPoint = { heading: string; body: string; refs: ScriptureRef[] };

/** An AI interpretation of a dream or a prophetic word. Scripture is stored as references and shown in the reader's chosen translation. */
export type Interpretation = {
  id: string;
  createdAt: string;
  kind: InterpretationKind;
  /** What the person wrote. */
  text: string;
  title: string;
  summary: string;
  points: InterpretationPoint[];
  refs: ScriptureRef[];
  cautions: string[];
  steps: string[];
  prayer: string;
  crisis: boolean;
  favorite?: boolean;
};
