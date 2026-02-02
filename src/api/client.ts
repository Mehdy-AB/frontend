import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { tokenManager } from './auth/tokenManager';

// Base API client configuration
// Use runtime config (window.ENV) if available, otherwise fall back to env var or default
const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    // Client-side: use injected window.ENV from layout.tsx
    return (window as any).ENV?.API_URL || 'http://localhost:8080';
  }
  // Server-side: use INTERNAL_API_URL for Docker internal network calls
  // Falls back to CLIENT_API_URL for backwards compatibility
  return process.env.INTERNAL_API_URL || process.env.CLIENT_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
};

const API_BASE_URL = getApiUrl();

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Send cookies with requests (required for refresh token)
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await tokenManager.getValidAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Only attempt refresh once per request to prevent infinite loops
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Token expired, try to refresh
          const refreshed = await tokenManager.refreshAccessToken();
          if (refreshed) {
            // Retry the original request with new token
            const token = await tokenManager.getValidAccessToken();
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client.request(originalRequest);
            }
          }
          // If refresh failed, redirect to login
          await tokenManager.handleAuthFailure();
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }

  // File upload method
  async uploadFile<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // File upload with progress tracking
  async uploadFileWithProgress<T>(
    url: string,
    formData: FormData,
    onProgress?: (loaded: number, total: number, percentage: number) => void,
    config?: AxiosRequestConfig
  ): Promise<T> {
    // Calculate total size for progress tracking
    let totalSize = 0;
    formData.forEach((value: FormDataEntryValue) => {
      if (typeof value === 'object' && value !== null && 'size' in value) {
        totalSize += (value as File).size;
      }
    });

    const response: AxiosResponse<T> = await this.client.post(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          // Use the calculated total if progressEvent.total is not available
          const total = progressEvent.total || totalSize || 1;
          const loaded = progressEvent.loaded || 0;
          const percentage = Math.min(100, Math.round((loaded * 100) / total));
          console.log(`Upload progress: ${loaded}/${total} = ${percentage}%`);
          onProgress(loaded, total, percentage);
        }
      },
    });
    return response.data;
  }

  // Download file method
  async downloadFile(url: string, config?: AxiosRequestConfig): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.client.get(url, {
      ...config,
      responseType: 'blob',
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();