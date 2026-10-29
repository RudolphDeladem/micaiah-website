import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

/**
 * Pseudonymous install ID: links this install to its subscription (it is the RevenueCat app
 * user ID) and to its monthly interpretation count on the AI service. Random, never tied to a
 * name, email or device identifier, and erased by "Delete all data".
 */
const INSTALL_ID_KEY = 'micaiah.install-id.v1';

let installId: string | null = null;

export async function getInstallId(): Promise<string> {
  if (installId) return installId;
  const stored = await AsyncStorage.getItem(INSTALL_ID_KEY).catch(() => null);
  if (stored) return (installId = stored);
  const id = `m_${Crypto.randomUUID().replace(/-/g, '').toLowerCase()}`;
  await AsyncStorage.setItem(INSTALL_ID_KEY, id).catch(() => {});
  return (installId = id);
}

export async function forgetInstallId(): Promise<void> {
  installId = null;
  await AsyncStorage.removeItem(INSTALL_ID_KEY).catch(() => {});
}
