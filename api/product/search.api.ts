import { apiClient } from '@/src/api/client';

const URL = '/product';

export interface RecordSearchLogPayload {
  keyword: string;
  resultProductIds?: string[];
}

export interface RecordSearchLogResponse {
  success: boolean;
  message: string;
}

export const searchLogUri = {
  record: `${URL}/search/log`,
};

export const searchLogApis = {
  /**
   * POST /product/search/log — ghi hành vi tìm kiếm của user.
   * PythonAI sẽ đọc collection search_logs để tính trọng số hành vi (weight = 2).
   */
  recordSearchLog: (
    payload: RecordSearchLogPayload,
    config?: { signal?: AbortSignal },
  ) =>
    apiClient
      .post<RecordSearchLogResponse>(searchLogUri.record, payload, config)
      .then((r) => r.data),
};
