import axios from 'axios';
import type { QueryClient } from '@tanstack/react-query';

import { store } from '@/src/store';
import { clearTokens, setTokens } from '@/src/store/slices/authSlice';
import { getBaseUrl } from '@/constants/api-base-url';

import {
  clearStoredTokens,
  getAccessToken,
  getAccessTokenExpiresAt,
  getRefreshToken,
  setStoredTokens,
  type StoredAuthTokens,
} from './token-storage';

const REFRESH_PATH = '/user/refresh-token';
const PROACTIVE_REFRESH_MS = 2 * 60 * 1000;

let refreshClient: ReturnType<typeof axios.create> | null = null;

function getRefreshClient() {
  if (!refreshClient) {
    refreshClient = axios.create({
      baseURL: getBaseUrl(),
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }
  return refreshClient;
}

let refreshPromise: Promise<boolean> | null = null;
let sessionExpiredHandler: (() => void) | null = null;
let isOnAuthRoute: () => boolean = () => false;
let sessionExpiredNotified = false;

export function setAuthRouteChecker(checker: () => boolean) {
  isOnAuthRoute = checker;
}

export function setSessionExpiredHandler(handler: (() => void) | null) {
  sessionExpiredHandler = handler;
}

export function notifySessionExpired() {
  // Đang ở welcome / login / register: chỉ xóa token, không ép chuyển trang
  if (isOnAuthRoute()) return;
  if (sessionExpiredNotified) return;
  sessionExpiredNotified = true;
  sessionExpiredHandler?.();
  setTimeout(() => {
    sessionExpiredNotified = false;
  }, 1500);
}

export function shouldSkipAuthRefresh(url?: string): boolean {
  if (!url) return false;
  const paths = ['/user/login', '/user/register', REFRESH_PATH];
  return paths.some((p) => url.includes(p));
}

export async function persistAuthSession(tokens: StoredAuthTokens): Promise<void> {
  await setStoredTokens(tokens);
  store.dispatch(
    setTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }),
  );
}

export async function clearAuthSession(queryClient?: QueryClient): Promise<void> {
  await clearStoredTokens();
  store.dispatch(clearTokens());
  if (queryClient) {
    queryClient.removeQueries();
  }
}

export async function hydrateAuthFromStorage(): Promise<void> {
  const accessToken = await getAccessToken();
  const refreshToken = await getRefreshToken();
  if (accessToken) {
    store.dispatch(
      setTokens({
        accessToken,
        refreshToken: refreshToken ?? null,
      }),
    );
  }
}

/** Refresh chủ động ~2 phút trước khi access token hết hạn */
export async function ensureAccessTokenFresh(): Promise<void> {
  const expiresAt = await getAccessTokenExpiresAt();
  if (!expiresAt) return;
  if (Date.now() < expiresAt - PROACTIVE_REFRESH_MS) return;
  await refreshAccessToken();
}

export async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;

    try {
      const { data } = await getRefreshClient().post<{
        accessToken?: string;
        token?: string;
        refreshToken: string;
        expiresIn?: number;
      }>(REFRESH_PATH, { refreshToken });

      const accessToken = data.accessToken ?? data.token;
      if (!accessToken || !data.refreshToken) return false;

      await persistAuthSession({
        accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn ?? 1800,
      });
      return true;
    } catch {
      return false;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}
