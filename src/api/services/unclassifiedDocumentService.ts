import { apiClient } from '../client';
import {
  UnclassifiedDocumentResponseDto,
  UnclassifiedDocumentDetailResponseDto,
  UnclassifiedDocumentUploadRequestDto,
  UnclassifiedDocumentSearchRequestDto,
  UnclassifiedDocumentStatisticsResponseDto,
  ClassifyUnclassifiedDocumentRequestDto,
  DocumentResponseDto,
  PageResponse,
  SortFields,
  ExtractorLanguage,
  FilingCategoryDocDto,
} from '../../types/api';

export class UnclassifiedDocumentService {
  private baseUrl = '/api/v1/documents/unclassified-documents';

  /**
   * Upload a new unclassified document
   */
  async uploadUnclassifiedDocument(
    file: File,
    folderId: number,
    categoryId: number,
    createdBy: string,
    title?: string,
    fileName?: string,
    metadataJson?: string
  ): Promise<UnclassifiedDocumentResponseDto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderId', folderId.toString());
    formData.append('categoryId', categoryId.toString());

    if (title) {
      formData.append('title', title);
    }

    if (fileName) {
      formData.append('fileName', fileName);
    }

    if (metadataJson) {
      formData.append('metadataJson', metadataJson);
    }

    return apiClient.uploadFile<UnclassifiedDocumentResponseDto>(`${this.baseUrl}/upload`, formData);
  }

  /**
   * Get all unclassified documents with pagination
   */
  async getUnclassifiedDocuments(
    page: number = 0,
    size: number = 20,
    sortBy: SortFields = SortFields.CREATED_AT,
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Promise<PageResponse<UnclassifiedDocumentResponseDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDirection,
    });

    return apiClient.get<PageResponse<UnclassifiedDocumentResponseDto>>(`${this.baseUrl}?${params}`);
  }

  /**
   * Search unclassified documents
   */
  async searchUnclassifiedDocuments(
    searchRequest: UnclassifiedDocumentSearchRequestDto
  ): Promise<PageResponse<UnclassifiedDocumentResponseDto>> {
    return apiClient.post<PageResponse<UnclassifiedDocumentResponseDto>>(
      `${this.baseUrl}/search`,
      searchRequest
    );
  }

  /**
   * Get unclassified document by ID
   */
  async getUnclassifiedDocumentById(id: number): Promise<UnclassifiedDocumentDetailResponseDto> {
    return apiClient.get<UnclassifiedDocumentDetailResponseDto>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get download URL for an unclassified document
   */
  async getDownloadUrl(id: number): Promise<{ url: string }> {
    const response = await apiClient.get<string>(`${this.baseUrl}/${id}/download`);
    return { url: typeof response === 'string' ? response : (response as any)?.url } as { url: string };
  }

  /**
   * Download unclassified document
   */
  async downloadUnclassifiedDocument(id: number): Promise<Blob> {
    const { url } = await this.getDownloadUrl(id);
    return apiClient.downloadFile(url);
  }

  /**
   * Classify an unclassified document (move to main document system)
   */
  async classifyDocument(
    id: number,
    payload: {
      folderId: number,
      title: string,
      description?: string,
      lang: ExtractorLanguage,
      fileName?: string,
      tagsIds?: number[],
      filingCategory?: FilingCategoryDocDto
    }
  ): Promise<DocumentResponseDto> {
    const form = new FormData();
    form.append('folderId', String(payload.folderId));
    form.append('title', payload.title);
    if (payload.description) {
      form.append('description', payload.description);
    }
    // Backend expects enum names (ENG/FRA/ARA)
    const langEnum = (payload.lang || '').toString().toUpperCase();
    form.append('lang', langEnum);
    if (payload.fileName) form.append('fileName', payload.fileName);
    if (payload.tagsIds && payload.tagsIds.length) {
      form.append('tags', JSON.stringify(payload.tagsIds));
    }

    // Always send filingCategory if it exists, even with empty metadata
    if (payload.filingCategory) {
      const filingCategoryJson = JSON.stringify(payload.filingCategory);
      console.log('=== Sending FilingCategory to Backend ===');
      console.log('FilingCategory JSON:', filingCategoryJson);
      console.log('FilingCategory Object:', payload.filingCategory);
      console.log('==========================================');
      form.append('filingCategory', filingCategoryJson);
    } else {
      console.warn('No filingCategory provided in payload!');
    }

    // Debug: Log all form data keys
    console.log('FormData keys:', Array.from(form.keys()));

    return apiClient.uploadFile<DocumentResponseDto>(`${this.baseUrl}/${id}/classify`, form);
  }

  /**
   * Delete an unclassified document
   */
  async deleteUnclassifiedDocument(id: number): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get statistics for unclassified documents
   */
  async getStatistics(): Promise<UnclassifiedDocumentStatisticsResponseDto> {
    return apiClient.get<UnclassifiedDocumentStatisticsResponseDto>(`${this.baseUrl}/statistics`);
  }

  /**
   * Bulk delete unclassified documents
   */
  async bulkDeleteUnclassifiedDocuments(documentIds: number[]): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/bulk`, {
      data: { documentIds },
    });
  }

  /**
   * Get all unclassified document IDs for the current user (for sequential validation)
   * Returns only IDs, sorted ascending
   */
  async getAllUnclassifiedDocumentIds(): Promise<number[]> {
    return apiClient.get<number[]>(`${this.baseUrl}/ids`);
  }
}

export const unclassifiedDocumentService = new UnclassifiedDocumentService();

