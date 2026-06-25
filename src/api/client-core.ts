import axios from "axios";

import { getBaseUrl } from "@/constants/api-base-url";

export { getBaseUrl } from "@/constants/api-base-url";

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
