/** Lấy message lỗi từ response Axios / Error chung */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const e = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  const msg = e?.response?.data?.message ?? e?.message;
  return typeof msg === 'string' && msg.trim() ? msg : fallback;
}
