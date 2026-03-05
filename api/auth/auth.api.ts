import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { apiClient } from '@/src/api/client';
import { store } from '@/src/store';
import { setTokens as setReduxTokens } from '@/src/store/slices/authSlice';

import { IAuth, IRegister } from './auth.type';

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

const URI = '/api/v1/user';

export const authUri = {
  login: `${URI}/login`,
  register: `${URI}/register`,
};

type LoginResponse = {
  token?: string;
  refresh?: string;
  data?: {
    token?: string;
    refresh?: string;
  };
};

export const authApis = {
  login: async (payload: IAuth) => {
    return apiClient.post<LoginResponse>(authUri.login, payload).then((r) => r.data);
  },
  register: async (payload: IRegister) => {
    return apiClient.post<unknown>(authUri.register, payload).then((r) => r.data);
  },
};

export const useLogin = (props?: {
  onSuccess?: (response: LoginResponse, data: IAuth) => void;
  onError?: (error: AxiosError<unknown>) => void;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: (payload: IAuth) => authApis.login(payload),
    onSuccess: async (response: LoginResponse, variables) => {
      const token = response?.data?.token || response?.token;
      const refresh = response?.data?.refresh || response?.refresh;

      if (token) {
        // Lưu vào Redux
        store.dispatch(setReduxTokens({ accessToken: token, refreshToken: refresh ?? null }));

        // Lưu vào AsyncStorage
        try {
          await AsyncStorage.setItem('token', token);
          if (refresh) {
            await AsyncStorage.setItem('refreshToken', refresh);
          }
        } catch (error) {
        }
      }

      void queryClient.refetchQueries({
        queryKey: ['auth', 'currentUser'],
      });

      onSuccess?.(response, variables);
    },
    onError,
  });
};

export const useRegister = (props?: {
  onSuccess?: (response: unknown, data: IRegister) => void;
  onError?: (error: AxiosError<unknown>) => void;
}) => {
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: (payload: IRegister) => authApis.register(payload),
    onSuccess,
    onError,
  });
};
