import axios from 'axios';

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) return envUrl;

  if (typeof window !== 'undefined') return 'http://localhost:3000';

  // Fallback for native when env is missing.
  return 'http://10.0.2.2:3000';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // Tắt credentials nếu backend chưa hỗ trợ
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Lấy token từ AsyncStorage
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
      }
    } catch (error) {
    }
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