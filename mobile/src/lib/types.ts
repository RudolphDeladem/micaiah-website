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
};
