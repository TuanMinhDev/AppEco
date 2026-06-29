import { apiClient } from '@/src/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface GhtkConfigResponse {
  apiToken: string; // masked: ••••abc123
  shopCode: string;
  apiUrl: string;
  customerWebsite: string;
  isActive: boolean;
  source: 'env' | 'database';
  updatedAt?: string;
}

export interface UpdateGhtkConfigPayload {
  apiToken?: string;
  shopCode?: string;
  apiUrl?: string;
  customerWebsite?: string;
  isActive?: boolean;
}

const BASE = '/shipping/config';

export const shippingConfigKey = {
  CONFIG: 'GHTK_CONFIG',
};

export const shippingConfigApis = {
  getConfig: () => apiClient.get<{ config: GhtkConfigResponse }>(BASE),
  updateConfig: (data: UpdateGhtkConfigPayload) =>
    apiClient.put<{ message: string; config: GhtkConfigResponse }>(BASE, data),
};

export function useGhtkConfig(enabled = true) {
  return useQuery({
    queryKey: [shippingConfigKey.CONFIG],
    queryFn: () => shippingConfigApis.getConfig(),
    enabled,
    select: (res) => res.data.config,
  });
}

export function useUpdateGhtkConfig(props?: {
  onSuccess?: (msg: string) => void;
  onError?: (error: unknown) => void;
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateGhtkConfigPayload) =>
      shippingConfigApis.updateConfig(data),
    onSuccess: (response) => {
      void qc.invalidateQueries({ queryKey: [shippingConfigKey.CONFIG] });
      props?.onSuccess?.(response.data.message);
    },
    onError: props?.onError,
  });
}
