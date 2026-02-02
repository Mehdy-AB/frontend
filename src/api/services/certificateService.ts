import { apiClient } from '../client';
import {
  CertificateResponse,
  CreateCertificateRequest,
  UpdateCertificateRequest,
  RevokeCertificateRequest,
  PageResponse
} from '../../types/api';

const CERTIFICATE_BASE_URL = '/api/v1/documents/certificates';

export const certificateService = {
  // Get all certificates with pagination
  getAllCertificates: async (page: number = 0, size: number = 20): Promise<PageResponse<CertificateResponse>> => {
    return await apiClient.get<PageResponse<CertificateResponse>>(
      `${CERTIFICATE_BASE_URL}?page=${page}&size=${size}`
    );
  },

  // Get certificate by ID
  getCertificateById: async (id: number): Promise<CertificateResponse> => {
    return await apiClient.get<CertificateResponse>(`${CERTIFICATE_BASE_URL}/${id}`);
  },

  // Get certificates by owner
  getCertificatesByOwner: async (ownerId: string, page: number = 0, size: number = 20): Promise<PageResponse<CertificateResponse>> => {
    return await apiClient.get<PageResponse<CertificateResponse>>(
      `${CERTIFICATE_BASE_URL}/owner/${ownerId}?page=${page}&size=${size}`
    );
  },

  // Search certificates
  searchCertificates: async (query: string, page: number = 0, size: number = 20): Promise<PageResponse<CertificateResponse>> => {
    return await apiClient.get<PageResponse<CertificateResponse>>(
      `${CERTIFICATE_BASE_URL}/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`
    );
  },

  // Get certificates by type
  getCertificatesByType: async (type: string): Promise<CertificateResponse[]> => {
    return await apiClient.get<CertificateResponse[]>(`${CERTIFICATE_BASE_URL}/type/${type}`);
  },

  // Get expiring certificates
  getExpiringCertificates: async (daysAhead: number = 30): Promise<CertificateResponse[]> => {
    return await apiClient.get<CertificateResponse[]>(
      `${CERTIFICATE_BASE_URL}/expiring?daysAhead=${daysAhead}`
    );
  },

  // Create certificate
  createCertificate: async (request: CreateCertificateRequest): Promise<CertificateResponse> => {
    return await apiClient.post<CertificateResponse>(CERTIFICATE_BASE_URL, request);
  },

  // Update certificate
  updateCertificate: async (id: number, request: UpdateCertificateRequest): Promise<CertificateResponse> => {
    return await apiClient.put<CertificateResponse>(`${CERTIFICATE_BASE_URL}/${id}`, request);
  },

  // Revoke certificate
  revokeCertificate: async (id: number, request: RevokeCertificateRequest): Promise<CertificateResponse> => {
    return await apiClient.post<CertificateResponse>(`${CERTIFICATE_BASE_URL}/${id}/revoke`, request);
  },

  // Toggle certificate active status
  toggleCertificateActive: async (id: number): Promise<CertificateResponse> => {
    return await apiClient.post<CertificateResponse>(`${CERTIFICATE_BASE_URL}/${id}/toggle-active`);
  },

  // Delete certificate
  deleteCertificate: async (id: number): Promise<void> => {
    await apiClient.delete(`${CERTIFICATE_BASE_URL}/${id}`);
  },
};

