import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { apiClient } from '@/src/api/client';
import { store } from '@/src/store';
import { setTokens as setReduxTokens } from '@/src/store/slices/authSlice';

import { IAuth } from './auth.type';

const URI = '/api/v1/user';

export const authUri = {
  login: `${URI}/login`,
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
};

export const useLogin = (props?: {
  onSuccess?: (response: LoginResponse, data: IAuth) => void;
  onError?: (error: AxiosError<unknown>) => void;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: (payload: IAuth) => authApis.login(payload),
    onSuccess: (response: LoginResponse, variables) => {
      const token = response?.data?.token || response?.token;
      const refresh = response?.data?.refresh || response?.refresh;

      if (token) {
        store.dispatch(setReduxTokens({ accessToken: token, refreshToken: refresh ?? null }));
      }

      void queryClient.refetchQueries({
        queryKey: ['auth', 'currentUser'],
      });

      onSuccess?.(response, variables);
    },
    onError,
  });
};
