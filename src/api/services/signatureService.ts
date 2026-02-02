import { apiClient } from '../client';
import {
  SignatureResponse,
  CreateSignatureRequest,
  VerifySignatureRequest,
  PageResponse
} from '../../types/api';

const SIGNATURE_BASE_URL = '/api/v1/documents/signatures';

export const signatureService = {
  getAllSignatures: async (page: number = 0, size: number = 20): Promise<PageResponse<SignatureResponse>> => {
    return await apiClient.get<PageResponse<SignatureResponse>>(
      `${SIGNATURE_BASE_URL}?page=${page}&size=${size}`
    );
  },

  getSignatureById: async (id: number): Promise<SignatureResponse> => {
    return await apiClient.get<SignatureResponse>(`${SIGNATURE_BASE_URL}/${id}`);
  },

  getSignaturesByDocument: async (documentId: number): Promise<SignatureResponse[]> => {
    return await apiClient.get<SignatureResponse[]>(`${SIGNATURE_BASE_URL}/document/${documentId}`);
  },

  getValidSignaturesByDocument: async (documentId: number): Promise<SignatureResponse[]> => {
    return await apiClient.get<SignatureResponse[]>(`${SIGNATURE_BASE_URL}/document/${documentId}/valid`);
  },

  isDocumentSigned: async (documentId: number): Promise<boolean> => {
    return await apiClient.get<boolean>(`${SIGNATURE_BASE_URL}/document/${documentId}/signed`);
  },

  getSignaturesBySigner: async (signerId: string, page: number = 0, size: number = 20): Promise<PageResponse<SignatureResponse>> => {
    return await apiClient.get<PageResponse<SignatureResponse>>(
      `${SIGNATURE_BASE_URL}/signer/${signerId}?page=${page}&size=${size}`
    );
  },

  createSignature: async (request: CreateSignatureRequest): Promise<SignatureResponse> => {
    return await apiClient.post<SignatureResponse>(SIGNATURE_BASE_URL, request);
  },

  verifySignature: async (id: number, request: VerifySignatureRequest): Promise<SignatureResponse> => {
    return await apiClient.post<SignatureResponse>(`${SIGNATURE_BASE_URL}/${id}/verify`, request);
  },

  deleteSignature: async (id: number): Promise<void> => {
    await apiClient.delete(`${SIGNATURE_BASE_URL}/${id}`);
  },
};
