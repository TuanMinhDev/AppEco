import { apiClient, ApiResponse, ApiResponseList } from '@/src/api/client';
import { useQuery } from '@tanstack/react-query';

import {
  GetProductQuery,
  Product
} from './product.type';

const URL = '/product';

export const productUri = {
  list: `${URL}/get`,
  detail: `${URL}/:id`,
};

export const productKey = {
  LIST_PRODUCT: 'LIST_PRODUCT',
  GET_DETAIL_PRODUCT: 'GET_DETAIL_PRODUCT',
};

export const productApis = {
  list: (params: GetProductQuery) => {
    return apiClient.get<ApiResponseList<Product[]>>
      (productUri.list, { params });
  },


  getById: (id: string) => {
    return apiClient
      .get<ApiResponse<Product>>
      (productUri.detail.replace(':id', id));
  },
};

export const useListProduct = (params?: GetProductQuery) => {
  return useQuery({
    queryKey: [productKey.LIST_PRODUCT, params],
    queryFn: () => productApis.list(params || {}),
    placeholderData: (previousData) => previousData,
    select: (data) => data,
  });
};

export const useDetailProduct = (id: string) => {
  return useQuery({
    queryKey: [productKey.GET_DETAIL_PRODUCT, id],
    queryFn: () => productApis.getById(id),
    enabled: !!id,
    placeholderData: (previousData) => previousData,
    select: (data) => data,
  });
};
