import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { Entry, Settings } from './types';

const ENTRIES_KEY = 'micaiah.entries.v1';
const SETTINGS_KEY = 'micaiah.settings.v1';

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  onboarded: false,
  acceptedTermsAt: null,
  reminderEnabled: false,
  reminderHour: 7,
  reminderMinute: 30,
  cloudConsent: null,
};

type Store = {
  ready: boolean;
  entries: Entry[];
  settings: Settings;
  addEntry: (entry: Entry) => Promise<void>;
  updateEntry: (id: string, patch: Partial<Entry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  deleteAllData: () => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

function sortNewestFirst(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    (async () => {
      try {
        const [rawEntries, rawSettings] = await Promise.all([
          AsyncStorage.getItem(ENTRIES_KEY),
          AsyncStorage.getItem(SETTINGS_KEY),
        ]);
        if (rawEntries) setEntries(sortNewestFirst(JSON.parse(rawEntries)));
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

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    },
    [settings],
  );

  const deleteAllData = useCallback(async () => {
    await AsyncStorage.multiRemove([ENTRIES_KEY, SETTINGS_KEY]);
    setEntries([]);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      entries,
      settings,
      addEntry,
      updateEntry,
      deleteEntry,
      updateSettings,
      deleteAllData,
    }),
    [ready, entries, settings, addEntry, updateEntry, deleteEntry, updateSettings, deleteAllData],
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
