const AsyncStorage =
  require('@react-native-async-storage/async-storage').default;

/** Legacy key — access token */
export const ACCESS_TOKEN_KEY = 'token';
export const REFRESH_TOKEN_KEY = 'refreshToken';
export const ACCESS_TOKEN_EXPIRES_AT_KEY = 'accessTokenExpiresAt';

export type StoredAuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export async function getAccessToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function getAccessTokenExpiresAt(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

export async function setStoredTokens({
  accessToken,
  refreshToken,
  expiresIn,
}: StoredAuthTokens): Promise<void> {
  const expiresAt = Date.now() + expiresIn * 1000;
  await Promise.all([
    AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken),
    AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
    AsyncStorage.setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, String(expiresAt)),
  ]);
}

export async function clearStoredTokens(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY),
    ]);
  } catch {
    /* ignore */
  }
}
