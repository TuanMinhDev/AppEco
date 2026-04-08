import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { apiClient } from '@/src/api/client';
import { store } from '@/src/store';
import { setTokens as setReduxTokens } from '@/src/store/slices/authSlice';
import { userQueryKey } from '@/api/user/user.api';

import {
  ChangePasswordPayload,
  ChangePasswordResponse,
  LoginPayload,
  LoginResponse,
  RefreshTokenPayload,
  RefreshTokenResponse,
  RegisterPayload,
  RegisterResponse,
} from './auth.type';

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

const userBase = '/user';

export const authUri = {
  login: `${userBase}/login`,
  register: `${userBase}/register`,
  changePassword: `${userBase}/change-password`,
  refreshToken: `${userBase}/refresh-token`,
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
      const token = response.token;
      if (token) {
        store.dispatch(
          setReduxTokens({ accessToken: token, refreshToken: null }),
        );
        try {
          await AsyncStorage.setItem('token', token);
        } catch {
          /* ignore */
        }
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
  const { onSuccess, onError } = props ?? {};
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      authApis.changePassword(payload),
    onSuccess,
    onError,
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
    onSuccess: async (data, variables) => {
      try {
        await AsyncStorage.setItem('token', data.accessToken);
        await AsyncStorage.setItem('refreshToken', data.refreshToken);
      } catch {
        /* ignore */
      }
      store.dispatch(
        setReduxTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        }),
      );
      void queryClient.invalidateQueries({ queryKey: userQueryKey.me });
      onSuccess?.(data);
    },
    onError,
  });
};
