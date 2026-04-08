import { apiClient } from '@/src/api/client';
import { useQuery } from '@tanstack/react-query';

import { GetMeResponse } from './user.type';

const userBase = '/user';

export const userUri = {
  me: `${userBase}/me`,
};

export const userQueryKey = {
  me: ['user', 'me'] as const,
};

export const userApis = {
  getMe: () =>
    apiClient.get<GetMeResponse>(userUri.me).then((r) => r.data),
};

export const useGetCurrentUser = () => {
  return useQuery({
    queryKey: userQueryKey.me,
    queryFn: () => userApis.getMe(),
  });
};
