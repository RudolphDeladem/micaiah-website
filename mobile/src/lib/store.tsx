import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { DEFAULT_BIBLE_VERSION } from './bible';
import type { Entry, Interpretation, Settings } from './types';

const ENTRIES_KEY = 'micaiah.entries.v1';
const SETTINGS_KEY = 'micaiah.settings.v1';
const INTERPRETATIONS_KEY = 'micaiah.interpretations.v1';
/** Pseudonymous install ID: links this device to its subscription and monthly usage. Never tied to a name or email. */
const INSTALL_ID_KEY = 'micaiah.install-id.v1';

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  onboarded: false,
  acceptedTermsAt: null,
  reminderEnabled: false,
  reminderHour: 7,
  reminderMinute: 30,
  cloudConsent: null,
  interpretConsent: false,
  bibleVersion: DEFAULT_BIBLE_VERSION,
  lastRead: null,
};

type Store = {
  ready: boolean;
  entries: Entry[];
  interpretations: Interpretation[];
  settings: Settings;
  addEntry: (entry: Entry) => Promise<void>;
  updateEntry: (id: string, patch: Partial<Entry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  addInterpretation: (item: Interpretation) => Promise<void>;
  updateInterpretation: (id: string, patch: Partial<Interpretation>) => Promise<void>;
  deleteInterpretation: (id: string) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  deleteAllData: () => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

function sortNewestFirst<T extends { createdAt: string }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [interpretations, setInterpretations] = useState<Interpretation[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    (async () => {
      try {
        const [rawEntries, rawSettings, rawInterpretations] = await Promise.all([
          AsyncStorage.getItem(ENTRIES_KEY),
          AsyncStorage.getItem(SETTINGS_KEY),
          AsyncStorage.getItem(INTERPRETATIONS_KEY),
        ]);
        if (rawEntries) setEntries(sortNewestFirst(JSON.parse(rawEntries)));
        if (rawInterpretations) setInterpretations(sortNewestFirst(JSON.parse(rawInterpretations)));
        if (rawSettings) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(rawSettings) });
      } catch {
        // Corrupt storage should never block the app from opening; start fresh.
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persistEntries = useCallback(async (next: Entry[]) => {
    setEntries(next);
    await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(next));
  }, []);

  const addEntry = useCallback(
    (entry: Entry) => persistEntries(sortNewestFirst([entry, ...entries])),
    [entries, persistEntries],
  );

  const updateEntry = useCallback(
    (id: string, patch: Partial<Entry>) =>
      persistEntries(entries.map((e) => (e.id === id ? { ...e, ...patch } : e))),
    [entries, persistEntries],
  );

  const deleteEntry = useCallback(
    (id: string) => persistEntries(entries.filter((e) => e.id !== id)),
    [entries, persistEntries],
  );

  const persistInterpretations = useCallback(async (next: Interpretation[]) => {
    setInterpretations(next);
    await AsyncStorage.setItem(INTERPRETATIONS_KEY, JSON.stringify(next));
  }, []);

  const addInterpretation = useCallback(
    (item: Interpretation) => persistInterpretations(sortNewestFirst([item, ...interpretations])),
    [interpretations, persistInterpretations],
  );

  const updateInterpretation = useCallback(
    (id: string, patch: Partial<Interpretation>) =>
      persistInterpretations(interpretations.map((i) => (i.id === id ? { ...i, ...patch } : i))),
    [interpretations, persistInterpretations],
  );

  const deleteInterpretation = useCallback(
    (id: string) => persistInterpretations(interpretations.filter((i) => i.id !== id)),
    [interpretations, persistInterpretations],
  );

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    },
    [settings],
  );

  const deleteAllData = useCallback(async () => {
    await AsyncStorage.multiRemove([ENTRIES_KEY, SETTINGS_KEY, INTERPRETATIONS_KEY, INSTALL_ID_KEY]);
    installId = null;
    setEntries([]);
    setInterpretations([]);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      entries,
      interpretations,
      settings,
      addEntry,
      updateEntry,
      deleteEntry,
      addInterpretation,
      updateInterpretation,
      deleteInterpretation,
      updateSettings,
      deleteAllData,
    }),
    [
      ready,
      entries,
      interpretations,
      settings,
      addEntry,
      updateEntry,
      deleteEntry,
      addInterpretation,
      updateInterpretation,
      deleteInterpretation,
      updateSettings,
      deleteAllData,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <StoreProvider>');
  return store;
}

export function newEntryId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

let installId: string | null = null;

/** Random, pseudonymous ID for this install (created on first use). */
export async function getInstallId(): Promise<string> {
  if (installId) return installId;
  const stored = await AsyncStorage.getItem(INSTALL_ID_KEY).catch(() => null);
  if (stored) return (installId = stored);
  const id = `m_${Crypto.randomUUID().replace(/-/g, '')}`;
  await AsyncStorage.setItem(INSTALL_ID_KEY, id).catch(() => {});
  return (installId = id);
}
