import { apiClient, ApiResponse, ApiResponseList } from '@/src/api/client';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  GetProductQuery,
  Product,
  ProductVariant,
} from './product.type';

const URL = '/product';

export const productUri = {
  list: `${URL}/get`,
  detail: `${URL}/:id`,
  seller: `${URL}/seller`,
};

export const productKey = {
  LIST_PRODUCT: 'LIST_PRODUCT',
  GET_DETAIL_PRODUCT: 'GET_DETAIL_PRODUCT',
  LIST_PRODUCT_SELLER: 'LIST_PRODUCT_SELLER',
};

export type SellerProductListBody = {
  message: string;
  items: Product[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
};

function appendVariantsToForm(form: FormData, variants: ProductVariant[]) {
  form.append(
    'variants',
    JSON.stringify(
      variants.map((v) => ({
        color: v.color.trim(),
        size: v.size.trim(),
        stock: Number(v.stock),
        sold: Number(v.sold),
        price: Number(v.price),
      })),
    ),
  );
}

export const productApis = {
  list: (params: GetProductQuery) => {
    return apiClient.get<ApiResponseList<Product[]>>(productUri.list, {
      params,
    });
  },

  getById: (id: string) => {
    return apiClient.get<ApiResponse<Product>>(
      productUri.detail.replace(':id', id),
    );
  },

  listForSeller: (params?: {
    sellerId?: string;
    pageNumber?: number;
    pageSize?: number;
  }) => apiClient.get<SellerProductListBody>(productUri.seller, { params }),

  deleteById: (id: string) =>
    apiClient.delete<{ message: string }>(productUri.detail.replace(':id', id)),

  createMultipart: (payload: {
    name: string;
    description: string;
    categoryId: string;
    sale?: number | null;
    variants: ProductVariant[];
    imageUris: string[];
  }) => {
    const form = new FormData();
    form.append('name', payload.name.trim());
    form.append('description', payload.description.trim());
    form.append('category', payload.categoryId);
    appendVariantsToForm(form, payload.variants);
    const s = payload.sale;
    if (s != null && s !== undefined && !Number.isNaN(Number(s))) {
      form.append('sale', String(Number(s)));
    }
    for (const uri of payload.imageUris) {
      const filename = uri.split('/').pop() || 'photo.jpg';
      const ext = filename.split('.').pop()?.toLowerCase();
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      form.append('images', { uri, name: filename, type: mime } as never);
    }
    return apiClient.post<{ message: string; product: Product }>(
      `${URL}/create`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  updateMultipart: (
    id: string,
    payload: {
      name: string;
      description: string;
      categoryId: string;
      sale?: number | null;
      variants: ProductVariant[];
      newImageUris: string[];
      removeImageUrls: string[];
    },
  ) => {
    const form = new FormData();
    form.append('name', payload.name.trim());
    form.append('description', payload.description.trim());
    form.append('category', payload.categoryId);
    appendVariantsToForm(form, payload.variants);
    if (payload.removeImageUrls.length > 0) {
      form.append('removeImages', JSON.stringify(payload.removeImageUrls));
    }
    const s = payload.sale;
    if (s != null && s !== undefined && !Number.isNaN(Number(s))) {
      form.append('sale', String(Number(s)));
    } else {
      form.append('sale', 'null');
    }
    for (const uri of payload.newImageUris) {
      const filename = uri.split('/').pop() || 'photo.jpg';
      const ext = filename.split('.').pop()?.toLowerCase();
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      form.append('images', { uri, name: filename, type: mime } as never);
    }
    return apiClient.put<{ message: string; product: Product }>(
      productUri.detail.replace(':id', id),
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
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

export const useProductsBySellerInfinite = (
  sellerId: string,
  pageSize = 12,
) => {
  return useInfiniteQuery({
    queryKey: [productKey.LIST_PRODUCT, 'bySeller', sellerId, pageSize],
    queryFn: ({ pageParam }) =>
      productApis.list({
        sellerId,
        pageNumber: pageParam,
        pageSize,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const body = lastPage.data;
      const cur = body.currentPage ?? 1;
      const total = body.totalPages ?? 1;
      return cur < total ? cur + 1 : undefined;
    },
    enabled: !!sellerId,
  });
};

export const useListSellerProducts = (opts?: {
  sellerId?: string;
  pageNumber?: number;
  pageSize?: number;
}, enabled: boolean = true) => {
  const pageNumber = opts?.pageNumber ?? 1;
  const pageSize = opts?.pageSize ?? 20;
  const sellerId = opts?.sellerId;

  return useQuery({
    queryKey: [productKey.LIST_PRODUCT_SELLER, sellerId ?? '', pageNumber, pageSize],
    queryFn: () =>
      productApis.listForSeller({ sellerId, pageNumber, pageSize }),
    select: (res) => res.data,
    enabled: enabled && !!sellerId,
  });
};

export const useCreateProduct = (props?: {
  onSuccess?: () => void;
  onError?: (e: unknown) => void;
}) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productApis.createMultipart,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [productKey.LIST_PRODUCT_SELLER] });
      void qc.invalidateQueries({ queryKey: [productKey.LIST_PRODUCT] });
      props?.onSuccess?.();
    },
    onError: props?.onError,
  });
};

export const useUpdateProduct = (props?: {
  onSuccess?: () => void;
  onError?: (e: unknown) => void;
}) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof productApis.updateMultipart>[1];
    }) => productApis.updateMultipart(id, payload),
    onSuccess: (_, v) => {
      void qc.invalidateQueries({ queryKey: [productKey.LIST_PRODUCT_SELLER] });
      void qc.invalidateQueries({
        queryKey: [productKey.GET_DETAIL_PRODUCT, v.id],
      });
      void qc.invalidateQueries({ queryKey: [productKey.LIST_PRODUCT] });
      props?.onSuccess?.();
    },
    onError: props?.onError,
  });
};

export const useDeleteProduct = (props?: {
  onSuccess?: () => void;
  onError?: (e: unknown) => void;
}) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productApis.deleteById(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [productKey.LIST_PRODUCT_SELLER] });
      void qc.invalidateQueries({ queryKey: [productKey.LIST_PRODUCT] });
      props?.onSuccess?.();
    },
    onError: props?.onError,
  });
};
