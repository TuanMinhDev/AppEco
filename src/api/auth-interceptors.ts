import type { AxiosError, InternalAxiosRequestConfig } from "axios";

import {
  clearAuthSession,
  ensureAccessTokenFresh,
  notifySessionExpired,
  refreshAccessToken,
  shouldSkipAuthRefresh,
} from "@/src/auth/session";
import { getAccessToken } from "@/src/auth/token-storage";

import { apiClient } from "./client-core";

let registered = false;

/** Gắn interceptor auth — gọi một lần sau khi module graph ổn định. */
export function registerAuthInterceptors() {
  if (registered) return;
  registered = true;

  apiClient.interceptors.request.use(
    async (config) => {
      try {
        if (!shouldSkipAuthRefresh(config.url)) {
          await ensureAccessTokenFresh();
        }
        const token = await getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        /* ignore */
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      if (!originalRequest || error.response?.status !== 401) {
        return Promise.reject(error);
      }

      if (shouldSkipAuthRefresh(originalRequest.url)) {
        return Promise.reject(error);
      }

      if (originalRequest._retry) {
        await clearAuthSession();
        notifySessionExpired();
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        await clearAuthSession();
        notifySessionExpired();
        return Promise.reject(error);
      }

      const token = await getAccessToken();
      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
      }
      return apiClient(originalRequest);
    },
  );
}
