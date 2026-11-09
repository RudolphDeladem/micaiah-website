import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { DEFAULT_BIBLE_VERSION } from './bible';
import { forgetInstallId } from './install-id';
import type { Entry, Interpretation, Settings } from './types';

const ENTRIES_KEY = 'micaiah.entries.v1';
const SETTINGS_KEY = 'micaiah.settings.v1';
const INTERPRETATIONS_KEY = 'micaiah.interpretations.v1';
/** Unsent drafts are saved under keys with this prefix (reflect and interpret screens). */
export const DRAFT_KEY_PREFIX = 'micaiah.draft.';


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
  // Writes build on the latest data (not a render's snapshot), so quick successive changes never overwrite each other.
  const entriesRef = useRef<Entry[]>([]);
  const interpretationsRef = useRef<Interpretation[]>([]);
  const settingsRef = useRef<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    (async () => {
      try {
        const [rawEntries, rawSettings, rawInterpretations] = await Promise.all([
          AsyncStorage.getItem(ENTRIES_KEY),
          AsyncStorage.getItem(SETTINGS_KEY),
          AsyncStorage.getItem(INTERPRETATIONS_KEY),
        ]);
        if (rawEntries) {
          entriesRef.current = sortNewestFirst(JSON.parse(rawEntries));
          setEntries(entriesRef.current);
        }
        if (rawInterpretations) {
          interpretationsRef.current = sortNewestFirst(JSON.parse(rawInterpretations));
          setInterpretations(interpretationsRef.current);
        }
        if (rawSettings) {
          settingsRef.current = { ...DEFAULT_SETTINGS, ...JSON.parse(rawSettings) };
          setSettings(settingsRef.current);
        }
      } catch {
        // Corrupt storage should never block the app from opening; start fresh.
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persistEntries = useCallback(async (update: (current: Entry[]) => Entry[]) => {
    const next = update(entriesRef.current);
    entriesRef.current = next;
    setEntries(next);
    await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(next));
  }, []);

  const addEntry = useCallback(
    (entry: Entry) => persistEntries((current) => sortNewestFirst([entry, ...current])),
    [persistEntries],
  );

  const updateEntry = useCallback(
    (id: string, patch: Partial<Entry>) =>
      persistEntries((current) => current.map((e) => (e.id === id ? { ...e, ...patch } : e))),
    [persistEntries],
  );

  const deleteEntry = useCallback(
    (id: string) => persistEntries((current) => current.filter((e) => e.id !== id)),
    [persistEntries],
  );

  const persistInterpretations = useCallback(async (update: (current: Interpretation[]) => Interpretation[]) => {
    const next = update(interpretationsRef.current);
    interpretationsRef.current = next;
    setInterpretations(next);
    await AsyncStorage.setItem(INTERPRETATIONS_KEY, JSON.stringify(next));
  }, []);

  const addInterpretation = useCallback(
    (item: Interpretation) => persistInterpretations((current) => sortNewestFirst([item, ...current])),
    [persistInterpretations],
  );

  const updateInterpretation = useCallback(
    (id: string, patch: Partial<Interpretation>) =>
      persistInterpretations((current) => current.map((i) => (i.id === id ? { ...i, ...patch } : i))),
    [persistInterpretations],
  );

  const deleteInterpretation = useCallback(
    (id: string) => persistInterpretations((current) => current.filter((i) => i.id !== id)),
    [persistInterpretations],
  );

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }, []);

  const deleteAllData = useCallback(async () => {
    // Unsent drafts (reflection, dream, prophetic word) are personal data too.
    const drafts = (await AsyncStorage.getAllKeys().catch(() => [] as readonly string[])).filter((k) =>
      k.startsWith(DRAFT_KEY_PREFIX),
    );
    await AsyncStorage.multiRemove([ENTRIES_KEY, SETTINGS_KEY, INTERPRETATIONS_KEY, ...drafts]);
    await forgetInstallId();
    entriesRef.current = [];
    interpretationsRef.current = [];
    settingsRef.current = DEFAULT_SETTINGS;
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

