import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { tokenManager } from './auth/tokenManager';

// Base API client configuration
// Use runtime config (window.ENV) if available, otherwise fall back to env var or default
export const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    // Client-side: use injected window.ENV from layout.tsx
    return (window as any).ENV?.API_URL || 'http://localhost:8080';
  }
  // Server-side: use INTERNAL_API_URL for Docker internal network calls
  // Falls back to CLIENT_API_URL for backwards compatibility
  return process.env.INTERNAL_API_URL || process.env.CLIENT_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
};

export const API_BASE_URL = getApiUrl();

/**
 * Enhanced error type with full response details
 */
export interface ApiError extends Error {
  status?: number;
  statusText?: string;
  data?: any;
  url?: string;
  method?: string;
  isNetworkError: boolean;
}

/**
 * Create an enriched API error from an Axios error
 */
function createApiError(error: AxiosError): ApiError {
  const apiError: ApiError = new Error(error.message) as ApiError;
  apiError.name = 'ApiError';
  apiError.isNetworkError = !error.response;

  if (error.response) {
    // Server responded with an error status
    apiError.status = error.response.status;
    apiError.statusText = error.response.statusText;
    apiError.data = error.response.data;
    apiError.message =
      (error.response.data as any)?.message ||
      (error.response.data as any)?.error_description ||
      `Request failed with status ${error.response.status}`;
  }

  if (error.config) {
    apiError.url = error.config.url;
    apiError.method = error.config.method?.toUpperCase();
  }

  return apiError;
}

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
        // Log outgoing request for debugging
        console.debug(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        return config;
      },
      (error) => {
        console.error('[API] Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.debug(`[API] Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Log full error details for debugging
        console.error('[API] Request failed:', {
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          code: error.code,
        });

        // Only attempt refresh once per request to prevent infinite loops
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;

          // Token expired, try to refresh
          const refreshed = await tokenManager.refreshAccessToken();
          if (refreshed) {
            // Retry the original request with new token
            const token = await tokenManager.getValidAccessToken();
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client.request(originalRequest);
            }
          }
          // If refresh failed, redirect to login
          await tokenManager.handleAuthFailure();
        }

        // Create enriched error with full details
        const apiError = createApiError(error);
        return Promise.reject(apiError);
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

  // Public endpoint methods - send token if available but don't redirect on auth errors
  async publicGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    // Use getAccessToken (not getValidAccessToken) to avoid auth refresh/redirect
    let token: string | null = null;
    try {
      token = await tokenManager.getAccessToken();
    } catch {
      // Ignore - proceed without token
    }
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const axiosConfig = { ...config, headers: { ...config?.headers, ...headers } };

    try {
      const response = await axios.get<T>(API_BASE_URL + url, axiosConfig);
      return response.data;
    } catch (error: any) {
      // Re-throw error with better message extraction
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  async publicPost<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    // Use getAccessToken (not getValidAccessToken) to avoid auth refresh/redirect
    let token: string | null = null;
    try {
      token = await tokenManager.getAccessToken();
    } catch {
      // Ignore - proceed without token
    }
    const headers = token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
    const axiosConfig = { ...config, headers: { ...config?.headers, ...headers } };

    try {
      const response = await axios.post<T>(API_BASE_URL + url, data, axiosConfig);
      return response.data;
    } catch (error: any) {
      // Re-throw error with better message extraction
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
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

  // Download file method that also returns the filename from headers
  async downloadFileWithInfo(url: string, config?: AxiosRequestConfig): Promise<{ blob: Blob; filename: string | null }> {
    const response: AxiosResponse<Blob> = await this.client.get(url, {
      ...config,
      responseType: 'blob',
    });

    let filename = null;
    const disposition = response.headers['content-disposition'];

    if (disposition && (disposition.indexOf('attachment') !== -1 || disposition.indexOf('inline') !== -1)) {
      // Check for UTF-8 filename first (filename*=UTF-8''...)
      const utf8Regex = /filename\*=UTF-8''([^;\n]*)/i;
      const utf8Matches = utf8Regex.exec(disposition);
      if (utf8Matches != null && utf8Matches[1]) {
        filename = decodeURIComponent(utf8Matches[1]);
      } else {
        // Fallback to regular filename
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
    }

    return { blob: response.data, filename };
  }
}

export const apiClient = new ApiClient();