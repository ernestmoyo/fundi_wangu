import { createApiClient } from '@fundi-wangu/api-client';
import * as SecureStore from 'expo-secure-store';
import ENV from '@/config/env';

const TOKENS_KEY = 'auth_tokens';

async function getStoredTokens(): Promise<{ accessToken: string; refreshToken: string } | null> {
  const raw = await SecureStore.getItemAsync(TOKENS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function storeTokens(accessToken: string, refreshToken: string): Promise<void> {
  await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify({ accessToken, refreshToken }));
}

async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKENS_KEY);
}

export const api = createApiClient({
  baseUrl: ENV.API_BASE_URL,
  getAccessToken: async () => {
    const tokens = await getStoredTokens();
    return tokens?.accessToken ?? null;
  },
  getRefreshToken: async () => {
    const tokens = await getStoredTokens();
    return tokens?.refreshToken ?? null;
  },
  onTokenRefreshed: async (accessToken, refreshToken) => {
    await storeTokens(accessToken, refreshToken);
  },
  onAuthError: async () => {
    await clearTokens();
  },
  language: 'sw',
});

export { getStoredTokens, storeTokens, clearTokens };
