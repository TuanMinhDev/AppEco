const URI = '/api/v1/user';
import { ResponseCurrentUser } from './user.type';

import { apiClient } from '@/src/api/client';
import { useQuery } from '@tanstack/react-query';

export const userUri = {
    me: `${URI}/me`,
};

export const userKey = {
    ME: 'ME'
}

export const userApis = {
    getMe: () => {
        return apiClient.get<ResponseCurrentUser>(userUri.me);
    },
};

export const useGetCurrentUser = () => {
    return useQuery({
        queryKey: [userKey.ME],
        queryFn: () => userApis.getMe(),
        select: (data) => data,
        placeholderData: (previousData) => previousData,
    });
}