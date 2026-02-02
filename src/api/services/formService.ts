import { apiClient } from '../client';
import {
  FormResponse,
  CreateFormRequest,
  UpdateFormRequest,
  FormSubmissionResponse,
  SubmitFormRequest,
  PageResponse
} from '../../types/api';

const FORM_BASE_URL = '/api/v1/forms';
const PUBLIC_FORM_BASE_URL = '/api/v1/public/forms';

export const formService = {
  // Form CRUD
  createForm: async (request: CreateFormRequest): Promise<FormResponse> => {
    return await apiClient.post<FormResponse>(FORM_BASE_URL, request);
  },

  getFormById: async (id: number): Promise<FormResponse> => {
    return await apiClient.get<FormResponse>(`${FORM_BASE_URL}/${id}`);
  },

  getFormBySlug: async (slug: string): Promise<FormResponse> => {
    return await apiClient.get<FormResponse>(`${FORM_BASE_URL}/slug/${slug}`);
  },

  getAllForms: async (page: number = 0, size: number = 20, sortBy: string = 'createdAt', sortDir: string = 'DESC'): Promise<PageResponse<FormResponse>> => {
    return await apiClient.get<PageResponse<FormResponse>>(
      `${FORM_BASE_URL}?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
    );
  },

  getMyForms: async (page: number = 0, size: number = 20): Promise<PageResponse<FormResponse>> => {
    return await apiClient.get<PageResponse<FormResponse>>(
      `${FORM_BASE_URL}/my-forms?page=${page}&size=${size}`
    );
  },

  getFormsByStatus: async (status: string, page: number = 0, size: number = 20): Promise<PageResponse<FormResponse>> => {
    return await apiClient.get<PageResponse<FormResponse>>(
      `${FORM_BASE_URL}/status/${status}?page=${page}&size=${size}`
    );
  },

  searchForms: async (query: string, page: number = 0, size: number = 20): Promise<PageResponse<FormResponse>> => {
    return await apiClient.get<PageResponse<FormResponse>>(
      `${FORM_BASE_URL}/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`
    );
  },

  updateForm: async (id: number, request: UpdateFormRequest): Promise<FormResponse> => {
    return await apiClient.put<FormResponse>(`${FORM_BASE_URL}/${id}`, request);
  },

  deleteForm: async (id: number): Promise<void> => {
    await apiClient.delete(`${FORM_BASE_URL}/${id}`);
  },

  // Form status management
  publishForm: async (id: number): Promise<FormResponse> => {
    return await apiClient.post<FormResponse>(`${FORM_BASE_URL}/${id}/publish`);
  },

  closeForm: async (id: number): Promise<FormResponse> => {
    return await apiClient.post<FormResponse>(`${FORM_BASE_URL}/${id}/close`);
  },

  archiveForm: async (id: number): Promise<FormResponse> => {
    return await apiClient.post<FormResponse>(`${FORM_BASE_URL}/${id}/archive`);
  },

  duplicateForm: async (id: number): Promise<FormResponse> => {
    return await apiClient.post<FormResponse>(`${FORM_BASE_URL}/${id}/duplicate`);
  },

  // Form submissions (admin)
  getFormSubmissions: async (formId: number, page: number = 0, size: number = 20, status?: string): Promise<PageResponse<FormSubmissionResponse>> => {
    const statusParam = status ? `&status=${status}` : '';
    return await apiClient.get<PageResponse<FormSubmissionResponse>>(
      `${FORM_BASE_URL}/${formId}/submissions?page=${page}&size=${size}${statusParam}`
    );
  },

  getSubmissionById: async (submissionId: number): Promise<FormSubmissionResponse> => {
    return await apiClient.get<FormSubmissionResponse>(`${FORM_BASE_URL}/submissions/${submissionId}`);
  },

  updateSubmissionStatus: async (submissionId: number, status: string): Promise<FormSubmissionResponse> => {
    return await apiClient.put<FormSubmissionResponse>(
      `${FORM_BASE_URL}/submissions/${submissionId}/status?status=${status}`
    );
  },

  markSubmissionAsRead: async (submissionId: number): Promise<FormSubmissionResponse> => {
    return await apiClient.put<FormSubmissionResponse>(`${FORM_BASE_URL}/submissions/${submissionId}/read`);
  },

  toggleSubmissionStar: async (submissionId: number): Promise<FormSubmissionResponse> => {
    return await apiClient.put<FormSubmissionResponse>(`${FORM_BASE_URL}/submissions/${submissionId}/star`);
  },

  addReviewNotes: async (submissionId: number, notes: string): Promise<FormSubmissionResponse> => {
    return await apiClient.put<FormSubmissionResponse>(`${FORM_BASE_URL}/submissions/${submissionId}/notes`, { notes });
  },

  deleteSubmission: async (submissionId: number): Promise<void> => {
    await apiClient.delete(`${FORM_BASE_URL}/submissions/${submissionId}`);
  },

  // Analytics
  getFormAnalytics: async (formId: number): Promise<Record<string, any>> => {
    return await apiClient.get<Record<string, any>>(`${FORM_BASE_URL}/${formId}/analytics`);
  },

  getSubmissionTrends: async (formId: number, days: number = 30): Promise<Array<Record<string, any>>> => {
    return await apiClient.get<Array<Record<string, any>>>(`${FORM_BASE_URL}/${formId}/trends?days=${days}`);
  },

  // Export
  exportSubmissions: async (formId: number, format: string = 'csv'): Promise<Blob> => {
    const response = await fetch(`/api/v1/forms/${formId}/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust based on your auth setup
      }
    });
    return await response.blob();
  },

  // Categories
  getAllCategories: async (): Promise<string[]> => {
    return await apiClient.get<string[]>(`${FORM_BASE_URL}/categories`);
  },

  // Public form access
  getPublicForm: async (slug: string): Promise<FormResponse> => {
    return await apiClient.get<FormResponse>(`${PUBLIC_FORM_BASE_URL}/${slug}`);
  },

  submitPublicForm: async (slug: string, request: SubmitFormRequest): Promise<FormSubmissionResponse> => {
    return await apiClient.post<FormSubmissionResponse>(`${PUBLIC_FORM_BASE_URL}/${slug}/submit`, request);
  },

  // File upload for forms
  uploadFormFile: async (file: File, fieldKey?: string): Promise<{ fileUrl: string; fileName: string; fileSize: string; contentType: string; minioKey: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (fieldKey) {
      formData.append('fieldKey', fieldKey);
    }
    return await apiClient.uploadFile<{ fileUrl: string; fileName: string; fileSize: string; contentType: string; minioKey: string }>('/api/v1/forms/upload', formData);
  },

  uploadMultipleFormFiles: async (files: File[], fieldKey?: string): Promise<Array<{ fileUrl?: string; fileName: string; error?: string }>> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    if (fieldKey) {
      formData.append('fieldKey', fieldKey);
    }
    return await apiClient.uploadFile<Array<{ fileUrl?: string; fileName: string; error?: string }>>('/api/v1/forms/upload/multiple', formData);
  }
};

