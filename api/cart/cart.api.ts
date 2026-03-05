const URI = '/api/v1/cart';

import { apiClient } from '@/src/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { GetCartResponse, PayloadCart } from './cart.type';

export const cartUri = {
    listCart: `${URI}/get`,
    createCart: `${URI}/create`,
};

export const cartKey = {
    LIST_CART: 'LIST_CART',
    CREATE_CART: 'CREATE_CART',
}

export const cartApis = {
    listCart: () => {
        return apiClient.get<GetCartResponse>(cartUri.listCart);
    },
    createCart: (payload: PayloadCart) => {
        return apiClient.post<string>(cartUri.createCart, payload);
    },
};

export const useListCart = () => {
    return useQuery({
        queryKey: [cartKey.LIST_CART],
        queryFn: () => cartApis.listCart(),
        select: (data) => data,
        placeholderData: (previousData) => previousData,
    });
}

export const useCreateCart = (props?: {
    onSuccess?: (data: PayloadCart) => void;
    onError?: (error: AxiosError<null>) => void;
}) => {
    const queryClient = useQueryClient();
    const { onSuccess, onError } = props ?? {};

    return useMutation({
        mutationFn: (payload: PayloadCart) => cartApis.createCart(payload),
        onSuccess: (_, variables) => {
            void queryClient.invalidateQueries({
                queryKey: [cartKey.LIST_CART],
                refetchType: 'active',
            });
            onSuccess?.(variables);
        },
        onError,
    });
};
