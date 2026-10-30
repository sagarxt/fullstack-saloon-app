import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Robust SecureStorage helper that uses SecureStore on iOS/Android (Keychain / Keystore)
 * and falls back gracefully to AsyncStorage on web/unsupported environments.
 */
export async function saveSecureItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  } catch (error) {
    console.warn(`[SecureStore] Error saving ${key}:`, error);
    await AsyncStorage.setItem(key, value);
  }
}

export async function getSecureItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS !== 'web') {
      return await SecureStore.getItemAsync(key);
    }
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.warn(`[SecureStore] Error reading ${key}:`, error);
    return await AsyncStorage.getItem(key);
  }
}

export async function deleteSecureItem(key: string): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(key);
    }
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn(`[SecureStore] Error deleting ${key}:`, error);
    await AsyncStorage.removeItem(key);
  }
}
