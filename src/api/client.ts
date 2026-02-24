import axios from 'axios';

const getBaseUrl = () => {
  // Web: localhost ok
  if (typeof window !== 'undefined') return 'http://localhost:3000';

  // Android emulator: localhost của máy dev là 10.0.2.2
  // iOS simulator: localhost ok
  // Nếu chạy trên thiết bị thật: cần thay bằng IP LAN của máy dev (vd: http://192.168.1.10:3000)
  return 'http://192.168.21.103:3000';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    // TODO: Gắn token từ storage (AsyncStorage, SecureStore, ...) nếu có
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // TODO: Xử lý chung các lỗi 401/403/500...
    return Promise.reject(error);
  },
);
