import { apiClient } from '../client';
import { getApiUrl } from '../client';
import {
  StampResponse,
  CreateStampRequest,
  UpdateStampRequest,
  PageResponse,
  ApplyStampRequest,
  StampApplicationResponse
} from '../../types/api';

const STAMP_BASE_URL = '/api/v1/documents/stamps';

/**
 * Resolves a stamp image URL to an absolute URL that can be used in <img src>.
 * Handles proxy paths (e.g. /api/v1/documents/stamps/image/xxx),
 * object names (e.g. uuid.png), and already-absolute URLs.
 */
export function resolveStampImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Already absolute (legacy presigned, full URL, data URI, or blob)
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // Proxy path — prepend API base URL
  if (url.startsWith('/api/')) {
    return `${getApiUrl()}${url}`;
  }

  // Raw object name — construct proxy URL
  return `${getApiUrl()}/api/v1/documents/stamps/image/${url}`;
}

export const stampService = {
  getAllStamps: async (
    page: number = 0,
    size: number = 20,
    search?: string,
    category?: string,
    stampType?: string,
    isActive?: boolean
  ): Promise<PageResponse<StampResponse>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (search) params.append('search', search);
    if (category && category !== 'All') params.append('category', category);
    if (stampType && stampType !== 'All') params.append('stampType', stampType);
    if (isActive !== undefined) params.append('isActive', isActive.toString());

    return await apiClient.get<PageResponse<StampResponse>>(
      `${STAMP_BASE_URL}?${params.toString()}`
    );
  },

  getStatistics: async (): Promise<any> => {
    return await apiClient.get(`${STAMP_BASE_URL}/statistics`);
  },

  getStampById: async (id: number, includeApplications: boolean = false): Promise<StampResponse> => {
    return await apiClient.get<StampResponse>(
      `${STAMP_BASE_URL}/${id}?includeApplications=${includeApplications}`
    );
  },

  getStampsByCreator: async (creatorId: string, page: number = 0, size: number = 20): Promise<PageResponse<StampResponse>> => {
    return await apiClient.get<PageResponse<StampResponse>>(
      `${STAMP_BASE_URL}/creator/${creatorId}?page=${page}&size=${size}`
    );
  },

  searchStamps: async (query: string, page: number = 0, size: number = 20): Promise<PageResponse<StampResponse>> => {
    return await apiClient.get<PageResponse<StampResponse>>(
      `${STAMP_BASE_URL}/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`
    );
  },

  getStampsByType: async (type: string): Promise<StampResponse[]> => {
    return await apiClient.get<StampResponse[]>(`${STAMP_BASE_URL}/type/${type}`);
  },

  getStampsByCategory: async (category: string): Promise<StampResponse[]> => {
    return await apiClient.get<StampResponse[]>(`${STAMP_BASE_URL}/category/${category}`);
  },

  getPopularStamps: async (limit: number = 10): Promise<StampResponse[]> => {
    return await apiClient.get<StampResponse[]>(`${STAMP_BASE_URL}/popular?limit=${limit}`);
  },

  createStamp: async (request: CreateStampRequest): Promise<StampResponse> => {
    return await apiClient.post<StampResponse>(STAMP_BASE_URL, request);
  },

  updateStamp: async (id: number, request: UpdateStampRequest): Promise<StampResponse> => {
    return await apiClient.put<StampResponse>(`${STAMP_BASE_URL}/${id}`, request);
  },

  toggleStampActive: async (id: number): Promise<StampResponse> => {
    return await apiClient.post<StampResponse>(`${STAMP_BASE_URL}/${id}/toggle-active`);
  },

  deleteStamp: async (id: number): Promise<void> => {
    await apiClient.delete(`${STAMP_BASE_URL}/${id}`);
  },

  uploadImage: async (file: File): Promise<{ imageUrl: string; displayUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.uploadFile<{ imageUrl: string; objectName?: string }>(`${STAMP_BASE_URL}/upload-image`, formData);
    // Return both: raw imageUrl (for saving to DB) and resolved displayUrl (for immediate rendering)
    const resolved = resolveStampImageUrl(response.imageUrl) || response.imageUrl;
    // Cache-bust so re-uploads with the same key show the new image
    const cacheBuster = `${resolved.includes('?') ? '&' : '?'}t=${Date.now()}`;
    return {
      imageUrl: response.imageUrl,
      displayUrl: `${resolved}${cacheBuster}`,
    };
  },

  // Stamp application methods
  applyStampToDocument: async (request: ApplyStampRequest): Promise<StampApplicationResponse> => {
    return await apiClient.post<StampApplicationResponse>(`${STAMP_BASE_URL}/apply`, request);
  },

  getStampApplicationsByDocument: async (documentId: number): Promise<StampApplicationResponse[]> => {
    return await apiClient.get<StampApplicationResponse[]>(`${STAMP_BASE_URL}/applications/document/${documentId}`);
  },

  getStampApplicationsByVersion: async (versionId: number): Promise<StampApplicationResponse[]> => {
    return await apiClient.get<StampApplicationResponse[]>(`${STAMP_BASE_URL}/applications/version/${versionId}`);
  },

  getStampApplications: async (stampId: number): Promise<StampApplicationResponse[]> => {
    return await apiClient.get<StampApplicationResponse[]>(`${STAMP_BASE_URL}/${stampId}/applications`);
  },

  removeStampApplication: async (applicationId: number): Promise<void> => {
    await apiClient.delete(`${STAMP_BASE_URL}/applications/${applicationId}`);
  },

  // QR Code generation
  generateQrCode: async (content: string, width: number = 200, height: number = 200): Promise<{ qrImage: string; content: string }> => {
    return await apiClient.post<{ qrImage: string; content: string }>(`${STAMP_BASE_URL}/generate-qr`, {
      content,
      width,
      height,
    });
  },

  // Dynamic stamp variable resolution
  resolveVariables: async (template: string): Promise<Record<string, string>> => {
    return await apiClient.post<Record<string, string>>(`${STAMP_BASE_URL}/resolve-variables`, {
      template,
    });
  },
};
