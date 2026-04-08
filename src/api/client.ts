import axios from "axios";

const AsyncStorage =
  require("@react-native-async-storage/async-storage").default;

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    const u = envUrl.replace(/\/$/, "");
    return u.endsWith("/api/v1") ? u : `${u}/api/v1`;
  }

  const host =
    typeof window !== "undefined"
      ? "http://localhost:3000"
      : "http://10.0.2.2:3000";

  return `${host}/api/v1`;
};

export interface ApiResponse<T> {
  data: T;
  isError: boolean;
  errorMessage: null | string;
  status: number;
}

export interface ApiResponseList<T> {
  items: T;
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      /* ignore */
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => Promise.reject(error),
);
