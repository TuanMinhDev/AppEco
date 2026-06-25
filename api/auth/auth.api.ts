import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { apiClient } from '@/src/api/client';
import {
  clearAuthSession,
  persistAuthSession,
} from '@/src/auth/session';
import { getRefreshToken } from '@/src/auth/token-storage';
import { userQueryKey } from '@/api/user/user.api';

import {
  ChangePasswordPayload,
  ChangePasswordResponse,
  LoginPayload,
  LoginResponse,
  LogoutPayload,
  LogoutResponse,
  RefreshTokenPayload,
  RefreshTokenResponse,
  RegisterPayload,
  RegisterResponse,
} from './auth.type';
import {
  pickTokensFromLoginResponse,
  pickTokensFromRefreshResponse,
} from './auth.utils';

const userBase = '/user';

export const authUri = {
  login: `${userBase}/login`,
  register: `${userBase}/register`,
  changePassword: `${userBase}/change-password`,
  refreshToken: `${userBase}/refresh-token`,
  logout: `${userBase}/logout`,
};

export const authApis = {
  login: (payload: LoginPayload) =>
    apiClient.post<LoginResponse>(authUri.login, payload).then((r) => r.data),

  register: (payload: RegisterPayload) =>
    apiClient.post<RegisterResponse>(authUri.register, payload).then((r) => r.data),

  changePassword: (payload: ChangePasswordPayload) =>
    apiClient
      .post<ChangePasswordResponse>(authUri.changePassword, payload)
      .then((r) => r.data),

  refreshToken: (payload: RefreshTokenPayload) =>
    apiClient
      .post<RefreshTokenResponse>(authUri.refreshToken, payload)
      .then((r) => r.data),

  logout: async (payload?: LogoutPayload) => {
    const refreshToken = payload?.refreshToken ?? (await getRefreshToken());
    const body: LogoutPayload = refreshToken ? { refreshToken } : {};
    return apiClient.post<LogoutResponse>(authUri.logout, body).then((r) => r.data);
  },
};

export const useLogin = (props?: {
  onSuccess?: (response: LoginResponse, variables: LoginPayload) => void;
  onError?: (error: AxiosError<unknown>) => void;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApis.login(payload),
    onSuccess: async (response, variables) => {
      const tokens = pickTokensFromLoginResponse(response);
      if (tokens.accessToken && tokens.refreshToken) {
        await persistAuthSession(tokens);
      }

      void queryClient.invalidateQueries({ queryKey: userQueryKey.me });
      onSuccess?.(response, variables);
    },
    onError,
  });
};

export const useRegister = (props?: {
  onSuccess?: (response: RegisterResponse, data: RegisterPayload) => void;
  onError?: (error: AxiosError<unknown>) => void;
}) => {
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApis.register(payload),
    onSuccess,
    onError,
  });
};

export const useChangePassword = (props?: {
  onSuccess?: (data: ChangePasswordResponse) => void;
  onError?: (error: AxiosError<unknown>) => void;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      authApis.changePassword(payload),
    onSuccess: async (data) => {
      await clearAuthSession(queryClient);
      onSuccess?.(data);
    },
    onError,
  });
};

export const useLogout = (props?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError<unknown>) => void;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: () => authApis.logout(),
    onSuccess: async () => {
      await clearAuthSession(queryClient);
      onSuccess?.();
    },
    onError: async (error: AxiosError<unknown>) => {
      await clearAuthSession(queryClient);
      onError?.(error);
      onSuccess?.();
    },
  });
};

export const useRefreshToken = (props?: {
  onSuccess?: (data: RefreshTokenResponse) => void;
  onError?: (error: AxiosError<unknown>) => void;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: (payload: RefreshTokenPayload) =>
      authApis.refreshToken(payload),
    onSuccess: async (data) => {
      const tokens = pickTokensFromRefreshResponse(data);
      if (tokens.accessToken && tokens.refreshToken) {
        await persistAuthSession(tokens);
      }
      void queryClient.invalidateQueries({ queryKey: userQueryKey.me });
      onSuccess?.(data);
    },
    onError,
  });
};
