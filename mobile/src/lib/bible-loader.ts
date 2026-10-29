import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import type { BibleText, BibleVersionId } from './bible';

/* eslint-disable @typescript-eslint/no-require-imports -- asset modules are only available through require() */
const SOURCES: Record<BibleVersionId, number> = {
  kjv: require('../../assets/bibles/kjv.bible'),
  web: require('../../assets/bibles/web.bible'),
  asv: require('../../assets/bibles/asv.bible'),
  bbe: require('../../assets/bibles/bbe.bible'),
};
/* eslint-enable @typescript-eslint/no-require-imports */

// Each translation is ~4 MB of text, so only the one in use is kept in memory.
let cached: { id: BibleVersionId; text: BibleText } | null = null;
const pending = new Map<BibleVersionId, Promise<BibleText>>();

async function readBible(id: BibleVersionId): Promise<BibleText> {
  const asset = Asset.fromModule(SOURCES[id]);
  if (Platform.OS === 'web') return (await fetch(asset.uri)).json();
  await asset.downloadAsync();
  return JSON.parse(await new File(asset.localUri ?? asset.uri).text());
}

export function loadBible(id: BibleVersionId): Promise<BibleText> {
  if (cached?.id === id) return Promise.resolve(cached.text);
  let promise = pending.get(id);
  if (!promise) {
    promise = readBible(id)
      .then((text) => {
        cached = { id, text };
        return text;
      })
      .finally(() => pending.delete(id));
    pending.set(id, promise);
  }
  return promise;
}

/** Loads a translation; `text` is null while loading. */
export function useBible(id: BibleVersionId): { text: BibleText | null; error: boolean } {
  const [state, setState] = useState<{ id: BibleVersionId; text: BibleText | null; error: boolean }>(() => ({
    id,
    text: cached?.id === id ? cached.text : null,
    error: false,
  }));

  useEffect(() => {
    let active = true;
    loadBible(id)
      .then((text) => active && setState({ id, text, error: false }))
      .catch(() => active && setState({ id, text: null, error: true }));
    return () => {
      active = false;
    };
  }, [id]);

  return state.id === id ? { text: state.text, error: state.error } : { text: null, error: false };
}
