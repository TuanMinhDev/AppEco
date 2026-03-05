const URI = '/api/v1/product';

import { apiClient } from '@/src/api/client';
import { useQuery } from '@tanstack/react-query';
import { GetDetailProductResponse, GetProductQuery, GetProductResponse } from './product.type';

export const productUri = {
    listProduct: `${URI}/get`,
    getDetailProduct: `${URI}/get/:id`,
};

export const productKey = {
    LIST_PRODUCT: 'LIST_PRODUCT',
    GET_DETAIL_PRODUCT: 'GET_DETAIL_PRODUCT',
}

export const productApis = {
    listProduct: (params: GetProductQuery) => {
        return apiClient.get<GetProductResponse>(productUri.listProduct, { params });
    },
    getDetailProduct: (id: string) => {
        return apiClient.get<GetDetailProductResponse>(productUri.getDetailProduct.replace(':id', id));
    },
};

export const useListProduct = (params: GetProductQuery) => {
    return useQuery({
        queryKey: [productKey.LIST_PRODUCT, params],
        queryFn: () => productApis.listProduct(params),
        select: (data) => data,
        placeholderData: (previousData) => previousData,
    });
}

export const useDetailProduct = (id: string) => {
    return useQuery({
        queryKey: [productKey.GET_DETAIL_PRODUCT, id],
        queryFn: () => productApis.getDetailProduct(id),
        select: (data) => data,
        placeholderData: (previousData) => previousData,
    });
}