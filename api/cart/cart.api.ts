const URI = '/api/v1/cart';

import { apiClient } from '@/src/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { DeleteCart, GetCartResponse, PayloadCart, UpdateQuatity } from './cart.type';

export const cartUri = {
    listCart: `${URI}/get`,
    createCart: `${URI}/create`,
    updateQuality: `${URI}/update/:cartId/:itemId`,
    delete: `${URI}/delete`,
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
    updateQuality: (cartId: string, itemId: string, payload: UpdateQuatity) => {
        return apiClient.put<string>(cartUri.updateQuality.replace(':cartId', cartId).replace(':itemId', itemId), payload);
    },
    delete: (payload: DeleteCart) => {
        return apiClient.delete<string>(cartUri.delete, { data: payload });
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

export const useUpdateQuality = (props?: {
    onSuccess?: (data: any) => void;
    onError?: (error: AxiosError<null>) => void;
}) => {
    const queryClient = useQueryClient();
    const { onSuccess, onError } = props ?? {};

    return useMutation({
        mutationFn: ({ cartId, itemId, payload }: { cartId: string; itemId: string; payload: UpdateQuatity }) => 
            cartApis.updateQuality(cartId, itemId, payload),
        onSuccess: (data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: [cartKey.LIST_CART],
                refetchType: 'active',
            });
            onSuccess?.(data);
        },
        onError,
    });
};


export const useDeleteCart = (props?: {
    onSuccess?: (data: any) => void;
    onError?: (error: AxiosError<null>) => void;
}) => {
    const queryClient = useQueryClient();
    const { onSuccess, onError } = props ?? {};

    return useMutation({
        mutationFn: (payload: DeleteCart) => cartApis.delete(payload),
        onSuccess: (data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: [cartKey.LIST_CART],
                refetchType: 'active',
            });
            onSuccess?.(data);
        },
        onError,
    });
};

